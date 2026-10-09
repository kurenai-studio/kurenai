"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReloadResult = exports.CREATE_TYPES = exports.SCENE_TEMPLATE_TYPE = void 0;
/**
 * 场景模板类型
 */
exports.SCENE_TEMPLATE_TYPE = ['2d', '3d', 'quality'];
/**
 * 创建类型
 */
exports.CREATE_TYPES = ['scene', 'prefab'];
/**
 * 重载结果
 */
var ReloadResult;
(function (ReloadResult) {
    ReloadResult[ReloadResult["SUCCESS"] = 0] = "SUCCESS";
    ReloadResult[ReloadResult["FAILED"] = 1] = "FAILED";
    ReloadResult[ReloadResult["QUEUED"] = 2] = "QUEUED";
    ReloadResult[ReloadResult["NO_EDITOR"] = 3] = "NO_EDITOR";
    ReloadResult[ReloadResult["ASSET_NOT_FOUND"] = 4] = "ASSET_NOT_FOUND";
    ReloadResult[ReloadResult["EDITOR_NOT_FOUND"] = 5] = "EDITOR_NOT_FOUND";
})(ReloadResult || (exports.ReloadResult = ReloadResult = {}));
