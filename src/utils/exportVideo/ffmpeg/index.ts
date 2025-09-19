import { Convert } from "..";
import { getBlob } from "../../general";
import { createFFMpeg } from "./ffmpeg";
import { processVideo } from "./FFMpegVideoProcessJob";

export const convert: Convert = async (fileMap, options, { onError, onProgress }) => {
  try {
    if (!fileMap) throw new Error("No input files");

    const ffmpeg = await createFFMpeg();
    ffmpeg.on("log", ({ message }) => {
      console.log("[ffmpeg]", message);
      switch (message) {
        case "Aborted(OOM)": {
          onError(new Error("ffmpeg ran out of memory."));
        }
      }
    });

    ffmpeg.on("progress", onProgress);

    const getOutputFile = async () => {
      const outputFile = await processVideo(ffmpeg, fileMap, {
        text:
          options.text !== undefined
            ? {
                content: options.text[0],
                style: options.text[1],
              }
            : undefined,
        trim: options.trim && {
          startTime: options.trim[0],
          endTime: options.trim[1],
        },
      });

      if (typeof outputFile === "string") {
        throw new Error(`ffmpeg emitted a string output: ${outputFile}`);
      }
      return getBlob(outputFile, "video/mp4");
    };

    return {
      result: getOutputFile(),
      cancel: () => ffmpeg.terminate(),
    };
  } catch (err) {
    if (err instanceof Error) {
      switch (err.message) {
        case "called FFmpeg.terminate()":
          throw undefined;
        case "Failed to execute 'postMessage' on 'Worker': ArrayBuffer at index 0 is already detached.":
          throw new Error("Failed to relaunch Web Worker. Please refresh and retry.");
        default:
          if (err.message.startsWith("Failed to fetch dynamically imported module:")) {
            throw new Error("Failed to load extra dependency for processing videos. Please enable network and retry.");
          }

          console.error(err);
          throw new Error(err.message);
      }
    }

    console.error(err);
    let message = err;
    if (err === "ReferenceError: SharedArrayBuffer is not defined") {
      message = "insecure network context";
    }
    throw new Error(`Failed processing video: ${message}`);
  }
};
