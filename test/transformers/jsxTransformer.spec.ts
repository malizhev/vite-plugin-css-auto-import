import { expect, test } from "vitest";
import { transformJSX } from "./../../src/transformers/jsxTransformer";
import { sampleManifest } from "../fixtures/manifest";
import { generateSampleModule } from "../fixtures/sampleModule";

test("should inject style module", async () => {
  const originalCode = generateSampleModule(`<div class="simple" />`);
  const { code } = await transformJSX({
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    originalCode,
    manifest: sampleManifest,
  });
  expect(code.startsWith(`import "./style.css"`)).toBe(true);
});

test("should transform both simple class and className", async () => {
  const originalCode = generateSampleModule(
    `<><div class="simple" /><div className="simple" /></>`
  );
  const { code } = await transformJSX({
    originalCode,
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    manifest: {
      simple: "__simple",
    },
  });
  expect(code).toIncludeTemplateString(
    `<><div class="__simple" /><div className="__simple" /></>`
  );
});

test("should not transform unknown class", async () => {
  const originalCode = generateSampleModule(`<div class="unknown" />`);
  const { code } = await transformJSX({
    originalCode,
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    manifest: {
      simple: "__simple",
    },
  });
  expect(code).toIncludeTemplateString(`<div class="unknown" />`);
});

test("should handle multiple classes", async () => {
  const originalCode = generateSampleModule(
    `<div class="classA  unknown classB" />`
  );
  const { code } = await transformJSX({
    originalCode,
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    manifest: {
      classA: "__classA",
      classB: "__classB",
    },
  });
  expect(code).toIncludeTemplateString(
    `<div class="__classA unknown __classB" />`
  );
});

test("should handle classList property", async () => {
  const originalCode = generateSampleModule(
    `<div classList={{ keyA: true, "keyB": false }} />`
  );
  const { code } = await transformJSX({
    originalCode,
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    manifest: {
      keyA: "__keyA",
      keyB: "__keyB",
    },
  });
  expect(code).toIncludeTemplateString(
    `<div classList={{ "__keyA": true, "__keyB": false }} />`
  );
});

test("should handle className helper functions", async () => {
  const originalCode = generateSampleModule(
    `<div class={ classNames({ keyA: true, "keyB": false, unknownKey: true }, ["arrayMember"])} />`
  );
  const { code } = await transformJSX({
    originalCode,
    moduleId: "component.ts",
    styleModuleId: "./style.css",
    manifest: {
      keyA: "__keyA",
      keyB: "__keyB",
      arrayMember: "__arrayMember",
    },
  });
  expect(code).toIncludeTemplateString(
    `<div class={ classNames({ "__keyA": true, "__keyB": false, "unknownKey": true }, ["__arrayMember"])} />`
  );
});
