/**
 * {@link add functions to verify function params, like mapOrientation or rotationMethod}
 */

import {
    mapOrientation,
    mapOrientationKey,
    rotationMethod,
    rotationMethodKey
} from "./stuff";

/**
 * @throws error if not valid mapOrientation
 * @param mo mapOrientation
 * @returns whether valid
 */
export function verifyMapOrientation(mo: mapOrientation): boolean {
    if (mo !== "ECEF" && mo !== "dymaxion") {
        throw new Error(
            `invaild map orientation, valid ones: "ECEF" or "dymaxion", provided one: ${mo}`
        );
    }
    if (mo === "dymaxion") {
        throw new Error(
            "dymaxion map orientation not ready yet, if you think it should be added check out contact info at hexmap README, if you request it ill probably add it in about a day"
        );
    }
    return true;
}
export function verifyMapOrientationKey(mo: mapOrientationKey): boolean {
    if (mo !== "e" && mo !== "d") {
        throw new Error(
            `unknown rotation method key, valid ones: "e" or "d", provided one: ${mo}`
        );
    }
    return true;
}
export function verifyRotationMethod(rm: rotationMethod, throwIfQuaternion = true): boolean {
    if (rm !== "gnomonic" && rm !== "quaternion") {
        throw new Error(
            `invaild rotation method, valid ones: "gnomonic" or "quaternion", provided one: ${rm}`
        );
    }
    if (throwIfQuaternion && rm === "quaternion") {
        throw new Error(
            "quaternion rotation method not ready yet, very inaccurate right now, if you think you can solve this problem, it would be pretty sweet, problem is explained in hexmap README towards the bottom"
        );
    }
    return true;
}
export function verifyRotationMethodKey(rm: rotationMethodKey): boolean {
    if (rm !== "g" && rm !== "q") {
        throw new Error(
            `unknown rotation method key, valid ones: "g" or "q", provided one: ${rm}`
        );
    }
    return true;
}
export function verifySplitHashArr(arr: (number | string)[]): boolean {
    if (arr.length !== 3 && arr.length !== 5) {
        throw new Error(
            `invalid hash, must have either 3 or 5 components, provided components: ${JSON.stringify(
                arr
            )}, provided component cound: ${arr.length}`
        );
    }
    return true;
}
