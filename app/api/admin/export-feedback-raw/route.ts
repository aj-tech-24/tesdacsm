import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
    try {
        const feedbackList = await prisma.feedback.findMany({
            orderBy: { createdAt: "desc" },
        });

        const rows = feedbackList.map((f) => ({
            id: f.id,
            createdAt: f.createdAt.toISOString(),
            controlNumber: f.controlNumber,
            name: f.name || "",
            clientType: f.clientType || "",
            age: f.age || "",
            sex: f.sex || "",
            formDate: f.formDate || "",
            email: f.email || "",
            employeeName: f.employeeName || "",
            regionOfResidence: f.regionOfResidence || "",
            province: f.province || "",
            municipality: f.municipality || "",
            office: f.office || "",
            citizensCharterService: f.citizensCharterService || "",
            serviceCategory: f.serviceCategory || "",
            transactionTypes: f.transactionTypes || "",
            cc1: f.cc1 || "",
            cc2: f.cc2 || "",
            cc3: f.cc3 || "",
            sqd0: f.sqd0 || "",
            sqd1: f.sqd1 || "",
            sqd2: f.sqd2 || "",
            sqd3: f.sqd3 || "",
            sqd4: f.sqd4 || "",
            sqd5: f.sqd5 || "",
            sqd6: f.sqd6 || "",
            sqd7: f.sqd7 || "",
            sqd8: f.sqd8 || "",
            suggestions: f.suggestions || "",
            actionProvided: f.actionProvided || "",
            dateResolved: (f as any)["dateResolved"] || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "FeedbackRaw");

        const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        const datePart = new Date().toISOString().slice(0, 10);

        return new Response(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename=feedback-raw-${datePart}.xlsx`,
            },
        });
    } catch (error: any) {
        console.error("Raw Excel export error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
