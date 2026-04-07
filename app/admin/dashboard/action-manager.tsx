"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTodo } from "lucide-react";
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

function ActionRow({
    f,
    submittingId,
    updateAction,
}: {
    f: any,
    submittingId: number | null,
    updateAction: (id: number, act: string, dateResolved: string) => void
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

    const handleSave = () => {
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

        updateAction(f.id, actionToSave, dateResolved);
    };

    return (
        <TableRow>
            <TableCell className="font-medium text-slate-700">{f.controlNumber}</TableCell>
            <TableCell>{f.name || "Anonymous"}</TableCell>
            <TableCell className="max-w-[200px] truncate" title={f.citizensCharterService}>
                {f.citizensCharterService || "N/A"}
            </TableCell>
            <TableCell>
                {localAction === OTHERS_ACTION ? (
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
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Select value={localAction} onValueChange={setLocalAction}>
                        <SelectTrigger className="w-full min-w-[250px] shadow-none h-9">
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
                    className="h-9 min-w-[160px]"
                />
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSave}
                    disabled={submittingId === f.id}
                >
                    {submittingId === f.id ? "..." : "Save"}
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function ActionManager({ feedbackList }: { feedbackList: any[] }) {
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(feedbackList.length / pageSize));
    const paginatedList = feedbackList.slice((page - 1) * pageSize, page * pageSize);

    const updateAction = async (id: number, actionPassed: string, dateResolved: string) => {
        setSubmittingId(id);
        try {
            const res = await fetch("/api/admin/action-provided", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, actionProvided: actionPassed, dateResolved }),
            });
            if (res.ok) {
                toast.success("Action Provided updated!");
            } else {
                toast.error("Failed to update action");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
        setSubmittingId(null);
    };

    return (
        <Card className="shadow-md border-0 ring-1 ring-slate-100 mt-8">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                    <ListTodo className="w-6 h-6 text-indigo-600" />
                    Manage Actions Provided
                </CardTitle>
                <CardDescription>Assign specific actions taken for each feedback entry.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Control No.</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Service Availed</TableHead>
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
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
