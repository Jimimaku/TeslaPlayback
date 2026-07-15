import { Box, CounterLabel } from "@primer/react";
import { pipe } from "ramda";
import { FC, useEffect, useMemo, useState } from "react";
import { TeslaFS } from "../TeslaFS";
import { PlaybackEvents } from "../common";
import { useCurrentEvent } from "../hooks/useCurrentEvent";
import { getDescendingSortedKeys } from "../utils/general";
import { processDashCamFiles } from "../utils/teslaFileSystem/processDashCamFiles";
import { EventPlayer } from "./EventPlayer";
import { ParserLogViewer } from "./ParserLogViewer";
import { SubNavs } from "./SubNavs";
import { TimestampSelect } from "./TimestampSelect";
import { FormSelect } from "./base/Select";

type Props = {
  loadFilesButton: React.ReactNode;
  fileList: FileListLike;
};

export const DashCamBrowser: FC<Props> = ({ loadFilesButton, fileList }) => {
  // files -> categories
  const { categories, parserLog } = useMemo(() => processDashCamFiles(fileList), [fileList]);

  // categories -> events
  const categoryList = useMemo(() => TeslaFS.clipCategories.filter((scope) => !!Object.keys(categories[scope] || {}).length), [categories]);
  const [activeCategory, setActiveCategory] = useState<TeslaFS.ClipCategory>(TeslaFS.ClipCategory.Unknown);
  const activeEvents: PlaybackEvents = categories[activeCategory];
  const activeEventsTimestamps = useMemo(() => getDescendingSortedKeys(activeEvents), [activeEvents]);
  useEffect(() => {
    const [firstAvailableCategory] = categoryList;
    setActiveCategory(firstAvailableCategory ?? TeslaFS.ClipCategory.Unknown);
  }, [categoryList]);

  // events -> current event
  const [currentEventTimestamp, setCurrentEventTimestamp] = useState<TeslaFS.Timestamp | null>(null);
  const { currentEvent } = useCurrentEvent(currentEventTimestamp, activeEvents);
  useEffect(() => {
    const [firstEventTimestamp] = activeEventsTimestamps;
    setCurrentEventTimestamp(firstEventTimestamp ?? null);
  }, [activeEventsTimestamps]);

  return (
    <Box
      width="100%"
      flex="1"
      display="flex"
      justifyContent={["unset", "unset", "center"]}
      flexDirection={["column", "column", "row"]}
      sx={{ gap: 3 }}
    >
      {parserLog.length > 0 && <ParserLogViewer parserLog={parserLog} />}
      <Box as="nav" display="inline-flex" flexDirection="column" sx={{ gap: 2 }}>
        {loadFilesButton}
        {categoryList.length > 1 && <SubNavs options={categoryList} value={activeCategory} onChange={setActiveCategory} />}
        <Box display="flex" flexWrap={["wrap", "nowrap", "nowrap"]} sx={{ gap: 1 }}>
          <TimestampSelect
            sx={{ display: ["none", "none", "flex"] }}
            label={
              <>
                Events <CounterLabel>{activeEventsTimestamps.length}</CounterLabel>
              </>
            }
            innerSx={{ maxHeight: 600, overflowY: "auto" }}
            options={activeEventsTimestamps}
            renderOption={pipe(({ value }) => value, TeslaFS.formatTimestamp)}
            value={currentEventTimestamp}
            onChange={setCurrentEventTimestamp}
          />
          <FormSelect
            sx={{ display: ["flex", "flex", "none"] }}
            label={
              <>
                Events <CounterLabel>{activeEventsTimestamps.length}</CounterLabel>
              </>
            }
            options={activeEventsTimestamps}
            renderOption={pipe(({ value }) => value, TeslaFS.formatTimestamp)}
            value={currentEventTimestamp}
            onChange={setCurrentEventTimestamp}
          />
        </Box>
      </Box>
      {/* minWidth for preventing the area grow out of view */}
      <Box as="main" flex="1">
        {currentEvent && <EventPlayer currentEvent={currentEvent} />}
      </Box>
    </Box>
  );
};
