/* eslint-disable no-undef, @typescript-eslint/no-use-before-define */
import { Constants } from "./constants";
import { gpoint3, point3, Vectors3 } from "./point3";
import { triangle, Triangles } from "./triangle";

/**
 * {@link stuff i didnt know where to put, so it's here i guess}
 */

// coordinate: [lat, lon]
export type coordinate = { lat: number; lon: number };

// rotation method
export type rotationMethod = "gnomonic" | "quaternion";

/**
 * allowed resolutions, just number since resolution can be absolutely massive
 */
export type resolution = number;

/**
 *
 * @param num number to round up
 * @param mult multiple to round up to
 * @returns number rounded up to nearest greater multiple of num, includes 0
 */
export function roundUp(num: number, mult: number): number {
  // (A + B - 1) / B
  if (num % mult === 0) return num;
  return (Math.trunc(num / mult) + 1) * mult;
}

/**
 * rounds numbers
 * @param num number to round
 * @returns numbers rounded to 4 places, if inaccurate for resolution (phexes on edge of tri), make better
 */
export function roundNums(
  n1: number,
  n2: number,
  places = 6
): [number, number] {
  return [Number(n1.toFixed(places)), Number(n2.toFixed(places))];
}

export function roundNum(n: number, places = 0): number {
  return Number(n.toFixed(places));
}

/**
 * gets closest even number by subtracting 1 if odd
 * @param n number
 * @returns [closest even number, isEven]
 */
export function closestEvenNum(n: number): [number, boolean] {
  const isEven = n % 2 === 0;
  return [isEven ? n : n - 1, isEven];
}

export function deg2rad(degs: number): number {
  return degs * (Math.PI / 180);
}

/**
 * @param res resolution
 * @return number of divisions on each triangle side
 */
export function numDivisions({ res }: { res: resolution }): number {
  return res * 3;
}

/**
 *
 * @param tri triangle
 * @param p point on sphere
 * @returns percent of components of p along triangle sides from tri.C -> [component along CA, component along CB]
 */
export function calcPercentQuaternion({
  tri, // @typescript-eslint ignore no-unused-vars
  p // @typescript-eslint ignore no-unused-vars
}: {
  tri: triangle;
  p: point3 | gpoint3;
}): [number, number] {
  throw new Error("calcPercentQuaternion not ready yet");
}
/**
 *
 * @param tri triangle
 * @param p point on sphere
 * @returns percent of components of p along triangle sides from tri.C -> [component along CA, component along CB]
 */
export function calcPercentGnomonicProjection({
  tri,
  p
}: {
  tri: triangle;
  p: point3 | gpoint3;
}): [number, number] {
  const r = Constants.radius;
  const originalAB = Vectors3.subtract(tri.B, tri.A);
  const cAB = Vectors3.add(
    tri.A,
    Vectors3.divideByScalar({ vec: originalAB, num: 2 })
  );
  const oCent = Vectors3.add(
    tri.C,
    Vectors3.multByScalar({ vec: Vectors3.subtract(cAB, tri.C), num: 2 / 3 })
  );
  const cent = Vectors3.multByScalar({ vec: Vectors3.unit(oCent), num: r });
  const alpha = Vectors3.angleBetween({ a: tri.C, b: cent });
  const magCent = Vectors3.magnitude(cent);
  const magH = magCent / Math.cos(alpha);
  const A = Vectors3.multByScalar({ vec: Vectors3.unit(tri.A), num: magH });
  const B = Vectors3.multByScalar({ vec: Vectors3.unit(tri.B), num: magH });
  const C = Vectors3.multByScalar({ vec: Vectors3.unit(tri.C), num: magH });
  const projectedTri: triangle = { A: A, B: B, C: C };
  const projectedP = Triangles.planeIntersection({ tri: projectedTri, vec: p });

  const [compCA, compCB] = vecSideComponents({
    tri: projectedTri,
    i: projectedP
  });

  const magCompCA = Vectors3.magnitude(compCA);
  const magCompCB = Vectors3.magnitude(compCB);
  const mag = Vectors3.magnitude(Vectors3.subtract(B, A));

  return [magCompCA / mag, magCompCB / mag];
}
/**
 * @param tri triangle
 * @param p point whose vector intersects tri plane and is within bounds
 * @param i intersection of p vector in triangle plane
 * @returns vectors that are on triangle sides and add up to point from tri.C, [vec on CA, vec on CB]
 */
function vecSideComponents({
  tri,
  p,
  i
}: {
  tri: triangle;
  p?: point3 | gpoint3;
  i?: point3 | gpoint3;
}): [point3, point3] {
  if (!p && !i) throw new Error("need either p or i");
  // if i not provided, generate
  if (p) i = Triangles.planeIntersection({ tri: tri, vec: p });
  // setup everything in relation to C
  const uCA = Vectors3.unit(Vectors3.subtract(tri.A, tri.C));
  const uCB = Vectors3.unit(Vectors3.subtract(tri.B, tri.C));
  const CI = Vectors3.subtract(i, tri.C); // C to intersection, I is intersection

  const beta = Vectors3.angleBetween({ a: uCA, b: CI });
  const alpha = Vectors3.angleBetween({ a: CI, b: uCB });
  const phi = Math.PI - beta - alpha;

  // law of sines to find missing magnitudes/lengths
  const magCI = Vectors3.magnitude(CI);
  const magCB = (magCI * Math.sin(beta)) / Math.sin(phi);
  const magCA = (magCI * Math.sin(alpha)) / Math.sin(phi);

  // return projected magnitudes
  return [
    Vectors3.multByScalar({ vec: uCA, num: magCA }),
    Vectors3.multByScalar({ vec: uCB, num: magCB })
  ];
}
