const setShadow = (ctx, offsetX, offsetY, blur, color) => {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
};
const clearShadow = (ctx) => {
  setShadow(ctx, 0, 0, 0, "rgba(0, 0, 0, 0)");
};
export { setShadow, clearShadow };
