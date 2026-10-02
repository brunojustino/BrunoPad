import { getDb } from "../db";
import { envSecretSource, noSecretSource, type SecretSource } from "./secretSource";

export type AiProviderId = "openrouter" | "ollama" | "lmstudio";

export interface AiProviderPreset {
  id: AiProviderId;
  label: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  requiresApiKey: boolean;
  secretSource: SecretSource;
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    chatModel: "stealth/space-bunny-alpha",
    embeddingModel: "openai/text-embedding-3-small",
    requiresApiKey: true,
    secretSource: envSecretSource,
  },
  {
    id: "ollama",
    label: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    chatModel: "",
    embeddingModel: "nomic-embed-text",
    requiresApiKey: false,
    secretSource: noSecretSource,
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    chatModel: "",
    embeddingModel: "",
    requiresApiKey: false,
    secretSource: noSecretSource,
  },
];

const PRESETS: Record<AiProviderId, AiProviderPreset> = {
  openrouter: AI_PROVIDER_PRESETS[0],
  ollama: AI_PROVIDER_PRESETS[1],
  lmstudio: AI_PROVIDER_PRESETS[2],
};

export interface AiProviderConfig {
  provider: AiProviderId;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

const SETTING_KEYS = ["provider", "baseUrl", "chatModel", "embeddingModel"] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

interface AiSettingRow {
  key: string;
  value: string;
}

function presetFor(id: string | undefined): AiProviderPreset {
  if (id && id in PRESETS) return PRESETS[id as AiProviderId];
  return PRESETS.openrouter;
}

function configFromPreset(preset: AiProviderPreset): AiProviderConfig {
  return {
    provider: preset.id,
    baseUrl: preset.baseUrl,
    chatModel: preset.chatModel,
    embeddingModel: preset.embeddingModel,
  };
}

export async function getProviderConfig(): Promise<AiProviderConfig> {
  const db = await getDb();
  const rows = await db.select<AiSettingRow[]>("SELECT key, value FROM ai_settings");
  const stored = new Map(rows.map((r) => [r.key as SettingKey, r.value]));
  const config = configFromPreset(presetFor(stored.get("provider")));
  if (stored.has("baseUrl")) config.baseUrl = stored.get("baseUrl")!;
  if (stored.has("chatModel")) config.chatModel = stored.get("chatModel")!;
  if (stored.has("embeddingModel")) config.embeddingModel = stored.get("embeddingModel")!;
  return config;
}

export async function setProviderConfig(config: AiProviderConfig): Promise<void> {
  const db = await getDb();
  for (const key of SETTING_KEYS) {
    await db.execute(
      "INSERT INTO ai_settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, config[key]],
    );
  }
}

export function getApiKey(provider: AiProviderId): string {
  return PRESETS[provider].secretSource.get(provider);
}
