import { TeslaFS } from "./TeslaFS";

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
