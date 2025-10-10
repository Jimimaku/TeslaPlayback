import { Progress } from "../../utils/exportVideo/convert";

export type ExportStateIdle = {
  state: "idle";
};

export type ExportStateLoadingConverter = {
  state: "loadingConverter";
};

export type ExportStateProcessing = {
  state: "processing";
  onProgress: (listener: (progress: Progress) => void) => void;
  cancel: () => void;
};

export type ExportStateDone = {
  state: "done";
  getOutput: () => Blob;
};

export type ExportStateFail = {
  state: "fail";
  reason: string;
};

export type ExportState = ExportStateIdle | ExportStateLoadingConverter | ExportStateProcessing | ExportStateDone | ExportStateFail;
