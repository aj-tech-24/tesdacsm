import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAchievement, listAchievements } from "@/lib/turso-achievements";
import {
  isAchievementImageTooLarge,
  isSupportedAchievementImageType,
  saveAchievementImage,
} from "@/lib/achievement-media";

type ParsedAchievementInput = {
  title: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  imageValue: string | null;
  iconName: string | null;
  imageFile: File | null;
};

async function parseAchievementInput(req: Request): Promise<ParsedAchievementInput> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const imageFile = formData.get("imageFile");

    return {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      displayOrder: Number(formData.get("displayOrder") || 0),
      isActive: String(formData.get("isActive") || "true") === "true",
      imageValue: String(formData.get("imagePath") || "").trim() || null,
      iconName: String(formData.get("iconName") || "").trim() || null,
      imageFile: imageFile instanceof File ? imageFile : null,
    };
  }

  const body = await req.json();
  return {
    title: String(body?.title || "").trim(),
    description: String(body?.description || "").trim(),
    displayOrder: Number(body?.displayOrder ?? 0),
    isActive: Boolean(body?.isActive ?? true),
    imageValue: typeof body?.imagePath === "string" ? String(body.imagePath).trim() || null : null,
    iconName: typeof body?.iconName === "string" ? String(body.iconName).trim() || null : null,
    imageFile: null,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 401 });
    }

    const items = await listAchievements();

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Admin achievements GET failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 401 });
    }

    const input = await parseAchievementInput(req);
    const title = input.title;
    const description = input.description;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
    }

    let imagePath: string | null = null;
    if (input.imageFile) {
      if (!isSupportedAchievementImageType(input.imageFile.type)) {
        return NextResponse.json({ success: false, error: "Invalid image format" }, { status: 400 });
      }
      if (isAchievementImageTooLarge(input.imageFile.size)) {
        return NextResponse.json({ success: false, error: "Image is too large (max 4MB)" }, { status: 400 });
      }
      imagePath = await saveAchievementImage(input.imageFile);
    } else if (input.imageValue) {
      imagePath = input.imageValue;
    }

    const created = await createAchievement({
      title,
      description,
      iconName: input.iconName,
      displayOrder: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
      isActive: input.isActive,
      imagePath,
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin achievements POST failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
