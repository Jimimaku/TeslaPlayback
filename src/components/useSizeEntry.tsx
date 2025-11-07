import { useResizeObserver } from "@primer/react";
import { useState } from "react";

export function useSizeEntry(ref: React.RefObject<HTMLElement>) {
  const [sizeEntry, setSizeEntry] = useState<ResizeObserverEntry | null>(null);
  useResizeObserver(([entry]) => {
    setSizeEntry(entry as ResizeObserverEntry);
  }, ref);
  return sizeEntry;
}
