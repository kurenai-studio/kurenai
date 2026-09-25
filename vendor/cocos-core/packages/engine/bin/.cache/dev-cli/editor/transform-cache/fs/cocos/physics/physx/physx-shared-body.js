System.register("q-bundled:///fs/cocos/physics/physx/physx-shared-body.js", ["../../core/index.js", "./physx-instance.js", "../../scene-graph/node-enum.js", "./physx-adapter.js", "../framework/index.js", "../framework/physics-enum.js"], function (_export, _context) {
  "use strict";

  var Vec3, js, PhysXInstance, TransformBit, addActorToScene, syncNoneStaticToSceneIfWaking, getJsTransform, getTempTransform, physXEqualsCocosQuat, physXEqualsCocosVec3, PX, setMassAndUpdateInertia, ERigidBodyType, PhysicsSystem, PhysicsGroup, PhysXSharedBody, _PhysXSharedBody;
  _export("PhysXSharedBody", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      js = _coreIndexJs.js;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_physxAdapterJs) {
      addActorToScene = _physxAdapterJs.addActorToScene;
      syncNoneStaticToSceneIfWaking = _physxAdapterJs.syncNoneStaticToSceneIfWaking;
      getJsTransform = _physxAdapterJs.getJsTransform;
      getTempTransform = _physxAdapterJs.getTempTransform;
      physXEqualsCocosQuat = _physxAdapterJs.physXEqualsCocosQuat;
      physXEqualsCocosVec3 = _physxAdapterJs.physXEqualsCocosVec3;
      PX = _physxAdapterJs.PX;
      setMassAndUpdateInertia = _physxAdapterJs.setMassAndUpdateInertia;
    }, function (_frameworkIndexJs) {
      ERigidBodyType = _frameworkIndexJs.ERigidBodyType;
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_frameworkPhysicsEnumJs) {
      PhysicsGroup = _frameworkPhysicsEnumJs.PhysicsGroup;
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
      /** @mangle */
      _export("PhysXSharedBody", PhysXSharedBody = class PhysXSharedBody {
        static getSharedBody(node, wrappedWorld, wrappedBody) {
          const key = node.uuid;
          let newSB;
          if (PhysXSharedBody.sharedBodesMap.has(key)) {
            newSB = PhysXSharedBody.sharedBodesMap.get(key);
          } else {
            newSB = new PhysXSharedBody(node, wrappedWorld);
            newSB.filterData.word0 = PhysicsGroup.DEFAULT;
            newSB.filterData.word1 = PhysicsSystem.instance.collisionMatrix[PhysicsGroup.DEFAULT];
            PhysXSharedBody.sharedBodesMap.set(node.uuid, newSB);
          }
          if (wrappedBody) {
            newSB._wrappedBody = wrappedBody;
            const g = wrappedBody.rigidBody.group;
            const m = PhysicsSystem.instance.collisionMatrix[g];
            newSB.filterData.word0 = g;
            newSB.filterData.word1 = m;
          }
          return newSB;
        }
        get isStatic() {
          return this._isStatic;
        }
        get isKinematic() {
          return this._isKinematic;
        }
        get isDynamic() {
          return !this._isStatic && !this._isKinematic;
        }
        get wrappedBody() {
          return this._wrappedBody;
        }
        get filterData() {
          return this._filterData;
        }
        get isInScene() {
          return this._index !== -1;
        }
        get impl() {
          this._initActor();
          return this.isStatic ? this._staticActor : this._dynamicActor;
        }
        set reference(v) {
          this._ref = v ? this._ref + 1 : this._ref - 1;
          if (this._ref === 0) {
            this.destroy();
          }
        }
        set enabled(v) {
          if (v) {
            if (this._index < 0) {
              this._index = this.wrappedWorld.wrappedBodies.length;
              this.wrappedWorld.addActor(this);
            }
          } else if (this._index >= 0) {
            const ws = this.wrappedShapes;
            const wb = this.wrappedBody;
            const isRemove = ws.length === 0 && wb == null || ws.length === 0 && wb != null && !wb.isEnabled;
            if (isRemove) {
              this._index = -1;
              this.clearForces();
              this.clearVelocity();
              this.wrappedWorld.removeActor(this);
            }
          }
        }
        constructor(node, wrappedWorld) {
          this.id = void 0;
          this.node = void 0;
          this.wrappedWorld = void 0;
          this.wrappedShapes = [];
          this.wrappedJoints0 = [];
          this.wrappedJoints1 = [];
          this._index = -1;
          this._ref = 0;
          this._isStatic = false;
          this._isKinematic = false;
          this._dynamicActor = void 0;
          this._staticActor = void 0;
          this._wrappedBody = null;
          this._filterData = void 0;
          this.id = PhysXSharedBody.idCounter++;
          this.node = node;
          this.wrappedWorld = wrappedWorld;
          this._filterData = {
            word0: 1,
            word1: 1,
            word2: 1,
            word3: 0
          };
        }
        _initActor() {
          const st = this._isStatic;
          const wb = this.wrappedBody;
          if (wb) {
            const rb = wb.rigidBody;
            if (rb.type === ERigidBodyType.STATIC) {
              this._isStatic = true;
              this._isKinematic = false;
              this._initStaticActor();
            } else {
              this._isStatic = false;
              this._initDynamicActor();
            }
          } else {
            this._isStatic = true;
            this._isKinematic = false;
            this._initStaticActor();
          }
          if (st !== this._isStatic) {
            this._switchActor(st);
          }
        }
        _initStaticActor() {
          if (this._staticActor) return;
          const t = getTempTransform(this.node.worldPosition, this.node.worldRotation);
          this._staticActor = PhysXInstance.physics.createRigidStatic(t);
          this._staticActor.setActorFlag(PX.ActorFlag.eVISUALIZATION, true);
          if (this._staticActor.$$) PX.IMPL_PTR[this._staticActor.$$.ptr] = this;
        }
        _initDynamicActor() {
          if (this._dynamicActor) return;
          const t = getTempTransform(this.node.worldPosition, this.node.worldRotation);
          this._dynamicActor = PhysXInstance.physics.createRigidDynamic(t);
          if (this._dynamicActor.$$) PX.IMPL_PTR[this._dynamicActor.$$.ptr] = this;
          const wb = this.wrappedBody;
          if (wb) {
            const rb = wb.rigidBody;
            this._dynamicActor.setMass(rb.mass);
            this._dynamicActor.setActorFlag(PX.ActorFlag.eVISUALIZATION, true);
            this._dynamicActor.setActorFlag(PX.ActorFlag.eDISABLE_GRAVITY, !rb.useGravity);
            this.setLinearDamping(rb.linearDamping);
            this.setAngularDamping(rb.angularDamping);
            this.setRigidBodyFlag(PX.RigidBodyFlag.eKINEMATIC, rb.isKinematic);
            const lf = rb.linearFactor;
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_X, !lf.x);
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_Y, !lf.y);
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_LINEAR_Z, !lf.z);
            const af = rb.angularFactor;
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_X, !af.x);
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_Y, !af.y);
            this._dynamicActor.setRigidDynamicLockFlag(PX.RigidDynamicLockFlag.eLOCK_ANGULAR_Z, !af.z);
          }
        }
        _switchActor(isStaticBefore) {
          if (!this._staticActor || !this._dynamicActor) return;
          const a0 = isStaticBefore ? this._staticActor : this._dynamicActor;
          const a1 = !isStaticBefore ? this._staticActor : this._dynamicActor;
          if (this._index >= 0) {
            this.wrappedWorld.scene.removeActor(a0, false);
            addActorToScene(this.wrappedWorld.scene, a1);
          }
          for (let i = 0; i < this.wrappedShapes.length; i++) {
            const ws = this.wrappedShapes[i];
            a0.detachShape(ws.impl, false);
            a1.attachShape(ws.impl);
          }
          if (isStaticBefore) {
            const da = this._dynamicActor;
            setMassAndUpdateInertia(da, this._wrappedBody.rigidBody.mass);
          }
        }
        addShape(ws) {
          const index = this.wrappedShapes.indexOf(ws);
          if (index < 0) {
            ws.setIndex(this.wrappedShapes.length);
            ws.updateFilterData(this._filterData);
            this.impl.attachShape(ws.impl);
            this.wrappedShapes.push(ws);
            if (!ws.collider.isTrigger) {
              if (this.isDynamic) setMassAndUpdateInertia(this.impl, this._wrappedBody.rigidBody.mass);
            }
          }
        }
        removeShape(ws) {
          const index = this.wrappedShapes.indexOf(ws);
          if (index >= 0) {
            ws.setIndex(-1);
            this.impl.detachShape(ws.impl, true);
            js.array.fastRemoveAt(this.wrappedShapes, index);
            if (!ws.collider.isTrigger) {
              if (this.isDynamic) setMassAndUpdateInertia(this.impl, this._wrappedBody.rigidBody.mass);
            }
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
        setLinearDamping(linDamp) {
          if (!this._dynamicActor) return;
          const dt = PhysicsSystem.instance.fixedTimeStep;
          this._dynamicActor.setLinearDamping((1 - (1 - linDamp) ** dt) / dt);
        }
        setAngularDamping(angDamp) {
          if (!this._dynamicActor) return;
          const dt = PhysicsSystem.instance.fixedTimeStep;
          this._dynamicActor.setAngularDamping((1 - (1 - angDamp) ** dt) / dt);
        }
        setMass(v) {
          if (v <= 0) return;
          if (!this.isDynamic) return;
          setMassAndUpdateInertia(this.impl, v);
        }
        setType(v) {
          this._initActor();
          if (this.isStatic) return;
          switch (v) {
            case ERigidBodyType.DYNAMIC:
              this.setRigidBodyFlag(PX.RigidBodyFlag.eKINEMATIC, false);
              break;
            case ERigidBodyType.KINEMATIC:
            default:
              this.setRigidBodyFlag(PX.RigidBodyFlag.eKINEMATIC, true);
              break;
          }
        }
        setRigidBodyFlag(v, b) {
          if (v === PX.RigidBodyFlag.eKINEMATIC) this._isKinematic = b;
          this.impl.setRigidBodyFlag(v, b);
        }
        syncSceneToPhysics() {
          const node = this.node;
          if (node.hasChangedFlags) {
            if (node.hasChangedFlags & TransformBit.SCALE) this.syncScale();
            if (this._isKinematic) {
              const trans = getTempTransform(node.worldPosition, node.worldRotation);
              this.impl.setKinematicTarget(trans);
            } else {
              const trans = getJsTransform(node.worldPosition, node.worldRotation);
              this.impl.setGlobalPose(trans, true);
            }
          }
        }
        syncSceneWithCheck() {
          const node = this.node;
          if (node.hasChangedFlags) {
            if (node.hasChangedFlags & TransformBit.SCALE) this.syncScale();
            const wp = node.worldPosition;
            const wr = node.worldRotation;
            const pose = this.impl.getGlobalPose();
            const dontUpdate = physXEqualsCocosVec3(pose, wp) && physXEqualsCocosQuat(pose, wr);
            if (!dontUpdate) {
              if (this._isKinematic) {
                const trans = getTempTransform(node.worldPosition, node.worldRotation);
                this.impl.setKinematicTarget(trans);
              } else {
                const trans = getJsTransform(node.worldPosition, node.worldRotation);
                this.impl.setGlobalPose(trans, true);
              }
            }
          }
        }
        syncPhysicsToScene() {
          if (!this.isDynamic) return;
          syncNoneStaticToSceneIfWaking(this._dynamicActor, this.node);
        }
        syncScale() {
          for (let i = 0; i < this.wrappedShapes.length; i++) {
            this.wrappedShapes[i].updateScale();
          }
          for (let i = 0; i < this.wrappedJoints0.length; i++) {
            this.wrappedJoints0[i].updateScale0();
          }
          for (let i = 0; i < this.wrappedJoints1.length; i++) {
            this.wrappedJoints1[i].updateScale1();
          }
        }
        setGroup(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word0 = v;
          this.updateFilterData();
        }
        getGroup() {
          return this._filterData.word0;
        }
        addGroup(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word0 |= v;
          this.updateFilterData();
        }
        removeGroup(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word0 &= ~v;
          this.updateFilterData();
        }
        setMask(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word1 = v;
          this.updateFilterData();
        }
        getMask() {
          return this._filterData.word1;
        }
        addMask(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word1 |= v;
          this.updateFilterData();
        }
        removeMask(v) {
          v >>>= 0; //convert to unsigned int(32bit) for physx
          this._filterData.word1 &= ~v;
          this.updateFilterData();
        }
        updateFilterData() {
          for (let i = 0; i < this.wrappedShapes.length; i++) {
            this.wrappedShapes[i].updateFilterData(this._filterData);
          }
        }
        clearForces() {
          if (this._isStatic || this._isKinematic) return;
          this.impl.clearForce(PX.ForceMode.eFORCE); // this.impl.clearForce(PX.ForceMode.eACCELERATION);
          this.impl.clearForce(PX.ForceMode.eIMPULSE); // this.impl.clearForce(PX.ForceMode.eVELOCITY_CHANGE);
          this.impl.clearTorque(PX.ForceMode.eFORCE);
          this.impl.clearTorque(PX.ForceMode.eIMPULSE);
        }
        clearVelocity() {
          if (this._isStatic || this._isKinematic) return;
          this.impl.setLinearVelocity(Vec3.ZERO, false);
          this.impl.setAngularVelocity(Vec3.ZERO, false);
        }
        destroy() {
          if (this._dynamicActor) {
            if (this._dynamicActor.$$) {
              PX.IMPL_PTR[this._dynamicActor.$$.ptr] = null;
              delete PX.IMPL_PTR[this._dynamicActor.$$.ptr];
            }
            this._dynamicActor.release();
            this._dynamicActor = null;
          }
          if (this._staticActor) {
            if (this._staticActor.$$) {
              PX.IMPL_PTR[this._staticActor.$$.ptr] = null;
              delete PX.IMPL_PTR[this._staticActor.$$.ptr];
            }
            this._staticActor.release();
            this._staticActor = null;
          }
          PhysXSharedBody.sharedBodesMap.delete(this.node.uuid);
        }
      });
      _PhysXSharedBody = PhysXSharedBody;
      PhysXSharedBody.idCounter = 0;
      PhysXSharedBody.sharedBodesMap = new Map();
    }
  };
});