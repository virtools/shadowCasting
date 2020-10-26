import { Point } from "./point";
//import { Vector } from "./vector";
class Rect {
  static getPoints(rect) {
    const l = Rect.getLeft(rect);
    const r = Rect.getRight(rect);
    const t = Rect.getTop(rect);
    const b = Rect.getBottom(rect);
    return [
      [l, t],
      [r, t],
      [r, b],
      [l, b],
    ];
  }
  static getLines(rect) {
    const points = Rect.getPoints(rect);
    return points.map((point, index, array) => {
      return { point, vector: Point.getVector(point, array[(index + 1) % array.length]) };
    });
  }
  static getLeft(rect) {
    return rect.point[0];
  }
  static getRight(rect) {
    return rect.point[0] + rect.size[0];
  }
  static getTop(rect) {
    return rect.point[1];
  }
  static getBottom(rect) {
    return rect.point[1] + rect.size[1];
  }
}
export { Rect };
