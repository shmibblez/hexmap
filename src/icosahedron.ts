/* eslint-disable no-undef */
import { gpoint3, Vectors3, point3 } from "./point3";
import { triangle, Pointing, Position, Triangles } from "./triangle";
import { Constants } from "./constants";
import {
  resolution,
  numDivisions,
  closestEvenNum,
  rotationMethod,
  mapOrientation,
  mapOrientationFromKeys,
  rotationMethodFromKeys,
  mapOrientationKey,
  rotationMethodKey
} from "./stuff";
import { phex, Phexes } from "./phex";
import {
  verifyMapOrientation,
  verifyMapOrientationKey,
  verifyRotationMethod,
  verifyRotationMethodKey,
  verifySplitHashArr
} from "./verifiers";
import { inspect } from "util";

export type hashType = "rowCol" | "nested";

export class Icosahedron {
  // rows of points, ---------------------------------------- IMPORTANT: where to store offset, in triangle, or in each point?
  rows: gpoint3[][];
  triangles: triangle[];
  mapOrientation: mapOrientation;
  rotationMethod: rotationMethod;

  /**
   * @WARNING dymaxion not ready yet, also, won't be "true" dymaxion, will only rotate icosahedron, and use either gnomonic or quaternion, official dymaxion doesn't use gnomonic projection
   * @param mapOrientation
   */
  constructor({
    mapOrientation = "ECEF",
    rotationMethod = "gnomonic"
  }: {
    mapOrientation: mapOrientation;
    rotationMethod: rotationMethod;
  }) {
    verifyMapOrientation(mapOrientation);
    verifyRotationMethod(rotationMethod);
    this.mapOrientation = mapOrientation;
    this.rotationMethod = rotationMethod;

    this.rows = [];
    const gr = Constants.golden_ratio;
    const r = Constants.radius;
    const factor = r / Math.sqrt(gr * gr + 1);

    const _1 = factor;
    const _gr = gr * factor;
    // ----------------------------------------------

    /**
     * - how to find hexagon that contains coordinate?
     * - below link splits earth into kexagons
     * {@link https://github.com/vraid/earthgen-old/blob/master/source/planet/grid/create_grid.cpp}
     */

    // rotate all base points so north pole aligns with z axis (this is angle between vectors)
    const rads = -Math.acos(gr / Math.sqrt(1 + gr * gr)); //-(26.6 * Math.PI) / 180;
    /**
     *     how points are numbered
     *        N       N       N       N       N              - all top pent tris share north point
     *        *       *       *       *       *
     *  top1    top2    top3    top4    top5    top1         - points are vertices of base of top pent
     *   *       *       *       *       *       *
     *      bot1    bot2    bot3    bot4    bot5    bot1     - points ore vertices of base of bottom pent
     *       *       *       *       *       *       *
     *           S       S       S       S       S           - all bottom pent tris share south point
     *           *       *       *       *       *
     */
    const north: point3 = Vectors3.rotateAroundYAxis(
      { x: _1, y: 0, z: _gr, isVert: true },
      rads
    );
    const top1: point3 = Vectors3.rotateAroundYAxis(
      { x: _gr, y: -_1, z: 0, isVert: true },
      rads
    );
    const top2: point3 = Vectors3.rotateAroundYAxis(
      { x: _gr, y: _1, z: 0, isVert: true },
      rads
    );
    const top3: point3 = Vectors3.rotateAroundYAxis(
      { x: 0, y: _gr, z: _1, isVert: true },
      rads
    );
    const top4: point3 = Vectors3.rotateAroundYAxis(
      { x: -_1, y: 0, z: _gr, isVert: true },
      rads
    );
    const top5: point3 = Vectors3.rotateAroundYAxis(
      { x: 0, y: -_gr, z: _1, isVert: true },
      rads
    );

    const bot1: point3 = Vectors3.rotateAroundYAxis(
      { x: _1, y: 0, z: -_gr, isVert: true },
      rads
    );
    const bot2: point3 = Vectors3.rotateAroundYAxis(
      { x: 0, y: _gr, z: -_1, isVert: true },
      rads
    );
    const bot3: point3 = Vectors3.rotateAroundYAxis(
      { x: -_gr, y: _1, z: 0, isVert: true },
      rads
    );
    const bot4: point3 = Vectors3.rotateAroundYAxis(
      { x: -_gr, y: -_1, z: 0, isVert: true },
      rads
    );
    const bot5: point3 = Vectors3.rotateAroundYAxis(
      { x: 0, y: -_gr, z: -_1, isVert: true },
      rads
    );

    const south: point3 = Vectors3.rotateAroundYAxis(
      { x: -_1, y: 0, z: -_gr, isVert: true },
      rads
    );

    /**
     *    how triangles are numbered
     *        /\      /\      /\      /\      /\
     *      / 0 \   / 1 \   / 2 \   / 3 \   / 4 \
     *    /______\/______\/______\/______\/______\
     *    \      /\      /\      /\      /\      /\
     *     \ 5 / 6 \ 7 / 8 \  9/ 10\ 11/ 12\ 13/ 14\
     *      \/______\/______\/______\/______\/______\
     *       \      /\      /\      /\      /\      /
     *        \ 15/   \ 16/   \ 17/   \ 18/   \ 19/
     *         \/      \/      \/      \/      \/
     */
    this.triangles = [
      /**
       * top pent
       */
      // 0
      {
        A: north,
        B: top2,
        C: top1,
        direction: Pointing.UP,
        pos: Position.TOP,
        num: 0,
        toAB: 1,
        toBC: 5,
        toCA: 4
      },
      // 1
      {
        A: north,
        B: top3,
        C: top2,
        direction: Pointing.UP,
        pos: Position.TOP,
        num: 1,
        toAB: 2,
        toBC: 7,
        toCA: 0
      },
      // 2
      {
        A: north,
        B: top4,
        C: top3,
        direction: Pointing.UP,
        pos: Position.TOP,
        num: 2,
        toAB: 3,
        toBC: 9,
        toCA: 1
      },
      // 3
      {
        A: north,
        B: top5,
        C: top4,
        direction: Pointing.UP,
        pos: Position.TOP,
        num: 3,
        toAB: 4,
        toBC: 11,
        toCA: 2
      },
      // 4
      {
        A: north,
        B: top1,
        C: top5,
        direction: Pointing.UP,
        pos: Position.TOP,
        num: 4,
        toAB: 0,
        toBC: 13,
        toCA: 3
      },
      /**
       * center triangles - top half (upside-down ones)
       */
      // 5
      {
        A: bot1,
        B: top1,
        C: top2,
        direction: Pointing.DOWN,
        pos: Position.CENTER,
        num: 5,
        toAB: 14,
        toBC: 0,
        toCA: 16
      },
      // 6
      {
        A: top2,
        B: bot2,
        C: bot1,
        direction: Pointing.UP,
        pos: Position.CENTER,
        num: 6,
        toAB: 7,
        toBC: 15,
        toCA: 5
      },
      // 7
      {
        A: bot2,
        B: top2,
        C: top3,
        direction: Pointing.DOWN,
        pos: Position.CENTER,
        num: 7,
        toAB: 6,
        toBC: 1,
        toCA: 8
      },
      // 8
      {
        A: top3,
        B: bot3,
        C: bot2,
        direction: Pointing.UP,
        pos: Position.CENTER,
        num: 8,
        toAB: 9,
        toBC: 16,
        toCA: 7
      },
      // 9
      {
        A: bot3,
        B: top3,
        C: top4,
        direction: Pointing.DOWN,
        pos: Position.CENTER,
        num: 9,
        toAB: 8,
        toBC: 2,
        toCA: 10
      },
      // 10
      {
        A: top4,
        B: bot4,
        C: bot3,
        direction: Pointing.UP,
        pos: Position.CENTER,
        num: 10,
        toAB: 11,
        toBC: 17,
        toCA: 9
      },
      // 11
      {
        A: bot4,
        B: top4,
        C: top5,
        direction: Pointing.DOWN,
        pos: Position.CENTER,
        num: 11,
        toAB: 10,
        toBC: 3,
        toCA: 12
      },
      // 12
      {
        A: top5,
        B: bot5,
        C: bot4,
        direction: Pointing.UP,
        pos: Position.CENTER,
        num: 12,
        toAB: 13,
        toBC: 18,
        toCA: 11
      },
      // 13
      {
        A: bot5,
        B: top5,
        C: top1,
        direction: Pointing.DOWN,
        pos: Position.CENTER,
        num: 13,
        toAB: 12,
        toBC: 4,
        toCA: 14
      },
      // 14
      {
        A: top1,
        B: bot1,
        C: bot5,
        direction: Pointing.UP,
        pos: Position.CENTER,
        num: 14,
        toAB: 5,
        toBC: 19,
        toCA: 13
      },

      /**
       * bottom pent
       */
      // 15
      {
        A: south,
        B: bot1,
        C: bot2,
        direction: Pointing.DOWN,
        pos: Position.BOTTOM,
        num: 15,
        toAB: 19,
        toBC: 6,
        toCA: 16
      },
      // 16
      {
        A: south,
        B: bot2,
        C: bot3,
        direction: Pointing.DOWN,
        pos: Position.BOTTOM,
        num: 16,
        toAB: 15,
        toBC: 8,
        toCA: 17
      },
      // 17
      {
        A: south,
        B: bot3,
        C: bot4,
        direction: Pointing.DOWN,
        pos: Position.BOTTOM,
        num: 17,
        toAB: 16,
        toBC: 10,
        toCA: 18
      },
      // 18
      {
        A: south,
        B: bot4,
        C: bot5,
        direction: Pointing.DOWN,
        pos: Position.BOTTOM,
        num: 18,
        toAB: 17,
        toBC: 12,
        toCA: 19
      },
      // 19
      {
        A: south,
        B: bot5,
        C: bot1,
        direction: Pointing.DOWN,
        pos: Position.BOTTOM,
        num: 19,
        toAB: 18,
        toBC: 14,
        toCA: 15
      }
    ];
  }
  /**
   * generates row col hash in format res|row|col
   * @param p point to generate hash for
   * @param res resolution
   * @returns row col hash in format res|row|col
   */
  generateHash({ p, res }: { p: point3 | gpoint3; res: resolution }): string {
    const lazyPoints = this.pointsAroundLazy({
      p: p,
      res: res
    }).flat();
    // closest point that is also phex center
    const cp = Vectors3.closestPoint({ p: p, points: lazyPoints });
    return Vectors3.hash({
      p: cp,
      rotationMethod: this.rotationMethod,
      mapOrientation: this.mapOrientation
    });
  }
  /**
   * converts hash to the point it references
   * @param hash hash to parse, should be in format res|row|col
   * @returns point referenced by hash
   * @throws error if invalid hash
   */
  static parseHash(hash: string): [Icosahedron, gpoint3] {
    const hashComponents = hash.split("|");
    verifySplitHashArr(hashComponents);
    // res, row, col
    const location =
      hashComponents.length === 3 ? hashComponents : hashComponents.slice(2);
    const [mapOrientationKey, rotationMethodKey] =
      hashComponents.length === 3
        ? ["e", "g"]
        : hashComponents.slice(0, 3).map(String);
    verifyMapOrientationKey(mapOrientationKey as mapOrientationKey);
    verifyRotationMethodKey(rotationMethodKey as rotationMethodKey);
    // create icosahedron from parsed map orientation and rotation method
    const icosahedron = new Icosahedron({
      mapOrientation: mapOrientationFromKeys[mapOrientationKey as mapOrientationKey],
      rotationMethod: rotationMethodFromKeys[rotationMethodKey as rotationMethodKey]
    });

    const [res, row, col] = location.map(Number);
    const nd = numDivisions({ res: res as resolution });
    const maxRows = nd * 3;
    if (!res)
      throw new Error(`invalid hash, invalid res, provided res: ${res}`);
    if ((row !== 0 && !row) || row > maxRows || row < 0)
      throw new Error(
        `invalid hash, row not within range: range for res ${res} is [0,${maxRows}], provided row was: ${row}`
      );
    const maxCols = nd * 5 - 1;
    if ((col !== 0 && !col) || col > maxCols || col < 0)
      throw new Error(
        `invalid hash, col not within range: range for res ${res} is [0,${maxCols}], provided row was: ${col}`
      );
    // shortens truncate function so easier to read
    const trunc = (n: number) => Math.trunc(n);

    let triNum: number;
    let lowerHorz: number;
    let lowerVert: number;
    if (row < nd) {
      // point in top tris
      triNum = row !== 0 ? trunc(col / row) : 0;
      lowerVert = row;
      lowerHorz = col - triNum * row;
    } else if (row <= nd * 2) {
      // point in center tris
      lowerVert = row - nd;
      const triOffs = trunc(col / nd);
      const colOffs = triOffs * nd + (nd - lowerVert);
      const pointingUp = col > colOffs;

      if (pointingUp) {
        triNum = 5 + triOffs * 2 + 1;
        lowerHorz = col - colOffs;
      } else {
        triNum = 5 + triOffs * 2;
        lowerHorz = colOffs - col;
      }
    } else {
      // point in bottom tris
      lowerVert = row - nd * 2;
      const colsPerRow = nd - lowerVert;
      const triOffs = colsPerRow !== 0 ? trunc(col / colsPerRow) : 0;
      lowerHorz = colsPerRow - (col - triOffs * colsPerRow);
      triNum = 15 + triOffs;
    }

    const p = Triangles.generatePoint({
      res: res,
      tri: icosahedron.triangles[triNum],
      lowerVert: lowerVert,
      lowerHorz: lowerHorz,
      rotationMethod: icosahedron.rotationMethod
    });

    return [
      icosahedron,
      {
        x: p.x,
        y: p.y,
        z: p.z,
        res: res as resolution,
        row: row,
        col: col,
        isVert: Vectors3.isPhexCenter({
          row: row,
          col: col,
          res: res as resolution
        })
      }
    ];
  }
  /**
   * generates all points for resolution
   * gpoint3 row and col indexes match with returned array indexes
   */
  allPoints({ resolution = 1 }: { resolution: resolution }): gpoint3[][] {
    const points: gpoint3[][] = [[]];
    const offsetAmount = resolution * 3;
    for (const t of this.triangles) {
      let offset: number;
      let range: number;
      const ps = Triangles.generateAllPoints({
        tri: t,
        resolution: resolution,
        rotationMethod: this.rotationMethod
      });
      switch (t.pos) {
        case Position.TOP:
          offset = 0;
          range = ps.length - 1;
          break;
        case Position.CENTER:
          offset = offsetAmount;
          range = ps.length - 1;
          break;
        default:
        case Position.BOTTOM:
          offset = offsetAmount * 2;
          range = ps.length;
          break;
      }
      let popped: point3;
      for (let fl = 0; fl < range; fl++) {
        // for each row, add
        if (!points[offset + fl]) points[offset + fl] = [];
        popped = ps[fl].pop();
        if ((t.num === 0 && fl === 0) || (t.num === 19 && fl === range - 1))
          ps[fl].push(popped);
        for (let sl = 0; sl < ps[fl].length; sl++) {
          // adds gpoint3, storing indexes (for referencing other points)
          points[offset + fl].push({
            x: ps[fl][sl].x,
            y: ps[fl][sl].y,
            z: ps[fl][sl].z,
            res: resolution,
            row: offset + fl,
            col: points[offset + fl].length,
            isVert: ps[fl][sl].isVert
          });
        }
      }
    }
    return points;
  }
  /**
   * generates points around p
   * @param p point
   * @param res resolution
   * @returns points around p for Constants.lazyRange
   */
  pointsAroundLazy({
    p,
    res
  }: {
    p: point3 | gpoint3;
    res: resolution;
  }): gpoint3[][] {
    const tri = this.getContainingTriangle({ p: p });
    const nd = numDivisions({ res: res });
    // points and lazy range start indexes in relation to tri.C
    const [points, lowerVert, lowerHorz] = Triangles.generatePointsLazy({
      p: p,
      resolution: res,
      tri: tri,
      rotationMethod: this.rotationMethod
    });

    function indexTop() {
      const indexedPoints: gpoint3[][] = [];
      const rowOff = lowerVert;
      let r = 0;
      while (points[lowerVert + r] && points[lowerVert + r][lowerHorz]) {
        let c = 0;
        const row = rowOff + r;
        while (points[lowerVert + r][lowerHorz + c]) {
          let col = (lowerVert + r) * tri.num + lowerHorz + c;
          if (col === row * 5) col = 0;
          const p3 = points[lowerVert + r][lowerHorz + c];
          const newPoint = {
            x: p3.x,
            y: p3.y,
            z: p3.z,
            res: res,
            row: row,
            col: col,
            isVert: Vectors3.isPhexCenter({ row: row, col: col, res: res })
          };
          if (!indexedPoints[r]) indexedPoints[r] = [];
          indexedPoints[r][c] = newPoint;
          c++;
        }
        r++;
      }
      return indexedPoints;
    }
    function indexCenUp(): gpoint3[][] {
      const indexedPoints: gpoint3[][] = [];
      const [trisBefore] = closestEvenNum(tri.num - 5);
      const rowOff = nd + lowerVert;
      const colOff = nd * (trisBefore / 2) + (nd - lowerVert) + lowerHorz;
      let r = 0;
      while (points[lowerVert + r] && points[lowerVert + r][lowerHorz]) {
        let c = 0;
        const row = rowOff + r;
        while (points[lowerVert + r][lowerHorz + c]) {
          let col = colOff + c - r;
          if (col === nd * 5) col = 0;
          const p3 = points[lowerVert + r][lowerHorz + c];
          const newPoint = {
            x: p3.x,
            y: p3.y,
            z: p3.z,
            res: res,
            row: row,
            col: col,
            isVert: Vectors3.isPhexCenter({ row: row, col: col, res: res })
          };
          if (!indexedPoints[r]) indexedPoints[r] = [];
          indexedPoints[r][c] = newPoint;
          c++;
        }
        r++;
      }
      return indexedPoints;
    }
    function indexCenDn(): gpoint3[][] {
      const indexedPoints: gpoint3[][] = [];
      const [trisBefore] = closestEvenNum(tri.num - 5);
      const rowOff = nd + lowerVert;
      const colOff = nd * (trisBefore / 2); //+ nd - lowerHorz;
      let r = 0;
      while (points[lowerVert + r] && points[lowerVert + r][lowerHorz]) {
        let c = 0;
        const row = rowOff + r;
        while (points[lowerVert + r][lowerHorz + c]) {
          let col = colOff + nd * 2 - row - lowerHorz - c; //colOff - c - r;
          if (col === nd * 5) col = 0;
          const p3 = points[lowerVert + r][lowerHorz + c];
          const newPoint = {
            x: p3.x,
            y: p3.y,
            z: p3.z,
            res: res,
            row: row,
            col: col,
            isVert: Vectors3.isPhexCenter({ row: row, col: col, res: res })
          };
          if (!indexedPoints[r]) indexedPoints[r] = [];
          indexedPoints[r][c] = newPoint;
          c++;
        }
        r++;
      }
      return indexedPoints;
    }
    function indexBot() {
      const indexedPoints: gpoint3[][] = [];
      const rowOff = nd * 2 + lowerVert;
      let r = 0;
      while (points[lowerVert + r] && points[lowerVert + r][lowerHorz]) {
        let c = 0;
        const row = rowOff + r;
        while (points[lowerVert + r][lowerHorz + c]) {
          let col = (nd - lowerVert - r) * (tri.num - 15 + 1) - lowerHorz - c;
          if (col === (nd * 3 - row) * 5) col = 0;
          const p3 = points[lowerVert + r][lowerHorz + c];
          const newPoint = {
            x: p3.x,
            y: p3.y,
            z: p3.z,
            res: res,
            row: row,
            col: col,
            isVert: Vectors3.isPhexCenter({ row: row, col: col, res: res })
          };
          if (!indexedPoints[r]) indexedPoints[r] = [];
          indexedPoints[r][c] = newPoint;
          c++;
        }
        r++;
      }
      return indexedPoints;
    }
    let lazyPoints: gpoint3[][];
    switch (tri.pos) {
      case Position.TOP:
        lazyPoints = indexTop();
        break;
      case Position.CENTER:
        lazyPoints =
          tri.direction === Pointing.UP ? indexCenUp() : indexCenDn();
        break;
      case Position.BOTTOM:
        lazyPoints = indexBot();
        break;
    }
    // // below stringifies points for viewing in logs
    // console.log("new lazyPoints below");
    // const lazyPointsStringified: any[] = [];
    // for (let o = 0; o < lazyPoints.length; o++) {
    //   for (let i = 0; i < lazyPoints[o].length; i++) {
    //     const p = lazyPoints[o][i];
    //     const obj = {
    //       row: p.row,
    //       col: p.col,
    //       x: Math.trunc(p.x),
    //       y: Math.trunc(p.y),
    //       z: Math.trunc(p.z),
    //       isV: p.isVert
    //     };
    //     if (!lazyPointsStringified[o]) lazyPointsStringified[o] = [];
    //     lazyPointsStringified[o].push(JSON.stringify(obj, null, 1));
    //   }
    // }
    // console.table(lazyPointsStringified);
    // console.log(
    //   `startVert: ${lowerVert}, \nstartHorz: ${lowerHorz}, points.length: ${points.length}`
    // );
    return lazyPoints;
  }
  /**
   * WARNING: NOT LAZY YET, WILL GENERATE ALL POINTS!
   * @param p point
   * @param res resolution
   * @returns phex that contains point for resolution
   */
  getContainingPhex({ p, res }: { p: point3; res: resolution }): phex {
    const points = this.allPoints({
      resolution: res
    });
    const phexes: phex[] = Phexes.generateAllPhexes(points);

    let closestPhex: phex;
    let dist: number;
    let smallestDist = Constants.radius * 2;
    for (const phex of phexes) {
      dist = Vectors3.distance(p, phex.center);
      if (dist < smallestDist) {
        smallestDist = dist;
        // console.log("smallest distance: " + smallestDist);
        closestPhex = phex;
      }
    }
    return closestPhex;
  }
  /**
   * finds icosahedron triangle that contains point
   * @param p point
   * @returns icosahedron triangle that contains point
   * @throws error if triangle not found, most likely due to rounding error
   */
  getContainingTriangle({ p }: { p: point3 }): triangle {
    for (const t of this.triangles) {
      if (Triangles.containsPoint({ tri: t, point: p })) return t;
    }
    throw new Error(
      "Icosahedron.getContainingTriangle(): failed to find containing triangle, point: " +
      inspect(p)
    );
  }
}
