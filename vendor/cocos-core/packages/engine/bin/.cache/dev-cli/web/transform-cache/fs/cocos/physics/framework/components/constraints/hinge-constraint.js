System.register("q-bundled:///fs/cocos/physics/framework/components/constraints/hinge-constraint.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "./constraint.js", "../../../../core/index.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, serializable, formerlySerializedAs, type, tooltip, EDITOR_NOT_IN_PREVIEW, Constraint, Vec3, CCFloat, CCBoolean, EConstraintType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _class3, _class4, _descriptor4, _descriptor5, _descriptor6, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _class5, _class6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, HingeLimitData, HingeMotorData, HingeConstraint;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      type = _coreDataDecoratorsIndexJs.type;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_constraintJs) {
      Constraint = _constraintJs.Constraint;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      CCFloat = _coreIndexJs.CCFloat;
      CCBoolean = _coreIndexJs.CCBoolean;
    }, function (_physicsEnumJs) {
      EConstraintType = _physicsEnumJs.EConstraintType;
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
      /**
       * @en The hinge constraint limitation data.
       * @zh 铰链约束的限制数据。
       */
      _export("HingeLimitData", HingeLimitData = (_dec = ccclass('cc.HingeLimitData'), _dec2 = formerlySerializedAs('enabled'), _dec3 = formerlySerializedAs('upperLimit'), _dec4 = formerlySerializedAs('lowerLimit'), _dec5 = type(CCBoolean), _dec6 = type(CCFloat), _dec7 = type(CCFloat), _dec(_class = (_class2 = class HingeLimitData {
        constructor() {
          _initializerDefineProperty(this, "_enabled", _descriptor, this);
          _initializerDefineProperty(this, "_upperLimit", _descriptor2, this);
          _initializerDefineProperty(this, "_lowerLimit", _descriptor3, this);
        }

        /**
         * @en
         * Whether to enable the rotation limit of the hinge constraint.
         * @zh
         * 是否开启旋转限制。
         */
        get enabled() {
          return this._enabled;
        }
        set enabled(v) {
          this._enabled = v;
        }

        /**
         * @en
         * The upper limit to the rotation of pivotB related to pivotB's local position. (in degrees)
         * @zh
         * 转轴约束的旋转上限。（以度为单位）
         */
        get upperLimit() {
          return this._upperLimit;
        }
        set upperLimit(v) {
          this._upperLimit = v;
        }

        /**
         * @en
         * The lower limit to the rotation of pivotB related to pivotB's local position. (in degrees)
         * @zh
         * 转轴约束的旋转下限。（以度为单位）
         */
        get lowerLimit() {
          return this._lowerLimit;
        }
        set lowerLimit(v) {
          this._lowerLimit = v;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enabled", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_upperLimit", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Number.MAX_VALUE;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_lowerLimit", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -Number.MAX_VALUE;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "enabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "upperLimit", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "upperLimit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lowerLimit", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "lowerLimit"), _class2.prototype), _class2)) || _class));
      /**
       * @en The hinge constraint motor data.
       * @zh 铰链约束的马达数据。
       */
      _export("HingeMotorData", HingeMotorData = (_dec8 = ccclass('cc.HingeMotorData'), _dec9 = formerlySerializedAs('enabled'), _dec0 = formerlySerializedAs('motorVelocity'), _dec1 = formerlySerializedAs('motorForceLimit'), _dec10 = type(CCBoolean), _dec11 = type(CCFloat), _dec12 = type(CCFloat), _dec8(_class3 = (_class4 = class HingeMotorData {
        constructor() {
          _initializerDefineProperty(this, "_enabled", _descriptor4, this);
          _initializerDefineProperty(this, "_motorVelocity", _descriptor5, this);
          _initializerDefineProperty(this, "_motorForceLimit", _descriptor6, this);
        }

        /**
         * @en
         * Whether the motor is enabled or not.
         * @zh
         * 转轴约束是否启用 Motor
         */
        get enabled() {
          return this._enabled;
        }
        set enabled(v) {
          this._enabled = v;
        }

        /**
         * @en
         * The rotation speed of pivotA related to pivotB. (in degrees per second)
         * @zh
         * 转轴约束的旋转速度。（以度每秒为单位）
         */
        get motorVelocity() {
          return this._motorVelocity;
        }
        set motorVelocity(v) {
          this._motorVelocity = v;
        }

        /**
         * @en
         * The max drive force of the motor.
         * @zh
         * 转轴约束的最大驱动力。
         */
        get motorForceLimit() {
          return this._motorForceLimit;
        }
        set motorForceLimit(v) {
          this._motorForceLimit = v;
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_enabled", [serializable, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "_motorVelocity", [serializable, _dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "_motorForceLimit", [serializable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "enabled", [_dec10], Object.getOwnPropertyDescriptor(_class4.prototype, "enabled"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "motorVelocity", [_dec11], Object.getOwnPropertyDescriptor(_class4.prototype, "motorVelocity"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "motorForceLimit", [_dec12], Object.getOwnPropertyDescriptor(_class4.prototype, "motorForceLimit"), _class4.prototype), _class4)) || _class3));
      /**
       * @en Hinge constraint.
       * It keeps the local rotation axes of two rigid bodies aligned,
       * and locks the relative motion along the rotation axis.
       * @zh 铰链约束。
       * 它保持两个刚体的本地旋转轴对齐，并锁定沿旋转轴的相对运动。
       */
      _export("HingeConstraint", HingeConstraint = (_dec13 = ccclass('cc.HingeConstraint'), _dec14 = help('i18n:cc.HingeConstraint'), _dec15 = menu('Physics/HingeConstraint(beta)'), _dec16 = type(Vec3), _dec17 = tooltip('i18n:physics3d.constraint.pivotA'), _dec18 = type(Vec3), _dec19 = tooltip('i18n:physics3d.constraint.pivotB'), _dec20 = type(Vec3), _dec21 = tooltip('i18n:physics3d.constraint.axis'), _dec22 = type(CCBoolean), _dec23 = type(CCFloat), _dec24 = type(CCFloat), _dec25 = type(CCBoolean), _dec26 = type(CCFloat), _dec27 = type(CCFloat), _dec28 = formerlySerializedAs('axisA'), _dec29 = formerlySerializedAs('pivotA'), _dec30 = formerlySerializedAs('pivotB'), _dec31 = formerlySerializedAs('limitData'), _dec32 = formerlySerializedAs('motorData'), _dec13(_class5 = _dec14(_class5 = _dec15(_class5 = (_class6 = class HingeConstraint extends Constraint {
        /**
         * @en
         * The pivot point of the constraint in the local coordinate system of the attached rigid body.
         * @zh
         * 约束关节在连接刚体的本地坐标系中的锚点。
         */
        get pivotA() {
          return this._pivotA;
        }
        set pivotA(v) {
          Vec3.copy(this._pivotA, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setPivotA(this._pivotA);
          }
        }

        /**
         * @en
         * The pivot point of the constraint in the local coordinate system of the connected rigid body.
         * @zh
         * 约束关节在连接刚体的本地坐标系中的锚点。
         */
        get pivotB() {
          return this._pivotB;
        }
        set pivotB(v) {
          Vec3.copy(this._pivotB, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setPivotB(this._pivotB);
          }
        }

        /**
         * @en
         * The axis of the constraint in the local coordinate system of the attached rigid body.
         * @zh
         * 约束关节在连接刚体的本地坐标系中的轴。
         */
        get axis() {
          return this._axis;
        }
        set axis(v) {
          Vec3.copy(this._axis, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setAxis(this._axis);
          }
        }

        /**
         * @en
         * Whether to enable the rotation limit of the hinge constraint.
         * @zh
         * 是否开启旋转限制。
         */
        get limitEnabled() {
          return this._limitData.enabled;
        }
        set limitEnabled(v) {
          this._limitData.enabled = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setLimitEnabled(v);
          }
        }

        /**
         * @en
         * The upper limit to the rotation angle of pivotB related to pivotB's local position.
         * @zh
         * 转轴约束的旋转角度上限。
         */
        get upperLimit() {
          return this._limitData.upperLimit;
        }
        set upperLimit(v) {
          this._limitData.upperLimit = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setUpperLimit(v);
          }
        }

        /**
         * @en
         * The lower limit to the rotation angle of pivotB related to pivotB's local position.
         * @zh
         * 转轴约束的旋转角度下限。
         */
        get lowerLimit() {
          return this._limitData.lowerLimit;
        }
        set lowerLimit(v) {
          this._limitData.lowerLimit = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setLowerLimit(v);
          }
        }

        /**
         * @en
         * Whether the motor is enabled or not.
         * @zh
         * 转轴约束是否启用 Motor
         */
        get motorEnabled() {
          return this._motorData.enabled;
        }
        set motorEnabled(v) {
          this._motorData.enabled = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setMotorEnabled(v);
          }
        }

        /**
         * @en
         * The rotation speed of pivotA related to pivotB.
         * @zh
         * 转轴约束的旋转速度。
         */
        get motorVelocity() {
          return this._motorData.motorVelocity;
        }
        set motorVelocity(v) {
          this._motorData.motorVelocity = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setMotorVelocity(v);
          }
        }

        /**
         * @en
         * The max drive force of the motor.
         * @zh
         * 转轴约束的最大驱动力。
         */
        get motorForceLimit() {
          return this._motorData.motorForceLimit;
        }
        set motorForceLimit(v) {
          this._motorData.motorForceLimit = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setMotorForceLimit(v);
          }
        }
        get constraint() {
          return this._constraint;
        }
        constructor() {
          super(EConstraintType.HINGE);
          _initializerDefineProperty(this, "_axis", _descriptor7, this);
          _initializerDefineProperty(this, "_pivotA", _descriptor8, this);
          _initializerDefineProperty(this, "_pivotB", _descriptor9, this);
          _initializerDefineProperty(this, "_limitData", _descriptor0, this);
          _initializerDefineProperty(this, "_motorData", _descriptor1, this);
        }
      }, _applyDecoratedDescriptor(_class6.prototype, "pivotA", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class6.prototype, "pivotA"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "pivotB", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class6.prototype, "pivotB"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "axis", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class6.prototype, "axis"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "limitEnabled", [_dec22], Object.getOwnPropertyDescriptor(_class6.prototype, "limitEnabled"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "upperLimit", [_dec23], Object.getOwnPropertyDescriptor(_class6.prototype, "upperLimit"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "lowerLimit", [_dec24], Object.getOwnPropertyDescriptor(_class6.prototype, "lowerLimit"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "motorEnabled", [_dec25], Object.getOwnPropertyDescriptor(_class6.prototype, "motorEnabled"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "motorVelocity", [_dec26], Object.getOwnPropertyDescriptor(_class6.prototype, "motorVelocity"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "motorForceLimit", [_dec27], Object.getOwnPropertyDescriptor(_class6.prototype, "motorForceLimit"), _class6.prototype), _descriptor7 = _applyDecoratedDescriptor(_class6.prototype, "_axis", [serializable, _dec28], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class6.prototype, "_pivotA", [serializable, _dec29], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class6.prototype, "_pivotB", [serializable, _dec30], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class6.prototype, "_limitData", [serializable, _dec31], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new HingeLimitData();
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class6.prototype, "_motorData", [serializable, _dec32], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new HingeMotorData();
        }
      }), _class6)) || _class5) || _class5) || _class5));
    }
  };
});