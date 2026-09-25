System.register("q-bundled:///fs/cocos/physics/bullet/constraints/bullet-fixed-constraint.js", ["./bullet-constraint.js", "../../../core/index.js", "../bullet-cache.js", "../instantiated.js", "../bullet-utils.js"], function (_export, _context) {
  "use strict";

  var BulletConstraint, Mat4, BulletCache, CC_MAT4_0, CC_QUAT_0, CC_V3_0, bt, EBulletType, cocos2BulletQuat, cocos2BulletVec3, BulletFixedConstraint;
  _export("BulletFixedConstraint", void 0);
  return {
    setters: [function (_bulletConstraintJs) {
      BulletConstraint = _bulletConstraintJs.BulletConstraint;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
      CC_MAT4_0 = _bulletCacheJs.CC_MAT4_0;
      CC_QUAT_0 = _bulletCacheJs.CC_QUAT_0;
      CC_V3_0 = _bulletCacheJs.CC_V3_0;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      EBulletType = _instantiatedJs.EBulletType;
    }, function (_bulletUtilsJs) {
      cocos2BulletQuat = _bulletUtilsJs.cocos2BulletQuat;
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
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
      /* eslint-disable new-cap */
      /** @mangle */
      _export("BulletFixedConstraint", BulletFixedConstraint = class BulletFixedConstraint extends BulletConstraint {
        setBreakForce(v) {
          bt.TypedConstraint_setMaxImpulseThreshold(this._impl, v);
        }
        setBreakTorque(v) {
          // not supported
        }
        get constraint() {
          return this._com;
        }
        onComponentSet() {
          const cb = this.constraint.connectedBody;
          const bodyA = this._rigidBody.body.impl;
          const bodyB = cb ? cb.body.impl : bt.TypedConstraint_getFixedBody();
          const trans0 = BulletCache.instance.BT_TRANSFORM_0;
          const trans1 = BulletCache.instance.BT_TRANSFORM_1;
          this._impl = bt.FixedConstraint_new(bodyA, bodyB, trans0, trans1);
          this.setBreakForce(this.constraint.breakForce);
          this.setBreakTorque(this.constraint.breakTorque);
          this.updateFrames();
          this.updateDebugDrawSize();
        }
        updateFrames() {
          const cb = this.constraint.connectedBody;
          const bodyA = this._rigidBody.body.sharedBody;
          const pos = CC_V3_0;
          const rot = CC_QUAT_0;
          const trans0 = bt.Transform_new();
          const trans1 = bt.Transform_new();
          const quat = bt.Quat_new(0, 0, 0, 1);
          const trans = CC_MAT4_0;
          // the local frame transform respect to bodyA
          Mat4.fromRT(trans, bodyA.node.worldRotation, bodyA.node.worldPosition);
          Mat4.invert(trans, trans);
          Mat4.getRotation(rot, trans);
          Mat4.getTranslation(pos, trans);
          cocos2BulletVec3(bt.Transform_getOrigin(trans0), pos);
          cocos2BulletQuat(quat, rot);
          bt.Transform_setRotation(trans0, quat);
          if (cb) {
            // the local frame transform respect to bodyB
            const bodyB = cb.body.sharedBody;
            Mat4.fromRT(trans, bodyB.node.worldRotation, bodyB.node.worldPosition);
            Mat4.invert(trans, trans);
            Mat4.getRotation(rot, trans);
            Mat4.getTranslation(pos, trans);
            cocos2BulletVec3(bt.Transform_getOrigin(trans1), pos);
            cocos2BulletQuat(quat, rot);
            bt.Transform_setRotation(trans1, quat);
          } else {
            bt.Transform_setIdentity(trans1);
          }
          bt.FixedConstraint_setFrames(this._impl, trans0, trans1);
          bt._safe_delete(trans0, EBulletType.EBulletTypeTransform);
          bt._safe_delete(trans1, EBulletType.EBulletTypeTransform);
          bt._safe_delete(quat, EBulletType.EBulletTypeQuat);
        }
        updateScale0() {
          this.updateFrames();
        }
        updateScale1() {
          this.updateFrames();
        }
      });
    }
  };
});