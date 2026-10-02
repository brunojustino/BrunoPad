import type { SerializedDockview } from "dockview-react";
import { getDb } from "./db";

export type PaneLayout = SerializedDockview;

function isDockviewLayout(value: unknown): value is PaneLayout {
  const grid = (value as PaneLayout | null)?.grid;
  return !!grid && (grid as { root?: { type?: string } }).root?.type === "branch";
}

export async function loadPaneLayout(
  workspaceId: number,
): Promise<PaneLayout | null> {
  const db = await getDb();
  const rows = await db.select<{ layout: string }[]>(
    "SELECT layout FROM pane_layouts WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1",
    [workspaceId],
  );
  if (!rows[0]) return null;
  try {
    const parsed: unknown = JSON.parse(rows[0].layout);
    // valid JSON of the wrong shape (e.g. pre-dockview mosaic
    // `{ tree, panes }` layouts) resets to an empty layout
    return isDockviewLayout(parsed) ? parsed : null;
  } catch (err) {
    console.error("[panes] corrupt layout, resetting", err);
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function savePaneLayout(
  workspaceId: number,
  layout: PaneLayout,
): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const db = await getDb();
    await db.execute("DELETE FROM pane_layouts WHERE workspace_id = $1", [
      workspaceId,
    ]);
    await db.execute(
      "INSERT INTO pane_layouts (workspace_id, layout) VALUES ($1, $2)",
      [workspaceId, JSON.stringify(layout)],
    );
  }, 300);
}
