import { Point, PointE } from "./point";
import { Vector, VectorE } from "./vector";
import { Line } from "./line";
import { Rect } from "./rect";
import { cropNumber } from "./number";
import { setShadow, clearShadow, drawPolygon, drawCircle, drawLine } from "./canvas";
import { debounce } from "./base";
import { Matrix2D } from "./matrix";

//取得與直線交點最短距離線段索引號
const getShortestDistanceData = (point, vector, lines) => {
  let distance = Infinity;
  let index = -1;
  let intersectionData = null;
  lines.forEach((line, i) => {
    const obj = Line.intersection({ point, vector }, line);
    if (obj && obj.t0 > 0 && obj.t1 >= 0 && obj.t1 <= 1) {
      const d = obj.t0 * Vector.length(vector);
      if (d < distance) {
        distance = d;
        index = i;
        intersectionData = obj;
      }
    }
  });
  return { index, intersectionData };
};

//取得所有直線的交點
const getIntersectionPoints = (lines) => {
  const intersectionPoints = [];
  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const obj = Line.intersection(lines[i], lines[j]);
      if (obj && obj.t0 > 0 && obj.t0 < 1 && obj.t1 > 0 && obj.t1 < 1) {
        intersectionPoints.push(Point.addVector(lines[i].point, Vector.scale(lines[i].vector, obj.t0)));
      }
    }
  }
  return intersectionPoints;
};
const update = () => {
  const deviation = 0.000001;
  //邊界範圍
  const rectL = Rect.getLeft(rect);
  const rectR = Rect.getRight(rect);
  const rectT = Rect.getTop(rect);
  const rectB = Rect.getBottom(rect);

  //將所有多邊形的邊線取出
  const rectLines = Rect.getLines(rect);
  const polygonsLines = polygons
    .map((polygon) => {
      if (polygon.points.length > 2) {
        return polygon.points.map((point, index, array) => {
          return { point: point.slice(), vector: Point.getVector(point, array[(index + 1) % array.length]) };
        });
      } else if (polygon.points.length > 1) {
        return [{ point: polygon.points[0].slice(), vector: Point.getVector(polygon.points[0], polygon.points[1]) }];
      }
    })
    .map((lines) => {
      return lines
        .map((line) => {
          //裁切超出邊界的線段
          let bool = false;
          rectLines.forEach((rectLine) => {
            const obj = Line.intersection(rectLine, line);
            if (Line.checkIntersectionData(obj)) {
              bool = true;
              const v = Point.getVector(rectLine.point, line.point);
              if (Vector.cross(rectLine.vector, v) > 0) {
                VectorE.scale(line.vector, obj.t1);
              } else {
                PointE.addVector(line.point, Vector.scale(line.vector, obj.t1));
                VectorE.scale(line.vector, 1 - obj.t1);
              }
            }
          });
          if (!bool) {
            //判斷直線的兩個點是否在範圍內
            if (line.point[0] >= rectL && line.point[0] <= rectR && line.point[1] >= rectT && line.point[1] <= rectB) {
              bool = true;
            } else {
              const p = Point.addVector(line.point, line.vector);
              if (p[0] >= rectL && p[0] <= rectR && p[1] >= rectT && p[1] <= rectB) {
                bool = true;
              }
            }
          }
          //console.log(bool, i);
          if (bool) {
            return line;
          }
        })
        .filter((line) => {
          return line !== undefined;
        });
    });

  //阻擋投射的線
  const lines = [...rectLines, ...polygonsLines.flat()];

  //取得所有直線的交點
  const intersectionPoints = getIntersectionPoints(lines);

  //投射的點
  const points = [
    ...Rect.getPoints(rect),
    ...polygonsLines.flatMap((lines) => {
      if (lines.length === 1) {
        return [lines[0].point, Point.addVector(lines[0].point, lines[0].vector)];
      } else {
        return lines.map((line) => {
          return line.point;
        });
      }
    }),
    ...intersectionPoints,
  ];

  /*ctx.save();
  lines.forEach((line) => {
    drawLine(ctx, line.point, Point.addVector(line.point, line.vector), "#00ff00", 4);
  });
  ctx.restore();*/

  /*ctx.save();
  points.forEach((point) => {
    drawCircle(ctx, point, 5, "#00ff00", "fill");
  });
  ctx.restore();*/

  //投射線的點
  const castPoint = points.filter((point) => {
    //消除一些背面的點
    const v = Point.getVector(mPos, point);
    const len = Vector.length(v);
    return !lines.some((line) => {
      const len0 = Vector.length(line.vector);
      const obj = Line.intersection({ point: mPos, vector: v }, line);
      return (
        obj &&
        obj.t0 > 0 &&
        obj.t0 * len < len - deviation &&
        obj.t1 * len0 >= 0 - deviation &&
        obj.t1 * len0 <= len0 + deviation
      );
    });
  });

  /*ctx.save();
  castPoint.forEach((point) => {
    drawCircle(ctx, point, 5, "#00ff00", "fill");
  });
  ctx.restore();*/

  //排列角度順序
  const angles = castPoint.map((point, index) => {
    return { angle: Vector.getAngle(Point.getVector(mPos, point)), index: index };
  });
  angles.sort((a, b) => a.angle - b.angle);

  //console.log(angles.length * lines.length, 4 * (angles.length / 4) * (lines.length / 4));

  lightPolygons = angles.flatMap((angle, i, array) => {
    //判斷是否穿過縫隙投射
    const pp0 = castPoint[angle.index];
    const pp1 = castPoint[array[(i + 1) % array.length].index];
    const point = Point.toPosRate(pp0, pp1, 0.5);
    const vector = Point.getVector(mPos, point);

    //抓取兩投射線中穿越所投射的line資訊
    const data = getShortestDistanceData(mPos, vector, lines);
    if (data.index != -1 && data.intersectionData.t0 - 1 > 0) {
      //將兩個投射線延伸投射到指定的line
      const line = lines[data.index];
      const p0 = Line.pointCast(mPos, Point.getVector(mPos, pp0), line);
      if (!p0) {
        return [];
      }
      const p1 = Line.pointCast(mPos, Point.getVector(mPos, pp1), line);
      if (!p1) {
        return [];
      }
      return [p0, p1];
    } else {
      return [pp0, pp1];
    }
  });

  //補充在邊界角落的點
  /*const rectL = Rect.getLeft(rect);
  const rectR = Rect.getRight(rect);
  const rectT = Rect.getTop(rect);
  const rectB = Rect.getBottom(rect);*/
  let index = -1;
  if (mPos[0] <= rectL) {
    index = lightPolygons.findIndex((point) => point[0] <= rectL);
  } else if (mPos[0] >= rectR) {
    index = lightPolygons.findIndex((point) => point[0] >= rectR);
  } else if (mPos[1] <= rectT) {
    index = lightPolygons.findIndex((point) => point[1] <= rectT);
  } else if (mPos[1] >= rectB) {
    index = lightPolygons.findIndex((point) => point[1] >= rectB);
  }
  if (index !== -1) {
    index += index % 2 ? 1 : 0;
    lightPolygons = [...lightPolygons.slice(index, lightPolygons.length), ...lightPolygons.slice(0, index), mPos, mPos];
  }

  /*const rectLines = Rect.getLines(rect);
  const lines01 = lightPolygons
    .map((point, i, array) => {
      if (i % 2 === 0) {
        return Point.getLine(point, array[i + 1]);
      }
    })
    .filter((line) => line);

  shadowPolygons = lines01
    .flatMap((line) => {
      return rectLines.map((line0) => {
        const obj = Line.lineCast(mPos, line, line0);
        if (obj) {
          return obj;
        }
      });
    })
    .filter((points) => {
      return points !== undefined;
    });*/

  /*shadowPolygons = lines
    .flatMap((line, index) => {
      if (index >= 4) {
        return lines.map((line0, index0) => {
          //if (index0 != index) {
          if (index0 < 4) {
            const obj = Line.lineCast(mPos, line, line0);
            if (obj) {
              return obj;
            }
          }
        });
      }
    })
    .filter((points) => {
      return points !== undefined;
    });*/
};
const render = () => {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.save();
  const radialGradient0 = ctx.createRadialGradient(...mPos, 0, ...mPos, Vector.length([cWidth, cHeight]));
  radialGradient0.addColorStop(0, "rgba(0,0,0,1)");
  radialGradient0.addColorStop(0.3, "rgba(0,0,0,0.5)");
  radialGradient0.addColorStop(1, "rgba(0,0,0,0)");
  shadowPolygons.forEach((polygon) => {
    drawPolygon(ctx, polygon, radialGradient0, "fill");
    /*const v = Point.getVector(polygon[0], polygon[1]);
    [v[0], v[1]] = [-v[1], v[0]];
    VectorE.scale(VectorE.normalize(v), 200);
    var linearGradient = ctx.createLinearGradient(...polygon[0], ...Point.addVector(polygon[0], v));
    linearGradient.addColorStop(0, "rgba(0,0,0,1)");
    linearGradient.addColorStop(0.3, "rgba(0,0,0,0.5)");
    linearGradient.addColorStop(1, "rgba(0,0,0,0)");
    drawPolygon(ctx, polygon, linearGradient, "fill");*/
  });
  ctx.restore();

  ctx.save();
  const radialGradient = ctx.createRadialGradient(...mPos, 0, ...mPos, Vector.length([cWidth, cHeight]));
  radialGradient.addColorStop(0, "hsl(40,100%,70%)");
  radialGradient.addColorStop(0.1, "hsl(50,100%,55%)");
  radialGradient.addColorStop(0.3, "hsl(60,100%,50%)");
  radialGradient.addColorStop(1, "hsl(60,0%,0%)");
  drawPolygon(ctx, lightPolygons, radialGradient, "fill");
  ctx.restore();

  drawCircle(ctx, mPos, 2, "#0000ff", "fill");
  //drawCircle(ctx, [1500, 0], 10, "#00ff00", "fill");
  //drawCircle(ctx, [300, 400], 10, "#00ff00", "fill");

  ctx.save();
  ctx.lineWidth = 2;
  polygons.forEach((polygon) => {
    drawPolygon(ctx, polygon.points, polygon.color, polygon.type);
    //drawCircle(ctx, polygon.points[0], 5, "#00ff00", "fill");
  });
  ctx.restore();

  /*ctx.save();
  ctx.globalCompositeOperation = "lighter";
  setShadow(ctx, 0, 0, 3, "#ffffff");
  lightPolygons.forEach((point, i, array) => {
    if (i % 2 === 0) {
      drawLine(ctx, point, array[i + 1], "#ffffff", 1);
    }
  });
  ctx.restore();*/
};
const loop = () => {
  requestAnimationFrame(loop);
  const nowTime = Date.now();
  const delta = (nowTime - oldTime) / 1000;
  oldTime = nowTime;
  fps = 1 / delta;
  ctx.clearRect(0, 0, cWidth, cHeight);
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, cWidth, cHeight);
  update();
  render();

  ctx.save();
  ctx.font = "bold 18px Noto Sans TC";
  ctx.textAlign = "start";
  ctx.textBaseline = "hanging";
  ctx.fillStyle = "#ff0000";
  ctx.fillText(fps.toFixed(1), 10, 10);
  ctx.restore();
};
let fps = 0;
let oldTime = Date.now();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let cWidth, cHeight;
cWidth = window.innerWidth;
cHeight = window.innerHeight;
const mPos = [cWidth * 0.5, cHeight * 0.5];
let lightPolygons = [];
let shadowPolygons = [];
const rect = { point: [0, 0], size: [600, 600] };
let polygons = [];
/*polygons.push({
  points: [
    [0, 0],
    [600, 0],
    [600, 600],
    [0, 600],
  ],
  color: "",
  type: "stroke",
  name: "rect",
});*/
const getElementPagePos = (element) => {
  const pos = [0, 0];
  let m = element;
  while (m) {
    pos[0] += m.scrollLeft ?? 0;
    pos[1] += m.scrollTop ?? 0;
    m = m.parentElement;
  }
  const rect = element.getBoundingClientRect();
  return [rect.x + pos[0], rect.y + pos[1]];
};
const getSVGMatrix = (element) => {
  let m = element;
  let matrix2D = Matrix2D.identity();
  while (m) {
    if (m.tagName == "svg") {
      return matrix2D;
    }

    const data = m.transform.baseVal.consolidate();
    if (data && data.matrix) {
      const matrix = [
        data.matrix.a,
        data.matrix.b,
        0,
        data.matrix.c,
        data.matrix.d,
        0,
        data.matrix.e,
        data.matrix.f,
        1,
      ];
      matrix2D = Matrix2D.multiply(matrix, matrix2D);
    }

    m = m.parentElement;
  }
  return;
};
const setPolygons = () => {
  polygons = [];
  for (let i = 0; i < 100; i++) {
    const angle = 2 * Math.PI * Math.random();
    const len = 20 + 20 * Math.random();
    const point = [len * 0.5 + (cWidth - len) * Math.random(), len * 0.5 + (cHeight - len) * Math.random()];
    const point0 = [Math.cos(angle), Math.sin(angle)];
    polygons.push({
      points: [
        Point.addVector(point, Vector.scale(point0, -len * 0.5)),
        Point.addVector(point, Vector.scale(point0, len * 0.5)),
      ],
      color: "#333399",
      type: "stroke",
    });
  }
  const svg = document.getElementById("svg");
  const svg_path = svg.querySelectorAll("#g > path");
  const path01 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const textPolygons = [...svg_path].flatMap((path, index) => {
    const relativePos = getElementPagePos(svg);
    const matrix = getSVGMatrix(path);
    if (matrix) {
      VectorE.add(relativePos, Matrix2D.transform(matrix, [0, 0]));
    }
    return path
      .getAttribute("d")
      .split(/\m|\M/g)
      .filter((s) => s)
      .map((s) => {
        const obj = s.match(/^\s*(?<x>\-?\d+(.\d*)?)\s*\,?\s*(?<y>\-?\d+(.\d*)?)/);
        return { s: "m" + s, point: [parseFloat(obj.groups.x), parseFloat(obj.groups.y)] };
      })
      .map((obj, ii, array) => {
        path01.setAttribute("d", obj.s);
        const len = path01.getTotalLength();
        const movePoint = ii === 0 ? [0, 0] : array[ii - 1].point;
        PointE.addVector(movePoint, relativePos);
        //const movePoint = ii === 0 ? [0, 0] : [100, 100];
        return {
          points: new Array(Math.ceil(len / 5)).fill(undefined).map((el, i, array) => {
            const point = posToArray(path01.getPointAtLength((i / array.length) * len));
            return Point.addVector(point, movePoint);
          }),
          color: "#993333",
          type: "stroke",
        };
      })
      .filter((obj) => obj);
  });
  //console.log(textPolygons);
  polygons.push(...textPolygons);
};
const posToArray = (pos) => {
  return [pos.x, pos.y];
};
setPolygons();

