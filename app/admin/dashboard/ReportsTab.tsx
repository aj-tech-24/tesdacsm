"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ArrowRight,
    ChevronLeft,
    Database,
    FileBarChart2,
    FileText,
    Printer,
    MessageSquareText,
    MonitorCheck,
    ShieldAlert,
    Users,
} from "lucide-react";

interface ReportsTabProps {
    reportPeriodLabel: string;
    reportMetadata?: any;
    totalResponses: number;
    officeResponseData: any[];
    serviceData: any[];
    transactionData: any[];
    genderData: any[];
    ageData: any[];
    allFeedbackRaw: any[];
}

type ReportItem = {
    id: number;
    title: string;
    shortLabel: string;
    summary: string;
    sectionLabel: string;
    icon: ComponentType<{ className?: string }>;
    optional?: boolean;
};

const reportItems: ReportItem[] = [
    {
        id: 1,
        title: "Monitoring Report of Customer Feedback Form Results",
        shortLabel: "Feedback Monitoring",
        summary: "Tracks response count, status, and distribution of submitted customer feedback forms.",
        sectionLabel: "Feedback Snapshot",
        icon: MonitorCheck,
    },
    {
        id: 2,
        title: "Summary of Customers Served per Declared Services in the Citizens Charter",
        shortLabel: "Citizens Charter Service Summary",
        summary: "Summarizes customers served across declared services in the Citizens Charter.",
        sectionLabel: "Declared Service Breakdown",
        icon: Users,
    },
    {
        id: 3,
        title: "Summary Feedback Report Gathered Through Face to Face and Online Transactions",
        shortLabel: "Face-to-Face and Online Summary",
        summary: "Consolidates CSM feedback from face-to-face and online channels into one report.",
        sectionLabel: "Transaction Channel Perspective",
        icon: FileBarChart2,
    },
    {
        id: 4,
        title: "Monitoring of Customers Served",
        shortLabel: "Customers Served Monitoring",
        summary: "Monitors customer volume by age groups and sex for quick operational tracking.",
        sectionLabel: "Customer Volume Monitoring",
        icon: Users,
    },
    {
        id: 5,
        title: "Summary of Customer Comments",
        shortLabel: "Customer Comments Summary",
        summary: "Groups customer comments into themes and shows recent feedback statements.",
        sectionLabel: "Comment Insights",
        icon: MessageSquareText,
    },
    {
        id: 6,
        title: "Monitoring of Complaints Received",
        shortLabel: "Complaints Monitoring",
        summary: "Prepares complaint-related feedback for 8888 ticket handling and escalation.",
        sectionLabel: "Complaint Tracking",
        optional: true,
        icon: ShieldAlert,
    },
];

const toNumber = (value: unknown) => Number(value || 0);

const pct = (value: number, total: number) => {
    if (!total) return "0.0%";
    return `${((value / total) * 100).toFixed(1)}%`;
};

const getCommentText = (row: any) => {
    return String(
        row?.suggestions ||
            row?.suggestion ||
            row?.comments ||
            row?.comment ||
            row?.feedback ||
            row?.remarks ||
            "",
    ).trim();
};

const shortDate = (value: any) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const extractComplaintNature = (text: string) => {
    if (!text) return "";
    const lower = text.toLowerCase();
    if (["delay", "late", "slow"].some((k) => lower.includes(k))) return "Delay";
    if (["rude", "attitude", "respect"].some((k) => lower.includes(k))) return "Personnel Conduct";
    if (["system", "error", "issue", "problem"].some((k) => lower.includes(k))) return "Process/Technical";
    if (["complaint", "complain", "8888"].some((k) => lower.includes(k))) return "Complaint";
    return "";
};

function EmptyRow({ message, colSpan }: { message: string; colSpan: number }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="py-6 text-center text-xs text-slate-500">
                {message}
            </TableCell>
        </TableRow>
    );
}

