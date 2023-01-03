import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import inspectPlugin from "vite-plugin-inspect";
// import lazyCSSModules from "vite-plugin-lazy-css-modules";
import lazyCSSModules from "../../src/index"

export default defineConfig({
  plugins: [lazyCSSModules(), solidPlugin(), inspectPlugin()],
  server: {
    port: 4040,
  },
  build: {
    target: "esnext",
  },
});
