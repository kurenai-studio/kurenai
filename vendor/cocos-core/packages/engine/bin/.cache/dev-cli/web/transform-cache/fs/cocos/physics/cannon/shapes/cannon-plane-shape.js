System.register("q-bundled:///fs/cocos/physics/cannon/shapes/cannon-plane-shape.js", ["@cocos/cannon", "../../../core/index.js", "../cannon-util.js", "./cannon-shape.js"], function (_export, _context) {
  "use strict";

  var CANNON, Vec3, Quat, commitShapeUpdates, CannonShape, CannonPlaneShape;
  _export("CannonPlaneShape", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
    }, function (_cannonUtilJs) {
      commitShapeUpdates = _cannonUtilJs.commitShapeUpdates;
    }, function (_cannonShapeJs) {
      CannonShape = _cannonShapeJs.CannonShape;
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
      _export("CannonPlaneShape", CannonPlaneShape = class CannonPlaneShape extends CannonShape {
        get collider() {
          return this._collider;
        }
        get impl() {
          return this._shape;
        }
        constructor() {
          super();
          this._shape = new CANNON.Plane();
        }
        setNormal(v) {
          Quat.rotationTo(this._orient, Vec3.UNIT_Z, v);
          if (this._index !== -1) {
            commitShapeUpdates(this._body);
          }
        }
        setConstant(v) {
          Vec3.scaleAndAdd(this._offset, this._collider.center, this.collider.normal, v);
        }
        onLoad() {
          super.onLoad();
          this.setConstant(this.collider.constant);
          this.setNormal(this.collider.normal);
        }
        _setCenter(v) {
          super._setCenter(v);
          this.setConstant(this.collider.constant);
        }
      });
    }
  };
});