import { google } from "googleapis"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { clientInfo, ccQuestions, sqd, suggestions } = body

        // 1. Authenticate with Google Service Account
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                // The private key might have escaped newlines if passed through env vars
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        })

        const sheets = google.sheets({ version: "v4", auth })

        // Helper: generate a control number based on office and month
        const generateControlNumber = async (office: string): Promise<string> => {
            // Extract abbreviation inside parentheses if present, e.g. "(TESDA PO DS)"
            const abbrevMatch = office.match(/\(([^)]+)\)/);
            const abbrev = abbrevMatch ? abbrevMatch[1].trim() : office.trim();
            const prefixMap: Record<string, string> = {
                "TESDA PO DS": "PO",
                "CCNTS": "CCNTS",
                "PTC - DS": "PTCDDS",
            };
            // Find matching prefix (case‑insensitive)
            let prefix = "UNK";
            for (const key in prefixMap) {
                if (abbrev.toUpperCase().includes(key.toUpperCase())) {
                    prefix = prefixMap[key];
                    break;
                }
            }
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const base = `${prefix}-${year}-${month}`;
            // Fetch existing control numbers in column C
            const existing = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
                range: "'Monitoring of Feedback Forms'!C:C",
            });
            const values = existing.data.values?.flat() as string[] | undefined;
            const seqNumbers = values
                ?.filter(v => v?.startsWith(base))
                .map(v => Number(v.split("-").pop()))
                .filter(n => !isNaN(n));
            const nextSeq = seqNumbers && seqNumbers.length > 0 ? Math.max(...seqNumbers) + 1 : 1;
            return `${base}-${String(nextSeq).padStart(3, "0")}`;
        };

        // Helper: determine External / Internal based on service name
        const getServiceCategory = (service: string): string => {
            if (service.includes("(External)")) return "External";
            if (service.includes("(Internal)")) return "Internal";
            return "External";
        };

        // Helper: format office string for the spreadsheet output
        const getFormattedOffice = (office: string): string => {
            const abbrevMatch = office.match(/\(([^)]+)\)/);
            const abbrev = abbrevMatch ? abbrevMatch[1].trim().toUpperCase() : office.trim().toUpperCase();

            if (abbrev.includes("CCNTS")) return "Region XI/TESDA CCNTS";
            if (abbrev.includes("PO")) return "REGION XI/PROVINICAL OFFICE";
            if (abbrev.includes("PTCDDS") || abbrev.includes("PTC - DS")) return "REGION XI / PTC-DAVAO DEL SUR";

            return office; // Fallback
        };

        // Build row data matching required column order (A to AC)
        const controlNumber = await generateControlNumber(clientInfo.office || "");
        const serviceCategory = getServiceCategory(clientInfo.citizensCharterService || "");
        const formattedOffice = getFormattedOffice(clientInfo.office || "");
        // Clean up the service name by removing " (External)" or " (Internal)" from the end
        const cleanService = (clientInfo.citizensCharterService || "").replace(/\s*\((External|Internal)\)$/i, "").trim();

        const rowData = [
            // Placeholder removed; data starts at column B
            new Date().toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }), // B: Date
            controlNumber, // C: Control Number
            clientInfo.name || "", // D: Client's Name
            clientInfo.clientType || "", // E: Client Type
            clientInfo.age || "", // F: Age
            clientInfo.sex || "", // G: Gender
            suggestions.email || "", // H: Email
            formattedOffice, // I: Region/Office Visited
            cleanService, // J: Citizens Charter Service
            serviceCategory, // K: External / Internal
            clientInfo.transactionTypes?.join(", ") || "", // L: Type of Transaction
            "", // M: Action Provided (blank)
            "", // N: Date Resolved (blank)
            "", // O: Number of Days to Resolution (blank)
            ccQuestions.cc1 || "", // P: CC1
            ccQuestions.cc2 || "", // Q: CC2
            ccQuestions.cc3 || "", // R: CC3
            sqd.sqd0 || "", // S: SQD0
            sqd.sqd1 || "", // T: SQD1
            sqd.sqd2 || "", // U: SQD2
            sqd.sqd3 || "", // V: SQD3
            sqd.sqd4 || "", // W: SQD4
            sqd.sqd5 || "", // X: SQD5
            sqd.sqd6 || "", // Y: SQD6
            sqd.sqd7 || "", // Z: SQD7
            sqd.sqd8 || "", // AA: SQD8
            suggestions.suggestions || "", // AB: Citizens Comment
            "", // AC: Action Taken (blank)
        ];

        // 3. Write to the next row explicitly so values always start at column B.
        const existingRows = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: "'Monitoring of Feedback Forms'!C12:C",
        });

        const occupiedRows = (existingRows.data.values || []).filter((row) => (row?.[0] || "").toString().trim() !== "").length;
        const nextRow = 12 + occupiedRows;

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: `'Monitoring of Feedback Forms'!B${nextRow}:AC${nextRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [rowData],
            },
        })

        // 4. Save to local SQLite database via Prisma
        const feedbackEntry = await prisma.feedback.create({
            data: {
                controlNumber: controlNumber,
                name: clientInfo.name || null,
                clientType: clientInfo.clientType || null,
                age: clientInfo.age || null,
                sex: clientInfo.sex || null,
                formDate: clientInfo.date || null,
                email: suggestions.email || null,
                employeeName: suggestions.employeeName || null,
                regionOfResidence: clientInfo.regionOfResidence || "Region XI",
                province: clientInfo.province || null,
                municipality: clientInfo.municipality || null,
                office: formattedOffice,
                citizensCharterService: cleanService,
                serviceCategory: serviceCategory,
                transactionTypes: clientInfo.transactionTypes?.join(", ") || null,
                cc1: ccQuestions.cc1 || null,
                cc2: ccQuestions.cc2 || null,
                cc3: ccQuestions.cc3 || null,
                sqd0: sqd.sqd0 || null,
                sqd1: sqd.sqd1 || null,
                sqd2: sqd.sqd2 || null,
                sqd3: sqd.sqd3 || null,
                sqd4: sqd.sqd4 || null,
                sqd5: sqd.sqd5 || null,
                sqd6: sqd.sqd6 || null,
                sqd7: sqd.sqd7 || null,
                sqd8: sqd.sqd8 || null,
                suggestions: suggestions.suggestions || null,
            }
        });

        return NextResponse.json({
            success: true,
            data: response.data,
            dbId: feedbackEntry.id,
            controlNumber,
        })
    } catch (error: any) {
        console.error("Sheets API Error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
