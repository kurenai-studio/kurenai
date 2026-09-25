System.register("q-bundled:///fs/cocos/physics/physx/character-controllers/physx-character-controller.js", ["../../../core/index.js", "../../framework/index.js", "../physx-adapter.js", "../../../core/utils/misc.js", "../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var error, Vec3, PhysicsSystem, getWrapShape, PX, degreesToRadians, TransformBit, PhysXCharacterController, v3_0, v3_1;
  _export("PhysXCharacterController", void 0);
  return {
    setters: [function (_coreIndexJs) {
      error = _coreIndexJs.error;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_physxAdapterJs) {
      getWrapShape = _physxAdapterJs.getWrapShape;
      PX = _physxAdapterJs.PX;
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
      /** @mangle */
      _export("PhysXCharacterController", PhysXCharacterController = class PhysXCharacterController {
        get isEnabled() {
          return this._isEnabled;
        }
        get impl() {
          /* eslint-disable @typescript-eslint/no-unsafe-return */
          return this._impl;
        }
        get characterController() {
          return this._comp;
        }
        get filterData() {
          /* eslint-disable @typescript-eslint/no-unsafe-return */
          return this._filterData;
        }
        get queryFilterCB() {
          /* eslint-disable @typescript-eslint/no-unsafe-return */
          return this._queryFilterCB;
        }
        constructor() {
          this._isEnabled = false;
          this._impl = null;
          this._comp = null;
          this._pxCollisionFlags = 0;
          //: PX.PxControllerCollisionFlags;
          this._filterData = void 0;
          this._queryFilterCB = null;
          this._word3 = 0;
          this._overlapRecovery = true;
          this.id = void 0;
          this.id = PhysXCharacterController.idCounter++;
          this._filterData = {
            word0: 1,
            word1: 1,
            word2: 1,
            word3: 0
          };
        }

        // virtual
        onComponentSet() {}
        create() {}
        updateScale() {}
        initialize(comp) {
          this._comp = comp;
          this._queryFilterCB = PX.PxQueryFilterCallback.implement(PhysXCharacterController.queryCallback);
          const group = this._comp.group;
          this._filterData.word0 = this._comp.group;
          const mask = PhysicsSystem.instance.collisionMatrix[group];
          this._filterData.word1 = mask;
          this.updateFilterData();
          this.onComponentSet();
          if (this._impl == null) {
            error('[Physics]: Initialize PhysXCharacterController Failed');
            return false;
          } else {
            return true;
          }
        }
        onEnable() {
          this._isEnabled = true;
          if (!this._impl) {
            this.onComponentSet();
          }
          this.setDetectCollisions(true);
          this.setOverlapRecovery(true);
          PhysicsSystem.instance.physicsWorld.addCCT(this);
        }
        onDisable() {
          this._isEnabled = false;
          PhysicsSystem.instance.physicsWorld.removeCCT(this);
          this.onDestroy(); //to be optimized
        }
        onLoad() {}
        release() {
          if (this._impl) {
            if (this._impl.$$) {
              PX.IMPL_PTR[this._impl.$$.ptr] = null;
              delete PX.IMPL_PTR[this._impl.$$.ptr];
              const shapePtr = this._impl.getShape().$$.ptr;
              PX.IMPL_PTR[shapePtr] = null;
              delete PX.IMPL_PTR[shapePtr];
            }
            this._impl.release();
            this._impl = null;
          }
        }
        onDestroy() {
          this.release();
        }

        //world position of cct
        getPosition(out) {
          if (!this._impl) return;
          Vec3.copy(out, this._impl.getPosition());
        }
        setPosition(value) {
          if (!this._impl) return;
          this._impl.setPosition(value);
          this.syncPhysicsToScene();
        }
        setContactOffset(value) {
          if (!this._impl) return;
          this._impl.setContactOffset(value);
        }
        setStepOffset(value) {
          if (!this._impl) return;
          this._impl.setStepOffset(value);
        }
        setSlopeLimit(value) {
          if (!this._impl) return;
          this._impl.setSlopeLimit(Math.cos(degreesToRadians(value)));
        }
        setDetectCollisions(value) {
          if (!this._impl) return;
          this._impl.setCollision(value);
        }
        setQuery(value) {
          if (!this._impl) return;
          this._impl.setQuery(value);
        }
        setOverlapRecovery(value) {
          this._overlapRecovery = value;
        }
        onGround() {
          return (this._pxCollisionFlags & 1 << 2) > 0; //PxControllerCollisionFlag::Enum::eCOLLISION_DOWN
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

        // eNONE = 0,   //!< the query should ignore this shape
        // eTOUCH = 1,  //!< a hit on the shape touches the intersection geometry of the query but does not block it
        // eBLOCK = 2   //!< a hit on the shape blocks the query (does not block overlap queries)

        move(movement, minDist, elapsedTime) {
          if (!this._isEnabled) {
            return;
          }
          PhysicsSystem.instance.physicsWorld.controllerManager.setOverlapRecoveryModule(this._overlapRecovery);
          this._pxCollisionFlags = this._impl.move(movement, minDist, elapsedTime, this.filterData, this.queryFilterCB);
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
        updateEventListener() {
          this.updateFilterData();
        }
        updateFilterData() {
          if (!this._impl) return;
          // this._impl.setQueryFilterData(filterData);//set inside move()
          this._impl.setSimulationFilterData(this.filterData);
        }
        setImpl(impl) {
          this._impl = impl;
          this.updateFilterData();
        }
      });
      PhysXCharacterController.idCounter = 0;
      PhysXCharacterController.queryCallback = {
        preFilter(filterData, shape, _actor, _out) {
          const pxShape = getWrapShape(shape);
          if (!pxShape) {
            return PX.QueryHitType.eNONE;
          }
          const collider = pxShape.collider;
          if (!(filterData.word0 & collider.getMask()) || !(filterData.word1 & collider.getGroup())) {
            return PX.QueryHitType.eNONE;
          }

          // Ignore trigger shape
          // this is done in physx::Cct::findTouchedGeometry
          // Ubi (EA) : Discarding Triggers
          // const shapeFlags = shape.getFlags();
          // if (shapeFlags.isSet(PX.ShapeFlag.eTRIGGER_SHAPE)) {
          //     return PX.QueryHitType.eNONE;
          // }

          return PX.QueryHitType.eBLOCK;
        }
      };
    }
  };
});