"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlTFTrsTrackData = exports.GlTFTrsAnimationData = void 0;
const glTF_constants_1 = require("./glTF.constants");
const cc = __importStar(require("cc"));
const exotic_animation_1 = require("cc/editor/exotic-animation");
class GlTFTrsAnimationData {
    nodes = {};
    inputs = [];
    addNodeAnimation(path) {
        return (this.nodes[path] ??= new GlTFNodeTrsAnimationData());
    }
    createExotic() {
        const exoticAnimation = new exotic_animation_1.ExoticAnimation();
        for (const [path, data] of Object.entries(this.nodes)) {
            data.emitExotic(exoticAnimation, path);
        }
        return exoticAnimation;
    }
}
exports.GlTFTrsAnimationData = GlTFTrsAnimationData;
const INPUT_0 = new Float32Array([0.0]);
class GlTFNodeTrsAnimationData {
    position = null;
    rotation = null;
    scale = null;
    setConstantPosition(v) {
        this.position = new GlTFTrsTrackData(glTF_constants_1.GlTfAnimationInterpolation.STEP, INPUT_0, cc.Vec3.toArray(new Float32Array(3), v));
    }
    setConstantRotation(v) {
        this.rotation = new GlTFTrsTrackData(glTF_constants_1.GlTfAnimationInterpolation.STEP, INPUT_0, cc.Quat.toArray(new Float32Array(4), v));
    }
    setConstantScale(v) {
        this.scale = new GlTFTrsTrackData(glTF_constants_1.GlTfAnimationInterpolation.STEP, INPUT_0, cc.Vec3.toArray(new Float32Array(3), v));
    }
    emitExotic(exoticAnimation, path) {
        const { position, rotation, scale } = this;
        if (!position && !rotation && !scale) {
            return;
        }
        const exoticNodeAnimation = exoticAnimation.addNodeAnimation(path);
        const fps = 30;
        if (position) {
            const { input, output } = position.toLinearVec3Curve(fps);
            exoticNodeAnimation.createPosition(input, output);
        }
        if (rotation) {
            const { input, output } = rotation.toLinearQuatCurveNormalized(fps);
            exoticNodeAnimation.createRotation(input, output);
        }
        if (scale) {
            const { input, output } = scale.toLinearVec3Curve(fps);
            exoticNodeAnimation.createScale(input, output);
        }
    }
}
class GlTFTrsTrackData {
    interpolation;
    input;
    output;
    constructor(interpolation, input, output) {
        this.interpolation = interpolation;
        this.input = input;
        this.output = output;
    }
    toLinearVec3Curve(fps) {
        switch (this.interpolation) {
            case glTF_constants_1.GlTfAnimationInterpolation.CUBIC_SPLINE:
                return cubicSplineToLinearCurveData(this.input, this.output, 3, fps);
            case glTF_constants_1.GlTfAnimationInterpolation.STEP:
                return constantToLinearCurveData(this.input, this.output, 3, fps);
            default:
                return { input: this.input, output: this.output };
        }
    }
    toLinearQuatCurveNormalized(fps) {
        // https://github.com/KhronosGroup/glTF/issues/2008
        const result = this.toLinearQuatCurve(fps);
        const { output } = result;
        const q = new cc.Quat();
        for (let iQuat = 0; iQuat < output.length / 4; ++iQuat) {
            cc.Quat.fromArray(q, output, 4 * iQuat);
            cc.Quat.normalize(q, q);
            cc.Quat.toArray(output, q, 4 * iQuat);
        }
        return result;
    }
    toLinearQuatCurve(fps) {
        switch (this.interpolation) {
            case glTF_constants_1.GlTfAnimationInterpolation.CUBIC_SPLINE:
                return cubicSplineToLinearCurveData(this.input, this.output, 4, fps);
            case glTF_constants_1.GlTfAnimationInterpolation.STEP:
                return constantToLinearCurveData(this.input, this.output, 4, fps);
            default:
                return { input: this.input, output: this.output };
        }
    }
}
exports.GlTFTrsTrackData = GlTFTrsTrackData;
function calculateBakeParams(times, fps) {
    const startTime = times[0];
    const endTime = times[times.length - 1];
    const interval = 1.0 / fps;
    const count = (endTime - startTime) / interval;
    return {
        startTime,
        endTime,
        interval,
        count,
    };
}
function createTimesFromBakeParams(bakeParams, Constructor) {
    const { startTime, endTime, interval, count } = bakeParams;
    const result = new Constructor(count);
    for (let i = 0; i < count; i++) {
        result[i] = i === count - 1 ? endTime : startTime + interval * i;
    }
    return result;
}
function constantToLinearCurveData(times, values, components, fps) {
    if (times.length < 2) {
        return {
            input: times,
            output: values,
        };
    }
    const nValue = values.length / components;
    const bakeParams = calculateBakeParams(times, fps);
    const outputs = new Float32Array(components * bakeParams.count);
    for (let iComponent = 0; iComponent < components; ++iComponent) {
        const curve = new cc.RealCurve();
        curve.assignSorted(Array.from(times), Array.from({ length: nValue }, (_, iKeyframe) => ({
            value: values[components * iKeyframe + iComponent],
            interpolationMode: cc.RealInterpolationMode.CONSTANT,
        })));
        bake(curve, bakeParams, outputs, components, iComponent);
    }
    return {
        input: createTimesFromBakeParams(bakeParams, Float32Array),
        output: outputs,
    };
}
function cubicSplineToLinearCurveData(times, values, components, fps) {
    if (times.length < 2) {
        return {
            input: times,
            output: values,
        };
    }
    const nValue = values.length / (components * 3);
    const bakeParams = calculateBakeParams(times, fps);
    const outputs = new Float32Array(components * bakeParams.count);
    for (let iComponent = 0; iComponent < components; ++iComponent) {
        const curve = new cc.RealCurve();
        curve.assignSorted(Array.from(times), Array.from({ length: nValue }, (_, iKeyframe) => {
            const pComponentFrame = components * 3 * iKeyframe + iComponent;
            const inTangent = values[pComponentFrame + components * 0];
            const dataPoint = values[pComponentFrame + components * 1];
            const outTangent = values[pComponentFrame + components * 2];
            return {
                value: dataPoint,
                leftTangent: inTangent,
                rightTangent: outTangent,
                interpolationMode: cc.RealInterpolationMode.CUBIC,
            };
        }));
        bake(curve, bakeParams, outputs, components, iComponent);
    }
    return {
        input: createTimesFromBakeParams(bakeParams, Float32Array),
        output: outputs,
    };
}
function bake(curve, bakeParams, output, stride, offset) {
    const { startTime, endTime, interval, count } = bakeParams;
    let time = startTime;
    for (let i = 0; i < count; ++i, time += interval) {
        const value = curve.evaluate(i === count - 1 ? endTime : time);
        output[stride * i + offset] = value;
    }
}
