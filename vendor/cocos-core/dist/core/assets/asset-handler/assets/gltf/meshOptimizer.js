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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzaE9wdGltaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9nbHRmL21lc2hPcHRpbWl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUErQkEsb0NBaU1DO0FBTUQsd0NBNExDO0FBRUQsOERBT0M7QUFFRCxvQ0FpUEM7QUFFRCxvQ0FzQkM7QUFFRCxnQ0FzRkM7QUFpRUQsb0NBdUVDO0FBRUQsa0NBdUJDO0FBLzZCRCwyQkFBK0I7QUFDL0Isc0VBQXNDO0FBR3RDLGdEQUF3QjtBQUN4Qiw0REFBcUQ7QUFFckQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBRW5CLEtBQUssVUFBVSxjQUFjO0lBQ3pCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNWLE9BQU8seUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNwQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLFVBQTJCLEVBQUUsY0FBc0I7SUFDbEUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLElBQUksUUFBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3JELENBQUM7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SSxDQUFDLFFBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLGVBQWU7SUFDNUgsQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0I7SUFDaEksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0I7SUFDbEksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSwrQkFBK0I7SUFDM0ksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0I7SUFDN0gsQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0I7SUFDN0gsQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0I7SUFDaEksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxpQkFBaUI7SUFDbEksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw0QkFBNEI7SUFDMUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSw2QkFBNkI7SUFDNUksQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxpQkFBaUI7SUFDNUgsQ0FBQyxRQUFHLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxpQkFBaUI7Q0FDakksQ0FBQyxDQUFDO0FBRUgsU0FBUyxZQUFZLENBQUMsVUFBMkI7SUFDN0MsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBRWIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxN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QUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUV2RCxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0lBQzNCLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDVixNQUFNO1FBQ04sSUFBSTtLQUNQLENBQUMsQ0FBQztJQUNILE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFFMUIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc2gsIGdmeCB9IGZyb20gJ2NjJztcbmltcG9ydCBlbmNvZGVyIGZyb20gJ21lc2hvcHRfZW5jb2Rlcic7XG5pbXBvcnQgeyBNZXNoQ29tcHJlc3NPcHRpb25zLCBNZXNoT3B0aW1pemVPcHRpb25zLCBNZXNoU2ltcGxpZnlPcHRpb25zLCBNZXNoQ2x1c3Rlck9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcbmltcG9ydCB7IG1lcmdlTWVzaGVzIH0gZnJvbSAnLi9tZXNoVXRpbHMnO1xuaW1wb3J0IHpsaWIgZnJvbSAnemxpYic7XG5pbXBvcnQgeyBCdWZmZXJCbG9iIH0gZnJvbSAnLi4vdXRpbHMvZ2x0Zi1jb252ZXJ0ZXInO1xuXG5sZXQgaW5pdGVkID0gZmFsc2U7XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUluaXRNZXNoT3B0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghaW5pdGVkKSB7XG4gICAgICAgIHJldHVybiBlbmNvZGVyLmluaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNZXNoT3B0IGluaXQgc3VjY2VzcycpO1xuICAgICAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0T2Zmc2V0KGF0dHJpYnV0ZXM6IGdmeC5BdHRyaWJ1dGVbXSwgYXR0cmlidXRlSW5kZXg6IG51bWJlcikge1xuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cmlidXRlSW5kZXg7ICsraSkge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgICByZXN1bHQgKz0gZ2Z4LkZvcm1hdEluZm9zW2F0dHJpYnV0ZS5mb3JtYXRdLnNpemU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IG92ZXJkcmF3VGhyZXNob2xkID0gMy4wO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemVNZXNoKG1lc2g6IE1lc2gsIG9wdGlvbnM/OiBNZXNoT3B0aW1pemVPcHRpb25zKTogUHJvbWlzZTxNZXNoPiB7XG4gICAgYXdhaXQgdHJ5SW5pdE1lc2hPcHQoKTtcblxuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbWVzaDtcbiAgICB9XG5cbiAgICBpZiAoIShvcHRpb25zLm92ZXJkcmF3IHx8IG9wdGlvbnMudmVydGV4Q2FjaGUgfHwgb3B0aW9ucy52ZXJ0ZXhGZXRjaCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdObyBvcHRpbWl6YXRpb24gb3B0aW9uIGlzIGVuYWJsZWQsIHJldHVybiB0aGUgb3JpZ2luYWwgbWVzaCcpO1xuICAgICAgICByZXR1cm4gbWVzaDtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXJCbG9iID0gbmV3IEJ1ZmZlckJsb2IoKTtcbiAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQoMCk7XG5cbiAgICBjb25zdCBzdHJ1Y3QgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1lc2guc3RydWN0KSkgYXMgTWVzaC5JU3RydWN0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJ1Y3QucHJpbWl0aXZlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBzdHJ1Y3QucHJpbWl0aXZlc1tpXTtcbiAgICAgICAgaWYgKHByaW1pdGl2ZS5wcmltaXRpdmVNb2RlID09PSBnZnguUHJpbWl0aXZlTW9kZS5QT0lOVF9MSVNUIHx8IHByaW1pdGl2ZS5pbmRleFZpZXcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdPbmx5IHRyaWFuZ2xlIGxpc3QgaXMgc3VwcG9ydGVkLicpO1xuICAgICAgICAgICAgLy8gbm8gbmVlZCB0byBvcHRpbWl6ZSBwb2ludCBsaXN0LCBvciB1bi1pbmRleGVkIG1lc2gsIGp1c3QgZHVtcFxuICAgICAgICAgICAgLy8gKiBnZW5lcmF0ZSBpbmRleCBidWZmZXIgZm9yIHVuLWluZGV4ZWQgbWVzaCwgbWF5YmUgbGF0ZXJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJpbWl0aXZlLnZlcnRleEJ1bmRlbEluZGljZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1tqXV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KHZpZXcuc3RyaWRlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogYnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICBzdHJpZGU6IHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKGJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZpbmQgdmVydGV4IGJ1bmRsZSB3aXRoIHBvc2l0aW9uIGF0dHJpYnV0ZVxuICAgICAgICBjb25zdCBpbmRleFZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHN0cnVjdC52ZXJ0ZXhCdW5kbGVzW3ByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzWzBdXS52aWV3LmNvdW50O1xuXG4gICAgICAgIGNvbnN0IG5ld0luZGV4ID0gbmV3IFVpbnQ4QXJyYXkoaW5kZXhWaWV3LmNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAvLyBjb252ZXJ0IGluZGV4IHRvIDMyYml0XG4gICAgICAgIGlmIChpbmRleFZpZXcuc3RyaWRlID09PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleEJ1ZmZlcjE2ID0gbmV3IFVpbnQxNkFycmF5KG1lc2guZGF0YS5idWZmZXIsIGluZGV4Vmlldy5vZmZzZXQsIGluZGV4Vmlldy5jb3VudCk7XG4gICAgICAgICAgICBjb25zdCBpbmRleEJ1ZmZlcjMyID0gbmV3IFVpbnQzMkFycmF5KG5ld0luZGV4LmJ1ZmZlciwgMCwgaW5kZXhWaWV3LmNvdW50KTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5kZXhWaWV3LmNvdW50OyArK2opIHtcbiAgICAgICAgICAgICAgICBpbmRleEJ1ZmZlcjMyW2pdID0gaW5kZXhCdWZmZXIxNltqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpbmRleFZpZXcuc3RyaWRlID09PSA0KSB7XG4gICAgICAgICAgICBuZXdJbmRleC5zZXQobmV3IFVpbnQ4QXJyYXkobWVzaC5kYXRhLmJ1ZmZlciwgaW5kZXhWaWV3Lm9mZnNldCwgaW5kZXhWaWV3LmNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnZlcnRleENhY2hlKSB7XG4gICAgICAgICAgICBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVZlcnRleENhY2hlKFxuICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICBpbmRleFZpZXcuY291bnQsXG4gICAgICAgICAgICAgICAgdmVydGV4Q291bnQsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMub3ZlcmRyYXcpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uQnVuZGxlSW5kZXggPSBwcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlcy5maW5kSW5kZXgoKGJ1bmRsZUluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnVuZGxlID0gc3RydWN0LnZlcnRleEJ1bmRsZXNbYnVuZGxlSW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBidW5kbGUuYXR0cmlidXRlcztcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NJbmRleCA9IGF0dHJpYnV0ZXMuZmluZEluZGV4KChhdHRyKSA9PiBhdHRyLm5hbWUgPT09IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfUE9TSVRJT04pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3NJbmRleCA+PSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAocG9zaXRpb25CdW5kbGVJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIHBvc2l0aW9uIGF0dHJpYnV0ZSBmb3VuZCwgb3ZlcmRyYXcgb3B0aW1pemF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZSA9IHN0cnVjdC52ZXJ0ZXhCdW5kbGVzW3ByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzW3Bvc2l0aW9uQnVuZGxlSW5kZXhdXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gYnVuZGxlLnZpZXc7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IGJ1bmRsZS5hdHRyaWJ1dGVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc0luZGV4ID0gYXR0cmlidXRlcy5maW5kSW5kZXgoKGF0dHIpID0+IGF0dHIubmFtZSA9PT0gZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9QT1NJVElPTik7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zaXRpb25PZmZzZXQgPSBnZXRPZmZzZXQoYXR0cmlidXRlcywgcG9zSW5kZXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgZW5jb2Rlci5vcHRpbWl6ZXIub3B0aW1pemVPdmVyZHJhdyhcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhWaWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIuc3ViYXJyYXkocG9zaXRpb25PZmZzZXQpIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmRyYXdUaHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5lZWRPcHRpbWl6ZUZldGNoID0gb3B0aW9ucy52ZXJ0ZXhDYWNoZSB8fCBvcHRpb25zLm92ZXJkcmF3IHx8IG9wdGlvbnMudmVydGV4RmV0Y2g7XG5cbiAgICAgICAgaWYgKCFuZWVkT3B0aW1pemVGZXRjaCkge1xuICAgICAgICAgICAgaWYgKHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHNpbXBsZSBvcHRpbWl6YXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1swXV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodmlldy5jb3VudCAqIHZpZXcuc3RyaWRlKTtcbiAgICAgICAgICAgICAgICBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVZlcnRleEZldGNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdCdWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhWaWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgdmlldy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zdHJpZGUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQodmlldy5zdHJpZGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ZpZXc6IE1lc2guSUJ1ZmZlclZpZXcgPSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogYnVmZmVyQmxvYi5nZXRMZW5ndGgoKSxcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBuZXdCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IHZpZXcuY291bnQsXG4gICAgICAgICAgICAgICAgICAgIHN0cmlkZTogdmlldy5zdHJpZGUsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBidW5kbGUudmlldyA9IG5ld1ZpZXc7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIobmV3QnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJpbWl0aXZlLnZlcnRleEJ1bmRlbEluZGljZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbWFwQnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGluZGV4Vmlldy5jb3VudCAqIFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFZlcnRleCA9IGVuY29kZXIub3B0aW1pemVyLm9wdGltaXplVmVydGV4RmV0Y2hSZW1hcChcbiAgICAgICAgICAgICAgICAgICAgcmVtYXBCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4Vmlldy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4Q291bnQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVJlbWFwSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4Vmlldy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgcmVtYXBCdWZmZXIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZSA9IHN0cnVjdC52ZXJ0ZXhCdW5kbGVzW3ByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzW2pdXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdCdWZmZXIgPSBuZXcgVWludDhBcnJheSh0b3RhbFZlcnRleCAqIHZpZXcuc3RyaWRlKTtcbiAgICAgICAgICAgICAgICAgICAgZW5jb2Rlci5vcHRpbWl6ZXIub3B0aW1pemVSZW1hcFZlcnRleChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0J1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFZlcnRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYXBCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudCh2aWV3LnN0cmlkZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ZpZXc6IE1lc2guSUJ1ZmZlclZpZXcgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IG5ld0J1ZmZlci5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRvdGFsVmVydGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWRlOiB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICAgICAgICAgICAgICBidWZmZXJCbG9iLmFkZEJ1ZmZlcihuZXdCdWZmZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGR1bXAgdmVydGV4IGJ1ZmZlciwgbGVhdmUgdW4tb3B0aW1pemVkXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnVuZGxlID0gc3RydWN0LnZlcnRleEJ1bmRsZXNbcHJpbWl0aXZlLnZlcnRleEJ1bmRlbEluZGljZXNbal1dO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBidW5kbGUudmlldztcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudCh2aWV3LnN0cmlkZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VmlldzogTWVzaC5JQnVmZmVyVmlldyA9IHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogdmlldy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgc3RyaWRlOiB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJ1bmRsZS52aWV3ID0gbmV3VmlldztcbiAgICAgICAgICAgICAgICBidWZmZXJCbG9iLmFkZEJ1ZmZlcihidWZmZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgY29uc3QgbmV3SW5kZXhWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgbGVuZ3RoOiBuZXdJbmRleC5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgY291bnQ6IGluZGV4Vmlldy5jb3VudCxcbiAgICAgICAgICAgIHN0cmlkZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG4gICAgICAgIH07XG4gICAgICAgIHByaW1pdGl2ZS5pbmRleFZpZXcgPSBuZXdJbmRleFZpZXc7XG4gICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKG5ld0luZGV4KTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdNZXNoID0gbmV3IE1lc2goKTtcbiAgICBuZXdNZXNoLnJlc2V0KHtcbiAgICAgICAgc3RydWN0LFxuICAgICAgICBkYXRhOiBidWZmZXJCbG9iLmdldENvbWJpbmVkKCksXG4gICAgfSk7XG4gICAgY29uc3QgaGFzaCA9IG5ld01lc2guaGFzaDtcblxuICAgIHJldHVybiBuZXdNZXNoO1xufVxuXG5jb25zdCBtYXhUcmlhbmdsZUNvdW50ID0gMTI0OyAvLyBudmlkaWEgcmVjb21tZW5kcyAxMjYsIHJvdW5kZWQgZG93biB0byBhIG11bHRpcGxlIG9mIDRcbmNvbnN0IG1heFZlcnRleENvdW50ID0gNjQ7IC8vIG52aWRpYSByZWNvbW1lbmRzIDY0XG5jb25zdCBjb25lV2VpZ2h0ID0gMC41OyAvLyBzaG91bGQgYmUgMCB1bmxlc3MgY29uZSBjdWxsaW5nIGlzIHVzZWQgZHVyaW5nIHJ1bnRpbWVcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsdXN0ZXJpemVNZXNoKG1lc2g6IE1lc2gsIG9wdGlvbnM/OiBNZXNoQ2x1c3Rlck9wdGlvbnMpOiBQcm9taXNlPE1lc2g+IHtcbiAgICBhd2FpdCB0cnlJbml0TWVzaE9wdCgpO1xuXG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cblxuICAgIC8vICdtZXNoJyBhbmQgJ29wdGlvbnMnIGFyZSBub3QgdXNlZCBpbiB0aGlzIGZ1bmN0aW9uLCBzbyB3ZSBjYW4gcmVtb3ZlIHRoZW1cbiAgICBjb25zdCBzdHJ1Y3QgPSBtZXNoLnN0cnVjdDtcbiAgICBjb25zdCBwcmltaXRpdmVzID0gbWVzaC5zdHJ1Y3QucHJpbWl0aXZlcztcbiAgICBjb25zdCB2ZXJ0ZXhCdW5kbGVzID0gbWVzaC5zdHJ1Y3QudmVydGV4QnVuZGxlcztcbiAgICBjb25zdCBtZXNobGV0czogVWludDhBcnJheVtdID0gW107XG4gICAgY29uc3QgbWVzaGxldFZlcnRpY2VzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgICBjb25zdCBtZXNobGV0VHJpYW5nbGVzOiBVaW50OEFycmF5W10gPSBbXTtcblxuICAgIGxldCBtZXNobGV0c09mZnNldCA9IDA7XG4gICAgbGV0IG1lc2hsZXRWZXJ0aWNlc09mZnNldCA9IDA7XG4gICAgbGV0IG1lc2hsZXRUcmlhbmdsZXNPZmZzZXQgPSAwO1xuXG4gICAgcHJpbWl0aXZlcy5mb3JFYWNoKChwcmltaXRpdmUsIGlkeCkgPT4ge1xuICAgICAgICBpZiAoIXByaW1pdGl2ZS5pbmRleFZpZXcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU3VibWVzaCAke2lkeH0gaGFzIG5vIGluZGV4IGJ1ZmZlciwgbWVzaGxldCBvcHRpbWl6YXRpb24gaXMgbm90IHN1cHBvcnRlZC5gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIGVzdGltYXRlcyBtZXNobGV0IGNvdW50XG4gICAgICAgICAgICBjb25zdCBpbmRleFZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICAgICAgY29uc3QgaW5kZXhDb3VudCA9IGluZGV4Vmlldy5jb3VudDtcbiAgICAgICAgICAgIGNvbnN0IHZlcnRleFZpZXcgPSB2ZXJ0ZXhCdW5kbGVzW3ByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzWzBdXS52aWV3O1xuICAgICAgICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB2ZXJ0ZXhWaWV3LmNvdW50O1xuICAgICAgICAgICAgY29uc3QgbWF4TWVzaGxldENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIuYnVpbGRNZXNoTGV0c0JvdW5kKGluZGV4Q291bnQsIG1heFZlcnRleENvdW50LCBtYXhUcmlhbmdsZUNvdW50KTtcbiAgICAgICAgICAgIC8vIGFsbG9jYXRlcyBtZXNobGV0IGJ1ZmZlciwgdGhlIHR5cGUgaXMgZW5jb2Rlci5NZXNobGV0XG4gICAgICAgICAgICBjb25zdCBtZXNobGV0X2RhdGEgPSBuZXcgVWludDhBcnJheShtYXhNZXNobGV0Q291bnQgKiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIDQgLyogNCBhcmd1bWVudHMgKi8pO1xuICAgICAgICAgICAgY29uc3QgbWVzaGxldF92ZXJ0aWNlcyA9IG5ldyBVaW50OEFycmF5KG1heE1lc2hsZXRDb3VudCAqIG1heFZlcnRleENvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAgICAgY29uc3QgbWVzaGxldF90cmlhbmdsZXMgPSBuZXcgVWludDhBcnJheShcbiAgICAgICAgICAgICAgICBtYXhNZXNobGV0Q291bnQgKiBtYXhUcmlhbmdsZUNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiAzIC8qIHRyaWFuZ2xlcyAqLyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBzY2FuIG1lc2hsZXRcbiAgICAgICAgICAgIGNvbnN0IGF0dHJzID0gdmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1swXV0uYXR0cmlidXRlcztcbiAgICAgICAgICAgIGNvbnN0IGluZGV4T2ZQb3NpdGlvbiA9IGF0dHJzLmZpbmRJbmRleCgoYXR0cikgPT4gYXR0ci5uYW1lID09PSBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OKTtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uT2Zmc2V0ID0gZ2V0T2Zmc2V0KGF0dHJzLCBpbmRleE9mUG9zaXRpb24pO1xuICAgICAgICAgICAgY29uc3QgdmVydGV4QnVmZmVyQXRQb3MgPSBuZXcgVWludDhBcnJheShcbiAgICAgICAgICAgICAgICBtZXNoLmRhdGEuYnVmZmVyLFxuICAgICAgICAgICAgICAgIHZlcnRleFZpZXcub2Zmc2V0ICsgcG9zaXRpb25PZmZzZXQsXG4gICAgICAgICAgICAgICAgdmVydGV4Vmlldy5sZW5ndGggLSBwb3NpdGlvbk9mZnNldCxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGxldCBtZXNobGV0Q291bnQgPSAwO1xuICAgICAgICAgICAgaWYgKGluZGV4Vmlldy5zdHJpZGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAvLyEhIHN1cHBvcnQgMzJiaXQgaW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleEJ1ZmZlcjMyID0gbmV3IFVpbnQzMkFycmF5KG1lc2guZGF0YS5idWZmZXIsIGluZGV4Vmlldy5vZmZzZXQsIGluZGV4Q291bnQpO1xuICAgICAgICAgICAgICAgIC8vIG1lc2hsZXRDb3VudCA9IGVuY29kZXIub3B0aW1pemVyLmJ1aWxkTWVzaExldHNTY2FuKG1lc2hsZXRfZGF0YSwgbWVzaGxldF92ZXJ0aWNlcywgbWVzaGxldF90cmlhbmdsZXMsIGluZGV4QnVmZmVyMzIsIGluZGV4Q291bnQsIHZlcnRleENvdW50LCBtYXhWZXJ0ZXhDb3VudCwgbWF4VHJpYW5nbGVDb3VudCk7XG4gICAgICAgICAgICAgICAgbWVzaGxldENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIuYnVpbGRNZXNoTGV0cyhcbiAgICAgICAgICAgICAgICAgICAgbWVzaGxldF9kYXRhIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIG1lc2hsZXRfdmVydGljZXMgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgbWVzaGxldF90cmlhbmdsZXMgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhCdWZmZXIzMiBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBpbmRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXJBdFBvcyBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4Vmlldy5zdHJpZGUsXG4gICAgICAgICAgICAgICAgICAgIG1heFZlcnRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICBtYXhUcmlhbmdsZUNvdW50LFxuICAgICAgICAgICAgICAgICAgICBjb25lV2VpZ2h0LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluZGV4Vmlldy5zdHJpZGUgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAvLyEhIDE2IGJpdCBpbmRleFxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4QnVmZmVyMTYgPSBuZXcgVWludDE2QXJyYXkobWVzaC5kYXRhLmJ1ZmZlciwgaW5kZXhWaWV3Lm9mZnNldCwgaW5kZXhDb3VudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXhCdWZmZXIzMiA9IG5ldyBVaW50MzJBcnJheShpbmRleENvdW50KTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGV4Q291bnQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleEJ1ZmZlcjMyW2ldID0gaW5kZXhCdWZmZXIxNltpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gbWVzaGxldENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIuYnVpbGRNZXNoTGV0c1NjYW4obWVzaGxldF9kYXRhLCBtZXNobGV0X3ZlcnRpY2VzLCBtZXNobGV0X3RyaWFuZ2xlcywgaW5kZXhCdWZmZXIzMiwgaW5kZXhDb3VudCwgdmVydGV4Q291bnQsIG1heFZlcnRleENvdW50LCBtYXhUcmlhbmdsZUNvdW50KTtcbiAgICAgICAgICAgICAgICBtZXNobGV0Q291bnQgPSBlbmNvZGVyLm9wdGltaXplci5idWlsZE1lc2hMZXRzKFxuICAgICAgICAgICAgICAgICAgICBtZXNobGV0X2RhdGEgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgbWVzaGxldF92ZXJ0aWNlcyBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBtZXNobGV0X3RyaWFuZ2xlcyBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBpbmRleEJ1ZmZlcjMyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRleEJ1ZmZlckF0UG9zIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhWaWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICAgICAgbWF4VmVydGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgIG1heFRyaWFuZ2xlQ291bnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmVXZWlnaHQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBTdWJtZXNoICR7aWR4fSBoYXMgdW5zdXBwb3J0ZWQgaW5kZXggc3RyaWRlLCBtZXNobGV0IG9wdGltaXphdGlvbiBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IHNob3VsZCBzaHJpbmsgbWVzaGxldCBidWZmZXIgc2l6ZVxuICAgICAgICAgICAgLy8gY2FsY3VsYXRlIG1lc2hsZXQgY29uZSBjbHVzdGVyXG4gICAgICAgICAgICBpZiAob3B0aW9ucz8uY29uZUNsdXN0ZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBpbXBsZW1lbnQgY29uZSBjbHVzdGVyLCBjb25lIGNsdXN0ZXIgc2hvdWxkIGJlIGNvbnN0cnVjdGVkIGluIGEgYnVmZmVyXG4gICAgICAgICAgICAgICAgY29uc3QgY29uZVNpemUgPSA0ODsgLy8gMTIgKyA0ICsgMTIgKyAxMiArIDQgKyAzICsgMVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmVCdWZmZXIgPSBuZXcgVWludDhBcnJheShjb25lU2l6ZSAqIG1lc2hsZXRDb3VudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4T2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmlhbmdsZU9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNobGV0Q291bnQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBtZXNobGV0VmVydGljZXNWaWV3ID0gbmV3IFVpbnQ4QXJyYXkobWVzaGxldF92ZXJ0aWNlcy5idWZmZXIsIHZlcnRleE9mZnNldCApO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBib3VuZCA9IGVuY29kZXIub3B0aW1pemVyLmNvbXB1dGVNZXNoTGV0c0JvdW5kKG1lc2hsZXRfdmVydGljZXMsIG1lc2hsZXRfdHJpYW5nbGVzLCBpLCB2ZXJ0ZXhDb3VudCwgdmVydGV4Vmlldy5zdHJpZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWVzaGxldHMucHVzaChtZXNobGV0X2RhdGEpO1xuICAgICAgICAgICAgbWVzaGxldFZlcnRpY2VzLnB1c2gobWVzaGxldF92ZXJ0aWNlcyk7XG4gICAgICAgICAgICBtZXNobGV0VHJpYW5nbGVzLnB1c2gobWVzaGxldF90cmlhbmdsZXMpO1xuXG4gICAgICAgICAgICBtZXNobGV0c09mZnNldCArPSBtZXNobGV0X2RhdGEuYnl0ZUxlbmd0aDtcbiAgICAgICAgICAgIG1lc2hsZXRWZXJ0aWNlc09mZnNldCArPSBtZXNobGV0X3ZlcnRpY2VzLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgICBtZXNobGV0VHJpYW5nbGVzT2Zmc2V0ICs9IG1lc2hsZXRfdHJpYW5nbGVzLmJ5dGVMZW5ndGg7XG5cbiAgICAgICAgICAgIHByaW1pdGl2ZS5jbHVzdGVyID0ge1xuICAgICAgICAgICAgICAgIGNsdXN0ZXJWaWV3OiB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWVzaGxldHNPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogbWVzaGxldF9kYXRhLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiBtZXNobGV0Q291bnQsXG4gICAgICAgICAgICAgICAgICAgIHN0cmlkZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiA0LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmVydGV4Vmlldzoge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1lc2hsZXRWZXJ0aWNlc09mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBtZXNobGV0X3ZlcnRpY2VzLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiB2ZXJ0ZXhDb3VudCwgLy8gVE9ETyBmaXhcbiAgICAgICAgICAgICAgICAgICAgc3RyaWRlOiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRyaWFuZ2xlVmlldzoge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1lc2hsZXRUcmlhbmdsZXNPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogbWVzaGxldF90cmlhbmdsZXMuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGluZGV4Q291bnQsIC8vIFRPRE8gZml4XG4gICAgICAgICAgICAgICAgICAgIHN0cmlkZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiAzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU3VibWVzaCAke2lkeH0gaGFzIG1vcmUgdGhhbiBvbmUgdmVydGV4IGJ1bmRsZSwgY2FjaGUgb3B0aW1pemF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFN1Ym1lc2ggJHtpZHh9IGhhcyBubyB2ZXJ0ZXggYnVuZGxlLCBjYWNoZSBvcHRpbWl6YXRpb24gaXMgbm90IHN1cHBvcnRlZC5gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKG1lc2hsZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc3VtbWFyeSBtZXNobGV0IGJ1ZmZlciBzaXplXG4gICAgICAgIGNvbnN0IG1lc2hsZXREYXRhU2l6ZSA9IG1lc2hsZXRzLnJlZHVjZSgoYWNjLCBjdXIpID0+IGFjYyArIGN1ci5ieXRlTGVuZ3RoLCAwKTtcbiAgICAgICAgY29uc3QgbWVzaGxldFZlcnRpY2VzU2l6ZSA9IG1lc2hsZXRWZXJ0aWNlcy5yZWR1Y2UoKGFjYywgY3VyKSA9PiBhY2MgKyBjdXIuYnl0ZUxlbmd0aCwgMCk7XG4gICAgICAgIGNvbnN0IG1lc2hsZXRUcmlhbmdsZXNTaXplID0gbWVzaGxldFRyaWFuZ2xlcy5yZWR1Y2UoKGFjYywgY3VyKSA9PiBhY2MgKyBjdXIuYnl0ZUxlbmd0aCwgMCk7XG5cbiAgICAgICAgLy8gYWxsb2NhdGVzIG5ldyBtZXNoIGJ1ZmZlclxuICAgICAgICBjb25zdCBuZXdNZXNoRGF0YSA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5ieXRlTGVuZ3RoICsgbWVzaGxldERhdGFTaXplICsgbWVzaGxldFZlcnRpY2VzU2l6ZSArIG1lc2hsZXRUcmlhbmdsZXNTaXplKTtcbiAgICAgICAgLy8gY29weSBvcmlnaW5hbCBtZXNoIGRhdGFcbiAgICAgICAgbmV3TWVzaERhdGEuc2V0KG1lc2guZGF0YSk7XG4gICAgICAgIC8vIGNvcHkgbWVzaGxldCBkYXRhXG4gICAgICAgIGxldCBvZmZzZXQgPSBtZXNoLmRhdGEuYnl0ZUxlbmd0aDtcbiAgICAgICAgbWVzaGxldHMuZm9yRWFjaCgobWVzaGxldCkgPT4ge1xuICAgICAgICAgICAgbmV3TWVzaERhdGEuc2V0KG1lc2hsZXQsIG9mZnNldCk7XG4gICAgICAgICAgICBvZmZzZXQgKz0gbWVzaGxldC5ieXRlTGVuZ3RoO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29weSBtZXNobGV0IHZlcnRpY2VzXG4gICAgICAgIG1lc2hsZXRWZXJ0aWNlcy5mb3JFYWNoKChtZXNobGV0KSA9PiB7XG4gICAgICAgICAgICBuZXdNZXNoRGF0YS5zZXQobWVzaGxldCwgb2Zmc2V0KTtcbiAgICAgICAgICAgIG9mZnNldCArPSBtZXNobGV0LmJ5dGVMZW5ndGg7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb3B5IG1lc2hsZXQgdHJpYW5nbGVzXG4gICAgICAgIG1lc2hsZXRUcmlhbmdsZXMuZm9yRWFjaCgobWVzaGxldCkgPT4ge1xuICAgICAgICAgICAgbmV3TWVzaERhdGEuc2V0KG1lc2hsZXQsIG9mZnNldCk7XG4gICAgICAgICAgICBvZmZzZXQgKz0gbWVzaGxldC5ieXRlTGVuZ3RoO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gY3JlYXRlIG5ldyBidWZmZXJWaWV3cyBmb3IgbWVzaGxldCBkYXRhXG4gICAgICAgIHByaW1pdGl2ZXMuZm9yRWFjaCgocHJpbWl0aXZlLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGlmIChwcmltaXRpdmUuY2x1c3Rlcikge1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZS5jbHVzdGVyLmNsdXN0ZXJWaWV3Lm9mZnNldCArPSBtZXNoLmRhdGEuYnl0ZUxlbmd0aDtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmUuY2x1c3Rlci52ZXJ0ZXhWaWV3Lm9mZnNldCArPSBtZXNoLmRhdGEuYnl0ZUxlbmd0aCArIG1lc2hsZXREYXRhU2l6ZTtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmUuY2x1c3Rlci50cmlhbmdsZVZpZXcub2Zmc2V0ICs9IG1lc2guZGF0YS5ieXRlTGVuZ3RoICsgbWVzaGxldERhdGFTaXplICsgbWVzaGxldFZlcnRpY2VzU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbmV3TWVzaCA9IG5ldyBNZXNoKCk7XG5cbiAgICAgICAgbmV3TWVzaC5yZXNldCh7XG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBkYXRhOiBuZXdNZXNoRGF0YSxcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld01lc2guc3RydWN0LmNsdXN0ZXIgPSB0cnVlO1xuICAgICAgICBjb25zdCBoYXNoID0gbmV3TWVzaC5oYXNoO1xuXG4gICAgICAgIHJldHVybiBuZXdNZXNoO1xuICAgIH1cblxuICAgIHJldHVybiBtZXNoOyAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIG1lc2ggZm9yIG5vd1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFNpbXBsaWZ5T3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBlbmFibGU6IHRydWUsXG4gICAgICAgIHRhcmdldFJhdGlvOiAwLjUsXG4gICAgICAgIGF1dG9FcnJvclJhdGlvOiB0cnVlLFxuICAgICAgICBsb2NrQm91bmRhcnk6IHRydWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNpbXBsaWZ5TWVzaChtZXNoOiBNZXNoLCBvcHRpb25zPzogTWVzaFNpbXBsaWZ5T3B0aW9ucyk6IFByb21pc2U8TWVzaD4ge1xuICAgIGF3YWl0IHRyeUluaXRNZXNoT3B0KCk7XG5cbiAgICBpZiAoIShvcHRpb25zICYmIG9wdGlvbnMudGFyZ2V0UmF0aW8pKSB7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cblxuICAgIGNvbnN0IHN1aXRhYmxlID0gbWVzaC5zdHJ1Y3QucHJpbWl0aXZlcy5ldmVyeSgocHJpbWl0aXZlKSA9PiB7XG4gICAgICAgIHJldHVybiBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gZ2Z4LlByaW1pdGl2ZU1vZGUuVFJJQU5HTEVfTElTVCB8fCBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gZ2Z4LlByaW1pdGl2ZU1vZGUuUE9JTlRfTElTVDtcbiAgICB9KTtcblxuICAgIGlmICghc3VpdGFibGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdPbmx5IHRyaWFuZ2xlIGxpc3QgYW5kIHBvaW50IGxpc3QgYXJlIHN1cHBvcnRlZC4nKTtcbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfVxuXG4gICAgaWYgKG1lc2guc3RydWN0LmNvbXByZXNzZWQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdDb21wcmVzc2VkIG1lc2ggaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfVxuXG4gICAgaWYgKG1lc2guc3RydWN0LmNsdXN0ZXIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdNZXNoIGNsdXN0ZXIgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfVxuXG4gICAgaWYgKG1lc2guc3RydWN0LnF1YW50aXplZCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1F1YW50aXplZCBtZXNoIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cblxuICAgIGNvbnN0IHNpbXBsaWZ5X29wdGlvbiA9IG9wdGlvbnMubG9ja0JvdW5kYXJ5ID8gMSA6IDA7XG4gICAgY29uc3QgdGFyZ2V0X3JhdGlvID0gb3B0aW9ucy50YXJnZXRSYXRpbztcbiAgICBjb25zdCBhdXRvX2Vycm9yX3JhdGUgPSAxLjAgLSBNYXRoLnBvdygwLjksIC1NYXRoLmxvZzEwKHRhcmdldF9yYXRpbykpO1xuICAgIGNvbnN0IHRhcmdldF9lcnJvciA9IG9wdGlvbnMuYXV0b0Vycm9yUmF0ZSA/IGF1dG9fZXJyb3JfcmF0ZSA6IG9wdGlvbnMuZXJyb3JSYXRlIHx8IGF1dG9fZXJyb3JfcmF0ZTtcblxuICAgIGNvbnN0IGJ1ZmZlckJsb2IgPSBuZXcgQnVmZmVyQmxvYigpO1xuICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudCgwKTtcblxuICAgIC8vIHBlciBwcmltaXRpdmVcbiAgICBjb25zdCBzdHJ1Y3QgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1lc2guc3RydWN0KSkgYXMgTWVzaC5JU3RydWN0O1xuICAgIGNvbnN0IHByaW1pdGl2ZXMgPSBzdHJ1Y3QucHJpbWl0aXZlcztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzW2ldO1xuICAgICAgICBpZiAocHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgPT09IGdmeC5QcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QgJiYgcHJpbWl0aXZlLmluZGV4Vmlldykge1xuICAgICAgICAgICAgLy8gISBmb3IgcHJpbWl0aXZlIHdpdGhvdXQgaW5kZXggYnVmZmVyLCB3ZSBzaG91bGQgZ2VuZXJhdGUgb25lXG4gICAgICAgICAgICBjb25zdCBpbmRleFZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICAgICAgbGV0IGluZGV4QnVmZmVyO1xuICAgICAgICAgICAgbGV0IG5ld0luZGV4ID0gbmV3IFVpbnQ4QXJyYXkoaW5kZXhWaWV3LmNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAgICAgbGV0IGluZGV4Q291bnQgPSBpbmRleFZpZXcuY291bnQ7XG4gICAgICAgICAgICBpZiAoaW5kZXhWaWV3LnN0cmlkZSA9PT0gMikge1xuICAgICAgICAgICAgICAgIGluZGV4QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkobmV3SW5kZXguYnVmZmVyLCAwLCBpbmRleFZpZXcuY291bnQgKiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXhCdWZmZXIxNiA9IG5ldyBVaW50MTZBcnJheShtZXNoLmRhdGEuYnVmZmVyLCBpbmRleFZpZXcub2Zmc2V0LCBpbmRleFZpZXcuY291bnQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4QnVmZmVyMzIgPSBuZXcgVWludDMyQXJyYXkoaW5kZXhCdWZmZXIuYnVmZmVyLCAwLCBpbmRleFZpZXcuY291bnQpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5kZXhWaWV3LmNvdW50OyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhCdWZmZXIzMltqXSA9IGluZGV4QnVmZmVyMTZbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleFZpZXcuc3RyaWRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaW5kZXhCdWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCBpbmRleFZpZXcub2Zmc2V0LCBpbmRleFZpZXcuY291bnQgKiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgU3VibWVzaCAke2l9IGhhcyB1bnN1cHBvcnRlZCBpbmRleCBzdHJpZGUsIHNpbXBsaWZ5IG9wdGltaXphdGlvbiBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgICAgICAgICAgICAgIHJldHVybiBtZXNoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbkJ1bmRsZUluZGV4ID0gcHJpbWl0aXZlLnZlcnRleEJ1bmRlbEluZGljZXMuZmluZEluZGV4KChidW5kbGVJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZSA9IHN0cnVjdC52ZXJ0ZXhCdW5kbGVzW2J1bmRsZUluZGV4XTtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0gYnVuZGxlLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zSW5kZXggPSBhdHRyaWJ1dGVzLmZpbmRJbmRleCgoYXR0cikgPT4gYXR0ci5uYW1lID09PSBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocG9zaXRpb25CdW5kbGVJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIHBvc2l0aW9uIGF0dHJpYnV0ZSBmb3VuZCwgc2ltcGxpZnkgb3B0aW1pemF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHByb2NlZWQgdG8gc2ltcGxpZnlcbiAgICAgICAgICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1twb3NpdGlvbkJ1bmRsZUluZGV4XV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBidW5kbGUuYXR0cmlidXRlcztcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NJbmRleCA9IGF0dHJpYnV0ZXMuZmluZEluZGV4KChhdHRyKSA9PiBhdHRyLm5hbWUgPT09IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfUE9TSVRJT04pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uT2Zmc2V0ID0gZ2V0T2Zmc2V0KGF0dHJpYnV0ZXMsIHBvc0luZGV4KTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldF9pbmRleF9jb3VudCA9IE1hdGguZmxvb3IoKGluZGV4Vmlldy5jb3VudCAqIHRhcmdldF9yYXRpbykgLyAzKSAqIDM7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0X2Vycm9yID0gMDtcbiAgICAgICAgICAgICAgICBpbmRleENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIuc2ltcGxpZnkoXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4QnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4Vmlldy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLnN1YmFycmF5KHBvc2l0aW9uT2Zmc2V0KSBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0X2luZGV4X2NvdW50LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRfZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgIHNpbXBsaWZ5X29wdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0X2Vycm9yLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgbmV3SW5kZXggPSBuZXcgVWludDhBcnJheShuZXdJbmRleC5idWZmZXIsIDAsIGluZGV4Q291bnQgKiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCk7IC8vIHNocmluayBidWZmZXIgc2l6ZVxuICAgICAgICAgICAgICAgIC8vIG9wdGltaXplIHZlcnRleCBmZXRjaFxuICAgICAgICAgICAgICAgIGlmIChwcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2ltcGxlIG9wdGltaXphdGlvblxuICAgICAgICAgICAgICAgICAgICBsZXQgdmVydGV4Q291bnQgPSBpbmRleENvdW50IDwgdmlldy5jb3VudCA/IGluZGV4Q291bnQgOiB2aWV3LmNvdW50O1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGVzdFZlcnRleEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHZpZXcuY291bnQgKiB2aWV3LnN0cmlkZSk7XG4gICAgICAgICAgICAgICAgICAgIHZlcnRleENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIub3B0aW1pemVWZXJ0ZXhGZXRjaChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RWZXJ0ZXhCdWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zdHJpZGUsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGRlc3RWZXJ0ZXhCdWZmZXIgPSBuZXcgVWludDhBcnJheShkZXN0VmVydGV4QnVmZmVyLmJ1ZmZlciwgMCwgdmVydGV4Q291bnQgKiB2aWV3LnN0cmlkZSk7IC8vIHNocmluayBidWZmZXIgc2l6ZVxuICAgICAgICAgICAgICAgICAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQodmlldy5zdHJpZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBkZXN0VmVydGV4QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdmVydGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpZGU6IHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBidW5kbGUudmlldyA9IG5ld1ZpZXc7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKGRlc3RWZXJ0ZXhCdWZmZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbWFwQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoaW5kZXhDb3VudCAqIFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG90YWxWZXJ0ZXggPSBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVZlcnRleEZldGNoUmVtYXAoXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1hcEJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVJlbWFwSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Q291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1hcEJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1tqXV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gYnVuZGxlLnZpZXc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodG90YWxWZXJ0ZXggKiB2aWV3LnN0cmlkZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVyLm9wdGltaXplci5vcHRpbWl6ZVJlbWFwVmVydGV4KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0J1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsVmVydGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFwQnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KHZpZXcuc3RyaWRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ZpZXc6IE1lc2guSUJ1ZmZlclZpZXcgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogbmV3QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRvdGFsVmVydGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmlkZTogdmlldy5zdHJpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIobmV3QnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGR1bXAgbmV3IGluZGV4IGJ1ZmZlclxuICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0luZGV4VmlldzogTWVzaC5JQnVmZmVyVmlldyA9IHtcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBuZXdJbmRleC5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgICAgIGNvdW50OiBpbmRleENvdW50LFxuICAgICAgICAgICAgICAgIHN0cmlkZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcHJpbWl0aXZlLmluZGV4VmlldyA9IG5ld0luZGV4VmlldztcbiAgICAgICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKG5ld0luZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gZ2Z4LlByaW1pdGl2ZU1vZGUuUE9JTlRfTElTVCkge1xuICAgICAgICAgICAgaWYgKHByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZSA9IHN0cnVjdC52ZXJ0ZXhCdW5kbGVzW3ByaW1pdGl2ZS52ZXJ0ZXhCdW5kZWxJbmRpY2VzWzBdXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gYnVuZGxlLnZpZXc7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IGJ1bmRsZS5hdHRyaWJ1dGVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc0luZGV4ID0gYXR0cmlidXRlcy5maW5kSW5kZXgoKGF0dHIpID0+IGF0dHIubmFtZSA9PT0gZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9QT1NJVElPTik7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zaXRpb25PZmZzZXQgPSBnZXRPZmZzZXQoYXR0cmlidXRlcywgcG9zSW5kZXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRfdmVydGV4X2NvdW50ID0gTWF0aC5mbG9vcigodmlldy5jb3VudCAqIHRhcmdldF9yYXRpbykgLyAzKSAqIDM7XG4gICAgICAgICAgICAgICAgbGV0IGRlc3RCdWZmZXIgPSBuZXcgVWludDhBcnJheSh0YXJnZXRfdmVydGV4X2NvdW50ICogdmlldy5zdHJpZGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gZW5jb2Rlci5vcHRpbWl6ZXIuc2ltcGxpZnlQb2ludHMoXG4gICAgICAgICAgICAgICAgICAgIGRlc3RCdWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLnN1YmFycmF5KHBvc2l0aW9uT2Zmc2V0KSBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0X3ZlcnRleF9jb3VudCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGRlc3RCdWZmZXIgPSBuZXcgVWludDhBcnJheShkZXN0QnVmZmVyLmJ1ZmZlciwgMCwgdmVydGV4Q291bnQgKiB2aWV3LnN0cmlkZSk7IC8vIHNocmluayBidWZmZXIgc2l6ZVxuICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudCh2aWV3LnN0cmlkZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VmlldzogTWVzaC5JQnVmZmVyVmlldyA9IHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGRlc3RCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IHZlcnRleENvdW50LFxuICAgICAgICAgICAgICAgICAgICBzdHJpZGU6IHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKGRlc3RCdWZmZXIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBTdWJtZXNoICR7aX0gaGFzIG1vcmUgdGhhbiBvbmUgdmVydGV4IGJ1bmRsZSwgd2hpY2ggaXMgbm90IHN1cHBvcnRlZC5gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQsIHNob3VsZCBqdXN0IGR1bXBcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJpbWl0aXZlLnZlcnRleEJ1bmRlbEluZGljZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1twcmltaXRpdmUudmVydGV4QnVuZGVsSW5kaWNlc1tqXV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KHZpZXcuc3RyaWRlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogYnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICBzdHJpZGU6IHZpZXcuc3RyaWRlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICAgICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKGJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJpbWl0aXZlLmluZGV4Vmlldykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogYnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgICAgICAgICBzdHJpZGU6IFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcHJpbWl0aXZlLmluZGV4VmlldyA9IG5ld1ZpZXc7XG4gICAgICAgICAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIoYnVmZmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5ld01lc2ggPSBuZXcgTWVzaCgpO1xuICAgIG5ld01lc2gucmVzZXQoe1xuICAgICAgICBzdHJ1Y3QsXG4gICAgICAgIGRhdGE6IGJ1ZmZlckJsb2IuZ2V0Q29tYmluZWQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBoYXNoID0gbmV3TWVzaC5oYXNoO1xuXG4gICAgcmV0dXJuIG5ld01lc2g7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc01lc2gobWVzaDogTWVzaCwgb3B0aW9ucz86IE1lc2hDb21wcmVzc09wdGlvbnMpOiBQcm9taXNlPE1lc2g+IHtcbiAgICBhd2FpdCB0cnlJbml0TWVzaE9wdCgpO1xuXG4gICAgLy8gJ21lc2gnIGFuZCAnb3B0aW9ucycgYXJlIG5vdCB1c2VkIGluIHRoaXMgZnVuY3Rpb24sIHNvIHdlIGNhbiByZW1vdmUgdGhlbVxuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBjb25zb2xlLndhcm4oJ01lc2ggY29tcHJlc3Npb24gaXMgbm90IGVuYWJsZWQsIG9yaWdpbmFsIG1lc2ggd2lsbCBiZSByZXR1cm5lZC4nKTtcbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnM/LnF1YW50aXplKSB7XG4gICAgICAgIG1lc2ggPSBhd2FpdCBxdWFudGl6ZU1lc2gobWVzaCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnM/LmVuY29kZSkge1xuICAgICAgICBtZXNoID0gYXdhaXQgZW5jb2RlTWVzaChtZXNoKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucz8uY29tcHJlc3MpIHtcbiAgICAgICAgbWVzaCA9IGF3YWl0IGRlZmxhdGVNZXNoKG1lc2gpO1xuICAgIH1cblxuICAgIHJldHVybiBtZXNoOyAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIG1lc2ggZm9yIG5vd1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jb2RlTWVzaChtZXNoOiBNZXNoKTogUHJvbWlzZTxNZXNoPiB7XG4gICAgYXdhaXQgdHJ5SW5pdE1lc2hPcHQoKTtcblxuICAgIGlmIChtZXNoLnN0cnVjdC5lbmNvZGVkKSB7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cblxuICAgIGNvbnN0IHN0cnVjdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWVzaC5zdHJ1Y3QpKSBhcyBNZXNoLklTdHJ1Y3Q7XG5cbiAgICBjb25zdCBidWZmZXJCbG9iID0gbmV3IEJ1ZmZlckJsb2IoKTtcbiAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQoMCk7XG5cbiAgICBmb3IgKGNvbnN0IGJ1bmRsZSBvZiBzdHJ1Y3QudmVydGV4QnVuZGxlcykge1xuICAgICAgICBjb25zdCB2aWV3ID0gYnVuZGxlLnZpZXc7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGJvdW5kID0gZW5jb2Rlci5vcHRpbWl6ZXIuZW5jb2RlVmVydGV4QnVmZmVyQm91bmQodmlldy5jb3VudCwgdmlldy5zdHJpZGUpO1xuICAgICAgICBsZXQgZGVzdEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJvdW5kKTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gZW5jb2Rlci5vcHRpbWl6ZXIuZW5jb2RlVmVydGV4QnVmZmVyKFxuICAgICAgICAgICAgZGVzdEJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgYm91bmQsXG4gICAgICAgICAgICBidWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgIHZpZXcuY291bnQsXG4gICAgICAgICAgICB2aWV3LnN0cmlkZSxcbiAgICAgICAgKTtcbiAgICAgICAgZGVzdEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGRlc3RCdWZmZXIuYnVmZmVyLCAwLCBsZW5ndGgpO1xuXG4gICAgICAgIGJ1ZmZlckJsb2Iuc2V0TmV4dEFsaWdubWVudCh2aWV3LnN0cmlkZSk7XG4gICAgICAgIGNvbnN0IG5ld1ZpZXc6IE1lc2guSUJ1ZmZlclZpZXcgPSB7XG4gICAgICAgICAgICBvZmZzZXQ6IGJ1ZmZlckJsb2IuZ2V0TGVuZ3RoKCksXG4gICAgICAgICAgICBsZW5ndGg6IGRlc3RCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgc3RyaWRlOiB2aWV3LnN0cmlkZSxcbiAgICAgICAgfTtcbiAgICAgICAgYnVuZGxlLnZpZXcgPSBuZXdWaWV3O1xuICAgICAgICBidWZmZXJCbG9iLmFkZEJ1ZmZlcihkZXN0QnVmZmVyKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiBzdHJ1Y3QucHJpbWl0aXZlcykge1xuICAgICAgICBpZiAocHJpbWl0aXZlLmluZGV4VmlldyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICBsZXQgYnVmZmVyOiBVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgICAgICAgLy8gY29udmVydCBpbmRleCB0byAzMmJpdFxuICAgICAgICBpZiAodmlldy5zdHJpZGUgPT09IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4QnVmZmVyMTYgPSBuZXcgVWludDE2QXJyYXkobWVzaC5kYXRhLmJ1ZmZlciwgdmlldy5vZmZzZXQsIHZpZXcuY291bnQpO1xuICAgICAgICAgICAgY29uc3QgaW5kZXhCdWZmZXIzMiA9IG5ldyBVaW50MzJBcnJheSh2aWV3LmNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2aWV3LmNvdW50OyArK2opIHtcbiAgICAgICAgICAgICAgICBpbmRleEJ1ZmZlcjMyW2pdID0gaW5kZXhCdWZmZXIxNltqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGluZGV4QnVmZmVyMzIuYnVmZmVyLCAwLCB2aWV3LmNvdW50ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICB9IGVsc2UgaWYgKHZpZXcuc3RyaWRlID09PSA0KSB7XG4gICAgICAgICAgICBidWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5jb3VudCAqIFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJvdW5kID0gZW5jb2Rlci5vcHRpbWl6ZXIuZW5jb2RlSW5kZXhCdWZmZXJCb3VuZCh2aWV3LmNvdW50LCB2aWV3LmNvdW50KTtcbiAgICAgICAgbGV0IGRlc3RCdWZmZXIgPSBuZXcgVWludDhBcnJheShib3VuZCk7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IGVuY29kZXIub3B0aW1pemVyLmVuY29kZUluZGV4QnVmZmVyKFxuICAgICAgICAgICAgZGVzdEJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgYm91bmQsXG4gICAgICAgICAgICBidWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgIHZpZXcuY291bnQsXG4gICAgICAgICk7XG4gICAgICAgIGRlc3RCdWZmZXIgPSBuZXcgVWludDhBcnJheShkZXN0QnVmZmVyLmJ1ZmZlciwgMCwgbGVuZ3RoKTtcblxuICAgICAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgbGVuZ3RoOiBkZXN0QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICBjb3VudDogdmlldy5jb3VudCxcbiAgICAgICAgICAgIHN0cmlkZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG4gICAgICAgIH07XG4gICAgICAgIHByaW1pdGl2ZS5pbmRleFZpZXcgPSBuZXdWaWV3O1xuICAgICAgICBidWZmZXJCbG9iLmFkZEJ1ZmZlcihkZXN0QnVmZmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdNZXNoID0gbmV3IE1lc2goKTtcbiAgICBuZXdNZXNoLnJlc2V0KHtcbiAgICAgICAgc3RydWN0LFxuICAgICAgICBkYXRhOiBidWZmZXJCbG9iLmdldENvbWJpbmVkKCksXG4gICAgfSk7XG4gICAgbmV3TWVzaC5zdHJ1Y3QuZW5jb2RlZCA9IHRydWU7XG4gICAgY29uc3QgaGFzaCA9IG5ld01lc2guaGFzaDtcblxuICAgIHJldHVybiBuZXdNZXNoO1xufVxuXG5pbnRlcmZhY2UgQXR0cmlidXRlQ29uZmlndXJlIHtcbiAgICBlbnVtOiBudW1iZXI7XG4gICAgc2l6ZTogbnVtYmVyO1xuICAgIGZvcm1hdDogZ2Z4LkZvcm1hdDtcbiAgICBvcmlnaW46IGdmeC5Gb3JtYXQ7XG59XG5cbmNvbnN0IHF1YW50aXplQ29uZmlndXJhdGlvbiA9IG5ldyBNYXA8c3RyaW5nLCBBdHRyaWJ1dGVDb25maWd1cmU+KFtcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9QT1NJVElPTiwgeyBlbnVtOiAwLCBzaXplOiA2LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkdCMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkdCMzJGIH1dLCAvLyA4IGZvciBwb3NpdGlvblxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX05PUk1BTCwgeyBlbnVtOiAxLCBzaXplOiA2LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkdCMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkdCMzJGIH1dLCAvLyA0IGZvciBub3JtYWxcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9UQU5HRU5ULCB7IGVudW06IDIsIHNpemU6IDgsIGZvcm1hdDogZ2Z4LkZvcm1hdC5SR0JBMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkdCQTMyRiB9XSwgLy8gNCBmb3IgdGFuZ2VudFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX0JJVEFOR0VOVCwgeyBlbnVtOiAyLCBzaXplOiA4LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkdCQTE2Riwgb3JpZ2luOiBnZnguRm9ybWF0LlJHQkEzMkYgfV0sIC8vIDQgZm9yIHRhbmdlbnRcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9DT0xPUiwgeyBlbnVtOiAzLCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkdCQTgsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SR0JBMzJGIH1dLCAvLyA0IGZvciBjb2xvciwgMWIgZWFjaCBjaGFubmVsXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQ09MT1IxLCB7IGVudW06IDMsIHNpemU6IDQsIGZvcm1hdDogZ2Z4LkZvcm1hdC5SR0JBOCwgb3JpZ2luOiBnZnguRm9ybWF0LlJHQkEzMkYgfV0sIC8vIDQgZm9yIGpvaW50cyxcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9DT0xPUjIsIHsgZW51bTogMywgc2l6ZTogNCwgZm9ybWF0OiBnZnguRm9ybWF0LlJHQkE4LCBvcmlnaW46IGdmeC5Gb3JtYXQuUkdCQTMyRiB9XSwgLy8gNCBmb3Igam9pbnRzLFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX0pPSU5UUywgeyBlbnVtOiA0LCBzaXplOiAxNiwgZm9ybWF0OiBnZnguRm9ybWF0LlJHQkEzMkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SR0JBMzJGIH1dLCAvLyA0IGZvciBqb2ludHMsXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfV0VJR0hUUywgeyBlbnVtOiA1LCBzaXplOiAxNiwgZm9ybWF0OiBnZnguRm9ybWF0LlJHQkEzMkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SR0JBMzJGIH1dLCAvLyA0IGZvciB3ZWlnaHRzLFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX1RFWF9DT09SRCwgeyBlbnVtOiA2LCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkcxNkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SRzMyRiB9XSwgLy8gNCBmb3IgdXYsIDJiIGVhY2ggY2hhbm5lbFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX1RFWF9DT09SRDEsIHsgZW51bTogNiwgc2l6ZTogNCwgZm9ybWF0OiBnZnguRm9ybWF0LlJHMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkczMkYgfV0sIC8vIDQgZm9yIHV2MSwgMmIgZWFjaCBjaGFubmVsXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEMiwgeyBlbnVtOiA2LCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkcxNkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SRzMyRiB9XSwgLy8gNCBmb3IgdXYyLCAyYiBlYWNoIGNoYW5uZWxcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9URVhfQ09PUkQzLCB7IGVudW06IDYsIHNpemU6IDQsIGZvcm1hdDogZ2Z4LkZvcm1hdC5SRzE2Riwgb3JpZ2luOiBnZnguRm9ybWF0LlJHMzJGIH1dLCAvLyA0IGZvciB1djMsIDJiIGVhY2ggY2hhbm5lbFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX1RFWF9DT09SRDQsIHsgZW51bTogNiwgc2l6ZTogNCwgZm9ybWF0OiBnZnguRm9ybWF0LlJHMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkczMkYgfV0sIC8vIDQgZm9yIHV2NCwgMmIgZWFjaCBjaGFubmVsXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JENSwgeyBlbnVtOiA2LCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkcxNkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SRzMyRiB9XSwgLy8gNCBmb3IgdXY1LCAyYiBlYWNoIGNoYW5uZWxcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9URVhfQ09PUkQ2LCB7IGVudW06IDYsIHNpemU6IDQsIGZvcm1hdDogZ2Z4LkZvcm1hdC5SRzE2Riwgb3JpZ2luOiBnZnguRm9ybWF0LlJHMzJGIH1dLCAvLyA0IGZvciB1djYsIDJiIGVhY2ggY2hhbm5lbFxuICAgIFtnZnguQXR0cmlidXRlTmFtZS5BVFRSX1RFWF9DT09SRDcsIHsgZW51bTogNiwgc2l6ZTogNCwgZm9ybWF0OiBnZnguRm9ybWF0LlJHMTZGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkczMkYgfV0sIC8vIDQgZm9yIHV2NywgMmIgZWFjaCBjaGFubmVsXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEOCwgeyBlbnVtOiA2LCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkcxNkYsIG9yaWdpbjogZ2Z4LkZvcm1hdC5SRzMyRiB9XSwgLy8gNCBmb3IgdXY4LCAyYiBlYWNoIGNoYW5uZWxcbiAgICBbZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9CQVRDSF9JRCwgeyBlbnVtOiA3LCBzaXplOiA0LCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUjMyRiwgb3JpZ2luOiBnZnguRm9ybWF0LlIzMkYgfV0sIC8vIDQgZm9yIGJhdGNoIGlkXG4gICAgW2dmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQkFUQ0hfVVYsIHsgZW51bTogOCwgc2l6ZTogOCwgZm9ybWF0OiBnZnguRm9ybWF0LlJHMzJGLCBvcmlnaW46IGdmeC5Gb3JtYXQuUkczMkYgfV0sIC8vIDQgZm9yIGJhdGNoIHV2XG5dKTtcblxuZnVuY3Rpb24gcXVhbnRpemVTaXplKGF0dHJpYnV0ZXM6IGdmeC5BdHRyaWJ1dGVbXSk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHNpemUgPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyaWJ1dGUubmFtZTtcbiAgICAgICAgY29uc3QgY29uZiA9IHF1YW50aXplQ29uZmlndXJhdGlvbi5nZXQobmFtZSk7XG4gICAgICAgIGlmIChjb25mICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNpemUgKz0gY29uZi5zaXplO1xuICAgICAgICAgICAgaWYgKGNvbmYub3JpZ2luICE9PSBhdHRyaWJ1dGUuZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBBdHRyaWJ1dGUgJHtuYW1lfSBoYXMgZGlmZmVyZW50IGZvcm1hdCBmcm9tIG9yaWdpbiwgcXVhbnRpemF0aW9uIG1heSBub3Qgd29yay5gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXR0cmlidXRlLmZvcm1hdCA9IGNvbmYuZm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEF0dHJpYnV0ZSAke25hbWV9IGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHF1YW50aXphdGlvbi5gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpemU7XG59XG5cbmZ1bmN0aW9uIG1hcEF0dHJpYnV0ZShhdHRyaWJ1dGVzOiBnZnguQXR0cmlidXRlW10pOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXMubWFwKChhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgICBjb25zdCBjb25mID0gcXVhbnRpemVDb25maWd1cmF0aW9uLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGNvbmYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQXR0cmlidXRlICR7bmFtZX0gaXMgbm90IHN1cHBvcnRlZCBmb3IgcXVhbnRpemF0aW9uLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25mIS5lbnVtO1xuICAgIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVhbnRpemVNZXNoKG1lc2g6IE1lc2gpOiBQcm9taXNlPE1lc2g+IHtcbiAgICBpZiAobWVzaC5zdHJ1Y3QucXVhbnRpemVkKSB7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXJCbG9iID0gbmV3IEJ1ZmZlckJsb2IoKTtcbiAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQoMCk7XG5cbiAgICBjb25zdCBzdHJ1Y3QgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1lc2guc3RydWN0KSkgYXMgTWVzaC5JU3RydWN0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJ1Y3QudmVydGV4QnVuZGxlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBidW5kbGUgPSBzdHJ1Y3QudmVydGV4QnVuZGxlc1tpXTtcbiAgICAgICAgY29uc3QgdmlldyA9IGJ1bmRsZS52aWV3O1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShidW5kbGUuYXR0cmlidXRlcykpIGFzIGdmeC5BdHRyaWJ1dGVbXTtcbiAgICAgICAgY29uc3QgcXVhbnRpemVkU2l6ZSA9IHF1YW50aXplU2l6ZShhdHRyaWJ1dGVzKTtcbiAgICAgICAgaWYgKCFxdWFudGl6ZWRTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVzaDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1lc2guZGF0YS5idWZmZXIsIHZpZXcub2Zmc2V0LCB2aWV3Lmxlbmd0aCk7XG5cbiAgICAgICAgY29uc3QgYXR0ckVudW1zID0gbWFwQXR0cmlidXRlKGF0dHJpYnV0ZXMpO1xuICAgICAgICBjb25zdCBuZXdCdWZmZXIgPSBuZXcgVWludDhBcnJheShxdWFudGl6ZWRTaXplICogdmlldy5jb3VudCk7XG4gICAgICAgIGVuY29kZXIub3B0aW1pemVyLnF1YW50aXplTWVzaChcbiAgICAgICAgICAgIG5ld0J1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgbmV3QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgIHZpZXcuY291bnQsXG4gICAgICAgICAgICB2aWV3LnN0cmlkZSxcbiAgICAgICAgICAgIFVpbnQzMkFycmF5LmZyb20oYXR0ckVudW1zKSBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgYXR0ckVudW1zLmxlbmd0aCxcbiAgICAgICAgKTtcbiAgICAgICAgYnVmZmVyQmxvYi5zZXROZXh0QWxpZ25tZW50KHF1YW50aXplZFNpemUpO1xuICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgbGVuZ3RoOiBuZXdCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgc3RyaWRlOiBxdWFudGl6ZWRTaXplLFxuICAgICAgICB9O1xuICAgICAgICBidW5kbGUudmlldyA9IG5ld1ZpZXc7XG4gICAgICAgIGJ1bmRsZS5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICAgICAgYnVmZmVyQmxvYi5hZGRCdWZmZXIobmV3QnVmZmVyKTtcbiAgICB9XG5cbiAgICAvLyBkdW1wIGluZGV4IGJ1ZmZlclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RydWN0LnByaW1pdGl2ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlID0gc3RydWN0LnByaW1pdGl2ZXNbaV07XG4gICAgICAgIGlmIChwcmltaXRpdmUuaW5kZXhWaWV3ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZpZXcgPSBwcmltaXRpdmUuaW5kZXhWaWV3O1xuICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShtZXNoLmRhdGEuYnVmZmVyLCB2aWV3Lm9mZnNldCwgdmlldy5sZW5ndGgpO1xuICAgICAgICBidWZmZXJCbG9iLnNldE5leHRBbGlnbm1lbnQodmlldy5zdHJpZGUpO1xuICAgICAgICBjb25zdCBuZXdWaWV3OiBNZXNoLklCdWZmZXJWaWV3ID0ge1xuICAgICAgICAgICAgb2Zmc2V0OiBidWZmZXJCbG9iLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgbGVuZ3RoOiBidWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgIGNvdW50OiB2aWV3LmNvdW50LFxuICAgICAgICAgICAgc3RyaWRlOiB2aWV3LnN0cmlkZSxcbiAgICAgICAgfTtcbiAgICAgICAgcHJpbWl0aXZlLmluZGV4VmlldyA9IG5ld1ZpZXc7XG4gICAgICAgIGJ1ZmZlckJsb2IuYWRkQnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3TWVzaCA9IG5ldyBNZXNoKCk7XG4gICAgbmV3TWVzaC5yZXNldCh7XG4gICAgICAgIHN0cnVjdCxcbiAgICAgICAgZGF0YTogYnVmZmVyQmxvYi5nZXRDb21iaW5lZCgpLFxuICAgIH0pO1xuICAgIG5ld01lc2guc3RydWN0LnF1YW50aXplZCA9IHRydWU7XG4gICAgY29uc3QgaGFzaCA9IG5ld01lc2guaGFzaDtcblxuICAgIHJldHVybiBuZXdNZXNoO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVmbGF0ZU1lc2gobWVzaDogTWVzaCk6IFByb21pc2U8TWVzaD4ge1xuICAgIGlmIChtZXNoLnN0cnVjdC5jb21wcmVzc2VkKSB7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXByZXNzKGJ1ZmZlcjogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICAgICAgICBjb25zdCBjb21wcmVzc2VkID0gemxpYi5kZWZsYXRlU3luYyhidWZmZXIpO1xuICAgICAgICByZXR1cm4gY29tcHJlc3NlZCBhcyBVaW50OEFycmF5O1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSBjb21wcmVzcyhtZXNoLmRhdGEpO1xuICAgIGNvbnN0IHN0cnVjdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWVzaC5zdHJ1Y3QpKTtcblxuICAgIHN0cnVjdC5jb21wcmVzc2VkID0gdHJ1ZTtcblxuICAgIGNvbnN0IG5ld01lc2ggPSBuZXcgTWVzaCgpO1xuICAgIG5ld01lc2gucmVzZXQoe1xuICAgICAgICBzdHJ1Y3QsXG4gICAgICAgIGRhdGEsXG4gICAgfSk7XG4gICAgY29uc3QgaGFzaCA9IG5ld01lc2guaGFzaDtcblxuICAgIHJldHVybiBuZXdNZXNoO1xufVxuIl19