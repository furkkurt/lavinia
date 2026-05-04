import type { Config } from "tailwindcss";

export default {
  prefix: "tw-",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        lavinia: {
          sage: "#8c907e",
          ink: "#111111",
          paper: "#f5f3ef",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
