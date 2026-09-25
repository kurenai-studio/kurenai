"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNormalizer = exports.PPGeometry = void 0;
exports.getGfxAttributeName = getGfxAttributeName;
const cc_1 = require("cc");
function getMergedSetSize(s1, s2) {
    let count = s1.size;
    for (const n of s2) {
        if (!s1.has(n)) {
            count++;
        }
    }
    return count;
}
function mergeSets(s1, s2) {
    const res = new Set();
    for (const n of s1) {
        res.add(n);
    }
    for (const n of s2) {
        res.add(n);
    }
    return res;
}
function isStrictSubSet(dom, sub) {
    for (const n of sub) {
        if (!dom.has(n)) {
            return false;
        }
    }
    return true;
}
/**
 * Post-processing geometry.
 */
class PPGeometry {
    static skinningProcess(originals, disableMeshSplit) {
        const geometries = [];
        const materialIndices = [];
        const capacity = cc_1.pipeline.JOINT_UNIFORM_CAPACITY;
        // split sub-mesh if needed
        for (let i = 0; i < originals.length; i++) {
            const geom = originals[i];
            if (disableMeshSplit || !geom._jointSet || geom._jointSet.size <= capacity) {
                geometries.push(geom);
                materialIndices.push(i);
                continue;
            }
            const joints = geom.getAttribute(PPGeometry.StdSemantics.joints).data;
            const indices = geom._getTriangleIndices();
            const splitInfos = EditorExtends.GeometryUtils.splitBasedOnJoints(joints, indices, geom.primitiveMode, capacity);
            if (!splitInfos.length) {
                geometries.push(geom);
                materialIndices.push(i);
                continue;
            }
            for (const info of splitInfos) {
                const vertexList = Array.from(info.indices.reduce((acc, cur) => acc.add(cur), new Set()).values());
                const indices = new (EditorExtends.GeometryUtils.getUintArrayCtor(vertexList.length))(info.indices.length);
                info.indices.forEach((cur, idx) => (indices[idx] = vertexList.indexOf(cur)));
                const newGeom = new PPGeometry(vertexList.length, info.primitiveMode, indices, info.jointSet);
                geom.forEachAttribute((attribute) => {
                    const { semantic } = attribute;
                    const comp = attribute.components;
                    const data = attribute.data;
                    const newData = new data.constructor(vertexList.length * comp);
                    vertexList.forEach((v, idx) => {
                        for (let i = 0; i < comp; i++) {
                            newData[idx * comp + i] = data[v * comp + i];
                        }
                    });
                    newGeom.setAttribute(semantic, newData, comp, attribute.isNormalized);
                    if (attribute.morphs) {
                        const newAttribute = newGeom.getAttribute(semantic);
                        newAttribute.morphs = new Array(attribute.morphs.length);
                        for (let iTarget = 0; iTarget < attribute.morphs.length; ++iTarget) {
                            const comp = 3; // TODO!!
                            const data = attribute.morphs[iTarget];
                            const newMorphData = new data.constructor(vertexList.length * comp);
                            vertexList.forEach((v, idx) => {
                                for (let i = 0; i < comp; ++i) {
                                    newMorphData[idx * comp + i] = data[v * comp + i];
                                }
                            });
                            newAttribute.morphs[iTarget] = newMorphData;
                        }
                    }
                });
                geometries.push(newGeom);
                materialIndices.push(i);
            }
        }
        // reuse buffer if possible
        const jointSets = geometries.reduce((acc, cur) => (cur._jointSet && acc.push(cur._jointSet), acc), []);
        let hasMergablePair = jointSets.length > 1;
        while (hasMergablePair) {
            hasMergablePair = false;
            let minDist = Infinity;
            let p = -1;
            let q = -1;
            for (let i = 0; i < jointSets.length; i++) {
                const s1 = jointSets[i];
                for (let j = i + 1; j < jointSets.length; j++) {
                    const s2 = jointSets[j];
                    const merged = getMergedSetSize(s1, s2);
                    if (merged <= capacity) {
                        const dist = Math.min(Math.abs(merged - s1.size), Math.abs(merged - s2.size));
                        if (dist < minDist) {
                            hasMergablePair = true;
                            minDist = dist;
                            p = i;
                            q = j;
                        }
                    }
                }
            }
            if (hasMergablePair) {
                const s1 = jointSets[p];
                const s2 = jointSets[q];
                jointSets[p] = mergeSets(s1, s2);
                jointSets[q] = jointSets[jointSets.length - 1];
                if (--jointSets.length <= 1) {
                    break;
                }
                minDist = Infinity;
            }
        }
        let jointMaps = jointSets.map((s) => Array.from(s.values()).sort((a, b) => a - b)); // default is radix sort
        if (!jointMaps.length || jointMaps.every((m) => m.length === 1 && !m[0])) {
            jointMaps = undefined;
        }
        else {
            for (let i = 0; i < geometries.length; i++) {
                const geom = geometries[i];
                const joints = geom._jointSet;
                if (!joints) {
                    continue;
                }
                geom._jointMapIndex = jointSets.findIndex((s) => isStrictSubSet(s, joints));
                // the actual mapping in VB is performed at runtime
            }
        }
        return { geometries, materialIndices, jointMaps };
    }
    get vertexCount() {
        return this._vertexCount;
    }
    get indices() {
        return this._indices;
    }
    get primitiveMode() {
        return this._primitiveMode;
    }
    get jointMapIndex() {
        return this._jointMapIndex;
    }
    _vertexCount;
    _vertices = {};
    _primitiveMode;
    _indices;
    _generatedIndices;
    _jointSet;
    _jointMapIndex;
    constructor(vertexCount, primitiveMode, indices, jointSet) {
        this._vertexCount = vertexCount;
        this._primitiveMode = primitiveMode;
        this._jointSet = jointSet;
        if (indices && indices.BYTES_PER_ELEMENT < Uint16Array.BYTES_PER_ELEMENT) {
            indices = Uint16Array.from(indices); // metal doesn't support uint8 indices
        }
        this._indices = indices;
    }
    calculateNormals(storageConstructor = Float32Array) {
        const positions = this._assertAttribute(PPGeometry.StdSemantics.position).data;
        const indices = this._getTriangleIndices();
        const result = new storageConstructor(3 * this._vertexCount);
        return EditorExtends.GeometryUtils.calculateNormals(positions, indices, result);
    }
    calculateTangents(storageConstructor = Float32Array, uvset = 0) {
        const positions = this._assertAttribute(PPGeometry.StdSemantics.position).data;
        const indices = this._getTriangleIndices();
        const normals = this._assertAttribute(PPGeometry.StdSemantics.normal).data;
        const uvs = this._assertAttribute(PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.texcoord, uvset)).data;
        const result = new storageConstructor(4 * this._vertexCount);
        return EditorExtends.GeometryUtils.calculateTangents(positions, indices, normals, uvs, result);
    }
    sanityCheck() {
        if (!this.hasAttribute(PPGeometry.StdSemantics.weights) || !this.hasAttribute(PPGeometry.StdSemantics.joints)) {
            return;
        }
        const weights = this.getAttribute(PPGeometry.StdSemantics.weights);
        const joints = this.getAttribute(PPGeometry.StdSemantics.joints);
        const nVertices = this.vertexCount;
        // convert joints as uint16
        if (joints.data.constructor !== Uint16Array) {
            const newData = new Uint16Array(joints.data.length);
            for (let i = 0; i < newData.length; i++) {
                newData[i] = joints.data[i];
            }
            joints.data = newData;
        }
        // normalize weights
        const [targetSum, offset] = getTargetJointWeightCheckParams(weights.data.constructor);
        for (let iVertex = 0; iVertex < nVertices; ++iVertex) {
            let sum = 0;
            for (let i = 0; i < weights.components; i++) {
                let v = weights.data[weights.components * iVertex + i];
                if (Number.isNaN(v)) {
                    v = weights.data[weights.components * iVertex + i] = targetSum - offset;
                }
                sum += v + offset;
            }
            if (sum !== targetSum && sum !== 0) {
                if (targetSum === 1) {
                    // floating point arithmetics
                    for (let i = 0; i < weights.components; i++) {
                        weights.data[weights.components * iVertex + i] *= targetSum / sum;
                    }
                }
                else {
                    // quantized, need dithering
                    const weightF = [];
                    for (let i = 0; i < weights.components; i++) {
                        weightF.push((weights.data[weights.components * iVertex + i] + offset) / sum);
                    }
                    let ditherAcc = 0;
                    for (let i = 0; i < weights.components; i++) {
                        const w = weightF[i];
                        const wi = (0, cc_1.clamp)(Math.floor((w + ditherAcc) * targetSum), 0, targetSum);
                        ditherAcc = w - wi / targetSum;
                        weights.data[weights.components * iVertex + i] = wi - offset;
                    }
                }
            }
        }
        // prepare joints info
        this._jointSet = new Set();
        this._jointSet.add(0);
        for (let iVertex = 0; iVertex < nVertices; ++iVertex) {
            for (let i = 0; i < joints.components; i++) {
                if (weights.data[joints.components * iVertex + i] > 0) {
                    this._jointSet.add(joints.data[joints.components * iVertex + i]);
                }
                else {
                    joints.data[joints.components * iVertex + i] = 0;
                }
            }
        }
    }
    getAttribute(semantic) {
        return this._vertices[semantic];
    }
    hasAttribute(semantic) {
        return semantic in this._vertices;
    }
    deleteAttribute(semantic) {
        delete this._vertices[semantic];
    }
    setAttribute(semantic, data, components, isNormalized) {
        // const isNormalized = getIsNormalized(semantic, data.constructor as PPGeometryTypedArrayConstructor);
        if (isNormalized === undefined) {
            if (data.constructor === Float32Array) {
                isNormalized = false;
            }
            else if (typeof semantic === 'number') {
                switch (PPGeometry.StdSemantics.decode(semantic).semantic0) {
                    case PPGeometry.StdSemantics.texcoord:
                    case PPGeometry.StdSemantics.color:
                    case PPGeometry.StdSemantics.weights:
                        isNormalized = true;
                        break;
                }
            }
        }
        this._vertices[semantic] = new PPGeometry.Attribute(semantic, data, components, isNormalized);
    }
    *attributes() {
        yield* Object.values(this._vertices);
    }
    forEachAttribute(visitor) {
        Object.values(this._vertices).forEach(visitor);
    }
    /**
     * Reduce the max number of joint influence up to 4(one set).
     * Note, this method may result in non-normalized weights.
     */
    reduceJointInfluences() {
        const countSet = (expected) => Object.values(this._vertices).reduce((previous, attribute) => (previous += equalStdSemantic(attribute.semantic, expected) ? 1 : 0), 0);
        const nJointSets = countSet(PPGeometry.StdSemantics.joints);
        if (nJointSets <= 1) {
            return;
        }
        let weightStorageConstructor;
        for (const attribute of Object.values(this._vertices)) {
            if (equalStdSemantic(attribute.semantic, PPGeometry.StdSemantics.weights)) {
                const constructor = attribute.data.constructor;
                if (!weightStorageConstructor) {
                    weightStorageConstructor = constructor;
                }
                else if (weightStorageConstructor !== constructor) {
                    console.error('All weights attribute should be of same component type.');
                    return; // Do not proceed
                }
            }
        }
        if (!weightStorageConstructor) {
            console.error('The number of joints attribute and weights attribute are not matched.');
            return;
        }
        const nMergedComponents = 4;
        const mergedJoints = new Uint16Array(nMergedComponents * this._vertexCount);
        const mergedWeights = new weightStorageConstructor(nMergedComponents * this._vertexCount);
        for (const attribute of Object.values(this._vertices)) {
            if (!PPGeometry.isStdSemantic(attribute.semantic)) {
                continue;
            }
            const { semantic0, set } = PPGeometry.StdSemantics.decode(attribute.semantic);
            if (semantic0 !== PPGeometry.StdSemantics.joints) {
                continue;
            }
            const weightSemantic = PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.weights, set);
            if (!(weightSemantic in this._vertices)) {
                console.error(`Vertex attribute joints-${set} has no corresponding weights attribute`);
                continue;
            }
            const joints = attribute;
            const weights = this._vertices[weightSemantic].data;
            const nInputComponents = 4;
            for (let iInputComponent = 0; iInputComponent < nInputComponents; ++iInputComponent) {
                for (let iVertex = 0; iVertex < this._vertexCount; ++iVertex) {
                    const iInput = iVertex * nInputComponents + iInputComponent;
                    const weight = weights[iInput];
                    // Here implies and establishes the promise:
                    // merged weights are sorted in descending order.
                    // So the problem is, insert(and replace) a value into a descending-sorted seq.
                    for (let iReplaceComponent = 0; iReplaceComponent < nMergedComponents; ++iReplaceComponent) {
                        const iReplace = iVertex * nMergedComponents + iReplaceComponent;
                        if (weight >= mergedWeights[iReplace]) {
                            const iReplaceLast = (iVertex + 1) * nMergedComponents - 1;
                            for (let i = iReplaceLast - 1; i >= iReplace; --i) {
                                mergedWeights[i + 1] = mergedWeights[i];
                                mergedJoints[i + 1] = mergedJoints[i];
                            }
                            mergedWeights[iReplace] = weight;
                            mergedJoints[iReplace] = joints.data[iInput];
                            break;
                        }
                    }
                }
            }
            this.deleteAttribute(attribute.semantic);
            this.deleteAttribute(weightSemantic);
        }
        for (let iVertex = 0; iVertex < this._vertexCount; ++iVertex) {
            let sum = 0.0;
            for (let iComponent = 0; iComponent < nMergedComponents; ++iComponent) {
                sum += mergedWeights[nMergedComponents * iVertex + iComponent];
            }
            if (sum !== 0.0) {
                for (let iComponent = 0; iComponent < nMergedComponents; ++iComponent) {
                    mergedWeights[nMergedComponents * iVertex + iComponent] /= sum;
                }
            }
        }
        this.setAttribute(PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.joints, 0), mergedJoints, nMergedComponents);
        this.setAttribute(PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.weights, 0), mergedWeights, nMergedComponents);
    }
    _getTriangleIndices() {
        if (this._primitiveMode !== cc_1.gfx.PrimitiveMode.TRIANGLE_LIST) {
            throw new Error('Triangles expected.');
        }
        return (this._indices ||
            this._generatedIndices ||
            (this._generatedIndices = (() => {
                const ctor = this._vertexCount >= 1 << (Uint16Array.BYTES_PER_ELEMENT * 8) ? Uint32Array : Uint16Array;
                const indices = new ctor(this._vertexCount);
                for (let i = 0; i < this._vertexCount; ++i) {
                    indices[i] = i;
                }
                return indices;
            })()));
    }
    _assertAttribute(semantic) {
        if (!this.hasAttribute(semantic)) {
            let semanticRep;
            if (!PPGeometry.isStdSemantic(semantic)) {
                semanticRep = semantic;
            }
            else {
                const { semantic0, set } = PPGeometry.StdSemantics.decode(semantic);
                semanticRep = `${PPGeometry.StdSemantics[semantic0]}`;
                if (set !== 0) {
                    semanticRep += `(set ${set})`;
                }
            }
            throw new Error(`${semanticRep} attribute is expect but not present`);
        }
        else {
            return this.getAttribute(semantic);
        }
    }
}
exports.PPGeometry = PPGeometry;
// returns [ targetSum, offset ]
function getTargetJointWeightCheckParams(ctor) {
    switch (ctor) {
        case Int8Array:
            return [0xff, 0x80];
        case Uint8Array:
            return [0xff, 0];
        case Int16Array:
            return [0xffff, 0x8000];
        case Uint16Array:
            return [0xffff, 0];
        case Int32Array:
            return [0xffffffff, 0x80000000];
        case Uint32Array:
            return [0xffffffff, 0];
        case Float32Array:
            return [1, 0];
    }
    return [1, 0];
}
(function (PPGeometry) {
    let StdSemantics;
    (function (StdSemantics) {
        StdSemantics[StdSemantics["position"] = 0] = "position";
        StdSemantics[StdSemantics["normal"] = 1] = "normal";
        StdSemantics[StdSemantics["texcoord"] = 2] = "texcoord";
        StdSemantics[StdSemantics["tangent"] = 3] = "tangent";
        StdSemantics[StdSemantics["joints"] = 4] = "joints";
        StdSemantics[StdSemantics["weights"] = 5] = "weights";
        StdSemantics[StdSemantics["color"] = 6] = "color";
    })(StdSemantics = PPGeometry.StdSemantics || (PPGeometry.StdSemantics = {}));
    (function (StdSemantics) {
        function set(semantic, set) {
            return (set << 4) + semantic;
        }
        StdSemantics.set = set;
        function decode(semantic) {
            return {
                semantic0: (semantic & 0xf),
                set: semantic >> 4,
            };
        }
        StdSemantics.decode = decode;
    })(StdSemantics = PPGeometry.StdSemantics || (PPGeometry.StdSemantics = {}));
    function isStdSemantic(semantic) {
        return typeof semantic === 'number';
    }
    PPGeometry.isStdSemantic = isStdSemantic;
    class Attribute {
        semantic;
        data;
        components;
        isNormalized;
        morphs = null;
        constructor(semantic, data, components, isNormalized = false) {
            this.semantic = semantic;
            this.data = data;
            this.components = components;
            this.isNormalized = isNormalized;
        }
        getGFXFormat() {
            const map2 = attributeFormatMap.get(this.data.constructor);
            if (map2 !== undefined) {
                if (this.components in map2) {
                    return map2[this.components];
                }
            }
            throw new Error('No corresponding gfx format for attribute.');
        }
    }
    PPGeometry.Attribute = Attribute;
})(PPGeometry || (exports.PPGeometry = PPGeometry = {}));
const stdSemanticInfoMap = {
    [PPGeometry.StdSemantics.position]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_POSITION,
        components: 3,
    },
    [PPGeometry.StdSemantics.normal]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_NORMAL,
        components: 3,
    },
    [PPGeometry.StdSemantics.texcoord]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_TEX_COORD,
        components: 2,
        multisets: {
            1: cc_1.gfx.AttributeName.ATTR_TEX_COORD1,
            2: cc_1.gfx.AttributeName.ATTR_TEX_COORD2,
            3: cc_1.gfx.AttributeName.ATTR_TEX_COORD3,
            4: cc_1.gfx.AttributeName.ATTR_TEX_COORD4,
            5: cc_1.gfx.AttributeName.ATTR_TEX_COORD5,
            6: cc_1.gfx.AttributeName.ATTR_TEX_COORD6,
            7: cc_1.gfx.AttributeName.ATTR_TEX_COORD7,
            8: cc_1.gfx.AttributeName.ATTR_TEX_COORD8,
        },
    },
    [PPGeometry.StdSemantics.tangent]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_TANGENT,
        components: 4,
    },
    [PPGeometry.StdSemantics.joints]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_JOINTS,
        components: 4,
    },
    [PPGeometry.StdSemantics.weights]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_WEIGHTS,
        components: 4,
    },
    [PPGeometry.StdSemantics.color]: {
        gfxAttributeName: cc_1.gfx.AttributeName.ATTR_COLOR,
        components: [3, 4],
    },
};
const attributeFormatMap = new Map([
    [
        Int8Array,
        {
            1: cc_1.gfx.Format.R8SN,
            2: cc_1.gfx.Format.RG8SN,
            3: cc_1.gfx.Format.RGB8SN,
            4: cc_1.gfx.Format.RGBA8SN,
        },
    ],
    [
        Uint8Array,
        {
            1: cc_1.gfx.Format.R8,
            2: cc_1.gfx.Format.RG8,
            3: cc_1.gfx.Format.RGB8,
            4: cc_1.gfx.Format.RGBA8,
        },
    ],
    [
        Int16Array,
        {
            1: cc_1.gfx.Format.R16I,
            2: cc_1.gfx.Format.RG16I,
            3: cc_1.gfx.Format.RGB16I,
            4: cc_1.gfx.Format.RGBA16I,
        },
    ],
    [
        Uint16Array,
        {
            1: cc_1.gfx.Format.R16UI,
            2: cc_1.gfx.Format.RG16UI,
            3: cc_1.gfx.Format.RGB16UI,
            4: cc_1.gfx.Format.RGBA16UI,
        },
    ],
    [
        Int32Array,
        {
            1: cc_1.gfx.Format.R32I,
            2: cc_1.gfx.Format.RG32I,
            3: cc_1.gfx.Format.RGB32I,
            4: cc_1.gfx.Format.RGBA32I,
        },
    ],
    [
        Uint32Array,
        {
            1: cc_1.gfx.Format.R32UI,
            2: cc_1.gfx.Format.RG32UI,
            3: cc_1.gfx.Format.RGB32UI,
            4: cc_1.gfx.Format.RGBA32UI,
        },
    ],
    [
        Float32Array,
        {
            1: cc_1.gfx.Format.R32F,
            2: cc_1.gfx.Format.RG32F,
            3: cc_1.gfx.Format.RGB32F,
            4: cc_1.gfx.Format.RGBA32F,
        },
    ],
]);
/**
 * @returns The corresponding GFX attribute name.
 * @throws If the attribute **is standard semantic** but is not a valid GFX attribute name:
 * - It has a different number of component which is not permitted.
 * - Its set count beyond how many that kind of GFX attributes can proceed.
 */
