import { FFMpegProcessWork } from "./FFMpegVideoProcessJob";
import { spellBook } from "./spellBook";

export const trimVideo: FFMpegProcessWork<[startTimeInSecond: number, endTimeInSecond: number]> = async (_, composer, startTime, endTime) => {
  spellBook.trim(composer, startTime, endTime);
};
