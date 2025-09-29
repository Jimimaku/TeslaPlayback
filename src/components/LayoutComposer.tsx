import { Children, CSSProperties, isValidElement, ReactElement } from "react";

type DecoratableReactElement = ReactElement<{
  style?: CSSProperties;
}>;

export function LayoutComposer({
  children,
  decorator,
  style,
}: {
  children: Iterable<DecoratableReactElement> | DecoratableReactElement[];
  decorator: (index: number, element: ReactElement) => DecoratableReactElement;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", position: "relative", ...style }}>
      {Children.map(Children.toArray(children), (child, index) => (isValidElement(child) && child.key !== null ? decorator(index, child) : child))}
    </div>
  );
}
