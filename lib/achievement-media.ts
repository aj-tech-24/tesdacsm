import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { randomUUID } from "crypto";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "achievements");

function extensionForType(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return extname(mimeType) || ".png";
  }
}

export function isSupportedAchievementImageType(mimeType: string) {
  return ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(mimeType.toLowerCase());
}

export function isAchievementImageTooLarge(fileSize: number) {
  return fileSize > MAX_IMAGE_SIZE_BYTES;
}

export async function saveAchievementImage(file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${randomUUID()}${extensionForType(file.type || "image/png")}`;
  const filePath = join(UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/achievements/${fileName}`;
}

export async function deleteAchievementImage(imagePath: string | null | undefined) {
  if (!imagePath || !imagePath.startsWith("/uploads/achievements/")) {
    return;
  }

  const absolutePath = join(process.cwd(), "public", imagePath.replace(/^\//, ""));

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing files; the DB record is the source of truth.
  }
}