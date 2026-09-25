System.register("q-bundled:///fs/cocos/physics/bullet/shapes/bullet-capsule-shape.js", ["../../../core/index.js", "./bullet-shape.js", "../instantiated.js"], function (_export, _context) {
  "use strict";

  var absMax, BulletShape, bt, BulletCapsuleShape;
  _export("BulletCapsuleShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      absMax = _coreIndexJs.absMax;
    }, function (_bulletShapeJs) {
      BulletShape = _bulletShapeJs.BulletShape;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
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
      _export("BulletCapsuleShape", BulletCapsuleShape = class BulletCapsuleShape extends BulletShape {
        setCylinderHeight(v) {
          this.updateProperties(this.collider.radius, this.collider.cylinderHeight, this.collider.direction, this._collider.node.worldScale);
        }
        setDirection(v) {
          this.updateProperties(this.collider.radius, this.collider.cylinderHeight, this.collider.direction, this._collider.node.worldScale);
        }
        setRadius(v) {
          this.updateProperties(this.collider.radius, this.collider.cylinderHeight, this.collider.direction, this._collider.node.worldScale);
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this._impl = bt.CapsuleShape_new(0.5, 1);
          this.setRadius(this.collider.radius);
        }
        updateScale() {
          super.updateScale();
          this.setRadius(this.collider.radius);
        }
        updateProperties(radius, height, direction, scale) {
          const ws = scale;
          const upAxis = direction;
          let wr;
          let halfH;
          if (upAxis === 1) {
            wr = radius * Math.abs(absMax(ws.x, ws.z));
            halfH = height / 2 * Math.abs(ws.y);
          } else if (upAxis === 0) {
            wr = radius * Math.abs(absMax(ws.y, ws.z));
            halfH = height / 2 * Math.abs(ws.x);
          } else {
            wr = radius * Math.abs(absMax(ws.x, ws.y));
            halfH = height / 2 * Math.abs(ws.z);
          }
          bt.CapsuleShape_updateProp(this._impl, wr, halfH, upAxis);
          this.updateCompoundTransform();
        }
      });
    }
  };
});