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
