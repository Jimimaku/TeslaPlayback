import { Box, Button, Checkbox, FormControl, Radio, RadioGroup, Text, TextInput } from "@primer/react";
import { useEffect, useMemo, useState } from "react";
import { ExportState } from ".";
import { TeslaFS } from "../../TeslaFS";
import { Directions, VideoClipGroup } from "../../common";
import { EventHub } from "../../utils/EventHub";
import { Convert, loadConverter, Progress } from "../../utils/exportVideo";
import { DrawTextStyle } from "../../utils/exportVideo/ffmpeg/ffmpegArgsComposer/DrawTextArgs";
import { entries } from "../../utils/general";
import { ExpandButton } from "../base/ExpandButton";
import { Select } from "../base/Select";
import { useNumberField } from "./useNumberField";

type CameraOption = Directions | "all";
const cameraOptions: Option<CameraOption>[] = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "all", label: "Grid (2×2)" },
];

export function ExportIdle({
  setExportState,
  videos,
  totalTime,
}: {
  setExportState: (state: ExportState) => void;
  videos: VideoClipGroup;
  totalTime?: number;
}) {
  const [converter, setConverter] = useState<"ffmpeg" | "mediabunny">("mediabunny");
  const [view, setView] = useState<CameraOption>("front");
  const fileMap = useMemo(() => {
    const { front, rear, left, right } = videos;
    if (view === "all") {
      if (front || rear || left || right) return { front, rear, left, right };
    } else if (videos[view]) {
      return { [view]: videos[view] } satisfies Partial<Record<Directions, File | undefined>>;
    }
  }, [view, videos]);

  const [textToDraw, setTextToDraw] = useState("");
  const [shouldDrawText, setShouldDrawText] = useState(true);
  const [drawTextMode, setDrawTextMode] = useState<"timestamp" | "custom">("timestamp");

  const fontSizeField = useNumberField(72);
  const [drawTextOptions, setDrawTextOptions] = useState<DrawTextStyle>({
    fontSize: fontSizeField.value,
    fontColor: "#ffffff",
    box: true,
    boxColor: "#000000",
  });
  useEffect(() => {
    setDrawTextOptions({ ...drawTextOptions, fontSize: fontSizeField.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSizeField.value]);

  const trimStartField = useNumberField(0);
  const trimEndField = useNumberField(totalTime ? Math.floor(totalTime + 1) : 60);

  const resolvedTextToDraw = useMemo(() => {
    if (!fileMap) return undefined;

    if (drawTextMode === "timestamp") {
      return entries(fileMap).reduce(
        (acc, [, file]) => acc ?? (file ? TeslaFS.parseFileNameDate(file.name) : undefined),
        undefined as Date | undefined
      );
    } else {
      return textToDraw;
    }
  }, [drawTextMode, textToDraw, fileMap]);

  const allFieldsValid =
    !!fileMap && trimStartField.validation === null && trimEndField.validation === null && (!shouldDrawText || fontSizeField.validation === null);

  const autoConvert = async (convert: Convert) => {
    try {
      if (fileMap === undefined) throw new Error("No video available");

      setExportState({ state: "loadingConverter" });

      const progressHub = new EventHub<Progress>();
      const { cancel, result } = await convert(
        fileMap,
        { resolvedTextToDraw, drawTextOptions, trimEnd: trimEndField.value, trimStart: trimStartField.value },
        {
          onProgress: progressHub.dispatch,
          onError: (error) => {
            console.error(error);
            setExportState({ state: "fail", reason: `Failed processing video: ${error}` });
          },
        }
      );

      setExportState({
        state: "processing",
        totalTime: trimEndField.value - trimStartField.value || undefined,
        cancel,
        onProgress: progressHub.addListener,
      });

      setExportState({ state: "done", output: await result });
    } catch (err) {
      console.error(err);
      setExportState({ state: "fail", reason: `Failed processing video: ${err}` });
    }
  };

  const startConvert = async () => autoConvert(await loadConverter(converter));

  return (
    <Box display="flex" flexDirection="column" sx={{ gap: 2 }}>
      <FormControl>
        <FormControl.Label>Converter</FormControl.Label>
        <Select<typeof converter>
          sx={{ width: "100%" }}
          value={converter}
          onChange={(option) => setConverter(option)}
          options={["ffmpeg", "mediabunny"]}
        />
      </FormControl>
      <Text>Please use Firefox, otherwise export might fail.</Text>
      <FormControl>
        <FormControl.Label>Cameras</FormControl.Label>
        <Select<CameraOption> sx={{ width: "100%" }} value={view} onChange={(option) => setView(option)} options={cameraOptions} />
      </FormControl>
      <FormControl>
        <Checkbox checked={shouldDrawText} onChange={(e) => setShouldDrawText(e.target.checked)} />
        <FormControl.Label>Draw text</FormControl.Label>
        {shouldDrawText && (
          <FormControl.Caption>
            <Box>
              <RadioGroup name="drawTextMode" onChange={(v) => setDrawTextMode(v as typeof drawTextMode)}>
                <RadioGroup.Label>Text content</RadioGroup.Label>
                <FormControl>
                  <Radio value="timestamp" checked={drawTextMode === "timestamp"} />
                  <FormControl.Label>Timestamp</FormControl.Label>
                  <FormControl.Caption>e.g. 2077-01-01 11:22:33</FormControl.Caption>
                </FormControl>
                <FormControl>
                  <Radio value="custom" checked={drawTextMode === "custom"} />
                  <FormControl.Label>Custom</FormControl.Label>
                  <FormControl.Caption>
                    <FormControl disabled={drawTextMode !== "custom"}>
                      <FormControl.Label visuallyHidden>Text to draw</FormControl.Label>
                      <TextInput placeholder="Text to draw" value={textToDraw} onChange={(e) => setTextToDraw(e.target.value)} />
                    </FormControl>
                  </FormControl.Caption>
                </FormControl>
              </RadioGroup>
            </Box>
            <Box mt={2}>
              <ExpandButton buttonProps={{ children: "Text Style" }}>
                <Box ml={4} py={1}>
                  <FormControl>
                    <FormControl.Label>Font Size</FormControl.Label>
                    <TextInput type="number" value={fontSizeField.raw ?? ""} onChange={(e) => fontSizeField.setRaw(e.target.value)} />
                    {fontSizeField.validation && (
                      <FormControl.Validation variant={fontSizeField.validation.type}>{fontSizeField.validation.message}</FormControl.Validation>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Font Color</FormControl.Label>
                    <input
                      type="color"
                      value={drawTextOptions.fontColor ?? ""}
                      onChange={(e) => setDrawTextOptions({ ...drawTextOptions, fontColor: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Box Color</FormControl.Label>
                    <input
                      type="color"
                      value={drawTextOptions.boxColor ?? ""}
                      onChange={(e) => setDrawTextOptions({ ...drawTextOptions, boxColor: e.target.value })}
                    />
                  </FormControl>
                </Box>
              </ExpandButton>
            </Box>
          </FormControl.Caption>
        )}
      </FormControl>
      <Box display="flex" sx={{ gap: 2 }}>
        <FormControl disabled={!totalTime}>
          <FormControl.Label>Trim Start</FormControl.Label>
          <TextInput
            type="number"
            min={0}
            max={totalTime}
            trailingVisual="seconds"
            value={trimStartField.raw ?? ""}
            onChange={(e) => trimStartField.setRaw(e.target.value)}
          />
          {trimStartField.validation && (
            <FormControl.Validation variant={trimStartField.validation.type}>{trimStartField.validation.message}</FormControl.Validation>
          )}
        </FormControl>
        <FormControl disabled={!totalTime}>
          <FormControl.Label>Trim End</FormControl.Label>
          <TextInput
            type="number"
            min={0}
            max={totalTime}
            trailingVisual="seconds"
            value={trimEndField.raw ?? ""}
            onChange={(e) => trimEndField.setRaw(e.target.value)}
          />
          {trimEndField.validation && (
            <FormControl.Validation variant={trimEndField.validation.type}>{trimEndField.validation.message}</FormControl.Validation>
          )}
        </FormControl>
      </Box>
      <Box as="hr" width="100%" borderTop="none" />
      <Button variant="primary" disabled={!allFieldsValid} onClick={startConvert}>
        Start
      </Button>
      <Text as="label" color="neutral.emphasis" fontSize={1}>
        Exporting does not upload your videos.
      </Text>
      <Text as="label" color="neutral.emphasis" fontSize={1}>
        It will take 3~20 minutes to process the video, depends on your computer's performance. You can reduce the time by reduce video duration with
        Trim Start and Trim End.
      </Text>
    </Box>
  );
}
