System.register("q-bundled:///fs/cocos/physics/bullet/bullet-rigid-body.js", ["../../core/index.js", "./bullet-utils.js", "../../../exports/physics-framework.js", "./bullet-enum.js", "./bullet-cache.js", "./instantiated.js"], function (_export, _context) {
  "use strict";

  var Vec3, cocos2BulletVec3, bullet2CocosVec3, PhysicsSystem, btRigidBodyFlags, btCollisionObjectStates, EBtSharedBodyDirty, BulletCache, CC_V3_0, CC_V3_1, bt, BulletRigidBody, v3_0, v3_1;
  _export("BulletRigidBody", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_bulletUtilsJs) {
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
      bullet2CocosVec3 = _bulletUtilsJs.bullet2CocosVec3;
    }, function (_exportsPhysicsFrameworkJs) {
      PhysicsSystem = _exportsPhysicsFrameworkJs.PhysicsSystem;
    }, function (_bulletEnumJs) {
      btRigidBodyFlags = _bulletEnumJs.btRigidBodyFlags;
      btCollisionObjectStates = _bulletEnumJs.btCollisionObjectStates;
      EBtSharedBodyDirty = _bulletEnumJs.EBtSharedBodyDirty;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
      CC_V3_0 = _bulletCacheJs.CC_V3_0;
      CC_V3_1 = _bulletCacheJs.CC_V3_1;
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
      v3_0 = CC_V3_0;
      v3_1 = CC_V3_1;
      /** @mangle */
      _export("BulletRigidBody", BulletRigidBody = class BulletRigidBody {
        get isAwake() {
          const state = bt.CollisionObject_getActivationState(this.impl);
          return state === btCollisionObjectStates.ACTIVE_TAG || state === btCollisionObjectStates.DISABLE_DEACTIVATION;
        }
        get isSleepy() {
          const state = bt.CollisionObject_getActivationState(this.impl);
          return state === btCollisionObjectStates.WANTS_DEACTIVATION;
        }
        get isSleeping() {
          const state = bt.CollisionObject_getActivationState(this.impl);
          return state === btCollisionObjectStates.ISLAND_SLEEPING;
        }
        setMass(value) {
          if (!this._rigidBody.isDynamic) return;
          bt.RigidBody_setMass(this.impl, value);
          this._wakeUpIfSleep();
          this._sharedBody.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
        }
        setType(v) {
          this._sharedBody.setType(v);
        }
        setLinearDamping(value) {
          bt.RigidBody_setDamping(this.impl, this._rigidBody.linearDamping, this._rigidBody.angularDamping);
        }
        setAngularDamping(value) {
          bt.RigidBody_setDamping(this.impl, this._rigidBody.linearDamping, this._rigidBody.angularDamping);
        }
        useGravity(value) {
          if (!this._rigidBody.isDynamic) return;
          let m_rigidBodyFlag = bt.RigidBody_getFlags(this.impl);
          if (value) {
            m_rigidBodyFlag &= ~btRigidBodyFlags.BT_DISABLE_WORLD_GRAVITY;
          } else {
            bt.RigidBody_setGravity(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, Vec3.ZERO));
            m_rigidBodyFlag |= btRigidBodyFlags.BT_DISABLE_WORLD_GRAVITY;
          }
          bt.RigidBody_setFlags(this.impl, m_rigidBodyFlag);
          this._wakeUpIfSleep();
          this._sharedBody.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
        }
        useCCD(value) {
          bt.CollisionObject_setCcdMotionThreshold(this.impl, value ? 0.01 : 0);
          bt.CollisionObject_setCcdSweptSphereRadius(this.impl, value ? 0.1 : 0);
          this._isUsingCCD = value;
        }
        isUsingCCD() {
          return this._isUsingCCD;
        }
        setLinearFactor(v) {
          bt.RigidBody_setLinearFactor(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, v));
          this._wakeUpIfSleep();
        }
        setAngularFactor(v) {
          bt.RigidBody_setAngularFactor(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, v));
          this._wakeUpIfSleep();
        }
        setAllowSleep(v) {
          if (!this._rigidBody.isDynamic) return;
          if (v) {
            bt.CollisionObject_forceActivationState(this.impl, btCollisionObjectStates.ACTIVE_TAG);
          } else {
            bt.CollisionObject_forceActivationState(this.impl, btCollisionObjectStates.DISABLE_DEACTIVATION);
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
        constructor() {
          this.id = void 0;
          this._isEnabled = false;
          this._isUsingCCD = false;
          this._sharedBody = void 0;
          this._rigidBody = void 0;
          this.id = BulletRigidBody.idCounter++;
        }
        clearState() {
          bt.RigidBody_clearState(this.impl);
        }
        clearVelocity() {
          this.setLinearVelocity(Vec3.ZERO);
          this.setAngularVelocity(Vec3.ZERO);
        }
        clearForces() {
          bt.RigidBody_clearForces(this.impl);
        }

        /** LIFECYCLE */

        initialize(com) {
          this._rigidBody = com;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._rigidBody.node, this);
          this._sharedBody.reference = true;
        }
        onEnable() {
          this._isEnabled = true;
          this.setMass(this._rigidBody.mass);
          this.setAllowSleep(this._rigidBody.allowSleep);
          this.setLinearDamping(this._rigidBody.linearDamping);
          this.setAngularDamping(this._rigidBody.angularDamping);
          this.setLinearFactor(this._rigidBody.linearFactor);
          this.setAngularFactor(this._rigidBody.angularFactor);
          this.useGravity(this._rigidBody.useGravity);
          this._sharedBody.bodyEnabled = true;
        }
        onDisable() {
          this._isEnabled = false;
          this._sharedBody.bodyEnabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          this._rigidBody = null;
          this._sharedBody = null;
        }

        /** INTERFACE */

        wakeUp(force = true) {
          bt.CollisionObject_activate(this.impl, force);
        }
        sleep() {
          const state = bt.CollisionObject_getActivationState(this.impl);
          if (state !== btCollisionObjectStates.DISABLE_DEACTIVATION && state !== btCollisionObjectStates.DISABLE_SIMULATION) {
            bt.CollisionObject_forceActivationState(this.impl, btCollisionObjectStates.ISLAND_SLEEPING);
          }
        }
        setSleepThreshold(v) {
          this._wakeUpIfSleep();
          bt.RigidBody_setSleepingThresholds(this.impl, v, v);
        }
        getSleepThreshold() {
          return bt.RigidBody_getLinearSleepingThreshold(this.impl);
        }
        getLinearVelocity(out) {
          return bullet2CocosVec3(out, bt.RigidBody_getLinearVelocity(this.impl));
        }
        setLinearVelocity(value) {
          this._wakeUpIfSleep();
          cocos2BulletVec3(bt.RigidBody_getLinearVelocity(this.impl), value);
        }
        getAngularVelocity(out) {
          return bullet2CocosVec3(out, bt.RigidBody_getAngularVelocity(this.impl));
        }
        setAngularVelocity(value) {
          this._wakeUpIfSleep();
          cocos2BulletVec3(bt.RigidBody_getAngularVelocity(this.impl), value);
        }
        applyLocalForce(force, rel_pos) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          const quat = this._sharedBody.node.worldRotation;
          const v = Vec3.transformQuat(v3_0, force, quat);
          const rp = rel_pos ? Vec3.transformQuat(v3_1, rel_pos, quat) : Vec3.ZERO;
          bt.RigidBody_applyForce(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, v), cocos2BulletVec3(BulletCache.instance.BT_V3_1, rp));
        }
        applyLocalTorque(torque) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          Vec3.transformQuat(v3_0, torque, this._sharedBody.node.worldRotation);
          bt.RigidBody_applyTorque(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, v3_0));
        }
        applyLocalImpulse(impulse, rel_pos) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          const quat = this._sharedBody.node.worldRotation;
          const v = Vec3.transformQuat(v3_0, impulse, quat);
          const rp = rel_pos ? Vec3.transformQuat(v3_1, rel_pos, quat) : Vec3.ZERO;
          bt.RigidBody_applyImpulse(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, v), cocos2BulletVec3(BulletCache.instance.BT_V3_1, rp));
        }
        applyForce(force, rel_pos) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          const rp = rel_pos || Vec3.ZERO;
          bt.RigidBody_applyForce(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, force), cocos2BulletVec3(BulletCache.instance.BT_V3_1, rp));
        }
        applyTorque(torque) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          bt.RigidBody_applyTorque(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, torque));
        }
        applyImpulse(impulse, rel_pos) {
          this._sharedBody.syncSceneToPhysics();
          this._wakeUpIfSleep();
          const rp = rel_pos || Vec3.ZERO;
          bt.RigidBody_applyImpulse(this.impl, cocos2BulletVec3(BulletCache.instance.BT_V3_0, impulse), cocos2BulletVec3(BulletCache.instance.BT_V3_1, rp));
        }
        getGroup() {
          return this._sharedBody.collisionFilterGroup;
        }
        setGroup(v) {
          this._sharedBody.collisionFilterGroup = v;
        }
        addGroup(v) {
          this._sharedBody.collisionFilterGroup |= v;
        }
        removeGroup(v) {
          this._sharedBody.collisionFilterGroup &= ~v;
        }
        getMask() {
          return this._sharedBody.collisionFilterMask;
        }
        setMask(v) {
          this._sharedBody.collisionFilterMask = v;
        }
        addMask(v) {
          this._sharedBody.collisionFilterMask |= v;
        }
        removeMask(v) {
          this._sharedBody.collisionFilterMask &= ~v;
        }
        _wakeUpIfSleep() {
          if (!this.isAwake) {
            bt.CollisionObject_activate(this.impl, true);
          }
        }
      });
      BulletRigidBody.idCounter = 0;
    }
  };
});