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
import { getBlob, isNotFalsy } from "../../general";
import { Convert, ConvertConfig, Progress } from "../convert";
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

async function loadVideo(sourceMeta: SourceMeta): Promise<LoadedTrack> {
  const bunnySource = resolveSource(sourceMeta);
  const input = new Input({ source: bunnySource, formats: ALL_FORMATS });
  const duration = await input.computeDuration(); // homepage snippet shows this usage
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error("No video track");

  return { input, videoTrack, duration };
}

type LayoutSlot = { x: number; y: number; w: number; h: number };

function generateLayoutSlots(size: { width: number; height: number }, rowsAmount: number, colsAmount: number): LayoutSlot[] {
  const slots: LayoutSlot[] = [];
  for (let row = 0; row < rowsAmount; row++) {
    for (let col = 0; col < colsAmount; col++) {
      slots.push({
        x: col * size.width,
        y: row * size.height,
        w: size.width,
        h: size.height,
      });
    }
  }
  return slots;
}

async function mediaBunnyConvert({
  sourcesMeta,
  onProgress,
  options: { text, trim } = {},
}: {
  sourcesMeta: (SourceMeta | undefined)[];
  onProgress?: (progress: Progress) => void;
  options?: ConvertConfig;
}) {
  let canceled = false;
  const cancel = () => {
    canceled = true;
  };

  // ) Frame loop
  const getResult = async () => {
    // ) Inputs
    const inputs = await Promise.all(sourcesMeta.filter(isNotFalsy).map(loadVideo)); // compute duration, get videoTrack

    // ) Timeline: use min duration across the 4 videos
    const fps = 30; // TODO: get from video
    const frameDur = 1 / fps;
    const minDur = Math.min(...inputs.map((i) => i.duration));
    const frameCount = Math.max(1, Math.floor(minDur * fps));

    // ) Get video resolutions
    const displaySize = inputs.reduce<{
      w: number;
      h: number;
    } | null>((size, { videoTrack }) => {
      if (!videoTrack) return size;

      const { displayWidth, displayHeight } = videoTrack;
      if (!size)
        return {
          w: displayWidth,
          h: displayHeight,
        };

      return {
        w: Math.max(size.w, displayWidth),
        h: Math.max(size.h, displayHeight),
      };
    }, null);
    if (!displaySize) throw new Error("No video track found from inputs");

    const colsAmount = Math.ceil(Math.sqrt(sourcesMeta.length));
    const rowsAmount = Math.ceil(sourcesMeta.length / colsAmount);

    const outWidth = displaySize.w * colsAmount;
    const outHeight = displaySize.h * rowsAmount;

    // ) Canvas & output
    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
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
    const quads = generateLayoutSlots(
      {
        width: displaySize.w,
        height: displaySize.h,
      },
      rowsAmount,
      colsAmount
    );
    const sinks = inputs.map(({ videoTrack }) => videoTrack && new VideoSampleSink(videoTrack));
    const [firstFrame, finalFrame] = trim?.map((s) => s * fps) ?? [0, frameCount];
    const totalFrames = finalFrame - firstFrame;

    for (let i = firstFrame; i < finalFrame; i++) {
      if (canceled) {
        videoSource.close();
        output.cancel();
        throw new Error("Processing canceled");
      }

      const t = i * frameDur;

      onProgress?.((i - firstFrame) / totalFrames);

      ctx.clearRect(0, 0, outWidth, outHeight);

      const samples = await Promise.all(sinks.map((s) => s?.getSample(t)));

      for (let k = 0; k < sourcesMeta.length; k++) {
        const s = samples[k];
        if (!s) continue;

        const quad = quads[k];
        if (!quad) continue;

        // Destination rect inside the quad:
        s.draw(ctx, quad.x, quad.y, quad.w, quad.h); // accounts for rotation
        s.close(); // release resources ASAP
      }

      if (text) {
        const [content, textStyle] = text;
        if (content instanceof Date) {
          const timeOfFrame = new Date(+content + t * 1000);
          const contentOfFrame = timeOfFrame.toLocaleString();
          drawTextOverlay(ctx, contentOfFrame, textStyle);
        } else {
          drawTextOverlay(ctx, content, textStyle);
        }
      }

      await videoSource.add(t, frameDur); // encode the current canvas frame
    }

    await output.finalize();
    const mime = await output.getMimeType();
    const buffer = target.buffer;
    if (!buffer) throw new Error("No output buffer");
    return getBlob(buffer, mime);
  };

  return { result: getResult(), cancel };
}

export const convert: Convert = (inputs, options, { onProgress }) =>
  mediaBunnyConvert({
    sourcesMeta: [inputs.front, inputs.rear, inputs.left, inputs.right].filter(isNotFalsy),
    onProgress,
    options,
  });
