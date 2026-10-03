import type { BlockNoteEditor } from "@blocknote/core";

type AnyNode = Record<string, unknown>;

function textFromInline(nodes: unknown): string {
  if (typeof nodes === "string") return nodes;
  if (Array.isArray(nodes)) return nodes.map(textFromInline).join("");
  if (nodes && typeof nodes === "object") {
    const node = nodes as AnyNode;
    if (typeof node.text === "string") return node.text;
    if (node.content !== undefined) return textFromInline(node.content);
  }
  return "";
}

function textFromBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  let out = "";
  for (const entry of blocks as AnyNode[]) {
    if (entry.content !== undefined) out += " " + textFromInline(entry.content);
    if (Array.isArray(entry.rows)) {
      for (const row of entry.rows as AnyNode[]) {
        for (const cell of (row.cells ?? []) as AnyNode[]) {
          if (cell.content !== undefined) out += " " + textFromInline(cell.content);
        }
      }
    }
    if (entry.children !== undefined) out += " " + textFromBlocks(entry.children);
  }
  return out;
}

export function countWords(editor: BlockNoteEditor): number {
  const text = textFromBlocks(editor.document);
  return text.split(/\s+/).filter(Boolean).length;
}
