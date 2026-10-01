import { getDb } from "./db";

export interface UserWorkspace {
  id: number;
  path: string;
}

export async function getCurrentWorkspace(): Promise<UserWorkspace | null> {
  const db = await getDb();
  const rows = await db.select<UserWorkspace[]>(
    "SELECT id, path FROM user_workspaces ORDER BY id DESC LIMIT 1",
  );
  return rows[0] ?? null;
}

export async function setWorkspace(path: string): Promise<UserWorkspace> {
  const db = await getDb();
  await db.execute(
    "INSERT OR IGNORE INTO user_workspaces (path) VALUES ($1)",
    [path],
  );
  const current = await getCurrentWorkspace();
  if (!current) throw new Error("failed to persist user workspace");
  return current;
}
