import { Box, Button } from "@primer/react";
import { PlaybackEvent } from "../common";
import { MetaConfig, transformConfig, transformTracks } from "./MetaConfig";
import { Dialog } from "./base/Dialog";
import { ExportState } from "./export/ExportState";
import { NewVideoExporter } from "./export/NewExport";

export const ExportConfig: React.FC<{
  currentEvent: PlaybackEvent;
  metaConfig: MetaConfig;
  exportState: ExportState;
  setExportState: React.Dispatch<React.SetStateAction<ExportState>>;
}> = ({ currentEvent, exportState, metaConfig, setExportState }) => {
  switch (exportState) {
    case ExportState.Idle: {
      return (
        <Button variant="primary" onClick={() => setExportState(ExportState.Configuring)}>
          Export Video
        </Button>
      );
    }
    case ExportState.Configuring: {
      return (
        <Box display="flex" sx={{ gap: 1 }} justifyContent="space-between" alignItems="center">
          <Button
            variant="default"
            onClick={() => {
              setExportState(ExportState.Idle);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setExportState(ExportState.Converting);
            }}
          >
            Start
          </Button>
        </Box>
      );
    }
    case ExportState.Converting: {
      return (
        <Dialog
          defaultOpen
          onChangeIsOpen={(isOpen) => {
            if (!isOpen) {
              setExportState(ExportState.Configuring);
            }
          }}
        >
          <NewVideoExporter
            event={currentEvent}
            convertConfig={transformConfig(metaConfig)}
            convertTracks={transformTracks(metaConfig, currentEvent)}
            onFinish={() => setExportState(ExportState.Idle)}
            onCancel={() => setExportState(ExportState.Configuring)}
          />
        </Dialog>
      );
    }
  }
};
