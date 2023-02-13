import type { JSX } from "solid-js/jsx-runtime";

export function Label(props: { children: JSX.Element }) {
  return <span class="root">{props.children}</span>;
}
