/* eslint-disable no-undef, @typescript-eslint/no-use-before-define */
import { Constants } from "./constants";
import { deg2rad, numDivisions, resolution } from "./stuff";
import { Pointing, triangle } from "./triangle";

// 3d point on grid: has resolution, row, and col (for referencing other points if needed), starting point is origin
// ex: if you have gpoint3 that is center of hexagon, you can find surrounding poly vertices
export type gpoint3 = {
  x: number;
  y: number;
  z: number;
  // resolution, needed for row and col
  res: resolution;
  row: number;
  col: number;
  // whether point is icosahedron vertex (pent center)
  isVert?: boolean;
  // not in use right now, might come in handy in the future
  triNum?: number;
};

// ordinary 3d point, starting point is origin
export type point3 = {
  x: number;
  y: number;
  z: number;
  triNum?: number;
  // whether point is icosahedron vertex (pent center)
  isVert?: boolean;
};

// quaternion, pretty cool stuff right here
export type quaternion = {
  w: number;
  vec: point3 | gpoint3;
};

/**
 * complete quaternion guide
 * {@link https://www.3dgep.com/understanding-quaternions/#Quaternions_as_an_Ordered_Pair}
 */
export class Quaternions {
  /**
   * turns quaternion into unit quaternion (magnitude 1)
   * @param q quaternion to normalize
   */
  static unitQuaternion(q: quaternion): quaternion {
    const magnitude = Quaternions.magnitude(q);
    if (magnitude === 1) return q;
    return {
      w: q.w / magnitude,
      vec: Vectors3.divideByScalar({ vec: q.vec, num: magnitude }) // eslint-disable-line
    };
  }

  /**
   * @param q quaternion
   * @returns magnitude of quaternion
   */
  static magnitude(q: quaternion): number {
    return Math.sqrt(
      q.w * q.w + q.vec.x * q.vec.x + q.vec.y * q.vec.y + q.vec.z * q.vec.z
    );
  }

  /**
   * multiplies quaternions, NOTE: non-commutative
   * quaternion arithmetic {@link https://www.haroldserrano.com/blog/quaternions-in-computer-graphics}
   * @param a quaternion 1
   * @param b quaternion 2
   * @returns multiplied quaternions
   */
  static multiply(a: quaternion, b: quaternion): quaternion {
    const w = a.w * b.w - Vectors3.dot(a.vec, b.vec);
    const v1 = Vectors3.cross(a.vec, b.vec);
    const v2 = Vectors3.multByScalar({ vec: b.vec, num: a.w });
    const v3 = Vectors3.multByScalar({ vec: a.vec, num: b.w });
    const v = Vectors3.add(v1, Vectors3.add(v2, v3));

    return { w: w, vec: v };
  }
}

/**
 * utility class for points/vectors
 */
