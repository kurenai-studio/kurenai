"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfMeshHandler = void 0;
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const cc_1 = require("cc");
const fs_extra_1 = __importDefault(require("fs-extra"));
const uv_unwrap_1 = require("../utils/uv-unwrap");
const fs_extra_2 = require("fs-extra");
const meshOptimizer_1 = require("./meshOptimizer");
const fbx_1 = __importDefault(require("../fbx"));
const gltf_1 = __importDefault(require("../gltf"));
exports.GltfMeshHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf-mesh',
    // 引擎内对应的类型
    assetType: 'cc.Mesh',
    /**
     * 允许这种类型的资源进行实例化
     */
    instantiation: '.mesh',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.1.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            // This could not happen
            if (!asset.parent) {
                return false;
            }
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            // Fetch the gltf convert associated with parent (gltf)asset
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const generateLightmapUV = asset.parent.userData.generateLightmapUVNode;
            const gltfUserData = asset.parent.userData;
            const assetUserData = asset.userData;
            // Create the mesh asset
            let mesh = gltfConverter.createMesh(asset.userData.gltfIndex, generateLightmapUV, gltfUserData.addVertexColor ?? false);
            // 新增的 mesh 需要进行减面
            if (assetUserData.lodOptions) {
                const defaultOption = (0, meshOptimizer_1.getDefaultSimplifyOptions)();
                defaultOption.targetRatio = assetUserData.lodOptions.faceCount;
                mesh = await (0, meshOptimizer_1.simplifyMesh)(mesh, defaultOption);
            }
            // 记录 mesh 的面数
            let meshTriangleCount = 0;
            assetUserData.triangleCount = 0;
            mesh.struct.primitives?.forEach((subMesh) => {
                if (subMesh && subMesh.indexView) {
                    meshTriangleCount += subMesh.indexView.count / 3;
                }
            });
            assetUserData.triangleCount = meshTriangleCount;
            mesh.allowDataAccess = asset.parent.userData.allowMeshDataAccess ?? true;
            if (generateLightmapUV) {
                let hasUV1 = false;
                const vArray = [], iArray = [];
                //Write out vb and ib
                let subMeshStartIndex = 0;
                for (let iSubMesh = 0; iSubMesh < mesh.struct.primitives.length; iSubMesh++) {
                    const vPosArray = mesh.readAttribute(iSubMesh, cc_1.gfx.AttributeName.ATTR_POSITION);
                    let indexArray;
                    if (mesh.struct.vertexBundles[iSubMesh].view.stride === 2) {
                        indexArray = mesh.readIndices(iSubMesh);
                    }
                    else if (mesh.struct.vertexBundles[iSubMesh].view.stride === 4) {
                        indexArray = mesh.readIndices(iSubMesh);
                    }
                    else {
                        console.warn('Invalid indeces stride');
                        indexArray = [];
                    }
                    for (let i = 0; i < vPosArray.length; ++i) {
                        vArray.push(vPosArray[i]);
                    }
                    for (let i = 0; i < indexArray.length; ++i) {
                        iArray.push(indexArray[i] + subMeshStartIndex);
                    }
                    if (mesh.readAttribute(iSubMesh, cc_1.gfx.AttributeName.ATTR_TEX_COORD1)) {
                        hasUV1 = true;
                    }
                    subMeshStartIndex += mesh.struct.vertexBundles[iSubMesh].view.count;
                }
                const totalVertex = vArray.length / 3;
                const total = new Uint8Array(8 + vArray.length * 4 + iArray.length * 4);
                const vInt32ptr = new Int32Array(total.buffer, 0);
                vInt32ptr[0] = totalVertex;
                vInt32ptr[1] = iArray.length;
                const vPosFlt32ptr = new Float32Array(total.buffer, 8);
                const idxInt32Ptr = new Int32Array(total.buffer, 8 + vArray.length * 4);
                for (let i = 0; i < vArray.length; i++) {
                    vPosFlt32ptr[i] = vArray[i];
                }
                for (let i = 0; i < iArray.length; i++) {
                    idxInt32Ptr[i] = iArray[i];
                }
                //save out file.
                const fileName = asset.uuid;
                const folderToSave = asset.temp;
                await (0, fs_extra_2.ensureDir)(folderToSave);
                await fs_extra_1.default.promises.writeFile(`${folderToSave}/${fileName}_in.bin`, total);
                await (0, uv_unwrap_1.unwrapLightmapUV)(`${folderToSave}/${fileName}_in.bin`, `${folderToSave}/${fileName}_out.bin`);
                const f2 = await fs_extra_1.default.promises.readFile(`${folderToSave}/${fileName}_out.bin`);
                const bData = new Uint8Array(f2);
                const vPositionArr = new Float32Array(bData.buffer, 4);
                let index = 0;
                for (let iSubMesh = 0; iSubMesh < mesh.struct.primitives.length; iSubMesh++) {
                    const lightmapUV = mesh.readAttribute(iSubMesh, cc_1.gfx.AttributeName.ATTR_TEX_COORD1);
                    const attrs = mesh.struct.vertexBundles[iSubMesh].attributes;
                    let uvOffset = 0;
                    if (lightmapUV.length > 0) {
                        for (let i = 0; i < attrs.length; i++) {
                            if (attrs[i].name === cc_1.gfx.AttributeName.ATTR_TEX_COORD1) {
                                break;
                            }
                            else {
                                const fInfo = mesh.readAttributeFormat(iSubMesh, attrs[i].name);
                                if (fInfo) {
                                    uvOffset += fInfo.size;
                                }
                            }
                        }
                        if (uvOffset > 0) {
                            for (let i = 0; i < mesh.struct.vertexBundles[iSubMesh].view.count; i++) {
                                const tOffset = mesh.struct.vertexBundles[iSubMesh].view.offset +
                                    uvOffset +
                                    i * mesh.struct.vertexBundles[iSubMesh].view.stride;
                                const view = new DataView(mesh.data.buffer);
                                view.setFloat32(tOffset, vPositionArr[index], true);
                                view.setFloat32(tOffset + 4, vPositionArr[index + 1], true);
                                index += 2;
                            }
                        }
                    }
                }
            }
            // simplify pass
            if (gltfUserData.meshSimplify && gltfUserData.meshSimplify.enable) {
                mesh = await (0, meshOptimizer_1.simplifyMesh)(mesh, gltfUserData.meshSimplify);
            }
            // optimize pass
            if (gltfUserData.meshOptimize && gltfUserData.meshOptimize.enable) {
                mesh = await (0, meshOptimizer_1.optimizeMesh)(mesh, gltfUserData.meshOptimize);
            }
            // cluster pass
            if (gltfUserData.meshCluster && gltfUserData.meshCluster.enable) {
                mesh = await (0, meshOptimizer_1.clusterizeMesh)(mesh, gltfUserData.meshCluster);
            }
            // compress pass
            if (gltfUserData.meshCompress && gltfUserData.meshCompress.enable) {
                mesh = await (0, meshOptimizer_1.compressMesh)(mesh, gltfUserData.meshCompress);
            }
            if (mesh.data.byteLength !== 0) {
                // Do not create an empty file for empty binary data
                mesh._setRawAsset('.bin');
                await asset.saveToLibrary('.bin', Buffer.from(mesh.data));
            }
            // Save the mesh asset into library
            const serializeJSON = EditorExtends.serialize(mesh);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.GltfMeshHandler;
