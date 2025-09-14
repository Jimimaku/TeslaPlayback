import { DrawTextStyle } from "./ffmpegArgsComposer/DrawTextArgs";
import { FFMpegProcessWork } from "./FFMpegVideoProcessJob";
import { filenames } from "./filenames";
import { loadFontFile } from "./loadFontFile";
import { Sizes, spellBook } from "./spellBook";

export const addTextToVideo: FFMpegProcessWork<[sizes: Sizes, text: string, textOptions?: DrawTextStyle]> = async (
  ffmpeg,
  composer,
  sizes,
  text,
  textOptions
) => {
  await ffmpeg.writeFile(filenames.font, await loadFontFile());
  spellBook.addText(composer, sizes, text, textOptions);
};