function ReportOneTable({
    allFeedbackRaw,
    reportPeriodLabel,
    reportMetadata,
}: {
    allFeedbackRaw: any[];
    reportPeriodLabel: string;
    reportMetadata?: any;
}) {
    const [viewMode, setViewMode] = useState<"list" | "printable">("list");
    const [month, setMonth] = useState("all");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const years = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));

    const filteredRaw = useMemo(() => {
        const parsedMonth = Number(month);
        return allFeedbackRaw.filter((row) => {
            const dateValue = row?.createdAt || row?.formDate;
            if (!dateValue) return false;
            const d = new Date(dateValue);
            if (Number.isNaN(d.getTime())) return false;

            const yearMatch = String(d.getFullYear()) === year;
            const monthMatch = month === "all" ? true : d.getMonth() + 1 === parsedMonth;
            return yearMatch && monthMatch;
        });
    }, [allFeedbackRaw, month, year]);

    const totalPages = Math.max(1, Math.ceil(filteredRaw.length / pageSize));
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRaw.slice(start, start + pageSize);
    }, [filteredRaw, page]);

    const rows = filteredRaw.slice(0, 14).map((row, index) => {
        const createdAt = row?.createdAt || row?.formDate;
        const dateResolved = row?.dateResolved;
        const dayDiff = createdAt && dateResolved
            ? Math.max(0, Math.ceil((new Date(dateResolved).getTime() - new Date(createdAt).getTime()) / 86400000))
            : "";

        return {
            no: String(index + 1),
            date: shortDate(createdAt),
            controlNumber: row?.controlNumber || "",
            clientName: row?.name || "",
            clientType: row?.clientType || "",
            age: row?.age || "",
            gender: row?.sex || "",
            email: row?.email || "",
            officeVisited: row?.office || "",
            ccService: row?.citizensCharterService || "",
            externalInternal: row?.serviceCategory || "",
            typeOfTransaction: row?.transactionTypes || "",
            actionProvided: row?.actionProvided || "",
            dateResolve: shortDate(dateResolved),
            daysToResolution: dayDiff,
            cc1: row?.cc1 || "",
            cc2: row?.cc2 || "",
            cc3: row?.cc3 || "",
            sqd0: row?.sqd0 || "",
            sqd1: row?.sqd1 || "",
            sqd2: row?.sqd2 || "",
            sqd3: row?.sqd3 || "",
            sqd4: row?.sqd4 || "",
            sqd5: row?.sqd5 || "",
            sqd6: row?.sqd6 || "",
            sqd7: row?.sqd7 || "",
            sqd8: row?.sqd8 || "",
            citizenComment: row?.suggestions || "",
            actionTaken: row?.actionProvided || "",
            complaintNature: extractComplaintNature(getCommentText(row)),
        };
    });

    while (rows.length < 14) {
        rows.push({
            no: "",
            date: "",
            controlNumber: "",
            clientName: "",
            clientType: "",
            age: "",
            gender: "",
            email: "",
            officeVisited: "",
            ccService: "",
            externalInternal: "",
            typeOfTransaction: "",
            actionProvided: "",
            dateResolve: "",
            daysToResolution: "",
            cc1: "",
            cc2: "",
            cc3: "",
            sqd0: "",
            sqd1: "",
            sqd2: "",
            sqd3: "",
            sqd4: "",
            sqd5: "",
            sqd6: "",
            sqd7: "",
            sqd8: "",
            citizenComment: "",
            actionTaken: "",
            complaintNature: "",
        });
    }

    if (viewMode === "list") {
        return (
            <div className="space-y-4 print:hidden">
                <Card className="shadow-md border-0 ring-1 ring-slate-100">
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <Database className="w-6 h-6 text-blue-600" />
                                    Report 1 Data View
                                </CardTitle>
                                <CardDescription>
                                    Month-filterable record list used as the source for Monitoring Report printable template.
                                </CardDescription>
                            </div>
                            <Button onClick={() => setViewMode("printable")} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Printer className="w-4 h-4" /> Open Printable Template
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <Select value={month} onValueChange={(val) => { setMonth(val); setPage(1); }}>
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    <SelectItem value="1">January</SelectItem>
                                    <SelectItem value="2">February</SelectItem>
                                    <SelectItem value="3">March</SelectItem>
                                    <SelectItem value="4">April</SelectItem>
                                    <SelectItem value="5">May</SelectItem>
                                    <SelectItem value="6">June</SelectItem>
                                    <SelectItem value="7">July</SelectItem>
                                    <SelectItem value="8">August</SelectItem>
                                    <SelectItem value="9">September</SelectItem>
                                    <SelectItem value="10">October</SelectItem>
                                    <SelectItem value="11">November</SelectItem>
                                    <SelectItem value="12">December</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={year} onValueChange={(val) => { setYear(val); setPage(1); }}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Badge variant="outline" className="ml-auto">
                                {filteredRaw.length} matching records
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Control No.</TableHead>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Office</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Action Provided</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRows.length === 0 && <EmptyRow colSpan={7} message="No records found for selected month/year." />}
                                {paginatedRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium text-slate-700">{row.id}</TableCell>
                                        <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString("en-PH") : ""}</TableCell>
                                        <TableCell>{row.controlNumber || ""}</TableCell>
                                        <TableCell>{row.name || "Anonymous"}</TableCell>
                                        <TableCell>{row.office || ""}</TableCell>
                                        <TableCell className="max-w-[260px] truncate" title={row.citizensCharterService || ""}>
                                            {row.citizensCharterService || ""}
                                        </TableCell>
                                        <TableCell className="max-w-[240px] truncate" title={row.actionProvided || ""}>
                                            {row.actionProvided || ""}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Showing {filteredRaw.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRaw.length)} of {filteredRaw.length} entries
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                Next
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print Template
                </Button>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                    Back To List View
                </Button>
            </div>
            <div className="overflow-x-auto bg-white p-2">
            <div className="report1-sheet inline-block border border-slate-500 text-[9px] text-black">
                <div className="grid grid-cols-3 gap-2 border-b border-slate-500 p-2">
                    <div className="leading-tight">
                        <p>Region/Executive Office: <span className="font-semibold">{reportMetadata?.regionExecutive || "Name of Regional Office"}</span></p>
                        <p>Province / District Office: <span className="font-semibold">{reportMetadata?.provinceDistrict || "Name of Provincial Office"}</span></p>
                        <p>Period Covered: <span className="font-semibold">{reportPeriodLabel}</span></p>
                    </div>
                    <div className="col-span-2 text-center font-bold leading-tight">
                        <p className="text-[11px]">Monitoring Report of Customer Feedback Form Results</p>
                        <p>(Face-to-Face and Online)</p>
                    </div>
                </div>

                <table className="inline-table w-auto border-collapse table-fixed report1-print-table">
                    <colgroup>
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "44px" }} />
                        <col style={{ width: "86px" }} />
                        <col style={{ width: "68px" }} />
                        <col style={{ width: "68px" }} />
                        <col style={{ width: "28px" }} />
                        <col style={{ width: "38px" }} />
                        <col style={{ width: "88px" }} />
                        <col style={{ width: "52px" }} />
                        <col style={{ width: "88px" }} />
                        <col style={{ width: "34px" }} />
                        <col style={{ width: "50px" }} />
                        <col style={{ width: "40px" }} />
                        <col style={{ width: "44px" }} />
                        <col style={{ width: "44px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "20px" }} />
                        <col style={{ width: "60px" }} />
                        <col style={{ width: "60px" }} />
                        <col style={{ width: "30px" }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-cyan-100 text-center font-semibold">
                            <th className="border border-slate-500 px-1 py-1" colSpan={15}>CONTACT CENTER UNIT</th>
                            <th className="border border-slate-500 px-1 py-1" colSpan={3}>Citizens Charter Score</th>
                            <th className="border border-slate-500 px-1 py-1" colSpan={9}>Service Quality Dimension</th>
                            <th className="border border-slate-500 px-1 py-1" rowSpan={2}>Citizens Comment</th>
                            <th className="border border-slate-500 px-1 py-1" rowSpan={2}>Action Taken if any</th>
                            <th className="border border-slate-500 px-1 py-1" rowSpan={2}>Nature of Transaction (inquiry/Complaint)</th>
                        </tr>
                        <tr className="bg-cyan-50 text-center">
                            <th className="border border-slate-500 px-1 py-1">No.</th>
                            <th className="border border-slate-500 px-1 py-1">Date</th>
                            <th className="border border-slate-500 px-1 py-1">Control Number</th>
                            <th className="border border-slate-500 px-1 py-1">Client&apos;s Name and Contact Details</th>
                            <th className="border border-slate-500 px-1 py-1">Client Type (Citizen/Business/Government)</th>
                            <th className="border border-slate-500 px-1 py-1">Age</th>
                            <th className="border border-slate-500 px-1 py-1">Gender</th>
                            <th className="border border-slate-500 px-1 py-1">Email Address</th>
                            <th className="border border-slate-500 px-1 py-1">Region/Office Visited</th>
                            <th className="border border-slate-500 px-1 py-1">Citizens Charter Service Availed</th>
                            <th className="border border-slate-500 px-1 py-1">External/Internal</th>
                            <th className="border border-slate-500 px-1 py-1">Type of Transaction</th>
                            <th className="border border-slate-500 px-1 py-1">Action Provided</th>
                            <th className="border border-slate-500 px-1 py-1">Date Resolve</th>
                            <th className="border border-slate-500 px-1 py-1">Number of Days to Resolution</th>
                            <th className="border border-slate-500 px-1 py-1">CC1</th>
                            <th className="border border-slate-500 px-1 py-1">CC2</th>
                            <th className="border border-slate-500 px-1 py-1">CC3</th>
                            <th className="border border-slate-500 px-1 py-1">SQD0</th>
                            <th className="border border-slate-500 px-1 py-1">SQD1</th>
                            <th className="border border-slate-500 px-1 py-1">SQD2</th>
                            <th className="border border-slate-500 px-1 py-1">SQD3</th>
                            <th className="border border-slate-500 px-1 py-1">SQD4</th>
                            <th className="border border-slate-500 px-1 py-1">SQD5</th>
                            <th className="border border-slate-500 px-1 py-1">SQD6</th>
                            <th className="border border-slate-500 px-1 py-1">SQD7</th>
                            <th className="border border-slate-500 px-1 py-1">SQD8</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={`monitor-row-${idx}`} className="align-top">
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.no}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.date}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.controlNumber}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.clientName}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.clientType}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.age}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.gender}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.email}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.officeVisited}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.ccService}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.externalInternal}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.typeOfTransaction}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.actionProvided}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.dateResolve}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.daysToResolution}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.cc1}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.cc2}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.cc3}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd0}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd1}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd2}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd3}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd4}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd5}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd6}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd7}</td>
                                <td className="border border-slate-400 px-1 py-1 text-center">{row.sqd8}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.citizenComment}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.actionTaken}</td>
                                <td className="border border-slate-400 px-1 py-1">{row.complaintNature}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <style jsx>{`
                    .report1-sheet {
                        width: max-content;
                    }

                    .report1-print-table {
                        width: max-content;
                    }

                    .report1-print-table th {
                        white-space: normal;
                        overflow-wrap: break-word;
                        word-break: normal;
                        line-height: 1.2;
                        vertical-align: top;
                    }

                    .report1-print-table td {
                        white-space: normal;
                        overflow-wrap: break-word;
                        word-break: break-word;
                        line-height: 1.15;
                        vertical-align: top;
                    }
                `}</style>

                <div className="grid grid-cols-2 gap-6 p-6 text-[10px]">
                    <div>
                        <p className="font-semibold">Prepared by:</p>
                        <div className="mt-8">
                            <p className="font-semibold uppercase">{reportMetadata?.cusatFocal || "NAME"}</p>
                            <p>CUSAT Focal</p>
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold">Noted by:</p>
                        <div className="mt-8">
                            <p className="font-semibold uppercase">{reportMetadata?.headOfUnit || "NAME"}</p>
                            <p>{reportMetadata?.designation || "Chief"}</p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

