import React from "react";
import "./admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:sr-only-inline absolute top-4 left-4 z-50 rounded px-3 py-2 bg-white/90 text-sm font-medium">Skip to content</a>
      <div className="admin-content">
        <div id="toast-aria-live" aria-live="polite" className="sr-only" />
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
