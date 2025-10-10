import { Box, Button, Checkbox, FormControl, Radio, RadioGroup, Text, TextInput } from "@primer/react";
import { useEffect, useState } from "react";
import { ExportState } from ".";
import { Directions, PlaybackEvent } from "../../common";
import { EventHub } from "../../utils/EventHub";
import { DrawTextStyle, loadConverter, Progress } from "../../utils/exportVideo/convert";
import { Option } from "../../utils/option";
import { FormCheckboxGroup } from "../base/CheckboxGroup";
import { ExpandButton } from "../base/ExpandButton";
import { useNumberField } from "./useNumberField";

type CameraOption = Directions;
const cameraOptions: Option<CameraOption>[] = [
  { value: Directions.front, label: "Front" },
  { value: Directions.rear, label: "Rear" },
  { value: Directions.left, label: "Left" },
  { value: Directions.right, label: "Right" },
  { value: Directions.leftPillar, label: "Left Pillar" },
  { value: Directions.rightPillar, label: "Right Pillar" },
];

const showDrawTextSettings = false;
const showAdvancedTextSetting = false;
export function ExportPrepare({ setExportState, event }: { setExportState: (state: ExportState) => void; event: PlaybackEvent }) {
  const [, slices] = event;
  const [views, setViews] = useState<CameraOption[]>([
    Directions.front,
    Directions.rear,
    Directions.left,
    Directions.right,
    Directions.leftPillar,
    Directions.rightPillar,
  ]);

  const [textToDraw, setTextToDraw] = useState("");
  const [shouldDrawText, setShouldDrawText] = useState(true);
  const [drawTextMode, setDrawTextMode] = useState<"timestamp" | "custom">("timestamp");

  const fontSizeField = useNumberField(72);
  const [drawTextOptions, setDrawTextOptions] = useState<DrawTextStyle>({
    fontSize: fontSizeField.value,
    fontColor: "#ffffff",
    background: true,
    backgroundColor: "#000000",
  });
  useEffect(() => {
    setDrawTextOptions({ ...drawTextOptions, fontSize: fontSizeField.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSizeField.value]);

  const trimStartField = useNumberField(0);
  const trimEndField = useNumberField(0);

  const allFieldsValid = trimStartField.validation === null && trimEndField.validation === null && fontSizeField.validation === null;

  const startConvert = async () => {
    try {
      setExportState({ state: "loadingConverter" });

      const progressHub = new EventHub<Progress>();
      const convert = await loadConverter();
      const { cancel, result } = await convert(
        [], // filterFileMap(slices, views),
        { size: { w: 0, h: 0 } }, // { text: eventDate ? [eventDate, drawTextOptions] : undefined },
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
        cancel,
        onProgress: progressHub.addListener,
      });

      const output = await result;
      setExportState({ state: "done", getOutput: () => output });
    } catch (err) {
      console.error(err);
      setExportState({ state: "fail", reason: `Failed processing video: ${err}` });
    }
  };

  return (
    <Box display="flex" flexDirection="column" sx={{ gap: 2 }}>
      <FormCheckboxGroup<CameraOption>
        label="Cameras"
        value={views}
        onChange={setViews}
        options={cameraOptions.map((option) => (slices[option.value] ? option : { ...option, disabled: true }))}
      />
      {showDrawTextSettings && (
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
              {showAdvancedTextSetting && (
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
                          value={drawTextOptions.backgroundColor ?? ""}
                          onChange={(e) => setDrawTextOptions({ ...drawTextOptions, backgroundColor: e.target.value })}
                        />
                      </FormControl>
                    </Box>
                  </ExpandButton>
                </Box>
              )}
            </FormControl.Caption>
          )}
        </FormControl>
      )}
      <Box as="hr" width="100%" borderTop="none" />
      <Button variant="primary" disabled={!allFieldsValid} onClick={startConvert}>
        Start
      </Button>
      <Text as="label" color="neutral.emphasis" fontSize={1}>
        Exporting does not upload your videos, all process is done locally in your browser.
      </Text>
    </Box>
  );
}
