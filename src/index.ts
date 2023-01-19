import { parse as parsePath } from "path";
import { readFile } from "fs/promises";
import type { Plugin, CSSModulesOptions, ViteDevServer } from "vite";
import fg from "fast-glob";
import { transformCSS } from "./transformers/cssTransformer";
import { transformJSX } from "./transformers/jsxTransformer";

export interface ResolvedStyleResult {
  isModule: boolean;
  filePath: string;
}

export interface PluginOptions {
  /**
   * Force all matched style files to be treated as CSS modules.
   * `false` by default.
   */
  alwaysResolveModules: boolean;
  /**
   * Should style file name match component file name.
   * For example: `Card.jsx` matches `Card.css` and `Card.module.css`.
   * `true` by default
   */
  matchComponentName: boolean;
  /**
   * List of component modules extensions.
   * `[".tsx", ".jsx"]` by default
   */
  componentExtensions: string[];
  /**
   * List of style files extensions.
   * `[".css", ".scss", ".less"]` by default
   */
  styleExtensions: string[];
  /**
   * Advanced method for matching the transformed components.
   * Accepts component file name and full path.
   *
   * This method takes precedence over `componentExtensions`.
   * `undefined` by default
   */
  shouldTransformComponent(
    fileName: string,
    filePath: string
  ): boolean | Promise<boolean>;
  /**
   * Advanced method for resolving styles for the component.
   * Accepts component file name (without extension), directory name and full path.
   *
   * This method takes precedence over `styleExtensions`, `alwaysResolveModules` and `matchComponentName`.
   * `undefined` by default
   */
  resolveStyleForComponent(
    fileName: string,
    directoryName: string,
    filePath: string
  ): ResolvedStyleResult | Promise<ResolvedStyleResult>;
}

const defaultOptions: Partial<PluginOptions> = {
  componentExtensions: [".tsx", ".jsx"],
  styleExtensions: [".css", ".scss", ".less"],
  matchComponentName: true,
};

const virtualModuleIdPrefix = "virtual:auto-css-modules";
const resolvedVirtualModuleIdPrefix = `\0${virtualModuleIdPrefix}`;

