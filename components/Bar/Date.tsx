import { Gtk } from "ags/gtk4";
import GLib from "gi://GLib";
import { createPoll } from "ags/time";

export default function Date({ format = "%H:%M:%S" }: { format?: string }) {
  const time = createPoll("", 10, () => {
    return GLib.DateTime.new_now_local().format(format);
  });

  return (
    <menubutton>
      <label label={time} />
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
  );
}
