import React from "react";
import clsx from "clsx";

export function SampleComponent() {
  return (
    <div>
      <div className="simple"></div>
      <div class="simple"></div>
      <div class="unknown"></div>
      <div class="segmentA segmentB"></div>
      <div class="segmentA   segmentB"></div>
      <div class="segmentA unknownSegment"></div>
      <div
        classList={{
          "keyA": true,
          keyB: true,
          unknownKey: true,
        }}
      ></div>
      <div class={clsx({ "keyA": true, keyB: true }, ["arrayMember"])}></div>
    </div>
  );
}
