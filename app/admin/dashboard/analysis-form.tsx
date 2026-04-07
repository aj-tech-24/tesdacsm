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
        <Card className="shadow-md border-0 ring-1 ring-slate-100 mt-8 bg-white">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                    <FileText className="w-6 h-6 text-slate-600" />
                    Overall Dashboard Analysis
                </CardTitle>
                <CardDescription>Enter your summary and key findings based on the metrics above.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <textarea
                    className="w-full min-h-[200px] p-4 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    placeholder="Type your overall analysis here..."
                    value={analysis}
                    onChange={(e) => setAnalysis(e.target.value)}
                />
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700 text-white">
                        {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Analysis</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
