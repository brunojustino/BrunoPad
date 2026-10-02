import { getDb } from "../db";
import { embedTexts } from "./embeddings";
import { getApiKey, getProviderConfig } from "./settings";

export interface RetrievedChunk {
  path: string;
  chunkIndex: number;
  text: string;
  score: number;
}

interface EmbeddingRow {
  path: string;
  chunk_index: number;
  text: string;
  embedding: string;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function retrieveContext(
  question: string,
  workspaceId: number,
  k = 5,
): Promise<RetrievedChunk[]> {
  const cfg = await getProviderConfig();
  if (cfg.provider === "openrouter" && !getApiKey(cfg.provider)) {
    return [];
  }
  const qVec = (await embedTexts([question], cfg))[0];
  if (!qVec) return [];
  const db = await getDb();
  const rows = await db.select<EmbeddingRow[]>(
    "SELECT path, chunk_index, text, embedding FROM embeddings WHERE workspace_id = $1 AND model = $2",
    [workspaceId, cfg.embeddingModel],
  );
  const scored: RetrievedChunk[] = rows.map((row) => ({
    path: row.path,
    chunkIndex: row.chunk_index,
    text: row.text,
    score: cosine(qVec, JSON.parse(row.embedding) as number[]),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
