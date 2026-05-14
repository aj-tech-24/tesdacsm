"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Database, Download, Loader2, Pencil, Printer } from "lucide-react";
import { buildClientFeedbackPrintHtml, type FeedbackPrintSnapshot } from "@/lib/csm-print-template";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServicesForOfficeAndTransactions } from "@/lib/services-data";
import { toast } from "sonner";

const safeFileNamePart = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9\s_-]/g, "").trim().replace(/\s+/g, "_");
    return cleaned || "period";
};

const asText = (value: unknown) => String(value ?? "");

const clientTypeOptions = ["Citizen", "Business", "Government", "Did not specify"] as const;
const sexOptions = ["Male", "Female", "Did not specify"] as const;
const serviceCategoryOptions = ["Internal", "External", "Did not specify"] as const;
const transactionTypeOptions = [
    "Assessment and Certification",
    "Program Registration",
    "Training",
    "Scholarship",
    "Administrative",
    "Others",
] as const;
const sqdOptions = [
    { value: "5", label: "5 - Strongly Agree" },
    { value: "4", label: "4 - Agree" },
    { value: "3", label: "3 - Neither Agree nor Disagree" },
    { value: "2", label: "2 - Disagree" },
    { value: "1", label: "1 - Strongly Disagree" },
    { value: "na", label: "N/A" },
] as const;

const normalizeClientType = (value: unknown) => {
    const raw = asText(value).trim().toLowerCase();
    if (raw.includes("citizen")) return "Citizen";
    if (raw.includes("business")) return "Business";
    if (raw.includes("government")) return "Government";
    return "Did not specify";
};

const normalizeSex = (value: unknown) => {
    const raw = asText(value).trim().toLowerCase();
    if (raw === "m" || raw === "male") return "Male";
    if (raw === "f" || raw === "female") return "Female";
    return "Did not specify";
};

const normalizeServiceCategory = (value: unknown) => {
    const raw = asText(value).trim().toLowerCase();
    if (raw.includes("internal")) return "Internal";
    if (raw.includes("external")) return "External";
    return "Did not specify";
};

const normalizeSqdValue = (value: unknown) => {
    const raw = asText(value).trim().toLowerCase();
    if (["1", "2", "3", "4", "5"].includes(raw)) return raw;
    if (raw === "na" || raw === "n/a") return "na";
    return "na";
};

const normalizeTransactionType = (value: unknown) => {
    const raw = asText(value).trim();
    if (!raw) return "";

    const first = raw.split(",")[0]?.trim() || "";
    const normalized = first.toLowerCase();
    if (normalized.includes("assessment")) return "Assessment and Certification";
    if (normalized.includes("program")) return "Program Registration";
    if (normalized.includes("training")) return "Training";
    if (normalized.includes("scholarship")) return "Scholarship";
    if (normalized.includes("administrative") || normalized.includes("admin")) return "Administrative";
    if (normalized.includes("other")) return "Others";
    return first;
};

