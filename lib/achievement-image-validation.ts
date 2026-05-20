const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export function isSupportedAchievementImageType(mimeType: string) {
  return SUPPORTED_IMAGE_TYPES.includes(String(mimeType || "").toLowerCase());
}

export function isAchievementImageTooLarge(fileSize: number) {
  return Number(fileSize || 0) > MAX_IMAGE_SIZE_BYTES;
}
