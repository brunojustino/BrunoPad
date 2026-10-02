import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export function setMediaRoot(path: string): Promise<void> {
  return invoke("set_media_root", { path });
}

export function mediaUrl(filePath: string): string {
  return convertFileSrc(filePath, "media");
}
