import { readTextFile } from "@tauri-apps/plugin-fs";
import { readDirEntries } from "../explorer";
import { ensureFileId } from "../fileRegistry";
import { getApiKey, getProviderConfig, type AiProviderConfig } from "./settings";
import { chunkMarkdown } from "./chunking";
import { embedTexts } from "./embeddingClient";
import { replaceEmbeddings } from "./embeddingStore";
import { getDb } from "../db";

const EMBED_BATCH = 16;

export async function embedFile(
  workspaceId: number,
  path: string,
  config?: AiProviderConfig,
): Promise<void> {
  const cfg = config ?? (await getProviderConfig());
  const md = await readTextFile(path);
  const chunks = chunkMarkdown(md);
  const fileId = await ensureFileId(workspaceId, path);
  if (chunks.length === 0) {
    await replaceEmbeddings(workspaceId, fileId, path, [], cfg.embeddingModel);
    return;
  }
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH).map((c) => c.text);
    vectors.push(...(await embedTexts(batch, cfg)));
  }
  const inserts = chunks.map((chunk, i) => ({
    chunkIndex: chunk.index,
    text: chunk.text,
    embedding: vectors[i],
  }));
  await replaceEmbeddings(workspaceId, fileId, path, inserts, cfg.embeddingModel);
}

export async function indexWorkspace(
  workspaceId: number,
  rootPath: string,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const mdPaths: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readDirEntries(dir)) {
      if (entry.isDirectory) {
        await walk(entry.path);
      } else if (entry.name.toLowerCase().endsWith(".md")) {
        mdPaths.push(entry.path);
      }
    }
  };
  await walk(rootPath);

  const db = await getDb();
  await db.execute("DELETE FROM embeddings WHERE workspace_id = $1", [workspaceId]);

  const cfg = await getProviderConfig();
  if (cfg.provider === "openrouter" && !getApiKey(cfg.provider)) {
    throw new Error("No OPENROUTER_API_KEY in .env - cannot embed");
  }
  let done = 0;
  for (const path of mdPaths) {
    await embedFile(workspaceId, path, cfg);
    done++;
    onProgress(done, mdPaths.length);
  }
}

export async function reEmbedPaths(workspaceId: number, paths: string[]): Promise<void> {
  const mdPaths = paths.filter((p) => p.toLowerCase().endsWith(".md"));
  if (mdPaths.length === 0) return;
  const cfg = await getProviderConfig();
  if (cfg.provider === "openrouter" && !getApiKey(cfg.provider)) return;
  for (const path of mdPaths) {
    try {
      await embedFile(workspaceId, path, cfg);
    } catch (err) {
      console.error("[ai] re-embed failed", path, err);
    }
  }
}
