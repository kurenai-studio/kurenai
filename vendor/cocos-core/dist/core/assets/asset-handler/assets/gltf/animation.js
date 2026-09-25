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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2dsdGYvYW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUF5QjtBQUN6QiwrREFLbUM7QUFDbkMsaUVBQWlFO0FBQ2pFLDZCQUFvQztBQUNwQyxrRUFBaUU7QUFDakUsOERBQTBEO0FBQzFELDhEQUF5RDtBQUN6RCw2REFBdUU7QUFFdkUsdUNBQWdEO0FBQ2hELG9EQUE0QjtBQUlmLFFBQUEsb0JBQW9CLEdBQWlCO0lBQzlDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsZ0JBQWdCO0lBRXRCLFdBQVc7SUFDWCxTQUFTLEVBQUUsa0JBQWtCO0lBRTdCOztPQUVHO0lBQ0gsYUFBYSxFQUFFLFlBQVk7SUFFM0IsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLFdBQVcsRUFBRSxDQUFDO1FBQ2Q7Ozs7Ozs7V0FPRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFzQyxDQUFDO1lBRTlELFFBQVEsQ0FBQyxNQUFNLEtBQUssRUFBRSxDQUFDO1lBRXZCLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxvREFBK0IsRUFBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM1RyxJQUFJLG9CQUFvQixHQUFHLElBQUEsbUJBQWEsRUFBQyxxQkFBcUIsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNyRSxJQUFJLG9C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QixHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDaEYsSUFBQSxnQkFBTSxFQUFDLGlCQUFpQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMxRSxjQUFjLENBQUMsZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3JFLGNBQWMsQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDdkUsY0FBYyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO1lBQ0wsQ0FBQztZQUVELGVBQWU7WUFDZixLQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFFeEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFBLHVDQUFtQixFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBVyxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxJQUFjLENBQUMsQ0FBQztZQUNsRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5GLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSw0QkFBb0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0ICogYXMgY2MgZnJvbSAnY2MnO1xuaW1wb3J0IHtcbiAgICBhZGRFbWJlZGRlZFBsYXllclRhZyxcbiAgICBFbWJlZGRlZEFuaW1hdGlvbkNsaXBQbGF5YWJsZSxcbiAgICBFbWJlZGRlZFBhcnRpY2xlU3lzdGVtUGxheWFibGUsXG4gICAgRW1iZWRkZWRQbGF5ZXIsXG59IGZyb20gJ2NjL2VkaXRvci9lbWJlZGRlZC1wbGF5ZXInO1xuaW1wb3J0IHsgYWRkaXRpdmVTZXR0aW5nc1RhZyB9IGZyb20gJ2NjL2VkaXRvci9leG90aWMtYW5pbWF0aW9uJztcbmltcG9ydCB7IHBhdGhUb0ZpbGVVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgc2VyaWFsaXplRm9yTGlicmFyeSB9IGZyb20gJy4uL3V0aWxzL3NlcmlhbGl6ZS1saWJyYXJ5JztcbmltcG9ydCB7IHNwbGl0QW5pbWF0aW9uIH0gZnJvbSAnLi4vdXRpbHMvc3BsaXQtYW5pbWF0aW9uJztcbmltcG9ydCB7IGxvYWRBc3NldFN5bmMgfSBmcm9tICcuLi91dGlscy9sb2FkLWFzc2V0LXN5bmMnO1xuaW1wb3J0IHsgZ2V0T3JpZ2luYWxBbmltYXRpb25MaWJyYXJ5UGF0aCB9IGZyb20gJy4vb3JpZ2luYWwtYW5pbWF0aW9uJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEdsdGZBbmltYXRpb25Bc3NldFVzZXJEYXRhIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5cbmV4cG9ydCBjb25zdCBHbHRmQW5pbWF0aW9uSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2dsdGYtYW5pbWF0aW9uJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkFuaW1hdGlvbkNsaXAnLFxuXG4gICAgLyoqXG4gICAgICog5YWB6K646L+Z56eN57G75Z6L55qE6LWE5rqQ6L+b6KGM5a6e5L6L5YyWXG4gICAgICovXG4gICAgaW5zdGFudGlhdGlvbjogJy5hbmltYXRpb24nLFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMTgnLFxuICAgICAgICB2ZXJzaW9uQ29kZTogMyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qEIGJvb2xlYW5cbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZ5LiL5qyh5ZCv5Yqo6L+Y5Lya6YeN5paw5a+85YWlXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBWaXJ0dWFsQXNzZXQpIHtcbiAgICAgICAgICAgIGlmICghYXNzZXQucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIEdsdGZBbmltYXRpb25Bc3NldFVzZXJEYXRhO1xuXG4gICAgICAgICAgICB1c2VyRGF0YS5ldmVudHMgPz89IFtdO1xuXG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbEFuaW1hdGlvblBhdGggPSBhc3NldC5wYXJlbnQuZ2V0RmlsZVBhdGgoZ2V0T3JpZ2luYWxBbmltYXRpb25MaWJyYXJ5UGF0aCh1c2VyRGF0YS5nbHRmSW5kZXgpKTtcbiAgICAgICAgICAgIGxldCBvcmlnaW5hbEFuaW1hdGlvblVSTCA9IHBhdGhUb0ZpbGVVUkwob3JpZ2luYWxBbmltYXRpb25QYXRoKS5ocmVmO1xuICAgICAgICAgICAgaWYgKG9yaWdpbmFsQW5pbWF0aW9uVVJMKSB7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxBbmltYXRpb25VUkwgPSBvcmlnaW5hbEFuaW1hdGlvblVSTC5yZXBsYWNlKCcuYmluJywgJy5jY29uYicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxBbmltYXRpb25DbGlwID0gYXdhaXQgbmV3IFByb21pc2U8Y2MuQW5pbWF0aW9uQ2xpcD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KHsgdXJsOiBvcmlnaW5hbEFuaW1hdGlvblVSTCB9LCB7IHByZXNldDogJ3JlbW90ZScgfSwgbnVsbCwgKGVyciwgZGF0YTogY2MuQW5pbWF0aW9uQ2xpcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgc3BhbiA9IHVzZXJEYXRhLnNwYW47XG4gICAgICAgICAgICBpZiAoc3BhbiAmJiBzcGFuLmZyb20gPT09IDAgJiYgc3Bhbi50byA9PT0gYXNzZXQucGFyZW50LnVzZXJEYXRhLmR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3BhbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uQ2xpcCA9IHNwYW4gPyBzcGxpdEFuaW1hdGlvbihvcmlnaW5hbEFuaW1hdGlvbkNsaXAsIHNwYW4uZnJvbSwgc3Bhbi50bykgOiBvcmlnaW5hbEFuaW1hdGlvbkNsaXA7XG5cbiAgICAgICAgICAgIGFuaW1hdGlvbkNsaXAubmFtZSA9IGFzc2V0Ll9uYW1lO1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkNsaXAubmFtZS5lbmRzV2l0aCgnLmFuaW1hdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ2xpcC5uYW1lID0gYW5pbWF0aW9uQ2xpcC5uYW1lLnN1YnN0cigwLCBhbmltYXRpb25DbGlwLm5hbWUubGVuZ3RoIC0gJy5hbmltYXRpb24nLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFuaW1hdGlvbkNsaXAuZXZlbnRzID0gdXNlckRhdGEuZXZlbnRzLm1hcCgoZXZlbnQpID0+ICh7XG4gICAgICAgICAgICAgICAgZnJhbWU6IGV2ZW50LmZyYW1lLFxuICAgICAgICAgICAgICAgIGZ1bmM6IGV2ZW50LmZ1bmMsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBldmVudC5wYXJhbXMuc2xpY2UoKSxcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgYW5pbWF0aW9uQ2xpcC53cmFwTW9kZSA9IHVzZXJEYXRhLndyYXBNb2RlID8/IGNjLkFuaW1hdGlvbkNsaXAuV3JhcE1vZGUuTG9vcDtcblxuICAgICAgICAgICAgaWYgKHVzZXJEYXRhLnNwZWVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DbGlwLnNwZWVkID0gdXNlckRhdGEuc3BlZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1c2VyRGF0YS5zYW1wbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNsaXAuc2FtcGxlID0gdXNlckRhdGEuc2FtcGxlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHVzZXJEYXRhLmVkaXRvckV4dHJhcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DbGlwW2NjLmVkaXRvckV4dHJhc1RhZ10gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHVzZXJEYXRhLmVkaXRvckV4dHJhcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodXNlckRhdGEuZW1iZWRkZWRQbGF5ZXJzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBlbWJlZGRlZFBsYXllcnM6IGVtYmVkZGVkUGxheWVySW5mb3MgfSA9IHVzZXJEYXRhO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgeyBiZWdpbiwgZW5kLCByZWNvbmNpbGVkU3BlZWQsIGVkaXRvckV4dHJhcywgcGxheWFibGU6IHBsYXlhYmxlSW5mbyB9IG9mIGVtYmVkZGVkUGxheWVySW5mb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VicmVnaW9uID0gbmV3IEVtYmVkZGVkUGxheWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWRpdG9yRXh0cmFzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VicmVnaW9uW2NjLmVkaXRvckV4dHJhc1RhZ10gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGVkaXRvckV4dHJhcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YnJlZ2lvbi5iZWdpbiA9IGJlZ2luO1xuICAgICAgICAgICAgICAgICAgICBzdWJyZWdpb24uZW5kID0gZW5kO1xuICAgICAgICAgICAgICAgICAgICBzdWJyZWdpb24ucmVjb25jaWxlZFNwZWVkID0gcmVjb25jaWxlZFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGxheWFibGVJbmZvLnR5cGUgPT09ICdhbmltYXRpb24tY2xpcCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYXlhYmxlID0gbmV3IEVtYmVkZGVkQW5pbWF0aW9uQ2xpcFBsYXlhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5YWJsZS5wYXRoID0gcGxheWFibGVJbmZvLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxheWFibGVJbmZvLmNsaXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5YWJsZS5jbGlwID0gbG9hZEFzc2V0U3luYyhwbGF5YWJsZUluZm8uY2xpcCwgY2MuQW5pbWF0aW9uQ2xpcCkgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnJlZ2lvbi5wbGF5YWJsZSA9IHBsYXlhYmxlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBsYXlhYmxlSW5mby50eXBlID09PSAncGFydGljbGUtc3lzdGVtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGxheWFibGUgPSBuZXcgRW1iZWRkZWRQYXJ0aWNsZVN5c3RlbVBsYXlhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5YWJsZS5wYXRoID0gcGxheWFibGVJbmZvLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJyZWdpb24ucGxheWFibGUgPSBwbGF5YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DbGlwW2FkZEVtYmVkZGVkUGxheWVyVGFnXShzdWJyZWdpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYWRkaXRpdmVTZXR0aW5ncyA9IGFuaW1hdGlvbkNsaXBbYWRkaXRpdmVTZXR0aW5nc1RhZ107XG4gICAgICAgICAgICBhZGRpdGl2ZVNldHRpbmdzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGFkZGl0aXZlU2V0dGluZ3MucmVmQ2xpcCA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBjdXN0b21EZXBlbmRlbmNpZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHVzZXJEYXRhLmFkZGl0aXZlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFkZGl0aXZlU2V0dGluZ3MgPSBhbmltYXRpb25DbGlwW2FkZGl0aXZlU2V0dGluZ3NUYWddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VyRGF0YS5hZGRpdGl2ZS5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZGl0aXZlU2V0dGluZ3MuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGF0YS5hZGRpdGl2ZS5yZWZDbGlwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21EZXBlbmRlbmNpZXMucHVzaCh1c2VyRGF0YS5hZGRpdGl2ZS5yZWZDbGlwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aXZlU2V0dGluZ3MucmVmQ2xpcCA9IGxvYWRBc3NldFN5bmModXNlckRhdGEuYWRkaXRpdmUucmVmQ2xpcCwgY2MuQW5pbWF0aW9uQ2xpcCkgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB1c2VyRGF0YS5hdXhpbGlhcnlDdXJ2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgeyBjdXJ2ZTogY3VydmVTZXJpYWxpemVkIH1dIG9mIE9iamVjdC5lbnRyaWVzKHVzZXJEYXRhLmF1eGlsaWFyeUN1cnZlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VydmVEZXNlcmlhbGl6ZWQgPSBjYy5kZXNlcmlhbGl6ZShjdXJ2ZVNlcmlhbGl6ZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KGN1cnZlRGVzZXJpYWxpemVkIGluc3RhbmNlb2YgY2MuUmVhbEN1cnZlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV4aWxpYXJ5Q3VydmUgPSBhbmltYXRpb25DbGlwLmFkZEF1eGlsaWFyeUN1cnZlX2V4cGVyaW1lbnRhbChuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYXV4aWxpYXJ5Q3VydmUucHJlRXh0cmFwb2xhdGlvbiA9IGN1cnZlRGVzZXJpYWxpemVkLnByZUV4dHJhcG9sYXRpb247XG4gICAgICAgICAgICAgICAgICAgIGF1eGlsaWFyeUN1cnZlLnBvc3RFeHRyYXBvbGF0aW9uID0gY3VydmVEZXNlcmlhbGl6ZWQucG9zdEV4dHJhcG9sYXRpb247XG4gICAgICAgICAgICAgICAgICAgIGF1eGlsaWFyeUN1cnZlLmFzc2lnblNvcnRlZChjdXJ2ZURlc2VyaWFsaXplZC5rZXlmcmFtZXMoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb21wdXRlIGhhc2hcbiAgICAgICAgICAgIHZvaWQgYW5pbWF0aW9uQ2xpcC5oYXNoO1xuXG4gICAgICAgICAgICBjb25zdCB7IGV4dGVuc2lvbiwgZGF0YSB9ID0gc2VyaWFsaXplRm9yTGlicmFyeShhbmltYXRpb25DbGlwKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoZXh0ZW5zaW9uLCBkYXRhIGFzIGFueSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChkYXRhIGFzIHN0cmluZyk7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5kZXBlbmRzLCAuLi5jdXN0b21EZXBlbmRlbmNpZXNdKSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgR2x0ZkFuaW1hdGlvbkhhbmRsZXI7XG4iXX0=