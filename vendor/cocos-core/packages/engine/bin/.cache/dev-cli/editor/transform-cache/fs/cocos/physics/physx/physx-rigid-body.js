System.register("q-bundled:///fs/cocos/physics/physx/physx-rigid-body.js", ["../../core/index.js", "../framework/index.js", "./physx-adapter.js"], function (_export, _context) {
  "use strict";

  var Vec3, PhysicsSystem, applyForce, applyImpulse, applyTorqueForce, PX, PhysXRigidBody, v3_0;
  _export("PhysXRigidBody", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_physxAdapterJs) {
      applyForce = _physxAdapterJs.applyForce;
      applyImpulse = _physxAdapterJs.applyImpulse;
      applyTorqueForce = _physxAdapterJs.applyTorqueForce;
      PX = _physxAdapterJs.PX;
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
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      v3_0 = new Vec3();
      /** @mangle */
      _export("PhysXRigidBody", PhysXRigidBody = class PhysXRigidBody {
        constructor() {
          this.isSleepy = false;
          this._isEnabled = false;
          this._isUsingCCD = false;
          this._rigidBody = void 0;
          this._sharedBody = void 0;
        }
        get impl() {
          return this._sharedBody.impl;
        }
        get isAwake() {
          if (!this.isInScene || this.isStatic) return false;
          return !this.impl.isSleeping();
        }
        get isSleeping() {
          if (!this.isInScene || this.isStatic) return true;
          return this.impl.isSleeping();
        }
        get isEnabled() {
          return this._isEnabled;
        }
        get rigidBody() {
          return this._rigidBody;
        }
        get sharedBody() {
          return this._sharedBody;
        }
        get isStatic() {
          return !this.impl || this._sharedBody.isStatic;
        }
        get isStaticOrKinematic() {
          return !this.impl || this._sharedBody.isStatic || this._sharedBody.isKinematic;
        }
        get isInScene() {
          return this._sharedBody.isInScene;
        }
        initialize(v) {
          this._rigidBody = v;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(v.node, this);
          this._sharedBody.reference = true;
          this.setSleepThreshold(PhysicsSystem.instance.sleepThreshold);
        }
        onEnable() {
          this._isEnabled = true;
          this.setMass(this._rigidBody.mass);
          this.setType(this._rigidBody.type);
          this.setAllowSleep(this._rigidBody.allowSleep);
          this.setLinearDamping(this._rigidBody.linearDamping);
          this.setAngularDamping(this._rigidBody.angularDamping);
          this.setLinearFactor(this._rigidBody.linearFactor);
          this.setAngularFactor(this._rigidBody.angularFactor);
          this.useGravity(this._rigidBody.useGravity);
          this._sharedBody.enabled = true;
        }
        onDisable() {
          this._isEnabled = false;
          this._sharedBody.enabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          this._rigidBody = null;
          this._sharedBody = null;
        }
        setType(v) {
          this._sharedBody.setType(v);
        }
        setMass(v) {
          if (this.isStatic) return;
          this._sharedBody.setMass(v);
        }
        setLinearDamping(v) {
          this._sharedBody.setLinearDamping(v);
        }
        setAngularDamping(v) {
          this._sharedBody.setAngularDamping(v);
        }
        useGravity(v) {
          if (this.isStatic) return;
          this.impl.setActorFlag(PX.ActorFlag.eDISABLE_GRAVITY, !v);
        }
        useCCD(v) {
          if (this.isStatic) return;
          this.impl.setRigidBodyFlag(PX.RigidBodyFlag.eENABLE_CCD, v);
          this._isUsingCCD = v;
        }
        isUsingCCD() {
          return this._isUsingCCD;
        }
        setLinearFactor(v) {
          if (this.isStatic) return;
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_X, !v.x);
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_Y, !v.y);
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_Z, !v.z);
        }
        setAngularFactor(v) {
          if (this.isStatic) return;
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_X, !v.x);
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_Y, !v.y);
          this.impl.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_Z, !v.z);
        }
        setAllowSleep(v) {
          if (this.isStaticOrKinematic) return;
          const wc = v ? 0.0001 : 0xffffffff;
          this.impl.setWakeCounter(wc);
        }
        wakeUp() {
          if (!this.isInScene || this.isStatic) return;
          this.impl.wakeUp();
        }
        sleep() {
          if (!this.isInScene || this.isStatic) return;
          this.impl.putToSleep();
        }
        clearState() {
          if (!this.isInScene || this.isStatic) return;
          this.clearForces();
          this.clearVelocity();
        }
        clearForces() {
          if (!this.isInScene || this.isStatic) return;
          this._sharedBody.clearForces();
        }
        clearVelocity() {
          if (this.isStatic) return;
          this._sharedBody.clearVelocity();
        }
        setSleepThreshold(v) {
          if (this.isStatic) return;
          //(approximated) mass-normalized kinetic energy
          const ke = 0.5 * v * v;
          this.impl.setSleepThreshold(ke);
        }
        getSleepThreshold() {
          if (this.isStatic) return 0;
          const ke = this.impl.getSleepThreshold();
          const v = Math.sqrt(2 * ke);
          return v;
        }
        getLinearVelocity(out) {
          if (this.isStatic) return;
          Vec3.copy(out, this.impl.getLinearVelocity());
        }
        setLinearVelocity(value) {
          if (this.isStaticOrKinematic) return;
          this.impl.setLinearVelocity(value, true);
        }
        getAngularVelocity(out) {
          if (this.isStatic) return;
          Vec3.copy(out, this.impl.getAngularVelocity());
        }
        setAngularVelocity(value) {
          if (this.isStaticOrKinematic) return;
          this.impl.setAngularVelocity(value, true);
        }
        applyForce(force, relativePoint) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          this._sharedBody.syncSceneToPhysics();
          const rp = relativePoint || Vec3.ZERO;
          applyForce(true, this.impl, force, rp);
        }
        applyLocalForce(force, relativePoint) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          this._sharedBody.syncSceneToPhysics();
          const rp = relativePoint || Vec3.ZERO;
          applyForce(false, this.impl, force, rp);
        }
        applyImpulse(force, relativePoint) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          this._sharedBody.syncSceneToPhysics();
          const rp = relativePoint || Vec3.ZERO;
          applyImpulse(true, this.impl, force, rp);
        }
        applyLocalImpulse(force, relativePoint) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          this._sharedBody.syncSceneToPhysics();
          const rp = relativePoint || Vec3.ZERO;
          applyImpulse(false, this.impl, force, rp);
        }
        applyTorque(torque) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          applyTorqueForce(this.impl, torque);
        }
        applyLocalTorque(torque) {
          if (!this.isInScene || this.isStaticOrKinematic) return;
          this._sharedBody.syncSceneToPhysics();
          Vec3.transformQuat(v3_0, torque, this._sharedBody.node.worldRotation);
          applyTorqueForce(this.impl, v3_0);
        }
        setGroup(v) {
          this._sharedBody.setGroup(v);
        }
        getGroup() {
          return this._sharedBody.getGroup();
        }
        addGroup(v) {
          this._sharedBody.addGroup(v);
        }
        removeGroup(v) {
          this._sharedBody.removeGroup(v);
        }
        setMask(v) {
          this._sharedBody.setMask(v);
        }
        getMask() {
          return this._sharedBody.getMask();
        }
        addMask(v) {
          this._sharedBody.addMask(v);
        }
        removeMask(v) {
          this._sharedBody.removeMask(v);
        }
      });
    }
  };
});