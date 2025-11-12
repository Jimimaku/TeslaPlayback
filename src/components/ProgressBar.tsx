import { Box, BoxProps, SxProp, Tooltip } from "@primer/react";
import { clamp, juxt } from "ramda";
import { FC, InputHTMLAttributes, PropsWithChildren, useCallback, useMemo, useRef } from "react";
import { DragState, Position2D, usePointerHandler } from "../hooks/usePointerHandler";
import { usePositionHandler } from "../hooks/usePositionHandler";
import { ControlledPromise, createControlledPromise } from "../utils/ControlledPromise";
import { useSizeEntry } from "./useSizeEntry";

export type ProgressBarProps = {
  getCaretLabel: (value: number) => string;
  value: number;
  onChange?(value: number): void;
  range?: [total: number, start: number, end: number];
  onStartChange?(value: number, progress: [number, number]): void;
  onEndChange?(value: number, progress: [number, number]): void;
  onDrag?(endPromise: Promise<void>): void;
  native?: InputHTMLAttributes<HTMLProgressElement>;
} & SxProp;

const size = 12;
const yPadding = 4;
const caretWidth = 4;

type CaretProps = PropsWithChildren<
  {
    value: number;
    boxProps?: BoxProps;
  } & SxProp
>;

const BarCaret: FC<
  {
    tooltip: string;
  } & SxProp
> = ({ sx, tooltip }) => (
  <Tooltip text={tooltip}>
    <Box
      sx={{
        width: caretWidth + "px",
        bg: "accent.emphasis",
        cursor: "pointer",
        userSelect: "none",
        ...sx,
      }}
    >
      &nbsp;
    </Box>
  </Tooltip>
);

const TriangleCaret: FC<
  {
    tooltip: string;
    backgroundColor: string;
  } & SxProp
> = ({ sx, tooltip, backgroundColor }) => (
  <Tooltip text={tooltip}>
    <Box
      sx={{
        background: `linear-gradient(to bottom right, transparent 0%, transparent 50%, ${backgroundColor} 50%, ${backgroundColor} 100%)`,
        cursor: "pointer",
        userSelect: "none",
        ...sx,
      }}
    >
      &nbsp;
    </Box>
  </Tooltip>
);

const ProgressBarPositioner = ({ value, children, boxProps }: CaretProps) => (
  <Box
    {...boxProps}
    style={{
      left: (value * 100).toFixed(2) + "%",
      ...boxProps?.style,
    }}
    sx={{
      position: "absolute",
      top: 0,
      transform: "translateX(-50%)",
      ...boxProps?.sx,
    }}
  >
    {children}
  </Box>
);

