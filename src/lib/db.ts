import Database from "@tauri-apps/plugin-sql";

let instance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!instance) {
    instance = await Database.load("sqlite:brunopad.db");
    if (import.meta.env.DEV) {
      const tables = await instance.select<{ name: string }[]>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      console.debug(
        "[db] tables:",
        tables.map((t) => t.name).join(", "),
      );
    }
  }
  return instance;
}
