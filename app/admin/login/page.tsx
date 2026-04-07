"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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
                router.push("/admin/dashboard");
                router.refresh();
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-blue-600">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">Admin Access</CardTitle>
                    <CardDescription className="text-slate-500">
                        Please enter the administrator password to view metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Enter Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full text-center"
                                autoFocus
                                disabled={isLoading}
                            />
                            <Input
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full text-center"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-md border border-red-100">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full h-11" disabled={isLoading || !password || !username}>
                            {isLoading ? (
                                "Verifying..."
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" /> Login to Dashboard
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
