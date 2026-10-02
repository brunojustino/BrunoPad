import type { SerializedDockview } from "dockview-react";
import { getDb } from "./db";

export type PaneLayout = SerializedDockview;

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
    const parsed = JSON.parse(rows[0].layout) as PaneLayout;
    return parsed && typeof parsed === "object" ? parsed : null;
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
