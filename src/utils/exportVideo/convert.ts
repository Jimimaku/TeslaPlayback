import { ClipFiles } from "../../common";

export interface ConvertConfig {
  text?: [content: Date | string, style: DrawTextStyle];
  trim?: [start: number, end: number];
}

export interface Convert {
  (
    fileMap: ClipFiles,
    options: ConvertConfig,
    {
      onProgress,
      onError,
    }: {
      onProgress: (progress: Progress) => void;
      onError: (error: Error | undefined) => void;
    }
  ): Promise<{
    result: Promise<Blob>;
    cancel: () => void;
  }>;
}

export type Progress = number;

export async function loadConverter(): Promise<Convert> {
  return (await import("./mediabunny")).convert;
}

export type DrawTextStyle = {
  fontSize?: number;
  fontColor?: string;
  background?: boolean;
  backgroundColor?: string;
  x?: number;
  y?: number;
  baseTime?: string;
  timeFormat?: string;
};
