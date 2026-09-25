System.register("q-bundled:///fs/cocos/physics-2d/framework/components/rigid-body-2d.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../physics-types.js", "../physics-selector.js", "../../../physics/framework/physics-enum.js", "../../../scene-graph/index.js", "../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, _decorator, Vec2, CCBoolean, CCFloat, ERigidBody2DType, createRigidBody, PhysicsGroup, Component, help, serializable, tooltip, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, type, menu, ccclass, RigidBody2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
      Vec2 = _coreIndexJs.Vec2;
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
    }, function (_physicsTypesJs) {
      ERigidBody2DType = _physicsTypesJs.ERigidBody2DType;
    }, function (_physicsSelectorJs) {
      createRigidBody = _physicsSelectorJs.createRigidBody;
    }, function (_physicsFrameworkPhysicsEnumJs) {
      PhysicsGroup = _physicsFrameworkPhysicsEnumJs.PhysicsGroup;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_coreDataDecoratorsIndexJs) {
      help = _coreDataDecoratorsIndexJs.help;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
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
      ({
        type,
        menu,
        ccclass
      } = _decorator);
      _export("RigidBody2D", RigidBody2D = (_dec = ccclass('cc.RigidBody2D'), _dec2 = help('i18n:cc.RigidBody2D'), _dec3 = menu('Physics2D/RigidBody2D'), _dec4 = type(PhysicsGroup), _dec5 = tooltip('i18n:physics2d.rigidbody.group'), _dec6 = tooltip('i18n:physics2d.rigidbody.enabledContactListener'), _dec7 = tooltip('i18n:physics2d.rigidbody.bullet'), _dec8 = type(ERigidBody2DType), _dec9 = tooltip('i18n:physics2d.rigidbody.type'), _dec0 = type(CCBoolean), _dec1 = tooltip('i18n:physics2d.rigidbody.allowSleep'), _dec10 = type(CCFloat), _dec11 = tooltip('i18n:physics2d.rigidbody.gravityScale'), _dec12 = type(CCFloat), _dec13 = tooltip('i18n:physics2d.rigidbody.linearDamping'), _dec14 = type(CCFloat), _dec15 = tooltip('i18n:physics2d.rigidbody.angularDamping'), _dec16 = type(Vec2), _dec17 = tooltip('i18n:physics2d.rigidbody.linearVelocity'), _dec18 = type(CCFloat), _dec19 = tooltip('i18n:physics2d.rigidbody.angularVelocity'), _dec20 = type(CCBoolean), _dec21 = tooltip('i18n:physics2d.rigidbody.fixedRotation'), _dec22 = tooltip('i18n:physics2d.rigidbody.awakeOnLoad'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class RigidBody2D extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "enabledContactListener", _descriptor, this);
          /**
           * @en
           * Is this a fast moving body that should be prevented from tunneling through
           * other moving bodies?
           * Note :
           * - All bodies are prevented from tunneling through kinematic and static bodies. This setting is only considered on dynamic bodies.
           * - You should use this flag sparingly since it increases processing time.
           * @zh
           * 这个刚体是否是一个快速移动的刚体，并且需要禁止穿过其他快速移动的刚体？
           * 需要注意的是 :
           *  - 所有刚体都被禁止从 运动刚体 和 静态刚体 中穿过。此选项只关注于 动态刚体。
           *  - 应该尽量少的使用此选项，因为它会增加程序处理时间。
           */
          _initializerDefineProperty(this, "bullet", _descriptor2, this);
          /**
           * @en
           * Whether to wake up this rigid body during initialization.
           * @zh
           * 是否在初始化时唤醒此刚体。
           */
          _initializerDefineProperty(this, "awakeOnLoad", _descriptor3, this);
          this._body = null;
          _initializerDefineProperty(this, "_group", _descriptor4, this);
          _initializerDefineProperty(this, "_type", _descriptor5, this);
          _initializerDefineProperty(this, "_allowSleep", _descriptor6, this);
          _initializerDefineProperty(this, "_gravityScale", _descriptor7, this);
          _initializerDefineProperty(this, "_linearDamping", _descriptor8, this);
          _initializerDefineProperty(this, "_angularDamping", _descriptor9, this);
          _initializerDefineProperty(this, "_linearVelocity", _descriptor0, this);
          _initializerDefineProperty(this, "_angularVelocity", _descriptor1, this);
          _initializerDefineProperty(this, "_fixedRotation", _descriptor10, this);
        }
        /**
         * @en
         * Gets or sets the group of the rigid body.
         * @zh
         * 获取或设置分组。
         */
        get group() {
          return this._group;
        }
        set group(v) {
          this._group = v;
        }
        /**
         * @en
         * Rigidbody type : Static, Kinematic, Dynamic or Animated.
         * @zh
         * 刚体类型： Static, Kinematic, Dynamic or Animated.
         */
        get type() {
          return this._type;
        }
        set type(v) {
          this._type = v;
          if (this._body) {
            if (v === ERigidBody2DType.Animated) {
              this._body.setType(ERigidBody2DType.Kinematic);
            } else {
              this._body.setType(v);
            }
          }
        }

        /**
         * @en
         * Set this flag to false if this body should never fall asleep.
         * Note that this increases CPU usage.
         * @zh
         * 如果此刚体永远都不应该进入睡眠，那么设置这个属性为 false。
         * 需要注意这将使 CPU 占用率提高。
         */
        get allowSleep() {
          return this._allowSleep;
        }
        set allowSleep(v) {
          this._allowSleep = v;
          if (this._body) {
            this._body.setAllowSleep(v);
          }
        }

        /**
         * @en
         * Scale the gravity applied to this body.
         * @zh
         * 缩放应用在此刚体上的重力值。
         */
        get gravityScale() {
          return this._gravityScale;
        }
        set gravityScale(v) {
          this._gravityScale = v;
          if (this._body) {
            this._body.setGravityScale(v);
          }
        }

        /**
         * @en
         * Linear damping is use to reduce the linear velocity.
         * The damping parameter can be larger than 1, but the damping effect becomes sensitive to the
         * time step when the damping parameter is large.
         * @zh
         * Linear damping 用于衰减刚体的线性速度。衰减系数可以大于 1，但是当衰减系数比较大的时候，衰减的效果会变得比较敏感。
         */
        get linearDamping() {
          return this._linearDamping;
        }
        set linearDamping(v) {
          this._linearDamping = v;
          if (this._body) {
            this._body.setLinearDamping(v);
          }
        }

        /**
         * @en
         * Angular damping is use to reduce the angular velocity. The damping parameter
         * can be larger than 1 but the damping effect becomes sensitive to the
         * time step when the damping parameter is large.
         * @zh
         * Angular damping 用于衰减刚体的角速度。衰减系数可以大于 1，但是当衰减系数比较大的时候，衰减的效果会变得比较敏感。
         */
        get angularDamping() {
          return this._angularDamping;
        }
        set angularDamping(v) {
          this._angularDamping = v;
          if (this._body) {
            this._body.setAngularDamping(v);
          }
        }

        /**
         * @en
         * The linear velocity of the body's origin in world co-ordinates.
         * @zh
         * 刚体在世界坐标下的线性速度。
         */
        get linearVelocity() {
          if (this._body) {
            this._body.getLinearVelocity(this._linearVelocity);
          }
          return this._linearVelocity;
        }
        set linearVelocity(v) {
          this._linearVelocity = v;
          if (this._body) {
            this._body.setLinearVelocity(v);
          }
        }

        /**
         * @en
         * The angular velocity of the body in radians/second.
         * @zh
         * 刚体的角速度，单位是 弧度/秒。
         */
        get angularVelocity() {
          if (this._body) {
            this._angularVelocity = this._body.getAngularVelocity();
          }
          return this._angularVelocity;
        }
        set angularVelocity(v) {
          this._angularVelocity = v;
          if (this._body) {
            this._body.setAngularVelocity(v);
          }
        }

        /**
         * @en
         * Should this body be prevented from rotating?
         * @zh
         * 是否禁止此刚体进行旋转。
         */
        get fixedRotation() {
          return this._fixedRotation;
        }
        set fixedRotation(v) {
          this._fixedRotation = v;
          if (this._body) {
            this._body.setFixedRotation(v);
          }
        }
        // /**
        //  * @en
        //  * Set the active state of the body. An inactive body is not
        //  * simulated and cannot be collided with or woken up.
        //  * If body is active, all fixtures will be added to the
        //  * broad-phase.
        //  * If body is inactive, all fixtures will be removed from
        //  * the broad-phase and all contacts will be destroyed.
        //  * Fixtures on an inactive body are implicitly inactive and will
        //  * not participate in collisions, ray-casts, or queries.
        //  * Joints connected to an inactive body are implicitly inactive.
        //  * @zh
        //  * 设置刚体的激活状态。一个非激活状态下的刚体是不会被模拟和碰撞的，不管它是否处于睡眠状态下。
        //  * 如果刚体处于激活状态下，所有夹具会被添加到 粗测阶段（broad-phase）。
        //  * 如果刚体处于非激活状态下，所有夹具会被从 粗测阶段（broad-phase）中移除。
        //  * 在非激活状态下的夹具不会参与到碰撞，射线，或者查找中
        //  * 链接到非激活状态下刚体的关节也是非激活的。
        //  * @property {Boolean} active
        //  * @default true
        //  */
        // get active () {
        //     if (this._body) {
        //         return this._body.isActive();
        //     }
        //     return false;
        // }
        // set active (v) {
        //     if (this._body) {
        //         this._body.setActive(v);
        //     }
        // }

        /// RigidBody methods ///

        /**
         * @en
         * Whether the rigid body is awake.
         * @zh
         * 获取刚体是否正在休眠。
         */
        isAwake() {
          if (this._body) {
            return this._body.isAwake;
          }
          return false;
        }

        /**
         * @en
         * Wake up the rigid body.
         * @zh
         * 唤醒刚体。
         */
        wakeUp() {
          if (this._body) {
            this._body.wakeUp();
          }
        }

        /**
         * @en
         * Dormancy of rigid body.
         * @zh
         * 休眠刚体。
         */
        sleep() {
          if (this._body) {
            this._body.sleep();
          }
        }

        /**
         * @en
         * Get total mass of the body.
         * @zh
         * 获取刚体的质量。
         */
        getMass() {
          if (this._body) {
            return this._body.getMass();
          }
          return 0;
        }

        /**
         * @en
         * Apply a force at a world point. If the force is not
         * applied at the center of mass, it will generate a torque and
         * affect the angular velocity.
         * @zh
         * 施加一个力到刚体上的一个点。如果力没有施加到刚体的质心上，还会产生一个扭矩并且影响到角速度。
         * @param force @en the world force vector. @zh 世界坐标系下的力。
         * @param point @en the world position. @zh 世界坐标系下的力的作用点。
         * @param wake @en also wake up the body. @zh 唤醒刚体。
         */
        applyForce(force, point, wake) {
          if (this._body) {
            this._body.applyForce(force, point, wake);
          }
        }

        /**
         * @en
         * Apply a force to the center of mass.
         * @zh
         * 施加一个力到刚体上的质心上。
         * @param force @en the world force vector. @zh 世界坐标系下的力。
         * @param wake @en also wake up the body. @zh 唤醒刚体。
         */
        applyForceToCenter(force, wake) {
          if (this._body) {
            this._body.applyForceToCenter(force, wake);
          }
        }

        /**
         * @en
         * Apply a torque. This affects the angular velocity.
         * @zh
         * 施加一个扭矩力，将影响刚体的角速度。
         * @param torque @en about the z-axis (out of the screen), usually in N-m. @zh 扭矩 N-m。
         * @param wake @en also wake up the body @zh 唤醒刚体。
         */
        applyTorque(torque, wake) {
          if (this._body) {
            this._body.applyTorque(torque, wake);
          }
        }

        /**
         * @en
         * Apply a impulse at a world point, this immediately modifies the velocity.
         * If the impulse is not applied at the center of mass, it will generate a torque and
         * affect the angular velocity.
         * @zh
         * 施加冲量到刚体上的一个点，将立即改变刚体的线性速度。
         * 如果冲量施加到的点不是刚体的质心，那么将产生一个扭矩并影响刚体的角速度。
         * @param impulse @en the world impulse vector, usually in N-seconds or kg-m/s. @zh 冲量 N-seconds 或者 kg-m/s。
         * @param point @en the world position. @zh 世界坐标系下的作用点。
         * @param wake @en also wake up the body. @zh 唤醒刚体。
         */
        applyLinearImpulse(impulse, point, wake) {
          if (this._body) {
            this._body.applyLinearImpulse(impulse, point, wake);
          }
        }

        /**
         * @en
         * Apply a impulse at the center of mass, this immediately modifies the velocity.
         * @zh
         * 施加冲量到刚体上的质心点，将立即改变刚体的线性速度。
         * @param impulse @en the world impulse vector, usually in N-seconds or kg-m/s. @zh 冲量 N-seconds 或者 kg-m/s。
         * @param wake @en also wake up the body @zh 唤醒刚体。
         */
        applyLinearImpulseToCenter(impulse, wake) {
          if (this._body) {
            this._body.applyLinearImpulseToCenter(impulse, wake);
          }
        }

        /**
         * @en
         * Apply an angular impulse.
         * @zh
         * 施加一个角冲量。
         * @param impulse @en the angular impulse in units of kg*m*m/s. @zh 角冲量 kg*m*m/s。
         * @param wake @en also wake up the body. @zh 唤醒刚体。
         */
        applyAngularImpulse(impulse, wake) {
          if (this._body) {
            this._body.applyAngularImpulse(impulse, wake);
          }
        }

        /**
         * @en
         * Get the world linear velocity of a world point attached to this body.
         * @zh
         * 获取刚体上指定点的线性速度。
         * @param worldPoint @en a point in world coordinates. @zh 世界坐标系下的点。
         * @param out @en optional, the returned world velocity. @zh 可选，返回的世界坐标系下的速度。
         * @return @en the world linear velocity. @zh 指定点的世界坐标系下的速度。
         */
        getLinearVelocityFromWorldPoint(worldPoint, out) {
          if (this._body) {
            return this._body.getLinearVelocityFromWorldPoint(worldPoint, out);
          }
          return out;
        }

        /**
         * @en
         * Converts a world coordinate point to the given rigid body coordinate.
         * @zh
         * 将一个给定的世界坐标系下的向量转换为刚体本地坐标系下的向量。
         * @param worldVector @en a vector in world coordinates. @zh 世界坐标系下的向量。
         * @param out @en optional, the returned vector in local coordinate. @zh 可选，返回的本地坐标系下的向量。
         * @return @en a vector in local coordinate. @zh 本地坐标系下的向量。
         */
        getLocalVector(worldVector, out) {
          if (this._body) {
            return this._body.getLocalVector(worldVector, out);
          }
          return out;
        }

        /**
         * @en
         * Converts a given vector in this rigid body's local coordinate system to the world coordinate system
         * @zh
         * 将一个给定的刚体本地坐标系下的向量转换为世界坐标系下的向量。
         * @param localVector @en a vector in local coordinates. @zh 本地坐标系下的向量。
         * @param out @en optional, the returned vector in world coordinate. @zh 可选，返回的世界坐标系下的向量。
         * @return @en a vector in world coordinate. @zh 世界坐标系下的向量。
         */
        getWorldVector(localVector, out) {
          if (this._body) {
            return this._body.getWorldVector(localVector, out);
          }
          return out;
        }

        /**
         * @en
         * Converts a given point in the world coordinate system to this rigid body's local coordinate system.
         * @zh
         * 将一个给定的世界坐标系下的点转换为刚体本地坐标系下的点。
         * @param worldPoint @en a point in world coordinates. @zh 世界坐标系下的点。
         * @param out @en optional, the returned point in local coordinate. @zh 可选，返回的本地坐标系下的点。
         * @return @en a point in local coordinate. @zh 本地坐标系下的点。
         */
        getLocalPoint(worldPoint, out) {
          if (this._body) {
            return this._body.getLocalPoint(worldPoint, out);
          }
          return out;
        }

        /**
         * @en
         * Converts a given point in this rigid body's local coordinate system to the world coordinate system.
         * @zh
         * 将一个给定的刚体本地坐标系下的点转换为世界坐标系下的点。
         * @param localPoint @en a point in local coordinate. @zh 本地坐标系下的点。
         * @param out @en optional, the returned point in world coordinate. @zh 可选，返回的世界坐标系下的点。
         * @return @en a point in world coordinate. @zh 世界坐标系下的点。
         */
        getWorldPoint(localPoint, out) {
          if (this._body) {
            return this._body.getWorldPoint(localPoint, out);
          }
          return out;
        }

        /**
         * @en
         * Get the local position of the center of mass.
         * @zh
         * 获取刚体本地坐标系下的质心。
         */
        getLocalCenter(out) {
          if (this._body) {
            return this._body.getLocalCenter(out);
          }
          return out;
        }

        /**
         * @en
         * Get the world position of the center of mass.
         * @zh
         * 获取刚体世界坐标系下的质心。
         */
        getWorldCenter(out) {
          if (this._body) {
            return this._body.getWorldCenter(out);
          }
          return out;
        }

        /**
         * @en
         * Get the rotational inertia of the body about the local origin.
         * @zh
         * 获取刚体本地坐标系下原点的旋转惯性。
         */
        getInertia() {
          if (this._body) {
            return this._body.getInertia();
          }
          return 0;
        }

        /// COMPONENT LIFECYCLE ///
        onLoad() {
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._body = createRigidBody();
            this._body.initialize(this);
          }
        }
        onEnable() {
          if (this._body) {
            this._body.onEnable();
          }
        }
        onDisable() {
          if (this._body) {
            this._body.onDisable();
          }
        }
        onDestroy() {
          if (this._body) {
            this._body.onDestroy();
          }
        }
        get impl() {
          return this._body;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "group", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "group"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "enabledContactListener", [serializable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "bullet", [serializable, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "type", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "type"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "allowSleep", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "allowSleep"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "gravityScale", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "gravityScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "linearDamping", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "linearDamping"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angularDamping", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "angularDamping"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "linearVelocity", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "linearVelocity"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angularVelocity", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "angularVelocity"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fixedRotation", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "fixedRotation"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "awakeOnLoad", [serializable, _dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_group", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PhysicsGroup.DEFAULT;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_type", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ERigidBody2DType.Dynamic;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_allowSleep", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_gravityScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_linearDamping", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_angularDamping", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_linearVelocity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2();
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_angularVelocity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_fixedRotation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});