System.register("q-bundled:///fs/cocos/physics/cocos/shapes/builtin-box-shape.js", ["../../../core/index.js", "./builtin-shape.js"], function (_export, _context) {
  "use strict";

  var Vec3, geometry, BuiltinShape, BuiltinBoxShape, tempMin, tempMax;
  _export("BuiltinBoxShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
    }, function (_builtinShapeJs) {
      BuiltinShape = _builtinShapeJs.BuiltinShape;
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
      tempMin = new Vec3();
      tempMax = new Vec3();
      _export("BuiltinBoxShape", BuiltinBoxShape = class BuiltinBoxShape extends BuiltinShape {
        get localObb() {
          return this._localShape;
        }
        get worldObb() {
          return this._worldShape;
        }
        get collider() {
          return this._collider;
        }
        constructor() {
          super();
          this._localShape = new geometry.OBB();
          this._worldShape = new geometry.OBB();
        }
        updateSize() {
          Vec3.multiplyScalar(this.localObb.halfExtents, this.collider.size, 0.5);
          Vec3.multiply(this.worldObb.halfExtents, this.localObb.halfExtents, this.collider.node.worldScale);
        }
        onLoad() {
          super.onLoad();
          this.updateSize();
        }
        getAABB(v) {
          this.worldObb.getBoundary(tempMin, tempMax);
          geometry.AABB.fromPoints(v, tempMin, tempMax);
        }
      });
    }
  };
});