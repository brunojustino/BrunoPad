import { aiPostJson } from "./aiHttpClient";
import type { AiProviderConfig } from "./settings";

interface EmbeddingsResponse {
  data: { index: number; embedding: number[] }[];
}

export async function embedTexts(
  texts: string[],
  config: AiProviderConfig,
): Promise<number[][]> {
  const res = await aiPostJson(
    config,
    "/embeddings",
    { model: config.embeddingModel, input: texts },
    "embeddings request",
  );
  const json = (await res.json()) as EmbeddingsResponse;
  return [...json.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