export class Vectors3 {
  static hash(p: gpoint3) {
    return `${p.res}|${p.row}|${p.col}`;
  }
  /**
   * uses ECEF coordinate system, {@link https://en.wikipedia.org/wiki/ECEF}
   * uses equations from {@link https://en.wikipedia.org/wiki/Geographic_coordinate_conversion#From_geodetic_to_ECEF_coordinates}
   * @param lat latitude of point
   * @param lon longitude of point
   * @returns point from lat and lon, according to ECEF
   */
  static fromCoordinates({ lat, lon }: { lat: number; lon: number }): point3 {
    // assert(lat <= 90 && lat >= -90, "lat must be between -90 and 90");
    // assert(lon <= 180 && lon >= -180, "lon must be between -180 and 180");
    if (!(lat <= 90 && lat >= -90))
      throw new Error("lat must be between -90 and 90");
    if (!(lon <= 180 && lon >= -180))
      throw new Error("lon must be between -180 and 180");
    lat = deg2rad(lat);
    lon = deg2rad(lon);
    const r = Constants.radius;
    const x = r * Math.cos(lat) * Math.cos(lon);
    const y = r * Math.cos(lat) * Math.sin(lon);
    const z = r * Math.sin(lat);
    return { x: x, y: y, z: z };
  }
  static randomPoint(): point3 {
    const lat = Math.random() * 180 - 90;
    const lon = Math.random() * 360 - 180;
    return Vectors3.fromCoordinates({ lat: lat, lon: lon });
  }
  /**
   * tests if point is phex center, using point row indx
   * @param p point to test
   * @return true if phex center point, false if not
   */
  static isPhexCenter({
    row,
    col,
    res
  }: {
    row: number;
    col: number;
    res: resolution;
  }): boolean {
    const nd = numDivisions({ res: res });
    if (row === 0 || row === nd * 3) return true;
    let newRow: number;
    let newCol: number;
    if (row > nd * 2) {
      // if in bottom tri
      newRow = row - nd * 2;
      newCol = col % (nd - newRow);
      return (newCol - (newRow % 3)) % 3 === 0;
    } else if (row >= nd) {
      // if in center tri
      newRow = row;
      newCol = col;
      return (newCol - (newRow % 3)) % 3 === 0;
    } else {
      // if in top tri
      newRow = row;
      newCol = col % row;
      return (newCol - (3 - (newRow % 3))) % 3 === 0;
    }
  }
  static rotateAroundYAxis(point: point3 | gpoint3, rads: number): point3 {
    const newX = point.x * Math.cos(rads) + point.z * Math.sin(rads);
    const newZ = -point.x * Math.sin(rads) + point.z * Math.cos(rads);
    return { x: newX, y: point.y, z: newZ, isVert: point.isVert };
  }
  /**
   * {@link TODO: can be removed - use lazy instead and set lower and upper bounds to be min/max}
   * point a should be above b in order to work correctly
   * @param A point a
   * @param B point b
   * @returns array of points including A and B, ordered from top to bottom
   */
  static sidePointsAllGnomonic({
    above,
    below,
    resolution
  }: {
    above: point3 | gpoint3;
    below: point3 | gpoint3;
    resolution: number;
  }): point3[] {
    const numDivisions = resolution * 3;
    const r = Constants.radius;
    const pointArr: point3[] = [];
    // vec pointing from above to below, original (not projected for gnomonic)
    const originalAB = Vectors3.subtract(below, above);
    const uAB = Vectors3.unit(originalAB);
    // vec between above and below (center)
    const originalC = Vectors3.add(
      above,
      Vectors3.multByScalar({
        vec: uAB,
        num: Vectors3.distance(above, below) / 2
      })
    );
    const C = Vectors3.multByScalar({ vec: Vectors3.unit(originalC), num: r });
    const magC = Vectors3.magnitude(C);
    const alpha = Vectors3.angleBetween({ a: above, b: C });
    const magH = magC / Math.cos(alpha);
    const A = Vectors3.multByScalar({ vec: Vectors3.unit(above), num: magH });
    A.isVert = true;
    const B = Vectors3.multByScalar({ vec: Vectors3.unit(below), num: magH });
    B.isVert = true;
    // distance between A and B
    const dist = Vectors3.distance(A, B);
    const distUnit = dist / numDivisions;
    // add first point
    pointArr.push(A);
    // add points between
    for (let c = 1; c < numDivisions; c++) {
      const d = distUnit * c;
      const rotated = Vectors3.add(
        A,
        Vectors3.multByScalar({ vec: uAB, num: d })
      );
      pointArr.push(rotated);
    }
    // add last point
    pointArr.push(B);
    return pointArr;
  }
  /**
   * determintes points for range for triangle sides, undetermined points are undefined
   * @param tri reference triangle
   * @param resolution resolution
   * @param start where to start generating points, if pointing up, in reference to tri.A, if pointing down, in reference to tri.B or tri.C
   * @returns left and right side array of points and lower bound offset [left side points, right side points, lower bound offset]
   */
  static sidePointsLazyGnomonic({
    tri,
    resolution,
    start,
    lazyRange = Constants.lazyRange / 2,
    lower = start - lazyRange,
    upper = start + lazyRange
  }: {
    tri: triangle;
    resolution: number;
    start: number;
    lazyRange?: number;
    lower?: number;
    upper?: number;
  }): [[point3[], point3[]], number] {
    const numDivisions = resolution * 3;
    if (lower < 0) lower = 0;
    if (upper > numDivisions) upper = numDivisions;
    // generate list of points with ranges in mind, rest is undefined
    function generateSidePoints(
      top: point3 | gpoint3,
      bot: point3 | gpoint3
    ): point3[] {
      const arr: point3[] = [];
      const r = Constants.radius;
      const originalAB = Vectors3.subtract(bot, top);
      const uAB = Vectors3.unit(originalAB);
      // vec between above and below (center)
      const originalC = Vectors3.add(
        top,
        Vectors3.multByScalar({
          vec: uAB,
          num: Vectors3.distance(top, bot) / 2
        })
      );
      const C = Vectors3.multByScalar({
        vec: Vectors3.unit(originalC),
        num: r
      });
      const magC = Vectors3.magnitude(C);
      const alpha = Vectors3.angleBetween({ a: top, b: C });
      const magH = magC / Math.cos(alpha);
      const A = Vectors3.multByScalar({ vec: Vectors3.unit(top), num: magH });
      A.isVert = true;
      const B = Vectors3.multByScalar({ vec: Vectors3.unit(bot), num: magH });
      B.isVert = true;
      // distance between A and B
      const dist = Vectors3.distance(A, B);
      const distUnit = dist / numDivisions;
      for (let c = lower; c <= upper; c++) {
        const d = distUnit * c;
        const rotated = Vectors3.add(
          A,
          Vectors3.multByScalar({ vec: uAB, num: d })
        );
        arr[c] = rotated;
      }
      return arr;
    }
    // setup points
    const topL = tri.direction === Pointing.UP ? tri.A : tri.B;
    const botL = tri.direction === Pointing.UP ? tri.C : tri.A;
    const topR = tri.direction === Pointing.UP ? tri.A : tri.C;
    const botR = tri.direction === Pointing.UP ? tri.B : tri.A;
    // generate side points
    const pointsL = generateSidePoints(topL, botL);
    const pointsR = generateSidePoints(topR, botR);
    return [[pointsL, pointsR], lower];
  }
  /**
   * {@link TODO: can be removed - use lazy instead and set lower and upper bounds to be min/max}
   * @param left point on the left
   * @param right point on the right
   * @param numDivisions number of times to divide
   * @returns Array of points including left and right. If numDivisions is 0, it means at triangle tip, only return 1 point
   */
  static rowPointsAllGnomonic({
    left,
    right,
    numDivisions
  }: {
    left: point3 | gpoint3;
    right: point3 | gpoint3;
    numDivisions: number;
  }): point3[] {
    // if no divisions, means triangle tip, left and right are the same, return 1
    if (numDivisions <= 0) return [left];
    const pointArr: point3[] = [];
    const dist = Vectors3.distance(left, right);
    const distUnit = dist / numDivisions;
    const uLR = Vectors3.unit(Vectors3.subtract(right, left));
    // add first point
    pointArr.push(left);
    // add points between
    for (let c = 1; c < numDivisions; c++) {
      const d = distUnit * c;
      const rotated = Vectors3.add(
        left,
        Vectors3.multByScalar({ vec: uLR, num: d })
      );
      pointArr.push(rotated);
    }
    // add last point
    pointArr.push(right);
    return pointArr;
  }
  /**
   *
   * @param start index to start at
   * @param left left bound
   * @param right right bound
   * @param numDivisions number of divisions on row
   * @returns lazy array of points in row in their positions in triangles and start column index -> [lazy array, start column index]
   * points before defined ones are undefined
   */
  static rowPointsLazyGnomonic({
    start,
    left,
    right,
    numDivisions,
    lazyRange = Constants.lazyRange / 2,
    lower = start - lazyRange,
    upper = start + lazyRange
  }: {
    start: number;
    left: point3 | gpoint3;
    right: point3 | gpoint3;
    numDivisions: number;
    lazyRange?: number;
    lower?: number;
    upper?: number;
  }): [point3[], number] {
    if (numDivisions <= 0) return [[left], 0];
    // setup lazy range
    if (lower < 0) lower = 0;
    if (upper > numDivisions) upper = numDivisions;
    // console.log("row points, lower: " + lower + ", upper: " + upper);
    const points: point3[] = [];
    const dist = Vectors3.distance(left, right);
    const distUnit = dist / numDivisions;
    const uLR = Vectors3.unit(Vectors3.subtract(right, left));
    // add points between lazy range
    for (let c = lower; c <= upper; c++) {
      const d = distUnit * c;
      const rotated = Vectors3.add(
        left,
        Vectors3.multByScalar({ vec: uLR, num: d })
      );
      points[c] = rotated;
    }
    return [points, lower];
  }
  static spheriphy1D(points: (point3 | gpoint3)[]): (point3 | gpoint3)[] {
    // return points;
    const spherified: (point3 | gpoint3)[] = [];
    const r = Constants.radius;
    for (const p of points) {
      spherified.push(Vectors3.multByScalar({ vec: Vectors3.unit(p), num: r }));
    }
    return spherified;
  }
  /**
   * {@link TODO: make this use lower vert and horz bounds, (if (!points[row]) continue) could get pretty slow for higher resolutions}
   * makes points go on sphere instead of being on icosahedron face (for gnomonic prjection)
   * @param points points to spherify
   */
  static spheriphy2D(
    points: (point3 | gpoint3)[][],
    lowerHorz: number = 0,
    lowerVert: number = 0
  ): (point3 | gpoint3)[][] {
    // return points;
    const spherified: (point3 | gpoint3)[][] = [];
    const r = Constants.radius;
    for (let row = lowerHorz; row < points.length; row++) {
      if (!points[row]) continue;
      spherified[row] = [];
      for (let col = lowerVert; col < points[row].length; col++) {
        const p = points[row][col];
        if (!p) continue;
        const v = Vectors3.multByScalar({
          vec: Vectors3.unit(points[row][col]),
          num: r
        });
        if (p.isVert) v.isVert = true;
        spherified[row][col] = v;
      }
    }
    return spherified;
  }
  /**
   * {@link TODO: can be removed - use lazy instead and set lower and upper bounds to be min/max}
   * point a should be above b in order to work correctly
   * @param A point a
   * @param B point b
   * @returns array of points including A and B, ordered from top to bottom
   *
   * since only needed to find side points, gpoint not needed
   */
  static sidePointsAllQuaternion({
    above,
    below,
    resolution
  }: {
    above: point3 | gpoint3;
    below: point3 | gpoint3;
    resolution: number;
  }): point3[] {
    const numDivisions = resolution * 3;
    const pointArr: point3[] = [];
    const angle = this.angleBetween({
      a: above,
      b: below
    });
    const angleUnit = angle / numDivisions;
    const axis = Vectors3.orthogonal({
      pointAbove: above,
      pointBelow: below
    });
    // add first point
    pointArr.push(above);
    // console.log(above);
    // add points between
    for (let c = 1; c < numDivisions; c++) {
      const angle = angleUnit * c;
      const rotated = Vectors3.rotate({
        rotate: above,
        around: axis,
        rad: angle
      });
      pointArr.push(rotated);
    }
    // add last point
    pointArr.push(below);
    return pointArr;
  }
  /**
   * determintes points for range for triangle sides, undetermined points are undefined
   * @param tri reference triangle
   * @param resolution resolution
   * @param start where to start generating points, if pointing up, in reference to tri.A, if pointing down, in reference to tri.B or tri.C
   * @returns left and right side array of points and lower bound offset [left side points, right side points, lower bound offset]
   */
  static sidePointsLazyQuaternion({
    tri,
    resolution,
    start,
    lazyRange = Constants.lazyRange / 2,
    lower = start - lazyRange,
    upper = start + lazyRange
  }: {
    tri: triangle;
    resolution: number;
    start: number;
    lazyRange?: number;
    lower?: number;
    upper?: number;
  }): [[point3[], point3[]], number] {
    const numDivisions = resolution * 3;
    if (lower < 0) lower = 0;
    if (upper > numDivisions) upper = numDivisions;
    // console.log(
    //   "side points, lower: " +
    //     lower +
    //     ", upper: " +
    //     upper +
    //     ", start: " +
    //     start +
    //     ", lazy range: " +
    //     lazyRange
    // );
    // generate list of points with ranges in mind, rest is undefined
    function generateSidePoints(
      top: point3 | gpoint3,
      bot: point3 | gpoint3
    ): point3[] {
      const arr: point3[] = [];
      const angle = Vectors3.angleBetween({
        a: top,
        b: bot
      });
      const angleUnit = angle / numDivisions;
      const axis = Vectors3.orthogonal({
        pointAbove: top,
        pointBelow: bot
      });
      for (let c = lower; c <= upper; c++) {
        const angle = angleUnit * c;
        const rotated = Vectors3.rotate({
          rotate: top,
          around: axis,
          rad: angle
        });
        arr[c] = rotated;
      }
      return arr;
    }
    // setup points
    const topL = tri.direction === Pointing.UP ? tri.A : tri.B;
    const botL = tri.direction === Pointing.UP ? tri.C : tri.A;
    const topR = tri.direction === Pointing.UP ? tri.A : tri.C;
    const botR = tri.direction === Pointing.UP ? tri.B : tri.A;
    // generate side points
    const pointsL = generateSidePoints(topL, botL);
    const pointsR = generateSidePoints(topR, botR);
    return [[pointsL, pointsR], lower];
  }
  /**
   * {@link TODO: can be removed - use lazy instead and set lower and upper bounds to be min/max}
   * @param left point on the left
   * @param right point on the right
   * @param numDivisions number of times to divide
   * @returns Array of points including left and right. If numDivisions is 0, it means at triangle tip, only return 1 point
   */
  static rowPointsAllQuaternion({
    left,
    right,
    numDivisions
  }: {
    left: point3 | gpoint3;
    right: point3 | gpoint3;
    numDivisions: number;
  }): point3[] {
    // if no divisions, means triangle tip, left and right are the same, return 1
    if (numDivisions <= 0) return [left];
    const pointArr: point3[] = [];
    const angle = this.angleBetween({
      a: left,
      b: right
    });
    const angleUnit = angle / numDivisions;
    const axis = Vectors3.orthogonal({
      pointAbove: left,
      pointBelow: right
    });
    // add first point
    pointArr.push(left);
    // add points between
    for (let c = 1; c < numDivisions; c++) {
      const angle = angleUnit * c;
      const rotated = Vectors3.rotate({
        rotate: left,
        around: axis,
        rad: angle
      });
      pointArr.push(rotated);
    }
    // add last point
    pointArr.push(right);
    return pointArr;
  }
  /**
   *
   * @param start index to start at
   * @param left left bound
   * @param right right bound
   * @param numDivisions number of divisions on row
   * @returns lazy array of points in row in their positions in triangles and start column index -> [lazy array, start column index]
   * points before defined ones are undefined
   */
  static rowPointsLazyQuaternion({
    start,
    left,
    right,
    numDivisions,
    lazyRange = Constants.lazyRange / 2,
    lower = start - lazyRange,
    upper = start + lazyRange
  }: {
    start: number;
    left: point3 | gpoint3;
    right: point3 | gpoint3;
    numDivisions: number;
    lazyRange?: number;
    lower?: number;
    upper?: number;
  }): [point3[], number] {
    if (numDivisions <= 0) return [[left], 0];
    // setup lazy range

    if (lower < 0) lower = 0;
    if (upper > numDivisions) upper = numDivisions;
    // console.log("row points, lower: " + lower + ", upper: " + upper);
    const points: point3[] = [];
    const angle = this.angleBetween({
      a: left,
      b: right
    });
    const angleUnit = angle / numDivisions;
    const axis = Vectors3.orthogonal({
      pointAbove: left,
      pointBelow: right
    });
    // add points between lazy range
    for (let c = lower; c <= upper; c++) {
      const angle = angleUnit * c;
      const rotated = Vectors3.rotate({
        rotate: left,
        around: axis,
        rad: angle
      });
      points[c] = rotated;
    }
    return [points, lower];
  }
  /**
   *
   * @param A point A
   * @param B point B
   * @returns angle between A and B in radians
   */
  static angleBetween({
    a,
    b
  }: {
    a: point3 | gpoint3;
    b: point3 | gpoint3;
  }): number {
    // let vectors a and b
    // 𝚹 = acos( a dot b / ||a|| * ||b|| )
    let inner =
      Vectors3.dot(a, b) / (Vectors3.magnitude(a) * Vectors3.magnitude(b));
    if (inner > 1) {
      inner = 1;
    }
    if (inner < -1) {
      inner = -1;
    }
    return Math.acos(inner);
  }
  /**
   * rotates point with quaternions
   * {@link https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation#Using_quaternion_as_rotations}
   * {@link https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/transforms/index.html}
   * @param rotate point/vector to rotate
   * @param around point/vector to rotate around
   * @param rad amount to rotate in radians
   */
  static rotate({
    rotate,
    around,
    rad
  }: {
    rotate: point3 | gpoint3;
    around: point3 | gpoint3;
    rad: number;
  }): point3 {
    // const magnitude = Vectors3.magnitude();
    const axis: quaternion = Quaternions.unitQuaternion({ w: 0, vec: around });
    const q: quaternion = {
      w: Math.cos(rad / 2),
      vec: Vectors3.multByScalar({ vec: axis.vec, num: Math.sin(rad / 2) })
    };
    const p: quaternion = { w: 0, vec: rotate };
    const qInv: quaternion = {
      w: Math.cos(rad / 2),
      vec: Vectors3.multByScalar({ vec: axis.vec, num: -Math.sin(rad / 2) })
    };
    const result = Quaternions.multiply(Quaternions.multiply(q, p), qInv);
    // const result =Quaternions.multiply(q, p);

    return result.vec;
  }
  /**
   * turns vector into unit vector (magnitude 1)
   * @param v vector to turn into unit vector
   */
  static unit(v: point3 | gpoint3): point3 {
    return Vectors3.divideByScalar({ vec: v, num: Vectors3.magnitude(v) });
  }
  /**
   * @param A point A
   * @param B point B
   * @returns dot product between A and B
   */
  static dot(A: point3 | gpoint3, B: point3 | gpoint3): number {
    return A.x * B.x + A.y * B.y + A.z * B.z;
  }
  /**
   * @param a vector to project
   * @param b vector to project to
   */
  static project({
    a,
    b
  }: {
    a: point3 | gpoint3;
    b: point3 | gpoint3;
  }): point3 {
    const bU = Vectors3.unit(b);
    const aMag = Vectors3.dot(a, bU);
    return Vectors3.multByScalar({ vec: bU, num: aMag });
  }
  /**
   * generates third vector on same plane as first and second that's perpendicular to first.
   * @param first first point
   * @param second second point
   * @returns point perpendicular to first point
   */
  static perp({ a, b }: { a: point3 | gpoint3; b: point3 | gpoint3 }) {
    const c = Vectors3.unit(Vectors3.cross(a, b));
    return Vectors3.cross(c, a);
  }
  /**
   * gets unit vector and multiplies by magnitude
   * @param v vector (direction)
   * @param mag magnitude
   * @returns vector with given magnitude
   */
  static mag({ v, mag }: { v: point3 | gpoint3; mag: number }): point3 {
    return Vectors3.multByScalar({ num: mag, vec: Vectors3.unit(v) });
  }
  /**
   * if viewing both vectors coming towards you, vector returned goes to the right
   * @param pointAbove
   * @param pointBelow
   * @returns vector orthogonal to both points (cross product)
   */
  static orthogonal({
    pointAbove,
    pointBelow
  }: {
    pointAbove: point3 | gpoint3; // 1
    pointBelow: point3 | gpoint3; // 2
  }): point3 {
    return Vectors3.cross(pointAbove, pointBelow);
  }
  static cross(a: point3 | gpoint3, b: point3 | gpoint3): point3 {
    // | x1 |   | x2 |   | (y1 × z2) - (y2 × z1) |
    // | y1 | ✖ | y2 | = | (z1 × x2) - (z2 × x1) |
    // | z1 |   | z2 |   | (x1 × y2) - (x2 × y1) |
    const p1 = a;
    const p2 = b;
    const x = p1.y * p2.z - p2.y * p1.z;
    const y = p1.z * p2.x - p2.z * p1.x;
    const z = p1.x * p2.y - p2.x * p1.y;
    return { x: x, y: y, z: z };
  }
  static magnitude(vec: point3 | gpoint3) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  }
  static multByScalar({
    vec,
    num
  }: {
    vec: gpoint3 | point3;
    num: number;
  }): point3 {
    return {
      x: vec.x * num,
      y: vec.y * num,
      z: vec.z * num,
      isVert: vec.isVert
    };
  }
  static divideByScalar({
    vec,
    num
  }: {
    vec: point3 | gpoint3;
    num: number;
  }): point3 {
    return {
      x: vec.x / num,
      y: vec.y / num,
      z: vec.z / num
    };
  }
  static add(A: point3 | gpoint3, B: point3 | gpoint3): point3 {
    return { x: A.x + B.x, y: A.y + B.y, z: A.z + B.z };
  }
  static subtract(A: point3 | gpoint3, B: point3 | gpoint3): point3 {
    return { x: A.x - B.x, y: A.y - B.y, z: A.z - B.z };
  }
  static distance(A: point3, B: point3): number {
    return Math.sqrt(
      (A.x - B.x) * (A.x - B.x) +
      (A.y - B.y) * (A.y - B.y) +
      (A.z - B.z) * (A.z - B.z)
    );
  }
  /**
   * loosely determines if points on opposite sides of origin, max angle between them is 90
   * @returns true if angle between points is 90 or more
   */
  static isOnOppositeSide(a: point3 | gpoint3, b: point3 | gpoint3): boolean {
    return (
      Math.sign(a.x) !== Math.sign(b.x) ||
      Math.sign(a.y) !== Math.sign(b.y) ||
      Math.sign(a.z) !== Math.sign(b.z)
    );
  }
  /**
   * checks if point is valid (number isn't NAN or infinite)
   * @param p point to check
   * @returns true if point is valid
   */
  static isValid(p: point3 | gpoint3): boolean {
    return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
  }
  /**
   * @param p point
   * @param points gpoint3s to test
   * @param returns point in points that is also phex center closest to p
   */
  static closestPoint({
    p,
    points
  }: {
    p: point3 | gpoint3;
    points: gpoint3[];
  }): gpoint3 {
    let dist: number;
    let smallestDist = Constants.radius * 20;
    let closestPoint: gpoint3;
    for (const p3 of points) {
      if (p3.isVert) {
        dist = Vectors3.distance(p, p3);
        if (dist < smallestDist) {
          smallestDist = dist;
          // console.log('smallest distance: ' + )
          closestPoint = p3;
        }
      }
    }
    return closestPoint;
  }
  /**
   * gets a point's number
   * @param p point
   * @returns p's number (the number of points before it)
   */
  static pointNum(p: gpoint3): number {
    /**
     * {@link generate point number based on row and col (point number is number of points before it)
     *
     * - first figure out if point is in top pent, center, or bottom
     * - number of points in top pent is (nd)! * 5 - 4 -> (factorial nd -4 to account for 1st row)
     * - number of points in center is nd * 5
     * }
     */
    if (p.row === 0) return 0;
    const nd = numDivisions({ res: p.res });

    if (p.row <= nd) {
      const offs = topTrisOffset(p.row);
      return offs + p.col;
    }
    const topOffset = topTrisOffset(nd - 1); // doesn't include points shared between top and center tris
    if (p.row <= nd * 2) {
      const offs = topOffset + centerTrisOffset(p.row);
      return offs + p.col;
    }
    const centerOffset = centerTrisOffset(nd * 2 - 1); // doesn't include points shared between center and bottom tris
    if (p.row <= nd * 3) {
      const offs = topOffset + centerOffset + bottomTrisOffset(p.row);
      return offs + p.col;
    }

    throw new Error(
      `this shouldn't happen (Vectors3.pointNum), received point: ${JSON.stringify(
        p,
        null,
        "  "
      )}`
    );
    /**
     * {@link functions that calculate number of points before row in either top, center, or bottom icosahedron sections}
     */
    // uses series (a_n = 5x) and starts from (n = 1)
    function topTrisOffset(row: number): number {
      const n = row - 1;
      const a1 = 5;
      const an = n * 5;
      return (n / 2) * (a1 + an) + 1;
    }
    function centerTrisOffset(row: number): number {
      return (row - nd) * 5 * nd;
    }
    // uses series (a_n = nd*5 - 5x) and starts from (n = 1)
    function bottomTrisOffset(row: number): number {
      const n = row - nd * 2 - 1;
      const a1 = nd * 5;
      const an = a1 - 5 * (n - 1);
      return (n / 2) * (a1 + an);
    }
  }
}
