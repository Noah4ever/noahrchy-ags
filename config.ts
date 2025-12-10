import GLib from "gi://GLib";

export type AppConfig = {
  vpnConnectCommand?: string;
  vpnDisconnectCommand?: string;
  vpnProcessName?: string;
  vpnMatchSubstring?: string;
  vpnIconDir?: string;
};

function readEnv(path: string): Record<string, string> {
  try {
    const [ok, bytes] = GLib.file_get_contents(path);
    if (!ok || !bytes) return {};
    const text = new TextDecoder().decode(bytes);
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .reduce<Record<string, string>>((acc, line) => {
        const eq = line.indexOf("=");
        if (eq > 0) {
          const key = line.slice(0, eq).trim();
          const value = line.slice(eq + 1).trim();
          acc[key] = value;
        }
        return acc;
      }, {});
  } catch (err) {
    console.error("Failed to read .env", err);
    return {};
  }
}

const ENV_PATH = `${GLib.get_home_dir()}/.config/ags/noahrch/.env`;
const env = readEnv(ENV_PATH);

export const appConfig: AppConfig = {
  vpnConnectCommand: env.VPN_CONNECT_COMMAND,
  vpnDisconnectCommand: env.VPN_DISCONNECT_COMMAND,
  vpnProcessName: env.VPN_PROCESS_NAME,
  vpnMatchSubstring: env.VPN_MATCH_SUBSTRING,
  vpnIconDir: env.VPN_ICON_DIR,
};

export default appConfig;
