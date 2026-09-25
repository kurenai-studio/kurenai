System.register("q-bundled:///fs/cocos/physics/bullet/shapes/bullet-plane-shape.js", ["./bullet-shape.js", "../bullet-utils.js", "../bullet-cache.js", "../instantiated.js"], function (_export, _context) {
  "use strict";

  var BulletShape, cocos2BulletVec3, BulletCache, bt, BulletPlaneShape;
  _export("BulletPlaneShape", void 0);
  return {
    setters: [function (_bulletShapeJs) {
      BulletShape = _bulletShapeJs.BulletShape;
    }, function (_bulletUtilsJs) {
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
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
      _export("BulletPlaneShape", BulletPlaneShape = class BulletPlaneShape extends BulletShape {
        setNormal(v) {
          cocos2BulletVec3(bt.StaticPlaneShape_getPlaneNormal(this.impl), v);
          this.updateCompoundTransform();
        }
        setConstant(v) {
          bt.StaticPlaneShape_setPlaneConstant(this.impl, v);
          this.updateCompoundTransform();
        }
        updateScale() {
          super.updateScale();
          const bt_v3 = BulletCache.instance.BT_V3_0;
          cocos2BulletVec3(bt_v3, this._collider.node.worldScale);
          bt.CollisionShape_setLocalScaling(this._impl, bt_v3);
          this.updateCompoundTransform();
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          const normal = BulletCache.instance.BT_V3_0;
          cocos2BulletVec3(normal, this.collider.normal);
          this._impl = bt.StaticPlaneShape_new(normal, this.collider.constant);
          this.updateScale();
        }
      });
    }
  };
});