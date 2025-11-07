import {
  ALL_FORMATS,
  BlobSource,
  BufferSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_MEDIUM,
  UrlSource,
  VideoSampleSink,
  getFirstEncodableVideoCodec,
} from "mediabunny";
import { isNotNil } from "ramda";
import { getBlob } from "../../file";
import { earlier, formatDateTime, isDuring, later, shiftTime, timeSubtract } from "../../time";
import { Convert, Size } from "../convert";
import { CancelSignal } from "./CancelSignal";
import { drawTextOverlay } from "./text";

type LoadedTrack = {
  input: Input;
  videoTrack: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>;
  duration: number; // seconds
};

export type SourceMeta = string | URL | Blob | ArrayBuffer | ArrayBufferView;

const resolveSource = (source: SourceMeta) => {
  if (typeof source === "string") return new UrlSource(source);
  if (source instanceof URL) return new UrlSource(source);
  if (source instanceof Blob) return new BlobSource(source);
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) return new BufferSource(source);

  throw new Error("Unsupported source type");
};

async function loadVideoTrack(sourceMeta: SourceMeta): Promise<LoadedTrack> {
  const bunnySource = resolveSource(sourceMeta);
  const input = new Input({ source: bunnySource, formats: ALL_FORMATS });
  const duration = await input.computeDuration(); // homepage snippet shows this usage
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error("No video track");

  return { input, videoTrack, duration };
}

const createCancelable = <R>(creator: (cancelSignal: CancelSignal) => Promise<R>) => {
  const cancelSignal = new CancelSignal();
  return { result: creator(cancelSignal), cancel: cancelSignal.cancel };
};

class CancelError extends Error {}

export const flowControlErrors = {
  CancelError,
};

export const convert: Convert = (tracksToConvert, config, callbacks) =>
  createCancelable(async (cancelSignal: CancelSignal) => {
    const { text, trim, size, canvas = getCanvas(size) } = config;

    // ) Inputs
    const inputs = await Promise.all(tracksToConvert.map(({ sourceMeta }) => sourceMeta).map(loadVideoTrack));
    const durations = (await Promise.all(inputs.map((input) => input.videoTrack?.computeDuration()))).map((d) =>
      typeof d === "number" ? d * 1000 : d,
    );
    const tracksAndRange = tracksToConvert.map((track, k) => {
      const realDuration = durations[k];
      if (realDuration === undefined) return null;

      const startTime = track.startTime;
      const timeRange = [startTime, shiftTime(startTime, realDuration)] as const;
      return [track, timeRange] as const;
    });

    const [videoStartTime, videoEndTime] =
      trim ??
      tracksAndRange
        .filter(isNotNil)
        .map(([, duration]) => duration)
        .reduce(([earliest, latest], [start, end]) => [earlier(earliest, start), later(latest, end)]);

    // ) Timeline
    const totalDurationMs = trim ? timeSubtract(trim[1], trim[0]) : timeSubtract(videoEndTime, videoStartTime);
    const fps = 30; // TODO: get from video
    const frameDurMs = 1000 / fps;
    const frameCount = Math.max(1, Math.floor((totalDurationMs * fps) / 1000));

    // ) Canvas & output
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas 2D context");

    const { videoSource, output, target } = await setupCanvas(canvas); // Enable preview

    const sinks = inputs.map(({ videoTrack }) => videoTrack).map((videoTrack) => videoTrack && new VideoSampleSink(videoTrack));
    try {
      // ) Frame loop
      for (let i = 0; i < frameCount; i++) {
        if (cancelSignal.isCanceled) {
          throw new flowControlErrors.CancelError("Processing canceled");
        }

        const timeInVideoMs = i * frameDurMs;
        const timeInReality = shiftTime(videoStartTime, timeInVideoMs);

        callbacks.onProgress?.((i - 0) / frameCount);

        const samples = await Promise.all(
          tracksAndRange.map((v, k) => {
            if (!v) return;

            const [, [start, end]] = v;
            if (!isDuring(timeInReality, start, end)) return;

            const timeInTrack = timeSubtract(timeInReality, start);
            return sinks[k]?.getSample(timeInTrack / 1000);
          }),
        );

        const availableSamples = samples.map((sample, k) => sample && ([sample, tracksToConvert[k]] as const)).filter(isNotNil);
        if (availableSamples.length) {
          // clear canvas only if there is something to draw
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, size.w, size.h);

          availableSamples.forEach(([s, track]) => {
            const { quad } = track;

            // Destination rect inside the quad:
            s.draw(ctx, quad.x, quad.y, quad.w, quad.h); // accounts for rotation
            s.close(); // release resources ASAP
          });

          drawText(ctx, timeInReality);
        }

        await videoSource.add(timeInVideoMs / 1000, frameDurMs / 1000); // encode the current canvas frame
      }

      await output.finalize();
      const mime = await output.getMimeType();
      const buffer = target.buffer;
      if (!buffer) throw new Error("No output buffer");
      return getBlob(buffer, mime);
    } finally {
      videoSource.close();
      output.cancel();
      canvas.remove();
    }

    function drawText(ctx: CanvasRenderingContext2D, timeInReality: Date) {
      if (text) {
        const [content, textStyle] = text;
        drawTextOverlay(ctx, content instanceof Date ? formatDateTime(timeInReality) : content, textStyle);
      }
    }
  });

function getCanvas(size: Size) {
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  return canvas;
}

async function setupCanvas(canvas: HTMLCanvasElement) {
  // Choose an encodable codec (avc1 / av1 / vp9 depends on the environment)
  const codec = await getFirstEncodableVideoCodec(["avc", "av1", "vp9"]);
  if (codec === null) throw new Error("No encodable video codec found");
  const videoSource = new CanvasSource(canvas, { codec, bitrate: QUALITY_MEDIUM }); // encode canvas frames
  const target = new BufferTarget(); // write to ArrayBuffer
  const output = new Output({
    format: new Mp4OutputFormat(), // or new WebMOutputFormat()
    target,
  });
  output.addVideoTrack(videoSource); // add before start()
  await output.start();
  return { videoSource, output, target };
}
