import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        sage: "#899481",
        stone: "#CDBCAB",
        ivory: "#EFE9E1",
        charcoal: "#1F2933",
      },
    },
  },
  plugins: [],
};

export default config;
