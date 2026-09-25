System.register("q-bundled:///fs/cocos/physics/framework/components/colliders/collider.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "../../../../core/index.js", "../rigid-body.js", "../../assets/physics-material.js", "../../../../scene-graph/index.js", "../../physics-enum.js", "../../physics-selector.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, displayName, readOnly, type, serializable, EDITOR, Eventify, Vec3, error, geometry, RigidBody, PhysicsMaterial, Component, EColliderType, EAxisDirection, selector, createShape, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _Collider, Collider;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function findAttachedBody(node) {
    const rb = node.getComponent(RigidBody);
    if (rb && rb.isValid) {
      return rb;
    }
    return null;
    // if (node.parent == null || node.parent == node.scene) return null;
    // return findAttachedBody(node.parent);
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      displayName = _coreDataDecoratorsIndexJs.displayName;
      readOnly = _coreDataDecoratorsIndexJs.readOnly;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreIndexJs) {
      Eventify = _coreIndexJs.Eventify;
      Vec3 = _coreIndexJs.Vec3;
      error = _coreIndexJs.error;
      geometry = _coreIndexJs.geometry;
    }, function (_rigidBodyJs) {
      RigidBody = _rigidBodyJs.RigidBody;
    }, function (_assetsPhysicsMaterialJs) {
      PhysicsMaterial = _assetsPhysicsMaterialJs.PhysicsMaterial;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_physicsEnumJs) {
      EColliderType = _physicsEnumJs.EColliderType;
      EAxisDirection = _physicsEnumJs.EAxisDirection;
    }, function (_physicsSelectorJs) {
      selector = _physicsSelectorJs.selector;
      createShape = _physicsSelectorJs.createShape;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-namespace */
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
      /**
       * @en
       * Base class for colliders.
       * @zh
       * 碰撞器的基类。
       */
      _export("Collider", Collider = (_dec = ccclass('cc.Collider'), _dec2 = type(RigidBody), _dec3 = displayName('Attached'), _dec4 = displayOrder(-2), _dec5 = tooltip('i18n:physics3d.collider.attached'), _dec6 = type(PhysicsMaterial), _dec7 = displayName('Material'), _dec8 = displayOrder(-1), _dec9 = tooltip('i18n:physics3d.collider.sharedMaterial'), _dec0 = displayOrder(0), _dec1 = tooltip('i18n:physics3d.collider.isTrigger'), _dec10 = type(Vec3), _dec11 = displayOrder(1), _dec12 = tooltip('i18n:physics3d.collider.center'), _dec13 = type(PhysicsMaterial), _dec(_class = (_class2 = (_Collider = class Collider extends Eventify(Component) {
        /// PUBLIC PROPERTY GETTER\SETTER ///

        /**
         * @en
         * Get the rigid body component to which the collider is bound, possibly null.
         * @zh
         * 获取碰撞器所绑定的刚体组件，可能为空。
         */
        get attachedRigidBody() {
          return findAttachedBody(this.node);
          // return this._attachedRigidBody;
        }

        /**
         * @en
         * Gets or sets the physical material for this collider.
         * @zh
         * 获取或设置此碰撞器的物理材质。
         */
        get sharedMaterial() {
          return this._material;
        }
        set sharedMaterial(value) {
          if (EDITOR) {
            this._material = value;
          } else {
            this.material = value;
          }
        }

        /**
         * @en
         * Gets or sets the physics material for this collider, which in Shared state will generate a new instance.
         * @zh
         * 获取或设置此碰撞器的物理材质，共享状态下获取将会生成新的实例。
         */
        get material() {
          if (this._isSharedMaterial && this._material) {
            this._material.off(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
            this._material = this._material.clone();
            this._material.on(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
            this._isSharedMaterial = false;
          }
          return this._material;
        }
        set material(value) {
          if (this._shape) {
            if (value && this._material) {
              if (this._material.id !== value.id) {
                this._material.off(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
                value.on(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
                this._isSharedMaterial = false;
                this._material = value;
              }
            } else if (value && !this._material) {
              value.on(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
              this._material = value;
            } else if (!value && this._material) {
              this._material.off(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
              this._material = value;
            }
            this._updateMaterial();
          } else {
            this._material = value;
          }
        }

        /**
         * @en
         * Gets or sets the collider is trigger, this will be always trigger if using builtin.
         * @zh
         * 获取或设置碰撞器是否为触发器。(builtin 中无论真假都为触发器)
         */
        get isTrigger() {
          return this._isTrigger;
        }
        set isTrigger(value) {
          this._isTrigger = value;
          if (this._shape) {
            this._shape.setAsTrigger(this._isTrigger);
          }
        }

        /**
         * @en
         * Gets or sets the center of the collider, in local space.
         * @zh
         * 在本地空间中，获取或设置碰撞器的中心点。
         */
        get center() {
          return this._center;
        }
        set center(value) {
          Vec3.copy(this._center, value);
          if (this._shape) {
            this._shape.setCenter(this._center);
          }
        }

        /**
         * @en
         * Gets the wrapper object, through which the lowLevel instance can be accessed.
         * @zh
         * 获取封装对象，通过此对象可以访问到底层实例。
         */
        get shape() {
          return this._shape;
        }
        get worldBounds() {
          if (this._aabb == null) this._aabb = new geometry.AABB();
          if (this._shape) this._shape.getAABB(this._aabb);
          return this._aabb;
        }
        get boundingSphere() {
          if (this._boundingSphere == null) this._boundingSphere = new geometry.Sphere();
          if (this._shape) this._shape.getBoundingSphere(this._boundingSphere);
          return this._boundingSphere;
        }
        get needTriggerEvent() {
          return this._needTriggerEvent;
        }
        get needCollisionEvent() {
          return this._needCollisionEvent;
        }
        get _isInitialized() {
          const r = this._shape === null;
          if (r) {
            error('[Physics]: This component has not been call onLoad yet, please make sure the node has been added to the scene.');
          }
          return !r;
        }
        constructor(type) {
          super();
          this.type = void 0;
          /// PROTECTED PROPERTY ///
          this._shape = null;
          this._aabb = null;
          this._boundingSphere = null;
          this._isSharedMaterial = true;
          this._needTriggerEvent = false;
          this._needCollisionEvent = false;
          // protected _attachedRigidBody: RigidBody | null = null;
          _initializerDefineProperty(this, "_material", _descriptor, this);
          _initializerDefineProperty(this, "_isTrigger", _descriptor2, this);
          _initializerDefineProperty(this, "_center", _descriptor3, this);
          this.type = type;
        }

        /// EVENT INTERFACE ///

        /**
         * @en
         * Registers callbacks associated with triggered or collision events.
         * @zh
         * 注册触发或碰撞事件相关的回调。
         * @param type - The event type, onTriggerEnter|onTriggerStay|onTriggerExit|onCollisionEnter|onCollisionStay|onCollisionExit;
         * @param callback - The event callback, signature:`(event?:ICollisionEvent|ITriggerEvent)=>void`.
         * @param target - The event callback target.
         */
        on(type, callback, target, once) {
          const ret = super.on(type, callback, target, once);
          this._updateNeedEvent(type);
          return ret;
        }

        /**
         * @en
         * Unregisters callbacks associated with trigger or collision events that have been registered.
         * @zh
         * 取消已经注册的触发或碰撞事件相关的回调。
         * @param type - The event type, onTriggerEnter|onTriggerStay|onTriggerExit|onCollisionEnter|onCollisionStay|onCollisionExit;
         * @param callback - The event callback, signature:`(event?:ICollisionEvent|ITriggerEvent)=>void`.
         * @param target - The event callback target.
         */
        off(type, callback, target) {
          super.off(type, callback, target);
          this._updateNeedEvent();
        }

        /**
         * @en
         * Registers a callback associated with a trigger or collision event, which is automatically unregistered once executed.
         * @zh
         * 注册触发或碰撞事件相关的回调，执行一次后会自动取消注册。
         * @param type - The event type, onTriggerEnter|onTriggerStay|onTriggerExit|onCollisionEnter|onCollisionStay|onCollisionExit;
         * @param callback - The event callback, signature:`(event?:ICollisionEvent|ITriggerEvent)=>void`.
         * @param target - The event callback target.
         */
        once(type, callback, target) {
          // TODO: callback invoker now is a entity, after `once` will not calling the upper `off`.
          const ret = super.once(type, callback, target);
          this._updateNeedEvent(type);
          return ret;
        }

        /**
         * @en
         * Removes all registered events of the specified target or type.
         * @zh
         * 移除所有指定目标或类型的注册事件。
         * @param typeOrTarget - The event type or target.
         */
        removeAll(typeOrTarget) {
          super.removeAll(typeOrTarget);
          this._updateNeedEvent();
        }

        /// GROUP MASK ///

        /**
         * @en
         * Gets the group value.
         * @zh
         * 获取分组值。
         * @returns @zh 分组值，为 32 位整数，范围为 [2^0, 2^31] @en Group value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        getGroup() {
          if (this._isInitialized) {
            return this._shape.getGroup();
          }
          return 0;
        }

        /**
         * @en
         * Sets the group value.
         * @zh
         * 设置分组值。
         * @param v @zh 分组值，为 32 位整数，范围为 [2^0, 2^31] @en Group value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        setGroup(v) {
          if (this._isInitialized) {
            this._shape.setGroup(v);
          }
        }

        /**
         * @en
         * Add a grouping value to fill in the group you want to join.
         * @zh
         * 添加分组值，可填要加入的 group。
         * @param v @zh 分组值，为 32 位整数，范围为 [2^0, 2^31] @en Group value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        addGroup(v) {
          if (this._isInitialized) {
            this._shape.addGroup(v);
          }
        }

        /**
         * @en
         * Subtract the grouping value to fill in the group to be removed.
         * @zh
         * 减去分组值，可填要移除的 group。
         * @param v @zh 分组值，为 32 位整数，范围为 [2^0, 2^31] @en Group value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        removeGroup(v) {
          if (this._isInitialized) {
            this._shape.removeGroup(v);
          }
        }

        /**
         * @en
         * Gets the mask value.
         * @zh
         * 获取掩码值。
         * @returns @zh 掩码值，为 32 位整数，范围为 [2^0, 2^31] @en Mask value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        getMask() {
          if (this._isInitialized) {
            return this._shape.getMask();
          }
          return 0;
        }

        /**
         * @en
         * Sets the mask value.
         * @zh
         * 设置掩码值。
         * @param v @zh 掩码值，为 32 位整数，范围为 [2^0, 2^31] @en Mask value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        setMask(v) {
          if (this._isInitialized) {
            this._shape.setMask(v);
          }
        }

        /**
         * @en
         * Add mask values to fill in groups that need to be checked.
         * @zh
         * 添加掩码值，可填入需要检查的 group。
         * @param v @zh 掩码值，为 32 位整数，范围为 [2^0, 2^31] @en Mask value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        addMask(v) {
          if (this._isInitialized) {
            this._shape.addMask(v);
          }
        }

        /**
         * @en
         * Subtract the mask value to fill in the group that does not need to be checked.
         * @zh
         * 减去掩码值，可填入不需要检查的 group。
         * @param v @zh 掩码值，为 32 位整数，范围为 [2^0, 2^31] @en Mask value which is a 32-bits integer, the range is [2^0, 2^31]
         */
        removeMask(v) {
          if (this._isInitialized) {
            this._shape.removeMask(v);
          }
        }

        /// COMPONENT LIFECYCLE ///

        onLoad() {
          if (!selector.runInEditor) return;
          this.sharedMaterial = this._material;
          this._shape = createShape(this.type);
          this._shape.initialize(this);
          this._shape.onLoad();
        }
        onEnable() {
          if (this._shape) {
            this._shape.onEnable();
          }
        }
        onDisable() {
          if (this._shape) {
            this._shape.onDisable();
          }
        }
        onDestroy() {
          if (this._shape) {
            this._needTriggerEvent = false;
            this._needCollisionEvent = false;
            this._shape.updateEventListener();
            if (this._material) this._material.off(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
            this._shape.onDestroy();
          }
          if (this._boundingSphere) this._boundingSphere.destroy();
        }
        _updateMaterial() {
          if (this._shape) this._shape.setMaterial(this._material);
        }
        _updateNeedEvent(type) {
          if (this.isValid) {
            if (type !== undefined) {
              if (type === 'onCollisionEnter' || type === 'onCollisionStay' || type === 'onCollisionExit') {
                this._needCollisionEvent = true;
              }
              if (type === 'onTriggerEnter' || type === 'onTriggerStay' || type === 'onTriggerExit' || type === 'onControllerTriggerEnter' || type === 'onControllerTriggerStay' || type === 'onControllerTriggerExit') {
                this._needTriggerEvent = true;
              }
            } else {
              if (!(this.hasEventListener('onTriggerEnter') || this.hasEventListener('onTriggerStay') || this.hasEventListener('onTriggerExit') || this.hasEventListener('onControllerTriggerEnter') || this.hasEventListener('onControllerTriggerStay') || this.hasEventListener('onControllerTriggerExit'))) {
                this._needTriggerEvent = false;
              }
              if (!(this.hasEventListener('onCollisionEnter') || this.hasEventListener('onCollisionStay') || this.hasEventListener('onCollisionExit'))) {
                this._needCollisionEvent = false;
              }
            }
            if (this._shape) this._shape.updateEventListener();
          }
        }
      }, _Collider.Type = EColliderType, _Collider.Axis = EAxisDirection, _Collider), _applyDecoratedDescriptor(_class2.prototype, "attachedRigidBody", [_dec2, readOnly, _dec3, _dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "attachedRigidBody"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sharedMaterial", [_dec6, _dec7, _dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "sharedMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isTrigger", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "isTrigger"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "center", [_dec10, _dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "center"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_material", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_isTrigger", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_center", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _class2)) || _class));
    }
  };
});