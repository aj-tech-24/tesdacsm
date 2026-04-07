import { prisma } from "@/lib/prisma";
import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";

const toSafeInt = (value: string | null): number | null => {
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const TEMPLATE_FILE_PATH =
    process.env.EXPORT_TEMPLATE_PATH || "CUSAT-form-for-Provincial-District-Office-Services.xlsm";
const TEMPLATE_SHEET_NAME = process.env.EXPORT_TEMPLATE_SHEET || "Monitoring of Feedback Formsq";
const TEMPLATE_START_ROW = Number(process.env.EXPORT_TEMPLATE_START_ROW || "10");
const DEFAULT_NATURE_OF_TRANSACTION = process.env.EXPORT_NATURE_OF_TRANSACTION || "Inquiry";

// Column layout is based on the provided CUSAT monitoring sheet.
const REPORT_COLUMNS = [
    "A", // No.
    "B", // Date
    "C", // Control Number
    "D", // Client Name and Contact Details
    "E", // Client Type
    "F", // Age
    "G", // Gender
    "H", // Email Address
    "I", // Region / Office Visited
    "J", // Citizens Charter Service
    "K", // External / Internal
    "L", // Type of Transaction
    "M", // Action Provided
    "N", // Date Resolve
    "O", // Number of Days to Resolution
    "P", // CC1 Score
    "Q", // CC2 Score
    "R", // CC3 Score
    "S", // SQD0
    "T", // SQD1
    "U", // SQD2
    "V", // SQD3
    "W", // SQD4
    "X", // SQD5
    "Y", // SQD6
    "Z", // SQD7
    "AA", // SQD8
    "AB", // Citizens Comment
    "AE", // Type of Transaction (Inquiry/ complaint)
];

const formatAsDateTime = (value: Date): string => {
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(value);
};

const toDateOrNull = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateDiffInDays = (start: Date, end: Date): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.max(0, Math.floor((utcEnd - utcStart) / msPerDay));
};

const setCellValuePreservingStyle = (
    worksheet: XLSX.WorkSheet,
    address: string,
    value: string | number | boolean | Date | null | undefined
) => {
    if (value === null || value === undefined || value === "") {
        if (worksheet[address]) {
            worksheet[address].v = "";
            worksheet[address].t = "s";
            delete worksheet[address].w;
        }
        return;
    }

    if (!worksheet[address]) {
        worksheet[address] = { t: "s", v: "" };
    }

    const cell = worksheet[address];

    if (value instanceof Date) {
        cell.t = "d";
        cell.v = value;
    } else if (typeof value === "number") {
        cell.t = "n";
        cell.v = value;
    } else if (typeof value === "boolean") {
        cell.t = "b";
        cell.v = value;
    } else {
        cell.t = "s";
        cell.v = String(value);
    }

    delete cell.w;
};

const writeRowsToTemplateSheet = (worksheet: XLSX.WorkSheet, rows: Array<Array<string | number>>) => {
    const startRowIndex = Math.max(1, TEMPLATE_START_ROW);

    rows.forEach((rowValues, rowOffset) => {
        const rowNumber = startRowIndex + rowOffset;

        rowValues.forEach((cellValue, colIndex) => {
            const col = REPORT_COLUMNS[colIndex];
            if (!col) return;

            const address = `${col}${rowNumber}`;
            setCellValuePreservingStyle(worksheet, address, cellValue);
        });
    });

    const totalRows = Math.max(startRowIndex + rows.length - 1, startRowIndex);
    const endColumn = REPORT_COLUMNS[REPORT_COLUMNS.length - 1] || "A";

    const existingRef = worksheet["!ref"];
    if (existingRef) {
        const existingRange = XLSX.utils.decode_range(existingRef);
        const newRange = XLSX.utils.decode_range(`A1:${endColumn}${totalRows}`);

        const mergedRange = {
            s: {
                c: Math.min(existingRange.s.c, newRange.s.c),
                r: Math.min(existingRange.s.r, newRange.s.r),
            },
            e: {
                c: Math.max(existingRange.e.c, newRange.e.c),
                r: Math.max(existingRange.e.r, newRange.e.r),
            },
        };

        worksheet["!ref"] = XLSX.utils.encode_range(mergedRange);
        return;
    }

    worksheet["!ref"] = `A1:${endColumn}${totalRows}`;
};

