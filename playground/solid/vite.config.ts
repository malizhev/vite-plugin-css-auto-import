import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import inspectPlugin from "vite-plugin-inspect";
import cssAutoImport from "vite-plugin-css-auto-import";

export default defineConfig({
  plugins: [cssAutoImport(), solidPlugin(), inspectPlugin()],
  server: {
    port: 4040,
  },
  build: {
    target: "esnext",
  },
});
