import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";
import { getSession } from "@/lib/session";

export async function GET(
    req: Request,
    { params }: { params: { month: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authorized" },
                { status: 401 }
            );
        }

        const monthKey = params.month;

        if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
            return NextResponse.json(
                { success: false, error: "Invalid month format (expected YYYY-MM)" },
                { status: 400 }
            );
        }

        // Fetch all feedbacks via Turso SQL
        const client = getTursoClient();
        const result = await client.execute(`
            SELECT id, controlNumber, name, office, citizensCharterService, formDate, isArchived,
                   cc1, cc2, cc3, suggestions,
                   sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8
            FROM Feedback
            ORDER BY createdAt DESC
        `);
        let feedbacks = (result.rows || []) as any[];

        // Role-based filtering
        if (session.role === "office_admin") {
            feedbacks = feedbacks.filter((f: any) => {
                const officeStr = String(f.office || "").trim().toUpperCase();
                const sessionOfficeStr = (session.office || "").trim().toUpperCase();
                return officeStr.includes(sessionOfficeStr);
            });
        }

        // Filter by month
        const filteredFeedbacks = feedbacks.filter((f: any) => {
            const formDate = String(f.formDate || "");
            return formDate.startsWith(monthKey);
        });

        // Helper to check if answered
        const isAnswered = (feedback: any) => {
            const hasSQD = [feedback.sqd0, feedback.sqd1, feedback.sqd2, feedback.sqd3, feedback.sqd4, feedback.sqd5, feedback.sqd6, feedback.sqd7, feedback.sqd8]
                .some(v => v !== null);
            const hasCC = [feedback.cc1, feedback.cc2, feedback.cc3].some((v) => v !== null);
            const hasSuggestions = feedback.suggestions !== null;
            return hasSQD || hasCC || hasSuggestions;
        };

        // Format response
        const data = filteredFeedbacks.map((f: any) => ({
            id: f.id,
            controlNumber: f.controlNumber,
            name: f.name,
            office: f.office,
            service: f.citizensCharterService,
            formDate: String(f.formDate || ""),
            answered: isAnswered(f),
            archived: Boolean(f.isArchived),
        }));

        return NextResponse.json({
            success: true,
            month: monthKey,
            total: data.length,
            answered: data.filter((d) => d.answered).length,
            feedbacks: data,
        });
    } catch (error: any) {
        console.error("Month Details Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
