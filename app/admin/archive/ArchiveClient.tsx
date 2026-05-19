"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, FileText } from "lucide-react";
import ArchiveCard from "./archive-card";
import ArchiveForm from "./archive-form";
import { Input } from "@/components/ui/input";

interface MonthlySummary {
    monthKey: string;
    year: number;
    month: number;
    monthName: string;
    total: number;
    answered: number;
    pending: number;
    archived: number;
}

interface ArchiveClientProps {
    userRole: string;
    userOffice: string;
    monthlySummary?: MonthlySummary[];
    totalFeedback?: number;
    serverLoading?: boolean;
}

export default function ArchiveClient({
    userRole,
    userOffice,
    monthlySummary,
    totalFeedback,
    serverLoading = false,
}: ArchiveClientProps) {
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingMonth, setDownloadingMonth] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

    // Helper to concatenate multiple Uint8Array chunks into one
    const concatUint8Arrays = (chunks: Uint8Array[]) => {
        const total = chunks.reduce((sum, c) => sum + (c?.length || 0), 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
            out.set(c, offset);
            offset += c.length;
        }
        return out;
    };
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    // Server-driven months and totals
    const [months, setMonths] = useState<MonthlySummary[]>(monthlySummary || []);
    const [totalMonths, setTotalMonths] = useState<number>(monthlySummary ? monthlySummary.length : 0);
    const [loadingServer, setLoadingServer] = useState(false);

    // Get unique years from data (fallback to months state)
    const years = Array.from(new Set((monthlySummary || months).map((m) => m.year))).sort((a, b) => b - a);

    useEffect(() => {
        let isActive = true;
        const fetchData = async () => {
            setLoadingServer(true);
            try {
                const params = new URLSearchParams();
                params.set("year", selectedYear || "all");
                params.set("page", String(currentPage));
                params.set("pageSize", String(pageSize));
                if (searchTerm) params.set("q", searchTerm);

                const resp = await fetch(`/api/admin/archive/monthly-summary?${params.toString()}`, { cache: "no-store" });
                if (!resp.ok) {
                    if (isActive) {
                        setMonths([]);
                        setTotalMonths(0);
                    }
                    return;
                }
                const payload = await resp.json();
                if (!isActive) return;
                if (payload?.success) {
                    const data = (payload.data || []).map((m: any) => ({
                        monthKey: m.month,
                        year: m.year,
                        month: Number(m.month.split("-")[1]),
                        monthName: m.monthName,
                        total: m.total,
                        answered: m.answered,
                        pending: m.pending,
                        archived: m.archived,
                    }));
                    setMonths(data);
                    setTotalMonths(Number(payload.total || data.length));
                } else {
                    setMonths([]);
                    setTotalMonths(0);
                }
            } catch (err) {
                console.error("Failed to load monthly summary:", err);
                if (isActive) {
                    setMonths([]);
                    setTotalMonths(0);
                }
            } finally {
                if (isActive) setLoadingServer(false);
            }
        };

        fetchData();

        return () => { isActive = false; };
    }, [selectedYear, searchTerm, currentPage, pageSize]);

    const handleBulkPrint = async (monthKey: string) => {
        setIsLoading(true);
        setDownloadingMonth(monthKey);
        setDownloadProgress(0);
        try {
            const response = await fetch("/api/admin/archive/bulk-print", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monthKey, format: "pdf" }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Print failed:", error.error);
                alert(`Print failed: ${error.error}`);
                return;
            }

            // Try to stream the response to provide progress updates when Content-Length is present
            const contentLength = Number(response.headers.get("Content-Length") || response.headers.get("content-length") || 0);
            const respContentType = response.headers.get("content-type") || "application/octet-stream";
            if (response.body && typeof ReadableStream !== "undefined") {
                const reader = response.body.getReader();
                const chunks: Uint8Array[] = [];
                let received = 0;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        // Ensure value is a Uint8Array
                        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBufferLike);
                        chunks.push(chunk);
                        received += value.length;
                        if (contentLength) {
                            setDownloadProgress(Math.min(100, Math.round((received / contentLength) * 100)));
                        } else {
                            // unknown total size; show indeterminate progress by increasing value
                            setDownloadProgress((prev) => (prev === null ? 5 : Math.min(95, (prev || 5) + 10)));
                        }
                    }
                }

                const combined = concatUint8Arrays(chunks);
                const blob = new Blob([combined], { type: respContentType });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                // choose extension based on content type
                const ext = respContentType.includes("html") ? "html" : respContentType.includes("pdf") ? "pdf" : "bin";
                link.download = `feedbacks-${monthKey}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                // Fallback when streaming not available
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const ct = blob.type || respContentType;
                const ext = ct.includes("html") ? "html" : ct.includes("pdf") ? "pdf" : "bin";
                link.download = `feedbacks-${monthKey}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Print error:", error);
            alert("Failed to generate print document. Please try again.");
        } finally {
            setIsLoading(false);
            setDownloadingMonth(null);
            setDownloadProgress(null);
        }
    };

    const handleBulkArchive = async (monthKey: string) => {
        if (!confirm(`Are you sure you want to archive all feedbacks from ${monthKey}?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/archive/bulk-archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monthKey }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Archive failed:", error.error);
                alert(`Archive failed: ${error.error}`);
                return;
            }

            const result = await response.json();
            alert(`Success: ${result.message}`);
            
            // TODO: Refresh the page or update state to reflect archived status
        } catch (error) {
            console.error("Archive error:", error);
            alert("Failed to archive feedbacks. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Archive Management</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Manage and archive monthly feedback submissions
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <ArchiveForm
                    selectedYear={selectedYear}
                    onYearChange={(y) => { setSelectedYear(y); setCurrentPage(1); }}
                    availableYears={years}
                    isLoading={isLoading}
                    monthCount={totalMonths}
                />

                <div className="flex items-center gap-3">
                    <Input placeholder="Search month" value={searchTerm} onChange={(e: any) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-56" />
                    <select className="rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                        <option value={6}>6 / page</option>
                        <option value={9}>9 / page</option>
                        <option value={12}>12 / page</option>
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-slate-600 text-sm font-medium">Total Feedbacks</p>
                            <p className="text-4xl font-bold text-slate-900 mt-2">{totalFeedback ?? months.reduce((acc, m) => acc + (m.total || 0), 0)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-slate-600 text-sm font-medium">Months Tracked</p>
                            <p className="text-4xl font-bold text-slate-900 mt-2">{totalMonths}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-slate-600 text-sm font-medium">Answered Rate</p>
                            <p className="text-4xl font-bold text-emerald-600 mt-2">
                                {(() => {
                                    const answeredSum = months.reduce((acc, m) => acc + (m.answered || 0), 0);
                                    const totalSum = (totalFeedback ?? months.reduce((acc, m) => acc + (m.total || 0), 0));
                                    return totalSum > 0 ? Math.round((answeredSum / totalSum) * 100) : 0;
                                })()}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Cards Grid */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Summary</h2>
                {loadingServer || serverLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse border-slate-200 bg-white/60">
                                <CardContent className="pt-6 pb-6">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded mb-3" />
                                    <div className="h-3 w-1/2 bg-slate-200 rounded mb-2" />
                                    <div className="flex gap-2 mt-3">
                                        <div className="h-8 w-1/2 bg-slate-200 rounded" />
                                        <div className="h-8 w-1/2 bg-slate-200 rounded" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : totalMonths === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                        <Archive className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-sm font-semibold text-slate-900">No months found</h3>
                        <p className="text-sm text-slate-600 mt-2">No archived or answered feedback found for the selected year.</p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                                Refresh
                            </Button>
                            <Button size="sm" onClick={() => { window.location.href = '/admin/archive'; }}>
                                Open Archive Page
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {months.map((month) => (
                                <ArchiveCard
                                    key={month.monthKey}
                                    monthKey={month.monthKey}
                                    monthName={month.monthName}
                                    year={month.year}
                                    total={month.total}
                                    answered={month.answered}
                                    pending={month.pending}
                                    archived={month.archived}
                                    isLoading={isLoading}
                                    onPrint={handleBulkPrint}
                                    downloading={downloadingMonth === month.monthKey}
                                    downloadProgress={downloadingMonth === month.monthKey ? downloadProgress : null}
                                    onArchive={handleBulkArchive}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-slate-600">Showing {Math.min((currentPage - 1) * pageSize + 1, totalMonths)} to {Math.min(currentPage * pageSize, totalMonths)} of {totalMonths} months</div>
                            <div className="flex items-center gap-2">
                                <button className="rounded border px-3 py-1 text-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
                                <span className="text-sm">{currentPage}</span>
                                <button className="rounded border px-3 py-1 text-sm" disabled={(currentPage * pageSize) >= totalMonths} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

