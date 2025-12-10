import { createBinding, For, This } from "ags";
import app from "ags/gtk4/app";
import style from "./style.scss";
import Bar from "./components/Bar";
import { appConfig } from "./config";

app.start({
  css: style,
  // It's usually best to go with the default Adwaita theme
  // and built off of it, instead of allowing the system theme
  // to potentially mess something up when it is changed.
  // Note: `* { all:unset }` in css is not recommended.
  gtkTheme: "Adwaita",
  main() {
    // Load config early so other modules can read from globalThis if needed.
    (globalThis as any).APP_CONFIG = appConfig;
    const monitors = createBinding(app, "monitors");

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
          </This>
        )}
      </For>
    );
  },
});
