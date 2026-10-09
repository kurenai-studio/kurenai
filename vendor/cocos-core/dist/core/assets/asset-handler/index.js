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
