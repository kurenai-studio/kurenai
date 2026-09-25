System.register("q-bundled:///fs/cocos/physics/bullet/bullet-contact-data.js", ["../../core/index.js", "./bullet-cache.js", "./instantiated.js", "./bullet-utils.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, CC_QUAT_0, BulletCache, bt, bullet2CocosQuat, bullet2CocosVec3, BulletContactData;
  _export("BulletContactData", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
    }, function (_bulletCacheJs) {
      CC_QUAT_0 = _bulletCacheJs.CC_QUAT_0;
      BulletCache = _bulletCacheJs.BulletCache;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
    }, function (_bulletUtilsJs) {
      bullet2CocosQuat = _bulletUtilsJs.bullet2CocosQuat;
      bullet2CocosVec3 = _bulletUtilsJs.bullet2CocosVec3;
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
      _export("BulletContactData", BulletContactData = class BulletContactData {
        get isBodyA() {
          const sb = this.event.selfCollider.shape.sharedBody.body;
          return sb === bt.PersistentManifold_getBody0(this.event.impl);
        }
        constructor(event) {
          this.impl = 0;
          //btManifoldPoint
          this.event = void 0;
          this.event = event;
        }
        getLocalPointOnA(out) {
          if (this.impl) bullet2CocosVec3(out, bt.ManifoldPoint_get_m_localPointA(this.impl));
        }
        getLocalPointOnB(out) {
          if (this.impl) bullet2CocosVec3(out, bt.ManifoldPoint_get_m_localPointB(this.impl));
        }
        getWorldPointOnA(out) {
          if (this.impl) bullet2CocosVec3(out, bt.ManifoldPoint_get_m_positionWorldOnA(this.impl));
        }
        getWorldPointOnB(out) {
          if (this.impl) bullet2CocosVec3(out, bt.ManifoldPoint_get_m_positionWorldOnB(this.impl));
        }
        getLocalNormalOnA(out) {
          if (this.impl) {
            const bt_rot = BulletCache.instance.BT_QUAT_0;
            const body = bt.PersistentManifold_getBody0(this.event.impl);
            const trans = bt.CollisionObject_getWorldTransform(body);
            bt.Transform_getRotation(trans, bt_rot);
            const inv_rot = CC_QUAT_0;
            bullet2CocosQuat(inv_rot, bt_rot);
            Quat.conjugate(inv_rot, inv_rot);
            bullet2CocosVec3(out, bt.ManifoldPoint_get_m_normalWorldOnB(this.impl));
            if (!this.isBodyA) Vec3.negate(out, out);
            Vec3.transformQuat(out, out, inv_rot);
          }
        }
        getLocalNormalOnB(out) {
          if (this.impl) {
            const bt_rot = BulletCache.instance.BT_QUAT_0;
            const body = bt.PersistentManifold_getBody1(this.event.impl);
            const trans = bt.CollisionObject_getWorldTransform(body);
            bt.Transform_getRotation(trans, bt_rot);
            const inv_rot = CC_QUAT_0;
            bullet2CocosQuat(inv_rot, bt_rot);
            Quat.conjugate(inv_rot, inv_rot);
            bullet2CocosVec3(out, bt.ManifoldPoint_get_m_normalWorldOnB(this.impl));
            Vec3.transformQuat(out, out, inv_rot);
          }
        }
        getWorldNormalOnA(out) {
          if (this.impl) {
            bullet2CocosVec3(out, bt.ManifoldPoint_get_m_normalWorldOnB(this.impl));
            if (!this.isBodyA) Vec3.negate(out, out);
          }
        }
        getWorldNormalOnB(out) {
          if (this.impl) bullet2CocosVec3(out, bt.ManifoldPoint_get_m_normalWorldOnB(this.impl));
        }
      });
    }
  };
});