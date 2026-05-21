"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, Download, Search, X } from "lucide-react";
import ArchiveCard from "./archive-card";
import ArchiveForm from "./archive-form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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
    const [downloadStage, setDownloadStage] = useState<"preparing" | "downloading" | "finalizing" | null>(null);
    const autoProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const totalFeedbackCount = useMemo(
        () => totalFeedback ?? months.reduce((acc, m) => acc + (m.total || 0), 0),
        [months, totalFeedback]
    );
    const answeredFeedbackCount = useMemo(
        () => months.reduce((acc, m) => acc + (m.answered || 0), 0),
        [months]
    );
    const answeredRate = totalFeedbackCount > 0 ? Math.round((answeredFeedbackCount / totalFeedbackCount) * 100) : 0;

    const stopAutoProgress = () => {
        if (autoProgressTimerRef.current) {
            clearInterval(autoProgressTimerRef.current);
            autoProgressTimerRef.current = null;
        }
    };

    const startAutoProgress = (max: number, step = 1, intervalMs = 170) => {
        stopAutoProgress();
        autoProgressTimerRef.current = setInterval(() => {
            setDownloadProgress((prev) => {
                const base = prev ?? 6;
                if (base >= max) return base;
                return Math.min(max, base + step);
            });
        }, intervalMs);
    };

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

    useEffect(() => {
        return () => {
            stopAutoProgress();
        };
    }, []);

    const handleBulkPrint = async (monthKey: string) => {
        setIsLoading(true);
        setDownloadingMonth(monthKey);
        setDownloadStage("preparing");
        setDownloadProgress(6);
        startAutoProgress(28, 1, 180);
        try {
            const response = await fetch("/api/admin/archive/bulk-print", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monthKey }),
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
            const pdfFallback = response.headers.get("x-pdf-fallback") === "puppeteer-failed";
            const isPdf = respContentType.includes("application/pdf") && !pdfFallback;
            const downloadName = isPdf ? `feedbacks-${monthKey}.pdf` : `feedbacks-${monthKey}.html`;
            setDownloadStage("downloading");
            if (contentLength > 0) {
                stopAutoProgress();
            } else {
                startAutoProgress(90, 1, 160);
            }

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
                            const measured = Math.min(94, Math.max(12, Math.round((received / contentLength) * 92) + 2));
                            setDownloadProgress((prev) => Math.max(prev ?? 0, measured));
                        } else {
                            setDownloadProgress((prev) => {
                                const base = prev ?? 12;
                                return Math.min(90, base + 1);
                            });
                        }
                    }
                }

                setDownloadStage("finalizing");
                stopAutoProgress();
                setDownloadProgress((prev) => Math.max(prev ?? 0, 96));
                const combined = concatUint8Arrays(chunks);
                const blob = new Blob([combined], { type: respContentType });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = downloadName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                setDownloadProgress(100);
                await new Promise((resolve) => setTimeout(resolve, 350));
            } else {
                // Fallback when streaming not available
                setDownloadStage("finalizing");
                stopAutoProgress();
                setDownloadProgress((prev) => Math.max(prev ?? 0, 95));
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = downloadName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                setDownloadProgress(100);
                await new Promise((resolve) => setTimeout(resolve, 350));
            }
        } catch (error) {
            console.error("Print error:", error);
            alert("Failed to generate print document. Please try again.");
        } finally {
            stopAutoProgress();
            setIsLoading(false);
            setDownloadingMonth(null);
            setDownloadProgress(null);
            setDownloadStage(null);
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
            <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Archive Management</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Download monthly feedback PDFs and keep records archived in one place.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:min-w-[330px]">
                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                                <p className="text-xs text-slate-500">Feedback</p>
                                <p className="text-lg font-semibold text-slate-900">{totalFeedbackCount}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                                <p className="text-xs text-slate-500">Months</p>
                                <p className="text-lg font-semibold text-slate-900">{totalMonths}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
                                <p className="text-xs text-emerald-700">Answered</p>
                                <p className="text-lg font-semibold text-emerald-700">{answeredRate}%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {downloadingMonth && downloadProgress !== null && (
                <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="mb-2 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                                <Download className="h-4 w-4" />
                                <span>Generating PDF for {downloadingMonth}</span>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                {downloadStage === "preparing" && "Preparing"}
                                {downloadStage === "downloading" && "Downloading"}
                                {downloadStage === "finalizing" && "Finalizing"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={downloadProgress} className="h-2.5 bg-blue-100 [&_[data-slot=progress-indicator]]:bg-blue-600" />
                            <span className="w-12 text-right text-sm font-semibold text-blue-800">{downloadProgress}%</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <ArchiveForm
                        selectedYear={selectedYear}
                        onYearChange={(y) => { setSelectedYear(y); setCurrentPage(1); }}
                        availableYears={years}
                        isLoading={isLoading}
                        monthCount={totalMonths}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search month"
                                value={searchTerm}
                                onChange={(e: any) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-60 pl-8 pr-8"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <select
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={pageSize}
                            onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                        >
                            <option value={6}>6 / page</option>
                            <option value={9}>9 / page</option>
                            <option value={12}>12 / page</option>
                        </select>
                    </div>
                </div>
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
                            <Button size="sm" variant="admin" onClick={() => { window.location.href = '/admin/archive'; }}>
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
                                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</Button>
                                <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium">{currentPage}</span>
                                <Button variant="outline" size="sm" disabled={(currentPage * pageSize) >= totalMonths} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

