import { getApiKey, type AiProviderConfig } from "./settings";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  config: AiProviderConfig,
  onDelta: (text: string) => void,
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = getApiKey(config.provider);
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: config.chatModel, messages, stream: true }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`chat request failed: ${res.status} ${await res.text()}`);
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
