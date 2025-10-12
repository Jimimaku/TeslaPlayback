import { Progress } from "../../utils/exportVideo/convert";

export type ExportConvertStateIdle = {
  state: "idle";
};

export type ExportConvertStateLoadingConverter = {
  state: "loadingConverter";
};

export type ExportConvertStateProcessing = {
  state: "processing";
  onProgress: (listener: (progress: Progress) => void) => void;
  cancel: () => void;
};

export type ExportConvertStateDone = {
  state: "done";
  getOutput: () => Blob;
};

export type ExportConvertStateFail = {
  state: "fail";
  reason: string;
};

export type ExportConvertState =
  | ExportConvertStateIdle
  | ExportConvertStateLoadingConverter
  | ExportConvertStateProcessing
  | ExportConvertStateDone
  | ExportConvertStateFail;
