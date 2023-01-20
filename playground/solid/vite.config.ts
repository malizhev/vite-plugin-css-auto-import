import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import inspectPlugin from "vite-plugin-inspect";
import autoCSSModules from "vite-plugin-auto-css-modules";

export default defineConfig({
  plugins: [autoCSSModules(), solidPlugin(), inspectPlugin()],
  server: {
    port: 4040,
  },
  build: {
    target: "esnext",
  },
});
