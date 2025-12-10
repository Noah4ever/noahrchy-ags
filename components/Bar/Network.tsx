import { Gtk } from "ags/gtk4";
import AstalNetwork from "gi://AstalNetwork";
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

        const network = AstalNetwork.get_default();
        let lastWifi: AstalNetwork.Wifi | null = null;

        const updateIcon = () => {
          try {
            const wifi = network.wifi;
            console.log("Network wifi status:", wifi);
            console.log("Network: ", network);
            if (wifi && wifi !== lastWifi) {
              wifi.connect("notify::active-access-point", updateIcon);
              lastWifi = wifi;
            }

            const wifiConnected = !!wifi?.activeAccessPoint;

            icon.set_from_file(wifiConnected ? ICON_WIFI : ICON_WIFI_OFF);
            self.set_tooltip_text(
              wifiConnected ? "Wi-Fi connected" : "Wi-Fi disconnected"
            );
          } catch (err) {
            console.error("network icon update failed", err);
            icon.set_from_file(ICON_WIFI_OFF);
            self.set_tooltip_text("Wi-Fi status unknown");
          }
        };

        network.connect("notify::wifi", () => {
          lastWifi = null;
          updateIcon();
        });
        network.connect("notify::active-connections", updateIcon);

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
