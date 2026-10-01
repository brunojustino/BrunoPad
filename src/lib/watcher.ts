import { watchImmediate, type UnwatchFn } from "@tauri-apps/plugin-fs";

export function watchWorkspace(
  path: string,
  onChange: () => void,
): Promise<UnwatchFn> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 200);
  };
  return watchImmediate(path, debounced, { recursive: true });
}
