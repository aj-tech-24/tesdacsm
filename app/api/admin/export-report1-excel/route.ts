import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import XlsxPopulate from "xlsx-populate";
import { getSession } from "@/lib/session";

type FeedbackRow = {
    no?: string | number;
    date?: string | Date;
    createdAt?: string | Date;
    formDate?: string;
    controlNumber?: string;
    clientName?: string;
    name?: string;
    clientType?: string;
    age?: string | number;
    gender?: string;
    sex?: string;
    email?: string;
    officeVisited?: string;
    office?: string;
    ccService?: string;
    citizensCharterService?: string;
    externalInternal?: string;
    serviceCategory?: string;
    typeOfTransaction?: string;
    transactionTypes?: string;
    actionProvided?: string;
    dateResolve?: string | Date;
    dateResolved?: string | Date;
    daysToResolution?: string | number;
    cc1?: string;
    cc2?: string;
    cc3?: string;
    sqd0?: number;
    sqd1?: number;
    sqd2?: number;
    sqd3?: number;
    sqd4?: number;
    sqd5?: number;
    sqd6?: number;
    sqd7?: number;
    sqd8?: number;
    citizenComment?: string;
    suggestions?: string;
    actionTaken?: string;
    complaintNature?: string;
    natureOfTransaction?: string;
};

const START_ROW = 12;
const END_ROW = 507;
const START_COLUMN = 1; // B
const MAX_ROWS = END_ROW - START_ROW + 1;

const toExcelText = (value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value);
};

const toExcelNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "";

    const parsed = typeof value === "number" ? value : Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : "";
};

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const toISODate = (value: unknown) => {
    const date = toDate(value);
    if (!date) return "";
    return date.toISOString().slice(0, 10);
};

const computeDaysToResolution = (startValue: unknown, endValue: unknown) => {
    const start = toDate(startValue);
    const end = toDate(endValue);
    if (!start || !end) return "";

    const diff = end.getTime() - start.getTime();
    if (diff < 0) return "";

    return String(Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const normalizeGender = (value: unknown) => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (!raw) return "";
    if (raw === "m" || raw === "male") return "Male";
    if (raw === "f" || raw === "female") return "Female";
    return "";
};

const normalizeServiceCategory = (value: unknown) => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (!raw) return "";
    if (raw === "internal" || raw === "internal services") return "Internal Services";
    if (raw === "external" || raw === "external services") return "External Services";
    return String(value);
};

const toColumnLetter = (columnNumber: number) => {
    let value = columnNumber;
    let result = "";

    while (value > 0) {
        const remainder = (value - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        value = Math.floor((value - 1) / 26);
    }

    return result;
};

const cellAddress = (rowNumber: number, colNumber: number) => `${toColumnLetter(colNumber)}${rowNumber}`;

const getTargetSheet = (workbook: any) => {
    const preferredName = "Feedback Forms";
    const fallbackName = "Feedback Reports";
    const secondFallbackName = "Feedback Report";

    try {
        return workbook.sheet(preferredName);
    } catch {
        // Continue to fallback names.
    }

    try {
        return workbook.sheet(fallbackName);
    } catch {
        // Continue to fallback name.
    }

    try {
        return workbook.sheet(secondFallbackName);
    } catch {
        return null;
    }
};

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const payload = await req.json();
        const incomingRows = Array.isArray(payload?.rows) ? payload.rows : [];
        const rows: FeedbackRow[] = incomingRows.slice(0, MAX_ROWS);

        const templatePath = path.join(process.cwd(), "public", "SQD", "templates", "feedback_form_template.xlsm");
        const templateBuffer = await readFile(templatePath);

        const workbook = await XlsxPopulate.fromDataAsync(templateBuffer);

        const sheet = getTargetSheet(workbook);
        if (!sheet) {
            return NextResponse.json({ error: "Sheet 'Feedback Forms' not found in template." }, { status: 500 });
        }

        rows.forEach((row, index) => {
            const excelRow = START_ROW + index;
            const rowNumber = index + 1;

            const dateValue = row.date ?? row.formDate ?? row.createdAt;
            const dateResolveValue = row.dateResolve ?? row.dateResolved;
            const daysToResolutionValue =
                row.daysToResolution ?? computeDaysToResolution(dateValue, dateResolveValue);

            const writeValue = (colOffset: number, value: unknown, asNumber = false) => {
                const address = cellAddress(excelRow, START_COLUMN + colOffset);
                sheet.cell(address).value(asNumber ? toExcelNumber(value) : toExcelText(value));
            };

            // B:AE, with AD intentionally blank.
            writeValue(0, row.no ?? rowNumber);
            writeValue(1, toISODate(dateValue));
            writeValue(2, row.controlNumber);
            writeValue(3, row.clientName ?? row.name);
            writeValue(4, row.clientType);
            writeValue(5, row.age);
            writeValue(6, normalizeGender(row.gender ?? row.sex));
            writeValue(7, row.email);
            writeValue(8, row.officeVisited ?? row.office);
            writeValue(9, row.ccService ?? row.citizensCharterService);
            writeValue(10, normalizeServiceCategory(row.externalInternal ?? row.serviceCategory));
            writeValue(11, row.typeOfTransaction ?? row.transactionTypes);
            writeValue(12, row.actionProvided);
            writeValue(13, toISODate(dateResolveValue));
            writeValue(14, daysToResolutionValue, true);
            writeValue(15, row.cc1, true);
            writeValue(16, row.cc2, true);
            writeValue(17, row.cc3, true);
            writeValue(18, row.sqd0, true);
            writeValue(19, row.sqd1, true);
            writeValue(20, row.sqd2, true);
            writeValue(21, row.sqd3, true);
            writeValue(22, row.sqd4, true);
            writeValue(23, row.sqd5, true);
            writeValue(24, row.sqd6, true);
            writeValue(25, row.sqd7, true);
            writeValue(26, row.sqd8, true);
            writeValue(27, row.citizenComment ?? row.suggestions);
            writeValue(28, row.actionTaken);
            writeValue(29, ""); // AD is empty by requirement.
            writeValue(30, row.complaintNature ?? row.natureOfTransaction);
        });

        const outputBuffer = await workbook.outputAsync({ type: "nodebuffer" }) as Buffer;
        const responseBody = new Uint8Array(outputBuffer);

        return new NextResponse(responseBody, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.ms-excel.sheet.macroEnabled.12",
                "Content-Disposition": "attachment; filename=Monitoring_Report.xlsm",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Failed to generate Excel report:", error);
        return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
    }
}
