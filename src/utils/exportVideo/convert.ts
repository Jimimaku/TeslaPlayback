export interface ConvertConfig {
  text?: [content: Date | string, style: DrawTextStyle];
  trim?: [start: Date, end: Date];
  size: Size;
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

export type Progress = number;

export async function loadConverter(): Promise<Convert> {
  return (await import("./mediabunny")).convert;
}

export interface DrawTextStyle {
  fontSize?: number;
  fontColor?: string;
  background?: boolean;
  backgroundColor?: string;
  x?: number;
  y?: number;
  baseTime?: string;
  timeFormat?: string;
}
