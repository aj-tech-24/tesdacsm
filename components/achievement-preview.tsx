import React from "react";
import * as HeroIcons from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/outline";

function getPreviewIcon(iconName?: string | null) {
  const icon = iconName ? (HeroIcons as Record<string, any>)[iconName] : null;
  return typeof icon === "function" ? icon : StarIcon;
}

export default function AchievementPreview({ title, description, image, iconName }: { title: string; description: string; image?: string | null; iconName?: string | null }) {
  const Icon = getPreviewIcon(iconName);

  return (
    <div className="w-full rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      {image ? (
        <img src={image} alt={title} className="h-28 w-full rounded object-cover mb-3" />
      ) : (
        <div className="mb-3 flex h-28 w-full items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50 text-slate-400">
          <Icon className="h-10 w-10 text-slate-500" />
        </div>
      )}
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-cyan-700" />
        <span className="ml-1">{iconName || "StarIcon"}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title || "Untitled"}</h3>
      <p className="text-xs text-slate-600 truncate">{description || "No description"}</p>
    </div>
  );
}
