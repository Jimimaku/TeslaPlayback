import { Text } from "@primer/react";
import { juxt } from "ramda";
import { useEffect, useState } from "react";
import { ExportConvertState } from ".";
import { PlaybackEvent } from "../../common";
import { EventHub } from "../../utils/EventHub";
import { ConvertConfig, ConvertTrack, loadConverter, Progress } from "../../utils/exportVideo/convert";
import { flowControlErrors } from "../../utils/exportVideo/mediabunny";
import { $ } from "../../utils/general";
import { formatDateTime } from "../../utils/time";
import { ExportDone } from "./ExportDone";
import { ExportFail } from "./ExportFail";
import { ExportProcessing } from "./ExportProcessing";

type Props = {
  event: PlaybackEvent;
  convertConfig: ConvertConfig;
  convertTracks: ConvertTrack[];
  onCancel?: () => void;
  onFinish?: () => void;
};

export function NewVideoExporter({ event, convertConfig, convertTracks, onCancel, onFinish }: Props) {
  const [eventTime] = event;
  const [exportState, setExportState] = useState<ExportConvertState>({
    state: "loadingConverter",
  });

  useEffect(
    () => {
      $(async () => {
        try {
          setExportState({ state: "loadingConverter" });

          const progressHub = new EventHub<Progress>();
          const convert = await loadConverter();
          const { cancel, result } = convert(convertTracks, convertConfig, {
            onProgress: progressHub.dispatch,
            onError: juxt([console.error, (error: unknown) => setExportState({ state: "fail", reason: `Failed processing video: ${error}` })]),
          });

          setExportState({
            state: "processing",
            cancel,
            onProgress: progressHub.addListener,
          });

          const output = await result;
          setExportState({ state: "done", getOutput: () => output });
        } catch (err) {
          if (err instanceof flowControlErrors.CancelError) {
            onCancel?.();
            return;
          }
          console.error(err);
          setExportState({ state: "fail", reason: `Failed processing video: ${err}` });
        }
      });
    },
    // prevent re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      /* convertConfig, convertTracks */
    ],
  );

  switch (exportState.state) {
    case "loadingConverter":
      return <Text>Loading plugins for exporting video...</Text>;
    case "processing":
      return <ExportProcessing exportState={exportState} setExportState={setExportState} />;
    case "done":
      return <ExportDone exportState={exportState} exportFileName={`${formatDateTime(eventTime)}.mp4`} onFinish={onFinish} />;
    case "fail":
      return <ExportFail exportState={exportState} onDismiss={onFinish} />;
  }
}
