import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { onCleanup } from "ags";

import Date from "./Date";
import Mpris from "./Mpris";
import Workspaces from "./Workspaces";
import SystemMonitor from "./SystemMonitor";
import VpnUni from "./VpnUni";
import Network from "./Network";
import Bluetooth from "./Bluetooth";
import Audio from "./Audio";

export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let win: Astal.Window;
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  onCleanup(() => {
    // Root components (windows) are not automatically destroyed.
    // When the monitor is disconnected from the system, this callback
    // is run from the parent <For> which allows us to destroy the window
    win.destroy();
  });

  return (
    <window
      $={(self) => (win = self)}
      visible
      namespace="my-bar"
      name={`bar-${gdkmonitor.connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start">
          <Workspaces />
        </box>
        <box $type="center">
          <Date />
        </box>
        <box $type="end">
          <Mpris />
          <Audio />
          <VpnUni />
          <Bluetooth />
          <Network />
          <SystemMonitor />
          <Date format="%A, %d.%m.%Y" />
        </box>
      </centerbox>
    </window>
  );
}
