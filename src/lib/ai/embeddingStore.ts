import { getDb } from "../db";

export interface EmbeddingRow {
  path: string;
  chunk_index: number;
  text: string;
  embedding: string;
}

export interface EmbeddingInsert {
  chunkIndex: number;
  text: string;
  embedding: number[];
}

export async function selectEmbeddings(
  workspaceId: number,
  model: string,
): Promise<EmbeddingRow[]> {
  const db = await getDb();
  return db.select<EmbeddingRow[]>(
    "SELECT path, chunk_index, text, embedding FROM embeddings WHERE workspace_id = $1 AND model = $2",
    [workspaceId, model],
  );
}

export async function replaceEmbeddings(
  workspaceId: number,
  path: string,
  inserts: EmbeddingInsert[],
  model: string,
): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM embeddings WHERE workspace_id = $1 AND path = $2", [
    workspaceId,
    path,
  ]);
  for (const insert of inserts) {
    await db.execute(
      "INSERT INTO embeddings (workspace_id, path, chunk_index, text, embedding, model) VALUES ($1, $2, $3, $4, $5, $6)",
      [workspaceId, path, insert.chunkIndex, insert.text, JSON.stringify(insert.embedding), model],
    );
  }
}
