import { getApiKey, type AiProviderConfig } from "./settings";

export async function aiPostJson(
  config: AiProviderConfig,
  path: string,
  body: unknown,
  errorLabel: string,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = getApiKey(config.provider);
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${errorLabel} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}
