import { Box, Button, Text } from "@primer/react";
import { ExportConvertStateFail } from ".";

export function ExportFail({ exportState, onDismiss }: { exportState: ExportConvertStateFail; onDismiss?: () => void }) {
  return (
    <Box>
      <Text>{exportState.reason}</Text>
      <Button onClick={onDismiss}>OK</Button>
    </Box>
  );
}
