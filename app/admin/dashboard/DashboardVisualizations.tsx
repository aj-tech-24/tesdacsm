"use client";

import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle2, Activity, Shapes, FileText, HelpCircle, CheckCircle2, TrendingUp, Sparkles, Gauge, ClipboardCheck } from "lucide-react";

interface Props {
    totalResponses: number;
    genderData: any[];
    ageData: any[];
    customerTypeData: any[];
    transactionData: any[];
    natureData: any[];
    serviceData: any[];
    ccData: any;
    actionData: any[];
    sqdResults: any;
}

const COLORS = ["#0ea5e9", "#f97316", "#14b8a6", "#f43f5e", "#06b6d4", "#84cc16", "#f59e0b", "#0891b2", "#64748b"];
const chartCardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const chartCardTitleClass = "text-base font-semibold tracking-tight text-slate-900";

export default function DashboardVisualizations({
    totalResponses, genderData, ageData, customerTypeData, transactionData, natureData, serviceData, ccData, actionData, sqdResults
}: Props) {
    const getCCData = (ccObj: any, keys: string[], naKey: string | null = null) => {
        const result: any[] = [];
        keys.forEach((k, i) => {
            result.push({ name: k, value: ccObj[k] || 0, color: COLORS[i % COLORS.length] });
        });
        if (naKey) {
            result.push({ name: "N/A", value: ccObj[naKey] || 0, color: "#94a3b8" });
        }
        return result;
    };
    const cc1Data = getCCData(ccData.cc1, ["1", "2", "3", "4"], null);
    const cc2Data = getCCData(ccData.cc2, ["1", "2", "3", "4"], "5");
    const cc3Data = getCCData(ccData.cc3, ["1", "2", "3"], "4");

    const sqdData = Object.keys(sqdResults).map(k => ({
        name: k.toUpperCase(),
        "Strongly Agree": sqdResults[k]["Strongly Agree"] || 0,
        "Agree": sqdResults[k]["Agree"] || 0,
        "Neither Agree nor Disagree": sqdResults[k]["Neither Agree nor Disagree"] || 0,
        "Disagree": sqdResults[k]["Disagree"] || 0,
        "Strongly Disagree": sqdResults[k]["Strongly Disagree"] || 0,
        "N/A": sqdResults[k]["N/A"] || 0,
    }));

    const topService = [...serviceData].sort((a, b) => Number(b.responses || 0) - Number(a.responses || 0))[0];
    const topTransaction = [...transactionData].sort((a, b) => Number(b.responses || 0) - Number(a.responses || 0))[0];
    const sqd0 = sqdResults?.sqd0 || {};
    const positiveSqdCount = Number(sqd0["Strongly Agree"] || 0) + Number(sqd0["Agree"] || 0);
    const positiveSqdRate = totalResponses > 0 ? `${((positiveSqdCount / totalResponses) * 100).toFixed(1)}%` : "0.0%";

    return (
        <div className="w-full space-y-6 pb-10">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card className={chartCardClass}>
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700">
                            <Gauge className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500">Total Responses</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalResponses}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={chartCardClass}>
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500">Most Availed Service</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                                {topService?.name || "No data"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={chartCardClass}>
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                            <ClipboardCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500">Positive SQD (Q0)</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{positiveSqdRate}</p>
                            <p className="text-xs text-slate-500">Top transaction: {topTransaction?.name || "No data"}</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <UserCircle2 className="h-5 w-5 text-sky-600" /> Customers by Gender
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="responses" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {genderData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <Users className="h-5 w-5 text-cyan-700" /> Age Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#0891b2" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <Shapes className="h-5 w-5 text-emerald-600" /> Customer Type
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={customerTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="responses" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {customerTypeData.map((e, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <FileText className="h-5 w-5 text-orange-600" /> Transaction Types
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactionData} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#ea580c" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <HelpCircle className="h-5 w-5 text-amber-600" /> Nature of Transaction
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={natureData} cx="50%" cy="50%" outerRadius={100} dataKey="responses" nameKey="name" label>
                                {natureData.map((e, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={chartCardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <TrendingUp className="h-5 w-5 text-teal-600" /> Service Rendered
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceData} margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#0d9488" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={`${chartCardClass} md:col-span-2`}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <Activity className="h-5 w-5 text-sky-600" /> Citizen's Charter
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="h-[300px] flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-full">
                            <h4 className="text-sm font-medium text-center mb-2">CC1: Awareness</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={cc1Data} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" label>
                                        {cc1Data.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 h-full">
                            <h4 className="text-sm font-medium text-center mb-2">CC2: Visibility</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={cc2Data} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" label>
                                        {cc2Data.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 h-full">
                            <h4 className="text-sm font-medium text-center mb-2">CC3: Helpfulness</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={cc3Data} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" label>
                                        {cc3Data.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Custom Text Legend */}
                    <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pb-2 pt-4 text-xs text-slate-600 md:grid-cols-3">
                        <div>
                            <p className="font-semibold text-slate-800 mb-2">CC1: Awareness Options</p>
                            <ul className="space-y-2 ml-1 text-xs leading-tight">
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[0] }} /> 1. I know what a CC is and I saw this office's CC</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[1] }} /> 2. I know what a CC is but I did not see this office's CC</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[2] }} /> 3. I learned of the CC only when I saw this office's CC</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[3] }} /> 4. I do not know what a CC is and I did not see one in this office</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-2">CC2: Visibility Options</p>
                            <ul className="space-y-2 ml-1 text-xs leading-tight">
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[0] }} /> 1. Easy to see</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[1] }} /> 2. Somewhat easy to see</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[2] }} /> 3. Difficult to see</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[3] }} /> 4. Not visible at all</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full bg-slate-400" /> 5. N/A</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-2">CC3: Helpfulness Options</p>
                            <ul className="space-y-2 ml-1 text-xs leading-tight">
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[0] }} /> 1. Helped very much</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[1] }} /> 2. Somewhat helped</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[2] }} /> 3. Did not help</li>
                                <li className="flex items-start gap-2"><div className="w-3 h-3 mt-0.5 shrink-0 rounded-full bg-slate-400" /> 4. N/A</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className={`${chartCardClass} md:col-span-2`}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Action Provided
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={actionData} layout="vertical" margin={{ left: 220 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={215} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#059669" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className={`${chartCardClass} md:col-span-2`}>
                <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 ${chartCardTitleClass}`}>
                        <TrendingUp className="h-5 w-5 text-orange-600" /> Service Quality Dimensions (SQD)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sqdData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Strongly Agree" fill="#10b981" />
                            <Bar dataKey="Agree" fill="#34d399" />
                            <Bar dataKey="Neither Agree nor Disagree" fill="#fbbf24" />
                            <Bar dataKey="Disagree" fill="#f43f5e" />
                            <Bar dataKey="Strongly Disagree" fill="#be123c" />
                            <Bar dataKey="N/A" fill="#94a3b8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
