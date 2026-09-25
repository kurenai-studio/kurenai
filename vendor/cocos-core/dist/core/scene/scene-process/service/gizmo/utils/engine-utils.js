'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighlightFace = exports.AttributeName = exports.FOVAxis = exports.PrimitiveMode = exports.CullMode = exports.ProjectionType = exports.RaycastResults = exports.ray = void 0;
exports.create3DNode = create3DNode;
exports.createMesh = createMesh;
exports.createDynamicMesh = createDynamicMesh;
exports.updateDynamicMesh = updateDynamicMesh;
exports.addMeshToNode = addMeshToNode;
exports.setMeshColor = setMeshColor;
exports.getMeshColor = getMeshColor;
exports.setNodeOpacity = setNodeOpacity;
exports.getNodeOpacity = getNodeOpacity;
exports.setMaterialProperty = setMaterialProperty;
exports.setMeshSHCoefficients = setMeshSHCoefficients;
exports.getModel = getModel;
exports.updatePositions = updatePositions;
exports.updateVBAttr = updateVBAttr;
exports.updateIB = updateIB;
exports.updateBoundingBox = updateBoundingBox;
exports.getRaycastResultsByNodes = getRaycastResultsByNodes;
exports.getRaycastResults = getRaycastResults;
exports.raycast = raycast;
exports.raycastAllColliders = raycastAllColliders;
exports.getRaycastResultsForSnap = getRaycastResultsForSnap;
exports.getMeshVertexAroundMouse = getMeshVertexAroundMouse;
const cc_1 = require("cc");
const raycast_1 = __importDefault(require("./raycast"));
const flat = (arr, fn) => {
    return arr.map(fn).reduce((acc, val) => acc.concat(val), []);
};
const cmp = (a, b) => a.distance - b.distance;
exports.ray = cc_1.geometry.Ray.create();
const triangles = cc_1.gfx.PrimitiveMode.TRIANGLE_LIST;
class RaycastResults extends Array {
    ray;
    constructor(r) {
        super();
        this.ray = r;
    }
}
exports.RaycastResults = RaycastResults;
// 这边理论上用WeakMap更好，但是在场景原生化中会有问题，所以先用Map
const vbMap = new Map();
const ibMap = new Map();
exports.ProjectionType = cc_1.Camera.ProjectionType;
exports.CullMode = cc_1.gfx.CullMode;
exports.PrimitiveMode = cc_1.gfx.PrimitiveMode;
exports.FOVAxis = cc_1.Camera.FOVAxis;
exports.AttributeName = cc_1.gfx.AttributeName;
var HighlightFace;
(function (HighlightFace) {
    HighlightFace[HighlightFace["NONE"] = 0] = "NONE";
    HighlightFace[HighlightFace["UP"] = 1] = "UP";
    HighlightFace[HighlightFace["DOWN"] = 2] = "DOWN";
    HighlightFace[HighlightFace["LEFT"] = 3] = "LEFT";
    HighlightFace[HighlightFace["RIGHT"] = 4] = "RIGHT";
    HighlightFace[HighlightFace["FRONT"] = 5] = "FRONT";
    HighlightFace[HighlightFace["BACK"] = 6] = "BACK";
})(HighlightFace || (exports.HighlightFace = HighlightFace = {}));
function setNodeMaterialProperty(node, propName, value) {
    if (node && node.modelComp && node.modelComp.material) {
        node.modelComp.material.setProperty(propName, value);
    }
}
/**
 * 获取编辑器摄像机（惰性访问，避免循环依赖）
 */
function getEditorCamera() {
    try {
        const { Service } = require('../../core/decorator');
        return Service.Camera?.getCamera?.();
    }
    catch (e) {
        return null;
    }
}
function create3DNode(name) {
    const node = new cc.Node(name);
    node._layer = cc.Layers.Enum.GIZMOS;
    node._objFlags |= cc_1.CCObject.Flags.DontSave;
    node.modelColor = cc.color();
    return node;
}
function createMesh(primitive, opts = {}) {
    // prepare data
    const primitiveData = {
        primitiveMode: primitive.primitiveType,
        positions: flat(primitive.positions, (v) => [v.x, v.y, v.z]),
        indices: primitive.indices,
        minPos: primitive.minPos,
        maxPos: primitive.maxPos,
    };
    if (primitive.normals) {
        primitiveData.normals = flat(primitive.normals, (v) => [v.x, v.y, v.z]);
    }
    if (primitive.uvs) {
        primitiveData.uvs = flat(primitive.uvs, (v) => [v.x, v.y]);
    }
    let customAttributes = primitiveData.customAttributes;
    if (opts.dashed) {
        if (!customAttributes) {
            customAttributes = [];
        }
        const lineDistances = [];
        for (let i = 0; i < primitive.positions.length; i += 2) {
            const start = primitive.positions[i];
            const end = primitive.positions[i + 1];
            lineDistances[i] = (i === 0) ? 0 : lineDistances[i - 1];
            lineDistances[i + 1] = lineDistances[i] + cc_1.Vec3.distance(start, end);
        }
        customAttributes.push({
            attr: new cc_1.gfx.Attribute('a_lineDistance', cc_1.gfx.Format.R32F),
            values: lineDistances,
        });
    }
    primitiveData.customAttributes = customAttributes;
    // create
    const mesh = cc_1.utils.createMesh(primitiveData);
    // set double sided flag for raycast
    const subMesh = mesh.renderingSubMeshes[0];
    const info = subMesh.geometricInfo;
    if (info) {
        info.doubleSided = primitive.doubleSided;
    }
    // cache vb buffer for vb update
    const vbInfo = mesh.struct.vertexBundles[0].view;
    if (vbInfo) {
        subMesh.vBuffer = mesh.data.buffer instanceof ArrayBuffer
            ? mesh.data.buffer.slice(vbInfo.offset, vbInfo.offset + vbInfo.length)
            : undefined;
        vbMap.set(subMesh, subMesh.vBuffer);
    }
    const ibInfo = mesh.struct.primitives[0].indexView;
    if (ibInfo) {
        subMesh.iBuffer = mesh.data.buffer instanceof ArrayBuffer
            ? mesh.data.buffer.slice(ibInfo.offset, ibInfo.offset + ibInfo.length)
            : undefined;
        ibMap.set(subMesh, subMesh.iBuffer);
    }
    return mesh;
}
function createDynamicMesh(primitive, opts) {
    // prepare data
    const primitiveData = primitive.transformToDynamicGeometry();
    if (primitive.normals) {
        primitiveData.normals = Float32Array.from(flat(primitive.normals, (v) => [v.x, v.y, v.z]));
    }
    if (primitive.uvs) {
        primitiveData.uvs = Float32Array.from(flat(primitive.uvs, (v) => [v.x, v.y]));
    }
    let customAttributes = primitiveData.customAttributes;
    if (opts?.dashed) {
        if (!customAttributes) {
            customAttributes = [];
        }
        const lineDistances = [];
        for (let i = 0; i < primitive.positions.length; i += 2) {
            const start = primitive.positions[i];
            const end = primitive.positions[i + 1];
            lineDistances[i] = (i === 0) ? 0 : lineDistances[i - 1];
            lineDistances[i + 1] = lineDistances[i] + cc_1.Vec3.distance(start, end);
        }
        customAttributes.push({
            attr: new cc_1.gfx.Attribute('a_lineDistance', cc_1.gfx.Format.R32F),
            values: Float32Array.from(lineDistances),
        });
    }
    primitiveData.customAttributes = customAttributes;
    // create
    const mesh = cc_1.utils.MeshUtils.createDynamicMesh(0, primitiveData, undefined, opts);
    // set double sided flag for raycast
    const subMesh = mesh.renderingSubMeshes[0];
    const info = subMesh.geometricInfo;
    if (info) {
        info.doubleSided = primitive.doubleSided;
    }
    // cache vb buffer for vb update
    const vbInfo = mesh.struct.vertexBundles[0].view;
    if (vbInfo) {
        // @ts-ignore
        subMesh.vBuffer = mesh.data.buffer.slice(vbInfo.offset, vbInfo.offset + vbInfo.length);
        // @ts-ignore
        vbMap.set(subMesh, subMesh.vBuffer);
    }
    const ibInfo = mesh.struct.primitives[0].indexView;
    if (ibInfo) {
        // @ts-ignore
        subMesh.iBuffer = mesh.data.buffer.slice(ibInfo.offset, ibInfo.offset + ibInfo.length);
        // @ts-ignore
        ibMap.set(subMesh, subMesh.iBuffer);
    }
    return mesh;
}
function updateDynamicMesh(meshRenderer, subIndex, primitive) {
    const primitiveData = primitive.transformToDynamicGeometry();
    meshRenderer.mesh?.updateSubMesh(subIndex, primitiveData);
}
function addMeshToNode(node, mesh, opts = {}, reuseMaterial) {
    const model = node.addComponent(cc_1.MeshRenderer);
    const defines = {};
    if (opts.forwardPipeline) {
        defines.USE_FORWARD_PIPELINE = true;
    }
    if (opts.dashed) {
        defines.USE_DASHED_LINE = true;
    }
    if (opts.instancing) {
        defines.USE_INSTANCING = true;
    }
    if (opts.useLightProbe) {
        defines.CC_USE_LIGHT_PROBE = true;
    }
    model.mesh = mesh;
    const cb = model.onEnable.bind(model);
    model.onEnable = () => {
        cb();
    }; // don't show on preview cameras
    const pm = mesh.renderingSubMeshes[0].primitiveMode;
    let technique = 0;
    let effectName = 'internal/editor/gizmo';
    if (opts.effectName) {
        effectName = opts.effectName;
    }
    else if (opts.technique) {
        technique = opts.technique;
    }
    else {
        if (opts.unlit) {
            technique = 1;
        }
        else if (opts.texture) {
            technique = 3;
        }
        else {
            if (pm < triangles) {
                technique = opts.noDepthTestForLines ? 1 : 2; // unlit
            }
            else {
                technique = opts.depthTestForTriangles ? 4 : 0;
            }
        }
    }
    const mtl = reuseMaterial ?? new cc_1.Material();
    const states = {};
    if (opts.cullMode) {
        states.rasterizerState = { cullMode: opts.cullMode };
    }
    if (opts.depthStencilState) {
        states.depthStencilState = opts.depthStencilState;
    }
    if (pm !== triangles) {
        states.primitive = pm;
    }
    if (opts.priority) {
        states.priority = opts.priority;
    }
    // 未初始化的材质hash值为0
    if (mtl.hash === 0) {
        mtl.initialize({ effectName, technique, states, defines });
    }
    if (opts.alpha !== undefined) {
        if (node.modelColor) {
            node.modelColor.a = opts.alpha;
        }
    }
    mtl.setProperty('mainColor', node.modelColor);
    model.material = mtl;
    node.modelComp = model;
}
function setMeshColor(node, c) {
    let alpha = c.a;
    if (node.modelColor) {
        alpha = node.modelColor.a;
    }
    node.modelColor = c.clone();
    node.modelColor.a = alpha;
    setNodeMaterialProperty(node, 'mainColor', node.modelColor);
}
function getMeshColor(node) {
    return node.modelColor;
}
function setNodeOpacity(node, opacity) {
    if (node.modelColor) {
        node.modelColor.a = opacity;
    }
    setNodeMaterialProperty(node, 'mainColor', node.modelColor);
}
function getNodeOpacity(node) {
    return node.modelColor?.a ?? 0;
}
function setMaterialProperty(node, propName, value) {
    setNodeMaterialProperty(node, propName, value);
}
/**
 * 设置光照探针可视化材质的 SH 系数（对应 internal/editor/light-probe-visualization 的 Constant uniform）。
 * 移植自 Cocos Creator EngineUtils.setMeshSHCoefficients。
 */
