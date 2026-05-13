"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import MonthFilter from "./MonthFilter";
import DashboardVisualizations from "./DashboardVisualizations";
import ActionManager from "./action-manager";
import AnalysisForm from "./analysis-form";
import AllFeedbacksTab from "./AllFeedbacksTab";
import {
    AlertTriangle,
    BarChart3,
    Bell,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    Layers3,
    LogOut,
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
    initialNotifications: any[];
    initialUnreadCount: number;
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
    initialNotifications,
    initialUnreadCount,
    initialAnalysis,
}: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [feedbackList, setFeedbackList] = useState<any[]>(allFeedback);
    const [feedbackRawList, setFeedbackRawList] = useState<any[]>(allFeedbackRaw);
    const [notifications, setNotifications] = useState<any[]>(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [notificationPage, setNotificationPage] = useState(1);
    const NOTIFICATIONS_PER_PAGE = 5;
    const activeTabLabelByKey: Record<string, string> = {
        overview: "Overview",
        actions: "Actions",
        analysis: "Analysis",
        "all-feedbacks": "Feedbacks",
    };
    const activeTabLabel = activeTabLabelByKey[activeTab] || "Dashboard";

    const paginatedNotifications = useMemo(() => {
        const startIndex = (notificationPage - 1) * NOTIFICATIONS_PER_PAGE;
        const endIndex = startIndex + NOTIFICATIONS_PER_PAGE;
        return notifications.slice(startIndex, endIndex);
    }, [notifications, notificationPage]);

    const totalNotificationPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE);

    const navItems = [
        { value: "overview", label: "Overview", icon: BarChart3 },
        { value: "actions", label: "Actions", icon: ClipboardList },
        ...(userRole === "super_admin" ? [{ value: "analysis", label: "Analysis", icon: FileText }] : []),
        { value: "all-feedbacks", label: "Feedbacks", icon: Layers3 },
    ];
    const mobileNavGridClass = userRole === "super_admin" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2";

    useEffect(() => {
        setFeedbackList(allFeedback);
    }, [allFeedback]);

    useEffect(() => {
        setFeedbackRawList(allFeedbackRaw);
    }, [allFeedbackRaw]);

    useEffect(() => {
        setNotifications(initialNotifications);
        setUnreadCount(initialUnreadCount);
    }, [initialNotifications, initialUnreadCount]);

    useEffect(() => {
        let isActive = true;

        const loadNotifications = async () => {
            try {
                const response = await fetch("/api/admin/notifications", { cache: "no-store" });
                if (!response.ok) return;

                const payload = await response.json();
                if (!isActive || !payload?.success) return;

                setNotifications(payload.notifications || []);
                setUnreadCount(Number(payload.unreadCount || 0));
            } catch {
                // Keep the last known notification state if polling fails.
            }
        };

        loadNotifications();
        const timer = window.setInterval(loadNotifications, 30000);

        return () => {
            isActive = false;
            window.clearInterval(timer);
        };
    }, []);

    const handleFeedbackUpdated = (id: number, patch: Record<string, string>) => {
        setFeedbackList((prev) => prev.map((row) => (Number(row.id) === id ? { ...row, ...patch } : row)));
        setFeedbackRawList((prev) => prev.map((row) => (Number(row.id) === id ? { ...row, ...patch } : row)));
    };

    const refreshNotifications = async () => {
        try {
            const response = await fetch("/api/admin/notifications", { cache: "no-store" });
            if (!response.ok) return;

            const payload = await response.json();
            if (!payload?.success) return;

            setNotifications(payload.notifications || []);
            setUnreadCount(Number(payload.unreadCount || 0));
        } catch {
            // Ignore transient refresh failures.
        }
    };

    const markNotificationRead = async (id: number, feedbackId?: number) => {
        try {
            const response = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) return;
            await refreshNotifications();
            
            // Navigate to the feedback if feedbackId is provided
            if (feedbackId !== undefined) {
                setActiveTab("all-feedbacks");
                // Scroll to the feedback after a small delay to ensure tab is rendered
                setTimeout(() => {
                    const feedbackElement = document.querySelector(`[data-feedback-id="${feedbackId}"]`);
                    if (feedbackElement) {
                        feedbackElement.scrollIntoView({ behavior: "smooth", block: "center" });
                        feedbackElement.classList.add("ring-2", "ring-amber-400");
                        setTimeout(() => {
                            feedbackElement.classList.remove("ring-2", "ring-amber-400");
                        }, 3000);
                    }
                }, 100);
            }
        } catch {
            // Ignore transient failures.
        }
    };

    const resolveNotification = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, resolve: true }),
            });

            if (!response.ok) return;
            await refreshNotifications();
        } catch {
            // Ignore transient failures.
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            const response = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });

            if (!response.ok) return;
            await refreshNotifications();
        } catch {
            // Ignore transient failures.
        }
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="relative h-9 w-9 rounded-lg border-slate-200 bg-white p-0 shadow-sm transition hover:bg-slate-50"
                                        aria-label="Open notification alerts"
                                    >
                                        <Bell className="h-4 w-4 text-slate-700" />
                                        {unreadCount > 0 && (
                                            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full bg-rose-600 px-0.5 text-[9px] font-semibold text-white shadow-sm">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[calc(100vw-2rem)] max-w-md border-slate-200 p-0 shadow-2xl md:w-[420px]" align="end" sideOffset={8}>
                                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Low rating alerts</p>
                                            <p className="text-xs text-slate-500">Recent 1-star and low-score feedback from customers</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600" onClick={markAllNotificationsRead}>
                                            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
                                        </Button>
                                    </div>
                                    <div className="flex flex-col h-[420px]">
                                        <ScrollArea className="flex-1">
                                            <div className="divide-y divide-slate-100">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                                        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
                                                        No low-rating alerts right now.
                                                    </div>
                                                ) : (
                                                    paginatedNotifications.map((notification) => {
                                                        const isUnread = !notification.readAt;

                                                        return (
                                                            <div
                                                                key={notification.id}
                                                                className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 transition hover:bg-slate-50 ${isUnread ? "bg-rose-50/60" : "bg-white"}`}
                                                            >
                                                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isUnread ? "bg-rose-500" : "bg-slate-300"}`} />
                                                                <button
                                                                    type="button"
                                                                    className="min-w-0 flex-1 text-left"
                                                                    onClick={() => markNotificationRead(notification.id, notification.feedbackId)}
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="text-sm font-medium text-slate-900 truncate">{notification.clientName || "Anonymous"}</p>
                                                                        {notification.lowestRating ? (
                                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 whitespace-nowrap">
                                                                                {notification.lowestRating}-star
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                                                    onClick={(e) => resolveNotification(notification.id, e)}
                                                                    title="Resolve notification"
                                                                    aria-label="Resolve notification"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </ScrollArea>
                                        {notifications.length > 0 && totalNotificationPages > 1 && (
                                            <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-between bg-slate-50">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setNotificationPage((prev) => Math.max(1, prev - 1))}
                                                    disabled={notificationPage === 1}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-slate-600">
                                                    {notificationPage} of {totalNotificationPages}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setNotificationPage((prev) => Math.min(totalNotificationPages, prev + 1))}
                                                    disabled={notificationPage === totalNotificationPages}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
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
