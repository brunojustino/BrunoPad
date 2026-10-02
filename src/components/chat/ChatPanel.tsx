import { useEffect, useState } from "react";
import {
  AI_PROVIDER_PRESETS,
  getApiKey,
  getProviderConfig,
  setProviderConfig,
  type AiProviderConfig,
  type AiProviderId,
} from "../../lib/ai/settings";
import { indexWorkspace } from "../../lib/ai/embeddings";
import { getCurrentWorkspace } from "../../lib/workspace";

type ChatView = "loading" | "settings" | "chat";

export function ChatPanel() {
  const [view, setView] = useState<ChatView>("loading");
  const [config, setConfig] = useState<AiProviderConfig | null>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const cfg = await getProviderConfig();
        setConfig(cfg);
        setApiKey(getApiKey(cfg.provider));
        setView("settings");
      } catch (err) {
        console.error("[chat] settings load failed", err);
        setView("settings");
      }
    })();
  }, []);

  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  const indexNow = async () => {
    const ws = await getCurrentWorkspace();
    if (!ws) {
      setIndexError("No workspace open");
      return;
    }
    setIndexing(true);
    setIndexError(null);
    try {
      await indexWorkspace(ws.id, ws.path, (done, total) =>
        setProgress(`${done}/${total}`),
      );
      setProgress(null);
    } catch (err) {
      console.error("[chat] index failed", err);
      setIndexError(String(err));
      setProgress(null);
    } finally {
      setIndexing(false);
    }
  };

  if (view === "loading") {
    return <div className="p-3 text-sm text-neutral-500">Loading…</div>;
  }

  if (view === "settings") {
    return (
      <SettingsForm
        initial={config}
        apiKey={apiKey}
        onSaved={(cfg) => {
          setConfig(cfg);
          setApiKey(getApiKey(cfg.provider));
          setView("chat");
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 items-center gap-2 border-b border-neutral-200 px-2">
        <button
          className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-200 disabled:opacity-50"
          disabled={indexing}
          onClick={() => void indexNow()}
          title="Chunk + embed every .md file in the workspace"
        >
          {indexing ? "Indexing…" : "Index workspace"}
        </button>
        {progress && <span className="text-xs text-neutral-500">{progress}</span>}
        {indexError && <span className="truncate text-xs text-red-600">{indexError}</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-sm text-neutral-400">
        Ask questions about your workspace…
      </div>
      <div className="border-t border-neutral-200 p-2">
        <input
          type="text"
          disabled
          placeholder="Send messages in an upcoming step"
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm disabled:bg-neutral-100"
        />
      </div>
    </div>
  );
}

interface SettingsFormProps {
  initial: AiProviderConfig | null;
  apiKey: string;
  onSaved: (config: AiProviderConfig) => void;
}

function SettingsForm({ initial, apiKey, onSaved }: SettingsFormProps) {
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

  const missingKey = preset.requiresApiKey && !apiKey;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 text-sm">
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Provider</label>
        <select
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5"
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
        <label className="mb-1 block text-xs text-neutral-500">Base URL</label>
        <input
          type="text"
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5"
          value={config.baseUrl}
          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
          placeholder={preset.baseUrl}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Chat model</label>
        <input
          type="text"
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5"
          value={config.chatModel}
          onChange={(e) => setConfig({ ...config, chatModel: e.target.value })}
          placeholder={preset.chatModel ? preset.chatModel : "model as loaded"}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Embedding model</label>
        <input
          type="text"
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5"
          value={config.embeddingModel}
          onChange={(e) => setConfig({ ...config, embeddingModel: e.target.value })}
          placeholder={preset.embeddingModel ? preset.embeddingModel : "model as loaded"}
        />
      </div>
      {preset.requiresApiKey && (
        <div>
          <label className="mb-1 block text-xs text-neutral-500">OpenRouter API key</label>
          <input
            type="text"
            readOnly
            className={`w-full rounded-md border px-2 py-1.5 ${
              missingKey ? "border-red-300 bg-red-50" : "border-neutral-200 bg-neutral-100"
            }`}
            value={apiKey || ""}
            placeholder="set OPENROUTER_API_KEY in .env"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Read from <code>.env</code> (OPENROUTER_API_KEY). Restart after editing.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        className="mt-auto rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        disabled={saving || missingKey}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
