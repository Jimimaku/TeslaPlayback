import { DashIcon, PlusIcon, StopwatchIcon } from "@primer/octicons-react";
import { Box, IconButton } from "@primer/react";
import { Dispatch, FC, SetStateAction } from "react";

const multi = (value: number, factor: number) => value * factor;
const divide = (value: number, factor: number) => value / factor;

export const PlaybackRateControl: FC<{
  playbackRate: number;
  setPlaybackRate: Dispatch<SetStateAction<number>>;
}> = ({ playbackRate, setPlaybackRate }) => (
  <Box display="inline-flex" alignItems="center" sx={{ gap: 1 }}>
    <IconButton
      size="small"
      aria-label="Decrease Playback Speed"
      icon={DashIcon}
      disabled={playbackRate === divide(1, 4)}
      onClick={() => setPlaybackRate(Math.max(divide(playbackRate, 2), divide(1, 4)))}
    />
    <StopwatchIcon /> {`x${playbackRate}`}
    <IconButton
      size="small"
      aria-label="Increase Playback Speed"
      icon={PlusIcon}
      disabled={playbackRate === multi(1, 4)}
      onClick={() => setPlaybackRate(Math.min(multi(playbackRate, 2), multi(1, 4)))}
    />
  </Box>
);
