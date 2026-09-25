"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialPreview = void 0;
const interactive_preview_1 = require("./interactive-preview");
const cc_1 = require("cc");
const regions = [new cc_1.gfx.BufferTextureCopy()];
regions[0].texExtent.depth = 1;
function insertAdditionals(geometry) {
    if (!geometry.customAttributes) {
        geometry.customAttributes = [];
    }
    const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
    if (EditorExtends?.GeometryUtils?.calculateTangents) {
        geometry.customAttributes.push({
            attr: new cc_1.gfx.Attribute(cc_1.gfx.AttributeName.ATTR_TANGENT, cc_1.gfx.Format.RGBA32F),
            values: EditorExtends.GeometryUtils.calculateTangents(geometry.positions, geometry.indices, geometry.normals, geometry.uvs),
        });
    }
    return geometry;
}
let primitiveData = null;
function getPrimitiveData() {
    if (!primitiveData) {
        primitiveData = {
            box: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.box())),
                scale: new cc_1.Vec3(1, 1, 1),
            },
            sphere: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.sphere())),
                scale: new cc_1.Vec3(1, 1, 1),
            },
            capsule: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.capsule())),
                scale: new cc_1.Vec3(0.8, 0.8, 0.8),
            },
            cylinder: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.cylinder())),
                scale: new cc_1.Vec3(0.8, 0.8, 0.8),
            },
            torus: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.torus())),
                scale: new cc_1.Vec3(1, 1, 1),
            },
            cone: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.cone())),
                scale: new cc_1.Vec3(1, 1, 1),
            },
            quad: {
                mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.quad())),
                scale: new cc_1.Vec3(1, 1, 1),
            },
        };
    }
    return primitiveData;
}
const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
const transientMaterialOverridePatchKey = Symbol.for('cocos.cli.materialPreview.transientMaterialOverrides');
const asset_reload_1 = require("./asset-reload");
const material_preview_states_1 = require("./material-preview-states");
function collectTextureProperties(value, out) {
    if (!value)
        return;
    if (Array.isArray(value)) {
        value.forEach((item) => collectTextureProperties(item, out));
        return;
    }
    if (typeof value.getGFXTexture === 'function') {
        out.push(value);
    }
}
function getMaterialTextureProperties(material) {
    const textures = [];
    const propsArray = material._props;
    if (!Array.isArray(propsArray)) {
        return textures;
    }
    for (const props of propsArray) {
        if (!props)
            continue;
        for (const key of Object.keys(props)) {
            collectTextureProperties(props[key], textures);
        }
    }
    return textures;
}
function getMaterialTextureEntries(material) {
    const entries = [];
    const propsArray = material._props;
    if (!Array.isArray(propsArray)) {
        return entries;
    }
    propsArray.forEach((props, passIndex) => {
        if (!props)
            return;
        for (const name of Object.keys(props)) {
            const value = props[name];
            const textures = [];
            collectTextureProperties(value, textures);
            if (textures.length) {
                entries.push({ passIndex, name, value });
            }
        }
    });
    return entries;
}
function areTexturesReady(textures) {
    return textures.every((texture) => {
        const gfxTexture = texture.getGFXTexture?.();
        return !!gfxTexture && !!gfxTexture.width && !!gfxTexture.height;
    });
}
async function waitForMaterialTextures(material, timeoutMs = 1000) {
    const textures = getMaterialTextureProperties(material);
    if (!textures.length || areTexturesReady(textures)) {
        return;
    }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 16));
        if (areTexturesReady(textures)) {
            return;
        }
    }
}
function refreshMaterialTextureBindings(material) {
    for (const { passIndex, name, value } of getMaterialTextureEntries(material)) {
        material.setProperty(name, value, passIndex);
    }
}
function getActivePreviewService() {
    return globalThis.cli?.Scene?.Preview;
}
function isMaterialPreviewActive() {
    const previewService = getActivePreviewService();
    return !!previewService && previewService.activePreview === previewService.materialPreview;
}
function isTransientPreviewMaterial(material) {
    return isMaterialPreviewActive()
        && material
        && material.constructor === cc_1.Material
        && !material._uuid;
}
function getPassCount(material) {
    const effectAsset = material._effectAsset;
    const techIdx = material._techIdx || 0;
    const technique = effectAsset?.techniques?.[techIdx];
    return technique?.passes?.length || material._passes?.length || 1;
}
function applyMaterialRecord(material, key, overrides, passIdx) {
    if (!overrides || typeof overrides !== 'object') {
        return;
    }
    const records = Array.isArray(material[key]) ? material[key] : (material[key] = []);
    const applyAt = (index) => {
        records[index] = {
            ...(records[index] || {}),
            ...overrides,
        };
    };
    if (passIdx === undefined) {
        for (let i = 0; i < getPassCount(material); i++) {
            applyAt(i);
        }
    }
    else {
        applyAt(passIdx);
    }
    if (key === '_states') {
        (0, material_preview_states_1.omitEmptyMaterialPhaseOverrides)(records);
    }
    material._update?.(true);
}
function installTransientMaterialOverridePatch() {
    const proto = cc_1.Material.prototype;
    if (proto[transientMaterialOverridePatchKey]) {
        return;
    }
    const recompileShaders = proto.recompileShaders;
    const overridePipelineStates = proto.overridePipelineStates;
    Object.defineProperty(proto, transientMaterialOverridePatchKey, {
        configurable: false,
        enumerable: false,
        value: true,
    });
    proto.recompileShaders = function patchedRecompileShaders(overrides, passIdx) {
        if (isTransientPreviewMaterial(this)) {
            applyMaterialRecord(this, '_defines', overrides, passIdx);
            return;
        }
        return recompileShaders.call(this, overrides, passIdx);
    };
    proto.overridePipelineStates = function patchedOverridePipelineStates(overrides, passIdx) {
        if (isTransientPreviewMaterial(this)) {
            applyMaterialRecord(this, '_states', overrides, passIdx);
            return;
        }
        return overridePipelineStates.call(this, overrides, passIdx);
    };
}
/** Drops dump-default `phase: ''` and rebuilds passes so the preview camera can still draw. */
function rebuildPassesWithoutEmptyPhase(material) {
    if ((0, material_preview_states_1.omitEmptyMaterialPhaseOverrides)(material._states)) {
        material._update?.(true);
    }
}
class MaterialPreview extends interactive_preview_1.InteractivePreview {
    lightComp;
    modelComp;
    currentPrimitive = 'sphere';
    material = null;
    dummyUniformBuffer;
    dummyStorageTexture;
    dummySampleTexture;
    dummySampler;
    dummyStorageBuffer;
    uniformBuffer;
    storageBuffer;
    enableGrid = false;
    disablePan = true;
    disableMouseWheel = true;
    init(registerName, queryName) {
        super.init(registerName, queryName);
        installTransientMaterialOverridePatch();
        const device = cc_1.director.root.device;
        const isSceneNative = !!globalThis.isSceneNative;
        this.uniformBuffer = device.createBuffer(new cc_1.gfx.BufferInfo(cc_1.gfx.BufferUsageBit.UNIFORM, cc_1.gfx.MemoryUsageBit.HOST | cc_1.gfx.MemoryUsageBit.DEVICE, 16));
        this.dummyUniformBuffer = device.createBuffer(new cc_1.gfx.BufferViewInfo(this.uniformBuffer, 0, this.uniformBuffer.size));
        this.storageBuffer = !isSceneNative ? this.uniformBuffer : device.createBuffer(new cc_1.gfx.BufferInfo(cc_1.gfx.BufferUsageBit.STORAGE, cc_1.gfx.MemoryUsageBit.HOST | cc_1.gfx.MemoryUsageBit.DEVICE, 16));
        this.dummyStorageBuffer = !isSceneNative ? this.dummyUniformBuffer :
            device.createBuffer(new cc_1.gfx.BufferViewInfo(this.storageBuffer, 0, this.storageBuffer.size));
        this.dummySampleTexture = device.createTexture(new cc_1.gfx.TextureInfo(cc_1.gfx.TextureType.TEX2D, cc_1.gfx.TextureUsageBit.SAMPLED, cc_1.gfx.Format.RGBA8, 4, 4));
        this.dummyStorageTexture = !isSceneNative ? this.dummySampleTexture : device.createTexture(new cc_1.gfx.TextureInfo(cc_1.gfx.TextureType.TEX2D, cc_1.gfx.TextureUsageBit.STORAGE, cc_1.gfx.Format.RGBA8, 4, 4));
        this.dummySampler = device.getSampler(new cc_1.gfx.SamplerInfo());
    }
    createNodes(scene) {
        this.lightComp = new cc_1.Node('Material Preview Light').addComponent(cc_1.DirectionalLight);
        this.lightComp.node.setRotationFromEuler(-45, -45, 0);
        this.lightComp.node.setParent(scene);
        this.modelComp = new cc_1.Node('Material Preview Model').addComponent(cc_1.MeshRenderer);
        this.modelComp.mesh = getPrimitiveData().sphere.mesh;
        const material = new cc_1.Material();
        material.initialize({ effectName: 'builtin-standard' });
        this.modelComp.material = material;
        this.setMaterial(material);
        this.modelComp.node.setParent(this.scene);
        this._modelNode = this.modelComp.node;
    }
    /*
    ```mermaid
    sequenceDiagram
        participant Panel as MaterialPanel apply
        participant Preview as MaterialPreview.setMaterial
        participant Material as cc.Material
        participant Pass as cc.Pass
        Panel->>Preview: dump-built Material (_states.phase === "")
        Preview->>Material: omit empty phase, _update
        Material->>Pass: fillPipelineInfo without phase override
        Pass-->>Preview: default phase (camera can draw)
        Preview->>Preview: wrap MaterialInstance and assign
    ```
    */
    setMaterial(material, force = false) {
        if (material && (force || material !== this.material)) {
            rebuildPassesWithoutEmptyPhase(material);
            const comp = this.modelComp;
            const _matInsInfo = {
                parent: material,
                owner: comp,
                subModelIdx: 0,
            };
            const instantiated = new cc_1.renderer.MaterialInstance(_matInsInfo);
            comp.material = instantiated;
            this.material = material;
            this.updateDs();
            this.cameraComp.enabled = true;
            this.cameraComp.node.getWorldPosition(tempVec3A);
            this.modelComp.node.getWorldPosition(tempVec3B);
            this.viewDist = cc_1.Vec3.distance(tempVec3A, tempVec3B);
        }
    }
    updateDs() {
        const model = this.modelComp.model;
        if (model) {
            for (let i = 0; i < model.subModels.length; i++) {
                const ds = model.subModels[i].descriptorSet;
                const bindings = ds.layout.bindings;
                const device = cc_1.director.root.device;
                for (let j = 0; j < bindings.length; j++) {
                    const desc = bindings[j];
                    const binding = desc.binding;
                    const dsType = desc.descriptorType;
                    if (dsType & cc_1.gfx.DescriptorType.UNIFORM_BUFFER ||
                        dsType & cc_1.gfx.DescriptorType.DYNAMIC_UNIFORM_BUFFER) {
                        if (!ds.getBuffer(binding)) {
                            ds.bindBuffer(binding, this.dummyUniformBuffer);
                        }
                    }
                    else if (dsType & cc_1.gfx.DescriptorType.STORAGE_BUFFER ||
                        dsType & cc_1.gfx.DescriptorType.DYNAMIC_STORAGE_BUFFER) {
                        if (!ds.getBuffer(binding)) {
                            ds.bindBuffer(binding, this.dummyStorageBuffer);
                        }
                    }
                    else if (dsType & cc_1.gfx.DESCRIPTOR_SAMPLER_TYPE) {
                        if (!ds.getTexture(binding)) {
                            if (dsType & cc_1.gfx.DescriptorType.SAMPLER_TEXTURE ||
                                dsType & cc_1.gfx.DescriptorType.TEXTURE) {
                                ds.bindTexture(binding, this.dummySampleTexture);
                            }
                            else if (dsType & cc_1.gfx.DescriptorType.STORAGE_IMAGE) {
                                ds.bindTexture(binding, this.dummyStorageTexture);
                            }
                        }
                        if (!ds.getSampler(binding)) {
                            ds.bindSampler(binding, this.dummySampler);
                        }
                    }
                }
                ds.update();
            }
        }
    }
    async setMaterialByUuid(uuid) {
        if (!uuid) {
            console.warn(`Failed to set material in Material preview, by uuid: ${uuid}`);
            return;
        }
        try {
            const material = await (0, asset_reload_1.loadPreviewAsset)(uuid, 'material');
            await waitForMaterialTextures(material);
            refreshMaterialTextureBindings(material);
            this.setMaterial(material, true);
            cc_1.assetManager.assetListener?.emit(uuid, material);
            this.resetCameraView();
        }
        catch (e) {
            console.warn(`[MaterialPreview] setMaterial failed:`, e);
            this.resetCameraView();
        }
    }
    switchPrimitive(type) {
        const data = getPrimitiveData();
        if (!data[type])
            return;
        if (type === this.currentPrimitive)
            return;
        this.currentPrimitive = type;
        this.modelComp.mesh = data[type].mesh;
        this.updateDs();
        this.modelComp.node.setScale(data[type].scale);
        this.cameraComp.enabled = true;
    }
    setLightEnable(enable) {
        if (this.lightComp.enabled !== enable) {
            this.lightComp.enabled = enable;
        }
    }
    resetCameraView() {
        if (this._modelNode) {
            this.resetCamera(this._modelNode);
            this.autoPerfectCameraViewOnModel(this._modelNode);
        }
    }
}
exports.MaterialPreview = MaterialPreview;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwtcHJldmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9wcmV2aWV3L21hdGVyaWFsLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQTJEO0FBQzNELDJCQWVZO0FBRVosTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFFBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7QUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRS9CLFNBQVMsaUJBQWlCLENBQUMsUUFBOEI7SUFDckQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzdCLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUNELE1BQU0sYUFBYSxHQUFJLEVBQVUsQ0FBQyxhQUFhLElBQUssVUFBa0IsQ0FBQyxhQUFhLENBQUM7SUFDckYsSUFBSSxhQUFhLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLENBQUM7UUFDbEQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQztZQUMzQixJQUFJLEVBQUUsSUFBSSxRQUFHLENBQUMsU0FBUyxDQUFDLFFBQUcsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQzNFLE1BQU0sRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUNqRCxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxPQUFRLEVBQUUsUUFBUSxDQUFDLE9BQVEsRUFBRSxRQUFRLENBQUMsR0FBSSxDQUM5RDtTQUNoQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0QsT0FBTyxRQUFRLENBQUM7QUFDcEIsQ0FBQztBQU9ELElBQUksYUFBYSxH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Q0wsQ0FBQztDQUNKO0FBbkxELDBDQW1MQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEludGVyYWN0aXZlUHJldmlldyB9IGZyb20gJy4vaW50ZXJhY3RpdmUtcHJldmlldyc7XG5pbXBvcnQge1xuICAgIERpcmVjdGlvbmFsTGlnaHQsXG4gICAgZ2Z4LFxuICAgIE1hdGVyaWFsLFxuICAgIE1lc2gsXG4gICAgTWVzaFJlbmRlcmVyLFxuICAgIHByaW1pdGl2ZXMsXG4gICAgUXVhdCxcbiAgICB1dGlscyxcbiAgICBWZWMzLFxuICAgIFNjZW5lLFxuICAgIE5vZGUsXG4gICAgcmVuZGVyZXIsXG4gICAgZGlyZWN0b3IsXG4gICAgYXNzZXRNYW5hZ2VyLFxufSBmcm9tICdjYyc7XG5cbmNvbnN0IHJlZ2lvbnMgPSBbbmV3IGdmeC5CdWZmZXJUZXh0dXJlQ29weSgpXTtcbnJlZ2lvbnNbMF0udGV4RXh0ZW50LmRlcHRoID0gMTtcblxuZnVuY3Rpb24gaW5zZXJ0QWRkaXRpb25hbHMoZ2VvbWV0cnk6IHByaW1pdGl2ZXMuSUdlb21ldHJ5KSB7XG4gICAgaWYgKCFnZW9tZXRyeS5jdXN0b21BdHRyaWJ1dGVzKSB7XG4gICAgICAgIGdlb21ldHJ5LmN1c3RvbUF0dHJpYnV0ZXMgPSBbXTtcbiAgICB9XG4gICAgY29uc3QgRWRpdG9yRXh0ZW5kcyA9IChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgIGlmIChFZGl0b3JFeHRlbmRzPy5HZW9tZXRyeVV0aWxzPy5jYWxjdWxhdGVUYW5nZW50cykge1xuICAgICAgICBnZW9tZXRyeS5jdXN0b21BdHRyaWJ1dGVzLnB1c2goe1xuICAgICAgICAgICAgYXR0cjogbmV3IGdmeC5BdHRyaWJ1dGUoZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9UQU5HRU5ULCBnZnguRm9ybWF0LlJHQkEzMkYpLFxuICAgICAgICAgICAgdmFsdWVzOiBFZGl0b3JFeHRlbmRzLkdlb21ldHJ5VXRpbHMuY2FsY3VsYXRlVGFuZ2VudHMoXG4gICAgICAgICAgICAgICAgZ2VvbWV0cnkucG9zaXRpb25zLCBnZW9tZXRyeS5pbmRpY2VzISwgZ2VvbWV0cnkubm9ybWFscyEsIGdlb21ldHJ5LnV2cyEsXG4gICAgICAgICAgICApIGFzIG51bWJlcltdLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGdlb21ldHJ5O1xufVxuXG5pbnRlcmZhY2UgSVByaW1pdGl2ZUluZm8ge1xuICAgIG1lc2g6IE1lc2g7XG4gICAgc2NhbGU6IFZlYzM7XG59XG5cbmxldCBwcmltaXRpdmVEYXRhOiBSZWNvcmQ8c3RyaW5nLCBJUHJpbWl0aXZlSW5mbz4gfCBudWxsID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0UHJpbWl0aXZlRGF0YSgpOiBSZWNvcmQ8c3RyaW5nLCBJUHJpbWl0aXZlSW5mbz4ge1xuICAgIGlmICghcHJpbWl0aXZlRGF0YSkge1xuICAgICAgICBwcmltaXRpdmVEYXRhID0ge1xuICAgICAgICAgICAgYm94OiB7XG4gICAgICAgICAgICAgICAgbWVzaDogdXRpbHMuY3JlYXRlTWVzaChpbnNlcnRBZGRpdGlvbmFscyhwcmltaXRpdmVzLmJveCgpKSksXG4gICAgICAgICAgICAgICAgc2NhbGU6IG5ldyBWZWMzKDEsIDEsIDEpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwaGVyZToge1xuICAgICAgICAgICAgICAgIG1lc2g6IHV0aWxzLmNyZWF0ZU1lc2goaW5zZXJ0QWRkaXRpb25hbHMocHJpbWl0aXZlcy5zcGhlcmUoKSkpLFxuICAgICAgICAgICAgICAgIHNjYWxlOiBuZXcgVmVjMygxLCAxLCAxKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYXBzdWxlOiB7XG4gICAgICAgICAgICAgICAgbWVzaDogdXRpbHMuY3JlYXRlTWVzaChpbnNlcnRBZGRpdGlvbmFscyhwcmltaXRpdmVzLmNhcHN1bGUoKSkpLFxuICAgICAgICAgICAgICAgIHNjYWxlOiBuZXcgVmVjMygwLjgsIDAuOCwgMC44KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjeWxpbmRlcjoge1xuICAgICAgICAgICAgICAgIG1lc2g6IHV0aWxzLmNyZWF0ZU1lc2goaW5zZXJ0QWRkaXRpb25hbHMocHJpbWl0aXZlcy5jeWxpbmRlcigpKSksXG4gICAgICAgICAgICAgICAgc2NhbGU6IG5ldyBWZWMzKDAuOCwgMC44LCAwLjgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvcnVzOiB7XG4gICAgICAgICAgICAgICAgbWVzaDogdXRpbHMuY3JlYXRlTWVzaChpbnNlcnRBZGRpdGlvbmFscyhwcmltaXRpdmVzLnRvcnVzKCkpKSxcbiAgICAgICAgICAgICAgICBzY2FsZTogbmV3IFZlYzMoMSwgMSwgMSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uZToge1xuICAgICAgICAgICAgICAgIG1lc2g6IHV0aWxzLmNyZWF0ZU1lc2goaW5zZXJ0QWRkaXRpb25hbHMocHJpbWl0aXZlcy5jb25lKCkpKSxcbiAgICAgICAgICAgICAgICBzY2FsZTogbmV3IFZlYzMoMSwgMSwgMSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXVhZDoge1xuICAgICAgICAgICAgICAgIG1lc2g6IHV0aWxzLmNyZWF0ZU1lc2goaW5zZXJ0QWRkaXRpb25hbHMocHJpbWl0aXZlcy5xdWFkKCkpKSxcbiAgICAgICAgICAgICAgICBzY2FsZTogbmV3IFZlYzMoMSwgMSwgMSksXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcHJpbWl0aXZlRGF0YTtcbn1cblxuY29uc3QgdGVtcFZlYzNBID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBWZWMzQiA9IG5ldyBWZWMzKCk7XG5jb25zdCB0cmFuc2llbnRNYXRlcmlhbE92ZXJyaWRlUGF0Y2hLZXkgPSBTeW1ib2wuZm9yKCdjb2Nvcy5jbGkubWF0ZXJpYWxQcmV2aWV3LnRyYW5zaWVudE1hdGVyaWFsT3ZlcnJpZGVzJyk7XG5cbmltcG9ydCB0eXBlIHsgSU1hdGVyaWFsUHJldmlld0luc3RhbmNlIH0gZnJvbSAnLi4vLi4vLi4vY29tbW9uL3ByZXZpZXcnO1xuaW1wb3J0IHsgbG9hZFByZXZpZXdBc3NldCB9IGZyb20gJy4vYXNzZXQtcmVsb2FkJztcbmltcG9ydCB7IG9taXRFbXB0eU1hdGVyaWFsUGhhc2VPdmVycmlkZXMgfSBmcm9tICcuL21hdGVyaWFsLXByZXZpZXctc3RhdGVzJztcblxuZnVuY3Rpb24gY29sbGVjdFRleHR1cmVQcm9wZXJ0aWVzKHZhbHVlOiBhbnksIG91dDogYW55W10pIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlLmZvckVhY2goKGl0ZW0pID0+IGNvbGxlY3RUZXh0dXJlUHJvcGVydGllcyhpdGVtLCBvdXQpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlLmdldEdGWFRleHR1cmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb3V0LnB1c2godmFsdWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWF0ZXJpYWxUZXh0dXJlUHJvcGVydGllcyhtYXRlcmlhbDogTWF0ZXJpYWwpOiBhbnlbXSB7XG4gICAgY29uc3QgdGV4dHVyZXM6IGFueVtdID0gW107XG4gICAgY29uc3QgcHJvcHNBcnJheSA9IChtYXRlcmlhbCBhcyBhbnkpLl9wcm9wcztcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcHNBcnJheSkpIHtcbiAgICAgICAgcmV0dXJuIHRleHR1cmVzO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHByb3BzIG9mIHByb3BzQXJyYXkpIHtcbiAgICAgICAgaWYgKCFwcm9wcykgY29udGludWU7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHByb3BzKSkge1xuICAgICAgICAgICAgY29sbGVjdFRleHR1cmVQcm9wZXJ0aWVzKHByb3BzW2tleV0sIHRleHR1cmVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dHVyZXM7XG59XG5cbmZ1bmN0aW9uIGdldE1hdGVyaWFsVGV4dHVyZUVudHJpZXMobWF0ZXJpYWw6IE1hdGVyaWFsKTogQXJyYXk8eyBwYXNzSW5kZXg6IG51bWJlcjsgbmFtZTogc3RyaW5nOyB2YWx1ZTogYW55IH0+IHtcbiAgICBjb25zdCBlbnRyaWVzOiBBcnJheTx7IHBhc3NJbmRleDogbnVtYmVyOyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBhbnkgfT4gPSBbXTtcbiAgICBjb25zdCBwcm9wc0FycmF5ID0gKG1hdGVyaWFsIGFzIGFueSkuX3Byb3BzO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9wc0FycmF5KSkge1xuICAgICAgICByZXR1cm4gZW50cmllcztcbiAgICB9XG4gICAgcHJvcHNBcnJheS5mb3JFYWNoKChwcm9wcywgcGFzc0luZGV4KSA9PiB7XG4gICAgICAgIGlmICghcHJvcHMpIHJldHVybjtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKHByb3BzKSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1tuYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmVzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgY29sbGVjdFRleHR1cmVQcm9wZXJ0aWVzKHZhbHVlLCB0ZXh0dXJlcyk7XG4gICAgICAgICAgICBpZiAodGV4dHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZW50cmllcy5wdXNoKHsgcGFzc0luZGV4LCBuYW1lLCB2YWx1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBhcmVUZXh0dXJlc1JlYWR5KHRleHR1cmVzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0ZXh0dXJlcy5ldmVyeSgodGV4dHVyZSkgPT4ge1xuICAgICAgICBjb25zdCBnZnhUZXh0dXJlID0gdGV4dHVyZS5nZXRHRlhUZXh0dXJlPy4oKTtcbiAgICAgICAgcmV0dXJuICEhZ2Z4VGV4dHVyZSAmJiAhIWdmeFRleHR1cmUud2lkdGggJiYgISFnZnhUZXh0dXJlLmhlaWdodDtcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd2FpdEZvck1hdGVyaWFsVGV4dHVyZXMobWF0ZXJpYWw6IE1hdGVyaWFsLCB0aW1lb3V0TXMgPSAxMDAwKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dHVyZXMgPSBnZXRNYXRlcmlhbFRleHR1cmVQcm9wZXJ0aWVzKG1hdGVyaWFsKTtcbiAgICBpZiAoIXRleHR1cmVzLmxlbmd0aCB8fCBhcmVUZXh0dXJlc1JlYWR5KHRleHR1cmVzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGVhZGxpbmUgPSBEYXRlLm5vdygpICsgdGltZW91dE1zO1xuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTYpKTtcbiAgICAgICAgaWYgKGFyZVRleHR1cmVzUmVhZHkodGV4dHVyZXMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hNYXRlcmlhbFRleHR1cmVCaW5kaW5ncyhtYXRlcmlhbDogTWF0ZXJpYWwpIHtcbiAgICBmb3IgKGNvbnN0IHsgcGFzc0luZGV4LCBuYW1lLCB2YWx1ZSB9IG9mIGdldE1hdGVyaWFsVGV4dHVyZUVudHJpZXMobWF0ZXJpYWwpKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlLCBwYXNzSW5kZXgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0QWN0aXZlUHJldmlld1NlcnZpY2UoKTogYW55IHtcbiAgICByZXR1cm4gKGdsb2JhbFRoaXMgYXMgYW55KS5jbGk/LlNjZW5lPy5QcmV2aWV3O1xufVxuXG5mdW5jdGlvbiBpc01hdGVyaWFsUHJldmlld0FjdGl2ZSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmV2aWV3U2VydmljZSA9IGdldEFjdGl2ZVByZXZpZXdTZXJ2aWNlKCk7XG4gICAgcmV0dXJuICEhcHJldmlld1NlcnZpY2UgJiYgcHJldmlld1NlcnZpY2UuYWN0aXZlUHJldmlldyA9PT0gcHJldmlld1NlcnZpY2UubWF0ZXJpYWxQcmV2aWV3O1xufVxuXG5mdW5jdGlvbiBpc1RyYW5zaWVudFByZXZpZXdNYXRlcmlhbChtYXRlcmlhbDogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTWF0ZXJpYWxQcmV2aWV3QWN0aXZlKClcbiAgICAgICAgJiYgbWF0ZXJpYWxcbiAgICAgICAgJiYgbWF0ZXJpYWwuY29uc3RydWN0b3IgPT09IE1hdGVyaWFsXG4gICAgICAgICYmICFtYXRlcmlhbC5fdXVpZDtcbn1cblxuZnVuY3Rpb24gZ2V0UGFzc0NvdW50KG1hdGVyaWFsOiBhbnkpOiBudW1iZXIge1xuICAgIGNvbnN0IGVmZmVjdEFzc2V0ID0gbWF0ZXJpYWwuX2VmZmVjdEFzc2V0O1xuICAgIGNvbnN0IHRlY2hJZHggPSBtYXRlcmlhbC5fdGVjaElkeCB8fCAwO1xuICAgIGNvbnN0IHRlY2huaXF1ZSA9IGVmZmVjdEFzc2V0Py50ZWNobmlxdWVzPy5bdGVjaElkeF07XG4gICAgcmV0dXJuIHRlY2huaXF1ZT8ucGFzc2VzPy5sZW5ndGggfHwgbWF0ZXJpYWwuX3Bhc3Nlcz8ubGVuZ3RoIHx8IDE7XG59XG5cbmZ1bmN0aW9uIGFwcGx5TWF0ZXJpYWxSZWNvcmQobWF0ZXJpYWw6IGFueSwga2V5OiAnX2RlZmluZXMnIHwgJ19zdGF0ZXMnLCBvdmVycmlkZXM6IFJlY29yZDxzdHJpbmcsIGFueT4sIHBhc3NJZHg/OiBudW1iZXIpIHtcbiAgICBpZiAoIW92ZXJyaWRlcyB8fCB0eXBlb2Ygb3ZlcnJpZGVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVjb3JkcyA9IEFycmF5LmlzQXJyYXkobWF0ZXJpYWxba2V5XSkgPyBtYXRlcmlhbFtrZXldIDogKG1hdGVyaWFsW2tleV0gPSBbXSk7XG4gICAgY29uc3QgYXBwbHlBdCA9IChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIHJlY29yZHNbaW5kZXhdID0ge1xuICAgICAgICAgICAgLi4uKHJlY29yZHNbaW5kZXhdIHx8IHt9KSxcbiAgICAgICAgICAgIC4uLm92ZXJyaWRlcyxcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgaWYgKHBhc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdldFBhc3NDb3VudChtYXRlcmlhbCk7IGkrKykge1xuICAgICAgICAgICAgYXBwbHlBdChpKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGx5QXQocGFzc0lkeCk7XG4gICAgfVxuXG4gICAgaWYgKGtleSA9PT0gJ19zdGF0ZXMnKSB7XG4gICAgICAgIG9taXRFbXB0eU1hdGVyaWFsUGhhc2VPdmVycmlkZXMocmVjb3Jkcyk7XG4gICAgfVxuXG4gICAgbWF0ZXJpYWwuX3VwZGF0ZT8uKHRydWUpO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsVHJhbnNpZW50TWF0ZXJpYWxPdmVycmlkZVBhdGNoKCkge1xuICAgIGNvbnN0IHByb3RvID0gTWF0ZXJpYWwucHJvdG90eXBlIGFzIGFueTtcbiAgICBpZiAocHJvdG9bdHJhbnNpZW50TWF0ZXJpYWxPdmVycmlkZVBhdGNoS2V5XSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVjb21waWxlU2hhZGVycyA9IHByb3RvLnJlY29tcGlsZVNoYWRlcnM7XG4gICAgY29uc3Qgb3ZlcnJpZGVQaXBlbGluZVN0YXRlcyA9IHByb3RvLm92ZXJyaWRlUGlwZWxpbmVTdGF0ZXM7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIHRyYW5zaWVudE1hdGVyaWFsT3ZlcnJpZGVQYXRjaEtleSwge1xuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IHRydWUsXG4gICAgfSk7XG5cbiAgICBwcm90by5yZWNvbXBpbGVTaGFkZXJzID0gZnVuY3Rpb24gcGF0Y2hlZFJlY29tcGlsZVNoYWRlcnMob3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBwYXNzSWR4PzogbnVtYmVyKSB7XG4gICAgICAgIGlmIChpc1RyYW5zaWVudFByZXZpZXdNYXRlcmlhbCh0aGlzKSkge1xuICAgICAgICAgICAgYXBwbHlNYXRlcmlhbFJlY29yZCh0aGlzLCAnX2RlZmluZXMnLCBvdmVycmlkZXMsIHBhc3NJZHgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWNvbXBpbGVTaGFkZXJzLmNhbGwodGhpcywgb3ZlcnJpZGVzLCBwYXNzSWR4KTtcbiAgICB9O1xuXG4gICAgcHJvdG8ub3ZlcnJpZGVQaXBlbGluZVN0YXRlcyA9IGZ1bmN0aW9uIHBhdGNoZWRPdmVycmlkZVBpcGVsaW5lU3RhdGVzKG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgYW55PiwgcGFzc0lkeD86IG51bWJlcikge1xuICAgICAgICBpZiAoaXNUcmFuc2llbnRQcmV2aWV3TWF0ZXJpYWwodGhpcykpIHtcbiAgICAgICAgICAgIGFwcGx5TWF0ZXJpYWxSZWNvcmQodGhpcywgJ19zdGF0ZXMnLCBvdmVycmlkZXMsIHBhc3NJZHgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdmVycmlkZVBpcGVsaW5lU3RhdGVzLmNhbGwodGhpcywgb3ZlcnJpZGVzLCBwYXNzSWR4KTtcbiAgICB9O1xufVxuXG4vKiogRHJvcHMgZHVtcC1kZWZhdWx0IGBwaGFzZTogJydgIGFuZCByZWJ1aWxkcyBwYXNzZXMgc28gdGhlIHByZXZpZXcgY2FtZXJhIGNhbiBzdGlsbCBkcmF3LiAqL1xuZnVuY3Rpb24gcmVidWlsZFBhc3Nlc1dpdGhvdXRFbXB0eVBoYXNlKG1hdGVyaWFsOiBNYXRlcmlhbCkge1xuICAgIGlmIChvbWl0RW1wdHlNYXRlcmlhbFBoYXNlT3ZlcnJpZGVzKChtYXRlcmlhbCBhcyBhbnkpLl9zdGF0ZXMpKSB7XG4gICAgICAgIChtYXRlcmlhbCBhcyBhbnkpLl91cGRhdGU/Lih0cnVlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNYXRlcmlhbFByZXZpZXcgZXh0ZW5kcyBJbnRlcmFjdGl2ZVByZXZpZXcgaW1wbGVtZW50cyBJTWF0ZXJpYWxQcmV2aWV3SW5zdGFuY2Uge1xuICAgIHByaXZhdGUgbGlnaHRDb21wITogRGlyZWN0aW9uYWxMaWdodDtcbiAgICBwcml2YXRlIG1vZGVsQ29tcCE6IE1lc2hSZW5kZXJlcjtcbiAgICBwcml2YXRlIGN1cnJlbnRQcmltaXRpdmUgPSAnc3BoZXJlJztcbiAgICBwcml2YXRlIG1hdGVyaWFsOiBNYXRlcmlhbCB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBkdW1teVVuaWZvcm1CdWZmZXIhOiBnZnguQnVmZmVyO1xuICAgIHByaXZhdGUgZHVtbXlTdG9yYWdlVGV4dHVyZSE6IGdmeC5UZXh0dXJlO1xuICAgIHByaXZhdGUgZHVtbXlTYW1wbGVUZXh0dXJlITogZ2Z4LlRleHR1cmU7XG4gICAgcHJpdmF0ZSBkdW1teVNhbXBsZXIhOiBnZnguU2FtcGxlcjtcbiAgICBwcml2YXRlIGR1bW15U3RvcmFnZUJ1ZmZlciE6IGdmeC5CdWZmZXI7XG4gICAgcHJpdmF0ZSB1bmlmb3JtQnVmZmVyITogZ2Z4LkJ1ZmZlcjtcbiAgICBwcml2YXRlIHN0b3JhZ2VCdWZmZXIhOiBnZnguQnVmZmVyO1xuXG4gICAgcHJvdGVjdGVkIGVuYWJsZUdyaWQgPSBmYWxzZTtcbiAgICBkaXNhYmxlUGFuID0gdHJ1ZTtcbiAgICBkaXNhYmxlTW91c2VXaGVlbCA9IHRydWU7XG5cbiAgICBwdWJsaWMgaW5pdChyZWdpc3Rlck5hbWU6IHN0cmluZywgcXVlcnlOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIuaW5pdChyZWdpc3Rlck5hbWUsIHF1ZXJ5TmFtZSk7XG4gICAgICAgIGluc3RhbGxUcmFuc2llbnRNYXRlcmlhbE92ZXJyaWRlUGF0Y2goKTtcbiAgICAgICAgY29uc3QgZGV2aWNlID0gZGlyZWN0b3Iucm9vdCEuZGV2aWNlO1xuICAgICAgICBjb25zdCBpc1NjZW5lTmF0aXZlID0gISEoZ2xvYmFsVGhpcyBhcyBhbnkpLmlzU2NlbmVOYXRpdmU7XG5cbiAgICAgICAgdGhpcy51bmlmb3JtQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcihuZXcgZ2Z4LkJ1ZmZlckluZm8oXG4gICAgICAgICAgICBnZnguQnVmZmVyVXNhZ2VCaXQuVU5JRk9STSxcbiAgICAgICAgICAgIGdmeC5NZW1vcnlVc2FnZUJpdC5IT1NUIHwgZ2Z4Lk1lbW9yeVVzYWdlQml0LkRFVklDRSxcbiAgICAgICAgICAgIDE2LFxuICAgICAgICApKTtcbiAgICAgICAgdGhpcy5kdW1teVVuaWZvcm1CdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKG5ldyBnZnguQnVmZmVyVmlld0luZm8odGhpcy51bmlmb3JtQnVmZmVyLCAwLCB0aGlzLnVuaWZvcm1CdWZmZXIuc2l6ZSkpO1xuXG4gICAgICAgIHRoaXMuc3RvcmFnZUJ1ZmZlciA9ICFpc1NjZW5lTmF0aXZlID8gdGhpcy51bmlmb3JtQnVmZmVyIDogZGV2aWNlLmNyZWF0ZUJ1ZmZlcihuZXcgZ2Z4LkJ1ZmZlckluZm8oXG4gICAgICAgICAgICBnZnguQnVmZmVyVXNhZ2VCaXQuU1RPUkFHRSxcbiAgICAgICAgICAgIGdmeC5NZW1vcnlVc2FnZUJpdC5IT1NUIHwgZ2Z4Lk1lbW9yeVVzYWdlQml0LkRFVklDRSxcbiAgICAgICAgICAgIDE2LFxuICAgICAgICApKTtcbiAgICAgICAgdGhpcy5kdW1teVN0b3JhZ2VCdWZmZXIgPSAhaXNTY2VuZU5hdGl2ZSA/IHRoaXMuZHVtbXlVbmlmb3JtQnVmZmVyIDpcbiAgICAgICAgICAgIGRldmljZS5jcmVhdGVCdWZmZXIobmV3IGdmeC5CdWZmZXJWaWV3SW5mbyh0aGlzLnN0b3JhZ2VCdWZmZXIsIDAsIHRoaXMuc3RvcmFnZUJ1ZmZlci5zaXplKSk7XG5cbiAgICAgICAgdGhpcy5kdW1teVNhbXBsZVRleHR1cmUgPSBkZXZpY2UuY3JlYXRlVGV4dHVyZShuZXcgZ2Z4LlRleHR1cmVJbmZvKFxuICAgICAgICAgICAgZ2Z4LlRleHR1cmVUeXBlLlRFWDJELFxuICAgICAgICAgICAgZ2Z4LlRleHR1cmVVc2FnZUJpdC5TQU1QTEVELFxuICAgICAgICAgICAgZ2Z4LkZvcm1hdC5SR0JBOCxcbiAgICAgICAgICAgIDQsIDQsXG4gICAgICAgICkpO1xuICAgICAgICB0aGlzLmR1bW15U3RvcmFnZVRleHR1cmUgPSAhaXNTY2VuZU5hdGl2ZSA/IHRoaXMuZHVtbXlTYW1wbGVUZXh0dXJlIDogZGV2aWNlLmNyZWF0ZVRleHR1cmUobmV3IGdmeC5UZXh0dXJlSW5mbyhcbiAgICAgICAgICAgIGdmeC5UZXh0dXJlVHlwZS5URVgyRCxcbiAgICAgICAgICAgIGdmeC5UZXh0dXJlVXNhZ2VCaXQuU1RPUkFHRSxcbiAgICAgICAgICAgIGdmeC5Gb3JtYXQuUkdCQTgsXG4gICAgICAgICAgICA0LCA0LFxuICAgICAgICApKTtcbiAgICAgICAgdGhpcy5kdW1teVNhbXBsZXIgPSBkZXZpY2UuZ2V0U2FtcGxlcihuZXcgZ2Z4LlNhbXBsZXJJbmZvKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVOb2RlcyhzY2VuZTogU2NlbmUpIHtcbiAgICAgICAgdGhpcy5saWdodENvbXAgPSBuZXcgTm9kZSgnTWF0ZXJpYWwgUHJldmlldyBMaWdodCcpLmFkZENvbXBvbmVudChEaXJlY3Rpb25hbExpZ2h0KTtcbiAgICAgICAgdGhpcy5saWdodENvbXAubm9kZS5zZXRSb3RhdGlvbkZyb21FdWxlcigtNDUsIC00NSwgMCk7XG4gICAgICAgIHRoaXMubGlnaHRDb21wLm5vZGUuc2V0UGFyZW50KHNjZW5lKTtcblxuICAgICAgICB0aGlzLm1vZGVsQ29tcCA9IG5ldyBOb2RlKCdNYXRlcmlhbCBQcmV2aWV3IE1vZGVsJykuYWRkQ29tcG9uZW50KE1lc2hSZW5kZXJlcik7XG4gICAgICAgIHRoaXMubW9kZWxDb21wLm1lc2ggPSBnZXRQcmltaXRpdmVEYXRhKCkuc3BoZXJlLm1lc2g7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gbmV3IE1hdGVyaWFsKCk7XG4gICAgICAgIG1hdGVyaWFsLmluaXRpYWxpemUoeyBlZmZlY3ROYW1lOiAnYnVpbHRpbi1zdGFuZGFyZCcgfSk7XG4gICAgICAgIHRoaXMubW9kZWxDb21wLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG4gICAgICAgIHRoaXMuc2V0TWF0ZXJpYWwobWF0ZXJpYWwpO1xuXG4gICAgICAgIHRoaXMubW9kZWxDb21wLm5vZGUuc2V0UGFyZW50KHRoaXMuc2NlbmUpO1xuICAgICAgICB0aGlzLl9tb2RlbE5vZGUgPSB0aGlzLm1vZGVsQ29tcC5ub2RlO1xuICAgIH1cblxuICAgIC8qXG4gICAgYGBgbWVybWFpZFxuICAgIHNlcXVlbmNlRGlhZ3JhbVxuICAgICAgICBwYXJ0aWNpcGFudCBQYW5lbCBhcyBNYXRlcmlhbFBhbmVsIGFwcGx5XG4gICAgICAgIHBhcnRpY2lwYW50IFByZXZpZXcgYXMgTWF0ZXJpYWxQcmV2aWV3LnNldE1hdGVyaWFsXG4gICAgICAgIHBhcnRpY2lwYW50IE1hdGVyaWFsIGFzIGNjLk1hdGVyaWFsXG4gICAgICAgIHBhcnRpY2lwYW50IFBhc3MgYXMgY2MuUGFzc1xuICAgICAgICBQYW5lbC0+PlByZXZpZXc6IGR1bXAtYnVpbHQgTWF0ZXJpYWwgKF9zdGF0ZXMucGhhc2UgPT09IFwiXCIpXG4gICAgICAgIFByZXZpZXctPj5NYXRlcmlhbDogb21pdCBlbXB0eSBwaGFzZSwgX3VwZGF0ZVxuICAgICAgICBNYXRlcmlhbC0+PlBhc3M6IGZpbGxQaXBlbGluZUluZm8gd2l0aG91dCBwaGFzZSBvdmVycmlkZVxuICAgICAgICBQYXNzLS0+PlByZXZpZXc6IGRlZmF1bHQgcGhhc2UgKGNhbWVyYSBjYW4gZHJhdylcbiAgICAgICAgUHJldmlldy0+PlByZXZpZXc6IHdyYXAgTWF0ZXJpYWxJbnN0YW5jZSBhbmQgYXNzaWduXG4gICAgYGBgXG4gICAgKi9cbiAgICBwdWJsaWMgc2V0TWF0ZXJpYWwobWF0ZXJpYWw6IE1hdGVyaWFsIHwgbnVsbCwgZm9yY2UgPSBmYWxzZSkge1xuICAgICAgICBpZiAobWF0ZXJpYWwgJiYgKGZvcmNlIHx8IG1hdGVyaWFsICE9PSB0aGlzLm1hdGVyaWFsKSkge1xuICAgICAgICAgICAgcmVidWlsZFBhc3Nlc1dpdGhvdXRFbXB0eVBoYXNlKG1hdGVyaWFsKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSB0aGlzLm1vZGVsQ29tcDtcbiAgICAgICAgICAgIGNvbnN0IF9tYXRJbnNJbmZvID0ge1xuICAgICAgICAgICAgICAgIHBhcmVudDogbWF0ZXJpYWwsXG4gICAgICAgICAgICAgICAgb3duZXI6IGNvbXAgYXMgYW55LFxuICAgICAgICAgICAgICAgIHN1Yk1vZGVsSWR4OiAwLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbnRpYXRlZCA9IG5ldyByZW5kZXJlci5NYXRlcmlhbEluc3RhbmNlKF9tYXRJbnNJbmZvKTtcbiAgICAgICAgICAgIGNvbXAubWF0ZXJpYWwgPSBpbnN0YW50aWF0ZWQ7XG4gICAgICAgICAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURzKCk7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAubm9kZS5nZXRXb3JsZFBvc2l0aW9uKHRlbXBWZWMzQSk7XG4gICAgICAgICAgICB0aGlzLm1vZGVsQ29tcC5ub2RlLmdldFdvcmxkUG9zaXRpb24odGVtcFZlYzNCKTtcbiAgICAgICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKHRlbXBWZWMzQSwgdGVtcFZlYzNCKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVEcygpIHtcbiAgICAgICAgY29uc3QgbW9kZWwgPSB0aGlzLm1vZGVsQ29tcC5tb2RlbDtcbiAgICAgICAgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVsLnN1Yk1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRzID0gbW9kZWwuc3ViTW9kZWxzW2ldLmRlc2NyaXB0b3JTZXQ7XG4gICAgICAgICAgICAgICAgY29uc3QgYmluZGluZ3MgPSBkcy5sYXlvdXQuYmluZGluZ3M7XG4gICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlID0gZGlyZWN0b3Iucm9vdCEuZGV2aWNlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYmluZGluZ3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzYyA9IGJpbmRpbmdzW2pdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiaW5kaW5nID0gZGVzYy5iaW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkc1R5cGUgPSBkZXNjLmRlc2NyaXB0b3JUeXBlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHNUeXBlICYgZ2Z4LkRlc2NyaXB0b3JUeXBlLlVOSUZPUk1fQlVGRkVSIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBkc1R5cGUgJiBnZnguRGVzY3JpcHRvclR5cGUuRFlOQU1JQ19VTklGT1JNX0JVRkZFUikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcy5nZXRCdWZmZXIoYmluZGluZykpIHsgZHMuYmluZEJ1ZmZlcihiaW5kaW5nLCB0aGlzLmR1bW15VW5pZm9ybUJ1ZmZlcik7IH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkc1R5cGUgJiBnZnguRGVzY3JpcHRvclR5cGUuU1RPUkFHRV9CVUZGRVIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzVHlwZSAmIGdmeC5EZXNjcmlwdG9yVHlwZS5EWU5BTUlDX1NUT1JBR0VfQlVGRkVSKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRzLmdldEJ1ZmZlcihiaW5kaW5nKSkgeyBkcy5iaW5kQnVmZmVyKGJpbmRpbmcsIHRoaXMuZHVtbXlTdG9yYWdlQnVmZmVyKTsgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRzVHlwZSAmIChnZnggYXMgYW55KS5ERVNDUklQVE9SX1NBTVBMRVJfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcy5nZXRUZXh0dXJlKGJpbmRpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRzVHlwZSAmIGdmeC5EZXNjcmlwdG9yVHlwZS5TQU1QTEVSX1RFWFRVUkUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHNUeXBlICYgZ2Z4LkRlc2NyaXB0b3JUeXBlLlRFWFRVUkUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHMuYmluZFRleHR1cmUoYmluZGluZywgdGhpcy5kdW1teVNhbXBsZVRleHR1cmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZHNUeXBlICYgZ2Z4LkRlc2NyaXB0b3JUeXBlLlNUT1JBR0VfSU1BR0UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHMuYmluZFRleHR1cmUoYmluZGluZywgdGhpcy5kdW1teVN0b3JhZ2VUZXh0dXJlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRzLmdldFNhbXBsZXIoYmluZGluZykpIHsgZHMuYmluZFNhbXBsZXIoYmluZGluZywgdGhpcy5kdW1teVNhbXBsZXIpOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZHMudXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2V0TWF0ZXJpYWxCeVV1aWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gc2V0IG1hdGVyaWFsIGluIE1hdGVyaWFsIHByZXZpZXcsIGJ5IHV1aWQ6ICR7dXVpZH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBhd2FpdCBsb2FkUHJldmlld0Fzc2V0PE1hdGVyaWFsPih1dWlkLCAnbWF0ZXJpYWwnKTtcbiAgICAgICAgICAgIGF3YWl0IHdhaXRGb3JNYXRlcmlhbFRleHR1cmVzKG1hdGVyaWFsKTtcbiAgICAgICAgICAgIHJlZnJlc2hNYXRlcmlhbFRleHR1cmVCaW5kaW5ncyhtYXRlcmlhbCk7XG4gICAgICAgICAgICB0aGlzLnNldE1hdGVyaWFsKG1hdGVyaWFsLCB0cnVlKTtcbiAgICAgICAgICAgIGFzc2V0TWFuYWdlci5hc3NldExpc3RlbmVyPy5lbWl0KHV1aWQsIG1hdGVyaWFsKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXRDYW1lcmFWaWV3KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW01hdGVyaWFsUHJldmlld10gc2V0TWF0ZXJpYWwgZmFpbGVkOmAsIGUpO1xuICAgICAgICAgICAgdGhpcy5yZXNldENhbWVyYVZpZXcoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzd2l0Y2hQcmltaXRpdmUodHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBnZXRQcmltaXRpdmVEYXRhKCk7XG4gICAgICAgIGlmICghZGF0YVt0eXBlXSkgcmV0dXJuO1xuICAgICAgICBpZiAodHlwZSA9PT0gdGhpcy5jdXJyZW50UHJpbWl0aXZlKSByZXR1cm47XG4gICAgICAgIHRoaXMuY3VycmVudFByaW1pdGl2ZSA9IHR5cGU7XG4gICAgICAgIHRoaXMubW9kZWxDb21wLm1lc2ggPSBkYXRhW3R5cGVdLm1lc2g7XG4gICAgICAgIHRoaXMudXBkYXRlRHMoKTtcbiAgICAgICAgdGhpcy5tb2RlbENvbXAubm9kZS5zZXRTY2FsZShkYXRhW3R5cGVdLnNjYWxlKTtcbiAgICAgICAgdGhpcy5jYW1lcmFDb21wLmVuYWJsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRMaWdodEVuYWJsZShlbmFibGU6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHRoaXMubGlnaHRDb21wLmVuYWJsZWQgIT09IGVuYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5saWdodENvbXAuZW5hYmxlZCA9IGVuYWJsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldENhbWVyYVZpZXcoKSB7XG4gICAgICAgIGlmICh0aGlzLl9tb2RlbE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRDYW1lcmEodGhpcy5fbW9kZWxOb2RlKTtcbiAgICAgICAgICAgIHRoaXMuYXV0b1BlcmZlY3RDYW1lcmFWaWV3T25Nb2RlbCh0aGlzLl9tb2RlbE5vZGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19