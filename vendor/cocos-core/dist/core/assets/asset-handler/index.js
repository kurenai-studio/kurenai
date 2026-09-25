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
exports.compileEffect = compileEffect;
exports.startAutoGenEffectBin = startAutoGenEffectBin;
exports.getEffectBinPath = getEffectBinPath;
async function compileEffect(force) {
    const { afterImport, autoGenEffectBinInfo } = await Promise.resolve().then(() => __importStar(require('./assets/effect')));
    try {
        await afterImport(force);
        const { existsSync, statSync } = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        const binPath = autoGenEffectBinInfo.effectBinPath;
        if (existsSync(binPath)) {
            const size = statSync(binPath).size;
            console.log(`[compileEffect] effect.bin generated: ${binPath} (${size} bytes)`);
        }
        else {
            console.warn(`[compileEffect] effect.bin NOT generated at: ${binPath}`);
        }
    }
    catch (error) {
        console.error('[compileEffect] Failed:', error);
    }
}
async function startAutoGenEffectBin() {
    const { autoGenEffectBinInfo } = await Promise.resolve().then(() => __importStar(require('./assets/effect')));
    autoGenEffectBinInfo.autoGenEffectBin = true;
}
async function getEffectBinPath() {
    const { autoGenEffectBinInfo, afterImport } = await Promise.resolve().then(() => __importStar(require('./assets/effect')));
    if (!autoGenEffectBinInfo.effectBinPath) {
        await afterImport(true);
    }
    return autoGenEffectBinInfo.effectBinPath;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQWVDO0FBRUQsc0RBR0M7QUFFRCw0Q0FNQztBQTVCTSxLQUFLLFVBQVUsYUFBYSxDQUFDLEtBQWU7SUFDL0MsTUFBTSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGlCQUFpQixHQUFDLENBQUM7SUFDOUUsSUFBSSxDQUFDO1FBQ0QsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsR0FBRyx3REFBYSxVQUFVLEdBQUMsQ0FBQztRQUMxRCxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxhQUFhLENBQUM7UUFDbkQsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN0QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLE9BQU8sS0FBSyxJQUFJLFNBQVMsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyxnREFBZ0QsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BELENBQUM7QUFDTCxDQUFDO0FBRU0sS0FBSyxVQUFVLHFCQUFxQjtJQUN2QyxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyx3REFBYSxpQkFBaUIsR0FBQyxDQUFDO0lBQ2pFLG9CQUFvQixDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUNqRCxDQUFDO0FBRU0sS0FBSyxVQUFVLGdCQUFnQjtJQUNsQyxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLEdBQUcsd0RBQWEsaUJBQWlCLEdBQUMsQ0FBQztJQUM5RSxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdEMsTUFBTSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELE9BQU8sb0JBQW9CLENBQUMsYUFBYSxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcGlsZUVmZmVjdChmb3JjZT86IGJvb2xlYW4pIHtcbiAgICBjb25zdCB7IGFmdGVySW1wb3J0LCBhdXRvR2VuRWZmZWN0QmluSW5mbyB9ID0gYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9lZmZlY3QnKTtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBhZnRlckltcG9ydChmb3JjZSk7XG4gICAgICAgIGNvbnN0IHsgZXhpc3RzU3luYywgc3RhdFN5bmMgfSA9IGF3YWl0IGltcG9ydCgnZnMtZXh0cmEnKTtcbiAgICAgICAgY29uc3QgYmluUGF0aCA9IGF1dG9HZW5FZmZlY3RCaW5JbmZvLmVmZmVjdEJpblBhdGg7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGJpblBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gc3RhdFN5bmMoYmluUGF0aCkuc2l6ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29tcGlsZUVmZmVjdF0gZWZmZWN0LmJpbiBnZW5lcmF0ZWQ6ICR7YmluUGF0aH0gKCR7c2l6ZX0gYnl0ZXMpYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjb21waWxlRWZmZWN0XSBlZmZlY3QuYmluIE5PVCBnZW5lcmF0ZWQgYXQ6ICR7YmluUGF0aH1gKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjb21waWxlRWZmZWN0XSBGYWlsZWQ6JywgZXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0QXV0b0dlbkVmZmVjdEJpbigpIHtcbiAgICBjb25zdCB7IGF1dG9HZW5FZmZlY3RCaW5JbmZvIH0gPSBhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2VmZmVjdCcpO1xuICAgIGF1dG9HZW5FZmZlY3RCaW5JbmZvLmF1dG9HZW5FZmZlY3RCaW4gPSB0cnVlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RWZmZWN0QmluUGF0aCgpIHtcbiAgICBjb25zdCB7IGF1dG9HZW5FZmZlY3RCaW5JbmZvLCBhZnRlckltcG9ydCB9ID0gYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9lZmZlY3QnKTtcbiAgICBpZiAoIWF1dG9HZW5FZmZlY3RCaW5JbmZvLmVmZmVjdEJpblBhdGgpIHtcbiAgICAgICAgYXdhaXQgYWZ0ZXJJbXBvcnQodHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiBhdXRvR2VuRWZmZWN0QmluSW5mby5lZmZlY3RCaW5QYXRoO1xufSJdfQ==