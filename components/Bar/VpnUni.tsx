/* eslint-disable jsx-a11y/alt-text */
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { Gtk } from "ags/gtk4";
import { appConfig } from "../../config";

type VpnUiState = "disconnected" | "connected" | "transitioning";

type VpnConfig = {
  vpnName: string; // display name + tooltip
  processName: string; // process to pgrep
  matchSubstring: string; // substring to identify the right VPN session
  connectCommand: string; // shell command to start VPN
  disconnectCommand: string; // shell command to stop VPN
  pollIntervalSeconds: number;
  iconDisconnected: string;
  iconConnected: string;
  iconBusy: string;
};

const DEFAULT_CONFIG: VpnConfig = {
  vpnName: "Uni Bremen VPN",
  processName: appConfig.vpnProcessName ?? "openconnect",
  matchSubstring: appConfig.vpnMatchSubstring ?? "vpn.uni-bremen.de",
  connectCommand: appConfig.vpnConnectCommand ?? "",
  disconnectCommand: appConfig.vpnDisconnectCommand ?? "",
  pollIntervalSeconds: 3,
  iconDisconnected: `${
    appConfig.vpnIconDir ?? `${GLib.get_home_dir()}/.config/ags/noahrch/icons`
  }/shield-x.svg`,
  iconConnected: `${
    appConfig.vpnIconDir ?? `${GLib.get_home_dir()}/.config/ags/noahrch/icons`
  }/shield-check.svg`,
  iconBusy: `${
    appConfig.vpnIconDir ?? `${GLib.get_home_dir()}/.config/ags/noahrch/icons`
  }/shield-ellipsis.svg`,
};

function makeIsVpnActive(config: VpnConfig) {
  return (): boolean => {
    try {
      const proc = Gio.Subprocess.new(
        ["/usr/bin/pgrep", "-a", config.processName],
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE
      );

      const [, stdout] = proc.communicate_utf8(null, null);
      const exit = proc.get_exit_status();

      if (exit === 1 || !stdout) return false; // 1 = no matches

      return stdout
        .trim()
        .split("\n")
        .some((line) => line.includes(config.matchSubstring));
    } catch (err) {
      console.error(`${config.vpnName} status check failed`, err);
      return false;
    }
  };
}

function makeConnectCommand(config: VpnConfig) {
  return () => {
    if (!config.connectCommand) {
      console.warn(`${config.vpnName} connectCommand not configured`);
      return;
    }
    GLib.spawn_command_line_async(config.connectCommand);
  };
}

function makeDisconnectCommand(config: VpnConfig) {
  return () => {
    if (!config.disconnectCommand) {
      console.warn(`${config.vpnName} disconnectCommand not configured`);
      return;
    }
    GLib.spawn_command_line_async(config.disconnectCommand);
  };
}

export default function VpnUni(userConfig: Partial<VpnConfig> = {}) {
  const config: VpnConfig = { ...DEFAULT_CONFIG, ...userConfig };
  const isVpnActive = makeIsVpnActive(config);
  const connectVpn = makeConnectCommand(config);
  const disconnectVpn = makeDisconnectCommand(config);

  return (
    <button
      class="vpn-uni-icon"
      valign={Gtk.Align.CENTER}
      tooltipText={config.vpnName}
      $={(self: Gtk.Button) => {
        let uiState: VpnUiState = "disconnected";
        // null = no action in progress, just mirror system
        // true = we clicked to CONNECT (want systemOn === true)
        // false = we clicked to DISCONNECT (want systemOn === false)
        let targetConnected: boolean | null = null;

        const icon = new Gtk.Image();
        self.set_child(icon);

        const setIconAndStyle = () => {
          let iconPath = config.iconDisconnected;
          let tooltip = `${config.vpnName}: disconnected`;

          if (uiState === "transitioning") {
            iconPath = config.iconBusy;
            tooltip = `${config.vpnName}: working…`;
          } else if (uiState === "connected") {
            iconPath = config.iconConnected;
            tooltip = `${config.vpnName}: connected`;
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
          const systemOn = isVpnActive();

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
        uiState = isVpnActive() ? "connected" : "disconnected";
        setIconAndStyle();

        // poll every 3 seconds
        GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          config.pollIntervalSeconds,
          () => {
            syncWithSystem();
            return GLib.SOURCE_CONTINUE;
          }
        );

        // toggle on click
        self.connect("clicked", () => {
          const systemOn = isVpnActive();

          if (systemOn) {
            // currently connected → user wants to DISCONNECT
            targetConnected = false;
            uiState = "transitioning"; // shield-ellipsis until systemOn === false
            setIconAndStyle();
            disconnectVpn();
          } else {
            // currently disconnected → user wants to CONNECT
            targetConnected = true;
            uiState = "transitioning"; // shield-ellipsis until systemOn === true
            setIconAndStyle();
            connectVpn();
          }
        });
      }}
    >
      {config.vpnName}
    </button>
  );
}
