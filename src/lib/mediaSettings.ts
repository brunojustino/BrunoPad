import { getDb } from "./db";
import type { MediaDestination } from "./editor/mediaInsert";

const KEY = "media.insertDestination";

const VALID: MediaDestination[] = ["sameFolder", "subfolder", "workspace"];

export async function getMediaInsertDestination(): Promise<MediaDestination> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM ai_settings WHERE key = $1",
    [KEY],
  );
  const value = rows[0]?.value;
  return VALID.includes(value as MediaDestination) ? (value as MediaDestination) : "subfolder";
}

export async function setMediaInsertDestination(destination: MediaDestination): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO ai_settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [KEY, destination],
  );
}
