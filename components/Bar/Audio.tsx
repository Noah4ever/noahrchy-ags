import { Gtk } from "ags/gtk4";
import GLib from "gi://GLib";

const ICON_DIR = `${GLib.get_home_dir()}/.config/ags/noahrch/icons`;

const ICON_MUTE = `${ICON_DIR}/volume-x.svg`;
const ICON_LOWEST = `${ICON_DIR}/volume-off.svg`;
const ICON_LOW = `${ICON_DIR}/volume.svg`;
const ICON_MED = `${ICON_DIR}/volume-1.svg`;
const ICON_HIGH = `${ICON_DIR}/volume-2.svg`;

function getVolume(): number | null {
  try {
    const [ok, out] = GLib.spawn_command_line_sync("pamixer --get-volume");
    if (!ok || !out) return null;
    const txt = new TextDecoder().decode(out).trim();
    const v = Number.parseInt(txt, 10);
    if (Number.isNaN(v)) return null;
    return v;
  } catch {
    return null;
  }
}

function isMuted(): boolean | null {
  try {
    const [ok, out] = GLib.spawn_command_line_sync("pamixer --get-mute");
    if (!ok || !out) return null;
    const txt = new TextDecoder().decode(out).trim().toLowerCase();
    return txt === "true";
  } catch {
    return null;
  }
}

function pickIcon(vol: number | null, muted: boolean | null): string {
  if (vol === null || muted === null) return ICON_MUTE;
  if (muted) return ICON_MUTE;

  if (vol < 10) return ICON_LOWEST;
  if (vol < 33) return ICON_LOW;
  if (vol < 66) return ICON_MED;
  return ICON_HIGH;
}

export default function Audio() {
  return (
    <button
      class="audio-icon"
      valign={Gtk.Align.CENTER}
      label="Audio"
      tooltipText="Audio"
      $={(self: Gtk.Button) => {
        const img = new Gtk.Image();
        self.set_child(img);

        const update = () => {
          const vol = getVolume();
          const muted = isMuted();
          img.set_from_file(pickIcon(vol, muted));

          if (vol === null || muted === null) {
            self.set_tooltip_text("Audio: unknown (pamixer error?)");
          } else {
            self.set_tooltip_text(`Volume: ${vol}%${muted ? " (muted)" : ""}`);
          }
        };

        // poll every 0.5s – cheap enough, pamixer is light
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
          update();
          return GLib.SOURCE_CONTINUE;
        });

        // left-click → audio TUI
        self.connect("clicked", () => {
          GLib.spawn_command_line_async("omarchy-launch-or-focus-tui wiremix");
        });

        // right-click → mute toggle
        const rightClick = new Gtk.GestureClick({ button: 3 });
        rightClick.connect("pressed", () => {
          GLib.spawn_command_line_async("pamixer -t");
        });
        self.add_controller(rightClick);

        // scroll for volume
        const scroll = new Gtk.EventControllerScroll({
          flags: Gtk.EventControllerScrollFlags.VERTICAL,
        });
        scroll.connect("scroll", (_c, _dx, dy) => {
          if (dy < 0) {
            GLib.spawn_command_line_async("pamixer -i 5");
          } else {
            GLib.spawn_command_line_async("pamixer -d 5");
          }
        });
        self.add_controller(scroll);

        update();
      }}
    />
  );
}
