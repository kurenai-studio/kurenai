"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeDracoGeometry = decodeDracoGeometry;
const draco3dgltf_1 = __importDefault(require("draco3dgltf"));
const decoderModule = draco3dgltf_1.default.createDecoderModule({});
function decodeDracoGeometry(options) {
    const decoder = new decoderModule.Decoder();
    const decoded = decodeDracoData(options.buffer, decoder, options);
    decoderModule.destroy(decoder);
    return decoded;
}
function decodeDracoData(buffer, decoder, options) {
    const decoderBuffer = new decoderModule.DecoderBuffer();
    decoderBuffer.Init(new Int8Array(buffer), buffer.byteLength);
    const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);
    let dracoGeometry;
    let decodingStatus;
    switch (geometryType) {
        case decoderModule.TRIANGULAR_MESH:
            dracoGeometry = new decoderModule.Mesh();
            decodingStatus = decoder.DecodeBufferToMesh(decoderBuffer, dracoGeometry);
            break;
        case decoderModule.POINT_CLOUD:
            dracoGeometry = new decoderModule.PointCloud();
            decodingStatus = decoder.DecodeBufferToPointCloud(decoderBuffer, dracoGeometry);
            break;
        default:
            throw new Error(`Unknown geometry type ${geometryType}.`);
    }
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
        throw new Error(`Decoding failed: ${decodingStatus.error_msg()}`);
    }
    const vertices = decodeAttributes(dracoGeometry, decoder, options);
    const decoded = {
        vertices,
    };
    if (geometryType === decoderModule.TRIANGULAR_MESH && options.indices) {
        const indices = decodeIndices(dracoGeometry, decoder, options.indices);
        decoded.indices = indices;
    }
    decoderModule.destroy(dracoGeometry);
    decoderModule.destroy(decoderBuffer);
    return decoded;
}
function decodeAttributes(dracoGeometry, decoder, options) {
    const nVertices = dracoGeometry.num_points();
    const vertices = {};
    for (const attributeName of Object.keys(options.attributes)) {
        const { uniqueId, storageConstructor: attributeDataArrayConstructor, components: nComponentsPerAttribute, } = options.attributes[attributeName];
        const nValues = nComponentsPerAttribute * nVertices;
        const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, uniqueId);
        const nActualComponentsPerAttribute = attribute.num_components();
        if (nActualComponentsPerAttribute !== nComponentsPerAttribute) {
            throw new Error(`Decompression error: components-per-attribute of ${attributeName} mismatch.`);
        }
        let attributeData;
        switch (attributeDataArrayConstructor) {
            case Float32Array:
                attributeData = new decoderModule.DracoFloat32Array();
                decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Int8Array:
                attributeData = new decoderModule.DracoInt8Array();
                decoder.GetAttributeInt8ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Int16Array:
                attributeData = new decoderModule.DracoInt16Array();
                decoder.GetAttributeInt16ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Int32Array:
                attributeData = new decoderModule.DracoInt32Array();
                decoder.GetAttributeInt32ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Uint8Array:
                attributeData = new decoderModule.DracoUInt8Array();
                decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Uint16Array:
                attributeData = new decoderModule.DracoUInt16Array();
                decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            case Uint32Array:
                attributeData = new decoderModule.DracoUInt32Array();
                decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, attribute, attributeData);
                break;
            default:
                throw new Error('THREE.DRACOLoader: Unexpected attribute type.');
        }
        const attributeDataSize = attributeData.size();
        if (nValues !== attributeDataSize) {
            throw new Error(`Decompression error: ${attributeName} data size mismatch.`);
        }
        const attributeDataArray = new attributeDataArrayConstructor(nValues);
        for (let i = 0; i < nValues; ++i) {
            attributeDataArray[i] = attributeData.GetValue(i);
        }
        vertices[attributeName] = attributeDataArray;
        decoderModule.destroy(attributeData);
    }
    return vertices;
}
function decodeIndices(dracoMesh, decoder, indicesAccessor) {
    const nFaces = dracoMesh.num_faces();
    const nIndices = 3 * nFaces;
    const indicesConstructor = indicesAccessor;
    const indices = new indicesConstructor(nIndices);
    const dracoInt32Array = new decoderModule.DracoInt32Array();
    for (let iFace = 0; iFace < nFaces; ++iFace) {
        decoder.GetFaceFromMesh(dracoMesh, iFace, dracoInt32Array);
        const index = 3 * iFace;
        indices[index] = dracoInt32Array.GetValue(0);
        indices[index + 1] = dracoInt32Array.GetValue(1);
        indices[index + 2] = dracoInt32Array.GetValue(2);
    }
    decoderModule.destroy(dracoInt32Array);
    return indices;
}
