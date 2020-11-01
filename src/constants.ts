import { point3 } from "./point3";

export class Constants {
  static get golden_ratio() {
    return (1 + Math.sqrt(5)) / 2;
  }
  static get radius() {
    return 250;
  }
  static get diameter() {
    return 2 * Math.PI * Constants.radius;
  }
  static get origin3(): point3 {
    return { x: 0, y: 0, z: 0 };
  }
  /**
   * {@link TODO: make lazy range depend on resolution; since there's distortion,
   * make bigger as resolution increases, and round to integer (move to ./stuff.ts then?)}
   */
  static get lazyRange(): number {
    return 4;
  }
}
