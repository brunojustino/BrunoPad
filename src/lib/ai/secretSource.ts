import type { AiProviderId } from "./settings";

export interface SecretSource {
  get(providerId: AiProviderId): string;
}

export const envSecretSource: SecretSource = {
  get(providerId: AiProviderId): string {
    if (providerId !== "openrouter") return "";
    return import.meta.env.OPENROUTER_API_KEY ?? "";
  },
};

export const noSecretSource: SecretSource = {
  get(): string {
    return "";
  },
};
