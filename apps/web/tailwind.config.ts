import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#F7F8FA", // porcelain — cool near-white content background
        accent: "#4633E8", // Pendulum brand indigo-violet
        accentDark: "#3524B8",
      },
      fontFamily: {
        display: ["Nunito", "Nunito Sans", "sans-serif"], // wordmark & headings (matches wireframes)
        sans: ["Nunito Sans", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
