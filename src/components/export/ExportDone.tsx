import { DownloadIcon } from "@primer/octicons-react";
import { Box, Button } from "@primer/react";
import { useMemo } from "react";
import { ExportConvertStateDone } from ".";
import { downloadBlob } from "../../utils/general";

export function ExportDone({
  exportFileName,
  exportState,
  onFinish,
}: {
  exportFileName: string;
  exportState: ExportConvertStateDone;
  onFinish?: () => void;
}) {
  const { getOutput } = exportState;
  const videoSrc = useMemo(() => URL.createObjectURL(getOutput()), [getOutput]);
  return (
    <Box>
      <video aria-label="Exported video" controls autoPlay style={{ width: "100%" }} src={videoSrc} />
      <Box display="flex" justifyContent="space-between">
        <Button onClick={() => downloadBlob(getOutput(), exportFileName)} leadingVisual={DownloadIcon}>
          Download
        </Button>
        <Button onClick={onFinish}>Done</Button>
      </Box>
    </Box>
  );
}
