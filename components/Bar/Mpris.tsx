import { Gtk } from "ags/gtk4";
import AstalMpris from "gi://AstalMpris";
import AstalApps from "gi://AstalApps";
import { For, createBinding, createState, createEffect } from "ags";
import { createPoll } from "ags/time";

export default function Mpris() {
  const mpris = AstalMpris.get_default();
  const apps = new AstalApps.Apps();

  // track players except the helper daemon
  const players = createBinding(mpris, "players").as((list) =>
    list.filter((p) => p.bus_name !== "org.mpris.MediaPlayer2.playerctld")
  );

  const [currentPlayer, setCurrentPlayer] =
    createState<AstalMpris.Player | null>(null);
  const currentPlayerList = currentPlayer.as((player) =>
    player ? [player] : []
  );

  Gtk.init(); // needed for Gtk.EventControllerScroll / Motion

  const currentSelector = createPoll<AstalMpris.Player | null>(
    null,
    1000,
    () => {
      const list = players.peek();
      if (!list.length) {
        return null;
      }

      const playing = list.find(
        (p) => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
      );

      return playing ?? list[0] ?? null;
    }
  );

  createEffect(() => {
    setCurrentPlayer(currentSelector());
  });

  return (
    <menubutton
      $={(self: Gtk.MenuButton) => {
        const motion = new Gtk.EventControllerMotion();
        motion.connect("enter", (_ctrl, _x, _y) => {
          const current = currentPlayer.peek();
          if (!current) return;
        });
        motion.connect("leave", (_ctrl) => {});
        self.add_controller(motion);

        const scroll = new Gtk.EventControllerScroll();
        scroll.set_flags(Gtk.EventControllerScrollFlags.VERTICAL);
        scroll.connect("scroll", (_ctrl, _dx, dy) => {
          const current = currentPlayer.peek();
          if (!current) return;

          if (dy < 0) {
            current.next();
          } else if (dy > 0) {
            current.previous();
          }
        });
        self.add_controller(scroll);
      }}
    >
      {/* trigger: icon of CURRENT player only */}
      <box valign={Gtk.Align.CENTER}>
        <For each={currentPlayerList}>
          {(player) => {
            const [app] = apps.exact_query(player.entry);
            const iconTitle = app?.name ?? player.identity ?? "Player";
            return (
              <image
                visible={!!app?.iconName}
                iconName={app?.iconName}
                tooltipText="Scroll: next / previous"
              />
            );
          }}
        </For>
      </box>

      {/* popup */}
      <popover>
        <box
          spacing={8}
          marginTop={6}
          marginBottom={6}
          marginStart={8}
          marginEnd={8}
          orientation={Gtk.Orientation.VERTICAL}
        >
          <For each={currentPlayerList}>
            {(player) => {
              const [app] = apps.exact_query(player.entry);
              const playerTitle = app?.name ?? player.identity ?? "Player";

              return (
                <box spacing={8} widthRequest={260}>
                  {/* cover art */}
                  <box overflow={Gtk.Overflow.HIDDEN} css="border-radius: 8px;">
                    <image
                      pixelSize={64}
                      file={createBinding(player, "coverArt")}
                      tooltipText={playerTitle}
                    />
                  </box>

                  {/* main info + controls */}
                  <box
                    valign={Gtk.Align.CENTER}
                    orientation={Gtk.Orientation.VERTICAL}
                    hexpand
                  >
                    <label
                      xalign={0}
                      wrap={true}
                      maxWidthChars={24}
                      ellipsize={3}
                      label={createBinding(player, "title")}
                    />
                    <label
                      xalign={0}
                      opacity={0.7}
                      maxWidthChars={24}
                      ellipsize={3}
                      label={createBinding(player, "artist")}
                    />

                    {/* fake timebar for now */}
                    <box marginTop={4} marginBottom={4}>
                      <label xalign={0} opacity={0.6} label="0:42   —   3:20" />
                    </box>

                    {/* transport controls */}
                    <box
                      hexpand
                      halign={Gtk.Align.END}
                      spacing={4}
                      marginTop={2}
                    >
                      <button
                        onClicked={() => player.previous()}
                        visible={createBinding(player, "canGoPrevious")}
                        tooltipText="Previous"
                      >
                        <image
                          iconName="media-seek-backward-symbolic"
                          tooltipText="Previous"
                        />
                      </button>

                      <button
                        onClicked={() => player.play_pause()}
                        visible={createBinding(player, "canControl")}
                        tooltipText="Play/Pause"
                      >
                        <box>
                          <image
                            iconName="media-playback-start-symbolic"
                            visible={createBinding(
                              player,
                              "playbackStatus"
                            )((s) => s !== AstalMpris.PlaybackStatus.PLAYING)}
                            tooltipText="Play"
                          />
                          <image
                            iconName="media-playback-pause-symbolic"
                            visible={createBinding(
                              player,
                              "playbackStatus"
                            )((s) => s === AstalMpris.PlaybackStatus.PLAYING)}
                            tooltipText="Pause"
                          />
                        </box>
                      </button>

                      <button
                        onClicked={() => player.next()}
                        visible={createBinding(player, "canGoNext")}
                        tooltipText="Next"
                      >
                        <image
                          iconName="media-seek-forward-symbolic"
                          tooltipText="Next"
                        />
                      </button>
                    </box>
                  </box>
                </box>
              );
            }}
          </For>
        </box>
      </popover>
    </menubutton>
  );
}
