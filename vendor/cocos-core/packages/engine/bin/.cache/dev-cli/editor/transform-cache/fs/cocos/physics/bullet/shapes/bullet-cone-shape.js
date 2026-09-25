System.register("q-bundled:///fs/cocos/physics/bullet/shapes/bullet-cone-shape.js", ["./bullet-shape.js", "../../../core/index.js", "../instantiated.js", "../bullet-cache.js"], function (_export, _context) {
  "use strict";

  var BulletShape, absMax, bt, BulletCache, BulletConeShape;
  _export("BulletConeShape", void 0);
  return {
    setters: [function (_bulletShapeJs) {
      BulletShape = _bulletShapeJs.BulletShape;
    }, function (_coreIndexJs) {
      absMax = _coreIndexJs.absMax;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
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
      _export("BulletConeShape", BulletConeShape = class BulletConeShape extends BulletShape {
        setHeight(v) {
          this.updateProperties(this.collider.radius, this.collider.height, this.collider.direction, this._collider.node.worldScale);
        }
        setDirection(v) {
          this.updateProperties(this.collider.radius, this.collider.height, this.collider.direction, this._collider.node.worldScale);
        }
        setRadius(v) {
          this.updateProperties(this.collider.radius, this.collider.height, this.collider.direction, this._collider.node.worldScale);
        }
        get impl() {
          return this._impl;
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this._impl = bt.ConeShape_new(0.5, 1);
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
          let wh;
          if (upAxis === 1) {
            wh = height * Math.abs(ws.y);
            wr = radius * Math.abs(absMax(ws.x, ws.z));
          } else if (upAxis === 0) {
            wh = height * Math.abs(ws.x);
            wr = radius * Math.abs(absMax(ws.y, ws.z));
          } else {
            wh = height * Math.abs(ws.z);
            wr = radius * Math.abs(absMax(ws.x, ws.y));
          }
          bt.ConeShape_setRadius(this._impl, wr);
          bt.ConeShape_setHeight(this._impl, wh);
          bt.ConeShape_setConeUpIndex(this._impl, upAxis);
          const bt_v3 = BulletCache.instance.BT_V3_0;
          bt.Vec3_set(bt_v3, 1, 1, 1);
          bt.CollisionShape_setLocalScaling(this._impl, bt_v3);
          this.updateCompoundTransform();
        }
      });
    }
  };
});