import type { Component } from "solid-js";
import clsx from "clsx";

import logo from "./logo.svg";
import { Label } from "./components/Label/Label";

const App: Component = () => {
  return (
    <div class="App">
      <header class="header">
        <img src={logo} class={clsx({ logo: true })} alt="logo" />
        <p class="paragraph">
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          class={clsx(["link"])}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Label>Learn Solid</Label>
        </a>
      </header>
    </div>
  );
};

export default App;
