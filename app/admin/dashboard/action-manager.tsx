"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTodo, Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";

const OTHERS_ACTION = "Others:";

const PREDEFINED_ACTIONS = [
    "Provided a Direct and Concrete Response / Information",
    "Referred to RO",
    "Referred to PO/DO",
    "Referred to Focal",
    "Referred to TVIs",
    "Referred Assessment Centers",
    OTHERS_ACTION
];

const inferNatureOfTransaction = (feedback: any) => {
    const raw = String(feedback?.citizensCharterService || "").toLowerCase();
    if (raw.includes("complaint")) return "Complaint";
    if (raw.includes("inquiry")) return "Inquiry";
    return "";
};

function ActionRow({
    f,
    submittingId,
    updateAction,
}: {
    f: any,
    submittingId: number | null,
    updateAction: (id: number, act: string, dateResolved: string, natureOfTransaction: string) => Promise<boolean>
}) {
    const initialAction = (f.actionProvided || "").trim();
    const isPredefined = PREDEFINED_ACTIONS.includes(initialAction);
    const startsWithOthers = initialAction.startsWith(OTHERS_ACTION);

    const [localAction, setLocalAction] = useState(
        startsWithOthers ? OTHERS_ACTION : (isPredefined ? initialAction : (initialAction ? OTHERS_ACTION : ""))
    );
    const [otherAction, setOtherAction] = useState(
        startsWithOthers
            ? initialAction.slice(OTHERS_ACTION.length).trim()
            : (isPredefined ? "" : initialAction)
    );
    const [dateResolved, setDateResolved] = useState((f.dateResolved || "").slice(0, 10));
    const [natureOfTransaction, setNatureOfTransaction] = useState(
        String(f.natureOfTransaction || inferNatureOfTransaction(f) || "")
    );
    const [isDone, setIsDone] = useState(
        Boolean(f.actionProvided && (f.natureOfTransaction || inferNatureOfTransaction(f)))
    );
    const [isEditing, setIsEditing] = useState(!Boolean(f.actionProvided && (f.natureOfTransaction || inferNatureOfTransaction(f))));

    const handleSave = async () => {
        const actionToSave = localAction === OTHERS_ACTION
            ? `${OTHERS_ACTION} ${otherAction.trim()}`.trim()
            : localAction;

        if (!actionToSave) {
            toast.error("Please select an action before saving");
            return;
        }

        if (localAction === OTHERS_ACTION && !otherAction.trim()) {
            toast.error("Please enter a custom action for Others");
            return;
        }

        if (!natureOfTransaction) {
            toast.error("Please select the nature of transaction");
            return;
        }

        const isSaved = await updateAction(f.id, actionToSave, dateResolved, natureOfTransaction);
        if (isSaved) {
            setIsDone(true);
            setIsEditing(false);
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium text-slate-700">{f.controlNumber}</TableCell>
            <TableCell>{f.name || "Anonymous"}</TableCell>
            <TableCell className="max-w-[200px] truncate" title={f.citizensCharterService}>
                {f.citizensCharterService || "N/A"}
            </TableCell>
            <TableCell>
                <Select value={natureOfTransaction} onValueChange={setNatureOfTransaction} disabled={!isEditing || submittingId === f.id}>
                    <SelectTrigger className="w-full min-w-[170px] shadow-none h-9 disabled:opacity-100">
                        <SelectValue placeholder="Select nature" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Inquiry">Inquiry</SelectItem>
                        <SelectItem value="Complaint">Complaint</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell>
                {localAction === OTHERS_ACTION && isEditing ? (
                    <div className="flex items-center gap-2 min-w-[250px]">
                        <Input
                            value={otherAction}
                            onChange={(e) => setOtherAction(e.target.value)}
                            placeholder="Enter custom action"
                            className="h-9"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setLocalAction("")}
                            disabled={submittingId === f.id}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : localAction === OTHERS_ACTION ? (
                    <div className="min-w-[250px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {`${OTHERS_ACTION} ${otherAction}`.trim()}
                    </div>
                ) : (
                    <Select value={localAction} onValueChange={setLocalAction} disabled={!isEditing || submittingId === f.id}>
                        <SelectTrigger className="w-full min-w-[250px] shadow-none h-9 disabled:opacity-100">
                            <SelectValue placeholder="Select an action..." />
                        </SelectTrigger>
                        <SelectContent>
                            {PREDEFINED_ACTIONS.map(action => (
                                <SelectItem key={action} value={action}>{action}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </TableCell>
            <TableCell>
                <Input
                    type="date"
                    value={dateResolved}
                    onChange={(e) => setDateResolved(e.target.value)}
                    disabled={!isEditing || submittingId === f.id}
                    className="h-9 min-w-[160px] disabled:opacity-100"
                />
            </TableCell>
            <TableCell className="text-right">
                {isEditing ? (
                    <Button
                        size="icon"
                        className="h-9 w-9 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSave}
                        disabled={submittingId === f.id}
                        title="Save"
                    >
                        {submittingId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                ) : (
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        onClick={() => setIsEditing(true)}
                        title={isDone ? "Edit saved transaction" : "Edit"}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}

export default function ActionManager({
    feedbackList,
    onFeedbackUpdated,
}: {
    feedbackList: any[];
    onFeedbackUpdated?: (id: number, patch: Record<string, string>) => void;
}) {
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(feedbackList.length / pageSize));
    const paginatedList = feedbackList.slice((page - 1) * pageSize, page * pageSize);

    const updateAction = async (id: number, actionPassed: string, dateResolved: string, natureOfTransaction: string) => {
        setSubmittingId(id);
        try {
            const res = await fetch("/api/admin/action-provided", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, actionProvided: actionPassed, dateResolved, natureOfTransaction }),
            });
            if (res.ok) {
                toast.success("Action Provided updated!");
                onFeedbackUpdated?.(Number(id), {
                    actionProvided: actionPassed,
                    dateResolved,
                    natureOfTransaction,
                });
                return true;
            } else {
                toast.error("Failed to update action");
                return false;
            }
        } catch (err) {
            toast.error("An error occurred");
            return false;
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <Card className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                    <ListTodo className="h-6 w-6 text-cyan-700" />
                    Manage Actions Provided
                </CardTitle>
                <CardDescription>Assign specific actions taken for each feedback entry.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow>
                            <TableHead>Control No.</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Service Availed</TableHead>
                            <TableHead>Nature of Transaction</TableHead>
                            <TableHead>Action Provided</TableHead>
                            <TableHead>Date Resolved</TableHead>
                            <TableHead className="w-24 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedList.map((f) => (
                            <ActionRow key={f.id} f={f} submittingId={submittingId} updateAction={updateAction} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 p-4">
                <span className="text-sm text-slate-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, feedbackList.length)} of {feedbackList.length} entries
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                </div>
            </div>
        </Card>
    );
}
