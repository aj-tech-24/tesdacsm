"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Printer } from "lucide-react";

interface ArchiveCardProps {
    monthKey: string;
    monthName: string;
    year: number;
    total: number;
    answered: number;
    pending: number;
    archived: number;
    isLoading?: boolean;
    onPrint: (monthKey: string) => void;
    downloading?: boolean;
    downloadProgress?: number | null;
    onArchive: (monthKey: string) => void;
}

export default function ArchiveCard({
    monthKey,
    monthName,
    year,
    total,
    answered,
    pending,
    archived,
    isLoading = false,
    downloading = false,
    downloadProgress = null,
    onPrint,
    onArchive,
}: ArchiveCardProps) {
    const answeredPercent = total > 0 ? Math.round((answered / total) * 100) : 0;
    
    // Determine color scheme based on completion
    const statusColor = answeredPercent === 100 
        ? "bg-emerald-50 border-emerald-200" 
        : answeredPercent >= 80 
        ? "bg-blue-50 border-blue-200"
        : "bg-amber-50 border-amber-200";

    const badgeColor = answeredPercent === 100 
        ? "bg-emerald-100 text-emerald-800" 
        : answeredPercent >= 80 
        ? "bg-blue-100 text-blue-800"
        : "bg-amber-100 text-amber-800";

    return (
        <Card className={`border-2 ${statusColor} bg-white hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                        {monthName} {year}
                    </CardTitle>
                    <Badge 
                        variant="secondary"
                        className={badgeColor}
                    >
                        {answeredPercent}%
                    </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    {monthKey}
                </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Counts Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2.5 bg-white rounded border border-slate-200">
                        <p className="text-2xl font-bold text-slate-900">{total}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Total</p>
                    </div>
                    <div className="text-center p-2.5 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-700">{answered}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">Answered</p>
                    </div>
                </div>

                {/* Pending & Archived Info */}
                {pending > 0 && (
                    <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700">
                            {pending} pending
                        </p>
                    </div>
                )}

                {archived > 0 && (
                    <div className="text-center p-2 bg-slate-50 rounded border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700">
                            📁 {archived} archived
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                    <div className="flex-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full flex items-center justify-center text-xs h-9"
                            onClick={() => onPrint(monthKey)}
                            disabled={isLoading || answered === 0}
                            title={answered === 0 ? "No answered feedbacks to download" : "Download PDF of answered feedbacks"}
                        >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            {downloading ? (downloadProgress !== null ? `Downloading ${downloadProgress}%` : `Downloading`) : "Download PDF"}
                        </Button>
                        {downloading && (
                            <div className="h-1 mt-2 bg-slate-100 rounded overflow-hidden">
                                <div className="h-1 bg-emerald-500" style={{ width: `${downloadProgress ?? 5}%`, transition: 'width 200ms linear' }} />
                            </div>
                        )}
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-9"
                        onClick={() => onArchive(monthKey)}
                        disabled={isLoading}
                        title="Archive this month's feedbacks"
                    >
                        <Archive className="h-3.5 w-3.5 mr-1" />
                        Archive
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
