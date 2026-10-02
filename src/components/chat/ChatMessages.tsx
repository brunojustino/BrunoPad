import { useEffect, useRef } from "react";
import type { ChatUiMessage } from "./useChatSession";

interface ChatMessagesProps {
  messages: ChatUiMessage[];
  streaming: boolean;
}

export function ChatMessages({ messages, streaming }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
      {messages.length === 0 && (
        <div className="text-neutral-400">Ask questions about your workspace…</div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
          <div
            className={`inline-block max-w-full whitespace-pre-wrap rounded-lg px-2.5 py-1.5 ${
              m.role === "user"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-900"
            }`}
          >
            {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
          </div>
          {m.sources && m.sources.length > 0 && (
            <div className="mt-1 text-xs text-neutral-500">
              Sources: {m.sources.join(", ")}
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
