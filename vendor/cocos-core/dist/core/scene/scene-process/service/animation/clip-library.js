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
exports.queryNodeAnimationData = queryNodeAnimationData;
exports.queryAnimationClipsInfo = queryAnimationClipsInfo;
exports.resolveAnimationClip = resolveAnimationClip;
exports.decodeClipsMenu = decodeClipsMenu;
exports.uniqAnimationClips = uniqAnimationClips;
exports.visitAnimationClipsInController = visitAnimationClipsInController;
exports.rebindAnimationComponentClip = rebindAnimationComponentClip;
exports.loadAnimationClip = loadAnimationClip;
const cc_1 = require("cc");
const utils_1 = require("./utils");
const scene_node_1 = require("./scene-node");
async function queryNodeAnimationData(node, preferredClipUuid, options = {}) {
    const animComp = (0, scene_node_1.queryAnimationComponent)(node);
    if (!animComp) {
        throw new Error(`Animation component not found on node: ${(0, scene_node_1.getNodePath)(node)}`);
    }
    let clips = [];
    let defaultClip = null;
    if (animComp instanceof cc_1.Animation) {
        clips = (animComp.clips || []).filter((clip) => Boolean(clip?.name));
        defaultClip = animComp.defaultClip || clips[0] || null;
        if (defaultClip?.name) {
            clips.push(defaultClip);
        }
    }
    else {
        clips = (await visitAnimationClipsInController(animComp))
            .filter((clip) => Boolean(clip?.name));
        defaultClip = clips[0] || null;
    }
    clips = uniqAnimationClips(clips);
    if (!defaultClip?.name) {
        defaultClip = clips[0] || null;
    }
    if (options.recoverClipBinding && (clips.length === 0 || !defaultClip) && preferredClipUuid && animComp instanceof cc_1.Animation) {
        const recoveredClip = await loadAnimationClip(preferredClipUuid);
        if (recoveredClip?.name) {
            rebindAnimationComponentClip(animComp, recoveredClip);
            clips = uniqAnimationClips((animComp.clips || []).filter((clip) => Boolean(clip?.name)));
            defaultClip = animComp.defaultClip?.name ? animComp.defaultClip : clips[0] || null;
        }
    }
    if (clips.length === 0 || !defaultClip) {
        if (options.allowEmpty) {
            return { node, animComp, clips, defaultClip };
        }
        throw new Error(`Animation clips not found on node: ${(0, scene_node_1.getNodePath)(node)}`);
    }
    return { node, animComp, clips, defaultClip };
}
async function queryAnimationClipsInfo(rootNode) {
    const animData = await queryNodeAnimationData(rootNode, undefined, { allowEmpty: true });
    return {
        rootUuid: rootNode.uuid,
        rootPath: (0, scene_node_1.getNodePath)(rootNode),
        clipsMenu: decodeClipsMenu(animData.clips),
        defaultClip: (0, utils_1.clipUuid)(animData.defaultClip),
    };
}
function resolveAnimationClip(animData, uuid) {
    const targetUuid = uuid || (0, utils_1.clipUuid)(animData.defaultClip);
    const clip = animData.clips.find((item) => (0, utils_1.clipUuid)(item) === targetUuid);
    if (!clip) {
        throw new Error(`Animation clip not found: ${targetUuid}`);
    }
    return clip;
}
function decodeClipsMenu(clips) {
    return clips.map((clip) => ({
        uuid: (0, utils_1.clipUuid)(clip),
        name: clip.name,
    }));
}
function uniqAnimationClips(clips) {
    const seen = new Set();
    const result = [];
    for (const clip of clips) {
        const uuid = (0, utils_1.clipUuid)(clip);
        if (!uuid || seen.has(uuid)) {
            continue;
        }
        seen.add(uuid);
        result.push(clip);
    }
    return result;
}
async function visitAnimationClipsInController(controller) {
    const system = globalThis.System;
    if (system?.import) {
        const mod = await system.import('cc/editor/new-gen-anim');
        if (typeof mod?.visitAnimationClipsInController === 'function') {
            return Array.from(mod.visitAnimationClipsInController(controller));
        }
    }
    const mod = await Promise.resolve().then(() => __importStar(require('cc/editor/new-gen-anim')));
    if (typeof mod.visitAnimationClipsInController !== 'function') {
        throw new Error('visitAnimationClipsInController is not available.');
    }
    return Array.from(mod.visitAnimationClipsInController(controller));
}
function rebindAnimationComponentClip(animComp, clip) {
    const uuid = (0, utils_1.clipUuid)(clip);
    const currentDefaultUuid = animComp.defaultClip ? (0, utils_1.clipUuid)(animComp.defaultClip) : '';
    let found = false;
    const clips = [];
    ensureAnimationClipRuntimeArrays(clip);
    for (const item of animComp.clips || []) {
        if (!item) {
            continue;
        }
        if ((0, utils_1.clipUuid)(item) === uuid) {
            found = true;
            clips.push(clip);
            continue;
        }
        if (!item.name) {
            continue;
        }
        ensureAnimationClipRuntimeArrays(item);
        clips.push(item);
    }
    if (!found) {
        clips.push(clip);
    }
    animComp.clips = uniqAnimationClips(clips);
    if (!currentDefaultUuid || currentDefaultUuid === uuid) {
        animComp.defaultClip = clip;
    }
}
function ensureAnimationClipRuntimeArrays(clip) {
    const clipAny = clip;
    ensureArrayProperty(clipAny, '_tracks');
    if (!Array.isArray(clipAny._events)) {
        clipAny.events = [];
        if (!Array.isArray(clipAny._events)) {
            clipAny._events = [];
        }
    }
    ensureArrayProperty(clipAny, '_embeddedPlayers');
    ensureArrayProperty(clipAny, '_auxiliaryCurveEntries');
}
function ensureArrayProperty(target, key) {
    if (!Array.isArray(target[key])) {
        target[key] = [];
    }
}
async function loadAnimationClip(uuid) {
    const cached = cc_1.assetManager.assets.get(uuid);
    if (cached instanceof cc_1.AnimationClip) {
        return cached;
    }
    return await new Promise((resolve, reject) => {
        cc_1.assetManager.loadAny(uuid, (error, asset) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(asset instanceof cc_1.AnimationClip ? asset : null);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcC1saWJyYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2FuaW1hdGlvbi9jbGlwLWxpYnJhcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSx3REF3Q0M7QUFFRCwwREFRQztBQUVELG9EQU9DO0FBRUQsMENBS0M7QUFFRCxnREFZQztBQUVELDBFQWNDO0FBRUQsb0VBNEJDO0FBcUJELDhDQWVDO0FBakxELDJCQU1ZO0FBTVosbUNBQW1DO0FBQ25DLDZDQUFvRTtBQUU3RCxLQUFLLFVBQVUsc0JBQXNCLENBQUMsSUFBVSxFQUFFLGlCQUEwQixFQUFFLFVBQWtFLEVBQUU7SUFDckosTUFBTSxRQUFRLEdBQUcsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDWixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxJQUFBLHdCQUFXLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFFRCxJQUFJLEtBQUssR0FBb0IsRUFBRSxDQUFDO0lBQ2hDLElBQUksV0FBVyxHQUF5QixJQUFJLENBQUM7SUFDN0MsSUFBSSxRQUFRLFlBQVksY0FBUyxFQUFFLENBQUM7UUFDaEMsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQXlCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUYsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUN2RCxJQUFJLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FB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RCxTQUFTLG1CQUFtQixDQUFDLE1BQStCLEVBQUUsR0FBVztJQUNyRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUM7QUFFTSxLQUFLLFVBQVUsaUJBQWlCLENBQUMsSUFBWTtJQUNoRCxNQUFNLE1BQU0sR0FBRyxpQkFBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsSUFBSSxNQUFNLFlBQVksa0JBQWEsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxPQUFPLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDekMsaUJBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQW9CLEVBQUUsRUFBRTtZQUN6RCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNSLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDZCxPQUFPO1lBQ1gsQ0FBQztZQUNELE9BQU8sQ0FBQyxLQUFLLFlBQVksa0JBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQW5pbWF0aW9uLFxuICAgIEFuaW1hdGlvbkNsaXAsXG4gICAgTm9kZSxcbiAgICBhbmltYXRpb24sXG4gICAgYXNzZXRNYW5hZ2VyIGFzIGNjQXNzZXRNYW5hZ2VyLFxufSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7XG4gICAgSUFuaW1hdGlvbkNsaXBNZW51SXRlbSxcbiAgICBJQW5pbWF0aW9uQ2xpcHNJbmZvLFxufSBmcm9tICcuLi8uLi8uLi9jb21tb24nO1xuaW1wb3J0IHR5cGUgeyBJQW5pbWF0aW9uRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgY2xpcFV1aWQgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGdldE5vZGVQYXRoLCBxdWVyeUFuaW1hdGlvbkNvbXBvbmVudCB9IGZyb20gJy4vc2NlbmUtbm9kZSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeU5vZGVBbmltYXRpb25EYXRhKG5vZGU6IE5vZGUsIHByZWZlcnJlZENsaXBVdWlkPzogc3RyaW5nLCBvcHRpb25zOiB7IGFsbG93RW1wdHk/OiBib29sZWFuOyByZWNvdmVyQ2xpcEJpbmRpbmc/OiBib29sZWFuIH0gPSB7fSk6IFByb21pc2U8SUFuaW1hdGlvbkRhdGE+IHtcbiAgICBjb25zdCBhbmltQ29tcCA9IHF1ZXJ5QW5pbWF0aW9uQ29tcG9uZW50KG5vZGUpO1xuICAgIGlmICghYW5pbUNvbXApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBbmltYXRpb24gY29tcG9uZW50IG5vdCBmb3VuZCBvbiBub2RlOiAke2dldE5vZGVQYXRoKG5vZGUpfWApO1xuICAgIH1cblxuICAgIGxldCBjbGlwczogQW5pbWF0aW9uQ2xpcFtdID0gW107XG4gICAgbGV0IGRlZmF1bHRDbGlwOiBBbmltYXRpb25DbGlwIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKGFuaW1Db21wIGluc3RhbmNlb2YgQW5pbWF0aW9uKSB7XG4gICAgICAgIGNsaXBzID0gKGFuaW1Db21wLmNsaXBzIHx8IFtdKS5maWx0ZXIoKGNsaXApOiBjbGlwIGlzIEFuaW1hdGlvbkNsaXAgPT4gQm9vbGVhbihjbGlwPy5uYW1lKSk7XG4gICAgICAgIGRlZmF1bHRDbGlwID0gYW5pbUNvbXAuZGVmYXVsdENsaXAgfHwgY2xpcHNbMF0gfHwgbnVsbDtcbiAgICAgICAgaWYgKGRlZmF1bHRDbGlwPy5uYW1lKSB7XG4gICAgICAgICAgICBjbGlwcy5wdXNoKGRlZmF1bHRDbGlwKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNsaXBzID0gKGF3YWl0IHZpc2l0QW5pbWF0aW9uQ2xpcHNJbkNvbnRyb2xsZXIoYW5pbUNvbXApKVxuICAgICAgICAgICAgLmZpbHRlcigoY2xpcCk6IGNsaXAgaXMgQW5pbWF0aW9uQ2xpcCA9PiBCb29sZWFuKGNsaXA/Lm5hbWUpKTtcbiAgICAgICAgZGVmYXVsdENsaXAgPSBjbGlwc1swXSB8fCBudWxsO1xuICAgIH1cblxuICAgIGNsaXBzID0gdW5pcUFuaW1hdGlvbkNsaXBzKGNsaXBzKTtcbiAgICBpZiAoIWRlZmF1bHRDbGlwPy5uYW1lKSB7XG4gICAgICAgIGRlZmF1bHRDbGlwID0gY2xpcHNbMF0gfHwgbnVsbDtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucmVjb3ZlckNsaXBCaW5kaW5nICYmIChjbGlwcy5sZW5ndGggPT09IDAgfHwgIWRlZmF1bHRDbGlwKSAmJiBwcmVmZXJyZWRDbGlwVXVpZCAmJiBhbmltQ29tcCBpbnN0YW5jZW9mIEFuaW1hdGlvbikge1xuICAgICAgICBjb25zdCByZWNvdmVyZWRDbGlwID0gYXdhaXQgbG9hZEFuaW1hdGlvbkNsaXAocHJlZmVycmVkQ2xpcFV1aWQpO1xuICAgICAgICBpZiAocmVjb3ZlcmVkQ2xpcD8ubmFtZSkge1xuICAgICAgICAgICAgcmViaW5kQW5pbWF0aW9uQ29tcG9uZW50Q2xpcChhbmltQ29tcCwgcmVjb3ZlcmVkQ2xpcCk7XG4gICAgICAgICAgICBjbGlwcyA9IHVuaXFBbmltYXRpb25DbGlwcygoYW5pbUNvbXAuY2xpcHMgfHwgW10pLmZpbHRlcigoY2xpcCk6IGNsaXAgaXMgQW5pbWF0aW9uQ2xpcCA9PiBCb29sZWFuKGNsaXA/Lm5hbWUpKSk7XG4gICAgICAgICAgICBkZWZhdWx0Q2xpcCA9IGFuaW1Db21wLmRlZmF1bHRDbGlwPy5uYW1lID8gYW5pbUNvbXAuZGVmYXVsdENsaXAgOiBjbGlwc1swXSB8fCBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjbGlwcy5sZW5ndGggPT09IDAgfHwgIWRlZmF1bHRDbGlwKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmFsbG93RW1wdHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IG5vZGUsIGFuaW1Db21wLCBjbGlwcywgZGVmYXVsdENsaXAgfTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFuaW1hdGlvbiBjbGlwcyBub3QgZm91bmQgb24gbm9kZTogJHtnZXROb2RlUGF0aChub2RlKX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBub2RlLCBhbmltQ29tcCwgY2xpcHMsIGRlZmF1bHRDbGlwIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFuaW1hdGlvbkNsaXBzSW5mbyhyb290Tm9kZTogTm9kZSk6IFByb21pc2U8SUFuaW1hdGlvbkNsaXBzSW5mbz4ge1xuICAgIGNvbnN0IGFuaW1EYXRhID0gYXdhaXQgcXVlcnlOb2RlQW5pbWF0aW9uRGF0YShyb290Tm9kZSwgdW5kZWZpbmVkLCB7IGFsbG93RW1wdHk6IHRydWUgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm9vdFV1aWQ6IHJvb3ROb2RlLnV1aWQsXG4gICAgICAgIHJvb3RQYXRoOiBnZXROb2RlUGF0aChyb290Tm9kZSksXG4gICAgICAgIGNsaXBzTWVudTogZGVjb2RlQ2xpcHNNZW51KGFuaW1EYXRhLmNsaXBzKSxcbiAgICAgICAgZGVmYXVsdENsaXA6IGNsaXBVdWlkKGFuaW1EYXRhLmRlZmF1bHRDbGlwKSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUFuaW1hdGlvbkNsaXAoYW5pbURhdGE6IElBbmltYXRpb25EYXRhLCB1dWlkPzogc3RyaW5nKTogQW5pbWF0aW9uQ2xpcCB7XG4gICAgY29uc3QgdGFyZ2V0VXVpZCA9IHV1aWQgfHwgY2xpcFV1aWQoYW5pbURhdGEuZGVmYXVsdENsaXApO1xuICAgIGNvbnN0IGNsaXAgPSBhbmltRGF0YS5jbGlwcy5maW5kKChpdGVtKSA9PiBjbGlwVXVpZChpdGVtKSA9PT0gdGFyZ2V0VXVpZCk7XG4gICAgaWYgKCFjbGlwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQW5pbWF0aW9uIGNsaXAgbm90IGZvdW5kOiAke3RhcmdldFV1aWR9YCk7XG4gICAgfVxuICAgIHJldHVybiBjbGlwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQ2xpcHNNZW51KGNsaXBzOiBBbmltYXRpb25DbGlwW10pOiBJQW5pbWF0aW9uQ2xpcE1lbnVJdGVtW10ge1xuICAgIHJldHVybiBjbGlwcy5tYXAoKGNsaXApID0+ICh7XG4gICAgICAgIHV1aWQ6IGNsaXBVdWlkKGNsaXApLFxuICAgICAgICBuYW1lOiBjbGlwLm5hbWUsXG4gICAgfSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pcUFuaW1hdGlvbkNsaXBzKGNsaXBzOiBBbmltYXRpb25DbGlwW10pOiBBbmltYXRpb25DbGlwW10ge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCByZXN1bHQ6IEFuaW1hdGlvbkNsaXBbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2xpcCBvZiBjbGlwcykge1xuICAgICAgICBjb25zdCB1dWlkID0gY2xpcFV1aWQoY2xpcCk7XG4gICAgICAgIGlmICghdXVpZCB8fCBzZWVuLmhhcyh1dWlkKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc2Vlbi5hZGQodXVpZCk7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNsaXApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmlzaXRBbmltYXRpb25DbGlwc0luQ29udHJvbGxlcihjb250cm9sbGVyOiBhbmltYXRpb24uQW5pbWF0aW9uQ29udHJvbGxlcik6IFByb21pc2U8QW5pbWF0aW9uQ2xpcFtdPiB7XG4gICAgY29uc3Qgc3lzdGVtID0gKGdsb2JhbFRoaXMgYXMgYW55KS5TeXN0ZW07XG4gICAgaWYgKHN5c3RlbT8uaW1wb3J0KSB7XG4gICAgICAgIGNvbnN0IG1vZCA9IGF3YWl0IHN5c3RlbS5pbXBvcnQoJ2NjL2VkaXRvci9uZXctZ2VuLWFuaW0nKTtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2Q/LnZpc2l0QW5pbWF0aW9uQ2xpcHNJbkNvbnRyb2xsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKG1vZC52aXNpdEFuaW1hdGlvbkNsaXBzSW5Db250cm9sbGVyKGNvbnRyb2xsZXIpIGFzIEl0ZXJhYmxlPEFuaW1hdGlvbkNsaXA+KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGltcG9ydCgnY2MvZWRpdG9yL25ldy1nZW4tYW5pbScpO1xuICAgIGlmICh0eXBlb2YgbW9kLnZpc2l0QW5pbWF0aW9uQ2xpcHNJbkNvbnRyb2xsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd2aXNpdEFuaW1hdGlvbkNsaXBzSW5Db250cm9sbGVyIGlzIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKG1vZC52aXNpdEFuaW1hdGlvbkNsaXBzSW5Db250cm9sbGVyKGNvbnRyb2xsZXIpIGFzIEl0ZXJhYmxlPEFuaW1hdGlvbkNsaXA+KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYmluZEFuaW1hdGlvbkNvbXBvbmVudENsaXAoYW5pbUNvbXA6IEFuaW1hdGlvbiwgY2xpcDogQW5pbWF0aW9uQ2xpcCk6IHZvaWQge1xuICAgIGNvbnN0IHV1aWQgPSBjbGlwVXVpZChjbGlwKTtcbiAgICBjb25zdCBjdXJyZW50RGVmYXVsdFV1aWQgPSBhbmltQ29tcC5kZWZhdWx0Q2xpcCA/IGNsaXBVdWlkKGFuaW1Db21wLmRlZmF1bHRDbGlwKSA6ICcnO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGNvbnN0IGNsaXBzOiBBbmltYXRpb25DbGlwW10gPSBbXTtcbiAgICBlbnN1cmVBbmltYXRpb25DbGlwUnVudGltZUFycmF5cyhjbGlwKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYW5pbUNvbXAuY2xpcHMgfHwgW10pIHtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2xpcFV1aWQoaXRlbSkgPT09IHV1aWQpIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsaXBzLnB1c2goY2xpcCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZW5zdXJlQW5pbWF0aW9uQ2xpcFJ1bnRpbWVBcnJheXMoaXRlbSk7XG4gICAgICAgIGNsaXBzLnB1c2goaXRlbSk7XG4gICAgfVxuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgY2xpcHMucHVzaChjbGlwKTtcbiAgICB9XG4gICAgYW5pbUNvbXAuY2xpcHMgPSB1bmlxQW5pbWF0aW9uQ2xpcHMoY2xpcHMpO1xuICAgIGlmICghY3VycmVudERlZmF1bHRVdWlkIHx8IGN1cnJlbnREZWZhdWx0VXVpZCA9PT0gdXVpZCkge1xuICAgICAgICBhbmltQ29tcC5kZWZhdWx0Q2xpcCA9IGNsaXA7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBlbnN1cmVBbmltYXRpb25DbGlwUnVudGltZUFycmF5cyhjbGlwOiBBbmltYXRpb25DbGlwKTogdm9pZCB7XG4gICAgY29uc3QgY2xpcEFueSA9IGNsaXAgYXMgYW55O1xuICAgIGVuc3VyZUFycmF5UHJvcGVydHkoY2xpcEFueSwgJ190cmFja3MnKTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2xpcEFueS5fZXZlbnRzKSkge1xuICAgICAgICBjbGlwQW55LmV2ZW50cyA9IFtdO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2xpcEFueS5fZXZlbnRzKSkge1xuICAgICAgICAgICAgY2xpcEFueS5fZXZlbnRzID0gW107XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW5zdXJlQXJyYXlQcm9wZXJ0eShjbGlwQW55LCAnX2VtYmVkZGVkUGxheWVycycpO1xuICAgIGVuc3VyZUFycmF5UHJvcGVydHkoY2xpcEFueSwgJ19hdXhpbGlhcnlDdXJ2ZUVudHJpZXMnKTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlQXJyYXlQcm9wZXJ0eSh0YXJnZXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXJnZXRba2V5XSkpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBbXTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQW5pbWF0aW9uQ2xpcCh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPEFuaW1hdGlvbkNsaXAgfCBudWxsPiB7XG4gICAgY29uc3QgY2FjaGVkID0gY2NBc3NldE1hbmFnZXIuYXNzZXRzLmdldCh1dWlkKTtcbiAgICBpZiAoY2FjaGVkIGluc3RhbmNlb2YgQW5pbWF0aW9uQ2xpcCkge1xuICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNjQXNzZXRNYW5hZ2VyLmxvYWRBbnkodXVpZCwgKGVycm9yLCBhc3NldDogQW5pbWF0aW9uQ2xpcCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKGFzc2V0IGluc3RhbmNlb2YgQW5pbWF0aW9uQ2xpcCA/IGFzc2V0IDogbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuIl19