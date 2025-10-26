import { tryCatch } from "ramda";

export function formatSecondsToHMS(seconds: number, forceRender: "h" | "m" = "m") {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return (forceRender === "h" || h > 0 ? [h, m, s] : forceRender === "m" || m > 0 ? [m, s] : [s]).map((x) => `${x}`.padStart(2, "0")).join(":");
}

export function formatSecondsToHHMMSS(seconds: number) {
  // HH:MM:SS
  const h = Math.floor(seconds / 60 / 60);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  return [h, m, s].map((x) => x.toString().padStart(2, "0")).join(":");
}

/**
 * Format Date object to "YYYY-MM-DD HH:mm:ss" string.
 * If the date is invalid, return "Invalid Date".
 */
export const formatDateTime = tryCatch(
  (dateTime: Date) =>
    dateTime
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z$/, ""),
  () => "Invalid Date",
);

export const formatTime = (time: Date) => {
  const h = time.getHours().toString().padStart(2, "0");
  const m = time.getMinutes().toString().padStart(2, "0");
  const s = time.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const shiftTime = (time: Date, shiftMs: number) => new Date(+time + shiftMs);
export const timeSubtract = (a: Date, b: Date) => +a - +b;
