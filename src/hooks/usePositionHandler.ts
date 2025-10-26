import { useCallback, useRef } from "react";
import { PointerHandlerOptions, Position2D, usePointerHandler } from "./usePointerHandler";

export type PositionHandlerOptions = PointerHandlerOptions &
  Partial<{
    onClick: (e: PointerEvent) => void;
    distanceTolerance: number;
  }>;

export function usePositionHandler(
  onChange: (position: Position2D, e: PointerEvent) => void,
  { onDragStateChange, onClick, distanceTolerance = 2 }: PositionHandlerOptions = {},
) {
  const pointerMoved = useRef(false);

  const _onPointerMove = useCallback(
    (e: PointerEvent, delta: Position2D) => {
      const [dx, dy] = delta;
      // Allow minor movement, this happened unintentionally for few times when I use track pad
      pointerMoved.current ||= dx ** 2 + dy ** 2 > distanceTolerance ** 2;
      onChange(delta, e);
    },
    [distanceTolerance, onChange],
  );

  const _onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!pointerMoved.current) onClick?.(e);
      pointerMoved.current = false;
    },
    [onClick],
  );

  return usePointerHandler(_onPointerMove, _onPointerUp, {
    onDragStateChange,
  });
}
