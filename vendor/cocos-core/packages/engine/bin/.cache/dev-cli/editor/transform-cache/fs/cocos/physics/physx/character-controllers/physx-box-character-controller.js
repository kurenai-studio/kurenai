System.register("q-bundled:///fs/cocos/physics/physx/character-controllers/physx-box-character-controller.js", ["../../../core/index.js", "../../framework/index.js", "../physx-adapter.js", "./physx-character-controller.js", "../physx-instance.js", "../../../core/utils/misc.js"], function (_export, _context) {
  "use strict";

  var Vec3, PhysicsSystem, PX, PhysXCharacterController, PhysXInstance, degreesToRadians, PhysXBoxCharacterController, v3_0, upDir;
  _export("PhysXBoxCharacterController", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_physxAdapterJs) {
      PX = _physxAdapterJs.PX;
    }, function (_physxCharacterControllerJs) {
      PhysXCharacterController = _physxCharacterControllerJs.PhysXCharacterController;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_coreUtilsMiscJs) {
      degreesToRadians = _coreUtilsMiscJs.degreesToRadians;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      v3_0 = new Vec3(0, 0, 0);
      upDir = new Vec3(0, 1, 0);
      /** @mangle */
      _export("PhysXBoxCharacterController", PhysXBoxCharacterController = class PhysXBoxCharacterController extends PhysXCharacterController {
        get component() {
          return this._comp;
        }
        onComponentSet() {
          this.create();
        }
        create() {
          super.release();
          this.component.node.getWorldPosition(v3_0);
          v3_0.add(this.scaledCenter);
          const pxMtl = PhysXInstance.physics.createMaterial(0.5, 0.5, 0.5); //temp
          const physxWorld = PhysicsSystem.instance.physicsWorld;
          const controllerDesc = new PX.PxBoxControllerDesc();
          controllerDesc.halfHeight = this.component.halfHeight;
          controllerDesc.halfSideExtent = this.component.halfSideExtent;
          controllerDesc.halfForwardExtent = this.component.halfForwardExtent;
          controllerDesc.density = 10.0;
          controllerDesc.scaleCoeff = 0.8;
          controllerDesc.volumeGrowth = 1.5;
          controllerDesc.contactOffset = this.component.skinWidth;
          controllerDesc.stepOffset = this.component.stepOffset;
          controllerDesc.slopeLimit = Math.cos(degreesToRadians(this.component.slopeLimit));
          controllerDesc.upDirection = upDir;
          controllerDesc.position = {
            x: v3_0.x,
            y: v3_0.y,
            z: v3_0.z
          }; //PxExtendedVec3
          controllerDesc.setMaterial(pxMtl);
          controllerDesc.setReportCallback(PX.PxUserControllerHitReport.implement(physxWorld.callback.controllerHitReportCB));
          const impl = PX.createBoxCharacterController(physxWorld.controllerManager, controllerDesc);
          this.setImpl(impl);
          if (impl.$$) {
            PX.IMPL_PTR[impl.$$.ptr] = this;
            const shapePtr = impl.getShape().$$.ptr;
            PX.IMPL_PTR[shapePtr] = this;
          }
          this.updateScale();
        }
        setHalfHeight(value) {
          this.updateScale();
        }
        setHalfSideExtent(value) {
          this.updateScale();
        }
        setHalfForwardExtent(value) {
          this.updateScale();
        }
        updateScale() {
          this.updateGeometry();
        }
        updateGeometry() {
          const ws = this.component.node.worldScale;
          this._impl.setHalfSideExtent(this.component.halfSideExtent * ws.x);
          this._impl.setHalfHeight(this.component.halfHeight * ws.y);
          this._impl.setHalfForwardExtent(this.component.halfForwardExtent * ws.z);
        }
      });
    }
  };
});