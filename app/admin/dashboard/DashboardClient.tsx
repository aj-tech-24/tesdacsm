"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthFilter from "./MonthFilter";
import DashboardVisualizations from "./DashboardVisualizations";
import ActionManager from "./action-manager";
import AnalysisForm from "./analysis-form";
import AllFeedbacksTab from "./AllFeedbacksTab";
import ReportsTab from "./ReportsTab";
import { useState } from "react";

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

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-5xl mx-auto mb-8 print:hidden">
                    <TabsTrigger value="overview">Dashboard Visuals</TabsTrigger>
                    <TabsTrigger value="report">Report</TabsTrigger>
                    <TabsTrigger value="actions">Action Manager</TabsTrigger>
                    {userRole === "super_admin" && (
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    )}
                    <TabsTrigger value="all-feedbacks">All Feedbacks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 print:hidden">
                    <MonthFilter />
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h2>
                        <p className="text-slate-500 mt-2">
                            A comprehensive breakdown of client demographics and transaction data mapped to visual charts.
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

                <TabsContent value="report" className="print:block">
                    <ReportsTab
                        reportPeriodLabel={reportPeriodLabel}
                        reportMetadata={reportMetadata}
                        totalResponses={totalResponses}
                        officeResponseData={officeResponseData}
                        serviceData={serviceData}
                        transactionData={transactionData}
                        genderData={genderData}
                        ageData={ageData}
                        allFeedbackRaw={allFeedbackRaw}
                    />
                </TabsContent>

                <TabsContent value="actions" className="print:hidden">
                    <MonthFilter />
                    <ActionManager feedbackList={allFeedback} />
                </TabsContent>

                {userRole === "super_admin" && (
                    <TabsContent value="analysis" className="print:hidden">
                        <MonthFilter />
                        <AnalysisForm initialAnalysis={initialAnalysis} />
                    </TabsContent>
                )}

                <TabsContent value="all-feedbacks" className="print:hidden">
                    <AllFeedbacksTab feedbackList={allFeedbackRaw} />
                </TabsContent>
            </Tabs>
        </>
    );
}
