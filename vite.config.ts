/// <reference types="vitest" />

import { fileURLToPath } from "node:url";

import semiTheme from "@jacob-z/vite-plugin-semi-theme-loader";
import react from "@vitejs/plugin-react";
import iconsPlugin from "unplugin-icons/vite";
import { defineConfig } from "vite";
import webFontPlugin from "vite-plugin-webfont-dl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["@locator/babel-jsx/dist", { env: "development" }],
          "preval",
        ],
      },
    }),
    semiTheme({
      theme: "@semi-bot/semi-theme-universedesign",
    }),
    iconsPlugin({
      compiler: "jsx",
      jsx: "react",
      defaultClass: "inline-block",
      scale: 1.0,
    }),
    webFontPlugin([
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800",
    ]),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    modules: {
      scopeBehaviour: "local",
      localsConvention: "camelCase",
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 7890,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