function getGfxAttributeName(attribute) {
    const { semantic } = attribute;
    let gfxAttributeName;
    if (!PPGeometry.isStdSemantic(semantic)) {
        gfxAttributeName = semantic;
    }
    else {
        // Validate standard semantic.
        const { semantic0, set } = PPGeometry.StdSemantics.decode(semantic);
        const semanticInfo = stdSemanticInfoMap[semantic0];
        if (!(Array.isArray(semanticInfo.components)
            ? semanticInfo.components.includes(attribute.components)
            : semanticInfo.components === attribute.components)) {
            throw new Error(`Mismatched ${PPGeometry.StdSemantics[semantic0]} components, expect ${semanticInfo.components}.`);
        }
        if (set === 0) {
            gfxAttributeName = semanticInfo.gfxAttributeName;
        }
        else if (semanticInfo.multisets && set in semanticInfo.multisets) {
            gfxAttributeName = semanticInfo.multisets[set];
        }
        else {
            throw new Error(`${PPGeometry.StdSemantics[semantic0]} doesn't allow set ${set}.`);
        }
    }
    return gfxAttributeName;
}
/**
 * Get the normalizer which normalize the integers of specified type array
 * into [0, 1](for unsigned integers) or [-1, 1](for signed integers).
 * The normalization is performed as described in:
 * https://www.khronos.org/opengl/wiki/Normalized_Integer
 * @returns The normalizer, or `undefined` if no corresponding normalizer.
 */
