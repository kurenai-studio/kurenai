System.register("q-bundled:///fs/cocos/physics/cannon/cannon-rigid-body.js", ["@cocos/cannon", "../../core/index.js", "../framework/physics-system.js", "../framework/index.js"], function (_export, _context) {
  "use strict";

  var CANNON, Vec3, PhysicsSystem, ERigidBodyType, CannonRigidBody, v3_cannon0, v3_cannon1;
  _export("CannonRigidBody", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_frameworkPhysicsSystemJs) {
      PhysicsSystem = _frameworkPhysicsSystemJs.PhysicsSystem;
    }, function (_frameworkIndexJs) {
      ERigidBodyType = _frameworkIndexJs.ERigidBodyType;
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
      v3_cannon0 = new CANNON.Vec3();
      v3_cannon1 = new CANNON.Vec3();
      /**
       * wrapped shared body
       * dynamic
       * kinematic
       */
      _export("CannonRigidBody", CannonRigidBody = class CannonRigidBody {
        constructor() {
          this._rigidBody = void 0;
          this._sharedBody = void 0;
          this._isEnabled = false;
        }
        get isAwake() {
          return this.impl.isAwake();
        }
        get isSleepy() {
          return this.impl.isSleepy();
        }
        get isSleeping() {
          return this.impl.isSleeping();
        }
        setAllowSleep(v) {
          if (this.impl.type !== CANNON.Body.DYNAMIC) return;
          this.impl.allowSleep = v;
          this._wakeUpIfSleep();
        }
        setMass(value) {
          if (this.impl.type !== CANNON.Body.DYNAMIC) return;
          this.impl.mass = value;
          this.impl.updateMassProperties();
          this._wakeUpIfSleep();
        }
        setType(v) {
          switch (v) {
            case ERigidBodyType.DYNAMIC:
              this.impl.type = CANNON.Body.DYNAMIC;
              this.impl.allowSleep = this._rigidBody.allowSleep;
              this.setMass(this._rigidBody.mass);
              break;
            case ERigidBodyType.KINEMATIC:
              this.impl.type = CANNON.Body.KINEMATIC;
              this.impl.mass = 0;
              this.impl.allowSleep = false;
              this.impl.sleepState = CANNON.Body.AWAKE;
              this.impl.updateMassProperties();
              break;
            case ERigidBodyType.STATIC:
            default:
              this.impl.type = CANNON.Body.STATIC;
              this.impl.mass = 0;
              this.impl.allowSleep = true;
              this.impl.updateMassProperties();
              this.clearState();
              break;
          }
        }
        setLinearDamping(value) {
          this.impl.linearDamping = value;
        }
        setAngularDamping(value) {
          this.impl.angularDamping = value;
        }
        useGravity(value) {
          this.impl.useGravity = value;
          this._wakeUpIfSleep();
        }
        useCCD(value) {
          this.impl.ccdSpeedThreshold = value ? 0.01 : -1;
        }
        isUsingCCD() {
          return this.impl.ccdSpeedThreshold !== -1;
        }
        setLinearFactor(value) {
          Vec3.copy(this.impl.linearFactor, value);
          this._wakeUpIfSleep();
        }
        setAngularFactor(value) {
          Vec3.copy(this.impl.angularFactor, value);
          const fixR = Vec3.equals(this.impl.angularFactor, Vec3.ZERO);
          if (fixR !== this.impl.fixedRotation) {
            this.impl.fixedRotation = fixR;
            this.impl.updateMassProperties();
          }
          this._wakeUpIfSleep();
        }
        get impl() {
          return this._sharedBody.body;
        }
        get rigidBody() {
          return this._rigidBody;
        }
        get sharedBody() {
          return this._sharedBody;
        }
        get isEnabled() {
          return this._isEnabled;
        }
        /** LIFECYCLE */

        initialize(com) {
          this._rigidBody = com;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._rigidBody.node, this);
          this._sharedBody.reference = true;
          this._sharedBody.wrappedBody = this;
        }
        onLoad() {}
        onEnable() {
          this._isEnabled = true;
          this.setType(this._rigidBody.type);
          this.setMass(this._rigidBody.mass);
          this.setAllowSleep(this._rigidBody.allowSleep);
          this.setLinearDamping(this._rigidBody.linearDamping);
          this.setAngularDamping(this._rigidBody.angularDamping);
          this.useGravity(this._rigidBody.useGravity);
          this.setLinearFactor(this._rigidBody.linearFactor);
          this.setAngularFactor(this._rigidBody.angularFactor);
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

        /** INTERFACE */

        clearVelocity() {
          this.impl.velocity.setZero();
          this.impl.angularVelocity.setZero();
        }
        clearForces() {
          this.impl.force.setZero();
          this.impl.torque.setZero();
        }
        clearState() {
          this.clearVelocity();
          this.clearForces();
        }
        wakeUp() {
          return this.impl.wakeUp();
        }
        sleep() {
          return this.impl.sleep();
        }
        setSleepThreshold(v) {
          this.impl.sleepSpeedLimit = v;
          this._wakeUpIfSleep();
        }
        getSleepThreshold() {
          return this.impl.sleepSpeedLimit;
        }
        getLinearVelocity(out) {
          Vec3.copy(out, this.impl.velocity);
          return out;
        }
        setLinearVelocity(value) {
          this._wakeUpIfSleep();
          Vec3.copy(this.impl.velocity, value);
        }
        getAngularVelocity(out) {
          Vec3.copy(out, this.impl.angularVelocity);
          return out;
        }
        setAngularVelocity(value) {
          this._wakeUpIfSleep();
          Vec3.copy(this.impl.angularVelocity, value);
        }
        applyForce(force, worldPoint) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          if (worldPoint == null) worldPoint = Vec3.ZERO;
          this.impl.applyForce(Vec3.copy(v3_cannon0, force), Vec3.copy(v3_cannon1, worldPoint));
        }
        applyImpulse(impulse, worldPoint) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          if (worldPoint == null) worldPoint = Vec3.ZERO;
          this.impl.applyImpulse(Vec3.copy(v3_cannon0, impulse), Vec3.copy(v3_cannon1, worldPoint));
        }
        applyLocalForce(force, localPoint) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          if (localPoint == null) localPoint = Vec3.ZERO;
          this.impl.applyLocalForce(Vec3.copy(v3_cannon0, force), Vec3.copy(v3_cannon1, localPoint));
        }
        applyLocalImpulse(impulse, localPoint) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          if (localPoint == null) localPoint = Vec3.ZERO;
          this.impl.applyLocalImpulse(Vec3.copy(v3_cannon0, impulse), Vec3.copy(v3_cannon1, localPoint));
        }
        applyTorque(torque) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          Vec3.add(this.impl.torque, this.impl.torque, torque);
        }
        applyLocalTorque(torque) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          Vec3.copy(v3_cannon0, torque);
          this.impl.vectorToWorldFrame(v3_cannon0, v3_cannon0);
          Vec3.add(this.impl.torque, this.impl.torque, v3_cannon0);
        }

        /** group */
        getGroup() {
          return this.impl.collisionFilterGroup;
        }
        setGroup(v) {
          this.impl.collisionFilterGroup = v;
          this._wakeUpIfSleep();
        }
        addGroup(v) {
          this.impl.collisionFilterGroup |= v;
          this._wakeUpIfSleep();
        }
        removeGroup(v) {
          this.impl.collisionFilterGroup &= ~v;
          this._wakeUpIfSleep();
        }

        /** mask */
        getMask() {
          return this.impl.collisionFilterMask;
        }
        setMask(v) {
          this.impl.collisionFilterMask = v;
          this._wakeUpIfSleep();
        }
        addMask(v) {
          this.impl.collisionFilterMask |= v;
          this._wakeUpIfSleep();
        }
        removeMask(v) {
          this.impl.collisionFilterMask &= ~v;
          this._wakeUpIfSleep();
        }
        _wakeUpIfSleep() {
          if (!this.impl.isAwake()) this.impl.wakeUp();
        }
      });
    }
  };
});