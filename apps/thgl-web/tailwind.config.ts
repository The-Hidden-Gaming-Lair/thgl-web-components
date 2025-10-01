import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [sharedConfig],
  theme: {
    extend: {
      colors: {
        discord: "#6974f3",
        brand: "rgb(var(--brand-rgb))",
        dark: "rgb(var(--dark-rgb))",
        bgFrom: "rgb(var(--bg-from-rgb))",
        bgTo: "rgb(var(--bg-to-rgb))",
      },
      keyframes: {
        fadeOutFromTop: {
          "0%": {
            opacity: "1",
            transform: "translateY(var(--tw-translate-y))",
          },
          "100%": { opacity: "0", transform: "translateY(125%)" },
        },
        fadeInToTop: {
          "0%": { opacity: "0", transform: "translateY(-125%)" },
          "100%": {
            opacity: "1",
            transform: "translateY(var(--tw-translate-y))",
          },
        },
        fadeOutFromBottom: {
          "0%": {
            opacity: "1",
            transform: "translateY(var(--tw-translate-y))",
          },
          "100%": { opacity: "0", transform: "translateY(-125%)" },
        },
        fadeInToBottom: {
          "0%": { opacity: "0", transform: "translateY(125%)" },
          "100%": {
            opacity: "1",
            transform: "translateY(var(--tw-translate-y))",
          },
        },
      },
      animation: {
        "fade-out-from-top": "fadeOutFromTop 1s ease-in-out",
        "fade-in-to-top": "fadeInToTop 1s ease-in-out",
        "fade-out-from-bottom": "fadeOutFromBottom 1s ease-in-out",
        "fade-in-to-bottom": "fadeInToBottom 1s ease-in-out",
      },
    },
  },
};
export default config;
