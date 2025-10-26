import { useMemo, useState } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEvent, PlaybackEventSlice } from "../common";
import { entries } from "../utils/general";

const getFirstTimestampFromSlices = (slices: Record<string, PlaybackEventSlice>) => {
  const earliestSlice = entries(slices)
    .sort(([, [a]], [, [b]]) => +a - +b)
    .at(0);
  if (!earliestSlice) {
    throw new Error("No slices available in the event");
  }
  const [timestamp] = earliestSlice;
  return timestamp;
};

export function useCurrentEventSlice([, slices]: PlaybackEvent) {
  const defaultSliceTimeStamp = useMemo(() => getFirstTimestampFromSlices(slices), [slices]);
  const [currentSliceTimestamp, setCurrentSliceTimestamp] = useState<TeslaFS.Timestamp>(() => defaultSliceTimeStamp);

  return [currentSliceTimestamp, setCurrentSliceTimestamp, slices[currentSliceTimestamp] ?? slices[defaultSliceTimeStamp]] as const;
}
