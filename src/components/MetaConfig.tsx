import { isNotNil, values, zipObj } from "ramda";
import { PlaybackEvent } from "../common";
import { ConvertConfig, ConvertTrack, Position, Quad, Size } from "../utils/exportVideo/convert";
import { VideoLayoutKey, videoLayouts } from "../utils/VideoLayoutKey";

export type MetaConfig = Pick<ConvertConfig, "trim" | "size" | "videoSize"> & {
  layoutKey: VideoLayoutKey;
};

export const transformConfig = ({ trim, size, videoSize }: MetaConfig): ConvertConfig => ({
  trim,
  size,
  videoSize,
});

export function transformTracks(metaConfig: MetaConfig, event: PlaybackEvent): ConvertTrack[] {
  const [, slices] = event;
  const { videoSize, layoutKey } = metaConfig;
  const videoLayout = videoLayouts[layoutKey];
  const colsAmount = Math.ceil(Math.sqrt(videoLayout.length));
  const rowsAmount = Math.ceil(videoLayout.length / colsAmount);
  const quads = generateLayoutQuads(videoSize, rowsAmount, colsAmount).map((quad) => ({ ...quad, y: quad.y + 120 }));
  const directionToQuadMap = zipObj(videoLayout, quads);

  const convertTracks: ConvertTrack[] = values(slices)
    .map(([sliceTime, clips]) =>
      videoLayout
        .map((d) => (clips[d] ? ([d, clips[d]] as const) : null))
        .filter(isNotNil)
        .map(
          ([d, clip]): ConvertTrack => ({
            startTime: sliceTime,
            quad: directionToQuadMap[d],
            sourceMeta: clip,
          }),
        ),
    )
    .flat();
  return convertTracks;
}

function generateLayoutPositions(rows: number, cols: number) {
  const positions: Position[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      positions.push({
        x: col,
        y: row,
      });
  return positions;
}

function generateLayoutQuads(cellSize: Size, rowsAmount: number, colsAmount: number): Quad[] {
  const positions: Position[] = generateLayoutPositions(rowsAmount, colsAmount);
  const quads: Quad[] = positions.map(({ x, y }) => ({ x: x * cellSize.w, y: y * cellSize.h })).map((p): Quad => ({ ...p, ...cellSize }));
  return quads;
}
