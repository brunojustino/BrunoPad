import { useState } from "react";
import { getProviderConfig, type AiProviderConfig } from "../../lib/ai/settings";
import { retrieveContext, type RetrievedChunk } from "../../lib/ai/retrieval";
import { streamChat, type ChatMessage } from "../../lib/ai/chat";
import { buildSystemPrompt } from "../../lib/ai/prompt";
import { getCurrentWorkspace } from "../../lib/workspace";

export interface ChatUiMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export function useChatSession(config: AiProviderConfig | null) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const send = async () => {
    const question = input.trim();
    if (!question || streaming) return;
    setInput("");
    setChatError(null);
    const cfg = config ?? (await getProviderConfig());
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setStreaming(true);
    try {
      let context: RetrievedChunk[] = [];
      const ws = await getCurrentWorkspace();
      if (ws) {
        context = await retrieveContext(question, ws.id);
      }
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const request: ChatMessage[] = [
        { role: "system", content: buildSystemPrompt(context) },
        ...history,
        { role: "user", content: question },
      ];
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      await streamChat(request, cfg, (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + delta };
          }
          return next;
        });
      });
      const sources = [...new Set(context.map((c) => c.path))];
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          next[next.length - 1] = sources.length ? { ...last, sources } : { ...last };
        }
        return next;
      });
    } catch (err) {
      console.error("[chat] send failed", err);
      setChatError(String(err));
    } finally {
      setStreaming(false);
    }
  };

  return { messages, input, setInput, streaming, chatError, send };
}
