import { getLeaves, type MosaicNode } from "react-mosaic-component";
import { getDb } from "./db";

export interface PaneLayout {
  tree: MosaicNode<string> | null;
  panes: Record<string, string>;
}

export async function loadPaneLayout(workspaceId: number): Promise<PaneLayout> {
  const db = await getDb();
  const rows = await db.select<{ layout: string }[]>(
    "SELECT layout FROM pane_layouts WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1",
    [workspaceId],
  );
  if (!rows[0]) return { tree: null, panes: {} };
  try {
    const parsed = JSON.parse(rows[0].layout) as PaneLayout;
    const tree = parsed.tree ?? null;
    let panes = parsed.panes ?? {};
    if (tree) {
      // drop orphan pane entries whose ids are not leaves of the tree
      // (guards against corrupted layouts saved by older bugs)
      const leaves = new Set<string>(getLeaves(tree));
      panes = Object.fromEntries(
        Object.entries(panes).filter(([id]) => leaves.has(id)),
      );
    } else {
      panes = {};
    }
    return { tree, panes };
  } catch (err) {
    console.error("[panes] corrupt layout, resetting", err);
    return { tree: null, panes: {} };
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
