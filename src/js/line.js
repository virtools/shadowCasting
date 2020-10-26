import { Point } from "./point";
import { Vector } from "./vector";
class Line {
  static intersection(line0, line1) {
    const c1 = Vector.cross(line0.vector, line1.vector);
    if (c1 === 0) {
      return null;
    }
    const v = Point.getVector(line0.point, line1.point);
    /*const c2 = Vector.cross(v, line1.vector);
    if (c2 === 0) {
      return "兩線重疊";
    } else {
      return "兩線平行但不重疊";
    }*/
    return {
      t0: Vector.cross(v, line1.vector) / c1,
      t1: Vector.cross(v, line0.vector) / c1,
    };
  }
  static checkIntersectionData(obj) {
    return obj && obj.t0 >= 0 && obj.t0 <= 1 && obj.t1 >= 0 && obj.t1 <= 1;
  }
  static pointCast(point, vector, line) {
    const obj = Line.intersection({ point, vector }, line);
    if (obj && obj.t0 >= 0) {
      return Point.addVector(point, Vector.scale(vector, obj.t0));
    }
  }
  static lineCast(point, line0, line1) {
    const deviation = 0.000001;
    const points = [];

    const obj = Line.intersection(line0, line1);
    if (obj && obj.t0 >= 0 && obj.t0 <= 1 && obj.t1 >= 0 && obj.t1 <= 1) {
      const point = Point.addVector(line0.point, Vector.scale(line0.vector, obj.t0));
      points.push(point, point);
    }

    if (points.length < 4) {
      const p2 = line1.point;
      const obj2 = Line.intersection({ point: point, vector: Point.getVector(point, p2) }, line0);
      if (obj2 && obj2.t0 >= 0 && obj2.t0 <= 1 && obj2.t1 >= 0 && obj2.t1 <= 1) {
        const point = Point.addVector(line0.point, Vector.scale(line0.vector, obj2.t1));
        points.push(point, p2);
      }
    }

    if (points.length < 4) {
      const p3 = Point.addVector(line1.point, line1.vector);
      const obj3 = Line.intersection({ point: point, vector: Point.getVector(point, p3) }, line0);
      if (obj3 && obj3.t0 >= 0 && obj3.t0 <= 1 && obj3.t1 >= 0 && obj3.t1 <= 1) {
        const point = Point.addVector(line0.point, Vector.scale(line0.vector, obj3.t1));
        points.push(point, p3);
      }
    }
    const len = Vector.length(line1.vector);

    if (points.length < 4) {
      const p0 = line0.point;
      const obj0 = Line.intersection({ point: p0, vector: Point.getVector(point, p0) }, line1);
      if (obj0 && obj0.t0 >= 0 && obj0.t1 * len > 0 - deviation && obj0.t1 * len < len + deviation) {
        const point = Point.addVector(line1.point, Vector.scale(line1.vector, obj0.t1));
        points.push(p0, point);
      }
    }

    if (points.length < 4) {
      const p1 = Point.addVector(line0.point, line0.vector);
      const obj1 = Line.intersection({ point: p1, vector: Point.getVector(point, p1) }, line1);
      if (obj1 && obj1.t0 >= 0 && obj1.t1 * len > 0 - deviation && obj1.t1 * len < len + deviation) {
        const point = Point.addVector(line1.point, Vector.scale(line1.vector, obj1.t1));
        points.push(p1, point);
      }
    }

    if (points.length >= 4) {
      [points[1], points[2]] = [points[2], points[1]];
      const changeDir = (point, points, index0, index1) => {
        const v0 = Point.getVector(points[index0], points[index1]);
        const v1 = Point.getVector(points[index0], point);
        const bool = Vector.cross(v0, v1) > 0;
        if (bool) {
          [points[index0], points[index1]] = [points[index1], points[index0]];
        }
      };
      changeDir(point, points, 0, 1);
      changeDir(point, points, 3, 2);

      return points;
    }
  }
  static getEquation(line) {
    return { a: line.vector[1], b: -line.vector[0], c: Vector.cross(line.vector, line.point) };
  }
}
export { Line };
