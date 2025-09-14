import { fetchFile } from "@ffmpeg/util";
import fontArial from "../../../assets/fonts/Arial.ttf?url";
import { memoize } from "../../memoize";

export const loadFontFile = memoize(async () => await fetchFile(new URL(fontArial, import.meta.url).toString()));
