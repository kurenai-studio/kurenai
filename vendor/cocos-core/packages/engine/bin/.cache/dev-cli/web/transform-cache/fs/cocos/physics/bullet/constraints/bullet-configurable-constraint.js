System.register("q-bundled:///fs/cocos/physics/bullet/constraints/bullet-configurable-constraint.js", ["./bullet-constraint.js", "../../../core/index.js", "../../framework/index.js", "../instantiated.js", "../bullet-cache.js", "../bullet-utils.js"], function (_export, _context) {
  "use strict";

  var BulletConstraint, error, Mat4, Quat, Vec3, toRadian, EConstraintMode, EDriverMode, PhysicsSystem, bt, EBulletType, BulletCache, CC_QUAT_0, CC_QUAT_1, CC_V3_0, CC_MAT4_0, CC_V3_1, cocos2BulletQuat, cocos2BulletVec3, force2Impulse, BulletConfigurableConstraint, RotateOrder, BulletDofAxis;
  _export("BulletConfigurableConstraint", void 0);
  return {
    setters: [function (_bulletConstraintJs) {
      BulletConstraint = _bulletConstraintJs.BulletConstraint;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      toRadian = _coreIndexJs.toRadian;
    }, function (_frameworkIndexJs) {
      EConstraintMode = _frameworkIndexJs.EConstraintMode;
      EDriverMode = _frameworkIndexJs.EDriverMode;
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      EBulletType = _instantiatedJs.EBulletType;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
      CC_QUAT_0 = _bulletCacheJs.CC_QUAT_0;
      CC_QUAT_1 = _bulletCacheJs.CC_QUAT_1;
      CC_V3_0 = _bulletCacheJs.CC_V3_0;
      CC_MAT4_0 = _bulletCacheJs.CC_MAT4_0;
      CC_V3_1 = _bulletCacheJs.CC_V3_1;
    }, function (_bulletUtilsJs) {
      cocos2BulletQuat = _bulletUtilsJs.cocos2BulletQuat;
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
      force2Impulse = _bulletUtilsJs.force2Impulse;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      RotateOrder = /*#__PURE__*/function (RotateOrder) {
        RotateOrder[RotateOrder["RO_XYZ"] = 0] = "RO_XYZ";
        RotateOrder[RotateOrder["RO_XZY"] = 1] = "RO_XZY";
        RotateOrder[RotateOrder["RO_YXZ"] = 2] = "RO_YXZ";
        RotateOrder[RotateOrder["RO_YZX"] = 3] = "RO_YZX";
        RotateOrder[RotateOrder["RO_ZXY"] = 4] = "RO_ZXY";
        RotateOrder[RotateOrder["RO_ZYX"] = 5] = "RO_ZYX";
        return RotateOrder;
      }(RotateOrder || {});
      BulletDofAxis = /*#__PURE__*/function (BulletDofAxis) {
        BulletDofAxis[BulletDofAxis["X"] = 0] = "X";
        BulletDofAxis[BulletDofAxis["Y"] = 1] = "Y";
        BulletDofAxis[BulletDofAxis["Z"] = 2] = "Z";
        BulletDofAxis[BulletDofAxis["TWIST"] = 3] = "TWIST";
        BulletDofAxis[BulletDofAxis["SWING1"] = 4] = "SWING1";
        BulletDofAxis[BulletDofAxis["SWING2"] = 5] = "SWING2";
        return BulletDofAxis;
      }(BulletDofAxis || {});
      /** @mangle */
      _export("BulletConfigurableConstraint", BulletConfigurableConstraint = class BulletConfigurableConstraint extends BulletConstraint {
        _setLimit(v, axis, lower, upper) {
          switch (v) {
            case EConstraintMode.LOCKED:
              bt.Generic6DofSpring2Constraint_setLimit(this._impl, axis, 0, 0);
              break;
            case EConstraintMode.LIMITED:
              bt.Generic6DofSpring2Constraint_setLimit(this._impl, axis, lower, upper);
              break;
            case EConstraintMode.FREE:
              bt.Generic6DofSpring2Constraint_setLimit(this._impl, axis, 1, 0);
              break;
            default:
              break;
          }
        }
        setConstraintMode(idx, v) {
          const ll = this.constraint.linearLimitSettings;
          const al = this.constraint.angularLimitSettings;
          const lowers = [0, 0, 0];
          const uppers = [0, 0, 0];
          let upper = 0;
          let lower = 0;
          switch (idx) {
            case 0:
            case 1:
            case 2:
              Vec3.toArray(lowers, ll.lower);
              Vec3.toArray(uppers, ll.upper);
              lower = lowers[idx];
              upper = uppers[idx];
              break;
            case 3:
              upper = toRadian(al.twistExtent) * 0.5;
              lower = -upper;
              break;
            case 4:
              upper = toRadian(al.swingExtent1) * 0.5;
              lower = -upper;
              break;
            case 5:
              upper = toRadian(al.swingExtent2) * 0.5;
              lower = -upper;
              break;
            default:
              error(`idx should be in [0, 5], but give ${idx}`);
              break;
          }
          this._setLimit(v, idx, lower, upper);
        }
        setLinearLimit(idx, lower, upper) {
          let cm = 0;
          const ll = this.constraint.linearLimitSettings;
          switch (idx) {
            case 0:
              cm = ll.xMotion;
              break;
            case 1:
              cm = ll.yMotion;
              break;
            case 2:
              cm = ll.zMotion;
              break;
            default:
              break;
          }
          this._setLimit(cm, idx, lower, upper);
        }
        setAngularExtent(twist, swing1, swing2) {
          const al = this.constraint.angularLimitSettings;
          this._setLimit(al.twistMotion, BulletDofAxis.TWIST, -toRadian(twist) * 0.5, toRadian(twist) * 0.5);
          this._setLimit(al.swingMotion1, BulletDofAxis.SWING1, -toRadian(swing1) * 0.5, toRadian(swing1) * 0.5);
          this._setLimit(al.swingMotion2, BulletDofAxis.SWING2, -toRadian(swing2) * 0.5, toRadian(swing2) * 0.5);
        }
        setSwingSoftConstraint(v) {
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.SWING1, v);
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.SWING2, v);
        }
        setTwistSoftConstraint(v) {
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.TWIST, v);
        }
        setLinearSoftConstraint(v) {
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.X, v);
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.Y, v);
          bt.Generic6DofSpring2Constraint_enableSpring(this._impl, BulletDofAxis.Z, v);
        }
        setLinearStiffness(v) {
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.X, v);
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.Y, v);
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.Z, v);
        }
        setLinearDamping(v) {
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.X, v);
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.Y, v);
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.Z, v);
        }
        setLinearRestitution(v) {
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.X, v);
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.Y, v);
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.Z, v);
        }
        setSwingStiffness(v) {
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.SWING1, v);
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.SWING2, v);
        }
        setSwingDamping(v) {
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.SWING1, v);
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.SWING2, v);
        }
        setSwingRestitution(v) {
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.SWING1, v);
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.SWING2, v);
        }
        setTwistStiffness(v) {
          bt.Generic6DofSpring2Constraint_setStiffness(this._impl, BulletDofAxis.TWIST, v);
        }
        setTwistDamping(v) {
          bt.Generic6DofSpring2Constraint_setDamping(this._impl, BulletDofAxis.TWIST, v);
        }
        setTwistRestitution(v) {
          bt.Generic6DofSpring2Constraint_setBounce(this._impl, BulletDofAxis.TWIST, v);
        }
        setDriverMode(idx, v) {
          if (v === EDriverMode.DISABLED) {
            bt.Generic6DofSpring2Constraint_enableMotor(this._impl, idx, false);
          } else if (v === EDriverMode.SERVO) {
            bt.Generic6DofSpring2Constraint_enableMotor(this._impl, idx, true);
            bt.Generic6DofSpring2Constraint_setServo(this._impl, idx, true);
          } else if (v === EDriverMode.INDUCTION) {
            bt.Generic6DofSpring2Constraint_enableMotor(this._impl, idx, true);
            bt.Generic6DofSpring2Constraint_setServo(this._impl, idx, false);
          }
        }
        _updateMotorTargetAndVelocity(index) {
          let mode = EDriverMode.DISABLED;
          let axis = 0;
          let target = 0;
          let velocity = 0;
          const ld = this.constraint.linearDriverSettings;
          const ad = this.constraint.angularDriverSettings;
          switch (index) {
            case 0:
              axis = BulletDofAxis.X;
              mode = ld.xDrive;
              target = ld.targetPosition.x;
              velocity = -ld.targetVelocity.x;
              break;
            case 1:
              axis = BulletDofAxis.Y;
              mode = ld.yDrive;
              target = ld.targetPosition.y;
              velocity = -ld.targetVelocity.y;
              break;
            case 2:
              axis = BulletDofAxis.Z;
              mode = ld.zDrive;
              target = ld.targetPosition.z;
              velocity = -ld.targetVelocity.z;
              break;
            case 3:
              axis = BulletDofAxis.TWIST;
              mode = ad.twistDrive;
              target = -toRadian(ad.targetOrientation.x);
              velocity = -toRadian(ad.targetVelocity.x);
              break;
            case 4:
              axis = BulletDofAxis.SWING1;
              mode = ad.swingDrive1;
              target = -toRadian(ad.targetOrientation.y);
              velocity = -toRadian(ad.targetVelocity.y);
              break;
            case 5:
              axis = BulletDofAxis.SWING2;
              mode = ad.swingDrive2;
              target = -toRadian(ad.targetOrientation.z);
              velocity = -toRadian(ad.targetVelocity.z);
              break;
            default:
              break;
          }
          const strength = index > 2 ? ad.strength : ld.strength;
          bt.Generic6DofSpring2Constraint_setServoTarget(this._impl, axis, target);
          if (mode === EDriverMode.SERVO) {
            if (index > 2) {
              bt.Generic6DofSpring2Constraint_setTargetVelocity(this._impl, axis, -target * strength * 0.1);
            } else {
              bt.Generic6DofSpring2Constraint_setTargetVelocity(this._impl, axis, target * strength * 0.1);
            }
          } else if (mode === EDriverMode.INDUCTION) {
            bt.Generic6DofSpring2Constraint_setTargetVelocity(this._impl, axis, velocity);
          }
        }
        setLinearMotorTarget(v) {
          this._updateMotorTargetAndVelocity(0);
          this._updateMotorTargetAndVelocity(1);
          this._updateMotorTargetAndVelocity(2);
        }
        setLinearMotorVelocity(v) {
          this._updateMotorTargetAndVelocity(0);
          this._updateMotorTargetAndVelocity(1);
          this._updateMotorTargetAndVelocity(2);
        }
        setLinearMotorForceLimit(v) {
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.X, v);
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.Y, v);
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.Z, v);
        }
        setAngularMotorTarget(v) {
          this._updateMotorTargetAndVelocity(3);
          this._updateMotorTargetAndVelocity(4);
          this._updateMotorTargetAndVelocity(5);
        }
        setAngularMotorVelocity(v) {
          this._updateMotorTargetAndVelocity(3);
          this._updateMotorTargetAndVelocity(4);
          this._updateMotorTargetAndVelocity(5);
        }
        setAngularMotorForceLimit(v) {
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.TWIST, v);
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.SWING1, v);
          bt.Generic6DofSpring2Constraint_setMaxMotorForce(this._impl, BulletDofAxis.SWING2, v);
        }
        setPivotA(v) {
          this.updateFrames();
        }
        setPivotB(v) {
          this.updateFrames();
        }
        setAutoPivotB(v) {
          this.updateFrames();
        }
        setAxis(v) {
          this.updateFrames();
        }
        setSecondaryAxis(v) {
          this.updateFrames();
        }
        setBreakForce(v) {
          const maxForce = Math.max(this.constraint.breakForce, this.constraint.breakTorque);
          const impulse = force2Impulse(maxForce, PhysicsSystem.instance.fixedTimeStep);
          bt.TypedConstraint_setMaxImpulseThreshold(this._impl, impulse);
        }
        setBreakTorque(v) {
          const maxForce = Math.max(this.constraint.breakForce, this.constraint.breakTorque);
          const impulse = force2Impulse(maxForce, PhysicsSystem.instance.fixedTimeStep);
          bt.TypedConstraint_setMaxImpulseThreshold(this._impl, impulse);
        }
        get constraint() {
          return this._com;
        }
        onComponentSet() {
          const cb = this.constraint.connectedBody;
          const bodyA = this._rigidBody.body.impl;
          const bodyB = cb && cb.body.impl || bt.TypedConstraint_getFixedBody();
          const trans0 = BulletCache.instance.BT_TRANSFORM_0;
          const trans1 = BulletCache.instance.BT_TRANSFORM_1;
          this._impl = bt.Generic6DofSpring2Constraint_new(bodyA, bodyB, trans0, trans1, RotateOrder.RO_YZX);
          const linearLimit = this.constraint.linearLimitSettings;
          const angularLimit = this.constraint.angularLimitSettings;
          // they set limits implicitly
          this.setConstraintMode(0, linearLimit.xMotion);
          this.setConstraintMode(1, linearLimit.yMotion);
          this.setConstraintMode(2, linearLimit.zMotion);
          this.setConstraintMode(3, angularLimit.twistMotion);
          this.setConstraintMode(4, angularLimit.swingMotion1);
          this.setConstraintMode(5, angularLimit.swingMotion2);
          this.setLinearSoftConstraint(linearLimit.enableSoftConstraint);
          this.setLinearStiffness(linearLimit.stiffness);
          this.setLinearDamping(linearLimit.damping);
          this.setLinearRestitution(linearLimit.restitution);
          this.setSwingSoftConstraint(angularLimit.enableSoftConstraintSwing);
          this.setSwingRestitution(angularLimit.swingRestitution);
          this.setSwingStiffness(angularLimit.swingStiffness);
          this.setSwingDamping(angularLimit.swingDamping);
          this.setTwistSoftConstraint(angularLimit.enableSoftConstraintTwist);
          this.setTwistRestitution(angularLimit.twistRestitution);
          this.setTwistStiffness(angularLimit.twistStiffness);
          this.setTwistDamping(angularLimit.twistDamping);
          const linearMotor = this.constraint.linearDriverSettings;
          const angularMotor = this.constraint.angularDriverSettings;
          this.setDriverMode(0, linearMotor.xDrive);
          this.setDriverMode(1, linearMotor.yDrive);
          this.setDriverMode(2, linearMotor.zDrive);
          this.setDriverMode(3, angularMotor.twistDrive);
          this.setDriverMode(4, angularMotor.swingDrive1);
          this.setDriverMode(5, angularMotor.swingDrive2);
          this.setLinearMotorTarget(linearMotor.targetPosition);
          this.setLinearMotorVelocity(linearMotor.targetVelocity);
          this.setLinearMotorForceLimit(linearMotor.strength);
          this.setAngularMotorTarget(angularMotor.targetOrientation);
          this.setAngularMotorVelocity(angularMotor.targetVelocity);
          this.setAngularMotorForceLimit(angularMotor.strength);
          this.setBreakForce(this.constraint.breakForce);
          this.setBreakTorque(this.constraint.breakTorque);
          this.updateFrames();
          this.updateDebugDrawSize();
        }
        updateFrames() {
          const cs = this.constraint;
          const node = cs.node;
          const v3_0 = CC_V3_0;
          const rot_0 = CC_QUAT_0;
          const rot_1 = CC_QUAT_1;
          const trans0 = bt.Transform_new();
          Vec3.multiply(v3_0, node.worldScale, cs.pivotA);
          cocos2BulletVec3(bt.Transform_getOrigin(trans0), v3_0);
          const quat = bt.Quat_new(0, 0, 0, 1);
          const axisX = cs.axis;
          const axisY = cs.secondaryAxis;
          const axisZ = Vec3.cross(CC_V3_1, axisX, axisY);
          const mat = Mat4.set(CC_MAT4_0, axisX.x, axisX.y, axisX.z, 0, axisY.x, axisY.y, axisY.z, 0, axisZ.x, axisZ.y, axisZ.z, 0, 0, 0, 0, 1);
          mat.getRotation(rot_0);
          cocos2BulletQuat(quat, rot_0);
          bt.Transform_setRotation(trans0, quat);
          const trans1 = bt.Transform_new();
          const cb = this.constraint.connectedBody;
          if (cb) {
            Quat.multiply(rot_0, node.worldRotation, rot_0);
            Quat.invert(rot_1, cb.node.worldRotation);
            Quat.multiply(rot_0, rot_1, rot_0);
            if (cs.autoPivotB) {
              Vec3.multiply(v3_0, cs.node.worldScale, cs.pivotA);
              Vec3.transformQuat(v3_0, v3_0, node.worldRotation);
              Vec3.add(v3_0, v3_0, cs.node.worldPosition);
              Vec3.subtract(v3_0, v3_0, cb.node.worldPosition);
              Vec3.transformQuat(v3_0, v3_0, rot_1);
            } else {
              Vec3.multiply(v3_0, cb.node.worldScale, cs.pivotB);
            }
          } else {
            Vec3.multiply(v3_0, node.worldScale, cs.pivotA);
            Vec3.transformQuat(v3_0, v3_0, node.worldRotation);
            Vec3.add(v3_0, v3_0, node.worldPosition);
            Quat.multiply(rot_0, node.worldRotation, rot_0);
          }
          cocos2BulletVec3(bt.Transform_getOrigin(trans1), v3_0);
          cocos2BulletQuat(quat, rot_0);
          bt.Transform_setRotation(trans1, quat);
          bt.Generic6DofSpring2Constraint_setFrames(this._impl, trans0, trans1);
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