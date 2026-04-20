import { prisma } from "@/lib/prisma";
import { getAllServiceNames } from "@/lib/services-data";
import DashboardClient from "./DashboardClient";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboard(props: { searchParams?: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
    const session = await getSession();
    if (!session) {
        return <div className="p-8 text-center text-red-500">Not authorized</div>;
    }

    const sp = props.searchParams ? await Promise.resolve(props.searchParams) : {};
    const monthStr = sp?.month as string | undefined;
    const yearStr = sp?.year as string | undefined;
    const currentYear = new Date().getFullYear();
    const reportYear = yearStr || currentYear.toString();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    let reportPeriodLabel = `All Months ${reportYear}`;
    if (monthStr && monthStr !== "all") {
        const monthIndex = parseInt(monthStr, 10) - 1;
        if (monthIndex >= 0 && monthIndex < monthNames.length) {
            reportPeriodLabel = `${monthNames[monthIndex]} ${reportYear}`;
        }
    }

    let dateFilter: any = {};
    if (yearStr) {
        const year = parseInt(yearStr);
        if (monthStr && monthStr !== "all") {
            const month = parseInt(monthStr);
            dateFilter = {
                createdAt: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1)
                }
            };
        } else {
            dateFilter = {
                createdAt: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1)
                }
            };
        }
    }

    let allFeedback = await prisma.feedback.findMany({
        where: dateFilter,
        orderBy: { createdAt: "desc" }
    });

    // Role-based filtering: office admins only see their own office data
    if (session.role === "office_admin") {
        allFeedback = allFeedback.filter((f) => {
            const officeStr = f.office?.trim().toUpperCase() || "";
            if (session.office === "CCNTS" && (officeStr === "CCNTS" || officeStr.includes("CCNTS"))) return true;
            if (session.office === "PTC" && (officeStr === "PTC" || officeStr.includes("PTC"))) return true;
            if (session.office === "PO" && (officeStr.includes("PO") || officeStr.includes("PROVIN"))) return true;
            return false;
        });
    }

    // Keep raw/report tabs in sync with dashboard filters (period + role scope).
    const allFeedbackRaw = [...allFeedback];
    const analysisRecord = await prisma.analysis.findUnique({ where: { id: 1 } });
    const initialAnalysis = analysisRecord?.content || "";

    const totalResponses = allFeedback.length;
    const perc = (n: number) => totalResponses > 0 ? ((n / totalResponses) * 100).toFixed(2) + "%" : "0%";

    const officeMatches = (office: string | null | undefined, key: "PO" | "CCNTS" | "PTC") => {
        const value = (office || "").toUpperCase();
        if (!value) return false;
        if (key === "CCNTS") return value.includes("CCNTS");
        if (key === "PTC") return value.includes("PTC") || value.includes("PTCDDS");
        return (
            value.includes("PO") ||
            value.includes("PROVIN") ||
            value.includes("TESDA PO DS")
        ) && !value.includes("PTC") && !value.includes("CCNTS");
    };

    const officeResponseData = [
        { name: "PO", responses: allFeedback.filter((f) => officeMatches(f.office, "PO")).length },
        { name: "CCNTS", responses: allFeedback.filter((f) => officeMatches(f.office, "CCNTS")).length },
        { name: "PTC", responses: allFeedback.filter((f) => officeMatches(f.office, "PTC")).length },
    ];

    const normalizeServiceName = (value: string) =>
        value
            .toLowerCase()
            .replace(/[\u2018\u2019']/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    const canonicalServiceNames = getAllServiceNames();
    const canonicalByNormalized = new Map<string, string>();
    canonicalServiceNames.forEach((name) => {
        canonicalByNormalized.set(normalizeServiceName(name), name);
    });

    const resolveCanonicalServiceName = (rawName: string) => {
        const normalized = normalizeServiceName(rawName);
        if (!normalized) return "Not Specified";

        const exact = canonicalByNormalized.get(normalized);
        if (exact) return exact;

        const withoutTip = normalized.replace(/\btip\b/g, "").replace(/\s+/g, " ").trim();
        if (withoutTip) {
            const tipResolved = canonicalByNormalized.get(withoutTip);
            if (tipResolved) return tipResolved;
        }

        for (const [candidateNormalized, candidateName] of canonicalByNormalized.entries()) {
            if (candidateNormalized.includes(normalized) || normalized.includes(candidateNormalized)) {
                return candidateName;
            }
        }

        return rawName || "Not Specified";
    };

    const officeBreakdown = (rows: any[]) => ({
        po: rows.filter((f) => officeMatches(f.office, "PO")).length,
        ccnts: rows.filter((f) => officeMatches(f.office, "CCNTS")).length,
        ptc: rows.filter((f) => officeMatches(f.office, "PTC")).length,
    });

    const genders = ["Female", "Male", "Did not specify"];
    const genderData = genders.map((g) => {
        const matches = allFeedback.filter((f) => {
            const sex = f.sex || "Did not specify";
            return sex.toLowerCase() === g.toLowerCase();
        });
        const internal = matches.filter((f) => f.serviceCategory === "Internal").length;
        const external = matches.filter((f) => f.serviceCategory === "External").length;
        return { name: g, responses: matches.length, internal, external, percentage: perc(matches.length), ...officeBreakdown(matches) };
    });

    const ageCategories = ["19 or lower", "20-34", "35-49", "50-64", "65 or higher", "Did not specify"];
    const ageData = ageCategories.map((g) => {
        const matches = allFeedback.filter((f) => {
            const a = parseInt(f.age || "0");
            if (!a || isNaN(a)) return g === "Did not specify";
            if (a <= 19) return g === "19 or lower";
            if (a <= 34) return g === "20-34";
            if (a <= 49) return g === "35-49";
            if (a <= 64) return g === "50-64";
            return g === "65 or higher";
        });
        const internal = matches.filter((f) => f.serviceCategory === "Internal").length;
        const external = matches.filter((f) => f.serviceCategory === "External").length;
        return { name: g, responses: matches.length, internal, external, percentage: perc(matches.length), ...officeBreakdown(matches) };
    });

    const customerTypes = ["Citizen", "Business", "Government", "Did not specify"];
    const customerTypeData = customerTypes.map((g) => {
        const matches = allFeedback.filter((f) => {
            const ct = f.clientType || "Did not specify";
            return ct.toLowerCase() === g.toLowerCase();
        });
        const internal = matches.filter((f) => f.serviceCategory === "Internal").length;
        const external = matches.filter((f) => f.serviceCategory === "External").length;
        return { name: g, responses: matches.length, internal, external, percentage: perc(matches.length), ...officeBreakdown(matches) };
    });

    const transactionCategories = ["Assessment & Certification", "Program Registration", "Training", "Scholarship", "Admin. Related", "Others"];
    const transactionData = transactionCategories.map((g) => {
        const matches = allFeedback.filter((f) => (f.transactionTypes || "").toLowerCase().includes(g.toLowerCase()));
        const internal = matches.filter((f) => f.serviceCategory === "Internal").length;
        const external = matches.filter((f) => f.serviceCategory === "External").length;
        return { name: g, responses: matches.length, internal, external, percentage: perc(matches.length), ...officeBreakdown(matches) };
    });

    const inquiries = allFeedback.filter((f) => (f.citizensCharterService || "").toLowerCase().includes("inquiry"));
    const complaints = allFeedback.filter((f) => (f.citizensCharterService || "").toLowerCase().includes("complaint"));
    const natureData = [
        { name: "Inquiry", responses: inquiries.length, ...officeBreakdown(inquiries) },
        { name: "Complaint", responses: complaints.length, ...officeBreakdown(complaints) },
    ];

    const servicesMap: Record<string, { responses: number, internal: number, external: number, ratings: number[], po: number, ccnts: number, ptc: number }> = {};
    canonicalServiceNames.forEach(name => {
        servicesMap[name] = { responses: 0, internal: 0, external: 0, ratings: [], po: 0, ccnts: 0, ptc: 0 };
    });
    allFeedback.forEach(f => {
        const s = resolveCanonicalServiceName(f.citizensCharterService || "Not Specified");
        if (!servicesMap[s]) servicesMap[s] = { responses: 0, internal: 0, external: 0, ratings: [], po: 0, ccnts: 0, ptc: 0 };
        servicesMap[s].responses++;
        if (f.serviceCategory === "Internal") servicesMap[s].internal++;
        if (f.serviceCategory === "External") servicesMap[s].external++;
        if (officeMatches(f.office, "PO")) servicesMap[s].po++;
        if (officeMatches(f.office, "CCNTS")) servicesMap[s].ccnts++;
        if (officeMatches(f.office, "PTC")) servicesMap[s].ptc++;

        const rating = parseInt(f.sqd0 || "0", 10);
        if (rating >= 1 && rating <= 5) {
            servicesMap[s].ratings.push(rating);
        }
    });

    const serviceData = Object.keys(servicesMap).map(k => {
        const d = servicesMap[k];
        const avg = d.ratings.length > 0 ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "N/A";
        return { name: k, responses: d.responses, internal: d.internal, external: d.external, rating: avg, po: d.po, ccnts: d.ccnts, ptc: d.ptc };
    }).sort((a, b) => b.responses - a.responses);

    const ccData = {
        cc1: {} as Record<string, number>,
        cc2: {} as Record<string, number>,
        cc3: {} as Record<string, number>
    };

    const ccOfficeData = {
        cc1: {} as Record<string, { po: number, ccnts: number, ptc: number }>,
        cc2: {} as Record<string, { po: number, ccnts: number, ptc: number }>,
        cc3: {} as Record<string, { po: number, ccnts: number, ptc: number }>
    };

    allFeedback.forEach(f => {
        const c1 = f.cc1 || "N/A"; const c2 = f.cc2 || "N/A"; const c3 = f.cc3 || "N/A";
        ccData.cc1[c1] = (ccData.cc1[c1] || 0) + 1;
        ccData.cc2[c2] = (ccData.cc2[c2] || 0) + 1;
        ccData.cc3[c3] = (ccData.cc3[c3] || 0) + 1;

        if (!ccOfficeData.cc1[c1]) ccOfficeData.cc1[c1] = { po: 0, ccnts: 0, ptc: 0 };
        if (!ccOfficeData.cc2[c2]) ccOfficeData.cc2[c2] = { po: 0, ccnts: 0, ptc: 0 };
        if (!ccOfficeData.cc3[c3]) ccOfficeData.cc3[c3] = { po: 0, ccnts: 0, ptc: 0 };

        if (officeMatches(f.office, "PO")) {
            ccOfficeData.cc1[c1].po++;
            ccOfficeData.cc2[c2].po++;
            ccOfficeData.cc3[c3].po++;
        }
        if (officeMatches(f.office, "CCNTS")) {
            ccOfficeData.cc1[c1].ccnts++;
            ccOfficeData.cc2[c2].ccnts++;
            ccOfficeData.cc3[c3].ccnts++;
        }
        if (officeMatches(f.office, "PTC")) {
            ccOfficeData.cc1[c1].ptc++;
            ccOfficeData.cc2[c2].ptc++;
            ccOfficeData.cc3[c3].ptc++;
        }
    });
    const predefinedActions = [
        "Provided a Direct and Concrete Response / Information",
        "Referred to RO",
        "Referred to PO/DO",
        "Referred to Focal",
        "Referred to TVIs",
        "Referred Assessment Centers",
        "Others: conducted training and assessment",
    ];
    const actionDataMap: Record<string, { responses: number, po: number, ccnts: number, ptc: number }> = {};
    predefinedActions.forEach(name => {
        actionDataMap[name] = { responses: 0, po: 0, ccnts: 0, ptc: 0 };
    });
    allFeedback.forEach(f => {
        const action = f.actionProvided || "Not yet provided";
        if (!actionDataMap[action]) actionDataMap[action] = { responses: 0, po: 0, ccnts: 0, ptc: 0 };
        actionDataMap[action].responses++;
        if (officeMatches(f.office, "PO")) actionDataMap[action].po++;
        if (officeMatches(f.office, "CCNTS")) actionDataMap[action].ccnts++;
        if (officeMatches(f.office, "PTC")) actionDataMap[action].ptc++;
    });
    const actionData = Object.keys(actionDataMap).map(k => ({ name: k, ...actionDataMap[k] })).sort((a, b) => b.responses - a.responses);

    const sqdKeys = ["sqd0", "sqd1", "sqd2", "sqd3", "sqd4", "sqd5", "sqd6", "sqd7", "sqd8"];
    const sqdResults: Record<string, Record<string, number>> = {};
    const sqdOfficeData: Record<string, { po: number, ccnts: number, ptc: number }> = {};
    sqdKeys.forEach(k => {
        sqdResults[k] = { "Strongly Agree": 0, "Agree": 0, "Neither Agree nor Disagree": 0, "Disagree": 0, "Strongly Disagree": 0, "N/A": 0 };
        sqdOfficeData[k] = { po: 0, ccnts: 0, ptc: 0 };
    });
    const sqdValMap: Record<string, string> = {
        "5": "Strongly Agree",
        "4": "Agree",
        "3": "Neither Agree nor Disagree",
        "2": "Disagree",
        "1": "Strongly Disagree"
    };

    allFeedback.forEach(f => {
        const fAny = f as any;
        sqdKeys.forEach(k => {
            const rawVal = fAny[k];
            let mappedVal = sqdValMap[rawVal] || "N/A";

            if (sqdResults[k][mappedVal] === undefined) mappedVal = "N/A";
            sqdResults[k][mappedVal]++;

            if (officeMatches(f.office, "PO")) sqdOfficeData[k].po++;
            if (officeMatches(f.office, "CCNTS")) sqdOfficeData[k].ccnts++;
            if (officeMatches(f.office, "PTC")) sqdOfficeData[k].ptc++;
        });
    });

    const reportMetadata = await prisma.reportMetadata.findFirst();

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#7b60ff] via-[#6f56f5] to-[#5b3fd1] print:bg-white print:p-0">
            <main className="relative min-h-screen w-full print:m-0 print:block print:w-full print:max-w-none print:p-0">
                <DashboardClient
                    userRole={session.role}
                    userOffice={session.office}
                    reportMetadata={reportMetadata}
                    allFeedback={allFeedback}
                    allFeedbackRaw={allFeedbackRaw}
                    totalResponses={totalResponses}
                    reportPeriodLabel={reportPeriodLabel}
                    officeResponseData={officeResponseData}
                    genderData={genderData}
                    ageData={ageData}
                    customerTypeData={customerTypeData}
                    transactionData={transactionData}
                    natureData={natureData}
                    serviceData={serviceData}
                    ccData={ccData}
                    ccOfficeData={ccOfficeData}
                    actionData={actionData}
                    sqdResults={sqdResults}
                    sqdOfficeData={sqdOfficeData}
                    initialAnalysis={initialAnalysis}
                />
            </main>
        </div>
    );
}
