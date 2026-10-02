import type { DockviewApi } from "dockview-react";

export const FILE_MIME = "application/x-brunopad-file";

export function nameFromPath(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  return path.slice(path.lastIndexOf(sep) + 1);
}

export function openMarkdownPanel(api: DockviewApi, filePath: string): void {
  const existing = api.panels.find((p) => p.params?.filePath === filePath);
  if (existing) {
    existing.api.setActive();
    return;
  }
  api.addPanel({
    id: `file-${Date.now()}`,
    component: "markdown",
    title: nameFromPath(filePath),
    params: { filePath },
  });
}

export function openChatPanel(api: DockviewApi): void {
  const existing = api.panels.find((p) => p.params?.isChat);
  if (existing) {
    existing.api.setActive();
    return;
  }
  api.addPanel({
    id: `chat-${Date.now()}`,
    component: "chat",
    title: "AI",
    params: { isChat: true },
    position: { direction: "right" },
  });
}
