import { watchImmediate, type UnwatchFn } from "@tauri-apps/plugin-fs";

let lastSelfWrite = 0;

export function markSelfWrite(): void {
  lastSelfWrite = Date.now();
}

export function watchWorkspace(
  path: string,
  onChange: () => void,
): Promise<UnwatchFn> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Date.now() - lastSelfWrite < 700) return;
      onChange();
    }, 200);
  };
  return watchImmediate(path, debounced, { recursive: true });
}
