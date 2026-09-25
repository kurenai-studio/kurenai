System.register("q-bundled:///fs/cocos/physics/physx/shapes/physx-box-shape.js", ["../../utils/util.js", "../physx-adapter.js", "./physx-shape.js", "../physx-instance.js"], function (_export, _context) {
  "use strict";

  var absolute, VEC3_0, PX, EPhysXShapeType, PhysXShape, PhysXInstance, PhysXBoxShape;
  _export("PhysXBoxShape", void 0);
  return {
    setters: [function (_utilsUtilJs) {
      absolute = _utilsUtilJs.absolute;
      VEC3_0 = _utilsUtilJs.VEC3_0;
    }, function (_physxAdapterJs) {
      PX = _physxAdapterJs.PX;
    }, function (_physxShapeJs) {
      EPhysXShapeType = _physxShapeJs.EPhysXShapeType;
      PhysXShape = _physxShapeJs.PhysXShape;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
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
      _export("PhysXBoxShape", PhysXBoxShape = class PhysXBoxShape extends PhysXShape {
        constructor() {
          super(EPhysXShapeType.BOX);
          if (!PhysXBoxShape.BOX_GEOMETRY) {
            VEC3_0.set(0.5, 0.5, 0.5);
            PhysXBoxShape.BOX_GEOMETRY = new PX.BoxGeometry(VEC3_0);
          }
        }
        updateSize() {
          this.updateScale();
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this.updateGeometry();
          const pxmat = this.getSharedMaterial(this._collider.sharedMaterial);
          this._impl = PhysXInstance.physics.createShape(PhysXBoxShape.BOX_GEOMETRY, pxmat, true, this._flags);
        }
        updateScale() {
          this.updateGeometry();
          this._impl.setGeometry(PhysXBoxShape.BOX_GEOMETRY);
          this.setCenter(this._collider.center);
        }
        updateGeometry() {
          const co = this.collider;
          const ws = co.node.worldScale;
          VEC3_0.set(co.size).multiplyScalar(0.5).multiply(ws);
          PhysXBoxShape.BOX_GEOMETRY.setHalfExtents(absolute(VEC3_0));
        }
      });
      PhysXBoxShape.BOX_GEOMETRY = void 0;
    }
  };
});