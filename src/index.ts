import { parse as parsePath } from "path";
import { readFile } from "fs/promises";
import type { Plugin } from "vite";
import fg from "fast-glob";
import { transformCSS } from "./transformers/cssTransformer";
import { transformJSX } from "./transformers/jsxTransformer";

// interface BasePluginOptions {}

// interface PluginJsxOptionsImplicit extends BasePluginOptions {
//   jsxExtensions: string[];
//   resolveJsx(fileName: string): never;
// }

// interface PluginJsxOptionsExplicit extends BasePluginOptions {
//   jsxExtensions: never;
//   resolveJsx(fileName: string): boolean;
// }

// interface PluginStyleOptionsImplicit extends BasePluginOptions {
//   styleExtensions: string[];
//   resolveStyle(fileName: string): never;
// }

// interface PluginStyleOptionsExplicit extends BasePluginOptions {
//   styleExtensions: never;
//   resolveStyle(fileName: string): boolean;
// }

// export type PluginOptions =
//   | PluginStyleOptionsImplicit
//   | PluginStyleOptionsExplicit
//   | PluginJsxOptionsImplicit
//   | PluginJsxOptionsExplicit;

export interface PluginOptions {
  transformExtensions: string[];
  styleExtensions: string[];
  styleModuleFileName: string;
  matchModuleName: boolean;
  allowModuleSuffix: boolean;
  shouldTransformModule(fileName: string): boolean | Promise<boolean>;
  resolveStyleModule(
    fileName: string,
    directoryName: string,
    filePath: string
  ): string | Promise<string>;
}

const defaultOptions: Partial<PluginOptions> = {
  transformExtensions: [".tsx", ".jsx"],
  styleExtensions: [".css", ".scss", ".less"],
  matchModuleName: true,
};

const virtualModuleIdPrefix = "virtual:auto-css-modules";
const resolvedVirtualModuleIdPrefix = `\0${virtualModuleIdPrefix}`;

export default function lazyCssModules(
  options: Partial<PluginOptions> = defaultOptions
) {
  const modulesMap = new Map<string, string>();
  const cssModulesMap = new Map<string, string>();

  async function shouldTransformModule(id: string) {
    if (typeof options.shouldTransformModule === "function") {
      return await options.shouldTransformModule(id);
    }

    if (!options.transformExtensions) {
      throw new Error(
        "Either 'shouldTransformModule' or 'transformExtensions' is required"
      );
    }

    const path = parsePath(id);
    return options.transformExtensions.includes(path.ext);
  }

  function generateVirtualStyleModuleId(moduleId: string) {
    const uniqueId = Math.random().toString(16).slice(2);
    return `${virtualModuleIdPrefix}/${uniqueId}${moduleId}`;
  }

  async function getStyleModuleIds(jsxModuleId: string) {
    const path = parsePath(jsxModuleId);
    const fileName = path.name;
    const directoryName = path.dir;
    if (typeof options.resolveStyleModule === "function") {
      return options.resolveStyleModule(fileName, directoryName, jsxModuleId);
    }

    if (options.styleModuleFileName) {
      const result = await fg(options.styleModuleFileName, {
        absolute: true,
        cwd: directoryName,
        deep: 0,
      });
      if (result.length === 0) {
        return undefined;
      }

      return result;
    }

    if (!options.styleExtensions) {
      throw new Error(
        "One of 'resolveStyleModule', 'styleModuleFileName' or 'styleExtensions' is required"
      );
    }

    if (options.matchModuleName) {
      const glob = `${fileName}*.{${options.styleExtensions
        .map((ext) => ext.substring(1))
        .join(",")}}`;

      const result = await fg(glob, {
        absolute: true,
        cwd: directoryName,
        deep: 0,
      });
      if (result.length === 0) {
        return undefined;
      }

      return result;
    }
  }

  return {
    enforce: "pre",
    name: "lazy-css-modules",
    resolveId(id) {
      if (!id.startsWith(virtualModuleIdPrefix)) {
        return undefined;
      }
      return "\0" + id;
    },
    load(id, options) {
      if (!id.startsWith(resolvedVirtualModuleIdPrefix)) {
        return undefined;
      }

      const pathSegments = id.split("/");
      pathSegments.shift();
      pathSegments.shift();
      const referencedModuleId = "/" + pathSegments.join("/");

      if (!cssModulesMap.has(referencedModuleId)) {
        throw new Error(`Failed to resolve CSS module ${referencedModuleId}`);
      }

      return cssModulesMap.get(referencedModuleId);
    },
    async transform(code, id, transformOptions) {
      if (!(await shouldTransformModule(id))) {
        return null;
      }

      const styleModuleIds = await getStyleModuleIds(id);
      if (!styleModuleIds) {
        return null;
      }

      /**
       * TODO: implement multiple style modules support
       */
      if (styleModuleIds.length > 1) {
        throw new Error(`Found multiple style module matches for ${id}`);
      }

      const [styleModuleId] = styleModuleIds;
      const styleModuleCode = (await readFile(styleModuleId)).toString();
      const { css, manifest } = await transformCSS(styleModuleCode);

      const normalizedStyleModuleId = styleModuleId.replace(".module", "");
      const styleVirtualModuleId = generateVirtualStyleModuleId(
        normalizedStyleModuleId
      );

      modulesMap.set(id, css);
      cssModulesMap.set(normalizedStyleModuleId, css);

      return transformJSX({
        moduleId: id,
        styleModuleId: styleVirtualModuleId,
        originalCode: code,
        manifest,
      });
    },
  } as Plugin;
}
