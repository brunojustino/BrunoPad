import { copyFile, mkdir, readDir } from "@tauri-apps/plugin-fs";
import { ensureFileId } from "../fileRegistry";
import { getCurrentWorkspace } from "../workspace";
import { joinPath, parentPath } from "../explorer";

export type MediaDestination = "sameFolder" | "subfolder" | "workspace";

export interface CopiedMedia {
  absolutePath: string;
  relativeUrl: string;
}

function segments(path: string): string[] {
  return path.split(/[\\/]+/).filter(Boolean);
}

export function relativePath(from: string, to: string): string {
  const sep = from.includes("\\") ? "\\" : "/";
  const a = segments(from);
  const b = segments(to);
  let i = 0;
  while (i < a.length - 1 && i < b.length - 1 && a[i].toLowerCase() === b[i].toLowerCase()) i++;
  const ups = a.length - 1 - i;
  const rest = b.slice(i);
  return [...Array(ups).fill(".."), ...rest].join(sep);
}

async function uniqueTarget(dir: string, name: string): Promise<string> {
  let target = joinPath(dir, name);
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let n = 1;
  for (;;) {
    try {
      await readDir(target);
      target = joinPath(dir, `${stem}-${n}${ext}`);
      n++;
    } catch {
      return target;
    }
  }
}

async function isInsideWorkspace(path: string): Promise<boolean> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return false;
  const norm = path.replace(/[\\/]+/g, "/").toLowerCase();
  const root = workspace.path.replace(/[\\/]+/g, "/").toLowerCase();
  return norm.startsWith(root.endsWith("/") ? root : root + "/");
}

async function resolveTargetDir(
  mdFilePath: string,
  destination: MediaDestination,
): Promise<string> {
  const mdDir = parentPath(mdFilePath);
  if (destination === "sameFolder") return mdDir;
  if (destination === "subfolder") {
    const dir = joinPath(mdDir, "assets");
    await mkdir(dir, { recursive: true });
    return dir;
  }
  const workspace = await getCurrentWorkspace();
  const inside = await isInsideWorkspace(mdFilePath);
  if (workspace && inside) {
    const dir = joinPath(workspace.path, "assets");
    await mkdir(dir, { recursive: true });
    return dir;
  }
  const dir = joinPath(mdDir, "assets");
  await mkdir(dir, { recursive: true });
  return dir;
}

function sameFile(a: string, b: string): boolean {
  return a.replace(/[\\/]+/g, "/").toLowerCase() === b.replace(/[\\/]+/g, "/").toLowerCase();
}

export async function copyIntoWorkspaceDestination(
  sourcePath: string,
  mdFilePath: string,
  destination: MediaDestination,
): Promise<CopiedMedia> {
  const targetDir = await resolveTargetDir(mdFilePath, destination);
  const name = sourcePath.replace(/[\\/]+/g, "/").split("/").pop() ?? "media";
  let target = joinPath(targetDir, name);
  if (!sameFile(sourcePath, target)) {
    target = await uniqueTarget(targetDir, name);
    await copyFile(sourcePath, target);
  }
  const workspace = await getCurrentWorkspace();
  if (workspace && (await isInsideWorkspace(target))) {
    try {
      await ensureFileId(workspace.id, target);
    } catch (err) {
      console.error("[media] register failed", target, err);
    }
  }
  return { absolutePath: target, relativeUrl: relativePath(parentPath(mdFilePath), target) };
}
