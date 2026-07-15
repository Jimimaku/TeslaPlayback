import { describe, expect, it } from "vitest";
import { getDescendingSortedKeys } from "./general";

describe("getDescendingSortedKeys", () => {
  it("puts the latest Tesla timestamp first", () => {
    const events = {
      "2024-04-16_10-10-22": null,
      "2025-09-20_13-36-01": null,
      "2021-10-20_20-47-06": null,
    };

    expect(getDescendingSortedKeys(events)).toEqual(["2025-09-20_13-36-01", "2024-04-16_10-10-22", "2021-10-20_20-47-06"]);
  });
});
