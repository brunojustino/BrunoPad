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
