import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createRateLimitResponse, enforceRateLimit } from "@/lib/request-protection";

export async function GET(req: NextRequest) {
    try {
        const burstLimit = await enforceRateLimit(req, {
            scope: "report-metadata:burst",
            limit: 30,
            windowMs: 60 * 1000,
        })

        if (!burstLimit.allowed) {
            return createRateLimitResponse(burstLimit)
        }

        const sustainedLimit = await enforceRateLimit(req, {
            scope: "report-metadata:sustained",
            limit: 240,
            windowMs: 15 * 60 * 1000,
        })

        if (!sustainedLimit.allowed) {
            return createRateLimitResponse(sustainedLimit)
        }

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
        const burstLimit = await enforceRateLimit(req, {
            scope: "report-metadata:put:burst",
            limit: 20,
            windowMs: 60 * 1000,
        })

        if (!burstLimit.allowed) {
            return createRateLimitResponse(burstLimit)
        }

        const sustainedLimit = await enforceRateLimit(req, {
            scope: "report-metadata:put:sustained",
            limit: 120,
            windowMs: 15 * 60 * 1000,
        })

        if (!sustainedLimit.allowed) {
            return createRateLimitResponse(sustainedLimit)
        }

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
