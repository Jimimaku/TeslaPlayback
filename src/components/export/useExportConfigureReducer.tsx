import { useReducer } from "react";

export enum ExportConfiguringState {
  Configuring = "configuring",
  Valid = "valid",
}

type ExportConfiguringReducerState =
  | {
      state: ExportConfiguringState.Configuring;
      trimStart: Date | null;
      trimEnd: Date | null;
    }
  | {
      state: ExportConfiguringState.Valid;
      trimStart: Date;
      trimEnd: Date;
    };

type Action<K extends string, T> = {
  type: K;
  payload: T;
};

export enum ExportConfiguringActions {
  setTrimStart = "setTrimStart",
  setTrimEnd = "setTrimEnd",
  reset = "reset",
}

type ExportConfigureAction =
  | Action<ExportConfiguringActions.setTrimStart, Date>
  | Action<ExportConfiguringActions.setTrimEnd, Date>
  | Action<ExportConfiguringActions.reset, null>;

/**
 * Validate and correct the state if needed
 */
const validateState = (state: ExportConfiguringReducerState): ExportConfiguringReducerState => {
  if (state.state === ExportConfiguringState.Configuring) {
    const { trimStart, trimEnd } = state;
    if (!trimStart || !trimEnd) {
      return state;
    } else if (trimStart > trimEnd) {
      return {
        state: ExportConfiguringState.Valid,
        trimStart: trimEnd,
        trimEnd: trimStart,
      };
    } else {
      return {
        state: ExportConfiguringState.Valid,
        trimStart,
        trimEnd,
      };
    }
  }
  return state;
};

export function useExportConfigureState() {
  return useReducer(
    (state: ExportConfiguringReducerState, action: ExportConfigureAction): ExportConfiguringReducerState => {
      switch (action.type) {
        case ExportConfiguringActions.setTrimStart: {
          return validateState({
            state: ExportConfiguringState.Configuring,
            trimStart: action.payload,
            trimEnd: state.trimEnd,
          });
        }
        case ExportConfiguringActions.setTrimEnd: {
          return validateState({
            state: ExportConfiguringState.Configuring,
            trimStart: state.trimStart,
            trimEnd: action.payload,
          });
        }
        case ExportConfiguringActions.reset: {
          return {
            state: ExportConfiguringState.Configuring,
            trimStart: null,
            trimEnd: null,
          };
        }
      }
      return state;
    },
    {
      state: ExportConfiguringState.Configuring,
      trimStart: null,
      trimEnd: null,
    } satisfies ExportConfiguringReducerState
  );
}
