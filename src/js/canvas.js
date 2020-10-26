const setShadow = (ctx, offsetX, offsetY, blur, color) => {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
};
const clearShadow = (ctx) => {
  setShadow(ctx, 0, 0, 0, "rgba(0, 0, 0, 0)");
};
const drawPolygon = (ctx, points, color, type) => {
  if (color) {
    ctx.beginPath();
    points.forEach((point, index) => {
      ctx[index === 0 ? "moveTo" : "lineTo"](...point);
    });
    ctx.closePath();
    ctx[type + "Style"] = color;
    ctx[type]();
  }
};
const drawCircle = (ctx, point, radius, color, type) => {
  if (color) {
    ctx.beginPath();
    ctx.arc(...point, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx[type + "Style"] = color;
    ctx[type]();
  }
};
const drawLine = (ctx, point01, point02, color, lineWidth = 1) => {
  if (color) {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.moveTo(...point01);
    ctx.lineTo(...point02);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
  }
};
export { setShadow, clearShadow, drawPolygon, drawCircle, drawLine };
