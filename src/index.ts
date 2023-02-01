import { parse as parsePath } from "path";
import { readFile } from "fs/promises";
import type { Plugin, CSSModulesOptions } from "vite";
import { transformStyles } from "./stylesTransformer";
import { transformJSX } from "./jsxTransformer";
import { PluginOptions } from "./types";
import { getAllFilesInDirectory, resolveStylesFromDirectory } from "./helpers";

const defaultOptions: Partial<PluginOptions> = {
  componentExtensions: [".tsx", ".jsx"],
  styleExtensions: [".css", ".scss", ".less"],
  matchComponentName: true,
};

const virtualModuleIdPrefix = "virtual:css-auto-import";
const resolvedVirtualModuleIdPrefix = `\0${virtualModuleIdPrefix}`;

export default function cssAutoImport(
  userOptions: Partial<PluginOptions> = {}
) {
  const options = {
    ...defaultOptions,
    ...userOptions,
  };
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

    /**
     * TODO: add pragma to disable transform inside component file 
     */
    return options.componentExtensions.includes(path.ext);
  }

  function generateVirtualStyleModuleId(moduleId: string) {
    const uniqueId = Math.random().toString(16).slice(2);
    return `${virtualModuleIdPrefix}/${uniqueId}${moduleId}`;
  }

  function addReferenceRecord(
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

  return {
    enforce: "pre",
    name: "css-auto-import",

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

      const parsedModuleId = parsePath(id);
      const componentDirectory = parsedModuleId.dir;
      const directory = await getAllFilesInDirectory(componentDirectory);
      const styleModules = await resolveStylesFromDirectory({
        componentFilePath: id,
        directory,
        options,
      });

      if (!styleModules || !styleModules.length) {
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
        const result = await transformStyles(styleModuleCode, modulesOptions);
        css = result.css;
        manifest = result.manifest;
      } else {
        /**
         * No need to transform non-module styles. Just use original CSS as is.
         */
        css = styleModuleCode;
      }

      const normalizedStyleModuleId = styleModuleId.replace(".module", "");
      const styleVirtualModuleId = generateVirtualStyleModuleId(
        normalizedStyleModuleId
      );

      componentToCssMap.set(id, css);
      styleModuleIdToCssMap.set(normalizedStyleModuleId, css);

      addReferenceRecord(styleModuleIdToComponentIdsMap, styleModuleId, id);
      addReferenceRecord(directoryComponentsMap, componentDirectory, id);

      return transformJSX({
        moduleId: id,
        styleModuleId: styleVirtualModuleId,
        originalCode: code,
        manifest,
      });
    },
  } as Plugin;
}
