/* eslint-disable no-undef */
import { gpoint3 } from "./point3";
import { roundUp } from "./stuff";

/**
 * combination of pentagon and hex, since some polys can be pentagons
 */
export type phex = {
  // perimeter points
  points: gpoint3[];
  // center points
  center: gpoint3;
};

/**
 * hexagon utility class
 */
export class Phexes {
  static generateAllPhexes(allPoints: gpoint3[][]): phex[] {
    // number of spaces each triangle side is divided into
    const centers = Phexes.generatePhexCenters(allPoints);

    const phexes: phex[] = [];

    for (const c of centers) {
      // first hex center index is -> row_num % 3
      phexes.push({
        points: Phexes.surroundingPoints(c, allPoints),
        center: c
      });
    }
    return phexes;
  }

  /**
   *
   * @param points all points on icosahedron
   * @returns points that are center points
   */
  static generatePhexCenters(points: gpoint3[][]): gpoint3[] {
    // number of spaces each triangle side is divided into
    const triDivCount = (points.length - 1) / 3;
    const centers: gpoint3[] = [];

    // TODO: based on tri div count and f1 (pretty much based on what row currently on)
    // if in top or bottom pent, different algorithm needed)
    // for top and bottom pents need to check if at triangle edge (increment loop by 1), and if yes, restart counter

    for (let fl = 0; fl < points.length; fl++) {
      // first hex center index is -> row_num % 3
      // const firstHexCenterIndx = fl % 3;
      let firstHexCenterIndx: number;
      if (fl < triDivCount) {
        firstHexCenterIndx = roundUp(fl, 3) - fl;
        let count = 0;
        for (let sl = 0; sl < points[fl].length; sl++) {
          if (sl % fl === 0) {
            // if at triangle edge, reset count
            count = firstHexCenterIndx;
          }
          if (count === 0) {
            // if count === 0, it means at triangle center, add point and reset counter
            centers.push(points[fl][sl]);
            count = 3;
          }
          count--;
        }
      } else if (fl > triDivCount * 2) {
        firstHexCenterIndx = fl % 3;
        let count = 0;
        for (let sl = 0; sl < points[fl].length; sl++) {
          if (sl % (roundUp(fl, triDivCount) - fl) === 0) {
            count = firstHexCenterIndx;
          }
          if (count === 0) {
            // if count === 0, it means at triangle center, add point and reset counter
            centers.push(points[fl][sl]);
            count = 3;
          }
          count--;
        }
      } else {
        firstHexCenterIndx = fl % 3;
        for (let sl = firstHexCenterIndx; sl < points[fl].length; sl += 3) {
          centers.push(points[fl][sl]);
        }
      }
    }
    return centers;
  }

