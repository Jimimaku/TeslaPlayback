import { CSSProperties, useMemo } from "react";
import { VideoLayoutKey } from "../utils/VideoLayoutKey";

type LayoutMap<Key extends string> = Record<
  Key,
  {
    container: CSSProperties;
    children: CSSProperties[];
  }
>;

function generateLayoutMaps<Key extends string>(raw: Record<Key, number[][]>, aspectRatio: number): LayoutMap<Key> {
  return Object.entries(raw).reduce((merged, [key, layout]) => {
    const [rows, cols] = layout.reduce(
      ([rows, cols], [col, row, width, height]) => [Math.max(rows, row + height), Math.max(cols, col + width)],
      [0, 0],
    );
    merged[key] = {
      container: {
        width: "100%",
        height: `${(100 * rows * aspectRatio) / cols}%`,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      },
      children: layout.map(([col, row, width, height]) => ({
        gridColumnStart: 1 + col,
        gridColumnEnd: 1 + col + width,
        gridRowStart: 1 + row,
        gridRowEnd: 1 + row + height,
      })),
    };
    return merged;
  }, {} as LayoutMap<Key>);
}

export function useVideosLayoutCSS(layout: VideoLayoutKey, aspectRatio: number) {
  const layoutMaps = useMemo(() => generateLayoutMaps(videoLayoutFlexConfig, aspectRatio), [aspectRatio]);
  return layoutMaps[layout];
}
export const videoLayoutFlexConfig: {
  [key in VideoLayoutKey]: [x: number, y: number, width: number, height: number][];
} = {
  [VideoLayoutKey.CLASSIC]: [
    [0, 0, 1, 1],
    [1, 0, 1, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 1],
  ],
  [VideoLayoutKey.HW4]: [
    [0, 0, 1, 1],
    [1, 0, 1, 1],
    [2, 0, 1, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 1],
    [2, 1, 1, 1],
  ],
};
