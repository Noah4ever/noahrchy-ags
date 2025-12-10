import { Gtk } from "ags/gtk4";
import GLib from "gi://GLib";

const ICON_DIR = `${GLib.get_home_dir()}/.config/ags/noahrch/icons`;
const ICON_ACTIVITY = `${ICON_DIR}/cpu.svg`;

export default function SystemMonitor() {
  return (
    <button
      class="system-monitor-icon"
      valign={Gtk.Align.CENTER}
      tooltipText="System Monitor (btop)"
      $={(self: Gtk.Button) => {
        const img = new Gtk.Image();
        img.set_from_file(ICON_ACTIVITY);
        self.set_child(img);

        self.connect("clicked", () => {
          GLib.spawn_command_line_async("omarchy-launch-or-focus-tui btop");
        });
      }}
    />
  );
}
