import { getTursoClient } from "@/lib/turso";

let ensureAchievementTablePromise: Promise<void> | null = null;

type AchievementRow = {
  id: number;
  title: string;
  description: string;
  imagePath: string | null;
  iconName: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function mapRow(row: any): AchievementRow {
  return {
    id: Number(row.id),
    title: String(row.title || ""),
    description: String(row.description || ""),
    imagePath: row.imagePath ? String(row.imagePath) : null,
    iconName: row.iconName ? String(row.iconName) : null,
    isActive: Number(row.isActive || 0) === 1,
    displayOrder: Number(row.displayOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function ensureAchievementColumn(columnName: string, columnDefinition: string) {
  const client = getTursoClient();
  const tableInfo = await client.execute({ sql: `PRAGMA table_info('Achievement')` });
  const columns = (tableInfo.rows || []).map((row: any) => String(row.name || row.column_name || ""));

  if (!columns.includes(columnName)) {
    await client.execute({ sql: `ALTER TABLE Achievement ADD COLUMN ${columnName} ${columnDefinition}` });
  }
}

async function ensureAchievementTable() {
  if (!ensureAchievementTablePromise) {
    ensureAchievementTablePromise = (async () => {
      const client = getTursoClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS Achievement (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          imagePath TEXT,
          iconName TEXT,
          isActive BOOLEAN NOT NULL DEFAULT 1,
          displayOrder INTEGER NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await ensureAchievementColumn("iconName", "TEXT");
    })();
  }

  await ensureAchievementTablePromise;
}

export async function listAchievements(options?: { activeOnly?: boolean }) {
  await ensureAchievementTable();
  const client = getTursoClient();
  const sql = options?.activeOnly
      ? `SELECT id, title, description, imagePath, iconName, isActive, displayOrder, createdAt, updatedAt
       FROM Achievement
       WHERE isActive = 1
       ORDER BY displayOrder ASC, updatedAt DESC`
     : `SELECT id, title, description, imagePath, iconName, isActive, displayOrder, createdAt, updatedAt
       FROM Achievement
       ORDER BY displayOrder ASC, updatedAt DESC`;

  const result = await client.execute(sql);
  return (result.rows || []).map(mapRow);
}

export async function getAchievementById(id: number) {
  await ensureAchievementTable();
  const client = getTursoClient();

  const result = await client.execute({
    sql: `SELECT id, title, description, imagePath, iconName, isActive, displayOrder, createdAt, updatedAt
          FROM Achievement
          WHERE id = ?
          LIMIT 1`,
    args: [id],
  });

  return result.rows?.[0] ? mapRow(result.rows[0]) : null;
}

export async function createAchievement(data: {
  title: string;
  description: string;
  imagePath: string | null;
  iconName: string | null;
  isActive: boolean;
  displayOrder: number;
}) {
  await ensureAchievementTable();
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO Achievement (title, description, imagePath, iconName, isActive, displayOrder, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [
      data.title,
      data.description,
      data.imagePath,
      data.iconName,
      data.isActive ? 1 : 0,
      data.displayOrder,
    ],
  });

  const created = await client.execute(`
    SELECT id, title, description, imagePath, iconName, isActive, displayOrder, createdAt, updatedAt
    FROM Achievement
    ORDER BY id DESC
    LIMIT 1
  `);
  return created.rows?.[0] ? mapRow(created.rows[0]) : null;
}

export async function updateAchievement(id: number, patch: Record<string, unknown>) {
  await ensureAchievementTable();
  const client = getTursoClient();

  const setClauses: string[] = [];
  const args: any[] = [];

  if (typeof patch.title !== "undefined") {
    setClauses.push("title = ?");
    args.push(patch.title);
  }
  if (typeof patch.description !== "undefined") {
    setClauses.push("description = ?");
    args.push(patch.description);
  }
  if (typeof patch.imagePath !== "undefined") {
    setClauses.push("imagePath = ?");
    args.push(patch.imagePath);
  }
  if (typeof patch.iconName !== "undefined") {
    setClauses.push("iconName = ?");
    args.push(patch.iconName);
  }
  if (typeof patch.isActive !== "undefined") {
    setClauses.push("isActive = ?");
    args.push(patch.isActive ? 1 : 0);
  }
  if (typeof patch.displayOrder !== "undefined") {
    setClauses.push("displayOrder = ?");
    args.push(patch.displayOrder);
  }

  setClauses.push("updatedAt = CURRENT_TIMESTAMP");
  args.push(id);

  await client.execute({
    sql: `UPDATE Achievement SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });

  const updated = await client.execute({
      sql: `SELECT id, title, description, imagePath, iconName, isActive, displayOrder, createdAt, updatedAt
          FROM Achievement
          WHERE id = ?
          LIMIT 1`,
    args: [id],
  });

  return updated.rows?.[0] ? mapRow(updated.rows[0]) : null;
}

export async function deleteAchievement(id: number) {
  await ensureAchievementTable();
  const client = getTursoClient();
  await client.execute({
    sql: `DELETE FROM Achievement WHERE id = ?`,
    args: [id],
  });
}
