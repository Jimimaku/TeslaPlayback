import { ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, PlayIcon, VersionsIcon } from "@primer/octicons-react";
import { Box, Checkbox, FormControl, IconButton, Text } from "@primer/react";
import { cloneElement, FC, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { directions, Directions, PlaybackEventSlice } from "../common";
import { LayoutKey, layoutKeys, useVideosLayout } from "../hooks/useVideosLayout";
import { formatDateTime, formatHMS, shiftTime } from "../utils/general";
import { DropdownSelect } from "./DropdownSelect";
import { VideoExporter } from "./export";
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

const videoLayouts = {
  legacy: [Directions.front, Directions.rear, Directions.left, Directions.right],
  hw4: [Directions.left, Directions.front, Directions.right, Directions.leftPillar, Directions.rear, Directions.rightPillar],
};

const showLayoutSelect = false;
const showPlayModeControl = false;
const showPlaybackRateControl = false;

export const MatrixPlayer: FC<{
  clips: PlaybackEventSlice;
  playSibling?: (offset: 1 | -1) => void;
}> = ({ clips, playSibling }) => {
  const [baseTime, videos] = clips;
  const isHW4VideoLayout = !!(videos.left_pillar ?? videos.right_pillar);
  const videoLayout = isHW4VideoLayout ? videoLayouts.hw4 : videoLayouts.legacy;

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

  const desiredLayoutKey: LayoutKey = isHW4VideoLayout ? "2/2/2" : "2/2";
  const [layoutKey, setLayoutKey] = useState<LayoutKey>(desiredLayoutKey);
  useEffect(() => {
    if (layoutKey !== desiredLayoutKey) setLayoutKey(desiredLayoutKey);
  }, [layoutKey, desiredLayoutKey]);
  const layout = useVideosLayout(layoutKey, 3 / 4);

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
  const duration = useMemo(() => Math.max(...durationArray) || 0, durationArray);
  useEffect(() => {
    setProgressBarValue(playtime / (duration ?? 1));
  }, [playtime, duration]);

  const playSiblingAndUpdateControl = (offset: 1 | -1) => {
    playSibling?.(offset);
    setPlaytime(0);
    setIsPlaying(isAutoPlay);
    setProgressBarValue(0);
  };

  const shouldContinuePlayingOnDragEnd = useRef(false);

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

  return (
    <Box display="flex" flexDirection="column" border="1px solid transparent" borderColor={"canvas.default"} sx={{ gap: 4 }}>
      <Box display="inline-flex" alignItems="center" sx={{ gap: 3, "> *": { flexShrink: 0 } }} flexWrap="wrap">
        <Box display="inline-flex" alignItems="center" sx={{ gap: 1 }}>
          <IconButton aria-label={"Previous"} onClick={() => playSiblingAndUpdateControl(-1)} icon={ChevronLeftIcon} />
          <IconButton aria-label={isPlaying ? "Pause" : "Play"} onClick={() => setIsPlaying(!isPlaying)} icon={isPlaying ? ColumnsIcon : PlayIcon} />
          <IconButton aria-label={"Next"} onClick={() => playSiblingAndUpdateControl(1)} icon={ChevronRightIcon} />
        </Box>
        <Box display="inline-flex" alignItems="center" flex="1" sx={{ gap: 1 }}>
          <Text fontFamily="mono">
            {formatHMS(playtime)}/{formatHMS(duration)}
          </Text>
          <ProgressBar
            native={{ style: { flex: 1 } }}
            value={progressBarValue}
            onDragStart={() => {
              if (isPlaying) {
                setIsPlaying(false);
              }
              shouldContinuePlayingOnDragEnd.current = isPlaying;
            }}
            onDragEnd={() => {
              if (shouldContinuePlayingOnDragEnd.current) {
                setIsPlaying(true);
              }
            }}
            onChange={(progress) => {
              // on dragging the progress bar dot
              setProgressBarValue(progress); // Update in time for smoother dragging
              setControlledProgress(progress);
            }}
          />
        </Box>
        <Box display="inline-flex" alignItems="center" sx={{ gap: 2 }}>
          {showPlaybackRateControl && <PlaybackRateControl playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />}
          {showLayoutSelect && (
            <DropdownSelect<LayoutKey>
              title={
                <>
                  <VersionsIcon /> {layoutKey}
                </>
              }
              options={layoutKeys.map((key) => ({
                value: key,
                label: key,
              }))}
              value={layoutKey}
              onChange={setLayoutKey}
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
            {formatDateTime(shiftTime(baseTime, playtime))}
          </Text>
        </Box>
        <Box position="relative">
          <LayoutComposer
            style={layout.container}
            decorator={(index, element) =>
              cloneElement(element, {
                ...element.props,
                style: {
                  ...element.props.style,
                  ...layout.children[index],
                },
              })
            }
          >
            {videoLayout.map((d) => (
              <div key={d}>
                <Video label={`camera-view-${d}`} ref={controls[d].ref} file={videos[d]} {...getVideoProps(controls[d])} />
              </div>
            ))}
          </LayoutComposer>
        </Box>
      </Box>
      <Box>
        <VideoExporter
          totalTime={duration}
          clips={clips}
          videoPlayControl={{
            pause: () => setIsPlaying(false),
          }}
        />
      </Box>
    </Box>
  );
};
