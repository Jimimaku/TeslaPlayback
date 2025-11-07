import { TextOverlay } from "../convert";

export function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, drawTextStyle: TextOverlay) {
  const {
    quad,
    fontSize = 36,
    fontFamily = "system-ui, sans-serif",
    fontColor: color = "#fff",
    backgroundColor: bgColor = "rgba(0,0,0,0.6)",
  } = drawTextStyle;

  ctx.save();

  // fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(quad.x, quad.y, quad.w, quad.h);

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Text
  ctx.fillStyle = color;
  ctx.fillText(text, quad.w / 2, quad.h / 2, quad.w);

  ctx.restore();
}
