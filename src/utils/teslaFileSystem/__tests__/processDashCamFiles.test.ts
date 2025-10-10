import { expect, test } from "vitest";
import { categories, parserLog } from "./categoriesFromFiles";

test("processDashCamFiles", async () => {
  expect(categories).toMatchSnapshot();
  expect(parserLog).toMatchSnapshot();
});
