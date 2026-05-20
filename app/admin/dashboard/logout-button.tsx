"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="POST" aria-label="Logout">
      <Button type="submit" variant="outline" size="sm" className="inline-flex items-center gap-2 px-3 py-2" title="Logout">
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </form>
  );
}
