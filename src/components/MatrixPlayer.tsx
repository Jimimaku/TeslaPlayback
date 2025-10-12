import { ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, PlayIcon, VersionsIcon } from "@primer/octicons-react";
import { Box, Checkbox, FormControl, IconButton, Text } from "@primer/react";
import { zip } from "ramda";
import { cloneElement, forwardRef, SyntheticEvent, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { directions, Directions, PlaybackEventSlice } from "../common";
import { useVideosLayoutCSS } from "../hooks/useVideosLayoutCSS";
import { formatDateTime, formatHMS, shiftTime } from "../utils/general";
import { layoutKeys, VideoLayoutKey, videoLayouts } from "../utils/VideoLayoutKey";
import { DropdownSelect } from "./DropdownSelect";
import { LayoutComposer } from "./LayoutComposer";
import { PlaybackRateControl } from "./PlaybackRateControl";
import { ProgressBar } from "./ProgressBar";
import { Video, VideoRef } from "./Video";

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

const showLayoutSelect = false;
const showPlayModeControl = false;
const showPlaybackRateControl = false;

type Props = {
  slice: PlaybackEventSlice;
  playSibling?: (offset: 1 | -1) => void;
  videoLayoutKey: VideoLayoutKey;
  setVideoLayoutKey: (key: VideoLayoutKey) => void;
  onPlayTimeChange: (date: Date) => void;
  trim?: [Date | null, Date | null];
  setTrim?: (trim: [Date | null, Date | null]) => void;
};

export type PlayControl = {
  pause: () => void;
};

export const MatrixPlayer = forwardRef<PlayControl, Props>(
  ({ slice, playSibling, videoLayoutKey, setVideoLayoutKey, onPlayTimeChange, trim, setTrim }, ref) => {
    const [sliceTime, clipFiles] = slice;

    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isAutoPlay, setIsAutoPlay] = useState<boolean>(isPlaying); // should equal on initial
    const [playbackRate, setPlaybackRate] = useState<number>(1);

    const [progressBarValue, setProgressBarValue] = useState(0); // This stores progress from video and updates progress bar
    const [controlledProgress, setControlledProgress] = useState(progressBarValue); // update this to control video progress programmatically
    useEffect(() => {
      if (controlledProgress !== progressBarValue) {
        setProgressBarValue(controlledProgress);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlledProgress]);

    const layoutCSS = useVideosLayoutCSS(videoLayoutKey, 3 / 4);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const controls = Object.fromEntries(directions.map((d) => [d, useVideoControl()])) as Record<Directions, ReturnType<typeof useVideoControl>>;
    const controlArray = directions.map((d) => controls[d]);

    // start playing on all can play
    const allReady = controlArray.every((c) => c.canPlay);
    useEffect(() => {
      if (allReady) {
        setIsPlaying(isAutoPlay);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allReady]);

    // stop play on all ends
    const anyPlayEnds = controlArray.some((c) => c.playEnded);
    useEffect(() => {
      if (anyPlayEnds) {
        if (isPlaying && isAutoPlay) {
          playSibling?.(1);
          setProgressBarValue(0);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anyPlayEnds]);

    const [playtime, setPlaytime] = useState(0);
    const playtimeArray = controlArray.map((c) => c.playtime);
    useEffect(() => {
      if (playtimeArray.some(Boolean)) {
        setPlaytime(Math.max(...playtimeArray));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, playtimeArray);

    const durationArray = controlArray.map((c) => c.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const duration = useMemo<number | null>(() => Math.max(...durationArray) ?? null, durationArray);
    useEffect(() => {
      if (duration !== null) setProgressBarValue(playtime / duration);
    }, [playtime, duration]);
    useEffect(() => {
      onPlayTimeChange(new Date(sliceTime.getTime() + playtime * 1000));
    }, [onPlayTimeChange, sliceTime, playtime]);

    const playSiblingAndUpdateControl = (offset: 1 | -1) => {
      playSibling?.(offset);
      setPlaytime(0);
      setIsPlaying(isAutoPlay);
      setProgressBarValue(0);
    };

    useImperativeHandle(ref, () => ({
      pause: () => setIsPlaying(false),
    }));

    const getVideoProps = (control: ReturnType<typeof useVideoControl>) => ({
      play: isPlaying,
      playbackRate,
      progress: controlledProgress,
      native: {
        autoPlay: isAutoPlay,
        onEnded: () => control.setPlayEnded(true),
        onCanPlay: (e: SyntheticEvent<HTMLVideoElement>) => {
          control.setCanPlay(true);
          control.setDuration(e.currentTarget.duration);
        },
        onTimeUpdate: (e: SyntheticEvent<HTMLVideoElement>) => {
          const video = e.currentTarget;
          if (video) {
            if (video.readyState >= video.HAVE_METADATA) {
              control.setPlaytime(video.currentTime);
            }
          }
        },
        // onPlay: () => setIsPlaying(true), // disabling along with `onPause`
        // onPause: () => setIsPlaying(false), // This may trigger earlier than `onEnded`
        // onAbort: () => setIsPlaying(false), // This would trigger on switch video source
        // onSuspend: () => setIsPlaying(false), // This would trigger on start playing
      },
    });

    const onTrimChange = (_: number, v: [number, number]) =>
      duration && setTrim?.(v.map((t) => new Date(+sliceTime + t * duration * 1000)) as [Date | null, Date | null]);

    return (
      <Box display="flex" flexDirection="column" border="1px solid transparent" borderColor={"canvas.default"} sx={{ gap: 4 }}>
        <Box display="inline-flex" alignItems="center" sx={{ gap: 3, "> *": { flexShrink: 0 } }} flexWrap="wrap">
          <Box display="inline-flex" alignItems="center" sx={{ gap: 1 }}>
            <IconButton aria-label={"Previous"} onClick={() => playSiblingAndUpdateControl(-1)} icon={ChevronLeftIcon} />
            <IconButton
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => setIsPlaying(!isPlaying)}
              icon={isPlaying ? ColumnsIcon : PlayIcon}
            />
            <IconButton aria-label={"Next"} onClick={() => playSiblingAndUpdateControl(1)} icon={ChevronRightIcon} />
          </Box>
          <Box display="inline-flex" alignItems="center" flex="1" sx={{ gap: 1 }}>
            {trim ? (
              <ProgressBar
                sx={{ flex: 1 }}
                getCaretLabel={(value) => (duration ? formatDateTime(new Date(+sliceTime + value * duration * 1000)) : "")}
                value={progressBarValue}
                onDragStart={async (endPromise) => {
                  if (!isPlaying) return;

                  setIsPlaying(false);
                  await endPromise;
                  setIsPlaying(true);
                }}
                onChange={(progress) => {
                  // on dragging the progress bar dot
                  setProgressBarValue(progress); // Update in time for smoother dragging
                  setControlledProgress(progress);
                }}
                range={
                  duration != null
                    ? [
                        duration * 1000,
                        ...(zip(trim, [sliceTime, +sliceTime + duration * 1000])
                          .map(([t, defaultTimestamp]) => t ?? defaultTimestamp)
                          .map((t) => +t - +sliceTime)
                          .map((t) => t / duration / 1000) as [number, number]),
                      ]
                    : undefined
                }
                onStartChange={onTrimChange}
                onEndChange={onTrimChange}
              />
            ) : (
              <ProgressBar
                sx={{ flex: 1 }}
                getCaretLabel={(value) => (duration ? formatDateTime(new Date(+sliceTime + value * duration * 1000)) : "")}
                value={progressBarValue}
                onDragStart={async (endPromise) => {
                  if (!isPlaying) return;

                  setIsPlaying(false);
                  await endPromise;
                  setIsPlaying(true);
                }}
                onChange={(progress) => {
                  // on dragging the progress bar dot
                  setProgressBarValue(progress); // Update in time for smoother dragging
                  setControlledProgress(progress);
                }}
              />
            )}
            <Text fontFamily="mono">
              {formatHMS(playtime)}/{duration ? formatHMS(duration) : "..."}
            </Text>
          </Box>
          <Box display="inline-flex" alignItems="center" sx={{ gap: 2 }}>
            {showPlaybackRateControl && <PlaybackRateControl playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />}
            {showLayoutSelect && (
              <DropdownSelect<VideoLayoutKey>
                title={
                  <>
                    <VersionsIcon /> {videoLayoutKey}
                  </>
                }
                options={layoutKeys}
                value={videoLayoutKey}
                onChange={setVideoLayoutKey}
              />
            )}
            {showPlayModeControl && (
              <FormControl sx={{ alignItems: "center" }}>
                <Checkbox checked={isAutoPlay} onChange={() => setIsAutoPlay(!isAutoPlay)} />
                <FormControl.Label sx={{ whiteSpace: "nowrap" }}>Auto Play</FormControl.Label>
              </FormControl>
            )}
          </Box>
        </Box>
        <Box bg="neutral.muted" position="relative" borderWidth={1} borderStyle="solid" borderColor="border.default" borderRadius={4}>
          <Box p={0} bg="#000" lineHeight="1" display="flex" justifyContent="center" alignItems="center">
            <Text color="#fff" fontFamily="mono" fontSize="18px">
              {formatDateTime(shiftTime(sliceTime, playtime))}
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
  }
);
