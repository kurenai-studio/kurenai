System.register("q-bundled:///fs/cocos/physics/cannon/cannon-shared-body.js", ["@cocos/cannon", "../../core/index.js", "../framework/physics-enum.js", "../utils/util.js", "../../../exports/physics-framework.js", "../../scene-graph/node-enum.js", "./cannon-util.js", "./cannon-contact-equation.js"], function (_export, _context) {
  "use strict";

  var CANNON, Quat, Vec3, js, ERigidBodyType, PhysicsGroup, getWrap, setWrap, PhysicsSystem, TransformBit, commitShapeUpdates, CannonContactEquation, CannonSharedBody, _CannonSharedBody, v3_0, quat_0, contactsPool, CollisionEventObject;
  _export("CannonSharedBody", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      js = _coreIndexJs.js;
    }, function (_frameworkPhysicsEnumJs) {
      ERigidBodyType = _frameworkPhysicsEnumJs.ERigidBodyType;
      PhysicsGroup = _frameworkPhysicsEnumJs.PhysicsGroup;
    }, function (_utilsUtilJs) {
      getWrap = _utilsUtilJs.getWrap;
      setWrap = _utilsUtilJs.setWrap;
    }, function (_exportsPhysicsFrameworkJs) {
      PhysicsSystem = _exportsPhysicsFrameworkJs.PhysicsSystem;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_cannonUtilJs) {
      commitShapeUpdates = _cannonUtilJs.commitShapeUpdates;
    }, function (_cannonContactEquationJs) {
      CannonContactEquation = _cannonContactEquationJs.CannonContactEquation;
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
      v3_0 = new Vec3();
      quat_0 = new Quat();
      contactsPool = [];
      CollisionEventObject = {
        type: 'onCollisionEnter',
        selfCollider: null,
        otherCollider: null,
        contacts: [],
        impl: null
      };
      /**
        * node : shared-body = 1 : 1
        * static
        */
      _export("CannonSharedBody", CannonSharedBody = class CannonSharedBody {
        static getSharedBody(node, wrappedWorld, wrappedBody) {
          const key = node.uuid;
          let newSB;
          if (CannonSharedBody.sharedBodesMap.has(key)) {
            newSB = CannonSharedBody.sharedBodesMap.get(key);
          } else {
            newSB = new CannonSharedBody(node, wrappedWorld);
            const g = PhysicsGroup.DEFAULT;
            const m = PhysicsSystem.instance.collisionMatrix[g];
            newSB.body.collisionFilterGroup = g;
            newSB.body.collisionFilterMask = m;
            newSB.body.position = new CANNON.Vec3(node.worldPosition.x, node.worldPosition.y, node.worldPosition.z);
            newSB.body.quaternion = new CANNON.Quaternion(node.worldRotation.x, node.worldRotation.y, node.worldRotation.z, node.worldRotation.w);
            CannonSharedBody.sharedBodesMap.set(node.uuid, newSB);
          }
          if (wrappedBody) {
            newSB.wrappedBody = wrappedBody;
            const g = wrappedBody.rigidBody.group;
            const m = PhysicsSystem.instance.collisionMatrix[g];
            newSB.body.collisionFilterGroup = g;
            newSB.body.collisionFilterMask = m;
            newSB.body.position = new CANNON.Vec3(node.worldPosition.x, node.worldPosition.y, node.worldPosition.z);
            newSB.body.quaternion = new CANNON.Quaternion(node.worldRotation.x, node.worldRotation.y, node.worldRotation.z, node.worldRotation.w);
          }
          return newSB;
        }
        /**
          * add or remove from world \
          * add, if enable \
          * remove, if disable & shapes.length == 0 & wrappedBody disable
          */
        set enabled(v) {
          if (v) {
            if (this.index < 0) {
              this.index = this.wrappedWorld.bodies.length;
              this.wrappedWorld.addSharedBody(this);
              this.syncInitial();
            }
          } else if (this.index >= 0) {
            const isRemove = this.wrappedShapes.length === 0 && this.wrappedBody == null || this.wrappedShapes.length === 0 && this.wrappedBody != null && !this.wrappedBody.isEnabled;
            if (isRemove) {
              this.body.sleep(); // clear velocity etc.
              this.index = -1;
              this.wrappedWorld.removeSharedBody(this);
            }
          }
        }
        set reference(v) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v ? this.ref++ : this.ref--;
          if (this.ref === 0) {
            this.destroy();
          }
        }
        constructor(node, wrappedWorld) {
          this.node = void 0;
          this.wrappedWorld = void 0;
          this.body = void 0;
          this.wrappedShapes = [];
          this.wrappedJoints0 = [];
          this.wrappedJoints1 = [];
          this.wrappedBody = null;
          this.index = -1;
          this.ref = 0;
          this.onCollidedListener = this.onCollided.bind(this);
          this.wrappedWorld = wrappedWorld;
          this.node = node;
          this.body = new CANNON.Body();
          setWrap(this.body, this);
          this.body.collisionFilterGroup = PhysicsSystem.PhysicsGroup.DEFAULT;
          this.body.sleepSpeedLimit = PhysicsSystem.instance.sleepThreshold;
          this.body.material = this.wrappedWorld.impl.defaultMaterial;
          this.body.addEventListener('cc-collide', this.onCollidedListener);
        }
        addShape(v) {
          const index = this.wrappedShapes.indexOf(v);
          if (index < 0) {
            const index = this.body.shapes.length;
            this.body.addShape(v.impl);
            this.wrappedShapes.push(v);
            v.setIndex(index);
            const offset = this.body.shapeOffsets[index];
            const orient = this.body.shapeOrientations[index];
            v.setOffsetAndOrient(offset, orient);
            if (this.body.isSleeping()) this.body.wakeUp();
          }
        }
        removeShape(v) {
          const index = this.wrappedShapes.indexOf(v);
          if (index >= 0) {
            js.array.fastRemoveAt(this.wrappedShapes, index);
            this.body.removeShape(v.impl);
            v.setIndex(-1);
            if (this.body.isSleeping()) this.body.wakeUp();
          }
        }
        addJoint(v, type) {
          if (type) {
            const i = this.wrappedJoints1.indexOf(v);
            if (i < 0) this.wrappedJoints1.push(v);
          } else {
            const i = this.wrappedJoints0.indexOf(v);
            if (i < 0) this.wrappedJoints0.push(v);
          }
        }
        removeJoint(v, type) {
          if (type) {
            const i = this.wrappedJoints1.indexOf(v);
            if (i >= 0) js.array.fastRemoveAt(this.wrappedJoints1, i);
          } else {
            const i = this.wrappedJoints0.indexOf(v);
            if (i >= 0) js.array.fastRemoveAt(this.wrappedJoints0, i);
          }
        }
        syncSceneToPhysics() {
          const node = this.node;
          const body = this.body;
          if (node.hasChangedFlags) {
            if (body.isSleeping()) body.wakeUp();
            Vec3.copy(body.position, node.worldPosition);
            Quat.copy(body.quaternion, node.worldRotation);
            body.aabbNeedsUpdate = true;
            if (node.hasChangedFlags & TransformBit.SCALE) this.syncScale();
          }
        }
        syncPhysicsToScene() {
          const n = this.node;
          const b = this.body;
          if (b.type === ERigidBodyType.DYNAMIC) {
            if (!b.isSleeping()) {
              Vec3.copy(v3_0, b.position);
              Quat.copy(quat_0, b.quaternion);
              n.worldPosition = v3_0;
              n.worldRotation = quat_0;
            }
          }
        }
        syncInitial() {
          const n = this.node;
          const b = this.body;
          Vec3.copy(b.position, n.worldPosition);
          Quat.copy(b.quaternion, n.worldRotation);
          Vec3.copy(b.previousPosition, n.worldPosition);
          Quat.copy(b.previousQuaternion, n.worldRotation);
          b.aabbNeedsUpdate = true;
          this.syncScale();
          if (b.isSleeping()) b.wakeUp();
        }
        syncScale() {
          for (let i = 0; i < this.wrappedShapes.length; i++) {
            this.wrappedShapes[i].setScale(this.node.worldScale);
          }
          for (let i = 0; i < this.wrappedJoints0.length; i++) {
            this.wrappedJoints0[i].updateScale0();
          }
          for (let i = 0; i < this.wrappedJoints1.length; i++) {
            this.wrappedJoints1[i].updateScale1();
          }
          commitShapeUpdates(this.body);
        }
        destroy() {
          setWrap(this.body, null);
          this.body.removeEventListener('cc-collide', this.onCollidedListener);
          CannonSharedBody.sharedBodesMap.delete(this.node.uuid);
          delete CANNON.World.idToBodyMap[this.body.id];
          this.node = null;
          this.wrappedWorld = null;
          this.body = null;
          this.wrappedShapes = null;
          this.wrappedJoints0 = null;
          this.wrappedJoints1 = null;
          this.onCollidedListener = null;
        }
        onCollided(event) {
          CollisionEventObject.type = event.event;
          const self = getWrap(event.selfShape);
          const other = getWrap(event.otherShape);
          if (self && self.collider.needCollisionEvent) {
            contactsPool.push.apply(contactsPool, CollisionEventObject.contacts);
            CollisionEventObject.contacts.length = 0;
            CollisionEventObject.impl = event;
            CollisionEventObject.selfCollider = self.collider;
            CollisionEventObject.otherCollider = other ? other.collider : null;
            let i = 0;
            if (CollisionEventObject.type !== 'onCollisionExit') {
              for (i = 0; i < event.contacts.length; i++) {
                const cq = event.contacts[i];
                if (contactsPool.length > 0) {
                  const c = contactsPool.pop();
                  c.impl = cq;
                  CollisionEventObject.contacts.push(c);
                } else {
                  const c = new CannonContactEquation(CollisionEventObject);
                  c.impl = cq;
                  CollisionEventObject.contacts.push(c);
                }
              }
            }
            for (i = 0; i < this.wrappedShapes.length; i++) {
              const shape = this.wrappedShapes[i];
              shape.collider.emit(CollisionEventObject.type, CollisionEventObject);
            }
          }
        }
      });
      _CannonSharedBody = CannonSharedBody;
      CannonSharedBody.sharedBodesMap = new Map();
    }
  };
});