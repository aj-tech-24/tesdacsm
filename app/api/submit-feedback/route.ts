import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { clientInfo, ccQuestions, sqd, suggestions } = body

        // Helper: generate a control number based on office and month
        const generateControlNumber = async (office: string, formDate?: string): Promise<string> => {
            // Extract abbreviation inside parentheses if present, e.g. "(TESDA PO DS)"
            const abbrevMatch = office.match(/\(([^)]+)\)/)
            const abbrev = abbrevMatch ? abbrevMatch[1].trim() : office.trim()
            const prefixMap: Record<string, string> = {
                "TESDA PO DS": "PO",
                "CCNTS": "CCNTS",
                "PTC - DS": "PTCDDS",
            }
            // Find matching prefix (case‑insensitive)
            let prefix = "UNK"
            for (const key in prefixMap) {
                if (abbrev.toUpperCase().includes(key.toUpperCase())) {
                    prefix = prefixMap[key]
                    break
                }
            }
            // Use the provided form date when available; otherwise fall back to current date.
            let dateObj = new Date()
            if (formDate) {
                const parsed = new Date(formDate)
                if (!Number.isNaN(parsed.getTime())) dateObj = parsed
            }
            const year = dateObj.getFullYear()
            const month = String(dateObj.getMonth() + 1).padStart(2, "0")
            const base = `${prefix}-${year}-${month}`

            // Use DB history instead of Sheets to continue monthly sequence.
            const existing = await prisma.feedback.findMany({
                where: {
                    controlNumber: {
                        startsWith: `${base}-`,
                    },
                },
                select: {
                    controlNumber: true,
                },
            })

            const seqNumbers = existing
                .map((row) => Number(row.controlNumber.split("-").pop()))
                .filter((num) => !Number.isNaN(num))
            const nextSeq = seqNumbers.length > 0 ? Math.max(...seqNumbers) + 1 : 1
            return `${base}-${String(nextSeq).padStart(3, "0")}`
        }

        // Helper: determine External / Internal based on service name
        const getServiceCategory = (service: string): string => {
            if (service.includes("(External)")) return "External";
            if (service.includes("(Internal)")) return "Internal";
            return "External";
        }

        // Helper: format office string for the spreadsheet output
        const getFormattedOffice = (office: string): string => {
            const abbrevMatch = office.match(/\(([^)]+)\)/)
            const abbrev = abbrevMatch ? abbrevMatch[1].trim().toUpperCase() : office.trim().toUpperCase()

            if (abbrev.includes("CCNTS")) return "Region XI/TESDA CCNTS"
            if (abbrev.includes("PO")) return "REGION XI/PROVINICAL OFFICE"
            if (abbrev.includes("PTCDDS") || abbrev.includes("PTC - DS")) return "REGION XI / PTC-DAVAO DEL SUR"

            return office // Fallback
        }

        // Build row data matching required column order (A to AC)
        const controlNumber = await generateControlNumber(clientInfo.office || "", clientInfo.date || "");
        const serviceCategory = getServiceCategory(clientInfo.citizensCharterService || "");
        const formattedOffice = getFormattedOffice(clientInfo.office || "");
        // Clean up the service name by removing " (External)" or " (Internal)" from the end
        const cleanService = (clientInfo.citizensCharterService || "").replace(/\s*\((External|Internal)\)$/i, "").trim()

        const sqdEntries = Object.entries(sqd)
            .map(([key, value]) => ({ key, rating: Number.parseInt(String(value), 10) }))
            .filter(({ key, rating }) => key.startsWith("sqd") && Number.isInteger(rating) && rating >= 1 && rating <= 5)
        const lowestRating = sqdEntries.reduce<number | null>((currentLowest, entry) => {
            if (currentLowest === null) return entry.rating
            return Math.min(currentLowest, entry.rating)
        }, null)
        const lowRatingFields = sqdEntries.filter((entry) => entry.rating <= 2).map((entry) => `${entry.key.toUpperCase()}: ${entry.rating}`)

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

        if (lowestRating !== null && lowestRating <= 2) {
            try {
                const lowScoreSummary = lowRatingFields.length > 0
                    ? lowRatingFields.join(", ")
                    : `Lowest SQD score: ${lowestRating}`

                await prisma.$executeRawUnsafe(
                    `INSERT INTO "Notification" ("readAt", "level", "title", "message", "controlNumber", "office", "service", "lowestRating", "feedbackId") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    null,
                    "warning",
                    "Low rating alert",
                    `${controlNumber} received a low customer rating for ${cleanService || "a service"}. ${lowScoreSummary}.`,
                    controlNumber,
                    formattedOffice,
                    cleanService || null,
                    lowestRating,
                    feedbackEntry.id,
                )
            } catch (notificationError) {
                console.error("Failed to create low rating notification:", notificationError)
            }
        }

        return NextResponse.json({
            success: true,
            dbId: feedbackEntry.id,
            controlNumber,
        })
    } catch (error: any) {
        console.error("Submit Feedback API Error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
