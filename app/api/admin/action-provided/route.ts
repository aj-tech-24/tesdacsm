import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { id, actionProvided, dateResolved } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.feedback.update({
            where: { id: parseInt(id) },
            data: { actionProvided, dateResolved } as any,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update action:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