const normalizeDateForInput = (value: unknown) => {
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    const raw = asText(value).trim();
    if (!raw) return "";

    const direct = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    if (direct) return raw;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const formatDateForDisplay = (value: unknown) => {
    const raw = asText(value).trim();
    if (!raw) return "";

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;

    return parsed.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
};

export default function AllFeedbacksTab({ feedbackList, reportPeriodLabel }: { feedbackList: any[]; reportPeriodLabel?: string }) {
    const [page, setPage] = useState(1);
    const [formDateSort, setFormDateSort] = useState<"asc" | "desc">("desc");
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [editingRow, setEditingRow] = useState<any | null>(null);
    const [isCustomServiceEdit, setIsCustomServiceEdit] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        controlNumber: "",
        name: "",
        clientType: "Did not specify",
        age: "",
        sex: "Did not specify",
        formDate: "",
        email: "",
        employeeName: "",
        regionOfResidence: "",
        province: "",
        municipality: "",
        office: "",
        citizensCharterService: "",
        serviceCategory: "Did not specify",
        transactionTypes: "",
        cc1: "",
        cc2: "",
        cc3: "",
        sqd0: "na",
        sqd1: "na",
        sqd2: "na",
        sqd3: "na",
        sqd4: "na",
        sqd5: "na",
        sqd6: "na",
        sqd7: "na",
        sqd8: "na",
        suggestions: "",
        actionProvided: "",
        dateResolved: "",
        natureOfTransaction: "",
    });
    const [localEditsById, setLocalEditsById] = useState<Record<number, Partial<any>>>({});
    const pageSize = 15;

    const mergedFeedbackList = useMemo(
        () =>
            feedbackList.map((row) => {
                const rowId = Number(row.id);
                const patch = Number.isNaN(rowId) ? undefined : localEditsById[rowId];
                return patch ? { ...row, ...patch } : row;
            }),
        [feedbackList, localEditsById]
    );

    const sortedFeedbackList = useMemo(() => {
        const toTime = (value: unknown) => {
            const raw = asText(value).trim();
            if (!raw) return null;
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) return null;
            return parsed.getTime();
        };

        return [...mergedFeedbackList].sort((a, b) => {
            const aTime = toTime(a.formDate);
            const bTime = toTime(b.formDate);
            if (aTime === null && bTime === null) return 0;
            if (aTime === null) return 1;
            if (bTime === null) return -1;
            return formDateSort === "asc" ? aTime - bTime : bTime - aTime;
        });
    }, [mergedFeedbackList, formDateSort]);

    const totalPages = Math.max(1, Math.ceil(sortedFeedbackList.length / pageSize));

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedFeedbackList.slice(start, start + pageSize);
    }, [sortedFeedbackList, page]);

    const availableServiceGroupsForEdit = useMemo(() => {
        if (!editForm.office || !editForm.transactionTypes) return [];
        return getServicesForOfficeAndTransactions(editForm.office, [editForm.transactionTypes]);
    }, [editForm.office, editForm.transactionTypes]);

    const getTransactionTypes = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
        if (!value) return [];
        return String(value)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const handlePrintFeedbackForm = (row: any) => {
        const printWindow = window.open("", "_blank", "width=900,height=1000");
        if (!printWindow) {
            window.alert("Unable to open print window. Please allow pop-ups for this site.");
            return;
        }

        const submittedAt = row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString();
        const submittedDate = new Date(submittedAt).toLocaleString("en-PH", {
            dateStyle: "medium",
        });

        const snapshot: FeedbackPrintSnapshot = {
            submittedAt,
            controlNumber: row.controlNumber || "",
            dbId: typeof row.id === "number" ? row.id : null,
            clientInfo: {
                office: row.office || "",
                clientType: row.clientType || "",
                name: row.name || "",
                sex: row.sex || "",
                age: row.age || "",
                regionOfResidence: row.regionOfResidence || "",
                province: row.province || "",
                municipality: row.municipality || "",
                citizensCharterService: row.citizensCharterService || "",
                transactionTypes: getTransactionTypes(row.transactionTypes),
            },
            ccQuestions: {
                cc1: row.cc1 || "",
                cc2: row.cc2 || "",
                cc3: row.cc3 || "",
            },
            sqd: {
                sqd0: row.sqd0 || "",
                sqd1: row.sqd1 || "",
                sqd2: row.sqd2 || "",
                sqd3: row.sqd3 || "",
                sqd4: row.sqd4 || "",
                sqd5: row.sqd5 || "",
                sqd6: row.sqd6 || "",
                sqd7: row.sqd7 || "",
                sqd8: row.sqd8 || "",
            },
            suggestions: {
                suggestions: row.suggestions || "",
                email: row.email || "",
                employeeName: row.employeeName || "",
            },
        };

        const logoUrl = `${window.location.origin}/tesda-logo.png`;
        const html = buildClientFeedbackPrintHtml(snapshot, submittedDate, logoUrl);

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        let hasTriggeredPrint = false;

        const triggerPrint = () => {
            if (hasTriggeredPrint) return;
            hasTriggeredPrint = true;
            try {
                printWindow.focus();
                printWindow.print();
            } catch {
                window.alert("Printing failed to start automatically. Please use Ctrl+P in the opened window.");
            }
        };

        const fallbackTimer = window.setTimeout(triggerPrint, 900);
        printWindow.onload = () => {
            window.clearTimeout(fallbackTimer);
            window.setTimeout(triggerPrint, 350);
        };
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const response = await fetch("/api/admin/export-report1-excel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rows: mergedFeedbackList,
                }),
            });

            if (!response.ok) {
                let message = "Failed to generate report.";
                try {
                    const payload = await response.json();
                    if (payload?.error) message = String(payload.error);
                } catch {
                    // Keep fallback message for non-JSON error responses.
                }
                toast.error(message);
                throw new Error(message);
            }

            const blob = await response.blob();
            const period = safeFileNamePart(reportPeriodLabel || "period");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `updated-CUSAT-form-for-Provincial-District-Office-Services_${period}.xlsm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Report generated successfully.");
        } catch (error) {
            console.error("Failed to generate report", error);
            toast.error("Unable to generate report right now. Please try again.");
            window.alert("Unable to generate report right now. Please try again.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const openEditDialog = (row: any) => {
        setEditingRow(row);
        const normalizedTx = normalizeTransactionType(row.transactionTypes);
        const existingService = asText(row.citizensCharterService).trim();
        const serviceGroups = getServicesForOfficeAndTransactions(asText(row.office), normalizedTx ? [normalizedTx] : []);
        const hasServiceInPreset = serviceGroups.some((group) => group.services.includes(existingService));
        setIsCustomServiceEdit(Boolean(existingService) && serviceGroups.length > 0 && !hasServiceInPreset);
        setEditForm({
            controlNumber: asText(row.controlNumber),
            name: asText(row.name),
            clientType: normalizeClientType(row.clientType),
            age: asText(row.age),
            sex: normalizeSex(row.sex),
            formDate: normalizeDateForInput(row.formDate),
            email: asText(row.email),
            employeeName: asText(row.employeeName),
            regionOfResidence: asText(row.regionOfResidence),
            province: asText(row.province),
            municipality: asText(row.municipality),
            office: asText(row.office),
            citizensCharterService: asText(row.citizensCharterService),
            serviceCategory: normalizeServiceCategory(row.serviceCategory),
            transactionTypes: normalizedTx,
            cc1: asText(row.cc1),
            cc2: asText(row.cc2),
            cc3: asText(row.cc3),
            sqd0: normalizeSqdValue(row.sqd0),
            sqd1: normalizeSqdValue(row.sqd1),
            sqd2: normalizeSqdValue(row.sqd2),
            sqd3: normalizeSqdValue(row.sqd3),
            sqd4: normalizeSqdValue(row.sqd4),
            sqd5: normalizeSqdValue(row.sqd5),
            sqd6: normalizeSqdValue(row.sqd6),
            sqd7: normalizeSqdValue(row.sqd7),
            sqd8: normalizeSqdValue(row.sqd8),
            suggestions: asText(row.suggestions),
            actionProvided: asText(row.actionProvided),
            dateResolved: normalizeDateForInput(row.dateResolved),
            natureOfTransaction: asText(row.natureOfTransaction),
        });
    };

    const handleSaveEdit = async () => {
        if (!editingRow?.id) {
            window.alert("Invalid feedback record.");
            return;
        }

        setIsSavingEdit(true);
        try {
            const response = await fetch("/api/admin/feedback-update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingRow.id,
                    ...editForm,
                }),
            });

            if (!response.ok) {
                let message = "Failed to update feedback.";
                try {
                    const payload = await response.json();
                    if (payload?.error) message = String(payload.error);
                } catch {
                    // Keep fallback message when response body is not JSON.
                }
                toast.error(message);
                throw new Error(message);
            }

            setLocalEditsById((prev) => ({
                ...prev,
                [Number(editingRow.id)]: { ...editForm },
            }));
            setEditingRow(null);
            toast.success("Feedback updated successfully.");
            window.alert("Feedback updated successfully.");
        } catch (error) {
            console.error("Failed to update feedback", error);
            toast.error("Unable to update feedback right now. Please try again.");
            window.alert("Unable to update feedback right now. Please try again.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <Card className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg tracking-tight text-slate-900">
                            <Database className="h-5 w-5 text-sky-700" />
                            Feedbacks
                        </CardTitle>
                        <CardDescription>
                            Feedback records from submitted client forms.
                        </CardDescription>
                    </div>
                    <Button onClick={handleGenerateReport} size="sm" className="h-9 gap-2 bg-slate-900 px-3 hover:bg-slate-800" disabled={isGeneratingReport}>
                        {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Generate Report
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-4 pt-0">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow>
                            <TableHead className="h-9 px-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setFormDateSort((prev) => (prev === "asc" ? "desc" : "asc"))}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                    aria-label={`Sort Feedback Date ${formDateSort === "asc" ? "descending" : "ascending"}`}
                                    title={`Sort by Feedback Date (${formDateSort === "asc" ? "oldest first" : "newest first"})`}
                                >
                                    Feedback Date
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                            </TableHead>
                            <TableHead className="h-9 px-2 text-xs">Control No.</TableHead>
                            <TableHead className="h-9 px-2 text-xs">Client Name</TableHead>
                            <TableHead className="h-9 px-2 text-xs">Office</TableHead>
                            <TableHead className="h-9 px-2 text-xs">Service</TableHead>
                            <TableHead className="h-9 px-2 text-xs">Action Provided</TableHead>
                            <TableHead className="h-9 w-[96px] px-2 text-center text-xs">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRows.map((row) => (
                            <TableRow key={row.id} data-feedback-id={row.id}>
                                <TableCell className="px-2 py-2 text-xs">{formatDateForDisplay(row.formDate)}</TableCell>
                                <TableCell className="px-2 py-2 text-xs">{row.controlNumber || ""}</TableCell>
                                <TableCell className="px-2 py-2 text-xs">{row.name || "Anonymous"}</TableCell>
                                <TableCell className="px-2 py-2 text-xs">{row.office || ""}</TableCell>
                                <TableCell className="max-w-[220px] truncate px-2 py-2 text-xs" title={row.citizensCharterService || ""}>
                                    {row.citizensCharterService || ""}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate px-2 py-2 text-xs" title={row.actionProvided || ""}>
                                    {row.actionProvided || ""}
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-slate-300 text-slate-700 hover:bg-slate-100"
                                            onClick={() => openEditDialog(row)}
                                            title="Edit feedback"
                                            aria-label="Edit feedback"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-slate-300 text-slate-700 hover:bg-slate-100"
                                            onClick={() => handlePrintFeedbackForm(row)}
                                            title="Print feedback form"
                                            aria-label="Print feedback form"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 p-3">
                <span className="text-xs text-slate-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedFeedbackList.length)} of {sortedFeedbackList.length} entries
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                        Next
                    </Button>
                </div>
            </div>

            <Dialog open={Boolean(editingRow)} onOpenChange={(open) => !open && setEditingRow(null)}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Feedback</DialogTitle>
                        <DialogDescription>Update any form field to correct this feedback entry.</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Editing Record</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">
                                {editForm.controlNumber || "No Control Number"}
                                {editForm.name ? ` | ${editForm.name}` : ""}
                            </p>
                        </div>

                        <section className="rounded-xl border border-slate-200 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-900">Client Information</h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Control No.</p>
                                    <Input value={editForm.controlNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, controlNumber: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Client Name</p>
                                    <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Client Type</p>
                                    <Select
                                        value={editForm.clientType}
                                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, clientType: value }))}
                                        disabled={isSavingEdit}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select client type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientTypeOptions.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Sex</p>
                                    <Select
                                        value={editForm.sex}
                                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, sex: value }))}
                                        disabled={isSavingEdit}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select sex" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sexOptions.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Age</p>
                                    <Input value={editForm.age} onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Feedback Date</p>
                                    <Input type="date" value={editForm.formDate} onChange={(e) => setEditForm((prev) => ({ ...prev, formDate: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Email</p>
                                    <Input value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Employee Name</p>
                                    <Input value={editForm.employeeName} onChange={(e) => setEditForm((prev) => ({ ...prev, employeeName: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Office</p>
                                    <Input value={editForm.office} onChange={(e) => setEditForm((prev) => ({ ...prev, office: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-900">Location and Transaction</h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Region of Residence</p>
                                    <Input value={editForm.regionOfResidence} onChange={(e) => setEditForm((prev) => ({ ...prev, regionOfResidence: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Province</p>
                                    <Input value={editForm.province} onChange={(e) => setEditForm((prev) => ({ ...prev, province: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Municipality</p>
                                    <Input value={editForm.municipality} onChange={(e) => setEditForm((prev) => ({ ...prev, municipality: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Service Category</p>
                                    <Select
                                        value={editForm.serviceCategory}
                                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, serviceCategory: value }))}
                                        disabled={isSavingEdit}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serviceCategoryOptions.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5 lg:col-span-2">
                                    <p className="text-sm font-medium text-slate-700">Type of Transaction</p>
                                    <Select
                                        value={editForm.transactionTypes || undefined}
                                        onValueChange={(value) => {
                                            setIsCustomServiceEdit(false);
                                            setEditForm((prev) => ({
                                                ...prev,
                                                transactionTypes: value,
                                                citizensCharterService: "",
                                            }));
                                        }}
                                        disabled={isSavingEdit}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select transaction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {transactionTypeOptions.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Nature of Transaction</p>
                                    <Input value={editForm.natureOfTransaction} onChange={(e) => setEditForm((prev) => ({ ...prev, natureOfTransaction: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5 lg:col-span-3">
                                    <p className="text-sm font-medium text-slate-700">Citizens Charter Service Availed</p>
                                    {!editForm.transactionTypes ? (
                                        <Input value="" placeholder="Please select a transaction type first" disabled className="bg-muted text-muted-foreground" />
                                    ) : availableServiceGroupsForEdit.length === 0 || isCustomServiceEdit ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={editForm.citizensCharterService}
                                                onChange={(e) => setEditForm((prev) => ({ ...prev, citizensCharterService: e.target.value }))}
                                                placeholder="Please specify your service..."
                                                disabled={isSavingEdit}
                                            />
                                            {availableServiceGroupsForEdit.length > 0 && isCustomServiceEdit ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsCustomServiceEdit(false);
                                                        setEditForm((prev) => ({ ...prev, citizensCharterService: "" }));
                                                    }}
                                                    disabled={isSavingEdit}
                                                >
                                                    Cancel
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <Select
                                            value={editForm.citizensCharterService || undefined}
                                            onValueChange={(value) => {
                                                if (value === "___CUSTOM___") {
                                                    setIsCustomServiceEdit(true);
                                                    setEditForm((prev) => ({ ...prev, citizensCharterService: "" }));
                                                } else {
                                                    setEditForm((prev) => ({ ...prev, citizensCharterService: value }));
                                                }
                                            }}
                                            disabled={isSavingEdit}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a service..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableServiceGroupsForEdit.map((group) => (
                                                    <SelectGroup key={group.category}>
                                                        <SelectLabel className="font-semibold text-primary/80">{group.category}</SelectLabel>
                                                        {group.services.map((service) => (
                                                            <SelectItem key={service} value={service}>{service}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                ))}
                                                <SelectItem value="___CUSTOM___" className="font-medium text-primary">
                                                    Others (Please specify)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-900">Citizen Charter (CC)</h4>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">CC1</p>
                                    <Input value={editForm.cc1} onChange={(e) => setEditForm((prev) => ({ ...prev, cc1: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">CC2</p>
                                    <Input value={editForm.cc2} onChange={(e) => setEditForm((prev) => ({ ...prev, cc2: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">CC3</p>
                                    <Input value={editForm.cc3} onChange={(e) => setEditForm((prev) => ({ ...prev, cc3: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-900">SQD Scores</h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD0</p>
                                    <Select value={editForm.sqd0} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd0: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD0" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd0-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD1</p>
                                    <Select value={editForm.sqd1} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd1: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD1" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd1-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD2</p>
                                    <Select value={editForm.sqd2} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd2: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD2" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd2-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD3</p>
                                    <Select value={editForm.sqd3} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd3: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD3" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd3-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD4</p>
                                    <Select value={editForm.sqd4} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd4: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD4" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd4-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD5</p>
                                    <Select value={editForm.sqd5} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd5: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD5" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd5-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD6</p>
                                    <Select value={editForm.sqd6} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd6: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD6" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd6-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD7</p>
                                    <Select value={editForm.sqd7} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd7: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD7" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd7-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">SQD8</p>
                                    <Select value={editForm.sqd8} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sqd8: value }))} disabled={isSavingEdit}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select SQD8" /></SelectTrigger>
                                        <SelectContent>{sqdOptions.map((option) => <SelectItem key={`sqd8-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-900">Resolution and Notes</h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Action Provided</p>
                                    <Input value={editForm.actionProvided} onChange={(e) => setEditForm((prev) => ({ ...prev, actionProvided: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5">
                                    <p className="text-sm font-medium text-slate-700">Date Resolved</p>
                                    <Input type="date" value={editForm.dateResolved} onChange={(e) => setEditForm((prev) => ({ ...prev, dateResolved: e.target.value }))} disabled={isSavingEdit} />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <p className="text-sm font-medium text-slate-700">Suggestions</p>
                                    <Textarea value={editForm.suggestions} onChange={(e) => setEditForm((prev) => ({ ...prev, suggestions: e.target.value }))} disabled={isSavingEdit} rows={4} />
                                </div>
                            </div>
                        </section>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRow(null)} disabled={isSavingEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="gap-2 bg-slate-900 hover:bg-slate-800">
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
