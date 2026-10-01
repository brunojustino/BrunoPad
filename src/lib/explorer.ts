import { mkdir, readDir, remove, rename, writeTextFile } from "@tauri-apps/plugin-fs";

export interface ExplorerEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export function joinPath(dir: string, name: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  return dir.endsWith(sep) ? dir + name : dir + sep + name;
}

export function parentPath(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const idx = path.lastIndexOf(sep);
  return idx > 0 ? path.slice(0, idx) : path;
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

export async function createFile(parentDir: string, name: string): Promise<void> {
  await writeTextFile(joinPath(parentDir, name), "");
}

export async function createFolder(parentDir: string, name: string): Promise<void> {
  await mkdir(joinPath(parentDir, name));
}

export async function renameEntry(path: string, newName: string): Promise<string> {
  const target = joinPath(parentPath(path), newName);
  await rename(path, target);
  return target;
}

export async function deleteEntry(path: string, isDirectory: boolean): Promise<void> {
  await remove(path, { recursive: isDirectory });
}
