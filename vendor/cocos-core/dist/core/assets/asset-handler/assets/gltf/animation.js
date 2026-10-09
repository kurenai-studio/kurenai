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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfAnimationHandler = void 0;
const cc = __importStar(require("cc"));
const embedded_player_1 = require("cc/editor/embedded-player");
const exotic_animation_1 = require("cc/editor/exotic-animation");
const url_1 = require("url");
const serialize_library_1 = require("../utils/serialize-library");
const split_animation_1 = require("../utils/split-animation");
const load_asset_sync_1 = require("../utils/load-asset-sync");
const original_animation_1 = require("./original-animation");
const utils_1 = require("../../utils");
const assert_1 = __importDefault(require("assert"));
exports.GltfAnimationHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf-animation',
    // 引擎内对应的类型
    assetType: 'cc.AnimationClip',
    /**
     * 允许这种类型的资源进行实例化
     */
    instantiation: '.animation',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.18',
        versionCode: 3,
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            const userData = asset.userData;
            userData.events ??= [];
            const originalAnimationPath = asset.parent.getFilePath((0, original_animation_1.getOriginalAnimationLibraryPath)(userData.gltfIndex));
            let originalAnimationURL = (0, url_1.pathToFileURL)(originalAnimationPath).href;
            if (originalAnimationURL) {
                originalAnimationURL = originalAnimationURL.replace('.bin', '.cconb');
            }
            const originalAnimationClip = await new Promise((resolve, reject) => {
                cc.assetManager.loadAny({ url: originalAnimationURL }, { preset: 'remote' }, null, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            let span = userData.span;
            if (span && span.from === 0 && span.to === asset.parent.userData.duration) {
                span = undefined;
            }
            const animationClip = span ? (0, split_animation_1.splitAnimation)(originalAnimationClip, span.from, span.to) : originalAnimationClip;
            animationClip.name = asset._name;
            if (animationClip.name.endsWith('.animation')) {
                animationClip.name = animationClip.name.substr(0, animationClip.name.length - '.animation'.length);
            }
            animationClip.events = userData.events.map((event) => ({
                frame: event.frame,
                func: event.func,
                params: event.params.slice(),
            }));
            animationClip.wrapMode = userData.wrapMode ?? cc.AnimationClip.WrapMode.Loop;
            if (userData.speed !== undefined) {
                animationClip.speed = userData.speed;
            }
            if (userData.sample !== undefined) {
                animationClip.sample = userData.sample;
            }
            if (typeof userData.editorExtras !== 'undefined') {
                animationClip[cc.editorExtrasTag] = JSON.parse(JSON.stringify(userData.editorExtras));
            }
            if (userData.embeddedPlayers) {
                const { embeddedPlayers: embeddedPlayerInfos } = userData;
                for (const { begin, end, reconciledSpeed, editorExtras, playable: playableInfo } of embeddedPlayerInfos) {
                    const subregion = new embedded_player_1.EmbeddedPlayer();
                    if (typeof editorExtras !== 'undefined') {
                        subregion[cc.editorExtrasTag] = JSON.parse(JSON.stringify(editorExtras));
                    }
                    subregion.begin = begin;
                    subregion.end = end;
                    subregion.reconciledSpeed = reconciledSpeed;
                    if (playableInfo.type === 'animation-clip') {
                        const playable = new embedded_player_1.EmbeddedAnimationClipPlayable();
                        playable.path = playableInfo.path;
                        if (playableInfo.clip) {
                            playable.clip = (0, load_asset_sync_1.loadAssetSync)(playableInfo.clip, cc.AnimationClip) ?? null;
                        }
                        subregion.playable = playable;
                    }
                    else if (playableInfo.type === 'particle-system') {
                        const playable = new embedded_player_1.EmbeddedParticleSystemPlayable();
                        playable.path = playableInfo.path;
                        subregion.playable = playable;
                    }
                    animationClip[embedded_player_1.addEmbeddedPlayerTag](subregion);
                }
            }
            const additiveSettings = animationClip[exotic_animation_1.additiveSettingsTag];
            additiveSettings.enabled = false;
            additiveSettings.refClip = null;
            const customDependencies = [];
            if (typeof userData.additive !== 'undefined') {
                const additiveSettings = animationClip[exotic_animation_1.additiveSettingsTag];
                if (userData.additive.enabled) {
                    additiveSettings.enabled = true;
                    if (userData.additive.refClip) {
                        customDependencies.push(userData.additive.refClip);
                        additiveSettings.refClip = (0, load_asset_sync_1.loadAssetSync)(userData.additive.refClip, cc.AnimationClip) ?? null;
                    }
                }
            }
            if (typeof userData.auxiliaryCurves !== 'undefined') {
                for (const [name, { curve: curveSerialized }] of Object.entries(userData.auxiliaryCurves)) {
                    const curveDeserialized = cc.deserialize(curveSerialized, undefined, undefined);
                    (0, assert_1.default)(curveDeserialized instanceof cc.RealCurve);
                    const auxiliaryCurve = animationClip.addAuxiliaryCurve_experimental(name);
                    auxiliaryCurve.preExtrapolation = curveDeserialized.preExtrapolation;
                    auxiliaryCurve.postExtrapolation = curveDeserialized.postExtrapolation;
                    auxiliaryCurve.assignSorted(curveDeserialized.keyframes());
                }
            }
            // Compute hash
            void animationClip.hash;
            const { extension, data } = (0, serialize_library_1.serializeForLibrary)(animationClip);
            await asset.saveToLibrary(extension, data);
            const depends = (0, utils_1.getDependUUIDList)(data);
            asset.setData('depends', Array.from(new Set([...depends, ...customDependencies])));
            return true;
        },
    },
};
exports.default = exports.GltfAnimationHandler;
