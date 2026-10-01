import { readDir } from "@tauri-apps/plugin-fs";

export interface ExplorerEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

function joinPath(dir: string, name: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  return dir.endsWith(sep) ? dir + name : dir + sep + name;
}

export async function readDirEntries(dirPath: string): Promise<ExplorerEntry[]> {
  const entries = await readDir(dirPath);
  return entries
    .map((e) => ({
      name: e.name,
      path: joinPath(dirPath, e.name),
      isDirectory: e.isDirectory,
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
