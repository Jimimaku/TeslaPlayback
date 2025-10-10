import { TeslaFS } from "../../TeslaFS";
import { ClipCategories, Directions, PlaybackEvents } from "../../common";
import { keys } from "../general";

const suffixToDirectionMap: Record<ValueOf<typeof TeslaFS.SUFFIXES>, Directions> = {
  [TeslaFS.SUFFIXES.FRONT]: Directions.front,
  [TeslaFS.SUFFIXES.REAR]: Directions.rear,
  [TeslaFS.SUFFIXES.LEFT_REPEATER]: Directions.left,
  [TeslaFS.SUFFIXES.RIGHT_REPEATER]: Directions.right,
  [TeslaFS.SUFFIXES.LEFT_PILLAR]: Directions.leftPillar,
  [TeslaFS.SUFFIXES.RIGHT_PILLAR]: Directions.rightPillar,
};

const findTimestamp = (str?: string): TeslaFS.Timestamp | undefined => str?.match(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}(-\d{2})?/)?.[0];

type ParserLogItem = {
  file: File;
  message: string;
};

type Processed = {
  categories: ClipCategories;
  parserLog: ParserLogItem[];
};

export function processDashCamFiles(files: FileListLike): Processed {
  const categories: ClipCategories = {
    [TeslaFS.ClipCategory.RecentClips]: {},
    [TeslaFS.ClipCategory.SavedClips]: {},
    [TeslaFS.ClipCategory.SentryClips]: {},
    [TeslaFS.ClipCategory.Unknown]: {},
  };
  const parserLog: { file: File; message: string }[] = [];
  for (const file of files) {
    const filename = file.name.toLowerCase();

    if (filename.startsWith(".")) continue; // ignore hidden files
    if (["event.json", "thumb.png"].includes(filename)) continue;
    if (!filename.endsWith(TeslaFS.VIDEO_FILE_EXT)) {
      parserLog.push({ file, message: `File name not end with "${TeslaFS.VIDEO_FILE_EXT}"` });
      continue;
    }

    const playbackTimestamp = findTimestamp(file.name);
    const splitDirectories = file.webkitRelativePath.split("/");
    const eventTimestamp =
      findTimestamp(splitDirectories.at(-2)) ||
      // for RecentClips, files are not grouped with folders
      findTimestamp(splitDirectories.at(-1));
    if (!playbackTimestamp || !eventTimestamp) {
      parserLog.push({ file, message: `File name does not match expected pattern` });
      continue;
    }

    const eventTime = TeslaFS.parseTimestamp(eventTimestamp);

    const category: TeslaFS.ClipCategory =
      TeslaFS.clipCategories.find((category) => splitDirectories.includes(category)) ?? TeslaFS.ClipCategory.Unknown;
    const playbackEvent: PlaybackEvents = categories[category];
    const [, playbackEventClips] = (playbackEvent[eventTimestamp] ??= [eventTime, {}]);

    const match = keys(suffixToDirectionMap).find((suffix) => filename.includes(suffix));
    if (!match) {
      parserLog.push({ file, message: `File name does not match any known suffix` });
      continue;
    }

    const [, filesMap] = (playbackEventClips[playbackTimestamp] ??= [eventTime, {}]);
    const direction = suffixToDirectionMap[match];
    const fileInMap = filesMap[direction];
    if (fileInMap) {
      parserLog.push({
        file: fileInMap,
        message: `Found duplicated file for "${playbackTimestamp}" in direction "${direction}": ${
          (fileInMap?.webkitRelativePath, fileInMap.webkitRelativePath)
        }`,
      });
    }
    filesMap[direction] = file;
    playbackEventClips[playbackTimestamp] = [eventTime, filesMap];
  }

  return {
    categories,
    parserLog,
  };
}
