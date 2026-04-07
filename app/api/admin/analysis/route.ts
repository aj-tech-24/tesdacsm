import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content && content !== "") {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Upsert the single analysis record (we use id: 1 for simplicity to keep one global analysis)
        await prisma.analysis.upsert({
            where: { id: 1 },
            update: { content },
            create: { id: 1, content },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save analysis:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
