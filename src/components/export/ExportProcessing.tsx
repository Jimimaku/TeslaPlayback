import { Box, Button, ProgressBar } from "@primer/react";
import { useEffect, useState } from "react";
import { ExportStateIdle, ExportStateProcessing } from ".";
import { Progress } from "../../utils/exportVideo/convert";

export function ExportProcessing({
  exportState,
  setExportState,
}: {
  exportState: ExportStateProcessing;
  setExportState: (state: ExportStateIdle) => void;
}) {
  const { onProgress, cancel } = exportState;
  const [progress, setProgress] = useState<Progress>(0);
  useEffect(() => {
    onProgress(setProgress);
  }, [onProgress]);

  return (
    <Box display="flex" flexDirection="column" sx={{ gap: 2 }}>
      <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
        <ProgressBar sx={{ flex: 1 }} animated progress={progress * 100} />
        <Button
          onClick={() => {
            cancel?.();
            setExportState({ state: "idle" });
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
