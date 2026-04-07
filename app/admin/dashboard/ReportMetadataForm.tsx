"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Check } from "lucide-react";

export default function ReportMetadataForm() {
    const [metadata, setMetadata] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedState, setSavedState] = useState(false);

    useEffect(() => {
        fetch("/api/report-metadata")
            .then(res => res.json())
            .then(data => {
                setMetadata(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load metadata", err);
                setIsLoading(false);
            });
    }, []);

    const handleChange = (field: string, value: string) => {
        setMetadata({ ...metadata, [field]: value });
        setSavedState(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/report-metadata", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(metadata),
            });
            if (res.ok) {
                setSavedState(true);
                setTimeout(() => setSavedState(false), 3000);
            }
        } catch (error) {
            console.error("Failed to save metadata", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading metadata form...</div>;
    }

    if (!metadata) return null;

    return (
        <Card className="mb-8 shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-slate-800">Report Header Information</CardTitle>
                <CardDescription>
                    Configure the metadata fields that will appear in the consolidated PDF report.
                    These settings belong to the Provincial Office.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="regionExecutive">Region / Executive Office</Label>
                        <Input
                            id="regionExecutive"
                            value={metadata.regionExecutive || ""}
                            onChange={(e) => handleChange("regionExecutive", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="provinceDistrict">Province / District Office</Label>
                        <Input
                            id="provinceDistrict"
                            value={metadata.provinceDistrict || ""}
                            onChange={(e) => handleChange("provinceDistrict", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="operatingUnit">Operating Unit</Label>
                        <Input
                            id="operatingUnit"
                            value={metadata.operatingUnit || ""}
                            onChange={(e) => handleChange("operatingUnit", e.target.value)}
                            placeholder="e.g. Provincial Office of Davao del Sur"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="headOfUnit">Head of Operating Unit</Label>
                        <Input
                            id="headOfUnit"
                            value={metadata.headOfUnit || ""}
                            onChange={(e) => handleChange("headOfUnit", e.target.value)}
                            placeholder="Full Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="designation">Designation / Position</Label>
                        <Input
                            id="designation"
                            value={metadata.designation || ""}
                            onChange={(e) => handleChange("designation", e.target.value)}
                            placeholder="e.g. Acting Provincial Director"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cusatFocal">CUSAT Focal</Label>
                        <Input
                            id="cusatFocal"
                            value={metadata.cusatFocal || ""}
                            onChange={(e) => handleChange("cusatFocal", e.target.value)}
                            placeholder="Full Name"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={savedState ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700"}
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : savedState ? (
                            <><Check className="w-4 h-4 mr-2" /> Saved Successfully</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" /> Save Metadata</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
