import { all, isNotNil } from "ramda";
import { FC, useMemo, useRef, useState } from "react";
import { getEventTime, PlaybackEvent } from "../common";
import { ExportConfig } from "./ExportConfig";
import { MatrixPlayer, PlayControl } from "./MatrixPlayer";
import { MetaConfig } from "./MetaConfig";
import { ExportState } from "./export/ExportState";
import { ExportConfiguringActions, useExportConfigureState } from "./export/useExportConfigureReducer";
import { useEventLayoutKey } from "./useEventLayoutKey";

export const EventPlayer: FC<{
  currentEvent: PlaybackEvent;
}> = ({ currentEvent }) => {
  const [playTime, setPlayTime] = useState<Date | null>(null);
  const matrixPlayControlRef = useRef<PlayControl | null>(null);

  const videoLayoutKey = useEventLayoutKey(currentEvent);
  const [exportConfiguringState, dispatchExportConfiguringState] = useExportConfigureState();
  const { trim } = exportConfiguringState;
  const metaConfig: MetaConfig = useMemo(
    () => ({
      trim: all(isNotNil)(trim) ? (trim as [Date, Date]) : undefined,
      size: {
        w: 1280,
        h: 960,
      },
      layoutKey: videoLayoutKey,
    }),
    [trim, videoLayoutKey],
  );

  const [exportState, setExportState] = useState<ExportState>(ExportState.Idle);

  return (
    <>
      <ExportConfig
        currentEvent={currentEvent}
        exportConfiguringState={exportConfiguringState}
        exportState={exportState}
        setExportState={setExportState}
        matrixPlayControlRef={matrixPlayControlRef}
        metaConfig={metaConfig}
        playTime={playTime}
      />
      <MatrixPlayer
        key={getEventTime(currentEvent).toISOString() /* Force remount when event changes */}
        ref={matrixPlayControlRef}
        onPlayTimeChange={setPlayTime}
        videoLayoutKey={videoLayoutKey}
        event={currentEvent}
        trim={exportState === ExportState.Configuring ? trim : undefined}
        setTrim={
          exportState === ExportState.Configuring
            ? ([start, end]) => {
                if (start) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimStart, payload: start });
                if (end) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimEnd, payload: end });
              }
            : undefined
        }
      />
    </>
  );
};
