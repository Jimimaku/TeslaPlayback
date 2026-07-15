import { describe, expect, it } from "vitest";
import { formatDateTime, formatDateTimeForFileName } from "./time";

describe("local date/time formatting", () => {
  it("does not convert the timestamp to UTC", () => {
    const localTime = new Date(2025, 8, 20, 13, 36, 1);

    expect(formatDateTime(localTime)).toBe("2025-09-20 13:36:01");
  });

  it("uses filesystem-safe separators for filenames", () => {
    const localTime = new Date(2025, 8, 20, 13, 36, 1);

    expect(formatDateTimeForFileName(localTime)).toBe("2025-09-20_13-36-01");
  });

  it("handles invalid dates", () => {
    expect(formatDateTime(new Date("invalid"))).toBe("Invalid Date");
    expect(formatDateTimeForFileName(new Date("invalid"))).toBe("Invalid Date");
  });
});
