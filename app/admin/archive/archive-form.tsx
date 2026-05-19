"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ArchiveFormProps {
    selectedYear: string;
    onYearChange: (year: string) => void;
    availableYears: number[];
    isLoading?: boolean;
    monthCount: number;
}

export default function ArchiveForm({
    selectedYear,
    onYearChange,
    availableYears,
    isLoading = false,
    monthCount,
}: ArchiveFormProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Year Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">
                    Filter by Year:
                </label>
                <Select value={selectedYear} onValueChange={onYearChange} disabled={isLoading}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">
                    {monthCount} {monthCount === 1 ? "month" : "months"} shown
                </span>
            </div>
        </div>
    );
}
