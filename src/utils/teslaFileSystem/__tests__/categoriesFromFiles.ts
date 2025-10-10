import { processDashCamFiles } from "../processDashCamFiles";
import { files } from "./files";

export const { categories, parserLog } = processDashCamFiles(files);
