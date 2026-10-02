import type { BlockNoteEditor } from "@blocknote/core";
import { getDb } from "./db";
import { ensureFileId } from "./fileRegistry";
import { getCurrentWorkspace } from "./workspace";

export interface GeometryRow {
  asset_path: string;
  width: number;
  height: number;
}

export const EMBED_BLOCK_TYPES = ["mediaImage", "mediaPdf", "mediaDoc"] as const;

type LooseBlock = {
  type: string;
  props: Record<string, string>;
};

export function isEmbedBlock(block: unknown): block is LooseBlock {
  return (
    typeof block === "object" &&
    block !== null &&
    (EMBED_BLOCK_TYPES as readonly string[]).includes((block as LooseBlock).type)
  );
}

export async function resolveMdFileId(mdFilePath: string): Promise<number | null> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;
  try {
    return await ensureFileId(workspace.id, mdFilePath);
  } catch (err) {
    console.error("[geometry] ensure md file id failed", mdFilePath, err);
    return null;
  }
}

export async function selectEmbedGeometry(fileId: number): Promise<GeometryRow[]> {
  const db = await getDb();
  return db.select<GeometryRow[]>(
    "SELECT asset_path, width, height FROM embed_geometry WHERE file_id = $1",
    [fileId],
  );
}

export async function upsertEmbedGeometry(
  fileId: number,
  assetPath: string,
  width: number,
  height: number,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO embed_geometry (file_id, asset_path, width, height, updated_at) VALUES ($1, $2, $3, $4, datetime('now')) ON CONFLICT(file_id, asset_path) DO UPDATE SET width = $3, height = $4, updated_at = datetime('now')",
    [fileId, assetPath, width, height],
  );
}

export async function applyEmbedGeometry(
  blocks: unknown[],
  mdFilePath: string,
): Promise<void> {
  const fileId = await resolveMdFileId(mdFilePath);
  if (fileId === null) return;
  let rows: GeometryRow[];
  try {
    rows = await selectEmbedGeometry(fileId);
  } catch (err) {
    console.error("[geometry] load failed", mdFilePath, err);
    return;
  }
  const byPath = new Map(rows.map((r) => [r.asset_path, r]));
  for (const raw of blocks) {
    if (!isEmbedBlock(raw)) continue;
    const geo = byPath.get(raw.props.url ?? "");
    if (!geo) continue;
    if (raw.type === "mediaImage") {
      if (geo.width > 0) raw.props.width = String(geo.width);
    } else if (raw.type === "mediaPdf") {
      if (geo.width > 0) raw.props.width = String(geo.width);
      if (geo.height > 0) raw.props.height = String(geo.height);
    }
  }
}

export async function saveEmbedGeometry(
  editor: BlockNoteEditor<any, any, any>,
  mdFilePath: string,
): Promise<void> {
  const fileId = await resolveMdFileId(mdFilePath);
  if (fileId === null) return;
  for (const block of editor.document.filter(isEmbedBlock)) {
    try {
      if (block.type === "mediaImage") {
        await upsertEmbedGeometry(fileId, block.props.url ?? "", Number(block.props.width) || 0, 0);
      } else if (block.type === "mediaPdf") {
        await upsertEmbedGeometry(
          fileId,
          block.props.url ?? "",
          Number(block.props.width) || 0,
          Number(block.props.height) || 0,
        );
      }
    } catch (err) {
      console.error("[geometry] save failed", block.props.url, err);
    }
  }
}
