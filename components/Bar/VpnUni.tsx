import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { Gtk } from "ags/gtk4";

// adjust this if your icons are in another folder
const ICON_DIR = `${GLib.get_home_dir()}/.config/ags/noahrch/icons`;

const ICON_DISCONNECTED = `${ICON_DIR}/shield-x.svg`;
const ICON_CONNECTED = `${ICON_DIR}/shield-check.svg`;
const ICON_BUSY = `${ICON_DIR}/shield-ellipsis.svg`;

function isUniVpnActive(): boolean {
  try {
    const proc = Gio.Subprocess.new(
      ["/usr/bin/pgrep", "-a", "openconnect"],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE
    );

    const [, stdout] = proc.communicate_utf8(null, null);
    const exit = proc.get_exit_status();

    if (exit === 1 || !stdout) return false; // 1 = no matches

    return stdout
      .trim()
      .split("\n")
      .some((line) => line.includes("vpn.uni-bremen.de"));
  } catch (err) {
    console.error("Uni VPN status check failed", err);
    return false;
  }
}

function connectUniVpn() {
  const cmd = "ghostty -e bash -lc 'uni-vpn-connect'";
  GLib.spawn_command_line_async(cmd);
}

function disconnectUniVpn() {
  const cmd =
    "ghostty -e bash -lc 'echo \"[VPN] Disconnecting Uni Bremen VPN\"; echo; " +
    "sudo pkill openconnect; " +
    "echo; printf \"\\e[32m[VPN] Disconnected successfully!\\e[0m\\n\"; echo; sleep 1'";
  GLib.spawn_command_line_async(cmd);
}


type VpnUiState = "disconnected" | "connected" | "transitioning";

export default function VpnUni() {
  return (
    <button
      class="vpn-uni-icon"
      valign={Gtk.Align.CENTER}
      tooltipText="Uni Bremen VPN"
      $={(self: Gtk.Button) => {
        let uiState: VpnUiState = "disconnected";
        // null = no action in progress, just mirror system
        // true = we clicked to CONNECT (want systemOn === true)
        // false = we clicked to DISCONNECT (want systemOn === false)
        let targetConnected: boolean | null = null;

        const icon = self.get_child() as Gtk.Image;

        const setIconAndStyle = () => {
          let iconPath = ICON_DISCONNECTED;
          let tooltip = "Uni Bremen VPN: disconnected";

          if (uiState === "transitioning") {
            iconPath = ICON_BUSY;
            tooltip = "Uni Bremen VPN: working…";
          } else if (uiState === "connected") {
            iconPath = ICON_CONNECTED;
            tooltip = "Uni Bremen VPN: connected";
          }

          icon.set_from_file(iconPath);
          self.set_tooltip_text(tooltip);

          const baseCss = `
            min-width: 28px;
            min-height: 28px;
            border-radius: 50%;
            padding: 6px;
            border: 1px solid rgba(255,255,255,0.10);
            transition: background-color 140ms ease,
                        box-shadow 140ms ease,
                        opacity 140ms ease,
                        transform 80ms ease;
          `;

          const connectedCss = `
            ${baseCss}
            background: @theme_selected_bg_color;
            color: @theme_selected_fg_color;
            box-shadow: 0 0 6px rgba(0,0,0,0.35);
          `;

          const disconnectedCss = `
            ${baseCss}
            background: rgba(255,255,255,0.04);
            color: @theme_fg_color;
            opacity: 0.9;
          `;

          const transitioningCss = `
            ${baseCss}
            background: rgba(255,255,255,0.10);
            color: @theme_fg_color;
            box-shadow: 0 0 4px rgba(0,0,0,0.25);
          `;

          (self as any).css =
            uiState === "connected"
              ? connectedCss
              : uiState === "transitioning"
              ? transitioningCss
              : disconnectedCss;
        };

        const syncWithSystem = () => {
          const systemOn = isUniVpnActive();

          if (targetConnected === null) {
            // no action in progress → just mirror system state
            uiState = systemOn ? "connected" : "disconnected";
          } else {
            // we clicked before and are waiting for system to reach target
            if (systemOn === targetConnected) {
              // reached the desired state → stop transitioning
              uiState = systemOn ? "connected" : "disconnected";
              targetConnected = null;
            } else {
              // still not in target state → stay in ellipsis
              uiState = "transitioning";
            }
          }

          setIconAndStyle();
        };

        // initial sync
        uiState = isUniVpnActive() ? "connected" : "disconnected";
        setIconAndStyle();

        // poll every 3 seconds
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => {
          syncWithSystem();
          return GLib.SOURCE_CONTINUE;
        });

        // toggle on click
        self.connect("clicked", () => {
          const systemOn = isUniVpnActive();

          if (systemOn) {
            // currently connected → user wants to DISCONNECT
            targetConnected = false;
            uiState = "transitioning"; // shield-ellipsis until systemOn === false
            setIconAndStyle();
            disconnectUniVpn();
          } else {
            // currently disconnected → user wants to CONNECT
            targetConnected = true;
            uiState = "transitioning"; // shield-ellipsis until systemOn === true
            setIconAndStyle();
            connectUniVpn();
          }
        });
      }}
    >
      <image />
    </button>
  );
}
