"use client";

import { useEffect, useState } from "react";
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
import ArchiveClient from "../archive/ArchiveClient";
import AchievementsManager from "./AchievementsManager";
import {
    AlertTriangle,
    Archive,
    BarChart3,
    Bell,
    Check,
    CheckCheck,
    ClipboardList,
    FileText,
    Layers3,
    PanelLeft,
    Trophy,
} from "lucide-react";
import LogoutButton from "./logout-button";

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
    const [visibleNotificationCount, setVisibleNotificationCount] = useState(5);
    
    const NOTIFICATIONS_PER_PAGE = 5;
    const activeTabLabelByKey: Record<string, string> = {
        overview: "Overview",
        actions: "Actions",
        analysis: "Analysis",
        "all-feedbacks": "Feedbacks",
        achievements: "Achievements",
    };
    const activeTabLabel = activeTabLabelByKey[activeTab] || "Dashboard";

    const navGroups = [
        {
            id: "primary",
            title: "Dashboard",
            items: [
                { value: "overview", label: "Overview", icon: BarChart3 },
                { value: "actions", label: "Actions", icon: ClipboardList },
                ...(userRole === "super_admin" ? [{ value: "analysis", label: "Analysis", icon: FileText }] : []),
            ],
        },
        {
            id: "content",
            title: "Content",
            items: [
                { value: "all-feedbacks", label: "Feedbacks", icon: Layers3 },
                { value: "achievements", label: "Achievements", icon: Trophy },
                { value: "archive", label: "Archive", icon: Archive },
            ],
        },
    ];
    const navItems = navGroups.flatMap((g) => g.items);
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
        setVisibleNotificationCount(5);
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

    const showOlderNotifications = () => {
        setVisibleNotificationCount((prev) => Math.min(prev + NOTIFICATIONS_PER_PAGE, notifications.length));
    };

    return (
        <div className="min-h-screen print:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen w-full gap-0 lg:flex-row">
                <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto admin-sidebar text-white lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden">
                    <div className="logo-area">
                        <div className="mb-4 flex w-full justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                                Admin Portal
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <img
                                src="/tesda-logo.png"
                                alt="TESDA Logo"
                                className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-white/20"
                            />
                            <div className="min-w-0 text-center">
                                <h2 className="truncate text-[1.05rem] font-bold tracking-tight text-white drop-shadow-sm">TESDA</h2>
                                <p className="truncate text-sm font-medium leading-5 text-white drop-shadow-sm">Analytics Console</p>
                            </div>
                        </div>
                    </div>

                    <TabsList className="nav-list mt-1 flex h-auto w-full flex-col gap-3 bg-transparent p-3 text-white">
                        {navGroups.map((group) => (
                            <div key={group.id} className="mb-1 w-full">
                                {group.title ? <div className="nav-section-title text-white">{group.title}</div> : null}
                                <div className="flex flex-col gap-1.5">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <TabsTrigger
                                                key={item.value}
                                                value={item.value}
                                                className="tab-trigger h-11 w-full justify-start rounded-xl border-0 px-3 text-sm text-white data-[state=active]:bg-white/16 data-[state=active]:text-white data-[state=active]:shadow-none"
                                            >
                                                <span className="flex w-full items-center gap-3 text-left">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/95">
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <span className="truncate font-medium tracking-wide">{item.label}</span>
                                                </span>
                                            </TabsTrigger>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </TabsList>

                    <div className="mt-auto border-t border-white/15 bg-white/10 p-5 text-left backdrop-blur-md text-white" style={{ color: "#ffffff" }}>
                        <div className="sidebar-metrics rounded-2xl p-4 shadow-inner shadow-black/5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white" style={{ color: "#ffffff" }}>Report Period</p>
                            <p className="mt-1 text-sm font-semibold leading-5 text-white" style={{ color: "#ffffff" }}>{reportPeriodLabel}</p>

                            <div className="mt-4 h-px bg-white/10" />

                            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white" style={{ color: "#ffffff" }}>Total Responses</p>
                            <p className="mt-1 text-2xl font-black leading-none text-white drop-shadow-sm" style={{ color: "#ffffff" }}>{totalResponses}</p>
                        </div>
                    </div>
                </aside>

                <div className="min-h-screen min-w-0 flex-1 bg-[#f4f6ff]">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 print:hidden md:px-6">
                        <div className="flex items-center gap-3">
                            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600">
                                <PanelLeft className="h-4 w-4" />
                            </button>
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1">{activeTabLabel}</span>
                            </h3>
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
                                        <Button type="button" variant="admin" size="sm" className="h-8 px-2 text-xs" onClick={markAllNotificationsRead}>
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
                                                                    notifications.slice(0, visibleNotificationCount).map((notification) => {
                                                                        const isUnread = !notification.readAt;
                                                                        const when = notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "";

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
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-sm font-medium text-slate-900 truncate">{notification.clientName || "Anonymous"}</p>
                                                                                            <p className="text-xs text-slate-500 mt-0.5">{when}</p>
                                                                                        </div>
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
                                            {notifications.length > visibleNotificationCount && (
                                                <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={showOlderNotifications}
                                                        className="h-8 w-full justify-center px-3 text-xs"
                                                    >
                                                        Show older
                                                    </Button>
                                                </div>
                                            )}
                                        
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                {userOffice} | {userRole === "super_admin" ? "Super Admin" : "Office Admin"}
                            </span>
                            <LogoutButton />
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
                            <div className="summary-strip">
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
                                <AnalysisForm initialAnalysis={initialAnalysis} reportPeriodLabel={reportPeriodLabel} totalResponses={totalResponses} />
                            </TabsContent>
                        )}

                        <TabsContent value="all-feedbacks" className="mt-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} />
                            <AllFeedbacksTab feedbackList={feedbackRawList} reportPeriodLabel={reportPeriodLabel} />
                        </TabsContent>

                        <TabsContent value="achievements" className="mt-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} showTitle={false} showInputs={false} showCard={false} showStats={false} />
                            <AchievementsManager />
                        </TabsContent>

                        <TabsContent value="archive" className="mt-6 lg:min-w-0 print:hidden">
                            <MonthFilter totalResponses={totalResponses} reportPeriodLabel={reportPeriodLabel} showTitle={false} showInputs={false} showCard={false} showStats={false} />
                            <ArchiveClient userRole={userRole} userOffice={userOffice} />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
