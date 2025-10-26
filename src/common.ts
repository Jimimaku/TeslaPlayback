import { isNotNil, when } from "ramda";
import { TeslaFS } from "./TeslaFS";
import { shiftTime } from "./utils/time";

export enum Directions {
  front = "front",
  rear = "rear",
  left = "left",
  right = "right",
  leftPillar = "left_pillar",
  rightPillar = "right_pillar",
}
export const directions: Directions[] = Object.values(Directions);
export type ClipFiles = {
  [direction in Directions]?: File;
};
export type PlaybackEventSlice = [time: Date, files: ClipFiles];
export const getClipTime = ([time]: PlaybackEventSlice) => time;
export const getClipFiles = ([, clipFiles]: PlaybackEventSlice) => clipFiles;
export type PlaybackEvent = [time: Date, slices: Record<TeslaFS.Timestamp, PlaybackEventSlice>];
export const getEventTime = ([time]: PlaybackEvent): Date => time;
export const getEventSlices = ([, slices]: PlaybackEvent) => slices;
export type PlaybackEvents = Record<TeslaFS.Timestamp, PlaybackEvent>;
export type ClipCategories = Record<TeslaFS.ClipCategory, PlaybackEvents>;

export type MergedEvent = {
  start: Date;
  end: Date;
  sliceArray: PlaybackEventSlice[];
};

export const mergeEvent = (event: PlaybackEvent): MergedEvent => {
  const slices = Object.values(getEventSlices(event));
  const sortedSlices = slices.sort((a, b) => getClipTime(a).getTime() - getClipTime(b).getTime());
  const clipTime = when(isNotNil<Nullable<PlaybackEventSlice>>, getClipTime);
  const defaultSliceDuration = 60 * 1000; // TODO: derive from files metadata
  return {
    start: clipTime(sortedSlices.at(0))!,
    end: shiftTime(clipTime(sortedSlices.at(-1))!, defaultSliceDuration),
    sliceArray: sortedSlices,
  };
};
