import { Box, CounterLabel } from "@primer/react";
import { useEffect, useMemo, useState } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEventGroup } from "../common";
import { useCurrentEventClips } from "../hooks/useCurrentClipTimestamp";
import { useCurrentEvent } from "../hooks/useCurrentEvent";
import { usePlaySibling } from "../hooks/usePlaySibling";
import { getSortedKeys } from "../utils/general";
import { processDashCamFiles } from "../utils/teslaFileSystem/processDashCamFiles";
import { MatrixPlayer } from "./MatrixPlayer";
import { ParserLogViewer } from "./ParserLogViewer";
import { SubNavs } from "./SubNavs";
import { TimestampSelect } from "./TimestampSelect";
import { FormSelect } from "./base/Select";

export function DashCamBrowser({ fileList }: { fileList: FileListLike }) {
  const { categorizedGroups, parserLog } = useMemo(() => processDashCamFiles(fileList), [fileList]);
  const availableCategories = useMemo(() => TeslaFS.clipCategories.filter((scope) => !!categorizedGroups[scope]?.length), [categorizedGroups]);
  const [focusedCategory, setFocusedCategory] = useState<TeslaFS.ClipCategory | null>(null);
  useEffect(() => {
    setFocusedCategory(availableCategories[0] || null);
  }, [availableCategories]);

  const focusedEventGroup: PlaybackEventGroup = useMemo(() => {
    if (focusedCategory === null) return eventGroup;
    return (
      categorizedGroups[focusedCategory]?.reduce((group, timestamp) => {
        group[timestamp] = eventGroup[timestamp];
        return group;
      }, {} as PlaybackEventGroup) ?? eventGroup
    );
  }, [eventGroup, focusedCategory, categorizedGroups]);
  const allEventTimestampsOrdered = useMemo(() => getSortedKeys(focusedEventGroup), [focusedEventGroup]);
  const { currentEvent, currentEventTimestamp, setCurrentEventTimestamp, currentEventTimestamps } = useCurrentEvent(
    allEventTimestampsOrdered,
    eventGroup
  );

  const { clipGroup, setCurrentClipsTimestamp } = useCurrentEventClips(currentEvent);

  const currentClipsTimestamp = clipGroup?.timestamp ?? null;
  const playSibling = usePlaySibling(
    focusedEventGroup,
    currentEventTimestamp,
    setCurrentEventTimestamp,
    currentClipsTimestamp,
    setCurrentClipsTimestamp
  );

  return (
    <>
      {parserLog.length > 0 && <ParserLogViewer parserLog={parserLog} />}
      <Box display="flex" flexDirection={["column", "column", "row"]} sx={{ gap: 1 }} overflow="auto">
        <Box as="nav" display="inline-flex" flexDirection="column" sx={{ gap: 2 }}>
          {availableCategories.length > 0 && (
            <SubNavs options={availableCategories} value={focusedCategory} onChange={(scope) => setFocusedCategory(scope)} />
          )}
          <Box display="flex" flexWrap={["wrap", "nowrap", "nowrap"]} sx={{ gap: 1 }}>
            <TimestampSelect
              sx={{ display: ["none", "none", "flex"] }}
              label={
                <>
                Events <CounterLabel>{allEventTimestampsOrdered.length}</CounterLabel>
                </>
              }
              innerSx={{ maxHeight: 600, overflowY: "auto" }}
                options={allEventTimestampsOrdered}
                renderOption={({ value: timestamp }) => TeslaFS.formatTimestamp(timestamp)}
                value={currentEventTimestamp}
                onChange={(timestamp) => {
                  setCurrentClipsTimestamp(null);
                  setCurrentEventTimestamp(timestamp);
                }}
              />
            <FormSelect
              sx={{ display: ["flex", "flex", "none"] }}
              label={
                <>
                  Events <CounterLabel>{allEventTimestampsOrdered.length}</CounterLabel>
                </>
              }
              options={allEventTimestampsOrdered}
              renderOption={({ value: timestamp }) => TeslaFS.formatTimestamp(timestamp)}
              value={currentEventTimestamp}
              onChange={(timestamp) => {
                setCurrentClipsTimestamp(null);
                setCurrentEventTimestamp(timestamp);
              }}
            />
          </Box>
        </Box>
        {/* minWidth for preventing the area grow out of view */}
        <Box as="main" flex="1" minWidth="0">
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
            value={currentClipsTimestamp}
            onChange={setCurrentClipsTimestamp}
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
              value={currentClipsTimestamp}
              onChange={setCurrentClipsTimestamp}
            />
          {clipGroup && (
            <MatrixPlayer
              eventName={clipGroup.timestamp}
              baseTime={TeslaFS.parseTimestamp(clipGroup.timestamp)}
              playSibling={playSibling}
              videos={clipGroup.clips}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
