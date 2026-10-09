"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitAnimation = splitAnimation;
const cc_1 = require("cc");
const exotic_animation_1 = require("cc/editor/exotic-animation");
const curve_utils_1 = require("./curve-utils");
function splitAnimation(animationClip, from, to) {
    const newClip = new cc_1.AnimationClip();
    newClip.duration = to - from;
    newClip.enableTrsBlending = animationClip.enableTrsBlending;
    for (const track of animationClip.tracks) {
        const newTrack = cloneTrackWithoutChannels(track);
        const sourceChannels = Array.from(track.channels());
        const targetChannels = Array.from(newTrack.channels());
        sourceChannels.forEach(({ name, curve }, index) => {
            targetChannels[index].name = name;
            const newCurve = targetChannels[index].curve;
            if (curve instanceof cc_1.RealCurve) {
                splitRealCurve(curve, from, to, newCurve);
            }
            else if (curve instanceof cc_1.QuatCurve) {
                splitQuaternionCurve(curve, from, to, newCurve);
            }
            else {
                throw new Error('Unknown curve type.');
            }
        });
        newClip.addTrack(track);
    }
    const exoticAnimation = animationClip[exotic_animation_1.exoticAnimationTag];
    if (exoticAnimation) {
        newClip[exotic_animation_1.exoticAnimationTag] = exoticAnimation.split(from, to);
    }
    return newClip;
}
function cloneTrackWithoutChannels(track) {
    switch (true) {
        default:
            throw new Error('Unknown track type.');
        case track instanceof cc_1.animation.RealTrack: {
            const newTrack = new cc_1.animation.RealTrack();
            return newTrack;
        }
        case track instanceof cc_1.animation.QuatTrack: {
            const newTrack = new cc_1.animation.QuatTrack();
            return newTrack;
        }
        case track instanceof cc_1.animation.ObjectTrack: {
            const newTrack = new cc_1.animation.ObjectTrack();
            return newTrack;
        }
        case track instanceof cc_1.animation.VectorTrack: {
            const newTrack = new cc_1.animation.VectorTrack();
            newTrack.componentsCount = track.componentsCount;
            return newTrack;
        }
        case track instanceof cc_1.animation.ColorTrack: {
            const newTrack = new cc_1.animation.ColorTrack();
            return newTrack;
        }
        case track instanceof exotic_animation_1.RealArrayTrack: {
            const newTrack = new exotic_animation_1.RealArrayTrack();
            newTrack.elementCount = track.elementCount;
            return newTrack;
        }
    }
}
function splitRealCurve(curve, from, to, out) {
    const fromIndex = curve.indexOfKeyframe(from);
    const toIndex = curve.indexOfKeyframe(to);
    const copyFrom = fromIndex;
    const copyTo = toIndex;
    const keyframes = [...curve.keyframes()].slice(copyFrom, copyTo);
    if (copyFrom !== fromIndex) {
        const { value, tangent } = evaluateBetweenKeyframes(curve, fromIndex, copyFrom, from);
        keyframes.unshift([
            from,
            {
                value,
                interpolationMode: curve.getKeyframeValue(fromIndex).interpolationMode,
                rightTangent: tangent.y,
                rightTangentWeight: tangent.x,
            },
        ]);
    }
    if (copyTo !== toIndex) {
        const { value, tangent } = evaluateBetweenKeyframes(curve, copyTo, toIndex, to);
        keyframes.unshift([
            to,
            {
                value,
                interpolationMode: curve.getKeyframeValue(toIndex).interpolationMode,
                leftTangent: tangent.y,
                leftTangentWeight: tangent.x,
            },
        ]);
    }
    out.assignSorted(keyframes);
    out.preExtrapolation = curve.preExtrapolation;
    out.postExtrapolation = curve.postExtrapolation;
}
function splitQuaternionCurve(curve, from, to, out) {
    const fromIndex = curve.indexOfKeyframe(from);
    const toIndex = curve.indexOfKeyframe(to);
    const copyFrom = fromIndex;
    const copyTo = toIndex;
    const keyframes = [...curve.keyframes()].slice(copyFrom, copyTo);
    if (copyFrom !== fromIndex && fromIndex >= 0) {
        const fromValue = curve.evaluate(from);
        keyframes.unshift([
            from,
            {
                value: fromValue,
                interpolationMode: curve.getKeyframeValue(fromIndex).interpolationMode,
                easingMethod: curve.getKeyframeValue(fromIndex).easingMethod,
            },
        ]);
    }
    if (copyTo !== toIndex && toIndex >= 0) {
        const toValue = curve.evaluate(to);
        keyframes.unshift([
            to,
            {
                value: toValue,
                interpolationMode: curve.getKeyframeValue(toIndex).interpolationMode,
                easingMethod: curve.getKeyframeValue(toIndex).easingMethod,
            },
        ]);
    }
    out.assignSorted(keyframes);
}
function evaluateBetweenKeyframes(curve, from, to, time) {
    const fromTime = curve.getKeyframeTime(from);
    const { value: fromValue, rightTangent: fromTangentY, rightTangentWeight: fromTangentX } = curve.getKeyframeValue(from);
    const toTime = curve.getKeyframeTime(to);
    const { value: toValue, leftTangent: toTangentY, leftTangentWeight: toTangentX } = curve.getKeyframeValue(to);
    return (0, curve_utils_1.evaluateValueTangent)(time, fromTime, fromValue, fromTangentX, fromTangentY, toTime, toValue, toTangentX, toTangentY);
}
