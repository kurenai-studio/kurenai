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
exports.GltfPrefabHandler = void 0;
const cc = __importStar(require("cc"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");
const load_asset_sync_1 = require("../utils/load-asset-sync");
const reader_manager_1 = require("./reader-manager");
const { v5: uuidV5 } = require('uuid');
const utils_1 = require("../../utils");
const fbx_1 = __importDefault(require("../fbx"));
const gltf_1 = __importDefault(require("../gltf"));
const nodePathMap = new Map();
// uuid.v5 需要一个uuid做为namespace
// https://github.com/uuidjs/uuid#uuidv5name-namespace-buffer-offset
const GLTF_PREFAB_NAMESPACE = '8fa06a75-f07a-44d4-82cf-d08c3c986599';
exports.GltfPrefabHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf-scene',
    // 引擎内对应的类型
    assetType: 'cc.Prefab',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.14',
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const gltfUserData = asset.parent.userData;
            const gltfAssetFinder = new asset_finder_1.DefaultGltfAssetFinder(gltfUserData.assetFinder);
            const sceneNode = gltfConverter.createScene(asset.userData.gltfIndex, gltfAssetFinder);
            const animationUUIDs = [];
            for (const siblingAssetName of Object.keys(asset.parent.subAssets)) {
                const siblingAsset = asset.parent.subAssets[siblingAssetName];
                if (siblingAsset.meta.importer === 'gltf-animation') {
                    animationUUIDs.push(siblingAsset.uuid);
                }
            }
            const mountAllAnimationsOnPrefab = gltfUserData.mountAllAnimationsOnPrefab ?? true;
            let animationComponent = null;
            if (sceneNode.getComponentInChildren(cc.SkinnedMeshRenderer)) {
                // create the right type of Animation upfront even if there is actually no animation clip,
                // because of the confusing results of mismatching Animation type
                animationComponent = sceneNode.addComponent(cc.SkeletalAnimation);
                // @ts-ignore TS2445
                animationComponent._sockets = gltfConverter.createSockets(sceneNode);
            }
            else if (animationUUIDs.length !== 0) {
                animationComponent = sceneNode.addComponent(cc.Animation);
            }
            if (mountAllAnimationsOnPrefab && animationComponent) {
                const animationClips = animationUUIDs.map((animationUUID) => (0, load_asset_sync_1.loadAssetSync)(animationUUID, cc.AnimationClip) || null);
                // @ts-ignore TS2445
                animationComponent._clips = animationClips;
                for (const clip of animationClips) {
                    if (clip) {
                        // @ts-ignore TS2445
                        animationComponent._defaultClip = clip;
                        break;
                    }
                }
            }
            // 生成 lod 节点
            if (gltfUserData.lods && !gltfUserData.lods.hasBuiltinLOD && gltfUserData.lods.enable) {
                // 获取原 mesh 子资源和新 mesh 子资源
                const subAssets = asset.parent.subAssets;
                // { uuid: userData }
                const newSubAssets = {}, baseSubAssets = {};
                for (const key in subAssets) {
                    const subAsset = subAssets[key];
                    if (subAsset.meta.importer === 'gltf-mesh') {
                        if (subAsset.userData.lodOptions) {
                            newSubAssets[subAsset.uuid] = subAsset.userData;
                        }
                        else {
                            baseSubAssets[subAsset.uuid] = subAsset.userData;
                        }
                    }
                }
                // 修改原节点名称
                const baseNodes = new Array(Object.keys(baseSubAssets).length);
                sceneNode.children.forEach((child) => {
                    // 获取节点下所有 meshRenderer
                    const meshRenderers = child.getComponentsInChildren(cc.MeshRenderer);
                    for (const uuid in baseSubAssets) {
                        meshRenderers.forEach((meshRenderer) => {
                            // 修改自带的 meshRenderer 的节点的名称
                            if (meshRenderer?.mesh?.uuid && uuid === meshRenderer.mesh.uuid) {
                                meshRenderer.node.name = meshRenderer.node.name + '_LOD0';
                                baseNodes[baseSubAssets[uuid].gltfIndex] = meshRenderer.node;
                            }
                        });
                    }
                });
                // 创建新节点
                for (const uuid in newSubAssets) {
                    const index = gltfUserData.assetFinder?.meshes?.indexOf(uuid) || -1;
                    if (index === -1) {
                        continue;
                    }
                    const mesh = gltfAssetFinder.find('meshes', index, cc.Mesh);
                    if (!mesh) {
                        continue;
                    }
                    const userData = newSubAssets[uuid];
                    const baseNode = baseNodes[userData.gltfIndex];
                    const name = baseNode.name.replace(/(_LOD0)+$/, `_LOD${userData.lodLevel}`);
                    // 复制原节点，修改名称和 mesh
                    const newNode = cc.instantiate(baseNode);
                    newNode.name = name;
                    const meshRenderer = newNode.getComponent(cc.MeshRenderer);
                    meshRenderer && (meshRenderer.mesh = mesh);
                    // 自带 meshRenderer 的节点的父节点中插入新节点
                    baseNode.parent.addChild(newNode);
                }
            }
            // 生成 LODGroup 组件
            const lodToInsert = [];
            let lodGroup = sceneNode.getComponent(cc.LODGroup);
            sceneNode.children.forEach((child) => {
                const lodArr = /_LOD(\d+)$/i.exec(child.name);
                if (lodArr && lodArr.length > 1) {
                    if (!lodGroup) {
                        try {
                            lodGroup = sceneNode.addComponent(cc.LODGroup);
                        }
                        catch (error) {
                            console.error('Add LODGroup component failed!');
                        }
                    }
                    const index = parseInt(lodArr[1], 10);
                    let lod = lodGroup?.LODs[index];
                    lod = lod !== undefined ? lod : lodToInsert[index];
                    if (!lod) {
                        lod = new cc.LOD();
                        lodToInsert[index] = lod;
                    }
                    const deepFindMeshRenderer = (node) => {
                        const meshRenderers = node.getComponents(cc.MeshRenderer);
                        if (meshRenderers && meshRenderers.length > 0) {
                            meshRenderers.forEach((meshRenderer) => {
                                lod?.insertRenderer(-1, meshRenderer);
                            });
                        }
                        if (node.children && node.children.length > 0) {
                            node.children.forEach((node) => {
                                deepFindMeshRenderer(node);
                            });
                        }
                    };
                    deepFindMeshRenderer(child);
                }
            });
            if (lodGroup) {
                let screenSize = 0.25;
                const len = lodToInsert.length;
                for (let index = 0; index < len - 1; index++) {
                    const lod = lodToInsert[index];
                    screenSize = gltfUserData.lods?.options[index]?.screenRatio || screenSize;
                    lodGroup.insertLOD(index, screenSize, lod);
                    screenSize /= 2;
                }
                // 手动修改的最后一层 screenSize，不做处理
                // 默认的最后一层 screenSize，最后一层小于 1%， 以计算结果为准；如果大于1 ，则用 1% 作为最后一个层级的屏占比
                if (gltfUserData.lods?.options[len - 1]?.screenRatio) {
                    lodGroup.insertLOD(len - 1, gltfUserData.lods.options[len - 1].screenRatio, lodToInsert[len - 1]);
                }
                else {
                    if (screenSize < 0.01) {
                        lodGroup.insertLOD(len - 1, screenSize, lodToInsert[len - 1]);
                    }
                    else {
                        lodGroup.insertLOD(len - 1, 0.01, lodToInsert[len - 1]);
                    }
                }
            }
            if (gltfConverter.gltf.scenes.length === 1) {
                const baseName = asset.parent.basename;
                sceneNode.name = path_1.default.basename(baseName, path_1.default.extname(baseName));
            }
            const prefab = generatePrefab(sceneNode);
            let serializeJSON = EditorExtends.serialize(prefab);
            // 影眸模型导入后需要重定向材质
            if (gltfUserData.redirectMaterialMap) {
                const prefabJSON = JSON.parse(serializeJSON);
                try {
                    await changeMaterialsInJSON(gltfUserData.redirectMaterialMap, prefabJSON);
                }
                catch (error) {
                    console.error(error);
                    console.error(`changeMaterialsInJSON in asset ${asset.url} failed!`);
                }
                serializeJSON = JSON.stringify(prefabJSON, undefined, 2);
            }
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            nodePathMap.clear();
            return true;
        },
    },
};
exports.default = exports.GltfPrefabHandler;
function changeMaterialsInJSON(redirectMaterialMap, prefabJSON) {
    const compInfo = prefabJSON.find((info) => info.__type__ === 'cc.SkinnedMeshRenderer' || info.__type__ === 'cc.MeshRenderer');
    for (const index of Object.keys(redirectMaterialMap)) {
        if (!compInfo._materials[index]) {
            continue;
        }
        const uuid = redirectMaterialMap[index];
        if (!uuid) {
            console.error(`overwriteMaterial uuid is empty, index: ${index}`);
            continue;
        }
        compInfo._materials[index].__uuid__ = uuid;
    }
}
function getCompressedUuid(name) {
    // 通过名字生成一个uuid，名字相同生成的uuid相同
    // https://tools.ietf.org/html/rfc4122#page-13
    let uuid = uuidV5(name, GLTF_PREFAB_NAMESPACE);
    uuid = EditorExtends.UuidUtils.compressUuid(uuid, true);
    return uuid;
}
function getNodePath(node) {
    if (nodePathMap.has(node)) {
        return nodePathMap.get(node);
    }
    let nodePath = '';
    // 使用节点路径来生成FileId
    const nodePathArray = [];
    let nodeItr = node;
    while (nodeItr) {
        // 为了防止名字冲突，加上siblingIndex
        const siblingIndex = nodeItr.getSiblingIndex();
        nodePathArray.push(nodeItr.name + siblingIndex);
        nodeItr = nodeItr.parent;
    }
    nodePath = nodePathArray.reverse().join('/');
    nodePathMap.set(node, nodePath);
    return nodePath;
}
function nodeFileIdGenerator(node) {
    const nodePath = getNodePath(node);
    const nodeFileId = getCompressedUuid(nodePath);
    return nodeFileId;
}
function compFileIdGenerator(comp, index) {
    const nodePath = getNodePath(comp.node);
    const compPath = nodePath + '/comp' + index;
    const compFileId = getCompressedUuid(compPath);
    return compFileId;
}
function getDumpableNode(node, prefab) {
    // deep clone, since we dont want the given node changed by codes below
    // node = cc.instantiate(node);
    nodePathMap.clear();
    // 使用节点路径来生成FileId，这样可以防止每次gltf重导后生成不同的FileId
    EditorExtends.PrefabUtils.addPrefabInfo(node, node, prefab, { nodeFileIdGenerator, compFileIdGenerator });
    EditorExtends.PrefabUtils.checkAndStripNode(node);
    return node;
}
function generatePrefab(node) {
    const prefab = new cc.Prefab();
    const dump = getDumpableNode(node, prefab);
    prefab.data = dump;
    return prefab;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2dsdGYvcHJlZmFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUF5QjtBQUN6QixnREFBd0I7QUFFeEIsaURBQXdEO0FBQ3hELDhEQUF5RDtBQUN6RCxxREFBcUQ7QUFDckQsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFdkMsdUNBQWdEO0FBR2hELGlEQUFnQztBQUNoQyxtREFBa0M7QUFHbEMsTUFBTSxXQUFXLEdBQXlCLElBQUksR0FBRyxFQUFtQixDQUFDO0FBRXJFLDhCQUE4QjtBQUM5QixvRUFBb0U7QUFDcEUsTUFBTSxxQkFBcUIsR0FBRyxzQ0FBc0MsQ0FBQztBQUV4RCxRQUFBLGlCQUFpQixHQUFpQjtJQUMzQyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLFlBQVk7SUFFbEIsV0FBVztJQUNYLFNBQVMsRUFBRSxXQUFXO0lBRXRCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsUUFBUTtRQUNqQixLQUFLLENBQUMsTUFBTSxDQUFDLEtBQW1CO1lBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxjQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxHQUFHLGFBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQzFDLENBQUM7WUFDRCxNQUFNLGFBQWEs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QU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxJQUFhO0lBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0MsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbkIsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0ICogYXMgY2MgZnJvbSAnY2MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBHbFRGVXNlckRhdGEsIElWaXJ0dWFsQXNzZXRVc2VyRGF0YSB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy91c2VyRGF0YXMnO1xuaW1wb3J0IHsgRGVmYXVsdEdsdGZBc3NldEZpbmRlciB9IGZyb20gJy4vYXNzZXQtZmluZGVyJztcbmltcG9ydCB7IGxvYWRBc3NldFN5bmMgfSBmcm9tICcuLi91dGlscy9sb2FkLWFzc2V0LXN5bmMnO1xuaW1wb3J0IHsgZ2xUZlJlYWRlck1hbmFnZXIgfSBmcm9tICcuL3JlYWRlci1tYW5hZ2VyJztcbmNvbnN0IHsgdjU6IHV1aWRWNSB9ID0gcmVxdWlyZSgndXVpZCcpO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IEdsdGZDb252ZXJ0ZXIgfSBmcm9tICcuLi91dGlscy9nbHRmLWNvbnZlcnRlcic7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBGYnhIYW5kbGVyIGZyb20gJy4uL2ZieCc7XG5pbXBvcnQgR2x0ZkhhbmRsZXIgZnJvbSAnLi4vZ2x0Zic7XG5cbmRlY2xhcmUgY29uc3QgRWRpdG9yRXh0ZW5kczogYW55O1xuY29uc3Qgbm9kZVBhdGhNYXA6IE1hcDxjYy5Ob2RlLCBzdHJpbmc+ID0gbmV3IE1hcDxjYy5Ob2RlLCBzdHJpbmc+KCk7XG5cbi8vIHV1aWQudjUg6ZyA6KaB5LiA5LiqdXVpZOWBmuS4um5hbWVzcGFjZVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3V1aWRqcy91dWlkI3V1aWR2NW5hbWUtbmFtZXNwYWNlLWJ1ZmZlci1vZmZzZXRcbmNvbnN0IEdMVEZfUFJFRkFCX05BTUVTUEFDRSA9ICc4ZmEwNmE3NS1mMDdhLTQ0ZDQtODJjZi1kMDhjM2M5ODY1OTknO1xuXG5leHBvcnQgY29uc3QgR2x0ZlByZWZhYkhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdnbHRmLXNjZW5lJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLlByZWZhYicsXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4xNCcsXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogVmlydHVhbEFzc2V0KSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB2ZXJzaW9uID0gR2x0ZkhhbmRsZXIuaW1wb3J0ZXIudmVyc2lvbjtcbiAgICAgICAgICAgIGlmIChhc3NldC5wYXJlbnQubWV0YS5pbXBvcnRlciA9PT0gJ2ZieCcpIHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gRmJ4SGFuZGxlci5pbXBvcnRlci52ZXJzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZ2x0ZkNvbnZlcnRlciA9IGF3YWl0IGdsVGZSZWFkZXJNYW5hZ2VyLmdldE9yQ3JlYXRlKGFzc2V0LnBhcmVudCBhcyBBc3NldCwgdmVyc2lvbik7XG5cbiAgICAgICAgICAgIGNvbnN0IGdsdGZVc2VyRGF0YSA9IGFzc2V0LnBhcmVudC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG5cbiAgICAgICAgICAgIGNvbnN0IGdsdGZBc3NldEZpbmRlciA9IG5ldyBEZWZhdWx0R2x0ZkFzc2V0RmluZGVyKGdsdGZVc2VyRGF0YS5hc3NldEZpbmRlcik7XG4gICAgICAgICAgICBjb25zdCBzY2VuZU5vZGUgPSBnbHRmQ29udmVydGVyLmNyZWF0ZVNjZW5lKGFzc2V0LnVzZXJEYXRhLmdsdGZJbmRleCBhcyBudW1iZXIsIGdsdGZBc3NldEZpbmRlcik7XG5cbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblVVSURzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzaWJsaW5nQXNzZXROYW1lIG9mIE9iamVjdC5rZXlzKGFzc2V0LnBhcmVudC5zdWJBc3NldHMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2libGluZ0Fzc2V0ID0gYXNzZXQucGFyZW50LnN1YkFzc2V0c1tzaWJsaW5nQXNzZXROYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoc2libGluZ0Fzc2V0Lm1ldGEuaW1wb3J0ZXIgPT09ICdnbHRmLWFuaW1hdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uVVVJRHMucHVzaChzaWJsaW5nQXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb3VudEFsbEFuaW1hdGlvbnNPblByZWZhYiA9IGdsdGZVc2VyRGF0YS5tb3VudEFsbEFuaW1hdGlvbnNPblByZWZhYiA/PyB0cnVlO1xuXG4gICAgICAgICAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50OiBjYy5BbmltYXRpb24gfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChzY2VuZU5vZGUuZ2V0Q29tcG9uZW50SW5DaGlsZHJlbihjYy5Ta2lubmVkTWVzaFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgcmlnaHQgdHlwZSBvZiBBbmltYXRpb24gdXBmcm9udCBldmVuIGlmIHRoZXJlIGlzIGFjdHVhbGx5IG5vIGFuaW1hdGlvbiBjbGlwLFxuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgdGhlIGNvbmZ1c2luZyByZXN1bHRzIG9mIG1pc21hdGNoaW5nIEFuaW1hdGlvbiB0eXBlXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gc2NlbmVOb2RlLmFkZENvbXBvbmVudChjYy5Ta2VsZXRhbEFuaW1hdGlvbik7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuX3NvY2tldHMgPSBnbHRmQ29udmVydGVyLmNyZWF0ZVNvY2tldHMoc2NlbmVOb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYW5pbWF0aW9uVVVJRHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gc2NlbmVOb2RlLmFkZENvbXBvbmVudChjYy5BbmltYXRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobW91bnRBbGxBbmltYXRpb25zT25QcmVmYWIgJiYgYW5pbWF0aW9uQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uQ2xpcHMgPSBhbmltYXRpb25VVUlEcy5tYXAoKGFuaW1hdGlvblVVSUQpID0+IGxvYWRBc3NldFN5bmMoYW5pbWF0aW9uVVVJRCwgY2MuQW5pbWF0aW9uQ2xpcCkgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuX2NsaXBzID0gYW5pbWF0aW9uQ2xpcHM7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjbGlwIG9mIGFuaW1hdGlvbkNsaXBzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGlwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50Ll9kZWZhdWx0Q2xpcCA9IGNsaXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g55Sf5oiQIGxvZCDoioLngrlcbiAgICAgICAgICAgIGlmIChnbHRmVXNlckRhdGEubG9kcyAmJiAhZ2x0ZlVzZXJEYXRhLmxvZHMuaGFzQnVpbHRpbkxPRCAmJiBnbHRmVXNlckRhdGEubG9kcy5lbmFibGUpIHtcbiAgICAgICAgICAgICAgICAvLyDojrflj5bljp8gbWVzaCDlrZDotYTmupDlkozmlrAgbWVzaCDlrZDotYTmupBcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJBc3NldHMgPSBhc3NldC5wYXJlbnQuc3ViQXNzZXRzO1xuICAgICAgICAgICAgICAgIC8vIHsgdXVpZDogdXNlckRhdGEgfVxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1N1YkFzc2V0czogeyBba2V5OiBzdHJpbmddOiBJVmlydHVhbEFzc2V0VXNlckRhdGEgfSA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBiYXNlU3ViQXNzZXRzOiB7IFtrZXk6IHN0cmluZ106IElWaXJ0dWFsQXNzZXRVc2VyRGF0YSB9ID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gc3ViQXNzZXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkFzc2V0OiBWaXJ0dWFsQXNzZXQgPSBzdWJBc3NldHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YkFzc2V0Lm1ldGEuaW1wb3J0ZXIgPT09ICdnbHRmLW1lc2gnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3ViQXNzZXQudXNlckRhdGEubG9kT3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1N1YkFzc2V0c1tzdWJBc3NldC51dWlkXSA9IHN1YkFzc2V0LnVzZXJEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlU3ViQXNzZXRzW3N1YkFzc2V0LnV1aWRdID0gc3ViQXNzZXQudXNlckRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkv67mlLnljp/oioLngrnlkI3np7BcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNlTm9kZXMgPSBuZXcgQXJyYXkoT2JqZWN0LmtleXMoYmFzZVN1YkFzc2V0cykubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBzY2VuZU5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGNjLk5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6I635Y+W6IqC54K55LiL5omA5pyJIG1lc2hSZW5kZXJlclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXJzID0gY2hpbGQuZ2V0Q29tcG9uZW50c0luQ2hpbGRyZW4oY2MuTWVzaFJlbmRlcmVyKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIGluIGJhc2VTdWJBc3NldHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc2hSZW5kZXJlcnMuZm9yRWFjaCgobWVzaFJlbmRlcmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L+u5pS56Ieq5bim55qEIG1lc2hSZW5kZXJlciDnmoToioLngrnnmoTlkI3np7BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVzaFJlbmRlcmVyPy5tZXNoPy51dWlkICYmIHV1aWQgPT09IG1lc2hSZW5kZXJlci5tZXNoLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzaFJlbmRlcmVyLm5vZGUubmFtZSA9IG1lc2hSZW5kZXJlci5ub2RlLm5hbWUgKyAnX0xPRDAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlTm9kZXNbYmFzZVN1YkFzc2V0c1t1dWlkXS5nbHRmSW5kZXghXSA9IG1lc2hSZW5kZXJlci5ub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8g5Yib5bu65paw6IqC54K5XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIGluIG5ld1N1YkFzc2V0cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGdsdGZVc2VyRGF0YS5hc3NldEZpbmRlcj8ubWVzaGVzPy5pbmRleE9mKHV1aWQpIHx8IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNoID0gZ2x0ZkFzc2V0RmluZGVyLmZpbmQoJ21lc2hlcycsIGluZGV4LCBjYy5NZXNoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtZXNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IG5ld1N1YkFzc2V0c1t1dWlkXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZU5vZGUgPSBiYXNlTm9kZXNbdXNlckRhdGEuZ2x0ZkluZGV4IV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBiYXNlTm9kZS5uYW1lLnJlcGxhY2UoLyhfTE9EMCkrJC8sIGBfTE9EJHt1c2VyRGF0YS5sb2RMZXZlbH1gKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSN5Yi25Y6f6IqC54K577yM5L+u5pS55ZCN56ew5ZKMIG1lc2hcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Tm9kZSA9IGNjLmluc3RhbnRpYXRlKGJhc2VOb2RlKSBhcyBjYy5Ob2RlO1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXIgPSBuZXdOb2RlLmdldENvbXBvbmVudChjYy5NZXNoUmVuZGVyZXIpIGFzIGNjLk1lc2hSZW5kZXJlcjtcbiAgICAgICAgICAgICAgICAgICAgbWVzaFJlbmRlcmVyICYmIChtZXNoUmVuZGVyZXIubWVzaCA9IG1lc2gpO1xuICAgICAgICAgICAgICAgICAgICAvLyDoh6rluKYgbWVzaFJlbmRlcmVyIOeahOiKgueCueeahOeItuiKgueCueS4reaPkuWFpeaWsOiKgueCuVxuICAgICAgICAgICAgICAgICAgICBiYXNlTm9kZS5wYXJlbnQuYWRkQ2hpbGQobmV3Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnlJ/miJAgTE9ER3JvdXAg57uE5Lu2XG4gICAgICAgICAgICBjb25zdCBsb2RUb0luc2VydDogY2MuTE9EW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBsb2RHcm91cCA9IHNjZW5lTm9kZS5nZXRDb21wb25lbnQoY2MuTE9ER3JvdXApO1xuICAgICAgICAgICAgc2NlbmVOb2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBjYy5Ob2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9kQXJyID0gL19MT0QoXFxkKykkL2kuZXhlYyhjaGlsZC5uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAobG9kQXJyICYmIGxvZEFyci5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbG9kR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9kR3JvdXAgPSBzY2VuZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxPREdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQWRkIExPREdyb3VwIGNvbXBvbmVudCBmYWlsZWQhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChsb2RBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvZCA9IGxvZEdyb3VwPy5MT0RzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbG9kID0gbG9kICE9PSB1bmRlZmluZWQgPyBsb2QgOiBsb2RUb0luc2VydFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghbG9kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2QgPSBuZXcgY2MuTE9EKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2RUb0luc2VydFtpbmRleF0gPSBsb2Q7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWVwRmluZE1lc2hSZW5kZXJlciA9IChub2RlOiBjYy5Ob2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXJzID0gbm9kZS5nZXRDb21wb25lbnRzKGNjLk1lc2hSZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVzaFJlbmRlcmVycyAmJiBtZXNoUmVuZGVyZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNoUmVuZGVyZXJzLmZvckVhY2goKG1lc2hSZW5kZXJlcjogY2MuTWVzaFJlbmRlcmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZD8uaW5zZXJ0UmVuZGVyZXIoLTEsIG1lc2hSZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKG5vZGU6IGNjLk5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVlcEZpbmRNZXNoUmVuZGVyZXIobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGRlZXBGaW5kTWVzaFJlbmRlcmVyKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChsb2RHcm91cCkge1xuICAgICAgICAgICAgICAgIGxldCBzY3JlZW5TaXplID0gMC4yNTtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBsb2RUb0luc2VydC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxlbiAtIDE7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9kOiBjYy5MT0QgPSBsb2RUb0luc2VydFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHNjcmVlblNpemUgPSBnbHRmVXNlckRhdGEubG9kcz8ub3B0aW9uc1tpbmRleF0/LnNjcmVlblJhdGlvIHx8IHNjcmVlblNpemU7XG4gICAgICAgICAgICAgICAgICAgIGxvZEdyb3VwLmluc2VydExPRChpbmRleCwgc2NyZWVuU2l6ZSwgbG9kKTtcbiAgICAgICAgICAgICAgICAgICAgc2NyZWVuU2l6ZSAvPSAyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOaJi+WKqOS/ruaUueeahOacgOWQjuS4gOWxgiBzY3JlZW5TaXpl77yM5LiN5YGa5aSE55CGXG4gICAgICAgICAgICAgICAgLy8g6buY6K6k55qE5pyA5ZCO5LiA5bGCIHNjcmVlblNpemXvvIzmnIDlkI7kuIDlsYLlsI/kuo4gMSXvvIwg5Lul6K6h566X57uT5p6c5Li65YeG77yb5aaC5p6c5aSn5LqOMSDvvIzliJnnlKggMSUg5L2c5Li65pyA5ZCO5LiA5Liq5bGC57qn55qE5bGP5Y2g5q+UXG4gICAgICAgICAgICAgICAgaWYgKGdsdGZVc2VyRGF0YS5sb2RzPy5vcHRpb25zW2xlbiAtIDFdPy5zY3JlZW5SYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBsb2RHcm91cC5pbnNlcnRMT0QobGVuIC0gMSwgZ2x0ZlVzZXJEYXRhLmxvZHMub3B0aW9uc1tsZW4gLSAxXS5zY3JlZW5SYXRpbywgbG9kVG9JbnNlcnRbbGVuIC0gMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3JlZW5TaXplIDwgMC4wMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9kR3JvdXAuaW5zZXJ0TE9EKGxlbiAtIDEsIHNjcmVlblNpemUsIGxvZFRvSW5zZXJ0W2xlbiAtIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZEdyb3VwLmluc2VydExPRChsZW4gLSAxLCAwLjAxLCBsb2RUb0luc2VydFtsZW4gLSAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChnbHRmQ29udmVydGVyLmdsdGYuc2NlbmVzIS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNlTmFtZSA9IChhc3NldC5wYXJlbnQgYXMgQXNzZXQpLmJhc2VuYW1lO1xuICAgICAgICAgICAgICAgIHNjZW5lTm9kZS5uYW1lID0gcGF0aC5iYXNlbmFtZShiYXNlTmFtZSwgcGF0aC5leHRuYW1lKGJhc2VOYW1lKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByZWZhYiA9IGdlbmVyYXRlUHJlZmFiKHNjZW5lTm9kZSk7XG4gICAgICAgICAgICBsZXQgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHByZWZhYik7XG4gICAgICAgICAgICAvLyDlvbHnnLjmqKHlnovlr7zlhaXlkI7pnIDopoHph43lrprlkJHmnZDotKhcbiAgICAgICAgICAgIGlmIChnbHRmVXNlckRhdGEucmVkaXJlY3RNYXRlcmlhbE1hcCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkpTT04gPSBKU09OLnBhcnNlKHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNoYW5nZU1hdGVyaWFsc0luSlNPTihnbHRmVXNlckRhdGEucmVkaXJlY3RNYXRlcmlhbE1hcCwgcHJlZmFiSlNPTik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNoYW5nZU1hdGVyaWFsc0luSlNPTiBpbiBhc3NldCAke2Fzc2V0LnVybH0gZmFpbGVkIWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXJpYWxpemVKU09OID0gSlNPTi5zdHJpbmdpZnkocHJlZmFiSlNPTiwgdW5kZWZpbmVkLCAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG4gICAgICAgICAgICBub2RlUGF0aE1hcC5jbGVhcigpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5leHBvcnQgZGVmYXVsdCBHbHRmUHJlZmFiSGFuZGxlcjtcblxuZnVuY3Rpb24gY2hhbmdlTWF0ZXJpYWxzSW5KU09OKHJlZGlyZWN0TWF0ZXJpYWxNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIHByZWZhYkpTT046IGFueVtdKSB7XG4gICAgY29uc3QgY29tcEluZm8gPSBwcmVmYWJKU09OLmZpbmQoKGluZm8pID0+IGluZm8uX190eXBlX18gPT09ICdjYy5Ta2lubmVkTWVzaFJlbmRlcmVyJyB8fCBpbmZvLl9fdHlwZV9fID09PSAnY2MuTWVzaFJlbmRlcmVyJyk7XG4gICAgZm9yIChjb25zdCBpbmRleCBvZiBPYmplY3Qua2V5cyhyZWRpcmVjdE1hdGVyaWFsTWFwKSkge1xuICAgICAgICBpZiAoIWNvbXBJbmZvLl9tYXRlcmlhbHNbaW5kZXhdKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1dWlkID0gcmVkaXJlY3RNYXRlcmlhbE1hcFtpbmRleF07XG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgb3ZlcndyaXRlTWF0ZXJpYWwgdXVpZCBpcyBlbXB0eSwgaW5kZXg6ICR7aW5kZXh9YCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb21wSW5mby5fbWF0ZXJpYWxzW2luZGV4XS5fX3V1aWRfXyA9IHV1aWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRDb21wcmVzc2VkVXVpZChuYW1lOiBzdHJpbmcpIHtcbiAgICAvLyDpgJrov4flkI3lrZfnlJ/miJDkuIDkuKp1dWlk77yM5ZCN5a2X55u45ZCM55Sf5oiQ55qEdXVpZOebuOWQjFxuICAgIC8vIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0MTIyI3BhZ2UtMTNcbiAgICBsZXQgdXVpZCA9IHV1aWRWNShuYW1lLCBHTFRGX1BSRUZBQl9OQU1FU1BBQ0UpO1xuICAgIHV1aWQgPSBFZGl0b3JFeHRlbmRzLlV1aWRVdGlscy5jb21wcmVzc1V1aWQodXVpZCwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gdXVpZDtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVBhdGgobm9kZTogY2MuTm9kZSkge1xuICAgIGlmIChub2RlUGF0aE1hcC5oYXMobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVQYXRoTWFwLmdldChub2RlKSE7XG4gICAgfVxuXG4gICAgbGV0IG5vZGVQYXRoID0gJyc7XG4gICAgLy8g5L2/55So6IqC54K56Lev5b6E5p2l55Sf5oiQRmlsZUlkXG4gICAgY29uc3Qgbm9kZVBhdGhBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgbm9kZUl0cjogY2MuTm9kZSB8IG51bGwgPSBub2RlO1xuICAgIHdoaWxlIChub2RlSXRyKSB7XG4gICAgICAgIC8vIOS4uuS6humYsuatouWQjeWtl+WGsueqge+8jOWKoOS4inNpYmxpbmdJbmRleFxuICAgICAgICBjb25zdCBzaWJsaW5nSW5kZXggPSBub2RlSXRyLmdldFNpYmxpbmdJbmRleCgpO1xuICAgICAgICBub2RlUGF0aEFycmF5LnB1c2gobm9kZUl0ci5uYW1lICsgc2libGluZ0luZGV4KTtcbiAgICAgICAgbm9kZUl0ciA9IG5vZGVJdHIucGFyZW50O1xuICAgIH1cbiAgICBub2RlUGF0aCA9IG5vZGVQYXRoQXJyYXkucmV2ZXJzZSgpLmpvaW4oJy8nKTtcbiAgICBub2RlUGF0aE1hcC5zZXQobm9kZSwgbm9kZVBhdGgpO1xuXG4gICAgcmV0dXJuIG5vZGVQYXRoO1xufVxuXG5mdW5jdGlvbiBub2RlRmlsZUlkR2VuZXJhdG9yKG5vZGU6IGNjLk5vZGUpIHtcbiAgICBjb25zdCBub2RlUGF0aCA9IGdldE5vZGVQYXRoKG5vZGUpO1xuICAgIGNvbnN0IG5vZGVGaWxlSWQgPSBnZXRDb21wcmVzc2VkVXVpZChub2RlUGF0aCk7XG5cbiAgICByZXR1cm4gbm9kZUZpbGVJZDtcbn1cblxuZnVuY3Rpb24gY29tcEZpbGVJZEdlbmVyYXRvcihjb21wOiBjYy5Db21wb25lbnQsIGluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCBub2RlUGF0aCA9IGdldE5vZGVQYXRoKGNvbXAubm9kZSk7XG4gICAgY29uc3QgY29tcFBhdGggPSBub2RlUGF0aCArICcvY29tcCcgKyBpbmRleDtcbiAgICBjb25zdCBjb21wRmlsZUlkID0gZ2V0Q29tcHJlc3NlZFV1aWQoY29tcFBhdGgpO1xuXG4gICAgcmV0dXJuIGNvbXBGaWxlSWQ7XG59XG5cbmZ1bmN0aW9uIGdldER1bXBhYmxlTm9kZShub2RlOiBjYy5Ob2RlLCBwcmVmYWI6IGNjLlByZWZhYikge1xuICAgIC8vIGRlZXAgY2xvbmUsIHNpbmNlIHdlIGRvbnQgd2FudCB0aGUgZ2l2ZW4gbm9kZSBjaGFuZ2VkIGJ5IGNvZGVzIGJlbG93XG4gICAgLy8gbm9kZSA9IGNjLmluc3RhbnRpYXRlKG5vZGUpO1xuICAgIG5vZGVQYXRoTWFwLmNsZWFyKCk7XG4gICAgLy8g5L2/55So6IqC54K56Lev5b6E5p2l55Sf5oiQRmlsZUlk77yM6L+Z5qC35Y+v5Lul6Ziy5q2i5q+P5qyhZ2x0ZumHjeWvvOWQjueUn+aIkOS4jeWQjOeahEZpbGVJZFxuICAgIEVkaXRvckV4dGVuZHMuUHJlZmFiVXRpbHMuYWRkUHJlZmFiSW5mbyhub2RlLCBub2RlLCBwcmVmYWIsIHsgbm9kZUZpbGVJZEdlbmVyYXRvciwgY29tcEZpbGVJZEdlbmVyYXRvciB9KTtcblxuICAgIEVkaXRvckV4dGVuZHMuUHJlZmFiVXRpbHMuY2hlY2tBbmRTdHJpcE5vZGUobm9kZSk7XG5cbiAgICByZXR1cm4gbm9kZTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQcmVmYWIobm9kZTogY2MuTm9kZSkge1xuICAgIGNvbnN0IHByZWZhYiA9IG5ldyBjYy5QcmVmYWIoKTtcbiAgICBjb25zdCBkdW1wID0gZ2V0RHVtcGFibGVOb2RlKG5vZGUsIHByZWZhYik7XG4gICAgcHJlZmFiLmRhdGEgPSBkdW1wO1xuICAgIHJldHVybiBwcmVmYWI7XG59XG4iXX0=