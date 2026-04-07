"use client";

import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";

// ─── Styles ──────────────────────────────────────────────────────────────────

const colors = {
    primary: "#1e40af",
    headerBg: "#1e3a5f",
    headerText: "#ffffff",
    sectionTitle: "#1e293b",
    tableBorder: "#cbd5e1",
    tableHeaderBg: "#e2e8f0",
    tableAltRow: "#f8fafc",
    text: "#334155",
    lightText: "#64748b",
    white: "#ffffff",
};

const s = StyleSheet.create({
    page: {
        paddingTop: 24,
        paddingBottom: 50,
        paddingHorizontal: 24,
        fontFamily: "Helvetica",
        fontSize: 8,
        color: colors.text,
    },

    // ── Fixed header ──
    headerFixed: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.tableBorder,
        marginBottom: 10,
        marginHorizontal: -24,
        marginTop: -24,
    },
    logo: { width: 48, height: 48, marginRight: 12 },
    headerTextBlock: { flex: 1, alignItems: "center" },
    headerTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.sectionTitle,
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 7.5,
        color: colors.text,
        textAlign: "center",
        marginTop: 2,
    },
    headerMeta: {
        fontSize: 7,
        color: colors.lightText,
        textAlign: "center",
        marginTop: 1,
    },
    metaContainer: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 0.5,
        borderTopColor: colors.tableBorder,
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 3,
        columnGap: 8,
    },
    metaItem: {
        width: "48%",
        flexDirection: "row",
    },
    metaLabel: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: colors.sectionTitle,
        width: "35%",
    },
    metaValue: {
        fontSize: 6.5,
        color: colors.text,
        flex: 1,
    },

    // ── Fixed footer ──
    footerFixed: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 24,
        borderTopWidth: 0.5,
        borderTopColor: colors.tableBorder,
        fontSize: 6.5,
        color: colors.lightText,
    },

    // ── Section ──
    sectionWrap: { marginBottom: 8 },
    sectionRow: { flexDirection: "row", gap: 6 },
    mainCol: { flex: 2.2 },
    sideCol: { flex: 1 },

    sectionLabel: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        color: colors.sectionTitle,
        marginBottom: 3,
        paddingBottom: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.primary,
    },

    // ── Table ──
    table: { borderWidth: 0.5, borderColor: colors.tableBorder },
    tHeadRow: {
        flexDirection: "row",
        backgroundColor: colors.tableHeaderBg,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.tableBorder,
    },
    tRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.tableBorder,
        minHeight: 14,
    },
    tRowAlt: { backgroundColor: colors.tableAltRow },
    tHeadCell: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
        color: colors.sectionTitle,
        paddingVertical: 3,
        paddingHorizontal: 4,
        borderRightWidth: 0.5,
        borderRightColor: colors.tableBorder,
    },
    tCell: {
        fontSize: 7,
        paddingVertical: 2.5,
        paddingHorizontal: 4,
        borderRightWidth: 0.5,
        borderRightColor: colors.tableBorder,
    },
    tCellCenter: { textAlign: "center" },
    tCellBold: { fontFamily: "Helvetica-Bold" },
    totalRow: {
        flexDirection: "row",
        backgroundColor: colors.tableHeaderBg,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.tableBorder,
        minHeight: 14,
    },

    // ── Analysis box ──
    analysisBox: {
        padding: 8,
        borderWidth: 0.5,
        borderColor: colors.tableBorder,
        borderRadius: 3,
        backgroundColor: colors.tableAltRow,
        marginTop: 2,
    },
    analysisText: { fontSize: 7.5, lineHeight: 1.5 },

    // ── Small card title ──
    cardTitle: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: colors.sectionTitle,
        marginBottom: 2,
    },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface PDFReportProps {
    reportMetadata?: any;
    totalResponses: number;
    reportPeriodLabel: string;
    adminAnalysis: string;
    officeResponseData: any[];
    genderData: any[];
    ageData: any[];
    customerTypeData: any[];
    transactionData: any[];
    natureData: any[];
    serviceData: any[];
    ccData: any;
    ccOfficeData: any;
    actionData: any[];
    sqdResults: any;
    sqdOfficeData: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ccOptionLabels: Record<string, Record<string, string>> = {
    cc1: {
        "1": "I know what a CC is and I saw this office\u2019s CC",
        "2": "I know what a CC is but I did not see this office\u2019s CC",
        "3": "I learned of the CC only when I saw this office\u2019s CC",
        "4": "I do not know what a CC is and I did not see one in this office",
        "N/A": "N/A",
    },
    cc2: {
        "1": "Easy to see",
        "2": "Somewhat easy to see",
        "3": "Difficult to see",
        "4": "Not visible at all",
        "5": "N/A",
        "N/A": "N/A",
    },
    cc3: {
        "1": "Helped very much",
        "2": "Somewhat helped",
        "3": "Did not help",
        "4": "N/A",
        "N/A": "N/A",
    },
};

function toOfficeRows(data: any[], rowName = "name") {
    return data.map((row: any) => ({
        label: row[rowName] ?? "",
        po: Number(row.po || 0),
        ccnts: Number(row.ccnts || 0),
        ptc: Number(row.ptc || 0),
    }));
}

// ─── Reusable Table Primitives ───────────────────────────────────────────────

function DataTable({
    headers,
    widths,
    rows,
    totalRow,
}: {
    headers: string[];
    widths: string[];
    rows: string[][];
    totalRow?: string[];
}) {
    return (
        <View style={s.table}>
            <View style={s.tHeadRow}>
                {headers.map((h, i) => (
                    <Text
                        key={i}
                        style={[
                            s.tHeadCell,
                            { width: widths[i] },
                            i > 0 ? s.tCellCenter : {},
                            i === headers.length - 1 ? { borderRightWidth: 0 } : {},
                        ]}
                    >
                        {h}
                    </Text>
                ))}
            </View>
            {rows.map((cells, ri) => (
                <View
                    key={ri}
                    style={[s.tRow, ri % 2 === 1 ? s.tRowAlt : {}]}
                    wrap={false}
                >
                    {cells.map((cell, ci) => (
                        <Text
                            key={ci}
                            style={[
                                s.tCell,
                                { width: widths[ci] },
                                ci > 0 ? s.tCellCenter : {},
                                ci === cells.length - 1 ? { borderRightWidth: 0 } : {},
                            ]}
                        >
                            {cell}
                        </Text>
                    ))}
                </View>
            ))}
            {totalRow && (
                <View style={s.totalRow} wrap={false}>
                    {totalRow.map((cell, ci) => (
                        <Text
                            key={ci}
                            style={[
                                s.tCell,
                                s.tCellBold,
                                { width: widths[ci] },
                                ci > 0 ? s.tCellCenter : {},
                                ci === totalRow.length - 1 ? { borderRightWidth: 0 } : {},
                            ]}
                        >
                            {cell}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
}

function OfficeBreakdownTable({
    title,
    rows,
}: {
    title: string;
    rows: { label: string; po: number; ccnts: number; ptc: number }[];
}) {
    const totals = rows.reduce(
        (acc, r) => ({
            po: acc.po + r.po,
            ccnts: acc.ccnts + r.ccnts,
            ptc: acc.ptc + r.ptc,
        }),
        { po: 0, ccnts: 0, ptc: 0 }
    );

    const w = ["37%", "21%", "21%", "21%"];

    return (
        <View>
            <Text style={s.cardTitle}>{title}</Text>
            <View style={s.table}>
                <View style={s.tHeadRow}>
                    {["", "PO", "CCNTS", "PTC"].map((h, i) => (
                        <Text
                            key={i}
                            style={[
                                s.tHeadCell,
                                { width: w[i] },
                                i > 0 ? s.tCellCenter : {},
                                i === 3 ? { borderRightWidth: 0 } : {},
                            ]}
                        >
                            {h}
                        </Text>
                    ))}
                </View>
                {rows.map((r, ri) => (
                    <View
                        key={ri}
                        style={[s.tRow, ri % 2 === 1 ? s.tRowAlt : {}]}
                        wrap={false}
                    >
                        <Text style={[s.tCell, { width: w[0] }]}>{r.label}</Text>
                        <Text
                            style={[
                                s.tCell,
                                s.tCellCenter,
                                { width: w[1] },
                            ]}
                        >
                            {r.po}
                        </Text>
                        <Text
                            style={[
                                s.tCell,
                                s.tCellCenter,
                                { width: w[2] },
                            ]}
                        >
                            {r.ccnts}
                        </Text>
                        <Text
                            style={[
                                s.tCell,
                                s.tCellCenter,
                                { width: w[3], borderRightWidth: 0 },
                            ]}
                        >
                            {r.ptc}
                        </Text>
                    </View>
                ))}
                {/* Totals row */}
                <View style={s.totalRow} wrap={false}>
                    <Text style={[s.tCell, s.tCellBold, { width: w[0] }]}>Total</Text>
                    <Text
                        style={[s.tCell, s.tCellCenter, s.tCellBold, { width: w[1] }]}
                    >
                        {totals.po}
                    </Text>
                    <Text
                        style={[s.tCell, s.tCellCenter, s.tCellBold, { width: w[2] }]}
                    >
                        {totals.ccnts}
                    </Text>
                    <Text
                        style={[
                            s.tCell,
                            s.tCellCenter,
                            s.tCellBold,
                            { width: w[3], borderRightWidth: 0 },
                        ]}
                    >
                        {totals.ptc}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Section Component ───────────────────────────────────────────────────────

function ReportSection({
    label,
    headers,
    widths,
    rows,
    totalRow,
}: {
    label: string;
    headers: string[];
    widths: string[];
    rows: string[][];
    totalRow?: string[];
}) {
    return (
        <View style={s.sectionWrap} minPresenceAhead={60}>
            <Text style={s.sectionLabel}>{label}</Text>
            <DataTable headers={headers} widths={widths} rows={rows} totalRow={totalRow} />
        </View>
    );
}

// ─── Main PDF Document ───────────────────────────────────────────────────────

export default function PDFReport({
    reportMetadata,
    totalResponses,
    reportPeriodLabel,
    adminAnalysis,
    officeResponseData,
    genderData,
    ageData,
    customerTypeData,
    transactionData,
    natureData,
    serviceData,
    ccData,
    ccOfficeData,
    actionData,
    sqdResults,
    sqdOfficeData,
}: PDFReportProps) {
    // Shared column widths for standard 5-col tables
    const w5 = ["32%", "17%", "17%", "17%", "17%"];
    const w2 = ["60%", "40%"];

    // Transform helpers
    const toRows5 = (data: any[]) =>
        data.map((r: any) => [
            String(r.name ?? ""),
            String(r.responses ?? 0),
            String(r.internal ?? 0),
            String(r.external ?? 0),
            String(r.percentage ?? "0%"),
        ]);

    const toTotal5 = (data: any[]): string[] => {
        const totR = data.reduce((s, r) => s + Number(r.responses ?? 0), 0);
        const totI = data.reduce((s, r) => s + Number(r.internal ?? 0), 0);
        const totE = data.reduce((s, r) => s + Number(r.external ?? 0), 0);
        const pct = totalResponses > 0 ? ((totR / totalResponses) * 100).toFixed(2) + "%" : "0%";
        return ["Total", String(totR), String(totI), String(totE), pct];
    };

    const toRows5Rating = (data: any[]) =>
        data.map((r: any) => [
            String(r.name ?? ""),
            String(r.responses ?? 0),
            String(r.internal ?? 0),
            String(r.external ?? 0),
            String(r.rating ?? "N/A"),
        ]);

    const toTotal5Rating = (data: any[]): string[] => {
        const totR = data.reduce((s, r) => s + Number(r.responses ?? 0), 0);
        const totI = data.reduce((s, r) => s + Number(r.internal ?? 0), 0);
        const totE = data.reduce((s, r) => s + Number(r.external ?? 0), 0);
        const ratings = data.filter((r: any) => r.rating !== "N/A" && r.rating != null).map((r: any) => Number(r.rating));
        const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2) : "N/A";
        return ["Total", String(totR), String(totI), String(totE), avgRating];
    };

    const toRows2 = (data: any[]) =>
        data.map((r: any) => [
            String(r.name ?? ""),
            String(r.responses ?? 0),
        ]);

    const toTotal2 = (data: any[]): string[] => {
        const totR = data.reduce((s, r) => s + Number(r.responses ?? 0), 0);
        return ["Total", String(totR)];
    };

    // CC rows
    const makeCcRows = (ccKey: "cc1" | "cc2" | "cc3") =>
        Object.keys(ccData[ccKey]).map((k) => [
            ccOptionLabels[ccKey]?.[k] || k,
            String(ccData[ccKey][k] ?? 0),
            ((ccData[ccKey][k] / totalResponses) * 100 || 0).toFixed(1) + "%",
        ]);

    const makeCcTotalRow = (ccKey: "cc1" | "cc2" | "cc3"): string[] => {
        const totR = Object.values(ccData[ccKey]).reduce((s: number, v: any) => s + Number(v ?? 0), 0);
        return ["Total", String(totR), "100%"];
    };

    const makeCcOfficeRows = (ccKey: "cc1" | "cc2" | "cc3") =>
        Object.keys(ccData[ccKey]).map((k) => ({
            label: k,
            po: Number(ccOfficeData?.[ccKey]?.[k]?.po || 0),
            ccnts: Number(ccOfficeData?.[ccKey]?.[k]?.ccnts || 0),
            ptc: Number(ccOfficeData?.[ccKey]?.[k]?.ptc || 0),
        }));

    // SQD rows
    const sqdKeys = Object.keys(sqdResults || {});
    const sqdRows = sqdKeys.map((k) => [
        k.toUpperCase(),
        String(sqdResults[k]["Strongly Agree"] ?? 0),
        String(sqdResults[k]["Agree"] ?? 0),
        String(sqdResults[k]["Neither Agree nor Disagree"] ?? 0),
        String(sqdResults[k]["Disagree"] ?? 0),
        String(sqdResults[k]["Strongly Disagree"] ?? 0),
        String(sqdResults[k]["N/A"] ?? 0),
    ]);

    const sqdOfficeRows = sqdKeys.map((k) => ({
        label: k.toUpperCase(),
        po: Number(sqdOfficeData?.[k]?.po || 0),
        ccnts: Number(sqdOfficeData?.[k]?.ccnts || 0),
        ptc: Number(sqdOfficeData?.[k]?.ptc || 0),
    }));

    const officeTotalRows = [
        {
            label: "All Responses",
            po: Number(
                officeResponseData.find((x: any) => x.name === "PO")?.responses || 0
            ),
            ccnts: Number(
                officeResponseData.find((x: any) => x.name === "CCNTS")?.responses || 0
            ),
            ptc: Number(
                officeResponseData.find((x: any) => x.name === "PTC")?.responses || 0
            ),
        },
    ];

    const generatedDate = new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Document>
            <Page size="A4" orientation="portrait" style={s.page} wrap>
                {/* ── Fixed Header ── */}
                <View style={s.headerFixed}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                        <Image src="/tesda-logo.png" style={s.logo} />
                        <View style={s.headerTextBlock}>
                            <Text style={s.headerTitle}>
                                SUMMARY FEEDBACK REPORT GATHERED THROUGH FACE TO FACE AND ONLINE
                                TRANSACTIONS
                            </Text>
                            <Text style={s.headerSubtitle}>(CSM Questionnaire)</Text>
                            <Text style={s.headerMeta}>
                                For the month of: {reportPeriodLabel} &nbsp;|&nbsp; Total
                                Responses: {totalResponses}
                            </Text>
                        </View>
                    </View>

                    {reportMetadata && (
                        <View style={s.metaContainer}>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>Region / Exec. Office:</Text>
                                <Text style={s.metaValue}>{reportMetadata.regionExecutive || ""}</Text>
                            </View>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>Head of Operating Unit:</Text>
                                <Text style={s.metaValue}>{reportMetadata.headOfUnit || ""}</Text>
                            </View>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>Province / Dist. Office:</Text>
                                <Text style={s.metaValue}>{reportMetadata.provinceDistrict || ""}</Text>
                            </View>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>Designation / Position:</Text>
                                <Text style={s.metaValue}>{reportMetadata.designation || ""}</Text>
                            </View>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>Operating Unit:</Text>
                                <Text style={s.metaValue}>{reportMetadata.operatingUnit || ""}</Text>
                            </View>
                            <View style={s.metaItem}>
                                <Text style={s.metaLabel}>CUSAT Focal:</Text>
                                <Text style={s.metaValue}>{reportMetadata.cusatFocal || ""}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Fixed Footer ── */}
                <View style={s.footerFixed} fixed>
                    <Text>Generated on {generatedDate}</Text>
                    <Text
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>

                {/* ─── A. Gender ─── */}
                <ReportSection
                    label="A. Total Number of Customers Served by Gender"
                    headers={["Sex", "Responses", "Internal", "External", "%"]}
                    widths={w5}
                    rows={toRows5(genderData)}
                    totalRow={toTotal5(genderData)}
                />

                {/* ─── B. Age Group ─── */}
                <ReportSection
                    label="B. Distribution of Customers Served by Age Group"
                    headers={["Age Group", "Responses", "Internal", "External", "%"]}
                    widths={w5}
                    rows={toRows5(ageData)}
                    totalRow={toTotal5(ageData)}
                />

                {/* ─── C. Customer Type ─── */}
                <ReportSection
                    label="C. Total Number of Customers by Customer Type"
                    headers={["Customer Type", "Responses", "Internal", "External", "%"]}
                    widths={w5}
                    rows={toRows5(customerTypeData)}
                    totalRow={toTotal5(customerTypeData)}
                />

                {/* ─── D. Transaction Type ─── */}
                <ReportSection
                    label="D. Type of Transaction per Programs and Services"
                    headers={["Type of Transaction", "Responses", "Internal", "External", "%"]}
                    widths={w5}
                    rows={toRows5(transactionData)}
                    totalRow={toTotal5(transactionData)}
                />

                {/* ─── E. Nature of Transaction ─── */}
                <ReportSection
                    label="E. Nature of Transaction"
                    headers={["Nature of Transaction", "Total Transactions"]}
                    widths={w2}
                    rows={toRows2(natureData)}
                    totalRow={toTotal2(natureData)}
                />

                {/* ─── F. Service Rendered ─── */}
                <ReportSection
                    label="F. Service Rendered based on Citizens Charter Offered"
                    headers={["Service Offered", "Responses", "Internal", "External", "Rating"]}
                    widths={w5}
                    rows={toRows5Rating(serviceData)}
                    totalRow={toTotal5Rating(serviceData)}
                />

                {/* ─── G. Citizen's Charter ─── */}
                <View style={s.sectionWrap} minPresenceAhead={60}>
                    <Text style={s.sectionLabel}>
                        G. Citizen&apos;s Charter Questions
                    </Text>
                    {/* CC1 */}
                    <Text style={[s.cardTitle, { marginBottom: 2 }]}>
                        CC1. Awareness of CC
                    </Text>
                    <DataTable
                        headers={["Question", "Responses", "%"]}
                        widths={["60%", "20%", "20%"]}
                        rows={makeCcRows("cc1")}
                        totalRow={makeCcTotalRow("cc1")}
                    />
                    {/* CC2 */}
                    <Text style={[s.cardTitle, { marginTop: 6, marginBottom: 2 }]}>
                        CC2. Visibility of CC
                    </Text>
                    <DataTable
                        headers={["Question", "Responses", "%"]}
                        widths={["60%", "20%", "20%"]}
                        rows={makeCcRows("cc2")}
                        totalRow={makeCcTotalRow("cc2")}
                    />
                    {/* CC3 */}
                    <Text style={[s.cardTitle, { marginTop: 6, marginBottom: 2 }]}>
                        CC3. Helpfulness of CC
                    </Text>
                    <DataTable
                        headers={["Question", "Responses", "%"]}
                        widths={["60%", "20%", "20%"]}
                        rows={makeCcRows("cc3")}
                        totalRow={makeCcTotalRow("cc3")}
                    />
                </View>

                {/* ─── H. Action Provided ─── */}
                <ReportSection
                    label="H. Action Provided Relative to Purpose"
                    headers={["Action Provided", "No. of Responses"]}
                    widths={w2}
                    rows={toRows2(actionData)}
                    totalRow={toTotal2(actionData)}
                />

                {/* ─── I. SQD Results ─── */}
                <View style={s.sectionWrap} minPresenceAhead={60}>
                    <Text style={s.sectionLabel}>
                        I. Service Quality Dimensions (SQD) Results
                    </Text>
                    <DataTable
                        headers={[
                            "Dimension",
                            "Strongly Agree",
                            "Agree",
                            "N.A.N.D.",
                            "Disagree",
                            "Strongly Disagree",
                            "N/A",
                        ]}
                        widths={["22%", "13%", "13%", "13%", "13%", "13%", "13%"]}
                        rows={sqdRows}
                    />
                </View>

                {/* ─── J. Admin Analysis ─── */}
                <View style={s.sectionWrap} minPresenceAhead={40}>
                    <Text style={s.sectionLabel}>J.Analysis and Findings</Text>
                    <View style={s.analysisBox}>
                        <Text style={s.analysisText}>
                            {adminAnalysis?.trim()
                                ? adminAnalysis
                                : "No analysis input provided by admin for this period."}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
