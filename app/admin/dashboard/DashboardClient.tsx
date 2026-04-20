"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthFilter from "./MonthFilter";
import DashboardVisualizations from "./DashboardVisualizations";
import ActionManager from "./action-manager";
import AnalysisForm from "./analysis-form";
import AllFeedbacksTab from "./AllFeedbacksTab";
import { useState } from "react";
import {
    BarChart3,
    ClipboardList,
    FileText,
    Layers3,
    LogOut,
    Mail,
    PanelLeft,
} from "lucide-react";

interface DashboardClientProps {
    userRole: string;
    userOffice: string;
    reportMetadata: any;
    allFeedback: any[];
    allFeedbackRaw: any[];
    totalResponses: number;
    reportPeriodLabel: string;
    officeResponseData: any[];
    genderData: any[];
    ageData: any[];
    customerTypeData: any[];
    transactionData: any[];
    natureData: any[];
    serviceData: any[];
    ccData: any;
    ccOfficeData: any;
    actionData: any[];
    sqdResults: any;
    sqdOfficeData: any;
    initialAnalysis: string;
}

export default function DashboardClient({
    userRole,
    userOffice,
    reportMetadata,
    allFeedback,
    allFeedbackRaw,
    totalResponses,
    reportPeriodLabel,
    officeResponseData,
    genderData,
    ageData,
    customerTypeData,
    transactionData,
    natureData,
    serviceData,
    ccData,
    ccOfficeData,
    actionData,
    sqdResults,
    sqdOfficeData,
    initialAnalysis,
}: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [feedbackList, setFeedbackList] = useState<any[]>(allFeedback);
    const [feedbackRawList, setFeedbackRawList] = useState<any[]>(allFeedbackRaw);
    const activeTabLabelByKey: Record<string, string> = {
        overview: "Overview",
        actions: "Actions",
        analysis: "Analysis",
        "all-feedbacks": "Feedbacks",
    };
    const activeTabLabel = activeTabLabelByKey[activeTab] || "Dashboard";

    const navItems = [
        { value: "overview", label: "Overview", icon: BarChart3 },
        { value: "actions", label: "Actions", icon: ClipboardList },
        ...(userRole === "super_admin" ? [{ value: "analysis", label: "Analysis", icon: FileText }] : []),
        { value: "all-feedbacks", label: "Feedbacks", icon: Layers3 },
    ];
    const mobileNavGridClass = userRole === "super_admin" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2";

    const handleFeedbackUpdated = (id: number, patch: Record<string, string>) => {
        setFeedbackList((prev) => prev.map((row) => (Number(row.id) === id ? { ...row, ...patch } : row)));
        setFeedbackRawList((prev) => prev.map((row) => (Number(row.id) === id ? { ...row, ...patch } : row)));
    };

    return (
        <div className="min-h-screen print:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen w-full gap-0 lg:flex-row">
                <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-[#2f2b99] to-[#342f8f] text-white lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden">
                    <div className="border-b border-white/15 p-5">
                        <div className="mb-3 flex justify-center">
                            <img
                                src="/tesda-logo.png"
                                alt="TESDA Logo"
                                className="h-14 w-14 rounded-full bg-white p-1 shadow-sm"
                            />
                        </div>
                        <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">TESDA</h2>
                        <p className="text-center text-sm text-white/70">Analytics Console</p>
                    </div>

                    <TabsList className="mt-2 flex h-auto w-full flex-col gap-1 bg-transparent p-3 text-white">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <TabsTrigger
                                    key={item.value}
                                    value={item.value}
                                    className="h-11 w-full justify-start rounded-xl border-0 px-3 text-sm text-white/85 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none"
                                >
                                    <Icon className="h-4 w-4" /> {item.label}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    <div className="mt-auto border-t border-white/15 p-5">
                        <p className="text-xs text-white/70">Report Period</p>
                        <p className="mt-1 text-sm font-semibold">{reportPeriodLabel}</p>
                        <p className="mt-3 text-xs text-white/70">Total Responses</p>
                        <p className="text-lg font-semibold">{totalResponses}</p>
                    </div>
                </aside>

                <div className="min-h-screen min-w-0 flex-1 bg-[#f4f6ff]">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 print:hidden md:px-6">
                        <div className="flex items-center gap-3">
                            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600">
                                <PanelLeft className="h-4 w-4" />
                            </button>
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{activeTabLabel}</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600">
                                <Mail className="h-4 w-4" />
                            </button>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                {userOffice} | {userRole === "super_admin" ? "Super Admin" : "Office Admin"}
                            </span>
                            <form action="/api/admin/logout" method="POST">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    <LogOut className="h-4 w-4" /> Logout
                                </button>
                            </form>
                        </div>
                    </header>

                    <div className="p-4 md:p-6">
                        <TabsList className={`mb-4 grid w-full gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 lg:hidden print:hidden ${mobileNavGridClass}`}>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <TabsTrigger
                                        key={`mobile-${item.value}`}
                                        value={item.value}
                                        className="h-10 w-full gap-2 rounded-lg px-3 text-slate-700 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                                    >
                                        <Icon className="h-4 w-4" /> {item.label}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        <TabsContent value="overview" className="mt-6 space-y-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} />
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-xl font-semibold text-slate-900">Overview Snapshot</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Demographics, transaction behavior, citizen charter responses, and SQD trends.
                                </p>
                            </div>
                            <DashboardVisualizations
                                totalResponses={totalResponses}
                                genderData={genderData}
                                ageData={ageData}
                                customerTypeData={customerTypeData}
                                transactionData={transactionData}
                                natureData={natureData}
                                serviceData={serviceData}
                                ccData={ccData}
                                actionData={actionData}
                                sqdResults={sqdResults}
                            />
                        </TabsContent>

                        <TabsContent value="actions" className="mt-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} />
                            <ActionManager feedbackList={feedbackList} onFeedbackUpdated={handleFeedbackUpdated} />
                        </TabsContent>

                        {userRole === "super_admin" && (
                            <TabsContent value="analysis" className="mt-6 lg:min-w-0 print:hidden">
                                <AnalysisForm initialAnalysis={initialAnalysis} />
                            </TabsContent>
                        )}

                        <TabsContent value="all-feedbacks" className="mt-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} />
                            <AllFeedbacksTab feedbackList={feedbackRawList} reportPeriodLabel={reportPeriodLabel} />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
