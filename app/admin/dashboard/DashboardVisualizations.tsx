"use client";

import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle2, Activity, Shapes, FileText, HelpCircle, CheckCircle2, TrendingUp } from "lucide-react";

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

const COLORS = ["#3b82f6", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#eab308", "#14b8a6", "#6366f1"];

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-10">
            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <UserCircle2 className="w-5 h-5 text-blue-500" /> Customers by Gender
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

            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <Users className="w-5 h-5 text-indigo-500" /> Age Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <Shapes className="w-5 h-5 text-emerald-500" /> Customer Type
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

            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <FileText className="w-5 h-5 text-rose-500" /> Transaction Types
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactionData} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <HelpCircle className="w-5 h-5 text-amber-500" /> Nature of Transaction
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

            <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <TrendingUp className="w-5 h-5 text-purple-500" /> Service Rendered
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceData} margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md border-0 ring-1 ring-slate-100 md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <Activity className="w-5 h-5 text-cyan-500" /> Citizen's Charter
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 border-t border-slate-100 pt-4 pb-2">
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

            <Card className="shadow-md border-0 ring-1 ring-slate-100 md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-5 h-5 text-teal-500" /> Action Provided
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={actionData} layout="vertical" margin={{ left: 220 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={215} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md border-0 ring-1 ring-slate-100 md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                        <TrendingUp className="w-5 h-5 text-orange-500" /> Service Quality Dimensions (SQD)
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
    );
}
