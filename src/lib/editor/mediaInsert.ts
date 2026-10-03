import { copyFile, mkdir, readDir, writeFile } from "@tauri-apps/plugin-fs";
import { ensureFileId } from "../fileRegistry";
import { getCurrentWorkspace } from "../workspace";
import { joinPath, parentPath } from "../explorer";
import type { BlockNoteEditor } from "@blocknote/core";

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
  while (i < a.length && i < b.length - 1 && a[i].toLowerCase() === b[i].toLowerCase()) i++;
  const ups = a.length - i;
  const rest = b.slice(i);
  return [...Array(ups).fill(".."), ...rest].join(sep);
}

export async function uniqueTarget(dir: string, name: string): Promise<string> {
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

function timestampName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `screenshot-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
}

export async function saveMediaFile(
  mdFilePath: string,
  bytes: Uint8Array,
  name?: string,
): Promise<CopiedMedia> {
  const dir = await resolveTargetDir(mdFilePath, "workspace");
  const base = name?.replace(/[\\/]+/g, "/").split("/").pop();
  const target = await uniqueTarget(dir, base || timestampName());
  await writeFile(target, bytes);
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

export type MediaEmbedKind = "mediaImage" | "mediaPdf" | "mediaDoc";

export async function insertEmbedAtCursor(
  editor: BlockNoteEditor<any, any, any>,
  kind: MediaEmbedKind,
  url: string,
  name: string,
): Promise<void> {
  const embedBlock = { type: kind, props: { url, name } } as never;
  const cursorBlock = editor.getTextCursorPosition().block;
  const isEmpty =
    cursorBlock.type === "paragraph" &&
    Array.isArray(cursorBlock.content) &&
    cursorBlock.content.length === 0;
  if (isEmpty) {
    await editor.replaceBlocks([cursorBlock], [embedBlock] as never);
  } else {
    await editor.insertBlocks([embedBlock], cursorBlock, "after" as never);
  }
}
