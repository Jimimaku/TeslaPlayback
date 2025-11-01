import { useCallback } from "react";
import { PlaybackEvent } from "../common";
import { getSortedKeys } from "../utils/general";

export const usePlaySiblingSlice = ([, files]: PlaybackEvent, sliceTimestamp: string, setSliceTimestamp: ReactSet<string>) => {
  const playSliceIndex = useCallback(
    (sliceIndex: number, loop = false): void => {
      const targetEventTimestamps = getSortedKeys(files);

      // Resolve relative `clipIndex`
      // For example, if every event has 2 clips, then
      //   goTo(2, 1) => set
      //   goTo(2, -3) => goTo(1, -1) => goTo(0, 1) => set
      //   goTo(2, 3) => goTo(3, 1) => set
      //   goTo(0, -1) => fail
      if (loop) {
        if (sliceIndex < 0) {
          const fixedIndex = sliceIndex + targetEventTimestamps.length;
          if (fixedIndex < 0) return playSliceIndex(fixedIndex);
          else sliceIndex = fixedIndex;
        } else if (sliceIndex > targetEventTimestamps.length - 1) {
          const fixedIndex = sliceIndex - targetEventTimestamps.length;
          return playSliceIndex(fixedIndex);
        }
      }

      const targetClipTimestamp = targetEventTimestamps[sliceIndex];
      if (targetClipTimestamp !== sliceTimestamp) setSliceTimestamp(targetClipTimestamp);
    },
    [files, sliceTimestamp, setSliceTimestamp],
  );

  return useCallback(
    (clipOffset: number) => {
      playSliceIndex(getSortedKeys(files).indexOf(sliceTimestamp) + clipOffset);
    },
    [playSliceIndex, files, sliceTimestamp],
  );
};
