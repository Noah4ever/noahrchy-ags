import { Gtk } from "ags/gtk4";
import { For, createState } from "ags";
import { execAsync } from "ags/process";
import GLib from "gi://GLib";

interface HyprWorkspace {
  id: number;
  name: string;
  windows: number;
  monitorID: number;
}

const [workspaces, setWorkspaces] = createState<HyprWorkspace[]>([]);
const [activeId, setActiveId] = createState<number | null>(null);

const sameWorkspaceLists = (a: HyprWorkspace[], b: HyprWorkspace[]) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x.id - y.id);
  const sb = [...b].sort((x, y) => x.id - y.id);
  for (let i = 0; i < sa.length; i++) {
    const aw = sa[i];
    const bw = sb[i];
    if (
      aw.id !== bw.id ||
      aw.name !== bw.name ||
      aw.windows !== bw.windows ||
      aw.monitorID !== bw.monitorID
    ) {
      return false;
    }
  }
  return true;
};

const fetchHyprState = async () => {
  try {
    const [wsRaw, activeRaw] = await Promise.all([
      execAsync(["hyprctl", "-j", "workspaces"]),
      execAsync(["hyprctl", "-j", "activeworkspace"]),
    ]);

    const ws = JSON.parse(wsRaw) as HyprWorkspace[];
    const active = JSON.parse(activeRaw) as HyprWorkspace;

    setWorkspaces((prev) => (sameWorkspaceLists(prev, ws) ? prev : ws));
    setActiveId((prev) => (prev === active.id ? prev : active.id));
  } catch (err) {
    console.error("hypr workspace poll failed", err);
  }
};

// initial sync
void fetchHyprState();

// lightweight poll (~12.5 times per second)
GLib.timeout_add(GLib.PRIORITY_DEFAULT, 80, () => {
  void fetchHyprState();
  return GLib.SOURCE_CONTINUE;
});

export default function Workspaces() {
  // always render slots 1–5, but fill them with real workspaces if they exist
  const slots = workspaces((list) => {
    const sorted = [...list].sort((a, b) => a.id - b.id);
    const byId = new Map(sorted.map((ws) => [ws.id, ws]));
    return Array.from({ length: 5 }, (_, i) => {
      const id = i + 1;
      const found = byId.get(id);
      return (
        found ?? {
          id,
          name: `${id}`,
          windows: 0,
          monitorID: -1,
        }
      );
    });
  });

  return (
    <box spacing={4} valign={Gtk.Align.CENTER}>
      <For each={slots}>
        {(ws: HyprWorkspace) => {
          const css = activeId((currentId) => {
            const isActive = currentId === ws.id;
            const hasWindows = ws.windows > 0;
            const isMuted = !isActive && !hasWindows;

            return `
              padding: 4px 8px;
              border-radius: 6px;
              background: ${
                isActive ? "@theme_selected_bg_color" : "transparent"
              };
              color: ${
                isActive
                  ? "@theme_selected_fg_color"
                  : isMuted
                  ? "@theme_unfocused_fg_color"
                  : "inherit"
              };
              opacity: ${isMuted ? 0.45 : 1};
            `;
          });

          const tooltipText = workspaces((list) => {
            const real = list.find((w) => w.id === ws.id);
            const count = real?.windows ?? ws.windows ?? 0;
            const name = real?.name || ws.name || `${ws.id}`;
            return `Workspace ${name} (${count} window${
              count === 1 ? "" : "s"
            })`;
          });

          return (
            <button
              onClicked={() =>
                execAsync([
                  "hyprctl",
                  "dispatch",
                  "workspace",
                  `${ws.id}`,
                ]).catch(console.error)
              }
              css={css}
              tooltipText={tooltipText}
            >
              {ws.name || `${ws.id}`}
            </button>
          );
        }}
      </For>
    </box>
  );
}
