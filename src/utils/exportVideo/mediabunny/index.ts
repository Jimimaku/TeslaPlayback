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
import { min, zipWith } from "ramda";
import { formatDateTime, getBlob } from "../../general";
import { Convert, Size } from "../convert";
import { CancelSingal } from "./CancelSingal";
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

export const convert: Convert = async function (tracksToConvert, config, callbacks) {
  const cancelSignal = new CancelSingal();

  const getResult = async (cancelSignal: CancelSingal) => {
    const { text, trim, size } = config;

    // ) Inputs
    // TODO: load inputs on-demand according to processing time; but we'll lose some meta data in the beginning
    const inputs = await Promise.all(tracksToConvert.map(({ sourceMeta }) => sourceMeta).map(loadVideoTrack));
    const durations = await Promise.all(inputs.map((input) => input.videoTrack?.computeDuration()));
    const [tracksStartTime, tracksEndTime] = tracksToConvert
      .filter(
        trim
          ? ({ duration: [start, end] }) => {
              const [trimStart, trimEnd] = trim;
              return start < trimEnd && end > trimStart;
            }
          : () => true
      )
      .map(({ duration }) => duration.map((t) => t.getTime()))
      .map((duration, k): typeof duration => {
        const realDuration = durations[k];
        return realDuration ? (zipWith(min, [duration[0], +duration[0] + realDuration * 1000], duration) as number[]) : duration;
      })
      .reduce(([earliest, latest], [start, end]) => [Math.min(earliest, start), Math.max(latest, end)]);

    // ) Timeline
    const totalDurationMs = tracksEndTime - tracksStartTime;
    const fps = 30; // TODO: get from video
    const frameDurS = 1 / fps;
    const frameCount = Math.max(1, Math.floor((totalDurationMs / 1000) * fps));

    // ) Canvas & output
    const { videoSource, output, ctx, target } = await setupCanvas(size);

    const sinks = inputs.map(({ videoTrack }) => videoTrack).map((videoTrack) => videoTrack && new VideoSampleSink(videoTrack));

    // ) Frame loop
    for (let i = 0; i < frameCount; i++) {
      if (cancelSignal.isCanceled) {
        videoSource.close();
        output.cancel();
        throw new Error("Processing canceled");
      }

      const timeInVideoS = i * frameDurS;
      const timeInReality = timeInVideoS * 1000 + tracksStartTime;

      callbacks.onProgress?.((i - 0) / frameCount);

      ctx.clearRect(0, 0, size.w, size.h);

      const samples = await Promise.all(
        sinks.map((s, k) => {
          const {
            duration: [start, end],
          } = tracksToConvert[k];

          if (!isDuring(timeInReality, tracksStartTime, tracksEndTime)) return;
          if (!isDuring(timeInReality, +start, +end)) return;

          return s?.getSample(timeInVideoS);
        })
      );

      for (let k = 0; k < tracksToConvert.length; k++) {
        const s = samples[k];
        if (!s) continue;

        const { quad } = tracksToConvert[k];

        // Destination rect inside the quad:
        s.draw(ctx, quad.x, quad.y, quad.w, quad.h); // accounts for rotation
        s.close(); // release resources ASAP
      }

      if (text) {
        const [content, textStyle] = text;
        if (content instanceof Date) {
          const timeOfFrame = new Date(+content + timeInVideoS * 1000);
          const contentOfFrame = formatDateTime(timeOfFrame);
          drawTextOverlay(ctx, contentOfFrame, textStyle);
        } else {
          drawTextOverlay(ctx, content, textStyle);
        }
      }

      await videoSource.add(timeInVideoS, frameDurS); // encode the current canvas frame
    }

    await output.finalize();
    const mime = await output.getMimeType();
    const buffer = target.buffer;
    if (!buffer) throw new Error("No output buffer");
    return getBlob(buffer, mime);
  };

  return { result: getResult(cancelSignal), cancel: cancelSignal.cancel };
};

async function setupCanvas(size: Size) {
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas 2D context");

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
  return { videoSource, output, ctx, target };
}

const isDuring = (time: number, start: number, end: number) => time >= start && time <= end;
