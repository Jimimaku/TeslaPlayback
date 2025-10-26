import { Box, Text } from "@primer/react";
import { isNotNil, pipe, zip } from "ramda";
import { cloneElement, forwardRef, SyntheticEvent, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { directions, Directions, getEventSlices, mergeEvent, PlaybackEvent } from "../common";
import { useCurrentEventSlice } from "../hooks/useCurrentEventSlice";
import { usePlaySiblingSlice } from "../hooks/usePlaySiblingSlice";
import { useVideosLayoutCSS } from "../hooks/useVideosLayoutCSS";
import { entries } from "../utils/general";
import { formatDateTime, formatSecondsToHMS, shiftTime, timeSubtract } from "../utils/time";
import { VideoLayoutKey, videoLayouts } from "../utils/VideoLayoutKey";
import { LayoutComposer } from "./LayoutComposer";
import { PlaybackRateControl } from "./PlaybackRateControl";
import { ProgressBar } from "./ProgressBar";
import { Video, VideoProps, VideoRef } from "./Video";

function useVideoControl() {
  const ref = useRef<VideoRef | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [playEnded, setPlayEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playtime, setPlaytime] = useState(0);
  return {
    ref,
    canPlay,
    setCanPlay,
    playEnded,
    setPlayEnded,
    duration,
    setDuration,
    playtime,
    setPlaytime,
  };
}

const showPlaybackRateControl = false;

type Props = {
  event: PlaybackEvent;
  videoLayoutKey: VideoLayoutKey;
  onPlayTimeChange: (date: Date) => void;
  trim?: [Nullable<Date>, Nullable<Date>];
  setTrim?: (trim: Required<Props>["trim"]) => void;
};

export type PlayControl = {
  pause: () => void;
};

export const MatrixPlayer = forwardRef<PlayControl, Props>(({ event, videoLayoutKey, onPlayTimeChange, trim, setTrim }, ref) => {
  const mergedEvent = useMemo(() => mergeEvent(event), [event]);
  const { start: eventStart, end: eventEnd } = mergedEvent;
  const eventDuration = timeSubtract(eventEnd, eventStart);

  // player playtime update -> time -> slice
  // progress bar update -> time -> slice -> player slice

  const [currentSliceTimestamp, setCurrentSliceTimestamp, currentSlice] = useCurrentEventSlice(event);
  const playSiblingSlice = usePlaySiblingSlice(event, currentSliceTimestamp, setCurrentSliceTimestamp);

  const [sliceTime, clipFiles] = currentSlice;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const [progressBarValue, setProgressBarValue] = useState(0); // This stores progress from video and updates progress bar
  const [controlledEventProgress, setControlledEventProgress] = useState(0); // update this to control video progress programmatically

  const layoutCSS = useVideosLayoutCSS(videoLayoutKey, 3 / 4);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const controls = Object.fromEntries(directions.map((d) => [d, useVideoControl()])) as Record<Directions, ReturnType<typeof useVideoControl>>;
  const controlArray = directions.map((d) => controls[d]);

  // start playing on all can play
  const allReady = controlArray.every((c) => c.canPlay);
  useEffect(() => {
    if (allReady) {
      setIsPlaying(allReady);
    }
  }, [allReady]);

  // stop play on all ends
  const anyPlayEnds = controlArray.some((c) => c.playEnded);
  useEffect(() => {
    if (anyPlayEnds && isPlaying) {
      playSiblingSlice?.(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyPlayEnds]);

  const [slicePlaytime, setSlicePlaytime] = useState(0);
  const playtimeArray = controlArray.map((c) => c.playtime);
  useEffect(() => {
    if (playtimeArray.some(isNotNil)) {
      setSlicePlaytime(Math.max(...playtimeArray));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, playtimeArray);

  const durationArray = controlArray.map((c) => c.duration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sliceDuration = useMemo<number | null>(() => Math.max(...durationArray) ?? null, durationArray);
  useEffect(() => {
    if (sliceDuration !== null) setProgressBarValue((timeSubtract(sliceTime, eventStart) + slicePlaytime) / eventDuration);
  }, [slicePlaytime, sliceDuration, eventDuration, eventStart, sliceTime]);
  useEffect(() => {
    onPlayTimeChange(shiftTime(sliceTime, slicePlaytime));
  }, [onPlayTimeChange, sliceTime, slicePlaytime]);

  useImperativeHandle(ref, () => ({
    pause: () => setIsPlaying(false),
  }));

  const getRealTimeFromProgress = useCallback(
    (eventProgress: number) => shiftTime(eventStart, eventProgress * eventDuration),
    [eventDuration, eventStart],
  );

  const controlledSliceProgress = useMemo(() => {
    if (!eventDuration || !sliceDuration) {
      return 0;
    }

    const slicePlayRealTime = getRealTimeFromProgress(controlledEventProgress);
    return timeSubtract(slicePlayRealTime, sliceTime) / sliceDuration;
  }, [eventDuration, sliceDuration, getRealTimeFromProgress, controlledEventProgress, sliceTime]);

  const getVideoProps = (control: ReturnType<typeof useVideoControl>): VideoProps => ({
    play: isPlaying,
    playbackRate,
    progress: controlledSliceProgress,
    native: {
      autoPlay: true,
      onEnded: () => control.setPlayEnded(true),
      onCanPlay: (e: SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        control.setCanPlay(true);
        control.setDuration(video.duration * 1000);
      },
      onTimeUpdate: (e: SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (video?.readyState >= video.HAVE_METADATA) {
          control.setPlaytime(video.currentTime * 1000);
        }
      },
      // onPlay: () => setIsPlaying(true), // disabling along with `onPause`
      // onPause: () => setIsPlaying(false), // This may trigger earlier than `onEnded`
      // onAbort: () => setIsPlaying(false), // This would trigger on switch video source
      // onSuspend: () => setIsPlaying(false), // This would trigger on start playing
    },
  });

  const progressToTime = (t: number): Date => shiftTime(eventStart, t * eventDuration);
  const onTrimChange = (_: number, v: [number, number]) => sliceDuration && setTrim?.(v.map(progressToTime) as [Date | null, Date | null]);

  return (
    <Box display="flex" flexDirection="column" border="1px solid transparent" borderColor={"canvas.default"} sx={{ gap: 4 }}>
      <Box display="inline-flex" alignItems="center" sx={{ gap: 3, "> *": { flexShrink: 0 } }} flexWrap="wrap">
        <Box display="inline-flex" alignItems="center" flex="1" sx={{ gap: 1 }}>
          <ProgressBar
            sx={{ flex: 1 }}
            getCaretLabel={pipe(progressToTime, formatDateTime)}
            value={progressBarValue}
            onDrag={async (endPromise) => {
              if (!isPlaying) return;

              setIsPlaying(false);
              await endPromise;
              setIsPlaying(true);
            }}
            onChange={(progress) => {
              // on dragging the progress bar dot
              setProgressBarValue(progress); // Update in time for smoother dragging
              setControlledEventProgress(progress);

              const realTime = getRealTimeFromProgress(progress);
              const targetSlice = mergedEvent.sliceArray.find(([sliceTime]) => {
                const sliceEndTime = shiftTime(sliceTime, sliceDuration ?? 0);
                return realTime >= sliceTime && realTime < sliceEndTime;
              });
              if (targetSlice && targetSlice !== currentSlice) {
                const targetSliceTimestamp = entries(getEventSlices(event)).find(([, s]) => s === targetSlice)?.[0];
                if (targetSliceTimestamp) setCurrentSliceTimestamp(targetSliceTimestamp);
              }
            }}
            range={
              trim && sliceDuration != null
                ? [
                    sliceDuration,
                    ...(zip(trim, [eventStart, eventEnd])
                      .map(([t, defaultTimestamp]) => t ?? defaultTimestamp)
                      .map((t) => timeSubtract(t, eventStart))
                      .map((t) => t / sliceDuration) as [number, number]),
                  ]
                : undefined
            }
            onStartChange={onTrimChange}
            onEndChange={onTrimChange}
          />
          <Text fontFamily="mono">
            {formatSecondsToHMS((timeSubtract(sliceTime, eventStart) + slicePlaytime) / 1000)}/{formatSecondsToHMS(eventDuration / 1000)}
          </Text>
        </Box>
        <Box display="inline-flex" alignItems="center" sx={{ gap: 2 }}>
          {showPlaybackRateControl && <PlaybackRateControl playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />}
        </Box>
      </Box>
      <Box bg="neutral.muted" position="relative" borderWidth={1} borderStyle="solid" borderColor="border.default" borderRadius={4}>
        <Box p={0} bg="#000" lineHeight="1" display="flex" justifyContent="center" alignItems="center">
          <Text color="#fff" fontFamily="mono" fontSize="18px">
            {formatDateTime(shiftTime(sliceTime, slicePlaytime))}
          </Text>
        </Box>
        <Box position="relative">
          <LayoutComposer
            style={layoutCSS.container}
            decorator={(element, index) =>
              cloneElement(element, {
                ...element.props,
                style: {
                  ...element.props.style,
                  ...layoutCSS.children[index],
                },
              })
            }
          >
            {videoLayouts[videoLayoutKey].map((d) => (
              <div key={d}>
                <Video label={`camera-view-${d}`} ref={controls[d].ref} file={clipFiles[d]} {...getVideoProps(controls[d])} />
              </div>
            ))}
          </LayoutComposer>
        </Box>
      </Box>
    </Box>
  );
});
