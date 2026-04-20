import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { id, actionProvided, dateResolved, natureOfTransaction } = await req.json();
        const numericId = parseInt(id);

        if (!id || Number.isNaN(numericId)) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Use a raw update to avoid runtime schema mismatch when Prisma client generation is blocked.
        await prisma.$executeRawUnsafe(
            `UPDATE "Feedback" SET "actionProvided" = ?, "dateResolved" = ?, "natureOfTransaction" = ? WHERE "id" = ?`,
            actionProvided ?? null,
            dateResolved ?? null,
            natureOfTransaction ?? null,
            numericId,
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update action:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
