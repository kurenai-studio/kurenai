System.register("q-bundled:///fs/cocos/physics/cannon/shapes/cannon-shape.js", ["@cocos/cannon", "../../../core/index.js", "../../utils/util.js", "../cannon-util.js", "../../framework/physics-system.js"], function (_export, _context) {
  "use strict";

  var CANNON, Vec3, Quat, getWrap, setWrap, commitShapeUpdates, PhysicsSystem, CannonShape, TriggerEventObject, cannonQuat_0, cannonVec3_0, cannonVec3_1;
  _export("CannonShape", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
    }, function (_utilsUtilJs) {
      getWrap = _utilsUtilJs.getWrap;
      setWrap = _utilsUtilJs.setWrap;
    }, function (_cannonUtilJs) {
      commitShapeUpdates = _cannonUtilJs.commitShapeUpdates;
    }, function (_frameworkPhysicsSystemJs) {
      PhysicsSystem = _frameworkPhysicsSystemJs.PhysicsSystem;
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
      TriggerEventObject = {
        type: 'onTriggerEnter',
        selfCollider: null,
        otherCollider: null,
        impl: null
      };
      cannonQuat_0 = new CANNON.Quaternion();
      cannonVec3_0 = new CANNON.Vec3();
      cannonVec3_1 = new CANNON.Vec3();
      _export("CannonShape", CannonShape = class CannonShape {
        constructor() {
          this._collider = void 0;
          this._shape = void 0;
          this._offset = new CANNON.Vec3();
          this._orient = new CANNON.Quaternion();
          this._index = -1;
          this._sharedBody = void 0;
          this.onTriggerListener = this._onTrigger.bind(this);
          this._isBinding = false;
        }
        updateEventListener() {}
        get impl() {
          return this._shape;
        }
        get collider() {
          return this._collider;
        }
        get attachedRigidBody() {
          if (this._sharedBody.wrappedBody) {
            return this._sharedBody.wrappedBody.rigidBody;
          }
          return null;
        }
        get sharedBody() {
          return this._sharedBody;
        }
        setMaterial(mat) {
          const mat1 = mat == null ? PhysicsSystem.instance.defaultMaterial : mat;
          if (CannonShape.idToMaterial[mat1.id] == null) {
            CannonShape.idToMaterial[mat1.id] = new CANNON.Material(mat1.id);
          }
          this._shape.material = CannonShape.idToMaterial[mat1.id];
          const smat = this._shape.material;
          smat.friction = mat1.friction;
          smat.restitution = mat1.restitution;
          const coef = CANNON.CC_CONFIG.correctInelastic;
          smat.correctInelastic = smat.restitution === 0 ? coef : 0;
        }
        setAsTrigger(v) {
          this._shape.collisionResponse = !v;
          if (this._index >= 0) {
            this._body.updateHasTrigger();
          }
        }
        setCenter(v) {
          this._setCenter(v);
          if (this._index >= 0) {
            commitShapeUpdates(this._body);
          }
        }
        setAttachedBody(v) {
          if (v) {
            if (this._sharedBody) {
              if (this._sharedBody.wrappedBody === v.body) return;
              this._sharedBody.reference = false;
            }
            this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(v.node);
            this._sharedBody.reference = true;
          } else {
            if (this._sharedBody) {
              this._sharedBody.reference = false;
            }
            this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._collider.node);
            this._sharedBody.reference = true;
          }
        }
        getAABB(v) {
          Quat.copy(cannonQuat_0, this._collider.node.worldRotation);
          this._shape.calculateWorldAABB(CANNON.Vec3.ZERO, cannonQuat_0, cannonVec3_0, cannonVec3_1);
          Vec3.subtract(v.halfExtents, cannonVec3_1, cannonVec3_0);
          Vec3.multiplyScalar(v.halfExtents, v.halfExtents, 0.5);
          Vec3.add(v.center, this._collider.node.worldPosition, this._collider.center);
        }
        getBoundingSphere(v) {
          v.radius = this._shape.boundingSphereRadius;
          Vec3.add(v.center, this._collider.node.worldPosition, this._collider.center);
        }
        get _body() {
          return this._sharedBody.body;
        }
        /** LIFECYCLE */

        initialize(comp) {
          this._collider = comp;
          this._isBinding = true;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._collider.node);
          this._sharedBody.reference = true;
          this.onComponentSet();
          setWrap(this._shape, this);
          this._shape.addEventListener('cc-trigger', this.onTriggerListener);
        }

        // virtual
        onComponentSet() {}
        onLoad() {
          this.setMaterial(this._collider.sharedMaterial);
          this.setCenter(this._collider.center);
          this.setAsTrigger(this._collider.isTrigger);
        }
        onEnable() {
          this._sharedBody.addShape(this);
          this._sharedBody.enabled = true;
        }
        onDisable() {
          this._sharedBody.removeShape(this);
          this._sharedBody.enabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          this._shape.removeEventListener('cc-trigger', this.onTriggerListener);
          delete CANNON.World.idToShapeMap[this._shape.id];
          this._sharedBody = null;
          setWrap(this._shape, null);
          this._offset = null;
          this._orient = null;
          this._shape = null;
          this._collider = null;
          this.onTriggerListener = null;
        }

        /** INTERFACE */

        /** group */
        getGroup() {
          return this._body.collisionFilterGroup;
        }
        setGroup(v) {
          this._body.collisionFilterGroup = v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }
        addGroup(v) {
          this._body.collisionFilterGroup |= v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }
        removeGroup(v) {
          this._body.collisionFilterGroup &= ~v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }

        /** mask */
        getMask() {
          return this._body.collisionFilterMask;
        }
        setMask(v) {
          this._body.collisionFilterMask = v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }
        addMask(v) {
          this._body.collisionFilterMask |= v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }
        removeMask(v) {
          this._body.collisionFilterMask &= ~v;
          if (!this._body.isAwake()) this._body.wakeUp();
        }

        /**
         * change scale will recalculate center & size \
         * size handle by child class
         * @param scale
         */
        setScale(scale) {
          this._setCenter(this._collider.center);
        }
        setIndex(index) {
          this._index = index;
        }
        setOffsetAndOrient(offset, orient) {
          Vec3.copy(offset, this._offset);
          Quat.copy(orient, this._orient);
          this._offset = offset;
          this._orient = orient;
        }
        _setCenter(v) {
          const lpos = this._offset;
          Vec3.subtract(lpos, this._sharedBody.node.worldPosition, this._collider.node.worldPosition);
          Vec3.add(lpos, lpos, v);
          Vec3.multiply(lpos, lpos, this._collider.node.worldScale);
        }
        _onTrigger(event) {
          TriggerEventObject.type = event.event;
          const self = getWrap(event.selfShape);
          const other = getWrap(event.otherShape);
          if (self && self.collider.needTriggerEvent) {
            TriggerEventObject.selfCollider = self.collider;
            TriggerEventObject.otherCollider = other ? other.collider : null;
            TriggerEventObject.impl = event;
            this._collider.emit(TriggerEventObject.type, TriggerEventObject);
          }
        }
      });
      CannonShape.idToMaterial = {};
    }
  };
});