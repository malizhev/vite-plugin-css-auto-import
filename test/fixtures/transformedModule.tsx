import React from "react";
import clsx from "clsx";

export function SampleComponent() {
  return (
    <div>
      <div className="TRANSFORMED_simple"></div>
      <div class="TRANSFORMED_simple"></div>
      <div class="unknown"></div>
      <div class="TRANSFORMED_segmentA TRANSFORMED_segmentB"></div>
      <div class="TRANSFORMED_segmentA TRANSFORMED_segmentB"></div>
      <div class="TRANSFORMED_segmentA unknownSegment"></div>
      <div
        classList={{
          "TRANSFORMED_keyA": true,
          "TRANSFORMED_keyB": true,
          "unknownKey": true,
        }}
      ></div>
      <div class={clsx({ "TRANSFORMED_keyA": true, "TRANSFORMED_keyB": true }, ["TRANSFORMED_arrayMember"])}></div>
    </div>
  );
}
