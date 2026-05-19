import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";
import { getSession } from "@/lib/session";

type Session = Awaited<ReturnType<typeof getSession>>;
type MonthlySummaryRow = {
    id?: number | string;
    formDate?: string | Date;
    office?: string;
    isArchived?: number | boolean | null;
    cc1?: string | null;
    cc2?: string | null;
    cc3?: string | null;
    suggestions?: string | null;
    sqd0?: string | null;
    sqd1?: string | null;
    sqd2?: string | null;
    sqd3?: string | null;
    sqd4?: string | null;
    sqd5?: string | null;
    sqd6?: string | null;
    sqd7?: string | null;
    sqd8?: string | null;
};

type MonthlySummaryDependencies = {
    getSessionFn?: typeof getSession;
    getClientFn?: typeof getTursoClient;
    cache?: Map<string, { ts: number; rows: MonthlySummaryRow[] }>;
};

export async function handleMonthlySummary(req: Request, deps: MonthlySummaryDependencies = {}) {
    const getSessionFn = deps.getSessionFn ?? getSession;
    const getClientFn = deps.getClientFn ?? getTursoClient;
    const cache = deps.cache ?? ((globalThis as any).__archiveMonthlyCache || ((globalThis as any).__archiveMonthlyCache = new Map()));

    try {
        const session = await getSessionFn();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const yearFilter = searchParams.get("year");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
        const q = (searchParams.get("q") || "").trim();

        // Simple in-memory cache per role/office/year to reduce repeated DB queries
        const cacheKey = `monthly:${session.role}:${session.office}:${yearFilter || 'all'}`;
        const cached = cache.get(cacheKey);
        let allFeedback: MonthlySummaryRow[] = [];

        if (cached && (Date.now() - cached.ts) < 30000) {
            allFeedback = cached.rows;
        } else {
            // Fetch all feedback via Turso SQL
            const client = getClientFn();
            const result = await client.execute(`
                SELECT id, formDate, office, isArchived,
                       cc1, cc2, cc3, suggestions,
                       sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8
                FROM Feedback
                ORDER BY formDate DESC
            `);
            allFeedback = (result.rows || []) as MonthlySummaryRow[];
            cache.set(cacheKey, { ts: Date.now(), rows: allFeedback });
        }
        let allFeedbackFiltered = allFeedback;

        // Role-based filtering
        if (session.role === "office_admin") {
            allFeedbackFiltered = allFeedback.filter((f: MonthlySummaryRow) => {
                const officeStr = String(f.office || "").trim().toUpperCase();
                const sessionOfficeStr = (session.office || "").trim().toUpperCase();
                return officeStr.includes(sessionOfficeStr);
            });
        }

        // Helper function to check if feedback is answered
        const isAnswered = (feedback: MonthlySummaryRow) => {
            const hasSQD = Object.keys(feedback).some((k) =>
                k.startsWith("sqd") && (feedback as any)[k] !== null
            );
            const hasCC = [feedback.cc1, feedback.cc2, feedback.cc3].some((v) => v !== null);
            const hasSuggestions = feedback.suggestions !== null;
            return hasSQD || hasCC || hasSuggestions;
        };

        // Group by month and calculate stats
        const monthlyMap: Record<string, {
            feedbacks: MonthlySummaryRow[];
            answered: MonthlySummaryRow[];
            archived: MonthlySummaryRow[];
            offices: Record<string, { total: number; answered: number; archived: number }>;
        }> = {};

        allFeedbackFiltered.forEach((feedback: MonthlySummaryRow) => {
            const formDate = feedback.formDate instanceof Date
                ? feedback.formDate.toISOString().split("T")[0]
                : String(feedback.formDate || "");

            if (!formDate) return;

            const [year] = formDate.split("-").map((p) => parseInt(p, 10));

            // Filter by year if specified
            if (yearFilter && yearFilter !== "all" && year !== parseInt(yearFilter, 10)) {
                return;
            }

            const monthKey = formDate.substring(0, 7); // YYYY-MM

            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                    feedbacks: [],
                    answered: [],
                    archived: [],
                    offices: {},
                };
            }

            monthlyMap[monthKey].feedbacks.push(feedback);
            if (isAnswered(feedback)) {
                monthlyMap[monthKey].answered.push(feedback);
            }
            if (feedback.isArchived) {
                monthlyMap[monthKey].archived.push(feedback);
            }

            // Track by office
            const office = feedback.office || "Unknown";
            if (!monthlyMap[monthKey].offices[office]) {
                monthlyMap[monthKey].offices[office] = { total: 0, answered: 0, archived: 0 };
            }
            monthlyMap[monthKey].offices[office].total += 1;
            if (isAnswered(feedback)) {
                monthlyMap[monthKey].offices[office].answered += 1;
            }
            if (feedback.isArchived) {
                monthlyMap[monthKey].offices[office].archived += 1;
            }
        });

        // Format response
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        let data = Object.entries(monthlyMap)
            .map(([monthKey, stats]) => {
                const [year, month] = monthKey.split("-").map((p) => parseInt(p, 10));
                return {
                    month: monthKey,
                    year,
                    monthName: monthNames[month - 1],
                    total: stats.feedbacks.length,
                    answered: stats.answered.length,
                    pending: stats.feedbacks.length - stats.answered.length,
                    archived: stats.archived.length,
                    byOffice: stats.offices,
                };
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.year}-${String(a.month).padStart(2, "0")}-01`);
                const dateB = new Date(`${b.year}-${String(b.month).padStart(2, "0")}-01`);
                return dateB.getTime() - dateA.getTime();
            });

        // Apply server-side search/filter if `q` is provided. We match against month name, month key, and office names.
        if (q) {
            const qLower = q.toLowerCase();
            data = data.filter((d) => {
                if (String(d.month).toLowerCase().includes(qLower)) return true;
                if (String(d.monthName).toLowerCase().includes(qLower)) return true;
                const offices = Object.keys(d.byOffice || {});
                if (offices.some((o) => String(o).toLowerCase().includes(qLower))) return true;
                return false;
            });
        }

        const total = data.length;
        // Apply pagination
        const start = Math.max(0, (page - 1) * pageSize);
        const paged = data.slice(start, start + pageSize);

        return NextResponse.json({
            success: true,
            data: paged,
            total,
            page,
            pageSize,
        });
    } catch (error: any) {
        console.error("Archive Monthly Summary Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    return handleMonthlySummary(req);
}