  /**
   * calculate points around point, doesn't account for north or south points
   * @param p phex center point for which to calculate points
   * @param allPoints all icosahedron points
   */
  static surroundingPoints(p: gpoint3, allPoints: gpoint3[][]): gpoint3[] {
    if (p.isVert) {
      // north
      if (p.row === 0) return allPoints[1];
      // south
      if (p.row === allPoints.length - 1)
        return allPoints[allPoints.length - 2];
    }
    let leftIndx: number = p.col - 1;
    let rightIndx: number = p.col + 1;
    if (allPoints[p.row].length <= rightIndx) {
      rightIndx = 0;
    }
    if (leftIndx < 0) {
      leftIndx = allPoints[p.row].length - 1;
    }

    const triDiv = p.res * 3;
    let l_cent: gpoint3, l_abov: gpoint3, r_abov: gpoint3;
    let r_cent: gpoint3, r_belo: gpoint3, l_belo: gpoint3;

    if (p.row < triDiv) {
      // top pent phezes
      const offset = Math.trunc(p.col / p.row);
      if (p.col % p.row === 0) {
        // if point is on edge, special case
        let l_cent_indx = p.col + offset - 1;
        if (l_cent_indx < 0) l_cent_indx = allPoints[p.row + 1].length - 1;
        let l_abov_indx = p.col - 1;
        if (l_abov_indx < 0) l_abov_indx = allPoints[p.row].length - 1;
        l_cent = allPoints[p.row + 1][l_cent_indx];
        l_abov = allPoints[p.row][l_abov_indx];
        r_abov = allPoints[p.row - 1][p.col - offset];
        r_cent = allPoints[p.row][rightIndx];
        r_belo = allPoints[p.row + 1][p.col + 1 + offset];
        l_belo = allPoints[p.row + 1][p.col + offset];
      } else {
        // if point not on edge, do stuff
        let r_abov_indx = p.col - offset;
        if (r_abov_indx >= allPoints[p.row - 1].length) r_abov_indx = 0;
        l_cent = allPoints[p.row][leftIndx];
        l_abov = allPoints[p.row - 1][leftIndx - offset];
        r_abov = allPoints[p.row - 1][r_abov_indx];
        r_cent = allPoints[p.row][rightIndx];
        r_belo = allPoints[p.row + 1][p.col + 1 + offset];
        l_belo = allPoints[p.row + 1][p.col + offset];
      }
      return [l_cent, l_abov, r_abov, r_cent, r_belo, l_belo];
    } else if (p.row > triDiv && p.row < triDiv * 2) {
      // center phexes
      l_cent = allPoints[p.row][leftIndx];
      l_abov = allPoints[p.row - 1][p.col];
      r_abov = allPoints[p.row - 1][rightIndx];
      r_cent = allPoints[p.row][rightIndx];
      r_belo = allPoints[p.row + 1][p.col];
      l_belo = allPoints[p.row + 1][leftIndx];
      return [l_cent, l_abov, r_abov, r_cent, r_belo, l_belo];
    } else if (p.row > triDiv * 2) {
      // bottom pent phexes
      const offset = Math.trunc(p.col / (triDiv * 3 - p.row));
      if (p.col % (triDiv * 3 - p.row) === 0) {
        // console.log("offset: " + topOffset);
        // if point is on edge, special case
        let l_cent_indx = p.col + offset - 1;
        if (l_cent_indx < 0) l_cent_indx = allPoints[p.row - 1].length - 1;
        let l_belo_indx = p.col - 1;
        if (l_belo_indx < 0) l_belo_indx = allPoints[p.row].length - 1;

        // if (l_cent_indx < 0) l_cent_indx = allPoints[p.row + 1].length - 1;
        l_cent = allPoints[p.row - 1][l_cent_indx];
        l_abov = allPoints[p.row - 1][p.col + offset];
        r_abov = allPoints[p.row - 1][p.col + offset + 1];
        r_cent = allPoints[p.row][rightIndx];
        r_belo = allPoints[p.row + 1][p.col - offset];
        l_belo = allPoints[p.row][l_belo_indx];
      } else {
        // if point not on edge, do stuff
        let r_belo_indx = p.col - offset; // p.col - botOffset;
        if (r_belo_indx >= allPoints[p.row + 1].length) r_belo_indx = 0;
        l_cent = allPoints[p.row][leftIndx];
        l_abov = allPoints[p.row - 1][p.col + offset];
        r_abov = allPoints[p.row - 1][p.col + offset + 1];
        r_cent = allPoints[p.row][rightIndx];
        r_belo = allPoints[p.row + 1][r_belo_indx];
        l_belo = allPoints[p.row + 1][leftIndx - offset];
      }
      return [l_cent, l_abov, r_abov, r_cent, r_belo, l_belo];
    } else if (p.row / triDiv === 1) {
      // top edge phexes
      const offsetTop: number = Math.trunc(
        Math.trunc(
          (p.col / allPoints[p.row].length) * allPoints[p.row - 1].length
        ) /
        (p.row - 1)
      );
      // if point not on edge, do stuf
      l_cent = allPoints[p.row][leftIndx];
      l_abov = allPoints[p.row - 1][leftIndx - offsetTop];
      r_abov = allPoints[p.row - 1][p.col - offsetTop];
      r_cent = allPoints[p.row][rightIndx];
      r_belo = allPoints[p.row + 1][p.col];
      l_belo = allPoints[p.row + 1][leftIndx];
      if (p.isVert) {
        return [l_cent, r_abov, r_cent, r_belo, l_belo];
      } else {
        return [l_cent, l_abov, r_abov, r_cent, r_belo, l_belo];
      }
    } else if (p.row / (triDiv * 2) === 1) {
      // bottom edge phexes
      const offsetTop: number = Math.trunc(
        Math.trunc(
          (p.col / allPoints[p.row].length) * allPoints[p.row + 1].length
        ) /
        (triDiv - 1)
      );
      // if point not on edge, do stuf
      l_cent = allPoints[p.row][leftIndx];
      l_abov = allPoints[p.row - 1][p.col];
      r_abov = allPoints[p.row - 1][rightIndx];
      r_cent = allPoints[p.row][rightIndx];
      r_belo = allPoints[p.row + 1][p.col - offsetTop];
      l_belo = allPoints[p.row + 1][leftIndx - offsetTop];
      if (p.isVert) {
        return [l_cent, l_abov, r_abov, r_cent, r_belo];
      } else {
        return [l_cent, l_abov, r_abov, r_cent, r_belo, l_belo];
      }
    }
    throw Error("this should not happen");
  }
}
