# ⚡ vite-plugin-css-auto-import [![NPM version](https://img.shields.io/npm/v/vite-plugin-css-auto-import?style=flat-square)](https://www.npmjs.com/package/vite-plugin-css-auto-import)

<!-- # ⚡ vite-plugin-css-auto-import [![NPM version](https://badgen.net/npm/v/vite-plugin-css-auto-import)](https://www.npmjs.com/package/vite-plugin-css-auto-import) -->

The plugin is designed specifically for folks who are tired of this:

```
import styles from "./styles.module.css";
```

<details>
  <summary><i><sub><sup>and this...</sup></sub></i></summary>
  <br>

```
<div className={`${styles.foo} ${styles.bar}`} />
```

and this:

```
<div className={[styles.foo, styles.bar].join(" ")} />
```

like this:

```
<div className={styles.foo + ' ' + styles.bar} />

```

or this:

```
import classes from "another-package";
import styles from "./styles.module.css";
...
<div className={classes(styles.foo, styles.bar)} />
```

</details>
<br>

Writing components should be easy. Just put your CSS file next to a component, and this plugin will do the rest:

- automatically import styles to JSX/TSX components
- transform scoped class names for CSS Modules (e.g. `className="link"` becomes `className="_link_1nhoj_19"`)

## Features

- First-class CSS modules support.
- Allows switching between local-scoping/global styles without changing the components code.
- Supports JSX and TSX components. Tested with React and Solid.

## Installation

Install `vite-plugin-css-auto-import` as dev dependency.

```

# with npm

npm install -D vite-plugin-css-auto-import

# with pnpm

pnpm add -D vite-plugin-css-auto-import

# with yarn

yard add -D vite-plugin-css-auto-import

```

Next, add it to the `plugins` section of your Vite config.

```typescript
// vite.config.js or vite.config.ts
import { defineConfig } from "vite";
import cssAutoImport from "vite-plugin-css-auto-import";

export default defineConfig({
  plugins: [cssAutoImport()],
});
```

Check the setup examples in `playground` folder.

## How it works

By default, the plugin will look for any style file in the same directory that matches the component file name.
For example, for `Component.jsx` it would match `Component.css`, `Component.scss`, etc.

The plugin will import the styles automatically. If the imported file is a CSS module, the plugin automatically replaces class names with the scoped class name.
So, instead of writing `className={styles.foo}` you can simply write `className="foo"` as like dealing with regular styles.

