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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xURi5jb25zdGFudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvdXRpbHMvZ2xURi5jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBbUJBLHNFQWtCQztBQXJDRCxJQUFZLHlCQU9YO0FBUEQsV0FBWSx5QkFBeUI7SUFDakMsNEVBQVcsQ0FBQTtJQUNYLDhGQUFvQixDQUFBO0lBQ3BCLDhFQUFZLENBQUE7SUFDWixnR0FBcUIsQ0FBQTtJQUNyQiw0RkFBbUIsQ0FBQTtJQUNuQiw4RUFBWSxDQUFBO0FBQ2hCLENBQUMsRUFQVyx5QkFBeUIseUNBQXpCLHlCQUF5QixRQU9wQztBQUVELElBQVksZ0JBUVg7QUFSRCxXQUFZLGdCQUFnQjtJQUN4QixxQ0FBaUIsQ0FBQTtJQUNqQixpQ0FBYSxDQUFBO0lBQ2IsaUNBQWEsQ0FBQTtJQUNiLGlDQUFhLENBQUE7SUFDYixpQ0FBYSxDQUFBO0lBQ2IsaUNBQWEsQ0FBQTtJQUNiLGlDQUFhLENBQUE7QUFDakIsQ0FBQyxFQVJXLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBUTNCO0FBRUQsU0FBZ0IsNkJBQTZCLENBQUMsSUFBWTtJQUN0RCxRQUFRLElBQUksRUFBRSxDQUFDO1FBQ1gsS0FBSyxnQkFBZ0IsQ0FBQyxNQUFNO1lBQ3hCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7UUFDM0IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sRUFBRSxDQUFDO1FBQ2Q7WUFDSSxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7QUFDTCxDQUFDO0FBRUQsSUFBWSxpQkFTWDtBQVRELFdBQVksaUJBQWlCO0lBQ3pCLDZEQUFVLENBQUE7SUFDViwyREFBUyxDQUFBO0lBQ1QsbUVBQWEsQ0FBQTtJQUNiLHFFQUFjLENBQUE7SUFDZCxtRUFBYSxDQUFBO0lBQ2IsNkVBQWtCLENBQUE7SUFDbEIseUVBQWdCLENBQUE7SUFDaEIsbUVBQWEsQ0FBQTtBQUNqQixDQUFDLEVBVFcsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFTNUI7QUFFRCxJQUFZLG9CQUdYO0FBSEQsV0FBWSxvQkFBb0I7SUFDNUIsd0VBQWMsQ0FBQTtJQUNkLHNFQUFhLENBQUE7QUFDakIsQ0FBQyxFQUhXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBRy9CO0FBRUQsSUFBWSxvQkFPWDtBQVBELFdBQVksb0JBQW9CO0lBQzVCLHdFQUFjLENBQUE7SUFDZCxzRUFBYSxDQUFBO0lBQ2Isc0dBQTZCLENBQUE7SUFDN0Isb0dBQTRCLENBQUE7SUFDNUIsb0dBQTRCLENBQUE7SUFDNUIsa0dBQTJCLENBQUE7QUFDL0IsQ0FBQyxFQVBXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBTy9CO0FBRUQsSUFBWSxZQUtYO0FBTEQsV0FBWSxZQUFZO0lBQ3BCLHFFQUFxQixDQUFBO0lBQ3JCLHlFQUF1QixDQUFBO0lBQ3ZCLHVEQUFjLENBQUE7SUFDZCw2REFBaUIsQ0FBQTtBQUNyQixDQUFDLEVBTFcsWUFBWSw0QkFBWixZQUFZLFFBS3ZCO0FBRUQsSUFBWSw4QkFLWDtBQUxELFdBQVksOEJBQThCO0lBQ3RDLDZEQUEyQixDQUFBO0lBQzNCLHVEQUFxQixDQUFBO0lBQ3JCLGlEQUFlLENBQUE7SUFDZixxREFBbUIsQ0FBQTtBQUN2QixDQUFDLEVBTFcsOEJBQThCLDhDQUE5Qiw4QkFBOEIsUUFLekM7QUFFRCxJQUFZLDBCQUlYO0FBSkQsV0FBWSwwQkFBMEI7SUFDbEMsMkNBQWEsQ0FBQTtJQUNiLCtDQUFpQixDQUFBO0lBQ2pCLDBEQUE0QixDQUFBO0FBQ2hDLENBQUMsRUFKVywwQkFBMEIsMENBQTFCLDBCQUEwQixRQUlyQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUge1xuICAgIEJZVEUgPSA1MTIwLFxuICAgIFVOU0lHTkVEX0JZVEUgPSA1MTIxLFxuICAgIFNIT1JUID0gNTEyMixcbiAgICBVTlNJR05FRF9TSE9SVCA9IDUxMjMsXG4gICAgVU5TSUdORURfSU5UID0gNTEyNSxcbiAgICBGTE9BVCA9IDUxMjYsXG59XG5cbmV4cG9ydCBlbnVtIEdsdGZBY2Nlc3NvclR5cGUge1xuICAgIFNDQUxBUiA9ICdTQ0FMQVInLFxuICAgIFZFQzIgPSAnVkVDMicsXG4gICAgVkVDMyA9ICdWRUMzJyxcbiAgICBWRUM0ID0gJ1ZFQzQnLFxuICAgIE1BVDIgPSAnTUFUMicsXG4gICAgTUFUMyA9ICdNQVQzJyxcbiAgICBNQVQ0ID0gJ01BVDQnLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2x0ZkFjY2Vzc29yVHlwZUNvbXBvbmVudHModHlwZTogc3RyaW5nKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yVHlwZS5TQ0FMQVI6XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JUeXBlLlZFQzI6XG4gICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JUeXBlLlZFQzM6XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JUeXBlLlZFQzQ6XG4gICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yVHlwZS5NQVQyOlxuICAgICAgICAgICAgcmV0dXJuIDQ7XG4gICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yVHlwZS5NQVQzOlxuICAgICAgICAgICAgcmV0dXJuIDk7XG4gICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yVHlwZS5NQVQ0OlxuICAgICAgICAgICAgcmV0dXJuIDE2O1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgYXR0cmlidXRlIHR5cGU6ICR7dHlwZX0uYCk7XG4gICAgfVxufVxuXG5leHBvcnQgZW51bSBHbHRmUHJpbWl0aXZlTW9kZSB7XG4gICAgUE9JTlRTID0gMCxcbiAgICBMSU5FUyA9IDEsXG4gICAgTElORV9MT09QID0gMixcbiAgICBMSU5FX1NUUklQID0gMyxcbiAgICBUUklBTkdMRVMgPSA0LFxuICAgIFRSSUFOR0xFX1NUUklQID0gNSxcbiAgICBUUklBTkdMRV9GQU4gPSA2LFxuICAgIF9fREVGQVVMVCA9IDQsXG59XG5cbmV4cG9ydCBlbnVtIEdsdGZUZXh0dXJlTWFnRmlsdGVyIHtcbiAgICBORUFSRVNUID0gOTcyOCxcbiAgICBMSU5FQVIgPSA5NzI5LFxufVxuXG5leHBvcnQgZW51bSBHbHRmVGV4dHVyZU1pbkZpbHRlciB7XG4gICAgTkVBUkVTVCA9IDk3MjgsXG4gICAgTElORUFSID0gOTcyOSxcbiAgICBORUFSRVNUX01JUE1BUF9ORUFSRVNUID0gOTk4NCxcbiAgICBMSU5FQVJfTUlQTUFQX05FQVJFU1QgPSA5OTg1LFxuICAgIE5FQVJFU1RfTUlQTUFQX0xJTkVBUiA9IDk5ODYsXG4gICAgTElORUFSX01JUE1BUF9MSU5FQVIgPSA5OTg3LFxufVxuXG5leHBvcnQgZW51bSBHbHRmV3JhcE1vZGUge1xuICAgIENMQU1QX1RPX0VER0UgPSAzMzA3MSxcbiAgICBNSVJST1JFRF9SRVBFQVQgPSAzMzY0OCxcbiAgICBSRVBFQVQgPSAxMDQ5NyxcbiAgICBfX0RFRkFVTFQgPSAxMDQ5Nyxcbn1cblxuZXhwb3J0IGVudW0gR2x0ZkFuaW1hdGlvbkNoYW5uZWxUYXJnZXRQYXRoIHtcbiAgICB0cmFuc2xhdGlvbiA9ICd0cmFuc2xhdGlvbicsXG4gICAgcm90YXRpb24gPSAncm90YXRpb24nLFxuICAgIHNjYWxlID0gJ3NjYWxlJyxcbiAgICB3ZWlnaHRzID0gJ3dlaWdodHMnLFxufVxuXG5leHBvcnQgZW51bSBHbFRmQW5pbWF0aW9uSW50ZXJwb2xhdGlvbiB7XG4gICAgU1RFUCA9ICdTVEVQJyxcbiAgICBMSU5FQVIgPSAnTElORUFSJyxcbiAgICBDVUJJQ19TUExJTkUgPSAnQ1VCSUNTUExJTkUnLFxufVxuIl19