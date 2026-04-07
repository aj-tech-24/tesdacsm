"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLogoutButton() {
    const router = useRouter();
    return (
        <Button
            variant="outline"
            size="sm"
            className="text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.push("/admin/login");
                router.refresh();
            }}
        >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
        </Button>
    );
}