exports.getNormalizer = (() => {
    const U8_MAX = 2 ** 8 - 1;
    const U16_MAX = 2 ** 16 - 1;
    const U32_MAX = 2 ** 32 - 1;
    const I8_MAX = 2 ** (8 - 1) - 1;
    const I16_MAX = 2 ** (16 - 1) - 1;
    const I32_MAX = 2 ** (32 - 1) - 1;
    const u8 = (value) => value / U8_MAX;
    const u16 = (value) => value / U16_MAX;
    const u32 = (value) => value / U32_MAX;
    const i8 = (value) => Math.max(value / I8_MAX, -1);
    const i16 = (value) => Math.max(value / I16_MAX, -1);
    const i32 = (value) => Math.max(value / I32_MAX, -1);
    return (typedArray) => {
        switch (true) {
            case typedArray instanceof Int8Array:
                return i8;
            case typedArray instanceof Int16Array:
                return i16;
            case typedArray instanceof Int32Array:
                return i32;
            case typedArray instanceof Uint8Array:
                return u8;
            case typedArray instanceof Uint16Array:
                return u16;
            case typedArray instanceof Uint32Array:
                return u32;
            default:
                return null;
        }
    };
})();
const equalStdSemantic = (semantic, expected) => PPGeometry.isStdSemantic(semantic) && PPGeometry.StdSemantics.decode(semantic).semantic0 === expected;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHAtZ2VvbWV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvdXRpbHMvcHAtZ2VvbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBcW9CQSxrREF5QkM7QUE5cEJELDJCQUEwQztBQXdCMUMsU0FBUyxnQkFBZ0IsQ0FBQyxFQUFlLEVBQUUsRUFBZTtJQUN0RCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3BCLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNiLEtBQUssRUFBRSxDQUFDO1FBQ1osQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBQ0QsU0FBUyxTQUFTLENBQUMsRUFBZSxFQUFFLEVBQWU7SUFDL0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUM5QixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQ2pCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQ0QsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztRQUNqQixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUNELFNBQVMsY0FBYyxDQUFDLEdBQWdCLEVBQUUsR0FBZ0I7SUFDdEQsS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2QsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztJ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TyxHQUFHLENBQUM7WUFDZixLQUFLLFVBQVUsWUFBWSxVQUFVO2dCQUNqQyxPQUFPLEdBQUcsQ0FBQztZQUNmLEtBQUssVUFBVSxZQUFZLFVBQVU7Z0JBQ2pDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsS0FBSyxVQUFVLFlBQVksV0FBVztnQkFDbEMsT0FBTyxHQUFHLENBQUM7WUFDZixLQUFLLFVBQVUsWUFBWSxXQUFXO2dCQUNsQyxPQUFPLEdBQUcsQ0FBQztZQUNmO2dCQUNJLE9BQU8sSUFBSyxDQUFDO1FBQ3JCLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRUwsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFFBQTZCLEVBQUUsUUFBaUMsRUFBRSxFQUFFLENBQzFGLFVBQVUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdmeCwgcGlwZWxpbmUsIGNsYW1wIH0gZnJvbSAnY2MnO1xuXG5kZWNsYXJlIGNvbnN0IEVkaXRvckV4dGVuZHM6IGFueTtcblxuZXhwb3J0IHR5cGUgUFBHZW9tZXRyeVR5cGVkQXJyYXlDb25zdHJ1Y3RvciA9XG4gICAgfCB0eXBlb2YgSW50OEFycmF5XG4gICAgfCB0eXBlb2YgVWludDhBcnJheVxuICAgIHwgdHlwZW9mIEludDE2QXJyYXlcbiAgICB8IHR5cGVvZiBVaW50MTZBcnJheVxuICAgIHwgdHlwZW9mIEludDMyQXJyYXlcbiAgICB8IHR5cGVvZiBVaW50MzJBcnJheVxuICAgIHwgdHlwZW9mIEZsb2F0MzJBcnJheVxuICAgIHwgdHlwZW9mIEZsb2F0NjRBcnJheTtcblxuZXhwb3J0IHR5cGUgUFBHZW9tZXRyeVR5cGVkQXJyYXkgPVxuICAgIHwgSW50OEFycmF5XG4gICAgfCBVaW50OEFycmF5XG4gICAgfCBJbnQxNkFycmF5XG4gICAgfCBVaW50MTZBcnJheVxuICAgIHwgSW50MzJBcnJheVxuICAgIHwgVWludDMyQXJyYXlcbiAgICB8IEZsb2F0MzJBcnJheVxuICAgIHwgRmxvYXQ2NEFycmF5O1xuXG5mdW5jdGlvbiBnZXRNZXJnZWRTZXRTaXplKHMxOiBTZXQ8bnVtYmVyPiwgczI6IFNldDxudW1iZXI+KSB7XG4gICAgbGV0IGNvdW50ID0gczEuc2l6ZTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgczIpIHtcbiAgICAgICAgaWYgKCFzMS5oYXMobikpIHtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvdW50O1xufVxuZnVuY3Rpb24gbWVyZ2VTZXRzKHMxOiBTZXQ8bnVtYmVyPiwgczI6IFNldDxudW1iZXI+KSB7XG4gICAgY29uc3QgcmVzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgZm9yIChjb25zdCBuIG9mIHMxKSB7XG4gICAgICAgIHJlcy5hZGQobik7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbiBvZiBzMikge1xuICAgICAgICByZXMuYWRkKG4pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gaXNTdHJpY3RTdWJTZXQoZG9tOiBTZXQ8bnVtYmVyPiwgc3ViOiBTZXQ8bnVtYmVyPikge1xuICAgIGZvciAoY29uc3QgbiBvZiBzdWIpIHtcbiAgICAgICAgaWYgKCFkb20uaGFzKG4pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUG9zdC1wcm9jZXNzaW5nIGdlb21ldHJ5LlxuICovXG5leHBvcnQgY2xhc3MgUFBHZW9tZXRyeSB7XG4gICAgcHVibGljIHN0YXRpYyBza2lubmluZ1Byb2Nlc3Mob3JpZ2luYWxzOiBQUEdlb21ldHJ5W10sIGRpc2FibGVNZXNoU3BsaXQ6IGJvb2xlYW4gfCB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgZ2VvbWV0cmllczogUFBHZW9tZXRyeVtdID0gW107XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsSW5kaWNlczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgY2FwYWNpdHkgPSBwaXBlbGluZS5KT0lOVF9VTklGT1JNX0NBUEFDSVRZO1xuICAgICAgICAvLyBzcGxpdCBzdWItbWVzaCBpZiBuZWVkZWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcmlnaW5hbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGdlb20gPSBvcmlnaW5hbHNbaV07XG4gICAgICAgICAgICBpZiAoZGlzYWJsZU1lc2hTcGxpdCB8fCAhZ2VvbS5fam9pbnRTZXQgfHwgZ2VvbS5fam9pbnRTZXQuc2l6ZSA8PSBjYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGdlb21ldHJpZXMucHVzaChnZW9tKTtcbiAgICAgICAgICAgICAgICBtYXRlcmlhbEluZGljZXMucHVzaChpKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGpvaW50cyA9IGdlb20uZ2V0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmpvaW50cykuZGF0YTtcbiAgICAgICAgICAgIGNvbnN0IGluZGljZXMgPSBnZW9tLl9nZXRUcmlhbmdsZUluZGljZXMoKTtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0SW5mb3MgPSBFZGl0b3JFeHRlbmRzLkdlb21ldHJ5VXRpbHMuc3BsaXRCYXNlZE9uSm9pbnRzKGpvaW50cywgaW5kaWNlcywgZ2VvbS5wcmltaXRpdmVNb2RlLCBjYXBhY2l0eSk7XG4gICAgICAgICAgICBpZiAoIXNwbGl0SW5mb3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZ2VvbWV0cmllcy5wdXNoKGdlb20pO1xuICAgICAgICAgICAgICAgIG1hdGVyaWFsSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpbmZvIG9mIHNwbGl0SW5mb3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhMaXN0ID0gQXJyYXkuZnJvbShpbmZvLmluZGljZXMucmVkdWNlKChhY2M6IGFueSwgY3VyOiBhbnkpID0+IGFjYy5hZGQoY3VyKSwgbmV3IFNldDxudW1iZXI+KCkpLnZhbHVlcygpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRpY2VzID0gbmV3IChFZGl0b3JFeHRlbmRzLkdlb21ldHJ5VXRpbHMuZ2V0VWludEFycmF5Q3Rvcih2ZXJ0ZXhMaXN0Lmxlbmd0aCkpKGluZm8uaW5kaWNlcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGluZm8uaW5kaWNlcy5mb3JFYWNoKChjdXI6IGFueSwgaWR4OiBhbnkpID0+IChpbmRpY2VzW2lkeF0gPSB2ZXJ0ZXhMaXN0LmluZGV4T2YoY3VyKSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0dlb20gPSBuZXcgUFBHZW9tZXRyeSh2ZXJ0ZXhMaXN0Lmxlbmd0aCwgaW5mby5wcmltaXRpdmVNb2RlLCBpbmRpY2VzLCBpbmZvLmpvaW50U2V0KTtcbiAgICAgICAgICAgICAgICBnZW9tLmZvckVhY2hBdHRyaWJ1dGUoKGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHNlbWFudGljIH0gPSBhdHRyaWJ1dGU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBhdHRyaWJ1dGUuY29tcG9uZW50cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF0dHJpYnV0ZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdEYXRhID0gbmV3IChkYXRhLmNvbnN0cnVjdG9yIGFzIFBQR2VvbWV0cnlUeXBlZEFycmF5Q29uc3RydWN0b3IpKHZlcnRleExpc3QubGVuZ3RoICogY29tcCk7XG4gICAgICAgICAgICAgICAgICAgIHZlcnRleExpc3QuZm9yRWFjaCgodjogYW55LCBpZHg6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRhW2lkeCAqIGNvbXAgKyBpXSA9IGRhdGFbdiAqIGNvbXAgKyBpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0dlb20uc2V0QXR0cmlidXRlKHNlbWFudGljLCBuZXdEYXRhLCBjb21wLCBhdHRyaWJ1dGUuaXNOb3JtYWxpemVkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5tb3JwaHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0F0dHJpYnV0ZSA9IG5ld0dlb20uZ2V0QXR0cmlidXRlKHNlbWFudGljKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZS5tb3JwaHMgPSBuZXcgQXJyYXkoYXR0cmlidXRlLm1vcnBocy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaVRhcmdldCA9IDA7IGlUYXJnZXQgPCBhdHRyaWJ1dGUubW9ycGhzLmxlbmd0aDsgKytpVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcCA9IDM7IC8vIFRPRE8hIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhdHRyaWJ1dGUubW9ycGhzW2lUYXJnZXRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld01vcnBoRGF0YSA9IG5ldyAoZGF0YS5jb25zdHJ1Y3RvciBhcyBQUEdlb21ldHJ5VHlwZWRBcnJheUNvbnN0cnVjdG9yKSh2ZXJ0ZXhMaXN0Lmxlbmd0aCAqIGNvbXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnRleExpc3QuZm9yRWFjaCgodjogYW55LCBpZHg6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXA7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3TW9ycGhEYXRhW2lkeCAqIGNvbXAgKyBpXSA9IGRhdGFbdiAqIGNvbXAgKyBpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZS5tb3JwaHNbaVRhcmdldF0gPSBuZXdNb3JwaERhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBnZW9tZXRyaWVzLnB1c2gobmV3R2VvbSk7XG4gICAgICAgICAgICAgICAgbWF0ZXJpYWxJbmRpY2VzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV1c2UgYnVmZmVyIGlmIHBvc3NpYmxlXG4gICAgICAgIGNvbnN0IGpvaW50U2V0cyA9IGdlb21ldHJpZXMucmVkdWNlKChhY2MsIGN1cikgPT4gKGN1ci5fam9pbnRTZXQgJiYgYWNjLnB1c2goY3VyLl9qb2ludFNldCksIGFjYyksIFtdIGFzIFNldDxudW1iZXI+W10pO1xuICAgICAgICBsZXQgaGFzTWVyZ2FibGVQYWlyID0gam9pbnRTZXRzLmxlbmd0aCA+IDE7XG4gICAgICAgIHdoaWxlIChoYXNNZXJnYWJsZVBhaXIpIHtcbiAgICAgICAgICAgIGhhc01lcmdhYmxlUGFpciA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IG1pbkRpc3QgPSBJbmZpbml0eTtcbiAgICAgICAgICAgIGxldCBwID0gLTE7XG4gICAgICAgICAgICBsZXQgcSA9IC0xO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBqb2ludFNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzMSA9IGpvaW50U2V0c1tpXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBqb2ludFNldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgczIgPSBqb2ludFNldHNbal07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IGdldE1lcmdlZFNldFNpemUoczEsIHMyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lcmdlZCA8PSBjYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IE1hdGgubWluKE1hdGguYWJzKG1lcmdlZCAtIHMxLnNpemUpLCBNYXRoLmFicyhtZXJnZWQgLSBzMi5zaXplKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdCA8IG1pbkRpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNNZXJnYWJsZVBhaXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkRpc3QgPSBkaXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc01lcmdhYmxlUGFpcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMxID0gam9pbnRTZXRzW3BdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHMyID0gam9pbnRTZXRzW3FdO1xuICAgICAgICAgICAgICAgIGpvaW50U2V0c1twXSA9IG1lcmdlU2V0cyhzMSwgczIpO1xuICAgICAgICAgICAgICAgIGpvaW50U2V0c1txXSA9IGpvaW50U2V0c1tqb2ludFNldHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKC0tam9pbnRTZXRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtaW5EaXN0ID0gSW5maW5pdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGpvaW50TWFwcyA9IGpvaW50U2V0cy5tYXAoKHMpID0+IEFycmF5LmZyb20ocy52YWx1ZXMoKSkuc29ydCgoYSwgYikgPT4gYSAtIGIpKTsgLy8gZGVmYXVsdCBpcyByYWRpeCBzb3J0XG4gICAgICAgIGlmICgham9pbnRNYXBzLmxlbmd0aCB8fCBqb2ludE1hcHMuZXZlcnkoKG0pID0+IG0ubGVuZ3RoID09PSAxICYmICFtWzBdKSkge1xuICAgICAgICAgICAgam9pbnRNYXBzID0gdW5kZWZpbmVkITtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdlb20gPSBnZW9tZXRyaWVzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGpvaW50cyA9IGdlb20uX2pvaW50U2V0O1xuICAgICAgICAgICAgICAgIGlmICgham9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnZW9tLl9qb2ludE1hcEluZGV4ID0gam9pbnRTZXRzLmZpbmRJbmRleCgocykgPT4gaXNTdHJpY3RTdWJTZXQocywgam9pbnRzKSk7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGFjdHVhbCBtYXBwaW5nIGluIFZCIGlzIHBlcmZvcm1lZCBhdCBydW50aW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgZ2VvbWV0cmllcywgbWF0ZXJpYWxJbmRpY2VzLCBqb2ludE1hcHMgfTtcbiAgICB9XG5cbiAgICBnZXQgdmVydGV4Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92ZXJ0ZXhDb3VudDtcbiAgICB9XG5cbiAgICBnZXQgaW5kaWNlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luZGljZXM7XG4gICAgfVxuXG4gICAgZ2V0IHByaW1pdGl2ZU1vZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcmltaXRpdmVNb2RlO1xuICAgIH1cblxuICAgIGdldCBqb2ludE1hcEluZGV4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fam9pbnRNYXBJbmRleDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF92ZXJ0ZXhDb3VudDogbnVtYmVyO1xuICAgIHByaXZhdGUgX3ZlcnRpY2VzOiBSZWNvcmQ8c3RyaW5nLCBQUEdlb21ldHJ5LkF0dHJpYnV0ZT4gPSB7fTtcbiAgICBwcml2YXRlIF9wcmltaXRpdmVNb2RlOiBnZnguUHJpbWl0aXZlTW9kZTtcbiAgICBwcml2YXRlIF9pbmRpY2VzPzogUFBHZW9tZXRyeVR5cGVkQXJyYXk7XG4gICAgcHJpdmF0ZSBfZ2VuZXJhdGVkSW5kaWNlcz86IFBQR2VvbWV0cnlUeXBlZEFycmF5O1xuICAgIHByaXZhdGUgX2pvaW50U2V0PzogU2V0PG51bWJlcj47XG4gICAgcHJpdmF0ZSBfam9pbnRNYXBJbmRleD86IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHZlcnRleENvdW50OiBudW1iZXIsIHByaW1pdGl2ZU1vZGU6IGdmeC5QcmltaXRpdmVNb2RlLCBpbmRpY2VzPzogUFBHZW9tZXRyeVR5cGVkQXJyYXksIGpvaW50U2V0PzogU2V0PG51bWJlcj4pIHtcbiAgICAgICAgdGhpcy5fdmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcbiAgICAgICAgdGhpcy5fcHJpbWl0aXZlTW9kZSA9IHByaW1pdGl2ZU1vZGU7XG4gICAgICAgIHRoaXMuX2pvaW50U2V0ID0gam9pbnRTZXQ7XG4gICAgICAgIGlmIChpbmRpY2VzICYmIGluZGljZXMuQllURVNfUEVSX0VMRU1FTlQgPCBVaW50MTZBcnJheS5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgICAgICAgaW5kaWNlcyA9IFVpbnQxNkFycmF5LmZyb20oaW5kaWNlcyk7IC8vIG1ldGFsIGRvZXNuJ3Qgc3VwcG9ydCB1aW50OCBpbmRpY2VzXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5kaWNlcyA9IGluZGljZXM7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGN1bGF0ZU5vcm1hbHMoc3RvcmFnZUNvbnN0cnVjdG9yOiBQUEdlb21ldHJ5VHlwZWRBcnJheUNvbnN0cnVjdG9yID0gRmxvYXQzMkFycmF5KSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IHRoaXMuX2Fzc2VydEF0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5wb3NpdGlvbikuZGF0YTtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuX2dldFRyaWFuZ2xlSW5kaWNlcygpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgc3RvcmFnZUNvbnN0cnVjdG9yKDMgKiB0aGlzLl92ZXJ0ZXhDb3VudCk7XG4gICAgICAgIHJldHVybiBFZGl0b3JFeHRlbmRzLkdlb21ldHJ5VXRpbHMuY2FsY3VsYXRlTm9ybWFscyhwb3NpdGlvbnMsIGluZGljZXMsIHJlc3VsdCkgYXMgUFBHZW9tZXRyeVR5cGVkQXJyYXk7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGN1bGF0ZVRhbmdlbnRzKHN0b3JhZ2VDb25zdHJ1Y3RvcjogUFBHZW9tZXRyeVR5cGVkQXJyYXlDb25zdHJ1Y3RvciA9IEZsb2F0MzJBcnJheSwgdXZzZXQgPSAwKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IHRoaXMuX2Fzc2VydEF0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5wb3NpdGlvbikuZGF0YTtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuX2dldFRyaWFuZ2xlSW5kaWNlcygpO1xuICAgICAgICBjb25zdCBub3JtYWxzID0gdGhpcy5fYXNzZXJ0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLm5vcm1hbCkuZGF0YTtcbiAgICAgICAgY29uc3QgdXZzID0gdGhpcy5fYXNzZXJ0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnNldChQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50ZXhjb29yZCwgdXZzZXQpKS5kYXRhO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgc3RvcmFnZUNvbnN0cnVjdG9yKDQgKiB0aGlzLl92ZXJ0ZXhDb3VudCk7XG4gICAgICAgIHJldHVybiBFZGl0b3JFeHRlbmRzLkdlb21ldHJ5VXRpbHMuY2FsY3VsYXRlVGFuZ2VudHMocG9zaXRpb25zLCBpbmRpY2VzLCBub3JtYWxzLCB1dnMsIHJlc3VsdCkgYXMgUFBHZW9tZXRyeVR5cGVkQXJyYXk7XG4gICAgfVxuXG4gICAgcHVibGljIHNhbml0eUNoZWNrKCkge1xuICAgICAgICBpZiAoIXRoaXMuaGFzQXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLndlaWdodHMpIHx8ICF0aGlzLmhhc0F0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5qb2ludHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2VpZ2h0cyA9IHRoaXMuZ2V0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLndlaWdodHMpO1xuICAgICAgICBjb25zdCBqb2ludHMgPSB0aGlzLmdldEF0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5qb2ludHMpO1xuICAgICAgICBjb25zdCBuVmVydGljZXMgPSB0aGlzLnZlcnRleENvdW50O1xuICAgICAgICAvLyBjb252ZXJ0IGpvaW50cyBhcyB1aW50MTZcbiAgICAgICAgaWYgKGpvaW50cy5kYXRhLmNvbnN0cnVjdG9yICE9PSBVaW50MTZBcnJheSkge1xuICAgICAgICAgICAgY29uc3QgbmV3RGF0YSA9IG5ldyBVaW50MTZBcnJheShqb2ludHMuZGF0YS5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbmV3RGF0YVtpXSA9IGpvaW50cy5kYXRhW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgam9pbnRzLmRhdGEgPSBuZXdEYXRhO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vcm1hbGl6ZSB3ZWlnaHRzXG4gICAgICAgIGNvbnN0IFt0YXJnZXRTdW0sIG9mZnNldF0gPSBnZXRUYXJnZXRKb2ludFdlaWdodENoZWNrUGFyYW1zKHdlaWdodHMuZGF0YS5jb25zdHJ1Y3RvciBhcyBQUEdlb21ldHJ5VHlwZWRBcnJheUNvbnN0cnVjdG9yKTtcbiAgICAgICAgZm9yIChsZXQgaVZlcnRleCA9IDA7IGlWZXJ0ZXggPCBuVmVydGljZXM7ICsraVZlcnRleCkge1xuICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdlaWdodHMuY29tcG9uZW50czsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHYgPSB3ZWlnaHRzLmRhdGFbd2VpZ2h0cy5jb21wb25lbnRzICogaVZlcnRleCArIGldO1xuICAgICAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4odikpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHdlaWdodHMuZGF0YVt3ZWlnaHRzLmNvbXBvbmVudHMgKiBpVmVydGV4ICsgaV0gPSB0YXJnZXRTdW0gLSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN1bSArPSB2ICsgb2Zmc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1bSAhPT0gdGFyZ2V0U3VtICYmIHN1bSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRTdW0gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmxvYXRpbmcgcG9pbnQgYXJpdGhtZXRpY3NcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3ZWlnaHRzLmNvbXBvbmVudHM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0cy5kYXRhW3dlaWdodHMuY29tcG9uZW50cyAqIGlWZXJ0ZXggKyBpXSAqPSB0YXJnZXRTdW0gLyBzdW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBxdWFudGl6ZWQsIG5lZWQgZGl0aGVyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdlaWdodEYgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3ZWlnaHRzLmNvbXBvbmVudHM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0Ri5wdXNoKCh3ZWlnaHRzLmRhdGFbd2VpZ2h0cy5jb21wb25lbnRzICogaVZlcnRleCArIGldICsgb2Zmc2V0KSAvIHN1bSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IGRpdGhlckFjYyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2VpZ2h0cy5jb21wb25lbnRzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHcgPSB3ZWlnaHRGW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2kgPSBjbGFtcChNYXRoLmZsb29yKCh3ICsgZGl0aGVyQWNjKSAqIHRhcmdldFN1bSksIDAsIHRhcmdldFN1bSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXRoZXJBY2MgPSB3IC0gd2kgLyB0YXJnZXRTdW07XG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHRzLmRhdGFbd2VpZ2h0cy5jb21wb25lbnRzICogaVZlcnRleCArIGldID0gd2kgLSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcHJlcGFyZSBqb2ludHMgaW5mb1xuICAgICAgICB0aGlzLl9qb2ludFNldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fam9pbnRTZXQuYWRkKDApO1xuICAgICAgICBmb3IgKGxldCBpVmVydGV4ID0gMDsgaVZlcnRleCA8IG5WZXJ0aWNlczsgKytpVmVydGV4KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGpvaW50cy5jb21wb25lbnRzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAod2VpZ2h0cy5kYXRhW2pvaW50cy5jb21wb25lbnRzICogaVZlcnRleCArIGldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9qb2ludFNldC5hZGQoam9pbnRzLmRhdGFbam9pbnRzLmNvbXBvbmVudHMgKiBpVmVydGV4ICsgaV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGpvaW50cy5kYXRhW2pvaW50cy5jb21wb25lbnRzICogaVZlcnRleCArIGldID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXR0cmlidXRlKHNlbWFudGljOiBQUEdlb21ldHJ5LlNlbWFudGljKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92ZXJ0aWNlc1tzZW1hbnRpY107XG4gICAgfVxuXG4gICAgcHVibGljIGhhc0F0dHJpYnV0ZShzZW1hbnRpYzogUFBHZW9tZXRyeS5TZW1hbnRpYykge1xuICAgICAgICByZXR1cm4gc2VtYW50aWMgaW4gdGhpcy5fdmVydGljZXM7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZUF0dHJpYnV0ZShzZW1hbnRpYzogUFBHZW9tZXRyeS5TZW1hbnRpYykge1xuICAgICAgICBkZWxldGUgdGhpcy5fdmVydGljZXNbc2VtYW50aWNdO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdHRyaWJ1dGUoc2VtYW50aWM6IFBQR2VvbWV0cnkuU2VtYW50aWMsIGRhdGE6IFBQR2VvbWV0cnlUeXBlZEFycmF5LCBjb21wb25lbnRzOiBudW1iZXIsIGlzTm9ybWFsaXplZD86IGJvb2xlYW4pIHtcbiAgICAgICAgLy8gY29uc3QgaXNOb3JtYWxpemVkID0gZ2V0SXNOb3JtYWxpemVkKHNlbWFudGljLCBkYXRhLmNvbnN0cnVjdG9yIGFzIFBQR2VvbWV0cnlUeXBlZEFycmF5Q29uc3RydWN0b3IpO1xuICAgICAgICBpZiAoaXNOb3JtYWxpemVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmNvbnN0cnVjdG9yID09PSBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpc05vcm1hbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbWFudGljID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MuZGVjb2RlKHNlbWFudGljKS5zZW1hbnRpYzApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50ZXhjb29yZDpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5jb2xvcjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy53ZWlnaHRzOlxuICAgICAgICAgICAgICAgICAgICAgICAgaXNOb3JtYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl92ZXJ0aWNlc1tzZW1hbnRpY10gPSBuZXcgUFBHZW9tZXRyeS5BdHRyaWJ1dGUoc2VtYW50aWMsIGRhdGEsIGNvbXBvbmVudHMsIGlzTm9ybWFsaXplZCk7XG4gICAgfVxuXG4gICAgcHVibGljICphdHRyaWJ1dGVzKCkge1xuICAgICAgICB5aWVsZCogT2JqZWN0LnZhbHVlcyh0aGlzLl92ZXJ0aWNlcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGZvckVhY2hBdHRyaWJ1dGUodmlzaXRvcjogKGF0dHJpYnV0ZTogUFBHZW9tZXRyeS5BdHRyaWJ1dGUpID0+IHZvaWQpIHtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0aGlzLl92ZXJ0aWNlcykuZm9yRWFjaCh2aXNpdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWR1Y2UgdGhlIG1heCBudW1iZXIgb2Ygam9pbnQgaW5mbHVlbmNlIHVwIHRvIDQob25lIHNldCkuXG4gICAgICogTm90ZSwgdGhpcyBtZXRob2QgbWF5IHJlc3VsdCBpbiBub24tbm9ybWFsaXplZCB3ZWlnaHRzLlxuICAgICAqL1xuICAgIHB1YmxpYyByZWR1Y2VKb2ludEluZmx1ZW5jZXMoKSB7XG4gICAgICAgIGNvbnN0IGNvdW50U2V0ID0gKGV4cGVjdGVkOiBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcykgPT5cbiAgICAgICAgICAgIE9iamVjdC52YWx1ZXModGhpcy5fdmVydGljZXMpLnJlZHVjZShcbiAgICAgICAgICAgICAgICAocHJldmlvdXMsIGF0dHJpYnV0ZSkgPT4gKHByZXZpb3VzICs9IGVxdWFsU3RkU2VtYW50aWMoYXR0cmlidXRlLnNlbWFudGljLCBleHBlY3RlZCkgPyAxIDogMCksXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgbkpvaW50U2V0cyA9IGNvdW50U2V0KFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmpvaW50cyk7XG4gICAgICAgIGlmIChuSm9pbnRTZXRzIDw9IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB3ZWlnaHRTdG9yYWdlQ29uc3RydWN0b3I6IHVuZGVmaW5lZCB8IFBQR2VvbWV0cnlUeXBlZEFycmF5Q29uc3RydWN0b3I7XG4gICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIE9iamVjdC52YWx1ZXModGhpcy5fdmVydGljZXMpKSB7XG4gICAgICAgICAgICBpZiAoZXF1YWxTdGRTZW1hbnRpYyhhdHRyaWJ1dGUuc2VtYW50aWMsIFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLndlaWdodHMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29uc3RydWN0b3IgPSBhdHRyaWJ1dGUuZGF0YS5jb25zdHJ1Y3RvciBhcyBQUEdlb21ldHJ5VHlwZWRBcnJheUNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIGlmICghd2VpZ2h0U3RvcmFnZUNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodFN0b3JhZ2VDb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAod2VpZ2h0U3RvcmFnZUNvbnN0cnVjdG9yICE9PSBjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBbGwgd2VpZ2h0cyBhdHRyaWJ1dGUgc2hvdWxkIGJlIG9mIHNhbWUgY29tcG9uZW50IHR5cGUuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gRG8gbm90IHByb2NlZWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXdlaWdodFN0b3JhZ2VDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGhlIG51bWJlciBvZiBqb2ludHMgYXR0cmlidXRlIGFuZCB3ZWlnaHRzIGF0dHJpYnV0ZSBhcmUgbm90IG1hdGNoZWQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuTWVyZ2VkQ29tcG9uZW50cyA9IDQ7XG4gICAgICAgIGNvbnN0IG1lcmdlZEpvaW50cyA9IG5ldyBVaW50MTZBcnJheShuTWVyZ2VkQ29tcG9uZW50cyAqIHRoaXMuX3ZlcnRleENvdW50KTtcbiAgICAgICAgY29uc3QgbWVyZ2VkV2VpZ2h0cyA9IG5ldyB3ZWlnaHRTdG9yYWdlQ29uc3RydWN0b3Iobk1lcmdlZENvbXBvbmVudHMgKiB0aGlzLl92ZXJ0ZXhDb3VudCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLl92ZXJ0aWNlcykpIHtcbiAgICAgICAgICAgIGlmICghUFBHZW9tZXRyeS5pc1N0ZFNlbWFudGljKGF0dHJpYnV0ZS5zZW1hbnRpYykpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgc2VtYW50aWMwLCBzZXQgfSA9IFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLmRlY29kZShhdHRyaWJ1dGUuc2VtYW50aWMpO1xuICAgICAgICAgICAgaWYgKHNlbWFudGljMCAhPT0gUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Muam9pbnRzKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHRTZW1hbnRpYyA9IFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnNldChQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy53ZWlnaHRzLCBzZXQpO1xuICAgICAgICAgICAgaWYgKCEod2VpZ2h0U2VtYW50aWMgaW4gdGhpcy5fdmVydGljZXMpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVmVydGV4IGF0dHJpYnV0ZSBqb2ludHMtJHtzZXR9IGhhcyBubyBjb3JyZXNwb25kaW5nIHdlaWdodHMgYXR0cmlidXRlYCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBqb2ludHMgPSBhdHRyaWJ1dGU7XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHRzID0gdGhpcy5fdmVydGljZXNbd2VpZ2h0U2VtYW50aWNdLmRhdGE7XG4gICAgICAgICAgICBjb25zdCBuSW5wdXRDb21wb25lbnRzID0gNDtcbiAgICAgICAgICAgIGZvciAobGV0IGlJbnB1dENvbXBvbmVudCA9IDA7IGlJbnB1dENvbXBvbmVudCA8IG5JbnB1dENvbXBvbmVudHM7ICsraUlucHV0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaVZlcnRleCA9IDA7IGlWZXJ0ZXggPCB0aGlzLl92ZXJ0ZXhDb3VudDsgKytpVmVydGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlJbnB1dCA9IGlWZXJ0ZXggKiBuSW5wdXRDb21wb25lbnRzICsgaUlucHV0Q29tcG9uZW50O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB3ZWlnaHQgPSB3ZWlnaHRzW2lJbnB1dF07XG4gICAgICAgICAgICAgICAgICAgIC8vIEhlcmUgaW1wbGllcyBhbmQgZXN0YWJsaXNoZXMgdGhlIHByb21pc2U6XG4gICAgICAgICAgICAgICAgICAgIC8vIG1lcmdlZCB3ZWlnaHRzIGFyZSBzb3J0ZWQgaW4gZGVzY2VuZGluZyBvcmRlci5cbiAgICAgICAgICAgICAgICAgICAgLy8gU28gdGhlIHByb2JsZW0gaXMsIGluc2VydChhbmQgcmVwbGFjZSkgYSB2YWx1ZSBpbnRvIGEgZGVzY2VuZGluZy1zb3J0ZWQgc2VxLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpUmVwbGFjZUNvbXBvbmVudCA9IDA7IGlSZXBsYWNlQ29tcG9uZW50IDwgbk1lcmdlZENvbXBvbmVudHM7ICsraVJlcGxhY2VDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlSZXBsYWNlID0gaVZlcnRleCAqIG5NZXJnZWRDb21wb25lbnRzICsgaVJlcGxhY2VDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2VpZ2h0ID49IG1lcmdlZFdlaWdodHNbaVJlcGxhY2VdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaVJlcGxhY2VMYXN0ID0gKGlWZXJ0ZXggKyAxKSAqIG5NZXJnZWRDb21wb25lbnRzIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gaVJlcGxhY2VMYXN0IC0gMTsgaSA+PSBpUmVwbGFjZTsgLS1pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlZFdlaWdodHNbaSArIDFdID0gbWVyZ2VkV2VpZ2h0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkSm9pbnRzW2kgKyAxXSA9IG1lcmdlZEpvaW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkV2VpZ2h0c1tpUmVwbGFjZV0gPSB3ZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkSm9pbnRzW2lSZXBsYWNlXSA9IGpvaW50cy5kYXRhW2lJbnB1dF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZGVsZXRlQXR0cmlidXRlKGF0dHJpYnV0ZS5zZW1hbnRpYyk7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZUF0dHJpYnV0ZSh3ZWlnaHRTZW1hbnRpYyk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpVmVydGV4ID0gMDsgaVZlcnRleCA8IHRoaXMuX3ZlcnRleENvdW50OyArK2lWZXJ0ZXgpIHtcbiAgICAgICAgICAgIGxldCBzdW0gPSAwLjA7XG4gICAgICAgICAgICBmb3IgKGxldCBpQ29tcG9uZW50ID0gMDsgaUNvbXBvbmVudCA8IG5NZXJnZWRDb21wb25lbnRzOyArK2lDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdW0gKz0gbWVyZ2VkV2VpZ2h0c1tuTWVyZ2VkQ29tcG9uZW50cyAqIGlWZXJ0ZXggKyBpQ29tcG9uZW50XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdW0gIT09IDAuMCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGlDb21wb25lbnQgPSAwOyBpQ29tcG9uZW50IDwgbk1lcmdlZENvbXBvbmVudHM7ICsraUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRXZWlnaHRzW25NZXJnZWRDb21wb25lbnRzICogaVZlcnRleCArIGlDb21wb25lbnRdIC89IHN1bTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5zZXQoUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Muam9pbnRzLCAwKSwgbWVyZ2VkSm9pbnRzLCBuTWVyZ2VkQ29tcG9uZW50cyk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnNldChQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy53ZWlnaHRzLCAwKSwgbWVyZ2VkV2VpZ2h0cywgbk1lcmdlZENvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFRyaWFuZ2xlSW5kaWNlcygpOiBQUEdlb21ldHJ5VHlwZWRBcnJheSB7XG4gICAgICAgIGlmICh0aGlzLl9wcmltaXRpdmVNb2RlICE9PSBnZnguUHJpbWl0aXZlTW9kZS5UUklBTkdMRV9MSVNUKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyaWFuZ2xlcyBleHBlY3RlZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5faW5kaWNlcyB8fFxuICAgICAgICAgICAgdGhpcy5fZ2VuZXJhdGVkSW5kaWNlcyB8fFxuICAgICAgICAgICAgKHRoaXMuX2dlbmVyYXRlZEluZGljZXMgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLl92ZXJ0ZXhDb3VudCA+PSAxIDw8IChVaW50MTZBcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIDgpID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRpY2VzID0gbmV3IGN0b3IodGhpcy5fdmVydGV4Q291bnQpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdmVydGV4Q291bnQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2ldID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGljZXM7XG4gICAgICAgICAgICB9KSgpKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Fzc2VydEF0dHJpYnV0ZShzZW1hbnRpYzogUFBHZW9tZXRyeS5TZW1hbnRpYykge1xuICAgICAgICBpZiAoIXRoaXMuaGFzQXR0cmlidXRlKHNlbWFudGljKSkge1xuICAgICAgICAgICAgbGV0IHNlbWFudGljUmVwOiBzdHJpbmc7XG4gICAgICAgICAgICBpZiAoIVBQR2VvbWV0cnkuaXNTdGRTZW1hbnRpYyhzZW1hbnRpYykpIHtcbiAgICAgICAgICAgICAgICBzZW1hbnRpY1JlcCA9IHNlbWFudGljO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNlbWFudGljMCwgc2V0IH0gPSBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5kZWNvZGUoc2VtYW50aWMpO1xuICAgICAgICAgICAgICAgIHNlbWFudGljUmVwID0gYCR7UFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Nbc2VtYW50aWMwXX1gO1xuICAgICAgICAgICAgICAgIGlmIChzZXQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VtYW50aWNSZXAgKz0gYChzZXQgJHtzZXR9KWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3NlbWFudGljUmVwfSBhdHRyaWJ1dGUgaXMgZXhwZWN0IGJ1dCBub3QgcHJlc2VudGApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKHNlbWFudGljKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gcmV0dXJucyBbIHRhcmdldFN1bSwgb2Zmc2V0IF1cbmZ1bmN0aW9uIGdldFRhcmdldEpvaW50V2VpZ2h0Q2hlY2tQYXJhbXMoY3RvcjogUFBHZW9tZXRyeVR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHN3aXRjaCAoY3Rvcikge1xuICAgICAgICBjYXNlIEludDhBcnJheTpcbiAgICAgICAgICAgIHJldHVybiBbMHhmZiwgMHg4MF07XG4gICAgICAgIGNhc2UgVWludDhBcnJheTpcbiAgICAgICAgICAgIHJldHVybiBbMHhmZiwgMF07XG4gICAgICAgIGNhc2UgSW50MTZBcnJheTpcbiAgICAgICAgICAgIHJldHVybiBbMHhmZmZmLCAweDgwMDBdO1xuICAgICAgICBjYXNlIFVpbnQxNkFycmF5OlxuICAgICAgICAgICAgcmV0dXJuIFsweGZmZmYsIDBdO1xuICAgICAgICBjYXNlIEludDMyQXJyYXk6XG4gICAgICAgICAgICByZXR1cm4gWzB4ZmZmZmZmZmYsIDB4ODAwMDAwMDBdO1xuICAgICAgICBjYXNlIFVpbnQzMkFycmF5OlxuICAgICAgICAgICAgcmV0dXJuIFsweGZmZmZmZmZmLCAwXTtcbiAgICAgICAgY2FzZSBGbG9hdDMyQXJyYXk6XG4gICAgICAgICAgICByZXR1cm4gWzEsIDBdO1xuICAgIH1cbiAgICByZXR1cm4gWzEsIDBdO1xufVxuXG5leHBvcnQgbmFtZXNwYWNlIFBQR2VvbWV0cnkge1xuICAgIGV4cG9ydCBlbnVtIFN0ZFNlbWFudGljcyB7XG4gICAgICAgIHBvc2l0aW9uLFxuICAgICAgICBub3JtYWwsXG4gICAgICAgIHRleGNvb3JkLFxuICAgICAgICB0YW5nZW50LFxuICAgICAgICBqb2ludHMsXG4gICAgICAgIHdlaWdodHMsXG4gICAgICAgIGNvbG9yLFxuICAgIH1cblxuICAgIGV4cG9ydCBuYW1lc3BhY2UgU3RkU2VtYW50aWNzIHtcbiAgICAgICAgZXhwb3J0IGZ1bmN0aW9uIHNldChzZW1hbnRpYzogU3RkU2VtYW50aWNzLCBzZXQ6IG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIChzZXQgPDwgNCkgKyBzZW1hbnRpYztcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc2VtYW50aWM6IG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzZW1hbnRpYzA6IChzZW1hbnRpYyAmIDB4ZikgYXMgU3RkU2VtYW50aWNzLFxuICAgICAgICAgICAgICAgIHNldDogc2VtYW50aWMgPj4gNCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnQgdHlwZSBTZW1hbnRpYyA9IFN0ZFNlbWFudGljcyB8IG51bWJlciB8IHN0cmluZztcblxuICAgIGV4cG9ydCBmdW5jdGlvbiBpc1N0ZFNlbWFudGljKHNlbWFudGljOiBTZW1hbnRpYyk6IHNlbWFudGljIGlzIFN0ZFNlbWFudGljcyB8IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygc2VtYW50aWMgPT09ICdudW1iZXInO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBBdHRyaWJ1dGUge1xuICAgICAgICBwdWJsaWMgc2VtYW50aWM6IFBQR2VvbWV0cnkuU2VtYW50aWM7XG4gICAgICAgIHB1YmxpYyBkYXRhOiBQUEdlb21ldHJ5VHlwZWRBcnJheTtcbiAgICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcjtcbiAgICAgICAgcHVibGljIGlzTm9ybWFsaXplZDogYm9vbGVhbjtcbiAgICAgICAgcHVibGljIG1vcnBoczogUFBHZW9tZXRyeVR5cGVkQXJyYXlbXSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHNlbWFudGljOiBQUEdlb21ldHJ5LlNlbWFudGljLCBkYXRhOiBQUEdlb21ldHJ5VHlwZWRBcnJheSwgY29tcG9uZW50czogbnVtYmVyLCBpc05vcm1hbGl6ZWQgPSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zZW1hbnRpYyA9IHNlbWFudGljO1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50cyA9IGNvbXBvbmVudHM7XG4gICAgICAgICAgICB0aGlzLmlzTm9ybWFsaXplZCA9IGlzTm9ybWFsaXplZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXRHRlhGb3JtYXQoKSB7XG4gICAgICAgICAgICBjb25zdCBtYXAyID0gYXR0cmlidXRlRm9ybWF0TWFwLmdldCh0aGlzLmRhdGEuY29uc3RydWN0b3IgYXMgUFBHZW9tZXRyeVR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgICBpZiAobWFwMiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50cyBpbiBtYXAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXAyW3RoaXMuY29tcG9uZW50c107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBjb3JyZXNwb25kaW5nIGdmeCBmb3JtYXQgZm9yIGF0dHJpYnV0ZS4nKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3Qgc3RkU2VtYW50aWNJbmZvTWFwOiBSZWNvcmQ8XG4gICAgUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MsXG4gICAge1xuICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lOiBzdHJpbmc7XG4gICAgICAgIGNvbXBvbmVudHM6IG51bWJlciB8IG51bWJlcltdO1xuICAgICAgICBtdWx0aXNldHM/OiBSZWNvcmQ8bnVtYmVyLCBzdHJpbmc+O1xuICAgIH1cbj4gPSB7XG4gICAgW1BQR2VvbWV0cnkuU3RkU2VtYW50aWNzLnBvc2l0aW9uXToge1xuICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lOiBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OLFxuICAgICAgICBjb21wb25lbnRzOiAzLFxuICAgIH0sXG4gICAgW1BQR2VvbWV0cnkuU3RkU2VtYW50aWNzLm5vcm1hbF06IHtcbiAgICAgICAgZ2Z4QXR0cmlidXRlTmFtZTogZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9OT1JNQUwsXG4gICAgICAgIGNvbXBvbmVudHM6IDMsXG4gICAgfSxcbiAgICBbUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MudGV4Y29vcmRdOiB7XG4gICAgICAgIGdmeEF0dHJpYnV0ZU5hbWU6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JELFxuICAgICAgICBjb21wb25lbnRzOiAyLFxuICAgICAgICBtdWx0aXNldHM6IHtcbiAgICAgICAgICAgIDE6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEMSxcbiAgICAgICAgICAgIDI6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEMixcbiAgICAgICAgICAgIDM6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEMyxcbiAgICAgICAgICAgIDQ6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JENCxcbiAgICAgICAgICAgIDU6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JENSxcbiAgICAgICAgICAgIDY6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JENixcbiAgICAgICAgICAgIDc6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JENyxcbiAgICAgICAgICAgIDg6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfVEVYX0NPT1JEOCxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIFtQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy50YW5nZW50XToge1xuICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lOiBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1RBTkdFTlQsXG4gICAgICAgIGNvbXBvbmVudHM6IDQsXG4gICAgfSxcbiAgICBbUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3Muam9pbnRzXToge1xuICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lOiBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0pPSU5UUyxcbiAgICAgICAgY29tcG9uZW50czogNCxcbiAgICB9LFxuICAgIFtQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy53ZWlnaHRzXToge1xuICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lOiBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1dFSUdIVFMsXG4gICAgICAgIGNvbXBvbmVudHM6IDQsXG4gICAgfSxcbiAgICBbUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MuY29sb3JdOiB7XG4gICAgICAgIGdmeEF0dHJpYnV0ZU5hbWU6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQ09MT1IsXG4gICAgICAgIGNvbXBvbmVudHM6IFszLCA0XSxcbiAgICB9LFxufTtcblxuY29uc3QgYXR0cmlidXRlRm9ybWF0TWFwID0gbmV3IE1hcChbXG4gICAgW1xuICAgICAgICBJbnQ4QXJyYXksXG4gICAgICAgIHtcbiAgICAgICAgICAgIDE6IGdmeC5Gb3JtYXQuUjhTTixcbiAgICAgICAgICAgIDI6IGdmeC5Gb3JtYXQuUkc4U04sXG4gICAgICAgICAgICAzOiBnZnguRm9ybWF0LlJHQjhTTixcbiAgICAgICAgICAgIDQ6IGdmeC5Gb3JtYXQuUkdCQThTTixcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICAgVWludDhBcnJheSxcbiAgICAgICAge1xuICAgICAgICAgICAgMTogZ2Z4LkZvcm1hdC5SOCxcbiAgICAgICAgICAgIDI6IGdmeC5Gb3JtYXQuUkc4LFxuICAgICAgICAgICAgMzogZ2Z4LkZvcm1hdC5SR0I4LFxuICAgICAgICAgICAgNDogZ2Z4LkZvcm1hdC5SR0JBOCxcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICAgSW50MTZBcnJheSxcbiAgICAgICAge1xuICAgICAgICAgICAgMTogZ2Z4LkZvcm1hdC5SMTZJLFxuICAgICAgICAgICAgMjogZ2Z4LkZvcm1hdC5SRzE2SSxcbiAgICAgICAgICAgIDM6IGdmeC5Gb3JtYXQuUkdCMTZJLFxuICAgICAgICAgICAgNDogZ2Z4LkZvcm1hdC5SR0JBMTZJLFxuICAgICAgICB9LFxuICAgIF0sXG4gICAgW1xuICAgICAgICBVaW50MTZBcnJheSxcbiAgICAgICAge1xuICAgICAgICAgICAgMTogZ2Z4LkZvcm1hdC5SMTZVSSxcbiAgICAgICAgICAgIDI6IGdmeC5Gb3JtYXQuUkcxNlVJLFxuICAgICAgICAgICAgMzogZ2Z4LkZvcm1hdC5SR0IxNlVJLFxuICAgICAgICAgICAgNDogZ2Z4LkZvcm1hdC5SR0JBMTZVSSxcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICAgSW50MzJBcnJheSxcbiAgICAgICAge1xuICAgICAgICAgICAgMTogZ2Z4LkZvcm1hdC5SMzJJLFxuICAgICAgICAgICAgMjogZ2Z4LkZvcm1hdC5SRzMySSxcbiAgICAgICAgICAgIDM6IGdmeC5Gb3JtYXQuUkdCMzJJLFxuICAgICAgICAgICAgNDogZ2Z4LkZvcm1hdC5SR0JBMzJJLFxuICAgICAgICB9LFxuICAgIF0sXG4gICAgW1xuICAgICAgICBVaW50MzJBcnJheSxcbiAgICAgICAge1xuICAgICAgICAgICAgMTogZ2Z4LkZvcm1hdC5SMzJVSSxcbiAgICAgICAgICAgIDI6IGdmeC5Gb3JtYXQuUkczMlVJLFxuICAgICAgICAgICAgMzogZ2Z4LkZvcm1hdC5SR0IzMlVJLFxuICAgICAgICAgICAgNDogZ2Z4LkZvcm1hdC5SR0JBMzJVSSxcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICAgRmxvYXQzMkFycmF5LFxuICAgICAgICB7XG4gICAgICAgICAgICAxOiBnZnguRm9ybWF0LlIzMkYsXG4gICAgICAgICAgICAyOiBnZnguRm9ybWF0LlJHMzJGLFxuICAgICAgICAgICAgMzogZ2Z4LkZvcm1hdC5SR0IzMkYsXG4gICAgICAgICAgICA0OiBnZnguRm9ybWF0LlJHQkEzMkYsXG4gICAgICAgIH0sXG4gICAgXSxcbl0gYXMgSXRlcmFibGU8W1BQR2VvbWV0cnlUeXBlZEFycmF5Q29uc3RydWN0b3IsIFJlY29yZDxudW1iZXIsIGdmeC5Gb3JtYXQ+XT4pO1xuXG4vKipcbiAqIEByZXR1cm5zIFRoZSBjb3JyZXNwb25kaW5nIEdGWCBhdHRyaWJ1dGUgbmFtZS5cbiAqIEB0aHJvd3MgSWYgdGhlIGF0dHJpYnV0ZSAqKmlzIHN0YW5kYXJkIHNlbWFudGljKiogYnV0IGlzIG5vdCBhIHZhbGlkIEdGWCBhdHRyaWJ1dGUgbmFtZTpcbiAqIC0gSXQgaGFzIGEgZGlmZmVyZW50IG51bWJlciBvZiBjb21wb25lbnQgd2hpY2ggaXMgbm90IHBlcm1pdHRlZC5cbiAqIC0gSXRzIHNldCBjb3VudCBiZXlvbmQgaG93IG1hbnkgdGhhdCBraW5kIG9mIEdGWCBhdHRyaWJ1dGVzIGNhbiBwcm9jZWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2Z4QXR0cmlidXRlTmFtZShhdHRyaWJ1dGU6IFBQR2VvbWV0cnkuQXR0cmlidXRlKSB7XG4gICAgY29uc3QgeyBzZW1hbnRpYyB9ID0gYXR0cmlidXRlO1xuICAgIGxldCBnZnhBdHRyaWJ1dGVOYW1lOiBzdHJpbmc7XG4gICAgaWYgKCFQUEdlb21ldHJ5LmlzU3RkU2VtYW50aWMoc2VtYW50aWMpKSB7XG4gICAgICAgIGdmeEF0dHJpYnV0ZU5hbWUgPSBzZW1hbnRpYztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBWYWxpZGF0ZSBzdGFuZGFyZCBzZW1hbnRpYy5cbiAgICAgICAgY29uc3QgeyBzZW1hbnRpYzAsIHNldCB9ID0gUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MuZGVjb2RlKHNlbWFudGljKTtcbiAgICAgICAgY29uc3Qgc2VtYW50aWNJbmZvID0gc3RkU2VtYW50aWNJbmZvTWFwW3NlbWFudGljMF07XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICEoQXJyYXkuaXNBcnJheShzZW1hbnRpY0luZm8uY29tcG9uZW50cylcbiAgICAgICAgICAgICAgICA/IHNlbWFudGljSW5mby5jb21wb25lbnRzLmluY2x1ZGVzKGF0dHJpYnV0ZS5jb21wb25lbnRzKVxuICAgICAgICAgICAgICAgIDogc2VtYW50aWNJbmZvLmNvbXBvbmVudHMgPT09IGF0dHJpYnV0ZS5jb21wb25lbnRzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTWlzbWF0Y2hlZCAke1BQR2VvbWV0cnkuU3RkU2VtYW50aWNzW3NlbWFudGljMF19IGNvbXBvbmVudHMsIGV4cGVjdCAke3NlbWFudGljSW5mby5jb21wb25lbnRzfS5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2V0ID09PSAwKSB7XG4gICAgICAgICAgICBnZnhBdHRyaWJ1dGVOYW1lID0gc2VtYW50aWNJbmZvLmdmeEF0dHJpYnV0ZU5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoc2VtYW50aWNJbmZvLm11bHRpc2V0cyAmJiBzZXQgaW4gc2VtYW50aWNJbmZvLm11bHRpc2V0cykge1xuICAgICAgICAgICAgZ2Z4QXR0cmlidXRlTmFtZSA9IHNlbWFudGljSW5mby5tdWx0aXNldHNbc2V0XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtQUEdlb21ldHJ5LlN0ZFNlbWFudGljc1tzZW1hbnRpYzBdfSBkb2Vzbid0IGFsbG93IHNldCAke3NldH0uYCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdmeEF0dHJpYnV0ZU5hbWU7XG59XG5cbi8qKlxuICogR2V0IHRoZSBub3JtYWxpemVyIHdoaWNoIG5vcm1hbGl6ZSB0aGUgaW50ZWdlcnMgb2Ygc3BlY2lmaWVkIHR5cGUgYXJyYXlcbiAqIGludG8gWzAsIDFdKGZvciB1bnNpZ25lZCBpbnRlZ2Vycykgb3IgWy0xLCAxXShmb3Igc2lnbmVkIGludGVnZXJzKS5cbiAqIFRoZSBub3JtYWxpemF0aW9uIGlzIHBlcmZvcm1lZCBhcyBkZXNjcmliZWQgaW46XG4gKiBodHRwczovL3d3dy5raHJvbm9zLm9yZy9vcGVuZ2wvd2lraS9Ob3JtYWxpemVkX0ludGVnZXJcbiAqIEByZXR1cm5zIFRoZSBub3JtYWxpemVyLCBvciBgdW5kZWZpbmVkYCBpZiBubyBjb3JyZXNwb25kaW5nIG5vcm1hbGl6ZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBnZXROb3JtYWxpemVyID0gKCgpID0+IHtcbiAgICBjb25zdCBVOF9NQVggPSAyICoqIDggLSAxO1xuICAgIGNvbnN0IFUxNl9NQVggPSAyICoqIDE2IC0gMTtcbiAgICBjb25zdCBVMzJfTUFYID0gMiAqKiAzMiAtIDE7XG4gICAgY29uc3QgSThfTUFYID0gMiAqKiAoOCAtIDEpIC0gMTtcbiAgICBjb25zdCBJMTZfTUFYID0gMiAqKiAoMTYgLSAxKSAtIDE7XG4gICAgY29uc3QgSTMyX01BWCA9IDIgKiogKDMyIC0gMSkgLSAxO1xuXG4gICAgdHlwZSBOb3JtYWxpemVyID0gKHZhbHVlOiBudW1iZXIpID0+IG51bWJlcjtcblxuICAgIGNvbnN0IHU4OiBOb3JtYWxpemVyID0gKHZhbHVlKSA9PiB2YWx1ZSAvIFU4X01BWDtcbiAgICBjb25zdCB1MTY6IE5vcm1hbGl6ZXIgPSAodmFsdWUpID0+IHZhbHVlIC8gVTE2X01BWDtcbiAgICBjb25zdCB1MzI6IE5vcm1hbGl6ZXIgPSAodmFsdWUpID0+IHZhbHVlIC8gVTMyX01BWDtcbiAgICBjb25zdCBpODogTm9ybWFsaXplciA9ICh2YWx1ZSkgPT4gTWF0aC5tYXgodmFsdWUgLyBJOF9NQVgsIC0xKTtcbiAgICBjb25zdCBpMTY6IE5vcm1hbGl6ZXIgPSAodmFsdWUpID0+IE1hdGgubWF4KHZhbHVlIC8gSTE2X01BWCwgLTEpO1xuICAgIGNvbnN0IGkzMjogTm9ybWFsaXplciA9ICh2YWx1ZSkgPT4gTWF0aC5tYXgodmFsdWUgLyBJMzJfTUFYLCAtMSk7XG5cbiAgICByZXR1cm4gKHR5cGVkQXJyYXk6IFBQR2VvbWV0cnlUeXBlZEFycmF5KSA9PiB7XG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgICAgY2FzZSB0eXBlZEFycmF5IGluc3RhbmNlb2YgSW50OEFycmF5OlxuICAgICAgICAgICAgICAgIHJldHVybiBpODtcbiAgICAgICAgICAgIGNhc2UgdHlwZWRBcnJheSBpbnN0YW5jZW9mIEludDE2QXJyYXk6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkxNjtcbiAgICAgICAgICAgIGNhc2UgdHlwZWRBcnJheSBpbnN0YW5jZW9mIEludDMyQXJyYXk6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkzMjtcbiAgICAgICAgICAgIGNhc2UgdHlwZWRBcnJheSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHU4O1xuICAgICAgICAgICAgY2FzZSB0eXBlZEFycmF5IGluc3RhbmNlb2YgVWludDE2QXJyYXk6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHUxNjtcbiAgICAgICAgICAgIGNhc2UgdHlwZWRBcnJheSBpbnN0YW5jZW9mIFVpbnQzMkFycmF5OlxuICAgICAgICAgICAgICAgIHJldHVybiB1MzI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsITtcbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5jb25zdCBlcXVhbFN0ZFNlbWFudGljID0gKHNlbWFudGljOiBQUEdlb21ldHJ5LlNlbWFudGljLCBleHBlY3RlZDogUFBHZW9tZXRyeS5TdGRTZW1hbnRpY3MpID0+XG4gICAgUFBHZW9tZXRyeS5pc1N0ZFNlbWFudGljKHNlbWFudGljKSAmJiBQUEdlb21ldHJ5LlN0ZFNlbWFudGljcy5kZWNvZGUoc2VtYW50aWMpLnNlbWFudGljMCA9PT0gZXhwZWN0ZWQ7XG4iXX0=