function ReportTwoTable({ serviceData }: { serviceData: any[] }) {
    return (
        <Table>
            <TableHeader className="bg-slate-100">
                <TableRow>
                    <TableHead>Declared Service</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                    <TableHead className="text-right">Internal</TableHead>
                    <TableHead className="text-right">External</TableHead>
                    <TableHead className="text-right">Overall Rating</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {serviceData.length === 0 && <EmptyRow colSpan={5} message="No service data available." />}
                {serviceData.map((row, idx) => (
                    <TableRow key={`${row.name || "service"}-${idx}`}>
                        <TableCell>{row.name || "Unspecified service"}</TableCell>
                        <TableCell className="text-right">{toNumber(row.responses)}</TableCell>
                        <TableCell className="text-right">{toNumber(row.internal)}</TableCell>
                        <TableCell className="text-right">{toNumber(row.external)}</TableCell>
                        <TableCell className="text-right">{String(row.rating || "N/A")}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ReportThreeTable({ transactionData, totalResponses }: { transactionData: any[]; totalResponses: number }) {
    return (
        <Table>
            <TableHeader className="bg-slate-100">
                <TableRow>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Internal</TableHead>
                    <TableHead className="text-right">External</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactionData.length === 0 && <EmptyRow colSpan={5} message="No transaction data available." />}
                {transactionData.slice(0, 10).map((row, idx) => {
                    const responses = toNumber(row.responses);
                    return (
                        <TableRow key={`${row.name || "tx"}-${idx}`}>
                            <TableCell>{row.name || "Unspecified transaction"}</TableCell>
                            <TableCell className="text-right">{responses}</TableCell>
                            <TableCell className="text-right">{toNumber(row.internal)}</TableCell>
                            <TableCell className="text-right">{toNumber(row.external)}</TableCell>
                            <TableCell className="text-right">{pct(responses, totalResponses)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function ReportFourTable({ genderData, ageData }: { genderData: any[]; ageData: any[] }) {
    const rows = [
        ...genderData.map((row) => ({
            category: "Sex",
            group: String(row.name || "Unspecified"),
            responses: toNumber(row.responses),
            percentage: String(row.percentage || "0%"),
        })),
        ...ageData.map((row) => ({
            category: "Age Group",
            group: String(row.name || "Unspecified"),
            responses: toNumber(row.responses),
            percentage: String(row.percentage || "0%"),
        })),
    ];

    return (
        <Table>
            <TableHeader className="bg-slate-100">
                <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Served</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={4} message="No customer monitoring data available." />}
                {rows.map((row, idx) => (
                    <TableRow key={`${row.category}-${row.group}-${idx}`}>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.group}</TableCell>
                        <TableCell className="text-right">{row.responses}</TableCell>
                        <TableCell className="text-right">{row.percentage}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ReportFiveTables({ allFeedbackRaw }: { allFeedbackRaw: any[] }) {
    const comments = allFeedbackRaw
        .map((row) => ({
            id: row?.id,
            office: row?.office,
            createdAt: row?.createdAt,
            text: getCommentText(row),
        }))
        .filter((x) => x.text.length > 0);

    const keywordGroups = {
        Compliment: ["good", "great", "excellent", "thank", "salamat", "maayos"],
        Suggestion: ["suggest", "improve", "should", "mas", "dagdag", "better"],
        Concern: ["slow", "delay", "late", "rude", "problem", "issue", "hindi", "kulang"],
    };

    const classified = comments.reduce(
        (acc, item) => {
            const lower = item.text.toLowerCase();
            if (keywordGroups.Compliment.some((k) => lower.includes(k))) acc.Compliment += 1;
            else if (keywordGroups.Concern.some((k) => lower.includes(k))) acc.Concern += 1;
            else if (keywordGroups.Suggestion.some((k) => lower.includes(k))) acc.Suggestion += 1;
            else acc.Other += 1;
            return acc;
        },
        { Compliment: 0, Suggestion: 0, Concern: 0, Other: 0 },
    );

    const latest = comments
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8);

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader className="bg-slate-100">
                    <TableRow>
                        <TableHead>Comment Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(classified).map(([name, count]) => (
                        <TableRow key={name}>
                            <TableCell>{name}</TableCell>
                            <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Table>
                <TableHeader className="bg-slate-100">
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Office</TableHead>
                        <TableHead>Comment Excerpt</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {latest.length === 0 && <EmptyRow colSpan={3} message="No customer comments available." />}
                    {latest.map((row, idx) => (
                        <TableRow key={`${row.id || "comment"}-${idx}`}>
                            <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-PH") : "N/A"}</TableCell>
                            <TableCell>{row.office || "N/A"}</TableCell>
                            <TableCell className="max-w-[500px] truncate" title={row.text}>{row.text}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function ReportSixTable({ allFeedbackRaw }: { allFeedbackRaw: any[] }) {
    const complaintKeywords = ["complaint", "complain", "8888", "rude", "delay", "poor", "issue", "problem"];
    const complaintRows = allFeedbackRaw
        .map((row) => {
            const comment = getCommentText(row);
            return {
                controlNumber: row?.controlNumber || "N/A",
                office: row?.office || "N/A",
                concern: comment,
                isComplaint: complaintKeywords.some((key) => comment.toLowerCase().includes(key)),
            };
        })
        .filter((x) => x.isComplaint)
        .slice(0, 15);

    return (
        <Table>
            <TableHeader className="bg-slate-100">
                <TableRow>
                    <TableHead>Control No.</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Concern</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {complaintRows.length === 0 && (
                    <EmptyRow colSpan={4} message="No complaint-like entries detected from current feedback comments." />
                )}
                {complaintRows.map((row, idx) => (
                    <TableRow key={`${row.controlNumber}-${idx}`}>
                        <TableCell>{row.controlNumber}</TableCell>
                        <TableCell>{row.office}</TableCell>
                        <TableCell className="max-w-[420px] truncate" title={row.concern}>{row.concern}</TableCell>
                        <TableCell>For 8888 ticket encoding</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ReportTableByType({
    report,
    totalResponses,
    officeResponseData,
    serviceData,
    transactionData,
    genderData,
    ageData,
    allFeedbackRaw,
    reportMetadata,
    reportPeriodLabel,
}: {
    report: ReportItem;
    totalResponses: number;
    officeResponseData: any[];
    serviceData: any[];
    transactionData: any[];
    genderData: any[];
    ageData: any[];
    allFeedbackRaw: any[];
    reportMetadata?: any;
    reportPeriodLabel: string;
}) {
    if (report.id === 1) {
        return (
            <ReportOneTable
                allFeedbackRaw={allFeedbackRaw}
                reportPeriodLabel={reportPeriodLabel}
                reportMetadata={reportMetadata}
            />
        );
    }
    if (report.id === 2) return <ReportTwoTable serviceData={serviceData} />;
    if (report.id === 3) return <ReportThreeTable transactionData={transactionData} totalResponses={totalResponses} />;
    if (report.id === 4) return <ReportFourTable genderData={genderData} ageData={ageData} />;
    if (report.id === 5) return <ReportFiveTables allFeedbackRaw={allFeedbackRaw} />;
    return <ReportSixTable allFeedbackRaw={allFeedbackRaw} />;
}

function SampleTemplatePage({
    report,
    reportPeriodLabel,
    totalResponses,
    officeResponseData,
    serviceData,
    transactionData,
    genderData,
    ageData,
    allFeedbackRaw,
    reportMetadata,
}: {
    report: ReportItem;
    reportPeriodLabel: string;
    totalResponses: number;
    officeResponseData: any[];
    serviceData: any[];
    transactionData: any[];
    genderData: any[];
    ageData: any[];
    allFeedbackRaw: any[];
    reportMetadata?: any;
}) {
    const Icon = report.icon;
    const isReportOne = report.id === 1;

    return (
        <Card className="border-slate-200 shadow-sm print:shadow-none print:border-0">
            <CardHeader className={`border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white pb-4 ${isReportOne ? "print:hidden" : ""}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-blue-600 text-white">Report #{report.id}</Badge>
                    {report.optional && (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            Optional / depends on 8888 ticket flow
                        </Badge>
                    )}
                </div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                    <Icon className="h-5 w-5 text-blue-600" />
                    {report.title}
                </CardTitle>
                <CardDescription className="text-slate-600">
                    Period: <span className="font-medium text-slate-700">{reportPeriodLabel}</span>
                    <span className="mx-2">|</span>
                    Total responses: <span className="font-medium text-slate-700">{totalResponses}</span>
                </CardDescription>
            </CardHeader>

            <CardContent className={`space-y-4 pt-5 ${isReportOne ? "print:p-0" : ""}`}>
                <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${isReportOne ? "print:hidden" : ""}`}>
                    <p className="text-sm font-semibold text-slate-700">{report.sectionLabel}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{report.summary}</p>
                </div>

                <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white ${isReportOne ? "print:border-0 print:rounded-none" : ""}`}>
                    <ReportTableByType
                        report={report}
                        totalResponses={totalResponses}
                        officeResponseData={officeResponseData}
                        serviceData={serviceData}
                        transactionData={transactionData}
                        genderData={genderData}
                        ageData={ageData}
                        allFeedbackRaw={allFeedbackRaw}
                        reportMetadata={reportMetadata}
                        reportPeriodLabel={reportPeriodLabel}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function ReportCard({ report, onOpen }: { report: ReportItem; onOpen: (id: number) => void }) {
    const Icon = report.icon;

    return (
        <button type="button" onClick={() => onOpen(report.id)} className="group w-full text-left">
            <Card className="h-full border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <CardHeader className="pb-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <Badge className="bg-blue-600 text-white">#{report.id}</Badge>
                        {report.optional && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                                Optional
                            </Badge>
                        )}
                    </div>

                    <CardTitle className="flex items-start gap-2 text-sm text-slate-800">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <span className="leading-snug">{report.shortLabel}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {report.summary}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
                        Open sample page
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                </CardContent>
            </Card>
        </button>
    );
}

export default function ReportsTab({
    reportPeriodLabel,
    totalResponses,
    officeResponseData,
    serviceData,
    transactionData,
    genderData,
    ageData,
    allFeedbackRaw,
    reportMetadata,
}: ReportsTabProps) {
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

    const selectedReport = useMemo(
        () => reportItems.find((item) => item.id === selectedReportId) || null,
        [selectedReportId],
    );

    if (selectedReport) {
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <Button variant="outline" onClick={() => setSelectedReportId(null)} className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        Back to reports
                    </Button>
                    <Badge variant="outline" className="text-xs">
                        Dedicated sample page
                    </Badge>
                </div>

                <SampleTemplatePage
                    report={selectedReport}
                    reportPeriodLabel={reportPeriodLabel}
                    totalResponses={totalResponses}
                    officeResponseData={officeResponseData}
                    serviceData={serviceData}
                    transactionData={transactionData}
                    genderData={genderData}
                    ageData={ageData}
                    allFeedbackRaw={allFeedbackRaw}
                    reportMetadata={reportMetadata}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Reports Catalog
                    </CardTitle>
                    <CardDescription>
                        Click a report card to open its dedicated sample page for period: <span className="font-medium text-slate-700">{reportPeriodLabel}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {reportItems.map((report) => (
                            <ReportCard key={report.id} report={report} onOpen={setSelectedReportId} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
