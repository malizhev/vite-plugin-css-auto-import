// import { expect } from "vitest";

// // declare global {
// //   namespace Vi {
// //     interface JestAssertion<T = any> extends jest.Matchers<void, T> {
// //       toIncludeTemplateString(template: string): any;
// //     }
// //   }
// // }

// // const templateRegex = /return \(\n\s+(.+)/gm;

// // expect.extend({
// //   toIncludeTemplateString(received: string, expected: string) {
// //     const template = extractTemplate(received);
// //     return {
// //       pass: template === expected,
// //       message: () => `Templates don't match`,
// //       actual: template,
// //       expected,
// //     };
// //   },
// // });

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

// export function extractTemplate(template: string) {
//   const result = templateRegex.exec(template);
//   if (!result) {
//     throw new Error(`No match for the template ${template}`);
//   }
//   return Array.from(result)[1];
// }
