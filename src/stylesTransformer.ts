import type { CSSModulesOptions } from "vite";
import postcss from "postcss";
import postcssModules from "postcss-modules";

export async function transformStyles(
  code: string,
  options: CSSModulesOptions = {}
) {
  let manifest: Record<string, string> = {};
  const result = await postcss([
    postcssModules({
      ...options,
      getJSON(
        fileName: string,
        json: Record<string, string>,
        outputFileName: string
      ) {
        manifest = json;
        if (options.getJSON && typeof options.getJSON === "function") {
          options.getJSON(fileName, json, outputFileName);
        }
      },
    }),
  ]).process(code);
  return {
    manifest,
    css: result.css,
  };
}
