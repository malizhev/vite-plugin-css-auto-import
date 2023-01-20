import { expect, test, vi } from "vitest";
import { resolveStylesFromDirectory } from "../src/helpers";

test("should throw when no resolution options have been passed", async () => {
  const options = {
    componentFilePath: "/a/b/c/Component.tsx",
    directory: ["/a/b/c/Component.tsx"],
    options: {},
  };
  await expect(() => resolveStylesFromDirectory(options)).rejects.toThrow(
    "One of 'resolveStyleForComponent' or 'styleExtensions' is required"
  );
});

test("should match component name (default options)", async () => {
  const result1 = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/Component.scss",
      "/a/b/c/some-file.scss",
    ],
    options: {
      matchComponentName: true,
      styleExtensions: [".css", ".scss", ".less"],
    },
  });
  const result2 = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/Component.scss",
      "/a/b/c/Component.css",
    ],
    options: {
      matchComponentName: true,
      styleExtensions: [".css", ".scss", ".less"],
    },
  });
  expect(result1).toMatchObject([
    { filePath: "/a/b/c/Component.scss", isModule: false },
  ]);
  expect(result2).toMatchObject([
    { filePath: "/a/b/c/Component.css", isModule: false },
    { filePath: "/a/b/c/Component.scss", isModule: false },
  ]);
});

test("should match files only with specified extensions", async () => {
  const result = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/file-a.css",
      "/a/b/c/file-b.scss",
      "/a/b/c/matched-file.ext",
    ],
    options: {
      matchComponentName: false,
      styleExtensions: [".ext"],
    },
  });
  expect(result).toMatchObject([
    { filePath: "/a/b/c/matched-file.ext", isModule: false },
  ]);
});

test("should match all style files name in the same directory", async () => {
  const result = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/Component.scss",
      "/a/b/c/some-file.css",
      "/a/b/c/another-file.less",
    ],
    options: {
      matchComponentName: false,
      styleExtensions: [".css", ".scss", ".less"],
    },
  });
  expect(result).toMatchObject([
    { filePath: "/a/b/c/some-file.css", isModule: false },
    { filePath: "/a/b/c/Component.scss", isModule: false },
    { filePath: "/a/b/c/another-file.less", isModule: false },
  ]);
});

test("should correctly mark styles as modules", async () => {
  const result = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/file-a.scss",
      "/a/b/c/file-b.css",
      "/a/b/c/file-c.less",
      "/a/b/c/file-a.module.scss",
      "/a/b/c/file-b.module.css",
      "/a/b/c/file-c.module.less",
    ],
    options: {
      matchComponentName: false,
      styleExtensions: [".css", ".scss", ".less"],
    },
  });
  expect(result).toMatchObject([
    { filePath: "/a/b/c/file-b.css", isModule: false },
    { filePath: "/a/b/c/file-b.module.css", isModule: true },
    { filePath: "/a/b/c/file-a.scss", isModule: false },
    { filePath: "/a/b/c/file-a.module.scss", isModule: true },
    { filePath: "/a/b/c/file-c.less", isModule: false },
    { filePath: "/a/b/c/file-c.module.less", isModule: true },
  ]);
});

test("should always marks styles as modules", async () => {
  const result = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/file-a.scss",
      "/a/b/c/file-b.css",
      "/a/b/c/file-c.less",
      "/a/b/c/file-a.module.scss",
      "/a/b/c/file-b.module.css",
      "/a/b/c/file-c.module.less",
    ],
    options: {
      matchComponentName: false,
      alwaysResolveModules: true,
      styleExtensions: [".css", ".scss", ".less"],
    },
  });
  expect(result).toMatchObject([
    { filePath: "/a/b/c/file-b.css", isModule: true },
    { filePath: "/a/b/c/file-b.module.css", isModule: true },
    { filePath: "/a/b/c/file-a.scss", isModule: true },
    { filePath: "/a/b/c/file-a.module.scss", isModule: true },
    { filePath: "/a/b/c/file-c.less", isModule: true },
    { filePath: "/a/b/c/file-c.module.less", isModule: true },
  ]);
});

test("should execute resolveStyleForComponent", async () => {
  const resolveStyleForComponent = vi.fn().mockImplementation(() => {
    return { filePath: "/result.css", isModule: false };
  });

  const result1 = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [
      "/a/b/c/Component.tsx",
      "/a/b/c/file-a.scss",
      "/a/b/c/file-b.scss",
    ],
    options: {
      resolveStyleForComponent,
    },
  });
  const result2 = await resolveStylesFromDirectory({
    componentFilePath: "/a/b/c/Component.tsx",
    directory: [],
    options: {
      /**
       * Check edge case. Should not fail when falsy value is returned
       */
      // @ts-ignore
      resolveStyleForComponent: () => null,
    },
  });
  expect(resolveStyleForComponent).toBeCalledWith(
    "Component",
    "/a/b/c",
    "/a/b/c/Component.tsx"
  );
  expect(result1).toMatchObject([{ filePath: "/result.css", isModule: false }]);
  expect(result2).toMatchObject([]);
});
