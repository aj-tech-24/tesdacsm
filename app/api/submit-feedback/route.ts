import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServiceCategoryFromExactList, servicesData, type ServiceCategory } from "@/lib/services-data"
import { createRateLimitResponse, enforceRateLimit, rejectIfRequestTooLarge } from "@/lib/request-protection"

export async function POST(req: Request) {
    try {
        const oversizedResponse = rejectIfRequestTooLarge(req, 512 * 1024)
        if (oversizedResponse) {
            return oversizedResponse
        }

        const burstLimit = await enforceRateLimit(req, {
            scope: "submit-feedback:burst",
            limit: 6,
            windowMs: 30 * 1000,
        })

        if (!burstLimit.allowed) {
            return createRateLimitResponse(burstLimit)
        }

        const sustainedLimit = await enforceRateLimit(req, {
            scope: "submit-feedback:sustained",
            limit: 24,
            windowMs: 15 * 60 * 1000,
        })

        if (!sustainedLimit.allowed) {
            return createRateLimitResponse(sustainedLimit)
        }

        const body = await req.json()
        const { clientInfo, ccQuestions, sqd, suggestions } = body

        const resolveOfficeKey = (office: string): "TESDA PO DS" | "CCNTS" | "PTC - DS" | "" => {
            const normalized = office.toUpperCase().replace(/\s+/g, " ").trim()

            if (
                normalized.includes("TESDA PO DS") ||
                normalized.includes("DAVAO DEL SUR PROVINCIAL OFFICE") ||
                normalized.includes("PROVINCIAL OFFICE")
            ) {
                return "TESDA PO DS"
            }

            if (
                normalized.includes("CCNTS") ||
                normalized.includes("CARMELO C. DELOS CIENTOS") ||
                normalized.includes("NATIONAL TRADE SCHOOL")
            ) {
                return "CCNTS"
            }

            if (
                normalized.includes("PTC - DS") ||
                normalized.includes("PTCDDS") ||
                normalized.includes("PROVINCIAL TRAINING CENTERS")
            ) {
                return "PTC - DS"
            }

            return ""
        }

        // Helper: generate a control number based on office and month
        /**
         * Generates a control number using the format: PREFIX-YEAR-MONTH-SEQUENCE
         * @param office - Office name (may contain abbreviation in parentheses)
         * @param formDate - Form submission date (ISO string or valid date format). Uses current date if invalid or omitted.
         * @returns Promise<string> - Control number string
         */
        const generateControlNumber = async (office: string, formDate?: string): Promise<string> => {
            const officeKey = resolveOfficeKey(office)
            const prefixMap: Record<string, string> = {
                "TESDA PO DS": "PO",
                "CCNTS": "CCNTS",
                "PTC - DS": "PTCDDS",
            }
            const prefix = officeKey ? prefixMap[officeKey] : "UNK"
            
            // Use the provided form date when available; otherwise fall back to current date
            let dateObj = new Date()
            let usedProvidedDate = false
            
            if (formDate && formDate.trim()) {
                const parsed = new Date(formDate)
                if (!Number.isNaN(parsed.getTime())) {
                    dateObj = parsed
                    usedProvidedDate = true
                } else {
                    console.warn(`Invalid form date provided: "${formDate}". Using current date for control number.`)
                }
            }
            
            if (!usedProvidedDate && formDate) {
                console.info(`No form date or invalid format. Using current date (${dateObj.toISOString()}) for control number.`)
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
            return `${base}-${String(nextSeq).padStart(4, "0")}`
        }

        // Helper: determine External Services / Internal Services based on office and service name
        const getServiceCategory = (office: string, service: string): ServiceCategory => {
            try {
                const normalizedOffice = office.toUpperCase().replace(/\s+/g, " ").trim()

                let officeKey = ""
                if (
                    normalizedOffice.includes("TESDA PO DS") ||
                    normalizedOffice.includes("DAVAO DEL SUR PROVINCIAL OFFICE") ||
                    normalizedOffice.includes("PROVINCIAL OFFICE")
                ) {
                    officeKey = "TESDA PO DS"
                } else if (
                    normalizedOffice.includes("CCNTS") ||
                    normalizedOffice.includes("CARMELO C. DELOS CIENTOS") ||
                    normalizedOffice.includes("NATIONAL TRADE SCHOOL")
                ) {
                    officeKey = "CCNTS"
                } else if (
                    normalizedOffice.includes("PTC - DS") ||
                    normalizedOffice.includes("PTCDDS") ||
                    normalizedOffice.includes("PROVINCIAL TRAINING CENTERS")
                ) {
                    officeKey = "PTC - DS"
                }

                if (!officeKey) return "External Services"

                const officeContent = servicesData[officeKey]
                if (!officeContent) return "External Services"

                const target = (service || "").replace(/\s*\((External|Internal)\)\s*$/i, "").trim()

                for (const txType of Object.keys(officeContent)) {
                    const categories = officeContent[txType]
                    for (const cat of Object.keys(categories) as Array<string>) {
                        const list = categories[cat as keyof typeof categories]
                        if (list && list.some(s => s === target)) {
                            return cat === "Internal Services" ? "Internal Services" : "External Services"
                        }
                    }
                }
            } catch (e) {
                console.warn('Error determining service category', e)
            }

            // Fallback: inspect suffix if present
            if (service.includes("(External)")) return "External Services"
            if (service.includes("(Internal)")) return "Internal Services"
            return "External Services"
        }

        // Helper: normalize gender to exact DB values
        const normalizeGender = (raw?: string | null) => {
            if (!raw) return "Did not specify"
            const v = String(raw).trim().toLowerCase()
            if (v === "male" || v === "m") return "Male"
            if (v === "female" || v === "f") return "Female"
            return "Did not specify"
        }

        // Helper: normalize customer type to exact DB values
        const normalizeCustomerType = (raw?: string | null) => {
            if (!raw) return "Did not specify"
            const v = String(raw).trim().toLowerCase()
            if (v.includes("citizen")) return "Citizen"
            if (v.includes("business")) return "Business"
            if (v.includes("government") || v.includes("employee") || v.includes("agency")) return "Government"
            return "Did not specify"
        }

        // Helper: format office string for the spreadsheet output
        const getFormattedOffice = (office: string): string => {
            const officeKey = resolveOfficeKey(office)

            if (officeKey === "CCNTS") return "Region XI/TESDA CCNTS"
            if (officeKey === "TESDA PO DS") return "REGION XI/PROVINICAL OFFICE"
            if (officeKey === "PTC - DS") return "REGION XI / PTC-DAVAO DEL SUR"

            return office // Fallback
        }

        // Build row data matching required column order (A to AC)
        const controlNumber = await generateControlNumber(clientInfo.office || "", clientInfo.date || "");
        

        // Determine if the client is a TESDA staff member based on office heuristics.
        const normalizedOfficeForStaffCheck = (clientInfo.office || "").toUpperCase();

            const rawServiceSelection = (clientInfo.citizensCharterService || "").trim()

            // Determine category from explicit selection variants (e.g. "... For Staff" / "... For Client").
            let serviceCategory = getServiceCategoryFromExactList(rawServiceSelection) || null;

            // Normalize base service name for DB storage (strip the For Staff/For Client suffix)
            const normalizedServiceForDb = rawServiceSelection.replace(/\s*For\s+(Staff|Client)$/i, "").replace(/\s*\((External|Internal)\)\s*$/i, "").trim();

            if (!serviceCategory) serviceCategory = getServiceCategory(clientInfo.office || "", normalizedServiceForDb || "");
        const formattedOffice = getFormattedOffice(clientInfo.office || "");
        // Normalize gender and customer type to exact DB values
        const normalizedSex = normalizeGender(clientInfo.sex)
        const normalizedClientType = normalizeCustomerType(clientInfo.clientType)

        // Normalize transaction type labels from UI to canonical DB values
        const mapTransactionLabel = (label: string) => {
            const v = String(label || "").trim().toLowerCase()
            if (v.includes("assessment")) return "Assessment & Certification"
            if (v.includes("program")) return "Program Registration"
            if (v.includes("training")) return "Training"
            if (v.includes("scholarship")) return "Scholarship"
            if (v.includes("administrative") || v.includes("admin")) return "Admin. Related"
            if (v.includes("others") || v === "others") return "Others"
            return String(label)
        }
        const dbTransactionTypes = (clientInfo.transactionTypes || []).map(mapTransactionLabel).join(", ") || null

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
                clientType: normalizedClientType || null,
                age: clientInfo.age || null,
                sex: normalizedSex || null,
                formDate: clientInfo.date || null,
                email: suggestions.email || null,
                employeeName: suggestions.employeeName || null,
                regionOfResidence: clientInfo.regionOfResidence || "Region XI",
                province: clientInfo.province || null,
                municipality: clientInfo.municipality || null,
                office: formattedOffice,
                citizensCharterService: normalizedServiceForDb || null,
                serviceCategory: serviceCategory,
                transactionTypes: dbTransactionTypes,
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
                    `${controlNumber} received a low customer rating for ${normalizedServiceForDb || "a service"}. ${lowScoreSummary}.`,
                    controlNumber,
                    formattedOffice,
                    normalizedServiceForDb || null,
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
