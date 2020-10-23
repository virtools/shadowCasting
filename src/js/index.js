import { Point } from "./point";
import { Vector, VectorE } from "./vector";
import { setShadow, clearShadow } from "./canvas";

function intersectionPV(p0, v0, p1, v1) {
  const c1 = Vector.cross(v0, v1);
  if (c1 === 0) {
    return null;
  }
  const v = Point.getVector(p0, p1);
  /*const c2 = Vector.cross(v, v1);
  if (c2 === 0) {
    return "兩線重疊";
  } else {
    return "兩線平行但不重疊";
  }*/
  return {
    t0: Vector.cross(v, v1) / c1,
    t1: Vector.cross(v, v0) / c1,
  };
}

//判斷與直線交點比原先近
const lessThanVector = (point, vector, lines) => {
  let distance = Vector.length(vector);
  return !lines.some((line) => {
    const obj = intersectionPV(point, vector, line.point, line.vector);
    if (obj && obj.t0 > 0 && obj.t1 >= 0 && obj.t1 <= 1) {
      const d = obj.t0 * Vector.length(vector);
      return d < distance && Math.abs(d - distance) > 0.0000001;
    }
  });
};
//取得與直線交點最短距離
const getShortestDistance = (point, vector, lines) => {
  let distance = Infinity;
  lines.forEach((line01) => {
    const obj = intersectionPV(point, vector, line01.point, line01.vector);
    if (obj && obj.t0 >= 0 && obj.t1 >= 0 && obj.t1 <= 1) {
      const d = obj.t0 * Vector.length(vector);
      if (d < distance) {
        distance = d;
      }
    }
  });
  return distance;
};
//取得與直線交點最短距離線段索引號
const getShortestDistanceData = (point, vector, lines) => {
  let distance = Infinity;
  let index = -1;
  let intersectionData = null;
  lines.forEach((line01, index01) => {
    const obj = intersectionPV(point, vector, line01.point, line01.vector);
    if (obj && obj.t0 >= 0 && obj.t1 >= 0 && obj.t1 <= 1) {
      const d = obj.t0 * Vector.length(vector);
      if (d < distance) {
        distance = d;
        index = index01;
        intersectionData = obj;
      }
    }
  });
  return { index, intersectionData };
};
//點投射到某個直線上
const pointCast = (point, vector, line) => {
  const obj = intersectionPV(point, vector, line.point, line.vector);
  if (obj) {
    return Point.addVector(point, Vector.scale(vector, obj.t0));
  }
};
//取得所有直線的交點
const getIntersectionPoints = (lines) => {
  const intersectionPoints = [];
  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const obj = intersectionPV(lines[i].point, lines[i].vector, lines[j].point, lines[j].vector);
      if (obj && obj.t0 > 0 && obj.t0 < 1 && obj.t1 > 0 && obj.t1 < 1) {
        intersectionPoints.push(Point.addVector(lines[i].point, Vector.scale(lines[i].vector, obj.t0)));
      }
    }
  }
  return intersectionPoints;
};

