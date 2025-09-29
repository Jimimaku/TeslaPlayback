import { Box, Button, Text } from "@primer/react";
import { memo, useState } from "react";
import { PlaybackEventSlice } from "../../common";
import { Progress } from "../../utils/exportVideo/convert";
import { $ } from "../../utils/general";
import { Dialog } from "../base/Dialog";
import { ExportDone } from "./ExportDone";
import { ExportFail } from "./ExportFail";
import { ExportPrepare } from "./ExportPrepare";
import { ExportProcessing } from "./ExportProcessing";

export type ExportStateIdle = {
  state: "idle";
};
export type ExportStateLoadingConverter = {
  state: "loadingConverter";
};
export type ExportStateProcessing = {
  state: "processing";
  onProgress: (listener: (progress: Progress) => void) => void;
  cancel: () => void;
};
export type ExportStateDone = {
  state: "done";
  output: Blob;
};
export type ExportStateFail = {
  state: "fail";
  reason: string;
};

export type ExportState = ExportStateIdle | ExportStateLoadingConverter | ExportStateProcessing | ExportStateDone | ExportStateFail;

export const VideoExporter = memo(function VideoExporter({
  totalTime,
  clips,
  videoPlayControl,
}: {
  totalTime: number;
  clips: PlaybackEventSlice;
  videoPlayControl?: {
    play?: () => void;
    pause?: () => void;
    setPlaytime?: (time: number) => void;
    setPlaybackRate?: (rate: number) => void;
    setProgressBarValue?: (value: number) => void;
    setControlledProgress?: (value: number) => void;
  };
}) {
  const [exportState, setExportState] = useState<ExportState>({
    state: "idle",
  });
  const [eventDate] = clips;
  const eventName = eventDate.toLocaleString();

  return (
    <Dialog<HTMLButtonElement>
      trigger={(isOpen, ref) => (
        <Button
          ref={ref}
          onClick={() => {
            videoPlayControl?.pause?.();
            isOpen.set(true);
          }}
        >
          Export current event
        </Button>
      )}
      title="Export"
      onChangeIsOpen={(isOpen) => {
        if (isOpen) videoPlayControl?.pause?.();
      }}
    >
      <Box
        display={
          /* To restore state after exporting */
          exportState.state === "idle" ? undefined : "none"
        }
      >
        <ExportPrepare clips={clips} totalTime={totalTime} setExportState={setExportState} />
      </Box>
      {$(() => {
        switch (exportState.state) {
          case "loadingConverter":
            return <Text>Loading plugins for exporting video...</Text>;
          case "processing":
            return <ExportProcessing exportState={exportState} setExportState={setExportState} />;
          case "done":
            return <ExportDone exportState={exportState} setExportState={setExportState} exportFileName={`${eventName}.mp4`} />;
          case "fail":
            return <ExportFail exportState={exportState} setExportState={setExportState} />;
        }
      })}
    </Dialog>
  );
});
