interface FileMap {
  front?: File;
  rear?: File;
  left?: File;
  right?: File;
}

export interface ConvertConfig {
  text?: [content: Date | string, style: DrawTextStyle];
  trim?: [start: number, end: number];
}

export interface Convert {
  (
    inputs: FileMap,
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
