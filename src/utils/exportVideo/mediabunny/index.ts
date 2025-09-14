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
import { isNotFalsy } from "../../general";

type LoadedTrack = {
  input: Input;
  videoTrack: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>;
  duration: number; // seconds
};

type SourceMeta = string | URL | Blob | ArrayBuffer | ArrayBufferView;

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

type Quad = { x: number; y: number; w: number; h: number };

function layout2x2(W: number, H: number): Quad[] {
  const cw = Math.floor(W / 2);
  const ch = Math.floor(H / 2);
  return [
    { x: 0, y: 0, w: cw, h: ch }, // top-left
    { x: cw, y: 0, w: cw, h: ch }, // top-right
    { x: 0, y: ch, w: cw, h: ch }, // bottom-left
    { x: cw, y: ch, w: cw, h: ch }, // bottom-right
  ];
}

function fitContain(sw: number, sh: number, dw: number, dh: number) {
  const scale = Math.min(dw / sw, dh / sh);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const x = Math.floor((dw - w) / 2);
  const y = Math.floor((dh - h) / 2);
  return { x, y, w, h };
}

type Result = {
  mime: string;
  buffer: ArrayBuffer;
};

export async function convert({
  sourcesMeta,
  fps = 30,
  onProgress,
}: {
  sourcesMeta: (SourceMeta | undefined)[];
  fps?: number; // e.g. 30
  onProgress?: (progress: { progress: number; time: number }) => void;
}): Promise<{
  result: Promise<Result>;
  cancel: () => void;
}> {
  let canceled = false;
  const cancel = () => {
    canceled = true;
  };

  // ) Frame loop
  const getResult = async () => {
    // ) Inputs
    const inputs = await Promise.all(sourcesMeta.filter(isNotFalsy).map(loadVideo)); // compute duration, get videoTrack

    // ) Timeline: use min duration across the 4 videos
    const minDur = Math.min(...inputs.map((i) => i.duration));
    const frameDur = 1 / fps;
    const frameCount = Math.max(1, Math.floor(minDur * fps));

    // ) Get video resolutions
    const displaySize = inputs.reduce<{
      w: number;
      h: number;
    } | null>((size, { videoTrack }) => {
      if (!videoTrack) return size;

      const { displayWidth, displayHeight } = videoTrack;
      return {
        w: Math.max(size?.w ?? 0, displayWidth),
        h: Math.max(size?.h ?? 0, displayHeight),
      };
    }, null);

    if (!displaySize) throw new Error("No video track found from inputs");
    const outHeight = displaySize.h * 2;
    const outWidth = displaySize.w * 2;

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
    const quads = layout2x2(outWidth, outHeight);
    const sinks = inputs.map(({ videoTrack }) => videoTrack && new VideoSampleSink(videoTrack));
    for (let i = 0; i < frameCount; i++) {
      if (canceled) {
        videoSource.close();
        output.cancel();
        throw new Error("Processing canceled");
      }

      const t = i * frameDur;
      ctx.clearRect(0, 0, outWidth, outHeight);

      // fetch 4 frames for timestamp t
      const samples = await Promise.all(sinks.map((s) => s?.getSample(t)));

      // draw each into its quad with letterboxing (contain)
      for (let k = 0; k < 4; k++) {
        const s = samples[k];
        if (!s) continue;

        const quad = quads[k];
        const { x, y, w, h } = fitContain(displaySize.w, displaySize.h, quad.w, quad.h);

        // Destination rect inside the quad:
        s.draw(ctx, quad.x + x, quad.y + y, w, h); // accounts for rotation
        s.close(); // release resources ASAP
      }

      await videoSource.add(t, frameDur); // encode the current canvas frame

      onProgress?.({ progress: (i + 1) / frameCount, time: t * 1000 * 1000 });
    }

    await output.finalize();
    const mime = await output.getMimeType();
    const buffer = target.buffer;
    if (!buffer) throw new Error("No output buffer");
    return { mime, buffer };
  };

  return { result: getResult(), cancel };
}