function setMeshSHCoefficients(node, coefficients) {
    const value = new cc_1.Vec4();
    const names = [
        'cc_sh_linear_const_r',
        'cc_sh_linear_const_g',
        'cc_sh_linear_const_b',
        'cc_sh_quadratic_r',
        'cc_sh_quadratic_g',
        'cc_sh_quadratic_b',
        'cc_sh_quadratic_a',
    ];
    for (let i = 0; i < names.length; i++) {
        const offset = i * 4;
        value.set(coefficients[offset], coefficients[offset + 1], coefficients[offset + 2], coefficients[offset + 3]);
        setNodeMaterialProperty(node, names[i], value);
    }
}
function getModel(node) {
    return node.getComponent(cc_1.MeshRenderer);
}
function updatePositions(comp, data) {
    const model = comp.model && comp.model.subModels[0];
    if (!model || !model.inputAssembler || !model.subMesh) {
        return;
    }
    const { subMesh } = model;
    const points = flat(data, (v) => [v.x, v.y, v.z]);
    updateVBAttr(comp, cc_1.gfx.AttributeName.ATTR_POSITION, points);
    // sync to raycast data
    if (subMesh.geometricInfo) {
        if (subMesh.geometricInfo.positions.length >= points.length) {
            subMesh.geometricInfo.positions.set(points);
        }
        else {
            subMesh.geometricInfo.positions = new Float32Array(points);
        }
    }
}
function updateVBAttr(comp, attr, data) {
    const model = comp.model && comp.model.subModels[0];
    if (!model || !model.inputAssembler || !model.subMesh) {
        return;
    }
    const { inputAssembler, subMesh } = model;
    let vBuffer = subMesh.vBuffer;
    // update vb
    let offset = 0;
    let format = cc_1.gfx.Format.UNKNOWN;
    for (const a of inputAssembler.attributes) {
        if (a.name === attr) {
            format = a.format;
            break;
        }
        offset += cc_1.gfx.FormatInfos[a.format].size;
    }
    const vb = inputAssembler.vertexBuffers[0];
    if (!format || !vb) {
        return;
    }
    const newSize = vb.stride * data.length / cc_1.gfx.FormatInfos[format].count;
    // 需要扩大VB的大小
    if (vBuffer.byteLength < newSize) {
        vBuffer = new ArrayBuffer(newSize);
        vbMap.set(subMesh, vBuffer);
        vb.resize(newSize);
    }
    cc_1.utils.writeBuffer(new DataView(vBuffer), data, format, offset, vb.stride);
    vb.update(vBuffer);
}
function updateIB(comp, data) {
    const model = comp.model && comp.model.subModels[0];
    if (!model || !model.inputAssembler || !model.subMesh) {
        return;
    }
    const { inputAssembler, subMesh } = model;
    let iBuffer = ibMap.get(subMesh);
    // update ib
    const ib = inputAssembler.indexBuffer;
    if (!ib) {
        return;
    }
    if (inputAssembler.indexCount === data.length) {
        new Uint16Array(iBuffer).set(data);
        ib.update(iBuffer);
        // sync to raycast data
        if (subMesh.geometricInfo && subMesh.geometricInfo.indices) {
            subMesh.geometricInfo.indices.set(data);
        }
    }
    else {
        const newSize = data.length * ib.stride;
        // 需要扩大IB的大小
        if (newSize > iBuffer.byteLength) {
            // @ts-ignore
            iBuffer = new ArrayBuffer(newSize);
            ibMap.set(subMesh, iBuffer);
            ib.resize(newSize);
        }
        new Uint16Array(iBuffer).set(data);
        ib.update(iBuffer);
        inputAssembler.indexCount = data.length;
        // sync to raycast data
        if (subMesh.geometricInfo && subMesh.geometricInfo.indices) {
            const indicesData = new Uint16Array(data);
            subMesh.geometricInfo.indices = indicesData;
        }
    }
}
function updateBoundingBox(meshComp, minPos, maxPos) {
    const model = meshComp.model;
    if (!model) {
        return;
    }
    model.createBoundingShape(minPos, maxPos);
}
function getRaycastResultsByNodes(nodes, x, y, distance = Infinity, forSnap = false, excludeMask) {
    const results = new RaycastResults(exports.ray);
    const camera = getEditorCamera();
    if (!camera || !camera.camera) {
        return results;
    }
    camera.camera.screenPointToRay(exports.ray, x, y);
    const walkAllModels = (node, cb) => {
        const modelComponent = node.getComponents(cc_1.MeshRenderer);
        modelComponent.forEach(e => cb(e));
        if (node.children.length > 0) {
            node.children.forEach(children => {
                walkAllModels(children, cb);
            });
        }
    };
    nodes.forEach(node => {
        walkAllModels(node, (mr) => {
            if (!mr.model)
                return;
            if (raycast_1.default.raycastSingleModel(exports.ray, mr.model, node['_layer'], distance, forSnap, excludeMask)) {
                results.push(...raycast_1.default.rayResultSingleModel);
                results.sort(cmp);
            }
        });
    });
    return results;
}
function getRaycastResults(rootNode, x, y, distance = Infinity, excludeMask) {
    const scene = rootNode.scene?.renderScene;
    const camera = getEditorCamera();
    if (!camera || !camera.camera || !scene) {
        return new RaycastResults(exports.ray);
    }
    camera.camera.screenPointToRay(exports.ray, x, y);
    const results = new RaycastResults(exports.ray);
    if (raycast_1.default.raycastAllModels(scene, exports.ray, rootNode['_layer'], distance, false, excludeMask)) {
        results.push(...raycast_1.default.rayResultModels);
        results.sort(cmp);
    }
    return results;
}
function raycast(scene, camera, layer, x, y, distance = Infinity, excludeMask) {
    if (!camera || !camera.enabled) {
        return null;
    }
    camera.screenPointToRay(exports.ray, x, y);
    const results = new RaycastResults(exports.ray);
    if (raycast_1.default.raycastAllModels(scene, exports.ray, layer, distance, false, excludeMask)) {
        results.push(...raycast_1.default.rayResultModels);
        results.sort(cmp);
    }
    return results;
}
function raycastAllColliders(camera, x, y) {
    const results = [];
    if (!camera?.camera)
        return results;
    camera.camera.screenPointToRay(exports.ray, x, y);
    results.ray = exports.ray;
    const PhysicsSystem = cc.PhysicsSystem;
    const physicsSystem = PhysicsSystem?.instance;
    if (!physicsSystem?.raycastAll)
        return results;
    if (physicsSystem.raycastAll(exports.ray)) {
        results.push(...physicsSystem.raycastResults);
        results.sort(cmp);
    }
    return results;
}
function getRaycastResultsForSnap(camera, x, y, mask = ~cc_1.Layers.Enum.SCENE_GIZMO) {
    const scene = cc.director?.getScene();
    if (!scene || !camera?.camera)
        return new RaycastResults(exports.ray);
    const renderScene = scene.renderScene;
    if (!renderScene)
        return new RaycastResults(exports.ray);
    camera.camera.screenPointToRay(exports.ray, x, y);
    const results = new RaycastResults(exports.ray);
    if (raycast_1.default.raycastAllModels(renderScene, exports.ray, mask, Infinity, true)) {
        results.push(...raycast_1.default.rayResultModels);
        results.sort(cmp);
    }
    return results;
}
function getMeshVertexAroundMouse(node, camera, x, y, radius = 30) {
    if (!camera?.camera || !node)
        return [];
    const targetNode = cc_1.Node.isNode(node) ? node : (node.collider?.node ?? node.node ?? null);
    if (!targetNode)
        return [];
    const vertexs = [];
    const vertex = new cc_1.Vec3();
    const worldPos = new cc_1.Vec3();
    const screenPos = new cc_1.Vec3();
    const worldMatrix = targetNode.getWorldMatrix();
    const components = targetNode.getComponentsInChildren?.(cc_1.MeshRenderer) ?? [];
    components.forEach((renderableCmp) => {
        const mesh = renderableCmp.mesh;
        const len = mesh?.renderingSubMeshes?.length;
        for (let i = 0; i < len; i++) {
            const subMesh = mesh.renderingSubMeshes[i];
            const geoInfo = subMesh?.geometricInfo;
            if (geoInfo) {
                const positions = geoInfo.positions;
                for (let idx = 0; idx < positions.length; idx += 3) {
                    vertex.set(positions[idx], positions[idx + 1], positions[idx + 2]);
                    cc_1.Vec3.transformMat4(worldPos, vertex, worldMatrix);
                    camera.camera.worldToScreen(screenPos, worldPos);
                    const dx = screenPos.x - x;
                    const dy = screenPos.y - y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    if (length < radius) {
                        vertexs.push(new cc_1.Vec4(vertex.x, vertex.y, vertex.z, length));
                    }
                }
            }
        }
    });
    vertexs.sort((a, b) => a.w - b.w);
    return vertexs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2dpem1vL3V0aWxzL2VuZ2luZS11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQTJFYixvQ0FNQztBQUVELGdDQWlFQztBQUVELDhDQTZEQztBQUVELDhDQUdDO0FBRUQsc0NBd0VDO0FBRUQsb0NBUUM7QUFFRCxvQ0FFQztBQUVELHdDQUtDO0FBRUQsd0NBRUM7QUFFRCxrREFFQztBQU1ELHNEQWdCQztBQUVELDRCQUVDO0FBRUQsMENBa0JDO0FBRUQsb0NBZ0NDO0FBRUQsNEJBdUNDO0FBRUQsOENBT0M7QUFFRCw0REE4QkM7QUFFRCw4Q0FjQztBQUVELDBCQVlDO0FBRUQsa0RBYUM7QUFFRCw0REFZQztBQUVELDREQXFDQztBQXRqQkQsMkJBR1k7QUFFWix3REFBb0M7QUFHcEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFRLEVBQUUsRUFBTyxFQUFFLEVBQUU7SUFDL0IsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQVEsRUFBRSxHQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0UsQ0FBQyxDQUFDO0FBRUYsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFNLEVBQUUsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDM0MsUUFBQSxHQUFHLEdBQUcsYUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLFNBQVMsR0FBRyxRQUFHLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQztBQUVsRCxNQUFhLGNBQWUs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LGFBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2pELE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMzQixNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUM7d0JBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDakUsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5kZWNsYXJlIG1vZHVsZSAnY2MnIHtcbiAgICBpbnRlcmZhY2UgTm9kZSB7XG4gICAgICAgIG1vZGVsQ29tcD86IE1lc2hSZW5kZXJlcjtcbiAgICAgICAgbW9kZWxDb2xvcj86IENvbG9yO1xuICAgIH1cbiAgICBpbnRlcmZhY2UgUmVuZGVyaW5nU3ViTWVzaCB7XG4gICAgICAgIGlCdWZmZXI/OiBBcnJheUJ1ZmZlcjtcbiAgICAgICAgdkJ1ZmZlcj86IEFycmF5QnVmZmVyO1xuICAgIH1cbn1cblxuaW1wb3J0IHtcbiAgICBDYW1lcmEsIENDT2JqZWN0LCBDb2xvciwgZ2VvbWV0cnksIGdmeCwgSVZlYzNMaWtlLCBtYXRoLCBNZXNoUmVuZGVyZXIsIE5vZGUsXG4gICAgcHJpbWl0aXZlcywgcmVuZGVyZXIsIHV0aWxzLCBWZWMyLCBWZWMzLCBNYXRlcmlhbCwgTWVzaCwgTGF5ZXJzLCBWZWM0LFxufSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IElBZGRNZXNoVG9Ob2RlT3B0aW9uLCBJQ3JlYXRlTWVzaE9wdGlvbiwgSU1lc2hQcmltaXRpdmUsIER5bmFtaWNNZXNoUHJpbWl0aXZlIH0gZnJvbSAnLi9kZWZpbmVzJztcbmltcG9ydCByYXljYXN0VXRpbCBmcm9tICcuL3JheWNhc3QnO1xuaW1wb3J0IHR5cGUgeyBJUmF5Y2FzdFJlc3VsdCB9IGZyb20gJy4vcmF5Y2FzdCc7XG5cbmNvbnN0IGZsYXQgPSAoYXJyOiBhbnksIGZuOiBhbnkpID0+IHtcbiAgICByZXR1cm4gYXJyLm1hcChmbikucmVkdWNlKChhY2M6IGFueSwgdmFsOiBhbnkpID0+IGFjYy5jb25jYXQodmFsKSwgW10pO1xufTtcblxuY29uc3QgY21wID0gKGE6IGFueSwgYjogYW55KSA9PiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZTtcbmV4cG9ydCBjb25zdCByYXkgPSBnZW9tZXRyeS5SYXkuY3JlYXRlKCk7XG5jb25zdCB0cmlhbmdsZXMgPSBnZnguUHJpbWl0aXZlTW9kZS5UUklBTkdMRV9MSVNUO1xuXG5leHBvcnQgY2xhc3MgUmF5Y2FzdFJlc3VsdHMgZXh0ZW5kcyBBcnJheTxJUmF5Y2FzdFJlc3VsdD4ge1xuICAgIHJheTogZ2VvbWV0cnkuUmF5O1xuICAgIGNvbnN0cnVjdG9yKHI6IGdlb21ldHJ5LlJheSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJheSA9IHI7XG4gICAgfVxufVxuXG4vLyDov5novrnnkIborrrkuIrnlKhXZWFrTWFw5pu05aW977yM5L2G5piv5Zyo5Zy65pmv5Y6f55Sf5YyW5Lit5Lya5pyJ6Zeu6aKY77yM5omA5Lul5YWI55SoTWFwXG5jb25zdCB2Yk1hcCA9IG5ldyBNYXAoKTtcbmNvbnN0IGliTWFwID0gbmV3IE1hcCgpO1xuXG5leHBvcnQgY29uc3QgUHJvamVjdGlvblR5cGUgPSBDYW1lcmEuUHJvamVjdGlvblR5cGU7XG5leHBvcnQgY29uc3QgQ3VsbE1vZGUgPSBnZnguQ3VsbE1vZGU7XG5leHBvcnQgY29uc3QgUHJpbWl0aXZlTW9kZSA9IGdmeC5QcmltaXRpdmVNb2RlO1xuZXhwb3J0IGNvbnN0IEZPVkF4aXMgPSBDYW1lcmEuRk9WQXhpcztcbmV4cG9ydCBjb25zdCBBdHRyaWJ1dGVOYW1lID0gZ2Z4LkF0dHJpYnV0ZU5hbWU7XG5cbmV4cG9ydCBlbnVtIEhpZ2hsaWdodEZhY2Uge1xuICAgIE5PTkUsXG4gICAgVVAsXG4gICAgRE9XTixcbiAgICBMRUZULFxuICAgIFJJR0hULFxuICAgIEZST05ULFxuICAgIEJBQ0ssXG59XG5cbmZ1bmN0aW9uIHNldE5vZGVNYXRlcmlhbFByb3BlcnR5KG5vZGU6IE5vZGUsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAobm9kZSAmJiBub2RlLm1vZGVsQ29tcCAmJiBub2RlLm1vZGVsQ29tcC5tYXRlcmlhbCkge1xuICAgICAgICBub2RlLm1vZGVsQ29tcC5tYXRlcmlhbC5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDojrflj5bnvJbovpHlmajmkYTlg4/mnLrvvIjmg7DmgKforr/pl67vvIzpgb/lhY3lvqrnjq/kvp3otZbvvIlcbiAqL1xuZnVuY3Rpb24gZ2V0RWRpdG9yQ2FtZXJhKCk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICByZXR1cm4gU2VydmljZS5DYW1lcmE/LmdldENhbWVyYT8uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUzRE5vZGUobmFtZT86IHN0cmluZyk6IE5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBuZXcgKGNjIGFzIGFueSkuTm9kZShuYW1lKTtcbiAgICBub2RlLl9sYXllciA9IChjYyBhcyBhbnkpLkxheWVycy5FbnVtLkdJWk1PUztcbiAgICBub2RlLl9vYmpGbGFncyB8PSBDQ09iamVjdC5GbGFncy5Eb250U2F2ZTtcbiAgICBub2RlLm1vZGVsQ29sb3IgPSAoY2MgYXMgYW55KS5jb2xvcigpO1xuICAgIHJldHVybiBub2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVzaChwcmltaXRpdmU6IElNZXNoUHJpbWl0aXZlLCBvcHRzOiBJQ3JlYXRlTWVzaE9wdGlvbiA9IHt9KTogTWVzaCB7XG4gICAgLy8gcHJlcGFyZSBkYXRhXG4gICAgY29uc3QgcHJpbWl0aXZlRGF0YTogcHJpbWl0aXZlcy5JR2VvbWV0cnkgPSB7XG4gICAgICAgIHByaW1pdGl2ZU1vZGU6IHByaW1pdGl2ZS5wcmltaXRpdmVUeXBlLFxuICAgICAgICBwb3NpdGlvbnM6IGZsYXQocHJpbWl0aXZlLnBvc2l0aW9ucywgKHY6IFZlYzMpID0+IFt2LngsIHYueSwgdi56XSksXG4gICAgICAgIGluZGljZXM6IHByaW1pdGl2ZS5pbmRpY2VzLFxuICAgICAgICBtaW5Qb3M6IHByaW1pdGl2ZS5taW5Qb3MsXG4gICAgICAgIG1heFBvczogcHJpbWl0aXZlLm1heFBvcyxcbiAgICB9O1xuXG4gICAgaWYgKHByaW1pdGl2ZS5ub3JtYWxzKSB7XG4gICAgICAgIHByaW1pdGl2ZURhdGEubm9ybWFscyA9IGZsYXQocHJpbWl0aXZlLm5vcm1hbHMsICh2OiBWZWMzKSA9PiBbdi54LCB2LnksIHYuel0pO1xuICAgIH1cbiAgICBpZiAocHJpbWl0aXZlLnV2cykge1xuICAgICAgICBwcmltaXRpdmVEYXRhLnV2cyA9IGZsYXQocHJpbWl0aXZlLnV2cywgKHY6IFZlYzIpID0+IFt2LngsIHYueV0pO1xuICAgIH1cblxuICAgIGxldCBjdXN0b21BdHRyaWJ1dGVzID0gcHJpbWl0aXZlRGF0YS5jdXN0b21BdHRyaWJ1dGVzO1xuICAgIGlmIChvcHRzLmRhc2hlZCkge1xuICAgICAgICBpZiAoIWN1c3RvbUF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGN1c3RvbUF0dHJpYnV0ZXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxpbmVEaXN0YW5jZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlLnBvc2l0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBwcmltaXRpdmUucG9zaXRpb25zW2ldO1xuICAgICAgICAgICAgY29uc3QgZW5kID0gcHJpbWl0aXZlLnBvc2l0aW9uc1tpICsgMV07XG4gICAgICAgICAgICBsaW5lRGlzdGFuY2VzW2ldID0gKGkgPT09IDApID8gMCA6IGxpbmVEaXN0YW5jZXNbaSAtIDFdO1xuICAgICAgICAgICAgbGluZURpc3RhbmNlc1tpICsgMV0gPSBsaW5lRGlzdGFuY2VzW2ldICsgVmVjMy5kaXN0YW5jZShzdGFydCBhcyBWZWMzLCBlbmQgYXMgVmVjMyk7XG4gICAgICAgIH1cblxuICAgICAgICBjdXN0b21BdHRyaWJ1dGVzLnB1c2goe1xuICAgICAgICAgICAgYXR0cjogbmV3IGdmeC5BdHRyaWJ1dGUoJ2FfbGluZURpc3RhbmNlJywgZ2Z4LkZvcm1hdC5SMzJGKSxcbiAgICAgICAgICAgIHZhbHVlczogbGluZURpc3RhbmNlcyxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByaW1pdGl2ZURhdGEuY3VzdG9tQXR0cmlidXRlcyA9IGN1c3RvbUF0dHJpYnV0ZXM7XG5cbiAgICAvLyBjcmVhdGVcbiAgICBjb25zdCBtZXNoID0gdXRpbHMuY3JlYXRlTWVzaChwcmltaXRpdmVEYXRhKTtcbiAgICAvLyBzZXQgZG91YmxlIHNpZGVkIGZsYWcgZm9yIHJheWNhc3RcbiAgICBjb25zdCBzdWJNZXNoID0gbWVzaC5yZW5kZXJpbmdTdWJNZXNoZXNbMF07XG4gICAgY29uc3QgaW5mbyA9IHN1Yk1lc2guZ2VvbWV0cmljSW5mbztcbiAgICBpZiAoaW5mbykge1xuICAgICAgICBpbmZvLmRvdWJsZVNpZGVkID0gcHJpbWl0aXZlLmRvdWJsZVNpZGVkO1xuICAgIH1cbiAgICAvLyBjYWNoZSB2YiBidWZmZXIgZm9yIHZiIHVwZGF0ZVxuICAgIGNvbnN0IHZiSW5mbyA9IG1lc2guc3RydWN0LnZlcnRleEJ1bmRsZXNbMF0udmlldztcblxuICAgIGlmICh2YkluZm8pIHtcbiAgICAgICAgc3ViTWVzaC52QnVmZmVyID0gbWVzaC5kYXRhLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyXG4gICAgICAgICAgICA/IG1lc2guZGF0YS5idWZmZXIuc2xpY2UodmJJbmZvLm9mZnNldCwgdmJJbmZvLm9mZnNldCArIHZiSW5mby5sZW5ndGgpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgdmJNYXAuc2V0KHN1Yk1lc2gsIHN1Yk1lc2gudkJ1ZmZlcik7XG4gICAgfVxuXG4gICAgY29uc3QgaWJJbmZvID0gbWVzaC5zdHJ1Y3QucHJpbWl0aXZlc1swXS5pbmRleFZpZXc7XG4gICAgaWYgKGliSW5mbykge1xuICAgICAgICBzdWJNZXNoLmlCdWZmZXIgPSBtZXNoLmRhdGEuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXJcbiAgICAgICAgICAgID8gbWVzaC5kYXRhLmJ1ZmZlci5zbGljZShpYkluZm8ub2Zmc2V0LCBpYkluZm8ub2Zmc2V0ICsgaWJJbmZvLmxlbmd0aClcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICBpYk1hcC5zZXQoc3ViTWVzaCwgc3ViTWVzaC5pQnVmZmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUR5bmFtaWNNZXNoKHByaW1pdGl2ZTogRHluYW1pY01lc2hQcmltaXRpdmUsIG9wdHM6IChwcmltaXRpdmVzLklDcmVhdGVEeW5hbWljTWVzaE9wdGlvbnMgJiBJQ3JlYXRlTWVzaE9wdGlvbikpOiBNZXNoIHtcbiAgICAvLyBwcmVwYXJlIGRhdGFcbiAgICBjb25zdCBwcmltaXRpdmVEYXRhOiBwcmltaXRpdmVzLklEeW5hbWljR2VvbWV0cnkgPSBwcmltaXRpdmUudHJhbnNmb3JtVG9EeW5hbWljR2VvbWV0cnkoKTtcblxuICAgIGlmIChwcmltaXRpdmUubm9ybWFscykge1xuICAgICAgICBwcmltaXRpdmVEYXRhLm5vcm1hbHMgPSBGbG9hdDMyQXJyYXkuZnJvbShmbGF0KHByaW1pdGl2ZS5ub3JtYWxzLCAodjogVmVjMykgPT4gW3YueCwgdi55LCB2LnpdKSk7XG4gICAgfVxuICAgIGlmIChwcmltaXRpdmUudXZzKSB7XG4gICAgICAgIHByaW1pdGl2ZURhdGEudXZzID0gRmxvYXQzMkFycmF5LmZyb20oZmxhdChwcmltaXRpdmUudXZzLCAodjogVmVjMikgPT4gW3YueCwgdi55XSkpO1xuICAgIH1cblxuICAgIGxldCBjdXN0b21BdHRyaWJ1dGVzID0gcHJpbWl0aXZlRGF0YS5jdXN0b21BdHRyaWJ1dGVzO1xuICAgIGlmIChvcHRzPy5kYXNoZWQpIHtcbiAgICAgICAgaWYgKCFjdXN0b21BdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBjdXN0b21BdHRyaWJ1dGVzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsaW5lRGlzdGFuY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZS5wb3NpdGlvbnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gcHJpbWl0aXZlLnBvc2l0aW9uc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGVuZCA9IHByaW1pdGl2ZS5wb3NpdGlvbnNbaSArIDFdO1xuICAgICAgICAgICAgbGluZURpc3RhbmNlc1tpXSA9IChpID09PSAwKSA/IDAgOiBsaW5lRGlzdGFuY2VzW2kgLSAxXTtcbiAgICAgICAgICAgIGxpbmVEaXN0YW5jZXNbaSArIDFdID0gbGluZURpc3RhbmNlc1tpXSArIFZlYzMuZGlzdGFuY2Uoc3RhcnQgYXMgVmVjMywgZW5kIGFzIFZlYzMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VzdG9tQXR0cmlidXRlcy5wdXNoKHtcbiAgICAgICAgICAgIGF0dHI6IG5ldyBnZnguQXR0cmlidXRlKCdhX2xpbmVEaXN0YW5jZScsIGdmeC5Gb3JtYXQuUjMyRiksXG4gICAgICAgICAgICB2YWx1ZXM6IEZsb2F0MzJBcnJheS5mcm9tKGxpbmVEaXN0YW5jZXMpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcmltaXRpdmVEYXRhLmN1c3RvbUF0dHJpYnV0ZXMgPSBjdXN0b21BdHRyaWJ1dGVzO1xuXG4gICAgLy8gY3JlYXRlXG4gICAgY29uc3QgbWVzaCA9ICh1dGlscyBhcyBhbnkpLk1lc2hVdGlscy5jcmVhdGVEeW5hbWljTWVzaCgwLCBwcmltaXRpdmVEYXRhLCB1bmRlZmluZWQsIG9wdHMpO1xuXG4gICAgLy8gc2V0IGRvdWJsZSBzaWRlZCBmbGFnIGZvciByYXljYXN0XG4gICAgY29uc3Qgc3ViTWVzaCA9IG1lc2gucmVuZGVyaW5nU3ViTWVzaGVzWzBdO1xuICAgIGNvbnN0IGluZm8gPSBzdWJNZXNoLmdlb21ldHJpY0luZm87XG4gICAgaWYgKGluZm8pIHtcbiAgICAgICAgaW5mby5kb3VibGVTaWRlZCA9IHByaW1pdGl2ZS5kb3VibGVTaWRlZDtcbiAgICB9XG4gICAgLy8gY2FjaGUgdmIgYnVmZmVyIGZvciB2YiB1cGRhdGVcbiAgICBjb25zdCB2YkluZm8gPSBtZXNoLnN0cnVjdC52ZXJ0ZXhCdW5kbGVzWzBdLnZpZXc7XG5cbiAgICBpZiAodmJJbmZvKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgc3ViTWVzaC52QnVmZmVyID0gbWVzaC5kYXRhLmJ1ZmZlci5zbGljZSh2YkluZm8ub2Zmc2V0LCB2YkluZm8ub2Zmc2V0ICsgdmJJbmZvLmxlbmd0aCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdmJNYXAuc2V0KHN1Yk1lc2gsIHN1Yk1lc2gudkJ1ZmZlcik7XG4gICAgfVxuXG4gICAgY29uc3QgaWJJbmZvID0gbWVzaC5zdHJ1Y3QucHJpbWl0aXZlc1swXS5pbmRleFZpZXc7XG4gICAgaWYgKGliSW5mbykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHN1Yk1lc2guaUJ1ZmZlciA9IG1lc2guZGF0YS5idWZmZXIuc2xpY2UoaWJJbmZvLm9mZnNldCwgaWJJbmZvLm9mZnNldCArIGliSW5mby5sZW5ndGgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGliTWFwLnNldChzdWJNZXNoLCBzdWJNZXNoLmlCdWZmZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBtZXNoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlRHluYW1pY01lc2gobWVzaFJlbmRlcmVyOiBNZXNoUmVuZGVyZXIsIHN1YkluZGV4OiBudW1iZXIsIHByaW1pdGl2ZTogRHluYW1pY01lc2hQcmltaXRpdmUpIHtcbiAgICBjb25zdCBwcmltaXRpdmVEYXRhOiBwcmltaXRpdmVzLklEeW5hbWljR2VvbWV0cnkgPSBwcmltaXRpdmUudHJhbnNmb3JtVG9EeW5hbWljR2VvbWV0cnkoKTtcbiAgICBtZXNoUmVuZGVyZXIubWVzaD8udXBkYXRlU3ViTWVzaChzdWJJbmRleCwgcHJpbWl0aXZlRGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRNZXNoVG9Ob2RlKG5vZGU6IE5vZGUsIG1lc2g6IGFueSwgb3B0czogSUFkZE1lc2hUb05vZGVPcHRpb24gPSB7fSwgcmV1c2VNYXRlcmlhbD86IE1hdGVyaWFsKSB7XG4gICAgY29uc3QgbW9kZWwgPSBub2RlLmFkZENvbXBvbmVudChNZXNoUmVuZGVyZXIpO1xuICAgIGNvbnN0IGRlZmluZXM6IGFueSA9IHt9O1xuICAgIGlmIChvcHRzLmZvcndhcmRQaXBlbGluZSkge1xuICAgICAgICBkZWZpbmVzLlVTRV9GT1JXQVJEX1BJUEVMSU5FID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAob3B0cy5kYXNoZWQpIHtcbiAgICAgICAgZGVmaW5lcy5VU0VfREFTSEVEX0xJTkUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmluc3RhbmNpbmcpIHtcbiAgICAgICAgZGVmaW5lcy5VU0VfSU5TVEFOQ0lORyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMudXNlTGlnaHRQcm9iZSkge1xuICAgICAgICBkZWZpbmVzLkNDX1VTRV9MSUdIVF9QUk9CRSA9IHRydWU7XG4gICAgfVxuXG4gICAgbW9kZWwubWVzaCA9IG1lc2g7XG4gICAgY29uc3QgY2IgPSBtb2RlbC5vbkVuYWJsZS5iaW5kKG1vZGVsKTtcbiAgICBtb2RlbC5vbkVuYWJsZSA9ICgpID0+IHtcbiAgICAgICAgY2IoKTtcbiAgICB9OyAvLyBkb24ndCBzaG93IG9uIHByZXZpZXcgY2FtZXJhc1xuICAgIGNvbnN0IHBtID0gbWVzaC5yZW5kZXJpbmdTdWJNZXNoZXNbMF0ucHJpbWl0aXZlTW9kZTtcbiAgICBsZXQgdGVjaG5pcXVlID0gMDtcbiAgICBsZXQgZWZmZWN0TmFtZSA9ICdpbnRlcm5hbC9lZGl0b3IvZ2l6bW8nO1xuICAgIGlmIChvcHRzLmVmZmVjdE5hbWUpIHtcbiAgICAgICAgZWZmZWN0TmFtZSA9IG9wdHMuZWZmZWN0TmFtZTtcbiAgICB9IGVsc2UgaWYgKG9wdHMudGVjaG5pcXVlKSB7XG4gICAgICAgIHRlY2huaXF1ZSA9IG9wdHMudGVjaG5pcXVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChvcHRzLnVubGl0KSB7XG4gICAgICAgICAgICB0ZWNobmlxdWUgPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdHMudGV4dHVyZSkge1xuICAgICAgICAgICAgdGVjaG5pcXVlID0gMztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChwbSA8IHRyaWFuZ2xlcykge1xuICAgICAgICAgICAgICAgIHRlY2huaXF1ZSA9IG9wdHMubm9EZXB0aFRlc3RGb3JMaW5lcyA/IDEgOiAyOyAvLyB1bmxpdFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZWNobmlxdWUgPSBvcHRzLmRlcHRoVGVzdEZvclRyaWFuZ2xlcyA/IDQgOiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbXRsID0gcmV1c2VNYXRlcmlhbCA/PyBuZXcgTWF0ZXJpYWwoKTtcbiAgICBjb25zdCBzdGF0ZXM6IGFueSA9IHt9O1xuICAgIGlmIChvcHRzLmN1bGxNb2RlKSB7XG4gICAgICAgIHN0YXRlcy5yYXN0ZXJpemVyU3RhdGUgPSB7IGN1bGxNb2RlOiBvcHRzLmN1bGxNb2RlIH07XG4gICAgfVxuICAgIGlmIChvcHRzLmRlcHRoU3RlbmNpbFN0YXRlKSB7XG4gICAgICAgIHN0YXRlcy5kZXB0aFN0ZW5jaWxTdGF0ZSA9IG9wdHMuZGVwdGhTdGVuY2lsU3RhdGU7XG4gICAgfVxuICAgIGlmIChwbSAhPT0gdHJpYW5nbGVzKSB7XG4gICAgICAgIHN0YXRlcy5wcmltaXRpdmUgPSBwbTtcbiAgICB9XG4gICAgaWYgKG9wdHMucHJpb3JpdHkpIHtcbiAgICAgICAgc3RhdGVzLnByaW9yaXR5ID0gb3B0cy5wcmlvcml0eTtcbiAgICB9XG5cbiAgICAvLyDmnKrliJ3lp4vljJbnmoTmnZDotKhoYXNo5YC85Li6MFxuICAgIGlmIChtdGwuaGFzaCA9PT0gMCkge1xuICAgICAgICBtdGwuaW5pdGlhbGl6ZSh7IGVmZmVjdE5hbWUsIHRlY2huaXF1ZSwgc3RhdGVzLCBkZWZpbmVzIH0pO1xuICAgIH1cbiAgICBpZiAob3B0cy5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChub2RlLm1vZGVsQ29sb3IpIHtcbiAgICAgICAgICAgIG5vZGUubW9kZWxDb2xvci5hID0gb3B0cy5hbHBoYTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtdGwuc2V0UHJvcGVydHkoJ21haW5Db2xvcicsIChub2RlIGFzIGFueSkubW9kZWxDb2xvcik7XG4gICAgbW9kZWwubWF0ZXJpYWwgPSBtdGw7XG4gICAgbm9kZS5tb2RlbENvbXAgPSBtb2RlbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1lc2hDb2xvcihub2RlOiBOb2RlLCBjOiBDb2xvcikge1xuICAgIGxldCBhbHBoYSA9IGMuYTtcbiAgICBpZiAobm9kZS5tb2RlbENvbG9yKSB7XG4gICAgICAgIGFscGhhID0gbm9kZS5tb2RlbENvbG9yLmE7XG4gICAgfVxuICAgIG5vZGUubW9kZWxDb2xvciA9IGMuY2xvbmUoKTtcbiAgICBub2RlLm1vZGVsQ29sb3IuYSA9IGFscGhhO1xuICAgIHNldE5vZGVNYXRlcmlhbFByb3BlcnR5KG5vZGUsICdtYWluQ29sb3InLCBub2RlLm1vZGVsQ29sb3IpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWVzaENvbG9yKG5vZGU6IE5vZGUpOiBDb2xvciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIG5vZGUubW9kZWxDb2xvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGVPcGFjaXR5KG5vZGU6IE5vZGUsIG9wYWNpdHk6IG51bWJlcikge1xuICAgIGlmIChub2RlLm1vZGVsQ29sb3IpIHtcbiAgICAgICAgbm9kZS5tb2RlbENvbG9yLmEgPSBvcGFjaXR5O1xuICAgIH1cbiAgICBzZXROb2RlTWF0ZXJpYWxQcm9wZXJ0eShub2RlLCAnbWFpbkNvbG9yJywgbm9kZS5tb2RlbENvbG9yKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVPcGFjaXR5KG5vZGU6IE5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5tb2RlbENvbG9yPy5hID8/IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXRlcmlhbFByb3BlcnR5KG5vZGU6IE5vZGUsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBzZXROb2RlTWF0ZXJpYWxQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgdmFsdWUpO1xufVxuXG4vKipcbiAqIOiuvue9ruWFieeFp+aOoumSiOWPr+inhuWMluadkOi0qOeahCBTSCDns7vmlbDvvIjlr7nlupQgaW50ZXJuYWwvZWRpdG9yL2xpZ2h0LXByb2JlLXZpc3VhbGl6YXRpb24g55qEIENvbnN0YW50IHVuaWZvcm3vvInjgIJcbiAqIOenu+akjeiHqiBDb2NvcyBDcmVhdG9yIEVuZ2luZVV0aWxzLnNldE1lc2hTSENvZWZmaWNpZW50c+OAglxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0TWVzaFNIQ29lZmZpY2llbnRzKG5vZGU6IE5vZGUsIGNvZWZmaWNpZW50czogRmxvYXQzMkFycmF5KSB7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgVmVjNCgpO1xuICAgIGNvbnN0IG5hbWVzID0gW1xuICAgICAgICAnY2Nfc2hfbGluZWFyX2NvbnN0X3InLFxuICAgICAgICAnY2Nfc2hfbGluZWFyX2NvbnN0X2cnLFxuICAgICAgICAnY2Nfc2hfbGluZWFyX2NvbnN0X2InLFxuICAgICAgICAnY2Nfc2hfcXVhZHJhdGljX3InLFxuICAgICAgICAnY2Nfc2hfcXVhZHJhdGljX2cnLFxuICAgICAgICAnY2Nfc2hfcXVhZHJhdGljX2InLFxuICAgICAgICAnY2Nfc2hfcXVhZHJhdGljX2EnLFxuICAgIF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBpICogNDtcbiAgICAgICAgdmFsdWUuc2V0KGNvZWZmaWNpZW50c1tvZmZzZXRdLCBjb2VmZmljaWVudHNbb2Zmc2V0ICsgMV0sIGNvZWZmaWNpZW50c1tvZmZzZXQgKyAyXSwgY29lZmZpY2llbnRzW29mZnNldCArIDNdKTtcbiAgICAgICAgc2V0Tm9kZU1hdGVyaWFsUHJvcGVydHkobm9kZSwgbmFtZXNbaV0sIHZhbHVlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbChub2RlOiBOb2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuZ2V0Q29tcG9uZW50KE1lc2hSZW5kZXJlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVQb3NpdGlvbnMoY29tcDogTWVzaFJlbmRlcmVyLCBkYXRhOiBJVmVjM0xpa2VbXSkge1xuICAgIGNvbnN0IG1vZGVsID0gY29tcC5tb2RlbCAmJiBjb21wLm1vZGVsLnN1Yk1vZGVsc1swXTtcbiAgICBpZiAoIW1vZGVsIHx8ICFtb2RlbC5pbnB1dEFzc2VtYmxlciB8fCAhbW9kZWwuc3ViTWVzaCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHsgc3ViTWVzaCB9ID0gbW9kZWw7XG5cbiAgICBjb25zdCBwb2ludHMgPSBmbGF0KGRhdGEsICh2OiBWZWMzKSA9PiBbdi54LCB2LnksIHYuel0pO1xuICAgIHVwZGF0ZVZCQXR0cihjb21wLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OLCBwb2ludHMpO1xuXG4gICAgLy8gc3luYyB0byByYXljYXN0IGRhdGFcbiAgICBpZiAoc3ViTWVzaC5nZW9tZXRyaWNJbmZvKSB7XG4gICAgICAgIGlmIChzdWJNZXNoLmdlb21ldHJpY0luZm8ucG9zaXRpb25zLmxlbmd0aCA+PSBwb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBzdWJNZXNoLmdlb21ldHJpY0luZm8ucG9zaXRpb25zLnNldChwb2ludHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3ViTWVzaC5nZW9tZXRyaWNJbmZvLnBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVZCQXR0cihjb21wOiBNZXNoUmVuZGVyZXIsIGF0dHI6IHN0cmluZywgZGF0YTogbnVtYmVyW10pIHtcbiAgICBjb25zdCBtb2RlbCA9IGNvbXAubW9kZWwgJiYgY29tcC5tb2RlbC5zdWJNb2RlbHNbMF07XG4gICAgaWYgKCFtb2RlbCB8fCAhbW9kZWwuaW5wdXRBc3NlbWJsZXIgfHwgIW1vZGVsLnN1Yk1lc2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB7IGlucHV0QXNzZW1ibGVyLCBzdWJNZXNoIH0gPSBtb2RlbDtcbiAgICBsZXQgdkJ1ZmZlciA9IHN1Yk1lc2gudkJ1ZmZlciBhcyBBcnJheUJ1ZmZlcjtcbiAgICAvLyB1cGRhdGUgdmJcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBsZXQgZm9ybWF0ID0gZ2Z4LkZvcm1hdC5VTktOT1dOO1xuICAgIGZvciAoY29uc3QgYSBvZiBpbnB1dEFzc2VtYmxlci5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhLm5hbWUgPT09IGF0dHIpIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGEuZm9ybWF0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgb2Zmc2V0ICs9IGdmeC5Gb3JtYXRJbmZvc1thLmZvcm1hdF0uc2l6ZTtcbiAgICB9XG4gICAgY29uc3QgdmIgPSBpbnB1dEFzc2VtYmxlci52ZXJ0ZXhCdWZmZXJzWzBdO1xuICAgIGlmICghZm9ybWF0IHx8ICF2Yikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmV3U2l6ZSA9IHZiLnN0cmlkZSAqIGRhdGEubGVuZ3RoIC8gZ2Z4LkZvcm1hdEluZm9zW2Zvcm1hdF0uY291bnQ7XG4gICAgLy8g6ZyA6KaB5omp5aSnVkLnmoTlpKflsI9cbiAgICBpZiAodkJ1ZmZlci5ieXRlTGVuZ3RoIDwgbmV3U2l6ZSkge1xuICAgICAgICB2QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKG5ld1NpemUpO1xuICAgICAgICB2Yk1hcC5zZXQoc3ViTWVzaCwgdkJ1ZmZlcik7XG4gICAgICAgIHZiLnJlc2l6ZShuZXdTaXplKTtcbiAgICB9XG4gICAgdXRpbHMud3JpdGVCdWZmZXIobmV3IERhdGFWaWV3KHZCdWZmZXIpLCBkYXRhLCBmb3JtYXQsIG9mZnNldCwgdmIuc3RyaWRlKTtcblxuICAgIHZiLnVwZGF0ZSh2QnVmZmVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUlCKGNvbXA6IE1lc2hSZW5kZXJlciwgZGF0YTogbnVtYmVyW10pOiB2b2lkIHtcbiAgICBjb25zdCBtb2RlbCA9IGNvbXAubW9kZWwgJiYgY29tcC5tb2RlbC5zdWJNb2RlbHNbMF07XG4gICAgaWYgKCFtb2RlbCB8fCAhbW9kZWwuaW5wdXRBc3NlbWJsZXIgfHwgIW1vZGVsLnN1Yk1lc2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB7IGlucHV0QXNzZW1ibGVyLCBzdWJNZXNoIH0gPSBtb2RlbDtcblxuICAgIGxldCBpQnVmZmVyID0gaWJNYXAuZ2V0KHN1Yk1lc2gpIGFzIEFycmF5QnVmZmVyO1xuICAgIC8vIHVwZGF0ZSBpYlxuICAgIGNvbnN0IGliOiBnZnguQnVmZmVyIHwgbnVsbCA9IGlucHV0QXNzZW1ibGVyLmluZGV4QnVmZmVyO1xuICAgIGlmICghaWIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpbnB1dEFzc2VtYmxlci5pbmRleENvdW50ID09PSBkYXRhLmxlbmd0aCkge1xuICAgICAgICBuZXcgVWludDE2QXJyYXkoaUJ1ZmZlciBhcyBBcnJheUJ1ZmZlcikuc2V0KGRhdGEpO1xuICAgICAgICBpYi51cGRhdGUoaUJ1ZmZlcik7XG4gICAgICAgIC8vIHN5bmMgdG8gcmF5Y2FzdCBkYXRhXG4gICAgICAgIGlmIChzdWJNZXNoLmdlb21ldHJpY0luZm8gJiYgc3ViTWVzaC5nZW9tZXRyaWNJbmZvLmluZGljZXMpIHtcbiAgICAgICAgICAgIHN1Yk1lc2guZ2VvbWV0cmljSW5mby5pbmRpY2VzLnNldChkYXRhKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5ld1NpemUgPSBkYXRhLmxlbmd0aCAqIGliLnN0cmlkZTtcbiAgICAgICAgLy8g6ZyA6KaB5omp5aSnSULnmoTlpKflsI9cbiAgICAgICAgaWYgKG5ld1NpemUgPiBpQnVmZmVyLmJ5dGVMZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIobmV3U2l6ZSk7XG4gICAgICAgICAgICBpYk1hcC5zZXQoc3ViTWVzaCwgaUJ1ZmZlcik7XG4gICAgICAgICAgICBpYi5yZXNpemUobmV3U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3IFVpbnQxNkFycmF5KGlCdWZmZXIgYXMgQXJyYXlCdWZmZXIpLnNldChkYXRhKTtcbiAgICAgICAgaWIudXBkYXRlKGlCdWZmZXIpO1xuICAgICAgICBpbnB1dEFzc2VtYmxlci5pbmRleENvdW50ID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIC8vIHN5bmMgdG8gcmF5Y2FzdCBkYXRhXG4gICAgICAgIGlmIChzdWJNZXNoLmdlb21ldHJpY0luZm8gJiYgc3ViTWVzaC5nZW9tZXRyaWNJbmZvLmluZGljZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGljZXNEYXRhID0gbmV3IFVpbnQxNkFycmF5KGRhdGEpO1xuICAgICAgICAgICAgc3ViTWVzaC5nZW9tZXRyaWNJbmZvLmluZGljZXMgPSBpbmRpY2VzRGF0YTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJvdW5kaW5nQm94KG1lc2hDb21wOiBNZXNoUmVuZGVyZXIsIG1pblBvcz86IG1hdGguVmVjMywgbWF4UG9zPzogbWF0aC5WZWMzKSB7XG4gICAgY29uc3QgbW9kZWwgPSBtZXNoQ29tcC5tb2RlbDtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtb2RlbC5jcmVhdGVCb3VuZGluZ1NoYXBlKG1pblBvcywgbWF4UG9zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJheWNhc3RSZXN1bHRzQnlOb2Rlcyhub2RlczogTm9kZVtdLCB4OiBudW1iZXIsIHk6IG51bWJlciwgZGlzdGFuY2UgPSBJbmZpbml0eSwgZm9yU25hcCA9IGZhbHNlLCBleGNsdWRlTWFzaz86IG51bWJlcik6IFJheWNhc3RSZXN1bHRzIHtcbiAgICBjb25zdCByZXN1bHRzID0gbmV3IFJheWNhc3RSZXN1bHRzKHJheSk7XG4gICAgY29uc3QgY2FtZXJhID0gZ2V0RWRpdG9yQ2FtZXJhKCk7XG4gICAgaWYgKCFjYW1lcmEgfHwgIWNhbWVyYS5jYW1lcmEpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgY2FtZXJhLmNhbWVyYS5zY3JlZW5Qb2ludFRvUmF5KHJheSwgeCwgeSk7XG5cbiAgICBjb25zdCB3YWxrQWxsTW9kZWxzID0gKG5vZGU6IE5vZGUsIGNiOiAobXI6IE1lc2hSZW5kZXJlcikgPT4gdm9pZCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbENvbXBvbmVudCA9IG5vZGUuZ2V0Q29tcG9uZW50cyhNZXNoUmVuZGVyZXIpO1xuICAgICAgICBtb2RlbENvbXBvbmVudC5mb3JFYWNoKGUgPT4gY2IoZSkpO1xuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgICAgIHdhbGtBbGxNb2RlbHMoY2hpbGRyZW4sIGNiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHdhbGtBbGxNb2RlbHMobm9kZSwgKG1yOiBNZXNoUmVuZGVyZXIpID0+IHtcbiAgICAgICAgICAgIGlmICghbXIubW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChyYXljYXN0VXRpbC5yYXljYXN0U2luZ2xlTW9kZWwocmF5LCBtci5tb2RlbCwgbm9kZVsnX2xheWVyJ10sIGRpc3RhbmNlLCBmb3JTbmFwLCBleGNsdWRlTWFzaykpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goLi4ucmF5Y2FzdFV0aWwucmF5UmVzdWx0U2luZ2xlTW9kZWwpO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMuc29ydChjbXApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmF5Y2FzdFJlc3VsdHMocm9vdE5vZGU6IE5vZGUsIHg6IG51bWJlciwgeTogbnVtYmVyLCBkaXN0YW5jZSA9IEluZmluaXR5LCBleGNsdWRlTWFzaz86IG51bWJlcik6IFJheWNhc3RSZXN1bHRzIHtcbiAgICBjb25zdCBzY2VuZSA9IChyb290Tm9kZSBhcyBhbnkpLnNjZW5lPy5yZW5kZXJTY2VuZSBhcyByZW5kZXJlci5SZW5kZXJTY2VuZTtcbiAgICBjb25zdCBjYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICBpZiAoIWNhbWVyYSB8fCAhY2FtZXJhLmNhbWVyYSB8fCAhc2NlbmUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYXljYXN0UmVzdWx0cyhyYXkpO1xuICAgIH1cblxuICAgIGNhbWVyYS5jYW1lcmEuc2NyZWVuUG9pbnRUb1JheShyYXksIHgsIHkpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBuZXcgUmF5Y2FzdFJlc3VsdHMocmF5KTtcbiAgICBpZiAocmF5Y2FzdFV0aWwucmF5Y2FzdEFsbE1vZGVscyhzY2VuZSwgcmF5LCByb290Tm9kZVsnX2xheWVyJ10sIGRpc3RhbmNlLCBmYWxzZSwgZXhjbHVkZU1hc2spKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCguLi5yYXljYXN0VXRpbC5yYXlSZXN1bHRNb2RlbHMpO1xuICAgICAgICByZXN1bHRzLnNvcnQoY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYXljYXN0KHNjZW5lOiBhbnksIGNhbWVyYTogYW55LCBsYXllcjogYW55LCB4OiBudW1iZXIsIHk6IG51bWJlciwgZGlzdGFuY2UgPSBJbmZpbml0eSwgZXhjbHVkZU1hc2s/OiBudW1iZXIpOiBSYXljYXN0UmVzdWx0cyB8IG51bGwge1xuICAgIGlmICghY2FtZXJhIHx8ICFjYW1lcmEuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjYW1lcmEuc2NyZWVuUG9pbnRUb1JheShyYXksIHgsIHkpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBuZXcgUmF5Y2FzdFJlc3VsdHMocmF5KTtcbiAgICBpZiAocmF5Y2FzdFV0aWwucmF5Y2FzdEFsbE1vZGVscyhzY2VuZSwgcmF5LCBsYXllciwgZGlzdGFuY2UsIGZhbHNlLCBleGNsdWRlTWFzaykpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLnJheWNhc3RVdGlsLnJheVJlc3VsdE1vZGVscyk7XG4gICAgICAgIHJlc3VsdHMuc29ydChjbXApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJheWNhc3RBbGxDb2xsaWRlcnMoY2FtZXJhOiBhbnksIHg6IG51bWJlciwgeTogbnVtYmVyKTogYW55W10gJiB7IHJheT86IGdlb21ldHJ5LlJheSB9IHtcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSAmIHsgcmF5PzogZ2VvbWV0cnkuUmF5IH0gPSBbXSBhcyBhbnk7XG4gICAgaWYgKCFjYW1lcmE/LmNhbWVyYSkgcmV0dXJuIHJlc3VsdHM7XG4gICAgY2FtZXJhLmNhbWVyYS5zY3JlZW5Qb2ludFRvUmF5KHJheSwgeCwgeSk7XG4gICAgcmVzdWx0cy5yYXkgPSByYXk7XG4gICAgY29uc3QgUGh5c2ljc1N5c3RlbSA9IChjYyBhcyBhbnkpLlBoeXNpY3NTeXN0ZW07XG4gICAgY29uc3QgcGh5c2ljc1N5c3RlbSA9IFBoeXNpY3NTeXN0ZW0/Lmluc3RhbmNlO1xuICAgIGlmICghcGh5c2ljc1N5c3RlbT8ucmF5Y2FzdEFsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKHBoeXNpY3NTeXN0ZW0ucmF5Y2FzdEFsbChyYXkpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCguLi5waHlzaWNzU3lzdGVtLnJheWNhc3RSZXN1bHRzKTtcbiAgICAgICAgcmVzdWx0cy5zb3J0KGNtcCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmF5Y2FzdFJlc3VsdHNGb3JTbmFwKGNhbWVyYTogYW55LCB4OiBudW1iZXIsIHk6IG51bWJlciwgbWFzazogbnVtYmVyID0gfkxheWVycy5FbnVtLlNDRU5FX0dJWk1PKTogUmF5Y2FzdFJlc3VsdHMge1xuICAgIGNvbnN0IHNjZW5lID0gKGNjIGFzIGFueSkuZGlyZWN0b3I/LmdldFNjZW5lKCk7XG4gICAgaWYgKCFzY2VuZSB8fCAhY2FtZXJhPy5jYW1lcmEpIHJldHVybiBuZXcgUmF5Y2FzdFJlc3VsdHMocmF5KTtcbiAgICBjb25zdCByZW5kZXJTY2VuZSA9IChzY2VuZSBhcyBhbnkpLnJlbmRlclNjZW5lIGFzIHJlbmRlcmVyLlJlbmRlclNjZW5lO1xuICAgIGlmICghcmVuZGVyU2NlbmUpIHJldHVybiBuZXcgUmF5Y2FzdFJlc3VsdHMocmF5KTtcbiAgICBjYW1lcmEuY2FtZXJhLnNjcmVlblBvaW50VG9SYXkocmF5LCB4LCB5KTtcbiAgICBjb25zdCByZXN1bHRzID0gbmV3IFJheWNhc3RSZXN1bHRzKHJheSk7XG4gICAgaWYgKHJheWNhc3RVdGlsLnJheWNhc3RBbGxNb2RlbHMocmVuZGVyU2NlbmUsIHJheSwgbWFzaywgSW5maW5pdHksIHRydWUpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCguLi5yYXljYXN0VXRpbC5yYXlSZXN1bHRNb2RlbHMpO1xuICAgICAgICByZXN1bHRzLnNvcnQoY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXNoVmVydGV4QXJvdW5kTW91c2Uobm9kZTogTm9kZSwgY2FtZXJhOiBhbnksIHg6IG51bWJlciwgeTogbnVtYmVyLCByYWRpdXM6IG51bWJlciA9IDMwKTogVmVjNFtdIHtcbiAgICBpZiAoIWNhbWVyYT8uY2FtZXJhIHx8ICFub2RlKSByZXR1cm4gW107XG4gICAgY29uc3QgdGFyZ2V0Tm9kZSA9IE5vZGUuaXNOb2RlKG5vZGUpID8gbm9kZSA6ICgobm9kZSBhcyBhbnkpLmNvbGxpZGVyPy5ub2RlID8/IChub2RlIGFzIGFueSkubm9kZSA/PyBudWxsKTtcbiAgICBpZiAoIXRhcmdldE5vZGUpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHZlcnRleHM6IFZlYzRbXSA9IFtdO1xuICAgIGNvbnN0IHZlcnRleCA9IG5ldyBWZWMzKCk7XG4gICAgY29uc3Qgd29ybGRQb3MgPSBuZXcgVmVjMygpO1xuICAgIGNvbnN0IHNjcmVlblBvcyA9IG5ldyBWZWMzKCk7XG4gICAgY29uc3Qgd29ybGRNYXRyaXggPSB0YXJnZXROb2RlLmdldFdvcmxkTWF0cml4KCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdGFyZ2V0Tm9kZS5nZXRDb21wb25lbnRzSW5DaGlsZHJlbj8uKE1lc2hSZW5kZXJlcikgPz8gW107XG4gICAgY29tcG9uZW50cy5mb3JFYWNoKChyZW5kZXJhYmxlQ21wOiBNZXNoUmVuZGVyZXIpID0+IHtcbiAgICAgICAgY29uc3QgbWVzaCA9IChyZW5kZXJhYmxlQ21wIGFzIGFueSkubWVzaDtcbiAgICAgICAgY29uc3QgbGVuID0gbWVzaD8ucmVuZGVyaW5nU3ViTWVzaGVzPy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHN1Yk1lc2ggPSBtZXNoLnJlbmRlcmluZ1N1Yk1lc2hlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGdlb0luZm8gPSBzdWJNZXNoPy5nZW9tZXRyaWNJbmZvO1xuICAgICAgICAgICAgaWYgKGdlb0luZm8pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBnZW9JbmZvLnBvc2l0aW9ucztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBwb3NpdGlvbnMubGVuZ3RoOyBpZHggKz0gMykge1xuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXguc2V0KHBvc2l0aW9uc1tpZHhdLCBwb3NpdGlvbnNbaWR4ICsgMV0sIHBvc2l0aW9uc1tpZHggKyAyXSk7XG4gICAgICAgICAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NCh3b3JsZFBvcywgdmVydGV4LCB3b3JsZE1hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIGNhbWVyYS5jYW1lcmEud29ybGRUb1NjcmVlbihzY3JlZW5Qb3MsIHdvcmxkUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHggPSBzY3JlZW5Qb3MueCAtIHg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR5ID0gc2NyZWVuUG9zLnkgLSB5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW5ndGggPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVuZ3RoIDwgcmFkaXVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhzLnB1c2gobmV3IFZlYzQodmVydGV4LngsIHZlcnRleC55LCB2ZXJ0ZXgueiwgbGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZlcnRleHMuc29ydCgoYSwgYikgPT4gYS53IC0gYi53KTtcbiAgICByZXR1cm4gdmVydGV4cztcbn1cbiJdfQ==