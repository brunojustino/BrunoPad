import { useEffect, useState } from "react";
import { getApiKey, getProviderConfig, type AiProviderConfig } from "../../lib/ai/settings";
import { indexWorkspace } from "../../lib/ai/indexing";
import { getCurrentWorkspace } from "../../lib/workspace";
import { SettingsForm } from "./SettingsForm";
import { ChatMessages } from "./ChatMessages";
import { useChatSession } from "./useChatSession";

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
      <ChatMessages messages={session.messages} streaming={session.streaming} />
      {session.chatError && (
        <div className="px-3 pb-1 text-xs text-red-600">{session.chatError}</div>
      )}
      <div className="border-t border-neutral-200 p-2">
        <input
          type="text"
          className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm disabled:bg-neutral-100"
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
