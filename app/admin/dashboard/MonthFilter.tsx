"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

interface MonthFilterProps {
    children?: ReactNode;
}

export default function MonthFilter({ children }: MonthFilterProps) {
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
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 print:hidden mb-6">
            <h3 className="font-semibold text-slate-700 mr-4">Filter Data</h3>

            <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>

            <Button onClick={handleApply} variant="default" className="bg-blue-600 hover:bg-blue-700">
                Apply Filter
            </Button>

            <div className="flex-1"></div>

            {children}
        </div>
    );
}
