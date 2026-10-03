import { useState } from "react";
import {
  AI_PROVIDER_PRESETS,
  setProviderConfig,
  type AiProviderConfig,
  type AiProviderId,
} from "../../lib/ai/settings";

interface SettingsFormProps {
  initial: AiProviderConfig | null;
  hasApiKey: boolean;
  onSaved: (config: AiProviderConfig) => void;
}

export function SettingsForm({ initial, hasApiKey, onSaved }: SettingsFormProps) {
  const [config, setConfig] = useState<AiProviderConfig>(
    initial ?? {
      provider: "openrouter",
      baseUrl: "",
      chatModel: "",
      embeddingModel: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = AI_PROVIDER_PRESETS.find((p) => p.id === config.provider)!;

  const pickProvider = (id: AiProviderId) => {
    const p = AI_PROVIDER_PRESETS.find((x) => x.id === id)!;
    setConfig({
      provider: p.id,
      baseUrl: p.baseUrl,
      chatModel: p.chatModel,
      embeddingModel: p.embeddingModel,
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await setProviderConfig(config);
      onSaved(config);
    } catch (err) {
      console.error("[chat] settings save failed", err);
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const missingKey = preset.requiresApiKey && !hasApiKey;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 text-sm">
      <div>
        <label className="mb-1 block text-xs text-fog-500">Provider</label>
        <select
          className="w-full rounded-md border border-line bg-ink-800 px-2 py-1.5 text-fog-100 outline-none focus:border-brass-400"
          value={config.provider}
          onChange={(e) => pickProvider(e.target.value as AiProviderId)}
        >
          {AI_PROVIDER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fog-500">Base URL</label>
        <input
          type="text"
          className="w-full rounded-md border border-line bg-ink-800 px-2 py-1.5 text-fog-100 outline-none focus:border-brass-400"
          value={config.baseUrl}
          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
          placeholder={preset.baseUrl}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fog-500">Chat model</label>
        <input
          type="text"
          className="w-full rounded-md border border-line bg-ink-800 px-2 py-1.5 text-fog-100 outline-none focus:border-brass-400"
          value={config.chatModel}
          onChange={(e) => setConfig({ ...config, chatModel: e.target.value })}
          placeholder={preset.chatModel ? preset.chatModel : "model as loaded"}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fog-500">Embedding model</label>
        <input
          type="text"
          className="w-full rounded-md border border-line bg-ink-800 px-2 py-1.5 text-fog-100 outline-none focus:border-brass-400"
          value={config.embeddingModel}
          onChange={(e) => setConfig({ ...config, embeddingModel: e.target.value })}
          placeholder={preset.embeddingModel ? preset.embeddingModel : "model as loaded"}
        />
      </div>
      {preset.requiresApiKey && (
        <div>
          <label className="mb-1 block text-xs text-fog-500">OpenRouter API key</label>
          <div
            className={`w-full rounded-md border px-2 py-1.5 text-xs ${
              missingKey
                ? "border-berry-400/40 bg-berry-400/10 text-berry-400"
                : "border-line bg-ink-850 text-fog-500"
            }`}
          >
            {hasApiKey ? "Configured (hidden)" : "Not set"}
          </div>
          <p className="mt-1 text-xs text-fog-600">
            Read from <code>.env</code> (OPENROUTER_API_KEY). Restart after editing.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-berry-400">{error}</p>}
      <button
        className="mt-auto rounded-md bg-brass-400 px-4 py-2 font-medium text-ink-950 hover:bg-brass-300 disabled:opacity-50"
        disabled={saving || missingKey}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
