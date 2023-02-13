import type { CSSModulesOptions } from "vite";
import postcss from "postcss";
import postcssModules from "postcss-modules";

export async function transformStyles(
  from: string,
  code: string,
  options: CSSModulesOptions = {}
) {
  let manifest: Record<string, string> = {};
  const extensions = getSyntaxExtensions(from);
  const plugins = [];
  if (extensions?.plugin) {
    plugins.push(extensions.plugin);
  }

  const result = await postcss([
    ...plugins,
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
  ]).process(code, {
    from,
    syntax: extensions?.syntax,
  });
  return {
    manifest,
    css: result.css,
  };
}

function getSyntaxExtensions(fileUrl: string) {
  if (fileUrl.endsWith(".scss") || fileUrl.endsWith(".sass")) {
    return {
      plugin: require("@csstools/postcss-sass"),
      syntax: require("postcss-scss"),
    };
  }

  if (fileUrl.endsWith(".less")) {
    return {
      plugin: undefined,
      syntax: require("postcss-less"),
    };
  }

  return null;
}
