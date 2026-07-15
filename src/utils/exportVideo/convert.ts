export type TextOverlay = {
  quad: Quad;

  fontSize?: number; // px (default 36)
  fontFamily?: string; // default 'system-ui, sans-serif'
  fontColor?: string; // CSS color; default '#fff'

  backgroundColor?: string; // CSS color; default 'rgba(0,0,0,0.6)'
  align?: CanvasTextAlign; // 'left'|'center'|'right'... default 'left'
};

export interface ConvertConfig {
  text?: [content: Date | string, style: TextOverlay];
  trim?: [start: Date, end: Date];
  canvas?: HTMLCanvasElement;
  size: Size;
  videoSize: Size;
}

interface CancelableJob<T> {
  result: Promise<T>;
  cancel: () => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Quad extends Position, Size {}

export interface ConvertTrack {
  sourceMeta: string | File;
  quad: Quad;
  startTime: Date;
}

export interface ConvertCallbacks {
  onProgress: (progress: Progress) => void;
  onError: (error: Error | undefined) => void;
}

export interface Convert {
  (tracks: ConvertTrack[], config: ConvertConfig, callbacks: ConvertCallbacks): CancelableJob<Blob>;
}

export function resolveExportStartTime(tracks: ConvertTrack[], trim?: ConvertConfig["trim"]): Date {
  if (trim) return trim[0];
  if (!tracks.length) throw new Error("Cannot resolve export start time without video tracks");
  return tracks.reduce((earliest, track) => (track.startTime < earliest ? track.startTime : earliest), tracks[0].startTime);
}

export type Progress = number;

export async function loadConverter(): Promise<Convert> {
  return (await import("./mediabunny")).convert;
}

export const headerSize: Size = { w: 0, h: 120 };
export const videoSize: Size = { w: 640, h: 480 };
