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
exports.createUndoId = createUndoId;
exports.success = success;
exports.failure = failure;
exports.snapshotMapsEqual = snapshotMapsEqual;
exports.isNodeInCurrentScene = isNodeInCurrentScene;
exports.getEditorExtends = getEditorExtends;
exports.getEditorNodeManager = getEditorNodeManager;
exports.getNodePath = getNodePath;
exports.restoreNodeSnapshotDump = restoreNodeSnapshotDump;
exports.restoreNodeLockedFlag = restoreNodeLockedFlag;
exports.restoreComponentSnapshotDump = restoreComponentSnapshotDump;
function createUndoId(prefix) {
    try {
        const randomUUID = require('crypto')?.randomUUID;
        if (typeof randomUUID === 'function') {
            return `${prefix}-${randomUUID()}`;
        }
    }
    catch (_error) {
        // crypto.randomUUID 不可用时，退回到时间戳 id。
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
function success(meta) {
    return { success: true, commandId: meta.id, label: meta.label };
}
function failure(meta, reason) {
    return { success: false, commandId: meta.id, label: meta.label, reason };
}
function snapshotMapsEqual(before, after) {
    if (before.size !== after.size) {
        return false;
    }
    const keys = [...before.keys()].sort();
    for (const key of keys) {
        if (!after.has(key)) {
            return false;
        }
        if (JSON.stringify(before.get(key)) !== JSON.stringify(after.get(key))) {
            return false;
        }
    }
    return true;
}
function isNodeInCurrentScene(node) {
    if (!node?.isValid) {
        return false;
    }
    const scene = cc.director?.getScene?.();
    return !!scene && (node === scene || node.isChildOf(scene));
}
function getEditorExtends() {
    return cc.EditorExtends || globalThis.EditorExtends;
}
function getEditorNodeManager() {
    return getEditorExtends()?.Node;
}
function getNodePath(node) {
    const scene = cc.director?.getScene?.();
    if (node === scene) {
        return '/';
    }
    return getEditorNodeManager()?.getNodePath?.(node) ?? '';
}
/**
 * 从快照 dump 恢复节点属性。
 * - name：通过 updateNodeName 回调恢复；未传入时使用默认 EditorNodeManager，这是 undo 专用逻辑。
 * - 可编辑属性（active/layer/mobility/position/rotation/scale）：交给 dump 层恢复。
 * - locked：通过 objFlags bit 恢复，这是 undo 专用逻辑。
 * - 结构字段（uuid/parent/children/__comps__）：跳过，由 node-structure command 管理。
 */
async function restoreNodeSnapshotDump(node, dump, options = {}) {
    if (!dump) {
        return;
    }
    if (dump.name && dump.name.value !== node.name) {
        const name = dump.name.value;
        if (options.updateNodeName) {
            options.updateNodeName(node.uuid, name);
        }
        else {
            updateNodeName(node, name);
        }
    }
    const { default: dumpUtil } = await Promise.resolve().then(() => __importStar(require('../../dump')));
    await dumpUtil.restoreNodeSnapshotProperties(node, dump);
    if (dump.locked) {
        (options.restoreNodeLocked ?? restoreNodeLockedFlag)(node, !!dump.locked.value);
    }
}
function updateNodeName(node, name) {
    const editorNode = getEditorNodeManager();
    if (typeof editorNode?.updateNodeName === 'function') {
        editorNode.updateNodeName(node.uuid, name);
        return;
    }
    node.name = name;
}
function restoreNodeLockedFlag(node, locked) {
    if (locked) {
        node.objFlags |= cc.Object.Flags.LockedInEditor;
    }
    else {
        node.objFlags &= ~cc.Object.Flags.LockedInEditor;
    }
}
/**
 * 从快照 dump 恢复组件属性。
 * - 用户属性：交给 dump 层恢复，跳过列表由 dump 模块维护。
 * - onRestore 生命周期：属性恢复后调用。
 */
async function restoreComponentSnapshotDump(component, dump) {
    if (!dump?.value) {
        return;
    }
    const { default: dumpUtil } = await Promise.resolve().then(() => __importStar(require('../../dump')));
    await dumpUtil.restoreComponentSnapshotProperties(component, dump);
    component.onRestore?.();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC11dGlscy1zaGFyZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvdW5kby9jb21tYW5kcy9jb21tYW5kLXV0aWxzLXNoYXJlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLG9DQVVDO0FBRUQsMEJBRUM7QUFFRCwwQkFFQztBQUVELDhDQWVDO0FBRUQsb0RBT0M7QUFFRCw0Q0FFQztBQUVELG9EQUVDO0FBRUQsa0NBTUM7QUFtQkQsMERBd0JDO0FBV0Qsc0RBTUM7QUFPRCxvRUFVQztBQXpJRCxTQUFnQixZQUFZLENBQUMsTUFBYztJQUN2QyxJQUFJLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBVSxDQUFDO1FBQ2pELElBQUksT0FBTyxVQUFVLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDbkMsT0FBTyxHQUFHLE1BQU0sSUFBSSxVQUFVLEVBQUUsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxNQUFNLEVBQUUsQ0FBQztRQUNkLG9DQUFvQztJQUN4QyxDQUFDO0lBQ0QsT0FBTyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUM1RSxDQUFDO0FBRUQsU0FBZ0IsT0FBTyxDQUFDLElBQXNCO0lBQzFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDcEUsQ0FBQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxJQUFzQixF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WSxHQUFDLENBQUM7SUFDekQsTUFBTSxRQUFRLENBQUMsa0NBQWtDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xFLFNBQWlCLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztBQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBOb2RlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHR5cGUgeyBJVW5kb0NvbW1hbmRNZXRhLCBJVW5kb1JlZG9SZXN1bHQgfSBmcm9tICcuLi8uLi8uLi8uLi9jb21tb24nO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVW5kb0lkKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByYW5kb21VVUlEID0gcmVxdWlyZSgnY3J5cHRvJyk/LnJhbmRvbVVVSUQ7XG4gICAgICAgIGlmICh0eXBlb2YgcmFuZG9tVVVJRCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGAke3ByZWZpeH0tJHtyYW5kb21VVUlEKCl9YDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAvLyBjcnlwdG8ucmFuZG9tVVVJRCDkuI3lj6/nlKjml7bvvIzpgIDlm57liLDml7bpl7TmiLMgaWTjgIJcbiAgICB9XG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtEYXRlLm5vdygpfS0ke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDApfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWNjZXNzKG1ldGE6IElVbmRvQ29tbWFuZE1ldGEpOiBJVW5kb1JlZG9SZXN1bHQge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGNvbW1hbmRJZDogbWV0YS5pZCwgbGFiZWw6IG1ldGEubGFiZWwgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZhaWx1cmUobWV0YTogSVVuZG9Db21tYW5kTWV0YSwgcmVhc29uOiBzdHJpbmcpOiBJVW5kb1JlZG9SZXN1bHQge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBjb21tYW5kSWQ6IG1ldGEuaWQsIGxhYmVsOiBtZXRhLmxhYmVsLCByZWFzb24gfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNuYXBzaG90TWFwc0VxdWFsPFQ+KGJlZm9yZTogTWFwPHN0cmluZywgVD4sIGFmdGVyOiBNYXA8c3RyaW5nLCBUPik6IGJvb2xlYW4ge1xuICAgIGlmIChiZWZvcmUuc2l6ZSAhPT0gYWZ0ZXIuc2l6ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qga2V5cyA9IFsuLi5iZWZvcmUua2V5cygpXS5zb3J0KCk7XG4gICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICBpZiAoIWFmdGVyLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KGJlZm9yZS5nZXQoa2V5KSkgIT09IEpTT04uc3RyaW5naWZ5KGFmdGVyLmdldChrZXkpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlSW5DdXJyZW50U2NlbmUobm9kZTogTm9kZSB8IG51bGwgfCB1bmRlZmluZWQpOiBub2RlIGlzIE5vZGUge1xuICAgIGlmICghbm9kZT8uaXNWYWxpZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NlbmUgPSAoY2MgYXMgYW55KS5kaXJlY3Rvcj8uZ2V0U2NlbmU/LigpO1xuICAgIHJldHVybiAhIXNjZW5lICYmIChub2RlID09PSBzY2VuZSB8fCBub2RlLmlzQ2hpbGRPZihzY2VuZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWRpdG9yRXh0ZW5kcygpOiBhbnkge1xuICAgIHJldHVybiAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVkaXRvck5vZGVNYW5hZ2VyKCk6IGFueSB7XG4gICAgcmV0dXJuIGdldEVkaXRvckV4dGVuZHMoKT8uTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVQYXRoKG5vZGU6IE5vZGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNjZW5lID0gKGNjIGFzIGFueSkuZGlyZWN0b3I/LmdldFNjZW5lPy4oKTtcbiAgICBpZiAobm9kZSA9PT0gc2NlbmUpIHtcbiAgICAgICAgcmV0dXJuICcvJztcbiAgICB9XG4gICAgcmV0dXJuIGdldEVkaXRvck5vZGVNYW5hZ2VyKCk/LmdldE5vZGVQYXRoPy4obm9kZSkgPz8gJyc7XG59XG5cbi8qKlxuICogcmVzdG9yZU5vZGVTbmFwc2hvdER1bXAg6YCJ6aG544CCXG4gKiAtIHVwZGF0ZU5vZGVOYW1l77ya6Ieq5a6a5LmJ6IqC54K5IG5hbWUg55qE5oGi5aSN5pa55byP77yM5LiN5ZCM6LCD55So5pa56ZyA6KaB5LiN5ZCM55qE57yW6L6R5Zmo6YCa55+l44CCXG4gKiAtIHJlc3RvcmVOb2RlTG9ja2Vk77ya6Ieq5a6a5LmJ6IqC54K5IGxvY2tlZCDnirbmgIHnmoTmgaLlpI3mlrnlvI/jgIJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUmVzdG9yZU5vZGVTbmFwc2hvdER1bXBPcHRpb25zIHtcbiAgICB1cGRhdGVOb2RlTmFtZT86ICh1dWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4gdm9pZDtcbiAgICByZXN0b3JlTm9kZUxvY2tlZD86IChub2RlOiBOb2RlLCBsb2NrZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG59XG5cbi8qKlxuICog5LuO5b+r54WnIGR1bXAg5oGi5aSN6IqC54K55bGe5oCn44CCXG4gKiAtIG5hbWXvvJrpgJrov4cgdXBkYXRlTm9kZU5hbWUg5Zue6LCD5oGi5aSN77yb5pyq5Lyg5YWl5pe25L2/55So6buY6K6kIEVkaXRvck5vZGVNYW5hZ2Vy77yM6L+Z5pivIHVuZG8g5LiT55So6YC76L6R44CCXG4gKiAtIOWPr+e8lui+keWxnuaAp++8iGFjdGl2ZS9sYXllci9tb2JpbGl0eS9wb3NpdGlvbi9yb3RhdGlvbi9zY2FsZe+8ie+8muS6pOe7mSBkdW1wIOWxguaBouWkjeOAglxuICogLSBsb2NrZWTvvJrpgJrov4cgb2JqRmxhZ3MgYml0IOaBouWkje+8jOi/meaYryB1bmRvIOS4k+eUqOmAu+i+keOAglxuICogLSDnu5PmnoTlrZfmrrXvvIh1dWlkL3BhcmVudC9jaGlsZHJlbi9fX2NvbXBzX1/vvInvvJrot7Pov4fvvIznlLEgbm9kZS1zdHJ1Y3R1cmUgY29tbWFuZCDnrqHnkIbjgIJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVOb2RlU25hcHNob3REdW1wKFxuICAgIG5vZGU6IE5vZGUsXG4gICAgZHVtcDogYW55LFxuICAgIG9wdGlvbnM6IElSZXN0b3JlTm9kZVNuYXBzaG90RHVtcE9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghZHVtcCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGR1bXAubmFtZSAmJiBkdW1wLm5hbWUudmFsdWUgIT09IG5vZGUubmFtZSkge1xuICAgICAgICBjb25zdCBuYW1lID0gZHVtcC5uYW1lLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgaWYgKG9wdGlvbnMudXBkYXRlTm9kZU5hbWUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudXBkYXRlTm9kZU5hbWUobm9kZS51dWlkLCBuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZU5vZGVOYW1lKG5vZGUsIG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgeyBkZWZhdWx0OiBkdW1wVXRpbCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9kdW1wJyk7XG4gICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZU5vZGVTbmFwc2hvdFByb3BlcnRpZXMobm9kZSwgZHVtcCk7XG5cbiAgICBpZiAoZHVtcC5sb2NrZWQpIHtcbiAgICAgICAgKG9wdGlvbnMucmVzdG9yZU5vZGVMb2NrZWQgPz8gcmVzdG9yZU5vZGVMb2NrZWRGbGFnKShub2RlLCAhIWR1bXAubG9ja2VkLnZhbHVlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU5vZGVOYW1lKG5vZGU6IE5vZGUsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGVkaXRvck5vZGUgPSBnZXRFZGl0b3JOb2RlTWFuYWdlcigpO1xuICAgIGlmICh0eXBlb2YgZWRpdG9yTm9kZT8udXBkYXRlTm9kZU5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZWRpdG9yTm9kZS51cGRhdGVOb2RlTmFtZShub2RlLnV1aWQsIG5hbWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIG5vZGUubmFtZSA9IG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXN0b3JlTm9kZUxvY2tlZEZsYWcobm9kZTogTm9kZSwgbG9ja2VkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKGxvY2tlZCkge1xuICAgICAgICBub2RlLm9iakZsYWdzIHw9IGNjLk9iamVjdC5GbGFncy5Mb2NrZWRJbkVkaXRvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2RlLm9iakZsYWdzICY9IH5jYy5PYmplY3QuRmxhZ3MuTG9ja2VkSW5FZGl0b3I7XG4gICAgfVxufVxuXG4vKipcbiAqIOS7juW/q+eFpyBkdW1wIOaBouWkjee7hOS7tuWxnuaAp+OAglxuICogLSDnlKjmiLflsZ7mgKfvvJrkuqTnu5kgZHVtcCDlsYLmgaLlpI3vvIzot7Pov4fliJfooajnlLEgZHVtcCDmqKHlnZfnu7TmiqTjgIJcbiAqIC0gb25SZXN0b3JlIOeUn+WRveWRqOacn++8muWxnuaAp+aBouWkjeWQjuiwg+eUqOOAglxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUNvbXBvbmVudFNuYXBzaG90RHVtcChcbiAgICBjb21wb25lbnQ6IENvbXBvbmVudCxcbiAgICBkdW1wOiBhbnksXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWR1bXA/LnZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgeyBkZWZhdWx0OiBkdW1wVXRpbCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9kdW1wJyk7XG4gICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZUNvbXBvbmVudFNuYXBzaG90UHJvcGVydGllcyhjb21wb25lbnQsIGR1bXApO1xuICAgIChjb21wb25lbnQgYXMgYW55KS5vblJlc3RvcmU/LigpO1xufVxuIl19