function update() {
  //將所有多邊形的邊線取出
  const lines = polygons.flatMap((polygon, index01) => {
    if (polygon.points.length > 2) {
      return polygon.points.map((point, index, array) => {
        return { point, vector: Point.getVector(point, array[(index + 1) % array.length]) };
      });
    } else if (polygon.points.length > 1) {
      return { point: polygon.points[0], vector: Point.getVector(polygon.points[0], polygon.points[1]) };
    }
  });
  //取得所有直線的交點
  const intersectionPoints = getIntersectionPoints(lines);

  //投射的點
  const castPoint = [
    ...polygons.flatMap((polygon) => {
      return polygon.points;
    }),
    ...intersectionPoints,
  ];

  //放射線的點
  const points = castPoint.filter((point) => {
    //消除一些背面的點
    const v = Point.getVector(mPos, point);
    return lessThanVector(mPos, v, lines);
  });

  //排列角度順序
  const angles = points.map((point, index) => {
    return { angle: Vector.getAngle(Point.getVector(mPos, point)), index: index };
  });
  angles.sort((a, b) => a.angle - b.angle);

  lightPolygons = angles.flatMap((angle, i, array) => {
    //判斷是否穿過縫隙投射
    const pp0 = points[angle.index];
    const pp1 = points[array[(i + 1) % array.length].index];
    const point = Point.toPosRate(pp0, pp1, 0.5);
    const vector = Point.getVector(mPos, point);

    //抓取兩投射線中穿越所投射的line資訊
    const data = getShortestDistanceData(mPos, vector, lines);
    if (data.index != -1 && data.intersectionData.t0 > 1 + 0.0000001) {
      //將兩個投射線延伸投射到指定的line
      const p0 = pointCast(mPos, Point.getVector(mPos, pp0), lines[data.index]);
      const p1 = pointCast(mPos, Point.getVector(mPos, pp1), lines[data.index]);
      return [p0, p1];
    } else {
      return [pp0, pp1];
    }
  });
  /*lightPolygons.forEach((point) => {
    drawCircle(ctx, point, 10, "#ff0", "fill");
  });*/

  /*//將所有多邊形的邊線取出
  const lines = polygons.flatMap((polygon) => {
    return polygon.points.map((point, index, array) => {
      return { point, vector: Vector.sub(array[(index + 1) % array.length], point) };
    });
  });
  //產生所有直線的交點
  const intersectionPoints = [];
  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const obj = intersectionPV(lines[i].point, lines[i].vector, lines[j].point, lines[j].vector);
      if (obj && obj.t0 > 0 && obj.t0 < 1 && obj.t1 > 0 && obj.t1 < 1) {
        intersectionPoints.push(Point.addVector(lines[i].point, Vector.scale(lines[i].vector, obj.t0)));
      }
    }
  }

  const mainData = []; //存放角度與位置

  intersectionPoints
    .filter((point) => {
      //消除一些背面的點
      const v = Point.getVector(mPos, point);
      return lessThanVector(mPos, v, lines);
    })
    .forEach((point) => {
      const v = Point.getVector(mPos, point);
      let angle = Vector.getAngle(v);
      mainData.push({ angle: angle, pos: point });
    });

  //依滑鼠朝多邊形的每個點放射去掃描
  lines
    .filter((line) => {
      //消除一些背面的點
      const v = Point.getVector(mPos, line.point);
      return lessThanVector(mPos, v, lines);
    })
    .forEach((line) => {
      const v = Point.getVector(mPos, line.point);
      let angle = Vector.getAngle(v);
      mainData.push({ angle: angle, pos: line.point });
      mainData.push({ angle: angle - 0.0000000000001 });
      mainData.push({ angle: angle + 0.0000000000001 });
    });

  //排列角度順序
  mainData.sort((a, b) => b.angle - a.angle);

  //將放射狀射線去跟所有邊線做交點取最近的距離
  lightPolygons = mainData
    .map((data) => {
      if (data.pos) {
        return data.pos;
      } else {
        const v = [Math.cos(data.angle), Math.sin(data.angle)];
        const distance = getShortestDistance(mPos, v, lines);
        if (distance !== Infinity) {
          return Point.addVector(mPos, Vector.scale(v, distance));
        }
      }
    })
    .filter((point) => point !== undefined);*/
}
function render() {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  /*const gradient = ctx.createRadialGradient(...mPos, 0, ...mPos, Vector.length([cWidth, cHeight]));
  gradient.addColorStop(0, "#ffff00");
  gradient.addColorStop(1, "#000000");
  drawPolygon(ctx, lightPolygons, gradient, "fill");*/
  drawPolygon(ctx, lightPolygons, "#ff0", "fill");
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 2;
  polygons.forEach((polygon) => {
    drawPolygon(ctx, polygon.points, polygon.color, polygon.type);
  });
  ctx.restore();

  /*ctx.save();
  ctx.globalCompositeOperation = "lighter";
  setShadow(ctx, 0, 0, 10, "#ffffff");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  lightPolygons.forEach((point, i, array) => {
    if (i % 2 === 0) {
      drawLine(ctx, point, array[i + 1], "#ffffff", 5);
    }
  });
  ctx.restore();*/
}
function loop() {
  requestAnimationFrame(loop);
  ctx.clearRect(0, 0, cWidth, cHeight);
  update();
  render();
}
function drawPolygon(ctx, points, color, type) {
  if (color) {
    ctx.beginPath();
    points.forEach((point, index) => {
      ctx[index === 0 ? "moveTo" : "lineTo"](...point);
    });
    ctx.closePath();
    ctx[type + "Style"] = color;
    ctx[type]();
  }
}
function drawCircle(ctx, point, radius, color, type) {
  if (color) {
    ctx.beginPath();
    ctx.arc(...point, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx[type + "Style"] = color;
    ctx[type]();
  }
}
function drawLine(ctx, point01, point02, color, lineWidth = 1) {
  if (color) {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.moveTo(...point01);
    ctx.lineTo(...point02);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let cWidth, cHeight;
const mPos = [300, 300];
let lightPolygons = [];
const polygons = [];
polygons.push({
  points: [
    [0, 0],
    [600, 0],
    [600, 600],
    [0, 600],
  ],
  color: "",
  type: "stroke",
});
/*polygons.push({
  points: [
    [50, 50],
    [175, 75],
    [50, 150],
  ],
  color: "#999999",
  type: "fill",
});
polygons.push({
  points: [
    [250, 150],
    [375, 175],
    [250, 250],
  ],
  color: "#999999",
  type: "fill",
});
polygons.push({
  points: [
    [375, 250],
    [475, 375],
    [375, 450],
  ],
  color: "#999999",
  type: "fill",
});*/

cWidth = window.innerWidth;
cHeight = window.innerHeight;
/*polygons.push({
  points: [
    [378.89033342323853, 597.60532325293],
    [1218.33126852952, 605.3739335869079],
  ],
  color: "#999999",
  type: "stroke",
});
polygons.push({
  points: [
    [278.21780619138843, 166.4345298438775],
    [309.3974948931857, 664.1766874001323],
  ],
  color: "#999999",
  type: "stroke",
});*/
for (let i = 0; i < 100; i++) {
  const point = [cWidth * Math.random(), cHeight * Math.random()];
  const angle = 2 * Math.PI * Math.random();
  const len = 20 + 20 * Math.random();
  polygons.push({
    points: [point, Point.addVector(point, Vector.scale([Math.cos(angle), Math.sin(angle)], len))],
    color: "#999999",
    type: "stroke",
  });
}
//console.log(polygons);
/*polygons.push({
  points: [
    [30, 30],
    [100, 100],
  ],
  color: "#999999",
  type: "stroke",
});*/

const mousemove = (e) => {
  //console.log(e.pageX, e.pageY);
  VectorE.set(mPos, e.pageX, e.pageY);
};
const resize = (e) => {
  cWidth = canvas.width = window.innerWidth;
  cHeight = canvas.height = window.innerHeight;
  VectorE.set(polygons[0].points[0], 0, 0);
  VectorE.set(polygons[0].points[1], cWidth, 0);
  VectorE.set(polygons[0].points[2], cWidth, cHeight);
  VectorE.set(polygons[0].points[3], 0, cHeight);
};
window.addEventListener("mousemove", mousemove);
window.addEventListener("resize", resize);
resize();
loop();
