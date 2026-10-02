import { readTextFile } from "@tauri-apps/plugin-fs";
import { getDb } from "../db";
import { readDirEntries } from "../explorer";
import { getApiKey, getProviderConfig, type AiProviderConfig } from "./settings";
import { chunkMarkdown } from "./chunking";

const EMBED_BATCH = 16;

interface EmbeddingsResponse {
  data: { index: number; embedding: number[] }[];
}

export async function embedTexts(
  texts: string[],
  config: AiProviderConfig,
): Promise<number[][]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = getApiKey(config.provider);
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const res = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: config.embeddingModel, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`embeddings request failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as EmbeddingsResponse;
  return [...json.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedFile(
  workspaceId: number,
  path: string,
  config?: AiProviderConfig,
): Promise<void> {
  const cfg = config ?? (await getProviderConfig());
  const md = await readTextFile(path);
  const chunks = chunkMarkdown(md);
  const db = await getDb();
  await db.execute("DELETE FROM embeddings WHERE workspace_id = $1 AND path = $2", [
    workspaceId,
    path,
  ]);
  if (chunks.length === 0) return;
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH).map((c) => c.text);
    vectors.push(...(await embedTexts(batch, cfg)));
  }
  for (let i = 0; i < chunks.length; i++) {
    await db.execute(
      "INSERT INTO embeddings (workspace_id, path, chunk_index, text, embedding, model) VALUES ($1, $2, $3, $4, $5, $6)",
      [workspaceId, path, chunks[i].index, chunks[i].text, JSON.stringify(vectors[i]), cfg.embeddingModel],
    );
  }
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
