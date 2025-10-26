import { useMemo } from "react";
import { PlaybackEvents } from "../common";
import { getSortedKeys } from "../utils/general";

export function useCurrentEvent(currentEventTimestamp: string | null, playbackEvents: PlaybackEvents) {
  const currentEvent = useMemo(
    () => (currentEventTimestamp && playbackEvents[currentEventTimestamp]) || null,
    [currentEventTimestamp, playbackEvents],
  );
  const currentEventTimestamps = useMemo(() => {
    if (currentEvent) {
      const [, slices] = currentEvent;
      return getSortedKeys(slices);
    } else {
      return [];
    }
  }, [currentEvent]);
  return {
    currentEvent,
    currentEventTimestamps,
  };
}
