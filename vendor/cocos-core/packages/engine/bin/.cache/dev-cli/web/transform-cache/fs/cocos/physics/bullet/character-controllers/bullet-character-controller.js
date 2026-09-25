System.register("q-bundled:///fs/cocos/physics/bullet/character-controllers/bullet-character-controller.js", ["../../../core/index.js", "../../framework/index.js", "../bullet-cache.js", "../bullet-utils.js", "../instantiated.js", "../../framework/physics-enum.js", "../shapes/bullet-shape.js", "../../../core/utils/misc.js", "../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var error, Vec3, PhysicsSystem, BulletCache, bullet2CocosVec3, cocos2BulletVec3, bt, btCache, EBulletType, PhysicsGroup, BulletShape, degreesToRadians, TransformBit, BulletCharacterController, v3_0, v3_1, v3_2;
  _export("BulletCharacterController", void 0);
  return {
    setters: [function (_coreIndexJs) {
      error = _coreIndexJs.error;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
    }, function (_bulletUtilsJs) {
      bullet2CocosVec3 = _bulletUtilsJs.bullet2CocosVec3;
      cocos2BulletVec3 = _bulletUtilsJs.cocos2BulletVec3;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      btCache = _instantiatedJs.btCache;
      EBulletType = _instantiatedJs.EBulletType;
    }, function (_frameworkPhysicsEnumJs) {
      PhysicsGroup = _frameworkPhysicsEnumJs.PhysicsGroup;
    }, function (_shapesBulletShapeJs) {
      BulletShape = _shapesBulletShapeJs.BulletShape;
    }, function (_coreUtilsMiscJs) {
      degreesToRadians = _coreUtilsMiscJs.degreesToRadians;
    }, function (_sceneGraphIndexJs) {
      TransformBit = _sceneGraphIndexJs.TransformBit;
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
      v3_0 = new Vec3(0, 0, 0);
      v3_1 = new Vec3(0, 0, 0);
      v3_2 = new Vec3(0, 0, 0);
      /** @mangle */
      _export("BulletCharacterController", BulletCharacterController = class BulletCharacterController {
        get isEnabled() {
          return this._isEnabled;
        }
        get impl() {
          return this._impl;
        }
        get characterController() {
          return this._comp;
        }
        constructor() {
          this.wrappedWorld = void 0;
          this._isEnabled = false;
          this._impl = 0;
          //btCapsuleCharacterController
          this._comp = null;
          this._btCollisionFlags = 0;
          //: btControllerCollisionFlag
          this._word3 = 0;
          this._dirty = false;
          this._collisionFilterGroup = PhysicsGroup.DEFAULT;
          this._collisionFilterMask = -1;
          this.id = BulletCharacterController.idCounter++;
          this.wrappedWorld = PhysicsSystem.instance.physicsWorld;
        }

        // virtual
        onComponentSet() {
          //empty
        }
        updateScale() {
          //empty
        }
        initialize(comp) {
          this._comp = comp;
          const group = this._comp.group;
          const mask = PhysicsSystem.instance.collisionMatrix[group];
          this._collisionFilterGroup = group;
          this._collisionFilterMask = mask;
          this.onComponentSet();
          if (this._impl === 0) {
            error('[Physics]: Initialize BulletCharacterController failed');
            return false;
          } else {
            return true;
          }
        }
        setWrapper() {
          BulletCache.setWrapper(this._impl, btCache.CCT_CACHE_NAME, this);
          const cctCollisionShapeImpl = bt.CharacterController_getCollisionShape(this.impl);
          BulletCache.setWrapper(cctCollisionShapeImpl, btCache.CCT_CACHE_NAME, this);
        }
        onEnable() {
          this._isEnabled = true;
          if (!this._impl) {
            this.onComponentSet();
          }
          this.setDetectCollisions(false);
          this.setOverlapRecovery(true);
          PhysicsSystem.instance.physicsWorld.addCCT(this);
          this.setWrapper();
        }
        onDisable() {
          this._isEnabled = false;
          this.wrappedWorld.removeCCT(this);
          this.onDestroy();
        }
        onDestroy() {
          //(this._comp as any) = null;
          bt._safe_delete(this._impl, EBulletType.EBulletTypeCharacterController);
          BulletCache.delWrapper(this._impl, btCache.CCT_CACHE_NAME);
          this._impl = 0;
          //(this.wrappedWorld as any) = null;
        }
        onLoad() {
          //empty
        }
        getPosition(out) {
          if (!this._impl) return;
          bullet2CocosVec3(out, bt.CharacterController_getPosition(this.impl));
        }
        setPosition(value) {
          if (!this._impl) return;
          cocos2BulletVec3(bt.CharacterController_getPosition(this.impl), value);
          this.syncPhysicsToScene();
        }
        setContactOffset(value) {
          if (!this._impl) return;
          bt.CharacterController_setContactOffset(this._impl, value);
        }
        setStepOffset(value) {
          if (!this._impl) return;
          bt.CharacterController_setStepOffset(this._impl, value);
        }
        setSlopeLimit(value) {
          if (!this._impl) return;
          bt.CharacterController_setSlopeLimit(this._impl, degreesToRadians(value));
        }
        setDetectCollisions(value) {
          if (!this._impl) return;
          bt.CharacterController_setCollision(this.impl, value);
        }
        setOverlapRecovery(value) {
          if (!this._impl) return;
          bt.CharacterController_setOverlapRecovery(this.impl, value);
        }
        onGround() {
          return (this._btCollisionFlags & 1 << 2) > 0; //btControllerCollisionFlag::Enum::BULLET_CONTROLLER_COLLISION_DOWN
        }
        syncSceneToPhysics() {
          const node = this.characterController.node;
          if (node.hasChangedFlags) {
            if (node.hasChangedFlags & TransformBit.SCALE) this.syncScale();
            //teleport
            if (node.hasChangedFlags & TransformBit.POSITION) {
              Vec3.add(v3_0, node.worldPosition, this.scaledCenter);
              this.setPosition(v3_0);
            }
          }
        }
        syncPhysicsToScene() {
          this.getPosition(v3_0);
          v3_0.subtract(this.scaledCenter);
          this._comp.node.setWorldPosition(v3_0);
        }
        syncScale() {
          this.updateScale();
        }
        get scaledCenter() {
          Vec3.multiply(v3_1, this._comp.center, this._comp.node.worldScale);
          return v3_1;
        }
        move(movement, minDist, elapsedTime) {
          if (!this._isEnabled) {
            return;
          }
          const movementBT = BulletCache.instance.BT_V3_0;
          bt.Vec3_set(movementBT, movement.x, movement.y, movement.z);
          this._btCollisionFlags = bt.CharacterController_move(this.impl, movementBT, minDist, elapsedTime);
        }
        setGroup(v) {
          if (v !== this._collisionFilterGroup) {
            this._collisionFilterGroup = v;
            this._dirty = true;
          }
        }
        getGroup() {
          return this._collisionFilterGroup;
        }
        addGroup(v) {
          this._collisionFilterGroup |= v;
          this._dirty = true;
        }
        removeGroup(v) {
          this._collisionFilterGroup &= ~v;
          this._dirty = true;
        }
        setMask(v) {
          if (v !== this._collisionFilterMask) {
            this._collisionFilterMask = v;
            this._dirty = true;
          }
        }
        getMask() {
          return this._collisionFilterMask;
        }
        addMask(v) {
          this._collisionFilterMask |= v;
          this._dirty = true;
        }
        removeMask(v) {
          this._collisionFilterMask &= ~v;
          this._dirty = true;
        }
        updateEventListener() {
          this.wrappedWorld.updateNeedEmitCCTEvents(this.characterController.needCollisionEvent);
        }

        // update group and mask by re-adding cct to physics world
        updateDirty() {
          if (this._dirty) {
            PhysicsSystem.instance.physicsWorld.removeCCT(this);
            PhysicsSystem.instance.physicsWorld.addCCT(this);
            this._dirty = false;
          }
        }
        onShapeHitExt(hit) {
          const shapePtr = bt.ControllerShapeHit_getHitShape(hit);
          const bulletWorld = PhysicsSystem.instance.physicsWorld;
          //use characterController impl and shape impl pair as key
          let item = bulletWorld.cctShapeEventDic.get(this.impl, shapePtr);
          const worldPos = new Vec3();
          bullet2CocosVec3(worldPos, bt.ControllerHit_getHitWorldPos(hit));
          const worldNormal = new Vec3();
          bullet2CocosVec3(worldNormal, bt.ControllerHit_getHitWorldNormal(hit));
          const motionDir = new Vec3();
          bullet2CocosVec3(motionDir, bt.ControllerHit_getHitMotionDir(hit));
          const motionLength = bt.ControllerHit_getHitMotionLength(hit);
          const s = BulletCache.getWrapper(shapePtr, BulletShape.TYPE);
          if (s) {
            item = bulletWorld.cctShapeEventDic.set(this.impl, shapePtr, {
              BulletCharacterController: this,
              BulletShape: s,
              worldPos,
              worldNormal,
              motionDir,
              motionLength
            });
          }
        }
      });
      BulletCharacterController.idCounter = 0;
    }
  };
});