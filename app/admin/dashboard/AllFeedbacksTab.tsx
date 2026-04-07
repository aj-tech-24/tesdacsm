"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download } from "lucide-react";

export default function AllFeedbacksTab({ feedbackList }: { feedbackList: any[] }) {
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const totalPages = Math.max(1, Math.ceil(feedbackList.length / pageSize));

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return feedbackList.slice(start, start + pageSize);
    }, [feedbackList, page]);

    const handleExportRaw = () => {
        window.location.href = "/api/admin/export-feedback-raw";
    };

    return (
        <Card className="shadow-md border-0 ring-1 ring-slate-100 mt-8">
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                            <Database className="w-6 h-6 text-blue-600" />
                            All Feedbacks (Database Base)
                        </CardTitle>
                        <CardDescription>
                            Raw feedback records directly from the database table.
                        </CardDescription>
                    </div>
                    <Button onClick={handleExportRaw} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4" /> Export Raw Excel
                    </Button>
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
                        {paginatedRows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium text-slate-700">{row.id}</TableCell>
                                <TableCell>{new Date(row.createdAt).toLocaleString("en-PH")}</TableCell>
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
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, feedbackList.length)} of {feedbackList.length} entries
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
    );
}
