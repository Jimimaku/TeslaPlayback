import { useReducer } from "react";

export enum ExportConfiguringState {
  Configuring = "configuring",
  Valid = "valid",
}

type ExportConfiguringReducerState =
  | {
      state: ExportConfiguringState.Configuring;
      trim: [Nullable<Date>, Nullable<Date>];
    }
  | {
      state: ExportConfiguringState.Valid;
      trim: [Date, Date];
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
    const {
      trim: [trimStart, trimEnd],
    } = state;
    if (!trimStart || !trimEnd) {
      return state;
    } else if (trimStart > trimEnd) {
      return {
        state: ExportConfiguringState.Valid,
        trim: [trimEnd, trimStart],
      };
    } else {
      return {
        state: ExportConfiguringState.Valid,
        trim: [trimStart, trimEnd],
      };
    }
  }
  return state;
};

export function useExportConfigureState() {
  return useReducer(
    (state: ExportConfiguringReducerState, action: ExportConfigureAction): ExportConfiguringReducerState => {
      const [trimStart, trimEnd] = state.trim;
      switch (action.type) {
        case ExportConfiguringActions.setTrimStart: {
          return validateState({
            state: ExportConfiguringState.Configuring,
            trim: [action.payload, trimEnd],
          });
        }
        case ExportConfiguringActions.setTrimEnd: {
          return validateState({
            state: ExportConfiguringState.Configuring,
            trim: [trimStart, action.payload],
          });
        }
        case ExportConfiguringActions.reset: {
          return {
            state: ExportConfiguringState.Configuring,
            trim: [null, null],
          };
        }
      }
      return state;
    },
    {
      state: ExportConfiguringState.Configuring,
      trim: [null, null],
    } satisfies ExportConfiguringReducerState,
  );
}
