import { useEffect, useMemo, useState } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEvent } from "../common";
import { getSortedKeys } from "../utils/general";

export function useCurrentEventSlice([, slices]: PlaybackEvent) {
  const currentEventTimestamps = useMemo(() => getSortedKeys(slices), [slices]);
  const [currentSliceTimestamp, setCurrentSliceTimestamp] = useState<TeslaFS.Timestamp | null>(null);
  useEffect(() => {
    // Only trigger on first load or after manual reset, so this does not set clip index to first when nav with play control
    const [timestamp] = currentEventTimestamps;
    setCurrentSliceTimestamp(timestamp ?? null);
  }, [currentEventTimestamps]);

  return {
    currentSliceTimestamp,
    slice: (currentSliceTimestamp && slices?.[currentSliceTimestamp]) || null,
    setCurrentSliceTimestamp,
  };
}
