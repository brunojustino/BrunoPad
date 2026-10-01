import Database from "@tauri-apps/plugin-sql";

let load: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!load) {
    load = (async () => {
      const db = await Database.load("sqlite:brunopad.db");
      await db.execute("PRAGMA journal_mode=WAL;");
      if (import.meta.env.DEV) {
        const tables = await db.select<{ name: string }[]>(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        );
        console.debug(
          "[db] tables:",
          tables.map((t) => t.name).join(", "),
        );
      }
      return db;
    })();
  }
  return load;
}
