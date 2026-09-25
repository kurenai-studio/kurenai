"use strict";
/**
 * i18n lib 入口
 *
 * 供外部宿主 (如 PinK) 在启动时设置当前语言。
 * 设置后,所有走 i18n.transI18nName / i18n.t 的输出会以目标语言返回。
 * 语言码只支持 'zh' / 'en';宿主侧需自行把 zh-cn 等 BCP-47 变体归一化后传入。
 */
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
exports.setLanguage = setLanguage;
exports.getLanguage = getLanguage;
async function setLanguage(language) {
    const { default: i18n } = await Promise.resolve().then(() => __importStar(require('../../core/base/i18n')));
    await i18n.setLanguage(language);
}
/** 获取当前语言,便于宿主诊断 */
async function getLanguage() {
    const { default: i18n } = await Promise.resolve().then(() => __importStar(require('../../core/base/i18n')));
    return i18n._lang;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaTE4bi9pMThuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsa0NBR0M7QUFHRCxrQ0FHQztBQVRNLEtBQUssVUFBVSxXQUFXLENBQUMsUUFBZ0I7SUFDOUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyx3REFBYSxzQkFBc0IsR0FBQyxDQUFDO0lBQy9ELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRUQsb0JBQW9CO0FBQ2IsS0FBSyxVQUFVLFdBQVc7SUFDN0IsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyx3REFBYSxzQkFBc0IsR0FBQyxDQUFDO0lBQy9ELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBpMThuIGxpYiDlhaXlj6NcbiAqXG4gKiDkvpvlpJbpg6jlrr/kuLsgKOWmgiBQaW5LKSDlnKjlkK/liqjml7borr7nva7lvZPliY3or63oqIDjgIJcbiAqIOiuvue9ruWQjizmiYDmnInotbAgaTE4bi50cmFuc0kxOG5OYW1lIC8gaTE4bi50IOeahOi+k+WHuuS8muS7peebruagh+ivreiogOi/lOWbnuOAglxuICog6K+t6KiA56CB5Y+q5pSv5oyBICd6aCcgLyAnZW4nO+Wuv+S4u+S+p+mcgOiHquihjOaKiiB6aC1jbiDnrYkgQkNQLTQ3IOWPmOS9k+W9kuS4gOWMluWQjuS8oOWFpeOAglxuICovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRMYW5ndWFnZShsYW5ndWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBkZWZhdWx0OiBpMThuIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYmFzZS9pMThuJyk7XG4gICAgYXdhaXQgaTE4bi5zZXRMYW5ndWFnZShsYW5ndWFnZSk7XG59XG5cbi8qKiDojrflj5blvZPliY3or63oqIAs5L6/5LqO5a6/5Li76K+K5patICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IGRlZmF1bHQ6IGkxOG4gfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9iYXNlL2kxOG4nKTtcbiAgICByZXR1cm4gaTE4bi5fbGFuZztcbn1cbiJdfQ==