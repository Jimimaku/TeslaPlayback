import { readFile } from "node:fs/promises";
import { resolve } from "path";
import { expect, test } from "vitest";
import { processDashCamFiles } from "../processDashCamFiles";
import { treeOutputParser } from "./tree-output-parser";

test("processDashCamFiles", async () => {
  const raw = await readFile(resolve(__dirname, "fs.test.raw.txt"), "utf-8");
  const files = treeOutputParser(raw);
  expect(processDashCamFiles(files)).toMatchSnapshot();
});
