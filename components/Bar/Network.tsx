import { Gtk } from "ags/gtk4";
import GLib from "gi://GLib";

const ICON_DIR = `${GLib.get_home_dir()}/.config/ags/noahrch/icons`;
const ICON_WIFI = `${ICON_DIR}/wifi.svg`;
const ICON_WIFI_OFF = `${ICON_DIR}/wifi-off.svg`;

export default function Network() {
  return (
    <button
      class="network-icon"
      valign={Gtk.Align.CENTER}
      tooltipText="Network"
      $={(self: Gtk.Button) => {
        const icon = new Gtk.Image();
        self.set_child(icon);

        const updateIcon = () => {
          try {
            const [ok, out] = GLib.spawn_command_line_sync(
              `${GLib.get_home_dir()}/.config/ags/noahrch/scripts/wifi-status`
            );

            const status =
              ok && out instanceof Uint8Array
                ? new TextDecoder().decode(out).trim()
                : "";
            const connected = status === "on";

            icon.set_from_file(connected ? ICON_WIFI : ICON_WIFI_OFF);
            self.set_tooltip_text(
              connected ? "Wi-Fi connected" : "Wi-Fi not connected"
            );
          } catch (err) {
            icon.set_from_file(ICON_WIFI_OFF);
            self.set_tooltip_text("Unknown");
          }
        };

        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => {
          updateIcon();
          return GLib.SOURCE_CONTINUE;
        });

        self.connect("clicked", () => {
          GLib.spawn_command_line_async("omarchy-launch-wifi");
        });

        updateIcon();
      }}
    >
      Network
    </button>
  );
}
