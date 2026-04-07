"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Activity, FileText, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";

interface DashboardTablesProps {
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

export default function DashboardTables({
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
    sqdOfficeData
}: DashboardTablesProps) {

    const renderTable = (data: any[], headers: string[], cols: string[]) => (
        <Table className="print:text-[10px]">
            <TableHeader className="bg-slate-100">
                <TableRow>
                    {headers.map(h => <TableHead key={h} className="text-slate-700 font-semibold print:h-auto print:px-1 print:py-0.5 print:whitespace-normal print:break-words print:leading-tight">{h}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i}>
                        {cols.map(c => <TableCell key={c} className="font-medium text-slate-600 print:px-1 print:py-0.5 print:whitespace-normal print:break-words print:leading-tight">{row[c]}</TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderCcTable = (data: any[], title: string) => (
        <Table className="table-fixed print:text-[10px]">
            <TableHeader className="bg-slate-100">
                <TableRow>
                    <TableHead className="w-[68%] text-slate-700 font-semibold print:h-auto print:px-1 print:py-0.5 print:whitespace-normal print:break-words print:leading-tight">{title}</TableHead>
                    <TableHead className="w-[16%] text-slate-700 font-semibold text-center print:h-auto print:px-1 print:py-0.5">Responses</TableHead>
                    <TableHead className="w-[16%] text-slate-700 font-semibold text-center print:h-auto print:px-1 print:py-0.5">Percentage</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i}>
                        <TableCell className="font-medium text-slate-600 print:px-1 print:py-0.5 print:whitespace-normal print:break-words print:leading-tight">{row.name}</TableCell>
                        <TableCell className="text-center print:px-1 print:py-0.5">{row.count}</TableCell>
                        <TableCell className="text-center print:px-1 print:py-0.5">{row.perc}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const toOfficeRows = (data: any[], rowName = "name") => data.map((row) => ({
        label: row[rowName] ?? "",
        po: Number(row.po || 0),
        ccnts: Number(row.ccnts || 0),
        ptc: Number(row.ptc || 0),
    }));

    const renderOfficeResponseCard = (rows: Array<{ label: string; po: number; ccnts: number; ptc: number }>) => {
        const totals = rows.reduce(
            (acc, row) => ({ po: acc.po + row.po, ccnts: acc.ccnts + row.ccnts, ptc: acc.ptc + row.ptc }),
            { po: 0, ccnts: 0, ptc: 0 }
        );

        return (
            <Card className="shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                <CardHeader className="print:px-1.5 print:py-0.5">
                    <CardTitle className="text-base text-slate-700 print:text-sm print:text-black">No. of Response</CardTitle>
                </CardHeader>
                <CardContent className="print:p-0">
                    <Table className="print:text-[10px]">
                        <TableHeader className="bg-slate-100">
                            <TableRow>
                                <TableHead className="w-[22%] print:h-auto print:px-1 print:py-0.5"></TableHead>
                                <TableHead className="print:h-auto print:px-1 print:py-0.5">PO</TableHead>
                                <TableHead className="print:h-auto print:px-1 print:py-0.5">CCNTS</TableHead>
                                <TableHead className="print:h-auto print:px-1 print:py-0.5">PTC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, i) => (
                                <TableRow key={`${row.label}-${i}`}>
                                    <TableCell className="print:px-1 print:py-0.5"></TableCell>
                                    <TableCell className="print:px-1 print:py-0.5">{row.po}</TableCell>
                                    <TableCell className="print:px-1 print:py-0.5">{row.ccnts}</TableCell>
                                    <TableCell className="print:px-1 print:py-0.5">{row.ptc}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-slate-50 font-semibold">
                                <TableCell className="print:px-1 print:py-0.5">Total</TableCell>
                                <TableCell className="print:px-1 print:py-0.5">{totals.po}</TableCell>
                                <TableCell className="print:px-1 print:py-0.5">{totals.ccnts}</TableCell>
                                <TableCell className="print:px-1 print:py-0.5">{totals.ptc}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    };

    const officeTotalRows = [
        {
            label: "All Responses",
            po: Number(officeResponseData.find((x: any) => x.name === "PO")?.responses || 0),
            ccnts: Number(officeResponseData.find((x: any) => x.name === "CCNTS")?.responses || 0),
            ptc: Number(officeResponseData.find((x: any) => x.name === "PTC")?.responses || 0),
        },
    ];

    const cc1Rows = Object.keys(ccData.cc1).map((k) => ({
        label: k,
        po: Number(ccOfficeData?.cc1?.[k]?.po || 0),
        ccnts: Number(ccOfficeData?.cc1?.[k]?.ccnts || 0),
        ptc: Number(ccOfficeData?.cc1?.[k]?.ptc || 0),
    }));
    const cc2Rows = Object.keys(ccData.cc2).map((k) => ({
        label: k,
        po: Number(ccOfficeData?.cc2?.[k]?.po || 0),
        ccnts: Number(ccOfficeData?.cc2?.[k]?.ccnts || 0),
        ptc: Number(ccOfficeData?.cc2?.[k]?.ptc || 0),
    }));
    const cc3Rows = Object.keys(ccData.cc3).map((k) => ({
        label: k,
        po: Number(ccOfficeData?.cc3?.[k]?.po || 0),
        ccnts: Number(ccOfficeData?.cc3?.[k]?.ccnts || 0),
        ptc: Number(ccOfficeData?.cc3?.[k]?.ptc || 0),
    }));

    const sqdOfficeRows = Object.keys(sqdResults).map((k) => ({
        label: k.toUpperCase(),
        po: Number(sqdOfficeData?.[k]?.po || 0),
        ccnts: Number(sqdOfficeData?.[k]?.ccnts || 0),
        ptc: Number(sqdOfficeData?.[k]?.ptc || 0),
    }));

    const ccOptionLabels = {
        cc1: {
            "1": "I know what a CC is and I saw this office's CC",
            "2": "I know what a CC is but I did not see this office's CC",
            "3": "I learned of the CC only when I saw this office's CC",
            "4": "I do not know what a CC is and I did not see one in this office",
            "N/A": "N/A"
        },
        cc2: {
            "1": "Easy to see",
            "2": "Somewhat easy to see",
            "3": "Difficult to see",
            "4": "Not visible at all",
            "5": "N/A",
            "N/A": "N/A"
        },
        cc3: {
            "1": "Helped very much",
            "2": "Somewhat helped",
            "3": "Did not help",
            "4": "N/A",
            "N/A": "N/A"
        }
    };

    return (
        <div className="space-y-8 print:space-y-2 print:text-[10px]">
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-lg print:text-base font-bold leading-tight">SUMMARY FEEDBACK REPORT GATHERED THROUGH FACE TO FACE AND ONLINE TRANSACTIONS</h1>
                <p className="text-base print:text-sm font-semibold">(CSM Questionnaire)</p>
                <p className="text-sm print:text-xs">For the month of: {reportPeriodLabel}</p>
                <p className="text-xs mt-1">Total Responses: {totalResponses}</p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-blue-600 print:text-black">
                            <Users className="w-5 h-5 print:hidden" /> A. Total Number of Customers Served by Gender
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(genderData, ["Sex", "No. of Responses", "Internal", "External", "Percentage"], ["name", "responses", "internal", "external", "percentage"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(genderData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-indigo-600 print:text-black">
                            <Activity className="w-5 h-5 print:hidden" /> B. Distribution of Customers Served by Age Group
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(ageData, ["Age Group", "No. of Responses", "Internal", "External", "Percentage"], ["name", "responses", "internal", "external", "percentage"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(ageData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-emerald-600 print:text-black">
                            <Users className="w-5 h-5 print:hidden" /> C. Total Number of Customers by Customer Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(customerTypeData, ["Customer Type", "No. of Responses", "Internal", "External", "Percentage"], ["name", "responses", "internal", "external", "percentage"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(customerTypeData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-rose-600 print:text-black">
                            <FileText className="w-5 h-5 print:hidden" /> D. Type of Transaction per Programs and Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(transactionData, ["Type of Transaction", "No. of Responses", "Internal", "External", "Percentage"], ["name", "responses", "internal", "external", "percentage"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(transactionData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-amber-600 print:text-black">
                            <HelpCircle className="w-5 h-5 print:hidden" /> E. Nature of Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(natureData, ["Nature of Transaction", "Total Transactions"], ["name", "responses"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(natureData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-purple-600 print:text-black">
                            <TrendingUp className="w-5 h-5 print:hidden" /> F. Service Rendered based on Citizens Charter Offered
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(serviceData, ["Service Offered", "No. of Responses", "Internal", "External", "Overall Rating"], ["name", "responses", "internal", "external", "rating"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(serviceData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1 print:break-inside-avoid">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-cyan-600 print:text-black">
                            <Activity className="w-5 h-5 print:hidden" /> G. Citizen's Charter Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        <div className="space-y-6 print:space-y-3">
                            {renderCcTable(Object.keys(ccData.cc1).map(k => ({ name: ccOptionLabels.cc1[k as keyof typeof ccOptionLabels.cc1] || k, count: ccData.cc1[k], perc: ((ccData.cc1[k] / totalResponses) * 100 || 0).toFixed(1) + "%" })), "CC1. Awareness of CC")}
                            {renderCcTable(Object.keys(ccData.cc2).map(k => ({ name: ccOptionLabels.cc2[k as keyof typeof ccOptionLabels.cc2] || k, count: ccData.cc2[k], perc: ((ccData.cc2[k] / totalResponses) * 100 || 0).toFixed(1) + "%" })), "CC2. Visibility of CC")}
                            {renderCcTable(Object.keys(ccData.cc3).map(k => ({ name: ccOptionLabels.cc3[k as keyof typeof ccOptionLabels.cc3] || k, count: ccData.cc3[k], perc: ((ccData.cc3[k] / totalResponses) * 100 || 0).toFixed(1) + "%" })), "CC3. Helpfulness of CC")}
                        </div>
                    </CardContent>
                </Card>
                <div className="space-y-4 print:space-y-1">
                    {renderOfficeResponseCard(cc1Rows)}
                    {renderOfficeResponseCard(cc2Rows)}
                    {renderOfficeResponseCard(cc3Rows)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-teal-600 print:text-black">
                            <CheckCircle2 className="w-5 h-5 print:hidden" /> H. Action Provided Relative to Purpose
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {renderTable(actionData, ["Action Provided", "No. of Responses"], ["name", "responses"])}
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(toOfficeRows(actionData))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-[2.2fr_1fr] print:items-start print:gap-1">
                <Card className="lg:col-span-2 print:col-span-1 shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:gap-1 print:py-0.5">
                    <CardHeader className="print:px-1.5 print:py-0.5">
                        <CardTitle className="text-lg print:text-base flex items-center gap-2 text-orange-500 print:text-black">
                            <TrendingUp className="w-5 h-5 print:hidden" /> I. Service Quality Dimensions (SQD) Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto print:overflow-visible print:p-0">
                        <Table className="print:text-[10px]">
                            <TableHeader className="bg-slate-100">
                                <TableRow>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">Dimension</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">Strongly Agree</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">Agree</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">N.A.N.D.</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">Disagree</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">Strongly Disagree</TableHead>
                                    <TableHead className="print:h-auto print:px-1 print:py-0.5">N/A</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(sqdResults).map(k => (
                                    <TableRow key={k}>
                                        <TableCell className="font-bold text-slate-700 print:px-1 print:py-0.5">{k.toUpperCase()}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["Strongly Agree"]}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["Agree"]}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["Neither Agree nor Disagree"]}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["Disagree"]}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["Strongly Disagree"]}</TableCell>
                                        <TableCell className="print:px-1 print:py-0.5">{sqdResults[k]["N/A"]}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                {renderOfficeResponseCard(sqdOfficeRows.length > 0 ? sqdOfficeRows : officeTotalRows)}
            </div>

            <Card className="shadow-md border-0 ring-1 ring-slate-100 print:shadow-none print:ring-0 print:break-inside-avoid print:gap-1 print:py-0.5">
                <CardHeader className="print:px-1.5 print:py-0.5">
                    <CardTitle className="text-lg print:text-base flex items-center gap-2 text-slate-700 print:text-black">
                        <FileText className="w-5 h-5 print:hidden" /> J.Analysis and Findings
                    </CardTitle>
                </CardHeader>
                <CardContent className="print:px-1.5 print:py-0.5">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed print:text-[10px] print:leading-tight">
                        {adminAnalysis?.trim() ? adminAnalysis : "No analysis input provided by admin for this period."}
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}
