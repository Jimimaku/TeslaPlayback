import { CounterLabel } from "@primer/react";
import { FC } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEvent } from "../common";
import { useCurrentEventSlice } from "../hooks/useCurrentEventSlice";
import { usePlaySibling } from "../hooks/usePlaySibling";
import { MatrixPlayer } from "./MatrixPlayer";
import { TimestampSelect } from "./TimestampSelect";
import { FormSelect } from "./base/Select";

export const EventPlayer: FC<{
  currentEvent: PlaybackEvent;
  currentEventTimestamps: string[];
}> = ({ currentEvent, currentEventTimestamps }) => {
  const { currentSliceTimestamp, setCurrentSliceTimestamp, sliceClips } = useCurrentEventSlice(currentEvent);
  const playSibling = usePlaySibling(currentEvent, currentSliceTimestamp, setCurrentSliceTimestamp);

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
      {sliceClips && <MatrixPlayer playSibling={playSibling} clips={sliceClips} />}
    </>
  );
};
