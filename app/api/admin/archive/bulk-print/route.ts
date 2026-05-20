import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";
import { getSession } from "@/lib/session";
import { buildClientFeedbackPrintHtml } from "@/lib/csm-print-template";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

type Session = Awaited<ReturnType<typeof getSession>>;
type FeedbackRow = {
    id?: number | string;
    controlNumber?: string;
    name?: string;
    office?: string;
    citizensCharterService?: string;
    formDate?: string | Date;
    cc1?: string | null;
    cc2?: string | null;
    cc3?: string | null;
    suggestions?: string | null;
    sqd0?: string | null;
    sqd1?: string | null;
    sqd2?: string | null;
    sqd3?: string | null;
    sqd4?: string | null;
    sqd5?: string | null;
    sqd6?: string | null;
    sqd7?: string | null;
    sqd8?: string | null;
};

type BulkPrintDependencies = {
    getSessionFn?: typeof getSession;
    getClientFn?: typeof getTursoClient;
    browserLauncher?: typeof puppeteer.launch;
};

export async function handleBulkPrint(req: Request, deps: BulkPrintDependencies = {}) {
    const getSessionFn = deps.getSessionFn ?? getSession;
    const getClientFn = deps.getClientFn ?? getTursoClient;
    const browserLauncher = deps.browserLauncher ?? puppeteer.launch;

    try {
        const session = await getSessionFn();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authorized" },
                { status: 401 }
            );
        }

        const { monthKey, format } = await req.json();

        // This endpoint is PDF-only. Keep validation strict to avoid unexpected output types.
        if (format && format !== "pdf") {
            return NextResponse.json(
                { success: false, error: "Invalid format (expected 'pdf')" },
                { status: 400 }
            );
        }

        if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
            return NextResponse.json(
                { success: false, error: "Invalid month format (expected YYYY-MM)" },
                { status: 400 }
            );
        }

        // Fetch feedbacks for this month via Turso SQL
        const client = getClientFn();
        const result = await client.execute(`
            SELECT id, controlNumber, name, office, citizensCharterService, formDate,
                   clientType, age, sex, email, employeeName, regionOfResidence, province, municipality, transactionTypes,
                   cc1, cc2, cc3, suggestions,
                   sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8
            FROM Feedback
            ORDER BY createdAt DESC
        `);
        let feedbacks = (result.rows || []) as FeedbackRow[];

        // Role-based filtering
        if (session.role === "office_admin") {
            feedbacks = feedbacks.filter((f: FeedbackRow) => {
                const officeStr = String(f.office || "").trim().toUpperCase();
                const sessionOfficeStr = (session.office || "").trim().toUpperCase();
                return officeStr.includes(sessionOfficeStr);
            });
        }

        // Filter by month and answered status
        const filteredFeedbacks = feedbacks.filter((f: FeedbackRow) => {
            const formDate = String(f.formDate || "");
            if (!formDate.startsWith(monthKey)) return false;
            const hasSQD = [f.sqd0, f.sqd1, f.sqd2, f.sqd3, f.sqd4, f.sqd5, f.sqd6, f.sqd7, f.sqd8].some(v => v !== null);
            const hasCC = [f.cc1, f.cc2, f.cc3].some((v) => v !== null);
            const hasSuggestions = f.suggestions !== null;
            return hasSQD || hasCC || hasSuggestions;
        });

        if (filteredFeedbacks.length === 0) {
            return NextResponse.json(
                { success: false, error: "No answered feedbacks found for this month" },
                { status: 404 }
            );
        }

        // Build absolute logo URL from the request origin so assets load in Puppeteer
        const origin = (() => {
            try { return new URL(req.url).origin } catch { return "" }
        })();
        const logoUrl = `${origin}/tesda-logo.png`;

        // Generate combined HTML pages using the CSM print template (inline images as data URIs)
        const html = await generateCombinedPrintHTML(filteredFeedbacks, monthKey, logoUrl);

        // Generate PDF using Puppeteer
        try {
            // Allow overriding the Chromium/Chrome executable via env var `CHROME_EXECUTABLE_PATH`.
            const execPath = typeof process !== 'undefined' ? process.env.CHROME_EXECUTABLE_PATH : undefined;
            const launchOpts: any = {
                headless: "new",
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            };
            if (execPath) launchOpts.executablePath = execPath;

            const browser = await browserLauncher(launchOpts);

            try {
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: "domcontentloaded" });
                const pdfBuffer = await page.pdf({
                    format: "A4",
                    printBackground: true,
                    margin: {
                        top: "10mm",
                        right: "10mm",
                        bottom: "10mm",
                        left: "10mm",
                    },
                });
                const pdfBody = new Uint8Array(pdfBuffer.byteLength);
                pdfBody.set(pdfBuffer);

                return new NextResponse(pdfBody, {
                    status: 200,
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename="feedbacks-${monthKey}.pdf"`,
                    },
                });
            } finally {
                await browser.close();
            }
        } catch (err) {
            console.warn("PDF generation failed with Puppeteer:", err);
            return NextResponse.json(
                { success: false, error: "Failed to generate PDF for this batch" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Bulk Print Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    return handleBulkPrint(req);
}

export async function generateCombinedPrintHTML(feedbacks: FeedbackRow[], monthKey: string, logoUrl = ""): Promise<string> {
    // Load logo and SQD icons from the local public folder and convert to data URIs
    const publicDir = path.join(process.cwd(), "public");
    const assets: Record<string, string> = {};
    async function tryLoad(name: string, fileName: string) {
        try {
            const p = path.join(publicDir, fileName);
            const buf = await fs.readFile(p);
            assets[name] = `data:image/png;base64,${buf.toString("base64")}`;
        } catch (e) {
            // ignore missing
        }
    }

    // logo
    try {
        const logoPath = path.join(publicDir, "tesda-logo.png");
        const logoBuf = await fs.readFile(logoPath);
        const logoData = `data:image/png;base64,${logoBuf.toString("base64")}`;
        // override logoUrl with data URI so template uses it directly
        logoUrl = logoData;
    } catch (e) {
        // leave logoUrl as-is
    }

    await tryLoad("strong disagree", path.join("SQD", "strong disagree.png"));
    await tryLoad("disagree", path.join("SQD", "disagree.png"));
    await tryLoad("neutral", path.join("SQD", "neutral.png"));
    await tryLoad("agree", path.join("SQD", "agree.png"));
    await tryLoad("strong agree", path.join("SQD", "strong agree.png"));

    const pageHtmls = feedbacks.map((f) => {
        const transactionTypes = (String((f as any).transactionTypes || "") || "").split(",").map((s) => s.trim()).filter(Boolean);

        const snapshot = {
            formDate: f.formDate || undefined,
            submittedAt: new Date().toISOString(),
            controlNumber: f.controlNumber || "",
            dbId: f.id || null,
            clientInfo: {
                office: f.office || "",
                clientType: (f as any).clientType || "",
                name: f.name || "",
                sex: (f as any).sex || "",
                age: (f as any).age || "",
                regionOfResidence: (f as any).regionOfResidence || "",
                province: (f as any).province || "",
                municipality: (f as any).municipality || "",
                formDate: f.formDate || undefined,
                citizensCharterService: f.citizensCharterService || "",
                transactionTypes: transactionTypes,
            },
            ccQuestions: {
                cc1: f.cc1 || "",
                cc2: f.cc2 || "",
                cc3: f.cc3 || "",
            },
            sqd: {
                sqd0: f.sqd0 || "na",
                sqd1: f.sqd1 || "na",
                sqd2: f.sqd2 || "na",
                sqd3: f.sqd3 || "na",
                sqd4: f.sqd4 || "na",
                sqd5: f.sqd5 || "na",
                sqd6: f.sqd6 || "na",
                sqd7: f.sqd7 || "na",
                sqd8: f.sqd8 || "na",
            },
            suggestions: {
                suggestions: f.suggestions || "",
                email: (f as any).email || "",
                employeeName: (f as any).employeeName || "",
            },
        } as any;

        const formDateForTemplate = typeof f.formDate === "string"
            ? f.formDate
            : f.formDate instanceof Date
                ? f.formDate.toISOString()
                : new Date().toISOString();

        return buildClientFeedbackPrintHtml(snapshot, formDateForTemplate, logoUrl, assets);
    });

    // Wrap each page and ensure page-breaks for printing
    const combined = `<!doctype html><html><head><meta charset="utf-8"/><style>body{background:#fff} .page{page-break-after:always}</style></head><body>${pageHtmls.map(p => `<div class='page'>${p}</div>`).join('')}</body></html>`;
    return combined;
}

