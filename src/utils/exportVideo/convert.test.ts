import { describe, expect, it } from "vitest";
import { ConvertTrack, resolveExportStartTime } from "./convert";

const track = (startTime: Date): ConvertTrack => ({
  startTime,
  sourceMeta: "video.mp4",
  quad: { x: 0, y: 0, w: 640, h: 480 },
});

describe("resolveExportStartTime", () => {
  it("uses the earliest video track when no trim is configured", () => {
    const later = new Date(2025, 8, 20, 13, 37, 1);
    const earlier = new Date(2025, 8, 20, 13, 36, 1);

    expect(resolveExportStartTime([track(later), track(earlier)])).toBe(earlier);
  });

  it("uses the trim start when the export is trimmed", () => {
    const clipStart = new Date(2025, 8, 20, 13, 36, 1);
    const trimStart = new Date(2025, 8, 20, 13, 36, 15);
    const trimEnd = new Date(2025, 8, 20, 13, 36, 30);

    expect(resolveExportStartTime([track(clipStart)], [trimStart, trimEnd])).toBe(trimStart);
  });

  it("rejects an export without video tracks", () => {
    expect(() => resolveExportStartTime([])).toThrow("without video tracks");
  });
});
