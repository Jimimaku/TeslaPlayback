import { all, isNotNil } from "ramda";
import { ComponentProps, FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const matrixPlayControlRef = useRef<PlayControl | null>(null);
  const [exportState, setExportState] = useState<ExportState>(ExportState.Idle);
  useEffect(() => {
    if (exportState === ExportState.Converting) matrixPlayControlRef.current?.pause();
  }, [exportState]);

  const setTrim = useCallback<Required<ComponentProps<typeof MatrixPlayer>>["setTrim"]>(
    ([start, end]) => {
      if (start) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimStart, payload: start });
      if (end) dispatchExportConfiguringState({ type: ExportConfiguringActions.setTrimEnd, payload: end });
    },
    [dispatchExportConfiguringState],
  );

  return (
    <MatrixPlayer
      key={getEventTime(currentEvent).toISOString() /* Force remount when event changes */}
      ref={matrixPlayControlRef}
      additionalControls={
        <ExportConfig currentEvent={currentEvent} exportState={exportState} setExportState={setExportState} metaConfig={metaConfig} />
      }
      videoLayoutKey={videoLayoutKey}
      event={currentEvent}
      trim={exportState === ExportState.Configuring || exportState === ExportState.Converting ? trim : undefined}
      setTrim={exportState === ExportState.Configuring || exportState === ExportState.Converting ? setTrim : undefined}
    />
  );
};
