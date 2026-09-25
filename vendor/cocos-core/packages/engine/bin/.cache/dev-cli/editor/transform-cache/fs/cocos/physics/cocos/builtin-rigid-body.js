System.register("q-bundled:///fs/cocos/physics/cocos/builtin-rigid-body.js", ["../framework/index.js"], function (_export, _context) {
  "use strict";

  var PhysicsSystem, BuiltinRigidBody;
  _export("BuiltinRigidBody", void 0);
  return {
    setters: [function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
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
      _export("BuiltinRigidBody", BuiltinRigidBody = class BuiltinRigidBody {
        constructor() {
          this._rigidBody = void 0;
          this._sharedBody = void 0;
        }
        get impl() {
          return this;
        }
        get isAwake() {
          return true;
        }
        get isSleepy() {
          return false;
        }
        get isSleeping() {
          return false;
        }
        get rigidBody() {
          return this._rigidBody;
        }
        get sharedBody() {
          return this._sharedBody;
        }
        initialize(com) {
          this._rigidBody = com;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._rigidBody.node, this);
          this._sharedBody.reference = true;
        }
        onEnable() {
          this._sharedBody.enabled = true;
        }
        onDisable() {
          this._sharedBody.enabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          this._rigidBody = null;
          this._sharedBody = null;
        }
        setMass(v) {}
        setType(v) {}
        setLinearDamping(v) {}
        setAngularDamping(v) {}
        useGravity(v) {}
        useCCD(v) {}
        isUsingCCD() {
          return false;
        }
        setLinearFactor(v) {}
        setAngularFactor(v) {}
        setAllowSleep(v) {}
        wakeUp() {}
        sleep() {}
        clearState() {}
        clearForces() {}
        clearVelocity() {}
        setSleepThreshold(v) {}
        getSleepThreshold() {
          return 0;
        }
        getLinearVelocity(out) {}
        setLinearVelocity(value) {}
        getAngularVelocity(out) {}
        setAngularVelocity(value) {}
        applyForce(force, relativePoint) {}
        applyLocalForce(force, relativePoint) {}
        applyImpulse(force, relativePoint) {}
        applyLocalImpulse(force, relativePoint) {}
        applyTorque(torque) {}
        applyLocalTorque(torque) {}
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