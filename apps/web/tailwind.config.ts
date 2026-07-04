import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#faf9f6",
        accent: "#b7f34d", // acid green — Pendulum's creative signature
        accentDark: "#7fb332",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
