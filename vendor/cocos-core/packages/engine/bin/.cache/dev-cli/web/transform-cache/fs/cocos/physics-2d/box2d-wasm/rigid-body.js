System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/rigid-body.js", ["../../../../virtual/internal%253Aconstants.js", "./instantiated.js", "../framework/physics-system.js", "../../core/index.js", "../framework/physics-types.js", "../../scene-graph/node.js", "../framework/index.js"], function (_export, _context) {
  "use strict";

  var DEBUG, B2, B2ObjectType, getTSObjectFromWASMObjectPtr, PhysicsSystem2D, Vec2, toRadian, Vec3, Quat, TWO_PI, HALF_PI, warn, PHYSICS_2D_PTM_RATIO, ERigidBody2DType, Node, Collider2D, B2RigidBody2D, tempVec3, tempVec2_1, tempVec2_2;
  _export("B2RigidBody2D", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_instantiatedJs) {
      B2 = _instantiatedJs.B2;
      B2ObjectType = _instantiatedJs.B2ObjectType;
      getTSObjectFromWASMObjectPtr = _instantiatedJs.getTSObjectFromWASMObjectPtr;
    }, function (_frameworkPhysicsSystemJs) {
      PhysicsSystem2D = _frameworkPhysicsSystemJs.PhysicsSystem2D;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      toRadian = _coreIndexJs.toRadian;
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      TWO_PI = _coreIndexJs.TWO_PI;
      HALF_PI = _coreIndexJs.HALF_PI;
      warn = _coreIndexJs.warn;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
      ERigidBody2DType = _frameworkPhysicsTypesJs.ERigidBody2DType;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_frameworkIndexJs) {
      Collider2D = _frameworkIndexJs.Collider2D;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      tempVec3 = new Vec3();
      tempVec2_1 = {
        x: 0,
        y: 0
      }; //new B2.Vec2(0, 0);
      tempVec2_2 = {
        x: 0,
        y: 0
      };
      /** @mangle */
      _export("B2RigidBody2D", B2RigidBody2D = class B2RigidBody2D {
        constructor() {
          this._animatedPos = new Vec2();
          this._animatedAngle = 0;
          this._body = null;
          this._rigidBody = void 0;
          this._inited = false;
        }
        get impl() {
          return this._body;
        }
        set _imp(v) {
          this._body = v;
        }
        get rigidBody() {
          return this._rigidBody;
        }
        get isAwake() {
          return this._body.IsAwake();
        }
        get isSleeping() {
          return !this._body.IsAwake();
        }
        initialize(com) {
          this._rigidBody = com;
          PhysicsSystem2D.instance._callAfterStep(this, this._init);
        }
        onDestroy() {
          PhysicsSystem2D.instance._callAfterStep(this, this._destroy);
        }
        onEnable() {
          this.setActive(true);
        }
        onDisable() {
          this.setActive(false);
        }
        nodeTransformChanged(type) {
          if (PhysicsSystem2D.instance.stepping) {
            return;
          }
          if (type & Node.TransformBit.SCALE) {
            const colliders = this.rigidBody.getComponents(Collider2D);
            for (let i = 0; i < colliders.length; i++) {
              colliders[i].apply();
            }
          }
          if (type & Node.TransformBit.POSITION) {
            this.syncPositionToPhysics(true);
          }
          if (type & Node.TransformBit.ROTATION) {
            this.syncRotationToPhysics(true);
          }
        }
        _init() {
          if (this._inited) {
            return;
          }
          PhysicsSystem2D.instance.physicsWorld.addBody(this);
          this.setActive(false);
          this._inited = true;
        }
        _destroy() {
          var _this$impl, _this$impl2;
          if (!this._inited) return;

          //collect all fixtures attached to this rigid body and process them
          const fixtureList = (_this$impl = this.impl) == null ? void 0 : _this$impl.GetFixtureList();
          if (fixtureList) {
            let shapeTSObj = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, fixtureList);
            while (shapeTSObj && shapeTSObj.impl) {
              shapeTSObj.destroy();
              const nextFixture = B2.FixtureGetNext(fixtureList);
              shapeTSObj = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, nextFixture);
            }
          }

          //collect all joints attached to this rigid body and process them
          const jointListPtr = (_this$impl2 = this.impl) == null ? void 0 : _this$impl2.GetJointList();
          if (jointListPtr) {
            let jointWASMPtr = B2.JointEdgeGetJoint(jointListPtr);
            let jointTSObj = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, jointWASMPtr);
            while (jointTSObj) {
              jointTSObj.destroy();
              jointWASMPtr = B2.JointEdgeGetNext(jointListPtr);
              jointTSObj = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, jointWASMPtr);
            }
          }
          PhysicsSystem2D.instance.physicsWorld.removeBody(this);
          this._inited = false;
        }
        animate(dt) {
          const b2body = this._body;
          if (!b2body) return;
          const b2Pos = b2body.GetPosition();
          b2body.SetAwake(true);
          const timeStep = 1 / dt;
          tempVec2_1.x = (this._animatedPos.x - b2Pos.x) * timeStep;
          tempVec2_1.y = (this._animatedPos.y - b2Pos.y) * timeStep;
          b2body.SetLinearVelocity(tempVec2_1);

          //convert b2Rotation to [-PI~PI], which is the same as this._animatedAngle
          let b2Rotation = b2body.GetAngle() % TWO_PI;
          if (b2Rotation > Math.PI) {
            b2Rotation -= TWO_PI;
          }

          //calculate angular velocity
          let angularVelocity = (this._animatedAngle - b2Rotation) * timeStep;
          if (this._animatedAngle < -HALF_PI && b2Rotation > HALF_PI) {
            //ccw, crossing PI
            angularVelocity = (this._animatedAngle + TWO_PI - b2Rotation) * timeStep;
          }
          if (this._animatedAngle > HALF_PI && b2Rotation < -HALF_PI) {
            //cw, crossing PI
            angularVelocity = (this._animatedAngle - TWO_PI - b2Rotation) * timeStep;
          }
          b2body.SetAngularVelocity(angularVelocity);
        }
        syncSceneToPhysics() {
          const dirty = this._rigidBody.node.hasChangedFlags;
          if (dirty) {
            this.nodeTransformChanged(dirty);
          }
        }
        syncPositionToPhysics(enableAnimated = false) {
          const b2body = this._body;
          if (!b2body) return;
          const pos = this._rigidBody.node.worldPosition;
          tempVec2_2.x = pos.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_2.y = pos.y / PHYSICS_2D_PTM_RATIO;
          if (this._rigidBody.type === ERigidBody2DType.Animated && enableAnimated) {
            this._animatedPos.set(tempVec2_2.x, tempVec2_2.y);
          } else {
            b2body.SetTransform(tempVec2_2, b2body.GetAngle());
          }
        }
        syncRotationToPhysics(enableAnimated = false) {
          const b2body = this._body;
          if (!b2body) return;
          const rot = this._rigidBody.node.worldRotation;
          const euler = tempVec3;
          Quat.toEulerInYXZOrder(euler, rot);
          const rotation = toRadian(euler.z);
          const bodyType = this._rigidBody.type;
          if (bodyType === ERigidBody2DType.Animated && enableAnimated) {
            this._animatedAngle = rotation;
          } else {
            b2body.SetTransform(b2body.GetPosition(), rotation);
          }
        }
        resetVelocity() {
          const b2body = this._body;
          if (!b2body) return;
          tempVec2_1.x = 0;
          tempVec2_1.y = 0;
          b2body.SetLinearVelocity(tempVec2_1);
          b2body.SetAngularVelocity(0);
        }
        setType(v) {
          PhysicsSystem2D.instance.physicsWorld._updateBodyType(this);
          if (v === ERigidBody2DType.Dynamic) {
            this._body.SetType(B2.BodyType.b2_dynamicBody);
          } else if (v === ERigidBody2DType.Kinematic) {
            this._body.SetType(B2.BodyType.b2_kinematicBody);
          } else if (v === ERigidBody2DType.Static) {
            this._body.SetType(B2.BodyType.b2_staticBody);
          }
        }
        setLinearDamping(v) {
          this._body.SetLinearDamping(v);
        }
        setAngularDamping(v) {
          this._body.SetAngularDamping(v);
        }
        setGravityScale(v) {
          this._body.SetGravityScale(v);
        }
        setFixedRotation(v) {
          this._body.SetFixedRotation(v);
        }
        setAllowSleep(v) {
          this._body.SetSleepingAllowed(v);
        }
        isActive() {
          return this._body.IsEnabled();
        }
        setActive(v) {
          if (!this._body.GetWorld().IsLocked()) {
            this._body.SetEnabled(v);
          } else if (DEBUG) {
            warn('Can not active RigidBody in contract listener.');
          }
        }
        wakeUp() {
          this._body.SetAwake(true);
        }
        sleep() {
          this._body.SetAwake(false);
        }
        getMass() {
          return this._body.GetMass();
        }
        setLinearVelocity(v) {
          this._body.SetLinearVelocity(v);
        }
        getLinearVelocity(out) {
          const velocity = this._body.GetLinearVelocity();
          out.x = velocity.x;
          out.y = velocity.y;
          return out;
        }
        getLinearVelocityFromWorldPoint(worldPoint, out) {
          out = out || new Vec2();
          tempVec2_1.x = worldPoint.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = worldPoint.y / PHYSICS_2D_PTM_RATIO;
          const temp = this._body.GetLinearVelocityFromWorldPoint(tempVec2_1);
          out.x = temp.x * PHYSICS_2D_PTM_RATIO;
          out.y = temp.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        setAngularVelocity(v) {
          this._body.SetAngularVelocity(v);
        }
        getAngularVelocity() {
          return this._body.GetAngularVelocity();
        }
        getLocalVector(worldVector, out) {
          out = out || new Vec2();
          tempVec2_1.x = worldVector.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = worldVector.y / PHYSICS_2D_PTM_RATIO;
          const temp = this._body.GetLocalVector(tempVec2_1);
          out.x = temp.x * PHYSICS_2D_PTM_RATIO;
          out.y = temp.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getWorldVector(localVector, out) {
          tempVec2_1.x = localVector.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = localVector.y / PHYSICS_2D_PTM_RATIO;
          const temp = this._body.GetWorldVector(tempVec2_1);
          out.x = temp.x * PHYSICS_2D_PTM_RATIO;
          out.y = temp.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getLocalPoint(worldPoint, out) {
          out = out || new Vec2();
          tempVec2_1.x = worldPoint.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = worldPoint.y / PHYSICS_2D_PTM_RATIO;
          const temp = this._body.GetLocalPoint(tempVec2_1);
          out.x = temp.x * PHYSICS_2D_PTM_RATIO;
          out.y = temp.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getWorldPoint(localPoint, out) {
          out = out || new Vec2();
          tempVec2_1.x = localPoint.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = localPoint.y / PHYSICS_2D_PTM_RATIO;
          const temp = this._body.GetWorldPoint(tempVec2_1);
          out.x = temp.x * PHYSICS_2D_PTM_RATIO;
          out.y = temp.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getLocalCenter(out) {
          out = out || new Vec2();
          const pos = this._body.GetLocalCenter();
          out.x = pos.x * PHYSICS_2D_PTM_RATIO;
          out.y = pos.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getWorldCenter(out) {
          out = out || new Vec2();
          const pos = this._body.GetWorldCenter();
          out.x = pos.x * PHYSICS_2D_PTM_RATIO;
          out.y = pos.y * PHYSICS_2D_PTM_RATIO;
          return out;
        }
        getInertia() {
          return this._body.GetInertia();
        }
        applyForce(force, point, wake) {
          if (this._body) {
            tempVec2_1.x = point.x / PHYSICS_2D_PTM_RATIO;
            tempVec2_1.y = point.y / PHYSICS_2D_PTM_RATIO;
            this._body.ApplyForce(force, tempVec2_1, wake);
          }
        }
        applyForceToCenter(force, wake) {
          if (this._body) {
            this._body.ApplyForceToCenter(force, wake);
          }
        }
        applyTorque(torque, wake) {
          if (this._body) {
            this._body.ApplyTorque(torque, wake);
          }
        }
        applyLinearImpulse(impulse, point, wake) {
          if (this._body) {
            tempVec2_1.x = point.x / PHYSICS_2D_PTM_RATIO;
            tempVec2_1.y = point.y / PHYSICS_2D_PTM_RATIO;
            this._body.ApplyLinearImpulse(impulse, tempVec2_1, wake);
          }
        }
        applyLinearImpulseToCenter(impulse, wake) {
          if (this._body) {
            this._body.ApplyLinearImpulse(impulse, this._body.GetPosition(), wake);
          }
        }
        applyAngularImpulse(impulse, wake) {
          if (this._body) {
            this._body.ApplyAngularImpulse(impulse, wake);
          }
        }
      });
    }
  };
});