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
  const { width, paddingTop, ...restStyle } = style ?? {};
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        paddingTop,
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", ...restStyle }}>
        {Children.map(Children.toArray(children), (child, index) => (isValidElement(child) && child.key !== null ? decorator(child, index) : child))}
      </div>
    </div>
  );
}
