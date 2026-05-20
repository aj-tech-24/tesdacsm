"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImagePlus, Loader2, Search, Sparkles, Trash2, Check } from "lucide-react";
import * as HeroIcons from "@heroicons/react/24/outline";
import { isSupportedAchievementImageType, isAchievementImageTooLarge } from "../../../lib/achievement-image-validation";
import AchievementPreview from "@/components/achievement-preview";

type AchievementItem = {
  id: number;
  title: string;
  description: string;
  imagePath: string | null;
  iconName: string | null;
  isActive: boolean;
  displayOrder: number;
};

type IconOption = {
  name: string;
  Icon: any;
};

type IconPickerTarget =
  | { type: "new" }
  | { type: "item"; itemId: number }
  | null;

const ACHIEVEMENTS_VERSION_KEY = "achievementsVersion";
const ACHIEVEMENTS_VERSION_CHANNEL = "achievementsVersionChannel";

function bumpAchievementsVersion() {
  const nextVersion = String(Date.now());
  localStorage.setItem(ACHIEVEMENTS_VERSION_KEY, nextVersion);
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(ACHIEVEMENTS_VERSION_CHANNEL);
    channel.postMessage(nextVersion);
    channel.close();
  }
}

// Heroicons may export components directly or as a default property when
// transpiled. Normalize entries to reliably collect renderable components.
const ICON_OPTIONS: IconOption[] = Object.entries(HeroIcons)
  .map(([name, component]) => {
    // unwrap possible default export
    const Comp = component && (component as any).default ? (component as any).default : component;
    return [name, Comp] as const;
  })
  .filter(([, Comp]) => !!Comp && (typeof Comp === "function" || typeof Comp === "object"))
  .map(([name, Comp]) => ({ name, Icon: Comp }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getIconComponent(iconName: string | null | undefined) {
  return ICON_OPTIONS.find((option) => option.name === iconName)?.Icon || Sparkles;
}

function toPreviewUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : "";
}

function validateImageFile(file: File | null) {
  if (!file) return null;
  if (!isSupportedAchievementImageType(file.type)) return "Unsupported image format";
  if (isAchievementImageTooLarge(file.size)) return "Image is too large (max 4MB)";
  return null;
}

function IconPickerDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  selectedIconName,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
  selectedIconName: string;
  onSelect: (iconName: string) => void;
}) {
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ICON_OPTIONS;
    return ICON_OPTIONS.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [query]);

  const SelectedIcon = getIconComponent(selectedIconName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl border-slate-200 p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="h-4 w-4 text-cyan-700" /> Select an icon
          </DialogTitle>
          <DialogDescription>
            Search the Heroicons library and pick an icon for this achievement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search icon names..."
                className="h-11 pl-9"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
                <SelectedIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Selected</p>
                <p className="text-sm font-semibold text-slate-900">{selectedIconName || "Sparkles"}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {filteredOptions.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No icons match your search.
                </div>
              ) : (
                filteredOptions.map(({ name, Icon }) => {
                  const isSelected = selectedIconName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onSelect(name)}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white ${
                        isSelected ? "border-cyan-400 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSelected ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-700"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        {isSelected ? <Check className="h-3.5 w-3.5 text-cyan-700" /> : null}
                        {name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// AchievementPreview component moved to components/achievement-preview.tsx

export default function AchievementsManager() {
  const [items, setItems] = useState<AchievementItem[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<IconPickerTarget>(null);
  const [iconQuery, setIconQuery] = useState("");

    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string>("");
    const [newIconName, setNewIconName] = useState<string>("StarIcon");
    const [newIsActive, setNewIsActive] = useState(true);
    const [newDisplayOrder, setNewDisplayOrder] = useState(0);
    const [itemImageFiles, setItemImageFiles] = useState<Record<number, File | null>>({});
    const [itemImagePreviews, setItemImagePreviews] = useState<Record<number, string>>({});

    const totalCount = items.length;
    const visibleCount = items.filter((it) => it.isActive).length;
    const withImageCount = items.filter((it) => !!it.imagePath || !!itemImagePreviews[it.id]).length;
    const selectedItem = iconPickerTarget?.type === "item" ? items.find((item) => item.id === iconPickerTarget.itemId) || null : null;
    const selectedIconName = iconPickerTarget?.type === "new" ? newIconName : selectedItem?.iconName || "StarIcon";

  useEffect(() => {
    if (!iconPickerTarget) {
      setIconQuery("");
    }
  }, [iconPickerTarget]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/achievements", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load achievements");
      }
      setItems(payload.items || []);
    } catch (error: any) {
      toast({ title: "Load failed", description: String(error?.message || "Failed to load achievements") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (newImagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(newImagePreviewUrl);
      }
      for (const previewUrl of Object.values(itemImagePreviews)) {
        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    };
  }, [newImagePreviewUrl, itemImagePreviews]);

  const setNewImage = (file: File | null) => {
    const err = validateImageFile(file);
    if (err) {
      window.alert(err);
      return;
    }
    setNewImageFile(file);
    setNewImagePreviewUrl((currentUrl) => {
      if (currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
      return toPreviewUrl(file);
    });
  };

  const setItemImage = (itemId: number, file: File | null) => {
    const err = validateImageFile(file);
    if (err) {
      window.alert(err);
      return;
    }
    setItemImageFiles((prev) => ({ ...prev, [itemId]: file }));
    setItemImagePreviews((prev) => {
      const currentUrl = prev[itemId];
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
      if (!file) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: toPreviewUrl(file) };
    });
  };

  const createAchievement = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      window.alert("Title and description are required");
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("description", newDescription);
      formData.append("iconName", newIconName);
      formData.append("isActive", String(newIsActive));
      formData.append("displayOrder", String(newDisplayOrder));
      if (newImageFile) {
        formData.append("imageFile", newImageFile);
      }

      const response = await fetch("/api/admin/achievements", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to create achievement");
      }
      bumpAchievementsVersion();
      setNewTitle("");
      setNewDescription("");
      setNewImage(null);
      setNewIconName("Sparkles");
      setNewIsActive(true);
      setNewDisplayOrder(0);
      await load();
      toast({ title: "Published", description: `Achievement published. iconName: ${payload?.item?.iconName ?? 'none'}` });
    } catch (error: any) {
      toast({ title: "Create failed", description: String(error?.message || "Failed to create achievement") });
    } finally {
      setCreating(false);
    }
  };

  const saveAchievement = async (item: AchievementItem) => {
    setSavingId(item.id);
    try {
      const formData = new FormData();
      formData.append("title", item.title);
      formData.append("description", item.description);
      formData.append("iconName", item.iconName || "");
      formData.append("isActive", String(item.isActive));
      formData.append("displayOrder", String(item.displayOrder));

      const pendingFile = itemImageFiles[item.id];
      if (pendingFile) {
        formData.append("imageFile", pendingFile);
      } else if (item.imagePath === null) {
        formData.append("removeImage", "true");
      }

      const response = await fetch(`/api/admin/achievements/${item.id}`, {
        method: "PATCH",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to save achievement");
      }
      bumpAchievementsVersion();
      await load();
      setItemImageFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setItemImagePreviews((prev) => {
        const currentUrl = prev[item.id];
        if (currentUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(currentUrl);
        }
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (error: any) {
      toast({ title: "Save failed", description: String(error?.message || "Failed to save achievement") });
    } finally {
      setSavingId(null);
    }
  };

  const setItemIcon = (itemId: number, iconName: string) => {
    setItems((prev) => prev.map((row) => (row.id === itemId ? { ...row, iconName } : row)));
  };

  const removeAchievement = async (id: number) => {
    if (!window.confirm("Delete this achievement?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/achievements/${id}`, { method: "DELETE" });

      // Safely parse JSON only when present and content-type is JSON
      let payload: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          payload = await response.json();
        } catch (e) {
          // ignore JSON parse errors
          payload = null;
        }
      }

      if (!response.ok) {
        const errMsg = payload?.error || `Server returned ${response.status}`;
        throw new Error(errMsg);
      }

      // If server returned JSON, check success flag when available
      if (payload && typeof payload.success !== "undefined" && !payload.success) {
        throw new Error(payload.error || "Failed to delete achievement");
      }

      await load();
      setItemImageFiles((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setItemImagePreviews((prev) => {
        const currentUrl = prev[id];
        if (currentUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(currentUrl);
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error: any) {
      console.error("Delete achievement failed:", error);
      toast({ title: "Delete failed", description: String(error?.message || "Failed to delete achievement") });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Achievements Workspace</h2>
            <p className="text-sm text-slate-600">Manage public-facing achievements and publishing workflow.</p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-center">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-lg font-bold text-slate-900">{totalCount}</div>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-center">
              <div className="text-xs text-slate-500">Visible</div>
              <div className="text-lg font-bold text-slate-900">{visibleCount}</div>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-center">
              <div className="text-xs text-slate-500">With Image</div>
              <div className="text-lg font-bold text-slate-900">{withImageCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Screensaver Achievements</CardTitle>
          <p className="text-sm text-slate-600">
            Add and manage achievements shown on the public idle screensaver after 30 seconds.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Achievement title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Display Order</label>
              <Input
                type="number"
                value={newDisplayOrder}
                onChange={(e) => setNewDisplayOrder(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-1">
              <label className="text-sm font-medium text-slate-700">Icon</label>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between border-slate-200 bg-white px-3 text-slate-700"
                onClick={() => setIconPickerTarget({ type: "new" })}
              >
                    <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    {(() => {
                      const Icon = getIconComponent(newIconName);
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </span>
                  <span className="truncate text-sm font-medium">{newIconName}</span>
                </span>
                <span className="text-xs text-slate-500">Search library</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Describe the achievement"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImagePlus className="h-4 w-4 text-cyan-700" />
                Achievement Image (optional)
              </label>
              <Input
                type="file"
                id="new-achievement-image"
                aria-describedby="new-image-hint"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setNewImage(file);
                }}
              />
              <p id="new-image-hint" className="text-xs text-slate-500">Max file size: 4MB</p>
            </div>
            <div>
              <AchievementPreview
                title={newTitle}
                description={newDescription}
                image={newImagePreviewUrl || null}
                iconName={newIconName}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Show this item on screensaver</p>
              <p className="text-xs text-slate-500">Inactive items are hidden from public display</p>
            </div>
            <Switch checked={newIsActive} onCheckedChange={setNewIsActive} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Preview updates live as you type.</div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => {
                setNewTitle("");
                setNewDescription("");
                setNewImage(null);
                setNewIconName("Sparkles");
                setNewIsActive(true);
                setNewDisplayOrder(0);
              }}>
                Reset
              </Button>

              <Button type="button" variant="admin" onClick={createAchievement} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="border-slate-200">
            <CardContent className="py-6 text-center text-sm text-slate-600">Loading achievements...</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-6 text-center text-sm text-slate-600">No achievements yet.</CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-slate-200">
              <CardContent className="space-y-3 pt-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <AchievementPreview
                      title={item.title}
                      description={item.description}
                      image={itemImagePreviews[item.id] || item.imagePath || null}
                      iconName={item.iconName}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, title: value } : row)));
                      }}
                    />
                    <Textarea
                      rows={3}
                      value={item.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, description: value } : row)));
                      }}
                    />

                    <div className="grid gap-3 md:grid-cols-3 mt-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Icon</label>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-1 h-10 w-full justify-between border-slate-200 bg-white px-3 text-slate-700"
                          onClick={() => setIconPickerTarget({ type: "item", itemId: item.id })}
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                              {(() => {
                                const Icon = getIconComponent(item.iconName);
                                return <Icon className="h-4 w-4" />;
                              })()}
                            </span>
                            <span className="truncate text-sm font-medium">{item.iconName || 'StarIcon'}</span>
                          </span>
                          <span className="text-xs text-slate-500">Change</span>
                        </Button>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Display Order</label>
                        <Input
                          type="number"
                          value={item.displayOrder}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, displayOrder: value } : row)));
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Replace Image</label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            id={`replace-image-${item.id}`}
                            aria-describedby={`replace-image-hint-${item.id}`}
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setItemImage(item.id, file);
                            }}
                          />
                          <Button type="button" variant="outline" onClick={() => { setItems((prev) => prev.map((r) => r.id === item.id ? { ...r, imagePath: null } : r)); setItemImage(item.id, null); }}>
                            Remove
                          </Button>
                        </div>
                        <p id={`replace-image-hint-${item.id}`} className="sr-only">Max file size: 4MB</p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-slate-700">Active</p>
                          <p className="text-[11px] text-slate-500">Visible on screensaver</p>
                        </div>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(checked) => {
                            setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, isActive: checked } : row)));
                          }}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="admin"
                    onClick={() => saveAchievement(item)}
                    disabled={savingId === item.id}
                  >
                    {savingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeAchievement(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <IconPickerDialog
        open={iconPickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setIconPickerTarget(null);
        }}
        query={iconQuery}
        onQueryChange={setIconQuery}
        selectedIconName={selectedIconName}
        onSelect={(iconName) => {
          if (iconPickerTarget?.type === "new") {
            setNewIconName(iconName);
          } else if (iconPickerTarget?.type === "item") {
            setItemIcon(iconPickerTarget.itemId, iconName);
          }
          setIconPickerTarget(null);
        }}
      />
    </div>
  );
}
