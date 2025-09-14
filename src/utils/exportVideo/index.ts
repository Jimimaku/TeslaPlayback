import { DrawTextStyle } from "./ffmpeg/ffmpegArgsComposer/DrawTextArgs";

interface FileMap {
  front?: File;
  rear?: File;
  left?: File;
  right?: File;
}

export interface Convert {
  (
    inputs: FileMap,
    options: {
      resolvedTextToDraw?: Date | string;
      drawTextOptions?: DrawTextStyle;
      trimStart?: number;
      trimEnd?: number;
    },
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

export type Progress = {
  progress: number;
  time: number;
};

export async function loadConverter(converter: "ffmpeg" | "mediabunny"): Promise<Convert> {
  switch (converter) {
    case "ffmpeg":
      return (await import("./ffmpeg")).convert;
    case "mediabunny":
      return (await import("./mediabunny")).convert;
  }
}
