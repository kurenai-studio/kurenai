System.register("q-bundled:///fs/cocos/physics/bullet/shapes/bullet-sphere-shape.js", ["./bullet-shape.js", "../../../../exports/physics-framework.js", "../bullet-utils.js", "../bullet-cache.js", "../instantiated.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var BulletShape, PhysicsSystem, cocos2BulletVec3, BulletCache, CC_V3_0, bt, absMaxComponent, BulletSphereShape;
  _export("BulletSphereShape", void 0);
  return {
    setters: [function (_bulletShapeJs) {
      BulletShape = _bulletShapeJs.BulletShape;
    }, function (_exportsPhysicsFrameworkJs) {
      PhysicsSystem = _exportsPhysicsFrameworkJs.PhysicsSystem;
    }, function (_bulletUtilsJs) {
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
      CC_V3_0 = _bulletCacheJs.CC_V3_0;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
    }, function (_coreIndexJs) {
      absMaxComponent = _coreIndexJs.absMaxComponent;
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
      _export("BulletSphereShape", BulletSphereShape = class BulletSphereShape extends BulletShape {
        updateRadius() {
          bt.SphereShape_setUnscaledRadius(this.impl, this.getMinUnscaledRadius());
          this.updateCompoundTransform();
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this._impl = bt.SphereShape_new(this.getMinUnscaledRadius());
          this.updateScale();
        }
        updateScale() {
          super.updateScale();
          const scale = this.getMinScale();
          CC_V3_0.set(scale, scale, scale);
          const bt_v3 = BulletCache.instance.BT_V3_0;
          bt.CollisionShape_setLocalScaling(this._impl, cocos2BulletVec3(bt_v3, CC_V3_0));
          this.updateCompoundTransform();
        }
        getMinUnscaledRadius() {
          const radius = this.collider.radius;
          const ws = Math.abs(absMaxComponent(this._collider.node.worldScale));
          const minVolumeSize = PhysicsSystem.instance.minVolumeSize;
          return ws * radius < minVolumeSize ? minVolumeSize / ws : radius;
        }
        getMinScale() {
          const radius = this.collider.radius;
          const ws = Math.abs(absMaxComponent(this._collider.node.worldScale));
          const minVolumeSize = PhysicsSystem.instance.minVolumeSize;
          return ws * radius < minVolumeSize ? minVolumeSize / radius : ws;
        }
      });
    }
  };
});