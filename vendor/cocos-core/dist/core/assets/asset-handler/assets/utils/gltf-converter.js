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
exports.GlTfConformanceError = exports.BufferBlob = exports.GltfConverter = void 0;
exports.isFilesystemPath = isFilesystemPath;
exports.getPathFromRoot = getPathFromRoot;
exports.getWorldTransformUntilRoot = getWorldTransformUntilRoot;
exports.doCreateSocket = doCreateSocket;
exports.readGltf = readGltf;
exports.isDataUri = isDataUri;
const DataURI = __importStar(require("@cocos/data-uri"));
const cc = __importStar(require("cc"));
const cc_1 = require("cc");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const interface_1 = require("../../../@types/interface");
const texture_base_1 = require("../texture-base");
const base64_1 = require("./base64");
const glTF_constants_1 = require("./glTF.constants");
const khr_draco_mesh_compression_1 = require("./khr-draco-mesh-compression");
const pp_geometry_1 = require("./pp-geometry");
const extras_1 = require("@cocos/fbx-gltf-conv/lib/extras");
const exotic_animation_1 = require("cc/editor/exotic-animation");
const glTF_animation_utils_1 = require("./glTF-animation-utils");
const color_utils_1 = require("cc/editor/color-utils");
function isFilesystemPath(uriInfo) {
    return !uriInfo.isDataUri;
}
function getPathFromRoot(target, root) {
    let node = target;
    let path = '';
    while (node !== null && node !== root) {
        path = `${node.name}/${path}`;
        node = node.parent;
    }
    return path.slice(0, -1);
}
function getWorldTransformUntilRoot(target, root, outPos, outRot, outScale) {
    cc_1.Vec3.set(outPos, 0, 0, 0);
    cc_1.Quat.set(outRot, 0, 0, 0, 1);
    cc_1.Vec3.set(outScale, 1, 1, 1);
    while (target !== root) {
        cc_1.Vec3.multiply(outPos, outPos, target.scale);
        cc_1.Vec3.transformQuat(outPos, outPos, target.rotation);
        cc_1.Vec3.add(outPos, outPos, target.position);
        cc_1.Quat.multiply(outRot, target.rotation, outRot);
        cc_1.Vec3.multiply(outScale, target.scale, outScale);
        target = target.parent;
    }
}
var GltfAssetKind;
(function (GltfAssetKind) {
    GltfAssetKind[GltfAssetKind["Node"] = 0] = "Node";
    GltfAssetKind[GltfAssetKind["Mesh"] = 1] = "Mesh";
    GltfAssetKind[GltfAssetKind["Texture"] = 2] = "Texture";
    GltfAssetKind[GltfAssetKind["Skin"] = 3] = "Skin";
    GltfAssetKind[GltfAssetKind["Animation"] = 4] = "Animation";
    GltfAssetKind[GltfAssetKind["Image"] = 5] = "Image";
    GltfAssetKind[GltfAssetKind["Material"] = 6] = "Material";
    GltfAssetKind[GltfAssetKind["Scene"] = 7] = "Scene";
})(GltfAssetKind || (GltfAssetKind = {}));
const qt = new cc_1.Quat();
const v3a = new cc_1.Vec3();
const v3b = new cc_1.Vec3();
const v3Min = new cc_1.Vec3();
const v3Max = new cc_1.Vec3();
function doCreateSocket(sceneNode, out, model) {
    const path = getPathFromRoot(model.parent, sceneNode);
    if (model.parent === sceneNode) {
        return;
    }
    let socket = out.find((s) => s.path === path);
    if (!socket) {
        const target = new cc.Node();
        target.name = `${model.parent.name} Socket`;
        target.parent = sceneNode;
        getWorldTransformUntilRoot(model.parent, sceneNode, v3a, qt, v3b);
        target.setPosition(v3a);
        target.setRotation(qt);
        target.setScale(v3b);
        socket = new cc.SkeletalAnimation.Socket(path, target);
        out.push(socket);
    }
    model.parent = socket.target;
}
const skinRootNotCalculated = -2;
const skinRootAbsent = -1;
const supportedExtensions = new Set([
    // Sort please
    'KHR_draco_mesh_compression',
    'KHR_materials_pbrSpecularGlossiness',
    'KHR_materials_unlit',
    'KHR_texture_transform',
]);
var AppId;
(function (AppId) {
    AppId[AppId["UNKNOWN"] = 0] = "UNKNOWN";
    AppId[AppId["ADSK_3DS_MAX"] = 1] = "ADSK_3DS_MAX";
    AppId[AppId["CINEMA4D"] = 3] = "CINEMA4D";
    AppId[AppId["MAYA"] = 5] = "MAYA";
})(AppId || (AppId = {}));
class GltfConverter {
    _gltf;
    _buffers;
    _gltfFilePath;
    get gltf() {
        return this._gltf;
    }
    get path() {
        return this._gltfFilePath;
    }
    get processedMeshes() {
        return this._processedMeshes;
    }
    get fbxMissingImagesId() {
        return this._fbxMissingImagesId;
    }
    static _defaultLogger = (level, error, args) => {
        const message = JSON.stringify({ error, arguments: args }, undefined, 4);
        switch (level) {
            case GltfConverter.LogLevel.Info:
                console.log(message);
                break;
            case GltfConverter.LogLevel.Warning:
                console.warn(message);
                break;
            case GltfConverter.LogLevel.Error:
                console.error(message);
                break;
            case GltfConverter.LogLevel.Debug:
                console.debug(message);
                break;
        }
    };
    _promotedRootNodes = [];
    _nodePathTable;
    /**
     * The parent index of each node.
     */
    _parents = [];
    /**
     * The root node of each skin.
     */
    _skinRoots = [];
    _logger;
    _processedMeshes = [];
    _socketMappings = new Map();
    _fbxMissingImagesId = [];
    constructor(_gltf, _buffers, _gltfFilePath, options) {
        this._gltf = _gltf;
        this._buffers = _buffers;
        this._gltfFilePath = _gltfFilePath;
        options = options || {};
        this._logger = options.logger || GltfConverter._defaultLogger;
        this._gltf.extensionsRequired?.forEach((extensionRequired) => this._warnIfExtensionNotSupported(extensionRequired, true));
        this._gltf.extensionsUsed?.forEach((extensionUsed) => {
            if (!this._gltf.extensionsRequired?.includes(extensionUsed)) {
                // We've warned it before.
                this._warnIfExtensionNotSupported(extensionUsed, false);
            }
        });
        if (options.promoteSingleRootNode) {
            this._promoteSingleRootNodes();
        }
        // SubAsset importers are NOT guaranteed to be executed in-order
        // so all the interdependent data should be created right here
        // We require the scene graph is a disjoint union of strict trees.
        // This is also the requirement in glTf 2.0.
        if (this._gltf.nodes !== undefined) {
            this._parents = new Array(this._gltf.nodes.length).fill(-1);
            this._gltf.nodes.forEach((node, iNode) => {
                if (node.children !== undefined) {
                    for (const iChildNode of node.children) {
                        this._parents[iChildNode] = iNode;
                    }
                }
            });
        }
        if (this._gltf.skins) {
            this._skinRoots = new Array(this._gltf.skins.length).fill(skinRootNotCalculated);
        }
        this._nodePathTable = this._createNodePathTable();
        const userData = options.userData || {};
        if (this._gltf.meshes) {
            // split the meshes
            const normals = userData.normals ?? interface_1.NormalImportSetting.require;
            const tangents = userData.tangents ?? interface_1.TangentImportSetting.require;
            const morphNormals = userData.morphNormals ?? interface_1.NormalImportSetting.exclude;
            for (let i = 0; i < this._gltf.meshes.length; i++) {
                const gltfMesh = this._gltf.meshes[i];
                const minPosition = new cc_1.Vec3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                const maxPosition = new cc_1.Vec3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
                const { geometries, materialIndices, jointMaps } = pp_geometry_1.PPGeometry.skinningProcess(gltfMesh.primitives.map((gltfPrimitive, primitiveIndex) => {
                    const ppGeometry = this._readPrimitive(gltfPrimitive, i, primitiveIndex);
                    // If there are more than 4 joints, we should reduce it
                    // since our engine currently can process only up to 4 joints.
                    ppGeometry.reduceJointInfluences();
                    this._applySettings(ppGeometry, normals, tangents, morphNormals, primitiveIndex, i);
                    this._readBounds(gltfPrimitive, v3Min, v3Max);
                    cc_1.Vec3.min(minPosition, minPosition, v3Min);
                    cc_1.Vec3.max(maxPosition, maxPosition, v3Max);
                    ppGeometry.sanityCheck();
                    return ppGeometry;
                }), userData.disableMeshSplit === false ? false : true);
                this._processedMeshes.push({ geometries, materialIndices, jointMaps, minPosition, maxPosition });
            }
        }
        if (this._gltf.nodes && this._gltf.skins) {
            const nodes = this._gltf.nodes;
            const candidates = [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.mesh !== undefined && node.skin === undefined) {
                    candidates.push(i);
                }
            }
            for (let i = 0; i < candidates.length; i++) {
                const candidate = candidates[i];
                if (candidates.some((node) => this._isAncestorOf(node, candidate))) {
                    candidates[i] = candidates[candidates.length - 1];
                    candidates.length--;
                    i--;
                }
            }
            for (let i = 0; i < candidates.length; i++) {
                const node = candidates[i];
                const parent = nodes[this._getParent(node)];
                if (parent) {
                    this._socketMappings.set(this._getNodePath(node), parent.name + ' Socket/' + nodes[node].name);
                }
            }
        }
    }
    createMesh(iGltfMesh, bGenerateLightmapUV = false, bAddVertexColor = false) {
        const processedMesh = this._processedMeshes[iGltfMesh];
        const glTFMesh = this._gltf.meshes[iGltfMesh];
        const bufferBlob = new BufferBlob();
        const vertexBundles = new Array();
        const primitives = processedMesh.geometries.map((ppGeometry, primitiveIndex) => {
            const { vertexCount, vertexStride, formats, vertexBuffer } = interleaveVertices(ppGeometry, bGenerateLightmapUV, bAddVertexColor);
            bufferBlob.setNextAlignment(0);
            vertexBundles.push({
                view: {
                    offset: bufferBlob.getLength(),
                    length: vertexBuffer.byteLength,
                    count: vertexCount,
                    stride: vertexStride,
                },
                attributes: formats,
            });
            bufferBlob.addBuffer(vertexBuffer);
            const primitive = {
                primitiveMode: ppGeometry.primitiveMode,
                jointMapIndex: ppGeometry.jointMapIndex,
                vertexBundelIndices: [primitiveIndex],
            };
            if (ppGeometry.indices !== undefined) {
                const indices = ppGeometry.indices;
                bufferBlob.setNextAlignment(indices.BYTES_PER_ELEMENT);
                primitive.indexView = {
                    offset: bufferBlob.getLength(),
                    length: indices.byteLength,
                    count: indices.length,
                    stride: indices.BYTES_PER_ELEMENT,
                };
                bufferBlob.addBuffer(indices.buffer);
            }
            return primitive;
        });
        const meshStruct = {
            primitives,
            vertexBundles,
            minPosition: processedMesh.minPosition,
            maxPosition: processedMesh.maxPosition,
            jointMaps: processedMesh.jointMaps,
        };
        const exportMorph = true;
        if (exportMorph) {
            const subMeshMorphs = processedMesh.geometries.map((ppGeometry) => {
                let nTargets = 0;
                const attributes = [];
                ppGeometry.forEachAttribute((attribute) => {
                    if (!attribute.morphs) {
                        return;
                    }
                    if (nTargets === 0) {
                        nTargets = attribute.morphs.length;
                    }
                    else if (nTargets !== attribute.morphs.length) {
                        throw new Error('Bad morph...');
                    }
                    attributes.push(attribute);
                });
                if (nTargets === 0) {
                    return null;
                }
                const targets = new Array(nTargets);
                for (let iTarget = 0; iTarget < nTargets; ++iTarget) {
                    targets[iTarget] = {
                        displacements: attributes.map((attribute) => {
                            const attributeMorph = attribute.morphs[iTarget];
                            // Align as requirement of corresponding typed array.
                            bufferBlob.setNextAlignment(attributeMorph.BYTES_PER_ELEMENT);
                            const offset = bufferBlob.getLength();
                            bufferBlob.addBuffer(attributeMorph.buffer);
                            return {
                                offset,
                                length: attributeMorph.byteLength,
                                stride: attributeMorph.BYTES_PER_ELEMENT,
                                count: attributeMorph.length,
                            };
                        }),
                    };
                }
                return {
                    attributes: attributes.map((attribute) => (0, pp_geometry_1.getGfxAttributeName)(attribute)), // TODO
                    targets,
                };
            });
            const firstNonNullSubMeshMorph = subMeshMorphs.find((subMeshMorph) => subMeshMorph !== null);
            if (firstNonNullSubMeshMorph) {
                assertGlTFConformance(subMeshMorphs.every((subMeshMorph) => !subMeshMorph || subMeshMorph.targets.length === firstNonNullSubMeshMorph.targets.length), 'glTF expects that every primitive has same number of targets');
                if (subMeshMorphs.length !== 0) {
                    assertGlTFConformance(glTFMesh.weights === undefined || glTFMesh.weights.length === firstNonNullSubMeshMorph.targets.length, 'Number of "weights" mismatch number of morph targets');
                }
                meshStruct.morph = {
                    subMeshMorphs,
                    weights: glTFMesh.weights,
                };
                // https://github.com/KhronosGroup/glTF/pull/1631
                // > Implementation note: A significant number of authoring and client implementations associate names with morph targets.
                // > While the glTF 2.0 specification currently does not provide a way to specify names,
                // > most tools use an array of strings, mesh.extras.targetNames, for this purpose.
                // > The targetNames array and all primitive targets arrays must have the same length.
                if (typeof glTFMesh.extras === 'object' && Array.isArray(glTFMesh.extras.targetNames)) {
                    const targetNames = glTFMesh.extras.targetNames;
                    if (targetNames.length === firstNonNullSubMeshMorph.targets.length &&
                        targetNames.every((elem) => typeof elem === 'string')) {
                        meshStruct.morph.targetNames = targetNames.slice();
                    }
                }
            }
        }
        const mesh = new cc.Mesh();
        mesh.name = this._getGltfXXName(GltfAssetKind.Mesh, iGltfMesh);
        mesh.assign(meshStruct, bufferBlob.getCombined());
        mesh.hash; // serialize hashes
        return mesh;
    }
    createSkeleton(iGltfSkin, sortMap) {
        const gltfSkin = this._gltf.skins[iGltfSkin];
        const skeleton = new cc.Skeleton();
        skeleton.name = this._getGltfXXName(GltfAssetKind.Skin, iGltfSkin);
        // @ts-ignore TS2551
        skeleton._joints = gltfSkin.joints.map((j) => this._mapToSocketPath(this._getNodePath(j)));
        if (gltfSkin.inverseBindMatrices !== undefined) {
            const inverseBindMatricesAccessor = this._gltf.accessors[gltfSkin.inverseBindMatrices];
            if (inverseBindMatricesAccessor.componentType !== glTF_constants_1.GltfAccessorComponentType.FLOAT || inverseBindMatricesAccessor.type !== 'MAT4') {
                throw new Error('The inverse bind matrix should be floating-point 4x4 matrix.');
            }
            const bindposes = new Array(gltfSkin.joints.length);
            const data = new Float32Array(bindposes.length * 16);
            this._readAccessor(inverseBindMatricesAccessor, createDataViewFromTypedArray(data));
            assertGlTFConformance(data.length === 16 * bindposes.length, 'Wrong data in bind-poses accessor.');
            for (let i = 0; i < bindposes.length; ++i) {
                bindposes[i] = new cc_1.Mat4(data[16 * i + 0], data[16 * i + 1], data[16 * i + 2], data[16 * i + 3], data[16 * i + 4], data[16 * i + 5], data[16 * i + 6], data[16 * i + 7], data[16 * i + 8], data[16 * i + 9], data[16 * i + 10], data[16 * i + 11], data[16 * i + 12], data[16 * i + 13], data[16 * i + 14], data[16 * i + 15]);
            }
            // @ts-ignore TS2551
            skeleton._bindposes = bindposes;
        }
        skeleton.hash; // serialize hashes
        return skeleton;
    }
    getAnimationDuration(iGltfAnimation) {
        const gltfAnimation = this._gltf.animations[iGltfAnimation];
        let duration = 0;
        gltfAnimation.channels.forEach((gltfChannel) => {
            const targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }
            const sampler = gltfAnimation.samplers[gltfChannel.sampler];
            const inputAccessor = this._gltf.accessors[sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        return duration;
    }
    createAnimation(iGltfAnimation) {
        const gltfAnimation = this._gltf.animations[iGltfAnimation];
        const glTFTrsAnimationData = new glTF_animation_utils_1.GlTFTrsAnimationData();
        const getJointCurveData = (node) => {
            const path = this._mapToSocketPath(this._getNodePath(node));
            return glTFTrsAnimationData.addNodeAnimation(path);
        };
        let duration = 0;
        const keys = new Array();
        const keysMap = new Map();
        const getKeysIndex = (iInputAccessor) => {
            let i = keysMap.get(iInputAccessor);
            if (i === undefined) {
                const inputAccessor = this._gltf.accessors[iInputAccessor];
                const inputs = this._readAccessorIntoArray(inputAccessor);
                i = keys.length;
                keys.push(inputs);
                keysMap.set(iInputAccessor, i);
            }
            return i;
        };
        const tracks = [];
        gltfAnimation.channels.forEach((gltfChannel) => {
            const targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }
            const jointCurveData = getJointCurveData(targetNode);
            const sampler = gltfAnimation.samplers[gltfChannel.sampler];
            const iKeys = getKeysIndex(sampler.input);
            if (gltfChannel.target.path === 'weights') {
                tracks.push(...this._glTFWeightChannelToTracks(gltfAnimation, gltfChannel, keys[iKeys]));
            }
            else {
                this._gltfChannelToCurveData(gltfAnimation, gltfChannel, jointCurveData, keys[iKeys]);
            }
            const inputAccessor = this._gltf.accessors[sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        if (this._gltf.nodes) {
            const standaloneInput = new Float32Array([0.0]);
            const r = new cc_1.Quat();
            const t = new cc_1.Vec3();
            const s = new cc_1.Vec3();
            this._gltf.nodes.forEach((node, nodeIndex) => {
                if (this._promotedRootNodes.includes(nodeIndex)) {
                    // Promoted root nodes should not have animations.
                    return;
                }
                const jointCurveData = getJointCurveData(nodeIndex);
                let m;
                if (node.matrix) {
                    m = this._readNodeMatrix(node.matrix);
                    cc_1.Mat4.toRTS(m, r, t, s);
                }
                if (!jointCurveData.position) {
                    const v = new cc_1.Vec3();
                    if (node.translation) {
                        cc_1.Vec3.set(v, node.translation[0], node.translation[1], node.translation[2]);
                    }
                    else if (m) {
                        cc_1.Vec3.copy(v, t);
                    }
                    jointCurveData.setConstantPosition(v);
                }
                if (!jointCurveData.scale) {
                    const v = new cc_1.Vec3(1, 1, 1);
                    if (node.scale) {
                        cc_1.Vec3.set(v, node.scale[0], node.scale[1], node.scale[2]);
                    }
                    else if (m) {
                        cc_1.Vec3.copy(v, s);
                    }
                    jointCurveData.setConstantScale(v);
                }
                if (!jointCurveData.rotation) {
                    const v = new cc_1.Quat();
                    if (node.rotation) {
                        this._getNodeRotation(node.rotation, v);
                    }
                    else if (m) {
                        cc_1.Quat.copy(v, r);
                    }
                    jointCurveData.setConstantRotation(v);
                }
            });
        }
        const exoticAnimation = glTFTrsAnimationData.createExotic();
        const animationClip = new cc.AnimationClip();
        animationClip.name = this._getGltfXXName(GltfAssetKind.Animation, iGltfAnimation);
        animationClip.wrapMode = cc.AnimationClip.WrapMode.Loop;
        animationClip.duration = duration;
        animationClip.sample = 30;
        animationClip.hash; // serialize hashes
        animationClip.enableTrsBlending = true;
        tracks.forEach((track) => animationClip.addTrack(track));
        animationClip[exotic_animation_1.exoticAnimationTag] = exoticAnimation;
        return animationClip;
    }
    createMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, options) {
        const useVertexColors = options.useVertexColors ?? true;
        const depthWriteInAlphaModeBlend = options.depthWriteInAlphaModeBlend ?? false;
        const smartMaterialEnabled = options.smartMaterialEnabled ?? false;
        const gltfMaterial = this._gltf.materials[iGltfMaterial];
        const isUnlit = (gltfMaterial.extensions && gltfMaterial.extensions.KHR_materials_unlit) !== undefined;
        const documentExtras = this._gltf.extras;
        // Transfer dcc default material attributes.
        if (smartMaterialEnabled) {
            let appName = '';
            if (typeof documentExtras === 'object' && documentExtras && 'FBX-glTF-conv' in documentExtras) {
                const fbxExtras = documentExtras['FBX-glTF-conv'];
                // ["FBX-glTF-conv"].fbxFileHeaderInfo.sceneInfo.original.applicationName
                if (typeof fbxExtras.fbxFileHeaderInfo !== 'undefined') {
                    if (typeof fbxExtras.fbxFileHeaderInfo.sceneInfo !== 'undefined') {
                        appName = fbxExtras.fbxFileHeaderInfo.sceneInfo.original.applicationName;
                    }
                    const APP_NAME_REGEX_BLENDER = /Blender/;
                    const APP_NAME_REGEX_MAYA = /Maya/;
                    const APP_NAME_REGEX_3DSMAX = /Max/;
                    const APP_NAME_REGEX_CINEMA4D = /Cinema/;
                    const APP_NAME_REGEX_MIXAMO = /mixamo/;
                    const rawData = gltfMaterial.extras['FBX-glTF-conv'].raw;
                    // debugger;
                    if (APP_NAME_REGEX_BLENDER.test(appName) || APP_NAME_REGEX_MIXAMO.test(appName)) {
                        if (rawData.type === 'phong') {
                            return this._convertBlenderPBRMaterial(gltfMaterial, iGltfMaterial, gltfAssetFinder, effectGetter);
                        }
                    }
                    else if (APP_NAME_REGEX_MAYA.test(appName)) {
                        if (rawData.type === 'phong' || rawData.type === 'lambert') {
                            return this._convertPhongMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, AppId.MAYA, rawData.properties);
                        }
                        else if (rawData.properties.Maya) {
                            if (rawData.properties.Maya.value.TypeId.value === 1398031443) {
                                return this._convertMayaStandardSurface(iGltfMaterial, gltfAssetFinder, effectGetter, rawData.properties.Maya.value);
                            }
                        }
                    }
                    else if (APP_NAME_REGEX_3DSMAX.test(appName)) {
                        if (rawData.type === 'phong' || rawData.type === 'lambert') {
                            return this._convertPhongMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, AppId.ADSK_3DS_MAX, rawData.properties);
                        }
                        if (rawData.properties['3dsMax'].value.ORIGINAL_MTL) {
                            if (rawData.properties['3dsMax'].value.ORIGINAL_MTL.value === 'PHYSICAL_MTL') {
                                return this._convertMaxPhysicalMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, rawData.properties['3dsMax'].value.Parameters.value);
                            }
                        }
                    }
                    else if (APP_NAME_REGEX_CINEMA4D.test(appName)) {
                        if (rawData.type === 'phong' || rawData.type === 'lambert') {
                            return this._convertPhongMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, AppId.CINEMA4D, rawData.properties);
                        }
                    }
                    if (rawData.type === 'phong' || rawData.type === 'lambert') {
                        return this._convertPhongMaterial(iGltfMaterial, gltfAssetFinder, effectGetter, AppId.UNKNOWN, rawData.properties);
                    }
                }
                else {
                    console.debug('Failed to read fbx header info, default material was used');
                }
            }
            else {
                console.debug('Failed to read fbx info.');
            }
        }
        else {
            const physicalMaterial = (() => {
                if (!(0, extras_1.hasOriginalMaterialExtras)(gltfMaterial.extras)) {
                    return null;
                }
                const { originalMaterial } = gltfMaterial.extras['FBX-glTF-conv'];
                if ((0, extras_1.isAdsk3dsMaxPhysicalMaterial)(originalMaterial)) {
                    return this._convertAdskPhysicalMaterial(gltfMaterial, iGltfMaterial, gltfAssetFinder, effectGetter, originalMaterial);
                }
                else {
                    return null;
                }
            })();
            if (physicalMaterial) {
                return physicalMaterial;
            }
        }
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, iGltfMaterial);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter(`db://internal/effects/${isUnlit ? 'builtin-unlit' : 'builtin-standard'}.effect`);
        const defines = {};
        const props = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        if (this._gltf.meshes) {
            for (let i = 0; i < this._gltf.meshes.length; i++) {
                const mesh = this._gltf.meshes[i];
                for (let j = 0; j < mesh.primitives.length; j++) {
                    const prim = mesh.primitives[j];
                    if (prim.material === iGltfMaterial) {
                        if (prim.attributes["COLOR_0" /* GltfSemanticName.COLOR_0 */] && useVertexColors) {
                            defines['USE_VERTEX_COLOR'] = true;
                        }
                        if (prim.attributes["TEXCOORD_1" /* GltfSemanticName.TEXCOORD_1 */]) {
                            defines['HAS_SECOND_UV'] = true;
                        }
                    }
                }
            }
        }
        // gltf Materials: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/README.md
        let hasPbrMetallicRoughness = false;
        if (gltfMaterial.pbrMetallicRoughness) {
            const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
            if (pbrMetallicRoughness.baseColorTexture !== undefined) {
                hasPbrMetallicRoughness = true;
                const mainTexture = gltfAssetFinder.find('textures', pbrMetallicRoughness.baseColorTexture.index, cc.Texture2D);
                defines[isUnlit ? 'USE_TEXTURE' : 'USE_ALBEDO_MAP'] = mainTexture ? true : false;
                props['mainTexture'] = mainTexture;
                if (pbrMetallicRoughness.baseColorTexture.texCoord) {
                    defines['ALBEDO_UV'] = 'v_uv1';
                }
                if (pbrMetallicRoughness.baseColorTexture.extensions !== undefined) {
                    if (pbrMetallicRoughness.baseColorTexture.extensions.KHR_texture_transform) {
                        props['tilingOffset'] = this._khrTextureTransformToTiling(pbrMetallicRoughness.baseColorTexture.extensions.KHR_texture_transform);
                    }
                }
            }
            if (pbrMetallicRoughness.baseColorFactor) {
                hasPbrMetallicRoughness = true;
                const c = pbrMetallicRoughness.baseColorFactor;
                if (isUnlit) {
                    props['mainColor'] = new cc_1.Vec4(c[0], c[1], c[2], 1);
                }
                else {
                    props['albedoScale'] = new cc_1.Vec3(c[0], c[1], c[2]);
                }
            }
            if (pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                hasPbrMetallicRoughness = true;
                defines['USE_PBR_MAP'] = true;
                props['pbrMap'] = gltfAssetFinder.find('textures', pbrMetallicRoughness.metallicRoughnessTexture.index, cc.Texture2D);
                props['metallic'] = 1;
                props['roughness'] = 1;
            }
            if (pbrMetallicRoughness.metallicFactor !== undefined) {
                hasPbrMetallicRoughness = true;
                props['metallic'] = pbrMetallicRoughness.metallicFactor;
            }
            if (pbrMetallicRoughness.roughnessFactor !== undefined) {
                hasPbrMetallicRoughness = true;
                props['roughness'] = pbrMetallicRoughness.roughnessFactor;
            }
        }
        if (!hasPbrMetallicRoughness) {
            if (gltfMaterial.extensions?.KHR_materials_pbrSpecularGlossiness) {
                return this._convertGltfPbrSpecularGlossiness(gltfMaterial, iGltfMaterial, gltfAssetFinder, effectGetter, depthWriteInAlphaModeBlend);
            }
        }
        if (gltfMaterial.normalTexture !== undefined) {
            const pbrNormalTexture = gltfMaterial.normalTexture;
            if (pbrNormalTexture.index !== undefined) {
                defines['USE_NORMAL_MAP'] = true;
                props['normalMap'] = gltfAssetFinder.find('textures', pbrNormalTexture.index, cc.Texture2D);
                if (pbrNormalTexture.scale !== undefined) {
                    props['normalStrenth'] = pbrNormalTexture.scale;
                }
            }
        }
        props['occlusion'] = 0.0;
        if (gltfMaterial.occlusionTexture) {
            const pbrOcclusionTexture = gltfMaterial.occlusionTexture;
            if (pbrOcclusionTexture.index !== undefined) {
                defines['USE_OCCLUSION_MAP'] = true;
                props['occlusionMap'] = gltfAssetFinder.find('textures', pbrOcclusionTexture.index, cc.Texture2D);
                if (pbrOcclusionTexture.strength !== undefined) {
                    props['occlusion'] = pbrOcclusionTexture.strength;
                }
            }
        }
        if (gltfMaterial.emissiveTexture !== undefined) {
            defines['USE_EMISSIVE_MAP'] = true;
            if (gltfMaterial.emissiveTexture.texCoord) {
                defines['EMISSIVE_UV'] = 'v_uv1';
            }
            props['emissiveMap'] = gltfAssetFinder.find('textures', gltfMaterial.emissiveTexture.index, cc.Texture2D);
        }
        if (gltfMaterial.emissiveFactor !== undefined) {
            const v = gltfMaterial.emissiveFactor;
            props['emissive'] = this._normalizeArrayToCocosColor(v)[1];
        }
        if (gltfMaterial.doubleSided) {
            states.rasterizerState.cullMode = cc_1.gfx.CullMode.NONE;
        }
        switch (gltfMaterial.alphaMode) {
            case 'BLEND': {
                const blendState = states.blendState.targets[0];
                blendState.blend = true;
                blendState.blendSrc = cc_1.gfx.BlendFactor.SRC_ALPHA;
                blendState.blendDst = cc_1.gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;
                blendState.blendDstAlpha = cc_1.gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;
                states.depthStencilState.depthWrite = depthWriteInAlphaModeBlend;
                break;
            }
            case 'MASK': {
                const alphaCutoff = gltfMaterial.alphaCutoff === undefined ? 0.5 : gltfMaterial.alphaCutoff;
                defines['USE_ALPHA_TEST'] = true;
                props['alphaThreshold'] = alphaCutoff;
                break;
            }
            case 'OPAQUE':
            case undefined:
                break;
            default:
                this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedAlphaMode, {
                    mode: gltfMaterial.alphaMode,
                    material: iGltfMaterial,
                });
                break;
        }
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [props];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    getTextureParameters(gltfTexture, userData) {
        const convertWrapMode = (gltfWrapMode) => {
            if (gltfWrapMode === undefined) {
                gltfWrapMode = glTF_constants_1.GltfWrapMode.__DEFAULT;
            }
            switch (gltfWrapMode) {
                case glTF_constants_1.GltfWrapMode.CLAMP_TO_EDGE:
                    return 'clamp-to-edge';
                case glTF_constants_1.GltfWrapMode.MIRRORED_REPEAT:
                    return 'mirrored-repeat';
                case glTF_constants_1.GltfWrapMode.REPEAT:
                    return 'repeat';
                default:
                    this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedTextureParameter, {
                        type: 'wrapMode',
                        value: gltfWrapMode,
                        fallback: glTF_constants_1.GltfWrapMode.REPEAT,
                        sampler: gltfTexture.sampler,
                        texture: this._gltf.textures.indexOf(gltfTexture),
                    });
                    return 'repeat';
            }
        };
        const convertMagFilter = (gltfFilter) => {
            switch (gltfFilter) {
                case glTF_constants_1.GltfTextureMagFilter.NEAREST:
                    return 'nearest';
                case glTF_constants_1.GltfTextureMagFilter.LINEAR:
                    return 'linear';
                default:
                    this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedTextureParameter, {
                        type: 'magFilter',
                        value: gltfFilter,
                        fallback: glTF_constants_1.GltfTextureMagFilter.LINEAR,
                        sampler: gltfTexture.sampler,
                        texture: this._gltf.textures.indexOf(gltfTexture),
                    });
                    return 'linear';
            }
        };
        // Also convert mip filter.
        const convertMinFilter = (gltfFilter) => {
            switch (gltfFilter) {
                case glTF_constants_1.GltfTextureMinFilter.NEAREST:
                    return ['nearest', 'none'];
                case glTF_constants_1.GltfTextureMinFilter.LINEAR:
                    return ['linear', 'none'];
                case glTF_constants_1.GltfTextureMinFilter.NEAREST_MIPMAP_NEAREST:
                    return ['nearest', 'nearest'];
                case glTF_constants_1.GltfTextureMinFilter.LINEAR_MIPMAP_NEAREST:
                    return ['linear', 'nearest'];
                case glTF_constants_1.GltfTextureMinFilter.NEAREST_MIPMAP_LINEAR:
                    return ['nearest', 'linear'];
                case glTF_constants_1.GltfTextureMinFilter.LINEAR_MIPMAP_LINEAR:
                    return ['linear', 'linear'];
                default:
                    this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedTextureParameter, {
                        type: 'minFilter',
                        value: gltfFilter,
                        fallback: glTF_constants_1.GltfTextureMinFilter.LINEAR,
                        sampler: gltfTexture.sampler,
                        texture: this._gltf.textures.indexOf(gltfTexture),
                    });
                    return ['linear', 'none'];
            }
        };
        if (gltfTexture.sampler === undefined) {
            userData.wrapModeS = 'repeat';
            userData.wrapModeT = 'repeat';
        }
        else {
            const gltfSampler = this._gltf.samplers[gltfTexture.sampler];
            userData.wrapModeS = convertWrapMode(gltfSampler.wrapS);
            userData.wrapModeT = convertWrapMode(gltfSampler.wrapT);
            userData.magfilter = gltfSampler.magFilter === undefined ? texture_base_1.defaultMagFilter : convertMagFilter(gltfSampler.magFilter);
            userData.minfilter = texture_base_1.defaultMinFilter;
            if (gltfSampler.minFilter !== undefined) {
                const [min, mip] = convertMinFilter(gltfSampler.minFilter);
                userData.minfilter = min;
                userData.mipfilter = mip;
            }
        }
    }
    createScene(iGltfScene, gltfAssetFinder, withTransform = true) {
        const scene = this._getSceneNode(iGltfScene, gltfAssetFinder, withTransform);
        // update skinning root to animation root node
        scene.getComponentsInChildren(cc.SkinnedMeshRenderer).forEach((comp) => (comp.skinningRoot = scene));
        return scene;
    }
    createSockets(sceneNode) {
        const sockets = [];
        for (const pair of this._socketMappings) {
            const node = sceneNode.getChildByPath(pair[0]);
            doCreateSocket(sceneNode, sockets, node);
        }
        return sockets;
    }
    readImageInBufferView(bufferView) {
        return this._readBufferView(bufferView);
    }
    _warnIfExtensionNotSupported(name, required) {
        if (!supportedExtensions.has(name)) {
            this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedExtension, {
                name,
                required,
            });
        }
    }
    _promoteSingleRootNodes() {
        if (this._gltf.nodes === undefined || this._gltf.scenes === undefined) {
            return;
        }
        for (const glTFScene of this._gltf.scenes) {
            if (glTFScene.nodes !== undefined && glTFScene.nodes.length === 1) {
                // If it's the only root node in the scene.
                // We would promote it to the prefab's root(i.e the skinning root).
                // So we cannot include it as part of the joint path or animation target path.
                const rootNodeIndex = glTFScene.nodes[0];
                // We can't perform this operation if the root participates in skinning, or--
                if (this._gltf.skins && this._gltf.skins.some((skin) => skin.joints.includes(rootNodeIndex))) {
                    continue;
                }
                // animation.
                if (this._gltf.animations &&
                    this._gltf.animations.some((animation) => animation.channels.some((channel) => channel.target.node === rootNodeIndex))) {
                    continue;
                }
                this._promotedRootNodes.push(rootNodeIndex);
            }
        }
    }
    _getNodeRotation(rotation, out) {
        cc_1.Quat.set(out, rotation[0], rotation[1], rotation[2], rotation[3]);
        cc_1.Quat.normalize(out, out);
        return out;
    }
    _gltfChannelToCurveData(gltfAnimation, gltfChannel, jointCurveData, input) {
        let propName;
        if (gltfChannel.target.path === glTF_constants_1.GltfAnimationChannelTargetPath.translation) {
            propName = 'position';
        }
        else if (gltfChannel.target.path === glTF_constants_1.GltfAnimationChannelTargetPath.rotation) {
            propName = 'rotation';
        }
        else if (gltfChannel.target.path === glTF_constants_1.GltfAnimationChannelTargetPath.scale) {
            propName = 'scale';
        }
        else {
            this._logger(GltfConverter.LogLevel.Error, GltfConverter.ConverterError.UnsupportedChannelPath, {
                channel: gltfAnimation.channels.indexOf(gltfChannel),
                animation: this._gltf.animations.indexOf(gltfAnimation),
                path: gltfChannel.target.path,
            });
            return;
        }
        const gltfSampler = gltfAnimation.samplers[gltfChannel.sampler];
        const interpolation = gltfSampler.interpolation ?? glTF_constants_1.GlTfAnimationInterpolation.LINEAR;
        switch (interpolation) {
            case glTF_constants_1.GlTfAnimationInterpolation.STEP:
            case glTF_constants_1.GlTfAnimationInterpolation.LINEAR:
            case glTF_constants_1.GlTfAnimationInterpolation.CUBIC_SPLINE:
                break;
            default:
                return;
        }
        const output = this._readAccessorIntoArrayAndNormalizeAsFloat(this._gltf.accessors[gltfSampler.output]);
        jointCurveData[propName] = new glTF_animation_utils_1.GlTFTrsTrackData(interpolation, input, output);
    }
    _glTFWeightChannelToTracks(gltfAnimation, gltfChannel, times) {
        const gltfSampler = gltfAnimation.samplers[gltfChannel.sampler];
        const outputs = this._readAccessorIntoArrayAndNormalizeAsFloat(this._gltf.accessors[gltfSampler.output]);
        const targetNode = this._gltf.nodes[gltfChannel.target.node];
        const targetProcessedMesh = this._processedMeshes[targetNode.mesh];
        const tracks = new Array();
        const nSubMeshes = targetProcessedMesh.geometries.length;
        let nTarget = 0;
        for (let iSubMesh = 0; iSubMesh < nSubMeshes; ++iSubMesh) {
            const geometry = targetProcessedMesh.geometries[iSubMesh];
            if (!geometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.position)) {
                continue;
            }
            const { morphs } = geometry.getAttribute(pp_geometry_1.PPGeometry.StdSemantics.position);
            if (!morphs) {
                continue;
            }
            nTarget = morphs.length;
            break;
        }
        if (nTarget === 0) {
            console.debug(`Morph animation in ${gltfAnimation.name} on node ${this._gltf.nodes[gltfChannel.target.node]}` +
                'is going to be ignored due to lack of morph information in mesh.');
            return [];
        }
        const track = new exotic_animation_1.RealArrayTrack();
        tracks.push(track);
        track.path = new cc.animation.TrackPath()
            .toHierarchy(this._mapToSocketPath(this._getNodePath(gltfChannel.target.node)))
            .toComponent(cc.js.getClassName(cc.MeshRenderer));
        track.proxy = new cc.animation.MorphWeightsAllValueProxy();
        track.elementCount = nTarget;
        for (let iTarget = 0; iTarget < nTarget; ++iTarget) {
            const { curve } = track.channels()[iTarget];
            const frameValues = Array.from({ length: times.length }, (_, index) => {
                const value = outputs[nTarget * index + iTarget];
                const keyframeValue = { value, interpolationMode: cc.RealInterpolationMode.LINEAR };
                return keyframeValue;
            });
            curve.assignSorted(Array.from(times), frameValues);
        }
        return tracks;
    }
    _getParent(node) {
        return this._parents[node];
    }
    _getRootParent(node) {
        for (let parent = node; parent >= 0; parent = this._getParent(node)) {
            node = parent;
        }
        return node;
    }
    _commonRoot(nodes) {
        let minPathLen = Infinity;
        const paths = nodes.map((node) => {
            const path = [];
            let curNode = node;
            while (curNode >= 0) {
                path.unshift(curNode);
                curNode = this._getParent(curNode);
            }
            minPathLen = Math.min(minPathLen, path.length);
            return path;
        });
        if (paths.length === 0) {
            return -1;
        }
        const commonPath = [];
        for (let i = 0; i < minPathLen; ++i) {
            const n = paths[0][i];
            if (paths.every((path) => path[i] === n)) {
                commonPath.push(n);
            }
            else {
                break;
            }
        }
        if (commonPath.length === 0) {
            return -1;
        }
        return commonPath[commonPath.length - 1];
    }
    _getSkinRoot(skin) {
        let result = this._skinRoots[skin];
        if (result === skinRootNotCalculated) {
            result = this._commonRoot(this._gltf.skins[skin].joints);
            this._skinRoots[skin] = result;
        }
        return result;
    }
    _readPrimitive(glTFPrimitive, meshIndex, primitiveIndex) {
        let decodedDracoGeometry = null;
        if (glTFPrimitive.extensions) {
            for (const extensionName of Object.keys(glTFPrimitive.extensions)) {
                const extension = glTFPrimitive.extensions[extensionName];
                switch (extensionName) {
                    case 'KHR_draco_mesh_compression':
                        decodedDracoGeometry = this._decodeDracoGeometry(glTFPrimitive, extension);
                        break;
                }
            }
        }
        const primitiveMode = this._getPrimitiveMode(glTFPrimitive.mode === undefined ? glTF_constants_1.GltfPrimitiveMode.__DEFAULT : glTFPrimitive.mode);
        let indices;
        if (glTFPrimitive.indices !== undefined) {
            let data;
            if (decodedDracoGeometry && decodedDracoGeometry.indices) {
                data = decodedDracoGeometry.indices;
            }
            else {
                const indicesAccessor = this._gltf.accessors[glTFPrimitive.indices];
                data = this._readAccessorIntoArray(indicesAccessor);
            }
            indices = data;
        }
        if (!("POSITION" /* GltfSemanticName.POSITION */ in glTFPrimitive.attributes)) {
            throw new Error('The primitive doesn\'t contains positions.');
        }
        // TODO: mismatch in glTF-sample-module:Monster-Draco?
        const nVertices = decodedDracoGeometry
            ? decodedDracoGeometry.vertices["POSITION" /* GltfSemanticName.POSITION */].length / 3
            : this._gltf.accessors[glTFPrimitive.attributes["POSITION" /* GltfSemanticName.POSITION */]].count;
        const ppGeometry = new pp_geometry_1.PPGeometry(nVertices, primitiveMode, indices);
        for (const attributeName of Object.getOwnPropertyNames(glTFPrimitive.attributes)) {
            const attributeAccessor = this._gltf.accessors[glTFPrimitive.attributes[attributeName]];
            const semantic = glTFAttributeNameToPP(attributeName);
            let data;
            if (decodedDracoGeometry && attributeName in decodedDracoGeometry.vertices) {
                data = decodedDracoGeometry.vertices[attributeName];
            }
            else {
                data = this._readAccessorIntoArray(attributeAccessor);
            }
            if (this._shouldDecodeAttributeAsNormalizedFloat(semantic, attributeAccessor)) {
                data = this._normalizeTypedArrayAsFloat(data);
            }
            const components = this._getComponentsPerAttribute(attributeAccessor.type);
            ppGeometry.setAttribute(semantic, data, components, this._getAttributeNormalizedFlag(attributeAccessor, data));
        }
        if (glTFPrimitive.targets) {
            const attributes = Object.getOwnPropertyNames(glTFPrimitive.targets[0]);
            for (const attribute of attributes) {
                // Check if the morph-attributes are valid.
                const semantic = glTFAttributeNameToPP(attribute);
                if (!pp_geometry_1.PPGeometry.isStdSemantic(semantic) ||
                    ![pp_geometry_1.PPGeometry.StdSemantics.position, pp_geometry_1.PPGeometry.StdSemantics.normal, pp_geometry_1.PPGeometry.StdSemantics.tangent].includes(semantic)) {
                    throw new Error(`Only position, normal, tangent attribute are morph-able, but provide ${attribute}`);
                }
                assertGlTFConformance(ppGeometry.hasAttribute(semantic), `Primitive do not have attribute ${attribute} for morph.`);
                const ppAttribute = ppGeometry.getAttribute(semantic);
                ppAttribute.morphs = new Array(glTFPrimitive.targets.length);
                for (let iTarget = 0; iTarget < glTFPrimitive.targets.length; ++iTarget) {
                    const morphTarget = glTFPrimitive.targets[iTarget];
                    // All targets shall have same morph-attributes.
                    assertGlTFConformance(attribute in morphTarget, 'Morph attributes in all target must be same.');
                    // Extracts the displacements.
                    const attributeAccessor = this._gltf.accessors[morphTarget[attribute]];
                    const morphDisplacement = this._readAccessorIntoArray(attributeAccessor);
                    ppAttribute.morphs[iTarget] = morphDisplacement;
                    // const mainData = ppGeometry.getAttribute(semantic).data;
                    // assertGlTFConformance(ppGeometry.length === data.length,
                    //     `Count of morph attribute ${targetAttribute} mismatch which in primitive.`);
                }
            }
            // If all targets are zero, which means no any displacement, we exclude it from morphing.
            // Should we?
            // Edit: in cocos/3d-tasks#11585 we can see that
            // in mesh 0 there are 11 primitives, 8 of them have empty morph data.
            // So I decide to silence the warning and leave it as `verbose`.
            let nonEmptyMorph = false;
            ppGeometry.forEachAttribute((attribute) => {
                if (!nonEmptyMorph &&
                    attribute.morphs &&
                    attribute.morphs.some((displacement) => displacement.some((v) => v !== 0))) {
                    nonEmptyMorph = true;
                }
            });
            if (!nonEmptyMorph) {
                this._logger(GltfConverter.LogLevel.Debug, GltfConverter.ConverterError.EmptyMorph, {
                    mesh: meshIndex,
                    primitive: primitiveIndex,
                });
            }
        }
        return ppGeometry;
    }
    _decodeDracoGeometry(glTFPrimitive, extension) {
        const bufferView = this._gltf.bufferViews[extension.bufferView];
        const buffer = this._buffers[bufferView.buffer];
        const bufferViewOffset = bufferView.byteOffset === undefined ? 0 : bufferView.byteOffset;
        const compressedData = buffer.slice(bufferViewOffset, bufferViewOffset + bufferView.byteLength);
        const options = {
            buffer: new Int8Array(compressedData),
            attributes: {},
        };
        if (glTFPrimitive.indices !== undefined) {
            options.indices = this._getAttributeBaseTypeStorage(this._gltf.accessors[glTFPrimitive.indices].componentType);
        }
        for (const attributeName of Object.keys(extension.attributes)) {
            if (attributeName in glTFPrimitive.attributes) {
                const accessor = this._gltf.accessors[glTFPrimitive.attributes[attributeName]];
                options.attributes[attributeName] = {
                    uniqueId: extension.attributes[attributeName],
                    storageConstructor: this._getAttributeBaseTypeStorage(accessor.componentType),
                    components: this._getComponentsPerAttribute(accessor.type),
                };
            }
        }
        return (0, khr_draco_mesh_compression_1.decodeDracoGeometry)(options);
    }
    _readBounds(glTFPrimitive, minPosition, maxPosition) {
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#accessors-bounds
        // > JavaScript client implementations should convert JSON-parsed floating-point doubles to single precision,
        // > when componentType is 5126 (FLOAT).
        const iPositionAccessor = glTFPrimitive.attributes["POSITION" /* GltfSemanticName.POSITION */];
        if (iPositionAccessor !== undefined) {
            const positionAccessor = this._gltf.accessors[iPositionAccessor];
            if (positionAccessor.min) {
                if (positionAccessor.componentType === glTF_constants_1.GltfAccessorComponentType.FLOAT) {
                    minPosition.x = Math.fround(positionAccessor.min[0]);
                    minPosition.y = Math.fround(positionAccessor.min[1]);
                    minPosition.z = Math.fround(positionAccessor.min[2]);
                }
                else {
                    minPosition.x = positionAccessor.min[0];
                    minPosition.y = positionAccessor.min[1];
                    minPosition.z = positionAccessor.min[2];
                }
            }
            if (positionAccessor.max) {
                if (positionAccessor.componentType === glTF_constants_1.GltfAccessorComponentType.FLOAT) {
                    maxPosition.x = Math.fround(positionAccessor.max[0]);
                    maxPosition.y = Math.fround(positionAccessor.max[1]);
                    maxPosition.z = Math.fround(positionAccessor.max[2]);
                }
                else {
                    maxPosition.x = positionAccessor.max[0];
                    maxPosition.y = positionAccessor.max[1];
                    maxPosition.z = positionAccessor.max[2];
                }
            }
        }
    }
    _applySettings(ppGeometry, normalImportSetting, tangentImportSetting, morphNormalsImportSetting, primitiveIndex, meshIndex) {
        if (normalImportSetting === interface_1.NormalImportSetting.recalculate ||
            (normalImportSetting === interface_1.NormalImportSetting.require && !ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal))) {
            const normals = ppGeometry.calculateNormals();
            ppGeometry.setAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal, normals, 3);
        }
        else if (normalImportSetting === interface_1.NormalImportSetting.exclude && ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal)) {
            ppGeometry.deleteAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal);
        }
        if (tangentImportSetting === interface_1.TangentImportSetting.recalculate ||
            (tangentImportSetting === interface_1.TangentImportSetting.require && !ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.tangent))) {
            if (!ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal)) {
                this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.FailedToCalculateTangents, {
                    reason: 'normal',
                    primitive: primitiveIndex,
                    mesh: meshIndex,
                });
            }
            else if (!ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.texcoord)) {
                this._logger(GltfConverter.LogLevel.Debug, GltfConverter.ConverterError.FailedToCalculateTangents, {
                    reason: 'uv',
                    primitive: primitiveIndex,
                    mesh: meshIndex,
                });
            }
            else {
                const tangents = ppGeometry.calculateTangents();
                ppGeometry.setAttribute(pp_geometry_1.PPGeometry.StdSemantics.tangent, tangents, 4);
            }
        }
        else if (tangentImportSetting === interface_1.TangentImportSetting.exclude && ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.tangent)) {
            ppGeometry.deleteAttribute(pp_geometry_1.PPGeometry.StdSemantics.tangent);
        }
        if (morphNormalsImportSetting === interface_1.NormalImportSetting.exclude && ppGeometry.hasAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal)) {
            const normalAttribute = ppGeometry.getAttribute(pp_geometry_1.PPGeometry.StdSemantics.normal);
            normalAttribute.morphs = null;
        }
    }
    _readBufferView(bufferView) {
        const buffer = this._buffers[bufferView.buffer];
        return Buffer.from(buffer.buffer, buffer.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
    }
    _readAccessorIntoArray(gltfAccessor) {
        const storageConstructor = this._getAttributeBaseTypeStorage(gltfAccessor.componentType);
        const result = new storageConstructor(gltfAccessor.count * this._getComponentsPerAttribute(gltfAccessor.type));
        this._readAccessor(gltfAccessor, createDataViewFromTypedArray(result));
        if (gltfAccessor.sparse !== undefined) {
            this._applyDeviation(gltfAccessor, result);
        }
        return result;
    }
    _readAccessorIntoArrayAndNormalizeAsFloat(gltfAccessor) {
        return this._normalizeTypedArrayAsFloat(this._readAccessorIntoArray(gltfAccessor));
    }
    _shouldDecodeAttributeAsNormalizedFloat(semantic, gltfAccessor) {
        return (gltfAccessor.normalized === true &&
            pp_geometry_1.PPGeometry.isStdSemantic(semantic) &&
            pp_geometry_1.PPGeometry.StdSemantics.decode(semantic).semantic0 === pp_geometry_1.PPGeometry.StdSemantics.weights);
    }
    _getAttributeNormalizedFlag(gltfAccessor, data) {
        if (data instanceof Float32Array || gltfAccessor.normalized !== true) {
            return undefined;
        }
        return true;
    }
    _normalizeTypedArrayAsFloat(outputs) {
        if (outputs instanceof Float32Array) {
            return outputs;
        }
        const normalizedOutput = new Float32Array(outputs.length);
        const normalize = (() => {
            if (outputs instanceof Int8Array) {
                return (value) => Math.max(value / 127.0, -1.0);
            }
            else if (outputs instanceof Uint8Array) {
                return (value) => value / 255.0;
            }
            else if (outputs instanceof Int16Array) {
                return (value) => Math.max(value / 32767.0, -1.0);
            }
            else if (outputs instanceof Uint16Array) {
                return (value) => value / 65535.0;
            }
            else {
                return (value) => value;
            }
        })();
        for (let i = 0; i < outputs.length; ++i) {
            normalizedOutput[i] = normalize(outputs[i]);
        }
        return normalizedOutput;
    }
    _getSceneNode(iGltfScene, gltfAssetFinder, withTransform = true) {
        const sceneName = this._getGltfXXName(GltfAssetKind.Scene, iGltfScene);
        const gltfScene = this._gltf.scenes[iGltfScene];
        let sceneNode;
        if (!gltfScene.nodes || gltfScene.nodes.length === 0) {
            sceneNode = new cc.Node(sceneName);
        }
        else {
            const glTFSceneRootNodes = gltfScene.nodes;
            const mapping = new Array(this._gltf.nodes.length).fill(null);
            if (gltfScene.nodes.length === 1 && this._promotedRootNodes.includes(gltfScene.nodes[0])) {
                const promotedRootNode = gltfScene.nodes[0];
                sceneNode = this._createEmptyNodeRecursive(promotedRootNode, mapping, withTransform);
            }
            else {
                sceneNode = new cc.Node(sceneName);
                for (const node of gltfScene.nodes) {
                    const root = this._createEmptyNodeRecursive(node, mapping, withTransform);
                    root.parent = sceneNode;
                }
            }
            mapping.forEach((node, iGltfNode) => {
                this._setupNode(iGltfNode, mapping, gltfAssetFinder, sceneNode, glTFSceneRootNodes);
            });
        }
        return sceneNode;
    }
    _createEmptyNodeRecursive(iGltfNode, mapping, withTransform = true) {
        const gltfNode = this._gltf.nodes[iGltfNode];
        const result = this._createEmptyNode(iGltfNode, withTransform);
        if (gltfNode.children !== undefined) {
            for (const child of gltfNode.children) {
                const childResult = this._createEmptyNodeRecursive(child, mapping, withTransform);
                childResult.parent = result;
            }
        }
        mapping[iGltfNode] = result;
        return result;
    }
    _setupNode(iGltfNode, mapping, gltfAssetFinder, sceneNode, glTFSceneRootNodes) {
        const node = mapping[iGltfNode];
        if (node === null) {
            return;
        }
        const gltfNode = this._gltf.nodes[iGltfNode];
        if (gltfNode.mesh !== undefined) {
            let modelComponent = null;
            if (gltfNode.skin === undefined) {
                modelComponent = node.addComponent(cc.MeshRenderer);
            }
            else {
                const skinningModelComponent = node.addComponent(cc.SkinnedMeshRenderer);
                const skeleton = gltfAssetFinder.find('skeletons', gltfNode.skin, cc.Skeleton);
                if (skeleton) {
                    skinningModelComponent.skeleton = skeleton;
                }
                const skinRoot = mapping[this._getSkinRoot(gltfNode.skin)];
                if (skinRoot === null) {
                    // They do not have common root.
                    // This may be caused by root parent nodes of them are different but they are all under same scene.
                    const glTFSkin = this.gltf.skins[gltfNode.skin];
                    const isUnderSameScene = glTFSkin.joints.every((joint) => glTFSceneRootNodes.includes(this._getRootParent(joint)));
                    if (isUnderSameScene) {
                        skinningModelComponent.skinningRoot = sceneNode;
                    }
                    else {
                        this._logger(GltfConverter.LogLevel.Error, GltfConverter.ConverterError.ReferenceSkinInDifferentScene, {
                            node: iGltfNode,
                            skin: gltfNode.skin,
                        });
                    }
                }
                else {
                    // assign a temporary root
                    skinningModelComponent.skinningRoot = skinRoot;
                }
                modelComponent = skinningModelComponent;
            }
            const mesh = gltfAssetFinder.find('meshes', gltfNode.mesh, cc.Mesh);
            if (mesh) {
                // @ts-ignore TS2445
                modelComponent._mesh = mesh;
            }
            const gltfMesh = this.gltf.meshes[gltfNode.mesh];
            const processedMesh = this._processedMeshes[gltfNode.mesh];
            const materials = processedMesh.materialIndices.map((idx) => {
                const gltfPrimitive = gltfMesh.primitives[idx];
                if (gltfPrimitive.material === undefined) {
                    return null;
                }
                else {
                    const material = gltfAssetFinder.find('materials', gltfPrimitive.material, cc.Material);
                    if (material) {
                        return material;
                    }
                }
                return null;
            });
            // @ts-ignore TS2445
            modelComponent._materials = materials;
        }
    }
    _createEmptyNode(iGltfNode, withTransform = true) {
        const gltfNode = this._gltf.nodes[iGltfNode];
        const nodeName = this._getGltfXXName(GltfAssetKind.Node, iGltfNode);
        const node = new cc.Node(nodeName);
        if (!withTransform) {
            return node;
        }
        if (gltfNode.translation) {
            node.setPosition(gltfNode.translation[0], gltfNode.translation[1], gltfNode.translation[2]);
        }
        if (gltfNode.rotation) {
            node.setRotation(this._getNodeRotation(gltfNode.rotation, new cc_1.Quat()));
        }
        if (gltfNode.scale) {
            node.setScale(gltfNode.scale[0], gltfNode.scale[1], gltfNode.scale[2]);
        }
        if (gltfNode.matrix) {
            const ns = gltfNode.matrix;
            const m = this._readNodeMatrix(ns);
            const t = new cc_1.Vec3();
            const r = new cc_1.Quat();
            const s = new cc_1.Vec3();
            cc_1.Mat4.toRTS(m, r, t, s);
            node.setPosition(t);
            node.setRotation(r);
            node.setScale(s);
        }
        return node;
    }
    _readNodeMatrix(ns) {
        return new cc_1.Mat4(ns[0], ns[1], ns[2], ns[3], ns[4], ns[5], ns[6], ns[7], ns[8], ns[9], ns[10], ns[11], ns[12], ns[13], ns[14], ns[15]);
    }
    _getNodePath(node) {
        return this._nodePathTable[node];
    }
    _isAncestorOf(parent, child) {
        if (parent !== child) {
            while (child >= 0) {
                if (child === parent) {
                    return true;
                }
                child = this._getParent(child);
            }
        }
        return false;
    }
    _mapToSocketPath(path) {
        for (const pair of this._socketMappings) {
            if (path !== pair[0] && !path.startsWith(pair[0] + '/')) {
                continue;
            }
            return pair[1] + path.slice(pair[0].length);
        }
        return path;
    }
    _createNodePathTable() {
        if (this._gltf.nodes === undefined) {
            return [];
        }
        const parentTable = new Array(this._gltf.nodes.length).fill(-1);
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            if (gltfNode.children) {
                gltfNode.children.forEach((iChildNode) => {
                    parentTable[iChildNode] = nodeIndex;
                });
                const names = gltfNode.children.map((iChildNode) => {
                    const childNode = this._gltf.nodes[iChildNode];
                    let name = childNode.name;
                    if (typeof name !== 'string' || name.length === 0) {
                        name = null;
                    }
                    return name;
                });
                const uniqueNames = makeUniqueNames(names, uniqueChildNodeNameGenerator);
                uniqueNames.forEach((uniqueName, iUniqueName) => {
                    this._gltf.nodes[gltfNode.children[iUniqueName]].name = uniqueName;
                });
            }
        });
        const nodeNames = new Array(this._gltf.nodes.length).fill('');
        for (let iNode = 0; iNode < nodeNames.length; ++iNode) {
            nodeNames[iNode] = this._getGltfXXName(GltfAssetKind.Node, iNode);
        }
        const result = new Array(this._gltf.nodes.length).fill('');
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            const segments = [];
            for (let i = nodeIndex; i >= 0; i = parentTable[i]) {
                // Promoted node is not part of node path
                if (!this._promotedRootNodes.includes(i)) {
                    segments.unshift(nodeNames[i]);
                }
            }
            result[nodeIndex] = segments.join('/');
        });
        return result;
    }
    /**
     * Note, if `bufferView` property is not defined, this method will do nothing.
     * So you should ensure that the data area of `outputBuffer` is filled with `0`s.
     * @param gltfAccessor
     * @param outputBuffer
     * @param outputStride
     */
    _readAccessor(gltfAccessor, outputBuffer, outputStride = 0) {
        // When not defined, accessor must be initialized with zeros.
        if (gltfAccessor.bufferView === undefined) {
            return;
        }
        const gltfBufferView = this._gltf.bufferViews[gltfAccessor.bufferView];
        const componentsPerAttribute = this._getComponentsPerAttribute(gltfAccessor.type);
        const bytesPerElement = this._getBytesPerComponent(gltfAccessor.componentType);
        if (outputStride === 0) {
            outputStride = componentsPerAttribute * bytesPerElement;
        }
        const inputStartOffset = (gltfAccessor.byteOffset !== undefined ? gltfAccessor.byteOffset : 0) +
            (gltfBufferView.byteOffset !== undefined ? gltfBufferView.byteOffset : 0);
        const inputBuffer = createDataViewFromBuffer(this._buffers[gltfBufferView.buffer], inputStartOffset);
        const inputStride = gltfBufferView.byteStride !== undefined ? gltfBufferView.byteStride : componentsPerAttribute * bytesPerElement;
        const componentReader = this._getComponentReader(gltfAccessor.componentType);
        const componentWriter = this._getComponentWriter(gltfAccessor.componentType);
        for (let iAttribute = 0; iAttribute < gltfAccessor.count; ++iAttribute) {
            const i = createDataViewFromTypedArray(inputBuffer, inputStride * iAttribute);
            const o = createDataViewFromTypedArray(outputBuffer, outputStride * iAttribute);
            for (let iComponent = 0; iComponent < componentsPerAttribute; ++iComponent) {
                const componentBytesOffset = bytesPerElement * iComponent;
                const value = componentReader(i, componentBytesOffset);
                componentWriter(o, componentBytesOffset, value);
            }
        }
    }
    _applyDeviation(glTFAccessor, baseValues) {
        const { sparse } = glTFAccessor;
        // Sparse indices
        const indicesBufferView = this._gltf.bufferViews[sparse.indices.bufferView];
        const indicesBuffer = this._buffers[indicesBufferView.buffer];
        const indicesSc = this._getAttributeBaseTypeStorage(sparse.indices.componentType);
        const sparseIndices = new indicesSc(indicesBuffer.buffer, indicesBuffer.byteOffset + (indicesBufferView.byteOffset || 0) + (sparse.indices.byteOffset || 0), sparse.count);
        // Sparse values
        const valuesBufferView = this._gltf.bufferViews[sparse.values.bufferView];
        const valuesBuffer = this._buffers[valuesBufferView.buffer];
        const valuesSc = this._getAttributeBaseTypeStorage(glTFAccessor.componentType);
        const sparseValues = new valuesSc(valuesBuffer.buffer, valuesBuffer.byteOffset + (valuesBufferView.byteOffset || 0) + (sparse.values.byteOffset || 0));
        const components = this._getComponentsPerAttribute(glTFAccessor.type);
        for (let iComponent = 0; iComponent < components; ++iComponent) {
            for (let iSparseIndex = 0; iSparseIndex < sparseIndices.length; ++iSparseIndex) {
                const sparseIndex = sparseIndices[iSparseIndex];
                baseValues[components * sparseIndex + iComponent] = sparseValues[components * iSparseIndex + iComponent];
            }
        }
    }
    _getPrimitiveMode(mode) {
        if (mode === undefined) {
            mode = glTF_constants_1.GltfPrimitiveMode.__DEFAULT;
        }
        switch (mode) {
            case glTF_constants_1.GltfPrimitiveMode.POINTS:
                return cc_1.gfx.PrimitiveMode.POINT_LIST;
            case glTF_constants_1.GltfPrimitiveMode.LINES:
                return cc_1.gfx.PrimitiveMode.LINE_LIST;
            case glTF_constants_1.GltfPrimitiveMode.LINE_LOOP:
                return cc_1.gfx.PrimitiveMode.LINE_LOOP;
            case glTF_constants_1.GltfPrimitiveMode.LINE_STRIP:
                return cc_1.gfx.PrimitiveMode.LINE_STRIP;
            case glTF_constants_1.GltfPrimitiveMode.TRIANGLES:
                return cc_1.gfx.PrimitiveMode.TRIANGLE_LIST;
            case glTF_constants_1.GltfPrimitiveMode.TRIANGLE_STRIP:
                return cc_1.gfx.PrimitiveMode.TRIANGLE_STRIP;
            case glTF_constants_1.GltfPrimitiveMode.TRIANGLE_FAN:
                return cc_1.gfx.PrimitiveMode.TRIANGLE_FAN;
            default:
                throw new Error(`Unrecognized primitive mode: ${mode}.`);
        }
    }
    _getAttributeBaseTypeStorage(componentType) {
        switch (componentType) {
            case glTF_constants_1.GltfAccessorComponentType.BYTE:
                return Int8Array;
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_BYTE:
                return Uint8Array;
            case glTF_constants_1.GltfAccessorComponentType.SHORT:
                return Int16Array;
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_SHORT:
                return Uint16Array;
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_INT:
                return Uint32Array;
            case glTF_constants_1.GltfAccessorComponentType.FLOAT:
                return Float32Array;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getComponentsPerAttribute(type) {
        return (0, glTF_constants_1.getGltfAccessorTypeComponents)(type);
    }
    _getBytesPerComponent(componentType) {
        switch (componentType) {
            case glTF_constants_1.GltfAccessorComponentType.BYTE:
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_BYTE:
                return 1;
            case glTF_constants_1.GltfAccessorComponentType.SHORT:
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_SHORT:
                return 2;
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_INT:
            case glTF_constants_1.GltfAccessorComponentType.FLOAT:
                return 4;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getComponentReader(componentType) {
        switch (componentType) {
            case glTF_constants_1.GltfAccessorComponentType.BYTE:
                return (buffer, offset) => buffer.getInt8(offset);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_BYTE:
                return (buffer, offset) => buffer.getUint8(offset);
            case glTF_constants_1.GltfAccessorComponentType.SHORT:
                return (buffer, offset) => buffer.getInt16(offset, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_SHORT:
                return (buffer, offset) => buffer.getUint16(offset, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_INT:
                return (buffer, offset) => buffer.getUint32(offset, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.FLOAT:
                return (buffer, offset) => buffer.getFloat32(offset, DataViewUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getComponentWriter(componentType) {
        switch (componentType) {
            case glTF_constants_1.GltfAccessorComponentType.BYTE:
                return (buffer, offset, value) => buffer.setInt8(offset, value);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_BYTE:
                return (buffer, offset, value) => buffer.setUint8(offset, value);
            case glTF_constants_1.GltfAccessorComponentType.SHORT:
                return (buffer, offset, value) => buffer.setInt16(offset, value, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_SHORT:
                return (buffer, offset, value) => buffer.setUint16(offset, value, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.UNSIGNED_INT:
                return (buffer, offset, value) => buffer.setUint32(offset, value, DataViewUseLittleEndian);
            case glTF_constants_1.GltfAccessorComponentType.FLOAT:
                return (buffer, offset, value) => buffer.setFloat32(offset, value, DataViewUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getGltfXXName(assetKind, index) {
        const assetsArrayName = {
            [GltfAssetKind.Animation]: 'animations',
            [GltfAssetKind.Image]: 'images',
            [GltfAssetKind.Material]: 'materials',
            [GltfAssetKind.Node]: 'nodes',
            [GltfAssetKind.Skin]: 'skins',
            [GltfAssetKind.Texture]: 'textures',
            [GltfAssetKind.Scene]: 'scenes',
        };
        const assets = this._gltf[assetsArrayName[assetKind]];
        if (!assets) {
            return '';
        }
        const asset = assets[index];
        if (typeof asset.name === 'string') {
            return asset.name;
        }
        else {
            return `${GltfAssetKind[assetKind]}-${index}`;
        }
    }
    /**
     * Normalize a number array if max value is greater than 1,returns the max value and the normalized array.
     * @param orgArray
     * @private
     */
    _normalizeArrayToCocosColor(orgArray) {
        let factor = 1;
        if (Math.max(...orgArray) > 1) {
            factor = Math.max(...orgArray);
        }
        const normalizeArray = orgArray.map((v) => (0, color_utils_1.linearToSrgb8Bit)(v / factor));
        if (normalizeArray.length === 3) {
            normalizeArray.push(255);
        }
        const color = new cc.Color(normalizeArray[0], normalizeArray[1], normalizeArray[2], normalizeArray[3]);
        return [factor, color];
    }
    _convertAdskPhysicalMaterial(_glTFMaterial, glTFMaterialIndex, glTFAssetFinder, effectGetter, originalMaterial) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        const { Parameters: physicalParams } = originalMaterial.properties['3dsMax'];
        // Note: You should support every thing in `physicalParams` optional
        const pBaseColor = physicalParams.base_color ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.base_color;
        properties['mainColor'] = cc.Vec4.set(new cc.Color(), pBaseColor[0], pBaseColor[1], pBaseColor[2], pBaseColor[3]);
        const pBaseWeight = physicalParams.basic_weight ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.basic_weight;
        properties['albedoScale'] = new cc.Vec3(pBaseWeight, pBaseWeight, pBaseWeight);
        const pBaseColorMapOn = physicalParams.base_color_map_on ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.base_color_map_on;
        const pBaseColorMap = physicalParams.base_color_map;
        if (pBaseColorMapOn && pBaseColorMap) {
            defines['USE_ALBEDO_MAP'] = true;
            properties['mainTexture'] = glTFAssetFinder.find('textures', pBaseColorMap.index, cc.Texture2D) ?? undefined;
            if (pBaseColorMap.texCoord === 1) {
                defines['ALBEDO_UV'] = 'v_uv1';
            }
            if (hasKHRTextureTransformExtension(pBaseColorMap)) {
                properties['tilingOffset'] = this._khrTextureTransformToTiling(pBaseColorMap.extensions.KHR_texture_transform);
            }
        }
        const pMetalness = physicalParams.metalness ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.metalness;
        properties['metallic'] = pMetalness;
        const pRoughness = physicalParams.roughness ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.roughness;
        const pInvRoughness = physicalParams.roughness_inv ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.roughness_inv;
        properties['roughness'] = pInvRoughness ? 1.0 - pRoughness : pRoughness;
        const pMetalnessMapOn = physicalParams.metalness_map_on ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.metalness_map_on;
        const pMetalnessMap = physicalParams.metalness_map;
        const pRoughnessMapOn = physicalParams.roughness_map_on ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.roughness_map_on;
        const pRoughnessMap = physicalParams.roughness_map;
        if (pMetalnessMapOn && pMetalnessMap) {
            // TODO
            // defines.USE_METALLIC_ROUGHNESS_MAP = true;
            // properties.metallicRoughnessMap;
        }
        if (pRoughnessMapOn && pRoughnessMap) {
            // TODO: apply inv?
        }
        // TODO: bump map & bump map on?
        // const pBumpMap = physicalParams.bump_map;
        // if (pBumpMap) {
        // }
        const pEmission = physicalParams.emission ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.emission;
        // TODO: emissive scale
        // properties['emissiveScale'] = new Vec4(pEmission, pEmission, pEmission, 1.0);
        const pEmissiveColor = physicalParams.emit_color ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.emit_color;
        properties['emissive'] = new cc_1.Vec4(pEmissiveColor[0] * pEmission, pEmissiveColor[1] * pEmission, pEmissiveColor[2] * pEmission, pEmissiveColor[3] * pEmission);
        // const pEmissionMapOn = physicalParams.emission_map_on ?? ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.emission_map_on;
        // const pEmissionMap = physicalParams.emission_map;
        // We do not support emission (factor) map
        // if ((pEmissionMapOn && pEmissionMap)) {
        // }
        const pEmissiveColorMapOn = physicalParams.emit_color_map_on ?? extras_1.ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS.emit_color_map_on;
        const pEmissiveColorMap = physicalParams.emit_color_map;
        if (pEmissiveColorMapOn && pEmissiveColorMap) {
            defines['USE_EMISSIVE_MAP'] = true;
            properties['emissiveMap'] = glTFAssetFinder.find('textures', pEmissiveColorMap.index, cc.Texture2D) ?? undefined;
            if (pEmissiveColorMap.texCoord === 1) {
                defines['EMISSIVE_UV'] = 'v_uv1';
            }
        }
        // TODO:
        // defines['USE_OCCLUSION_MAP'] = true;
        // properties['occlusionMap'];
        // properties['occlusion'];
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter('db://internal/effects/builtin-standard.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    _convertMaxPhysicalMaterial(glTFMaterialIndex, glTFAssetFinder, effectGetter, physicalMaterial) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        if (physicalMaterial.base_color_map && !this.fbxMissingImagesId.includes(physicalMaterial.base_color_map.value.index)) {
            defines['USE_ALBEDO_MAP'] = true;
            properties['mainTexture'] =
                glTFAssetFinder.find('textures', physicalMaterial.base_color_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['mainColor'] = this._normalizeArrayToCocosColor(physicalMaterial.base_color.value)[1];
        if (physicalMaterial.base_weight_map && !this.fbxMissingImagesId.includes(physicalMaterial.base_weight_map.value.index)) {
            defines['USE_WEIGHT_MAP'] = true;
            properties['baseWeightMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.base_weight_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['albedoScale'] = physicalMaterial.base_weight.value;
        if (physicalMaterial.metalness_map && !this.fbxMissingImagesId.includes(physicalMaterial.metalness_map.value.index)) {
            defines['USE_METALLIC_MAP'] = true;
            properties['metallicMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.metalness_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['metallic'] = physicalMaterial.metalness.value;
        if (physicalMaterial.roughness_map && !this.fbxMissingImagesId.includes(physicalMaterial.roughness_map.value.index)) {
            defines['USE_ROUGHNESS_MAP'] = true;
            properties['roughnessMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.roughness_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['roughness'] = physicalMaterial.roughness.value;
        if (physicalMaterial.bump_map && !this.fbxMissingImagesId.includes(physicalMaterial.bump_map.value.index)) {
            defines['USE_NORMAL_MAP'] = true;
            properties['normalMap'] = glTFAssetFinder.find('textures', physicalMaterial.bump_map.value.index, cc.Texture2D) ?? undefined;
        }
        if (physicalMaterial.emission_map && !this.fbxMissingImagesId.includes(physicalMaterial.emission_map.value.index)) {
            defines['USE_EMISSIVESCALE_MAP'] = true;
            properties['emissiveScaleMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.emission_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['emissiveScale'] = physicalMaterial.emission.value;
        if (physicalMaterial.emit_color_map && !this.fbxMissingImagesId.includes(physicalMaterial.emit_color_map.value.index)) {
            defines['USE_EMISSIVE_MAP'] = true;
            properties['emissiveMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.emit_color_map.value.index, cc.Texture2D) ?? undefined;
        }
        properties['emissive'] = this._normalizeArrayToCocosColor(physicalMaterial.emit_color.value)[1];
        // set alphaSource default value.
        properties['alphaSource'] = 1;
        let tech = 0;
        if (physicalMaterial.cutout_map) {
            tech = 1;
            defines['USE_ALPHA_TEST'] = false;
            defines['USE_OPACITY_MAP'] = true;
            properties['alphaSourceMap'] =
                glTFAssetFinder.find('textures', physicalMaterial.cutout_map.value.index, cc.Texture2D) ?? undefined;
        }
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter('db://internal/effects/util/dcc/imported-metallic-roughness.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        setTechniqueIndex(material, tech);
        return material;
    }
    _convertMayaStandardSurface(glTFMaterialIndex, glTFAssetFinder, effectGetter, mayaStandardSurface) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        if (mayaStandardSurface.base.texture && !this.fbxMissingImagesId.includes(mayaStandardSurface.base.texture.index)) {
            defines['USE_WEIGHT_MAP'] = true;
            properties['baseWeightMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.base.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['albedoScale'] = mayaStandardSurface.base.value;
        if (mayaStandardSurface.baseColor.texture && !this.fbxMissingImagesId.includes(mayaStandardSurface.baseColor.texture.index)) {
            defines['USE_ALBEDO_MAP'] = true;
            properties['mainTexture'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.baseColor.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['mainColor'] = this._normalizeArrayToCocosColor(mayaStandardSurface.baseColor.value)[1];
        if (mayaStandardSurface.metalness.texture && !this.fbxMissingImagesId.includes(mayaStandardSurface.metalness.texture.index)) {
            defines['USE_METALLIC_MAP'] = true;
            properties['metallicMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.metalness.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['metallic'] = mayaStandardSurface.metalness.value;
        if (mayaStandardSurface.specularRoughness.texture &&
            !this.fbxMissingImagesId.includes(mayaStandardSurface.specularRoughness.texture.index)) {
            defines['USE_ROUGHNESS_MAP'] = true;
            properties['roughnessMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.specularRoughness.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['roughness'] = mayaStandardSurface.specularRoughness.value;
        properties['specularIntensity'] = Math.max(...mayaStandardSurface.specularColor.value) * 0.5;
        if (mayaStandardSurface.normalCamera.texture !== undefined &&
            !this.fbxMissingImagesId.includes(mayaStandardSurface.normalCamera.texture.index)) {
            defines['USE_NORMAL_MAP'] = true;
            properties['normalMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.normalCamera.texture.index, cc.Texture2D) ?? undefined;
        }
        if (mayaStandardSurface.emission.texture !== undefined &&
            !this.fbxMissingImagesId.includes(mayaStandardSurface.emission.texture.index)) {
            defines['USE_EMISSIVESCALE_MAP'] = true;
            properties['emissiveScaleMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.emission.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['emissiveScale'] = mayaStandardSurface.emission.value;
        if (mayaStandardSurface.emissionColor.texture !== undefined &&
            !this.fbxMissingImagesId.includes(mayaStandardSurface.emissionColor.texture.index)) {
            defines['USE_EMISSIVE_MAP'] = true;
            properties['emissiveMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.emissionColor.texture.index, cc.Texture2D) ?? undefined;
        }
        properties['emissive'] = this._normalizeArrayToCocosColor(mayaStandardSurface.emissionColor.value)[1];
        if (mayaStandardSurface.opacity.texture && !this.fbxMissingImagesId.includes(mayaStandardSurface.opacity.texture.index)) {
            defines['USE_ALPHA_TEST'] = false;
            defines['USE_OPACITY_MAP'] = true;
            properties['alphaSourceMap'] =
                glTFAssetFinder.find('textures', mayaStandardSurface.opacity.texture.index, cc.Texture2D) ?? undefined;
        }
        else if (Math.max(...mayaStandardSurface.opacity.value) < 0.99) {
            properties['alphaSource'] = Math.max(...mayaStandardSurface.opacity.value);
        }
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        // @ts-ignore TS2445(GltfAssetKind.Material
        material._effectAsset = effectGetter('db://internal/effects/util/dcc/imported-metallic-roughness.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    _convertPhongMaterial(glTFMaterialIndex, glTFAssetFinder, effectGetter, appID, phongMat) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        let tech = 0;
        let alphaValue = 255;
        if (phongMat.transparentColor.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.transparentColor.texture.index)) {
            defines['USE_ALPHA_TEST'] = false;
            defines['USE_TRANSPARENCY_MAP'] = true;
            properties['transparencyMap'] =
                glTFAssetFinder.find('textures', phongMat.transparentColor.texture.index, cc.Texture2D) ?? undefined;
            tech = 1;
        }
        else if (phongMat.transparencyFactor) {
            const theColor = (phongMat.transparentColor.value[0] + phongMat.transparentColor.value[1] + phongMat.transparentColor.value[2]) / 3.0;
            if (!(phongMat.transparentColor.value[0] === phongMat.transparentColor.value[1] &&
                phongMat.transparentColor.value[0] === phongMat.transparentColor.value[2])) {
                console.warn(`Material ${this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex)} : Transparent color property is not supported, average value would be used.`);
            }
            const transparencyValue = phongMat.transparencyFactor.value * theColor;
            if (transparencyValue !== 0) {
                tech = 1;
                alphaValue = (0, color_utils_1.linearToSrgb8Bit)(1 - phongMat.transparencyFactor.value * theColor);
            }
        }
        if (phongMat.diffuse) {
            const diffuseColor = this._normalizeArrayToCocosColor(phongMat.diffuse.value);
            properties['albedoScale'] = phongMat.diffuseFactor.value * diffuseColor[0];
            diffuseColor[1].a = alphaValue;
            properties['mainColor'] = diffuseColor[1]; //use srgb input color
            if (phongMat.diffuse.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.diffuse.texture.index)) {
                defines['USE_ALBEDO_MAP'] = true;
                properties['mainTexture'] = glTFAssetFinder.find('textures', phongMat.diffuse.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        if (phongMat.specular) {
            const specularColor = this._normalizeArrayToCocosColor(phongMat.specular.value);
            properties['specularFactor'] = phongMat.specularFactor.value * specularColor[0];
            properties['specularColor'] = specularColor[1]; // phong_mat.specular.value;
            if (phongMat.specular.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.specular.texture.index)) {
                defines['USE_SPECULAR_MAP'] = true;
                properties['specularMap'] = glTFAssetFinder.find('textures', phongMat.specular.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        if (phongMat.normalMap?.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.normalMap.texture.index)) {
            defines['USE_NORMAL_MAP'] = true;
            properties['normalMap'] = glTFAssetFinder.find('textures', phongMat.normalMap.texture.index, cc.Texture2D) ?? undefined;
        }
        else if (phongMat.bump?.texture !== undefined) {
            defines['USE_NORMAL_MAP'] = true;
            properties['normalMap'] = glTFAssetFinder.find('textures', phongMat.bump.texture.index, cc.Texture2D) ?? undefined;
        }
        if (phongMat.shininess) {
            properties['shininessExponent'] = phongMat.shininess.value;
            if (phongMat.shininess.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.shininess.texture.index)) {
                defines['USE_SHININESS_MAP'] = true;
                properties['shininessExponentMap'] =
                    glTFAssetFinder.find('textures', phongMat.shininess.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        if (phongMat.emissive) {
            const emissiveColor = this._normalizeArrayToCocosColor(phongMat.emissive.value);
            properties['emissiveScale'] = phongMat.emissiveFactor.value * emissiveColor[0];
            properties['emissive'] = emissiveColor[1];
            if (phongMat.emissive.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.emissive.texture.index)) {
                defines['USE_EMISSIVE_MAP'] = true;
                properties['emissiveMap'] = glTFAssetFinder.find('textures', phongMat.emissive.texture.index, cc.Texture2D) ?? undefined;
            }
            if (phongMat.emissiveFactor.texture !== undefined && !this.fbxMissingImagesId.includes(phongMat.emissiveFactor.texture.index)) {
                defines['USE_EMISSIVESCALE_MAP'] = true;
                properties['emissiveScaleMap'] =
                    glTFAssetFinder.find('textures', phongMat.emissiveFactor.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        defines['DCC_APP_NAME'] = appID;
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        setTechniqueIndex(material, tech);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    _convertBlenderPBRMaterial(glTFMaterial, glTFMaterialIndex, glTFAssetFinder, effectGetter) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        const phongMaterialContainer = glTFMaterial.extras['FBX-glTF-conv'].raw.properties;
        defines['DCC_APP_NAME'] = 2;
        defines['HAS_EXPORTED_METALLIC'] = true;
        // base color
        if (phongMaterialContainer.diffuse) {
            const diffuseColor = this._normalizeArrayToCocosColor(phongMaterialContainer.diffuse.value);
            properties['mainColor'] = diffuseColor[1]; // phong_mat.diffuse.value;
            if (phongMaterialContainer.diffuse.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.diffuse.texture.index)) {
                defines['USE_ALBEDO_MAP'] = true;
                properties['mainTexture'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.diffuse.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        // normal
        if (phongMaterialContainer.bump?.texture !== undefined &&
            !this.fbxMissingImagesId.includes(phongMaterialContainer.bump.texture.index)) {
            defines['USE_NORMAL_MAP'] = true;
            properties['normalMap'] =
                glTFAssetFinder.find('textures', phongMaterialContainer.bump.texture.index, cc.Texture2D) ?? undefined;
        }
        // roughness
        if (phongMaterialContainer.shininess) {
            properties['shininessExponent'] = phongMaterialContainer.shininess.value;
            if (phongMaterialContainer.shininess.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.shininess.texture.index)) {
                // roughness map
                defines['USE_SHININESS_MAP'] = true;
                properties['shininessExponentMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.shininess.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        if (phongMaterialContainer.emissive) {
            const emissiveColor = this._normalizeArrayToCocosColor(phongMaterialContainer.emissive.value);
            properties['emissiveScale'] = phongMaterialContainer.emissiveFactor.value * emissiveColor[0];
            properties['emissive'] = emissiveColor[1];
            if (phongMaterialContainer.emissive.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.emissive.texture.index)) {
                defines['USE_EMISSIVE_MAP'] = true;
                properties['emissiveMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.emissive.texture.index, cc.Texture2D) ?? undefined;
            }
            if (phongMaterialContainer.emissiveFactor.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.emissiveFactor.texture.index)) {
                defines['USE_EMISSIVESCALE_MAP'] = true;
                properties['emissiveScaleMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.emissiveFactor.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        // metallic
        if (phongMaterialContainer.reflectionFactor) {
            properties['metallic'] = phongMaterialContainer.reflectionFactor.value;
            if (phongMaterialContainer.reflectionFactor.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.reflectionFactor.texture.index)) {
                defines['USE_METALLIC_MAP'] = true;
                properties['metallicMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.reflectionFactor.texture.index, cc.Texture2D) ?? undefined;
            }
        }
        // specular
        if (phongMaterialContainer.specularFactor) {
            if (phongMaterialContainer.specularFactor.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.specularFactor.texture.index)) {
                defines['USE_SPECULAR_MAP'] = true;
                properties['specularMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.specularFactor.texture.index, cc.Texture2D) ?? undefined;
            }
            else {
                properties['specularFactor'] = phongMaterialContainer.specularFactor.value;
            }
        }
        if (phongMaterialContainer.transparencyFactor) {
            if (phongMaterialContainer.transparencyFactor.texture !== undefined &&
                !this.fbxMissingImagesId.includes(phongMaterialContainer.transparencyFactor.texture.index)) {
                defines['USE_ALPHA_TEST'] = false;
                defines['USE_TRANSPARENCY_MAP'] = true;
                properties['transparencyMap'] =
                    glTFAssetFinder.find('textures', phongMaterialContainer.transparencyFactor.texture.index, cc.Texture2D) ?? undefined;
            }
            else {
                properties['transparencyFactor'] = phongMaterialContainer.transparencyFactor.value;
            }
        }
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    _convertGltfPbrSpecularGlossiness(glTFMaterial, glTFMaterialIndex, glTFAssetFinder, effectGetter, depthWriteInAlphaModeBlend) {
        const defines = {};
        const properties = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
            depthStencilState: {},
        };
        const gltfSpecularGlossiness = glTFMaterial.extensions.KHR_materials_pbrSpecularGlossiness;
        defines['DCC_APP_NAME'] = 4;
        // base color
        if (gltfSpecularGlossiness.diffuseFactor) {
            const diffuseColor = this._normalizeArrayToCocosColor(gltfSpecularGlossiness.diffuseFactor);
            properties['mainColor'] = diffuseColor[1]; // phong_mat.diffuse.value;
        }
        if (gltfSpecularGlossiness.diffuseTexture !== undefined) {
            defines['USE_ALBEDO_MAP'] = true;
            properties['mainTexture'] =
                glTFAssetFinder.find('textures', gltfSpecularGlossiness.diffuseTexture.index, cc.Texture2D) ?? undefined;
        }
        // specular
        if (gltfSpecularGlossiness.specularFactor) {
            const specularColor = this._normalizeArrayToCocosColor(gltfSpecularGlossiness.specularFactor);
            properties['specularColor'] = specularColor[1];
        }
        // glossiness
        if (gltfSpecularGlossiness.glossinessFactor) {
            defines['HAS_EXPORTED_GLOSSINESS'] = true;
            properties['glossiness'] = gltfSpecularGlossiness.glossinessFactor;
        }
        if (gltfSpecularGlossiness.specularGlossinessTexture !== undefined) {
            defines['HAS_EXPORTED_GLOSSINESS'] = true;
            defines['USE_SPECULAR_GLOSSINESS_MAP'] = true;
            properties['specularGlossinessMap'] =
                glTFAssetFinder.find('textures', gltfSpecularGlossiness.specularGlossinessTexture.index, cc.Texture2D) ?? undefined;
        }
        if (glTFMaterial.normalTexture !== undefined) {
            const pbrNormalTexture = glTFMaterial.normalTexture;
            if (pbrNormalTexture.index !== undefined) {
                defines['USE_NORMAL_MAP'] = true;
                properties['normalMap'] = glTFAssetFinder.find('textures', pbrNormalTexture.index, cc.Texture2D);
            }
        }
        if (glTFMaterial.emissiveTexture !== undefined) {
            defines['USE_EMISSIVE_MAP'] = true;
            if (glTFMaterial.emissiveTexture.texCoord) {
                defines['EMISSIVE_UV'] = 'v_uv1';
            }
            properties['emissiveMap'] = glTFAssetFinder.find('textures', glTFMaterial.emissiveTexture.index, cc.Texture2D);
        }
        if (glTFMaterial.emissiveFactor !== undefined) {
            const v = glTFMaterial.emissiveFactor;
            properties['emissive'] = this._normalizeArrayToCocosColor(v)[1];
        }
        if (glTFMaterial.doubleSided) {
            states.rasterizerState.cullMode = cc_1.gfx.CullMode.NONE;
        }
        switch (glTFMaterial.alphaMode) {
            case 'BLEND': {
                const blendState = states.blendState.targets[0];
                blendState.blend = true;
                blendState.blendSrc = cc_1.gfx.BlendFactor.SRC_ALPHA;
                blendState.blendDst = cc_1.gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;
                blendState.blendDstAlpha = cc_1.gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;
                states.depthStencilState.depthWrite = depthWriteInAlphaModeBlend;
                break;
            }
            case 'MASK': {
                const alphaCutoff = glTFMaterial.alphaCutoff === undefined ? 0.5 : glTFMaterial.alphaCutoff;
                defines['USE_ALPHA_TEST'] = true;
                properties['alphaThreshold'] = alphaCutoff;
                break;
            }
            case 'OPAQUE':
            case undefined:
                break;
            default:
                this._logger(GltfConverter.LogLevel.Warning, GltfConverter.ConverterError.UnsupportedAlphaMode, {
                    mode: glTFMaterial.alphaMode,
                    material: glTFMaterialIndex,
                });
                break;
        }
        const material = new cc.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, glTFMaterialIndex);
        // @ts-ignore TS2445
        material._effectAsset = effectGetter('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
        // @ts-ignore TS2445
        material._defines = [defines];
        // @ts-ignore TS2445
        material._props = [properties];
        // @ts-ignore TS2445
        material._states = [states];
        return material;
    }
    _khrTextureTransformToTiling(khrTextureTransform) {
        const result = new cc_1.Vec4(1, 1, 0, 0);
        if (khrTextureTransform.scale) {
            result.x = khrTextureTransform.scale[0];
            result.y = khrTextureTransform.scale[1];
        }
        if (khrTextureTransform.offset) {
            result.z = khrTextureTransform.offset[0];
            result.w = khrTextureTransform.offset[1];
        }
        return result;
    }
}
exports.GltfConverter = GltfConverter;
function hasKHRTextureTransformExtension(obj) {
    const { extensions } = obj;
    return (typeof extensions === 'object' &&
        extensions !== null &&
        typeof extensions['KHR_texture_transform'] === 'object');
}
function setTechniqueIndex(material, index) {
    // @ts-expect-error TODO: fix type
    material._techIdx = index;
}
(function (GltfConverter) {
    let LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Info"] = 0] = "Info";
        LogLevel[LogLevel["Warning"] = 1] = "Warning";
        LogLevel[LogLevel["Error"] = 2] = "Error";
        LogLevel[LogLevel["Debug"] = 3] = "Debug";
    })(LogLevel = GltfConverter.LogLevel || (GltfConverter.LogLevel = {}));
    let ConverterError;
    (function (ConverterError) {
        /**
         * glTf requires that skin joints must exists in same scene as node references it.
         */
        ConverterError[ConverterError["ReferenceSkinInDifferentScene"] = 0] = "ReferenceSkinInDifferentScene";
        /**
         * Specified alpha mode is not supported currently.
         */
        ConverterError[ConverterError["UnsupportedAlphaMode"] = 1] = "UnsupportedAlphaMode";
        /**
         * Unsupported texture parameter.
         */
        ConverterError[ConverterError["UnsupportedTextureParameter"] = 2] = "UnsupportedTextureParameter";
        /**
         * Unsupported channel path.
         */
        ConverterError[ConverterError["UnsupportedChannelPath"] = 3] = "UnsupportedChannelPath";
        ConverterError[ConverterError["DisallowCubicSplineChannelSplit"] = 4] = "DisallowCubicSplineChannelSplit";
        ConverterError[ConverterError["FailedToCalculateTangents"] = 5] = "FailedToCalculateTangents";
        /**
         * All targets of the specified sub-mesh are zero-displaced.
         */
        ConverterError[ConverterError["EmptyMorph"] = 6] = "EmptyMorph";
        ConverterError[ConverterError["UnsupportedExtension"] = 7] = "UnsupportedExtension";
    })(ConverterError = GltfConverter.ConverterError || (GltfConverter.ConverterError = {}));
})(GltfConverter || (exports.GltfConverter = GltfConverter = {}));
async function readGltf(gltfFilePath) {
    return path.extname(gltfFilePath) === '.glb' ? await readGlb(gltfFilePath) : await readGltfJson(gltfFilePath);
}
async function readGltfJson(path) {
    const glTF = (await fs.readJSON(path));
    const resolvedBuffers = !glTF.buffers
        ? []
        : glTF.buffers.map((glTFBuffer) => {
            if (glTFBuffer.uri) {
                return resolveBufferUri(path, glTFBuffer.uri);
            }
            else {
                return Buffer.alloc(0);
            }
        });
    return { glTF, buffers: resolvedBuffers };
}
async function readGlb(path) {
    const badGLBFormat = () => {
        throw new Error('Bad glb format.');
    };
    const glb = await fs.readFile(path);
    if (glb.length < 12) {
        return badGLBFormat();
    }
    const magic = glb.readUInt32LE(0);
    if (magic !== 0x46546c67) {
        return badGLBFormat();
    }
    const ChunkTypeJson = 0x4e4f534a;
    const ChunkTypeBin = 0x004e4942;
    const version = glb.readUInt32LE(4);
    const length = glb.readUInt32LE(8);
    let glTF;
    let embeddedBinaryBuffer;
    for (let iChunk = 0, offset = 12; offset + 8 <= glb.length; ++iChunk) {
        const chunkLength = glb.readUInt32LE(offset);
        offset += 4;
        const chunkType = glb.readUInt32LE(offset);
        offset += 4;
        if (offset + chunkLength > glb.length) {
            return badGLBFormat();
        }
        const payload = Buffer.from(glb.buffer, offset, chunkLength);
        offset += chunkLength;
        if (iChunk === 0) {
            if (chunkType !== ChunkTypeJson) {
                return badGLBFormat();
            }
            const glTFJson = new TextDecoder('utf-8').decode(payload);
            glTF = JSON.parse(glTFJson);
        }
        else if (chunkType === ChunkTypeBin) {
            // TODO: Should we copy?
            // embeddedBinaryBuffer = payload.slice();
            embeddedBinaryBuffer = payload;
        }
    }
    if (!glTF) {
        return badGLBFormat();
    }
    else {
        const resolvedBuffers = !glTF.buffers
            ? []
            : glTF.buffers.map((glTFBuffer, glTFBufferIndex) => {
                if (glTFBuffer.uri) {
                    return resolveBufferUri(path, glTFBuffer.uri);
                }
                else if (glTFBufferIndex === 0 && embeddedBinaryBuffer) {
                    return embeddedBinaryBuffer;
                }
                else {
                    return Buffer.alloc(0);
                }
            });
        return { glTF, buffers: resolvedBuffers };
    }
}
function resolveBufferUri(glTFFilePath, uri) {
    const dataURI = DataURI.parse(uri);
    if (!dataURI) {
        const bufferPath = path.resolve(path.dirname(glTFFilePath), uri);
        return bufferPath;
    }
    else {
        return Buffer.from(resolveBufferDataURI(dataURI));
    }
}
function isDataUri(uri) {
    return uri.startsWith('data:');
}
class BufferBlob {
    _arrayBufferOrPaddings = [];
    _length = 0;
    setNextAlignment(align) {
        if (align !== 0) {
            const remainder = this._length % align;
            if (remainder !== 0) {
                const padding = align - remainder;
                this._arrayBufferOrPaddings.push(padding);
                this._length += padding;
            }
        }
    }
    addBuffer(arrayBuffer) {
        const result = this._length;
        this._arrayBufferOrPaddings.push(arrayBuffer);
        this._length += arrayBuffer.byteLength;
        return result;
    }
    getLength() {
        return this._length;
    }
    getCombined() {
        const result = new Uint8Array(this._length);
        let counter = 0;
        this._arrayBufferOrPaddings.forEach((arrayBufferOrPadding) => {
            if (typeof arrayBufferOrPadding === 'number') {
                counter += arrayBufferOrPadding;
            }
            else {
                result.set(new Uint8Array(arrayBufferOrPadding), counter);
                counter += arrayBufferOrPadding.byteLength;
            }
        });
        return result;
    }
}
exports.BufferBlob = BufferBlob;
function createDataViewFromBuffer(buffer, offset = 0) {
    return new DataView(buffer.buffer, buffer.byteOffset + offset);
}
function createDataViewFromTypedArray(typedArray, offset = 0) {
    return new DataView(typedArray.buffer, typedArray.byteOffset + offset);
}
const DataViewUseLittleEndian = true;
function uniqueChildNodeNameGenerator(original, last, index, count) {
    const postfix = count === 0 ? '' : `-${count}`;
    return `${original || ''}(__autogen ${index}${postfix})`;
}
function makeUniqueNames(names, generator) {
    const uniqueNames = new Array(names.length).fill('');
    for (let i = 0; i < names.length; ++i) {
        let name = names[i];
        let count = 0;
        while (true) {
            const isUnique = () => uniqueNames.every((uniqueName, index) => {
                return index === i || name !== uniqueName;
            });
            if (name === null || !isUnique()) {
                name = generator(names[i], name, i, count++);
            }
            else {
                uniqueNames[i] = name;
                break;
            }
        }
    }
    return uniqueNames;
}
function resolveBufferDataURI(uri) {
    // https://github.com/KhronosGroup/glTF/issues/944
    if (!uri.base64 ||
        !uri.mediaType ||
        !(uri.mediaType.value === 'application/octet-stream' || uri.mediaType.value === 'application/gltf-buffer')) {
        throw new Error(`Cannot understand data uri(base64: ${uri.base64}, mediaType: ${uri.mediaType}) for buffer.`);
    }
    return (0, base64_1.decodeBase64ToArrayBuffer)(uri.data);
}
class DynamicArrayBuffer {
    get arrayBuffer() {
        return this._arrayBuffer;
    }
    _size = 0;
    _arrayBuffer;
    constructor(reserve) {
        this._arrayBuffer = new ArrayBuffer(Math.max(reserve || 0, 4));
    }
    grow(growSize) {
        const szBeforeGrow = this._size;
        if (growSize) {
            const cap = this._arrayBuffer.byteLength;
            const space = cap - szBeforeGrow;
            const req = space - growSize;
            if (req < 0) {
                // assert(cap >= 4)
                const newCap = (cap + -req) * 1.5;
                const newArrayBuffer = new ArrayBuffer(newCap);
                new Uint8Array(newArrayBuffer, 0, cap).set(new Uint8Array(this._arrayBuffer));
                this._arrayBuffer = newArrayBuffer;
            }
            this._size += growSize;
        }
        return szBeforeGrow;
    }
    shrink() {
        return this._arrayBuffer.slice(0, this._size);
    }
}
function getDataviewWritterOfTypedArray(typedArray, littleEndian) {
    switch (typedArray.constructor) {
        case Int8Array:
            return (dataView, byteOffset, value) => dataView.setInt8(byteOffset, value);
        case Uint8Array:
            return (dataView, byteOffset, value) => dataView.setUint8(byteOffset, value);
        case Int16Array:
            return (dataView, byteOffset, value) => dataView.setInt16(byteOffset, value, littleEndian);
        case Uint16Array:
            return (dataView, byteOffset, value) => dataView.setUint16(byteOffset, value, littleEndian);
        case Int32Array:
            return (dataView, byteOffset, value) => dataView.setInt32(byteOffset, value, littleEndian);
        case Uint32Array:
            return (dataView, byteOffset, value) => dataView.setUint32(byteOffset, value, littleEndian);
        case Float32Array:
            return (dataView, byteOffset, value) => dataView.setFloat32(byteOffset, value, littleEndian);
        default:
            throw new Error('Bad storage constructor.');
    }
}
function interleaveVertices(ppGeometry, bGenerateUV = false, bAddVertexColor = false) {
    const vertexCount = ppGeometry.vertexCount;
    let hasUV1 = false;
    let hasColor = false;
    const validAttributes = [];
    for (const attribute of ppGeometry.attributes()) {
        let gfxAttributeName;
        try {
            gfxAttributeName = (0, pp_geometry_1.getGfxAttributeName)(attribute);
            if (gfxAttributeName === cc_1.gfx.AttributeName.ATTR_TEX_COORD1) {
                hasUV1 = true;
            }
            if (gfxAttributeName === cc_1.gfx.AttributeName.ATTR_COLOR) {
                hasColor = true;
            }
        }
        catch (err) {
            console.error(err);
            continue;
        }
        validAttributes.push([gfxAttributeName, attribute]);
    }
    if (bAddVertexColor && !hasColor) {
        const fillColor = new cc_1.Vec4(1, 1, 1, 1);
        const colorData = new Float32Array(vertexCount * 4);
        for (let i = 0; i < vertexCount; ++i) {
            colorData[i * 4 + 0] = fillColor.x;
            colorData[i * 4 + 1] = fillColor.y;
            colorData[i * 4 + 2] = fillColor.z;
            colorData[i * 4 + 3] = fillColor.w;
        }
        validAttributes.push(['a_color', new pp_geometry_1.PPGeometry.Attribute(pp_geometry_1.PPGeometry.StdSemantics.color, colorData, 4)]);
    }
    if (bGenerateUV && !hasUV1) {
        validAttributes.push([
            'a_texCoord1',
            new pp_geometry_1.PPGeometry.Attribute(pp_geometry_1.PPGeometry.StdSemantics.texcoord, new Float32Array(vertexCount * 2), 2),
        ]);
    }
    let vertexStride = 0;
    for (const [_, attribute] of validAttributes) {
        vertexStride += attribute.data.BYTES_PER_ELEMENT * attribute.components;
    }
    const vertexBuffer = new ArrayBuffer(vertexCount * vertexStride);
    const vertexBufferView = new DataView(vertexBuffer);
    let currentByteOffset = 0;
    const formats = [];
    for (const [gfxAttributeName, attribute] of validAttributes) {
        const attributeData = attribute.data;
        const dataviewWritter = getDataviewWritterOfTypedArray(attributeData, DataViewUseLittleEndian);
        for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
            const offset1 = currentByteOffset + vertexStride * iVertex;
            for (let iComponent = 0; iComponent < attribute.components; ++iComponent) {
                const value = attributeData[attribute.components * iVertex + iComponent];
                dataviewWritter(vertexBufferView, offset1 + attributeData.BYTES_PER_ELEMENT * iComponent, value);
            }
        }
        currentByteOffset += attribute.data.BYTES_PER_ELEMENT * attribute.components;
        formats.push({
            name: gfxAttributeName,
            format: attribute.getGFXFormat(),
            isNormalized: attribute.isNormalized,
        });
    }
    return {
        vertexCount,
        vertexStride,
        formats,
        vertexBuffer,
    };
}
const glTFAttributeNameToPP = (() => {
    return (attributeName) => {
        if (attributeName.startsWith('_')) {
            // Application-specific semantics must start with an underscore
            return attributeName;
        }
        const attributeNameRegexMatches = /([a-zA-Z]+)(?:_(\d+))?/g.exec(attributeName);
        if (!attributeNameRegexMatches) {
            return attributeName;
        }
        const attributeBaseName = attributeNameRegexMatches[1];
        let stdSemantic;
        const set = parseInt(attributeNameRegexMatches[2] || '0');
        switch (attributeBaseName) {
            case 'POSITION':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.position;
                break;
            case 'NORMAL':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.normal;
                break;
            case 'TANGENT':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.tangent;
                break;
            case 'COLOR':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.color;
                break;
            case 'TEXCOORD':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.texcoord;
                break;
            case 'JOINTS':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.joints;
                break;
            case 'WEIGHTS':
                stdSemantic = pp_geometry_1.PPGeometry.StdSemantics.weights;
                break;
        }
        if (stdSemantic === undefined) {
            return attributeName;
        }
        else {
            return pp_geometry_1.PPGeometry.StdSemantics.set(stdSemantic, set);
        }
    };
})();
class GlTfConformanceError extends Error {
}
exports.GlTfConformanceError = GlTfConformanceError;
function assertGlTFConformance(expr, message) {
    if (!expr) {
        throw new GlTfConformanceError(`glTF non-conformance error: ${message}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x0Zi1jb252ZXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvdXRpbHMvZ2x0Zi1jb252ZXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUVBLDRDQUVDO0FBWUQsMENBUUM7QUFFRCxnRUFZQztBQWdGRCx3Q0FrQkM7QUFzcEZELDRCQUVDO0FBd0ZELDhCQUVDO0FBNzdGRCx5REFBMkM7QUFDM0MsdUNBQXlCO0FBQ3pCLDJCQUE4RDtBQUM5RCw2Q0FBK0I7QUFDL0IsMkNBQTZCO0FBaUI3Qix5REFBc0Y7QUFDdEYsa0RBQXFFO0FBQ3JFLHFDQUFxRDtBQUNyRCxxREFTMEI7QUFDMUIsNkVBS3NDO0FBQ3RDLCtDQUFzRjtBQUN0Riw0REFNeUM7QUFDekMsaUVBQWdGO0FBQ2hGLGlFQUFnRjtBQUdoRix1REFBeUQ7QUFpQnpELFNBQWdCLGdCQUFnQixDQUFDLE9BQXlCO0lBQ3RELE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQzlCLENBQUM7QUFZRCxTQUFnQixlQUFlLENBQUMsTUFBc0IsRUFBRSxJQUFhO0lBQ2pFLElBQUksSUFBSSxHQUFtQixNQUFNLENBQUM7SUFDbEMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2QsT0FBTyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzlCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQUVELFNBQWdCLDBCQUEw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QUM5QyxNQUFNO1FBQ2QsQ0FBQztRQUVELElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLE9BQU8sYUFBYSxDQUFDO1FBQ3pCLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyx3QkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pELENBQUM7SUFDTCxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRUwsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0NBQUk7QUFBbkQsb0RBQW1EO0FBRW5ELFNBQVMscUJBQXFCLENBQUMsSUFBYSxFQUFFLE9BQWU7SUFDekQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1IsTUFBTSxJQUFJLG9CQUFvQixDQUFDLCtCQUErQixPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmltcG9ydCAqIGFzIERhdGFVUkkgZnJvbSAnQGNvY29zL2RhdGEtdXJpJztcbmltcG9ydCAqIGFzIGNjIGZyb20gJ2NjJztcbmltcG9ydCB7IE1hdDQsIFF1YXQsIFZlYzMsIFZlYzQsIGdmeCwgQ29uc3RydWN0b3IgfSBmcm9tICdjYyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgICBBY2Nlc3NvcixcbiAgICBBbmltYXRpb24sXG4gICAgQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBCdWZmZXJWaWV3LFxuICAgIEdsVGYsXG4gICAgSW1hZ2UsXG4gICAgTWF0ZXJpYWwsXG4gICAgTWVzaCxcbiAgICBNZXNoUHJpbWl0aXZlLFxuICAgIE5vZGUsXG4gICAgU2NlbmUsXG4gICAgU2tpbixcbiAgICBUZXh0dXJlLFxufSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvZ2xURic7XG5pbXBvcnQgeyBHbFRGVXNlckRhdGEgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcbmltcG9ydCB7IE5vcm1hbEltcG9ydFNldHRpbmcsIFRhbmdlbnRJbXBvcnRTZXR0aW5nIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBkZWZhdWx0TWFnRmlsdGVyLCBkZWZhdWx0TWluRmlsdGVyIH0gZnJvbSAnLi4vdGV4dHVyZS1iYXNlJztcbmltcG9ydCB7IGRlY29kZUJhc2U2NFRvQXJyYXlCdWZmZXIgfSBmcm9tICcuL2Jhc2U2NCc7XG5pbXBvcnQge1xuICAgIGdldEdsdGZBY2Nlc3NvclR5cGVDb21wb25lbnRzLFxuICAgIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUsXG4gICAgR2x0ZkFuaW1hdGlvbkNoYW5uZWxUYXJnZXRQYXRoLFxuICAgIEdsVGZBbmltYXRpb25JbnRlcnBvbGF0aW9uLFxuICAgIEdsdGZQcmltaXRpdmVNb2RlLFxuICAgIEdsdGZUZXh0dXJlTWFnRmlsdGVyLFxuICAgIEdsdGZUZXh0dXJlTWluRmlsdGVyLFxuICAgIEdsdGZXcmFwTW9kZSxcbn0gZnJvbSAnLi9nbFRGLmNvbnN0YW50cyc7XG5pbXBvcnQge1xuICAgIERlY29kZWREcmFjb0dlb21ldHJ5LFxuICAgIGRlY29kZURyYWNvR2VvbWV0cnksXG4gICAgRGVjb2RlRHJhY29HZW9tZXRyeU9wdGlvbnMsXG4gICAgS0hSRHJhY29NZXNoQ29tcHJlc3Npb24sXG59IGZyb20gJy4va2hyLWRyYWNvLW1lc2gtY29tcHJlc3Npb24nO1xuaW1wb3J0IHsgUFBHZW9tZXRyeSwgUFBHZW9tZXRyeVR5cGVkQXJyYXksIGdldEdmeEF0dHJpYnV0ZU5hbWUgfSBmcm9tICcuL3BwLWdlb21ldHJ5JztcbmltcG9ydCB7XG4gICAgQWRzazNkc01heFBoeXNpY2FsTWF0ZXJpYWxQcm9wZXJ0aWVzLFxuICAgIEFEU0tfM0RTX01BWF9QSFlTSUNBTF9NQVRFUklBTF9ERUZBVUxUX1BBUkFNRVRFUlMsXG4gICAgaGFzT3JpZ2luYWxNYXRlcmlhbEV4dHJhcyxcbiAgICBpc0Fkc2szZHNNYXhQaHlzaWNhbE1hdGVyaWFsLFxuICAgIE9yaWdpbmFsTWF0ZXJpYWwsXG59IGZyb20gJ0Bjb2Nvcy9mYngtZ2x0Zi1jb252L2xpYi9leHRyYXMnO1xuaW1wb3J0IHsgZXhvdGljQW5pbWF0aW9uVGFnLCBSZWFsQXJyYXlUcmFjayB9IGZyb20gJ2NjL2VkaXRvci9leG90aWMtYW5pbWF0aW9uJztcbmltcG9ydCB7IEdsVEZUcnNBbmltYXRpb25EYXRhLCBHbFRGVHJzVHJhY2tEYXRhIH0gZnJvbSAnLi9nbFRGLWFuaW1hdGlvbi11dGlscyc7XG5pbXBvcnQgeyBNYXhQaHlzaWNhbE1hdGVyaWFsLCBNYXlhU3RhbmRhcmRTdXJmYWNlIH0gZnJvbSAnLi9tYXRlcmlhbC1pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRG9jdW1lbnRFeHRyYSwgRmJ4U3VyZmFjZUxhbWJlcnRQcm9wZXJ0aWVzLCBGYnhTdXJmYWNlUGhvbmdQcm9wZXJ0aWVzIH0gZnJvbSAnQGNvY29zL2ZieC1nbHRmLWNvbnYvdHlwZXMvRkJYLWdsVEYtY29udi1leHRyYXMnO1xuaW1wb3J0IHsgbGluZWFyVG9TcmdiOEJpdCB9IGZyb20gJ2NjL2VkaXRvci9jb2xvci11dGlscyc7XG5pbXBvcnQgeyBGaWx0ZXIsIFRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YSwgV3JhcE1vZGUgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcblxudHlwZSBGbG9hdEFycmF5ID0gRmxvYXQzMkFycmF5IHwgRmxvYXQ2NEFycmF5O1xuXG5leHBvcnQgaW50ZXJmYWNlIEdsdGZJbWFnZVBhdGhJbmZvIHtcbiAgICBpc0RhdGFVcmk6IGJvb2xlYW47XG4gICAgZnVsbFBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHbHRmSW1hZ2VEYXRhVVJJSW5mbyB7XG4gICAgaXNEYXRhVXJpOiBib29sZWFuO1xuICAgIGRhdGFVUkk6IERhdGFVUkkuRGF0YVVSSTtcbn1cblxuZXhwb3J0IHR5cGUgR2x0ZkltYWdlVXJpSW5mbyA9IEdsdGZJbWFnZVBhdGhJbmZvIHwgR2x0ZkltYWdlRGF0YVVSSUluZm87XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZpbGVzeXN0ZW1QYXRoKHVyaUluZm86IEdsdGZJbWFnZVVyaUluZm8pOiB1cmlJbmZvIGlzIEdsdGZJbWFnZVBhdGhJbmZvIHtcbiAgICByZXR1cm4gIXVyaUluZm8uaXNEYXRhVXJpO1xufVxuXG5leHBvcnQgdHlwZSBHbHRmQXNzZXRGaW5kZXJLaW5kID0gJ21lc2hlcycgfCAnYW5pbWF0aW9ucycgfCAnc2tlbGV0b25zJyB8ICd0ZXh0dXJlcycgfCAnbWF0ZXJpYWxzJztcblxuZXhwb3J0IGludGVyZmFjZSBJR2x0ZkFzc2V0RmluZGVyIHtcbiAgICBmaW5kPFQgZXh0ZW5kcyBjYy5Bc3NldD4oa2luZDogR2x0ZkFzc2V0RmluZGVyS2luZCwgaW5kZXg6IG51bWJlciwgdHlwZTogQ29uc3RydWN0b3I8VD4pOiBUIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgQXNzZXRMb2FkZXIgPSAodXVpZDogc3RyaW5nKSA9PiBjYy5Bc3NldDtcblxuZXhwb3J0IHR5cGUgR2x0ZlN1YkFzc2V0ID0gTm9kZSB8IE1lc2ggfCBUZXh0dXJlIHwgU2tpbiB8IEFuaW1hdGlvbiB8IEltYWdlIHwgTWF0ZXJpYWwgfCBTY2VuZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGhGcm9tUm9vdCh0YXJnZXQ6IGNjLk5vZGUgfCBudWxsLCByb290OiBjYy5Ob2RlKSB7XG4gICAgbGV0IG5vZGU6IGNjLk5vZGUgfCBudWxsID0gdGFyZ2V0O1xuICAgIGxldCBwYXRoID0gJyc7XG4gICAgd2hpbGUgKG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gcm9vdCkge1xuICAgICAgICBwYXRoID0gYCR7bm9kZS5uYW1lfS8ke3BhdGh9YDtcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5zbGljZSgwLCAtMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JsZFRyYW5zZm9ybVVudGlsUm9vdCh0YXJnZXQ6IGNjLk5vZGUsIHJvb3Q6IGNjLk5vZGUsIG91dFBvczogVmVjMywgb3V0Um90OiBRdWF0LCBvdXRTY2FsZTogVmVjMykge1xuICAgIFZlYzMuc2V0KG91dFBvcywgMCwgMCwgMCk7XG4gICAgUXVhdC5zZXQob3V0Um90LCAwLCAwLCAwLCAxKTtcbiAgICBWZWMzLnNldChvdXRTY2FsZSwgMSwgMSwgMSk7XG4gICAgd2hpbGUgKHRhcmdldCAhPT0gcm9vdCkge1xuICAgICAgICBWZWMzLm11bHRpcGx5KG91dFBvcywgb3V0UG9zLCB0YXJnZXQuc2NhbGUpO1xuICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQob3V0UG9zLCBvdXRQb3MsIHRhcmdldC5yb3RhdGlvbik7XG4gICAgICAgIFZlYzMuYWRkKG91dFBvcywgb3V0UG9zLCB0YXJnZXQucG9zaXRpb24pO1xuICAgICAgICBRdWF0Lm11bHRpcGx5KG91dFJvdCwgdGFyZ2V0LnJvdGF0aW9uLCBvdXRSb3QpO1xuICAgICAgICBWZWMzLm11bHRpcGx5KG91dFNjYWxlLCB0YXJnZXQuc2NhbGUsIG91dFNjYWxlKTtcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudCE7XG4gICAgfVxufVxuXG5lbnVtIEdsdGZBc3NldEtpbmQge1xuICAgIE5vZGUsXG4gICAgTWVzaCxcbiAgICBUZXh0dXJlLFxuICAgIFNraW4sXG4gICAgQW5pbWF0aW9uLFxuICAgIEltYWdlLFxuICAgIE1hdGVyaWFsLFxuICAgIFNjZW5lLFxufVxuXG5jb25zdCBlbnVtIEdsdGZTZW1hbnRpY05hbWUge1xuICAgIC8vIGZsb2F0XG4gICAgLy8gdmVjM1xuICAgIFBPU0lUSU9OID0gJ1BPU0lUSU9OJyxcblxuICAgIC8vIGZsb2F0XG4gICAgLy8gdmVjM1xuICAgIE5PUk1BTCA9ICdOT1JNQUwnLFxuXG4gICAgLy8gZmxvYXRcbiAgICAvLyB2ZWM0XG4gICAgVEFOR0VOVCA9ICdUQU5HRU5UJyxcblxuICAgIC8vIGZsb2F0L3Vuc2lnbmVkIGJ5dGUgbm9ybWFsaXplZC91bnNpZ25lZCBzaG9ydCBub3JtYWxpemVkXG4gICAgLy8gdmVjMlxuICAgIFRFWENPT1JEXzAgPSAnVEVYQ09PUkRfMCcsXG5cbiAgICAvLyBmbG9hdC91bnNpZ25lZCBieXRlIG5vcm1hbGl6ZWQvdW5zaWduZWQgc2hvcnQgbm9ybWFsaXplZFxuICAgIC8vIHZlYzJcbiAgICBURVhDT09SRF8xID0gJ1RFWENPT1JEXzEnLFxuXG4gICAgLy8gZmxvYXQvdW5zaWduZWQgYnl0ZSBub3JtYWxpemVkL3Vuc2lnbmVkIHNob3J0IG5vcm1hbGl6ZWRcbiAgICAvLyB2ZWMzL3ZlYzRcbiAgICBDT0xPUl8wID0gJ0NPTE9SXzAnLFxuXG4gICAgLy8gdW5zZ2llbmQgYnl0ZS91bnNpZ25lZCBzaG9ydFxuICAgIC8vIHZlYzRcbiAgICBKT0lOVFNfMCA9ICdKT0lOVFNfMCcsXG5cbiAgICAvLyBmbG9hdC91bnNpZ25lZCBieXRlIG5vcm1hbGl6ZWQvdW5zaWduZWQgc2hvcnQgbm9ybWFsaXplZFxuICAgIC8vIHZlYzRcbiAgICBXRUlHSFRTXzAgPSAnV0VJR0hUU18wJyxcbn1cblxudHlwZSBBY2Nlc3NvclN0b3JhZ2VDb25zdHJ1Y3RvciA9XG4gICAgfCB0eXBlb2YgSW50OEFycmF5XG4gICAgfCB0eXBlb2YgVWludDhBcnJheVxuICAgIHwgdHlwZW9mIEludDE2QXJyYXlcbiAgICB8IHR5cGVvZiBVaW50MTZBcnJheVxuICAgIHwgdHlwZW9mIFVpbnQzMkFycmF5XG4gICAgfCB0eXBlb2YgRmxvYXQzMkFycmF5O1xuXG50eXBlIEFjY2Vzc29yU3RvcmFnZSA9IEludDhBcnJheSB8IFVpbnQ4QXJyYXkgfCBJbnQxNkFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB8IEZsb2F0MzJBcnJheTtcblxuZXhwb3J0IGludGVyZmFjZSBJTWVzaE9wdGlvbnMge1xuICAgIG5vcm1hbHM6IE5vcm1hbEltcG9ydFNldHRpbmc7XG4gICAgdGFuZ2VudHM6IFRhbmdlbnRJbXBvcnRTZXR0aW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHbHRmU2VtYW50aWMge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBiYXNlVHlwZTogbnVtYmVyO1xuICAgIHR5cGU6IHN0cmluZztcbn1cblxuY29uc3QgcXQgPSBuZXcgUXVhdCgpO1xuY29uc3QgdjNhID0gbmV3IFZlYzMoKTtcbmNvbnN0IHYzYiA9IG5ldyBWZWMzKCk7XG5jb25zdCB2M01pbiA9IG5ldyBWZWMzKCk7XG5jb25zdCB2M01heCA9IG5ldyBWZWMzKCk7XG5cbnR5cGUgRmllbGRzUmVxdWlyZWQ8VCwgSyBleHRlbmRzIGtleW9mIFQ+ID0ge1xuICAgIFtYIGluIEV4Y2x1ZGU8a2V5b2YgVCwgSz5dPzogVFtYXTtcbn0gJiB7XG4gICAgW1AgaW4gS10tPzogVFtQXTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkb0NyZWF0ZVNvY2tldChzY2VuZU5vZGU6IGNjLk5vZGUsIG91dDogY2MuU29ja2V0W10sIG1vZGVsOiBjYy5Ob2RlKSB7XG4gICAgY29uc3QgcGF0aCA9IGdldFBhdGhGcm9tUm9vdChtb2RlbC5wYXJlbnQsIHNjZW5lTm9kZSk7XG4gICAgaWYgKG1vZGVsLnBhcmVudCA9PT0gc2NlbmVOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHNvY2tldCA9IG91dC5maW5kKChzKSA9PiBzLnBhdGggPT09IHBhdGgpO1xuICAgIGlmICghc29ja2V0KSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IG5ldyBjYy5Ob2RlKCk7XG4gICAgICAgIHRhcmdldC5uYW1lID0gYCR7bW9kZWwucGFyZW50IS5uYW1lfSBTb2NrZXRgO1xuICAgICAgICB0YXJnZXQucGFyZW50ID0gc2NlbmVOb2RlO1xuICAgICAgICBnZXRXb3JsZFRyYW5zZm9ybVVudGlsUm9vdChtb2RlbC5wYXJlbnQhLCBzY2VuZU5vZGUsIHYzYSwgcXQsIHYzYik7XG4gICAgICAgIHRhcmdldC5zZXRQb3NpdGlvbih2M2EpO1xuICAgICAgICB0YXJnZXQuc2V0Um90YXRpb24ocXQpO1xuICAgICAgICB0YXJnZXQuc2V0U2NhbGUodjNiKTtcbiAgICAgICAgc29ja2V0ID0gbmV3IGNjLlNrZWxldGFsQW5pbWF0aW9uLlNvY2tldChwYXRoLCB0YXJnZXQpO1xuICAgICAgICBvdXQucHVzaChzb2NrZXQpO1xuICAgIH1cbiAgICBtb2RlbC5wYXJlbnQgPSBzb2NrZXQudGFyZ2V0O1xufVxuXG5pbnRlcmZhY2UgSVByb2Nlc3NlZE1lc2gge1xuICAgIGdlb21ldHJpZXM6IFBQR2VvbWV0cnlbXTtcbiAgICBtYXRlcmlhbEluZGljZXM6IG51bWJlcltdO1xuICAgIGpvaW50TWFwczogbnVtYmVyW11bXTtcbiAgICBtaW5Qb3NpdGlvbjogVmVjMztcbiAgICBtYXhQb3NpdGlvbjogVmVjMztcbn1cblxuY29uc3Qgc2tpblJvb3ROb3RDYWxjdWxhdGVkID0gLTI7XG5jb25zdCBza2luUm9vdEFic2VudCA9IC0xO1xuXG5jb25zdCBzdXBwb3J0ZWRFeHRlbnNpb25zID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgICAvLyBTb3J0IHBsZWFzZVxuICAgICdLSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbicsXG4gICAgJ0tIUl9tYXRlcmlhbHNfcGJyU3BlY3VsYXJHbG9zc2luZXNzJyxcbiAgICAnS0hSX21hdGVyaWFsc191bmxpdCcsXG4gICAgJ0tIUl90ZXh0dXJlX3RyYW5zZm9ybScsXG5dKTtcblxuaW50ZXJmYWNlIENyZWF0b3JTdGRNYXRlcmlhbFByb3BlcnRpZXMge1xuICAgIG1haW5Db2xvcjogVmVjNCB8IGNjLkNvbG9yO1xuICAgIGFsYmVkb1NjYWxlOiBWZWMzO1xuICAgIHRpbGluZ09mZnNldDogVmVjNDtcbiAgICBtYWluVGV4dHVyZTogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBtZXRhbGxpYzogbnVtYmVyO1xuICAgIHJvdWdobmVzczogbnVtYmVyO1xuICAgIHBick1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBub3JtYWxNYXA6IGNjLlRleHR1cmUyRCB8IG51bGw7XG4gICAgbm9ybWFsU3RyZW50aDogbnVtYmVyO1xuICAgIGVtaXNzaXZlOiBWZWM0IHwgY2MuQ29sb3I7XG4gICAgZW1pc3NpdmVTY2FsZTogVmVjNDtcbiAgICBlbWlzc2l2ZU1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBvY2NsdXNpb25NYXA6IGNjLlRleHR1cmUyRCB8IG51bGw7XG4gICAgb2NjbHVzaW9uOiBudW1iZXI7XG4gICAgYWxwaGFUaHJlc2hvbGQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENyZWF0b3JQaG9uZ01hdGVyaWFsUHJvcGVydGllcyB7XG4gICAgbWFpbkNvbG9yOiBWZWM0IHwgY2MuQ29sb3I7XG4gICAgbWFpblRleHR1cmU6IGNjLlRleHR1cmUyRCB8IG51bGw7XG4gICAgYWxiZWRvU2NhbGU6IG51bWJlcjtcblxuICAgIHNwZWN1bGFyRmFjdG9yOiBudW1iZXI7XG4gICAgc3BlY3VsYXJDb2xvcjogVmVjNCB8IGNjLkNvbG9yO1xuICAgIHNwZWN1bGFyTWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuXG4gICAgbm9ybWFsTWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIG5vcm1hbEZhY3RvcjogbnVtYmVyO1xuXG4gICAgZ2xvc3NpbmVzczogbnVtYmVyO1xuICAgIHNwZWN1bGFyR2xvc3NpbmVzc01hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBzaGluaW5lc3NFeHBvbmVudDogbnVtYmVyO1xuICAgIHNoaW5pbmVzc0V4cG9uZW50TWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuXG4gICAgdHJhbnNwYXJlbmN5TWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIHRyYW5zcGFyZW50Q29sb3I6IFZlYzQgfCBjYy5Db2xvcjtcbiAgICB0cmFuc3BhcmVuY3lGYWN0b3I6IG51bWJlcjtcblxuICAgIGVtaXNzaXZlTWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIGVtaXNzaXZlOiBWZWM0IHwgY2MuQ29sb3I7XG4gICAgZW1pc3NpdmVTY2FsZU1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBlbWlzc2l2ZVNjYWxlOiBudW1iZXI7XG5cbiAgICBhbHBoYVRocmVzaG9sZDogbnVtYmVyO1xuXG4gICAgLy8gYmxlbmRlclxuICAgIG1ldGFsbGljOiBudW1iZXI7XG4gICAgbWV0YWxsaWNNYXA6IGNjLlRleHR1cmUyRCB8IG51bGw7XG59XG5cbmludGVyZmFjZSBDcmVhdG9yRENDTWV0YWxsaWNSb3VnaG5lc3NNYXRlcmlhbERlZmluZXMge1xuICAgIEFMUEhBX1NPVVJDRV9JU19PUEFDSVRZOiBib29sZWFuO1xuICAgIFVTRV9WRVJURVhfQ09MT1I6IGJvb2xlYW47XG4gICAgVVNFX05PUk1BTF9NQVA6IGJvb2xlYW47XG4gICAgSEFTX1NFQ09ORF9VVjogYm9vbGVhbjtcbiAgICBVU0VfVFdPU0lERTogYm9vbGVhbjtcbiAgICBVU0VfQUxCRURPX01BUDogYm9vbGVhbjtcbiAgICBVU0VfV0VJR0hUX01BUDogYm9vbGVhbjtcbiAgICBVU0VfTUVUQUxMSUNfTUFQOiBib29sZWFuO1xuICAgIFVTRV9ST1VHSE5FU1NfTUFQOiBib29sZWFuO1xuICAgIFVTRV9PQ0NMVVNJT05fTUFQOiBib29sZWFuO1xuICAgIC8vIFVTRV9UUkFOU1BBUkVOQ1lfTUFQOiBib29sZWFuO1xuICAgIC8vIFVTRV9UUkFOU1BBUkVOQ1lDT0xPUl9NQVA6IGJvb2xlYW47XG4gICAgVVNFX0VNSVNTSVZFU0NBTEVfTUFQOiBib29sZWFuO1xuICAgIFVTRV9FTUlTU0lWRV9NQVA6IGJvb2xlYW47XG4gICAgVVNFX0VNSVNTSU9OX0NPTE9SX01BUDogYm9vbGVhbjtcbiAgICAvLyBVU0VfQ1VUT1VUX01BUDogYm9vbGVhbjtcbiAgICBVU0VfT1BBQ0lUWV9NQVA6IGJvb2xlYW47XG4gICAgVVNFX0FMUEhBX1RFU1Q6IGJvb2xlYW47XG4gICAgRENDX0FQUF9OQU1FOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBDcmVhdG9yRENDTWV0YWxsaWNSb3VnaG5lc3NNYXRlcmlhbFByb3BlcnRpZXMge1xuICAgIGFsYmVkb1NjYWxlOiBudW1iZXI7XG4gICAgYWxwaGFTb3VyY2U6IG51bWJlcjtcbiAgICBhbHBoYVNvdXJjZU1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBiYXNlV2VpZ2h0TWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIGVtaXNzaXZlU2NhbGU6IG51bWJlcjtcbiAgICBlbWlzc2l2ZVNjYWxlTWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIGVtaXNzaXZlOiBjYy5WZWM0IHwgY2MuQ29sb3I7XG4gICAgZW1pc3NpdmVNYXA6IGNjLlRleHR1cmUyRCB8IG51bGw7XG4gICAgbWFpbkNvbG9yOiBjYy5WZWM0IHwgY2MuQ29sb3I7XG4gICAgbWFpblRleHR1cmU6IGNjLkNvbG9yIHwgY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBtZXRhbGxpYzogbnVtYmVyO1xuICAgIG1ldGFsbGljTWFwOiBjYy5UZXh0dXJlMkQgfCBudWxsO1xuICAgIG5vcm1hbE1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICBub3JtYWxTdHJlbmd0aDogbnVtYmVyO1xuICAgIG9jY2x1c2lvbjogbnVtYmVyO1xuICAgIG9jY2x1c2lvbk1hcDogY2MuVGV4dHVyZTJEIHwgbnVsbDtcbiAgICByb3VnaG5lc3M6IG51bWJlcjtcbiAgICByb3VnaG5lc3NNYXA6IGNjLlRleHR1cmUyRCB8IG51bGw7XG4gICAgc3BlY3VsYXJJbnRlbnNpdHk6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENyZWF0b3JTdGRNYXRlcmlhbERlZmluZXMge1xuICAgIFVTRV9WRVJURVhfQ09MT1I6IGJvb2xlYW47XG4gICAgSEFTX1NFQ09ORF9VVjogYm9vbGVhbjtcbiAgICBVU0VfQUxCRURPX01BUDogYm9vbGVhbjtcbiAgICBBTEJFRE9fVVY6IHN0cmluZztcbiAgICBVU0VfUEJSX01BUDogYm9vbGVhbjtcbiAgICBVU0VfTk9STUFMX01BUDogYm9vbGVhbjtcbiAgICBVU0VfT0NDTFVTSU9OX01BUDogYm9vbGVhbjtcbiAgICBVU0VfRU1JU1NJVkVfTUFQOiBib29sZWFuO1xuICAgIEVNSVNTSVZFX1VWOiBzdHJpbmc7XG4gICAgVVNFX0FMUEhBX1RFU1Q6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBDcmVhdG9yUGhvbmdNYXRlcmlhbERlZmluZXMge1xuICAgIFVTRV9WRVJURVhfQ09MT1I6IGJvb2xlYW47XG4gICAgSEFTX1NFQ09ORF9VVjogYm9vbGVhbjtcbiAgICBVU0VfQUxCRURPX01BUDogYm9vbGVhbjtcbiAgICBVU0VfU1BFQ1VMQVJfTUFQOiBib29sZWFuO1xuICAgIEFMQkVET19VVjogc3RyaW5nO1xuICAgIFVTRV9TSElOSU5FU1NfTUFQOiBib29sZWFuO1xuICAgIFVTRV9OT1JNQUxfTUFQOiBib29sZWFuO1xuICAgIFVTRV9PQ0NMVVNJT05fTUFQOiBib29sZWFuO1xuICAgIFVTRV9FTUlTU0lWRVNDQUxFX01BUDogYm9vbGVhbjtcbiAgICBVU0VfRU1JU1NJVkVfTUFQOiBib29sZWFuO1xuICAgIFVTRV9FTUlTU0lWRUNPTE9SX01BUDogYm9vbGVhbjtcbiAgICBFTUlTU0lWRV9VVjogc3RyaW5nO1xuICAgIFVTRV9BTFBIQV9URVNUOiBib29sZWFuO1xuICAgIFVTRV9UUkFOU1BBUkVOQ1lfTUFQOiBib29sZWFuO1xuICAgIFVTRV9UUkFOU1BBUkVOQ1lDT0xPUl9NQVA6IGJvb2xlYW47XG5cbiAgICBIQVNfRVhQT1JURURfR0xPU1NJTkVTUzogYm9vbGVhbjtcbiAgICBVU0VfU1BFQ1VMQVJfR0xPU1NJTkVTU19NQVA6IGJvb2xlYW47XG5cbiAgICBEQ0NfQVBQX05BTUU6IG51bWJlcjtcbiAgICBIQVNfRVhQT1JURURfTUVUQUxMSUM6IGJvb2xlYW47XG4gICAgVVNFX01FVEFMTElDX01BUDogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIENyZWF0b3JVbmxpdE1hdGVyaWFsRGVmaW5lcyB7XG4gICAgVVNFX1RFWFRVUkU6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBDcmVhdG9yVW5saXRNYXRlcmlhbFByb3BlcnRpZXMge1xuICAgIG1haW5Db2xvcjogVmVjNDtcbn1cblxudHlwZSBGYnhTdXJmYWNlTGFtYmVydE9yUGhvbmdQcm9wZXJ0aWVzID0ge1xuICAgIFt4IGluIGtleW9mIEZieFN1cmZhY2VQaG9uZ1Byb3BlcnRpZXMgfCBrZXlvZiBGYnhTdXJmYWNlTGFtYmVydFByb3BlcnRpZXNdOiB4IGV4dGVuZHMga2V5b2YgRmJ4U3VyZmFjZUxhbWJlcnRQcm9wZXJ0aWVzXG4gICAgPyBGYnhTdXJmYWNlTGFtYmVydFByb3BlcnRpZXNbeF1cbiAgICA6IEZieFN1cmZhY2VQaG9uZ1Byb3BlcnRpZXNbeF0gfCB1bmRlZmluZWQ7XG59O1xuXG5lbnVtIEFwcElkIHtcbiAgICBVTktOT1dOID0gMCxcbiAgICBBRFNLXzNEU19NQVggPSAxLFxuICAgIENJTkVNQTREID0gMyxcbiAgICBNQVlBID0gNSxcbn1cblxuZXhwb3J0IGNsYXNzIEdsdGZDb252ZXJ0ZXIge1xuICAgIGdldCBnbHRmKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x0ZjtcbiAgICB9XG5cbiAgICBnZXQgcGF0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dsdGZGaWxlUGF0aDtcbiAgICB9XG5cbiAgICBnZXQgcHJvY2Vzc2VkTWVzaGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvY2Vzc2VkTWVzaGVzO1xuICAgIH1cblxuICAgIGdldCBmYnhNaXNzaW5nSW1hZ2VzSWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mYnhNaXNzaW5nSW1hZ2VzSWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2RlZmF1bHRMb2dnZXI6IEdsdGZDb252ZXJ0ZXIuTG9nZ2VyID0gKGxldmVsLCBlcnJvciwgYXJncykgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyBlcnJvciwgYXJndW1lbnRzOiBhcmdzIH0sIHVuZGVmaW5lZCwgNCk7XG4gICAgICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkNvbnZlcnRlci5Mb2dMZXZlbC5JbmZvOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkxvZ0xldmVsLldhcm5pbmc6XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkxvZ0xldmVsLkVycm9yOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuRGVidWc6XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcml2YXRlIF9wcm9tb3RlZFJvb3ROb2RlczogbnVtYmVyW10gPSBbXTtcblxuICAgIHByaXZhdGUgX25vZGVQYXRoVGFibGU6IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHBhcmVudCBpbmRleCBvZiBlYWNoIG5vZGUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBfcGFyZW50czogbnVtYmVyW10gPSBbXTtcblxuICAgIC8qKlxuICAgICAqIFRoZSByb290IG5vZGUgb2YgZWFjaCBza2luLlxuICAgICAqL1xuICAgIHByaXZhdGUgX3NraW5Sb290czogbnVtYmVyW10gPSBbXTtcblxuICAgIHByaXZhdGUgX2xvZ2dlcjogR2x0ZkNvbnZlcnRlci5Mb2dnZXI7XG5cbiAgICBwcml2YXRlIF9wcm9jZXNzZWRNZXNoZXM6IElQcm9jZXNzZWRNZXNoW10gPSBbXTtcblxuICAgIHByaXZhdGUgX3NvY2tldE1hcHBpbmdzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIHByaXZhdGUgX2ZieE1pc3NpbmdJbWFnZXNJZDogbnVtYmVyW10gPSBbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2dsdGY6IEdsVGYsIHByaXZhdGUgX2J1ZmZlcnM6IEJ1ZmZlcltdLCBwcml2YXRlIF9nbHRmRmlsZVBhdGg6IHN0cmluZywgb3B0aW9ucz86IEdsdGZDb252ZXJ0ZXIuT3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdGhpcy5fbG9nZ2VyID0gb3B0aW9ucy5sb2dnZXIgfHwgR2x0ZkNvbnZlcnRlci5fZGVmYXVsdExvZ2dlcjtcblxuICAgICAgICB0aGlzLl9nbHRmLmV4dGVuc2lvbnNSZXF1aXJlZD8uZm9yRWFjaCgoZXh0ZW5zaW9uUmVxdWlyZWQpID0+IHRoaXMuX3dhcm5JZkV4dGVuc2lvbk5vdFN1cHBvcnRlZChleHRlbnNpb25SZXF1aXJlZCwgdHJ1ZSkpO1xuXG4gICAgICAgIHRoaXMuX2dsdGYuZXh0ZW5zaW9uc1VzZWQ/LmZvckVhY2goKGV4dGVuc2lvblVzZWQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fZ2x0Zi5leHRlbnNpb25zUmVxdWlyZWQ/LmluY2x1ZGVzKGV4dGVuc2lvblVzZWQpKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UndmUgd2FybmVkIGl0IGJlZm9yZS5cbiAgICAgICAgICAgICAgICB0aGlzLl93YXJuSWZFeHRlbnNpb25Ob3RTdXBwb3J0ZWQoZXh0ZW5zaW9uVXNlZCwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3B0aW9ucy5wcm9tb3RlU2luZ2xlUm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb21vdGVTaW5nbGVSb290Tm9kZXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN1YkFzc2V0IGltcG9ydGVycyBhcmUgTk9UIGd1YXJhbnRlZWQgdG8gYmUgZXhlY3V0ZWQgaW4tb3JkZXJcbiAgICAgICAgLy8gc28gYWxsIHRoZSBpbnRlcmRlcGVuZGVudCBkYXRhIHNob3VsZCBiZSBjcmVhdGVkIHJpZ2h0IGhlcmVcblxuICAgICAgICAvLyBXZSByZXF1aXJlIHRoZSBzY2VuZSBncmFwaCBpcyBhIGRpc2pvaW50IHVuaW9uIG9mIHN0cmljdCB0cmVlcy5cbiAgICAgICAgLy8gVGhpcyBpcyBhbHNvIHRoZSByZXF1aXJlbWVudCBpbiBnbFRmIDIuMC5cbiAgICAgICAgaWYgKHRoaXMuX2dsdGYubm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50cyA9IG5ldyBBcnJheSh0aGlzLl9nbHRmLm5vZGVzLmxlbmd0aCkuZmlsbCgtMSk7XG4gICAgICAgICAgICB0aGlzLl9nbHRmLm5vZGVzLmZvckVhY2goKG5vZGUsIGlOb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGlDaGlsZE5vZGUgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50c1tpQ2hpbGROb2RlXSA9IGlOb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fZ2x0Zi5za2lucykge1xuICAgICAgICAgICAgdGhpcy5fc2tpblJvb3RzID0gbmV3IEFycmF5KHRoaXMuX2dsdGYuc2tpbnMubGVuZ3RoKS5maWxsKHNraW5Sb290Tm90Q2FsY3VsYXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9ub2RlUGF0aFRhYmxlID0gdGhpcy5fY3JlYXRlTm9kZVBhdGhUYWJsZSgpO1xuXG4gICAgICAgIGNvbnN0IHVzZXJEYXRhID0gb3B0aW9ucy51c2VyRGF0YSB8fCAoe30gYXMgR2xURlVzZXJEYXRhKTtcbiAgICAgICAgaWYgKHRoaXMuX2dsdGYubWVzaGVzKSB7XG4gICAgICAgICAgICAvLyBzcGxpdCB0aGUgbWVzaGVzXG4gICAgICAgICAgICBjb25zdCBub3JtYWxzID0gdXNlckRhdGEubm9ybWFscyA/PyBOb3JtYWxJbXBvcnRTZXR0aW5nLnJlcXVpcmU7XG4gICAgICAgICAgICBjb25zdCB0YW5nZW50cyA9IHVzZXJEYXRhLnRhbmdlbnRzID8/IFRhbmdlbnRJbXBvcnRTZXR0aW5nLnJlcXVpcmU7XG4gICAgICAgICAgICBjb25zdCBtb3JwaE5vcm1hbHMgPSB1c2VyRGF0YS5tb3JwaE5vcm1hbHMgPz8gTm9ybWFsSW1wb3J0U2V0dGluZy5leGNsdWRlO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9nbHRmLm1lc2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdsdGZNZXNoID0gdGhpcy5fZ2x0Zi5tZXNoZXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgbWluUG9zaXRpb24gPSBuZXcgVmVjMyhOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhQb3NpdGlvbiA9IG5ldyBWZWMzKE51bWJlci5ORUdBVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZ2VvbWV0cmllcywgbWF0ZXJpYWxJbmRpY2VzLCBqb2ludE1hcHMgfSA9IFBQR2VvbWV0cnkuc2tpbm5pbmdQcm9jZXNzKFxuICAgICAgICAgICAgICAgICAgICBnbHRmTWVzaC5wcmltaXRpdmVzLm1hcCgoZ2x0ZlByaW1pdGl2ZSwgcHJpbWl0aXZlSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBwR2VvbWV0cnkgPSB0aGlzLl9yZWFkUHJpbWl0aXZlKGdsdGZQcmltaXRpdmUsIGksIHByaW1pdGl2ZUluZGV4KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG1vcmUgdGhhbiA0IGpvaW50cywgd2Ugc2hvdWxkIHJlZHVjZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luY2Ugb3VyIGVuZ2luZSBjdXJyZW50bHkgY2FuIHByb2Nlc3Mgb25seSB1cCB0byA0IGpvaW50cy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBwR2VvbWV0cnkucmVkdWNlSm9pbnRJbmZsdWVuY2VzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FwcGx5U2V0dGluZ3MocHBHZW9tZXRyeSwgbm9ybWFscywgdGFuZ2VudHMsIG1vcnBoTm9ybWFscywgcHJpbWl0aXZlSW5kZXgsIGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVhZEJvdW5kcyhnbHRmUHJpbWl0aXZlLCB2M01pbiwgdjNNYXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVmVjMy5taW4obWluUG9zaXRpb24sIG1pblBvc2l0aW9uLCB2M01pbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBWZWMzLm1heChtYXhQb3NpdGlvbiwgbWF4UG9zaXRpb24sIHYzTWF4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBwR2VvbWV0cnkuc2FuaXR5Q2hlY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcEdlb21ldHJ5O1xuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEuZGlzYWJsZU1lc2hTcGxpdCA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzZWRNZXNoZXMucHVzaCh7IGdlb21ldHJpZXMsIG1hdGVyaWFsSW5kaWNlcywgam9pbnRNYXBzLCBtaW5Qb3NpdGlvbiwgbWF4UG9zaXRpb24gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2dsdGYubm9kZXMgJiYgdGhpcy5fZ2x0Zi5za2lucykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLl9nbHRmLm5vZGVzO1xuICAgICAgICAgICAgY29uc3QgY2FuZGlkYXRlczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubWVzaCAhPT0gdW5kZWZpbmVkICYmIG5vZGUuc2tpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZXMucHVzaChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhbmRpZGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjYW5kaWRhdGVzLnNvbWUoKG5vZGUpID0+IHRoaXMuX2lzQW5jZXN0b3JPZihub2RlLCBjYW5kaWRhdGUpKSkge1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVzW2ldID0gY2FuZGlkYXRlc1tjYW5kaWRhdGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVzLmxlbmd0aC0tO1xuICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYW5kaWRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGNhbmRpZGF0ZXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZXNbdGhpcy5fZ2V0UGFyZW50KG5vZGUpXTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NvY2tldE1hcHBpbmdzLnNldCh0aGlzLl9nZXROb2RlUGF0aChub2RlKSwgcGFyZW50Lm5hbWUgKyAnIFNvY2tldC8nICsgbm9kZXNbbm9kZV0ubmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZU1lc2goaUdsdGZNZXNoOiBudW1iZXIsIGJHZW5lcmF0ZUxpZ2h0bWFwVVYgPSBmYWxzZSwgYkFkZFZlcnRleENvbG9yID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkTWVzaCA9IHRoaXMuX3Byb2Nlc3NlZE1lc2hlc1tpR2x0Zk1lc2hdO1xuICAgICAgICBjb25zdCBnbFRGTWVzaCA9IHRoaXMuX2dsdGYubWVzaGVzIVtpR2x0Zk1lc2hdO1xuICAgICAgICBjb25zdCBidWZmZXJCbG9iID0gbmV3IEJ1ZmZlckJsb2IoKTtcbiAgICAgICAgY29uc3QgdmVydGV4QnVuZGxlcyA9IG5ldyBBcnJheTxjYy5NZXNoLklWZXJ0ZXhCdW5kbGU+KCk7XG5cbiAgICAgICAgY29uc3QgcHJpbWl0aXZlcyA9IHByb2Nlc3NlZE1lc2guZ2VvbWV0cmllcy5tYXAoKHBwR2VvbWV0cnksIHByaW1pdGl2ZUluZGV4KTogY2MuTWVzaC5JU3ViTWVzaCA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IHZlcnRleENvdW50LCB2ZXJ0ZXhTdHJpZGUsIGZvcm1hdHMsIHZlcnRleEJ1ZmZlciB9ID0gaW50ZXJsZWF2ZVZlcnRpY2VzKFxuICAgICAgICAgICAgICAgIHBwR2VvbWV0cnksXG4gICAgICAgICAgICAgICAgYkdlbmVyYXRlTGlnaHRtYXBVVixcbiAgICAgICAgICAgICAgICBiQWRkVmVydGV4Q29sb3IsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQoMCk7XG4gICAgICAgICAgICB2ZXJ0ZXhCdW5kbGVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHZpZXc6IHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IHZlcnRleEJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogdmVydGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgIHN0cmlkZTogdmVydGV4U3RyaWRlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogZm9ybWF0cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIodmVydGV4QnVmZmVyKTtcblxuICAgICAgICAgICAgY29uc3QgcHJpbWl0aXZlOiBjYy5NZXNoLklTdWJNZXNoID0ge1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZU1vZGU6IHBwR2VvbWV0cnkucHJpbWl0aXZlTW9kZSxcbiAgICAgICAgICAgICAgICBqb2ludE1hcEluZGV4OiBwcEdlb21ldHJ5LmpvaW50TWFwSW5kZXgsXG4gICAgICAgICAgICAgICAgdmVydGV4QnVuZGVsSW5kaWNlczogW3ByaW1pdGl2ZUluZGV4XSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwcEdlb21ldHJ5LmluZGljZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGljZXMgPSBwcEdlb21ldHJ5LmluZGljZXM7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KGluZGljZXMuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZS5pbmRleFZpZXcgPSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogYnVmZmVyQmxvYi5nZXRMZW5ndGgoKSxcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBpbmRpY2VzLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiBpbmRpY2VzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RyaWRlOiBpbmRpY2VzLkJZVEVTX1BFUl9FTEVNRU5ULFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIoaW5kaWNlcy5idWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmltaXRpdmU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1lc2hTdHJ1Y3Q6IGNjLk1lc2guSVN0cnVjdCA9IHtcbiAgICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgICB2ZXJ0ZXhCdW5kbGVzLFxuICAgICAgICAgICAgbWluUG9zaXRpb246IHByb2Nlc3NlZE1lc2gubWluUG9zaXRpb24sXG4gICAgICAgICAgICBtYXhQb3NpdGlvbjogcHJvY2Vzc2VkTWVzaC5tYXhQb3NpdGlvbixcbiAgICAgICAgICAgIGpvaW50TWFwczogcHJvY2Vzc2VkTWVzaC5qb2ludE1hcHMsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZXhwb3J0TW9ycGggPSB0cnVlO1xuICAgICAgICBpZiAoZXhwb3J0TW9ycGgpIHtcbiAgICAgICAgICAgIHR5cGUgU3ViTWVzaE1vcnBoID0gTm9uTnVsbGFibGU8Y2MuTWVzaC5JU3RydWN0Wydtb3JwaCddPlsnc3ViTWVzaE1vcnBocyddWzBdO1xuICAgICAgICAgICAgdHlwZSBNb3JwaFRhcmdldCA9IE5vbk51bGxhYmxlPFN1Yk1lc2hNb3JwaD5bJ3RhcmdldHMnXVswXTtcbiAgICAgICAgICAgIGNvbnN0IHN1Yk1lc2hNb3JwaHMgPSBwcm9jZXNzZWRNZXNoLmdlb21ldHJpZXMubWFwKChwcEdlb21ldHJ5KTogU3ViTWVzaE1vcnBoID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgblRhcmdldHMgPSAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXM6IFBQR2VvbWV0cnkuQXR0cmlidXRlW10gPSBbXTtcbiAgICAgICAgICAgICAgICBwcEdlb21ldHJ5LmZvckVhY2hBdHRyaWJ1dGUoKGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZS5tb3JwaHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoblRhcmdldHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5UYXJnZXRzID0gYXR0cmlidXRlLm1vcnBocy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoblRhcmdldHMgIT09IGF0dHJpYnV0ZS5tb3JwaHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBtb3JwaC4uLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChuVGFyZ2V0cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0czogTW9ycGhUYXJnZXRbXSA9IG5ldyBBcnJheShuVGFyZ2V0cyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaVRhcmdldCA9IDA7IGlUYXJnZXQgPCBuVGFyZ2V0czsgKytpVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldHNbaVRhcmdldF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGFjZW1lbnRzOiBhdHRyaWJ1dGVzLm1hcCgoYXR0cmlidXRlKTogY2MuTWVzaC5JQnVmZmVyVmlldyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlTW9ycGggPSBhdHRyaWJ1dGUubW9ycGhzIVtpVGFyZ2V0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGlnbiBhcyByZXF1aXJlbWVudCBvZiBjb3JyZXNwb25kaW5nIHR5cGVkIGFycmF5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudChhdHRyaWJ1dGVNb3JwaC5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gYnVmZmVyQmxvYi5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJCbG9iLmFkZEJ1ZmZlcihhdHRyaWJ1dGVNb3JwaC5idWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGF0dHJpYnV0ZU1vcnBoLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmlkZTogYXR0cmlidXRlTW9ycGguQllURVNfUEVSX0VMRU1FTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBhdHRyaWJ1dGVNb3JwaC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLm1hcCgoYXR0cmlidXRlKSA9PiBnZXRHZnhBdHRyaWJ1dGVOYW1lKGF0dHJpYnV0ZSkgYXMgY2MuZ2Z4LkF0dHJpYnV0ZU5hbWUpLCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldHMsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBmaXJzdE5vbk51bGxTdWJNZXNoTW9ycGggPSBzdWJNZXNoTW9ycGhzLmZpbmQoKHN1Yk1lc2hNb3JwaCkgPT4gc3ViTWVzaE1vcnBoICE9PSBudWxsKTtcblxuICAgICAgICAgICAgaWYgKGZpcnN0Tm9uTnVsbFN1Yk1lc2hNb3JwaCkge1xuICAgICAgICAgICAgICAgIGFzc2VydEdsVEZDb25mb3JtYW5jZShcbiAgICAgICAgICAgICAgICAgICAgc3ViTWVzaE1vcnBocy5ldmVyeShcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdWJNZXNoTW9ycGgpID0+ICFzdWJNZXNoTW9ycGggfHwgc3ViTWVzaE1vcnBoLnRhcmdldHMubGVuZ3RoID09PSBmaXJzdE5vbk51bGxTdWJNZXNoTW9ycGgudGFyZ2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICdnbFRGIGV4cGVjdHMgdGhhdCBldmVyeSBwcmltaXRpdmUgaGFzIHNhbWUgbnVtYmVyIG9mIHRhcmdldHMnLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Yk1lc2hNb3JwaHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydEdsVEZDb25mb3JtYW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsVEZNZXNoLndlaWdodHMgPT09IHVuZGVmaW5lZCB8fCBnbFRGTWVzaC53ZWlnaHRzLmxlbmd0aCA9PT0gZmlyc3ROb25OdWxsU3ViTWVzaE1vcnBoLnRhcmdldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ051bWJlciBvZiBcIndlaWdodHNcIiBtaXNtYXRjaCBudW1iZXIgb2YgbW9ycGggdGFyZ2V0cycsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWVzaFN0cnVjdC5tb3JwaCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3ViTWVzaE1vcnBocyxcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0czogZ2xURk1lc2gud2VpZ2h0cyxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3B1bGwvMTYzMVxuICAgICAgICAgICAgICAgIC8vID4gSW1wbGVtZW50YXRpb24gbm90ZTogQSBzaWduaWZpY2FudCBudW1iZXIgb2YgYXV0aG9yaW5nIGFuZCBjbGllbnQgaW1wbGVtZW50YXRpb25zIGFzc29jaWF0ZSBuYW1lcyB3aXRoIG1vcnBoIHRhcmdldHMuXG4gICAgICAgICAgICAgICAgLy8gPiBXaGlsZSB0aGUgZ2xURiAyLjAgc3BlY2lmaWNhdGlvbiBjdXJyZW50bHkgZG9lcyBub3QgcHJvdmlkZSBhIHdheSB0byBzcGVjaWZ5IG5hbWVzLFxuICAgICAgICAgICAgICAgIC8vID4gbW9zdCB0b29scyB1c2UgYW4gYXJyYXkgb2Ygc3RyaW5ncywgbWVzaC5leHRyYXMudGFyZ2V0TmFtZXMsIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAgICAgICAgICAgLy8gPiBUaGUgdGFyZ2V0TmFtZXMgYXJyYXkgYW5kIGFsbCBwcmltaXRpdmUgdGFyZ2V0cyBhcnJheXMgbXVzdCBoYXZlIHRoZSBzYW1lIGxlbmd0aC5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdsVEZNZXNoLmV4dHJhcyA9PT0gJ29iamVjdCcgJiYgQXJyYXkuaXNBcnJheShnbFRGTWVzaC5leHRyYXMudGFyZ2V0TmFtZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldE5hbWVzOiBzdHJpbmdbXSA9IGdsVEZNZXNoLmV4dHJhcy50YXJnZXROYW1lcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMubGVuZ3RoID09PSBmaXJzdE5vbk51bGxTdWJNZXNoTW9ycGgudGFyZ2V0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5hbWVzLmV2ZXJ5KChlbGVtKSA9PiB0eXBlb2YgZWxlbSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzaFN0cnVjdC5tb3JwaC50YXJnZXROYW1lcyA9IHRhcmdldE5hbWVzLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXNoID0gbmV3IGNjLk1lc2goKTtcbiAgICAgICAgbWVzaC5uYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLk1lc2gsIGlHbHRmTWVzaCk7XG4gICAgICAgIG1lc2guYXNzaWduKG1lc2hTdHJ1Y3QsIGJ1ZmZlckJsb2IuZ2V0Q29tYmluZWQoKSk7XG4gICAgICAgIG1lc2guaGFzaDsgLy8gc2VyaWFsaXplIGhhc2hlc1xuICAgICAgICByZXR1cm4gbWVzaDtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlU2tlbGV0b24oaUdsdGZTa2luOiBudW1iZXIsIHNvcnRNYXA/OiBudW1iZXJbXSkge1xuICAgICAgICBjb25zdCBnbHRmU2tpbiA9IHRoaXMuX2dsdGYuc2tpbnMhW2lHbHRmU2tpbl07XG5cbiAgICAgICAgY29uc3Qgc2tlbGV0b24gPSBuZXcgY2MuU2tlbGV0b24oKTtcbiAgICAgICAgc2tlbGV0b24ubmFtZSA9IHRoaXMuX2dldEdsdGZYWE5hbWUoR2x0ZkFzc2V0S2luZC5Ta2luLCBpR2x0ZlNraW4pO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjU1MVxuICAgICAgICBza2VsZXRvbi5fam9pbnRzID0gZ2x0ZlNraW4uam9pbnRzLm1hcCgoaikgPT4gdGhpcy5fbWFwVG9Tb2NrZXRQYXRoKHRoaXMuX2dldE5vZGVQYXRoKGopKSk7XG5cbiAgICAgICAgaWYgKGdsdGZTa2luLmludmVyc2VCaW5kTWF0cmljZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgaW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yID0gdGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2dsdGZTa2luLmludmVyc2VCaW5kTWF0cmljZXNdO1xuICAgICAgICAgICAgaWYgKGludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvci5jb21wb25lbnRUeXBlICE9PSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLkZMT0FUIHx8IGludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvci50eXBlICE9PSAnTUFUNCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbnZlcnNlIGJpbmQgbWF0cml4IHNob3VsZCBiZSBmbG9hdGluZy1wb2ludCA0eDQgbWF0cml4LicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBiaW5kcG9zZXM6IE1hdDRbXSA9IG5ldyBBcnJheShnbHRmU2tpbi5qb2ludHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGJpbmRwb3Nlcy5sZW5ndGggKiAxNik7XG4gICAgICAgICAgICB0aGlzLl9yZWFkQWNjZXNzb3IoaW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yLCBjcmVhdGVEYXRhVmlld0Zyb21UeXBlZEFycmF5KGRhdGEpKTtcbiAgICAgICAgICAgIGFzc2VydEdsVEZDb25mb3JtYW5jZShkYXRhLmxlbmd0aCA9PT0gMTYgKiBiaW5kcG9zZXMubGVuZ3RoLCAnV3JvbmcgZGF0YSBpbiBiaW5kLXBvc2VzIGFjY2Vzc29yLicpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kcG9zZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBiaW5kcG9zZXNbaV0gPSBuZXcgTWF0NChcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAwXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAyXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAzXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA0XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA1XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA2XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA3XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA4XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyA5XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAxMF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTYgKiBpICsgMTFdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzE2ICogaSArIDEyXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNiAqIGkgKyAxM10sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTYgKiBpICsgMTRdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzE2ICogaSArIDE1XSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI1NTFcbiAgICAgICAgICAgIHNrZWxldG9uLl9iaW5kcG9zZXMgPSBiaW5kcG9zZXM7XG4gICAgICAgIH1cblxuICAgICAgICBza2VsZXRvbi5oYXNoOyAvLyBzZXJpYWxpemUgaGFzaGVzXG4gICAgICAgIHJldHVybiBza2VsZXRvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QW5pbWF0aW9uRHVyYXRpb24oaUdsdGZBbmltYXRpb246IG51bWJlcikge1xuICAgICAgICBjb25zdCBnbHRmQW5pbWF0aW9uID0gdGhpcy5fZ2x0Zi5hbmltYXRpb25zIVtpR2x0ZkFuaW1hdGlvbl07XG4gICAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICAgIGdsdGZBbmltYXRpb24uY2hhbm5lbHMuZm9yRWFjaCgoZ2x0ZkNoYW5uZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBnbHRmQ2hhbm5lbC50YXJnZXQubm9kZTtcbiAgICAgICAgICAgIGlmICh0YXJnZXROb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBXaGVuIG5vZGUgaXNuJ3QgZGVmaW5lZCwgY2hhbm5lbCBzaG91bGQgYmUgaWdub3JlZC5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbHRmQW5pbWF0aW9uLnNhbXBsZXJzW2dsdGZDaGFubmVsLnNhbXBsZXJdO1xuICAgICAgICAgICAgY29uc3QgaW5wdXRBY2Nlc3NvciA9IHRoaXMuX2dsdGYuYWNjZXNzb3JzIVtzYW1wbGVyLmlucHV0XTtcbiAgICAgICAgICAgIGNvbnN0IGNoYW5uZWxEdXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgaW5wdXRBY2Nlc3Nvci5tYXggIT09IHVuZGVmaW5lZCAmJiBpbnB1dEFjY2Vzc29yLm1heC5sZW5ndGggPT09IDEgPyBNYXRoLmZyb3VuZChpbnB1dEFjY2Vzc29yLm1heFswXSkgOiAwO1xuICAgICAgICAgICAgZHVyYXRpb24gPSBNYXRoLm1heChjaGFubmVsRHVyYXRpb24sIGR1cmF0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkdXJhdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlQW5pbWF0aW9uKGlHbHRmQW5pbWF0aW9uOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZ2x0ZkFuaW1hdGlvbiA9IHRoaXMuX2dsdGYuYW5pbWF0aW9ucyFbaUdsdGZBbmltYXRpb25dO1xuXG4gICAgICAgIGNvbnN0IGdsVEZUcnNBbmltYXRpb25EYXRhID0gbmV3IEdsVEZUcnNBbmltYXRpb25EYXRhKCk7XG4gICAgICAgIGNvbnN0IGdldEpvaW50Q3VydmVEYXRhID0gKG5vZGU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuX21hcFRvU29ja2V0UGF0aCh0aGlzLl9nZXROb2RlUGF0aChub2RlKSk7XG4gICAgICAgICAgICByZXR1cm4gZ2xURlRyc0FuaW1hdGlvbkRhdGEuYWRkTm9kZUFuaW1hdGlvbihwYXRoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgICBjb25zdCBrZXlzID0gbmV3IEFycmF5PEZsb2F0QXJyYXk+KCk7XG4gICAgICAgIGNvbnN0IGtleXNNYXAgPSBuZXcgTWFwPG51bWJlciwgbnVtYmVyPigpO1xuICAgICAgICBjb25zdCBnZXRLZXlzSW5kZXggPSAoaUlucHV0QWNjZXNzb3I6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgbGV0IGkgPSBrZXlzTWFwLmdldChpSW5wdXRBY2Nlc3Nvcik7XG4gICAgICAgICAgICBpZiAoaSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5wdXRBY2Nlc3NvciA9IHRoaXMuX2dsdGYuYWNjZXNzb3JzIVtpSW5wdXRBY2Nlc3Nvcl07XG4gICAgICAgICAgICAgICAgY29uc3QgaW5wdXRzID0gdGhpcy5fcmVhZEFjY2Vzc29ySW50b0FycmF5KGlucHV0QWNjZXNzb3IpIGFzIEZsb2F0MzJBcnJheTtcbiAgICAgICAgICAgICAgICBpID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGlucHV0cyk7XG4gICAgICAgICAgICAgICAga2V5c01hcC5zZXQoaUlucHV0QWNjZXNzb3IsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdHJhY2tzOiBjYy5hbmltYXRpb24uVHJhY2tbXSA9IFtdO1xuXG4gICAgICAgIGdsdGZBbmltYXRpb24uY2hhbm5lbHMuZm9yRWFjaCgoZ2x0ZkNoYW5uZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBnbHRmQ2hhbm5lbC50YXJnZXQubm9kZTtcbiAgICAgICAgICAgIGlmICh0YXJnZXROb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBXaGVuIG5vZGUgaXNuJ3QgZGVmaW5lZCwgY2hhbm5lbCBzaG91bGQgYmUgaWdub3JlZC5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGpvaW50Q3VydmVEYXRhID0gZ2V0Sm9pbnRDdXJ2ZURhdGEodGFyZ2V0Tm9kZSk7XG4gICAgICAgICAgICBjb25zdCBzYW1wbGVyID0gZ2x0ZkFuaW1hdGlvbi5zYW1wbGVyc1tnbHRmQ2hhbm5lbC5zYW1wbGVyXTtcbiAgICAgICAgICAgIGNvbnN0IGlLZXlzID0gZ2V0S2V5c0luZGV4KHNhbXBsZXIuaW5wdXQpO1xuICAgICAgICAgICAgaWYgKGdsdGZDaGFubmVsLnRhcmdldC5wYXRoID09PSAnd2VpZ2h0cycpIHtcbiAgICAgICAgICAgICAgICB0cmFja3MucHVzaCguLi50aGlzLl9nbFRGV2VpZ2h0Q2hhbm5lbFRvVHJhY2tzKGdsdGZBbmltYXRpb24sIGdsdGZDaGFubmVsLCBrZXlzW2lLZXlzXSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbHRmQ2hhbm5lbFRvQ3VydmVEYXRhKGdsdGZBbmltYXRpb24sIGdsdGZDaGFubmVsLCBqb2ludEN1cnZlRGF0YSwga2V5c1tpS2V5c10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW5wdXRBY2Nlc3NvciA9IHRoaXMuX2dsdGYuYWNjZXNzb3JzIVtzYW1wbGVyLmlucHV0XTtcbiAgICAgICAgICAgIGNvbnN0IGNoYW5uZWxEdXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgaW5wdXRBY2Nlc3Nvci5tYXggIT09IHVuZGVmaW5lZCAmJiBpbnB1dEFjY2Vzc29yLm1heC5sZW5ndGggPT09IDEgPyBNYXRoLmZyb3VuZChpbnB1dEFjY2Vzc29yLm1heFswXSkgOiAwO1xuICAgICAgICAgICAgZHVyYXRpb24gPSBNYXRoLm1heChjaGFubmVsRHVyYXRpb24sIGR1cmF0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2dsdGYubm9kZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YW5kYWxvbmVJbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoWzAuMF0pO1xuICAgICAgICAgICAgY29uc3QgciA9IG5ldyBRdWF0KCk7XG4gICAgICAgICAgICBjb25zdCB0ID0gbmV3IFZlYzMoKTtcbiAgICAgICAgICAgIGNvbnN0IHMgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgdGhpcy5fZ2x0Zi5ub2Rlcy5mb3JFYWNoKChub2RlLCBub2RlSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvbW90ZWRSb290Tm9kZXMuaW5jbHVkZXMobm9kZUluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBQcm9tb3RlZCByb290IG5vZGVzIHNob3VsZCBub3QgaGF2ZSBhbmltYXRpb25zLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGpvaW50Q3VydmVEYXRhID0gZ2V0Sm9pbnRDdXJ2ZURhdGEobm9kZUluZGV4KTtcbiAgICAgICAgICAgICAgICBsZXQgbTogTWF0NCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5tYXRyaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbSA9IHRoaXMuX3JlYWROb2RlTWF0cml4KG5vZGUubWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgTWF0NC50b1JUUyhtLCByLCB0LCBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFqb2ludEN1cnZlRGF0YS5wb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gbmV3IFZlYzMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUudHJhbnNsYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlYzMuc2V0KHYsIG5vZGUudHJhbnNsYXRpb25bMF0sIG5vZGUudHJhbnNsYXRpb25bMV0sIG5vZGUudHJhbnNsYXRpb25bMl0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlYzMuY29weSh2LCB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqb2ludEN1cnZlRGF0YS5zZXRDb25zdGFudFBvc2l0aW9uKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWpvaW50Q3VydmVEYXRhLnNjYWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBuZXcgVmVjMygxLCAxLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuc2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlYzMuc2V0KHYsIG5vZGUuc2NhbGVbMF0sIG5vZGUuc2NhbGVbMV0sIG5vZGUuc2NhbGVbMl0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlYzMuY29weSh2LCBzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqb2ludEN1cnZlRGF0YS5zZXRDb25zdGFudFNjYWxlKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWpvaW50Q3VydmVEYXRhLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBuZXcgUXVhdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5yb3RhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0Tm9kZVJvdGF0aW9uKG5vZGUucm90YXRpb24sIHYpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFF1YXQuY29weSh2LCByKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqb2ludEN1cnZlRGF0YS5zZXRDb25zdGFudFJvdGF0aW9uKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhvdGljQW5pbWF0aW9uID0gZ2xURlRyc0FuaW1hdGlvbkRhdGEuY3JlYXRlRXhvdGljKCk7XG5cbiAgICAgICAgY29uc3QgYW5pbWF0aW9uQ2xpcCA9IG5ldyBjYy5BbmltYXRpb25DbGlwKCk7XG4gICAgICAgIGFuaW1hdGlvbkNsaXAubmFtZSA9IHRoaXMuX2dldEdsdGZYWE5hbWUoR2x0ZkFzc2V0S2luZC5BbmltYXRpb24sIGlHbHRmQW5pbWF0aW9uKTtcbiAgICAgICAgYW5pbWF0aW9uQ2xpcC53cmFwTW9kZSA9IGNjLkFuaW1hdGlvbkNsaXAuV3JhcE1vZGUuTG9vcDtcbiAgICAgICAgYW5pbWF0aW9uQ2xpcC5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICBhbmltYXRpb25DbGlwLnNhbXBsZSA9IDMwO1xuICAgICAgICBhbmltYXRpb25DbGlwLmhhc2g7IC8vIHNlcmlhbGl6ZSBoYXNoZXNcbiAgICAgICAgYW5pbWF0aW9uQ2xpcC5lbmFibGVUcnNCbGVuZGluZyA9IHRydWU7XG4gICAgICAgIHRyYWNrcy5mb3JFYWNoKCh0cmFjaykgPT4gYW5pbWF0aW9uQ2xpcC5hZGRUcmFjayh0cmFjaykpO1xuICAgICAgICBhbmltYXRpb25DbGlwW2V4b3RpY0FuaW1hdGlvblRhZ10gPSBleG90aWNBbmltYXRpb247XG4gICAgICAgIHJldHVybiBhbmltYXRpb25DbGlwO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVNYXRlcmlhbChcbiAgICAgICAgaUdsdGZNYXRlcmlhbDogbnVtYmVyLFxuICAgICAgICBnbHRmQXNzZXRGaW5kZXI6IElHbHRmQXNzZXRGaW5kZXIsXG4gICAgICAgIGVmZmVjdEdldHRlcjogKG5hbWU6IHN0cmluZykgPT4gY2MuRWZmZWN0QXNzZXQsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHVzZVZlcnRleENvbG9ycz86IGJvb2xlYW47XG4gICAgICAgICAgICBkZXB0aFdyaXRlSW5BbHBoYU1vZGVCbGVuZD86IGJvb2xlYW47XG4gICAgICAgICAgICBzbWFydE1hdGVyaWFsRW5hYmxlZD86IGJvb2xlYW47XG4gICAgICAgIH0sXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHVzZVZlcnRleENvbG9ycyA9IG9wdGlvbnMudXNlVmVydGV4Q29sb3JzID8/IHRydWU7XG4gICAgICAgIGNvbnN0IGRlcHRoV3JpdGVJbkFscGhhTW9kZUJsZW5kID0gb3B0aW9ucy5kZXB0aFdyaXRlSW5BbHBoYU1vZGVCbGVuZCA/PyBmYWxzZTtcbiAgICAgICAgY29uc3Qgc21hcnRNYXRlcmlhbEVuYWJsZWQgPSBvcHRpb25zLnNtYXJ0TWF0ZXJpYWxFbmFibGVkID8/IGZhbHNlO1xuICAgICAgICBjb25zdCBnbHRmTWF0ZXJpYWwgPSB0aGlzLl9nbHRmLm1hdGVyaWFscyFbaUdsdGZNYXRlcmlhbF07XG4gICAgICAgIGNvbnN0IGlzVW5saXQgPSAoZ2x0Zk1hdGVyaWFsLmV4dGVuc2lvbnMgJiYgZ2x0Zk1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc191bmxpdCkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRFeHRyYXMgPSB0aGlzLl9nbHRmLmV4dHJhcztcblxuICAgICAgICAvLyBUcmFuc2ZlciBkY2MgZGVmYXVsdCBtYXRlcmlhbCBhdHRyaWJ1dGVzLlxuICAgICAgICBpZiAoc21hcnRNYXRlcmlhbEVuYWJsZWQpIHtcbiAgICAgICAgICAgIGxldCBhcHBOYW1lID0gJyc7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50RXh0cmFzID09PSAnb2JqZWN0JyAmJiBkb2N1bWVudEV4dHJhcyAmJiAnRkJYLWdsVEYtY29udicgaW4gZG9jdW1lbnRFeHRyYXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmYnhFeHRyYXMgPSBkb2N1bWVudEV4dHJhc1snRkJYLWdsVEYtY29udiddIGFzIERvY3VtZW50RXh0cmE7XG4gICAgICAgICAgICAgICAgLy8gW1wiRkJYLWdsVEYtY29udlwiXS5mYnhGaWxlSGVhZGVySW5mby5zY2VuZUluZm8ub3JpZ2luYWwuYXBwbGljYXRpb25OYW1lXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmYnhFeHRyYXMuZmJ4RmlsZUhlYWRlckluZm8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZmJ4RXh0cmFzLmZieEZpbGVIZWFkZXJJbmZvLnNjZW5lSW5mbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcE5hbWUgPSBmYnhFeHRyYXMuZmJ4RmlsZUhlYWRlckluZm8uc2NlbmVJbmZvLm9yaWdpbmFsLmFwcGxpY2F0aW9uTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBBUFBfTkFNRV9SRUdFWF9CTEVOREVSID0gL0JsZW5kZXIvO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBBUFBfTkFNRV9SRUdFWF9NQVlBID0gL01heWEvO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBBUFBfTkFNRV9SRUdFWF8zRFNNQVggPSAvTWF4LztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgQVBQX05BTUVfUkVHRVhfQ0lORU1BNEQgPSAvQ2luZW1hLztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgQVBQX05BTUVfUkVHRVhfTUlYQU1PID0gL21peGFtby87XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhd0RhdGEgPSBnbHRmTWF0ZXJpYWwuZXh0cmFzWydGQlgtZ2xURi1jb252J10ucmF3O1xuICAgICAgICAgICAgICAgICAgICAvLyBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFQUF9OQU1FX1JFR0VYX0JMRU5ERVIudGVzdChhcHBOYW1lKSB8fCBBUFBfTkFNRV9SRUdFWF9NSVhBTU8udGVzdChhcHBOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhd0RhdGEudHlwZSA9PT0gJ3Bob25nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0QmxlbmRlclBCUk1hdGVyaWFsKGdsdGZNYXRlcmlhbCwgaUdsdGZNYXRlcmlhbCwgZ2x0ZkFzc2V0RmluZGVyLCBlZmZlY3RHZXR0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEFQUF9OQU1FX1JFR0VYX01BWUEudGVzdChhcHBOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhd0RhdGEudHlwZSA9PT0gJ3Bob25nJyB8fCByYXdEYXRhLnR5cGUgPT09ICdsYW1iZXJ0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0UGhvbmdNYXRlcmlhbChpR2x0Zk1hdGVyaWFsLCBnbHRmQXNzZXRGaW5kZXIsIGVmZmVjdEdldHRlciwgQXBwSWQuTUFZQSwgcmF3RGF0YS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmF3RGF0YS5wcm9wZXJ0aWVzLk1heWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmF3RGF0YS5wcm9wZXJ0aWVzLk1heWEudmFsdWUuVHlwZUlkLnZhbHVlID09PSAxMzk4MDMxNDQzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0TWF5YVN0YW5kYXJkU3VyZmFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlHbHRmTWF0ZXJpYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbHRmQXNzZXRGaW5kZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3RHZXR0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdEYXRhLnByb3BlcnRpZXMuTWF5YS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoQVBQX05BTUVfUkVHRVhfM0RTTUFYLnRlc3QoYXBwTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXdEYXRhLnR5cGUgPT09ICdwaG9uZycgfHwgcmF3RGF0YS50eXBlID09PSAnbGFtYmVydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udmVydFBob25nTWF0ZXJpYWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlHbHRmTWF0ZXJpYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsdGZBc3NldEZpbmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0R2V0dGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHBJZC5BRFNLXzNEU19NQVgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RhdGEucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhd0RhdGEucHJvcGVydGllc1snM2RzTWF4J10udmFsdWUuT1JJR0lOQUxfTVRMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhd0RhdGEucHJvcGVydGllc1snM2RzTWF4J10udmFsdWUuT1JJR0lOQUxfTVRMLnZhbHVlID09PSAnUEhZU0lDQUxfTVRMJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udmVydE1heFBoeXNpY2FsTWF0ZXJpYWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpR2x0Zk1hdGVyaWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0R2V0dGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3RGF0YS5wcm9wZXJ0aWVzWyczZHNNYXgnXS52YWx1ZS5QYXJhbWV0ZXJzLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChBUFBfTkFNRV9SRUdFWF9DSU5FTUE0RC50ZXN0KGFwcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmF3RGF0YS50eXBlID09PSAncGhvbmcnIHx8IHJhd0RhdGEudHlwZSA9PT0gJ2xhbWJlcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnZlcnRQaG9uZ01hdGVyaWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpR2x0Zk1hdGVyaWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbHRmQXNzZXRGaW5kZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdEdldHRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwSWQuQ0lORU1BNEQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RhdGEucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdEYXRhLnR5cGUgPT09ICdwaG9uZycgfHwgcmF3RGF0YS50eXBlID09PSAnbGFtYmVydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0UGhvbmdNYXRlcmlhbChpR2x0Zk1hdGVyaWFsLCBnbHRmQXNzZXRGaW5kZXIsIGVmZmVjdEdldHRlciwgQXBwSWQuVU5LTk9XTiwgcmF3RGF0YS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0ZhaWxlZCB0byByZWFkIGZieCBoZWFkZXIgaW5mbywgZGVmYXVsdCBtYXRlcmlhbCB3YXMgdXNlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnRmFpbGVkIHRvIHJlYWQgZmJ4IGluZm8uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwaHlzaWNhbE1hdGVyaWFsID0gKCgpOiBjYy5NYXRlcmlhbCB8IG51bGwgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3JpZ2luYWxNYXRlcmlhbEV4dHJhcyhnbHRmTWF0ZXJpYWwuZXh0cmFzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgeyBvcmlnaW5hbE1hdGVyaWFsIH0gPSBnbHRmTWF0ZXJpYWwuZXh0cmFzWydGQlgtZ2xURi1jb252J107XG4gICAgICAgICAgICAgICAgaWYgKGlzQWRzazNkc01heFBoeXNpY2FsTWF0ZXJpYWwob3JpZ2luYWxNYXRlcmlhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnZlcnRBZHNrUGh5c2ljYWxNYXRlcmlhbChnbHRmTWF0ZXJpYWwsIGlHbHRmTWF0ZXJpYWwsIGdsdGZBc3NldEZpbmRlciwgZWZmZWN0R2V0dGVyLCBvcmlnaW5hbE1hdGVyaWFsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgaWYgKHBoeXNpY2FsTWF0ZXJpYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGh5c2ljYWxNYXRlcmlhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBjYy5NYXRlcmlhbCgpO1xuICAgICAgICBtYXRlcmlhbC5uYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLk1hdGVyaWFsLCBpR2x0Zk1hdGVyaWFsKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX2VmZmVjdEFzc2V0ID0gZWZmZWN0R2V0dGVyKGBkYjovL2ludGVybmFsL2VmZmVjdHMvJHtpc1VubGl0ID8gJ2J1aWx0aW4tdW5saXQnIDogJ2J1aWx0aW4tc3RhbmRhcmQnfS5lZmZlY3RgKTtcblxuICAgICAgICBjb25zdCBkZWZpbmVzOiBQYXJ0aWFsPENyZWF0b3JTdGRNYXRlcmlhbERlZmluZXMgJiBDcmVhdG9yVW5saXRNYXRlcmlhbERlZmluZXM+ID0ge307XG4gICAgICAgIGNvbnN0IHByb3BzOiBQYXJ0aWFsPENyZWF0b3JTdGRNYXRlcmlhbFByb3BlcnRpZXMgJiBDcmVhdG9yVW5saXRNYXRlcmlhbFByb3BlcnRpZXM+ID0ge307XG4gICAgICAgIGNvbnN0IHN0YXRlczogY2MuTWF0ZXJpYWxbJ19zdGF0ZXMnXVswXSA9IHtcbiAgICAgICAgICAgIHJhc3Rlcml6ZXJTdGF0ZToge30sXG4gICAgICAgICAgICBibGVuZFN0YXRlOiB7IHRhcmdldHM6IFt7fV0gfSxcbiAgICAgICAgICAgIGRlcHRoU3RlbmNpbFN0YXRlOiB7fSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5fZ2x0Zi5tZXNoZXMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fZ2x0Zi5tZXNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNoID0gdGhpcy5fZ2x0Zi5tZXNoZXNbaV07XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtZXNoLnByaW1pdGl2ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJpbSA9IG1lc2gucHJpbWl0aXZlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaW0ubWF0ZXJpYWwgPT09IGlHbHRmTWF0ZXJpYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmltLmF0dHJpYnV0ZXNbR2x0ZlNlbWFudGljTmFtZS5DT0xPUl8wXSAmJiB1c2VWZXJ0ZXhDb2xvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfVkVSVEVYX0NPTE9SJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByaW0uYXR0cmlidXRlc1tHbHRmU2VtYW50aWNOYW1lLlRFWENPT1JEXzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lc1snSEFTX1NFQ09ORF9VViddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBnbHRmIE1hdGVyaWFsczogaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL2Jsb2IvbWFpbi9leHRlbnNpb25zLzIuMC9BcmNoaXZlZC9LSFJfbWF0ZXJpYWxzX3BiclNwZWN1bGFyR2xvc3NpbmVzcy9SRUFETUUubWRcbiAgICAgICAgbGV0IGhhc1Bick1ldGFsbGljUm91Z2huZXNzID0gZmFsc2U7XG4gICAgICAgIGlmIChnbHRmTWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHBick1ldGFsbGljUm91Z2huZXNzID0gZ2x0Zk1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzO1xuICAgICAgICAgICAgaWYgKHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGhhc1Bick1ldGFsbGljUm91Z2huZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYWluVGV4dHVyZSA9IGdsdGZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCk7XG4gICAgICAgICAgICAgICAgZGVmaW5lc1tpc1VubGl0ID8gJ1VTRV9URVhUVVJFJyA6ICdVU0VfQUxCRURPX01BUCddID0gbWFpblRleHR1cmUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgcHJvcHNbJ21haW5UZXh0dXJlJ10gPSBtYWluVGV4dHVyZTtcbiAgICAgICAgICAgICAgICBpZiAocGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yVGV4dHVyZS50ZXhDb29yZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzWydBTEJFRE9fVVYnXSA9ICd2X3V2MSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwYnJNZXRhbGxpY1JvdWdobmVzcy5iYXNlQ29sb3JUZXh0dXJlLmV4dGVuc2lvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yVGV4dHVyZS5leHRlbnNpb25zLktIUl90ZXh0dXJlX3RyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbJ3RpbGluZ09mZnNldCddID0gdGhpcy5fa2hyVGV4dHVyZVRyYW5zZm9ybVRvVGlsaW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmUuZXh0ZW5zaW9ucy5LSFJfdGV4dHVyZV90cmFuc2Zvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvckZhY3Rvcikge1xuICAgICAgICAgICAgICAgIGhhc1Bick1ldGFsbGljUm91Z2huZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yRmFjdG9yO1xuICAgICAgICAgICAgICAgIGlmIChpc1VubGl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzWydtYWluQ29sb3InXSA9IG5ldyBWZWM0KGNbMF0sIGNbMV0sIGNbMl0sIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzWydhbGJlZG9TY2FsZSddID0gbmV3IFZlYzMoY1swXSwgY1sxXSwgY1syXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBick1ldGFsbGljUm91Z2huZXNzLm1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaGFzUGJyTWV0YWxsaWNSb3VnaG5lc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9QQlJfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BzWydwYnJNYXAnXSA9IGdsdGZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBick1ldGFsbGljUm91Z2huZXNzLm1ldGFsbGljUm91Z2huZXNzVGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKTtcbiAgICAgICAgICAgICAgICBwcm9wc1snbWV0YWxsaWMnXSA9IDE7XG4gICAgICAgICAgICAgICAgcHJvcHNbJ3JvdWdobmVzcyddID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYnJNZXRhbGxpY1JvdWdobmVzcy5tZXRhbGxpY0ZhY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaGFzUGJyTWV0YWxsaWNSb3VnaG5lc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BzWydtZXRhbGxpYyddID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNGYWN0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGJyTWV0YWxsaWNSb3VnaG5lc3Mucm91Z2huZXNzRmFjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBoYXNQYnJNZXRhbGxpY1JvdWdobmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcHNbJ3JvdWdobmVzcyddID0gcGJyTWV0YWxsaWNSb3VnaG5lc3Mucm91Z2huZXNzRmFjdG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzUGJyTWV0YWxsaWNSb3VnaG5lc3MpIHtcbiAgICAgICAgICAgIGlmIChnbHRmTWF0ZXJpYWwuZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19wYnJTcGVjdWxhckdsb3NzaW5lc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udmVydEdsdGZQYnJTcGVjdWxhckdsb3NzaW5lc3MoXG4gICAgICAgICAgICAgICAgICAgIGdsdGZNYXRlcmlhbCxcbiAgICAgICAgICAgICAgICAgICAgaUdsdGZNYXRlcmlhbCxcbiAgICAgICAgICAgICAgICAgICAgZ2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICAgICAgICAgICAgICBlZmZlY3RHZXR0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoV3JpdGVJbkFscGhhTW9kZUJsZW5kLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdsdGZNYXRlcmlhbC5ub3JtYWxUZXh0dXJlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBick5vcm1hbFRleHR1cmUgPSBnbHRmTWF0ZXJpYWwubm9ybWFsVGV4dHVyZTtcbiAgICAgICAgICAgIGlmIChwYnJOb3JtYWxUZXh0dXJlLmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfTk9STUFMX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wc1snbm9ybWFsTWFwJ10gPSBnbHRmQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwYnJOb3JtYWxUZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpO1xuICAgICAgICAgICAgICAgIGlmIChwYnJOb3JtYWxUZXh0dXJlLnNjYWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHNbJ25vcm1hbFN0cmVudGgnXSA9IHBick5vcm1hbFRleHR1cmUuc2NhbGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHNbJ29jY2x1c2lvbiddID0gMC4wO1xuICAgICAgICBpZiAoZ2x0Zk1hdGVyaWFsLm9jY2x1c2lvblRleHR1cmUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBick9jY2x1c2lvblRleHR1cmUgPSBnbHRmTWF0ZXJpYWwub2NjbHVzaW9uVGV4dHVyZTtcbiAgICAgICAgICAgIGlmIChwYnJPY2NsdXNpb25UZXh0dXJlLmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfT0NDTFVTSU9OX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wc1snb2NjbHVzaW9uTWFwJ10gPSBnbHRmQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwYnJPY2NsdXNpb25UZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpO1xuICAgICAgICAgICAgICAgIGlmIChwYnJPY2NsdXNpb25UZXh0dXJlLnN0cmVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHNbJ29jY2x1c2lvbiddID0gcGJyT2NjbHVzaW9uVGV4dHVyZS5zdHJlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2x0Zk1hdGVyaWFsLmVtaXNzaXZlVGV4dHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfRU1JU1NJVkVfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGdsdGZNYXRlcmlhbC5lbWlzc2l2ZVRleHR1cmUudGV4Q29vcmQpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydFTUlTU0lWRV9VViddID0gJ3ZfdXYxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3BzWydlbWlzc2l2ZU1hcCddID0gZ2x0ZkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgZ2x0Zk1hdGVyaWFsLmVtaXNzaXZlVGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnbHRmTWF0ZXJpYWwuZW1pc3NpdmVGYWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgdiA9IGdsdGZNYXRlcmlhbC5lbWlzc2l2ZUZhY3RvcjtcbiAgICAgICAgICAgIHByb3BzWydlbWlzc2l2ZSddID0gdGhpcy5fbm9ybWFsaXplQXJyYXlUb0NvY29zQ29sb3IodilbMV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2x0Zk1hdGVyaWFsLmRvdWJsZVNpZGVkKSB7XG4gICAgICAgICAgICBzdGF0ZXMucmFzdGVyaXplclN0YXRlIS5jdWxsTW9kZSA9IGdmeC5DdWxsTW9kZS5OT05FO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChnbHRmTWF0ZXJpYWwuYWxwaGFNb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdCTEVORCc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBibGVuZFN0YXRlID0gc3RhdGVzLmJsZW5kU3RhdGUhLnRhcmdldHMhWzBdO1xuICAgICAgICAgICAgICAgIGJsZW5kU3RhdGUuYmxlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJsZW5kU3RhdGUuYmxlbmRTcmMgPSBnZnguQmxlbmRGYWN0b3IuU1JDX0FMUEhBO1xuICAgICAgICAgICAgICAgIGJsZW5kU3RhdGUuYmxlbmREc3QgPSBnZnguQmxlbmRGYWN0b3IuT05FX01JTlVTX1NSQ19BTFBIQTtcbiAgICAgICAgICAgICAgICBibGVuZFN0YXRlLmJsZW5kRHN0QWxwaGEgPSBnZnguQmxlbmRGYWN0b3IuT05FX01JTlVTX1NSQ19BTFBIQTtcbiAgICAgICAgICAgICAgICBzdGF0ZXMuZGVwdGhTdGVuY2lsU3RhdGUhLmRlcHRoV3JpdGUgPSBkZXB0aFdyaXRlSW5BbHBoYU1vZGVCbGVuZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ01BU0snOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxwaGFDdXRvZmYgPSBnbHRmTWF0ZXJpYWwuYWxwaGFDdXRvZmYgPT09IHVuZGVmaW5lZCA/IDAuNSA6IGdsdGZNYXRlcmlhbC5hbHBoYUN1dG9mZjtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfQUxQSEFfVEVTVCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wc1snYWxwaGFUaHJlc2hvbGQnXSA9IGFscGhhQ3V0b2ZmO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnT1BBUVVFJzpcbiAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIoR2x0ZkNvbnZlcnRlci5Mb2dMZXZlbC5XYXJuaW5nLCBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkQWxwaGFNb2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IGdsdGZNYXRlcmlhbC5hbHBoYU1vZGUsXG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsOiBpR2x0Zk1hdGVyaWFsLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX2RlZmluZXMgPSBbZGVmaW5lc107XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9wcm9wcyA9IFtwcm9wc107XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9zdGF0ZXMgPSBbc3RhdGVzXTtcblxuICAgICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFRleHR1cmVQYXJhbWV0ZXJzKGdsdGZUZXh0dXJlOiBUZXh0dXJlLCB1c2VyRGF0YTogVGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRXcmFwTW9kZSA9IChnbHRmV3JhcE1vZGU/OiBudW1iZXIpOiBXcmFwTW9kZSA9PiB7XG4gICAgICAgICAgICBpZiAoZ2x0ZldyYXBNb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBnbHRmV3JhcE1vZGUgPSBHbHRmV3JhcE1vZGUuX19ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChnbHRmV3JhcE1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEdsdGZXcmFwTW9kZS5DTEFNUF9UT19FREdFOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2NsYW1wLXRvLWVkZ2UnO1xuICAgICAgICAgICAgICAgIGNhc2UgR2x0ZldyYXBNb2RlLk1JUlJPUkVEX1JFUEVBVDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdtaXJyb3JlZC1yZXBlYXQnO1xuICAgICAgICAgICAgICAgIGNhc2UgR2x0ZldyYXBNb2RlLlJFUEVBVDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdyZXBlYXQnO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlcihHbHRmQ29udmVydGVyLkxvZ0xldmVsLldhcm5pbmcsIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRUZXh0dXJlUGFyYW1ldGVyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd3JhcE1vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdsdGZXcmFwTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrOiBHbHRmV3JhcE1vZGUuUkVQRUFULFxuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlcjogZ2x0ZlRleHR1cmUuc2FtcGxlciEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlOiB0aGlzLl9nbHRmLnRleHR1cmVzIS5pbmRleE9mKGdsdGZUZXh0dXJlKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAncmVwZWF0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjb252ZXJ0TWFnRmlsdGVyID0gKGdsdGZGaWx0ZXI6IG51bWJlcik6IEZpbHRlciA9PiB7XG4gICAgICAgICAgICBzd2l0Y2ggKGdsdGZGaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEdsdGZUZXh0dXJlTWFnRmlsdGVyLk5FQVJFU1Q6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbmVhcmVzdCc7XG4gICAgICAgICAgICAgICAgY2FzZSBHbHRmVGV4dHVyZU1hZ0ZpbHRlci5MSU5FQVI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbGluZWFyJztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIoR2x0ZkNvbnZlcnRlci5Mb2dMZXZlbC5XYXJuaW5nLCBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkVGV4dHVyZVBhcmFtZXRlciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ21hZ0ZpbHRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZ2x0ZkZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrOiBHbHRmVGV4dHVyZU1hZ0ZpbHRlci5MSU5FQVIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVyOiBnbHRmVGV4dHVyZS5zYW1wbGVyISxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmU6IHRoaXMuX2dsdGYudGV4dHVyZXMhLmluZGV4T2YoZ2x0ZlRleHR1cmUpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdsaW5lYXInO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEFsc28gY29udmVydCBtaXAgZmlsdGVyLlxuICAgICAgICBjb25zdCBjb252ZXJ0TWluRmlsdGVyID0gKGdsdGZGaWx0ZXI6IG51bWJlcik6IEZpbHRlcltdID0+IHtcbiAgICAgICAgICAgIHN3aXRjaCAoZ2x0ZkZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNhc2UgR2x0ZlRleHR1cmVNaW5GaWx0ZXIuTkVBUkVTVDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnbmVhcmVzdCcsICdub25lJ107XG4gICAgICAgICAgICAgICAgY2FzZSBHbHRmVGV4dHVyZU1pbkZpbHRlci5MSU5FQVI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbJ2xpbmVhcicsICdub25lJ107XG4gICAgICAgICAgICAgICAgY2FzZSBHbHRmVGV4dHVyZU1pbkZpbHRlci5ORUFSRVNUX01JUE1BUF9ORUFSRVNUOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyduZWFyZXN0JywgJ25lYXJlc3QnXTtcbiAgICAgICAgICAgICAgICBjYXNlIEdsdGZUZXh0dXJlTWluRmlsdGVyLkxJTkVBUl9NSVBNQVBfTkVBUkVTVDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnbGluZWFyJywgJ25lYXJlc3QnXTtcbiAgICAgICAgICAgICAgICBjYXNlIEdsdGZUZXh0dXJlTWluRmlsdGVyLk5FQVJFU1RfTUlQTUFQX0xJTkVBUjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnbmVhcmVzdCcsICdsaW5lYXInXTtcbiAgICAgICAgICAgICAgICBjYXNlIEdsdGZUZXh0dXJlTWluRmlsdGVyLkxJTkVBUl9NSVBNQVBfTElORUFSOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWydsaW5lYXInLCAnbGluZWFyJ107XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyKEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuV2FybmluZywgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5VbnN1cHBvcnRlZFRleHR1cmVQYXJhbWV0ZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdtaW5GaWx0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdsdGZGaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxsYmFjazogR2x0ZlRleHR1cmVNaW5GaWx0ZXIuTElORUFSLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlcjogZ2x0ZlRleHR1cmUuc2FtcGxlciEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlOiB0aGlzLl9nbHRmLnRleHR1cmVzIS5pbmRleE9mKGdsdGZUZXh0dXJlKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbJ2xpbmVhcicsICdub25lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGdsdGZUZXh0dXJlLnNhbXBsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdXNlckRhdGEud3JhcE1vZGVTID0gJ3JlcGVhdCc7XG4gICAgICAgICAgICB1c2VyRGF0YS53cmFwTW9kZVQgPSAncmVwZWF0JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGdsdGZTYW1wbGVyID0gdGhpcy5fZ2x0Zi5zYW1wbGVycyFbZ2x0ZlRleHR1cmUuc2FtcGxlcl07XG4gICAgICAgICAgICB1c2VyRGF0YS53cmFwTW9kZVMgPSBjb252ZXJ0V3JhcE1vZGUoZ2x0ZlNhbXBsZXIud3JhcFMpO1xuICAgICAgICAgICAgdXNlckRhdGEud3JhcE1vZGVUID0gY29udmVydFdyYXBNb2RlKGdsdGZTYW1wbGVyLndyYXBUKTtcbiAgICAgICAgICAgIHVzZXJEYXRhLm1hZ2ZpbHRlciA9IGdsdGZTYW1wbGVyLm1hZ0ZpbHRlciA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdE1hZ0ZpbHRlciA6IGNvbnZlcnRNYWdGaWx0ZXIoZ2x0ZlNhbXBsZXIubWFnRmlsdGVyKTtcbiAgICAgICAgICAgIHVzZXJEYXRhLm1pbmZpbHRlciA9IGRlZmF1bHRNaW5GaWx0ZXI7XG4gICAgICAgICAgICBpZiAoZ2x0ZlNhbXBsZXIubWluRmlsdGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbWluLCBtaXBdID0gY29udmVydE1pbkZpbHRlcihnbHRmU2FtcGxlci5taW5GaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHVzZXJEYXRhLm1pbmZpbHRlciA9IG1pbjtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5taXBmaWx0ZXIgPSBtaXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlU2NlbmUoaUdsdGZTY2VuZTogbnVtYmVyLCBnbHRmQXNzZXRGaW5kZXI6IElHbHRmQXNzZXRGaW5kZXIsIHdpdGhUcmFuc2Zvcm0gPSB0cnVlKTogY2MuTm9kZSB7XG4gICAgICAgIGNvbnN0IHNjZW5lID0gdGhpcy5fZ2V0U2NlbmVOb2RlKGlHbHRmU2NlbmUsIGdsdGZBc3NldEZpbmRlciwgd2l0aFRyYW5zZm9ybSk7XG4gICAgICAgIC8vIHVwZGF0ZSBza2lubmluZyByb290IHRvIGFuaW1hdGlvbiByb290IG5vZGVcbiAgICAgICAgc2NlbmUuZ2V0Q29tcG9uZW50c0luQ2hpbGRyZW4oY2MuU2tpbm5lZE1lc2hSZW5kZXJlcikuZm9yRWFjaCgoY29tcCkgPT4gKGNvbXAuc2tpbm5pbmdSb290ID0gc2NlbmUpKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTb2NrZXRzKHNjZW5lTm9kZTogY2MuTm9kZSkge1xuICAgICAgICBjb25zdCBzb2NrZXRzOiBjYy5Tb2NrZXRbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5fc29ja2V0TWFwcGluZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZU5vZGUuZ2V0Q2hpbGRCeVBhdGgocGFpclswXSkhO1xuICAgICAgICAgICAgZG9DcmVhdGVTb2NrZXQoc2NlbmVOb2RlLCBzb2NrZXRzLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc29ja2V0cztcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEltYWdlSW5CdWZmZXJWaWV3KGJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWRCdWZmZXJWaWV3KGJ1ZmZlclZpZXcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3dhcm5JZkV4dGVuc2lvbk5vdFN1cHBvcnRlZChuYW1lOiBzdHJpbmcsIHJlcXVpcmVkOiBib29sZWFuKSB7XG4gICAgICAgIGlmICghc3VwcG9ydGVkRXh0ZW5zaW9ucy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlcihHbHRmQ29udmVydGVyLkxvZ0xldmVsLldhcm5pbmcsIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRFeHRlbnNpb24sIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9wcm9tb3RlU2luZ2xlUm9vdE5vZGVzKCkge1xuICAgICAgICBpZiAodGhpcy5fZ2x0Zi5ub2RlcyA9PT0gdW5kZWZpbmVkIHx8IHRoaXMuX2dsdGYuc2NlbmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGdsVEZTY2VuZSBvZiB0aGlzLl9nbHRmLnNjZW5lcykge1xuICAgICAgICAgICAgaWYgKGdsVEZTY2VuZS5ub2RlcyAhPT0gdW5kZWZpbmVkICYmIGdsVEZTY2VuZS5ub2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBpdCdzIHRoZSBvbmx5IHJvb3Qgbm9kZSBpbiB0aGUgc2NlbmUuXG4gICAgICAgICAgICAgICAgLy8gV2Ugd291bGQgcHJvbW90ZSBpdCB0byB0aGUgcHJlZmFiJ3Mgcm9vdChpLmUgdGhlIHNraW5uaW5nIHJvb3QpLlxuICAgICAgICAgICAgICAgIC8vIFNvIHdlIGNhbm5vdCBpbmNsdWRlIGl0IGFzIHBhcnQgb2YgdGhlIGpvaW50IHBhdGggb3IgYW5pbWF0aW9uIHRhcmdldCBwYXRoLlxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlSW5kZXggPSBnbFRGU2NlbmUubm9kZXNbMF07XG5cbiAgICAgICAgICAgICAgICAvLyBXZSBjYW4ndCBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uIGlmIHRoZSByb290IHBhcnRpY2lwYXRlcyBpbiBza2lubmluZywgb3ItLVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9nbHRmLnNraW5zICYmIHRoaXMuX2dsdGYuc2tpbnMuc29tZSgoc2tpbikgPT4gc2tpbi5qb2ludHMuaW5jbHVkZXMocm9vdE5vZGVJbmRleCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGFuaW1hdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsdGYuYW5pbWF0aW9ucyAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbHRmLmFuaW1hdGlvbnMuc29tZSgoYW5pbWF0aW9uOiBhbnkpID0+IGFuaW1hdGlvbi5jaGFubmVscy5zb21lKChjaGFubmVsOiBhbnkpID0+IGNoYW5uZWwudGFyZ2V0Lm5vZGUgPT09IHJvb3ROb2RlSW5kZXgpKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9tb3RlZFJvb3ROb2Rlcy5wdXNoKHJvb3ROb2RlSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Tm9kZVJvdGF0aW9uKHJvdGF0aW9uOiBudW1iZXJbXSwgb3V0OiBRdWF0KSB7XG4gICAgICAgIFF1YXQuc2V0KG91dCwgcm90YXRpb25bMF0sIHJvdGF0aW9uWzFdLCByb3RhdGlvblsyXSwgcm90YXRpb25bM10pO1xuICAgICAgICBRdWF0Lm5vcm1hbGl6ZShvdXQsIG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2x0ZkNoYW5uZWxUb0N1cnZlRGF0YShcbiAgICAgICAgZ2x0ZkFuaW1hdGlvbjogQW5pbWF0aW9uLFxuICAgICAgICBnbHRmQ2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICAgICAgam9pbnRDdXJ2ZURhdGE6IFJldHVyblR5cGU8R2xURlRyc0FuaW1hdGlvbkRhdGFbJ2FkZE5vZGVBbmltYXRpb24nXT4sXG4gICAgICAgIGlucHV0OiBGbG9hdEFycmF5LFxuICAgICkge1xuICAgICAgICBsZXQgcHJvcE5hbWU6ICdwb3NpdGlvbicgfCAnc2NhbGUnIHwgJ3JvdGF0aW9uJztcbiAgICAgICAgaWYgKGdsdGZDaGFubmVsLnRhcmdldC5wYXRoID09PSBHbHRmQW5pbWF0aW9uQ2hhbm5lbFRhcmdldFBhdGgudHJhbnNsYXRpb24pIHtcbiAgICAgICAgICAgIHByb3BOYW1lID0gJ3Bvc2l0aW9uJztcbiAgICAgICAgfSBlbHNlIGlmIChnbHRmQ2hhbm5lbC50YXJnZXQucGF0aCA9PT0gR2x0ZkFuaW1hdGlvbkNoYW5uZWxUYXJnZXRQYXRoLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBwcm9wTmFtZSA9ICdyb3RhdGlvbic7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2x0ZkNoYW5uZWwudGFyZ2V0LnBhdGggPT09IEdsdGZBbmltYXRpb25DaGFubmVsVGFyZ2V0UGF0aC5zY2FsZSkge1xuICAgICAgICAgICAgcHJvcE5hbWUgPSAnc2NhbGUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyKEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuRXJyb3IsIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRDaGFubmVsUGF0aCwge1xuICAgICAgICAgICAgICAgIGNoYW5uZWw6IGdsdGZBbmltYXRpb24uY2hhbm5lbHMuaW5kZXhPZihnbHRmQ2hhbm5lbCksXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiB0aGlzLl9nbHRmLmFuaW1hdGlvbnMhLmluZGV4T2YoZ2x0ZkFuaW1hdGlvbiksXG4gICAgICAgICAgICAgICAgcGF0aDogZ2x0ZkNoYW5uZWwudGFyZ2V0LnBhdGgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdsdGZTYW1wbGVyID0gZ2x0ZkFuaW1hdGlvbi5zYW1wbGVyc1tnbHRmQ2hhbm5lbC5zYW1wbGVyXTtcblxuICAgICAgICBjb25zdCBpbnRlcnBvbGF0aW9uID0gZ2x0ZlNhbXBsZXIuaW50ZXJwb2xhdGlvbiA/PyBHbFRmQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5MSU5FQVI7XG4gICAgICAgIHN3aXRjaCAoaW50ZXJwb2xhdGlvbikge1xuICAgICAgICAgICAgY2FzZSBHbFRmQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5TVEVQOlxuICAgICAgICAgICAgY2FzZSBHbFRmQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5MSU5FQVI6XG4gICAgICAgICAgICBjYXNlIEdsVGZBbmltYXRpb25JbnRlcnBvbGF0aW9uLkNVQklDX1NQTElORTpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5fcmVhZEFjY2Vzc29ySW50b0FycmF5QW5kTm9ybWFsaXplQXNGbG9hdCh0aGlzLl9nbHRmLmFjY2Vzc29ycyFbZ2x0ZlNhbXBsZXIub3V0cHV0XSk7XG5cbiAgICAgICAgam9pbnRDdXJ2ZURhdGFbcHJvcE5hbWVdID0gbmV3IEdsVEZUcnNUcmFja0RhdGEoaW50ZXJwb2xhdGlvbiwgaW5wdXQsIG91dHB1dCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2xURldlaWdodENoYW5uZWxUb1RyYWNrcyhnbHRmQW5pbWF0aW9uOiBBbmltYXRpb24sIGdsdGZDaGFubmVsOiBBbmltYXRpb25DaGFubmVsLCB0aW1lczogRmxvYXRBcnJheSk6IGNjLmFuaW1hdGlvbi5UcmFja1tdIHtcbiAgICAgICAgY29uc3QgZ2x0ZlNhbXBsZXIgPSBnbHRmQW5pbWF0aW9uLnNhbXBsZXJzW2dsdGZDaGFubmVsLnNhbXBsZXJdO1xuICAgICAgICBjb25zdCBvdXRwdXRzID0gdGhpcy5fcmVhZEFjY2Vzc29ySW50b0FycmF5QW5kTm9ybWFsaXplQXNGbG9hdCh0aGlzLl9nbHRmLmFjY2Vzc29ycyFbZ2x0ZlNhbXBsZXIub3V0cHV0XSk7XG4gICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB0aGlzLl9nbHRmLm5vZGVzIVtnbHRmQ2hhbm5lbC50YXJnZXQubm9kZSFdO1xuICAgICAgICBjb25zdCB0YXJnZXRQcm9jZXNzZWRNZXNoID0gdGhpcy5fcHJvY2Vzc2VkTWVzaGVzW3RhcmdldE5vZGUubWVzaCFdO1xuICAgICAgICBjb25zdCB0cmFja3MgPSBuZXcgQXJyYXk8Y2MuYW5pbWF0aW9uLlRyYWNrPigpO1xuICAgICAgICBjb25zdCBuU3ViTWVzaGVzID0gdGFyZ2V0UHJvY2Vzc2VkTWVzaC5nZW9tZXRyaWVzLmxlbmd0aDtcbiAgICAgICAgbGV0IG5UYXJnZXQgPSAwO1xuICAgICAgICBmb3IgKGxldCBpU3ViTWVzaCA9IDA7IGlTdWJNZXNoIDwgblN1Yk1lc2hlczsgKytpU3ViTWVzaCkge1xuICAgICAgICAgICAgY29uc3QgZ2VvbWV0cnkgPSB0YXJnZXRQcm9jZXNzZWRNZXNoLmdlb21ldHJpZXNbaVN1Yk1lc2hdO1xuICAgICAgICAgICAgaWYgKCFnZW9tZXRyeS5oYXNBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MucG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IG1vcnBocyB9ID0gZ2VvbWV0cnkuZ2V0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmICghbW9ycGhzKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuVGFyZ2V0ID0gbW9ycGhzLmxlbmd0aDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuVGFyZ2V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFxuICAgICAgICAgICAgICAgIGBNb3JwaCBhbmltYXRpb24gaW4gJHtnbHRmQW5pbWF0aW9uLm5hbWV9IG9uIG5vZGUgJHt0aGlzLl9nbHRmLm5vZGVzIVtnbHRmQ2hhbm5lbC50YXJnZXQubm9kZSFdfWAgK1xuICAgICAgICAgICAgICAgICdpcyBnb2luZyB0byBiZSBpZ25vcmVkIGR1ZSB0byBsYWNrIG9mIG1vcnBoIGluZm9ybWF0aW9uIGluIG1lc2guJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHJhY2sgPSBuZXcgUmVhbEFycmF5VHJhY2soKTtcbiAgICAgICAgdHJhY2tzLnB1c2godHJhY2spO1xuICAgICAgICB0cmFjay5wYXRoID0gbmV3IGNjLmFuaW1hdGlvbi5UcmFja1BhdGgoKVxuICAgICAgICAgICAgLnRvSGllcmFyY2h5KHRoaXMuX21hcFRvU29ja2V0UGF0aCh0aGlzLl9nZXROb2RlUGF0aChnbHRmQ2hhbm5lbC50YXJnZXQubm9kZSEpKSlcbiAgICAgICAgICAgIC50b0NvbXBvbmVudChjYy5qcy5nZXRDbGFzc05hbWUoY2MuTWVzaFJlbmRlcmVyKSk7XG4gICAgICAgIHRyYWNrLnByb3h5ID0gbmV3IGNjLmFuaW1hdGlvbi5Nb3JwaFdlaWdodHNBbGxWYWx1ZVByb3h5KCk7XG4gICAgICAgIHRyYWNrLmVsZW1lbnRDb3VudCA9IG5UYXJnZXQ7XG4gICAgICAgIGZvciAobGV0IGlUYXJnZXQgPSAwOyBpVGFyZ2V0IDwgblRhcmdldDsgKytpVGFyZ2V0KSB7XG4gICAgICAgICAgICBjb25zdCB7IGN1cnZlIH0gPSB0cmFjay5jaGFubmVscygpW2lUYXJnZXRdO1xuICAgICAgICAgICAgY29uc3QgZnJhbWVWYWx1ZXM6IFBhcnRpYWw8Y2MuUmVhbEtleWZyYW1lVmFsdWU+W10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0aW1lcy5sZW5ndGggfSwgKF8sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvdXRwdXRzW25UYXJnZXQgKiBpbmRleCArIGlUYXJnZXRdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleWZyYW1lVmFsdWUgPSB7IHZhbHVlLCBpbnRlcnBvbGF0aW9uTW9kZTogY2MuUmVhbEludGVycG9sYXRpb25Nb2RlLkxJTkVBUiB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXlmcmFtZVZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJ2ZS5hc3NpZ25Tb3J0ZWQoQXJyYXkuZnJvbSh0aW1lcyksIGZyYW1lVmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJhY2tzO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFBhcmVudChub2RlOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudHNbbm9kZV07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Um9vdFBhcmVudChub2RlOiBudW1iZXIpIHtcbiAgICAgICAgZm9yIChsZXQgcGFyZW50ID0gbm9kZTsgcGFyZW50ID49IDA7IHBhcmVudCA9IHRoaXMuX2dldFBhcmVudChub2RlKSkge1xuICAgICAgICAgICAgbm9kZSA9IHBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb21tb25Sb290KG5vZGVzOiBudW1iZXJbXSkge1xuICAgICAgICBsZXQgbWluUGF0aExlbiA9IEluZmluaXR5O1xuICAgICAgICBjb25zdCBwYXRocyA9IG5vZGVzLm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0aDogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBjdXJOb2RlID0gbm9kZTtcbiAgICAgICAgICAgIHdoaWxlIChjdXJOb2RlID49IDApIHtcbiAgICAgICAgICAgICAgICBwYXRoLnVuc2hpZnQoY3VyTm9kZSk7XG4gICAgICAgICAgICAgICAgY3VyTm9kZSA9IHRoaXMuX2dldFBhcmVudChjdXJOb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1pblBhdGhMZW4gPSBNYXRoLm1pbihtaW5QYXRoTGVuLCBwYXRoLmxlbmd0aCk7XG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChwYXRocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbW1vblBhdGg6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWluUGF0aExlbjsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBuID0gcGF0aHNbMF1baV07XG4gICAgICAgICAgICBpZiAocGF0aHMuZXZlcnkoKHBhdGgpID0+IHBhdGhbaV0gPT09IG4pKSB7XG4gICAgICAgICAgICAgICAgY29tbW9uUGF0aC5wdXNoKG4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21tb25QYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21tb25QYXRoW2NvbW1vblBhdGgubGVuZ3RoIC0gMV07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0U2tpblJvb3Qoc2tpbjogbnVtYmVyKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLl9za2luUm9vdHNbc2tpbl07XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHNraW5Sb290Tm90Q2FsY3VsYXRlZCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fY29tbW9uUm9vdCh0aGlzLl9nbHRmLnNraW5zIVtza2luXS5qb2ludHMpO1xuICAgICAgICAgICAgdGhpcy5fc2tpblJvb3RzW3NraW5dID0gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVhZFByaW1pdGl2ZShnbFRGUHJpbWl0aXZlOiBNZXNoUHJpbWl0aXZlLCBtZXNoSW5kZXg6IG51bWJlciwgcHJpbWl0aXZlSW5kZXg6IG51bWJlcikge1xuICAgICAgICBsZXQgZGVjb2RlZERyYWNvR2VvbWV0cnk6IERlY29kZWREcmFjb0dlb21ldHJ5IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGlmIChnbFRGUHJpbWl0aXZlLmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZXh0ZW5zaW9uTmFtZSBvZiBPYmplY3Qua2V5cyhnbFRGUHJpbWl0aXZlLmV4dGVuc2lvbnMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2xURlByaW1pdGl2ZS5leHRlbnNpb25zW2V4dGVuc2lvbk5hbWVdO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXh0ZW5zaW9uTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdLSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNvZGVkRHJhY29HZW9tZXRyeSA9IHRoaXMuX2RlY29kZURyYWNvR2VvbWV0cnkoZ2xURlByaW1pdGl2ZSwgZXh0ZW5zaW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZU1vZGUgPSB0aGlzLl9nZXRQcmltaXRpdmVNb2RlKGdsVEZQcmltaXRpdmUubW9kZSA9PT0gdW5kZWZpbmVkID8gR2x0ZlByaW1pdGl2ZU1vZGUuX19ERUZBVUxUIDogZ2xURlByaW1pdGl2ZS5tb2RlKTtcblxuICAgICAgICBsZXQgaW5kaWNlczogUFBHZW9tZXRyeVR5cGVkQXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChnbFRGUHJpbWl0aXZlLmluZGljZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbGV0IGRhdGE6IFBQR2VvbWV0cnlUeXBlZEFycmF5O1xuICAgICAgICAgICAgaWYgKGRlY29kZWREcmFjb0dlb21ldHJ5ICYmIGRlY29kZWREcmFjb0dlb21ldHJ5LmluZGljZXMpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGVjb2RlZERyYWNvR2VvbWV0cnkuaW5kaWNlcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kaWNlc0FjY2Vzc29yID0gdGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2dsVEZQcmltaXRpdmUuaW5kaWNlc107XG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX3JlYWRBY2Nlc3NvckludG9BcnJheShpbmRpY2VzQWNjZXNzb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kaWNlcyA9IGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShHbHRmU2VtYW50aWNOYW1lLlBPU0lUSU9OIGluIGdsVEZQcmltaXRpdmUuYXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByaW1pdGl2ZSBkb2VzblxcJ3QgY29udGFpbnMgcG9zaXRpb25zLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogbWlzbWF0Y2ggaW4gZ2xURi1zYW1wbGUtbW9kdWxlOk1vbnN0ZXItRHJhY28/XG4gICAgICAgIGNvbnN0IG5WZXJ0aWNlcyA9IGRlY29kZWREcmFjb0dlb21ldHJ5XG4gICAgICAgICAgICA/IGRlY29kZWREcmFjb0dlb21ldHJ5LnZlcnRpY2VzW0dsdGZTZW1hbnRpY05hbWUuUE9TSVRJT05dLmxlbmd0aCAvIDNcbiAgICAgICAgICAgIDogdGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2dsVEZQcmltaXRpdmUuYXR0cmlidXRlc1tHbHRmU2VtYW50aWNOYW1lLlBPU0lUSU9OXV0uY291bnQ7XG5cbiAgICAgICAgY29uc3QgcHBHZW9tZXRyeTogUFBHZW9tZXRyeSA9IG5ldyBQUEdlb21ldHJ5KG5WZXJ0aWNlcywgcHJpbWl0aXZlTW9kZSwgaW5kaWNlcyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGdsVEZQcmltaXRpdmUuYXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZUFjY2Vzc29yID0gdGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2dsVEZQcmltaXRpdmUuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXV07XG4gICAgICAgICAgICBjb25zdCBzZW1hbnRpYyA9IGdsVEZBdHRyaWJ1dGVOYW1lVG9QUChhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgICAgIGxldCBkYXRhOiBQUEdlb21ldHJ5VHlwZWRBcnJheTtcbiAgICAgICAgICAgIGlmIChkZWNvZGVkRHJhY29HZW9tZXRyeSAmJiBhdHRyaWJ1dGVOYW1lIGluIGRlY29kZWREcmFjb0dlb21ldHJ5LnZlcnRpY2VzKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGRlY29kZWREcmFjb0dlb21ldHJ5LnZlcnRpY2VzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gdGhpcy5fcmVhZEFjY2Vzc29ySW50b0FycmF5KGF0dHJpYnV0ZUFjY2Vzc29yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9zaG91bGREZWNvZGVBdHRyaWJ1dGVBc05vcm1hbGl6ZWRGbG9hdChzZW1hbnRpYywgYXR0cmlidXRlQWNjZXNzb3IpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX25vcm1hbGl6ZVR5cGVkQXJyYXlBc0Zsb2F0KGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX2dldENvbXBvbmVudHNQZXJBdHRyaWJ1dGUoYXR0cmlidXRlQWNjZXNzb3IudHlwZSk7XG4gICAgICAgICAgICBwcEdlb21ldHJ5LnNldEF0dHJpYnV0ZShzZW1hbnRpYywgZGF0YSwgY29tcG9uZW50cywgdGhpcy5fZ2V0QXR0cmlidXRlTm9ybWFsaXplZEZsYWcoYXR0cmlidXRlQWNjZXNzb3IsIGRhdGEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnbFRGUHJpbWl0aXZlLnRhcmdldHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhnbFRGUHJpbWl0aXZlLnRhcmdldHNbMF0pO1xuICAgICAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBtb3JwaC1hdHRyaWJ1dGVzIGFyZSB2YWxpZC5cbiAgICAgICAgICAgICAgICBjb25zdCBzZW1hbnRpYyA9IGdsVEZBdHRyaWJ1dGVOYW1lVG9QUChhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgIVBQR2VvbWV0cnkuaXNTdGRTZW1hbnRpYyhzZW1hbnRpYykgfHxcbiAgICAgICAgICAgICAgICAgICAgIVtQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5wb3NpdGlvbiwgUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsLCBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50YW5nZW50XS5pbmNsdWRlcyhzZW1hbnRpYylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPbmx5IHBvc2l0aW9uLCBub3JtYWwsIHRhbmdlbnQgYXR0cmlidXRlIGFyZSBtb3JwaC1hYmxlLCBidXQgcHJvdmlkZSAke2F0dHJpYnV0ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhc3NlcnRHbFRGQ29uZm9ybWFuY2UocHBHZW9tZXRyeS5oYXNBdHRyaWJ1dGUoc2VtYW50aWMpLCBgUHJpbWl0aXZlIGRvIG5vdCBoYXZlIGF0dHJpYnV0ZSAke2F0dHJpYnV0ZX0gZm9yIG1vcnBoLmApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBwQXR0cmlidXRlID0gcHBHZW9tZXRyeS5nZXRBdHRyaWJ1dGUoc2VtYW50aWMpO1xuXG4gICAgICAgICAgICAgICAgcHBBdHRyaWJ1dGUubW9ycGhzID0gbmV3IEFycmF5KGdsVEZQcmltaXRpdmUudGFyZ2V0cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGlUYXJnZXQgPSAwOyBpVGFyZ2V0IDwgZ2xURlByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aDsgKytpVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vcnBoVGFyZ2V0ID0gZ2xURlByaW1pdGl2ZS50YXJnZXRzW2lUYXJnZXRdO1xuICAgICAgICAgICAgICAgICAgICAvLyBBbGwgdGFyZ2V0cyBzaGFsbCBoYXZlIHNhbWUgbW9ycGgtYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0R2xURkNvbmZvcm1hbmNlKGF0dHJpYnV0ZSBpbiBtb3JwaFRhcmdldCwgJ01vcnBoIGF0dHJpYnV0ZXMgaW4gYWxsIHRhcmdldCBtdXN0IGJlIHNhbWUuJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhY3RzIHRoZSBkaXNwbGFjZW1lbnRzLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVBY2Nlc3NvciA9IHRoaXMuX2dsdGYuYWNjZXNzb3JzIVttb3JwaFRhcmdldFthdHRyaWJ1dGVdXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ycGhEaXNwbGFjZW1lbnQgPSB0aGlzLl9yZWFkQWNjZXNzb3JJbnRvQXJyYXkoYXR0cmlidXRlQWNjZXNzb3IpO1xuICAgICAgICAgICAgICAgICAgICBwcEF0dHJpYnV0ZS5tb3JwaHNbaVRhcmdldF0gPSBtb3JwaERpc3BsYWNlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgbWFpbkRhdGEgPSBwcEdlb21ldHJ5LmdldEF0dHJpYnV0ZShzZW1hbnRpYykuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzZXJ0R2xURkNvbmZvcm1hbmNlKHBwR2VvbWV0cnkubGVuZ3RoID09PSBkYXRhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGBDb3VudCBvZiBtb3JwaCBhdHRyaWJ1dGUgJHt0YXJnZXRBdHRyaWJ1dGV9IG1pc21hdGNoIHdoaWNoIGluIHByaW1pdGl2ZS5gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIGFsbCB0YXJnZXRzIGFyZSB6ZXJvLCB3aGljaCBtZWFucyBubyBhbnkgZGlzcGxhY2VtZW50LCB3ZSBleGNsdWRlIGl0IGZyb20gbW9ycGhpbmcuXG4gICAgICAgICAgICAvLyBTaG91bGQgd2U/XG4gICAgICAgICAgICAvLyBFZGl0OiBpbiBjb2Nvcy8zZC10YXNrcyMxMTU4NSB3ZSBjYW4gc2VlIHRoYXRcbiAgICAgICAgICAgIC8vIGluIG1lc2ggMCB0aGVyZSBhcmUgMTEgcHJpbWl0aXZlcywgOCBvZiB0aGVtIGhhdmUgZW1wdHkgbW9ycGggZGF0YS5cbiAgICAgICAgICAgIC8vIFNvIEkgZGVjaWRlIHRvIHNpbGVuY2UgdGhlIHdhcm5pbmcgYW5kIGxlYXZlIGl0IGFzIGB2ZXJib3NlYC5cbiAgICAgICAgICAgIGxldCBub25FbXB0eU1vcnBoID0gZmFsc2U7XG4gICAgICAgICAgICBwcEdlb21ldHJ5LmZvckVhY2hBdHRyaWJ1dGUoKGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgIW5vbkVtcHR5TW9ycGggJiZcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlLm1vcnBocyAmJlxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUubW9ycGhzLnNvbWUoKGRpc3BsYWNlbWVudCkgPT4gZGlzcGxhY2VtZW50LnNvbWUoKHY6IG51bWJlcikgPT4gdiAhPT0gMCkpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vbkVtcHR5TW9ycGggPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFub25FbXB0eU1vcnBoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyKEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuRGVidWcsIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuRW1wdHlNb3JwaCwge1xuICAgICAgICAgICAgICAgICAgICBtZXNoOiBtZXNoSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZTogcHJpbWl0aXZlSW5kZXgsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHBHZW9tZXRyeTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9kZWNvZGVEcmFjb0dlb21ldHJ5KGdsVEZQcmltaXRpdmU6IE1lc2hQcmltaXRpdmUsIGV4dGVuc2lvbjogS0hSRHJhY29NZXNoQ29tcHJlc3Npb24pIHtcbiAgICAgICAgY29uc3QgYnVmZmVyVmlldyA9IHRoaXMuX2dsdGYuYnVmZmVyVmlld3MhW2V4dGVuc2lvbi5idWZmZXJWaWV3XTtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fYnVmZmVyc1tidWZmZXJWaWV3LmJ1ZmZlcl07XG4gICAgICAgIGNvbnN0IGJ1ZmZlclZpZXdPZmZzZXQgPSBidWZmZXJWaWV3LmJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCA/IDAgOiBidWZmZXJWaWV3LmJ5dGVPZmZzZXQ7XG4gICAgICAgIGNvbnN0IGNvbXByZXNzZWREYXRhID0gYnVmZmVyLnNsaWNlKGJ1ZmZlclZpZXdPZmZzZXQsIGJ1ZmZlclZpZXdPZmZzZXQgKyBidWZmZXJWaWV3LmJ5dGVMZW5ndGgpO1xuICAgICAgICBjb25zdCBvcHRpb25zOiBEZWNvZGVEcmFjb0dlb21ldHJ5T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGJ1ZmZlcjogbmV3IEludDhBcnJheShjb21wcmVzc2VkRGF0YSksXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGdsVEZQcmltaXRpdmUuaW5kaWNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvcHRpb25zLmluZGljZXMgPSB0aGlzLl9nZXRBdHRyaWJ1dGVCYXNlVHlwZVN0b3JhZ2UodGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2dsVEZQcmltaXRpdmUuaW5kaWNlc10uY29tcG9uZW50VHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGV4dGVuc2lvbi5hdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgaW4gZ2xURlByaW1pdGl2ZS5hdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzb3IgPSB0aGlzLl9nbHRmLmFjY2Vzc29ycyFbZ2xURlByaW1pdGl2ZS5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdXTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlkOiBleHRlbnNpb24uYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUNvbnN0cnVjdG9yOiB0aGlzLl9nZXRBdHRyaWJ1dGVCYXNlVHlwZVN0b3JhZ2UoYWNjZXNzb3IuY29tcG9uZW50VHlwZSksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IHRoaXMuX2dldENvbXBvbmVudHNQZXJBdHRyaWJ1dGUoYWNjZXNzb3IudHlwZSksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVjb2RlRHJhY29HZW9tZXRyeShvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkQm91bmRzKGdsVEZQcmltaXRpdmU6IE1lc2hQcmltaXRpdmUsIG1pblBvc2l0aW9uOiBWZWMzLCBtYXhQb3NpdGlvbjogVmVjMykge1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYXN0ZXIvc3BlY2lmaWNhdGlvbi8yLjAjYWNjZXNzb3JzLWJvdW5kc1xuICAgICAgICAvLyA+IEphdmFTY3JpcHQgY2xpZW50IGltcGxlbWVudGF0aW9ucyBzaG91bGQgY29udmVydCBKU09OLXBhcnNlZCBmbG9hdGluZy1wb2ludCBkb3VibGVzIHRvIHNpbmdsZSBwcmVjaXNpb24sXG4gICAgICAgIC8vID4gd2hlbiBjb21wb25lbnRUeXBlIGlzIDUxMjYgKEZMT0FUKS5cbiAgICAgICAgY29uc3QgaVBvc2l0aW9uQWNjZXNzb3IgPSBnbFRGUHJpbWl0aXZlLmF0dHJpYnV0ZXNbR2x0ZlNlbWFudGljTmFtZS5QT1NJVElPTl07XG4gICAgICAgIGlmIChpUG9zaXRpb25BY2Nlc3NvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gdGhpcy5fZ2x0Zi5hY2Nlc3NvcnMhW2lQb3NpdGlvbkFjY2Vzc29yXTtcbiAgICAgICAgICAgIGlmIChwb3NpdGlvbkFjY2Vzc29yLm1pbikge1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbkFjY2Vzc29yLmNvbXBvbmVudFR5cGUgPT09IEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuRkxPQVQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluUG9zaXRpb24ueCA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWluWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbWluUG9zaXRpb24ueSA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWluWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgbWluUG9zaXRpb24ueiA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWluWzJdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtaW5Qb3NpdGlvbi54ID0gcG9zaXRpb25BY2Nlc3Nvci5taW5bMF07XG4gICAgICAgICAgICAgICAgICAgIG1pblBvc2l0aW9uLnkgPSBwb3NpdGlvbkFjY2Vzc29yLm1pblsxXTtcbiAgICAgICAgICAgICAgICAgICAgbWluUG9zaXRpb24ueiA9IHBvc2l0aW9uQWNjZXNzb3IubWluWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwb3NpdGlvbkFjY2Vzc29yLm1heCkge1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbkFjY2Vzc29yLmNvbXBvbmVudFR5cGUgPT09IEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuRkxPQVQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4UG9zaXRpb24ueCA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWF4WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4UG9zaXRpb24ueSA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWF4WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4UG9zaXRpb24ueiA9IE1hdGguZnJvdW5kKHBvc2l0aW9uQWNjZXNzb3IubWF4WzJdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXhQb3NpdGlvbi54ID0gcG9zaXRpb25BY2Nlc3Nvci5tYXhbMF07XG4gICAgICAgICAgICAgICAgICAgIG1heFBvc2l0aW9uLnkgPSBwb3NpdGlvbkFjY2Vzc29yLm1heFsxXTtcbiAgICAgICAgICAgICAgICAgICAgbWF4UG9zaXRpb24ueiA9IHBvc2l0aW9uQWNjZXNzb3IubWF4WzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2FwcGx5U2V0dGluZ3MoXG4gICAgICAgIHBwR2VvbWV0cnk6IFBQR2VvbWV0cnksXG4gICAgICAgIG5vcm1hbEltcG9ydFNldHRpbmc6IE5vcm1hbEltcG9ydFNldHRpbmcsXG4gICAgICAgIHRhbmdlbnRJbXBvcnRTZXR0aW5nOiBUYW5nZW50SW1wb3J0U2V0dGluZyxcbiAgICAgICAgbW9ycGhOb3JtYWxzSW1wb3J0U2V0dGluZzogTm9ybWFsSW1wb3J0U2V0dGluZy5leGNsdWRlIHwgTm9ybWFsSW1wb3J0U2V0dGluZy5vcHRpb25hbCxcbiAgICAgICAgcHJpbWl0aXZlSW5kZXg6IG51bWJlcixcbiAgICAgICAgbWVzaEluZGV4OiBudW1iZXIsXG4gICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG5vcm1hbEltcG9ydFNldHRpbmcgPT09IE5vcm1hbEltcG9ydFNldHRpbmcucmVjYWxjdWxhdGUgfHxcbiAgICAgICAgICAgIChub3JtYWxJbXBvcnRTZXR0aW5nID09PSBOb3JtYWxJbXBvcnRTZXR0aW5nLnJlcXVpcmUgJiYgIXBwR2VvbWV0cnkuaGFzQXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLm5vcm1hbCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFscyA9IHBwR2VvbWV0cnkuY2FsY3VsYXRlTm9ybWFscygpO1xuICAgICAgICAgICAgcHBHZW9tZXRyeS5zZXRBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsLCBub3JtYWxzLCAzKTtcbiAgICAgICAgfSBlbHNlIGlmIChub3JtYWxJbXBvcnRTZXR0aW5nID09PSBOb3JtYWxJbXBvcnRTZXR0aW5nLmV4Y2x1ZGUgJiYgcHBHZW9tZXRyeS5oYXNBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsKSkge1xuICAgICAgICAgICAgcHBHZW9tZXRyeS5kZWxldGVBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRhbmdlbnRJbXBvcnRTZXR0aW5nID09PSBUYW5nZW50SW1wb3J0U2V0dGluZy5yZWNhbGN1bGF0ZSB8fFxuICAgICAgICAgICAgKHRhbmdlbnRJbXBvcnRTZXR0aW5nID09PSBUYW5nZW50SW1wb3J0U2V0dGluZy5yZXF1aXJlICYmICFwcEdlb21ldHJ5Lmhhc0F0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50YW5nZW50KSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoIXBwR2VvbWV0cnkuaGFzQXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLm5vcm1hbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIoR2x0ZkNvbnZlcnRlci5Mb2dMZXZlbC5XYXJuaW5nLCBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLkZhaWxlZFRvQ2FsY3VsYXRlVGFuZ2VudHMsIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhc29uOiAnbm9ybWFsJyxcbiAgICAgICAgICAgICAgICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmVJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgbWVzaDogbWVzaEluZGV4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghcHBHZW9tZXRyeS5oYXNBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MudGV4Y29vcmQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyKEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuRGVidWcsIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuRmFpbGVkVG9DYWxjdWxhdGVUYW5nZW50cywge1xuICAgICAgICAgICAgICAgICAgICByZWFzb246ICd1dicsXG4gICAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZTogcHJpbWl0aXZlSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIG1lc2g6IG1lc2hJbmRleCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFuZ2VudHMgPSBwcEdlb21ldHJ5LmNhbGN1bGF0ZVRhbmdlbnRzKCk7XG4gICAgICAgICAgICAgICAgcHBHZW9tZXRyeS5zZXRBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MudGFuZ2VudCwgdGFuZ2VudHMsIDQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRhbmdlbnRJbXBvcnRTZXR0aW5nID09PSBUYW5nZW50SW1wb3J0U2V0dGluZy5leGNsdWRlICYmIHBwR2VvbWV0cnkuaGFzQXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnRhbmdlbnQpKSB7XG4gICAgICAgICAgICBwcEdlb21ldHJ5LmRlbGV0ZUF0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50YW5nZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb3JwaE5vcm1hbHNJbXBvcnRTZXR0aW5nID09PSBOb3JtYWxJbXBvcnRTZXR0aW5nLmV4Y2x1ZGUgJiYgcHBHZW9tZXRyeS5oYXNBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsKSkge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsQXR0cmlidXRlID0gcHBHZW9tZXRyeS5nZXRBdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mubm9ybWFsKTtcbiAgICAgICAgICAgIG5vcm1hbEF0dHJpYnV0ZS5tb3JwaHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVhZEJ1ZmZlclZpZXcoYnVmZmVyVmlldzogQnVmZmVyVmlldykge1xuICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLl9idWZmZXJzW2J1ZmZlclZpZXcuYnVmZmVyXTtcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGJ1ZmZlci5idWZmZXIsIGJ1ZmZlci5ieXRlT2Zmc2V0ICsgKGJ1ZmZlclZpZXcuYnl0ZU9mZnNldCB8fCAwKSwgYnVmZmVyVmlldy5ieXRlTGVuZ3RoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkQWNjZXNzb3JJbnRvQXJyYXkoZ2x0ZkFjY2Vzc29yOiBBY2Nlc3Nvcikge1xuICAgICAgICBjb25zdCBzdG9yYWdlQ29uc3RydWN0b3IgPSB0aGlzLl9nZXRBdHRyaWJ1dGVCYXNlVHlwZVN0b3JhZ2UoZ2x0ZkFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgc3RvcmFnZUNvbnN0cnVjdG9yKGdsdGZBY2Nlc3Nvci5jb3VudCAqIHRoaXMuX2dldENvbXBvbmVudHNQZXJBdHRyaWJ1dGUoZ2x0ZkFjY2Vzc29yLnR5cGUpKTtcbiAgICAgICAgdGhpcy5fcmVhZEFjY2Vzc29yKGdsdGZBY2Nlc3NvciwgY3JlYXRlRGF0YVZpZXdGcm9tVHlwZWRBcnJheShyZXN1bHQpKTtcbiAgICAgICAgaWYgKGdsdGZBY2Nlc3Nvci5zcGFyc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fYXBwbHlEZXZpYXRpb24oZ2x0ZkFjY2Vzc29yIGFzIEZpZWxkc1JlcXVpcmVkPEFjY2Vzc29yLCAnc3BhcnNlJz4sIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkQWNjZXNzb3JJbnRvQXJyYXlBbmROb3JtYWxpemVBc0Zsb2F0KGdsdGZBY2Nlc3NvcjogQWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vcm1hbGl6ZVR5cGVkQXJyYXlBc0Zsb2F0KHRoaXMuX3JlYWRBY2Nlc3NvckludG9BcnJheShnbHRmQWNjZXNzb3IpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zaG91bGREZWNvZGVBdHRyaWJ1dGVBc05vcm1hbGl6ZWRGbG9hdChzZW1hbnRpYzogUFBHZW9tZXRyeS5TZW1hbnRpYywgZ2x0ZkFjY2Vzc29yOiBBY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgZ2x0ZkFjY2Vzc29yLm5vcm1hbGl6ZWQgPT09IHRydWUgJiZcbiAgICAgICAgICAgIFBQR2VvbWV0cnkuaXNTdGRTZW1hbnRpYyhzZW1hbnRpYykgJiZcbiAgICAgICAgICAgIFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmRlY29kZShzZW1hbnRpYykuc2VtYW50aWMwID09PSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy53ZWlnaHRzXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QXR0cmlidXRlTm9ybWFsaXplZEZsYWcoZ2x0ZkFjY2Vzc29yOiBBY2Nlc3NvciwgZGF0YTogUFBHZW9tZXRyeVR5cGVkQXJyYXkpIHtcbiAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgZ2x0ZkFjY2Vzc29yLm5vcm1hbGl6ZWQgIT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbm9ybWFsaXplVHlwZWRBcnJheUFzRmxvYXQob3V0cHV0czogUFBHZW9tZXRyeVR5cGVkQXJyYXkpIHtcbiAgICAgICAgaWYgKG91dHB1dHMgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRPdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dHMubGVuZ3RoKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplID0gKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChvdXRwdXRzIGluc3RhbmNlb2YgSW50OEFycmF5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh2YWx1ZTogbnVtYmVyKSA9PiBNYXRoLm1heCh2YWx1ZSAvIDEyNy4wLCAtMS4wKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0cyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlOiBudW1iZXIpID0+IHZhbHVlIC8gMjU1LjA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dHMgaW5zdGFuY2VvZiBJbnQxNkFycmF5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh2YWx1ZTogbnVtYmVyKSA9PiBNYXRoLm1heCh2YWx1ZSAvIDMyNzY3LjAsIC0xLjApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRzIGluc3RhbmNlb2YgVWludDE2QXJyYXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlOiBudW1iZXIpID0+IHZhbHVlIC8gNjU1MzUuMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh2YWx1ZTogbnVtYmVyKSA9PiB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkT3V0cHV0W2ldID0gbm9ybWFsaXplKG91dHB1dHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkT3V0cHV0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFNjZW5lTm9kZShpR2x0ZlNjZW5lOiBudW1iZXIsIGdsdGZBc3NldEZpbmRlcjogSUdsdGZBc3NldEZpbmRlciwgd2l0aFRyYW5zZm9ybSA9IHRydWUpIHtcbiAgICAgICAgY29uc3Qgc2NlbmVOYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLlNjZW5lLCBpR2x0ZlNjZW5lKTtcbiAgICAgICAgY29uc3QgZ2x0ZlNjZW5lID0gdGhpcy5fZ2x0Zi5zY2VuZXMhW2lHbHRmU2NlbmVdO1xuXG4gICAgICAgIGxldCBzY2VuZU5vZGU6IGNjLk5vZGU7XG4gICAgICAgIGlmICghZ2x0ZlNjZW5lLm5vZGVzIHx8IGdsdGZTY2VuZS5ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHNjZW5lTm9kZSA9IG5ldyBjYy5Ob2RlKHNjZW5lTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBnbFRGU2NlbmVSb290Tm9kZXMgPSBnbHRmU2NlbmUubm9kZXM7XG4gICAgICAgICAgICBjb25zdCBtYXBwaW5nOiAoY2MuTm9kZSB8IG51bGwpW10gPSBuZXcgQXJyYXkodGhpcy5fZ2x0Zi5ub2RlcyEubGVuZ3RoKS5maWxsKG51bGwpO1xuICAgICAgICAgICAgaWYgKGdsdGZTY2VuZS5ub2Rlcy5sZW5ndGggPT09IDEgJiYgdGhpcy5fcHJvbW90ZWRSb290Tm9kZXMuaW5jbHVkZXMoZ2x0ZlNjZW5lLm5vZGVzWzBdKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb21vdGVkUm9vdE5vZGUgPSBnbHRmU2NlbmUubm9kZXNbMF07XG4gICAgICAgICAgICAgICAgc2NlbmVOb2RlID0gdGhpcy5fY3JlYXRlRW1wdHlOb2RlUmVjdXJzaXZlKHByb21vdGVkUm9vdE5vZGUsIG1hcHBpbmcsIHdpdGhUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY2VuZU5vZGUgPSBuZXcgY2MuTm9kZShzY2VuZU5hbWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBnbHRmU2NlbmUubm9kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuX2NyZWF0ZUVtcHR5Tm9kZVJlY3Vyc2l2ZShub2RlLCBtYXBwaW5nLCB3aXRoVHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5wYXJlbnQgPSBzY2VuZU5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwcGluZy5mb3JFYWNoKChub2RlLCBpR2x0Zk5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXR1cE5vZGUoaUdsdGZOb2RlLCBtYXBwaW5nLCBnbHRmQXNzZXRGaW5kZXIsIHNjZW5lTm9kZSwgZ2xURlNjZW5lUm9vdE5vZGVzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjZW5lTm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVFbXB0eU5vZGVSZWN1cnNpdmUoaUdsdGZOb2RlOiBudW1iZXIsIG1hcHBpbmc6IChjYy5Ob2RlIHwgbnVsbClbXSwgd2l0aFRyYW5zZm9ybSA9IHRydWUpOiBjYy5Ob2RlIHtcbiAgICAgICAgY29uc3QgZ2x0Zk5vZGUgPSB0aGlzLl9nbHRmLm5vZGVzIVtpR2x0Zk5vZGVdO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9jcmVhdGVFbXB0eU5vZGUoaUdsdGZOb2RlLCB3aXRoVHJhbnNmb3JtKTtcbiAgICAgICAgaWYgKGdsdGZOb2RlLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZ2x0Zk5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZFJlc3VsdCA9IHRoaXMuX2NyZWF0ZUVtcHR5Tm9kZVJlY3Vyc2l2ZShjaGlsZCwgbWFwcGluZywgd2l0aFRyYW5zZm9ybSk7XG4gICAgICAgICAgICAgICAgY2hpbGRSZXN1bHQucGFyZW50ID0gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1hcHBpbmdbaUdsdGZOb2RlXSA9IHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zZXR1cE5vZGUoXG4gICAgICAgIGlHbHRmTm9kZTogbnVtYmVyLFxuICAgICAgICBtYXBwaW5nOiAoY2MuTm9kZSB8IG51bGwpW10sXG4gICAgICAgIGdsdGZBc3NldEZpbmRlcjogSUdsdGZBc3NldEZpbmRlcixcbiAgICAgICAgc2NlbmVOb2RlOiBjYy5Ob2RlLFxuICAgICAgICBnbFRGU2NlbmVSb290Tm9kZXM6IG51bWJlcltdLFxuICAgICkge1xuICAgICAgICBjb25zdCBub2RlID0gbWFwcGluZ1tpR2x0Zk5vZGVdO1xuICAgICAgICBpZiAobm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGdsdGZOb2RlID0gdGhpcy5fZ2x0Zi5ub2RlcyFbaUdsdGZOb2RlXTtcbiAgICAgICAgaWYgKGdsdGZOb2RlLm1lc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbGV0IG1vZGVsQ29tcG9uZW50OiBjYy5NZXNoUmVuZGVyZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChnbHRmTm9kZS5za2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBtb2RlbENvbXBvbmVudCA9IG5vZGUuYWRkQ29tcG9uZW50KGNjLk1lc2hSZW5kZXJlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNraW5uaW5nTW9kZWxDb21wb25lbnQgPSBub2RlLmFkZENvbXBvbmVudChjYy5Ta2lubmVkTWVzaFJlbmRlcmVyKSE7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2tlbGV0b24gPSBnbHRmQXNzZXRGaW5kZXIuZmluZCgnc2tlbGV0b25zJywgZ2x0Zk5vZGUuc2tpbiwgY2MuU2tlbGV0b24pO1xuICAgICAgICAgICAgICAgIGlmIChza2VsZXRvbikge1xuICAgICAgICAgICAgICAgICAgICBza2lubmluZ01vZGVsQ29tcG9uZW50LnNrZWxldG9uID0gc2tlbGV0b247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHNraW5Sb290ID0gbWFwcGluZ1t0aGlzLl9nZXRTa2luUm9vdChnbHRmTm9kZS5za2luKV07XG4gICAgICAgICAgICAgICAgaWYgKHNraW5Sb290ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXkgZG8gbm90IGhhdmUgY29tbW9uIHJvb3QuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgbWF5IGJlIGNhdXNlZCBieSByb290IHBhcmVudCBub2RlcyBvZiB0aGVtIGFyZSBkaWZmZXJlbnQgYnV0IHRoZXkgYXJlIGFsbCB1bmRlciBzYW1lIHNjZW5lLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBnbFRGU2tpbiA9IHRoaXMuZ2x0Zi5za2lucyFbZ2x0Zk5vZGUuc2tpbl07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5kZXJTYW1lU2NlbmUgPSBnbFRGU2tpbi5qb2ludHMuZXZlcnkoKGpvaW50OiBhbnkpID0+IGdsVEZTY2VuZVJvb3ROb2Rlcy5pbmNsdWRlcyh0aGlzLl9nZXRSb290UGFyZW50KGpvaW50KSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNVbmRlclNhbWVTY2VuZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2tpbm5pbmdNb2RlbENvbXBvbmVudC5za2lubmluZ1Jvb3QgPSBzY2VuZU5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIoR2x0ZkNvbnZlcnRlci5Mb2dMZXZlbC5FcnJvciwgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5SZWZlcmVuY2VTa2luSW5EaWZmZXJlbnRTY2VuZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IGlHbHRmTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2luOiBnbHRmTm9kZS5za2luLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ24gYSB0ZW1wb3Jhcnkgcm9vdFxuICAgICAgICAgICAgICAgICAgICBza2lubmluZ01vZGVsQ29tcG9uZW50LnNraW5uaW5nUm9vdCA9IHNraW5Sb290O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RlbENvbXBvbmVudCA9IHNraW5uaW5nTW9kZWxDb21wb25lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtZXNoID0gZ2x0ZkFzc2V0RmluZGVyLmZpbmQoJ21lc2hlcycsIGdsdGZOb2RlLm1lc2gsIGNjLk1lc2gpO1xuICAgICAgICAgICAgaWYgKG1lc2gpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICAgICAgICAgIG1vZGVsQ29tcG9uZW50Ll9tZXNoID0gbWVzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGdsdGZNZXNoID0gdGhpcy5nbHRmLm1lc2hlcyFbZ2x0Zk5vZGUubWVzaF07XG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRNZXNoID0gdGhpcy5fcHJvY2Vzc2VkTWVzaGVzW2dsdGZOb2RlLm1lc2hdO1xuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWxzID0gcHJvY2Vzc2VkTWVzaC5tYXRlcmlhbEluZGljZXMubWFwKChpZHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBnbHRmUHJpbWl0aXZlID0gZ2x0Zk1lc2gucHJpbWl0aXZlc1tpZHhdO1xuICAgICAgICAgICAgICAgIGlmIChnbHRmUHJpbWl0aXZlLm1hdGVyaWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBnbHRmQXNzZXRGaW5kZXIuZmluZCgnbWF0ZXJpYWxzJywgZ2x0ZlByaW1pdGl2ZS5tYXRlcmlhbCwgY2MuTWF0ZXJpYWwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0ZXJpYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgICAgIG1vZGVsQ29tcG9uZW50Ll9tYXRlcmlhbHMgPSBtYXRlcmlhbHM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVFbXB0eU5vZGUoaUdsdGZOb2RlOiBudW1iZXIsIHdpdGhUcmFuc2Zvcm0gPSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGdsdGZOb2RlID0gdGhpcy5fZ2x0Zi5ub2RlcyFbaUdsdGZOb2RlXTtcbiAgICAgICAgY29uc3Qgbm9kZU5hbWUgPSB0aGlzLl9nZXRHbHRmWFhOYW1lKEdsdGZBc3NldEtpbmQuTm9kZSwgaUdsdGZOb2RlKTtcblxuICAgICAgICBjb25zdCBub2RlID0gbmV3IGNjLk5vZGUobm9kZU5hbWUpO1xuICAgICAgICBpZiAoIXdpdGhUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdsdGZOb2RlLnRyYW5zbGF0aW9uKSB7XG4gICAgICAgICAgICBub2RlLnNldFBvc2l0aW9uKGdsdGZOb2RlLnRyYW5zbGF0aW9uWzBdLCBnbHRmTm9kZS50cmFuc2xhdGlvblsxXSwgZ2x0Zk5vZGUudHJhbnNsYXRpb25bMl0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnbHRmTm9kZS5yb3RhdGlvbikge1xuICAgICAgICAgICAgbm9kZS5zZXRSb3RhdGlvbih0aGlzLl9nZXROb2RlUm90YXRpb24oZ2x0Zk5vZGUucm90YXRpb24sIG5ldyBRdWF0KCkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2x0Zk5vZGUuc2NhbGUpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U2NhbGUoZ2x0Zk5vZGUuc2NhbGVbMF0sIGdsdGZOb2RlLnNjYWxlWzFdLCBnbHRmTm9kZS5zY2FsZVsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdsdGZOb2RlLm1hdHJpeCkge1xuICAgICAgICAgICAgY29uc3QgbnMgPSBnbHRmTm9kZS5tYXRyaXg7XG4gICAgICAgICAgICBjb25zdCBtID0gdGhpcy5fcmVhZE5vZGVNYXRyaXgobnMpO1xuICAgICAgICAgICAgY29uc3QgdCA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBjb25zdCByID0gbmV3IFF1YXQoKTtcbiAgICAgICAgICAgIGNvbnN0IHMgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgTWF0NC50b1JUUyhtLCByLCB0LCBzKTtcbiAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24odCk7XG4gICAgICAgICAgICBub2RlLnNldFJvdGF0aW9uKHIpO1xuICAgICAgICAgICAgbm9kZS5zZXRTY2FsZShzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkTm9kZU1hdHJpeChuczogbnVtYmVyW10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXQ0KFxuICAgICAgICAgICAgbnNbMF0sXG4gICAgICAgICAgICBuc1sxXSxcbiAgICAgICAgICAgIG5zWzJdLFxuICAgICAgICAgICAgbnNbM10sXG4gICAgICAgICAgICBuc1s0XSxcbiAgICAgICAgICAgIG5zWzVdLFxuICAgICAgICAgICAgbnNbNl0sXG4gICAgICAgICAgICBuc1s3XSxcbiAgICAgICAgICAgIG5zWzhdLFxuICAgICAgICAgICAgbnNbOV0sXG4gICAgICAgICAgICBuc1sxMF0sXG4gICAgICAgICAgICBuc1sxMV0sXG4gICAgICAgICAgICBuc1sxMl0sXG4gICAgICAgICAgICBuc1sxM10sXG4gICAgICAgICAgICBuc1sxNF0sXG4gICAgICAgICAgICBuc1sxNV0sXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Tm9kZVBhdGgobm9kZTogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub2RlUGF0aFRhYmxlW25vZGVdO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2lzQW5jZXN0b3JPZihwYXJlbnQ6IG51bWJlciwgY2hpbGQ6IG51bWJlcikge1xuICAgICAgICBpZiAocGFyZW50ICE9PSBjaGlsZCkge1xuICAgICAgICAgICAgd2hpbGUgKGNoaWxkID49IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPT09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hpbGQgPSB0aGlzLl9nZXRQYXJlbnQoY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9tYXBUb1NvY2tldFBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLl9zb2NrZXRNYXBwaW5ncykge1xuICAgICAgICAgICAgaWYgKHBhdGggIT09IHBhaXJbMF0gJiYgIXBhdGguc3RhcnRzV2l0aChwYWlyWzBdICsgJy8nKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhaXJbMV0gKyBwYXRoLnNsaWNlKHBhaXJbMF0ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVOb2RlUGF0aFRhYmxlKCkge1xuICAgICAgICBpZiAodGhpcy5fZ2x0Zi5ub2RlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnRUYWJsZSA9IG5ldyBBcnJheTxudW1iZXI+KHRoaXMuX2dsdGYubm9kZXMubGVuZ3RoKS5maWxsKC0xKTtcbiAgICAgICAgdGhpcy5fZ2x0Zi5ub2Rlcy5mb3JFYWNoKChnbHRmTm9kZTogYW55LCBub2RlSW5kZXg6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGdsdGZOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgZ2x0Zk5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoaUNoaWxkTm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFRhYmxlW2lDaGlsZE5vZGVdID0gbm9kZUluZGV4O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVzID0gZ2x0Zk5vZGUuY2hpbGRyZW4ubWFwKChpQ2hpbGROb2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fZ2x0Zi5ub2RlcyFbaUNoaWxkTm9kZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBuYW1lID0gY2hpbGROb2RlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVuaXF1ZU5hbWVzID0gbWFrZVVuaXF1ZU5hbWVzKG5hbWVzLCB1bmlxdWVDaGlsZE5vZGVOYW1lR2VuZXJhdG9yKTtcbiAgICAgICAgICAgICAgICB1bmlxdWVOYW1lcy5mb3JFYWNoKCh1bmlxdWVOYW1lLCBpVW5pcXVlTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbHRmLm5vZGVzIVtnbHRmTm9kZS5jaGlsZHJlbiFbaVVuaXF1ZU5hbWVdXS5uYW1lID0gdW5pcXVlTmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgbm9kZU5hbWVzID0gbmV3IEFycmF5PHN0cmluZz4odGhpcy5fZ2x0Zi5ub2Rlcy5sZW5ndGgpLmZpbGwoJycpO1xuICAgICAgICBmb3IgKGxldCBpTm9kZSA9IDA7IGlOb2RlIDwgbm9kZU5hbWVzLmxlbmd0aDsgKytpTm9kZSkge1xuICAgICAgICAgICAgbm9kZU5hbWVzW2lOb2RlXSA9IHRoaXMuX2dldEdsdGZYWE5hbWUoR2x0ZkFzc2V0S2luZC5Ob2RlLCBpTm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXJyYXk8c3RyaW5nPih0aGlzLl9nbHRmLm5vZGVzLmxlbmd0aCkuZmlsbCgnJyk7XG4gICAgICAgIHRoaXMuX2dsdGYubm9kZXMuZm9yRWFjaCgoZ2x0Zk5vZGU6IGFueSwgbm9kZUluZGV4OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlZ21lbnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA+PSAwOyBpID0gcGFyZW50VGFibGVbaV0pIHtcbiAgICAgICAgICAgICAgICAvLyBQcm9tb3RlZCBub2RlIGlzIG5vdCBwYXJ0IG9mIG5vZGUgcGF0aFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcHJvbW90ZWRSb290Tm9kZXMuaW5jbHVkZXMoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudHMudW5zaGlmdChub2RlTmFtZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdFtub2RlSW5kZXhdID0gc2VnbWVudHMuam9pbignLycpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vdGUsIGlmIGBidWZmZXJWaWV3YCBwcm9wZXJ0eSBpcyBub3QgZGVmaW5lZCwgdGhpcyBtZXRob2Qgd2lsbCBkbyBub3RoaW5nLlxuICAgICAqIFNvIHlvdSBzaG91bGQgZW5zdXJlIHRoYXQgdGhlIGRhdGEgYXJlYSBvZiBgb3V0cHV0QnVmZmVyYCBpcyBmaWxsZWQgd2l0aCBgMGBzLlxuICAgICAqIEBwYXJhbSBnbHRmQWNjZXNzb3JcbiAgICAgKiBAcGFyYW0gb3V0cHV0QnVmZmVyXG4gICAgICogQHBhcmFtIG91dHB1dFN0cmlkZVxuICAgICAqL1xuICAgIHByaXZhdGUgX3JlYWRBY2Nlc3NvcihnbHRmQWNjZXNzb3I6IEFjY2Vzc29yLCBvdXRwdXRCdWZmZXI6IERhdGFWaWV3LCBvdXRwdXRTdHJpZGUgPSAwKSB7XG4gICAgICAgIC8vIFdoZW4gbm90IGRlZmluZWQsIGFjY2Vzc29yIG11c3QgYmUgaW5pdGlhbGl6ZWQgd2l0aCB6ZXJvcy5cbiAgICAgICAgaWYgKGdsdGZBY2Nlc3Nvci5idWZmZXJWaWV3ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdsdGZCdWZmZXJWaWV3ID0gdGhpcy5fZ2x0Zi5idWZmZXJWaWV3cyFbZ2x0ZkFjY2Vzc29yLmJ1ZmZlclZpZXddO1xuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHNQZXJBdHRyaWJ1dGUgPSB0aGlzLl9nZXRDb21wb25lbnRzUGVyQXR0cmlidXRlKGdsdGZBY2Nlc3Nvci50eXBlKTtcbiAgICAgICAgY29uc3QgYnl0ZXNQZXJFbGVtZW50ID0gdGhpcy5fZ2V0Qnl0ZXNQZXJDb21wb25lbnQoZ2x0ZkFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuXG4gICAgICAgIGlmIChvdXRwdXRTdHJpZGUgPT09IDApIHtcbiAgICAgICAgICAgIG91dHB1dFN0cmlkZSA9IGNvbXBvbmVudHNQZXJBdHRyaWJ1dGUgKiBieXRlc1BlckVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnB1dFN0YXJ0T2Zmc2V0ID1cbiAgICAgICAgICAgIChnbHRmQWNjZXNzb3IuYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkID8gZ2x0ZkFjY2Vzc29yLmJ5dGVPZmZzZXQgOiAwKSArXG4gICAgICAgICAgICAoZ2x0ZkJ1ZmZlclZpZXcuYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkID8gZ2x0ZkJ1ZmZlclZpZXcuYnl0ZU9mZnNldCA6IDApO1xuXG4gICAgICAgIGNvbnN0IGlucHV0QnVmZmVyID0gY3JlYXRlRGF0YVZpZXdGcm9tQnVmZmVyKHRoaXMuX2J1ZmZlcnNbZ2x0ZkJ1ZmZlclZpZXcuYnVmZmVyXSwgaW5wdXRTdGFydE9mZnNldCk7XG5cbiAgICAgICAgY29uc3QgaW5wdXRTdHJpZGUgPSBnbHRmQnVmZmVyVmlldy5ieXRlU3RyaWRlICE9PSB1bmRlZmluZWQgPyBnbHRmQnVmZmVyVmlldy5ieXRlU3RyaWRlIDogY29tcG9uZW50c1BlckF0dHJpYnV0ZSAqIGJ5dGVzUGVyRWxlbWVudDtcblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWFkZXIgPSB0aGlzLl9nZXRDb21wb25lbnRSZWFkZXIoZ2x0ZkFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRXcml0ZXIgPSB0aGlzLl9nZXRDb21wb25lbnRXcml0ZXIoZ2x0ZkFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuXG4gICAgICAgIGZvciAobGV0IGlBdHRyaWJ1dGUgPSAwOyBpQXR0cmlidXRlIDwgZ2x0ZkFjY2Vzc29yLmNvdW50OyArK2lBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGkgPSBjcmVhdGVEYXRhVmlld0Zyb21UeXBlZEFycmF5KGlucHV0QnVmZmVyLCBpbnB1dFN0cmlkZSAqIGlBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgY29uc3QgbyA9IGNyZWF0ZURhdGFWaWV3RnJvbVR5cGVkQXJyYXkob3V0cHV0QnVmZmVyLCBvdXRwdXRTdHJpZGUgKiBpQXR0cmlidXRlKTtcbiAgICAgICAgICAgIGZvciAobGV0IGlDb21wb25lbnQgPSAwOyBpQ29tcG9uZW50IDwgY29tcG9uZW50c1BlckF0dHJpYnV0ZTsgKytpQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Qnl0ZXNPZmZzZXQgPSBieXRlc1BlckVsZW1lbnQgKiBpQ29tcG9uZW50O1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29tcG9uZW50UmVhZGVyKGksIGNvbXBvbmVudEJ5dGVzT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRXcml0ZXIobywgY29tcG9uZW50Qnl0ZXNPZmZzZXQsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2FwcGx5RGV2aWF0aW9uKGdsVEZBY2Nlc3NvcjogRmllbGRzUmVxdWlyZWQ8QWNjZXNzb3IsICdzcGFyc2UnPiwgYmFzZVZhbHVlczogQWNjZXNzb3JTdG9yYWdlKSB7XG4gICAgICAgIGNvbnN0IHsgc3BhcnNlIH0gPSBnbFRGQWNjZXNzb3I7XG5cbiAgICAgICAgLy8gU3BhcnNlIGluZGljZXNcbiAgICAgICAgY29uc3QgaW5kaWNlc0J1ZmZlclZpZXcgPSB0aGlzLl9nbHRmLmJ1ZmZlclZpZXdzIVtzcGFyc2UuaW5kaWNlcy5idWZmZXJWaWV3XTtcbiAgICAgICAgY29uc3QgaW5kaWNlc0J1ZmZlciA9IHRoaXMuX2J1ZmZlcnNbaW5kaWNlc0J1ZmZlclZpZXcuYnVmZmVyXTtcbiAgICAgICAgY29uc3QgaW5kaWNlc1NjID0gdGhpcy5fZ2V0QXR0cmlidXRlQmFzZVR5cGVTdG9yYWdlKHNwYXJzZS5pbmRpY2VzLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBjb25zdCBzcGFyc2VJbmRpY2VzID0gbmV3IGluZGljZXNTYyhcbiAgICAgICAgICAgIGluZGljZXNCdWZmZXIuYnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICBpbmRpY2VzQnVmZmVyLmJ5dGVPZmZzZXQgKyAoaW5kaWNlc0J1ZmZlclZpZXcuYnl0ZU9mZnNldCB8fCAwKSArIChzcGFyc2UuaW5kaWNlcy5ieXRlT2Zmc2V0IHx8IDApLFxuICAgICAgICAgICAgc3BhcnNlLmNvdW50LFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFNwYXJzZSB2YWx1ZXNcbiAgICAgICAgY29uc3QgdmFsdWVzQnVmZmVyVmlldyA9IHRoaXMuX2dsdGYuYnVmZmVyVmlld3MhW3NwYXJzZS52YWx1ZXMuYnVmZmVyVmlld107XG4gICAgICAgIGNvbnN0IHZhbHVlc0J1ZmZlciA9IHRoaXMuX2J1ZmZlcnNbdmFsdWVzQnVmZmVyVmlldy5idWZmZXJdO1xuICAgICAgICBjb25zdCB2YWx1ZXNTYyA9IHRoaXMuX2dldEF0dHJpYnV0ZUJhc2VUeXBlU3RvcmFnZShnbFRGQWNjZXNzb3IuY29tcG9uZW50VHlwZSk7XG4gICAgICAgIGNvbnN0IHNwYXJzZVZhbHVlcyA9IG5ldyB2YWx1ZXNTYyhcbiAgICAgICAgICAgIHZhbHVlc0J1ZmZlci5idWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgIHZhbHVlc0J1ZmZlci5ieXRlT2Zmc2V0ICsgKHZhbHVlc0J1ZmZlclZpZXcuYnl0ZU9mZnNldCB8fCAwKSArIChzcGFyc2UudmFsdWVzLmJ5dGVPZmZzZXQgfHwgMCksXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX2dldENvbXBvbmVudHNQZXJBdHRyaWJ1dGUoZ2xURkFjY2Vzc29yLnR5cGUpO1xuICAgICAgICBmb3IgKGxldCBpQ29tcG9uZW50ID0gMDsgaUNvbXBvbmVudCA8IGNvbXBvbmVudHM7ICsraUNvbXBvbmVudCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaVNwYXJzZUluZGV4ID0gMDsgaVNwYXJzZUluZGV4IDwgc3BhcnNlSW5kaWNlcy5sZW5ndGg7ICsraVNwYXJzZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhcnNlSW5kZXggPSBzcGFyc2VJbmRpY2VzW2lTcGFyc2VJbmRleF07XG4gICAgICAgICAgICAgICAgYmFzZVZhbHVlc1tjb21wb25lbnRzICogc3BhcnNlSW5kZXggKyBpQ29tcG9uZW50XSA9IHNwYXJzZVZhbHVlc1tjb21wb25lbnRzICogaVNwYXJzZUluZGV4ICsgaUNvbXBvbmVudF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRQcmltaXRpdmVNb2RlKG1vZGU6IG51bWJlciB8IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAobW9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBtb2RlID0gR2x0ZlByaW1pdGl2ZU1vZGUuX19ERUZBVUxUO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSBHbHRmUHJpbWl0aXZlTW9kZS5QT0lOVFM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdmeC5QcmltaXRpdmVNb2RlLlBPSU5UX0xJU1Q7XG4gICAgICAgICAgICBjYXNlIEdsdGZQcmltaXRpdmVNb2RlLkxJTkVTOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZnguUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1Q7XG4gICAgICAgICAgICBjYXNlIEdsdGZQcmltaXRpdmVNb2RlLkxJTkVfTE9PUDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2Z4LlByaW1pdGl2ZU1vZGUuTElORV9MT09QO1xuICAgICAgICAgICAgY2FzZSBHbHRmUHJpbWl0aXZlTW9kZS5MSU5FX1NUUklQOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZnguUHJpbWl0aXZlTW9kZS5MSU5FX1NUUklQO1xuICAgICAgICAgICAgY2FzZSBHbHRmUHJpbWl0aXZlTW9kZS5UUklBTkdMRVM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdmeC5QcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1Q7XG4gICAgICAgICAgICBjYXNlIEdsdGZQcmltaXRpdmVNb2RlLlRSSUFOR0xFX1NUUklQOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZnguUHJpbWl0aXZlTW9kZS5UUklBTkdMRV9TVFJJUDtcbiAgICAgICAgICAgIGNhc2UgR2x0ZlByaW1pdGl2ZU1vZGUuVFJJQU5HTEVfRkFOOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZnguUHJpbWl0aXZlTW9kZS5UUklBTkdMRV9GQU47XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIHByaW1pdGl2ZSBtb2RlOiAke21vZGV9LmApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QXR0cmlidXRlQmFzZVR5cGVTdG9yYWdlKGNvbXBvbmVudFR5cGU6IG51bWJlcik6IEFjY2Vzc29yU3RvcmFnZUNvbnN0cnVjdG9yIHtcbiAgICAgICAgc3dpdGNoIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuQllURTpcbiAgICAgICAgICAgICAgICByZXR1cm4gSW50OEFycmF5O1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX0JZVEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXk7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuU0hPUlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEludDE2QXJyYXk7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuVU5TSUdORURfU0hPUlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVpbnQxNkFycmF5O1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX0lOVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gVWludDMyQXJyYXk7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuRkxPQVQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEZsb2F0MzJBcnJheTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgY29tcG9uZW50IHR5cGU6ICR7Y29tcG9uZW50VHlwZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldENvbXBvbmVudHNQZXJBdHRyaWJ1dGUodHlwZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBnZXRHbHRmQWNjZXNzb3JUeXBlQ29tcG9uZW50cyh0eXBlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRCeXRlc1BlckNvbXBvbmVudChjb21wb25lbnRUeXBlOiBudW1iZXIpIHtcbiAgICAgICAgc3dpdGNoIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuQllURTpcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5VTlNJR05FRF9CWVRFOlxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlNIT1JUOlxuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX1NIT1JUOlxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX0lOVDpcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5GTE9BVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gNDtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgY29tcG9uZW50IHR5cGU6ICR7Y29tcG9uZW50VHlwZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldENvbXBvbmVudFJlYWRlcihjb21wb25lbnRUeXBlOiBudW1iZXIpOiAoYnVmZmVyOiBEYXRhVmlldywgb2Zmc2V0OiBudW1iZXIpID0+IG51bWJlciB7XG4gICAgICAgIHN3aXRjaCAoY29tcG9uZW50VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLkJZVEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIChidWZmZXIsIG9mZnNldCkgPT4gYnVmZmVyLmdldEludDgob2Zmc2V0KTtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5VTlNJR05FRF9CWVRFOlxuICAgICAgICAgICAgICAgIHJldHVybiAoYnVmZmVyLCBvZmZzZXQpID0+IGJ1ZmZlci5nZXRVaW50OChvZmZzZXQpO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlNIT1JUOlxuICAgICAgICAgICAgICAgIHJldHVybiAoYnVmZmVyLCBvZmZzZXQpID0+IGJ1ZmZlci5nZXRJbnQxNihvZmZzZXQsIERhdGFWaWV3VXNlTGl0dGxlRW5kaWFuKTtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5VTlNJR05FRF9TSE9SVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJ1ZmZlciwgb2Zmc2V0KSA9PiBidWZmZXIuZ2V0VWludDE2KG9mZnNldCwgRGF0YVZpZXdVc2VMaXR0bGVFbmRpYW4pO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX0lOVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJ1ZmZlciwgb2Zmc2V0KSA9PiBidWZmZXIuZ2V0VWludDMyKG9mZnNldCwgRGF0YVZpZXdVc2VMaXR0bGVFbmRpYW4pO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLkZMT0FUOlxuICAgICAgICAgICAgICAgIHJldHVybiAoYnVmZmVyLCBvZmZzZXQpID0+IGJ1ZmZlci5nZXRGbG9hdDMyKG9mZnNldCwgRGF0YVZpZXdVc2VMaXR0bGVFbmRpYW4pO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBjb21wb25lbnQgdHlwZTogJHtjb21wb25lbnRUeXBlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Q29tcG9uZW50V3JpdGVyKGNvbXBvbmVudFR5cGU6IG51bWJlcik6IChidWZmZXI6IERhdGFWaWV3LCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gdm9pZCB7XG4gICAgICAgIHN3aXRjaCAoY29tcG9uZW50VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLkJZVEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIChidWZmZXIsIG9mZnNldCwgdmFsdWUpID0+IGJ1ZmZlci5zZXRJbnQ4KG9mZnNldCwgdmFsdWUpO1xuICAgICAgICAgICAgY2FzZSBHbHRmQWNjZXNzb3JDb21wb25lbnRUeXBlLlVOU0lHTkVEX0JZVEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIChidWZmZXIsIG9mZnNldCwgdmFsdWUpID0+IGJ1ZmZlci5zZXRVaW50OChvZmZzZXQsIHZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5TSE9SVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJ1ZmZlciwgb2Zmc2V0LCB2YWx1ZSkgPT4gYnVmZmVyLnNldEludDE2KG9mZnNldCwgdmFsdWUsIERhdGFWaWV3VXNlTGl0dGxlRW5kaWFuKTtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5VTlNJR05FRF9TSE9SVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJ1ZmZlciwgb2Zmc2V0LCB2YWx1ZSkgPT4gYnVmZmVyLnNldFVpbnQxNihvZmZzZXQsIHZhbHVlLCBEYXRhVmlld1VzZUxpdHRsZUVuZGlhbik7XG4gICAgICAgICAgICBjYXNlIEdsdGZBY2Nlc3NvckNvbXBvbmVudFR5cGUuVU5TSUdORURfSU5UOlxuICAgICAgICAgICAgICAgIHJldHVybiAoYnVmZmVyLCBvZmZzZXQsIHZhbHVlKSA9PiBidWZmZXIuc2V0VWludDMyKG9mZnNldCwgdmFsdWUsIERhdGFWaWV3VXNlTGl0dGxlRW5kaWFuKTtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkFjY2Vzc29yQ29tcG9uZW50VHlwZS5GTE9BVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJ1ZmZlciwgb2Zmc2V0LCB2YWx1ZSkgPT4gYnVmZmVyLnNldEZsb2F0MzIob2Zmc2V0LCB2YWx1ZSwgRGF0YVZpZXdVc2VMaXR0bGVFbmRpYW4pO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBjb21wb25lbnQgdHlwZTogJHtjb21wb25lbnRUeXBlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0R2x0ZlhYTmFtZShhc3NldEtpbmQ6IEdsdGZBc3NldEtpbmQsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgYXNzZXRzQXJyYXlOYW1lOiB7XG4gICAgICAgICAgICBbeDogbnVtYmVyXTogc3RyaW5nO1xuICAgICAgICB9ID0ge1xuICAgICAgICAgICAgW0dsdGZBc3NldEtpbmQuQW5pbWF0aW9uXTogJ2FuaW1hdGlvbnMnLFxuICAgICAgICAgICAgW0dsdGZBc3NldEtpbmQuSW1hZ2VdOiAnaW1hZ2VzJyxcbiAgICAgICAgICAgIFtHbHRmQXNzZXRLaW5kLk1hdGVyaWFsXTogJ21hdGVyaWFscycsXG4gICAgICAgICAgICBbR2x0ZkFzc2V0S2luZC5Ob2RlXTogJ25vZGVzJyxcbiAgICAgICAgICAgIFtHbHRmQXNzZXRLaW5kLlNraW5dOiAnc2tpbnMnLFxuICAgICAgICAgICAgW0dsdGZBc3NldEtpbmQuVGV4dHVyZV06ICd0ZXh0dXJlcycsXG4gICAgICAgICAgICBbR2x0ZkFzc2V0S2luZC5TY2VuZV06ICdzY2VuZXMnLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IHRoaXMuX2dsdGZbYXNzZXRzQXJyYXlOYW1lW2Fzc2V0S2luZF1dO1xuICAgICAgICBpZiAoIWFzc2V0cykge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRzW2luZGV4XTtcbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldC5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0Lm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7R2x0ZkFzc2V0S2luZFthc3NldEtpbmRdfS0ke2luZGV4fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemUgYSBudW1iZXIgYXJyYXkgaWYgbWF4IHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiAxLHJldHVybnMgdGhlIG1heCB2YWx1ZSBhbmQgdGhlIG5vcm1hbGl6ZWQgYXJyYXkuXG4gICAgICogQHBhcmFtIG9yZ0FycmF5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIF9ub3JtYWxpemVBcnJheVRvQ29jb3NDb2xvcihvcmdBcnJheTogbnVtYmVyW10pOiBbZmFjdG9yOiBudW1iZXIsIGNvbG9yOiBjYy5Db2xvcl0ge1xuICAgICAgICBsZXQgZmFjdG9yID0gMTtcbiAgICAgICAgaWYgKE1hdGgubWF4KC4uLm9yZ0FycmF5KSA+IDEpIHtcbiAgICAgICAgICAgIGZhY3RvciA9IE1hdGgubWF4KC4uLm9yZ0FycmF5KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub3JtYWxpemVBcnJheSA9IG9yZ0FycmF5Lm1hcCgodikgPT4gbGluZWFyVG9TcmdiOEJpdCh2IC8gZmFjdG9yKSk7XG4gICAgICAgIGlmIChub3JtYWxpemVBcnJheS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZUFycmF5LnB1c2goMjU1KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xvciA9IG5ldyBjYy5Db2xvcihub3JtYWxpemVBcnJheVswXSwgbm9ybWFsaXplQXJyYXlbMV0sIG5vcm1hbGl6ZUFycmF5WzJdLCBub3JtYWxpemVBcnJheVszXSk7XG4gICAgICAgIHJldHVybiBbZmFjdG9yLCBjb2xvcl07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY29udmVydEFkc2tQaHlzaWNhbE1hdGVyaWFsKFxuICAgICAgICBfZ2xURk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICAgICAgZ2xURk1hdGVyaWFsSW5kZXg6IG51bWJlcixcbiAgICAgICAgZ2xURkFzc2V0RmluZGVyOiBJR2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICBlZmZlY3RHZXR0ZXI6IChuYW1lOiBzdHJpbmcpID0+IGNjLkVmZmVjdEFzc2V0LFxuICAgICAgICBvcmlnaW5hbE1hdGVyaWFsOiB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBBZHNrM2RzTWF4UGh5c2ljYWxNYXRlcmlhbFByb3BlcnRpZXM7XG4gICAgICAgIH0sXG4gICAgKTogY2MuTWF0ZXJpYWwgfCBudWxsIHtcbiAgICAgICAgY29uc3QgZGVmaW5lczogUGFydGlhbDxDcmVhdG9yU3RkTWF0ZXJpYWxEZWZpbmVzPiA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBQYXJ0aWFsPENyZWF0b3JTdGRNYXRlcmlhbFByb3BlcnRpZXM+ID0ge307XG4gICAgICAgIGNvbnN0IHN0YXRlczogY2MuTWF0ZXJpYWxbJ19zdGF0ZXMnXVswXSA9IHtcbiAgICAgICAgICAgIHJhc3Rlcml6ZXJTdGF0ZToge30sXG4gICAgICAgICAgICBibGVuZFN0YXRlOiB7IHRhcmdldHM6IFt7fV0gfSxcbiAgICAgICAgICAgIGRlcHRoU3RlbmNpbFN0YXRlOiB7fSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB7IFBhcmFtZXRlcnM6IHBoeXNpY2FsUGFyYW1zIH0gPSBvcmlnaW5hbE1hdGVyaWFsLnByb3BlcnRpZXNbJzNkc01heCddO1xuICAgICAgICAvLyBOb3RlOiBZb3Ugc2hvdWxkIHN1cHBvcnQgZXZlcnkgdGhpbmcgaW4gYHBoeXNpY2FsUGFyYW1zYCBvcHRpb25hbFxuXG4gICAgICAgIGNvbnN0IHBCYXNlQ29sb3IgPSBwaHlzaWNhbFBhcmFtcy5iYXNlX2NvbG9yID8/IEFEU0tfM0RTX01BWF9QSFlTSUNBTF9NQVRFUklBTF9ERUZBVUxUX1BBUkFNRVRFUlMuYmFzZV9jb2xvcjtcbiAgICAgICAgcHJvcGVydGllc1snbWFpbkNvbG9yJ10gPSBjYy5WZWM0LnNldChuZXcgY2MuQ29sb3IoKSwgcEJhc2VDb2xvclswXSwgcEJhc2VDb2xvclsxXSwgcEJhc2VDb2xvclsyXSwgcEJhc2VDb2xvclszXSk7XG5cbiAgICAgICAgY29uc3QgcEJhc2VXZWlnaHQgPSBwaHlzaWNhbFBhcmFtcy5iYXNpY193ZWlnaHQgPz8gQURTS18zRFNfTUFYX1BIWVNJQ0FMX01BVEVSSUFMX0RFRkFVTFRfUEFSQU1FVEVSUy5iYXNpY193ZWlnaHQ7XG4gICAgICAgIHByb3BlcnRpZXNbJ2FsYmVkb1NjYWxlJ10gPSBuZXcgY2MuVmVjMyhwQmFzZVdlaWdodCwgcEJhc2VXZWlnaHQsIHBCYXNlV2VpZ2h0KTtcblxuICAgICAgICBjb25zdCBwQmFzZUNvbG9yTWFwT24gPSBwaHlzaWNhbFBhcmFtcy5iYXNlX2NvbG9yX21hcF9vbiA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLmJhc2VfY29sb3JfbWFwX29uO1xuICAgICAgICBjb25zdCBwQmFzZUNvbG9yTWFwID0gcGh5c2ljYWxQYXJhbXMuYmFzZV9jb2xvcl9tYXA7XG4gICAgICAgIGlmIChwQmFzZUNvbG9yTWFwT24gJiYgcEJhc2VDb2xvck1hcCkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0FMQkVET19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtYWluVGV4dHVyZSddID0gZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcEJhc2VDb2xvck1hcC5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAocEJhc2VDb2xvck1hcC50ZXhDb29yZCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ0FMQkVET19VViddID0gJ3ZfdXYxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYXNLSFJUZXh0dXJlVHJhbnNmb3JtRXh0ZW5zaW9uKHBCYXNlQ29sb3JNYXApKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1sndGlsaW5nT2Zmc2V0J10gPSB0aGlzLl9raHJUZXh0dXJlVHJhbnNmb3JtVG9UaWxpbmcocEJhc2VDb2xvck1hcC5leHRlbnNpb25zLktIUl90ZXh0dXJlX3RyYW5zZm9ybSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwTWV0YWxuZXNzID0gcGh5c2ljYWxQYXJhbXMubWV0YWxuZXNzID8/IEFEU0tfM0RTX01BWF9QSFlTSUNBTF9NQVRFUklBTF9ERUZBVUxUX1BBUkFNRVRFUlMubWV0YWxuZXNzO1xuICAgICAgICBwcm9wZXJ0aWVzWydtZXRhbGxpYyddID0gcE1ldGFsbmVzcztcbiAgICAgICAgY29uc3QgcFJvdWdobmVzcyA9IHBoeXNpY2FsUGFyYW1zLnJvdWdobmVzcyA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLnJvdWdobmVzcztcbiAgICAgICAgY29uc3QgcEludlJvdWdobmVzcyA9IHBoeXNpY2FsUGFyYW1zLnJvdWdobmVzc19pbnYgPz8gQURTS18zRFNfTUFYX1BIWVNJQ0FMX01BVEVSSUFMX0RFRkFVTFRfUEFSQU1FVEVSUy5yb3VnaG5lc3NfaW52O1xuICAgICAgICBwcm9wZXJ0aWVzWydyb3VnaG5lc3MnXSA9IHBJbnZSb3VnaG5lc3MgPyAxLjAgLSBwUm91Z2huZXNzIDogcFJvdWdobmVzcztcbiAgICAgICAgY29uc3QgcE1ldGFsbmVzc01hcE9uID0gcGh5c2ljYWxQYXJhbXMubWV0YWxuZXNzX21hcF9vbiA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLm1ldGFsbmVzc19tYXBfb247XG4gICAgICAgIGNvbnN0IHBNZXRhbG5lc3NNYXAgPSBwaHlzaWNhbFBhcmFtcy5tZXRhbG5lc3NfbWFwO1xuICAgICAgICBjb25zdCBwUm91Z2huZXNzTWFwT24gPSBwaHlzaWNhbFBhcmFtcy5yb3VnaG5lc3NfbWFwX29uID8/IEFEU0tfM0RTX01BWF9QSFlTSUNBTF9NQVRFUklBTF9ERUZBVUxUX1BBUkFNRVRFUlMucm91Z2huZXNzX21hcF9vbjtcbiAgICAgICAgY29uc3QgcFJvdWdobmVzc01hcCA9IHBoeXNpY2FsUGFyYW1zLnJvdWdobmVzc19tYXA7XG4gICAgICAgIGlmIChwTWV0YWxuZXNzTWFwT24gJiYgcE1ldGFsbmVzc01hcCkge1xuICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgLy8gZGVmaW5lcy5VU0VfTUVUQUxMSUNfUk9VR0hORVNTX01BUCA9IHRydWU7XG4gICAgICAgICAgICAvLyBwcm9wZXJ0aWVzLm1ldGFsbGljUm91Z2huZXNzTWFwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwUm91Z2huZXNzTWFwT24gJiYgcFJvdWdobmVzc01hcCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYXBwbHkgaW52P1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogYnVtcCBtYXAgJiBidW1wIG1hcCBvbj9cbiAgICAgICAgLy8gY29uc3QgcEJ1bXBNYXAgPSBwaHlzaWNhbFBhcmFtcy5idW1wX21hcDtcbiAgICAgICAgLy8gaWYgKHBCdW1wTWFwKSB7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBjb25zdCBwRW1pc3Npb24gPSBwaHlzaWNhbFBhcmFtcy5lbWlzc2lvbiA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLmVtaXNzaW9uO1xuICAgICAgICAvLyBUT0RPOiBlbWlzc2l2ZSBzY2FsZVxuICAgICAgICAvLyBwcm9wZXJ0aWVzWydlbWlzc2l2ZVNjYWxlJ10gPSBuZXcgVmVjNChwRW1pc3Npb24sIHBFbWlzc2lvbiwgcEVtaXNzaW9uLCAxLjApO1xuXG4gICAgICAgIGNvbnN0IHBFbWlzc2l2ZUNvbG9yID0gcGh5c2ljYWxQYXJhbXMuZW1pdF9jb2xvciA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLmVtaXRfY29sb3I7XG4gICAgICAgIHByb3BlcnRpZXNbJ2VtaXNzaXZlJ10gPSBuZXcgVmVjNChcbiAgICAgICAgICAgIHBFbWlzc2l2ZUNvbG9yWzBdICogcEVtaXNzaW9uLFxuICAgICAgICAgICAgcEVtaXNzaXZlQ29sb3JbMV0gKiBwRW1pc3Npb24sXG4gICAgICAgICAgICBwRW1pc3NpdmVDb2xvclsyXSAqIHBFbWlzc2lvbixcbiAgICAgICAgICAgIHBFbWlzc2l2ZUNvbG9yWzNdICogcEVtaXNzaW9uLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIGNvbnN0IHBFbWlzc2lvbk1hcE9uID0gcGh5c2ljYWxQYXJhbXMuZW1pc3Npb25fbWFwX29uID8/IEFEU0tfM0RTX01BWF9QSFlTSUNBTF9NQVRFUklBTF9ERUZBVUxUX1BBUkFNRVRFUlMuZW1pc3Npb25fbWFwX29uO1xuICAgICAgICAvLyBjb25zdCBwRW1pc3Npb25NYXAgPSBwaHlzaWNhbFBhcmFtcy5lbWlzc2lvbl9tYXA7XG4gICAgICAgIC8vIFdlIGRvIG5vdCBzdXBwb3J0IGVtaXNzaW9uIChmYWN0b3IpIG1hcFxuICAgICAgICAvLyBpZiAoKHBFbWlzc2lvbk1hcE9uICYmIHBFbWlzc2lvbk1hcCkpIHtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGNvbnN0IHBFbWlzc2l2ZUNvbG9yTWFwT24gPSBwaHlzaWNhbFBhcmFtcy5lbWl0X2NvbG9yX21hcF9vbiA/PyBBRFNLXzNEU19NQVhfUEhZU0lDQUxfTUFURVJJQUxfREVGQVVMVF9QQVJBTUVURVJTLmVtaXRfY29sb3JfbWFwX29uO1xuICAgICAgICBjb25zdCBwRW1pc3NpdmVDb2xvck1hcCA9IHBoeXNpY2FsUGFyYW1zLmVtaXRfY29sb3JfbWFwO1xuICAgICAgICBpZiAocEVtaXNzaXZlQ29sb3JNYXBPbiAmJiBwRW1pc3NpdmVDb2xvck1hcCkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0VNSVNTSVZFX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ2VtaXNzaXZlTWFwJ10gPSBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwRW1pc3NpdmVDb2xvck1hcC5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAocEVtaXNzaXZlQ29sb3JNYXAudGV4Q29vcmQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydFTUlTU0lWRV9VViddID0gJ3ZfdXYxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vIGRlZmluZXNbJ1VTRV9PQ0NMVVNJT05fTUFQJ10gPSB0cnVlO1xuICAgICAgICAvLyBwcm9wZXJ0aWVzWydvY2NsdXNpb25NYXAnXTtcbiAgICAgICAgLy8gcHJvcGVydGllc1snb2NjbHVzaW9uJ107XG5cbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgY2MuTWF0ZXJpYWwoKTtcbiAgICAgICAgbWF0ZXJpYWwubmFtZSA9IHRoaXMuX2dldEdsdGZYWE5hbWUoR2x0ZkFzc2V0S2luZC5NYXRlcmlhbCwgZ2xURk1hdGVyaWFsSW5kZXgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fZWZmZWN0QXNzZXQgPSBlZmZlY3RHZXR0ZXIoJ2RiOi8vaW50ZXJuYWwvZWZmZWN0cy9idWlsdGluLXN0YW5kYXJkLmVmZmVjdCcpO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fZGVmaW5lcyA9IFtkZWZpbmVzXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX3Byb3BzID0gW3Byb3BlcnRpZXNdO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fc3RhdGVzID0gW3N0YXRlc107XG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb252ZXJ0TWF4UGh5c2ljYWxNYXRlcmlhbChcbiAgICAgICAgZ2xURk1hdGVyaWFsSW5kZXg6IG51bWJlcixcbiAgICAgICAgZ2xURkFzc2V0RmluZGVyOiBJR2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICBlZmZlY3RHZXR0ZXI6IChuYW1lOiBzdHJpbmcpID0+IGNjLkVmZmVjdEFzc2V0LFxuICAgICAgICBwaHlzaWNhbE1hdGVyaWFsOiBNYXhQaHlzaWNhbE1hdGVyaWFsLFxuICAgICk6IGNjLk1hdGVyaWFsIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGRlZmluZXM6IFBhcnRpYWw8Q3JlYXRvckRDQ01ldGFsbGljUm91Z2huZXNzTWF0ZXJpYWxEZWZpbmVzPiA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBQYXJ0aWFsPENyZWF0b3JEQ0NNZXRhbGxpY1JvdWdobmVzc01hdGVyaWFsUHJvcGVydGllcz4gPSB7fTtcbiAgICAgICAgY29uc3Qgc3RhdGVzOiBjYy5NYXRlcmlhbFsnX3N0YXRlcyddWzBdID0ge1xuICAgICAgICAgICAgcmFzdGVyaXplclN0YXRlOiB7fSxcbiAgICAgICAgICAgIGJsZW5kU3RhdGU6IHsgdGFyZ2V0czogW3t9XSB9LFxuICAgICAgICAgICAgZGVwdGhTdGVuY2lsU3RhdGU6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGh5c2ljYWxNYXRlcmlhbC5iYXNlX2NvbG9yX21hcCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGh5c2ljYWxNYXRlcmlhbC5iYXNlX2NvbG9yX21hcC52YWx1ZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9BTEJFRE9fTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snbWFpblRleHR1cmUnXSA9XG4gICAgICAgICAgICAgICAgZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcGh5c2ljYWxNYXRlcmlhbC5iYXNlX2NvbG9yX21hcC52YWx1ZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1snbWFpbkNvbG9yJ10gPSB0aGlzLl9ub3JtYWxpemVBcnJheVRvQ29jb3NDb2xvcihwaHlzaWNhbE1hdGVyaWFsLmJhc2VfY29sb3IudmFsdWUpWzFdO1xuXG4gICAgICAgIGlmIChwaHlzaWNhbE1hdGVyaWFsLmJhc2Vfd2VpZ2h0X21hcCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGh5c2ljYWxNYXRlcmlhbC5iYXNlX3dlaWdodF9tYXAudmFsdWUuaW5kZXgpKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfV0VJR0hUX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ2Jhc2VXZWlnaHRNYXAnXSA9XG4gICAgICAgICAgICAgICAgZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcGh5c2ljYWxNYXRlcmlhbC5iYXNlX3dlaWdodF9tYXAudmFsdWUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbJ2FsYmVkb1NjYWxlJ10gPSBwaHlzaWNhbE1hdGVyaWFsLmJhc2Vfd2VpZ2h0LnZhbHVlO1xuXG4gICAgICAgIGlmIChwaHlzaWNhbE1hdGVyaWFsLm1ldGFsbmVzc19tYXAgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBoeXNpY2FsTWF0ZXJpYWwubWV0YWxuZXNzX21hcC52YWx1ZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9NRVRBTExJQ19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtZXRhbGxpY01hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaHlzaWNhbE1hdGVyaWFsLm1ldGFsbmVzc19tYXAudmFsdWUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbJ21ldGFsbGljJ10gPSBwaHlzaWNhbE1hdGVyaWFsLm1ldGFsbmVzcy52YWx1ZTtcblxuICAgICAgICBpZiAocGh5c2ljYWxNYXRlcmlhbC5yb3VnaG5lc3NfbWFwICYmICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaHlzaWNhbE1hdGVyaWFsLnJvdWdobmVzc19tYXAudmFsdWUuaW5kZXgpKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfUk9VR0hORVNTX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ3JvdWdobmVzc01hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaHlzaWNhbE1hdGVyaWFsLnJvdWdobmVzc19tYXAudmFsdWUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbJ3JvdWdobmVzcyddID0gcGh5c2ljYWxNYXRlcmlhbC5yb3VnaG5lc3MudmFsdWU7XG5cbiAgICAgICAgaWYgKHBoeXNpY2FsTWF0ZXJpYWwuYnVtcF9tYXAgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBoeXNpY2FsTWF0ZXJpYWwuYnVtcF9tYXAudmFsdWUuaW5kZXgpKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfTk9STUFMX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ25vcm1hbE1hcCddID0gZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcGh5c2ljYWxNYXRlcmlhbC5idW1wX21hcC52YWx1ZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGh5c2ljYWxNYXRlcmlhbC5lbWlzc2lvbl9tYXAgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBoeXNpY2FsTWF0ZXJpYWwuZW1pc3Npb25fbWFwLnZhbHVlLmluZGV4KSkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0VNSVNTSVZFU0NBTEVfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmVTY2FsZU1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaHlzaWNhbE1hdGVyaWFsLmVtaXNzaW9uX21hcC52YWx1ZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmVTY2FsZSddID0gcGh5c2ljYWxNYXRlcmlhbC5lbWlzc2lvbi52YWx1ZTtcblxuICAgICAgICBpZiAocGh5c2ljYWxNYXRlcmlhbC5lbWl0X2NvbG9yX21hcCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGh5c2ljYWxNYXRlcmlhbC5lbWl0X2NvbG9yX21hcC52YWx1ZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9FTUlTU0lWRV9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZU1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaHlzaWNhbE1hdGVyaWFsLmVtaXRfY29sb3JfbWFwLnZhbHVlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZSddID0gdGhpcy5fbm9ybWFsaXplQXJyYXlUb0NvY29zQ29sb3IocGh5c2ljYWxNYXRlcmlhbC5lbWl0X2NvbG9yLnZhbHVlKVsxXTtcblxuICAgICAgICAvLyBzZXQgYWxwaGFTb3VyY2UgZGVmYXVsdCB2YWx1ZS5cbiAgICAgICAgcHJvcGVydGllc1snYWxwaGFTb3VyY2UnXSA9IDE7XG4gICAgICAgIGxldCB0ZWNoID0gMDtcbiAgICAgICAgaWYgKHBoeXNpY2FsTWF0ZXJpYWwuY3V0b3V0X21hcCkge1xuICAgICAgICAgICAgdGVjaCA9IDE7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfQUxQSEFfVEVTVCddID0gZmFsc2U7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfT1BBQ0lUWV9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydhbHBoYVNvdXJjZU1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaHlzaWNhbE1hdGVyaWFsLmN1dG91dF9tYXAudmFsdWUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgY2MuTWF0ZXJpYWwoKTtcblxuICAgICAgICBtYXRlcmlhbC5uYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLk1hdGVyaWFsLCBnbFRGTWF0ZXJpYWxJbmRleCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9lZmZlY3RBc3NldCA9IGVmZmVjdEdldHRlcignZGI6Ly9pbnRlcm5hbC9lZmZlY3RzL3V0aWwvZGNjL2ltcG9ydGVkLW1ldGFsbGljLXJvdWdobmVzcy5lZmZlY3QnKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX2RlZmluZXMgPSBbZGVmaW5lc107XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9wcm9wcyA9IFtwcm9wZXJ0aWVzXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX3N0YXRlcyA9IFtzdGF0ZXNdO1xuICAgICAgICBzZXRUZWNobmlxdWVJbmRleChtYXRlcmlhbCwgdGVjaCk7XG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb252ZXJ0TWF5YVN0YW5kYXJkU3VyZmFjZShcbiAgICAgICAgZ2xURk1hdGVyaWFsSW5kZXg6IG51bWJlcixcbiAgICAgICAgZ2xURkFzc2V0RmluZGVyOiBJR2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICBlZmZlY3RHZXR0ZXI6IChuYW1lOiBzdHJpbmcpID0+IGNjLkVmZmVjdEFzc2V0LFxuICAgICAgICBtYXlhU3RhbmRhcmRTdXJmYWNlOiBNYXlhU3RhbmRhcmRTdXJmYWNlLFxuICAgICk6IGNjLk1hdGVyaWFsIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGRlZmluZXM6IFBhcnRpYWw8Q3JlYXRvckRDQ01ldGFsbGljUm91Z2huZXNzTWF0ZXJpYWxEZWZpbmVzPiA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBQYXJ0aWFsPENyZWF0b3JEQ0NNZXRhbGxpY1JvdWdobmVzc01hdGVyaWFsUHJvcGVydGllcz4gPSB7fTtcbiAgICAgICAgY29uc3Qgc3RhdGVzOiBjYy5NYXRlcmlhbFsnX3N0YXRlcyddWzBdID0ge1xuICAgICAgICAgICAgcmFzdGVyaXplclN0YXRlOiB7fSxcbiAgICAgICAgICAgIGJsZW5kU3RhdGU6IHsgdGFyZ2V0czogW3t9XSB9LFxuICAgICAgICAgICAgZGVwdGhTdGVuY2lsU3RhdGU6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAobWF5YVN0YW5kYXJkU3VyZmFjZS5iYXNlLnRleHR1cmUgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKG1heWFTdGFuZGFyZFN1cmZhY2UuYmFzZS50ZXh0dXJlLmluZGV4KSkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX1dFSUdIVF9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydiYXNlV2VpZ2h0TWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIG1heWFTdGFuZGFyZFN1cmZhY2UuYmFzZS50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBwcm9wZXJ0aWVzWydhbGJlZG9TY2FsZSddID0gbWF5YVN0YW5kYXJkU3VyZmFjZS5iYXNlLnZhbHVlO1xuXG4gICAgICAgIGlmIChtYXlhU3RhbmRhcmRTdXJmYWNlLmJhc2VDb2xvci50ZXh0dXJlICYmICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhtYXlhU3RhbmRhcmRTdXJmYWNlLmJhc2VDb2xvci50ZXh0dXJlLmluZGV4KSkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0FMQkVET19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtYWluVGV4dHVyZSddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBtYXlhU3RhbmRhcmRTdXJmYWNlLmJhc2VDb2xvci50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBwcm9wZXJ0aWVzWydtYWluQ29sb3InXSA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKG1heWFTdGFuZGFyZFN1cmZhY2UuYmFzZUNvbG9yLnZhbHVlKVsxXTtcblxuICAgICAgICBpZiAobWF5YVN0YW5kYXJkU3VyZmFjZS5tZXRhbG5lc3MudGV4dHVyZSAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMobWF5YVN0YW5kYXJkU3VyZmFjZS5tZXRhbG5lc3MudGV4dHVyZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9NRVRBTExJQ19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtZXRhbGxpY01hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBtYXlhU3RhbmRhcmRTdXJmYWNlLm1ldGFsbmVzcy50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBwcm9wZXJ0aWVzWydtZXRhbGxpYyddID0gbWF5YVN0YW5kYXJkU3VyZmFjZS5tZXRhbG5lc3MudmFsdWU7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF5YVN0YW5kYXJkU3VyZmFjZS5zcGVjdWxhclJvdWdobmVzcy50ZXh0dXJlICYmXG4gICAgICAgICAgICAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMobWF5YVN0YW5kYXJkU3VyZmFjZS5zcGVjdWxhclJvdWdobmVzcy50ZXh0dXJlLmluZGV4KVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9ST1VHSE5FU1NfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1sncm91Z2huZXNzTWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIG1heWFTdGFuZGFyZFN1cmZhY2Uuc3BlY3VsYXJSb3VnaG5lc3MudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1sncm91Z2huZXNzJ10gPSBtYXlhU3RhbmRhcmRTdXJmYWNlLnNwZWN1bGFyUm91Z2huZXNzLnZhbHVlO1xuICAgICAgICBwcm9wZXJ0aWVzWydzcGVjdWxhckludGVuc2l0eSddID0gTWF0aC5tYXgoLi4ubWF5YVN0YW5kYXJkU3VyZmFjZS5zcGVjdWxhckNvbG9yLnZhbHVlKSAqIDAuNTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBtYXlhU3RhbmRhcmRTdXJmYWNlLm5vcm1hbENhbWVyYS50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhtYXlhU3RhbmRhcmRTdXJmYWNlLm5vcm1hbENhbWVyYS50ZXh0dXJlLmluZGV4KVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9OT1JNQUxfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snbm9ybWFsTWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIG1heWFTdGFuZGFyZFN1cmZhY2Uubm9ybWFsQ2FtZXJhLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF5YVN0YW5kYXJkU3VyZmFjZS5lbWlzc2lvbi50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhtYXlhU3RhbmRhcmRTdXJmYWNlLmVtaXNzaW9uLnRleHR1cmUuaW5kZXgpXG4gICAgICAgICkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0VNSVNTSVZFU0NBTEVfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmVTY2FsZU1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBtYXlhU3RhbmRhcmRTdXJmYWNlLmVtaXNzaW9uLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbJ2VtaXNzaXZlU2NhbGUnXSA9IG1heWFTdGFuZGFyZFN1cmZhY2UuZW1pc3Npb24udmFsdWU7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF5YVN0YW5kYXJkU3VyZmFjZS5lbWlzc2lvbkNvbG9yLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKG1heWFTdGFuZGFyZFN1cmZhY2UuZW1pc3Npb25Db2xvci50ZXh0dXJlLmluZGV4KVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9FTUlTU0lWRV9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZU1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBtYXlhU3RhbmRhcmRTdXJmYWNlLmVtaXNzaW9uQ29sb3IudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmUnXSA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKG1heWFTdGFuZGFyZFN1cmZhY2UuZW1pc3Npb25Db2xvci52YWx1ZSlbMV07XG5cbiAgICAgICAgaWYgKG1heWFTdGFuZGFyZFN1cmZhY2Uub3BhY2l0eS50ZXh0dXJlICYmICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhtYXlhU3RhbmRhcmRTdXJmYWNlLm9wYWNpdHkudGV4dHVyZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9BTFBIQV9URVNUJ10gPSBmYWxzZTtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9PUEFDSVRZX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ2FscGhhU291cmNlTWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIG1heWFTdGFuZGFyZFN1cmZhY2Uub3BhY2l0eS50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLm1heCguLi5tYXlhU3RhbmRhcmRTdXJmYWNlLm9wYWNpdHkudmFsdWUpIDwgMC45OSkge1xuICAgICAgICAgICAgcHJvcGVydGllc1snYWxwaGFTb3VyY2UnXSA9IE1hdGgubWF4KC4uLm1heWFTdGFuZGFyZFN1cmZhY2Uub3BhY2l0eS52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgY2MuTWF0ZXJpYWwoKTtcbiAgICAgICAgbWF0ZXJpYWwubmFtZSA9IHRoaXMuX2dldEdsdGZYWE5hbWUoR2x0ZkFzc2V0S2luZC5NYXRlcmlhbCwgZ2xURk1hdGVyaWFsSW5kZXgpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1KEdsdGZBc3NldEtpbmQuTWF0ZXJpYWxcbiAgICAgICAgbWF0ZXJpYWwuX2VmZmVjdEFzc2V0ID0gZWZmZWN0R2V0dGVyKCdkYjovL2ludGVybmFsL2VmZmVjdHMvdXRpbC9kY2MvaW1wb3J0ZWQtbWV0YWxsaWMtcm91Z2huZXNzLmVmZmVjdCcpO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fZGVmaW5lcyA9IFtkZWZpbmVzXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX3Byb3BzID0gW3Byb3BlcnRpZXNdO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fc3RhdGVzID0gW3N0YXRlc107XG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb252ZXJ0UGhvbmdNYXRlcmlhbChcbiAgICAgICAgZ2xURk1hdGVyaWFsSW5kZXg6IG51bWJlcixcbiAgICAgICAgZ2xURkFzc2V0RmluZGVyOiBJR2x0ZkFzc2V0RmluZGVyLFxuICAgICAgICBlZmZlY3RHZXR0ZXI6IChuYW1lOiBzdHJpbmcpID0+IGNjLkVmZmVjdEFzc2V0LFxuICAgICAgICBhcHBJRDogQXBwSWQsXG4gICAgICAgIHBob25nTWF0OiBGYnhTdXJmYWNlTGFtYmVydE9yUGhvbmdQcm9wZXJ0aWVzLFxuICAgICk6IGNjLk1hdGVyaWFsIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGRlZmluZXM6IFBhcnRpYWw8Q3JlYXRvclBob25nTWF0ZXJpYWxEZWZpbmVzPiA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBQYXJ0aWFsPENyZWF0b3JQaG9uZ01hdGVyaWFsUHJvcGVydGllcz4gPSB7fTtcbiAgICAgICAgY29uc3Qgc3RhdGVzOiBjYy5NYXRlcmlhbFsnX3N0YXRlcyddWzBdID0ge1xuICAgICAgICAgICAgcmFzdGVyaXplclN0YXRlOiB7fSxcbiAgICAgICAgICAgIGJsZW5kU3RhdGU6IHsgdGFyZ2V0czogW3t9XSB9LFxuICAgICAgICAgICAgZGVwdGhTdGVuY2lsU3RhdGU6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBsZXQgdGVjaCA9IDA7XG4gICAgICAgIGxldCBhbHBoYVZhbHVlID0gMjU1O1xuICAgICAgICBpZiAocGhvbmdNYXQudHJhbnNwYXJlbnRDb2xvci50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0LnRyYW5zcGFyZW50Q29sb3IudGV4dHVyZS5pbmRleCkpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9BTFBIQV9URVNUJ10gPSBmYWxzZTtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9UUkFOU1BBUkVOQ1lfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1sndHJhbnNwYXJlbmN5TWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0LnRyYW5zcGFyZW50Q29sb3IudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0ZWNoID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChwaG9uZ01hdC50cmFuc3BhcmVuY3lGYWN0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHRoZUNvbG9yID1cbiAgICAgICAgICAgICAgICAocGhvbmdNYXQudHJhbnNwYXJlbnRDb2xvci52YWx1ZVswXSArIHBob25nTWF0LnRyYW5zcGFyZW50Q29sb3IudmFsdWVbMV0gKyBwaG9uZ01hdC50cmFuc3BhcmVudENvbG9yLnZhbHVlWzJdKSAvIDMuMDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAhKFxuICAgICAgICAgICAgICAgICAgICBwaG9uZ01hdC50cmFuc3BhcmVudENvbG9yLnZhbHVlWzBdID09PSBwaG9uZ01hdC50cmFuc3BhcmVudENvbG9yLnZhbHVlWzFdICYmXG4gICAgICAgICAgICAgICAgICAgIHBob25nTWF0LnRyYW5zcGFyZW50Q29sb3IudmFsdWVbMF0gPT09IHBob25nTWF0LnRyYW5zcGFyZW50Q29sb3IudmFsdWVbMl1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgIGBNYXRlcmlhbCAke3RoaXMuX2dldEdsdGZYWE5hbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBHbHRmQXNzZXRLaW5kLk1hdGVyaWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2xURk1hdGVyaWFsSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICl9IDogVHJhbnNwYXJlbnQgY29sb3IgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCwgYXZlcmFnZSB2YWx1ZSB3b3VsZCBiZSB1c2VkLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRyYW5zcGFyZW5jeVZhbHVlID0gcGhvbmdNYXQudHJhbnNwYXJlbmN5RmFjdG9yLnZhbHVlICogdGhlQ29sb3I7XG4gICAgICAgICAgICBpZiAodHJhbnNwYXJlbmN5VmFsdWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICB0ZWNoID0gMTtcbiAgICAgICAgICAgICAgICBhbHBoYVZhbHVlID0gbGluZWFyVG9TcmdiOEJpdCgxIC0gcGhvbmdNYXQudHJhbnNwYXJlbmN5RmFjdG9yLnZhbHVlICogdGhlQ29sb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwaG9uZ01hdC5kaWZmdXNlKSB7XG4gICAgICAgICAgICBjb25zdCBkaWZmdXNlQ29sb3IgPSB0aGlzLl9ub3JtYWxpemVBcnJheVRvQ29jb3NDb2xvcihwaG9uZ01hdC5kaWZmdXNlLnZhbHVlKTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ2FsYmVkb1NjYWxlJ10gPSBwaG9uZ01hdC5kaWZmdXNlRmFjdG9yLnZhbHVlICogZGlmZnVzZUNvbG9yWzBdO1xuICAgICAgICAgICAgZGlmZnVzZUNvbG9yWzFdLmEgPSBhbHBoYVZhbHVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snbWFpbkNvbG9yJ10gPSBkaWZmdXNlQ29sb3JbMV07IC8vdXNlIHNyZ2IgaW5wdXQgY29sb3JcbiAgICAgICAgICAgIGlmIChwaG9uZ01hdC5kaWZmdXNlLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGhvbmdNYXQuZGlmZnVzZS50ZXh0dXJlLmluZGV4KSkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9BTEJFRE9fTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ21haW5UZXh0dXJlJ10gPSBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdC5kaWZmdXNlLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwaG9uZ01hdC5zcGVjdWxhcikge1xuICAgICAgICAgICAgY29uc3Qgc3BlY3VsYXJDb2xvciA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKHBob25nTWF0LnNwZWN1bGFyLnZhbHVlKTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ3NwZWN1bGFyRmFjdG9yJ10gPSBwaG9uZ01hdC5zcGVjdWxhckZhY3RvciEudmFsdWUgKiBzcGVjdWxhckNvbG9yWzBdO1xuICAgICAgICAgICAgcHJvcGVydGllc1snc3BlY3VsYXJDb2xvciddID0gc3BlY3VsYXJDb2xvclsxXTsgLy8gcGhvbmdfbWF0LnNwZWN1bGFyLnZhbHVlO1xuICAgICAgICAgICAgaWYgKHBob25nTWF0LnNwZWN1bGFyLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGhvbmdNYXQuc3BlY3VsYXIudGV4dHVyZS5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfU1BFQ1VMQVJfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ3NwZWN1bGFyTWFwJ10gPSBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdC5zcGVjdWxhci50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGhvbmdNYXQubm9ybWFsTWFwPy50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0Lm5vcm1hbE1hcC50ZXh0dXJlLmluZGV4KSkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX05PUk1BTF9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydub3JtYWxNYXAnXSA9IGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0Lm5vcm1hbE1hcC50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIGlmIChwaG9uZ01hdC5idW1wPy50ZXh0dXJlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9OT1JNQUxfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snbm9ybWFsTWFwJ10gPSBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdC5idW1wLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwaG9uZ01hdC5zaGluaW5lc3MpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ3NoaW5pbmVzc0V4cG9uZW50J10gPSBwaG9uZ01hdC5zaGluaW5lc3MudmFsdWU7XG4gICAgICAgICAgICBpZiAocGhvbmdNYXQuc2hpbmluZXNzLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5mYnhNaXNzaW5nSW1hZ2VzSWQuaW5jbHVkZXMocGhvbmdNYXQuc2hpbmluZXNzLnRleHR1cmUuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lc1snVVNFX1NISU5JTkVTU19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1snc2hpbmluZXNzRXhwb25lbnRNYXAnXSA9XG4gICAgICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0LnNoaW5pbmVzcy50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGhvbmdNYXQuZW1pc3NpdmUpIHtcbiAgICAgICAgICAgIGNvbnN0IGVtaXNzaXZlQ29sb3IgPSB0aGlzLl9ub3JtYWxpemVBcnJheVRvQ29jb3NDb2xvcihwaG9uZ01hdC5lbWlzc2l2ZS52YWx1ZSk7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZVNjYWxlJ10gPSBwaG9uZ01hdC5lbWlzc2l2ZUZhY3Rvci52YWx1ZSAqIGVtaXNzaXZlQ29sb3JbMF07XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZSddID0gZW1pc3NpdmVDb2xvclsxXTtcbiAgICAgICAgICAgIGlmIChwaG9uZ01hdC5lbWlzc2l2ZS50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiYgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0LmVtaXNzaXZlLnRleHR1cmUuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lc1snVVNFX0VNSVNTSVZFX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZU1hcCddID0gZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcGhvbmdNYXQuZW1pc3NpdmUudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhvbmdNYXQuZW1pc3NpdmVGYWN0b3IudGV4dHVyZSAhPT0gdW5kZWZpbmVkICYmICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaG9uZ01hdC5lbWlzc2l2ZUZhY3Rvci50ZXh0dXJlLmluZGV4KSkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9FTUlTU0lWRVNDQUxFX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZVNjYWxlTWFwJ10gPVxuICAgICAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdC5lbWlzc2l2ZUZhY3Rvci50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmluZXNbJ0RDQ19BUFBfTkFNRSddID0gYXBwSUQ7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gbmV3IGNjLk1hdGVyaWFsKCk7XG4gICAgICAgIG1hdGVyaWFsLm5hbWUgPSB0aGlzLl9nZXRHbHRmWFhOYW1lKEdsdGZBc3NldEtpbmQuTWF0ZXJpYWwsIGdsVEZNYXRlcmlhbEluZGV4KTtcbiAgICAgICAgc2V0VGVjaG5pcXVlSW5kZXgobWF0ZXJpYWwsIHRlY2gpO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fZWZmZWN0QXNzZXQgPSBlZmZlY3RHZXR0ZXIoJ2RiOi8vaW50ZXJuYWwvZWZmZWN0cy91dGlsL2RjYy9pbXBvcnRlZC1zcGVjdWxhci1nbG9zc2luZXNzLmVmZmVjdCcpO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fZGVmaW5lcyA9IFtkZWZpbmVzXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX3Byb3BzID0gW3Byb3BlcnRpZXNdO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fc3RhdGVzID0gW3N0YXRlc107XG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb252ZXJ0QmxlbmRlclBCUk1hdGVyaWFsKFxuICAgICAgICBnbFRGTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgICAgICBnbFRGTWF0ZXJpYWxJbmRleDogbnVtYmVyLFxuICAgICAgICBnbFRGQXNzZXRGaW5kZXI6IElHbHRmQXNzZXRGaW5kZXIsXG4gICAgICAgIGVmZmVjdEdldHRlcjogKG5hbWU6IHN0cmluZykgPT4gY2MuRWZmZWN0QXNzZXQsXG4gICAgKTogY2MuTWF0ZXJpYWwgfCBudWxsIHtcbiAgICAgICAgY29uc3QgZGVmaW5lczogUGFydGlhbDxDcmVhdG9yUGhvbmdNYXRlcmlhbERlZmluZXM+ID0ge307XG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXM6IFBhcnRpYWw8Q3JlYXRvclBob25nTWF0ZXJpYWxQcm9wZXJ0aWVzPiA9IHt9O1xuICAgICAgICBjb25zdCBzdGF0ZXM6IGNjLk1hdGVyaWFsWydfc3RhdGVzJ11bMF0gPSB7XG4gICAgICAgICAgICByYXN0ZXJpemVyU3RhdGU6IHt9LFxuICAgICAgICAgICAgYmxlbmRTdGF0ZTogeyB0YXJnZXRzOiBbe31dIH0sXG4gICAgICAgICAgICBkZXB0aFN0ZW5jaWxTdGF0ZToge30sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcGhvbmdNYXRlcmlhbENvbnRhaW5lcjogRmJ4U3VyZmFjZVBob25nUHJvcGVydGllcyA9IGdsVEZNYXRlcmlhbC5leHRyYXNbJ0ZCWC1nbFRGLWNvbnYnXS5yYXcucHJvcGVydGllcztcbiAgICAgICAgZGVmaW5lc1snRENDX0FQUF9OQU1FJ10gPSAyO1xuICAgICAgICBkZWZpbmVzWydIQVNfRVhQT1JURURfTUVUQUxMSUMnXSA9IHRydWU7XG4gICAgICAgIC8vIGJhc2UgY29sb3JcbiAgICAgICAgaWYgKHBob25nTWF0ZXJpYWxDb250YWluZXIuZGlmZnVzZSkge1xuICAgICAgICAgICAgY29uc3QgZGlmZnVzZUNvbG9yID0gdGhpcy5fbm9ybWFsaXplQXJyYXlUb0NvY29zQ29sb3IocGhvbmdNYXRlcmlhbENvbnRhaW5lci5kaWZmdXNlLnZhbHVlKTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ21haW5Db2xvciddID0gZGlmZnVzZUNvbG9yWzFdOyAvLyBwaG9uZ19tYXQuZGlmZnVzZS52YWx1ZTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmRpZmZ1c2UudGV4dHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0ZXJpYWxDb250YWluZXIuZGlmZnVzZS50ZXh0dXJlLmluZGV4KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lc1snVVNFX0FMQkVET19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1snbWFpblRleHR1cmUnXSA9XG4gICAgICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0ZXJpYWxDb250YWluZXIuZGlmZnVzZS50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBub3JtYWxcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgcGhvbmdNYXRlcmlhbENvbnRhaW5lci5idW1wPy50ZXh0dXJlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmJ1bXAudGV4dHVyZS5pbmRleClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfTk9STUFMX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ25vcm1hbE1hcCddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmJ1bXAudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcm91Z2huZXNzXG4gICAgICAgIGlmIChwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnNoaW5pbmVzcykge1xuICAgICAgICAgICAgcHJvcGVydGllc1snc2hpbmluZXNzRXhwb25lbnQnXSA9IHBob25nTWF0ZXJpYWxDb250YWluZXIuc2hpbmluZXNzLnZhbHVlO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHBob25nTWF0ZXJpYWxDb250YWluZXIuc2hpbmluZXNzLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnNoaW5pbmVzcy50ZXh0dXJlLmluZGV4KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gcm91Z2huZXNzIG1hcFxuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9TSElOSU5FU1NfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ3NoaW5pbmVzc0V4cG9uZW50TWFwJ10gPVxuICAgICAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnNoaW5pbmVzcy50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGhvbmdNYXRlcmlhbENvbnRhaW5lci5lbWlzc2l2ZSkge1xuICAgICAgICAgICAgY29uc3QgZW1pc3NpdmVDb2xvciA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKHBob25nTWF0ZXJpYWxDb250YWluZXIuZW1pc3NpdmUudmFsdWUpO1xuICAgICAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmVTY2FsZSddID0gcGhvbmdNYXRlcmlhbENvbnRhaW5lci5lbWlzc2l2ZUZhY3Rvci52YWx1ZSAqIGVtaXNzaXZlQ29sb3JbMF07XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZSddID0gZW1pc3NpdmVDb2xvclsxXTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmVtaXNzaXZlLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmVtaXNzaXZlLnRleHR1cmUuaW5kZXgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfRU1JU1NJVkVfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ2VtaXNzaXZlTWFwJ10gPVxuICAgICAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmVtaXNzaXZlLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHBob25nTWF0ZXJpYWxDb250YWluZXIuZW1pc3NpdmVGYWN0b3IudGV4dHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0ZXJpYWxDb250YWluZXIuZW1pc3NpdmVGYWN0b3IudGV4dHVyZS5pbmRleClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9FTUlTU0lWRVNDQUxFX01BUCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzWydlbWlzc2l2ZVNjYWxlTWFwJ10gPVxuICAgICAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLmVtaXNzaXZlRmFjdG9yLnRleHR1cmUuaW5kZXgsIGNjLlRleHR1cmUyRCkgPz8gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIG1ldGFsbGljXG4gICAgICAgIGlmIChwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnJlZmxlY3Rpb25GYWN0b3IpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ21ldGFsbGljJ10gPSBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnJlZmxlY3Rpb25GYWN0b3IudmFsdWU7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcGhvbmdNYXRlcmlhbENvbnRhaW5lci5yZWZsZWN0aW9uRmFjdG9yLnRleHR1cmUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICF0aGlzLmZieE1pc3NpbmdJbWFnZXNJZC5pbmNsdWRlcyhwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnJlZmxlY3Rpb25GYWN0b3IudGV4dHVyZS5pbmRleClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9NRVRBTExJQ19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1snbWV0YWxsaWNNYXAnXSA9XG4gICAgICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0ZXJpYWxDb250YWluZXIucmVmbGVjdGlvbkZhY3Rvci50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBzcGVjdWxhclxuICAgICAgICBpZiAocGhvbmdNYXRlcmlhbENvbnRhaW5lci5zcGVjdWxhckZhY3Rvcikge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHBob25nTWF0ZXJpYWxDb250YWluZXIuc3BlY3VsYXJGYWN0b3IudGV4dHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0ZXJpYWxDb250YWluZXIuc3BlY3VsYXJGYWN0b3IudGV4dHVyZS5pbmRleClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9TUEVDVUxBUl9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1snc3BlY3VsYXJNYXAnXSA9XG4gICAgICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIHBob25nTWF0ZXJpYWxDb250YWluZXIuc3BlY3VsYXJGYWN0b3IudGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ3NwZWN1bGFyRmFjdG9yJ10gPSBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnNwZWN1bGFyRmFjdG9yLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBob25nTWF0ZXJpYWxDb250YWluZXIudHJhbnNwYXJlbmN5RmFjdG9yKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcGhvbmdNYXRlcmlhbENvbnRhaW5lci50cmFuc3BhcmVuY3lGYWN0b3IudGV4dHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuZmJ4TWlzc2luZ0ltYWdlc0lkLmluY2x1ZGVzKHBob25nTWF0ZXJpYWxDb250YWluZXIudHJhbnNwYXJlbmN5RmFjdG9yLnRleHR1cmUuaW5kZXgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydVU0VfQUxQSEFfVEVTVCddID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZGVmaW5lc1snVVNFX1RSQU5TUEFSRU5DWV9NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1sndHJhbnNwYXJlbmN5TWFwJ10gPVxuICAgICAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnRyYW5zcGFyZW5jeUZhY3Rvci50ZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1sndHJhbnNwYXJlbmN5RmFjdG9yJ10gPSBwaG9uZ01hdGVyaWFsQ29udGFpbmVyLnRyYW5zcGFyZW5jeUZhY3Rvci52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBjYy5NYXRlcmlhbCgpO1xuICAgICAgICBtYXRlcmlhbC5uYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLk1hdGVyaWFsLCBnbFRGTWF0ZXJpYWxJbmRleCk7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX2VmZmVjdEFzc2V0ID0gZWZmZWN0R2V0dGVyKCdkYjovL2ludGVybmFsL2VmZmVjdHMvdXRpbC9kY2MvaW1wb3J0ZWQtc3BlY3VsYXItZ2xvc3NpbmVzcy5lZmZlY3QnKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX2RlZmluZXMgPSBbZGVmaW5lc107XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9wcm9wcyA9IFtwcm9wZXJ0aWVzXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzI0NDVcbiAgICAgICAgbWF0ZXJpYWwuX3N0YXRlcyA9IFtzdGF0ZXNdO1xuICAgICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfVxuICAgIHByaXZhdGUgX2NvbnZlcnRHbHRmUGJyU3BlY3VsYXJHbG9zc2luZXNzKFxuICAgICAgICBnbFRGTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgICAgICBnbFRGTWF0ZXJpYWxJbmRleDogbnVtYmVyLFxuICAgICAgICBnbFRGQXNzZXRGaW5kZXI6IElHbHRmQXNzZXRGaW5kZXIsXG4gICAgICAgIGVmZmVjdEdldHRlcjogKG5hbWU6IHN0cmluZykgPT4gY2MuRWZmZWN0QXNzZXQsXG4gICAgICAgIGRlcHRoV3JpdGVJbkFscGhhTW9kZUJsZW5kOiBib29sZWFuLFxuICAgICk6IGNjLk1hdGVyaWFsIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGRlZmluZXM6IFBhcnRpYWw8Q3JlYXRvclBob25nTWF0ZXJpYWxEZWZpbmVzPiA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBQYXJ0aWFsPENyZWF0b3JQaG9uZ01hdGVyaWFsUHJvcGVydGllcz4gPSB7fTtcbiAgICAgICAgY29uc3Qgc3RhdGVzOiBjYy5NYXRlcmlhbFsnX3N0YXRlcyddWzBdID0ge1xuICAgICAgICAgICAgcmFzdGVyaXplclN0YXRlOiB7fSxcbiAgICAgICAgICAgIGJsZW5kU3RhdGU6IHsgdGFyZ2V0czogW3t9XSB9LFxuICAgICAgICAgICAgZGVwdGhTdGVuY2lsU3RhdGU6IHt9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGdsdGZTcGVjdWxhckdsb3NzaW5lc3MgPSBnbFRGTWF0ZXJpYWwuZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3BiclNwZWN1bGFyR2xvc3NpbmVzcztcbiAgICAgICAgZGVmaW5lc1snRENDX0FQUF9OQU1FJ10gPSA0O1xuICAgICAgICAvLyBiYXNlIGNvbG9yXG4gICAgICAgIGlmIChnbHRmU3BlY3VsYXJHbG9zc2luZXNzLmRpZmZ1c2VGYWN0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpZmZ1c2VDb2xvciA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKGdsdGZTcGVjdWxhckdsb3NzaW5lc3MuZGlmZnVzZUZhY3Rvcik7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtYWluQ29sb3InXSA9IGRpZmZ1c2VDb2xvclsxXTsgLy8gcGhvbmdfbWF0LmRpZmZ1c2UudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdsdGZTcGVjdWxhckdsb3NzaW5lc3MuZGlmZnVzZVRleHR1cmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX0FMQkVET19NQVAnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydtYWluVGV4dHVyZSddID1cbiAgICAgICAgICAgICAgICBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBnbHRmU3BlY3VsYXJHbG9zc2luZXNzLmRpZmZ1c2VUZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpID8/IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBzcGVjdWxhclxuICAgICAgICBpZiAoZ2x0ZlNwZWN1bGFyR2xvc3NpbmVzcy5zcGVjdWxhckZhY3Rvcikge1xuICAgICAgICAgICAgY29uc3Qgc3BlY3VsYXJDb2xvciA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKGdsdGZTcGVjdWxhckdsb3NzaW5lc3Muc3BlY3VsYXJGYWN0b3IpO1xuICAgICAgICAgICAgcHJvcGVydGllc1snc3BlY3VsYXJDb2xvciddID0gc3BlY3VsYXJDb2xvclsxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdsb3NzaW5lc3NcbiAgICAgICAgaWYgKGdsdGZTcGVjdWxhckdsb3NzaW5lc3MuZ2xvc3NpbmVzc0ZhY3Rvcikge1xuICAgICAgICAgICAgZGVmaW5lc1snSEFTX0VYUE9SVEVEX0dMT1NTSU5FU1MnXSA9IHRydWU7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzWydnbG9zc2luZXNzJ10gPSBnbHRmU3BlY3VsYXJHbG9zc2luZXNzLmdsb3NzaW5lc3NGYWN0b3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2x0ZlNwZWN1bGFyR2xvc3NpbmVzcy5zcGVjdWxhckdsb3NzaW5lc3NUZXh0dXJlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlZmluZXNbJ0hBU19FWFBPUlRFRF9HTE9TU0lORVNTJ10gPSB0cnVlO1xuICAgICAgICAgICAgZGVmaW5lc1snVVNFX1NQRUNVTEFSX0dMT1NTSU5FU1NfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgcHJvcGVydGllc1snc3BlY3VsYXJHbG9zc2luZXNzTWFwJ10gPVxuICAgICAgICAgICAgICAgIGdsVEZBc3NldEZpbmRlci5maW5kKCd0ZXh0dXJlcycsIGdsdGZTcGVjdWxhckdsb3NzaW5lc3Muc3BlY3VsYXJHbG9zc2luZXNzVGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2xURk1hdGVyaWFsLm5vcm1hbFRleHR1cmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgcGJyTm9ybWFsVGV4dHVyZSA9IGdsVEZNYXRlcmlhbC5ub3JtYWxUZXh0dXJlO1xuICAgICAgICAgICAgaWYgKHBick5vcm1hbFRleHR1cmUuaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9OT1JNQUxfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ25vcm1hbE1hcCddID0gZ2xURkFzc2V0RmluZGVyLmZpbmQoJ3RleHR1cmVzJywgcGJyTm9ybWFsVGV4dHVyZS5pbmRleCwgY2MuVGV4dHVyZTJEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2xURk1hdGVyaWFsLmVtaXNzaXZlVGV4dHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWZpbmVzWydVU0VfRU1JU1NJVkVfTUFQJ10gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGdsVEZNYXRlcmlhbC5lbWlzc2l2ZVRleHR1cmUudGV4Q29vcmQpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVzWydFTUlTU0lWRV9VViddID0gJ3ZfdXYxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3BlcnRpZXNbJ2VtaXNzaXZlTWFwJ10gPSBnbFRGQXNzZXRGaW5kZXIuZmluZCgndGV4dHVyZXMnLCBnbFRGTWF0ZXJpYWwuZW1pc3NpdmVUZXh0dXJlLmluZGV4LCBjYy5UZXh0dXJlMkQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdsVEZNYXRlcmlhbC5lbWlzc2l2ZUZhY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCB2ID0gZ2xURk1hdGVyaWFsLmVtaXNzaXZlRmFjdG9yO1xuICAgICAgICAgICAgcHJvcGVydGllc1snZW1pc3NpdmUnXSA9IHRoaXMuX25vcm1hbGl6ZUFycmF5VG9Db2Nvc0NvbG9yKHYpWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdsVEZNYXRlcmlhbC5kb3VibGVTaWRlZCkge1xuICAgICAgICAgICAgc3RhdGVzLnJhc3Rlcml6ZXJTdGF0ZSEuY3VsbE1vZGUgPSBnZnguQ3VsbE1vZGUuTk9ORTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGdsVEZNYXRlcmlhbC5hbHBoYU1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ0JMRU5EJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsZW5kU3RhdGUgPSBzdGF0ZXMuYmxlbmRTdGF0ZSEudGFyZ2V0cyFbMF07XG4gICAgICAgICAgICAgICAgYmxlbmRTdGF0ZS5ibGVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYmxlbmRTdGF0ZS5ibGVuZFNyYyA9IGdmeC5CbGVuZEZhY3Rvci5TUkNfQUxQSEE7XG4gICAgICAgICAgICAgICAgYmxlbmRTdGF0ZS5ibGVuZERzdCA9IGdmeC5CbGVuZEZhY3Rvci5PTkVfTUlOVVNfU1JDX0FMUEhBO1xuICAgICAgICAgICAgICAgIGJsZW5kU3RhdGUuYmxlbmREc3RBbHBoYSA9IGdmeC5CbGVuZEZhY3Rvci5PTkVfTUlOVVNfU1JDX0FMUEhBO1xuICAgICAgICAgICAgICAgIHN0YXRlcy5kZXB0aFN0ZW5jaWxTdGF0ZSEuZGVwdGhXcml0ZSA9IGRlcHRoV3JpdGVJbkFscGhhTW9kZUJsZW5kO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnTUFTSyc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbHBoYUN1dG9mZiA9IGdsVEZNYXRlcmlhbC5hbHBoYUN1dG9mZiA9PT0gdW5kZWZpbmVkID8gMC41IDogZ2xURk1hdGVyaWFsLmFscGhhQ3V0b2ZmO1xuICAgICAgICAgICAgICAgIGRlZmluZXNbJ1VTRV9BTFBIQV9URVNUJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbJ2FscGhhVGhyZXNob2xkJ10gPSBhbHBoYUN1dG9mZjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ09QQVFVRSc6XG4gICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyKEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuV2FybmluZywgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5VbnN1cHBvcnRlZEFscGhhTW9kZSwge1xuICAgICAgICAgICAgICAgICAgICBtb2RlOiBnbFRGTWF0ZXJpYWwuYWxwaGFNb2RlLFxuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbDogZ2xURk1hdGVyaWFsSW5kZXgsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBjYy5NYXRlcmlhbCgpO1xuICAgICAgICBtYXRlcmlhbC5uYW1lID0gdGhpcy5fZ2V0R2x0ZlhYTmFtZShHbHRmQXNzZXRLaW5kLk1hdGVyaWFsLCBnbFRGTWF0ZXJpYWxJbmRleCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9lZmZlY3RBc3NldCA9IGVmZmVjdEdldHRlcignZGI6Ly9pbnRlcm5hbC9lZmZlY3RzL3V0aWwvZGNjL2ltcG9ydGVkLXNwZWN1bGFyLWdsb3NzaW5lc3MuZWZmZWN0Jyk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9kZWZpbmVzID0gW2RlZmluZXNdO1xuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjQ0NVxuICAgICAgICBtYXRlcmlhbC5fcHJvcHMgPSBbcHJvcGVydGllc107XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVFMyNDQ1XG4gICAgICAgIG1hdGVyaWFsLl9zdGF0ZXMgPSBbc3RhdGVzXTtcbiAgICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2toclRleHR1cmVUcmFuc2Zvcm1Ub1RpbGluZyhraHJUZXh0dXJlVHJhbnNmb3JtOiB7IHNjYWxlPzogW251bWJlciwgbnVtYmVyXTsgb2Zmc2V0PzogW251bWJlciwgbnVtYmVyXSB9KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZWM0KDEsIDEsIDAsIDApO1xuICAgICAgICBpZiAoa2hyVGV4dHVyZVRyYW5zZm9ybS5zY2FsZSkge1xuICAgICAgICAgICAgcmVzdWx0LnggPSBraHJUZXh0dXJlVHJhbnNmb3JtLnNjYWxlWzBdO1xuICAgICAgICAgICAgcmVzdWx0LnkgPSBraHJUZXh0dXJlVHJhbnNmb3JtLnNjYWxlWzFdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChraHJUZXh0dXJlVHJhbnNmb3JtLm9mZnNldCkge1xuICAgICAgICAgICAgcmVzdWx0LnogPSBraHJUZXh0dXJlVHJhbnNmb3JtLm9mZnNldFswXTtcbiAgICAgICAgICAgIHJlc3VsdC53ID0ga2hyVGV4dHVyZVRyYW5zZm9ybS5vZmZzZXRbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmludGVyZmFjZSBLSFJUZXh0dXJlVHJhbnNmb3JtRXh0ZW5zaW9uIHtcbiAgICBzY2FsZT86IFtudW1iZXIsIG51bWJlcl07XG4gICAgb2Zmc2V0PzogW251bWJlciwgbnVtYmVyXTtcbn1cblxuZnVuY3Rpb24gaGFzS0hSVGV4dHVyZVRyYW5zZm9ybUV4dGVuc2lvbihvYmo6IHsgZXh0ZW5zaW9ucz86IHVua25vd24gfSk6IG9iaiBpcyB7XG4gICAgZXh0ZW5zaW9uczoge1xuICAgICAgICBLSFJfdGV4dHVyZV90cmFuc2Zvcm06IEtIUlRleHR1cmVUcmFuc2Zvcm1FeHRlbnNpb247XG4gICAgfTtcbn0ge1xuICAgIGNvbnN0IHsgZXh0ZW5zaW9ucyB9ID0gb2JqO1xuICAgIHJldHVybiAoXG4gICAgICAgIHR5cGVvZiBleHRlbnNpb25zID09PSAnb2JqZWN0JyAmJlxuICAgICAgICBleHRlbnNpb25zICE9PSBudWxsICYmXG4gICAgICAgIHR5cGVvZiAoZXh0ZW5zaW9ucyBhcyB7IEtIUl90ZXh0dXJlX3RyYW5zZm9ybT86IHVua25vd24gfSlbJ0tIUl90ZXh0dXJlX3RyYW5zZm9ybSddID09PSAnb2JqZWN0J1xuICAgICk7XG59XG5mdW5jdGlvbiBzZXRUZWNobmlxdWVJbmRleChtYXRlcmlhbDogY2MuTWF0ZXJpYWwsIGluZGV4OiBudW1iZXIpIHtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IGZpeCB0eXBlXG4gICAgbWF0ZXJpYWwuX3RlY2hJZHggPSBpbmRleDtcbn1cbmV4cG9ydCBuYW1lc3BhY2UgR2x0ZkNvbnZlcnRlciB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgICAgICAgbG9nZ2VyPzogTG9nZ2VyO1xuICAgICAgICB1c2VyRGF0YT86IE9taXQ8R2xURlVzZXJEYXRhLCAnaW1hZ2VNZXRhcyc+O1xuICAgICAgICBwcm9tb3RlU2luZ2xlUm9vdE5vZGU/OiBib29sZWFuO1xuICAgICAgICBnZW5lcmF0ZUxpZ2h0bWFwVVZOb2RlPzogYm9vbGVhbjtcbiAgICB9XG5cbiAgICBleHBvcnQgdHlwZSBMb2dnZXIgPSA8RXJyb3JUeXBlIGV4dGVuZHMgQ29udmVydGVyRXJyb3I+KFxuICAgICAgICBsZXZlbDogTG9nTGV2ZWwsXG4gICAgICAgIGVycm9yOiBFcnJvclR5cGUsXG4gICAgICAgIGFyZ3M6IENvbnZlcnRlckVycm9yQXJndW1lbnRGb3JtYXRbRXJyb3JUeXBlXSxcbiAgICApID0+IHZvaWQ7XG5cbiAgICBleHBvcnQgZW51bSBMb2dMZXZlbCB7XG4gICAgICAgIEluZm8sXG4gICAgICAgIFdhcm5pbmcsXG4gICAgICAgIEVycm9yLFxuICAgICAgICBEZWJ1ZyxcbiAgICB9XG5cbiAgICBleHBvcnQgZW51bSBDb252ZXJ0ZXJFcnJvciB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnbFRmIHJlcXVpcmVzIHRoYXQgc2tpbiBqb2ludHMgbXVzdCBleGlzdHMgaW4gc2FtZSBzY2VuZSBhcyBub2RlIHJlZmVyZW5jZXMgaXQuXG4gICAgICAgICAqL1xuICAgICAgICBSZWZlcmVuY2VTa2luSW5EaWZmZXJlbnRTY2VuZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVkIGFscGhhIG1vZGUgaXMgbm90IHN1cHBvcnRlZCBjdXJyZW50bHkuXG4gICAgICAgICAqL1xuICAgICAgICBVbnN1cHBvcnRlZEFscGhhTW9kZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5zdXBwb3J0ZWQgdGV4dHVyZSBwYXJhbWV0ZXIuXG4gICAgICAgICAqL1xuICAgICAgICBVbnN1cHBvcnRlZFRleHR1cmVQYXJhbWV0ZXIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVuc3VwcG9ydGVkIGNoYW5uZWwgcGF0aC5cbiAgICAgICAgICovXG4gICAgICAgIFVuc3VwcG9ydGVkQ2hhbm5lbFBhdGgsXG5cbiAgICAgICAgRGlzYWxsb3dDdWJpY1NwbGluZUNoYW5uZWxTcGxpdCxcblxuICAgICAgICBGYWlsZWRUb0NhbGN1bGF0ZVRhbmdlbnRzLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGwgdGFyZ2V0cyBvZiB0aGUgc3BlY2lmaWVkIHN1Yi1tZXNoIGFyZSB6ZXJvLWRpc3BsYWNlZC5cbiAgICAgICAgICovXG4gICAgICAgIEVtcHR5TW9ycGgsXG5cbiAgICAgICAgVW5zdXBwb3J0ZWRFeHRlbnNpb24sXG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBDb252ZXJ0ZXJFcnJvckFyZ3VtZW50Rm9ybWF0IHtcbiAgICAgICAgW0NvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkRXh0ZW5zaW9uXToge1xuICAgICAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgcmVxdWlyZWQ/OiBib29sZWFuO1xuICAgICAgICB9O1xuXG4gICAgICAgIFtDb252ZXJ0ZXJFcnJvci5SZWZlcmVuY2VTa2luSW5EaWZmZXJlbnRTY2VuZV06IHtcbiAgICAgICAgICAgIHNraW46IG51bWJlcjtcbiAgICAgICAgICAgIG5vZGU6IG51bWJlcjtcbiAgICAgICAgfTtcblxuICAgICAgICBbQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRBbHBoYU1vZGVdOiB7XG4gICAgICAgICAgICBtb2RlOiBzdHJpbmc7XG4gICAgICAgICAgICBtYXRlcmlhbDogbnVtYmVyO1xuICAgICAgICB9O1xuXG4gICAgICAgIFtDb252ZXJ0ZXJFcnJvci5VbnN1cHBvcnRlZFRleHR1cmVQYXJhbWV0ZXJdOiB7XG4gICAgICAgICAgICB0eXBlOiAnbWluRmlsdGVyJyB8ICdtYWdGaWx0ZXInIHwgJ3dyYXBNb2RlJztcbiAgICAgICAgICAgIHZhbHVlOiBudW1iZXI7XG4gICAgICAgICAgICBmYWxsYmFjaz86IG51bWJlcjtcbiAgICAgICAgICAgIHRleHR1cmU6IG51bWJlcjtcbiAgICAgICAgICAgIHNhbXBsZXI6IG51bWJlcjtcbiAgICAgICAgfTtcblxuICAgICAgICBbQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRDaGFubmVsUGF0aF06IHtcbiAgICAgICAgICAgIGNoYW5uZWw6IG51bWJlcjtcbiAgICAgICAgICAgIGFuaW1hdGlvbjogbnVtYmVyO1xuICAgICAgICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgIFtDb252ZXJ0ZXJFcnJvci5EaXNhbGxvd0N1YmljU3BsaW5lQ2hhbm5lbFNwbGl0XToge1xuICAgICAgICAgICAgY2hhbm5lbDogbnVtYmVyO1xuICAgICAgICAgICAgYW5pbWF0aW9uOiBudW1iZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgW0NvbnZlcnRlckVycm9yLkZhaWxlZFRvQ2FsY3VsYXRlVGFuZ2VudHNdOiB7XG4gICAgICAgICAgICByZWFzb246ICdub3JtYWwnIHwgJ3V2JztcbiAgICAgICAgICAgIHByaW1pdGl2ZTogbnVtYmVyO1xuICAgICAgICAgICAgbWVzaDogbnVtYmVyO1xuICAgICAgICB9O1xuXG4gICAgICAgIFtDb252ZXJ0ZXJFcnJvci5FbXB0eU1vcnBoXToge1xuICAgICAgICAgICAgbWVzaDogbnVtYmVyO1xuICAgICAgICAgICAgcHJpbWl0aXZlOiBudW1iZXI7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgUGFyc2VkQW5kQnVmZmVyUmVzb2x2ZWRHbFRmIHtcbiAgICAvKipcbiAgICAgKiBUaGUgcGFyc2VkIGdsVEYgZG9jdW1lbnQuXG4gICAgICovXG4gICAgZ2xURjogR2xUZjtcblxuICAgIC8qKlxuICAgICAqIEJ1ZmZlcnMgb2YgdGhpcyBnbFRGIHJlZmVyZW5jZWQuXG4gICAgICovXG4gICAgYnVmZmVyczogUmVzb2x2ZWRCdWZmZXJbXTtcbn1cblxuLyoqXG4gKiBFaXRoZXIgYnVmZmVyIGl0c2VsZiBvciBmdWxsIHBhdGggdG8gZXh0ZXJuYWwgYnVmZmVyIGZpbGUuXG4gKi9cbnR5cGUgUmVzb2x2ZWRCdWZmZXIgPSBzdHJpbmcgfCBCdWZmZXI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkR2x0ZihnbHRmRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8UGFyc2VkQW5kQnVmZmVyUmVzb2x2ZWRHbFRmPiB7XG4gICAgcmV0dXJuIHBhdGguZXh0bmFtZShnbHRmRmlsZVBhdGgpID09PSAnLmdsYicgPyBhd2FpdCByZWFkR2xiKGdsdGZGaWxlUGF0aCkgOiBhd2FpdCByZWFkR2x0Zkpzb24oZ2x0ZkZpbGVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZEdsdGZKc29uKHBhdGg6IHN0cmluZyk6IFByb21pc2U8UGFyc2VkQW5kQnVmZmVyUmVzb2x2ZWRHbFRmPiB7XG4gICAgY29uc3QgZ2xURiA9IChhd2FpdCBmcy5yZWFkSlNPTihwYXRoKSkgYXMgR2xUZjtcbiAgICBjb25zdCByZXNvbHZlZEJ1ZmZlcnMgPSAhZ2xURi5idWZmZXJzXG4gICAgICAgID8gW11cbiAgICAgICAgOiBnbFRGLmJ1ZmZlcnMubWFwKChnbFRGQnVmZmVyOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChnbFRGQnVmZmVyLnVyaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQnVmZmVyVXJpKHBhdGgsIGdsVEZCdWZmZXIudXJpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgcmV0dXJuIHsgZ2xURiwgYnVmZmVyczogcmVzb2x2ZWRCdWZmZXJzIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRHbGIocGF0aDogc3RyaW5nKTogUHJvbWlzZTxQYXJzZWRBbmRCdWZmZXJSZXNvbHZlZEdsVGY+IHtcbiAgICBjb25zdCBiYWRHTEJGb3JtYXQgPSAoKTogbmV2ZXIgPT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBnbGIgZm9ybWF0LicpO1xuICAgIH07XG5cbiAgICBjb25zdCBnbGIgPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoKTtcbiAgICBpZiAoZ2xiLmxlbmd0aCA8IDEyKSB7XG4gICAgICAgIHJldHVybiBiYWRHTEJGb3JtYXQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYWdpYyA9IGdsYi5yZWFkVUludDMyTEUoMCk7XG4gICAgaWYgKG1hZ2ljICE9PSAweDQ2NTQ2YzY3KSB7XG4gICAgICAgIHJldHVybiBiYWRHTEJGb3JtYXQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBDaHVua1R5cGVKc29uID0gMHg0ZTRmNTM0YTtcbiAgICBjb25zdCBDaHVua1R5cGVCaW4gPSAweDAwNGU0OTQyO1xuICAgIGNvbnN0IHZlcnNpb24gPSBnbGIucmVhZFVJbnQzMkxFKDQpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGdsYi5yZWFkVUludDMyTEUoOCk7XG4gICAgbGV0IGdsVEY6IEdsVGYgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGVtYmVkZGVkQmluYXJ5QnVmZmVyOiBCdWZmZXIgfCB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaUNodW5rID0gMCwgb2Zmc2V0ID0gMTI7IG9mZnNldCArIDggPD0gZ2xiLmxlbmd0aDsgKytpQ2h1bmspIHtcbiAgICAgICAgY29uc3QgY2h1bmtMZW5ndGggPSBnbGIucmVhZFVJbnQzMkxFKG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSA0O1xuICAgICAgICBjb25zdCBjaHVua1R5cGUgPSBnbGIucmVhZFVJbnQzMkxFKG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSA0O1xuICAgICAgICBpZiAob2Zmc2V0ICsgY2h1bmtMZW5ndGggPiBnbGIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gYmFkR0xCRm9ybWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IEJ1ZmZlci5mcm9tKGdsYi5idWZmZXIsIG9mZnNldCwgY2h1bmtMZW5ndGgpO1xuICAgICAgICBvZmZzZXQgKz0gY2h1bmtMZW5ndGg7XG4gICAgICAgIGlmIChpQ2h1bmsgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChjaHVua1R5cGUgIT09IENodW5rVHlwZUpzb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYmFkR0xCRm9ybWF0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBnbFRGSnNvbiA9IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKS5kZWNvZGUocGF5bG9hZCk7XG4gICAgICAgICAgICBnbFRGID0gSlNPTi5wYXJzZShnbFRGSnNvbikgYXMgR2xUZjtcbiAgICAgICAgfSBlbHNlIGlmIChjaHVua1R5cGUgPT09IENodW5rVHlwZUJpbikge1xuICAgICAgICAgICAgLy8gVE9ETzogU2hvdWxkIHdlIGNvcHk/XG4gICAgICAgICAgICAvLyBlbWJlZGRlZEJpbmFyeUJ1ZmZlciA9IHBheWxvYWQuc2xpY2UoKTtcbiAgICAgICAgICAgIGVtYmVkZGVkQmluYXJ5QnVmZmVyID0gcGF5bG9hZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghZ2xURikge1xuICAgICAgICByZXR1cm4gYmFkR0xCRm9ybWF0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRCdWZmZXJzID0gIWdsVEYuYnVmZmVyc1xuICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgOiBnbFRGLmJ1ZmZlcnMubWFwKChnbFRGQnVmZmVyOiBhbnksIGdsVEZCdWZmZXJJbmRleDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGdsVEZCdWZmZXIudXJpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQnVmZmVyVXJpKHBhdGgsIGdsVEZCdWZmZXIudXJpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGdsVEZCdWZmZXJJbmRleCA9PT0gMCAmJiBlbWJlZGRlZEJpbmFyeUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW1iZWRkZWRCaW5hcnlCdWZmZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHsgZ2xURiwgYnVmZmVyczogcmVzb2x2ZWRCdWZmZXJzIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlQnVmZmVyVXJpKGdsVEZGaWxlUGF0aDogc3RyaW5nLCB1cmk6IHN0cmluZyk6IFJlc29sdmVkQnVmZmVyIHtcbiAgICBjb25zdCBkYXRhVVJJID0gRGF0YVVSSS5wYXJzZSh1cmkpO1xuICAgIGlmICghZGF0YVVSSSkge1xuICAgICAgICBjb25zdCBidWZmZXJQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShnbFRGRmlsZVBhdGgpLCB1cmkpO1xuICAgICAgICByZXR1cm4gYnVmZmVyUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20ocmVzb2x2ZUJ1ZmZlckRhdGFVUkkoZGF0YVVSSSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGF0YVVyaSh1cmk6IHN0cmluZykge1xuICAgIHJldHVybiB1cmkuc3RhcnRzV2l0aCgnZGF0YTonKTtcbn1cblxuZXhwb3J0IGNsYXNzIEJ1ZmZlckJsb2Ige1xuICAgIHByaXZhdGUgX2FycmF5QnVmZmVyT3JQYWRkaW5nczogKFVpbnQ4QXJyYXkgfCBBcnJheUJ1ZmZlciB8IG51bWJlcilbXSA9IFtdO1xuICAgIHByaXZhdGUgX2xlbmd0aCA9IDA7XG5cbiAgICBwdWJsaWMgc2V0TmV4dEFsaWdubWVudChhbGlnbjogbnVtYmVyKSB7XG4gICAgICAgIGlmIChhbGlnbiAhPT0gMCkge1xuICAgICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gdGhpcy5fbGVuZ3RoICUgYWxpZ247XG4gICAgICAgICAgICBpZiAocmVtYWluZGVyICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFkZGluZyA9IGFsaWduIC0gcmVtYWluZGVyO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FycmF5QnVmZmVyT3JQYWRkaW5ncy5wdXNoKHBhZGRpbmcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xlbmd0aCArPSBwYWRkaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFkZEJ1ZmZlcihhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIgfCBVaW50OEFycmF5KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2xlbmd0aDtcbiAgICAgICAgdGhpcy5fYXJyYXlCdWZmZXJPclBhZGRpbmdzLnB1c2goYXJyYXlCdWZmZXIpO1xuICAgICAgICB0aGlzLl9sZW5ndGggKz0gYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TGVuZ3RoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDb21iaW5lZCgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5fbGVuZ3RoKTtcbiAgICAgICAgbGV0IGNvdW50ZXIgPSAwO1xuICAgICAgICB0aGlzLl9hcnJheUJ1ZmZlck9yUGFkZGluZ3MuZm9yRWFjaCgoYXJyYXlCdWZmZXJPclBhZGRpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJyYXlCdWZmZXJPclBhZGRpbmcgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgY291bnRlciArPSBhcnJheUJ1ZmZlck9yUGFkZGluZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnNldChuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlck9yUGFkZGluZyksIGNvdW50ZXIpO1xuICAgICAgICAgICAgICAgIGNvdW50ZXIgKz0gYXJyYXlCdWZmZXJPclBhZGRpbmcuYnl0ZUxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVEYXRhVmlld0Zyb21CdWZmZXIoYnVmZmVyOiBCdWZmZXIsIG9mZnNldCA9IDApIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KGJ1ZmZlci5idWZmZXIsIGJ1ZmZlci5ieXRlT2Zmc2V0ICsgb2Zmc2V0KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGF0YVZpZXdGcm9tVHlwZWRBcnJheSh0eXBlZEFycmF5OiBBcnJheUJ1ZmZlclZpZXcsIG9mZnNldCA9IDApIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KHR5cGVkQXJyYXkuYnVmZmVyLCB0eXBlZEFycmF5LmJ5dGVPZmZzZXQgKyBvZmZzZXQpO1xufVxuXG5jb25zdCBEYXRhVmlld1VzZUxpdHRsZUVuZGlhbiA9IHRydWU7XG5cbnR5cGUgVW5pcXVlTmFtZUdlbmVyYXRvciA9IChvcmlnaW5hbDogc3RyaW5nIHwgbnVsbCwgbGFzdDogc3RyaW5nIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgY291bnQ6IG51bWJlcikgPT4gc3RyaW5nO1xuXG5mdW5jdGlvbiB1bmlxdWVDaGlsZE5vZGVOYW1lR2VuZXJhdG9yKG9yaWdpbmFsOiBzdHJpbmcgfCBudWxsLCBsYXN0OiBzdHJpbmcgfCBudWxsLCBpbmRleDogbnVtYmVyLCBjb3VudDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBwb3N0Zml4ID0gY291bnQgPT09IDAgPyAnJyA6IGAtJHtjb3VudH1gO1xuICAgIHJldHVybiBgJHtvcmlnaW5hbCB8fCAnJ30oX19hdXRvZ2VuICR7aW5kZXh9JHtwb3N0Zml4fSlgO1xufVxuXG5mdW5jdGlvbiBtYWtlVW5pcXVlTmFtZXMobmFtZXM6IChzdHJpbmcgfCBudWxsKVtdLCBnZW5lcmF0b3I6IFVuaXF1ZU5hbWVHZW5lcmF0b3IpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgdW5pcXVlTmFtZXMgPSBuZXcgQXJyYXkobmFtZXMubGVuZ3RoKS5maWxsKCcnKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGxldCBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGxldCBjb3VudCA9IDA7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVW5pcXVlID0gKCkgPT5cbiAgICAgICAgICAgICAgICB1bmlxdWVOYW1lcy5ldmVyeSgodW5pcXVlTmFtZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ID09PSBpIHx8IG5hbWUgIT09IHVuaXF1ZU5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCAhaXNVbmlxdWUoKSkge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBnZW5lcmF0b3IobmFtZXNbaV0sIG5hbWUsIGksIGNvdW50KyspO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmlxdWVOYW1lc1tpXSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuaXF1ZU5hbWVzO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQnVmZmVyRGF0YVVSSSh1cmk6IERhdGFVUkkuRGF0YVVSSSk6IEFycmF5QnVmZmVyIHtcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvaXNzdWVzLzk0NFxuICAgIGlmIChcbiAgICAgICAgIXVyaS5iYXNlNjQgfHxcbiAgICAgICAgIXVyaS5tZWRpYVR5cGUgfHxcbiAgICAgICAgISh1cmkubWVkaWFUeXBlLnZhbHVlID09PSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyB8fCB1cmkubWVkaWFUeXBlLnZhbHVlID09PSAnYXBwbGljYXRpb24vZ2x0Zi1idWZmZXInKVxuICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCB1bmRlcnN0YW5kIGRhdGEgdXJpKGJhc2U2NDogJHt1cmkuYmFzZTY0fSwgbWVkaWFUeXBlOiAke3VyaS5tZWRpYVR5cGV9KSBmb3IgYnVmZmVyLmApO1xuICAgIH1cbiAgICByZXR1cm4gZGVjb2RlQmFzZTY0VG9BcnJheUJ1ZmZlcih1cmkuZGF0YSk7XG59XG5cbmNsYXNzIER5bmFtaWNBcnJheUJ1ZmZlciB7XG4gICAgZ2V0IGFycmF5QnVmZmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXJyYXlCdWZmZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2l6ZSA9IDA7XG4gICAgcHJpdmF0ZSBfYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyO1xuICAgIGNvbnN0cnVjdG9yKHJlc2VydmU/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoTWF0aC5tYXgocmVzZXJ2ZSB8fCAwLCA0KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdyb3coZ3Jvd1NpemU6IG51bWJlcikge1xuICAgICAgICBjb25zdCBzekJlZm9yZUdyb3cgPSB0aGlzLl9zaXplO1xuICAgICAgICBpZiAoZ3Jvd1NpemUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhcCA9IHRoaXMuX2FycmF5QnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBzcGFjZSA9IGNhcCAtIHN6QmVmb3JlR3JvdztcbiAgICAgICAgICAgIGNvbnN0IHJlcSA9IHNwYWNlIC0gZ3Jvd1NpemU7XG4gICAgICAgICAgICBpZiAocmVxIDwgMCkge1xuICAgICAgICAgICAgICAgIC8vIGFzc2VydChjYXAgPj0gNClcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdDYXAgPSAoY2FwICsgLXJlcSkgKiAxLjU7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3QXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIobmV3Q2FwKTtcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShuZXdBcnJheUJ1ZmZlciwgMCwgY2FwKS5zZXQobmV3IFVpbnQ4QXJyYXkodGhpcy5fYXJyYXlCdWZmZXIpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJheUJ1ZmZlciA9IG5ld0FycmF5QnVmZmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2l6ZSArPSBncm93U2l6ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3pCZWZvcmVHcm93O1xuICAgIH1cblxuICAgIHB1YmxpYyBzaHJpbmsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hcnJheUJ1ZmZlci5zbGljZSgwLCB0aGlzLl9zaXplKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERhdGF2aWV3V3JpdHRlck9mVHlwZWRBcnJheSh0eXBlZEFycmF5OiBQUEdlb21ldHJ5VHlwZWRBcnJheSwgbGl0dGxlRW5kaWFuPzogYm9vbGVhbikge1xuICAgIHN3aXRjaCAodHlwZWRBcnJheS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICBjYXNlIEludDhBcnJheTpcbiAgICAgICAgICAgIHJldHVybiAoZGF0YVZpZXc6IERhdGFWaWV3LCBieXRlT2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IGRhdGFWaWV3LnNldEludDgoYnl0ZU9mZnNldCwgdmFsdWUpO1xuICAgICAgICBjYXNlIFVpbnQ4QXJyYXk6XG4gICAgICAgICAgICByZXR1cm4gKGRhdGFWaWV3OiBEYXRhVmlldywgYnl0ZU9mZnNldDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBkYXRhVmlldy5zZXRVaW50OChieXRlT2Zmc2V0LCB2YWx1ZSk7XG4gICAgICAgIGNhc2UgSW50MTZBcnJheTpcbiAgICAgICAgICAgIHJldHVybiAoZGF0YVZpZXc6IERhdGFWaWV3LCBieXRlT2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IGRhdGFWaWV3LnNldEludDE2KGJ5dGVPZmZzZXQsIHZhbHVlLCBsaXR0bGVFbmRpYW4pO1xuICAgICAgICBjYXNlIFVpbnQxNkFycmF5OlxuICAgICAgICAgICAgcmV0dXJuIChkYXRhVmlldzogRGF0YVZpZXcsIGJ5dGVPZmZzZXQ6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gZGF0YVZpZXcuc2V0VWludDE2KGJ5dGVPZmZzZXQsIHZhbHVlLCBsaXR0bGVFbmRpYW4pO1xuICAgICAgICBjYXNlIEludDMyQXJyYXk6XG4gICAgICAgICAgICByZXR1cm4gKGRhdGFWaWV3OiBEYXRhVmlldywgYnl0ZU9mZnNldDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBkYXRhVmlldy5zZXRJbnQzMihieXRlT2Zmc2V0LCB2YWx1ZSwgbGl0dGxlRW5kaWFuKTtcbiAgICAgICAgY2FzZSBVaW50MzJBcnJheTpcbiAgICAgICAgICAgIHJldHVybiAoZGF0YVZpZXc6IERhdGFWaWV3LCBieXRlT2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IGRhdGFWaWV3LnNldFVpbnQzMihieXRlT2Zmc2V0LCB2YWx1ZSwgbGl0dGxlRW5kaWFuKTtcbiAgICAgICAgY2FzZSBGbG9hdDMyQXJyYXk6XG4gICAgICAgICAgICByZXR1cm4gKGRhdGFWaWV3OiBEYXRhVmlldywgYnl0ZU9mZnNldDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBkYXRhVmlldy5zZXRGbG9hdDMyKGJ5dGVPZmZzZXQsIHZhbHVlLCBsaXR0bGVFbmRpYW4pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgc3RvcmFnZSBjb25zdHJ1Y3Rvci4nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVybGVhdmVWZXJ0aWNlcyhwcEdlb21ldHJ5OiBQUEdlb21ldHJ5LCBiR2VuZXJhdGVVViA9IGZhbHNlLCBiQWRkVmVydGV4Q29sb3IgPSBmYWxzZSkge1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gcHBHZW9tZXRyeS52ZXJ0ZXhDb3VudDtcbiAgICBsZXQgaGFzVVYxID0gZmFsc2U7XG4gICAgbGV0IGhhc0NvbG9yID0gZmFsc2U7XG4gICAgY29uc3QgdmFsaWRBdHRyaWJ1dGVzOiBBcnJheTxbc3RyaW5nLCBQUEdlb21ldHJ5LkF0dHJpYnV0ZV0+ID0gW107XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgcHBHZW9tZXRyeS5hdHRyaWJ1dGVzKCkpIHtcbiAgICAgICAgbGV0IGdmeEF0dHJpYnV0ZU5hbWU6IHN0cmluZztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdmeEF0dHJpYnV0ZU5hbWUgPSBnZXRHZnhBdHRyaWJ1dGVOYW1lKGF0dHJpYnV0ZSk7XG4gICAgICAgICAgICBpZiAoZ2Z4QXR0cmlidXRlTmFtZSA9PT0gZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9URVhfQ09PUkQxKSB7XG4gICAgICAgICAgICAgICAgaGFzVVYxID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnZnhBdHRyaWJ1dGVOYW1lID09PSBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0NPTE9SKSB7XG4gICAgICAgICAgICAgICAgaGFzQ29sb3IgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhbGlkQXR0cmlidXRlcy5wdXNoKFtnZnhBdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVdKTtcbiAgICB9XG5cbiAgICBpZiAoYkFkZFZlcnRleENvbG9yICYmICFoYXNDb2xvcikge1xuICAgICAgICBjb25zdCBmaWxsQ29sb3IgPSBuZXcgVmVjNCgxLCAxLCAxLCAxKTtcbiAgICAgICAgY29uc3QgY29sb3JEYXRhID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIDQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleENvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGNvbG9yRGF0YVtpICogNCArIDBdID0gZmlsbENvbG9yLng7XG4gICAgICAgICAgICBjb2xvckRhdGFbaSAqIDQgKyAxXSA9IGZpbGxDb2xvci55O1xuICAgICAgICAgICAgY29sb3JEYXRhW2kgKiA0ICsgMl0gPSBmaWxsQ29sb3IuejtcbiAgICAgICAgICAgIGNvbG9yRGF0YVtpICogNCArIDNdID0gZmlsbENvbG9yLnc7XG4gICAgICAgIH1cbiAgICAgICAgdmFsaWRBdHRyaWJ1dGVzLnB1c2goWydhX2NvbG9yJywgbmV3IFBQR2VvbWV0cnkuQXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmNvbG9yLCBjb2xvckRhdGEsIDQpXSk7XG4gICAgfVxuICAgIGlmIChiR2VuZXJhdGVVViAmJiAhaGFzVVYxKSB7XG4gICAgICAgIHZhbGlkQXR0cmlidXRlcy5wdXNoKFtcbiAgICAgICAgICAgICdhX3RleENvb3JkMScsXG4gICAgICAgICAgICBuZXcgUFBHZW9tZXRyeS5BdHRyaWJ1dGUoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MudGV4Y29vcmQsIG5ldyBGbG9hdDMyQXJyYXkodmVydGV4Q291bnQgKiAyKSwgMiksXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBsZXQgdmVydGV4U3RyaWRlID0gMDtcbiAgICBmb3IgKGNvbnN0IFtfLCBhdHRyaWJ1dGVdIG9mIHZhbGlkQXR0cmlidXRlcykge1xuICAgICAgICB2ZXJ0ZXhTdHJpZGUgKz0gYXR0cmlidXRlLmRhdGEuQllURVNfUEVSX0VMRU1FTlQgKiBhdHRyaWJ1dGUuY29tcG9uZW50cztcbiAgICB9XG4gICAgY29uc3QgdmVydGV4QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHZlcnRleENvdW50ICogdmVydGV4U3RyaWRlKTtcbiAgICBjb25zdCB2ZXJ0ZXhCdWZmZXJWaWV3ID0gbmV3IERhdGFWaWV3KHZlcnRleEJ1ZmZlcik7XG4gICAgbGV0IGN1cnJlbnRCeXRlT2Zmc2V0ID0gMDtcbiAgICBjb25zdCBmb3JtYXRzOiBhbnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2dmeEF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZV0gb2YgdmFsaWRBdHRyaWJ1dGVzKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZURhdGEgPSBhdHRyaWJ1dGUuZGF0YTtcbiAgICAgICAgY29uc3QgZGF0YXZpZXdXcml0dGVyID0gZ2V0RGF0YXZpZXdXcml0dGVyT2ZUeXBlZEFycmF5KGF0dHJpYnV0ZURhdGEsIERhdGFWaWV3VXNlTGl0dGxlRW5kaWFuKTtcbiAgICAgICAgZm9yIChsZXQgaVZlcnRleCA9IDA7IGlWZXJ0ZXggPCB2ZXJ0ZXhDb3VudDsgKytpVmVydGV4KSB7XG4gICAgICAgICAgICBjb25zdCBvZmZzZXQxID0gY3VycmVudEJ5dGVPZmZzZXQgKyB2ZXJ0ZXhTdHJpZGUgKiBpVmVydGV4O1xuICAgICAgICAgICAgZm9yIChsZXQgaUNvbXBvbmVudCA9IDA7IGlDb21wb25lbnQgPCBhdHRyaWJ1dGUuY29tcG9uZW50czsgKytpQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVEYXRhW2F0dHJpYnV0ZS5jb21wb25lbnRzICogaVZlcnRleCArIGlDb21wb25lbnRdO1xuICAgICAgICAgICAgICAgIGRhdGF2aWV3V3JpdHRlcih2ZXJ0ZXhCdWZmZXJWaWV3LCBvZmZzZXQxICsgYXR0cmlidXRlRGF0YS5CWVRFU19QRVJfRUxFTUVOVCAqIGlDb21wb25lbnQsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50Qnl0ZU9mZnNldCArPSBhdHRyaWJ1dGUuZGF0YS5CWVRFU19QRVJfRUxFTUVOVCAqIGF0dHJpYnV0ZS5jb21wb25lbnRzO1xuICAgICAgICBmb3JtYXRzLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogZ2Z4QXR0cmlidXRlTmFtZSxcbiAgICAgICAgICAgIGZvcm1hdDogYXR0cmlidXRlLmdldEdGWEZvcm1hdCgpLFxuICAgICAgICAgICAgaXNOb3JtYWxpemVkOiBhdHRyaWJ1dGUuaXNOb3JtYWxpemVkLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJ0ZXhDb3VudCxcbiAgICAgICAgdmVydGV4U3RyaWRlLFxuICAgICAgICBmb3JtYXRzLFxuICAgICAgICB2ZXJ0ZXhCdWZmZXIsXG4gICAgfTtcbn1cblxuY29uc3QgZ2xURkF0dHJpYnV0ZU5hbWVUb1BQID0gKCgpID0+IHtcbiAgICByZXR1cm4gKGF0dHJpYnV0ZU5hbWU6IHN0cmluZyk6IFBQR2VvbWV0cnkuU2VtYW50aWMgPT4ge1xuICAgICAgICBpZiAoYXR0cmlidXRlTmFtZS5zdGFydHNXaXRoKCdfJykpIHtcbiAgICAgICAgICAgIC8vIEFwcGxpY2F0aW9uLXNwZWNpZmljIHNlbWFudGljcyBtdXN0IHN0YXJ0IHdpdGggYW4gdW5kZXJzY29yZVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZU5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lUmVnZXhNYXRjaGVzID0gLyhbYS16QS1aXSspKD86XyhcXGQrKSk/L2cuZXhlYyhhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgaWYgKCFhdHRyaWJ1dGVOYW1lUmVnZXhNYXRjaGVzKSB7XG4gICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlTmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZUJhc2VOYW1lID0gYXR0cmlidXRlTmFtZVJlZ2V4TWF0Y2hlc1sxXTtcbiAgICAgICAgbGV0IHN0ZFNlbWFudGljOiBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcyB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3Qgc2V0ID0gcGFyc2VJbnQoYXR0cmlidXRlTmFtZVJlZ2V4TWF0Y2hlc1syXSB8fCAnMCcpO1xuICAgICAgICBzd2l0Y2ggKGF0dHJpYnV0ZUJhc2VOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdQT1NJVElPTic6XG4gICAgICAgICAgICAgICAgc3RkU2VtYW50aWMgPSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ05PUk1BTCc6XG4gICAgICAgICAgICAgICAgc3RkU2VtYW50aWMgPSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5ub3JtYWw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdUQU5HRU5UJzpcbiAgICAgICAgICAgICAgICBzdGRTZW1hbnRpYyA9IFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnRhbmdlbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdDT0xPUic6XG4gICAgICAgICAgICAgICAgc3RkU2VtYW50aWMgPSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5jb2xvcjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1RFWENPT1JEJzpcbiAgICAgICAgICAgICAgICBzdGRTZW1hbnRpYyA9IFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnRleGNvb3JkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnSk9JTlRTJzpcbiAgICAgICAgICAgICAgICBzdGRTZW1hbnRpYyA9IFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmpvaW50cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1dFSUdIVFMnOlxuICAgICAgICAgICAgICAgIHN0ZFNlbWFudGljID0gUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Mud2VpZ2h0cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGRTZW1hbnRpYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlTmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5zZXQoc3RkU2VtYW50aWMsIHNldCk7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxuZXhwb3J0IGNsYXNzIEdsVGZDb25mb3JtYW5jZUVycm9yIGV4dGVuZHMgRXJyb3IgeyB9XG5cbmZ1bmN0aW9uIGFzc2VydEdsVEZDb25mb3JtYW5jZShleHByOiBib29sZWFuLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBpZiAoIWV4cHIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEdsVGZDb25mb3JtYW5jZUVycm9yKGBnbFRGIG5vbi1jb25mb3JtYW5jZSBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgIH1cbn1cbiJdfQ==