import type { Component } from "solid-js";
import clsx from "clsx";

import logo from "./logo.svg";

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
          Learn Solid
        </a>
      </header>
    </div>
  );
};

export default App;
