# ⚡ vite-plugin-css-auto-import [![NPM version](https://img.shields.io/npm/v/vite-plugin-css-auto-import?style=flat-square)](https://www.npmjs.com/package/vite-plugin-css-auto-import)

<!-- # ⚡ vite-plugin-css-auto-import [![NPM version](https://badgen.net/npm/v/vite-plugin-css-auto-import)](https://www.npmjs.com/package/vite-plugin-css-auto-import) -->

The plugin designed specifically for folks who are tired of this:

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

Writing components should be easy. Just put your CSS file next to a component and this plugin will do the rest:

- automatically import styles to JSX/TSX components
- transform scoped classnames for CSS Modules (e.g. `className="link"` becomes `className="_link_1nhoj_19"`) 

<!-- ## Features

- First-class CSS modules support.
- Supports JSX and TSX components. -->

## How it works

Let's say you have a component file called `Component.jsx`. The plugin will look for any style file in the same directory that matches the component file name (e.g. `Component.css`, `Component.scss`, etc.). The plugin will import the styles for you.

Check the [API section](#api) for configuration options.

### CSS modules

Auto import really comes in handy when dealing with CSS modules.
When matched style file is a module (its name ends with `.module` or when resolved using [`resolveStyleForComponent`](#resolvestyleforcomponent) method).

To use CSS modules you can:

- add `.module` at the end of your style file name ([following Vite's convention](https://vitejs.dev/guide/features.html#css-modules))
- mark **all auto-imported styles** as modules by setting [`resolveAllStylesAsModules`](#resolveallstylesasmodules) option to `true`. This is especially useful if you want to enable style scoping without an extra overhead.
- implement your own resolution logic using [`resolveStyleForComponent`](#resolvestyleforcomponent) method.

Under the hood, the plugin uses [`postcss-modules`](https://github.com/madyankin/postcss-modules) to parse and extract class names from style files.

> Note: this plugin **does not** compile nor transform your styles. Transformation is done by Vite. The responsibility of this plugin is only to **import styles** and **transform JSX** to map scoped class names to original class names in your code.

You can configure CSS modules transform by setting [`css.modules`](https://vitejs.dev/config/shared-options.html#css-modules) options in your `vite.config` file.

<!-- You can continue writing -->

<!-- For example: -->

With this CSS file:

```css
.link {
  ...;
}
.secondary {
  ...;
}
```

```html
<!-- before -->
<a href="/" className="link"></a>
<!-- after -->
<a href="/" className="_link_1nhoj_19"></a>
```

You can easily

```html
<!-- before -->
<a href="/" className="link secondary foo"></a>
<!-- after -->
<a href="/" className="_link_1nhoj_19 _secondary_mthi7_29 foo"></a>
```

```html
<!-- // before -->
<a classList={{
  foo: true,
  bar: true,
}}></a>

<!-- // after -->
<a classList={{
  "_foo_fc5kr_29": true,
  "_bar_fc5kr_33": true,
}}></a>
```

```html
<!-- before -->
<a className={clsx({
  foo: true,
  bar: true,
}, ["baz"])}></a>

<!-- after -->
<a className={clsx({
  "_foo_fc5kr_29": true,
  "_bar_fc5kr_33": true,
}, ["_baz_fc5kr_37"])}></a>
```

> Notice that `text-xl` class name

### Typescript

`vite-plugin-css-auto-import` is built with TypeScript. So it supports both JSX and TSX component syntax.

> If more than one file matches the component

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

Just put your CSS file next to a component. Write React/Preact/Solid components as if you've imported styles and the plugin will do the rest.
This plugin also supports CSS modules, so there's no more `<div className={styles.container} />` but just `<div className="container">`

## Features

- Works with JSX and TSX (tested with React and Solid)
- CSS modules support

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

List of component modules extensions that will be transformed by the plugin.

##### `styleGlob`

- type: `string`
- default: `false`

Glob to match styles in the current component directory.

##### `styleExtensions`

- type: `string[]`
- default: `[".css", ".scss", ".less"]`

List of style files extensions.

##### `resolveAllStylesAsModules`

- type: `boolean`
- default: `false`

Force all matched style files to be treated as CSS modules.

##### `matchComponentName`

- type: `boolean`
- default: `true`

This controls whether style file name should match component file name.
For example, `Card.jsx` would only match `Card.css` and `Card.module.css`.

##### `shouldTransformComponent`

- type: `(fileName: string, filePath: string) => boolean | Promise<boolean>`
- default: `undefined`

Advanced method for matching the transformed components. Accepts component file name and full path.
This method takes precedence over `componentExtensions`.

##### `resolveStyleForComponent`

- type: `(componentName: string, directoryName: string, filePath: string) => ResolvedStyleResult | Promise<ResolvedStyleResult>`
- default: `undefined`

Advanced method for resolving styles for the component. Accepts component file name (without extension), directory name and full path.
This method takes precedence over `styleGlob`, `styleExtensions`, `resolveAllStylesAsModules` and `matchComponentName`.

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

- [ ] Add option to omit class name if it's not defined in the original style file.
- [ ] Add support to enable/disable auto-import within component and style files.
- [ ] Add option to include/exclude specific directories to resolve CSS imports.
- [ ] Improve LESS and other preprocessors support.
- [ ] VS Code extension to provide the autocompletion list.

### Usage examples

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
```

<!-- ## How it works -->
