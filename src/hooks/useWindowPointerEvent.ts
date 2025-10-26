import { useEffect } from "react";

export function useWindowPointerEvent(
  pointerEventType: "pointermove" | "pointerup" | "pointerdown",
  onPointerMove: (e: PointerEvent) => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    window.addEventListener(pointerEventType, onPointerMove);
    return () => window.removeEventListener(pointerEventType, onPointerMove);
  }, [pointerEventType, onPointerMove, active]);
}
