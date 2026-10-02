import { aiPostJson } from "./aiHttpClient";
import type { AiProviderConfig } from "./settings";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  config: AiProviderConfig,
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await aiPostJson(
    config,
    "/chat/completions",
    { model: config.chatModel, messages, stream: true },
    "chat request",
  );
  if (!res.body) {
    throw new Error("chat request failed: empty response body");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf("\n");
    while (nl >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            onDelta(delta);
          }
        } catch {
          console.warn("[chat] unparseable SSE line", payload);
        }
      }
      nl = buffer.indexOf("\n");
    }
  }
}
