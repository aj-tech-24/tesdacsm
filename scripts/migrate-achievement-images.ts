import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getTursoClient } from "@/lib/turso";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "achievements");

function extForMime(mime: string) {
  mime = (mime || "").toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".png";
}

function parseDataUri(dataUri: string): { ext: string; buffer: Buffer } | null {
  const m = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(dataUri);
  if (!m) return null;
  const mime = m[1];
  const b64 = m[3];
  const buffer = Buffer.from(b64, "base64");
  return { ext: extForMime(mime), buffer };
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

async function run() {
  console.log("Starting achievement image migration...");
  const client = getTursoClient();

  // Inspect table columns
  let tableInfo;
  try {
    tableInfo = await client.execute({ sql: `PRAGMA table_info('Achievement')` });
  } catch (err) {
    console.error("Failed to read table info:", err);
    process.exit(1);
  }

  const cols = (tableInfo.rows || []).map((r: any) => (r.name || r.column_name || r["name"]));
  const hasImageDataUrl = cols.includes("imageDataUrl");
  const hasImagePath = cols.includes("imagePath");

  if (!hasImagePath) {
    console.log("Adding imagePath column to Achievement table...");
    try {
      await client.execute({ sql: `ALTER TABLE Achievement ADD COLUMN imagePath TEXT` });
    } catch (err) {
      console.warn("Failed to add imagePath column (it may already exist):", err.message || err);
    }
  }

  // Find rows with base64 data in imageDataUrl
  if (!hasImageDataUrl) {
    console.log("No imageDataUrl column found; nothing to migrate.");
    return;
  }

  let rows;
  try {
    rows = await client.execute({ sql: `SELECT id, imageDataUrl FROM Achievement WHERE imageDataUrl IS NOT NULL` });
  } catch (err) {
    console.error("Failed to select achievements:", err);
    process.exit(1);
  }

  const toProcess = (rows.rows || []).filter((r: any) => r.imageDataUrl);

  if (toProcess.length === 0) {
    console.log("No rows with imageDataUrl found to migrate.");
    return;
  }

  await ensureUploadDir();

  let migrated = 0;
  for (const row of toProcess) {
    const id = row.id;
    const val = String(row.imageDataUrl || "");

    // If it's already a path (starts with /uploads), move it into imagePath directly
    if (val.startsWith("/uploads/") || val.startsWith("uploads/")) {
      const pathVal = val.startsWith("/") ? val : `/${val}`;
      try {
        await client.execute({
          sql: `UPDATE Achievement SET imagePath = ?, imageDataUrl = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          args: [pathVal, id],
        });
        migrated++;
        console.log(`Updated row ${id} to imagePath=${pathVal}`);
      } catch (err) {
        console.warn(`Failed to update row ${id}:`, err.message || err);
      }
      continue;
    }

    const parsed = parseDataUri(val);
    if (!parsed) {
      console.log(`Row ${id} imageDataUrl is not a data URI, skipping: ${val.slice(0,80)}`);
      continue;
    }

    const fileName = `${randomUUID()}${parsed.ext}`;
    const publicPath = `/uploads/achievements/${fileName}`;
    const absPath = join(UPLOAD_DIR, fileName);

    try {
      await writeFile(absPath, parsed.buffer);
      await client.execute({
        sql: `UPDATE Achievement SET imagePath = ?, imageDataUrl = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [publicPath, id],
      });
      migrated++;
      console.log(`Migrated row ${id} -> ${publicPath}`);
    } catch (err) {
      console.error(`Failed to migrate row ${id}:`, err.message || err);
    }
  }

  console.log(`Done. Migrated ${migrated} rows.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
