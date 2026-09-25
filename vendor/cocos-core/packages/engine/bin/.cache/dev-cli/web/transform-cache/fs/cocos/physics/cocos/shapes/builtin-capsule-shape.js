System.register("q-bundled:///fs/cocos/physics/cocos/shapes/builtin-capsule-shape.js", ["./builtin-shape.js", "../../../core/index.js", "../../framework/index.js"], function (_export, _context) {
  "use strict";

  var BuiltinShape, Vec3, geometry, EAxisDirection, BuiltinCapsuleShape, temp0, temp1;
  _export("BuiltinCapsuleShape", void 0);
  return {
    setters: [function (_builtinShapeJs) {
      BuiltinShape = _builtinShapeJs.BuiltinShape;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
    }, function (_frameworkIndexJs) {
      EAxisDirection = _frameworkIndexJs.EAxisDirection;
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
      temp0 = new Vec3();
      temp1 = new Vec3();
      _export("BuiltinCapsuleShape", BuiltinCapsuleShape = class BuiltinCapsuleShape extends BuiltinShape {
        get localCapsule() {
          return this._localShape;
        }
        get worldCapsule() {
          return this._worldShape;
        }
        get collider() {
          return this._collider;
        }
        constructor(radius = 0.5, height = 2, direction = EAxisDirection.Y_AXIS) {
          super();
          const halfHeight = (height - radius * 2) / 2;
          const h = halfHeight < 0 ? 0 : halfHeight;
          this._localShape = new geometry.Capsule(radius, h, direction);
          this._worldShape = new geometry.Capsule(radius, h, direction);
        }
        setRadius(v) {
          this.localCapsule.radius = v;
          this.transform(this._sharedBody.node.worldMatrix, this._sharedBody.node.worldPosition, this._sharedBody.node.worldRotation, this._sharedBody.node.worldScale);
        }
        setCylinderHeight(v) {
          this.localCapsule.halfHeight = v / 2;
          this.localCapsule.updateCache();
          this.transform(this._sharedBody.node.worldMatrix, this._sharedBody.node.worldPosition, this._sharedBody.node.worldRotation, this._sharedBody.node.worldScale);
        }
        setDirection(v) {
          this.localCapsule.axis = v;
          this.localCapsule.updateCache();
          this.worldCapsule.axis = v;
          this.worldCapsule.updateCache();
          this.transform(this._sharedBody.node.worldMatrix, this._sharedBody.node.worldPosition, this._sharedBody.node.worldRotation, this._sharedBody.node.worldScale);
        }
        onLoad() {
          super.onLoad();
          this.setRadius(this.collider.radius);
          this.setDirection(this.collider.direction);
        }
        getAABB(v) {
          //capsule has not implemented getBoundary
          v.center.set(this.worldCapsule.center);
          v.halfExtents.set(0, 0, 0);
          temp0.set(this.worldCapsule.radius, this.worldCapsule.radius, this.worldCapsule.radius);
          Vec3.add(temp1, this.worldCapsule.ellipseCenter0, temp0);
          v.mergePoint(temp1);
          Vec3.subtract(temp1, this.worldCapsule.ellipseCenter0, temp0);
          v.mergePoint(temp1);
          Vec3.add(temp1, this.worldCapsule.ellipseCenter1, temp0);
          v.mergePoint(temp1);
          Vec3.subtract(temp1, this.worldCapsule.ellipseCenter1, temp0);
          v.mergePoint(temp1);
        }
      });
    }
  };
});