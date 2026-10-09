"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildErrorMap = {
    [37 /* BuildExitCode.BUILD_BUSY */]: '其他构建正在运行中，请稍后再试',
    [34 /* BuildExitCode.BUILD_FAILED */]: '构建失败，请参考错误日志排查错误原因',
    [32 /* BuildExitCode.PARAM_ERROR */]: '构建参数错误，请参考错误日志调整构建参数后重试',
    [50 /* BuildExitCode.UNKNOWN_ERROR */]: '未知错误，请联系 cocos 官方',
    [38 /* BuildExitCode.STATIC_COMPILE_ERROR */]: '静态编译检查失败，发现 assets 相关的 TypeScript 错误',
};
exports.default = BuildErrorMap;
