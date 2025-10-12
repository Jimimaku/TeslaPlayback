import React, { useCallback, useRef, useState } from "react";
import { PositionHandlerOptions } from "./usePositionHandler";
import { useWindowPointerEvent } from "./useWindowPointerEvent";

export type Position2D = [number, number];

export type DragState = "idle" | "dragging";

export type PointerHandlerOptions = Partial<{
  onDragStateChange: (state: DragState) => void;
}>;

export function usePointerHandler(
  _onPointerMove: (e: PointerEvent, delta: Position2D) => void,
  _onPointerUp: (e: PointerEvent) => void,
  { onDragStateChange }: PositionHandlerOptions = {}
) {
  const [dragState, setDragState] = useState<DragState>("idle");
  const initialPositionRef = useRef<Position2D | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!initialPositionRef.current) return;
      const { clientX: x1, clientY: y1 } = e;

      const [x0, y0] = initialPositionRef.current;
      const delta: Position2D = [x1 - x0, y1 - y0];
      _onPointerMove(e, delta);
    },
    [_onPointerMove]
  );
  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!initialPositionRef.current) return;
      initialPositionRef.current = null;

      _onPointerUp(e);

      onDragStateChange?.("idle");
      setDragState("idle");
    },
    [_onPointerUp, onDragStateChange]
  );

  useWindowPointerEvent("pointermove", onPointerMove, dragState === "dragging");
  useWindowPointerEvent("pointerup", onPointerUp, dragState === "dragging");

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault(); // Prevent unexpected selection when dragging in Safari
      const { clientX, clientY } = e;
      initialPositionRef.current = [clientX, clientY];
      onDragStateChange?.("dragging");
      setDragState("dragging");
    },
    [onDragStateChange]
  );

  return {
    onPointerDown,
  };
}
