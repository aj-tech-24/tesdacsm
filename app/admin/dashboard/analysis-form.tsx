"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AnalysisForm({ initialAnalysis }: { initialAnalysis: string }) {
    const [analysis, setAnalysis] = useState(initialAnalysis);
    const [isSaving, setIsSaving] = useState(false);

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
        <Card className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                    <FileText className="h-6 w-6 text-cyan-700" />
                    Overall Dashboard Analysis
                </CardTitle>
                <CardDescription>Enter your summary and key findings based on the metrics above.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <textarea
                    className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="Type your overall analysis here..."
                    value={analysis}
                    onChange={(e) => setAnalysis(e.target.value)}
                />
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                        {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Analysis</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
