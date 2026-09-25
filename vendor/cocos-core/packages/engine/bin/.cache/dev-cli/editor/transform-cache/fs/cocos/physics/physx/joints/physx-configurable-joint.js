System.register("q-bundled:///fs/cocos/physics/physx/joints/physx-configurable-joint.js", ["../../../core/index.js", "../../framework/index.js", "../physx-adapter.js", "../physx-instance.js", "./physx-joint.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, Mat4, toRadian, EConstraintMode, EDriverMode, PX, _trans, getTempTransform, _pxtrans, PhysXInstance, PhysXJoint, PhysXConfigurableJoint, CC_V3_0, CC_V3_1, CC_QUAT_0, CC_MAT4_0;
  function getConstraintFlag(v) {
    switch (v) {
      case EConstraintMode.FREE:
        return PX.D6Motion.eFREE;
      case EConstraintMode.LIMITED:
        return PX.D6Motion.eLIMITED;
      case EConstraintMode.LOCKED:
        return PX.D6Motion.eLOCKED;
      default:
        return PX.D6Motion.eFREE;
    }
  }

  /** @mangle */
  _export("PhysXConfigurableJoint", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      Mat4 = _coreIndexJs.Mat4;
      toRadian = _coreIndexJs.toRadian;
    }, function (_frameworkIndexJs) {
      EConstraintMode = _frameworkIndexJs.EConstraintMode;
      EDriverMode = _frameworkIndexJs.EDriverMode;
    }, function (_physxAdapterJs) {
      PX = _physxAdapterJs.PX;
      _trans = _physxAdapterJs._trans;
      getTempTransform = _physxAdapterJs.getTempTransform;
      _pxtrans = _physxAdapterJs._pxtrans;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_physxJointJs) {
      PhysXJoint = _physxJointJs.PhysXJoint;
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
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      CC_V3_0 = new Vec3();
      CC_V3_1 = new Vec3();
      CC_QUAT_0 = new Quat();
      CC_MAT4_0 = new Mat4();
      _export("PhysXConfigurableJoint", PhysXConfigurableJoint = class PhysXConfigurableJoint extends PhysXJoint {
        _setLinearLimit() {
          const linearLimit = this.constraint.linearLimitSettings;
          const limitPairX = PhysXConfigurableJoint._linearLimitX;
          const limitPairY = PhysXConfigurableJoint._linearLimitY;
          const limitPairZ = PhysXConfigurableJoint._linearLimitZ;
          const setLimitPair = limitPair => {
            if (linearLimit.enableSoftConstraint) {
              limitPair.stiffness = linearLimit.stiffness;
              limitPair.damping = linearLimit.damping;
            } else {
              limitPair.stiffness = 0;
              limitPair.damping = 0;
            }
            limitPair.bounceThreshold = 0.1;
            limitPair.contactDistance = 0.1;
            limitPair.restitution = linearLimit.restitution;
          };
          setLimitPair(limitPairX);
          setLimitPair(limitPairY);
          setLimitPair(limitPairZ);
          const lower = linearLimit.lower;
          const upper = linearLimit.upper;
          if (linearLimit.xMotion === EConstraintMode.LIMITED) {
            limitPairX.lower = lower.x;
            limitPairX.upper = upper.x;
            this._impl.setLinearLimit(PX.D6Axis.eX, limitPairX);
          }
          if (linearLimit.yMotion === EConstraintMode.LIMITED) {
            limitPairY.lower = lower.y;
            limitPairY.upper = upper.y;
            this._impl.setLinearLimit(PX.D6Axis.eY, limitPairY);
          }
          if (linearLimit.zMotion === EConstraintMode.LIMITED) {
            limitPairZ.lower = lower.z;
            limitPairZ.upper = upper.z;
            this._impl.setLinearLimit(PX.D6Axis.eZ, limitPairZ);
          }
        }
        _setSwingLimit() {
          const angularLimit = this.constraint.angularLimitSettings;
          const limitCone = PhysXConfigurableJoint._swingLimit;
          if (angularLimit.enableSoftConstraintSwing) {
            limitCone.stiffness = angularLimit.swingStiffness;
            limitCone.damping = angularLimit.swingDamping;
          } else {
            limitCone.stiffness = 0;
            limitCone.springDamping = 0;
          }
          limitCone.yAngle = Math.PI;
          limitCone.zAngle = Math.PI;
          limitCone.contactDistance = 0.1;
          limitCone.bounceThreshold = 0.1;
          limitCone.restitution = angularLimit.swingRestitution;
          if (angularLimit.swingMotion1 === EConstraintMode.LIMITED) {
            limitCone.yAngle = toRadian(Math.max(angularLimit.swingExtent1, 1e-9)) * 0.5;
            this._impl.setSwingLimit(limitCone);
          }
          if (angularLimit.swingMotion2 === EConstraintMode.LIMITED) {
            limitCone.zAngle = toRadian(Math.max(angularLimit.swingExtent2, 1e-9)) * 0.5;
            this._impl.setSwingLimit(limitCone);
          }
        }
        _setTwistLimit() {
          const angularLimit = this.constraint.angularLimitSettings;
          const limitPair = PhysXConfigurableJoint._twistLimit;
          if (angularLimit.enableSoftConstraintTwist) {
            limitPair.stiffness = angularLimit.twistStiffness;
            limitPair.damping = angularLimit.twistDamping;
          } else {
            limitPair.stiffness = 0;
            limitPair.damping = 0;
          }
          limitPair.contactDistance = 0.1;
          limitPair.bounceThreshold = 0.1;
          limitPair.restitution = angularLimit.twistRestitution;
          if (angularLimit.twistMotion === EConstraintMode.LIMITED) {
            limitPair.lower = toRadian(Math.max(angularLimit.twistExtent, 1e-9)) * -0.5;
            limitPair.upper = toRadian(Math.max(angularLimit.twistExtent, 1e-9)) * 0.5;
            this._impl.setTwistLimit(limitPair);
          }
        }
        _updateDrive(idx) {
          let axis = PX.D6Axis.eX;
          let driveMode = EDriverMode.DISABLED;
          const com = this.constraint;
          const ld = com.linearDriverSettings;
          const ad = com.angularDriverSettings;
          const getSwingDriveMode = () => {
            const ad = this.constraint.angularDriverSettings;
            if (ad.swingDrive1 === EDriverMode.INDUCTION || ad.swingDrive2 === EDriverMode.INDUCTION) {
              return EDriverMode.INDUCTION;
            } else if (ad.swingDrive1 === EDriverMode.SERVO || ad.swingDrive2 === EDriverMode.SERVO) {
              return EDriverMode.SERVO;
            } else {
              return EDriverMode.DISABLED;
            }
          };
          switch (idx) {
            case 0:
              axis = PX.D6Drive.eX;
              driveMode = ld.xDrive;
              break;
            case 1:
              axis = PX.D6Drive.eY;
              driveMode = ld.yDrive;
              break;
            case 2:
              axis = PX.D6Drive.eZ;
              driveMode = ld.zDrive;
              break;
            case 3:
              axis = PX.D6Drive.eTWIST;
              driveMode = ad.twistDrive;
              break;
            case 4:
              axis = PX.D6Drive.eSWING;
              driveMode = getSwingDriveMode();
              break;
            case 5:
              axis = PX.D6Drive.eSWING;
              driveMode = getSwingDriveMode();
              break;
            default:
              break;
          }
          const drive = PhysXConfigurableJoint._drive[idx];
          if (idx >= 0 && idx < 3) {
            drive.forceLimit = com.linearDriverSettings.strength;
          } else if (idx < 6) {
            drive.forceLimit = com.angularDriverSettings.strength;
          }
          if (driveMode === EDriverMode.DISABLED) {
            drive.forceLimit = 0;
          } else if (driveMode === EDriverMode.SERVO) {
            drive.damping = 0;
            drive.stiffness = 1000;
          } else if (driveMode === EDriverMode.INDUCTION) {
            drive.damping = 1000;
            drive.stiffness = 0;
          }
          this._impl.setDrive(axis, drive);
        }
        _updateDriveTarget() {
          const linearTarget = this.constraint.linearDriverSettings.targetPosition;
          const angularTarget = this.constraint.angularDriverSettings.targetOrientation;
          const quat = Quat.fromEuler(CC_QUAT_0, angularTarget.x, angularTarget.y, angularTarget.z);
          getTempTransform(linearTarget, quat);
          this._impl.setDrivePosition(_pxtrans, true);
        }
        _updateDriveVelocity() {
          const linearVelocity = this.constraint.linearDriverSettings.targetVelocity;
          const angularVelocity = this.constraint.angularDriverSettings.targetVelocity;
          const lv = Vec3.set(CC_V3_0, linearVelocity.x, linearVelocity.y, linearVelocity.z);
          const av = Vec3.set(CC_V3_1, toRadian(-angularVelocity.x), toRadian(-angularVelocity.y), toRadian(-angularVelocity.z));
          this._impl.setDriveVelocity(lv, av, true);
        }
        _updateDriveSettings() {
          this._updateDrive(0);
          this._updateDrive(1);
          this._updateDrive(2);
          this._updateDrive(3);
          this._updateDrive(4);
          this._updateDrive(5);
          this._updateDriveTarget();
          this._updateDriveVelocity();
        }
        setConstraintMode(idx, v) {
          let axis = PX.D6Axis.eX;
          switch (idx) {
            case 0:
              axis = PX.D6Axis.eX;
              break;
            case 1:
              axis = PX.D6Axis.eY;
              break;
            case 2:
              axis = PX.D6Axis.eZ;
              break;
            case 3:
              axis = PX.D6Axis.eTWIST;
              break;
            case 4:
              axis = PX.D6Axis.eSWING1;
              break;
            case 5:
              axis = PX.D6Axis.eSWING2;
              break;
            default:
              break;
          }
          const mode = getConstraintFlag(v);
          this._impl.setMotion(axis, mode);
        }
        setLinearLimit(idx, lower, upper) {
          this._setLinearLimit();
        }
        setAngularExtent(twist, swing1, swing2) {
          this._setSwingLimit();
          this._setTwistLimit();
        }
        setLinearRestitution(v) {
          this._setLinearLimit();
        }
        setSwingRestitution(v) {
          this._setSwingLimit();
        }
        setTwistRestitution(v) {
          this._setTwistLimit();
        }
        setLinearSoftConstraint(v) {
          this._setLinearLimit();
        }
        setLinearStiffness(v) {
          this._setLinearLimit();
        }
        setLinearDamping(v) {
          this._setLinearLimit();
        }
        setSwingSoftConstraint(v) {
          this._setSwingLimit();
        }
        setSwingStiffness(v) {
          this._setSwingLimit();
        }
        setSwingDamping(v) {
          this._setSwingLimit();
        }
        setTwistSoftConstraint(v) {
          this._setTwistLimit();
        }
        setTwistStiffness(v) {
          this._setTwistLimit();
        }
        setTwistDamping(v) {
          this._setTwistLimit();
        }
        setDriverMode(idx, v) {
          this._updateDrive(idx);
        }
        setLinearMotorTarget(v) {
          this._updateDriveTarget();
        }
        setLinearMotorVelocity(v) {
          this._updateDriveVelocity();
        }
        setLinearMotorForceLimit(v) {
          this._updateDrive(0);
          this._updateDrive(1);
          this._updateDrive(2);
        }
        setAngularMotorTarget(v) {
          this._updateDriveTarget();
        }
        setAngularMotorVelocity(v) {
          this._updateDriveVelocity();
        }
        setAngularMotorForceLimit(v) {
          this._updateDrive(3);
          this._updateDrive(4);
          this._updateDrive(5);
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
          const force = this.constraint.breakForce;
          const torque = this.constraint.breakTorque;
          this._impl.setBreakForce(force, torque);
        }
        setBreakTorque(v) {
          const force = this.constraint.breakForce;
          const torque = this.constraint.breakTorque;
          this._impl.setBreakForce(force, torque);
        }
        get constraint() {
          return this._com;
        }
        onComponentSet() {
          PhysXConfigurableJoint._initCache();
          const cs = this.constraint;
          this._impl = PX.createD6Joint(PhysXJoint.tempActor, _pxtrans, null, _pxtrans);
          this.setBreakForce(cs.breakForce);
          this.setBreakTorque(cs.breakTorque);
          const ll = cs.linearLimitSettings;
          const al = cs.angularLimitSettings;
          this.setConstraintMode(0, ll.xMotion);
          this.setConstraintMode(1, ll.yMotion);
          this.setConstraintMode(2, ll.zMotion);
          this.setConstraintMode(3, al.twistMotion);
          this.setConstraintMode(4, al.swingMotion1);
          this.setConstraintMode(5, al.swingMotion2);
          this._setLinearLimit();
          this._setSwingLimit();
          this._setTwistLimit();
          this._updateDriveSettings();
          this.updateFrames();
          this.enableDebugVisualization(true);
        }
        updateFrames() {
          const cs = this.constraint;
          const node = cs.node;
          const pos = _trans.translation;
          const rot = _trans.rotation;
          const cb = cs.connectedBody;
          const axisX = cs.axis;
          const axisY = cs.secondaryAxis;
          const axisZ = Vec3.cross(CC_V3_0, axisX, axisY);
          const _rot = CC_QUAT_0;
          const mat = Mat4.set(CC_MAT4_0, axisX.x, axisX.y, axisX.z, 0, axisY.x, axisY.y, axisY.z, 0, axisZ.x, axisZ.y, axisZ.z, 0, 0, 0, 0, 1);
          mat.getRotation(_rot);
          Vec3.multiply(pos, cs.node.worldScale, cs.pivotA);
          this._impl.setLocalPose(0, getTempTransform(pos, _rot));
          if (cb) {
            Quat.multiply(_rot, node.worldRotation, _rot);
            Quat.invert(rot, cb.node.worldRotation);
            Quat.multiply(_rot, rot, _rot);
            if (cs.autoPivotB) {
              Vec3.multiply(pos, cs.node.worldScale, cs.pivotA);
              Vec3.transformQuat(pos, pos, node.worldRotation);
              Vec3.add(pos, pos, node.worldPosition);
              Vec3.subtract(pos, pos, cb.node.worldPosition);
              Vec3.transformQuat(pos, pos, rot);
            } else {
              Vec3.multiply(pos, cb.node.worldScale, cs.pivotB);
            }
          } else {
            Vec3.multiply(pos, node.worldScale, cs.pivotA);
            Vec3.transformQuat(pos, pos, node.worldRotation);
            Vec3.add(pos, pos, node.worldPosition);
            Quat.multiply(_rot, node.worldRotation, _rot);
          }
          this._impl.setLocalPose(1, getTempTransform(pos, _rot));
        }
        updateScale0() {
          this.updateFrames();
        }
        updateScale1() {
          this.updateFrames();
        }
        static _initCache() {
          if (!PhysXConfigurableJoint._jointToleranceScale) {
            PhysXConfigurableJoint._jointToleranceScale = PhysXInstance.physics.getTolerancesScale();
            PhysXConfigurableJoint._linearLimitX = new PX.PxJointLinearLimitPair(PhysXConfigurableJoint._jointToleranceScale, 0, 0);
            PhysXConfigurableJoint._linearLimitY = new PX.PxJointLinearLimitPair(PhysXConfigurableJoint._jointToleranceScale, 0, 0);
            PhysXConfigurableJoint._linearLimitZ = new PX.PxJointLinearLimitPair(PhysXConfigurableJoint._jointToleranceScale, 0, 0);
            PhysXConfigurableJoint._twistLimit = new PX.PxJointAngularLimitPair(0, 0);
            PhysXConfigurableJoint._swingLimit = new PX.PxJointLimitCone(1.5, 1.5);
            PhysXConfigurableJoint._drive_x = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive_y = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive_z = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive_twist = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive_swing1 = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive_swing2 = new PX.D6JointDrive();
            PhysXConfigurableJoint._drive = [PhysXConfigurableJoint._drive_x, PhysXConfigurableJoint._drive_y, PhysXConfigurableJoint._drive_z, PhysXConfigurableJoint._drive_twist, PhysXConfigurableJoint._drive_swing1, PhysXConfigurableJoint._drive_swing2];
          }
        }
      });
      PhysXConfigurableJoint._jointToleranceScale = null;
      PhysXConfigurableJoint._linearLimitX = null;
      PhysXConfigurableJoint._linearLimitY = null;
      PhysXConfigurableJoint._linearLimitZ = null;
      PhysXConfigurableJoint._twistLimit = null;
      PhysXConfigurableJoint._swingLimit = null;
      PhysXConfigurableJoint._drive_x = null;
      PhysXConfigurableJoint._drive_y = null;
      PhysXConfigurableJoint._drive_z = null;
      PhysXConfigurableJoint._drive_twist = null;
      PhysXConfigurableJoint._drive_swing1 = null;
      PhysXConfigurableJoint._drive_swing2 = null;
      PhysXConfigurableJoint._drive = [];
    }
  };
});