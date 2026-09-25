System.register("q-bundled:///fs/cocos/physics/physx/shapes/physx-shape.js", ["../../../core/index.js", "../../framework/index.js", "../physx-adapter.js", "../physx-enum.js", "../physx-instance.js"], function (_export, _context) {
  "use strict";

  var Quat, Vec3, geometry, PhysicsSystem, addReference, getShapeFlags, getShapeMaterials, getShapeWorldBounds, getTempTransform, PX, removeReference, _trans, EFilterDataWord3, PhysXInstance, PhysXShape, EPhysXShapeType;
  _export("PhysXShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_physxAdapterJs) {
      addReference = _physxAdapterJs.addReference;
      getShapeFlags = _physxAdapterJs.getShapeFlags;
      getShapeMaterials = _physxAdapterJs.getShapeMaterials;
      getShapeWorldBounds = _physxAdapterJs.getShapeWorldBounds;
      getTempTransform = _physxAdapterJs.getTempTransform;
      PX = _physxAdapterJs.PX;
      removeReference = _physxAdapterJs.removeReference;
      _trans = _physxAdapterJs._trans;
    }, function (_physxEnumJs) {
      EFilterDataWord3 = _physxEnumJs.EFilterDataWord3;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
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
      _export("EPhysXShapeType", EPhysXShapeType = /*#__PURE__*/function (EPhysXShapeType) {
        EPhysXShapeType[EPhysXShapeType["SPHERE"] = 0] = "SPHERE";
        EPhysXShapeType[EPhysXShapeType["BOX"] = 1] = "BOX";
        EPhysXShapeType[EPhysXShapeType["CAPSULE"] = 2] = "CAPSULE";
        EPhysXShapeType[EPhysXShapeType["CYLINDER"] = 3] = "CYLINDER";
        EPhysXShapeType[EPhysXShapeType["CONE"] = 4] = "CONE";
        EPhysXShapeType[EPhysXShapeType["PLANE"] = 5] = "PLANE";
        EPhysXShapeType[EPhysXShapeType["TERRAIN"] = 6] = "TERRAIN";
        EPhysXShapeType[EPhysXShapeType["MESH"] = 7] = "MESH";
        return EPhysXShapeType;
      }({}));
      /** @mangle */
      _export("PhysXShape", PhysXShape = class PhysXShape {
        static get MESH_SCALE() {
          if (!this._MESH_SCALE) {
            this._MESH_SCALE = new PX.MeshScale(Vec3.ZERO, Quat.IDENTITY);
          }
          return this._MESH_SCALE;
        }
        get impl() {
          return this._impl;
        }
        get collider() {
          return this._collider;
        }
        get attachedRigidBody() {
          return null;
        }
        constructor(type) {
          this.id = void 0;
          this.type = void 0;
          this._impl = null;
          this._collider = null;
          this._flags = void 0;
          this._sharedBody = void 0;
          this._rotation = new Quat(0, 0, 0, 1);
          this._index = -1;
          this._word3 = 0;
          this._isEnabled = false;
          this.type = type;
          this.id = PhysXShape.idCounter++;
        }
        initialize(v) {
          this._collider = v;
          this._flags = getShapeFlags(v.isTrigger);
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(v.node);
          this._sharedBody.reference = true;
          this.onComponentSet();
          addReference(this, this._impl);
        }
        setIndex(v) {
          this._index = v;
        }

        // virtual
        onComponentSet() {}

        // virtual
        updateScale() {}
        onLoad() {
          this.setMaterial(this._collider.sharedMaterial);
          this.setCenter(this._collider.center);
        }
        onEnable() {
          this.addToBody();
          this._isEnabled = true;
          this._sharedBody.enabled = true;
        }
        onDisable() {
          this.removeFromBody();
          this._isEnabled = false;
          this._sharedBody.enabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          if (this._impl) {
            removeReference(this, this._impl);
            this._impl.release();
            this._impl = null;
          }
          this._flags = null;
          this._collider = null;
        }
        setMaterial(v) {
          const mat = this.getSharedMaterial(v);
          this._impl.setMaterials(getShapeMaterials(mat));
        }
        getSharedMaterial(v) {
          const v1 = v == null ? PhysicsSystem.instance.defaultMaterial : v;
          if (!PX.CACHE_MAT[v1.id]) {
            const physics = PhysXInstance.physics;
            const mat = physics.createMaterial(v1.friction, v1.friction, v1.restitution);
            mat.setFrictionCombineMode(PX.CombineMode.eMULTIPLY);
            mat.setRestitutionCombineMode(PX.CombineMode.eMULTIPLY);
            PX.CACHE_MAT[v1.id] = mat;
            return mat;
          }
          const mat = PX.CACHE_MAT[v1.id];
          mat.setStaticFriction(v1.friction);
          mat.setDynamicFriction(v1.friction);
          mat.setRestitution(v1.restitution);
          return mat;
        }
        setAsTrigger(v) {
          if (v) {
            this._impl.setFlag(PX.ShapeFlag.eSIMULATION_SHAPE, !v);
            this._impl.setFlag(PX.ShapeFlag.eTRIGGER_SHAPE, v);
          } else {
            this._impl.setFlag(PX.ShapeFlag.eTRIGGER_SHAPE, v);
            this._impl.setFlag(PX.ShapeFlag.eSIMULATION_SHAPE, !v);
          }
          if (this._index >= 0) {
            this._sharedBody.removeShape(this);
            this._sharedBody.addShape(this);
          }
        }
        setCenter(v) {
          const pos = _trans.translation;
          const rot = _trans.rotation;
          Vec3.multiply(pos, v, this._collider.node.worldScale);
          Quat.copy(rot, this._rotation);
          const trans = getTempTransform(pos, rot);
          this._impl.setLocalPose(trans);
        }
        getAABB(v) {
          getShapeWorldBounds(this.impl, this._sharedBody.impl, 1, v);
        }
        getBoundingSphere(v) {
          geometry.AABB.toBoundingSphere(v, this._collider.worldBounds);
        }
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
        updateFilterData(filterData) {
          this._word3 = EFilterDataWord3.DETECT_CONTACT_CCD;
          if (this._collider.needTriggerEvent) {
            this._word3 |= EFilterDataWord3.DETECT_TRIGGER_EVENT;
          }
          if (this._collider.needCollisionEvent) {
            this._word3 |= EFilterDataWord3.DETECT_CONTACT_EVENT | EFilterDataWord3.DETECT_CONTACT_POINT;
          }
          //filterData.word2 = this.id;//useless
          filterData.word3 = this._word3;
          this.setFilerData(filterData);
        }
        updateEventListener() {
          if (this._sharedBody) this.updateFilterData(this._sharedBody.filterData);
        }
        updateByReAdd() {
          if (this._isEnabled) {
            this.removeFromBody();
            this.addToBody();
          }
        }

        // virtual
        setFilerData(filterData) {
          this._impl.setQueryFilterData(filterData);
          this._impl.setSimulationFilterData(filterData);
        }

        // virtual
        addToBody() {
          this._sharedBody.addShape(this);
        }

        // virtual
        removeFromBody() {
          this._sharedBody.removeShape(this);
        }
      });
      PhysXShape._MESH_SCALE = void 0;
      PhysXShape.idCounter = 0;
    }
  };
});