export function ProgressBar({ getCaretLabel, value, onChange, range, onStartChange, onEndChange, onDrag, sx }: ProgressBarProps) {
  const [total, start, end] = range ?? [];

  const startValueRef = useRef<number>(start ?? 0);
  const onStartCaretDragStateChange = useMemo(() => createOnDragStart(onDrag), [onDrag]);
  const { onPointerDown: onStartCaretPointerDown } = usePositionHandler(
    (delta) => {
      if (end == null) return;
      const d = clamp(0, 1, resolveDelta(startValueRef.current, delta));
      onStartChange?.(d, [d, end]);
      onChange?.(d);
    },
    {
      onDragStateChange: juxt([
        onStartCaretDragStateChange,
        (state) => {
          if (state === "dragging") {
            startValueRef.current = start ?? 0;
          }
        },
      ]),
    },
  );
  const startCaret = start != null && total != null && (
    <ProgressBarPositioner
      value={start}
      boxProps={{
        sx: { top: yPadding + size + "px" },
        onPointerDown: onStartCaretPointerDown,
      }}
    >
      <TriangleCaret
        tooltip={`Trim start: ${getCaretLabel(start)}`}
        backgroundColor="#0969da"
        sx={{
          width: size + "px",
          height: size + "px",
          transform: "translateX(-50%)",
        }}
      />
    </ProgressBarPositioner>
  );

  const endValueRef = useRef<number>(end ?? 1);
  const onEndCaretDragStateChange = useMemo(() => createOnDragStart(onDrag), [onDrag]);
  const { onPointerDown: onEndCaretPointerDown } = usePositionHandler(
    (delta) => {
      if (start == null) return;
      const d = clamp(0, 1, resolveDelta(endValueRef.current, delta));
      onEndChange?.(d, [start, d]);
      onChange?.(d);
    },
    {
      onDragStateChange: juxt([
        onEndCaretDragStateChange,
        (state) => {
          if (state === "dragging") {
            endValueRef.current = end ?? 1;
          }
        },
      ]),
    },
  );
  const endCaret = end != null && total != null && (
    <ProgressBarPositioner
      value={end}
      boxProps={{
        sx: { top: yPadding + size + "px" },
        onPointerDown: onEndCaretPointerDown,
      }}
    >
      <TriangleCaret
        tooltip={`Trim end: ${getCaretLabel(end)}`}
        backgroundColor="#0969da"
        sx={{
          width: size + "px",
          height: size + "px",
          transform: "translateX(50%) rotateY(180deg)",
        }}
      />
    </ProgressBarPositioner>
  );

  const progressControlBarRef = useRef<HTMLElement | null>(null);
  const contentRect = useSizeEntry(progressControlBarRef)?.contentRect;
  const width = contentRect?.width;
  const resolveDelta = useCallback((initialValue: number, [delta]: Position2D) => clamp(0, 1)(width ? initialValue + delta / width : 0), [width]);

  const progressBarControlRef = useRef<ControlledPromise<void> | null>(null);
  const initialValueRef = useRef<number>(value);
  const { onPointerDown: onProgressPointerDown } = usePointerHandler({
    onPointerDown() {
      initialValueRef.current = value;
      progressBarControlRef.current = createControlledPromise<void>();
      onDrag?.(progressBarControlRef.current.promise);
    },
    onPointerMove: (e, delta) => {
      if (!progressBarControlRef.current) return;

      const pointerDown = e.buttons === 1;
      if (!pointerDown) return;
      onChange?.(resolveDelta(initialValueRef.current, delta));
    },
    onPointerUp: (/* e: React.PointerEvent */) => {
      progressBarControlRef.current?.resolve();
      progressBarControlRef.current = null;
    },
  });

  const activeArea = start != null && end != null && total != null && (
    <Box
      style={{
        left: (start * 100).toFixed(2) + "%",
        width: `${((end - start) * 100).toFixed(2)}%`,
      }}
      borderRadius={size}
      top={yPadding + "px"}
      height={size}
      position="absolute"
      bg="accent.emphasis"
      onPointerDown={onProgressPointerDown}
    />
  );

  const setValueOnBarPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const left = progressControlBarRef.current?.getBoundingClientRect().left;
      if (!width || left == null) return;
      const newValue = (e.clientX - left) / width;
      initialValueRef.current = newValue;
      return onChange?.(newValue);
    },
    [width, onChange],
  );
  const onBarPointerDown = useMemo(() => juxt([onProgressPointerDown, setValueOnBarPointerDown]), [setValueOnBarPointerDown, onProgressPointerDown]);

  const progressCaret = (
    <ProgressBarPositioner
      value={value}
      sx={{ bg: "black" }}
      boxProps={{
        onPointerDown: onProgressPointerDown,
      }}
    >
      <BarCaret tooltip={getCaretLabel(value)} sx={{ height: size + 2 * yPadding + "px", filter: "invert(1)" }} />
    </ProgressBarPositioner>
  );

  const backgroundBar = (
    <Box
      role="progressbar"
      position="absolute"
      width="100%"
      bg="neutral.muted"
      borderRadius={size}
      top={yPadding + "px"}
      height={size}
      aria-valuenow={value}
    />
  );

  const progressControlBar = (
    <Box
      ref={progressControlBarRef}
      position="absolute"
      width="100%"
      bg="transparent"
      onPointerDown={onBarPointerDown}
      draggable={false}
      top={yPadding + "px"}
      height={size}
    />
  );

  return (
    <Box draggable={false} width="100%" position="relative" height={size + yPadding * 2} sx={sx}>
      {backgroundBar}
      {activeArea}
      {progressControlBar}
      {startCaret}
      {endCaret}
      {progressCaret}
    </Box>
  );
}

function createOnDragStart(onDragStart: ((endPromise: Promise<void>) => void) | undefined): (state: DragState) => void {
  let r: ControlledPromise<void> | undefined;
  return (state) => {
    switch (state) {
      case "idle":
        r = createControlledPromise();
        onDragStart?.(r.promise);
        break;
      case "dragging":
        r?.resolve();
        r = undefined;
        break;
    }
  };
}
