import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let metadata = await prisma.reportMetadata.findFirst();
        if (!metadata) {
            metadata = await prisma.reportMetadata.create({
                data: {
                    reportPeriod: "",
                    regionExecutive: "Region XI - TESDA Regional Office",
                    provinceDistrict: "Province of Davao del Sur",
                    operatingUnit: "Office of the Provincial Director",
                    headOfUnit: "",
                    designation: "",
                    cusatFocal: "",
                },
            });
        }

        return NextResponse.json(metadata);
    } catch (error) {
        console.error("Error fetching report metadata:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        const canManageMetadata =
            !!session &&
            (
                session.role === "super_admin" ||
                (session.role === "office_admin" && String(session.office || "").toUpperCase() === "PO")
            );

        if (!canManageMetadata) {
            return NextResponse.json(
                { error: "Forbidden: Only super admin or PO admin can update metadata" },
                { status: 403 },
            );
        }

        const body = await req.json();
        const { id, reportPeriod, regionExecutive, provinceDistrict, operatingUnit, headOfUnit, designation, cusatFocal } = body;

        if (!id) {
            return NextResponse.json({ error: "Metadata ID required" }, { status: 400 });
        }

        const updated = await prisma.reportMetadata.update({
            where: { id },
            data: {
                reportPeriod,
                regionExecutive,
                provinceDistrict,
                operatingUnit,
                headOfUnit,
                designation,
                cusatFocal,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating report metadata:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
