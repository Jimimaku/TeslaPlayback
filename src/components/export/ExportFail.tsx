import { Box, Button, Text } from "@primer/react";
import { ExportStateFail } from ".";

export function ExportFail({ exportState, onDismiss }: { exportState: ExportStateFail; onDismiss?: () => void }) {
  return (
    <Box>
      <Text>{exportState.reason}</Text>
      <Button onClick={onDismiss}>OK</Button>
    </Box>
  );
}
