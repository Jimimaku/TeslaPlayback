import { describe, expect, it } from "vitest";
import { files } from "./files";

describe("treeOutputParser", () => {
  it("should parse the tree output correctly", async () => {
    // not very serious but enough for this case
    const hasFolder = Array.prototype.some.call(files, (item) => {
      item.webkitRelativePath.match(/"name": "[^.]+"/);
    });
    expect(hasFolder).toBe(false);

    expect(files).toMatchSnapshot();
  });
});
