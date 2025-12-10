# noahrchy-ags

Custom [Aylur’s Great Shell (AGS)](https://github.com/Aylur/ags) setup for Hyprland with widgets for bar, workspaces, audio, network, VPN, etc.

## Features

- Bar with clickable Hyprland workspaces (fast, event-driven, falls back to polling)
- Audio volume/status with pamixer
- Network indicator that flips Wi‑Fi / Wi‑Fi-off on connect/disconnect
- Bluetooth launcher
- System monitor launcher (btop)
- Uni VPN widget (configurable; no secrets in repo)
- Date/time, MPRIS media controls, and more

## Prerequisites

- Linux (Wayland) with Hyprland
- AGS (GTK4 build)
- Common tools: `git`, `node`, `npm` (or `pnpm`), `awk`, `tr`
- Hyprland CLI: `hyprctl`
- Audio: `pamixer`
- System monitor: `btop`
- Network (Wi‑Fi menu): `omarchy-launch-wifi` (from omarchy)
- Audio menu: `omarchy-launch-audio` (from omarchy)
- Bluetooth menu: `omarchy-launch-bluetooth` (from omarchy)
- Optional VPN: `openconnect`, `sudo`, and your VPN creds

## Installation

1. Clone into AGS config:

```bash
git clone https://github.com/your-user/noahrchy-ags.git ~/.config/ags/noahrch
cd ~/.config/ags/noahrch
```

2. Install JS deps (if you hack on the code):

```bash
npm install
# or: pnpm install
```

3. Make scripts executable:

```bash
chmod +x scripts/uni-vpn-connect scripts/uni-vpn-disconnect scripts/wifi-status
```

4. Icons (ensure these exist or point to your own):

```
~/.config/ags/noahrch/icons/
  wifi.svg
  wifi-off.svg
  shield-x.svg
  shield-check.svg
  shield-ellipsis.svg
  … (other bar icons you use)
```

## Configuration

Create a local `.env` to keep secrets out of git:

```
# filepath: ~/.config/ags/noahrch/.env
VPN_CONNECT_COMMAND=ghostty -e bash -lc './scripts/uni-vpn-connect your_user /path/to/your.pw'
VPN_DISCONNECT_COMMAND=ghostty -e bash -lc './scripts/uni-vpn-disconnect'
VPN_PROCESS_NAME=openconnect
VPN_MATCH_SUBSTRING=vpn.uni-bremen.de
VPN_ICON_DIR=/home/youruser/.config/ags/noahrch/icons
```

Adjust commands/paths to your environment. The app loads this at startup and exposes it as `globalThis.APP_CONFIG`.

## Running

From the config directory:

```bash
ags run .
```

or with the AGS binary on your PATH:

```bash
ags -c ~/.config/ags/noahrch
```

## Hyprland notes

- Workspace widget listens to Hyprland’s event socket; if unavailable, it falls back to lightweight polling.
- `hyprctl` must be available in `$PATH`.

## Customization

- Bar components live in `components/Bar/` (Workspaces, Audio, Network, VpnUni, etc.).
- Styling: edit `style.scss`.
- VPN widget: pass your own `VpnUni({ ... })` props or adjust `.env` commands/icons.

## Troubleshooting

- Missing icons: ensure files exist under `icons/` or update paths in config.
- Hyprland socket errors: make sure Hyprland is running and `HYPRLAND_INSTANCE_SIGNATURE` is set; the widget will poll if not.
- Uint8Array / toString warnings: ensure you’re on the latest commit (spawn outputs now use `TextDecoder`).

## License

MIT (adjust if you prefer otherwise).
