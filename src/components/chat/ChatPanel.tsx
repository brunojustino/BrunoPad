import { useEffect, useState } from "react";
import {
  getProviderConfig,
  hasApiKey,
  hasSavedAiConfig,
  type AiProviderConfig,
} from "../../lib/ai/settings";
import { indexWorkspace } from "../../lib/ai/indexing";
import { getCurrentWorkspace } from "../../lib/workspace";
import { SettingsForm } from "./SettingsForm";
import { ChatMessages } from "./ChatMessages";
import { useChatSession } from "./useChatSession";

type ChatView = "loading" | "settings" | "chat";

export function ChatPanel() {
  const [view, setView] = useState<ChatView>("loading");
  const [config, setConfig] = useState<AiProviderConfig | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cfg, saved] = await Promise.all([getProviderConfig(), hasSavedAiConfig()]);
        setConfig(cfg);
        setHasKey(hasApiKey(cfg.provider));
        setView(saved ? "chat" : "settings");
      } catch (err) {
        console.error("[chat] settings load failed", err);
        setView("settings");
      }
    })();
  }, []);

  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  const session = useChatSession(config);

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
    return <div className="p-3 text-sm text-fog-500">Loading…</div>;
  }

  if (view === "settings") {
    return (
      <SettingsForm
        initial={config}
        hasApiKey={hasKey}
        onSaved={(cfg) => {
          setConfig(cfg);
          setHasKey(hasApiKey(cfg.provider));
          setView("chat");
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 items-center gap-2 border-b border-line-soft bg-ink-900 px-2">
        <button
          className="rounded px-1.5 py-0.5 text-xs text-fog-500 hover:bg-ink-700 hover:text-fog-100 disabled:opacity-50"
          disabled={indexing}
          onClick={() => void indexNow()}
          title="Chunk + embed every .md file in the workspace"
        >
          {indexing ? "Indexing…" : "Index workspace"}
        </button>
        {progress && <span className="text-xs text-fog-500">{progress}</span>}
        {indexError && <span className="truncate text-xs text-berry-400">{indexError}</span>}
        <button
          className="ml-auto rounded px-1.5 py-0.5 text-xs text-fog-500 hover:bg-ink-700 hover:text-fog-100"
          onClick={() => setView("settings")}
          title="AI provider settings"
        >
          Settings
        </button>
      </div>
      <ChatMessages messages={session.messages} streaming={session.streaming} />
      {session.chatError && (
        <div className="px-3 pb-1 text-xs text-berry-400">{session.chatError}</div>
      )}
      <div className="border-t border-line-soft bg-ink-900 p-2">
        <input
          type="text"
          className="w-full rounded-md border border-line bg-ink-800 px-2 py-1.5 text-sm text-fog-100 outline-none placeholder:text-fog-600 focus:border-brass-400 disabled:bg-ink-850 disabled:text-fog-600"
          disabled={session.streaming}
          value={session.input}
          placeholder={session.streaming ? "Answering…" : "Ask about your workspace…"}
          onChange={(e) => session.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void session.send();
            }
          }}
        />
      </div>
    </div>
  );
}