You can change the default style matching behavior. Check the [API section](#api) for configuration options.

> If more than one style file matches the component, the first match will be used. You will see a warning in this case.

### CSS modules

Auto import comes in handy when dealing with CSS modules.
When the matched styles file is a CSS module, the plugin will also transform your component to map the source class name to a generated local-scoped class name.

<!-- When matched style file is a module (its name ends with `.module` or when resolved using [`resolveStyleForComponent`](#resolvestyleforcomponent) method). -->

To use CSS modules, you can:

- add `.module` at the end of your style file name ([following Vite's convention](https://vitejs.dev/guide/features.html#css-modules))
- mark **all auto-imported styles** as modules by setting [`resolveAllStylesAsModules`](#resolveallstylesasmodules) option to `true`.
- implement your own resolution logic using [`resolveStyleForComponent`](#resolvestyleforcomponent) method.

<!-- You can continue writing -->

<!-- For example: -->

For example, with this CSS file:

```css
.foo {
  ...
}
.bar {
  ...
}
.baz {
  ...
}
```

Your component would be transformed like this:

```html
<!-- source code -->
<div className="foo"></div>
<!-- after vite-plugin-css-auto-import -->
<div className="_link_1nhoj_19"></div>
```

You can easily add multiple class names:

```html
<!-- source code -->
<div className="foo bar text-xl"></div>
<!-- after vite-plugin-css-auto-import -->
<div className="_foo_fc5kr_29 _bar_fc5kr_33 text-xl"></div>
```

> Notice how the `text-xl` class name keeps unchanged after the transformation. If the class name doesn't exist in the imported CSS module, the plugin considers it a global class. Thus, you can apply global or utility classes this way.

Solid.js `classList` is also supported:

```html
<!-- source code -->
<a classList={{
  foo: true,
  bar: true,
}}></a>

<!-- after vite-plugin-css-auto-import -->
<a classList={{
  "_foo_fc5kr_29": true,
  "_bar_fc5kr_33": true,
}}></a>
```

Also, you can use the class name helper libraries. This plugin will try its best to transform the provided arguments:

```html
<!-- source code -->
<a className={clsx({
  foo: true,
  bar: true,
}, ["baz"])}></a>

<!-- after vite-plugin-css-auto-import -->
<a className={clsx({
  "_foo_fc5kr_29": true,
  "_bar_fc5kr_33": true,
}, ["_baz_fc5kr_37"])}></a>
```

Under the hood, the plugin uses [`postcss-modules`](https://github.com/madyankin/postcss-modules) to parse and extract class names from style files.

> Note: this plugin **does not** compile nor transform your styles. The responsibility of this plugin is only to **import styles** and **transform JSX** to map scoped class names to the original class names in your code. Transformation is done by Vite.

You can configure CSS modules transform by setting [`css.modules`](https://vitejs.dev/config/shared-options.html#css-modules) options in your `vite.config` file.

### Typescript

`vite-plugin-css-auto-import` is built with TypeScript. So it supports both JSX and TSX component syntax out of the box.

<!-- and this

```

<div className={`${styles.foo} ${styles.bar}`} />
```

or even worse

```
import styles from "./styles.module.css";
...
<div className={[styles.foo, styles.bar].join(" ")} />
```

or how about:

````
import styles from "./styles.module.css";
...
<div className={`${styles.foo} ${styles.bar}`} />
``` -->

<!-- - `<div className={[styles.foo, styles.bar].join()} />`
- `` <div className={`${styles.foo} ${styles.bar}`} /> ``
- `<div className={classes(styles.foo, styles.bar)} /> // + install` -->

<!-- Just put your CSS file next to a component. Write React/Preact/Solid components as if you've imported styles and the plugin will do the rest.
This plugin also supports CSS modules, so there's no more `<div className={styles.container} />` but just `<div className="container">`

## Features

- Works with JSX and TSX (tested with React and Solid)
- CSS modules support -->

## API

Default options:

```typescript
{
  componentExtensions: [".tsx", ".jsx"],
  styleExtensions: [".css", ".scss", ".less"],
  matchComponentName: true,
}
```

These options will be merged with the options provided.

### Options

##### `componentExtensions`

- type: `string[]`
- default: `[".tsx", ".jsx"]`

List of component extensions that will be transformed by the plugin.

##### `styleGlob`

- type: `string`
- default: `false`

Glob to match styles in the current component directory.

##### `styleExtensions`

- type: `string[]`
- default: `[".css", ".scss", ".less"]`

List of style file extensions.

##### `resolveAllStylesAsModules`

- type: `boolean`
- default: `false`

Force all matched style files to be treated as CSS modules.

##### `matchComponentName`

- type: `boolean`
- default: `true`

This controls whether the style file name should match the component file name.
For example, `Card.jsx` would only match `Card.css` and `Card.module.css`.

##### `shouldTransformComponent`

- type: `(fileName: string, filePath: string) => boolean | Promise<boolean>`
- default: `undefined`

Advanced method for matching the transformed components. Accepts component file name and full path.
This method takes precedence over `componentExtensions`.

##### `resolveStyleForComponent`

- type: `(componentName: string, directoryName: string, filePath: string) => ResolvedStyleResult | Promise<ResolvedStyleResult>`
- default: `undefined`

Advanced method for resolving styles for the component. Accepts component file name (without extension), directory name, and full path.
This method takes precedence over `styleGlob`, `styleExtensions`, `resolveAllStylesAsModules`, and `matchComponentName`.

Result should be of the following type:

```typescript
interface ResolvedStyleResult {
  // controls the way styles are imported.
  isModule: boolean;
  // full path to the style module
  filePath: string;
}
```

### Roadmap

- [ ] Add the option to omit the class name if it's not defined in the original style file.
- [ ] Add support to enable/disable auto-import within component and style files.
- [ ] Add an option to include/exclude specific directories to resolve CSS imports.
- [ ] Improve LESS support.
- [ ] VS Code extension to provide the auto-completion list.

<!-- ### Usage examples

1. Default setup.

```typescript
cssAutoImport();
// is equivalent to:
cssAutoImport({
  componentExtensions: [".tsx", ".jsx"],
  styleExtensions: [".css", ".scss", ".less"],
  matchComponentName: true,
});
```

This would match:

```
/ComponentFolder
  /Component.jsx
  /Component.module.scss <-- this file will be imported as module automatically
```

```
/ComponentFolder
  /Component.jsx
  /Component.scss <-- this file will be imported as global
``` -->

<!-- ## How it works -->
