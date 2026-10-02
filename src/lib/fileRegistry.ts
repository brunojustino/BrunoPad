import { getDb } from "./db";
import { readDirEntries } from "./explorer";
import type { UserWorkspace } from "./workspace";

async function collectFiles(dir: string, out: Set<string>): Promise<void> {
  for (const entry of await readDirEntries(dir)) {
    if (entry.isDirectory) {
      await collectFiles(entry.path, out);
    } else {
      out.add(entry.path);
    }
  }
}

export async function syncFileRegistry(workspace: UserWorkspace): Promise<void> {
  const diskPaths = new Set<string>();
  await collectFiles(workspace.path, diskPaths);

  const db = await getDb();
  const existing = await db.select<{ path: string }[]>(
    "SELECT path FROM files WHERE workspace_id = $1",
    [workspace.id],
  );
  const existingPaths = new Set(existing.map((r) => r.path));

  for (const path of diskPaths) {
    if (existingPaths.has(path)) continue;
    await db.execute(
      "INSERT INTO files (workspace_id, path) VALUES ($1, $2) ON CONFLICT(workspace_id, path) DO NOTHING",
      [workspace.id, path],
    );
  }
  for (const path of existingPaths) {
    if (diskPaths.has(path)) continue;
    await db.execute(
      "DELETE FROM files WHERE workspace_id = $1 AND path = $2",
      [workspace.id, path],
    );
  }
}

export interface RegistryFile {
  id: number;
  path: string;
}

export async function listFiles(workspaceId: number): Promise<RegistryFile[]> {
  const db = await getDb();
  return db.select<RegistryFile[]>(
    "SELECT id, path FROM files WHERE workspace_id = $1 ORDER BY path",
    [workspaceId],
  );
}

export async function getFileId(
  workspaceId: number,
  path: string,
): Promise<number | null> {
  const db = await getDb();
  const rows = await db.select<{ id: number }[]>(
    "SELECT id FROM files WHERE workspace_id = $1 AND path = $2 LIMIT 1",
    [workspaceId, path],
  );
  return rows[0]?.id ?? null;
}
