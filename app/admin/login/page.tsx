"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Lock, LogIn, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                window.location.replace("/admin/dashboard");
            } else {
                const data = await response.json();
                setError(data.error || "Invalid password");
            }
        } catch (err) {
            setError("An error occurred during login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,252,1),rgba(238,242,247,1))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-200/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-4 h-72 w-72 rounded-full bg-cyan-200/15 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-xl items-stretch justify-center">
                <Card className="auth-card relative w-full overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/92 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600" />
                    <CardHeader className="pb-6 text-center">
                        <div className="auth-hero mx-auto shadow-sm">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure sign-in
                        </div>
                        <CardTitle className="auth-title mt-4 text-3xl">Admin Sign In</CardTitle>
                        <CardDescription className="auth-desc mx-auto mt-2 max-w-sm text-sm leading-6">
                            Enter your credentials to continue to the dashboard.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-8">
                        <form onSubmit={handleLogin} className="space-y-4" aria-live="polite">
                            <div className="space-y-2">
                                <label htmlFor="admin-username" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Username
                                </label>
                                <Input
                                    id="admin-username"
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-12 border-slate-200 bg-slate-50/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-cyan-500"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Password
                                </label>
                                <Input
                                    id="admin-password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 border-slate-200 bg-slate-50/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-cyan-500"
                                    disabled={isLoading}
                                />
                            </div>

                            {error ? (
                                <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2.5 text-sm text-rose-700" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </p>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-500">
                                    <span>Use your assigned admin account for secure access.</span>
                                    <span className="inline-flex items-center gap-2 font-medium text-slate-600">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Protected
                                    </span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="primary-cta h-12 w-full border-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-transform duration-200 hover:-translate-y-0.5 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-600"
                                disabled={isLoading || !password || !username}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying Credentials...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Continue to Dashboard
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
