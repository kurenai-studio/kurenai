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
