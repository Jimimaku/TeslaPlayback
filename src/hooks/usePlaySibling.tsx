import { useMemo } from "react";
import { PlaybackEvent } from "../common";
import { getSortedKeys } from "../utils/general";

export function usePlaySibling(event: PlaybackEvent, sliceTimestamp: string | null, setSliceTimestamp: ReactSet<string | null>) {
  const [, files] = event;
  const currentEventTimestamps = useMemo(() => getSortedKeys(files), [files]);
  return useMemo(() => {
    if (sliceTimestamp === null) return;

    const currentClipIndex = currentEventTimestamps.indexOf(sliceTimestamp);

    if (currentClipIndex === -1) return;

    return (clipOffset: number) => {
      const goTo = (sliceIndex: number): void => {
        const targetEventTimestamps = getSortedKeys(files);

        // Resolve relative `clipIndex`
        // For example, if every event has 2 clips, then
        //   goTo(2, 1) => set
        //   goTo(2, -3) => goTo(1, -1) => goTo(0, 1) => set
        //   goTo(2, 3) => goTo(3, 1) => set
        //   goTo(0, -1) => fail
        if (sliceIndex < 0) {
          const fixedIndex = sliceIndex + targetEventTimestamps.length;
          if (fixedIndex < 0) return goTo(fixedIndex);
          else sliceIndex = fixedIndex;
        } else if (sliceIndex > targetEventTimestamps.length - 1) {
          const fixedIndex = sliceIndex - targetEventTimestamps.length;
          return goTo(fixedIndex);
        }
        const targetClipTimestamp = targetEventTimestamps[sliceIndex];

        if (targetClipTimestamp !== sliceTimestamp) setSliceTimestamp(targetClipTimestamp);
      };

      // for the first run, adjust eventIndex if clipIndex is negative
      const targetClipIndex = currentClipIndex + clipOffset;
      if (targetClipIndex < 0) goTo(targetClipIndex);
      else goTo(targetClipIndex);
    };
  }, [files, sliceTimestamp, currentEventTimestamps, setSliceTimestamp]);
}
