import type { Config } from "tailwindcss";

/**
 * Tailwind — mappe les design tokens (§3 du cahier des charges) sur des
 * classes utilitaires. Les couleurs pointent vers des variables CSS définies
 * dans globals.css pour rester modifiables au runtime.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        brand: {
          DEFAULT: "var(--brand)",
          dark: "var(--brand-dark)",
        },
        deal: {
          DEFAULT: "var(--deal)",
          soft: "var(--deal-soft)",
        },
        star: "var(--star)",
        stock: "var(--stock)",
      },
      fontFamily: {
        // Inter partout (§3) — injecté via next/font dans le layout racine
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        price: "800",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        "card-hover": "0 4px 12px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
