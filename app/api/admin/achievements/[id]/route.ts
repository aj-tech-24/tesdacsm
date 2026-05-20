import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { deleteAchievement, getAchievementById, updateAchievement } from "@/lib/turso-achievements";
import {
  deleteAchievementImage,
  isAchievementImageTooLarge,
  isSupportedAchievementImageType,
  saveAchievementImage,
} from "@/lib/achievement-media";

type ParsedAchievementPatch = {
  title?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  iconName?: string | null;
  imageValue?: string | null;
  imageFile?: File | null;
  removeImage?: boolean;
};

async function parseAchievementPatch(req: Request): Promise<ParsedAchievementPatch> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const imageFile = formData.get("imageFile");

    return {
      title: formData.get("title") === null ? undefined : String(formData.get("title") || "").trim(),
      description: formData.get("description") === null ? undefined : String(formData.get("description") || "").trim(),
      displayOrder: formData.get("displayOrder") === null ? undefined : Number(formData.get("displayOrder") || 0),
      isActive: formData.get("isActive") === null ? undefined : String(formData.get("isActive") || "true") === "true",
      iconName: formData.get("iconName") === null ? undefined : String(formData.get("iconName") || "").trim() || null,
      imageValue: formData.get("imagePath") === null ? undefined : String(formData.get("imagePath") || "").trim() || null,
      imageFile: imageFile instanceof File ? imageFile : null,
      removeImage: String(formData.get("removeImage") || "false") === "true",
    };
  }

  const body = await req.json();
  return {
    title: typeof body?.title === "string" ? String(body.title).trim() : undefined,
    description: typeof body?.description === "string" ? String(body.description).trim() : undefined,
    displayOrder: typeof body?.displayOrder !== "undefined" ? Number(body.displayOrder) : undefined,
    isActive: typeof body?.isActive !== "undefined" ? Boolean(body.isActive) : undefined,
    iconName: typeof body?.iconName === "string" ? String(body.iconName).trim() || null : typeof body?.iconName === "undefined" ? undefined : null,
    imageValue: typeof body?.imagePath === "string" ? String(body.imagePath).trim() || null : undefined,
    imageFile: null,
    removeImage: typeof body?.removeImage !== "undefined" ? Boolean(body.removeImage) : undefined,
  };
}

export async function PATCH(req: Request, context: { params: any }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid achievement id" }, { status: 400 });
    }

    const existing = await getAchievementById(id);
    const previousImage = existing?.imagePath || null;

    const body = await parseAchievementPatch(req);
    const updateData: Record<string, any> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ success: false, error: "Title cannot be empty" }, { status: 400 });
      }
      updateData.title = title;
    }

    if (typeof body.description === "string") {
      const description = body.description.trim();
      if (!description) {
        return NextResponse.json({ success: false, error: "Description cannot be empty" }, { status: 400 });
      }
      updateData.description = description;
    }

    if (typeof body.isActive !== "undefined") {
      updateData.isActive = Boolean(body.isActive);
    }

    if (typeof body.displayOrder !== "undefined") {
      const parsed = Number(body.displayOrder);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ success: false, error: "displayOrder must be numeric" }, { status: 400 });
      }
      updateData.displayOrder = parsed;
    }

    if (typeof body.iconName !== "undefined") {
      updateData.iconName = body.iconName;
    }

    let nextImageValue: string | null | undefined = undefined;

    if (body.removeImage) {
      updateData.imagePath = null;
    } else if (body.imageFile) {
      if (!isSupportedAchievementImageType(body.imageFile.type)) {
        return NextResponse.json({ success: false, error: "Invalid image format" }, { status: 400 });
      }
      if (isAchievementImageTooLarge(body.imageFile.size)) {
        return NextResponse.json({ success: false, error: "Image is too large (max 4MB)" }, { status: 400 });
      }
      nextImageValue = await saveAchievementImage(body.imageFile);
      updateData.imagePath = nextImageValue;
    } else if (typeof body.imageValue !== "undefined") {
      const normalized = String(body.imageValue || "").trim();
      if (!normalized) {
        updateData.imagePath = null;
      } else {
        updateData.imagePath = normalized;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    const updated = await updateAchievement(id, updateData);

    if (body.removeImage || nextImageValue) {
      const shouldDeletePrevious = previousImage && previousImage !== updateData.imagePath;
      if (shouldDeletePrevious) {
        await deleteAchievementImage(previousImage);
      }
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Admin achievements PATCH failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: any }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid achievement id" }, { status: 400 });
    }

    const existing = await getAchievementById(id);

    await deleteAchievement(id);

    await deleteAchievementImage(existing?.imagePath || null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin achievements DELETE failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
