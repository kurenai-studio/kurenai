System.register("q-bundled:///fs/cocos/physics/bullet/bullet-shared-body.js", ["../../scene-graph/node-enum.js", "./bullet-utils.js", "./bullet-enum.js", "./bullet-cache.js", "../framework/index.js", "../framework/physics-enum.js", "../../core/index.js", "./instantiated.js", "./bullet-env.js"], function (_export, _context) {
  "use strict";

  var TransformBit, bullet2CocosVec3, cocos2BulletQuat, cocos2BulletVec3, bullet2CocosQuat, btCollisionFlags, btCollisionObjectStates, EBtSharedBodyDirty, CC_V3_0, CC_QUAT_0, BulletCache, PhysicsSystem, ERigidBodyType, PhysicsGroup, js, bt, btCache, EBulletType, importFunc, BulletSharedBody, _BulletSharedBody, v3_0, quat_0, IDCounter;
  _export("BulletSharedBody", void 0);
  return {
    setters: [function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_bulletUtilsJs) {
      bullet2CocosVec3 = _bulletUtilsJs.bullet2CocosVec3;
      cocos2BulletQuat = _bulletUtilsJs.cocos2BulletQuat;
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
      bullet2CocosQuat = _bulletUtilsJs.bullet2CocosQuat;
    }, function (_bulletEnumJs) {
      btCollisionFlags = _bulletEnumJs.btCollisionFlags;
      btCollisionObjectStates = _bulletEnumJs.btCollisionObjectStates;
      EBtSharedBodyDirty = _bulletEnumJs.EBtSharedBodyDirty;
    }, function (_bulletCacheJs) {
      CC_V3_0 = _bulletCacheJs.CC_V3_0;
      CC_QUAT_0 = _bulletCacheJs.CC_QUAT_0;
      BulletCache = _bulletCacheJs.BulletCache;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_frameworkPhysicsEnumJs) {
      ERigidBodyType = _frameworkPhysicsEnumJs.ERigidBodyType;
      PhysicsGroup = _frameworkPhysicsEnumJs.PhysicsGroup;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      btCache = _instantiatedJs.btCache;
      EBulletType = _instantiatedJs.EBulletType;
    }, function (_bulletEnvJs) {
      importFunc = _bulletEnvJs.importFunc;
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
      quat_0 = CC_QUAT_0;
      IDCounter = 0;
      /**
       * shared object, node : shared = 1 : 1
       * body for static \ dynamic \ kinematic (collider)
       * ghost for trigger
       * @mangle
       */
      _export("BulletSharedBody", BulletSharedBody = class BulletSharedBody {
        static getSharedBody(node, wrappedWorld, wrappedBody) {
          const key = node.uuid;
          let newSB;
          if (BulletSharedBody.sharedBodesMap.has(key)) {
            newSB = BulletSharedBody.sharedBodesMap.get(key);
          } else {
            newSB = new BulletSharedBody(node, wrappedWorld);
            const g = PhysicsGroup.DEFAULT;
            const m = PhysicsSystem.instance.collisionMatrix[g];
            newSB._collisionFilterGroup = g;
            newSB._collisionFilterMask = m;
            BulletSharedBody.sharedBodesMap.set(node.uuid, newSB);
          }
          if (wrappedBody) {
            newSB._wrappedBody = wrappedBody;
            const g = wrappedBody.rigidBody.group;
            const m = PhysicsSystem.instance.collisionMatrix[g];
            newSB._collisionFilterGroup = g;
            newSB._collisionFilterMask = m;
          }
          return newSB;
        }
        get wrappedBody() {
          return this._wrappedBody;
        }
        get bodyCompoundShape() {
          return this.bodyStruct.compound;
        }
        get ghostCompoundShape() {
          return this.ghostStruct.compound;
        }
        get body() {
          return this.bodyStruct.body;
        }
        get ghost() {
          return this.ghostStruct.ghost;
        }
        get collisionFilterGroup() {
          return this._collisionFilterGroup;
        }
        set collisionFilterGroup(v) {
          if (v !== this._collisionFilterGroup) {
            this._collisionFilterGroup = v;
            this.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
            this.dirty |= EBtSharedBodyDirty.GHOST_RE_ADD;
          }
        }
        get collisionFilterMask() {
          return this._collisionFilterMask;
        }
        set collisionFilterMask(v) {
          if (v !== this._collisionFilterMask) {
            this._collisionFilterMask = v;
            this.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
            this.dirty |= EBtSharedBodyDirty.GHOST_RE_ADD;
          }
        }
        get bodyStruct() {
          this._instantiateBodyStruct();
          return this._bodyStruct;
        }
        get ghostStruct() {
          this._instantiateGhostStruct();
          return this._ghostStruct;
        }
        /**
         * add or remove from world \
         * add, if enable \
         * remove, if disable & shapes.length == 0 & wrappedBody disable
         */
        set bodyEnabled(v) {
          if (v) {
            if (this.bodyIndex < 0) {
              // add to world only if it is a dynamic body or having shapes.
              if (this.bodyStruct.wrappedShapes.length === 0) {
                if (!this.wrappedBody) return;
                if (!this.wrappedBody.rigidBody.isDynamic) return;
              }
              this.bodyIndex = this.wrappedWorld.bodies.length;
              this.wrappedWorld.addSharedBody(this);
              this.syncInitialBody();
            }
          } else if (this.bodyIndex >= 0) {
            const isRemoveBody = this.bodyStruct.wrappedShapes.length === 0 && this.wrappedBody == null || this.bodyStruct.wrappedShapes.length === 0 && this.wrappedBody != null && !this.wrappedBody.isEnabled || this.bodyStruct.wrappedShapes.length === 0 && this.wrappedBody != null && !this.wrappedBody.rigidBody.enabledInHierarchy;
            if (isRemoveBody) {
              const impl = this.body;
              const constraints = this.wrappedWorld.constraints;
              constraints.forEach(worldConstraint => {
                var _worldConstraint$cons;
                if (((_worldConstraint$cons = worldConstraint.constraint.attachedBody) == null || (_worldConstraint$cons = _worldConstraint$cons.body) == null ? void 0 : _worldConstraint$cons.impl) === impl) {
                  this.wrappedWorld.removeConstraint(worldConstraint);
                }
              });
              bt.RigidBody_clearState(this.body); // clear velocity etc.
              this.bodyIndex = -1;
              this.wrappedWorld.removeSharedBody(this);
            }
          }
        }
        set ghostEnabled(v) {
          if (v) {
            if (this.ghostIndex < 0 && this.ghostStruct.wrappedShapes.length > 0) {
              this.ghostIndex = 1;
              this.wrappedWorld.addGhostObject(this);
              this.syncInitialGhost();
            }
          } else if (this.ghostIndex >= 0) {
            /** remove trigger */
            const isRemoveGhost = this.ghostStruct.wrappedShapes.length === 0 && this.ghost;
            if (isRemoveGhost) {
              this.ghostIndex = -1;
              this.wrappedWorld.removeGhostObject(this);
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
          this.id = void 0;
          this.node = void 0;
          this.wrappedWorld = void 0;
          this.wrappedJoints0 = [];
          this.wrappedJoints1 = [];
          this.dirty = 0;
          this._collisionFilterGroup = PhysicsSystem.PhysicsGroup.DEFAULT;
          this._collisionFilterMask = -1;
          this.ref = 0;
          this.bodyIndex = -1;
          this.ghostIndex = -1;
          this._bodyStruct = void 0;
          this._ghostStruct = void 0;
          this._wrappedBody = null;
          this.id = BulletSharedBody.idCounter++;
          this.wrappedWorld = wrappedWorld;
          this.node = node;
        }
        _instantiateBodyStruct() {
          if (this._bodyStruct) return;
          let mass = 0;
          if (this._wrappedBody && this._wrappedBody.rigidBody.enabled && this._wrappedBody.rigidBody.isDynamic) {
            mass = this._wrappedBody.rigidBody.mass;
          }
          const trans = BulletCache.instance.BT_TRANSFORM_0;
          const quat = BulletCache.instance.BT_QUAT_0;
          cocos2BulletVec3(bt.Transform_getOrigin(trans), this.node.worldPosition);
          cocos2BulletQuat(quat, this.node.worldRotation);
          bt.Transform_setRotation(trans, quat);
          const motionState = bt.MotionState.implement(importFunc).$$.ptr;
          bt.ccMotionState_setup(motionState, this.id, trans);
          const body = bt.RigidBody_new(mass, motionState);
          const sleepTd = PhysicsSystem.instance.sleepThreshold;
          bt.RigidBody_setSleepingThresholds(body, sleepTd, sleepTd);
          this._bodyStruct = {
            id: IDCounter++,
            body,
            motionState,
            compound: bt.ccCompoundShape_new(),
            wrappedShapes: [],
            useCompound: false
          };
          BulletCache.setWrapper(this.id, btCache.BODY_CACHE_NAME, this);
          if (this._ghostStruct) bt.CollisionObject_setIgnoreCollisionCheck(this.ghost, this.body, true);
          if (this._wrappedBody) this.setBodyType(this._wrappedBody.rigidBody.type);
        }
        _instantiateGhostStruct() {
          if (this._ghostStruct) return;
          const ghost = bt.CollisionObject_new();
          const ghostShape = bt.ccCompoundShape_new();
          bt.CollisionObject_setCollisionShape(ghost, ghostShape);
          bt.CollisionObject_setCollisionFlags(ghost, btCollisionFlags.CF_STATIC_OBJECT | btCollisionFlags.CF_NO_CONTACT_RESPONSE);
          this._ghostStruct = {
            id: IDCounter++,
            ghost,
            compound: ghostShape,
            wrappedShapes: []
          };
          if (this._bodyStruct) bt.CollisionObject_setIgnoreCollisionCheck(this.body, this.ghost, true);
          if (this._wrappedBody) this.setGhostType(this._wrappedBody.rigidBody.type);
        }
        setType(v) {
          this.setBodyType(v);
          this.setGhostType(v);
        }
        setBodyType(v) {
          if (this._bodyStruct && this._wrappedBody) {
            const body = this._bodyStruct.body;
            const wrap = this._wrappedBody;
            const com = wrap.rigidBody;
            let m_bcf = bt.CollisionObject_getCollisionFlags(body);
            const localInertia = BulletCache.instance.BT_V3_0;
            switch (v) {
              case ERigidBodyType.DYNAMIC:
                m_bcf &= ~btCollisionFlags.CF_KINEMATIC_OBJECT;
                m_bcf &= ~btCollisionFlags.CF_STATIC_OBJECT;
                bt.CollisionObject_setCollisionFlags(body, m_bcf);
                wrap.setMass(com.mass);
                wrap.useGravity(com.useGravity);
                wrap.setAllowSleep(com.allowSleep);
                break;
              case ERigidBodyType.KINEMATIC:
                bt.Vec3_set(localInertia, 0, 0, 0);
                bt.RigidBody_setMassProps(body, 0, localInertia);
                m_bcf |= btCollisionFlags.CF_KINEMATIC_OBJECT;
                m_bcf &= ~btCollisionFlags.CF_STATIC_OBJECT;
                bt.CollisionObject_setCollisionFlags(body, m_bcf);
                bt.CollisionObject_forceActivationState(body, btCollisionObjectStates.DISABLE_DEACTIVATION);
                break;
              case ERigidBodyType.STATIC:
              default:
                bt.Vec3_set(localInertia, 0, 0, 0);
                bt.RigidBody_setMassProps(body, 0, localInertia);
                m_bcf |= btCollisionFlags.CF_STATIC_OBJECT;
                m_bcf &= ~btCollisionFlags.CF_KINEMATIC_OBJECT;
                bt.CollisionObject_setCollisionFlags(body, m_bcf);
                bt.CollisionObject_forceActivationState(body, btCollisionObjectStates.ISLAND_SLEEPING);
                break;
            }
            this.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
          }
        }
        setGhostType(v) {
          if (this._ghostStruct) {
            const ghost = this._ghostStruct.ghost;
            let m_gcf = bt.CollisionObject_getCollisionFlags(ghost);
            switch (v) {
              case ERigidBodyType.DYNAMIC:
              case ERigidBodyType.KINEMATIC:
                m_gcf &= ~btCollisionFlags.CF_STATIC_OBJECT;
                m_gcf |= btCollisionFlags.CF_KINEMATIC_OBJECT;
                bt.CollisionObject_setCollisionFlags(ghost, m_gcf);
                bt.CollisionObject_forceActivationState(ghost, btCollisionObjectStates.DISABLE_DEACTIVATION);
                break;
              case ERigidBodyType.STATIC:
              default:
                m_gcf &= ~btCollisionFlags.CF_KINEMATIC_OBJECT;
                m_gcf |= btCollisionFlags.CF_STATIC_OBJECT;
                bt.CollisionObject_setCollisionFlags(ghost, m_gcf);
                bt.CollisionObject_forceActivationState(ghost, btCollisionObjectStates.ISLAND_SLEEPING);
                break;
            }
            this.dirty |= EBtSharedBodyDirty.GHOST_RE_ADD;
          }
        }
        addShape(v, isTrigger) {
          function switchShape(that, shape) {
            bt.CollisionObject_setCollisionShape(that.body, shape);
            that.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
            if (that._wrappedBody && that._wrappedBody.isEnabled) {
              that._wrappedBody.setMass(that._wrappedBody.rigidBody.mass);
            }
          }
          if (isTrigger) {
            const index = this.ghostStruct.wrappedShapes.indexOf(v);
            if (index < 0) {
              this.ghostStruct.wrappedShapes.push(v);
              v.setCompound(this.ghostCompoundShape);
              this.ghostEnabled = true;
            }
          } else {
            const index = this.bodyStruct.wrappedShapes.indexOf(v);
            if (index < 0) {
              this.bodyStruct.wrappedShapes.push(v);
              if (this.bodyStruct.useCompound) {
                v.setCompound(this.bodyCompoundShape);
              } else {
                const l = this.bodyStruct.wrappedShapes.length;
                if (l === 1 && !v.needCompound()) {
                  switchShape(this, v.impl);
                } else {
                  this.bodyStruct.useCompound = true;
                  for (let i = 0; i < l; i++) {
                    const childShape = this.bodyStruct.wrappedShapes[i];
                    childShape.setCompound(this.bodyCompoundShape);
                  }
                  switchShape(this, this.bodyStruct.compound);
                }
              }
              this.bodyEnabled = true;
            }
          }
        }
        removeShape(v, isTrigger) {
          if (isTrigger) {
            const index = this.ghostStruct.wrappedShapes.indexOf(v);
            if (index >= 0) {
              js.array.fastRemoveAt(this.ghostStruct.wrappedShapes, index);
              v.setCompound(0);
              this.ghostEnabled = false;
            }
          } else {
            const index = this.bodyStruct.wrappedShapes.indexOf(v);
            if (index >= 0) {
              if (this.bodyStruct.useCompound) {
                v.setCompound(0);
              } else {
                bt.CollisionObject_setCollisionShape(this.body, bt.EmptyShape_static());
              }
              bt.CollisionObject_activate(this.body, true);
              this.dirty |= EBtSharedBodyDirty.BODY_RE_ADD;
              js.array.fastRemoveAt(this.bodyStruct.wrappedShapes, index);
              this.bodyEnabled = false;
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
        updateDirty() {
          if (this.dirty) {
            if (this.bodyIndex >= 0 && this.dirty & EBtSharedBodyDirty.BODY_RE_ADD) this.updateBodyByReAdd();
            if (this.ghostIndex >= 0 && this.dirty & EBtSharedBodyDirty.GHOST_RE_ADD) this.updateGhostByReAdd();
            this.dirty = 0;
          }
        }
        syncSceneToPhysics() {
          if (this.node.hasChangedFlags) {
            const bt_quat = BulletCache.instance.BT_QUAT_0;
            const bt_transform = bt.CollisionObject_getWorldTransform(this.body);
            cocos2BulletQuat(bt_quat, this.node.worldRotation);
            cocos2BulletVec3(bt.Transform_getOrigin(bt_transform), this.node.worldPosition);
            bt.Transform_setRotation(bt_transform, bt_quat);
            if (this.node.hasChangedFlags & TransformBit.SCALE) {
              this.syncBodyScale();
            }
            if (bt.CollisionObject_isKinematicObject(this.body)) {
              // Kinematic objects must be updated using motion state
              const ms = bt.RigidBody_getMotionState(this.body);
              if (ms) bt.MotionState_setWorldTransform(ms, bt_transform);
            } else if (this.isBodySleeping()) bt.CollisionObject_activate(this.body, false);
          }
        }
        syncPhysicsToScene() {
          if (bt.CollisionObject_isStaticOrKinematicObject(this.body)) return;
          this.syncPhysicsToGraphics();
        }
        syncPhysicsToGraphics() {
          if (this.isBodySleeping()) return;
          const bt_quat = BulletCache.instance.BT_QUAT_0;
          const bt_transform = BulletCache.instance.BT_TRANSFORM_0;
          bt.RigidBody_getWorldTransform(this.body, bt_transform);
          const originPosPtr = bt.Transform_getRotationAndOrigin(bt_transform, bt_quat);
          this.node.worldRotation = bullet2CocosQuat(quat_0, bt_quat);
          this.node.worldPosition = bullet2CocosVec3(v3_0, originPosPtr);

          // sync node to ghost
          if (this._ghostStruct) {
            const bt_transform1 = bt.CollisionObject_getWorldTransform(this.ghost);
            cocos2BulletVec3(bt.Transform_getOrigin(bt_transform1), this.node.worldPosition);
            cocos2BulletQuat(bt_quat, this.node.worldRotation);
            bt.Transform_setRotation(bt_transform1, bt_quat);
          }
        }
        syncSceneToGhost() {
          if (this.node.hasChangedFlags) {
            const bt_quat = BulletCache.instance.BT_QUAT_0;
            const bt_transform = bt.CollisionObject_getWorldTransform(this.ghost);
            cocos2BulletVec3(bt.Transform_getOrigin(bt_transform), this.node.worldPosition);
            cocos2BulletQuat(bt_quat, this.node.worldRotation);
            bt.Transform_setRotation(bt_transform, bt_quat);
            if (this.node.hasChangedFlags & TransformBit.SCALE) this.syncGhostScale();
            bt.CollisionObject_activate(this.ghost, false);
          }
        }
        syncInitialBody() {
          const bt_quat = BulletCache.instance.BT_QUAT_0;
          const bt_transform = bt.CollisionObject_getWorldTransform(this.body);
          cocos2BulletVec3(bt.Transform_getOrigin(bt_transform), this.node.worldPosition);
          cocos2BulletQuat(bt_quat, this.node.worldRotation);
          bt.Transform_setRotation(bt_transform, bt_quat);
          this.syncBodyScale();
          bt.CollisionObject_activate(this.body, false);
        }
        syncInitialGhost() {
          const bt_quat = BulletCache.instance.BT_QUAT_0;
          const bt_transform = bt.CollisionObject_getWorldTransform(this.ghost);
          cocos2BulletVec3(bt.Transform_getOrigin(bt_transform), this.node.worldPosition);
          cocos2BulletQuat(bt_quat, this.node.worldRotation);
          bt.Transform_setRotation(bt_transform, bt_quat);
          this.syncGhostScale();
          bt.CollisionObject_activate(this.body, false);
        }
        syncBodyScale() {
          for (let i = 0; i < this.bodyStruct.wrappedShapes.length; i++) {
            this.bodyStruct.wrappedShapes[i].updateScale();
          }
          for (let i = 0; i < this.wrappedJoints0.length; i++) {
            this.wrappedJoints0[i].updateScale0();
          }
          for (let i = 0; i < this.wrappedJoints1.length; i++) {
            this.wrappedJoints1[i].updateScale1();
          }
        }
        syncGhostScale() {
          for (let i = 0; i < this.ghostStruct.wrappedShapes.length; i++) {
            this.ghostStruct.wrappedShapes[i].updateScale();
          }
        }

        /**
         * see: https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=9&t=5312&p=19094&hilit=how+to+change+group+mask#p19097
         */
        updateBodyByReAdd() {
          if (this.bodyIndex >= 0) {
            this.wrappedWorld.removeSharedBody(this);
            this.bodyIndex = this.wrappedWorld.bodies.length;
            this.wrappedWorld.addSharedBody(this);
          }
        }
        updateGhostByReAdd() {
          if (this.ghostIndex >= 0) {
            this.wrappedWorld.removeGhostObject(this);
            this.ghostIndex = this.wrappedWorld.ghosts.length;
            this.wrappedWorld.addGhostObject(this);
          }
        }
        destroy() {
          BulletSharedBody.sharedBodesMap.delete(this.node.uuid);
          this.node = null;
          this.wrappedWorld = null;
          if (this._bodyStruct) {
            const bodyStruct = this._bodyStruct;
            BulletCache.delWrapper(this.id, btCache.BODY_CACHE_NAME);
            bt._safe_delete(bodyStruct.motionState, EBulletType.EBulletTypeMotionState);
            bt._safe_delete(bodyStruct.compound, EBulletType.EBulletTypeCollisionShape);
            bt._safe_delete(bodyStruct.body, EBulletType.EBulletTypeCollisionObject);
            this._bodyStruct = null;
          }
          if (this._ghostStruct) {
            const ghostStruct = this._ghostStruct;
            bt._safe_delete(ghostStruct.compound, EBulletType.EBulletTypeCollisionShape);
            bt._safe_delete(ghostStruct.ghost, EBulletType.EBulletTypeCollisionObject);
            this._ghostStruct = null;
          }
        }
        isBodySleeping() {
          return bt.CollisionObject_isSleeping(this.body);
        }
      });
      _BulletSharedBody = BulletSharedBody;
      BulletSharedBody.idCounter = 0;
      BulletSharedBody.sharedBodesMap = new Map();
    }
  };
});