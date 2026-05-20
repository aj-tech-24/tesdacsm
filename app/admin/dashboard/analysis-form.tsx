"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, CalendarRange, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export default function AnalysisForm({ initialAnalysis, reportPeriodLabel, totalResponses }: { initialAnalysis: string; reportPeriodLabel: string; totalResponses: number }) {
    const [analysis, setAnalysis] = useState(initialAnalysis);
    const [isSaving, setIsSaving] = useState(false);
    const hasChanges = useMemo(() => analysis.trim() !== initialAnalysis.trim(), [analysis, initialAnalysis]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: analysis }),
            });
            if (res.ok) {
                toast.success("Analysis saved successfully");
            } else {
                toast.error("Failed to save analysis");
            }
        } catch (err) {
            toast.error("An error occurred while saving");
        }
        setIsSaving(false);
    };

    return (
        <Card className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600" />
            <CardHeader className="space-y-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-800">
                            <Sparkles className="h-3.5 w-3.5" /> Filtered Analysis
                        </div>
                        <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                            <FileText className="h-5 w-5 text-cyan-700" />
                            Overall Dashboard Analysis
                        </CardTitle>
                        <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                            Summarize the main patterns, notable changes, and any actions you want to call out for the selected period.
                        </CardDescription>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[22rem]">
                        <div className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <CalendarRange className="h-3.5 w-3.5 text-cyan-700" /> Report Period
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{reportPeriodLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Responses in Scope</p>
                            <p className="mt-2 text-2xl font-black leading-none text-slate-900">{totalResponses}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5 lg:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner shadow-white/60 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-100">
                    <textarea
                        className="min-h-[260px] w-full resize-y bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                        placeholder="Write a short executive summary, key observations, and any follow-up items here..."
                        value={analysis}
                        onChange={(e) => setAnalysis(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        {hasChanges ? "You have unsaved changes." : "No changes yet."}
                    </p>
                    <Button
                        onClick={handleSave}
                        size="sm"
                        disabled={isSaving || !hasChanges}
                        className="h-10 bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {isSaving ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Analysis
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
