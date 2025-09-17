import { DrawTextStyle } from "..";
import { FFMpegProcessWork } from "./FFMpegVideoProcessJob";
import { filenames } from "./filenames";
import { loadFontFile } from "./loadFontFile";
import { Sizes, spellBook } from "./spellBook";

export const addTimestampToVideo: FFMpegProcessWork<[sizes: Sizes, baseTime: Date, textOptions?: DrawTextStyle]> = async (
  ffmpeg,
  composer,
  sizes,
  baseTime,
  textOptions
) => {
  await ffmpeg.writeFile(filenames.font, await loadFontFile());
  spellBook.addTimestamp(composer, sizes, baseTime, textOptions);
};