export default function autoCssModules(
  options: Partial<PluginOptions> = defaultOptions
) {
  const componentToCssMap = new Map<string, string>();
  const styleModuleIdToCssMap = new Map<string, string>();

  /**
   * Used in development mode for watching
   */
  const directoryComponentsMap = new Map<string, Set<string>>();
  const styleModuleIdToComponentIdsMap = new Map<string, Set<string>>();

  let modulesOptions: CSSModulesOptions | undefined;

  async function shouldTransformModule(id: string) {
    const path = parsePath(id);
    const fileName = path.base;
    if (typeof options.shouldTransformComponent === "function") {
      return await options.shouldTransformComponent(fileName, id);
    }

    if (!options.componentExtensions) {
      throw new Error(
        "Either 'shouldTransformComponent' or 'componentExtensions' is required"
      );
    }

    return options.componentExtensions.includes(path.ext);
  }

  function generateVirtualStyleModuleId(moduleId: string) {
    const uniqueId = Math.random().toString(16).slice(2);
    return `${virtualModuleIdPrefix}/${uniqueId}${moduleId}`;
  }

  function addMultipleModuleReference(
    map: Map<string, Set<string>>,
    key: string,
    moduleId: string
  ) {
    let dependentModules = map.get(key);
    if (!dependentModules) {
      dependentModules = new Set();
      map.set(key, dependentModules);
    }

    dependentModules.add(moduleId);
  }

  async function getStyleModules(jsxModuleId: string) {
    const path = parsePath(jsxModuleId);
    const fileName = path.name;
    const directoryName = path.dir;

    if (typeof options.resolveStyleForComponent === "function") {
      const result = await options.resolveStyleForComponent(
        fileName,
        directoryName,
        jsxModuleId
      );

      return result ? [result] : undefined;
    }

    if (!options.styleExtensions) {
      throw new Error(
        "One of 'resolveStyleForComponent' or 'styleExtensions' is required"
      );
    }

    /**
     * If `matchComponentName` is enabled then the result glob
     * would look like this: `component*.{css|scss|less}`.
     * Otherwise: `.{css|scss|less}` (matches any style file)
     */
    const globPrefix = options.matchComponentName ? fileName : "";
    const glob = `${globPrefix}*.{${options.styleExtensions
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

    return result.map((filePath) => {
      const styleModulePath = parsePath(filePath);
      const isModule = styleModulePath.name.endsWith(".module");
      return {
        filePath,
        isModule,
      };
    });
  }

  return {
    enforce: "pre",
    name: "auto-css-modules",

    configResolved(config) {
      if (config.css?.modules && typeof config.css.modules === "object") {
        modulesOptions = config.css.modules;
      }
    },

    configureServer(server) {
      const reloadModuleById = (id: string) => {
        const module = server?.moduleGraph.getModuleById(id);
        if (module) {
          server?.reloadModule(module);
        }
      };

      server.watcher.on("add", (fileId) => {
        const path = parsePath(fileId);
        const dir = path.dir;
        const dependentModules = directoryComponentsMap.get(dir);
        /**
         * TODO: check if fileId is a style module
         */
        dependentModules?.forEach(reloadModuleById);
      });

      server.watcher.on("unlink", (fileId) => {
        if (styleModuleIdToComponentIdsMap.has(fileId)) {
          const dependentModules = styleModuleIdToComponentIdsMap.get(fileId);
          dependentModules?.forEach(reloadModuleById);
          styleModuleIdToComponentIdsMap.delete(fileId);
        }
      });

      server.watcher.on("unlinkDir", (dir) => {
        if (directoryComponentsMap.has(dir)) {
          /**
           * TODO: check whether need to clean other maps
           */
          directoryComponentsMap.delete(dir);
        }
      });

      server.watcher.on("change", (fileId) => {
        if (!styleModuleIdToComponentIdsMap.has(fileId)) {
          return;
        }

        const dependentModules = styleModuleIdToComponentIdsMap.get(fileId);
        dependentModules?.forEach(reloadModuleById);
      });
    },

    resolveId(id) {
      if (!id.startsWith(virtualModuleIdPrefix)) {
        return undefined;
      }
      return "\0" + id;
    },

    load(id) {
      if (!id.startsWith(resolvedVirtualModuleIdPrefix)) {
        return undefined;
      }

      const pathSegments = id.split("/");
      pathSegments.shift();
      pathSegments.shift();
      const referencedModuleId = "/" + pathSegments.join("/");

      if (!styleModuleIdToCssMap.has(referencedModuleId)) {
        throw new Error(`Failed to resolve CSS module ${referencedModuleId}`);
      }

      return styleModuleIdToCssMap.get(referencedModuleId);
    },

    async transform(code, id) {
      if (!(await shouldTransformModule(id))) {
        return null;
      }

      const styleModules = await getStyleModules(id);
      if (!styleModules) {
        return null;
      }

      /**
       * TODO: consider multiple style modules support
       */
      if (styleModules.length > 1) {
        this.warn(
          `Found multiple style module matches for ${id}. Using the first match: ${styleModules[0].filePath}`
        );
      }

      const [styleModule] = styleModules;
      const { filePath: styleModuleId, isModule } = styleModule;

      const styleModuleCode = (await readFile(styleModuleId)).toString();
      let css: string;
      let manifest: Record<string, string> = {};

      if (isModule) {
        const result = await transformCSS(styleModuleCode, modulesOptions);
        css = result.css;
        manifest = result.manifest;
      } else {
        css = styleModuleCode;
      }

      const normalizedStyleModuleId = styleModuleId.replace(".module", "");
      const styleVirtualModuleId = generateVirtualStyleModuleId(
        normalizedStyleModuleId
      );

      const parsedModuleId = parsePath(id);
      const componentDirectory = parsedModuleId.dir;

      componentToCssMap.set(id, css);
      styleModuleIdToCssMap.set(normalizedStyleModuleId, css);

      addMultipleModuleReference(
        styleModuleIdToComponentIdsMap,
        styleModuleId,
        id
      );
      addMultipleModuleReference(
        directoryComponentsMap,
        componentDirectory,
        id
      );

      return transformJSX({
        moduleId: id,
        styleModuleId: styleVirtualModuleId,
        originalCode: code,
        manifest,
      });
    },
  } as Plugin;
}
