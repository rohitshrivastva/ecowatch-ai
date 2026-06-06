/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          bg: "#ffffff",
          surface: "#f8fafc",
          "surface-hover": "#f1f5f9",
          border: "#e2e8f0",
          primary: "#059669",
          secondary: "#0891b2",
          accent: "#7c3aed",
          warning: "#d97706",
          danger: "#dc2626",
          text: "#0f172a",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        page: "1680px",
      },
    },
  },
  plugins: [],
};
