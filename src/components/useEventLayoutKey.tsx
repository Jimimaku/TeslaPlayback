import { always, equals, ifElse, map, pipe, values } from "ramda";
import { useMemo } from "react";
import { getEventSlices, PlaybackEvent } from "../common";
import { any } from "../utils/fp/any";
import { resolveSliceLayoutKey, VideoLayoutKey } from "../utils/VideoLayoutKey";

export function useEventLayoutKey(currentEvent: PlaybackEvent) {
  return useMemo(
    () =>
      pipe(
        getEventSlices,
        values,
        map(resolveSliceLayoutKey),
        any(equals(VideoLayoutKey.HW4)),
        ifElse(Boolean, always(VideoLayoutKey.HW4), always(VideoLayoutKey.CLASSIC)),
      )(currentEvent),
    [currentEvent],
  );
}
