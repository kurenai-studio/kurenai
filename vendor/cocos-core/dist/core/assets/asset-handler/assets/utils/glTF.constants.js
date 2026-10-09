"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlTfAnimationInterpolation = exports.GltfAnimationChannelTargetPath = exports.GltfWrapMode = exports.GltfTextureMinFilter = exports.GltfTextureMagFilter = exports.GltfPrimitiveMode = exports.GltfAccessorType = exports.GltfAccessorComponentType = void 0;
exports.getGltfAccessorTypeComponents = getGltfAccessorTypeComponents;
var GltfAccessorComponentType;
(function (GltfAccessorComponentType) {
    GltfAccessorComponentType[GltfAccessorComponentType["BYTE"] = 5120] = "BYTE";
    GltfAccessorComponentType[GltfAccessorComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
    GltfAccessorComponentType[GltfAccessorComponentType["SHORT"] = 5122] = "SHORT";
    GltfAccessorComponentType[GltfAccessorComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    GltfAccessorComponentType[GltfAccessorComponentType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
    GltfAccessorComponentType[GltfAccessorComponentType["FLOAT"] = 5126] = "FLOAT";
})(GltfAccessorComponentType || (exports.GltfAccessorComponentType = GltfAccessorComponentType = {}));
var GltfAccessorType;
(function (GltfAccessorType) {
    GltfAccessorType["SCALAR"] = "SCALAR";
    GltfAccessorType["VEC2"] = "VEC2";
    GltfAccessorType["VEC3"] = "VEC3";
    GltfAccessorType["VEC4"] = "VEC4";
    GltfAccessorType["MAT2"] = "MAT2";
    GltfAccessorType["MAT3"] = "MAT3";
    GltfAccessorType["MAT4"] = "MAT4";
})(GltfAccessorType || (exports.GltfAccessorType = GltfAccessorType = {}));
function getGltfAccessorTypeComponents(type) {
    switch (type) {
        case GltfAccessorType.SCALAR:
            return 1;
        case GltfAccessorType.VEC2:
            return 2;
        case GltfAccessorType.VEC3:
            return 3;
        case GltfAccessorType.VEC4:
        case GltfAccessorType.MAT2:
            return 4;
        case GltfAccessorType.MAT3:
            return 9;
        case GltfAccessorType.MAT4:
            return 16;
        default:
            throw new Error(`Unrecognized attribute type: ${type}.`);
    }
}
var GltfPrimitiveMode;
(function (GltfPrimitiveMode) {
    GltfPrimitiveMode[GltfPrimitiveMode["POINTS"] = 0] = "POINTS";
    GltfPrimitiveMode[GltfPrimitiveMode["LINES"] = 1] = "LINES";
    GltfPrimitiveMode[GltfPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
    GltfPrimitiveMode[GltfPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
    GltfPrimitiveMode[GltfPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
    GltfPrimitiveMode[GltfPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
    GltfPrimitiveMode[GltfPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    GltfPrimitiveMode[GltfPrimitiveMode["__DEFAULT"] = 4] = "__DEFAULT";
})(GltfPrimitiveMode || (exports.GltfPrimitiveMode = GltfPrimitiveMode = {}));
var GltfTextureMagFilter;
(function (GltfTextureMagFilter) {
    GltfTextureMagFilter[GltfTextureMagFilter["NEAREST"] = 9728] = "NEAREST";
    GltfTextureMagFilter[GltfTextureMagFilter["LINEAR"] = 9729] = "LINEAR";
})(GltfTextureMagFilter || (exports.GltfTextureMagFilter = GltfTextureMagFilter = {}));
var GltfTextureMinFilter;
(function (GltfTextureMinFilter) {
    GltfTextureMinFilter[GltfTextureMinFilter["NEAREST"] = 9728] = "NEAREST";
    GltfTextureMinFilter[GltfTextureMinFilter["LINEAR"] = 9729] = "LINEAR";
    GltfTextureMinFilter[GltfTextureMinFilter["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
    GltfTextureMinFilter[GltfTextureMinFilter["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
    GltfTextureMinFilter[GltfTextureMinFilter["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
    GltfTextureMinFilter[GltfTextureMinFilter["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
})(GltfTextureMinFilter || (exports.GltfTextureMinFilter = GltfTextureMinFilter = {}));
var GltfWrapMode;
(function (GltfWrapMode) {
    GltfWrapMode[GltfWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
    GltfWrapMode[GltfWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    GltfWrapMode[GltfWrapMode["REPEAT"] = 10497] = "REPEAT";
    GltfWrapMode[GltfWrapMode["__DEFAULT"] = 10497] = "__DEFAULT";
})(GltfWrapMode || (exports.GltfWrapMode = GltfWrapMode = {}));
var GltfAnimationChannelTargetPath;
(function (GltfAnimationChannelTargetPath) {
    GltfAnimationChannelTargetPath["translation"] = "translation";
    GltfAnimationChannelTargetPath["rotation"] = "rotation";
    GltfAnimationChannelTargetPath["scale"] = "scale";
    GltfAnimationChannelTargetPath["weights"] = "weights";
})(GltfAnimationChannelTargetPath || (exports.GltfAnimationChannelTargetPath = GltfAnimationChannelTargetPath = {}));
var GlTfAnimationInterpolation;
(function (GlTfAnimationInterpolation) {
    GlTfAnimationInterpolation["STEP"] = "STEP";
    GlTfAnimationInterpolation["LINEAR"] = "LINEAR";
    GlTfAnimationInterpolation["CUBIC_SPLINE"] = "CUBICSPLINE";
})(GlTfAnimationInterpolation || (exports.GlTfAnimationInterpolation = GlTfAnimationInterpolation = {}));
