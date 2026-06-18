/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Inter Variable",
          "Inter",
          "Proxima Nova",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
        },
        playground: {
          sidebar: "rgb(var(--playground-sidebar) / <alpha-value>)",
          main: "rgb(var(--playground-main) / <alpha-value>)",
          border: "rgb(var(--playground-border) / <alpha-value>)",
          send: "rgb(var(--playground-send) / <alpha-value>)",
          ink: "rgb(var(--playground-ink) / <alpha-value>)",
          muted: "rgb(var(--playground-muted) / 0.64)",
        },
      },
      maxWidth: {
        playground: "909px",
      },
    },
  },
  plugins: [],
};
