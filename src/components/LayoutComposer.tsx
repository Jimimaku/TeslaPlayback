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
  decorator: (element: ReactElement, index: number) => DecoratableReactElement;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", position: "relative", ...style }}>
      {Children.map(Children.toArray(children), (child, index) => (isValidElement(child) && child.key !== null ? decorator(child, index) : child))}
    </div>
  );
}
