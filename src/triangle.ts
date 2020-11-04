/* eslint-disable no-undef */
import { gpoint3, Vectors3, point3 } from "./point3";
import {
  calcPercentGnomonicProjection as calcPercentGnomonic,
  calcPercentQuaternion,
  numDivisions,
  resolution,
  rotationMethod,
  roundNum,
  roundNums
} from "./stuff";

// direction tri is pointing in
export enum Pointing {
  DOWN,
  UP
}
export enum Position {
  TOP,
  CENTER,
  BOTTOM
}
/**
 *         A
 *        /\
 *      /   \
 *    /______\
 *   C        B
 */
export type triangle = {
  A: point3 | gpoint3;
  B: point3 | gpoint3;
  C: point3 | gpoint3;
  direction?: Pointing;
  pos?: Position;
  num?: number;
  // triangle next to this one (shares side)
  toAB?: number;
  toBC?: number;
  toCA?: number;
};

/**
 * triangle utility class
 */
export class Triangles {
  /**
   * @param tri triangle
   * @return random point that's also inside tri
   */
  static randomPointInTri({ tri }: { tri: triangle }) {
    let p = Vectors3.randomPoint();
    while (!Triangles.containsPoint({ tri: tri, point: p })) {
      p = Vectors3.randomPoint();
    }
    return p;
  }
  /**
   * generates points in triangle, only includes points along left side and
   * @param tri
   * @param resolution
   * @returns array of points in triangle for resolution
   */
  static generateAllPoints({
    tri,
    resolution = 1,
    rotationMethod = "gnomonic"
  }: {
    tri: triangle;
    resolution: resolution;
    rotationMethod?: rotationMethod;
  }): point3[][] {
    const points: point3[][] = [];
    const maxDivisions = resolution * 3;
    const left =
      rotationMethod === "gnomonic"
        ? Vectors3.sidePointsAllGnomonic({
          above: tri.direction === Pointing.UP ? tri.A : tri.B,
          below: tri.direction === Pointing.UP ? tri.C : tri.A,
          resolution: resolution
        })
        : Vectors3.sidePointsAllQuaternion({
          above: tri.direction === Pointing.UP ? tri.A : tri.B,
          below: tri.direction === Pointing.UP ? tri.C : tri.A,
          resolution: resolution
        });
    const right =
      rotationMethod === "gnomonic"
        ? Vectors3.sidePointsAllGnomonic({
          above: tri.direction === Pointing.UP ? tri.A : tri.C,
          below: tri.direction === Pointing.UP ? tri.B : tri.A,
          resolution: resolution
        })
        : Vectors3.sidePointsAllQuaternion({
          above: tri.direction === Pointing.UP ? tri.A : tri.C,
          below: tri.direction === Pointing.UP ? tri.B : tri.A,
          resolution: resolution
        });

    for (let x = 0; x < maxDivisions + 1; x++) {
      points[x] =
        rotationMethod === "gnomonic"
          ? Vectors3.rowPointsAllGnomonic({
            left: left[x],
            right: right[x],
            numDivisions: tri.direction === Pointing.UP ? x : maxDivisions - x
          })
          : Vectors3.rowPointsAllQuaternion({
            left: left[x],
            right: right[x],
            numDivisions: tri.direction === Pointing.UP ? x : maxDivisions - x
          });
    }
    return rotationMethod === "gnomonic"
      ? Vectors3.spheriphy2D(points)
      : points;
  }
  /**
   * {@link currently copy of generatePointsLazyGnomonic(), but need to calculate percent }
   * generates lazy points with quaternion rotation method
   * @param p point to generate points around for
   * @param res resolution of current hex map
   * @returns lazily generated 2D array of point3's and the starting row and column index -> [point3s, starting vert indx, starting horizontal indx ]
   * indexes are in relation to tri.C, and triangle tip direction influences row and col calculation
   */
  static generatePointsLazy({
    p,
    resolution,
    tri,
    rotationMethod
  }: {
    p: point3 | gpoint3;
    resolution: resolution;
    tri: triangle;
    rotationMethod: rotationMethod;
  }): [point3[][], number, number] {
    /**
     * {@link currently have old and new percents, new is more accurate than old,
     * so still looking for more accurate version since gnomonic projection is still slightly distorted}
     */
    // const useNew = true;
    const nd = numDivisions({ res: resolution });
    // calc side percents
    // // const oldPercents = calcPercentSphericalTriangle({ tri: tri, p: p });
    // // const oldVertPercent = oldPercents[0];
    // // const oldHorzPercent = oldPercents[1];
    const newPercents =
      rotationMethod === "gnomonic"
        ? calcPercentGnomonic({ tri: tri, p: p })
        : calcPercentQuaternion({ tri: tri, p: p }); //calcPercentNormalProjection({ tri: tri, p: p }); //calcPercentSphericalTriangle({ tri: tri, p: p });
    // calculate percent of intersect component from C to A
    const newVertPercent = newPercents[0];
    const vertPercent = newVertPercent; // useNew ? newVertPercent : oldVertPercent;
    // estimated range center points
    const estimatedVertCenter = // estimated
      tri.direction === Pointing.UP
        ? roundNum(nd - vertPercent * nd)
        : roundNum(vertPercent * nd);
    // lazy calculate points
    const [vertPoints, lowerVertBound] =
      rotationMethod === "gnomonic"
        ? Vectors3.sidePointsLazyGnomonic({
          tri: tri,
          resolution: resolution,
          start: estimatedVertCenter
        })
        : Vectors3.sidePointsLazyQuaternion({
          tri: tri,
          resolution: resolution,
          start: estimatedVertCenter
        });
    let n = 0;
    const newHorzPercent = newPercents[1];
    const horzPercent = newHorzPercent; // useNew ? newHorzPercent : oldHorzPercent;
    // console.log("old vertical percent: " + oldVertPercent);
    // console.log("new vertical percent: " + newVertPercent);
    // console.log("old horizontal percent: " + oldHorzPercent);
    // console.log("new horizontal percent: " + newHorzPercent);

    /** {@link TODO: make 2d array, for rows and cols, also move to tris and deal with numbering rows and cols here} */
    let points: point3[][] = [];
    const estimatedHorzCenter = roundNum(horzPercent * nd);
    // while vertical points exist, generate points for their rows in range
    let lowerHorzBound: number;
    while (vertPoints[0][lowerVertBound + n]) {
      // generates points for range between left and right points along vertical triangle sides (AB an AC)
      const [horzPoints, lowerHorzBoun] =
        rotationMethod === "gnomonic"
          ? Vectors3.rowPointsLazyGnomonic({
            start: estimatedHorzCenter,
            left:
              tri.direction === Pointing.UP
                ? vertPoints[0][lowerVertBound + n]
                : vertPoints[1][lowerVertBound + n],
            right:
              tri.direction === Pointing.UP
                ? vertPoints[1][lowerVertBound + n]
                : vertPoints[0][lowerVertBound + n],
            // number of divisions in row (changes depending on left and right points since less points towards tip and more towards base of triangle)
            numDivisions:
              tri.direction === Pointing.UP
                ? lowerVertBound + n
                : nd - (lowerVertBound + n)
          })
          : Vectors3.rowPointsLazyQuaternion({
            start: estimatedHorzCenter,
            left:
              tri.direction === Pointing.UP
                ? vertPoints[0][lowerVertBound + n]
                : vertPoints[1][lowerVertBound + n],
            right:
              tri.direction === Pointing.UP
                ? vertPoints[1][lowerVertBound + n]
                : vertPoints[0][lowerVertBound + n],
            // number of divisions in row (changes depending on left and right points since less points towards tip and more towards base of triangle)
            numDivisions:
              tri.direction === Pointing.UP
                ? lowerVertBound + n
                : nd - (lowerVertBound + n)
          });
      points[lowerVertBound + n] = horzPoints;
      n++;
      lowerHorzBound = lowerHorzBoun;
    }
    return [
      rotationMethod === "gnomonic"
        ? Vectors3.spheriphy2D(points, lowerVertBound, lowerHorzBound)
        : points,
      lowerVertBound,
      lowerHorzBound
    ];
  }
  /**
   * generates point from lower vert and horz offsets
   * @param res resolution
   * @param tri triangle where unknown point is
   * @param lowerVert vert index of point
   * @param lowerHorz horz index of point
   * @returns point in tri from given lower vert and horz indices
   */
  static generatePoint({
    res,
    tri,
    lowerVert,
    lowerHorz,
    rotationMethod
  }: {
    res: resolution;
    tri: triangle;
    lowerVert: number;
    lowerHorz: number;
    rotationMethod?: rotationMethod;
  }): point3 {
    // const tri = this.triangles[triNum];
    const nd = numDivisions({ res: res });
    const [vertPoints, lowerVertBound] =
      rotationMethod === "gnomonic"
        ? Vectors3.sidePointsLazyGnomonic({
          tri: tri,
          resolution: res,
          start: lowerVert,
          lower: lowerVert,
          upper: lowerVert
        })
        : Vectors3.sidePointsLazyQuaternion({
          tri: tri,
          resolution: res,
          start: lowerVert,
          lower: lowerVert,
          upper: lowerVert
        });
    const [horzPoints, lowerHorzBoun] =
      rotationMethod === "gnomonic"
        ? Vectors3.rowPointsLazyGnomonic({
          start: lowerHorz,
          lower: lowerHorz,
          upper: lowerHorz,
          left:
            tri.direction === Pointing.UP
              ? vertPoints[0][lowerVertBound]
              : vertPoints[1][lowerVertBound],
          right:
            tri.direction === Pointing.UP
              ? vertPoints[1][lowerVertBound]
              : vertPoints[0][lowerVertBound],
          // number of divisions in row (changes depending on left and right points since less points towards tip and more towards base of triangle)
          numDivisions:
            tri.direction === Pointing.UP
              ? lowerVertBound
              : nd - lowerVertBound
        })
        : Vectors3.rowPointsLazyQuaternion({
          start: lowerHorz,
          lower: lowerHorz,
          upper: lowerHorz,
          left:
            tri.direction === Pointing.UP
              ? vertPoints[0][lowerVertBound]
              : vertPoints[1][lowerVertBound],
          right:
            tri.direction === Pointing.UP
              ? vertPoints[1][lowerVertBound]
              : vertPoints[0][lowerVertBound],
          // number of divisions in row (changes depending on left and right points since less points towards tip and more towards base of triangle)
          numDivisions:
            tri.direction === Pointing.UP
              ? lowerVertBound
              : nd - lowerVertBound
        });
    return rotationMethod === "gnomonic"
      ? Vectors3.spheriphy(horzPoints[lowerHorzBoun])
      : horzPoints[lowerHorzBoun];
  }
  /**
   * checks if triangle contains point
   * @param tri triangle to check
   * @param point point to check
   * @returns whether point in tri
   */
  static containsPoint({
    tri,
    point
  }: {
    tri: triangle;
    point: point3 | gpoint3;
  }): boolean {
    // vec and tri intersection point
    const intersection = Triangles.planeIntersection({ tri: tri, vec: point });
    // check if intersection on opposite side (check lat & lon?)
    if (Vectors3.isOnOppositeSide(point, intersection)) return false;
    // check if coords ok
    if (!Vectors3.isValid(intersection)) return false;
    // calc tri area
    const triArea = Triangles.area(tri);
    // if any sub tri area is bigger than thisArea it means point outside of triangle
    const pABArea = Triangles.area({ A: tri.A, B: tri.B, C: intersection });
    if (pABArea > triArea + 0.01) return false;
    const pBCArea = Triangles.area({ A: intersection, B: tri.B, C: tri.C });
    if (pBCArea > triArea + 0.01) return false;
    const pCAArea = Triangles.area({ A: tri.A, B: intersection, C: tri.C });
    if (pCAArea > triArea + 0.01) return false;
    // round and check if equal enough
    const combinedArea = pABArea + pBCArea + pCAArea;
    const roundedNums = roundNums(triArea, combinedArea);
    return roundedNums[0] === roundedNums[1];
  }
  /**
   *
   * @param tri triangle
   * @returns area of triangle
   */
  static area(tri: triangle): number {
    const AB = Vectors3.subtract(tri.B, tri.A);
    const BC = Vectors3.subtract(tri.C, tri.B);
    return Vectors3.magnitude(Vectors3.cross(AB, BC)) / 2;
  }
  /**
   * calculates point where plane triangle is on and vector meet
   * @param tri triangle to calculate plane for
   * @param p point/vector to calculate intersection with plane for
   * @returns point where intersection between triangle plane and vector occurs
   */
  static planeIntersection({
    tri,
    vec
  }: {
    tri: triangle;
    vec: point3 | gpoint3;
  }): point3 {
    // components of normal vector to plane containing this triangle's A, B, and C points
    const l = // x component
      (tri.A.y - tri.B.y) * (tri.C.z - tri.B.z) -
      (tri.A.z - tri.B.z) * (tri.C.y - tri.B.y);
    const m = // y component
      (tri.A.z - tri.B.z) * (tri.C.x - tri.B.x) -
      (tri.A.x - tri.B.x) * (tri.C.z - tri.B.z);
    const n = // z component
      (tri.A.x - tri.B.x) * (tri.C.y - tri.B.y) -
      (tri.C.x - tri.B.x) * (tri.A.y - tri.B.y);
    // finds v (variable - used to find point along vector from point p on plane)
    const vNumer = l * tri.A.x + m * tri.A.y + n * tri.A.z;
    const vDenom = l * vec.x + m * vec.y + n * vec.z;
    const v = vNumer / vDenom;
    // parametric equation for line from vector including origin (0, 0, 0) and point p
    const x = vec.x * v;
    const y = vec.y * v;
    const z = vec.z * v;
    return { x: x, y: y, z: z };
  }
}
