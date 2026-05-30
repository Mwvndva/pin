import type { AppTheme } from "./types";

export const colors = {
  black: "#050505",
  white: "#ffffff",
  accent: {
    green: "#ffcc00",
    yellow: "#ffcc00",
    orange: "#ff981f",
    pink: "#f45bb8",
    purple: "#6017e8",
    blue: "#1fc7ff",
    red: "#ff3035"
  },
  dark: {
    shell: "#050505",
    panel: "#1f1f1f",
    panel2: "#292929",
    line: "rgba(255,255,255,0.1)",
    text: "#ffffff",
    muted: "#a7a7a7"
  } satisfies AppTheme,
  light: {
    shell: "#ffffff",
    panel: "#f4f4f4",
    panel2: "#e8e8e8",
    line: "rgba(0,0,0,0.12)",
    text: "#050505",
    muted: "#5f5f5f"
  } satisfies AppTheme
};
