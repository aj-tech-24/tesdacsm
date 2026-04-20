"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { CalendarRange, Filter } from "lucide-react";

interface MonthFilterProps {
    children?: ReactNode;
    totalResponses?: number;
    reportPeriodLabel?: string;
}

export default function MonthFilter({ children, totalResponses, reportPeriodLabel }: MonthFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [month, setMonth] = useState(searchParams.get("month") || "");
    const [year, setYear] = useState(searchParams.get("year") || new Date().getFullYear().toString());

    const handleApply = () => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== "all") params.set("month", month);
        else params.delete("month");

        if (year) params.set("year", year);
        else params.delete("year");

        router.push(`?${params.toString()}`);
    };

    const months = [
        { val: "all", label: "All Months" },
        { val: "1", label: "January" }, { val: "2", label: "February" }, { val: "3", label: "March" },
        { val: "4", label: "April" }, { val: "5", label: "May" }, { val: "6", label: "June" },
        { val: "7", label: "July" }, { val: "8", label: "August" }, { val: "9", label: "September" },
        { val: "10", label: "October" }, { val: "11", label: "November" }, { val: "12", label: "December" }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                    <div className="rounded-lg bg-slate-100 p-1.5">
                        <CalendarRange className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-wide">Filter Dashboard Data</h3>
                </div>

                <div className="flex w-full flex-col gap-2 md:flex-row md:items-center xl:w-auto">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-full md:w-[190px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-full md:w-[130px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleApply} variant="default" className="gap-2 bg-slate-900 hover:bg-slate-800">
                        <Filter className="h-4 w-4" /> Apply Filter
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
                    {typeof totalResponses !== "undefined" && (
                        <div className="min-w-[132px] rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Responses</p>
                            <p className="mt-1 text-lg font-semibold leading-none text-slate-900">{totalResponses}</p>
                        </div>
                    )}
                    {reportPeriodLabel && (
                        <div className="min-w-[152px] rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Report Period</p>
                            <p className="mt-1 text-sm font-semibold leading-tight text-slate-900">{reportPeriodLabel}</p>
                        </div>
                    )}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
