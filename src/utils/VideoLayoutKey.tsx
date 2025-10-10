import { Directions } from "../common";
import { values } from "./general";

export enum VideoLayoutKey {
  CLASSIC = "classic",
  HW4 = "hw4",
}

export const layoutKeys = values(VideoLayoutKey);

export const videoLayouts = {
  [VideoLayoutKey.CLASSIC]: [Directions.front, Directions.rear, Directions.left, Directions.right],
  [VideoLayoutKey.HW4]: [Directions.left, Directions.front, Directions.right, Directions.leftPillar, Directions.rear, Directions.rightPillar],
};
