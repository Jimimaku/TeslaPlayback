import { DrawTextStyle } from "..";

// text-overlay.ts
export type TextOverlay = {
  fontSize?: number; // px (default 36)
  fontColor?: string; // CSS color; default '#fff'
  x: number; // canvas pixels
  y: number; // canvas pixels
  backgroundColor?: string; // CSS color; default 'rgba(0,0,0,0.6)'

  padding?: number; // px; default 8
  align?: CanvasTextAlign; // 'left'|'center'|'right'... default 'left'
  baseline?: CanvasTextBaseline; // default 'alphabetic'
  radius?: number; // bg corner radius; default 6
  fontFamily?: string; // default 'system-ui, sans-serif'
};

const transform = (drawTextStyle: DrawTextStyle): TextOverlay => ({
  x: drawTextStyle.x ?? 0,
  y: drawTextStyle.y ?? 50,
  fontSize: drawTextStyle.fontSize ?? 36,
  fontColor: drawTextStyle.fontColor ?? "#fff",
  backgroundColor: drawTextStyle.backgroundColor ?? "rgba(0,0,0,0.6)",
});

export function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, drawTextStyle: DrawTextStyle) {
  const {
    x,
    y,
    fontSize = 36,
    fontFamily = "system-ui, sans-serif",
    fontColor: color = "#fff",
    backgroundColor: bgColor = "rgba(0,0,0,0.6)",
    padding = 8,
    align = "left",
    baseline = "alphabetic",
    radius = 6,
  } = transform(drawTextStyle);

  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  // Measure text box
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || fontSize * 0.8;
  const desc = m.actualBoundingBoxDescent || fontSize * 0.2;
  const textW = m.width;
  const textH = asc + desc;

  // Compute background rect origin based on alignment/baseline
  let left = x;
  let top = y - asc;
  if (align === "center") left = x - textW / 2;
  else if (align === "right" || align === "end") left = x - textW;

  if (baseline === "top" || baseline === "hanging") top = y;
  else if (baseline === "middle") top = y - textH / 2;
  else if (baseline === "alphabetic" || baseline === "ideographic") top = y - asc;

  const bw = Math.ceil(textW + padding * 2);
  const bh = Math.ceil(textH + padding * 2);

  // Rounded background
  roundRect(ctx, left - padding, top - padding, bw, bh, radius);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
