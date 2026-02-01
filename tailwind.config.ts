import type { Config } from "tailwindcss";

const config: Config = {
  // 🛡️ Content paths ensure Tailwind scans all your components for classes
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          blue: "#2563eb", // Primary Brand Blue
          dark: "#0F172A", // Deep Navy (Matches layout themeColor)
          border: "#E2E8F0", // Clean Slate Border
          surface: "#F8FAFC", // Light background for cards
        }
      },
      // 📐 Sharp corners for that world-class SaaS aesthetic
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};
export default config;