import { map } from "ramda";
import { expect, test } from "vitest";
import { Size } from "../utils/exportVideo/convert";
import { categories } from "../utils/teslaFileSystem/__tests__/categoriesFromFiles";
import { VideoLayoutKey } from "../utils/VideoLayoutKey";
import { transformTracks } from "./MetaConfig";

const size: Size = { w: 1920, h: 1080 };

test("transformTracks classic", () => {
  expect(
    map(
      (category) =>
        map(
          (event) =>
            transformTracks(
              {
                layoutKey: VideoLayoutKey.CLASSIC,
                size,
              },
              event,
            ),
          category,
        ),
      categories,
    ),
  ).toMatchSnapshot();
});

test("transformTracks HW4", () => {
  expect(
    map(
      (category) =>
        map(
          (event) =>
            transformTracks(
              {
                layoutKey: VideoLayoutKey.HW4,
                size,
              },
              event,
            ),
          category,
        ),
      categories,
    ),
  ).toMatchSnapshot();
});
