import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authorized" },
                { status: 401 }
            );
        }

        // Only super_admin can bulk archive
        if (session.role !== "super_admin") {
            return NextResponse.json(
                { success: false, error: "Only super_admin can perform bulk archive" },
                { status: 403 }
            );
        }

        const { monthKey } = await req.json();

        if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
            return NextResponse.json(
                { success: false, error: "Invalid month format (expected YYYY-MM)" },
                { status: 400 }
            );
        }

        // Get all feedbacks for this month via Turso SQL
        const client = getTursoClient();
        const result = await client.execute(`
            SELECT id, formDate FROM Feedback
        `);
        const allFeedback = (result.rows || []) as any[];

        const feedbacksToArchive = allFeedback.filter((f) => {
            const formDate = String(f.formDate || "");
            return formDate.startsWith(monthKey);
        });

        if (feedbacksToArchive.length === 0) {
            return NextResponse.json(
                { success: true, archived: 0, message: "No feedbacks found for this month" },
            );
        }

        // Archive the feedbacks by setting isArchived = true
        const ids = feedbacksToArchive.map((f: any) => f.id);
        if (ids.length > 0) {
            const placeholders = ids.map(() => "?").join(",");
            await client.execute({
                sql: `UPDATE Feedback SET isArchived = 1 WHERE id IN (${placeholders})`,
                args: ids,
            });
        }

        // Invalidate in-memory monthly summary cache so UI shows fresh data
        try {
            const globalCache = (globalThis as any).__archiveMonthlyCache;
            if (globalCache && typeof globalCache.keys === 'function') {
                for (const key of Array.from(globalCache.keys())) {
                    if (String(key).startsWith('monthly:')) {
                        globalCache.delete(key);
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to clear archive monthly cache:', err);
        }

        console.log(`Archived ${feedbacksToArchive.length} feedbacks from ${monthKey}`);

        return NextResponse.json({
            success: true,
            archived: feedbacksToArchive.length,
            message: `${monthKey.replace("-", " ")} feedbacks archived successfully`,
        });
    } catch (error: any) {
        console.error("Bulk Archive Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
