import { Gtk } from "ags/gtk4";
import AstalBluetooth from "gi://AstalBluetooth";
import GLib from "gi://GLib";

const ICON_DIR = `${GLib.get_home_dir()}/.config/ags/noahrch/icons`;

const ICON_BT = `${ICON_DIR}/bluetooth.svg`;

export default function Bluetooth() {
  const bt = AstalBluetooth.get_default();

  return (
    <button
      class="bluetooth-icon"
      valign={Gtk.Align.CENTER}
      $={(self: Gtk.Button) => {
        const img = new Gtk.Image();
        self.set_child(img);

        img.set_from_file(ICON_BT);

        self.connect("clicked", () => {
          GLib.spawn_command_line_async("omarchy-launch-bluetooth");
        });
      }}
    />
  );
}
