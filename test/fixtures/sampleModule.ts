export function generateSampleModule(template: string) {
  return `
import React from "react";

export default function() {
  return (
    ${template}
  );
}
`;
}
