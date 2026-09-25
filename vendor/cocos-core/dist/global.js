"use strict";
/**
 * 一些全局路径配置记录
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfig = exports.GlobalPaths = void 0;
const path_1 = require("path");
exports.GlobalPaths = {
    staticDir: (0, path_1.join)(__dirname, '../static'),
    workspace: (0, path_1.join)(__dirname, '..'),
    enginePath: (0, path_1.join)(__dirname, '..', 'packages', 'engine'),
};
exports.GlobalConfig = {
    mode: 'hold',
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dsb2JhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILCtCQUE0QjtBQUVmLFFBQUEsV0FBVyxHQUFHO0lBQ3ZCLFNBQVMsRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDO0lBQ3ZDLFNBQVMsRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO0lBQ2hDLFVBQVUsRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUM7Q0FDMUQsQ0FBQztBQVdXLFFBQUEsWUFBWSxHQUFrQjtJQUN2QyxJQUFJLEVBQUUsTUFBTTtDQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOS4gOS6m+WFqOWxgOi3r+W+hOmFjee9ruiusOW9lVxuICovXG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNvbnN0IEdsb2JhbFBhdGhzID0ge1xuICAgIHN0YXRpY0Rpcjogam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMnKSxcbiAgICB3b3Jrc3BhY2U6IGpvaW4oX19kaXJuYW1lLCAnLi4nKSxcbiAgICBlbmdpbmVQYXRoOiBqb2luKF9fZGlybmFtZSwgJy4uJywgJ3BhY2thZ2VzJywgJ2VuZ2luZScpLFxufTtcblxuLyoqXG4gKiBDTEkg55qE5Lu75Yqh5qih5byPXG4gKi9cbnR5cGUgQ0xJVGFza01vZGUgPSAnaG9sZCcgfCAnc2ltcGxlJztcblxuaW50ZXJmYWNlIElHbG9iYWxDb25maWcge1xuICAgIG1vZGU6IENMSVRhc2tNb2RlO1xufVxuXG5leHBvcnQgY29uc3QgR2xvYmFsQ29uZmlnOiBJR2xvYmFsQ29uZmlnID0ge1xuICAgIG1vZGU6ICdob2xkJyxcbn07Il19