import type { RetrievedChunk } from "./retrieval";

const SYSTEM_BASE =
  "You answer questions about the user's markdown notes in their workspace. " +
  "Use ONLY the provided context. Mention the source file paths you relied on. " +
  "If the context is insufficient, say so briefly.";

export function buildSystemPrompt(context: RetrievedChunk[]): string {
  if (context.length === 0) {
    return (
      SYSTEM_BASE +
      "\n\nNo indexed context is available. Say that the workspace has no " +
      "indexed notes and suggest clicking 'Index workspace'."
    );
  }
  const blocks = context
    .map((c) => `[source: ${c.path}]\n${c.text}`)
    .join("\n\n");
  return `${SYSTEM_BASE}\n\nContext:\n${blocks}`;
}
