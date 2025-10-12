import { Box, Button, CounterLabel } from "@primer/react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEvent } from "../common";
import { useCurrentEventSlice } from "../hooks/useCurrentEventSlice";
import { usePlaySibling } from "../hooks/usePlaySibling";
import { resolveSliceLayoutKey, VideoLayoutKey } from "../utils/VideoLayoutKey";
import { MatrixPlayer, PlayControl } from "./MatrixPlayer";
import { MetaConfig, transformConfig, transformTracks } from "./MetaConfig";
import { TimestampSelect } from "./TimestampSelect";
import { FormSelect } from "./base/Select";
import { ExportState } from "./export/ExportState";
import { NewVideoExporter } from "./export/NewExport";
import { ExportConfiguringActions, ExportConfiguringState, useExportConfigureState } from "./export/useExportConfigureReducer";

export const EventPlayer: FC<{
  currentEvent: PlaybackEvent;
  currentEventTimestamps: string[];
}> = ({ currentEvent, currentEventTimestamps }) => {
  const { currentSliceTimestamp, setCurrentSliceTimestamp, slice } = useCurrentEventSlice(currentEvent);
  const playSibling = usePlaySibling(currentEvent, currentSliceTimestamp, setCurrentSliceTimestamp);
  const matrixPlayControlRef = useRef<PlayControl | null>(null);

  const [playTime, setPlayTime] = useState<Date | null>(null);

  const defaultVideoLayoutKey: VideoLayoutKey = useMemo(() => (slice ? resolveSliceLayoutKey(slice) : VideoLayoutKey.CLASSIC), [slice]);
  const [videoLayoutKey, setVideoLayoutKey] = useState<VideoLayoutKey>(defaultVideoLayoutKey);
  useEffect(() => {
    if (slice) {
      setVideoLayoutKey(resolveSliceLayoutKey(slice));
    }
  }, [slice]);

  const [exportConfiguringState, dispatchExportConfiguringState] = useExportConfigureState();

  const trimStart = exportConfiguringState.trimStart;
  const trimEnd = exportConfiguringState.trimEnd;

  const metaConfig: MetaConfig = useMemo(
    () => ({
      trim: trimStart && trimEnd ? [trimStart, trimEnd] : undefined,
      size: {
        w: 1280,
        h: 960,
      },
      layoutKey: videoLayoutKey,
    }),
    [trimStart, trimEnd, videoLayoutKey]
  );

  const [exportState, setExportState] = useState<ExportState>(ExportState.Idle);

  return (
    <>
      <TimestampSelect
        sx={{ display: ["none", "none", "flex"] }}
        label={
          <>
            Clips of event
            <CounterLabel>{currentEventTimestamps.length}</CounterLabel>
          </>
        }
        innerSx={{ maxHeight: 600, overflowY: "auto" }}
        options={currentEventTimestamps}
        renderOption={({ value: timestamp }) => TeslaFS.formatTimestamp(timestamp, "time")}
        value={currentSliceTimestamp}
        onChange={setCurrentSliceTimestamp}
      />
      <FormSelect
        sx={{ display: ["flex", "flex", "none"] }}
        label={
          <>
            Clips of event
            <CounterLabel>{currentEventTimestamps.length}</CounterLabel>
          </>
        }
        options={currentEventTimestamps}
        renderOption={({ value: timestamp }) => TeslaFS.formatTimestamp(timestamp, "time")}
        value={currentSliceTimestamp}
        onChange={setCurrentSliceTimestamp}
      />
      {exportState === ExportState.Idle && <Button onClick={() => setExportState(ExportState.Configuring)}>Export Video</Button>}
      {exportState === ExportState.Configuring && playTime !== null && (
        <Box display="flex" gap={2} alignItems="center">
          {exportConfiguringState.state === ExportConfiguringState.Valid && (
            <>
              <Button
                onClick={() => {
                  // set progress time to trim start
                  alert("TODO");
                }}
              >
                Preview trimmed video
              </Button>
              <Button
                onClick={() => {
                  matrixPlayControlRef.current?.pause();
                  setExportState(ExportState.Converting);
                }}
              >
                Start export
              </Button>
            </>
          )}
        </Box>
      )}
      {exportState === ExportState.Converting && (
        <NewVideoExporter
          event={currentEvent}
          convertConfig={transformConfig(metaConfig)}
          convertTracks={transformTracks(metaConfig, currentEvent)}
          onFinish={() => setExportState(ExportState.Idle)}
        />
      )}
      {slice && videoLayoutKey && (
        <MatrixPlayer
          ref={matrixPlayControlRef}
          onPlayTimeChange={setPlayTime}
          videoLayoutKey={videoLayoutKey}
          setVideoLayoutKey={setVideoLayoutKey}
          playSibling={playSibling}
          trim={exportState === ExportState.Configuring ? [trimStart, trimEnd] : undefined}
          setTrim={
            exportState === ExportState.Configuring
              ? ([start, end]) => {
                  if (start) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimStart, payload: start });
                  if (end) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimEnd, payload: end });
                }
              : undefined
          }
          slice={slice}
        />
      )}
    </>
  );
};