//轉換成阻擋與投射線資料
//let { lines, points } = getLightCastData(rect, polygons);

/*for (let i = 0; i < 10; i++) {
  const point = [cWidth * Math.random(), cHeight * Math.random()];
  const angle = 2 * Math.PI * Math.random();
  const len = 200 + 500 * Math.random();
  polygons.push({
    points: [point, Point.addVector(point, Vector.scale([Math.cos(angle), Math.sin(angle)], len))],
    color: "#993333",
    type: "stroke",
  });
}*/

/*polygons.push({
  points: [
    [100, 200],
    [200, 200],
  ],
  color: "#993333",
  type: "stroke",
});

polygons.push({
  points: [
    [150, 500],
    [300, 400],
  ],
  color: "#993333",
  type: "stroke",
});

polygons.push({
  points: [
    [150, 400],
    [800, 500],
  ],
  color: "#993333",
  type: "stroke",
});

polygons.push({
  points: [
    [650, 400],
    [650, 500],
  ],
  color: "#993333",
  type: "stroke",
});*/

//VectorE.set(mPos, 549, 734);
//VectorE.set(mPos, 541, 814);
//VectorE.set(mPos, 291, 406);

const mousemove = (e) => {
  VectorE.set(mPos, e.pageX, e.pageY);
  mPos[0] = cropNumber(mPos[0], Rect.getLeft(rect), Rect.getRight(rect));
  mPos[1] = cropNumber(mPos[1], Rect.getTop(rect), Rect.getBottom(rect));
  //console.log(mPos);
};
const resize = (e) => {
  cWidth = canvas.width = window.innerWidth;
  cHeight = canvas.height = window.innerHeight;
  VectorE.set(rect.size, cWidth, cHeight);
  mPos[0] = cropNumber(mPos[0], Rect.getLeft(rect), Rect.getRight(rect));
  mPos[1] = cropNumber(mPos[1], Rect.getTop(rect), Rect.getBottom(rect));

  //setPolygons();
  /*const obj = getLightCastData(rect, polygons);
  lines = obj.lines;
  points = obj.points;*/
};
window.addEventListener("mousemove", mousemove);
window.addEventListener("resize", debounce(resize));
resize();
loop();
