import postcss from "postcss";
import postcssModules from "postcss-modules";

export async function transformCSS(code: string) {
  let manifest: Record<string, string> = {};
  const result = await postcss([
    // postcssModules({
    //   getJSON(fileName: string, json: Record<string, string>) {
    //     manifest = json;
    //   },
    // }),
  ]).process(code);
  return {
    manifest,
    css: result.css,
  };
}
