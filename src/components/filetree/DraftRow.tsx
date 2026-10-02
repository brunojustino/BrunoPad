import { useEffect, useRef, useState } from "react";

export const FILE_NAME_PLACEHOLDER = "untitled.md";
export const FOLDER_NAME_PLACEHOLDER = "untitled";

interface DraftRowProps {
  depth: number;
  defaultValue: string;
  onCommit: (value: string) => void;
}

export function DraftRow({ depth, defaultValue, onCommit }: DraftRowProps) {
  const [value, setValue] = useState(defaultValue);
  const settled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const settle = (commit: boolean) => {
    if (settled.current) return;
    settled.current = true;
    onCommit(commit ? value : "");
  };

  return (
    <input
      ref={inputRef}
      className="mx-1 my-0.5 rounded border border-blue-400 px-1.5 py-0.5 text-sm outline-none"
      style={{ marginLeft: `${depth * 12 + 6}px`, width: "calc(100% - 18px)" }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => settle(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          settled.current = true;
          void onCommit(value);
        }
        if (e.key === "Escape") settle(false);
      }}
    />
  );
}
