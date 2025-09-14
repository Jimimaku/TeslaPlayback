import { Box, Button, ProgressBar, Text } from "@primer/react";
import { useEffect, useState } from "react";
import { ExportStateIdle, ExportStateProcessing } from ".";
import { Progress } from "../../utils/exportVideo";

export function ExportProcessing({
  exportState,
  setExportState,
}: {
  exportState: ExportStateProcessing;
  setExportState: (state: ExportStateIdle) => void;
}) {
  const { onProgress, cancel, totalTime } = exportState;
  const [progress, setProgress] = useState<Progress>({
    progress: 0,
    time: 0,
  });
  useEffect(() => {
    onProgress(setProgress);
  }, [onProgress]);

  const [processedTime, TotalTimeToProcess]: [number, number] = totalTime ? [progress.time / (1000 * 1000), totalTime] : [progress.progress, 1];

  return (
    <Box display="flex" flexDirection="column" sx={{ gap: 2 }}>
      <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
        <ProgressBar sx={{ flex: 1 }} animated progress={(processedTime / TotalTimeToProcess) * 100} />
        {totalTime && (
          <Text>
            {processedTime.toFixed(1)}s / {TotalTimeToProcess.toFixed(1)}s
          </Text>
        )}
        <Button
          onClick={() => {
            cancel?.();
            setExportState({ state: "idle" });
          }}
        >
          Cancel
        </Button>
      </Box>
      <Box as="hr" width="100%" borderTop="none" />
      <Text as="label" color="neutral.emphasis" fontSize={1}>
        It will take 3~20 minutes to process the video, depends on your computer's performance. You can reduce the time by reduce video duration with
        Trim Start and Trim End.
      </Text>
    </Box>
  );
}
