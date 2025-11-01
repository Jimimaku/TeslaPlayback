import { Box, BoxProps, SxProp, Tooltip } from "@primer/react";
import { clamp, juxt } from "ramda";
import { FC, InputHTMLAttributes, PropsWithChildren, useCallback, useMemo, useRef } from "react";
import { DragState, usePointerHandler } from "../hooks/usePointerHandler";
import { usePositionHandler } from "../hooks/usePositionHandler";
import { ControlledPromise, createControlledPromise } from "./ControlledPromise";

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

  const onStartCaretDragStateChange = useMemo(() => createOnDragStart(onDrag), [onDrag]);
  const { onPointerDown: onStartCaretPointerDown } = usePositionHandler(
    (_, e) => {
      if (end == null) return;
      const d = clamp(0, 1, getRelativePointerPosition(e));
      onStartChange?.(d, [d, end]);
      onChange?.(d);
    },
    {
      onDragStateChange: onStartCaretDragStateChange,
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

  const onEndCaretDragStateChange = useMemo(() => createOnDragStart(onDrag), [onDrag]);
  const { onPointerDown: onEndCaretPointerDown } = usePositionHandler(
    (_, e) => {
      if (start == null) return;
      const d = clamp(0, 1, getRelativePointerPosition(e));
      onEndChange?.(d, [start, d]);
      onChange?.(d);
    },
    {
      onDragStateChange: onEndCaretDragStateChange,
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
  const getRelativePointerPosition = useCallback((e: PointerEvent) => {
    const current = progressControlBarRef.current;
    if (!current) {
      throw new Error("No progress control bar element");
    }
    const rect = current.getBoundingClientRect();
    return (e.clientX - rect.left) / rect.width;
  }, []);

  const { onPointerDown: onProgressPointerDown } = usePointerHandler(
    (e) => {
      if (!progressBarControlRef.current) return;

      const pointerDown = e.buttons === 1;
      if (!pointerDown) return;

      onChange?.(Math.max(0, Math.min(1, getRelativePointerPosition(e))));
    },
    (/* e: React.PointerEvent */) => {
      progressBarControlRef.current?.resolve();
      progressBarControlRef.current = null;
    },
  );

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

  const onBarPointerDown = useMemo(
    () =>
      juxt([
        (e: React.PointerEvent) => {
          progressBarControlRef.current = createControlledPromise<void>();
          onDrag?.(progressBarControlRef.current.promise);

          onChange?.(Math.max(0, Math.min(1, getRelativePointerPosition(e.nativeEvent))));
        },
        onProgressPointerDown,
      ]),
    [onChange, onDrag, onProgressPointerDown, getRelativePointerPosition],
  );

  const progressBarControlRef = useRef<ControlledPromise<void> | null>(null);
  const progressCaret = (
    <ProgressBarPositioner
      value={value}
      sx={{ bg: "black" }}
      boxProps={{
        onPointerDown: onBarPointerDown,
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
