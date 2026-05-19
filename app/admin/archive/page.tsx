import { getTursoClient } from "@/lib/turso";
import { getSession } from "@/lib/session";
import ArchiveClient from "./ArchiveClient";

export const dynamic = "force-dynamic";

const normalizeFormDate = (value: unknown) => {
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export default async function ArchivePage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
    const session = await getSession();
    if (!session) {
        return <div className="p-8 text-center text-red-500">Not authorized</div>;
    }

    const sp = props.searchParams ? await Promise.resolve(props.searchParams) : {};
    const yearStr = sp?.year as string | undefined;
    const currentYear = new Date().getFullYear();

    // Fetch all feedback for user's office (if office_admin) or all (if super_admin)
    let allFeedback: any[] = [];
    try {
        const client = getTursoClient();
        const result = await client.execute(`
            SELECT id, formDate, office, isArchived,
                   cc1, cc2, cc3, suggestions,
                   sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8
            FROM Feedback
            ORDER BY formDate DESC
        `);
        allFeedback = (result.rows || []) as any[];
    } catch (err) {
        // If the DB client is not configured or query fails, log and continue with empty data
        // so the page renders a friendly empty state instead of crashing the whole route.
        // This avoids a blank screen when environment variables are missing in dev.
        // eslint-disable-next-line no-console
        console.error("Failed to load feedbacks for archive:", err);
        allFeedback = [];
    }

    // Role-based filtering: office admins only see their own office data
    if (session.role === "office_admin") {
        allFeedback = allFeedback.filter((f: any) => {
            const officeStr = String(f.office || "").trim().toUpperCase();
            const sessionOfficeStr = (session.office || "").trim().toUpperCase();
            return officeStr.includes(sessionOfficeStr);
        });
    }

    // Group feedbacks by month
    const feedbacksByMonth: Record<string, typeof allFeedback> = {};
    
    allFeedback.forEach((feedback: any) => {
        const normalized = normalizeFormDate(feedback.formDate);
        if (!normalized) return;
        
        const [year] = normalized.split("-").map((p) => parseInt(p, 10));
        const monthKey = normalized.substring(0, 7); // YYYY-MM
        
        // Filter by year if specified
        if (yearStr && yearStr !== "all" && year !== parseInt(yearStr, 10)) {
            return;
        }

        if (!feedbacksByMonth[monthKey]) {
            feedbacksByMonth[monthKey] = [];
        }
        feedbacksByMonth[monthKey].push(feedback);
    });

    // Calculate monthly summaries
    const monthlySummary = Object.entries(feedbacksByMonth).map(([monthKey, feedbacks]) => {
        const [year, month] = monthKey.split("-").map((p) => parseInt(p, 10));
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const answered = feedbacks.filter((f: any) => {
            const hasSQD = [f.sqd0, f.sqd1, f.sqd2, f.sqd3, f.sqd4, f.sqd5, f.sqd6, f.sqd7, f.sqd8].some(v => v !== null);
            const hasCC = [f.cc1, f.cc2, f.cc3].some((v) => v !== null);
            const hasSuggestions = f.suggestions !== null;
            return hasSQD || hasCC || hasSuggestions;
        });

        const archived = feedbacks.filter((f: any) => Boolean(f.isArchived));

        return {
            monthKey,
            year,
            month,
            monthName: monthNames[month - 1],
            total: feedbacks.length,
            answered: answered.length,
            pending: feedbacks.length - answered.length,
            archived: archived.length,
        };
    }).sort((a, b) => {
        const dateA = new Date(`${a.year}-${String(a.month).padStart(2, "0")}`);
        const dateB = new Date(`${b.year}-${String(b.month).padStart(2, "0")}`);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <ArchiveClient
            userRole={session.role}
            userOffice={session.office || ""}
            monthlySummary={monthlySummary}
            totalFeedback={allFeedback.length}
        />
    );
}
