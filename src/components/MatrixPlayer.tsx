import { ColumnsIcon, PlayIcon } from "@primer/octicons-react";
import { Box, IconButton, Text } from "@primer/react";
import { pipe, zip } from "ramda";
import { cloneElement, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { IIFC } from "react-iifc";
import { getEventSlices, mergeEvent, PlaybackEvent } from "../common";
import { useCurrentEventSlice } from "../hooks/useCurrentEventSlice";
import { usePlaySiblingSlice } from "../hooks/usePlaySiblingSlice";
import { useVideosLayoutCSS } from "../hooks/useVideosLayoutCSS";
import { entries } from "../utils/general";
import { formatDateTime, formatSecondsToHMS, shiftTime, timeSubtract } from "../utils/time";
import { VideoLayoutKey, videoLayouts } from "../utils/VideoLayoutKey";
import { LayoutComposer } from "./LayoutComposer";
import { PlaybackRateControl } from "./PlaybackRateControl";
import { ProgressBar } from "./ProgressBar";
import { useAllDirectionsVideoControls, useX, VideoControl } from "./useVideoControl";
import { Video } from "./Video";

const showPlaybackRateControl = false;

type Props = {
  event: PlaybackEvent;
  videoLayoutKey: VideoLayoutKey;
  trim?: [Nullable<Date>, Nullable<Date>];
  setTrim?: (trim: Required<Props>["trim"]) => void;
};

export type PlayControl = {
  pause: () => void;
};

export const MatrixPlayer = forwardRef<PlayControl, Props>(({ event, videoLayoutKey, trim, setTrim }, ref) => {
  const mergedEvent = useMemo(() => mergeEvent(event), [event]);
  const { start: eventStart, end: eventEnd } = mergedEvent;
  const eventDuration = timeSubtract(eventEnd, eventStart);

  // player playtime update -> time -> slice
  // progress bar update -> time -> slice -> player slice

  const [currentSliceTimestamp, setCurrentSliceTimestamp, currentSlice] = useCurrentEventSlice(event);

  const { controls, updateControl } = useAllDirectionsVideoControls(videoLayoutKey);
  const { allCanPlay, allPlayEnded, playtime: slicePlaytime, duration: sliceDuration } = useX(controls);

  const [sliceTime, clipFiles] = currentSlice;
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [controlledEventProgress, setControlledEventProgress] = useState(0); // update this to control video progress programmatically
  const layoutCSS = useVideosLayoutCSS(videoLayoutKey, 3 / 4);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  useEffect(() => {
    if (allCanPlay) {
      setIsPlaying(allCanPlay);
    }
  }, [allCanPlay]);
  const playSiblingSlice = usePlaySiblingSlice(event, currentSliceTimestamp, setCurrentSliceTimestamp);
  useEffect(() => {
    if (allPlayEnded && isPlaying) {
      playSiblingSlice?.(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlayEnded]);

  const [progressBarValue, setProgressBarValue] = useState(0); // This stores progress from video and updates progress bar
  const realPlaytime = timeSubtract(sliceTime, eventStart) + slicePlaytime;
  useEffect(() => {
    setProgressBarValue(realPlaytime / eventDuration);
  }, [realPlaytime, eventDuration]);

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

  const progressToTime = useCallback((t: number): Date => shiftTime(eventStart, t * eventDuration), [eventDuration, eventStart]);
  const onTrimChange = useCallback(
    (_: number, v: [number, number]) => setTrim?.(v.map(progressToTime) as [Date | null, Date | null]),
    [setTrim, progressToTime],
  );
  useEffect(() => {
    if (setTrim) setTrim([shiftTime(eventStart, 0 * 1000), shiftTime(eventEnd, 0 * 1000)]);
  }, [setTrim, eventStart, eventEnd]);

  return (
    <Box display="flex" flexDirection="column" border="1px solid transparent" borderColor={"canvas.default"} sx={{ gap: 4 }}>
      <Box display="inline-flex" alignItems="center" sx={{ gap: 3, "> *": { flexShrink: 0 } }} flexWrap="wrap">
        <Box display="inline-flex" alignItems="center" flex="1" sx={{ gap: 3 }}>
          {isPlaying ? (
            <IconButton onClick={() => setIsPlaying(!isPlaying)} aria-label="Pause" icon={ColumnsIcon} />
          ) : (
            <IconButton onClick={() => setIsPlaying(!isPlaying)} aria-label="Play" icon={PlayIcon} />
          )}
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
              trim
                ? ([
                    eventDuration,
                    ...zip(trim, [eventStart, eventEnd])
                      .map(([t, defaultTimestamp]) => t ?? defaultTimestamp)
                      .map((t) => timeSubtract(t, eventStart))
                      .map((t) => t / eventDuration),
                  ] as [number, number, number])
                : undefined
            }
            onStartChange={onTrimChange}
            onEndChange={onTrimChange}
          />
          <Text fontFamily="mono">
            {formatSecondsToHMS(realPlaytime / 1000)}/{formatSecondsToHMS(eventDuration / 1000)}
          </Text>
        </Box>
        {showPlaybackRateControl && (
          <Box display="inline-flex" alignItems="center" sx={{ gap: 2 }}>
            <PlaybackRateControl playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />
          </Box>
        )}
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
                <IIFC>
                  {() => (
                    <Video
                      label={`camera-view-${d}`}
                      file={clipFiles[d]}
                      play={isPlaying}
                      playbackRate={playbackRate}
                      progress={controlledSliceProgress}
                      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
                      onControl={useCallback((control: VideoControl["states"]) => updateControl(d, control), [d, updateControl])}
                    />
                  )}
                </IIFC>
              </div>
            ))}
          </LayoutComposer>
        </Box>
      </Box>
    </Box>
  );
});
