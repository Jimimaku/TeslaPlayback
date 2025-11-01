import { isNotNil, map, pipe, values } from "ramda";
import { useCallback, useMemo, useState } from "react";
import { Directions } from "../common";
import { VideoLayoutKey } from "../utils/VideoLayoutKey";
import { mapInfinity } from "../utils/general";

/**
 * ```md
 * |scenario|initialing|canPlay|playEnded|
 * |--------|----------|-------|---------|
 * |initial |     true |false  |false    |
 * |ready   |    false |true   |false    |
 * |ended   |    false |true   |true     |
 * |error   |    false |false  |false    |
 * ```
 */
export function useVideoControl() {
  const [initialing, setInitialing] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const [playEnded, setPlayEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playtime, setPlaytime] = useState(0);
  const [error, setError] = useState<MediaError | null>(null);
  const states = useMemo(
    () => ({
      initialing,
      canPlay,
      playEnded,
      duration,
      playtime,
      error,
    }),
    [initialing, canPlay, playEnded, duration, playtime, error],
  );

  const setStates = useCallback((newStates: Partial<typeof states>) => {
    setInitialing((prev) => newStates.initialing ?? prev);
    setCanPlay((prev) => newStates.canPlay ?? prev);
    setPlayEnded((prev) => newStates.playEnded ?? prev);
    setDuration((prev) => newStates.duration ?? prev);
    setPlaytime((prev) => newStates.playtime ?? prev);
    setError((prev) => ("error" in newStates ? newStates.error ?? null : prev));
  }, []);

  return useMemo(() => ({ states, setStates }), [states, setStates]);
}

export type VideoControl = ReturnType<typeof useVideoControl>;
export type VideoControlMap = {
  [key in Directions]?: VideoControl["states"] | null;
};

export function useAllDirectionsVideoControls(videoLayoutKey: VideoLayoutKey) {
  const [controls, setControls] = useState<VideoControlMap>(
    {
      [VideoLayoutKey.HW4]: {
        [Directions.front]: null,
        [Directions.rear]: null,
        [Directions.left]: null,
        [Directions.right]: null,
        [Directions.leftPillar]: null,
        [Directions.rightPillar]: null,
      },
      [VideoLayoutKey.CLASSIC]: {
        [Directions.front]: null,
        [Directions.rear]: null,
        [Directions.left]: null,
        [Directions.right]: null,
      },
    }[videoLayoutKey],
  );

  const updateControl = useCallback(
    (direction: Directions, controlState: VideoControl["states"]) => setControls((prev) => ({ ...prev, [direction]: controlState })),
    [],
  );

  return { controls, updateControl };
}

export const mapControls = <R,>(controls: VideoControlMap, mapper: (c?: VideoControl["states"] | null) => R) =>
  pipe(values<VideoControlMap>, map(mapper))(controls);

export const useMapControls = <R,>(controls: VideoControlMap, mapper: (c?: VideoControl["states"] | null) => R) =>
  useMemo(() => mapControls<R>(controls, mapper), [controls, mapper]);

export function useX(controls: VideoControlMap) {
  // start playing on all can play
  const canPlay = useMapControls(controls, (c) => c?.canPlay ?? false);
  const allCanPlay: boolean = canPlay.every(Boolean);

  // stop play on all ends
  const playEnded = useMapControls(controls, (c) => {
    if (c) {
      const { initialing, canPlay, playEnded, error } = c;
      if (initialing) return false;
      if (error || (canPlay && playEnded)) return true;
      return false;
    }

    return false;
  });
  const allPlayEnded: boolean = playEnded.every(Boolean);

  const playtimeArray = useMapControls(controls, (c) => (c?.canPlay ? c?.playtime : null));
  const playtime: number = useMemo(() => mapInfinity(Math.min(...playtimeArray.filter(isNotNil))), [playtimeArray]);

  const durationArray = useMapControls(controls, (c) => c?.duration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const duration: number = useMemo(() => mapInfinity(Math.max(...durationArray.filter(isNotNil))), durationArray);

  return { allCanPlay, allPlayEnded, playtime, duration };
}
