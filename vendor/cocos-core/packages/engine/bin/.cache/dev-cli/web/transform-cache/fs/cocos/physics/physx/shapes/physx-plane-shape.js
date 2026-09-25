System.register("q-bundled:///fs/cocos/physics/physx/shapes/physx-plane-shape.js", ["../../../core/index.js", "../physx-adapter.js", "../physx-instance.js", "./physx-shape.js"], function (_export, _context) {
  "use strict";

  var Quat, Vec3, getTempTransform, PX, _trans, PhysXInstance, EPhysXShapeType, PhysXShape, PhysXPlaneShape;
  _export("PhysXPlaneShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_physxAdapterJs) {
      getTempTransform = _physxAdapterJs.getTempTransform;
      PX = _physxAdapterJs.PX;
      _trans = _physxAdapterJs._trans;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_physxShapeJs) {
      EPhysXShapeType = _physxShapeJs.EPhysXShapeType;
      PhysXShape = _physxShapeJs.PhysXShape;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /** @mangle */
      _export("PhysXPlaneShape", PhysXPlaneShape = class PhysXPlaneShape extends PhysXShape {
        constructor() {
          super(EPhysXShapeType.PLANE);
          if (!PhysXPlaneShape.PLANE_GEOMETRY) {
            PhysXPlaneShape.PLANE_GEOMETRY = new PX.PlaneGeometry();
          }
        }
        setNormal(v) {
          this.setCenter();
        }
        setConstant(v) {
          this.setCenter();
        }
        setCenter() {
          const co = this.collider;
          const pos = _trans.translation;
          const rot = _trans.rotation;
          Vec3.scaleAndAdd(pos, co.center, co.normal, co.constant);
          Quat.rotationTo(rot, Vec3.UNIT_X, co.normal);
          const trans = getTempTransform(pos, rot);
          this._impl.setLocalPose(trans);
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          const co = this.collider;
          const pxmat = this.getSharedMaterial(co.sharedMaterial);
          this._impl = PhysXInstance.physics.createShape(PhysXPlaneShape.PLANE_GEOMETRY, pxmat, true, this._flags);
          this.setCenter();
        }
        updateScale() {
          this.setCenter();
        }
      });
      PhysXPlaneShape.PLANE_GEOMETRY = void 0;
    }
  };
});