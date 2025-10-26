import { Box, Button } from "@primer/react";
import { PlaybackEvent } from "../common";
import { PlayControl } from "./MatrixPlayer";
import { MetaConfig, transformConfig, transformTracks } from "./MetaConfig";
import { ExportState } from "./export/ExportState";
import { NewVideoExporter } from "./export/NewExport";
import { ExportConfiguringState, useExportConfigureState } from "./export/useExportConfigureReducer";

export const ExportConfig: React.FC<{
  currentEvent: PlaybackEvent;
  exportConfiguringState: ReturnType<typeof useExportConfigureState>[0];
  matrixPlayControlRef: React.RefObject<PlayControl>;
  metaConfig: MetaConfig;
  playTime: Date | null;
  exportState: ExportState;
  setExportState: React.Dispatch<React.SetStateAction<ExportState>>;
}> = ({ currentEvent, exportConfiguringState, exportState, matrixPlayControlRef, metaConfig, playTime, setExportState }) => {
  switch (exportState) {
    case ExportState.Idle: {
      return <Button onClick={() => setExportState(ExportState.Configuring)}>Export Video</Button>;
    }
    case ExportState.Configuring: {
      if (playTime === null) return null;
      return (
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
      );
    }
    case ExportState.Converting: {
      return (
        <NewVideoExporter
          event={currentEvent}
          convertConfig={transformConfig(metaConfig)}
          convertTracks={transformTracks(metaConfig, currentEvent)}
          onFinish={() => setExportState(ExportState.Idle)}
        />
      );
    }
  }
};
