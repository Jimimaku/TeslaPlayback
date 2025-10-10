import { readFile } from "fs/promises";
import { resolve } from "path/posix";
import { treeOutputParser } from "./tree-output-parser";

const raw = await readFile(resolve(__dirname, "fs.test.raw.txt"), "utf-8");
export const files = treeOutputParser(raw);
