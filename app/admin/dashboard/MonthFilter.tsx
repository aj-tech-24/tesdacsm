"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { CalendarRange, Filter, Loader2 } from "lucide-react";

interface MonthFilterProps {
    children?: ReactNode;
    totalResponses?: number;
    reportPeriodLabel?: string;
    showTitle?: boolean;
    showInputs?: boolean;
    showCard?: boolean;
    showStats?: boolean;
}

export default function MonthFilter({ children, totalResponses, reportPeriodLabel, showTitle = true, showInputs = true, showCard = true, showStats = true }: MonthFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();

    const [month, setMonth] = useState(searchParams.get("month") || "");
    const [year, setYear] = useState(searchParams.get("year") || "all");
    const [office, setOffice] = useState(searchParams.get("office") || "all");
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        setIsApplying(false);
    }, [searchParamsString]);

    const handleApply = () => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== "all") params.set("month", month);
        else params.delete("month");

        if (year && year !== "all") params.set("year", year);
        else params.delete("year");

        if (office && office !== "all") params.set("office", office);
        else params.delete("office");

        const nextQuery = params.toString();
        if (nextQuery === searchParamsString) return;

        setIsApplying(true);
        router.push(`?${nextQuery}`);
    };

    const months = [
        { val: "all", label: "All Months" },
        { val: "1", label: "January" }, { val: "2", label: "February" }, { val: "3", label: "March" },
        { val: "4", label: "April" }, { val: "5", label: "May" }, { val: "6", label: "June" },
        { val: "7", label: "July" }, { val: "8", label: "August" }, { val: "9", label: "September" },
        { val: "10", label: "October" }, { val: "11", label: "November" }, { val: "12", label: "December" }
    ];

    const currentYear = new Date().getFullYear();
    const years = ["all", ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

    const offices = [
        { val: "all", label: "All Offices" },
        { val: "ccnts", label: "Region XI/TESDA CCNTS" },
        { val: "po", label: "REGION XI/PROVINICAL OFFICE" },
        { val: "ptc-ds", label: "Region XI/TESDA PTC - DS" },
    ];

    const hasActiveFilters = month !== "" || year !== "all" || office !== "all";

    const handleClear = () => {
        if (!hasActiveFilters || isApplying) return;

        setMonth("");
        setYear("all");
        setOffice("all");
        setIsApplying(true);
        router.push("?");
    };

    // If caller requests no card, render only the small stats / children area so the filter
    // UI doesn't occupy a rounded card. This is used by the Archive tab which manages its
    // own controls and shouldn't display the dashboard filter card.
    if (!showCard) {
        return (
            <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
                {showStats && typeof totalResponses !== "undefined" && (
                    <div className="min-w-[116px] rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Responses</p>
                        <p className="mt-1 text-base font-semibold leading-none text-slate-900">{totalResponses}</p>
                    </div>
                )}
                {showStats && reportPeriodLabel && (
                    <div className="min-w-[140px] rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Report Period</p>
                        <p className="mt-1 text-xs font-semibold leading-tight text-slate-900">{reportPeriodLabel}</p>
                    </div>
                )}
                <div>{children}</div>
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm print:hidden">
            <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                    <div className="rounded-lg bg-slate-100 p-1">
                        <CalendarRange className="h-3.5 w-3.5" />
                    </div>
                    {showTitle ? (
                        <h3 className="text-xs font-semibold tracking-wide">Filter Dashboard Data</h3>
                    ) : null}
                </div>

                {showInputs ? (
                    <div className="flex w-full flex-col gap-2 md:flex-row md:items-center xl:w-auto">
                        <Select value={month} onValueChange={setMonth} disabled={isApplying}>
                            <SelectTrigger className="h-9 w-full md:w-[170px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={year} onValueChange={setYear} disabled={isApplying}>
                            <SelectTrigger className="h-9 w-full md:w-[120px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y === "all" ? "All Years" : y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={office} onValueChange={setOffice} disabled={isApplying}>
                            <SelectTrigger className="h-9 w-full md:w-[200px]">
                                <SelectValue placeholder="Office" />
                            </SelectTrigger>
                            <SelectContent>
                                {offices.map(o => <SelectItem key={o.val} value={o.val}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Button onClick={handleApply} size="sm" variant="admin" disabled={isApplying} className="h-9 gap-2 px-3 text-xs">
                                    {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                    {isApplying ? "Applying..." : "Apply Filter"}
                                </Button>

                            {hasActiveFilters ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClear}
                                    disabled={isApplying}
                                    className="h-9 px-3 text-xs"
                                >
                                    Clear filters
                                </Button>
                            ) : null}
                        </div>

                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
                    {showStats && typeof totalResponses !== "undefined" && (
                        <div className="min-w-[116px] rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Responses</p>
                            <p className="mt-1 text-base font-semibold leading-none text-slate-900">{totalResponses}</p>
                        </div>
                    )}
                    {showStats && reportPeriodLabel && (
                        <div className="min-w-[140px] rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Report Period</p>
                            <p className="mt-1 text-xs font-semibold leading-tight text-slate-900">{reportPeriodLabel}</p>
                        </div>
                    )}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
