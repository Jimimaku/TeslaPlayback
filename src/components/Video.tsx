import { Box, Text } from "@primer/react";
import { FC, useEffect, useRef, VideoHTMLAttributes } from "react";
import { useVideoControl, VideoControl } from "./useVideoControl";

type Props = {
  file?: File;
  label?: string;
  play?: boolean;
  progress?: number;
  playbackRate?: number;
  native?: VideoHTMLAttributes<HTMLVideoElement>;
  onControl?: (control: VideoControl["states"]) => void;
};

export type VideoProps = Props;

export const Video: FC<Props> = ({ file, label, playbackRate = 1, native, play, progress, onControl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const control = useVideoControl();
  const { states: controlStates } = control;
  const { error } = controlStates;
  useEffect(() => {
    onControl?.(controlStates);
  }, [controlStates, onControl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (): void => {
      console.error(`Video error on ${label}`, video.error);
      control.setStates({ error: video.error });
    };
    video.addEventListener("error", handleError);
    return () => {
      video.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    control.setStates({ initialing: true, error: null, playEnded: false, canPlay: false, duration: 0, playtime: 0 });
    if (video) {
      if (file) {
        video.src = URL.createObjectURL(file);
        video.playbackRate = playbackRate;
      } else {
        video.src = "";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && playbackRate) video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (play) {
        video.play().catch(() => {
          // catching here prevent raising to upper global scope
          // let native DOM event listener handle error
        });
      } else {
        video.pause();
      }
    }
  }, [play]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && progress !== undefined && video.readyState >= video.HAVE_METADATA) {
      const time = video.duration * progress;
      video.currentTime = time;
    }
  }, [progress]);

  return (
    <Box position="relative" display="flex" flexDirection="column" sx={{ gap: 0 }}>
      {error && (
        <Box position="absolute" background="#fefefeaa" px={1}>
          <Text sx={{ color: "fg-attention" }}>{friendlyFormatErrorMessage(error)}</Text>
        </Box>
      )}
      <Box display="flex" sx={{ backgroundColor: error ? "neutral.emphasis" : undefined }}>
        {/* The display="flex" removes the blank area below video */}
        <video
          aria-label={label}
          ref={videoRef}
          playsInline
          onContextMenu={(e) => e.preventDefault()}
          autoPlay
          onCanPlay={(e) => {
            control.setStates({ initialing: false, canPlay: true, duration: e.currentTarget.duration * 1000 });
          }}
          onError={(e) => {
            control.setStates({ initialing: false, canPlay: true, error: e.currentTarget.error });
          }}
          onEnded={() => {
            control.setStates({ initialing: false, playEnded: true });
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (video?.readyState >= video.HAVE_METADATA) {
              control.setStates({ playtime: video.currentTime * 1000 });
            }
          }}
          // onPlay={() => setIsPlaying(true)} // disabling along with `onPause`
          // onPause={() => setIsPlaying(false)} // This may trigger earlier than `onEnded`
          // onAbort={() => setIsPlaying(false)} // This would trigger on switch video source
          // onSuspend={() => setIsPlaying(false)} // This would trigger on start playing
          style={{ width: "100%", ...native?.style }}
        />
      </Box>
    </Box>
  );
};

function friendlyFormatErrorMessage(error: MediaError): string {
  switch (error.message) {
    case "MEDIA_ELEMENT_ERROR: Empty src attribute":
      return "File not found";
    case `PipelineStatus::PIPELINE_ERROR_DECODE: Error Domain=NSOSStatusErrorDomain Code=-12909 "(null)" (-12909): VTDecompressionOutputCallback`:
      return "Cannot decode video, please use Firefox";
    default:
      return error.message;
  }
}
