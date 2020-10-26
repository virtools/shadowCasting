import { Vector } from "./vector.js";
class Point {
  static toPosRate(point0, point1, rate) {
    return [point0[0] * (1 - rate) + point1[0] * rate, point0[1] * (1 - rate) + point1[1] * rate];
  }
  static cross(point0, point1, point2) {
    return (point0[0] - point1[0]) * (point2[1] - point1[1]) - (point2[0] - point1[0]) * (point0[1] - point1[1]);
  }
  static getCenter(point0, point1) {
    return [(point0[0] + point1[0]) * 0.5, (point0[1] + point1[1]) * 0.5];
  }
  static getVector(point0, point1) {
    return [point1[0] - point0[0], point1[1] - point0[1]];
  }
  static addVector(point, vector) {
    return [point[0] + vector[0], point[1] + vector[1]];
  }
  static distance(point0, point1) {
    return Vector.length(Point.getVector(point0, point1));
  }
  static getLine(point0, point1) {
    return { point: point0, vector: Point.getVector(point0, point1) };
  }
}

class PointE {
  static set(point, x, y) {
    point[0] = x;
    point[1] = y;
    return point;
  }
  static addVector(point, vector) {
    point[0] += vector[0];
    point[1] += vector[1];
    return point;
  }
}

const getQuadraticCurveTo = (point0, point1, point2, t) => {
  const x = point0[0] * (1 - t) * (1 - t) + 2 * point1[0] * (1 - t) * t + point2[0] * t * t;
  const y = point0[1] * (1 - t) * (1 - t) + 2 * point1[1] * (1 - t) * t + point2[1] * t * t;
  return [x, y];
};
const getQuadraticCurveToTangent = (point0, point1, point2, t) => {
  const x = 2 * t * (point0[0] - point1[0] * 2 + point2[0]) + 2 * (-point0[0] + point1[0]);
  const y = 2 * t * (point0[1] - point1[1] * 2 + point2[1]) + 2 * (-point0[1] + point1[1]);
  return [x, y];
};
export { getQuadraticCurveTo, getQuadraticCurveToTangent, Point, PointE };
