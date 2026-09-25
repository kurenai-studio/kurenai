'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_defines_1 = require("../../gizmo-defines");
const engine_utils_1 = require("../../utils/engine-utils");
let BoxController;
let CircleController;
let HemisphereController;
let SphereController;
let ParticleSystemConeController;
function lazyRequireControllers() {
    if (!BoxController) {
        BoxController = require('../../controller/box').default;
        CircleController = require('../../controller/circle').default;
        HemisphereController = require('../../controller/hemisphere').default;
        SphereController = require('../../controller/sphere').default;
        ParticleSystemConeController = require('./controller-cone').default;
    }
}
let GizmoBase;
let IconGizmoBase;
try {
    GizmoBase = require('../../base/gizmo-base').default;
    IconGizmoBase = require('../../base/gizmo-icon').default;
}
catch (e) {
    GizmoBase = class {
    };
    IconGizmoBase = class {
    };
}
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
function toPrecision(val, n) {
    return Math.round(val * Math.pow(10, n)) / Math.pow(10, n);
}
const ShapeType = {
    Box: 0,
    Circle: 1,
    Cone: 2,
    Sphere: 3,
    Hemisphere: 4,
};
const CurveRangeMode = {
    Constant: 0,
    Curve: 1,
    TwoCurves: 2,
    TwoConstants: 3,
};
let tempVec3;
let tempQuat_a;
function lazyRequireTempVectors() {
    if (!tempVec3) {
        const cc = require('cc');
        tempVec3 = new cc.Vec3();
        tempQuat_a = new cc.Quat();
    }
}
class ParticleSystemComponentGizmo extends GizmoBase {
    _boundingBoxController;
    _curEmitterShape = ShapeType.Box;
    _shapeControllers = {};
    _PSGizmoColor = new cc_1.Color(100, 100, 255);
    _activeController = null;
    _pSGizmoRoot = null;
    _scale = new cc_1.Vec3();
    _size = new cc_1.Vec3();
    _radius = 0;
    _arc = 0;
    _coneHeight = 0;
    _coneAngle = 0;
    _bottomRadius = 0;
    _bbHalfSize = new cc_1.Vec3();
    init() {
        this.createController();
        this._isInitialized = true;
    }
    createController() {
        lazyRequireControllers();
        const gizmoRoot = this.getGizmoRoot();
        this._boundingBoxController = new BoxController(gizmoRoot);
        this._boundingBoxController.setColor(cc_1.Color.GREEN);
        this._boundingBoxController.editable = true;
        this._boundingBoxController.onControllerMouseDown = this.onBBControllerMouseDown.bind(this);
        this._boundingBoxController.onControllerMouseMove = this.onBBControllerMouseMove.bind(this);
        this._boundingBoxController.onControllerMouseUp = this.onBBControllerMouseUp.bind(this);
    }
    onShow() {
        this.updateControllerData();
    }
    onHide() {
        this._activeController?.hide();
        this._boundingBoxController.hide();
    }
    createControllerByShape(shape) {
        lazyRequireControllers();
        const gizmoRoot = this.getGizmoRoot();
        const PSGizmoRoot = (0, engine_utils_1.create3DNode)('ParticleSystemGizmo');
        PSGizmoRoot.parent = gizmoRoot;
        this._pSGizmoRoot = PSGizmoRoot;
        let controller = null;
        switch (shape) {
            case ShapeType.Box:
                controller = new BoxController(PSGizmoRoot);
                break;
            case ShapeType.Sphere:
                controller = new SphereController(PSGizmoRoot);
                break;
            case ShapeType.Circle:
                controller = new CircleController(PSGizmoRoot);
                break;
            case ShapeType.Cone:
                controller = new ParticleSystemConeController(PSGizmoRoot);
                break;
            case ShapeType.Hemisphere:
                controller = new HemisphereController(PSGizmoRoot);
                break;
            default:
                console.error('Invalid Type:', shape);
        }
        if (controller) {
            controller.editable = true;
            controller.setColor(this._PSGizmoColor);
            controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
            controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
            controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        }
        return controller;
    }
    getControllerByShape(shape) {
        let controller = this._shapeControllers[shape];
        if (!controller) {
            controller = this.createControllerByShape(shape);
            this._shapeControllers[shape] = controller;
        }
        else {
            controller.setRoot(this._pSGizmoRoot);
        }
        return controller;
    }
    getConeData(psComp) {
        const shapeModule = psComp.shapeModule;
        const topRadius = shapeModule ? shapeModule.radius : 1;
        const height = shapeModule ? shapeModule.length : 5;
        let coneAngle = shapeModule ? shapeModule.angle : 0;
        let deltaRadius = 0;
        if (coneAngle < 0) {
            coneAngle = 0;
        }
        if (coneAngle >= 90) {
            deltaRadius = 1000;
        }
        else {
            deltaRadius = Math.tan(coneAngle * D2R) * height;
        }
        const bottomRadius = topRadius + deltaRadius;
        return { topRadius, height, bottomRadius, coneAngle };
    }
    modifyConeData(psComp, deltaTopRadius, deltaHeight, deltaBottomRadius) {
        const shapeModule = psComp.shapeModule;
        if (!shapeModule) {
            return;
        }
        if (deltaTopRadius !== 0) {
            let topRadius = this._radius + deltaTopRadius;
            topRadius = toPrecision(topRadius, 3);
            if (topRadius < 0) {
                topRadius = 0.0001;
            }
            shapeModule.radius = topRadius;
        }
        else if (deltaHeight !== 0) {
            let height = this._coneHeight + deltaHeight;
            height = toPrecision(height, 3);
            if (height <= 0) {
                height = 0.0001;
            }
            shapeModule.length = height;
        }
        else if (deltaBottomRadius !== 0) {
            let bottomRadius = this._bottomRadius + deltaBottomRadius;
            if (bottomRadius < this._radius) {
                bottomRadius = this._radius;
            }
            const coneAngle = Math.atan2(bottomRadius - this._radius, this._coneHeight) * R2D;
            shapeModule.angle = toPrecision(coneAngle, 3);
        }
    }
    setCurveRangeInitValue(curve, value) {
        let kf;
        switch (curve.mode) {
            case CurveRangeMode.Constant:
                curve.constant = value;
                break;
            case CurveRangeMode.Curve:
                kf = curve.curve.keyFrames[0];
                if (kf) {
                    kf.value = value;
                }
                break;
            case CurveRangeMode.TwoCurves:
                kf = curve.curveMax.keyFrames[0];
                if (kf) {
                    kf.value = value;
                }
                break;
            case CurveRangeMode.TwoConstants:
                curve.constantMax = value;
                break;
            default:
                console.error('unknown cure range mode:', curve.mode);
        }
    }
    onControllerMouseDown() {
        if (!this._isInitialized || this.target === null) {
            return;
        }
        const shapeModule = this.target.shapeModule;
        this._curEmitterShape = shapeModule.shapeType;
        this._scale = this.target.node.getWorldScale();
        let coneData;
        switch (this._curEmitterShape) {
            case ShapeType.Box:
                this._size = shapeModule.scale.clone();
                break;
            case ShapeType.Sphere:
                this._radius = shapeModule.radius;
                break;
            case ShapeType.Circle:
                this._radius = shapeModule.radius;
                this._arc = shapeModule.arc;
                break;
            case ShapeType.Cone:
                coneData = this.getConeData(this.target);
                this._radius = coneData.topRadius;
                this._coneHeight = coneData.height;
                this._coneAngle = coneData.coneAngle;
                this._bottomRadius = coneData.bottomRadius;
                break;
            case ShapeType.Hemisphere:
                this._radius = shapeModule.radius;
                break;
        }
    }
    onControllerMouseMove() {
        this.updateDataFromController();
    }
    onControllerMouseUp() {
        this.commitChanges();
    }
    getScaledDeltaRadius(deltaRadius, controlDir, scale) {
        if (controlDir.x !== 0) {
            deltaRadius /= scale.x;
        }
        else if (controlDir.y !== 0) {
            deltaRadius /= scale.y;
        }
        else if (controlDir.z !== 0) {
            deltaRadius /= scale.z;
        }
        return deltaRadius;
    }
    updateDataFromController() {
        if (this._activeController?.updated && this.target) {
            this.recordChanges();
            const node = this.target.node;
            const shapeModule = this.target.shapeModule;
            lazyRequireTempVectors();
            switch (this._curEmitterShape) {
                case ShapeType.Box: {
                    const deltaSize = this._activeController.getDeltaSize();
                    cc_1.Vec3.divide(deltaSize, deltaSize, this._scale);
                    cc_1.Vec3.multiplyScalar(deltaSize, deltaSize, 2);
                    const newSize = cc_1.Vec3.add(tempVec3, this._size, deltaSize);
                    newSize.x = toPrecision(Math.abs(newSize.x), 3);
                    newSize.y = toPrecision(Math.abs(newSize.y), 3);
                    newSize.z = toPrecision(Math.abs(newSize.z), 3);
                    shapeModule.scale = newSize;
                    break;
                }
                case ShapeType.Sphere: {
                    let deltaRadius = this._activeController.getDeltaRadius();
                    const controlDir = this._activeController.getControlDir();
                    deltaRadius = this.getScaledDeltaRadius(deltaRadius, controlDir, this._scale);
                    let newRadius = this._radius + deltaRadius;
                    newRadius = Math.abs(newRadius);
                    newRadius = toPrecision(newRadius, 3);
                    shapeModule.radius = newRadius;
                    break;
                }
                case ShapeType.Circle: {
                    let deltaRadius = this._activeController.getDeltaRadius();
                    const controlDir = this._activeController.getControlDir();
                    if (controlDir.x !== 0) {
                        deltaRadius /= this._scale.x;
                    }
                    else if (controlDir.y !== 0) {
                        deltaRadius /= this._scale.y;
                    }
                    let newRadius = this._radius + deltaRadius;
                    newRadius = Math.abs(newRadius);
                    newRadius = toPrecision(newRadius, 3);
                    shapeModule.radius = newRadius;
                    break;
                }
                case ShapeType.Cone: {
                    const deltaTopRadius = this._activeController.getDeltaRadius();
                    const deltaHeight = this._activeController.getDeltaHeight();
                    const deltaBottomRadius = this._activeController.getDeltaBottomRadius();
                    this.modifyConeData(this.target, deltaTopRadius, deltaHeight, deltaBottomRadius);
                    break;
                }
                case ShapeType.Hemisphere: {
                    let deltaRadius = this._activeController.getDeltaRadius();
                    const controlDir = this._activeController.getControlDir();
                    deltaRadius = this.getScaledDeltaRadius(deltaRadius, controlDir, this._scale);
                    let newRadius = this._radius + deltaRadius;
                    newRadius = Math.abs(newRadius);
                    newRadius = toPrecision(newRadius, 3);
                    shapeModule.radius = newRadius;
                    break;
                }
            }
            this.onComponentChanged(node);
        }
    }
    updateControllerTransform() {
        if (this.target && this.target.shapeModule) {
            const shapeModule = this.target.shapeModule;
            if (shapeModule.enable && this._pSGizmoRoot) {
                lazyRequireTempVectors();
                const node = this.target.node;
                const worldRot = tempQuat_a;
                const worldPos = node.getWorldPosition();
                node.getWorldRotation(worldRot);
                const worldScale = node.getWorldScale();
                this._pSGizmoRoot.setWorldPosition(worldPos);
                this._pSGizmoRoot.setWorldRotation(worldRot);
                this._pSGizmoRoot.setWorldScale(worldScale);
                const shapeRot = shapeModule.rotation;
                const rot = tempQuat_a;
                cc_1.Quat.fromEuler(rot, shapeRot.x, shapeRot.y, shapeRot.z);
                if (this._activeController) {
                    this._activeController.setPosition(shapeModule.position);
                    this._activeController.setRotation(rot);
                    this._activeController.setScale(shapeModule.scale);
                }
            }
        }
    }
    updateControllerData() {
        if (!this._isInitialized || this.target === null) {
            return;
        }
        const shapeModule = this.target.shapeModule;
        if (shapeModule.enable) {
            if (this._activeController) {
                const isMouseDown = this._activeController['isMouseDown'];
                this._activeController.hide();
                this._activeController['_isMouseDown'] = isMouseDown;
            }
            this._activeController = this.getControllerByShape(shapeModule.shapeType);
            this._activeController?.checkEdit();
            this.updateControllerTransform();
            switch (shapeModule.shapeType) {
                case ShapeType.Box: {
                    const boxController = this._activeController;
                    if (boxController.edit) {
                        boxController.updateEditHandles();
                    }
                    boxController.adjustEditHandlesSize();
                    break;
                }
                case ShapeType.Sphere:
                    this._activeController.radius = shapeModule.radius;
                    break;
                case ShapeType.Circle:
                    this._activeController.updateSize(cc_1.Vec3.ZERO, shapeModule.radius, shapeModule.arc);
                    break;
                case ShapeType.Cone: {
                    const coneData = this.getConeData(this.target);
                    coneData &&
                        this._activeController.updateSize(cc_1.Vec3.ZERO, coneData.topRadius, coneData.height, coneData.bottomRadius);
                    break;
                }
                case ShapeType.Hemisphere:
                    this._activeController.radius = shapeModule.radius;
            }
            this._activeController?.show();
        }
        else {
            this._activeController?.hide();
        }
        this.updateBBControllerData();
    }
    onTargetUpdate() {
        this.updateControllerData();
    }
    onNodeChanged() {
        this.updateControllerData();
    }
    updateDataFromBBController() {
        if (this._boundingBoxController.updated && this.target) {
            this.recordChanges();
            const node = this.target.node;
            lazyRequireTempVectors();
            const deltaSize = this._boundingBoxController.getDeltaSize();
            cc_1.Vec3.add(tempVec3, this._bbHalfSize, deltaSize);
            const psComp = this.target;
            psComp.aabbHalfX = tempVec3.x;
            psComp.aabbHalfY = tempVec3.y;
            psComp.aabbHalfZ = tempVec3.z;
            this.onComponentChanged(node);
        }
    }
    updateBBControllerData() {
        if (!this.target) {
            return;
        }
        const psComp = this.target;
        const boundingBox = psComp._boundingBox;
        if (psComp.renderCulling && boundingBox && psComp._isShowBB) {
            this._boundingBoxController.edit = true;
            this._boundingBoxController.setPosition(boundingBox.center);
            const halfExtents = boundingBox.halfExtents;
            lazyRequireTempVectors();
            this._boundingBoxController.updateSize(cc_1.Vec3.ZERO, tempVec3.set(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2));
            this._boundingBoxController.show();
        }
        else {
            this._boundingBoxController.hide();
        }
    }
    onBBControllerMouseDown() {
        if (!this._isInitialized || this.target == null) {
            return;
        }
        const psComp = this.target;
        this._bbHalfSize.set(psComp.aabbHalfX, psComp.aabbHalfY, psComp.aabbHalfZ);
    }
    onBBControllerMouseMove() {
        this.updateDataFromBBController();
    }
    onBBControllerMouseUp() {
        this.commitChanges();
    }
    showBoundingBox(isShow) {
        if (!this.target) {
            return;
        }
        const psComp = this.target;
        if (psComp) {
            psComp._isShowBB = isShow;
        }
        this.updateBBControllerData();
    }
    isShowBoundingBox() {
        return this.target?._isShowBB;
    }
}
class ParticleSystemIconGizmo extends IconGizmoBase {
    disableOnSelected = true;
    createController() {
        super.createController();
        this._controller.setTextureByUUID('55052bc6-9909-43c1-b2fc-8818060fb069@6c48a');
    }
}
exports.name = cc_1.js.getClassName(cc_1.ParticleSystem);
exports.SelectGizmo = ParticleSystemComponentGizmo;
exports.IconGizmo = ParticleSystemIconGizmo;
exports.PersistentGizmo = null;
function getGizmoService() {
    try {
        const { Service } = require('../../core/decorator');
        return Service.Gizmo;
    }
    catch (e) {
        return null;
    }
}
exports.methods = {
    showBoundingBox(uuid, isShow) {
        getGizmoService()?.forEachInstanceList?.('component', exports.name, (gizmo) => {
            if (gizmo?.target?.node?.uuid === uuid) {
                gizmo.showBoundingBox(isShow);
            }
        });
    },
    isShowBoundingBox(uuid) {
        let result;
        getGizmoService()?.forEachInstanceList?.('component', exports.name, (gizmo) => {
            if (gizmo?.target?.node?.uuid === uuid) {
                result = gizmo.isShowBoundingBox();
            }
        });
        return result;
    },
};
// 使用 try-catch 包裹，避免测试环境报错
try {
    (0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo, IconGizmo: exports.IconGizmo, methods: exports.methods });
}
catch (e) {
    // 测试环境可能没有 registerGizmo，忽略
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9wYXJ0aWNsZS1zeXN0ZW0vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFLYiwyQkFBMkU7QUFDM0UsdURBQW9EO0FBQ3BELDJEQUF3RDtBQUV4RCxJQUFJLGFBQWtCLENBQUM7QUFDdkIsSUFBSSxnQkFBcUIsQ0FBQztBQUMxQixJQUFJLG9CQUF5QixDQUFDO0FBQzlCLElBQUksZ0JBQXFCLENBQUM7QUFDMUIsSUFBSSw0QkFBaUMsQ0FBQztBQUV0QyxTQUFTLHNCQUFzQjtJQUMzQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDakIsYUFBYSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN4RCxnQkFBZ0IsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDOUQsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3RFLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUM5RCw0QkFBNEIsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDeEUsQ0FBQztBQUNMLENBQUM7QUFFRCxJQUFJLFNBQWMsQ0FBQztBQUNuQixJQUFJLGFBQWtCLENBQUM7QUFDdkIsSUFBSSxDQUFDO0lBQ0QsU0FBUyxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUNyRCxhQUFhLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUMsT0FBTyxDQUFDO0FBQzdELENBQUM7QUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0lB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O0lBQ1QsNEJBQTRCO0FBQ2hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXMgKi9cbmRlY2xhcmUgY29uc3QgcmVxdWlyZTogYW55O1xuXG5pbXBvcnQgeyBDb2xvciwgZ2VvbWV0cnksIGpzLCBOb2RlLCBQYXJ0aWNsZVN5c3RlbSwgUXVhdCwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCB7IHJlZ2lzdGVyR2l6bW8gfSBmcm9tICcuLi8uLi9naXptby1kZWZpbmVzJztcbmltcG9ydCB7IGNyZWF0ZTNETm9kZSB9IGZyb20gJy4uLy4uL3V0aWxzL2VuZ2luZS11dGlscyc7XG5cbmxldCBCb3hDb250cm9sbGVyOiBhbnk7XG5sZXQgQ2lyY2xlQ29udHJvbGxlcjogYW55O1xubGV0IEhlbWlzcGhlcmVDb250cm9sbGVyOiBhbnk7XG5sZXQgU3BoZXJlQ29udHJvbGxlcjogYW55O1xubGV0IFBhcnRpY2xlU3lzdGVtQ29uZUNvbnRyb2xsZXI6IGFueTtcblxuZnVuY3Rpb24gbGF6eVJlcXVpcmVDb250cm9sbGVycygpIHtcbiAgICBpZiAoIUJveENvbnRyb2xsZXIpIHtcbiAgICAgICAgQm94Q29udHJvbGxlciA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xsZXIvYm94JykuZGVmYXVsdDtcbiAgICAgICAgQ2lyY2xlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xsZXIvY2lyY2xlJykuZGVmYXVsdDtcbiAgICAgICAgSGVtaXNwaGVyZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi8uLi9jb250cm9sbGVyL2hlbWlzcGhlcmUnKS5kZWZhdWx0O1xuICAgICAgICBTcGhlcmVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbGxlci9zcGhlcmUnKS5kZWZhdWx0O1xuICAgICAgICBQYXJ0aWNsZVN5c3RlbUNvbmVDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyLWNvbmUnKS5kZWZhdWx0O1xuICAgIH1cbn1cblxubGV0IEdpem1vQmFzZTogYW55O1xubGV0IEljb25HaXptb0Jhc2U6IGFueTtcbnRyeSB7XG4gICAgR2l6bW9CYXNlID0gcmVxdWlyZSgnLi4vLi4vYmFzZS9naXptby1iYXNlJykuZGVmYXVsdDtcbiAgICBJY29uR2l6bW9CYXNlID0gcmVxdWlyZSgnLi4vLi4vYmFzZS9naXptby1pY29uJykuZGVmYXVsdDtcbn0gY2F0Y2ggKGUpIHtcbiAgICBHaXptb0Jhc2UgPSBjbGFzcyB7fTtcbiAgICBJY29uR2l6bW9CYXNlID0gY2xhc3Mge307XG59XG5cbmNvbnN0IEQyUiA9IE1hdGguUEkgLyAxODA7XG5jb25zdCBSMkQgPSAxODAgLyBNYXRoLlBJO1xuXG5mdW5jdGlvbiB0b1ByZWNpc2lvbih2YWw6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWwgKiBNYXRoLnBvdygxMCwgbikpIC8gTWF0aC5wb3coMTAsIG4pO1xufVxuXG5jb25zdCBTaGFwZVR5cGUgPSB7XG4gICAgQm94OiAwLFxuICAgIENpcmNsZTogMSxcbiAgICBDb25lOiAyLFxuICAgIFNwaGVyZTogMyxcbiAgICBIZW1pc3BoZXJlOiA0LFxufTtcblxuY29uc3QgQ3VydmVSYW5nZU1vZGUgPSB7XG4gICAgQ29uc3RhbnQ6IDAsXG4gICAgQ3VydmU6IDEsXG4gICAgVHdvQ3VydmVzOiAyLFxuICAgIFR3b0NvbnN0YW50czogMyxcbn07XG5cbnR5cGUgVFNoYXBlQ29udHJvbGxlciA9IGFueTtcblxubGV0IHRlbXBWZWMzOiBhbnk7XG5sZXQgdGVtcFF1YXRfYTogYW55O1xuXG5mdW5jdGlvbiBsYXp5UmVxdWlyZVRlbXBWZWN0b3JzKCkge1xuICAgIGlmICghdGVtcFZlYzMpIHtcbiAgICAgICAgY29uc3QgY2MgPSByZXF1aXJlKCdjYycpO1xuICAgICAgICB0ZW1wVmVjMyA9IG5ldyBjYy5WZWMzKCk7XG4gICAgICAgIHRlbXBRdWF0X2EgPSBuZXcgY2MuUXVhdCgpO1xuICAgIH1cbn1cblxuY2xhc3MgUGFydGljbGVTeXN0ZW1Db21wb25lbnRHaXptbyBleHRlbmRzIChHaXptb0Jhc2UgYXMgYW55KSB7XG4gICAgcHJpdmF0ZSBfYm91bmRpbmdCb3hDb250cm9sbGVyITogYW55O1xuICAgIHByaXZhdGUgX2N1ckVtaXR0ZXJTaGFwZSA9IFNoYXBlVHlwZS5Cb3g7XG4gICAgcHJpdmF0ZSBfc2hhcGVDb250cm9sbGVyczogYW55ID0ge307XG4gICAgcHJpdmF0ZSBfUFNHaXptb0NvbG9yOiBDb2xvciA9IG5ldyBDb2xvcigxMDAsIDEwMCwgMjU1KTtcbiAgICBwcml2YXRlIF9hY3RpdmVDb250cm9sbGVyOiBUU2hhcGVDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfcFNHaXptb1Jvb3Q6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9zY2FsZSA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSBfc2l6ZSA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSBfcmFkaXVzID0gMDtcbiAgICBwcml2YXRlIF9hcmMgPSAwO1xuICAgIHByaXZhdGUgX2NvbmVIZWlnaHQgPSAwO1xuICAgIHByaXZhdGUgX2NvbmVBbmdsZSA9IDA7XG4gICAgcHJpdmF0ZSBfYm90dG9tUmFkaXVzID0gMDtcbiAgICBwcml2YXRlIF9iYkhhbGZTaXplID0gbmV3IFZlYzMoKTtcblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb250cm9sbGVyKCkge1xuICAgICAgICBsYXp5UmVxdWlyZUNvbnRyb2xsZXJzKCk7XG4gICAgICAgIGNvbnN0IGdpem1vUm9vdCA9IHRoaXMuZ2V0R2l6bW9Sb290KCk7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlciA9IG5ldyBCb3hDb250cm9sbGVyKGdpem1vUm9vdCk7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5zZXRDb2xvcihDb2xvci5HUkVFTik7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5lZGl0YWJsZSA9IHRydWU7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZURvd24gPSB0aGlzLm9uQkJDb250cm9sbGVyTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZU1vdmUgPSB0aGlzLm9uQkJDb250cm9sbGVyTW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZVVwID0gdGhpcy5vbkJCQ29udHJvbGxlck1vdXNlVXAuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvblNob3coKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvbkhpZGUoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXI/LmhpZGUoKTtcbiAgICAgICAgdGhpcy5fYm91bmRpbmdCb3hDb250cm9sbGVyLmhpZGUoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb250cm9sbGVyQnlTaGFwZShzaGFwZTogYW55KTogVFNoYXBlQ29udHJvbGxlciB8IG51bGwge1xuICAgICAgICBsYXp5UmVxdWlyZUNvbnRyb2xsZXJzKCk7XG4gICAgICAgIGNvbnN0IGdpem1vUm9vdCA9IHRoaXMuZ2V0R2l6bW9Sb290KCk7XG4gICAgICAgIGNvbnN0IFBTR2l6bW9Sb290ID0gY3JlYXRlM0ROb2RlKCdQYXJ0aWNsZVN5c3RlbUdpem1vJyk7XG4gICAgICAgIFBTR2l6bW9Sb290LnBhcmVudCA9IGdpem1vUm9vdDtcbiAgICAgICAgdGhpcy5fcFNHaXptb1Jvb3QgPSBQU0dpem1vUm9vdDtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXI6IFRTaGFwZUNvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBzd2l0Y2ggKHNoYXBlKSB7XG4gICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5Cb3g6XG4gICAgICAgICAgICAgICAgY29udHJvbGxlciA9IG5ldyBCb3hDb250cm9sbGVyKFBTR2l6bW9Sb290KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLlNwaGVyZTpcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyID0gbmV3IFNwaGVyZUNvbnRyb2xsZXIoUFNHaXptb1Jvb3QpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQ2lyY2xlOlxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIgPSBuZXcgQ2lyY2xlQ29udHJvbGxlcihQU0dpem1vUm9vdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5Db25lOlxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIgPSBuZXcgUGFydGljbGVTeXN0ZW1Db25lQ29udHJvbGxlcihQU0dpem1vUm9vdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5IZW1pc3BoZXJlOlxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIgPSBuZXcgSGVtaXNwaGVyZUNvbnRyb2xsZXIoUFNHaXptb1Jvb3QpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIFR5cGU6Jywgc2hhcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZWRpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgY29udHJvbGxlci5zZXRDb2xvcih0aGlzLl9QU0dpem1vQ29sb3IpO1xuICAgICAgICAgICAgY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZURvd24gPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlRG93bi5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZU1vdmUgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZVVwID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwLmJpbmQodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICB9XG5cbiAgICBnZXRDb250cm9sbGVyQnlTaGFwZShzaGFwZTogYW55KTogVFNoYXBlQ29udHJvbGxlciB8IG51bGwge1xuICAgICAgICBsZXQgY29udHJvbGxlciA9IHRoaXMuX3NoYXBlQ29udHJvbGxlcnNbc2hhcGVdO1xuICAgICAgICBpZiAoIWNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIgPSB0aGlzLmNyZWF0ZUNvbnRyb2xsZXJCeVNoYXBlKHNoYXBlKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYXBlQ29udHJvbGxlcnNbc2hhcGVdID0gY29udHJvbGxlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuc2V0Um9vdCh0aGlzLl9wU0dpem1vUm9vdCEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250cm9sbGVyO1xuICAgIH1cblxuICAgIGdldENvbmVEYXRhKHBzQ29tcDogUGFydGljbGVTeXN0ZW0pIHtcbiAgICAgICAgY29uc3Qgc2hhcGVNb2R1bGUgPSBwc0NvbXAuc2hhcGVNb2R1bGU7XG4gICAgICAgIGNvbnN0IHRvcFJhZGl1cyA9IHNoYXBlTW9kdWxlID8gc2hhcGVNb2R1bGUucmFkaXVzIDogMTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gc2hhcGVNb2R1bGUgPyBzaGFwZU1vZHVsZS5sZW5ndGggOiA1O1xuICAgICAgICBsZXQgY29uZUFuZ2xlID0gc2hhcGVNb2R1bGUgPyBzaGFwZU1vZHVsZS5hbmdsZSA6IDA7XG4gICAgICAgIGxldCBkZWx0YVJhZGl1cyA9IDA7XG4gICAgICAgIGlmIChjb25lQW5nbGUgPCAwKSB7XG4gICAgICAgICAgICBjb25lQW5nbGUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25lQW5nbGUgPj0gOTApIHtcbiAgICAgICAgICAgIGRlbHRhUmFkaXVzID0gMTAwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbHRhUmFkaXVzID0gTWF0aC50YW4oY29uZUFuZ2xlICogRDJSKSAqIGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBib3R0b21SYWRpdXMgPSB0b3BSYWRpdXMgKyBkZWx0YVJhZGl1cztcbiAgICAgICAgcmV0dXJuIHsgdG9wUmFkaXVzLCBoZWlnaHQsIGJvdHRvbVJhZGl1cywgY29uZUFuZ2xlIH07XG4gICAgfVxuXG4gICAgbW9kaWZ5Q29uZURhdGEocHNDb21wOiBQYXJ0aWNsZVN5c3RlbSwgZGVsdGFUb3BSYWRpdXM6IG51bWJlciwgZGVsdGFIZWlnaHQ6IG51bWJlciwgZGVsdGFCb3R0b21SYWRpdXM6IG51bWJlcikge1xuICAgICAgICBjb25zdCBzaGFwZU1vZHVsZSA9IHBzQ29tcC5zaGFwZU1vZHVsZTtcbiAgICAgICAgaWYgKCFzaGFwZU1vZHVsZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWx0YVRvcFJhZGl1cyAhPT0gMCkge1xuICAgICAgICAgICAgbGV0IHRvcFJhZGl1cyA9IHRoaXMuX3JhZGl1cyArIGRlbHRhVG9wUmFkaXVzO1xuICAgICAgICAgICAgdG9wUmFkaXVzID0gdG9QcmVjaXNpb24odG9wUmFkaXVzLCAzKTtcbiAgICAgICAgICAgIGlmICh0b3BSYWRpdXMgPCAwKSB7XG4gICAgICAgICAgICAgICAgdG9wUmFkaXVzID0gMC4wMDAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hhcGVNb2R1bGUucmFkaXVzID0gdG9wUmFkaXVzO1xuICAgICAgICB9IGVsc2UgaWYgKGRlbHRhSGVpZ2h0ICE9PSAwKSB7XG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gdGhpcy5fY29uZUhlaWdodCArIGRlbHRhSGVpZ2h0O1xuICAgICAgICAgICAgaGVpZ2h0ID0gdG9QcmVjaXNpb24oaGVpZ2h0LCAzKTtcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IDAuMDAwMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNoYXBlTW9kdWxlLmxlbmd0aCA9IGhlaWdodDtcbiAgICAgICAgfSBlbHNlIGlmIChkZWx0YUJvdHRvbVJhZGl1cyAhPT0gMCkge1xuICAgICAgICAgICAgbGV0IGJvdHRvbVJhZGl1cyA9IHRoaXMuX2JvdHRvbVJhZGl1cyArIGRlbHRhQm90dG9tUmFkaXVzO1xuICAgICAgICAgICAgaWYgKGJvdHRvbVJhZGl1cyA8IHRoaXMuX3JhZGl1cykge1xuICAgICAgICAgICAgICAgIGJvdHRvbVJhZGl1cyA9IHRoaXMuX3JhZGl1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbmVBbmdsZSA9IE1hdGguYXRhbjIoYm90dG9tUmFkaXVzIC0gdGhpcy5fcmFkaXVzLCB0aGlzLl9jb25lSGVpZ2h0KSAqIFIyRDtcbiAgICAgICAgICAgIHNoYXBlTW9kdWxlLmFuZ2xlID0gdG9QcmVjaXNpb24oY29uZUFuZ2xlLCAzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEN1cnZlUmFuZ2VJbml0VmFsdWUoY3VydmU6IGFueSwgdmFsdWU6IGFueSkge1xuICAgICAgICBsZXQga2Y7XG4gICAgICAgIHN3aXRjaCAoY3VydmUubW9kZSkge1xuICAgICAgICAgICAgY2FzZSBDdXJ2ZVJhbmdlTW9kZS5Db25zdGFudDpcbiAgICAgICAgICAgICAgICBjdXJ2ZS5jb25zdGFudCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBDdXJ2ZVJhbmdlTW9kZS5DdXJ2ZTpcbiAgICAgICAgICAgICAgICBrZiA9IGN1cnZlLmN1cnZlLmtleUZyYW1lc1swXTtcbiAgICAgICAgICAgICAgICBpZiAoa2YpIHtcbiAgICAgICAgICAgICAgICAgICAga2YudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEN1cnZlUmFuZ2VNb2RlLlR3b0N1cnZlczpcbiAgICAgICAgICAgICAgICBrZiA9IGN1cnZlLmN1cnZlTWF4LmtleUZyYW1lc1swXTtcbiAgICAgICAgICAgICAgICBpZiAoa2YpIHtcbiAgICAgICAgICAgICAgICAgICAga2YudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEN1cnZlUmFuZ2VNb2RlLlR3b0NvbnN0YW50czpcbiAgICAgICAgICAgICAgICBjdXJ2ZS5jb25zdGFudE1heCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCd1bmtub3duIGN1cmUgcmFuZ2UgbW9kZTonLCBjdXJ2ZS5tb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlRG93bigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8IHRoaXMudGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2hhcGVNb2R1bGUgPSB0aGlzLnRhcmdldC5zaGFwZU1vZHVsZSE7XG4gICAgICAgIHRoaXMuX2N1ckVtaXR0ZXJTaGFwZSA9IHNoYXBlTW9kdWxlLnNoYXBlVHlwZTtcbiAgICAgICAgdGhpcy5fc2NhbGUgPSB0aGlzLnRhcmdldC5ub2RlLmdldFdvcmxkU2NhbGUoKTtcbiAgICAgICAgbGV0IGNvbmVEYXRhO1xuICAgICAgICBzd2l0Y2ggKHRoaXMuX2N1ckVtaXR0ZXJTaGFwZSkge1xuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQm94OlxuICAgICAgICAgICAgICAgIHRoaXMuX3NpemUgPSBzaGFwZU1vZHVsZS5zY2FsZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuU3BoZXJlOlxuICAgICAgICAgICAgICAgIHRoaXMuX3JhZGl1cyA9IHNoYXBlTW9kdWxlLnJhZGl1cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkNpcmNsZTpcbiAgICAgICAgICAgICAgICB0aGlzLl9yYWRpdXMgPSBzaGFwZU1vZHVsZS5yYWRpdXM7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJjID0gc2hhcGVNb2R1bGUuYXJjO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQ29uZTpcbiAgICAgICAgICAgICAgICBjb25lRGF0YSA9IHRoaXMuZ2V0Q29uZURhdGEodGhpcy50YXJnZXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JhZGl1cyA9IGNvbmVEYXRhLnRvcFJhZGl1cztcbiAgICAgICAgICAgICAgICB0aGlzLl9jb25lSGVpZ2h0ID0gY29uZURhdGEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbmVBbmdsZSA9IGNvbmVEYXRhLmNvbmVBbmdsZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b21SYWRpdXMgPSBjb25lRGF0YS5ib3R0b21SYWRpdXM7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5IZW1pc3BoZXJlOlxuICAgICAgICAgICAgICAgIHRoaXMuX3JhZGl1cyA9IHNoYXBlTW9kdWxlLnJhZGl1cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlTW92ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZVVwKCkge1xuICAgICAgICB0aGlzLmNvbW1pdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgICBnZXRTY2FsZWREZWx0YVJhZGl1cyhkZWx0YVJhZGl1czogbnVtYmVyLCBjb250cm9sRGlyOiBWZWMzLCBzY2FsZTogVmVjMykge1xuICAgICAgICBpZiAoY29udHJvbERpci54ICE9PSAwKSB7XG4gICAgICAgICAgICBkZWx0YVJhZGl1cyAvPSBzY2FsZS54O1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRyb2xEaXIueSAhPT0gMCkge1xuICAgICAgICAgICAgZGVsdGFSYWRpdXMgLz0gc2NhbGUueTtcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sRGlyLnogIT09IDApIHtcbiAgICAgICAgICAgIGRlbHRhUmFkaXVzIC89IHNjYWxlLno7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlbHRhUmFkaXVzO1xuICAgIH1cblxuICAgIHVwZGF0ZURhdGFGcm9tQ29udHJvbGxlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXI/LnVwZGF0ZWQgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQ2hhbmdlcygpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMudGFyZ2V0Lm5vZGU7XG4gICAgICAgICAgICBjb25zdCBzaGFwZU1vZHVsZSA9IHRoaXMudGFyZ2V0LnNoYXBlTW9kdWxlITtcbiAgICAgICAgICAgIGxhenlSZXF1aXJlVGVtcFZlY3RvcnMoKTtcblxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLl9jdXJFbWl0dGVyU2hhcGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5Cb3g6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVsdGFTaXplID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXREZWx0YVNpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5kaXZpZGUoZGVsdGFTaXplLCBkZWx0YVNpemUsIHRoaXMuX3NjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcihkZWx0YVNpemUsIGRlbHRhU2l6ZSwgMik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1NpemUgPSBWZWMzLmFkZCh0ZW1wVmVjMywgdGhpcy5fc2l6ZSwgZGVsdGFTaXplKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2l6ZS54ID0gdG9QcmVjaXNpb24oTWF0aC5hYnMobmV3U2l6ZS54KSwgMyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1NpemUueSA9IHRvUHJlY2lzaW9uKE1hdGguYWJzKG5ld1NpemUueSksIDMpO1xuICAgICAgICAgICAgICAgICAgICBuZXdTaXplLnogPSB0b1ByZWNpc2lvbihNYXRoLmFicyhuZXdTaXplLnopLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgc2hhcGVNb2R1bGUuc2NhbGUgPSBuZXdTaXplO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuU3BoZXJlOiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWx0YVJhZGl1cyA9ICh0aGlzLl9hY3RpdmVDb250cm9sbGVyIGFzIGFueSkuZ2V0RGVsdGFSYWRpdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udHJvbERpciA9ICh0aGlzLl9hY3RpdmVDb250cm9sbGVyIGFzIGFueSkuZ2V0Q29udHJvbERpcigpO1xuICAgICAgICAgICAgICAgICAgICBkZWx0YVJhZGl1cyA9IHRoaXMuZ2V0U2NhbGVkRGVsdGFSYWRpdXMoZGVsdGFSYWRpdXMsIGNvbnRyb2xEaXIsIHRoaXMuX3NjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld1JhZGl1cyA9IHRoaXMuX3JhZGl1cyArIGRlbHRhUmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICBuZXdSYWRpdXMgPSBNYXRoLmFicyhuZXdSYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBuZXdSYWRpdXMgPSB0b1ByZWNpc2lvbihuZXdSYWRpdXMsIDMpO1xuICAgICAgICAgICAgICAgICAgICBzaGFwZU1vZHVsZS5yYWRpdXMgPSBuZXdSYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIFNoYXBlVHlwZS5DaXJjbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlbHRhUmFkaXVzID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXREZWx0YVJhZGl1cygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sRGlyID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXRDb250cm9sRGlyKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250cm9sRGlyLnggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhUmFkaXVzIC89IHRoaXMuX3NjYWxlLng7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udHJvbERpci55ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVJhZGl1cyAvPSB0aGlzLl9zY2FsZS55O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdSYWRpdXMgPSB0aGlzLl9yYWRpdXMgKyBkZWx0YVJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgbmV3UmFkaXVzID0gTWF0aC5hYnMobmV3UmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UmFkaXVzID0gdG9QcmVjaXNpb24obmV3UmFkaXVzLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgc2hhcGVNb2R1bGUucmFkaXVzID0gbmV3UmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQ29uZToge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWx0YVRvcFJhZGl1cyA9ICh0aGlzLl9hY3RpdmVDb250cm9sbGVyIGFzIGFueSkuZ2V0RGVsdGFSYWRpdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVsdGFIZWlnaHQgPSAodGhpcy5fYWN0aXZlQ29udHJvbGxlciBhcyBhbnkpLmdldERlbHRhSGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhQm90dG9tUmFkaXVzID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXREZWx0YUJvdHRvbVJhZGl1cygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGlmeUNvbmVEYXRhKHRoaXMudGFyZ2V0LCBkZWx0YVRvcFJhZGl1cywgZGVsdGFIZWlnaHQsIGRlbHRhQm90dG9tUmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkhlbWlzcGhlcmU6IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlbHRhUmFkaXVzID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXREZWx0YVJhZGl1cygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sRGlyID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5nZXRDb250cm9sRGlyKCk7XG4gICAgICAgICAgICAgICAgICAgIGRlbHRhUmFkaXVzID0gdGhpcy5nZXRTY2FsZWREZWx0YVJhZGl1cyhkZWx0YVJhZGl1cywgY29udHJvbERpciwgdGhpcy5fc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3UmFkaXVzID0gdGhpcy5fcmFkaXVzICsgZGVsdGFSYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIG5ld1JhZGl1cyA9IE1hdGguYWJzKG5ld1JhZGl1cyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1JhZGl1cyA9IHRvUHJlY2lzaW9uKG5ld1JhZGl1cywgMyk7XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlTW9kdWxlLnJhZGl1cyA9IG5ld1JhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudENoYW5nZWQobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXQgJiYgdGhpcy50YXJnZXQuc2hhcGVNb2R1bGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlTW9kdWxlID0gdGhpcy50YXJnZXQuc2hhcGVNb2R1bGU7XG4gICAgICAgICAgICBpZiAoc2hhcGVNb2R1bGUuZW5hYmxlICYmIHRoaXMuX3BTR2l6bW9Sb290KSB7XG4gICAgICAgICAgICAgICAgbGF6eVJlcXVpcmVUZW1wVmVjdG9ycygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnRhcmdldC5ub2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmxkUm90ID0gdGVtcFF1YXRfYTtcbiAgICAgICAgICAgICAgICBjb25zdCB3b3JsZFBvcyA9IG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIG5vZGUuZ2V0V29ybGRSb3RhdGlvbih3b3JsZFJvdCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgd29ybGRTY2FsZSA9IG5vZGUuZ2V0V29ybGRTY2FsZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BTR2l6bW9Sb290LnNldFdvcmxkUG9zaXRpb24od29ybGRQb3MpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BTR2l6bW9Sb290LnNldFdvcmxkUm90YXRpb24od29ybGRSb3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BTR2l6bW9Sb290LnNldFdvcmxkU2NhbGUod29ybGRTY2FsZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhcGVSb3QgPSBzaGFwZU1vZHVsZS5yb3RhdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCByb3QgPSB0ZW1wUXVhdF9hO1xuICAgICAgICAgICAgICAgIFF1YXQuZnJvbUV1bGVyKHJvdCwgc2hhcGVSb3QueCwgc2hhcGVSb3QueSwgc2hhcGVSb3Queik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlQ29udHJvbGxlci5zZXRQb3NpdGlvbihzaGFwZU1vZHVsZS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIuc2V0Um90YXRpb24ocm90KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlQ29udHJvbGxlci5zZXRTY2FsZShzaGFwZU1vZHVsZS5zY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlckRhdGEoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNoYXBlTW9kdWxlID0gdGhpcy50YXJnZXQuc2hhcGVNb2R1bGUhO1xuICAgICAgICBpZiAoc2hhcGVNb2R1bGUuZW5hYmxlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlQ29udHJvbGxlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzTW91c2VEb3duID0gKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KVsnaXNNb3VzZURvd24nXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVDb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAodGhpcy5fYWN0aXZlQ29udHJvbGxlciBhcyBhbnkpWydfaXNNb3VzZURvd24nXSA9IGlzTW91c2VEb3duO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlQ29udHJvbGxlciA9IHRoaXMuZ2V0Q29udHJvbGxlckJ5U2hhcGUoc2hhcGVNb2R1bGUuc2hhcGVUeXBlKTtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXI/LmNoZWNrRWRpdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHNoYXBlTW9kdWxlLnNoYXBlVHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkJveDoge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBib3hDb250cm9sbGVyID0gdGhpcy5fYWN0aXZlQ29udHJvbGxlciBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChib3hDb250cm9sbGVyLmVkaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveENvbnRyb2xsZXIudXBkYXRlRWRpdEhhbmRsZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBib3hDb250cm9sbGVyLmFkanVzdEVkaXRIYW5kbGVzU2l6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuU3BoZXJlOlxuICAgICAgICAgICAgICAgICAgICAodGhpcy5fYWN0aXZlQ29udHJvbGxlciBhcyBhbnkpLnJhZGl1cyA9IHNoYXBlTW9kdWxlLnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQ2lyY2xlOlxuICAgICAgICAgICAgICAgICAgICAodGhpcy5fYWN0aXZlQ29udHJvbGxlciBhcyBhbnkpLnVwZGF0ZVNpemUoVmVjMy5aRVJPLCBzaGFwZU1vZHVsZS5yYWRpdXMsIHNoYXBlTW9kdWxlLmFyYyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkNvbmU6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29uZURhdGEgPSB0aGlzLmdldENvbmVEYXRhKHRoaXMudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgY29uZURhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLl9hY3RpdmVDb250cm9sbGVyIGFzIGFueSkudXBkYXRlU2l6ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWMzLlpFUk8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZURhdGEudG9wUmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmVEYXRhLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25lRGF0YS5ib3R0b21SYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuSGVtaXNwaGVyZTpcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuX2FjdGl2ZUNvbnRyb2xsZXIgYXMgYW55KS5yYWRpdXMgPSBzaGFwZU1vZHVsZS5yYWRpdXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVDb250cm9sbGVyPy5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVDb250cm9sbGVyPy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVCQkNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvbk5vZGVDaGFuZ2VkKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlRGF0YUZyb21CQkNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZGluZ0JveENvbnRyb2xsZXIudXBkYXRlZCAmJiB0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRDaGFuZ2VzKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgICAgIGxhenlSZXF1aXJlVGVtcFZlY3RvcnMoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhU2l6ZSA9IHRoaXMuX2JvdW5kaW5nQm94Q29udHJvbGxlci5nZXREZWx0YVNpemUoKTtcbiAgICAgICAgICAgIFZlYzMuYWRkKHRlbXBWZWMzLCB0aGlzLl9iYkhhbGZTaXplLCBkZWx0YVNpemUpO1xuICAgICAgICAgICAgY29uc3QgcHNDb21wOiBQYXJ0aWNsZVN5c3RlbSA9IHRoaXMudGFyZ2V0O1xuICAgICAgICAgICAgcHNDb21wLmFhYmJIYWxmWCA9IHRlbXBWZWMzLng7XG4gICAgICAgICAgICBwc0NvbXAuYWFiYkhhbGZZID0gdGVtcFZlYzMueTtcbiAgICAgICAgICAgIHBzQ29tcC5hYWJiSGFsZlogPSB0ZW1wVmVjMy56O1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudENoYW5nZWQobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVCQkNvbnRyb2xsZXJEYXRhKCkge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHNDb21wOiBQYXJ0aWNsZVN5c3RlbSA9IHRoaXMudGFyZ2V0O1xuICAgICAgICBjb25zdCBib3VuZGluZ0JveDogZ2VvbWV0cnkuQUFCQiB8IG51bGwgPSAocHNDb21wIGFzIGFueSkuX2JvdW5kaW5nQm94O1xuICAgICAgICBpZiAocHNDb21wLnJlbmRlckN1bGxpbmcgJiYgYm91bmRpbmdCb3ggJiYgcHNDb21wLl9pc1Nob3dCQikge1xuICAgICAgICAgICAgdGhpcy5fYm91bmRpbmdCb3hDb250cm9sbGVyLmVkaXQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fYm91bmRpbmdCb3hDb250cm9sbGVyLnNldFBvc2l0aW9uKGJvdW5kaW5nQm94LmNlbnRlcik7XG4gICAgICAgICAgICBjb25zdCBoYWxmRXh0ZW50cyA9IGJvdW5kaW5nQm94LmhhbGZFeHRlbnRzO1xuICAgICAgICAgICAgbGF6eVJlcXVpcmVUZW1wVmVjdG9ycygpO1xuICAgICAgICAgICAgdGhpcy5fYm91bmRpbmdCb3hDb250cm9sbGVyLnVwZGF0ZVNpemUoXG4gICAgICAgICAgICAgICAgVmVjMy5aRVJPLFxuICAgICAgICAgICAgICAgIHRlbXBWZWMzLnNldChoYWxmRXh0ZW50cy54ICogMiwgaGFsZkV4dGVudHMueSAqIDIsIGhhbGZFeHRlbnRzLnogKiAyKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLl9ib3VuZGluZ0JveENvbnRyb2xsZXIuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYm91bmRpbmdCb3hDb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQkJDb250cm9sbGVyTW91c2VEb3duKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbGl6ZWQgfHwgdGhpcy50YXJnZXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBzQ29tcDogUGFydGljbGVTeXN0ZW0gPSB0aGlzLnRhcmdldDtcbiAgICAgICAgdGhpcy5fYmJIYWxmU2l6ZS5zZXQocHNDb21wLmFhYmJIYWxmWCwgcHNDb21wLmFhYmJIYWxmWSwgcHNDb21wLmFhYmJIYWxmWik7XG4gICAgfVxuXG4gICAgb25CQkNvbnRyb2xsZXJNb3VzZU1vdmUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YUZyb21CQkNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICBvbkJCQ29udHJvbGxlck1vdXNlVXAoKSB7XG4gICAgICAgIHRoaXMuY29tbWl0Q2hhbmdlcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzaG93Qm91bmRpbmdCb3goaXNTaG93OiBib29sZWFuKSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwc0NvbXA6IFBhcnRpY2xlU3lzdGVtID0gdGhpcy50YXJnZXQ7XG4gICAgICAgIGlmIChwc0NvbXApIHtcbiAgICAgICAgICAgIHBzQ29tcC5faXNTaG93QkIgPSBpc1Nob3c7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVCQkNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGlzU2hvd0JvdW5kaW5nQm94KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50YXJnZXQ/Ll9pc1Nob3dCQjtcbiAgICB9XG59XG5cbmNsYXNzIFBhcnRpY2xlU3lzdGVtSWNvbkdpem1vIGV4dGVuZHMgKEljb25HaXptb0Jhc2UgYXMgYW55KSB7XG4gICAgZGlzYWJsZU9uU2VsZWN0ZWQgPSB0cnVlO1xuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRUZXh0dXJlQnlVVUlEKCc1NTA1MmJjNi05OTA5LTQzYzEtYjJmYy04ODE4MDYwZmIwNjlANmM0OGEnKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBuYW1lID0ganMuZ2V0Q2xhc3NOYW1lKFBhcnRpY2xlU3lzdGVtKTtcbmV4cG9ydCBjb25zdCBTZWxlY3RHaXptbyA9IFBhcnRpY2xlU3lzdGVtQ29tcG9uZW50R2l6bW87XG5leHBvcnQgY29uc3QgSWNvbkdpem1vID0gUGFydGljbGVTeXN0ZW1JY29uR2l6bW87XG5leHBvcnQgY29uc3QgUGVyc2lzdGVudEdpem1vID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0R2l6bW9TZXJ2aWNlKCk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICByZXR1cm4gU2VydmljZS5HaXptbztcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgc2hvd0JvdW5kaW5nQm94KHV1aWQ6IHN0cmluZywgaXNTaG93OiBib29sZWFuKSB7XG4gICAgICAgIGdldEdpem1vU2VydmljZSgpPy5mb3JFYWNoSW5zdGFuY2VMaXN0Py4oJ2NvbXBvbmVudCcsIG5hbWUsIChnaXptbzogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZ2l6bW8/LnRhcmdldD8ubm9kZT8udXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIGdpem1vLnNob3dCb3VuZGluZ0JveChpc1Nob3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGlzU2hvd0JvdW5kaW5nQm94KHV1aWQ6IHN0cmluZykge1xuICAgICAgICBsZXQgcmVzdWx0OiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAgICAgICBnZXRHaXptb1NlcnZpY2UoKT8uZm9yRWFjaEluc3RhbmNlTGlzdD8uKCdjb21wb25lbnQnLCBuYW1lLCAoZ2l6bW86IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGdpem1vPy50YXJnZXQ/Lm5vZGU/LnV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBnaXptby5pc1Nob3dCb3VuZGluZ0JveCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxufTtcblxuLy8g5L2/55SoIHRyeS1jYXRjaCDljIXoo7nvvIzpgb/lhY3mtYvor5Xnjq/looPmiqXplJlcbnRyeSB7XG4gICAgcmVnaXN0ZXJHaXptbyhuYW1lLCB7IFNlbGVjdEdpem1vLCBJY29uR2l6bW8sIG1ldGhvZHMgfSk7XG59IGNhdGNoIChlKSB7XG4gICAgLy8g5rWL6K+V546v5aKD5Y+v6IO95rKh5pyJIHJlZ2lzdGVyR2l6bW/vvIzlv73nlaVcbn0iXX0=