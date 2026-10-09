"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeMesh = optimizeMesh;
exports.clusterizeMesh = clusterizeMesh;
exports.getDefaultSimplifyOptions = getDefaultSimplifyOptions;
exports.simplifyMesh = simplifyMesh;
exports.compressMesh = compressMesh;
exports.encodeMesh = encodeMesh;
exports.quantizeMesh = quantizeMesh;
exports.deflateMesh = deflateMesh;
const cc_1 = require("cc");
const meshopt_encoder_1 = __importDefault(require("meshopt_encoder"));
const zlib_1 = __importDefault(require("zlib"));
const gltf_converter_1 = require("../utils/gltf-converter");
let inited = false;
async function tryInitMeshOpt() {
    if (!inited) {
        return meshopt_encoder_1.default.init().then(() => {
            console.log('MeshOpt init success');
            inited = true;
        });
    }
    else {
        return Promise.resolve();
    }
}
function getOffset(attributes, attributeIndex) {
    let result = 0;
    for (let i = 0; i < attributeIndex; ++i) {
        const attribute = attributes[i];
        result += cc_1.gfx.FormatInfos[attribute.format].size;
    }
    return result;
}
const overdrawThreshold = 3.0;
async function optimizeMesh(mesh, options) {
    await tryInitMeshOpt();
    if (!options) {
        return mesh;
    }
    if (!(options.overdraw || options.vertexCache || options.vertexFetch)) {
        console.warn('No optimization option is enabled, return the original mesh');
        return mesh;
    }
    const bufferBlob = new gltf_converter_1.BufferBlob();
    bufferBlob.setNextAlignment(0);
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    for (let i = 0; i < struct.primitives.length; ++i) {
        const primitive = struct.primitives[i];
        if (primitive.primitiveMode === cc_1.gfx.PrimitiveMode.POINT_LIST || primitive.indexView === undefined) {
            console.warn('Only triangle list is supported.');
            // no need to optimize point list, or un-indexed mesh, just dump
            // * generate index buffer for un-indexed mesh, maybe later
            for (let j = 0; j < primitive.vertexBundelIndices.length; ++j) {
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[j]];
                const view = bundle.view;
                const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                bufferBlob.setNextAlignment(view.stride);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: buffer.byteLength,
                    count: view.count,
                    stride: view.stride,
                };
                bundle.view = newView;
                bufferBlob.addBuffer(buffer);
            }
            continue;
        }
        // find vertex bundle with position attribute
        const indexView = primitive.indexView;
        const vertexCount = struct.vertexBundles[primitive.vertexBundelIndices[0]].view.count;
        const newIndex = new Uint8Array(indexView.count * Uint32Array.BYTES_PER_ELEMENT);
        // convert index to 32bit
        if (indexView.stride === 2) {
            const indexBuffer16 = new Uint16Array(mesh.data.buffer, indexView.offset, indexView.count);
            const indexBuffer32 = new Uint32Array(newIndex.buffer, 0, indexView.count);
            for (let j = 0; j < indexView.count; ++j) {
                indexBuffer32[j] = indexBuffer16[j];
            }
        }
        else if (indexView.stride === 4) {
            newIndex.set(new Uint8Array(mesh.data.buffer, indexView.offset, indexView.count * Uint32Array.BYTES_PER_ELEMENT));
        }
        if (options.vertexCache) {
            meshopt_encoder_1.default.optimizer.optimizeVertexCache(newIndex, newIndex, indexView.count, vertexCount);
        }
        if (options.overdraw) {
            const positionBundleIndex = primitive.vertexBundelIndices.findIndex((bundleIndex) => {
                const bundle = struct.vertexBundles[bundleIndex];
                const attributes = bundle.attributes;
                const posIndex = attributes.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
                return posIndex >= 0;
            });
            if (positionBundleIndex < 0) {
                console.warn('No position attribute found, overdraw optimization is not supported.');
            }
            else {
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[positionBundleIndex]];
                const view = bundle.view;
                const attributes = bundle.attributes;
                const posIndex = attributes.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
                const positionOffset = getOffset(attributes, posIndex);
                const vertexBuffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                meshopt_encoder_1.default.optimizer.optimizeOverdraw(newIndex, newIndex, indexView.count, vertexBuffer.subarray(positionOffset), vertexCount, view.stride, overdrawThreshold);
            }
        }
        const needOptimizeFetch = options.vertexCache || options.overdraw || options.vertexFetch;
        if (!needOptimizeFetch) {
            if (primitive.vertexBundelIndices.length === 1) {
                // simple optimization
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[0]];
                const view = bundle.view;
                const vertexBuffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                const newBuffer = new Uint8Array(view.count * view.stride);
                meshopt_encoder_1.default.optimizer.optimizeVertexFetch(newBuffer, newIndex, indexView.count, vertexBuffer, view.count, view.stride);
                bufferBlob.setNextAlignment(view.stride);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: newBuffer.byteLength,
                    count: view.count,
                    stride: view.stride,
                };
                bundle.view = newView;
                bufferBlob.addBuffer(newBuffer);
            }
            else if (primitive.vertexBundelIndices.length > 1) {
                const remapBuffer = new ArrayBuffer(indexView.count * Uint32Array.BYTES_PER_ELEMENT);
                const totalVertex = meshopt_encoder_1.default.optimizer.optimizeVertexFetchRemap(remapBuffer, newIndex, indexView.count, vertexCount);
                meshopt_encoder_1.default.optimizer.optimizeRemapIndex(newIndex, newIndex, indexView.count, remapBuffer);
                for (let j = 0; j < primitive.vertexBundelIndices.length; ++j) {
                    const bundle = struct.vertexBundles[primitive.vertexBundelIndices[j]];
                    const view = bundle.view;
                    const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                    const newBuffer = new Uint8Array(totalVertex * view.stride);
                    meshopt_encoder_1.default.optimizer.optimizeRemapVertex(newBuffer, buffer, totalVertex, view.stride, remapBuffer);
                    bufferBlob.setNextAlignment(view.stride);
                    const newView = {
                        offset: bufferBlob.getLength(),
                        length: newBuffer.byteLength,
                        count: totalVertex,
                        stride: view.stride,
                    };
                    bundle.view = newView;
                    bufferBlob.addBuffer(newBuffer);
                }
            }
        }
        else {
            // dump vertex buffer, leave un-optimized
            for (let j = 0; j < primitive.vertexBundelIndices.length; ++j) {
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[j]];
                const view = bundle.view;
                const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                bufferBlob.setNextAlignment(view.stride);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: buffer.byteLength,
                    count: view.count,
                    stride: view.stride,
                };
                bundle.view = newView;
                bufferBlob.addBuffer(buffer);
            }
        }
        bufferBlob.setNextAlignment(Uint32Array.BYTES_PER_ELEMENT);
        const newIndexView = {
            offset: bufferBlob.getLength(),
            length: newIndex.byteLength,
            count: indexView.count,
            stride: Uint32Array.BYTES_PER_ELEMENT,
        };
        primitive.indexView = newIndexView;
        bufferBlob.addBuffer(newIndex);
    }
    const newMesh = new cc_1.Mesh();
    newMesh.reset({
        struct,
        data: bufferBlob.getCombined(),
    });
    const hash = newMesh.hash;
    return newMesh;
}
const maxTriangleCount = 124; // nvidia recommends 126, rounded down to a multiple of 4
const maxVertexCount = 64; // nvidia recommends 64
const coneWeight = 0.5; // should be 0 unless cone culling is used during runtime
async function clusterizeMesh(mesh, options) {
    await tryInitMeshOpt();
    if (!options) {
        return mesh;
    }
    // 'mesh' and 'options' are not used in this function, so we can remove them
    const struct = mesh.struct;
    const primitives = mesh.struct.primitives;
    const vertexBundles = mesh.struct.vertexBundles;
    const meshlets = [];
    const meshletVertices = [];
    const meshletTriangles = [];
    let meshletsOffset = 0;
    let meshletVerticesOffset = 0;
    let meshletTrianglesOffset = 0;
    primitives.forEach((primitive, idx) => {
        if (!primitive.indexView) {
            console.warn(`Submesh ${idx} has no index buffer, meshlet optimization is not supported.`);
            return;
        }
        if (primitive.vertexBundelIndices.length === 1) {
            // estimates meshlet count
            const indexView = primitive.indexView;
            const indexCount = indexView.count;
            const vertexView = vertexBundles[primitive.vertexBundelIndices[0]].view;
            const vertexCount = vertexView.count;
            const maxMeshletCount = meshopt_encoder_1.default.optimizer.buildMeshLetsBound(indexCount, maxVertexCount, maxTriangleCount);
            // allocates meshlet buffer, the type is encoder.Meshlet
            const meshlet_data = new Uint8Array(maxMeshletCount * Uint32Array.BYTES_PER_ELEMENT * 4 /* 4 arguments */);
            const meshlet_vertices = new Uint8Array(maxMeshletCount * maxVertexCount * Uint32Array.BYTES_PER_ELEMENT);
            const meshlet_triangles = new Uint8Array(maxMeshletCount * maxTriangleCount * Uint32Array.BYTES_PER_ELEMENT * 3 /* triangles */);
            // scan meshlet
            const attrs = vertexBundles[primitive.vertexBundelIndices[0]].attributes;
            const indexOfPosition = attrs.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
            const positionOffset = getOffset(attrs, indexOfPosition);
            const vertexBufferAtPos = new Uint8Array(mesh.data.buffer, vertexView.offset + positionOffset, vertexView.length - positionOffset);
            let meshletCount = 0;
            if (indexView.stride === 4) {
                //!! support 32bit index
                const indexBuffer32 = new Uint32Array(mesh.data.buffer, indexView.offset, indexCount);
                // meshletCount = encoder.optimizer.buildMeshLetsScan(meshlet_data, meshlet_vertices, meshlet_triangles, indexBuffer32, indexCount, vertexCount, maxVertexCount, maxTriangleCount);
                meshletCount = meshopt_encoder_1.default.optimizer.buildMeshLets(meshlet_data, meshlet_vertices, meshlet_triangles, indexBuffer32, indexCount, vertexBufferAtPos, vertexCount, vertexView.stride, maxVertexCount, maxTriangleCount, coneWeight);
            }
            else if (indexView.stride === 2) {
                //!! 16 bit index
                const indexBuffer16 = new Uint16Array(mesh.data.buffer, indexView.offset, indexCount);
                const indexBuffer32 = new Uint32Array(indexCount);
                for (let i = 0; i < indexCount; ++i) {
                    indexBuffer32[i] = indexBuffer16[i];
                }
                // meshletCount = encoder.optimizer.buildMeshLetsScan(meshlet_data, meshlet_vertices, meshlet_triangles, indexBuffer32, indexCount, vertexCount, maxVertexCount, maxTriangleCount);
                meshletCount = meshopt_encoder_1.default.optimizer.buildMeshLets(meshlet_data, meshlet_vertices, meshlet_triangles, indexBuffer32, indexCount, vertexBufferAtPos, vertexCount, vertexView.stride, maxVertexCount, maxTriangleCount, coneWeight);
            }
            else {
                console.warn(`Submesh ${idx} has unsupported index stride, meshlet optimization is not supported.`);
                return;
            }
            // TODO: should shrink meshlet buffer size
            // calculate meshlet cone cluster
            if (options?.coneCluster) {
                // TODO: implement cone cluster, cone cluster should be constructed in a buffer
                const coneSize = 48; // 12 + 4 + 12 + 12 + 4 + 3 + 1
                const coneBuffer = new Uint8Array(coneSize * meshletCount);
                const vertexOffset = 0;
                const triangleOffset = 0;
                for (let i = 0; i < meshletCount; ++i) {
                    // const meshletVerticesView = new Uint8Array(meshlet_vertices.buffer, vertexOffset );
                    // const bound = encoder.optimizer.computeMeshLetsBound(meshlet_vertices, meshlet_triangles, i, vertexCount, vertexView.stride);
                }
            }
            meshlets.push(meshlet_data);
            meshletVertices.push(meshlet_vertices);
            meshletTriangles.push(meshlet_triangles);
            meshletsOffset += meshlet_data.byteLength;
            meshletVerticesOffset += meshlet_vertices.byteLength;
            meshletTrianglesOffset += meshlet_triangles.byteLength;
            primitive.cluster = {
                clusterView: {
                    offset: meshletsOffset,
                    length: meshlet_data.byteLength,
                    count: meshletCount,
                    stride: Uint32Array.BYTES_PER_ELEMENT * 4,
                },
                vertexView: {
                    offset: meshletVerticesOffset,
                    length: meshlet_vertices.byteLength,
                    count: vertexCount, // TODO fix
                    stride: Uint32Array.BYTES_PER_ELEMENT,
                },
                triangleView: {
                    offset: meshletTrianglesOffset,
                    length: meshlet_triangles.byteLength,
                    count: indexCount, // TODO fix
                    stride: Uint32Array.BYTES_PER_ELEMENT * 3,
                },
            };
        }
        else if (primitive.vertexBundelIndices.length > 1) {
            console.warn(`Submesh ${idx} has more than one vertex bundle, cache optimization is not supported.`);
        }
        else {
            console.warn(`Submesh ${idx} has no vertex bundle, cache optimization is not supported.`);
        }
    });
    if (meshlets.length > 0) {
        // summary meshlet buffer size
        const meshletDataSize = meshlets.reduce((acc, cur) => acc + cur.byteLength, 0);
        const meshletVerticesSize = meshletVertices.reduce((acc, cur) => acc + cur.byteLength, 0);
        const meshletTrianglesSize = meshletTriangles.reduce((acc, cur) => acc + cur.byteLength, 0);
        // allocates new mesh buffer
        const newMeshData = new Uint8Array(mesh.data.byteLength + meshletDataSize + meshletVerticesSize + meshletTrianglesSize);
        // copy original mesh data
        newMeshData.set(mesh.data);
        // copy meshlet data
        let offset = mesh.data.byteLength;
        meshlets.forEach((meshlet) => {
            newMeshData.set(meshlet, offset);
            offset += meshlet.byteLength;
        });
        // copy meshlet vertices
        meshletVertices.forEach((meshlet) => {
            newMeshData.set(meshlet, offset);
            offset += meshlet.byteLength;
        });
        // copy meshlet triangles
        meshletTriangles.forEach((meshlet) => {
            newMeshData.set(meshlet, offset);
            offset += meshlet.byteLength;
        });
        // create new bufferViews for meshlet data
        primitives.forEach((primitive, idx) => {
            if (primitive.cluster) {
                primitive.cluster.clusterView.offset += mesh.data.byteLength;
                primitive.cluster.vertexView.offset += mesh.data.byteLength + meshletDataSize;
                primitive.cluster.triangleView.offset += mesh.data.byteLength + meshletDataSize + meshletVerticesSize;
            }
        });
        const newMesh = new cc_1.Mesh();
        newMesh.reset({
            struct,
            data: newMeshData,
        });
        newMesh.struct.cluster = true;
        const hash = newMesh.hash;
        return newMesh;
    }
    return mesh; // return the original mesh for now
}
function getDefaultSimplifyOptions() {
    return {
        enable: true,
        targetRatio: 0.5,
        autoErrorRatio: true,
        lockBoundary: true,
    };
}
async function simplifyMesh(mesh, options) {
    await tryInitMeshOpt();
    if (!(options && options.targetRatio)) {
        return mesh;
    }
    const suitable = mesh.struct.primitives.every((primitive) => {
        return primitive.primitiveMode === cc_1.gfx.PrimitiveMode.TRIANGLE_LIST || primitive.primitiveMode === cc_1.gfx.PrimitiveMode.POINT_LIST;
    });
    if (!suitable) {
        console.warn('Only triangle list and point list are supported.');
        return mesh;
    }
    if (mesh.struct.compressed) {
        console.warn('Compressed mesh is not supported.');
        return mesh;
    }
    if (mesh.struct.cluster) {
        console.warn('Mesh cluster is not supported.');
        return mesh;
    }
    if (mesh.struct.quantized) {
        console.warn('Quantized mesh is not supported.');
        return mesh;
    }
    const simplify_option = options.lockBoundary ? 1 : 0;
    const target_ratio = options.targetRatio;
    const auto_error_rate = 1.0 - Math.pow(0.9, -Math.log10(target_ratio));
    const target_error = options.autoErrorRate ? auto_error_rate : options.errorRate || auto_error_rate;
    const bufferBlob = new gltf_converter_1.BufferBlob();
    bufferBlob.setNextAlignment(0);
    // per primitive
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    const primitives = struct.primitives;
    for (let i = 0; i < primitives.length; ++i) {
        const primitive = primitives[i];
        if (primitive.primitiveMode === cc_1.gfx.PrimitiveMode.TRIANGLE_LIST && primitive.indexView) {
            // ! for primitive without index buffer, we should generate one
            const indexView = primitive.indexView;
            let indexBuffer;
            let newIndex = new Uint8Array(indexView.count * Uint32Array.BYTES_PER_ELEMENT);
            let indexCount = indexView.count;
            if (indexView.stride === 2) {
                indexBuffer = new Uint8Array(newIndex.buffer, 0, indexView.count * Uint32Array.BYTES_PER_ELEMENT);
                const indexBuffer16 = new Uint16Array(mesh.data.buffer, indexView.offset, indexView.count);
                const indexBuffer32 = new Uint32Array(indexBuffer.buffer, 0, indexView.count);
                for (let j = 0; j < indexView.count; ++j) {
                    indexBuffer32[j] = indexBuffer16[j];
                }
            }
            else if (indexView.stride === 4) {
                indexBuffer = new Uint8Array(mesh.data.buffer, indexView.offset, indexView.count * Uint32Array.BYTES_PER_ELEMENT);
            }
            else {
                console.warn(`Submesh ${i} has unsupported index stride, simplify optimization is not supported.`);
                return mesh;
            }
            const positionBundleIndex = primitive.vertexBundelIndices.findIndex((bundleIndex) => {
                const bundle = struct.vertexBundles[bundleIndex];
                const attributes = bundle.attributes;
                const posIndex = attributes.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
                return posIndex >= 0;
            });
            if (positionBundleIndex < 0) {
                console.warn('No position attribute found, simplify optimization is not supported.');
                return mesh;
            }
            else {
                // proceed to simplify
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[positionBundleIndex]];
                const view = bundle.view;
                const attributes = bundle.attributes;
                const posIndex = attributes.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
                const positionOffset = getOffset(attributes, posIndex);
                const vertexBuffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                const target_index_count = Math.floor((indexView.count * target_ratio) / 3) * 3;
                const result_error = 0;
                indexCount = meshopt_encoder_1.default.optimizer.simplify(newIndex, indexBuffer, indexView.count, vertexBuffer.subarray(positionOffset), view.count, view.stride, target_index_count, target_error, simplify_option, result_error);
                newIndex = new Uint8Array(newIndex.buffer, 0, indexCount * Uint32Array.BYTES_PER_ELEMENT); // shrink buffer size
                // optimize vertex fetch
                if (primitive.vertexBundelIndices.length === 1) {
                    // simple optimization
                    let vertexCount = indexCount < view.count ? indexCount : view.count;
                    let destVertexBuffer = new Uint8Array(view.count * view.stride);
                    vertexCount = meshopt_encoder_1.default.optimizer.optimizeVertexFetch(destVertexBuffer, newIndex, indexCount, vertexBuffer, view.count, view.stride);
                    destVertexBuffer = new Uint8Array(destVertexBuffer.buffer, 0, vertexCount * view.stride); // shrink buffer size
                    bufferBlob.setNextAlignment(view.stride);
                    const newView = {
                        offset: bufferBlob.getLength(),
                        length: destVertexBuffer.byteLength,
                        count: vertexCount,
                        stride: view.stride,
                    };
                    bundle.view = newView;
                    bufferBlob.addBuffer(destVertexBuffer);
                }
                else {
                    const remapBuffer = new Uint8Array(indexCount * Uint32Array.BYTES_PER_ELEMENT);
                    const totalVertex = meshopt_encoder_1.default.optimizer.optimizeVertexFetchRemap(remapBuffer, newIndex, indexCount, view.count);
                    meshopt_encoder_1.default.optimizer.optimizeRemapIndex(newIndex, newIndex, indexCount, remapBuffer);
                    for (let j = 0; j < primitive.vertexBundelIndices.length; ++j) {
                        const bundle = struct.vertexBundles[primitive.vertexBundelIndices[j]];
                        const view = bundle.view;
                        const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                        const newBuffer = new Uint8Array(totalVertex * view.stride);
                        meshopt_encoder_1.default.optimizer.optimizeRemapVertex(newBuffer, buffer, totalVertex, view.stride, remapBuffer);
                        bufferBlob.setNextAlignment(view.stride);
                        const newView = {
                            offset: bufferBlob.getLength(),
                            length: newBuffer.byteLength,
                            count: totalVertex,
                            stride: view.stride,
                        };
                        bundle.view = newView;
                        bufferBlob.addBuffer(newBuffer);
                    }
                }
            }
            // dump new index buffer
            bufferBlob.setNextAlignment(Uint32Array.BYTES_PER_ELEMENT);
            const newIndexView = {
                offset: bufferBlob.getLength(),
                length: newIndex.byteLength,
                count: indexCount,
                stride: Uint32Array.BYTES_PER_ELEMENT,
            };
            primitive.indexView = newIndexView;
            bufferBlob.addBuffer(newIndex);
        }
        else if (primitive.primitiveMode === cc_1.gfx.PrimitiveMode.POINT_LIST) {
            if (primitive.vertexBundelIndices.length === 1) {
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[0]];
                const view = bundle.view;
                const attributes = bundle.attributes;
                const posIndex = attributes.findIndex((attr) => attr.name === cc_1.gfx.AttributeName.ATTR_POSITION);
                const positionOffset = getOffset(attributes, posIndex);
                const vertexBuffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                const target_vertex_count = Math.floor((view.count * target_ratio) / 3) * 3;
                let destBuffer = new Uint8Array(target_vertex_count * view.stride);
                const vertexCount = meshopt_encoder_1.default.optimizer.simplifyPoints(destBuffer, vertexBuffer.subarray(positionOffset), view.count, view.stride, target_vertex_count);
                destBuffer = new Uint8Array(destBuffer.buffer, 0, vertexCount * view.stride); // shrink buffer size
                bufferBlob.setNextAlignment(view.stride);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: destBuffer.byteLength,
                    count: vertexCount,
                    stride: view.stride,
                };
                bundle.view = newView;
                bufferBlob.addBuffer(destBuffer);
            }
            else if (primitive.vertexBundelIndices.length > 1) {
                console.warn(`Submesh ${i} has more than one vertex bundle, which is not supported.`);
                return mesh;
            }
        }
        else {
            // not supported, should just dump
            for (let j = 0; j < primitive.vertexBundelIndices.length; ++j) {
                const bundle = struct.vertexBundles[primitive.vertexBundelIndices[j]];
                const view = bundle.view;
                const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                bufferBlob.setNextAlignment(view.stride);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: buffer.byteLength,
                    count: view.count,
                    stride: view.stride,
                };
                bundle.view = newView;
                bufferBlob.addBuffer(buffer);
            }
            if (primitive.indexView) {
                const view = primitive.indexView;
                const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
                bufferBlob.setNextAlignment(Uint32Array.BYTES_PER_ELEMENT);
                const newView = {
                    offset: bufferBlob.getLength(),
                    length: buffer.byteLength,
                    count: view.count,
                    stride: Uint32Array.BYTES_PER_ELEMENT,
                };
                primitive.indexView = newView;
                bufferBlob.addBuffer(buffer);
            }
        }
    }
    const newMesh = new cc_1.Mesh();
    newMesh.reset({
        struct,
        data: bufferBlob.getCombined(),
    });
    const hash = newMesh.hash;
    return newMesh;
}
async function compressMesh(mesh, options) {
    await tryInitMeshOpt();
    // 'mesh' and 'options' are not used in this function, so we can remove them
    if (!options) {
        console.warn('Mesh compression is not enabled, original mesh will be returned.');
        return mesh;
    }
    if (options?.quantize) {
        mesh = await quantizeMesh(mesh);
    }
    if (options?.encode) {
        mesh = await encodeMesh(mesh);
    }
    if (options?.compress) {
        mesh = await deflateMesh(mesh);
    }
    return mesh; // return the original mesh for now
}
async function encodeMesh(mesh) {
    await tryInitMeshOpt();
    if (mesh.struct.encoded) {
        return mesh;
    }
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    const bufferBlob = new gltf_converter_1.BufferBlob();
    bufferBlob.setNextAlignment(0);
    for (const bundle of struct.vertexBundles) {
        const view = bundle.view;
        const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
        const bound = meshopt_encoder_1.default.optimizer.encodeVertexBufferBound(view.count, view.stride);
        let destBuffer = new Uint8Array(bound);
        const length = meshopt_encoder_1.default.optimizer.encodeVertexBuffer(destBuffer, bound, buffer, view.count, view.stride);
        destBuffer = new Uint8Array(destBuffer.buffer, 0, length);
        bufferBlob.setNextAlignment(view.stride);
        const newView = {
            offset: bufferBlob.getLength(),
            length: destBuffer.byteLength,
            count: view.count,
            stride: view.stride,
        };
        bundle.view = newView;
        bufferBlob.addBuffer(destBuffer);
    }
    for (const primitive of struct.primitives) {
        if (primitive.indexView === undefined) {
            continue;
        }
        const view = primitive.indexView;
        let buffer = new Uint8Array();
        // convert index to 32bit
        if (view.stride === 2) {
            const indexBuffer16 = new Uint16Array(mesh.data.buffer, view.offset, view.count);
            const indexBuffer32 = new Uint32Array(view.count * Uint32Array.BYTES_PER_ELEMENT);
            for (let j = 0; j < view.count; ++j) {
                indexBuffer32[j] = indexBuffer16[j];
            }
            buffer = new Uint8Array(indexBuffer32.buffer, 0, view.count * Uint32Array.BYTES_PER_ELEMENT);
        }
        else if (view.stride === 4) {
            buffer = new Uint8Array(mesh.data.buffer, view.offset, view.count * Uint32Array.BYTES_PER_ELEMENT);
        }
        const bound = meshopt_encoder_1.default.optimizer.encodeIndexBufferBound(view.count, view.count);
        let destBuffer = new Uint8Array(bound);
        const length = meshopt_encoder_1.default.optimizer.encodeIndexBuffer(destBuffer, bound, buffer, view.count);
        destBuffer = new Uint8Array(destBuffer.buffer, 0, length);
        bufferBlob.setNextAlignment(Uint32Array.BYTES_PER_ELEMENT);
        const newView = {
            offset: bufferBlob.getLength(),
            length: destBuffer.byteLength,
            count: view.count,
            stride: Uint32Array.BYTES_PER_ELEMENT,
        };
        primitive.indexView = newView;
        bufferBlob.addBuffer(destBuffer);
    }
    const newMesh = new cc_1.Mesh();
    newMesh.reset({
        struct,
        data: bufferBlob.getCombined(),
    });
    newMesh.struct.encoded = true;
    const hash = newMesh.hash;
    return newMesh;
}
const quantizeConfiguration = new Map([
    [cc_1.gfx.AttributeName.ATTR_POSITION, { enum: 0, size: 6, format: cc_1.gfx.Format.RGB16F, origin: cc_1.gfx.Format.RGB32F }], // 8 for position
    [cc_1.gfx.AttributeName.ATTR_NORMAL, { enum: 1, size: 6, format: cc_1.gfx.Format.RGB16F, origin: cc_1.gfx.Format.RGB32F }], // 4 for normal
    [cc_1.gfx.AttributeName.ATTR_TANGENT, { enum: 2, size: 8, format: cc_1.gfx.Format.RGBA16F, origin: cc_1.gfx.Format.RGBA32F }], // 4 for tangent
    [cc_1.gfx.AttributeName.ATTR_BITANGENT, { enum: 2, size: 8, format: cc_1.gfx.Format.RGBA16F, origin: cc_1.gfx.Format.RGBA32F }], // 4 for tangent
    [cc_1.gfx.AttributeName.ATTR_COLOR, { enum: 3, size: 4, format: cc_1.gfx.Format.RGBA8, origin: cc_1.gfx.Format.RGBA32F }], // 4 for color, 1b each channel
    [cc_1.gfx.AttributeName.ATTR_COLOR1, { enum: 3, size: 4, format: cc_1.gfx.Format.RGBA8, origin: cc_1.gfx.Format.RGBA32F }], // 4 for joints,
    [cc_1.gfx.AttributeName.ATTR_COLOR2, { enum: 3, size: 4, format: cc_1.gfx.Format.RGBA8, origin: cc_1.gfx.Format.RGBA32F }], // 4 for joints,
    [cc_1.gfx.AttributeName.ATTR_JOINTS, { enum: 4, size: 16, format: cc_1.gfx.Format.RGBA32F, origin: cc_1.gfx.Format.RGBA32F }], // 4 for joints,
    [cc_1.gfx.AttributeName.ATTR_WEIGHTS, { enum: 5, size: 16, format: cc_1.gfx.Format.RGBA32F, origin: cc_1.gfx.Format.RGBA32F }], // 4 for weights,
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD1, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv1, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD2, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv2, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD3, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv3, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD4, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv4, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD5, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv5, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD6, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv6, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD7, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv7, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_TEX_COORD8, { enum: 6, size: 4, format: cc_1.gfx.Format.RG16F, origin: cc_1.gfx.Format.RG32F }], // 4 for uv8, 2b each channel
    [cc_1.gfx.AttributeName.ATTR_BATCH_ID, { enum: 7, size: 4, format: cc_1.gfx.Format.R32F, origin: cc_1.gfx.Format.R32F }], // 4 for batch id
    [cc_1.gfx.AttributeName.ATTR_BATCH_UV, { enum: 8, size: 8, format: cc_1.gfx.Format.RG32F, origin: cc_1.gfx.Format.RG32F }], // 4 for batch uv
]);
function quantizeSize(attributes) {
    let size = 0;
    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i];
        const name = attribute.name;
        const conf = quantizeConfiguration.get(name);
        if (conf !== undefined) {
            size += conf.size;
            if (conf.origin !== attribute.format) {
                console.warn(`Attribute ${name} has different format from origin, quantization may not work.`);
                return undefined;
            }
            attribute.format = conf.format;
        }
        else {
            console.log(`Attribute ${name} is not supported for quantization.`);
            return undefined;
        }
    }
    return size;
}
function mapAttribute(attributes) {
    return attributes.map((attribute) => {
        const name = attribute.name;
        const conf = quantizeConfiguration.get(name);
        if (conf === undefined) {
            console.error(`Attribute ${name} is not supported for quantization.`);
        }
        return conf.enum;
    });
}
async function quantizeMesh(mesh) {
    if (mesh.struct.quantized) {
        return mesh;
    }
    const bufferBlob = new gltf_converter_1.BufferBlob();
    bufferBlob.setNextAlignment(0);
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    for (let i = 0; i < struct.vertexBundles.length; ++i) {
        const bundle = struct.vertexBundles[i];
        const view = bundle.view;
        const attributes = JSON.parse(JSON.stringify(bundle.attributes));
        const quantizedSize = quantizeSize(attributes);
        if (!quantizedSize) {
            return mesh;
        }
        const vertexBuffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
        const attrEnums = mapAttribute(attributes);
        const newBuffer = new Uint8Array(quantizedSize * view.count);
        meshopt_encoder_1.default.optimizer.quantizeMesh(newBuffer, newBuffer.byteLength, vertexBuffer, view.count, view.stride, Uint32Array.from(attrEnums), attrEnums.length);
        bufferBlob.setNextAlignment(quantizedSize);
        const newView = {
            offset: bufferBlob.getLength(),
            length: newBuffer.byteLength,
            count: view.count,
            stride: quantizedSize,
        };
        bundle.view = newView;
        bundle.attributes = attributes;
        bufferBlob.addBuffer(newBuffer);
    }
    // dump index buffer
    for (let i = 0; i < struct.primitives.length; ++i) {
        const primitive = struct.primitives[i];
        if (primitive.indexView === undefined) {
            continue;
        }
        const view = primitive.indexView;
        const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
        bufferBlob.setNextAlignment(view.stride);
        const newView = {
            offset: bufferBlob.getLength(),
            length: buffer.byteLength,
            count: view.count,
            stride: view.stride,
        };
        primitive.indexView = newView;
        bufferBlob.addBuffer(buffer);
    }
    const newMesh = new cc_1.Mesh();
    newMesh.reset({
        struct,
        data: bufferBlob.getCombined(),
    });
    newMesh.struct.quantized = true;
    const hash = newMesh.hash;
    return newMesh;
}
async function deflateMesh(mesh) {
    if (mesh.struct.compressed) {
        return mesh;
    }
    function compress(buffer) {
        const compressed = zlib_1.default.deflateSync(buffer);
        return compressed;
    }
    const data = compress(mesh.data);
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    struct.compressed = true;
    const newMesh = new cc_1.Mesh();
    newMesh.reset({
        struct,
        data,
    });
    const hash = newMesh.hash;
    return newMesh;
}