const buildFallbackWorkbook = (rows: Array<Record<string, string | number>>) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const monthParam = searchParams.get("month");
        const yearParam = searchParams.get("year");

        const month = toSafeInt(monthParam);
        const year = toSafeInt(yearParam);

        let dateFilter = {};
        if (year) {
            if (month && month >= 1 && month <= 12) {
                dateFilter = {
                    createdAt: {
                        gte: new Date(year, month - 1, 1),
                        lt: new Date(year, month, 1),
                    },
                };
            } else {
                dateFilter = {
                    createdAt: {
                        gte: new Date(year, 0, 1),
                        lt: new Date(year + 1, 0, 1),
                    },
                };
            }
        }

        const feedbackList = await prisma.feedback.findMany({
            where: dateFilter,
            orderBy: { createdAt: "desc" },
        });

        const rows = feedbackList.map((f, index) => {
            const resolvedAt = toDateOrNull(f.dateResolved);
            const resolveDays = resolvedAt ? dateDiffInDays(f.createdAt, resolvedAt) : null;
            const daysToResolve = resolveDays !== null ? `${resolveDays} day${resolveDays === 1 ? "" : "s"}` : "";

            return {
            No: index + 1,
            DateSubmitted: formatAsDateTime(f.createdAt),
            ControlNumber: f.controlNumber,
            ClientName: f.name || "",
            ClientType: f.clientType || "",
            Age: f.age || "",
            Sex: f.sex || "",
            Email: f.email || "",
            Office: f.office || "",
            ServiceAvailed: f.citizensCharterService || "",
            ServiceCategory: f.serviceCategory || "",
            TransactionTypes: f.transactionTypes || "",
            ActionProvided: f.actionProvided || "",
            DateResolved: resolvedAt ? formatAsDateTime(resolvedAt) : f.dateResolved || "",
            DaysToResolution: daysToResolve,
            CC1: f.cc1 || "",
            CC2: f.cc2 || "",
            CC3: f.cc3 || "",
            SQD0: f.sqd0 || "",
            SQD1: f.sqd1 || "",
            SQD2: f.sqd2 || "",
            SQD3: f.sqd3 || "",
            SQD4: f.sqd4 || "",
            SQD5: f.sqd5 || "",
            SQD6: f.sqd6 || "",
            SQD7: f.sqd7 || "",
            SQD8: f.sqd8 || "",
            Suggestions: f.suggestions || "",
            NatureOfTransaction: DEFAULT_NATURE_OF_TRANSACTION,
            };
        });

        let fileBuffer: Buffer;
        let outputBookType: "xlsx" | "xlsm" = "xlsx";
        try {
            const absoluteTemplatePath = path.isAbsolute(TEMPLATE_FILE_PATH)
                ? TEMPLATE_FILE_PATH
                : path.join(process.cwd(), TEMPLATE_FILE_PATH);

            const templateBuffer = await fs.readFile(absoluteTemplatePath);
            const workbook = XLSX.read(templateBuffer, { type: "buffer", cellStyles: true, cellDates: true });

            const targetSheetName =
                TEMPLATE_SHEET_NAME && workbook.Sheets[TEMPLATE_SHEET_NAME]
                    ? TEMPLATE_SHEET_NAME
                    : workbook.SheetNames[0];

            if (!targetSheetName) {
                throw new Error("Template workbook has no sheets.");
            }

            const worksheet = workbook.Sheets[targetSheetName];

            const matrixRows = rows.map((row) => [
                row.No,
                row.DateSubmitted,
                row.ControlNumber,
                row.ClientName,
                row.ClientType,
                row.Age,
                row.Sex,
                row.Email,
                row.Office,
                row.ServiceAvailed,
                row.ServiceCategory,
                row.TransactionTypes,
                row.ActionProvided,
                row.DateResolved,
                row.DaysToResolution,
                row.CC1,
                row.CC2,
                row.CC3,
                row.SQD0,
                row.SQD1,
                row.SQD2,
                row.SQD3,
                row.SQD4,
                row.SQD5,
                row.SQD6,
                row.SQD7,
                row.SQD8,
                row.Suggestions,
                row.NatureOfTransaction,
            ]);

            writeRowsToTemplateSheet(worksheet, matrixRows);
            const templateExtension = path.extname(absoluteTemplatePath).toLowerCase();
            const bookType = templateExtension === ".xlsm" ? "xlsm" : "xlsx";
            outputBookType = bookType;

            fileBuffer = XLSX.write(workbook, {
                type: "buffer",
                bookType,
                cellStyles: true,
                bookVBA: bookType === "xlsm",
            }) as Buffer;
        } catch (templateError) {
            console.warn("Template export failed, falling back to generated workbook:", templateError);
            fileBuffer = buildFallbackWorkbook(rows);
            outputBookType = "xlsx";
        }

        const fileSuffix = year
            ? `${year}-${month && month >= 1 && month <= 12 ? String(month).padStart(2, "0") : "all"}`
            : "all";

        const isMacroEnabledTemplate = outputBookType === "xlsm";
        const fileExtension = isMacroEnabledTemplate ? "xlsm" : "xlsx";

        return new Response(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                "Content-Type": isMacroEnabledTemplate
                    ? "application/vnd.ms-excel.sheet.macroEnabled.12"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename=feedback-report-${fileSuffix}.${fileExtension}`,
            },
        });
    } catch (error: any) {
        console.error("Excel export error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
