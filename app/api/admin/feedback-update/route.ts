import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const {
            id,
            controlNumber,
            name,
            clientType,
            age,
            sex,
            formDate,
            email,
            employeeName,
            regionOfResidence,
            province,
            municipality,
            office,
            citizensCharterService,
            serviceCategory,
            transactionTypes,
            cc1,
            cc2,
            cc3,
            sqd0,
            sqd1,
            sqd2,
            sqd3,
            sqd4,
            sqd5,
            sqd6,
            sqd7,
            sqd8,
            suggestions,
            actionProvided,
            dateResolved,
            natureOfTransaction,
        } = await req.json();

        const numericId = Number(id);
        if (!numericId || Number.isNaN(numericId)) {
            return NextResponse.json({ error: "Valid ID is required" }, { status: 400 });
        }

        const normalizedControlNumber = String(controlNumber ?? "").trim();
        if (!normalizedControlNumber) {
            return NextResponse.json({ error: "Control Number is required" }, { status: 400 });
        }

        // Use a raw update to keep compatibility with environments where Prisma client regeneration is constrained.
        await prisma.$executeRawUnsafe(
            `UPDATE "Feedback"
             SET "controlNumber" = ?,
                 "name" = ?,
                 "clientType" = ?,
                 "age" = ?,
                 "sex" = ?,
                 "formDate" = ?,
                 "email" = ?,
                 "employeeName" = ?,
                 "regionOfResidence" = ?,
                 "province" = ?,
                 "municipality" = ?,
                 "office" = ?,
                 "citizensCharterService" = ?,
                 "serviceCategory" = ?,
                 "transactionTypes" = ?,
                 "cc1" = ?,
                 "cc2" = ?,
                 "cc3" = ?,
                 "sqd0" = ?,
                 "sqd1" = ?,
                 "sqd2" = ?,
                 "sqd3" = ?,
                 "sqd4" = ?,
                 "sqd5" = ?,
                 "sqd6" = ?,
                 "sqd7" = ?,
                 "sqd8" = ?,
                 "suggestions" = ?,
                 "actionProvided" = ?,
                 "dateResolved" = ?,
                 "natureOfTransaction" = ?
             WHERE "id" = ?`,
            normalizedControlNumber,
            String(name ?? "").trim() || null,
            String(clientType ?? "").trim() || null,
            String(age ?? "").trim() || null,
            String(sex ?? "").trim() || null,
            String(formDate ?? "").trim() || null,
            String(email ?? "").trim() || null,
            String(employeeName ?? "").trim() || null,
            String(regionOfResidence ?? "").trim() || null,
            String(province ?? "").trim() || null,
            String(municipality ?? "").trim() || null,
            String(office ?? "").trim() || null,
            String(citizensCharterService ?? "").trim() || null,
            String(serviceCategory ?? "").trim() || null,
            String(transactionTypes ?? "").trim() || null,
            String(cc1 ?? "").trim() || null,
            String(cc2 ?? "").trim() || null,
            String(cc3 ?? "").trim() || null,
            String(sqd0 ?? "").trim() || null,
            String(sqd1 ?? "").trim() || null,
            String(sqd2 ?? "").trim() || null,
            String(sqd3 ?? "").trim() || null,
            String(sqd4 ?? "").trim() || null,
            String(sqd5 ?? "").trim() || null,
            String(sqd6 ?? "").trim() || null,
            String(sqd7 ?? "").trim() || null,
            String(sqd8 ?? "").trim() || null,
            String(suggestions ?? "").trim() || null,
            String(actionProvided ?? "").trim() || null,
            String(dateResolved ?? "").trim() || null,
            String(natureOfTransaction ?? "").trim() || null,
            numericId,
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update feedback:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
