import { readFile } from "node:fs/promises";
import { resolve } from "node:path/posix";
import { describe, expect, it } from "vitest";
import { treeOutputParser } from "./tree-output-parser";

describe("treeOutputParser", () => {
  it("should parse the tree output correctly", async () => {
    const raw = await readFile(resolve(__dirname, "fs.test.raw.txt"), "utf-8");
    const parsed = treeOutputParser(raw);

    // not very serious but enough for this case
    const hasFolder = Array.prototype.some.call(parsed, (item) => {
      item.webkitRelativePath.match(/"name": "[^.]+"/);
    });
    expect(hasFolder).toBe(false);

    expect(parsed).toMatchSnapshot();
  });
});
