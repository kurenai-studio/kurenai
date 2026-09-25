"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraUtils = exports.CameraMoveMode = void 0;
const cc_1 = require("cc");
const _maxTicks = 100;
const vbMap = new Map();
const ibMap = new Map();
var CameraMoveMode;
(function (CameraMoveMode) {
    CameraMoveMode[CameraMoveMode["IDLE"] = 0] = "IDLE";
    CameraMoveMode[CameraMoveMode["ORBIT"] = 1] = "ORBIT";
    CameraMoveMode[CameraMoveMode["PAN"] = 2] = "PAN";
    CameraMoveMode[CameraMoveMode["ZOOM"] = 3] = "ZOOM";
    CameraMoveMode[CameraMoveMode["WANDER"] = 4] = "WANDER";
})(CameraMoveMode || (exports.CameraMoveMode = CameraMoveMode = {}));
class CameraUtils {
    static updateVBAttr(comp, attr, data) {
        const model = comp && comp.model && comp.model.subModels[0];
        if (!model || !model.inputAssembler || !model.subMesh) {
            console.warn('[CameraUtils] updateVBAttr: model not ready', attr, {
                hasComp: !!comp,
                hasModel: !!(comp && comp.model),
                subModelCount: comp?.model?.subModels?.length,
            });
            return;
        }
        const { inputAssembler, subMesh } = model;
        const vbuffer = vbMap.get(subMesh);
        if (!vbuffer) {
            console.error(subMesh, vbuffer);
            return;
        }
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
        if (!format || !vb)
            return;
        cc_1.utils.writeBuffer(new DataView(vbuffer), data, format, offset, vb.stride);
        vb.update(vbuffer, vb.stride * vb.count);
        if (subMesh.geometricInfo && attr === cc_1.gfx.AttributeName.ATTR_POSITION) {
            subMesh.geometricInfo.positions.set(data);
        }
    }
    static updateIB(comp, data) {
        const model = comp && comp.model && comp.model.subModels[0];
        if (!model || !model.inputAssembler || !model.subMesh) {
            console.warn('[CameraUtils] updateIB: model not ready', {
                hasComp: !!comp,
                hasModel: !!(comp && comp.model),
                subModelCount: comp?.model?.subModels?.length,
            });
            return;
        }
        const { inputAssembler, subMesh } = model;
        const ibuffer = ibMap.get(subMesh);
        if (!ibuffer) {
            console.error(subMesh, ibuffer);
            return;
        }
        const count = inputAssembler.indexCount;
        const ib = inputAssembler.indexBuffer;
        if (!count || !ib)
            return;
        // @ts-ignore
        const format = cc_1.gfx.Format[`R${ib.stride * 8}UI`];
        cc_1.utils.writeBuffer(new DataView(ibuffer), data, format);
        ib.update(ibuffer, ib.stride * ib.count);
        inputAssembler.indexCount = data.length;
    }
    static grid(width, length, segw, segl) {
        const positions = [];
        const uvs = [];
        const indices = [];
        const hw = width * 0.5;
        const hl = length * 0.5;
        const dw = width / segw;
        const dl = length / segl;
        const minPos = cc.v3(-hw, -0.1, -hl);
        const maxPos = cc.v3(hw, 0.1, hl);
        function addLine(x1, z1, x2, z2) {
            const idx = positions.length / 3;
            if (x1 === x2) {
                positions.push(x1 + 0.01, 0, z1);
                uvs.push(1, 0);
                positions.push(x1 - 0.01, 0, z1);
                uvs.push(0, 0);
                positions.push(x1 + 0.01, 0, z2);
                uvs.push(1, 0);
                positions.push(x1 - 0.01, 0, z2);
                uvs.push(0, 0);
            }
            else {
                positions.push(x1, 0, z1 - 0.01);
                uvs.push(0, 1);
                positions.push(x1, 0, z1 + 0.01);
                uvs.push(1, 1);
                positions.push(x2, 0, z1 - 0.01);
                uvs.push(0, 1);
                positions.push(x2, 0, z1 + 0.01);
                uvs.push(1, 1);
            }
            indices.push(idx, idx + 1, idx + 2, idx + 2, idx + 1, idx + 3);
        }
        for (let x = -hw; x <= hw; x += dw) {
            addLine(x, -hl, x, hl);
        }
        for (let z = -hl; z <= hl; z += dl) {
            addLine(-hw, z, hw, z);
        }
        return { positions, uvs, indices, minPos, maxPos };
    }
    static createStrokeGrid(w, l, parentNode) {
        const node = new cc.Node('Editor Grid');
        node.layer = cc.Layers.Enum.EDITOR | cc.Layers.Enum.IGNORE_RAYCAST;
        node._objFlags |= cc_1.CCObject.Flags.DontSave;
        node.parent = parentNode;
        const model = node.addComponent(cc_1.MeshRenderer);
        model.mesh = cc_1.utils.createMesh(CameraUtils.grid(w, l, w, l));
        const cb = model.onEnable.bind(model);
        model.onEnable = () => { cb(); };
        const mtl = new cc.Material();
        mtl.initialize({ effectName: 'internal/editor/grid-stroke' });
        if (mtl.passes && mtl.passes.length > 0) {
            model.material = mtl;
        }
        return model;
    }
    static createGrid(effectName, parentNode) {
        const node = new cc.Node(effectName);
        node.layer = cc.Layers.Enum.EDITOR | cc.Layers.Enum.IGNORE_RAYCAST;
        node._objFlags |= cc_1.CCObject.Flags.DontSave;
        node.parent = parentNode;
        node.setWorldPosition(cc.v3(0, 0, 0));
        const model = node.addComponent(cc_1.MeshRenderer);
        const cb = model.onEnable.bind(model);
        model.onEnable = () => { cb(); };
        const positions = [];
        const colors = [];
        const indices = [];
        for (let i = 0; i < _maxTicks * _maxTicks; i++) {
            positions.push(0, 0);
            colors.push(1, 1, 1, 1);
        }
        for (let i = 0; i < positions.length; i += 2) {
            indices.push(i / 2);
        }
        const primitiveMode = cc_1.gfx.PrimitiveMode.LINE_LIST;
        const attributes = [
            { name: cc_1.gfx.AttributeName.ATTR_POSITION, format: cc_1.gfx.Format.RG32F },
            { name: cc_1.gfx.AttributeName.ATTR_COLOR, format: cc_1.gfx.Format.RGBA32F },
        ];
        const mesh = cc.utils.createMesh({ positions, indices, colors, primitiveMode, attributes });
        const subMesh = mesh.renderingSubMeshes[0];
        const vbInfo = mesh.struct.vertexBundles[0].view;
        const vbuffer = mesh.data.buffer.slice(vbInfo.offset, vbInfo.offset + vbInfo.length);
        vbMap.set(subMesh, vbuffer);
        const ibInfo = mesh.struct.primitives[0].indexView;
        const ibuffer = mesh.data.buffer.slice(ibInfo.offset, ibInfo.offset + ibInfo.length);
        ibMap.set(subMesh, ibuffer);
        model.mesh = mesh;
        const mtl = new cc.Material();
        mtl.initialize({ effectName, states: { primitive: primitiveMode } });
        if (mtl.passes && mtl.passes.length > 0) {
            model.material = mtl;
        }
        return model;
    }
    static createCamera(color, parentNode, componentClass = cc_1.Camera) {
        const node = new cc.Node('Editor Camera');
        node.layer = cc.Layers.Enum.EDITOR;
        node._objFlags |= cc_1.CCObject.Flags.DontSave;
        node.parent = parentNode;
        const camera = node.addComponent(componentClass);
        camera.clearFlags = cc_1.Camera.ClearFlag.SKYBOX | cc_1.gfx.ClearFlagBit.COLOR;
        camera.clearColor = color;
        camera.visibility = cc_1.Layers.makeMaskExclude([cc_1.Layers.BitMask.PROFILER, cc_1.Layers.Enum.GIZMOS, cc_1.Layers.Enum.SCENE_GIZMO]);
        camera.far = 100000;
        camera.near = 0.1;
        return camera;
    }
    static _snapTipElement = null;
    static _snapTipTimeout = null;
    static showSnapTip(duration = 5000) {
        if (typeof document === 'undefined')
            return;
        if (CameraUtils._snapTipElement) {
            if (CameraUtils._snapTipTimeout) {
                clearTimeout(CameraUtils._snapTipTimeout);
            }
            if (duration > 0) {
                CameraUtils._snapTipTimeout = setTimeout(() => CameraUtils.hideSnapTip(), duration);
            }
            return;
        }
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute; bottom: 10px; left: 10px;
            background-color: #00000047; border-radius: 6px;
            display: flex; flex-direction: column;
            font-size: 15px; padding: 10px; z-index: 9999;
            pointer-events: none; font-family: sans-serif;
        `;
        const snapItems = [
            { label: 'Vertex Snap', keys: ['V'] },
            { label: 'Surface Snap', keys: ['Shift', 'Ctrl'] },
        ];
        snapItems.forEach((item, idx) => {
            if (idx > 0) {
                const spacer = document.createElement('div');
                spacer.style.height = '4px';
                container.appendChild(spacer);
            }
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; flex-direction: row; align-items: center; justify-content: flex-end;';
            const label = document.createElement('span');
            label.style.cssText = 'color: white; opacity: 0.6; margin-right: 8px;';
            label.textContent = item.label;
            row.appendChild(label);
            const keyGroup = document.createElement('div');
            keyGroup.style.cssText = 'display: flex; flex-direction: row; align-items: baseline; min-width: 120px;';
            item.keys.forEach((key, ki) => {
                if (ki > 0) {
                    const plus = document.createElement('span');
                    plus.style.cssText = 'font-size: 12px; line-height: 20px; margin: 0 4px; color: rgba(250,250,250,1);';
                    plus.textContent = '+';
                    keyGroup.appendChild(plus);
                }
                const keyEl = document.createElement('div');
                keyEl.style.cssText = `
                    display: flex; align-items: center; justify-content: center;
                    width: 50px; height: 24px; border-radius: 4px;
                    background: #0505054D; border: 1px solid #FAFAFA33;
                    color: #FAFAFA; opacity: 0.7;
                `;
                keyEl.textContent = key;
                keyGroup.appendChild(keyEl);
            });
            row.appendChild(keyGroup);
            container.appendChild(row);
        });
        document.body.appendChild(container);
        CameraUtils._snapTipElement = container;
        if (duration > 0) {
            CameraUtils._snapTipTimeout = setTimeout(() => CameraUtils.hideSnapTip(), duration);
        }
    }
    static hideSnapTip() {
        if (CameraUtils._snapTipTimeout) {
            clearTimeout(CameraUtils._snapTipTimeout);
            CameraUtils._snapTipTimeout = null;
        }
        if (CameraUtils._snapTipElement) {
            CameraUtils._snapTipElement.remove();
            CameraUtils._snapTipElement = null;
        }
    }
    static _wanderTipElement = null;
    static _wanderTipTimeout = null;
    static showWanderTip(duration = 5000) {
        if (typeof document === 'undefined')
            return;
        if (CameraUtils._wanderTipElement) {
            if (CameraUtils._wanderTipTimeout) {
                clearTimeout(CameraUtils._wanderTipTimeout);
            }
            if (duration > 0) {
                CameraUtils._wanderTipTimeout = setTimeout(() => CameraUtils.hideWanderTip(), duration);
            }
            return;
        }
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute; bottom: 10px; left: 10px;
            background-color: #00000047; border-radius: 6px;
            display: flex; flex-direction: column;
            align-content: flex-end; flex-wrap: nowrap; justify-content: flex-start;
            font-size: 15px; padding-top: 6px; padding-bottom: 6px;
            z-index: 9999; pointer-events: none; font-family: sans-serif;
        `;
        const keyCss = `
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 24px; border-radius: 4px;
            background: #0505054D; border: 1px solid #FAFAFA33;
            color: #FAFAFA; position: relative; margin-right: 4px; opacity: 0.7;
        `;
        const wanderKeys = [
            { key: 'Q', arrow: '▼' },
            { key: 'W', arrow: '+' },
            { key: 'E', arrow: '▲' },
            { key: 'A', arrow: '◀' },
            { key: 'S', arrow: '-' },
            { key: 'D', arrow: '▶' },
        ];
        const shortcutRow = document.createElement('div');
        shortcutRow.style.cssText = `
            display: flex; flex-direction: row; flex-wrap: nowrap;
            align-items: flex-start; justify-content: flex-end;
            padding: 0 12px;
        `;
        const label = document.createElement('span');
        label.style.cssText = 'color: white; opacity: 0.6; margin-right: 8px; line-height: 56px;';
        label.textContent = 'Camera Wander:';
        shortcutRow.appendChild(label);
        const keyGrid = document.createElement('div');
        keyGrid.style.cssText = `
            display: inline-flex; justify-content: center;
            max-width: 120px; flex-wrap: wrap;
        `;
        wanderKeys.forEach((item) => {
            const keyEl = document.createElement('div');
            keyEl.style.cssText = keyCss;
            keyEl.textContent = item.key;
            const indicator = document.createElement('span');
            indicator.style.cssText = `
                position: absolute; font-size: 8px; top: 35%; right: 2px;
                color: #A3A3A3; line-height: 1;
            `;
            indicator.textContent = item.arrow;
            keyEl.appendChild(indicator);
            keyGrid.appendChild(keyEl);
        });
        shortcutRow.appendChild(keyGrid);
        container.appendChild(shortcutRow);
        const addSpacer = () => {
            const spacer = document.createElement('div');
            spacer.style.cssText = 'width: 100%; height: 4px;';
            container.appendChild(spacer);
        };
        const addKeywordRow = (text, keyText, keyWidth) => {
            addSpacer();
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex; flex-direction: row; flex-wrap: nowrap;
                align-items: center; justify-content: flex-end; padding: 0 12px;
            `;
            const rowLabel = document.createElement('span');
            rowLabel.style.cssText = 'color: white; opacity: 0.6; margin-right: 8px;';
            rowLabel.textContent = text;
            row.appendChild(rowLabel);
            const keyEl = document.createElement('div');
            keyEl.style.cssText = keyCss + `width: ${keyWidth}; min-width: ${keyWidth};`;
            keyEl.textContent = keyText;
            row.appendChild(keyEl);
            container.appendChild(row);
        };
        addKeywordRow('Speed:', 'Shift', '80px');
        addKeywordRow('Speed Up:', 'Wheel Up', '120px');
        addKeywordRow('Speed Down:', 'Wheel Down', '120px');
        document.body.appendChild(container);
        CameraUtils._wanderTipElement = container;
        if (duration > 0) {
            CameraUtils._wanderTipTimeout = setTimeout(() => CameraUtils.hideWanderTip(), duration);
        }
    }
    static hideWanderTip() {
        if (CameraUtils._wanderTipTimeout) {
            clearTimeout(CameraUtils._wanderTipTimeout);
            CameraUtils._wanderTipTimeout = null;
        }
        if (CameraUtils._wanderTipElement) {
            CameraUtils._wanderTipElement.remove();
            CameraUtils._wanderTipElement = null;
        }
    }
    static _speedToastElement = null;
    static _speedToastTimeout = null;
    static showWanderSpeedToast(speedScale, speed) {
        if (typeof document === 'undefined')
            return;
        const text = `${speedScale.toFixed(2)}x (${speed.toFixed(2)})`;
        if (CameraUtils._speedToastElement) {
            CameraUtils._speedToastElement.textContent = text;
            if (CameraUtils._speedToastTimeout) {
                clearTimeout(CameraUtils._speedToastTimeout);
            }
            CameraUtils._speedToastTimeout = setTimeout(() => CameraUtils._hideSpeedToast(), 500);
            return;
        }
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.3); width: 200px; height: 100px;
            font-size: 26px; color: rgba(255, 255, 255, 0.9);
            border-radius: 10px; border: 0;
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; pointer-events: none; font-family: sans-serif;
        `;
        toast.textContent = text;
        document.body.appendChild(toast);
        CameraUtils._speedToastElement = toast;
        CameraUtils._speedToastTimeout = setTimeout(() => CameraUtils._hideSpeedToast(), 500);
    }
    static _hideSpeedToast() {
        if (CameraUtils._speedToastTimeout) {
            clearTimeout(CameraUtils._speedToastTimeout);
            CameraUtils._speedToastTimeout = null;
        }
        if (CameraUtils._speedToastElement) {
            CameraUtils._speedToastElement.remove();
            CameraUtils._speedToastElement = null;
        }
    }
}
exports.CameraUtils = CameraUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvY2FtZXJhL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJCQUFxRjtBQUVyRixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN4QixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRXhCLElBQVksY0FNWDtBQU5ELFdBQVksY0FBYztJQUN0QixtREFBUSxDQUFBO0lBQ1IscURBQVMsQ0FBQTtJQUNULGlEQUFPLENBQUE7SUFDUCxtREFBUSxDQUFBO0lBQ1IsdURBQVUsQ0FBQTtBQUNkLENBQUMsRUFOVyxjQUFjLDhCQUFkLGNBQWMsUUFNekI7QUFFRCxNQUFhLFdBQVc7SUFDcEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUF5QixFQUFFLElBQVksRUFBRSxJQUFjO1FBQ3ZFLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BELE9BQU8sQ0FBQyxJQUFJLENBQUMsNkNBQTZDLEVBQUUsSUFBSSxFQUFFO2dCQUM5RCxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ2YsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNoQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTTthQUNoRCxDQUFDLENBQUM7WUFDSCxPQUFPO1FBQ1gs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QkFDWixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDZixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDZixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDZixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsU0FBUyxDQUFDLElB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QUFDO2dCQUNqQyxZQUFZLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELFdBQVcsQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RGLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRzs7Ozs7OztTQU9yQixDQUFDO1FBQ0YsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFFekIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsV0FBVyxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUN2QyxXQUFXLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBRU8sTUFBTSxDQUFDLGVBQWU7UUFDMUIsSUFBSSxXQUFXLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUNqQyxZQUFZLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0MsV0FBVyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMxQyxDQUFDO1FBQ0QsSUFBSSxXQUFXLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUNqQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEMsV0FBVyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMxQyxDQUFDO0lBQ0wsQ0FBQzs7QUFuYkwsa0NBb2JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FtZXJhLCBDb2xvciwgZ2Z4LCBMYXllcnMsIE1lc2hSZW5kZXJlciwgTm9kZSwgdXRpbHMsIENDT2JqZWN0IH0gZnJvbSAnY2MnO1xuXG5jb25zdCBfbWF4VGlja3MgPSAxMDA7XG5jb25zdCB2Yk1hcCA9IG5ldyBNYXAoKTtcbmNvbnN0IGliTWFwID0gbmV3IE1hcCgpO1xuXG5leHBvcnQgZW51bSBDYW1lcmFNb3ZlTW9kZSB7XG4gICAgSURMRSA9IDAsXG4gICAgT1JCSVQgPSAxLFxuICAgIFBBTiA9IDIsXG4gICAgWk9PTSA9IDMsXG4gICAgV0FOREVSID0gNCxcbn1cblxuZXhwb3J0IGNsYXNzIENhbWVyYVV0aWxzIHtcbiAgICBzdGF0aWMgdXBkYXRlVkJBdHRyKGNvbXA6IE1lc2hSZW5kZXJlciB8IG51bGwsIGF0dHI6IHN0cmluZywgZGF0YTogbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3QgbW9kZWwgPSBjb21wICYmIGNvbXAubW9kZWwgJiYgY29tcC5tb2RlbC5zdWJNb2RlbHNbMF07XG4gICAgICAgIGlmICghbW9kZWwgfHwgIW1vZGVsLmlucHV0QXNzZW1ibGVyIHx8ICFtb2RlbC5zdWJNZXNoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tDYW1lcmFVdGlsc10gdXBkYXRlVkJBdHRyOiBtb2RlbCBub3QgcmVhZHknLCBhdHRyLCB7XG4gICAgICAgICAgICAgICAgaGFzQ29tcDogISFjb21wLFxuICAgICAgICAgICAgICAgIGhhc01vZGVsOiAhIShjb21wICYmIGNvbXAubW9kZWwpLFxuICAgICAgICAgICAgICAgIHN1Yk1vZGVsQ291bnQ6IGNvbXA/Lm1vZGVsPy5zdWJNb2RlbHM/Lmxlbmd0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgaW5wdXRBc3NlbWJsZXIsIHN1Yk1lc2ggfSA9IG1vZGVsO1xuICAgICAgICBjb25zdCB2YnVmZmVyID0gdmJNYXAuZ2V0KHN1Yk1lc2gpIGFzIEFycmF5QnVmZmVyO1xuICAgICAgICBpZiAoIXZidWZmZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Ioc3ViTWVzaCwgdmJ1ZmZlcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgIGxldCBmb3JtYXQgPSBnZnguRm9ybWF0LlVOS05PV047XG4gICAgICAgIGZvciAoY29uc3QgYSBvZiBpbnB1dEFzc2VtYmxlci5hdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBpZiAoYS5uYW1lID09PSBhdHRyKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gYS5mb3JtYXQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvZmZzZXQgKz0gZ2Z4LkZvcm1hdEluZm9zW2EuZm9ybWF0XS5zaXplO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZiID0gaW5wdXRBc3NlbWJsZXIudmVydGV4QnVmZmVyc1swXTtcbiAgICAgICAgaWYgKCFmb3JtYXQgfHwgIXZiKSByZXR1cm47XG4gICAgICAgIHV0aWxzLndyaXRlQnVmZmVyKG5ldyBEYXRhVmlldyh2YnVmZmVyIGFzIEFycmF5QnVmZmVyKSwgZGF0YSwgZm9ybWF0LCBvZmZzZXQsIHZiLnN0cmlkZSk7XG4gICAgICAgIHZiLnVwZGF0ZSh2YnVmZmVyLCB2Yi5zdHJpZGUgKiB2Yi5jb3VudCk7XG4gICAgICAgIGlmIChzdWJNZXNoLmdlb21ldHJpY0luZm8gJiYgYXR0ciA9PT0gZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9QT1NJVElPTikge1xuICAgICAgICAgICAgc3ViTWVzaC5nZW9tZXRyaWNJbmZvLnBvc2l0aW9ucy5zZXQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgdXBkYXRlSUIoY29tcDogTWVzaFJlbmRlcmVyIHwgbnVsbCwgZGF0YTogbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3QgbW9kZWwgPSBjb21wICYmIGNvbXAubW9kZWwgJiYgY29tcC5tb2RlbC5zdWJNb2RlbHNbMF07XG4gICAgICAgIGlmICghbW9kZWwgfHwgIW1vZGVsLmlucHV0QXNzZW1ibGVyIHx8ICFtb2RlbC5zdWJNZXNoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tDYW1lcmFVdGlsc10gdXBkYXRlSUI6IG1vZGVsIG5vdCByZWFkeScsIHtcbiAgICAgICAgICAgICAgICBoYXNDb21wOiAhIWNvbXAsXG4gICAgICAgICAgICAgICAgaGFzTW9kZWw6ICEhKGNvbXAgJiYgY29tcC5tb2RlbCksXG4gICAgICAgICAgICAgICAgc3ViTW9kZWxDb3VudDogY29tcD8ubW9kZWw/LnN1Yk1vZGVscz8ubGVuZ3RoLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBpbnB1dEFzc2VtYmxlciwgc3ViTWVzaCB9ID0gbW9kZWw7XG4gICAgICAgIGNvbnN0IGlidWZmZXIgPSBpYk1hcC5nZXQoc3ViTWVzaCkgYXMgQXJyYXlCdWZmZXI7XG4gICAgICAgIGlmICghaWJ1ZmZlcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihzdWJNZXNoLCBpYnVmZmVyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb3VudCA9IGlucHV0QXNzZW1ibGVyLmluZGV4Q291bnQ7XG4gICAgICAgIGNvbnN0IGliID0gaW5wdXRBc3NlbWJsZXIuaW5kZXhCdWZmZXI7XG4gICAgICAgIGlmICghY291bnQgfHwgIWliKSByZXR1cm47XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgZm9ybWF0ID0gZ2Z4LkZvcm1hdFtgUiR7aWIuc3RyaWRlICogOH1VSWBdO1xuICAgICAgICB1dGlscy53cml0ZUJ1ZmZlcihuZXcgRGF0YVZpZXcoaWJ1ZmZlciBhcyBBcnJheUJ1ZmZlciksIGRhdGEsIGZvcm1hdCk7XG4gICAgICAgIGliLnVwZGF0ZShpYnVmZmVyLCBpYi5zdHJpZGUgKiBpYi5jb3VudCk7XG4gICAgICAgIGlucHV0QXNzZW1ibGVyLmluZGV4Q291bnQgPSBkYXRhLmxlbmd0aDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ3JpZCh3aWR0aDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgc2VndzogbnVtYmVyLCBzZWdsOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCB1dnM6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGh3ID0gd2lkdGggKiAwLjU7XG4gICAgICAgIGNvbnN0IGhsID0gbGVuZ3RoICogMC41O1xuICAgICAgICBjb25zdCBkdyA9IHdpZHRoIC8gc2VndztcbiAgICAgICAgY29uc3QgZGwgPSBsZW5ndGggLyBzZWdsO1xuICAgICAgICBjb25zdCBtaW5Qb3MgPSBjYy52MygtaHcsIC0wLjEsIC1obCk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IGNjLnYzKGh3LCAwLjEsIGhsKTtcblxuICAgICAgICBmdW5jdGlvbiBhZGRMaW5lKHgxOiBudW1iZXIsIHoxOiBudW1iZXIsIHgyOiBudW1iZXIsIHoyOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IHBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgICAgICAgICAgaWYgKHgxID09PSB4Mikge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHgxICsgMC4wMSwgMCwgejEpO1xuICAgICAgICAgICAgICAgIHV2cy5wdXNoKDEsIDApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHgxIC0gMC4wMSwgMCwgejEpO1xuICAgICAgICAgICAgICAgIHV2cy5wdXNoKDAsIDApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHgxICsgMC4wMSwgMCwgejIpO1xuICAgICAgICAgICAgICAgIHV2cy5wdXNoKDEsIDApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHgxIC0gMC4wMSwgMCwgejIpO1xuICAgICAgICAgICAgICAgIHV2cy5wdXNoKDAsIDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh4MSwgMCwgejEgLSAwLjAxKTtcbiAgICAgICAgICAgICAgICB1dnMucHVzaCgwLCAxKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh4MSwgMCwgejEgKyAwLjAxKTtcbiAgICAgICAgICAgICAgICB1dnMucHVzaCgxLCAxKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh4MiwgMCwgejEgLSAwLjAxKTtcbiAgICAgICAgICAgICAgICB1dnMucHVzaCgwLCAxKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh4MiwgMCwgejEgKyAwLjAxKTtcbiAgICAgICAgICAgICAgICB1dnMucHVzaCgxLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGljZXMucHVzaChpZHgsIGlkeCArIDEsIGlkeCArIDIsIGlkeCArIDIsIGlkeCArIDEsIGlkeCArIDMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgeCA9IC1odzsgeCA8PSBodzsgeCArPSBkdykge1xuICAgICAgICAgICAgYWRkTGluZSh4LCAtaGwsIHgsIGhsKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCB6ID0gLWhsOyB6IDw9IGhsOyB6ICs9IGRsKSB7XG4gICAgICAgICAgICBhZGRMaW5lKC1odywgeiwgaHcsIHopO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHBvc2l0aW9ucywgdXZzLCBpbmRpY2VzLCBtaW5Qb3MsIG1heFBvcyB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVTdHJva2VHcmlkKHc6IG51bWJlciwgbDogbnVtYmVyLCBwYXJlbnROb2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgY2MuTm9kZSgnRWRpdG9yIEdyaWQnKTtcbiAgICAgICAgbm9kZS5sYXllciA9IGNjLkxheWVycy5FbnVtLkVESVRPUiB8IGNjLkxheWVycy5FbnVtLklHTk9SRV9SQVlDQVNUO1xuICAgICAgICBub2RlLl9vYmpGbGFncyB8PSBDQ09iamVjdC5GbGFncy5Eb250U2F2ZTtcbiAgICAgICAgbm9kZS5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBjb25zdCBtb2RlbCA9IG5vZGUuYWRkQ29tcG9uZW50KE1lc2hSZW5kZXJlcikgYXMgTWVzaFJlbmRlcmVyO1xuICAgICAgICBtb2RlbC5tZXNoID0gdXRpbHMuY3JlYXRlTWVzaChDYW1lcmFVdGlscy5ncmlkKHcsIGwsIHcsIGwpKTtcbiAgICAgICAgY29uc3QgY2IgPSBtb2RlbC5vbkVuYWJsZS5iaW5kKG1vZGVsKTtcbiAgICAgICAgbW9kZWwub25FbmFibGUgPSAoKSA9PiB7IGNiKCk7IH07XG4gICAgICAgIGNvbnN0IG10bCA9IG5ldyBjYy5NYXRlcmlhbCgpO1xuICAgICAgICBtdGwuaW5pdGlhbGl6ZSh7IGVmZmVjdE5hbWU6ICdpbnRlcm5hbC9lZGl0b3IvZ3JpZC1zdHJva2UnIH0pO1xuICAgICAgICBpZiAobXRsLnBhc3NlcyAmJiBtdGwucGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1vZGVsLm1hdGVyaWFsID0gbXRsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtb2RlbDtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlR3JpZChlZmZlY3ROYW1lOiBzdHJpbmcsIHBhcmVudE5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBjYy5Ob2RlKGVmZmVjdE5hbWUpO1xuICAgICAgICBub2RlLmxheWVyID0gY2MuTGF5ZXJzLkVudW0uRURJVE9SIHwgY2MuTGF5ZXJzLkVudW0uSUdOT1JFX1JBWUNBU1Q7XG4gICAgICAgIG5vZGUuX29iakZsYWdzIHw9IENDT2JqZWN0LkZsYWdzLkRvbnRTYXZlO1xuICAgICAgICBub2RlLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIG5vZGUuc2V0V29ybGRQb3NpdGlvbihjYy52MygwLCAwLCAwKSk7XG4gICAgICAgIGNvbnN0IG1vZGVsID0gbm9kZS5hZGRDb21wb25lbnQoTWVzaFJlbmRlcmVyKSBhcyBNZXNoUmVuZGVyZXI7XG4gICAgICAgIGNvbnN0IGNiID0gbW9kZWwub25FbmFibGUuYmluZChtb2RlbCk7XG4gICAgICAgIG1vZGVsLm9uRW5hYmxlID0gKCkgPT4geyBjYigpOyB9O1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBbXTtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9tYXhUaWNrcyAqIF9tYXhUaWNrczsgaSsrKSB7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaCgwLCAwKTtcbiAgICAgICAgICAgIGNvbG9ycy5wdXNoKDEsIDEsIDEsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2goaSAvIDIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZU1vZGUgPSBnZnguUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1Q7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXG4gICAgICAgICAgICB7IG5hbWU6IGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfUE9TSVRJT04sIGZvcm1hdDogZ2Z4LkZvcm1hdC5SRzMyRiB9LFxuICAgICAgICAgICAgeyBuYW1lOiBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0NPTE9SLCBmb3JtYXQ6IGdmeC5Gb3JtYXQuUkdCQTMyRiB9LFxuICAgICAgICBdO1xuICAgICAgICBjb25zdCBtZXNoID0gY2MudXRpbHMuY3JlYXRlTWVzaCh7IHBvc2l0aW9ucywgaW5kaWNlcywgY29sb3JzLCBwcmltaXRpdmVNb2RlLCBhdHRyaWJ1dGVzIH0pO1xuICAgICAgICBjb25zdCBzdWJNZXNoID0gbWVzaC5yZW5kZXJpbmdTdWJNZXNoZXNbMF07XG4gICAgICAgIGNvbnN0IHZiSW5mbyA9IG1lc2guc3RydWN0LnZlcnRleEJ1bmRsZXNbMF0udmlldztcbiAgICAgICAgY29uc3QgdmJ1ZmZlciA9IG1lc2guZGF0YS5idWZmZXIuc2xpY2UodmJJbmZvLm9mZnNldCwgdmJJbmZvLm9mZnNldCArIHZiSW5mby5sZW5ndGgpO1xuICAgICAgICB2Yk1hcC5zZXQoc3ViTWVzaCwgdmJ1ZmZlcik7XG4gICAgICAgIGNvbnN0IGliSW5mbyA9IG1lc2guc3RydWN0LnByaW1pdGl2ZXNbMF0uaW5kZXhWaWV3O1xuICAgICAgICBjb25zdCBpYnVmZmVyID0gbWVzaC5kYXRhLmJ1ZmZlci5zbGljZShpYkluZm8hLm9mZnNldCwgaWJJbmZvIS5vZmZzZXQgKyBpYkluZm8hLmxlbmd0aCk7XG4gICAgICAgIGliTWFwLnNldChzdWJNZXNoLCBpYnVmZmVyKTtcbiAgICAgICAgbW9kZWwubWVzaCA9IG1lc2g7XG4gICAgICAgIGNvbnN0IG10bCA9IG5ldyBjYy5NYXRlcmlhbCgpO1xuICAgICAgICBtdGwuaW5pdGlhbGl6ZSh7IGVmZmVjdE5hbWUsIHN0YXRlczogeyBwcmltaXRpdmU6IHByaW1pdGl2ZU1vZGUgfSB9KTtcbiAgICAgICAgaWYgKG10bC5wYXNzZXMgJiYgbXRsLnBhc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtb2RlbC5tYXRlcmlhbCA9IG10bDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUNhbWVyYShjb2xvcjogQ29sb3IsIHBhcmVudE5vZGU6IE5vZGUsIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ2FtZXJhID0gQ2FtZXJhKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgY2MuTm9kZSgnRWRpdG9yIENhbWVyYScpO1xuICAgICAgICBub2RlLmxheWVyID0gY2MuTGF5ZXJzLkVudW0uRURJVE9SO1xuICAgICAgICBub2RlLl9vYmpGbGFncyB8PSBDQ09iamVjdC5GbGFncy5Eb250U2F2ZTtcbiAgICAgICAgbm9kZS5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBjb25zdCBjYW1lcmEgPSBub2RlLmFkZENvbXBvbmVudChjb21wb25lbnRDbGFzcykgYXMgQ2FtZXJhO1xuICAgICAgICBjYW1lcmEuY2xlYXJGbGFncyA9IENhbWVyYS5DbGVhckZsYWcuU0tZQk9YIHwgZ2Z4LkNsZWFyRmxhZ0JpdC5DT0xPUjtcbiAgICAgICAgY2FtZXJhLmNsZWFyQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgY2FtZXJhLnZpc2liaWxpdHkgPSBMYXllcnMubWFrZU1hc2tFeGNsdWRlKFtMYXllcnMuQml0TWFzay5QUk9GSUxFUiwgTGF5ZXJzLkVudW0uR0laTU9TLCBMYXllcnMuRW51bS5TQ0VORV9HSVpNT10pO1xuICAgICAgICBjYW1lcmEuZmFyID0gMTAwMDAwO1xuICAgICAgICBjYW1lcmEubmVhciA9IDAuMTtcbiAgICAgICAgcmV0dXJuIGNhbWVyYTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfc25hcFRpcEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NuYXBUaXBUaW1lb3V0OiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gICAgc3RhdGljIHNob3dTbmFwVGlwKGR1cmF0aW9uID0gNTAwMCkge1xuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3NuYXBUaXBFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3NuYXBUaXBUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KENhbWVyYVV0aWxzLl9zbmFwVGlwVGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3NuYXBUaXBUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBDYW1lcmFVdGlscy5oaWRlU25hcFRpcCgpLCBkdXJhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSBgXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7IGJvdHRvbTogMTBweDsgbGVmdDogMTBweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDAwMDA0NzsgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTVweDsgcGFkZGluZzogMTBweDsgei1pbmRleDogOTk5OTtcbiAgICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lOyBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbiAgICAgICAgYDtcblxuICAgICAgICBjb25zdCBzbmFwSXRlbXM6IHsgbGFiZWw6IHN0cmluZzsga2V5czogc3RyaW5nW10gfVtdID0gW1xuICAgICAgICAgICAgeyBsYWJlbDogJ1ZlcnRleCBTbmFwJywga2V5czogWydWJ10gfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdTdXJmYWNlIFNuYXAnLCBrZXlzOiBbJ1NoaWZ0JywgJ0N0cmwnXSB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIHNuYXBJdGVtcy5mb3JFYWNoKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhY2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgc3BhY2VyLnN0eWxlLmhlaWdodCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzcGFjZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHJvdy5zdHlsZS5jc3NUZXh0ID0gJ2Rpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiByb3c7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7JztcblxuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICBsYWJlbC5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiB3aGl0ZTsgb3BhY2l0eTogMC42OyBtYXJnaW4tcmlnaHQ6IDhweDsnO1xuICAgICAgICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBpdGVtLmxhYmVsO1xuICAgICAgICAgICAgcm93LmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgICAgICAgY29uc3Qga2V5R3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGtleUdyb3VwLnN0eWxlLmNzc1RleHQgPSAnZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IHJvdzsgYWxpZ24taXRlbXM6IGJhc2VsaW5lOyBtaW4td2lkdGg6IDEyMHB4Oyc7XG5cbiAgICAgICAgICAgIGl0ZW0ua2V5cy5mb3JFYWNoKChrZXksIGtpKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgICAgICBwbHVzLnN0eWxlLmNzc1RleHQgPSAnZm9udC1zaXplOiAxMnB4OyBsaW5lLWhlaWdodDogMjBweDsgbWFyZ2luOiAwIDRweDsgY29sb3I6IHJnYmEoMjUwLDI1MCwyNTAsMSk7JztcbiAgICAgICAgICAgICAgICAgICAgcGx1cy50ZXh0Q29udGVudCA9ICcrJztcbiAgICAgICAgICAgICAgICAgICAga2V5R3JvdXAuYXBwZW5kQ2hpbGQocGx1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGtleUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAga2V5RWwuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA1MHB4OyBoZWlnaHQ6IDI0cHg7IGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogIzA1MDUwNTREOyBib3JkZXI6IDFweCBzb2xpZCAjRkFGQUZBMzM7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkFGQUZBOyBvcGFjaXR5OiAwLjc7XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICBrZXlFbC50ZXh0Q29udGVudCA9IGtleTtcbiAgICAgICAgICAgICAgICBrZXlHcm91cC5hcHBlbmRDaGlsZChrZXlFbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcm93LmFwcGVuZENoaWxkKGtleUdyb3VwKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICB9KTtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICAgIENhbWVyYVV0aWxzLl9zbmFwVGlwRWxlbWVudCA9IGNvbnRhaW5lcjtcblxuICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy5fc25hcFRpcFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IENhbWVyYVV0aWxzLmhpZGVTbmFwVGlwKCksIGR1cmF0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBoaWRlU25hcFRpcCgpIHtcbiAgICAgICAgaWYgKENhbWVyYVV0aWxzLl9zbmFwVGlwVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KENhbWVyYVV0aWxzLl9zbmFwVGlwVGltZW91dCk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy5fc25hcFRpcFRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChDYW1lcmFVdGlscy5fc25hcFRpcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIENhbWVyYVV0aWxzLl9zbmFwVGlwRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICAgIENhbWVyYVV0aWxzLl9zbmFwVGlwRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfd2FuZGVyVGlwRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIHN0YXRpYyBfd2FuZGVyVGlwVGltZW91dDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcblxuICAgIHN0YXRpYyBzaG93V2FuZGVyVGlwKGR1cmF0aW9uID0gNTAwMCkge1xuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3dhbmRlclRpcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChDYW1lcmFVdGlscy5fd2FuZGVyVGlwVGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChDYW1lcmFVdGlscy5fd2FuZGVyVGlwVGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3dhbmRlclRpcFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IENhbWVyYVV0aWxzLmhpZGVXYW5kZXJUaXAoKSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gYFxuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlOyBib3R0b206IDEwcHg7IGxlZnQ6IDEwcHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMDAwNDc7IGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBhbGlnbi1jb250ZW50OiBmbGV4LWVuZDsgZmxleC13cmFwOiBub3dyYXA7IGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTVweDsgcGFkZGluZy10b3A6IDZweDsgcGFkZGluZy1ib3R0b206IDZweDtcbiAgICAgICAgICAgIHotaW5kZXg6IDk5OTk7IHBvaW50ZXItZXZlbnRzOiBub25lOyBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbiAgICAgICAgYDtcblxuICAgICAgICBjb25zdCBrZXlDc3MgPSBgXG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIHdpZHRoOiAzMnB4OyBoZWlnaHQ6IDI0cHg7IGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICMwNTA1MDU0RDsgYm9yZGVyOiAxcHggc29saWQgI0ZBRkFGQTMzO1xuICAgICAgICAgICAgY29sb3I6ICNGQUZBRkE7IHBvc2l0aW9uOiByZWxhdGl2ZTsgbWFyZ2luLXJpZ2h0OiA0cHg7IG9wYWNpdHk6IDAuNztcbiAgICAgICAgYDtcblxuICAgICAgICBjb25zdCB3YW5kZXJLZXlzID0gW1xuICAgICAgICAgICAgeyBrZXk6ICdRJywgYXJyb3c6ICfilrwnIH0sXG4gICAgICAgICAgICB7IGtleTogJ1cnLCBhcnJvdzogJysnIH0sXG4gICAgICAgICAgICB7IGtleTogJ0UnLCBhcnJvdzogJ+KWsicgfSxcbiAgICAgICAgICAgIHsga2V5OiAnQScsIGFycm93OiAn4peAJyB9LFxuICAgICAgICAgICAgeyBrZXk6ICdTJywgYXJyb3c6ICctJyB9LFxuICAgICAgICAgICAgeyBrZXk6ICdEJywgYXJyb3c6ICfilrYnIH0sXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3Qgc2hvcnRjdXRSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc2hvcnRjdXRSb3cuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiByb3c7IGZsZXgtd3JhcDogbm93cmFwO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7IGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgIGA7XG5cbiAgICAgICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGxhYmVsLnN0eWxlLmNzc1RleHQgPSAnY29sb3I6IHdoaXRlOyBvcGFjaXR5OiAwLjY7IG1hcmdpbi1yaWdodDogOHB4OyBsaW5lLWhlaWdodDogNTZweDsnO1xuICAgICAgICBsYWJlbC50ZXh0Q29udGVudCA9ICdDYW1lcmEgV2FuZGVyOic7XG4gICAgICAgIHNob3J0Y3V0Um93LmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgICBjb25zdCBrZXlHcmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGtleUdyaWQuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIG1heC13aWR0aDogMTIwcHg7IGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgYDtcblxuICAgICAgICB3YW5kZXJLZXlzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBrZXlFbC5zdHlsZS5jc3NUZXh0ID0ga2V5Q3NzO1xuICAgICAgICAgICAga2V5RWwudGV4dENvbnRlbnQgPSBpdGVtLmtleTtcblxuICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgaW5kaWNhdG9yLnN0eWxlLmNzc1RleHQgPSBgXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlOyBmb250LXNpemU6IDhweDsgdG9wOiAzNSU7IHJpZ2h0OiAycHg7XG4gICAgICAgICAgICAgICAgY29sb3I6ICNBM0EzQTM7IGxpbmUtaGVpZ2h0OiAxO1xuICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIGluZGljYXRvci50ZXh0Q29udGVudCA9IGl0ZW0uYXJyb3c7XG4gICAgICAgICAgICBrZXlFbC5hcHBlbmRDaGlsZChpbmRpY2F0b3IpO1xuXG4gICAgICAgICAgICBrZXlHcmlkLmFwcGVuZENoaWxkKGtleUVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2hvcnRjdXRSb3cuYXBwZW5kQ2hpbGQoa2V5R3JpZCk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzaG9ydGN1dFJvdyk7XG5cbiAgICAgICAgY29uc3QgYWRkU3BhY2VyID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhY2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBzcGFjZXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDogMTAwJTsgaGVpZ2h0OiA0cHg7JztcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzcGFjZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFkZEtleXdvcmRSb3cgPSAodGV4dDogc3RyaW5nLCBrZXlUZXh0OiBzdHJpbmcsIGtleVdpZHRoOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGFkZFNwYWNlcigpO1xuICAgICAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICByb3cuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogcm93OyBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kOyBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgICBgO1xuICAgICAgICAgICAgY29uc3Qgcm93TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICByb3dMYWJlbC5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiB3aGl0ZTsgb3BhY2l0eTogMC42OyBtYXJnaW4tcmlnaHQ6IDhweDsnO1xuICAgICAgICAgICAgcm93TGFiZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgcm93LmFwcGVuZENoaWxkKHJvd0xhYmVsKTtcblxuICAgICAgICAgICAgY29uc3Qga2V5RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGtleUVsLnN0eWxlLmNzc1RleHQgPSBrZXlDc3MgKyBgd2lkdGg6ICR7a2V5V2lkdGh9OyBtaW4td2lkdGg6ICR7a2V5V2lkdGh9O2A7XG4gICAgICAgICAgICBrZXlFbC50ZXh0Q29udGVudCA9IGtleVRleHQ7XG4gICAgICAgICAgICByb3cuYXBwZW5kQ2hpbGQoa2V5RWwpO1xuXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm93KTtcbiAgICAgICAgfTtcblxuICAgICAgICBhZGRLZXl3b3JkUm93KCdTcGVlZDonLCAnU2hpZnQnLCAnODBweCcpO1xuICAgICAgICBhZGRLZXl3b3JkUm93KCdTcGVlZCBVcDonLCAnV2hlZWwgVXAnLCAnMTIwcHgnKTtcbiAgICAgICAgYWRkS2V5d29yZFJvdygnU3BlZWQgRG93bjonLCAnV2hlZWwgRG93bicsICcxMjBweCcpO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgQ2FtZXJhVXRpbHMuX3dhbmRlclRpcEVsZW1lbnQgPSBjb250YWluZXI7XG5cbiAgICAgICAgaWYgKGR1cmF0aW9uID4gMCkge1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3dhbmRlclRpcFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IENhbWVyYVV0aWxzLmhpZGVXYW5kZXJUaXAoKSwgZHVyYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGhpZGVXYW5kZXJUaXAoKSB7XG4gICAgICAgIGlmIChDYW1lcmFVdGlscy5fd2FuZGVyVGlwVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KENhbWVyYVV0aWxzLl93YW5kZXJUaXBUaW1lb3V0KTtcbiAgICAgICAgICAgIENhbWVyYVV0aWxzLl93YW5kZXJUaXBUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3dhbmRlclRpcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIENhbWVyYVV0aWxzLl93YW5kZXJUaXBFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3dhbmRlclRpcEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NwZWVkVG9hc3RFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgc3RhdGljIF9zcGVlZFRvYXN0VGltZW91dDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcblxuICAgIHN0YXRpYyBzaG93V2FuZGVyU3BlZWRUb2FzdChzcGVlZFNjYWxlOiBudW1iZXIsIHNwZWVkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcblxuICAgICAgICBjb25zdCB0ZXh0ID0gYCR7c3BlZWRTY2FsZS50b0ZpeGVkKDIpfXggKCR7c3BlZWQudG9GaXhlZCgyKX0pYDtcblxuICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3NwZWVkVG9hc3RFbGVtZW50KSB7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy5fc3BlZWRUb2FzdEVsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgaWYgKENhbWVyYVV0aWxzLl9zcGVlZFRvYXN0VGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChDYW1lcmFVdGlscy5fc3BlZWRUb2FzdFRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3NwZWVkVG9hc3RUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBDYW1lcmFVdGlscy5faGlkZVNwZWVkVG9hc3QoKSwgNTAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRvYXN0LnN0eWxlLmNzc1RleHQgPSBgXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogNjAlOyBsZWZ0OiA1MCU7IHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjMpOyB3aWR0aDogMjAwcHg7IGhlaWdodDogMTAwcHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDI2cHg7IGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMHB4OyBib3JkZXI6IDA7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIHotaW5kZXg6IDk5OTk7IHBvaW50ZXItZXZlbnRzOiBub25lOyBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbiAgICAgICAgYDtcbiAgICAgICAgdG9hc3QudGV4dENvbnRlbnQgPSB0ZXh0O1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9hc3QpO1xuICAgICAgICBDYW1lcmFVdGlscy5fc3BlZWRUb2FzdEVsZW1lbnQgPSB0b2FzdDtcbiAgICAgICAgQ2FtZXJhVXRpbHMuX3NwZWVkVG9hc3RUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBDYW1lcmFVdGlscy5faGlkZVNwZWVkVG9hc3QoKSwgNTAwKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfaGlkZVNwZWVkVG9hc3QoKSB7XG4gICAgICAgIGlmIChDYW1lcmFVdGlscy5fc3BlZWRUb2FzdFRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChDYW1lcmFVdGlscy5fc3BlZWRUb2FzdFRpbWVvdXQpO1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuX3NwZWVkVG9hc3RUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQ2FtZXJhVXRpbHMuX3NwZWVkVG9hc3RFbGVtZW50KSB7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy5fc3BlZWRUb2FzdEVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy5fc3BlZWRUb2FzdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19