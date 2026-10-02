import { watchImmediate, type UnwatchFn } from "@tauri-apps/plugin-fs";

let lastSelfWrite = 0;

export function markSelfWrite(): void {
  lastSelfWrite = Date.now();
}

export function watchWorkspace(
  path: string,
  onChange: (changedPaths: string[]) => void,
): Promise<UnwatchFn> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: string[] = [];
  const debounced = (event: { paths?: string[] }) => {
    if (event.paths) pending.push(...event.paths);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const paths = pending;
      pending = [];
      if (Date.now() - lastSelfWrite < 700) return;
      onChange(paths);
    }, 200);
  };
  return watchImmediate(path, debounced, { recursive: true });
}
