System.register("q-bundled:///fs/cocos/physics/framework/components/constraints/configurable-constraint.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "./constraint.js", "../../../../core/index.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, serializable, formerlySerializedAs, type, tooltip, group, EDITOR_NOT_IN_PREVIEW, Constraint, Vec3, CCFloat, CCBoolean, EConstraintType, EConstraintMode, EDriverMode, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _class3, _class4, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _class5, _class6, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _dec69, _dec70, _dec71, _dec72, _dec73, _dec74, _dec75, _dec76, _dec77, _dec78, _dec79, _dec80, _dec81, _class7, _class8, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _dec82, _dec83, _dec84, _dec85, _dec86, _dec87, _dec88, _dec89, _dec90, _dec91, _dec92, _dec93, _dec94, _dec95, _dec96, _dec97, _dec98, _dec99, _dec100, _dec101, _dec102, _dec103, _dec104, _dec105, _dec106, _dec107, _dec108, _dec109, _dec110, _class9, _class0, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _descriptor41, _descriptor42, _descriptor43, _descriptor44, LinearLimitSettings, AngularLimitSettings, LinearDriverSettings, AngularDriverSettings, ConfigurableConstraint;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      type = _coreDataDecoratorsIndexJs.type;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      group = _coreDataDecoratorsIndexJs.group;
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
      EConstraintMode = _physicsEnumJs.EConstraintMode;
      EDriverMode = _physicsEnumJs.EDriverMode;
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
      /**
       * @en The linear limit settings of the configurable constraint.
       * @zh 可配置约束的线性限制设置。
       */
      _export("LinearLimitSettings", LinearLimitSettings = (_dec = ccclass('cc.LinearLimitSettings'), _dec2 = type(EConstraintMode), _dec3 = tooltip('i18n:physics3d.constraint.linearLimit.xMotion'), _dec4 = type(EConstraintMode), _dec5 = tooltip('i18n:physics3d.constraint.linearLimit.yMotion'), _dec6 = type(EConstraintMode), _dec7 = tooltip('i18n:physics3d.constraint.linearLimit.zMotion'), _dec8 = type(Vec3), _dec9 = tooltip('i18n:physics3d.constraint.linearLimit.upper'), _dec0 = type(Vec3), _dec1 = tooltip('i18n:physics3d.constraint.linearLimit.lower'), _dec10 = type(CCFloat), _dec11 = tooltip('i18n:physics3d.constraint.linearLimit.restitution'), _dec12 = type(CCBoolean), _dec13 = tooltip('i18n:physics3d.constraint.linearLimit.enableSoftConstraint'), _dec14 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings',
        style: 'section'
      }), _dec15 = type(CCFloat), _dec16 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec17 = tooltip('i18n:physics3d.constraint.linearLimit.stiffness'), _dec18 = type(CCFloat), _dec19 = tooltip('i18n:physics3d.constraint.linearLimit.damping'), _dec20 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec(_class = (_class2 = class LinearLimitSettings {
        get xMotion() {
          return this._xMotion;
        }
        set xMotion(v) {
          this._xMotion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(0, v);
          }
        }
        get yMotion() {
          return this._yMotion;
        }
        set yMotion(v) {
          this._yMotion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(1, v);
          }
        }
        get zMotion() {
          return this._zMotion;
        }
        set zMotion(v) {
          this._zMotion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(2, v);
          }
        }
        get upper() {
          return this._upper;
        }
        set upper(v) {
          Vec3.copy(this._upper, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            const lower = this.lower;
            this._impl.setLinearLimit(0, lower.x, v.x);
            this._impl.setLinearLimit(1, lower.y, v.y);
            this._impl.setLinearLimit(2, lower.z, v.z);
          }
        }
        get lower() {
          return this._lower;
        }
        set lower(v) {
          Vec3.copy(this._lower, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            const upper = this.upper;
            this._impl.setLinearLimit(0, v.x, upper.x);
            this._impl.setLinearLimit(1, v.y, upper.y);
            this._impl.setLinearLimit(2, v.z, upper.z);
          }
        }
        get restitution() {
          return this._bounciness;
        }
        set restitution(v) {
          this._bounciness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearRestitution(v);
          }
        }
        get enableSoftConstraint() {
          return this._enableSoftConstraint;
        }
        set enableSoftConstraint(v) {
          this._enableSoftConstraint = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearSoftConstraint(v);
          }
        }
        get stiffness() {
          return this._stiffness;
        }
        set stiffness(v) {
          this._stiffness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearStiffness(v);
          }
        }
        get damping() {
          return this._damping;
        }
        set damping(v) {
          this._damping = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearDamping(v);
          }
        }
        /**
         * @engineInternal
         */
        set impl(v) {
          this._impl = v;
        }
        constructor(configurableConstraint) {
          _initializerDefineProperty(this, "_xMotion", _descriptor, this);
          _initializerDefineProperty(this, "_yMotion", _descriptor2, this);
          _initializerDefineProperty(this, "_zMotion", _descriptor3, this);
          _initializerDefineProperty(this, "_upper", _descriptor4, this);
          _initializerDefineProperty(this, "_lower", _descriptor5, this);
          _initializerDefineProperty(this, "_enableSoftConstraint", _descriptor6, this);
          _initializerDefineProperty(this, "_bounciness", _descriptor7, this);
          // restitution [0,1]
          _initializerDefineProperty(this, "_stiffness", _descriptor8, this);
          _initializerDefineProperty(this, "_damping", _descriptor9, this);
          this._impl = void 0;
          this._impl = configurableConstraint;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "xMotion", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "xMotion"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "yMotion", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "yMotion"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "zMotion", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "zMotion"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "upper", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "upper"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lower", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "lower"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "restitution", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "restitution"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableSoftConstraint", [_dec12, _dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "enableSoftConstraint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "stiffness", [_dec15, _dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "stiffness"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "damping", [_dec18, _dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "damping"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_xMotion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_yMotion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_zMotion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_upper", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_lower", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_enableSoftConstraint", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_bounciness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_stiffness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_damping", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
      /**
       * @en The angular limit settings of the configurable constraint.
       * @zh 可配置约束的角度限制设置。
       */
      _export("AngularLimitSettings", AngularLimitSettings = (_dec21 = ccclass('cc.AngularLimitSettings'), _dec22 = type(EConstraintMode), _dec23 = tooltip('i18n:physics3d.constraint.angularLimit.twistMotion'), _dec24 = type(EConstraintMode), _dec25 = tooltip('i18n:physics3d.constraint.angularLimit.swingMotion1'), _dec26 = type(EConstraintMode), _dec27 = tooltip('i18n:physics3d.constraint.angularLimit.swingMotion2'), _dec28 = type(CCFloat), _dec29 = tooltip('i18n:physics3d.constraint.angularLimit.twistExtent'), _dec30 = type(CCFloat), _dec31 = tooltip('i18n:physics3d.constraint.angularLimit.swingExtent1'), _dec32 = type(CCFloat), _dec33 = tooltip('i18n:physics3d.constraint.angularLimit.swingExtent2'), _dec34 = type(CCFloat), _dec35 = tooltip('i18n:physics3d.constraint.angularLimit.twistRestitution'), _dec36 = type(CCFloat), _dec37 = tooltip('i18n:physics3d.constraint.angularLimit.swingRestitution'), _dec38 = type(CCBoolean), _dec39 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec40 = tooltip('i18n:physics3d.constraint.angularLimit.enableSoftConstraintTwist'), _dec41 = type(CCFloat), _dec42 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec43 = tooltip('i18n:physics3d.constraint.angularLimit.twistStiffness'), _dec44 = type(CCFloat), _dec45 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec46 = tooltip('i18n:physics3d.constraint.angularLimit.twistDamping'), _dec47 = type(CCBoolean), _dec48 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec49 = tooltip('i18n:physics3d.constraint.angularLimit.enableSoftConstraintSwing'), _dec50 = type(CCFloat), _dec51 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec52 = tooltip('i18n:physics3d.constraint.angularLimit.swingStiffness'), _dec53 = type(CCFloat), _dec54 = group({
        id: 'SoftConstraint',
        name: 'SoftConstraintSettings'
      }), _dec55 = tooltip('i18n:physics3d.constraint.angularLimit.swingDamping'), _dec21(_class3 = (_class4 = class AngularLimitSettings {
        get twistMotion() {
          return this._twistMotion;
        }
        set twistMotion(v) {
          this._twistMotion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(3, v);
          }
        }
        get swingMotion1() {
          return this._swing1Motion;
        }
        set swingMotion1(v) {
          this._swing1Motion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(4, v);
          }
        }
        get swingMotion2() {
          return this._swing2Motion;
        }
        set swingMotion2(v) {
          this._swing2Motion = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setConstraintMode(5, v);
          }
        }
        get twistExtent() {
          return this._twistExtent;
        }
        set twistExtent(v) {
          this._twistExtent = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularExtent(v, this.swingExtent1, this.swingExtent2);
          }
        }
        get swingExtent1() {
          return this._swingExtent1;
        }
        set swingExtent1(v) {
          this._swingExtent1 = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularExtent(this.twistExtent, v, this.swingExtent2);
          }
        }
        get swingExtent2() {
          return this._swingExtent2;
        }
        set swingExtent2(v) {
          this._swingExtent2 = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularExtent(this.twistExtent, this.swingExtent1, v);
          }
        }
        get twistRestitution() {
          return this._twistBounciness;
        }
        set twistRestitution(v) {
          this._twistBounciness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setTwistRestitution(v);
          }
        }
        get swingRestitution() {
          return this._swingBounciness;
        }
        set swingRestitution(v) {
          this._swingBounciness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setSwingRestitution(v);
          }
        }
        get enableSoftConstraintTwist() {
          return this._enableSoftConstraintTwist;
        }
        set enableSoftConstraintTwist(v) {
          this._enableSoftConstraintTwist = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setTwistSoftConstraint(v);
          }
        }
        get twistStiffness() {
          return this._twistStiffness;
        }
        set twistStiffness(v) {
          this._twistStiffness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setTwistStiffness(v);
          }
        }
        get twistDamping() {
          return this._twistDamping;
        }
        set twistDamping(v) {
          this._twistDamping = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setTwistDamping(v);
          }
        }
        get enableSoftConstraintSwing() {
          return this._enableSoftConstraintSwing;
        }
        set enableSoftConstraintSwing(v) {
          this._enableSoftConstraintSwing = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setSwingSoftConstraint(v);
          }
        }
        get swingStiffness() {
          return this._swingStiffness;
        }
        set swingStiffness(v) {
          this._swingStiffness = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setSwingStiffness(v);
          }
        }
        get swingDamping() {
          return this._swingDamping;
        }
        set swingDamping(v) {
          this._swingDamping = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setSwingDamping(v);
          }
        }
        /**
         * @engineInternal
         */
        set impl(v) {
          this._impl = v;
        }
        constructor(configurableConstraint) {
          _initializerDefineProperty(this, "_swing1Motion", _descriptor0, this);
          _initializerDefineProperty(this, "_swing2Motion", _descriptor1, this);
          _initializerDefineProperty(this, "_twistMotion", _descriptor10, this);
          _initializerDefineProperty(this, "_twistExtent", _descriptor11, this);
          _initializerDefineProperty(this, "_swingExtent1", _descriptor12, this);
          _initializerDefineProperty(this, "_swingExtent2", _descriptor13, this);
          _initializerDefineProperty(this, "_enableSoftConstraintSwing", _descriptor14, this);
          _initializerDefineProperty(this, "_swingBounciness", _descriptor15, this);
          _initializerDefineProperty(this, "_swingStiffness", _descriptor16, this);
          _initializerDefineProperty(this, "_swingDamping", _descriptor17, this);
          _initializerDefineProperty(this, "_enableSoftConstraintTwist", _descriptor18, this);
          _initializerDefineProperty(this, "_twistBounciness", _descriptor19, this);
          _initializerDefineProperty(this, "_twistStiffness", _descriptor20, this);
          _initializerDefineProperty(this, "_twistDamping", _descriptor21, this);
          this._impl = void 0;
          this._impl = configurableConstraint;
        }
      }, _applyDecoratedDescriptor(_class4.prototype, "twistMotion", [_dec22, _dec23], Object.getOwnPropertyDescriptor(_class4.prototype, "twistMotion"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingMotion1", [_dec24, _dec25], Object.getOwnPropertyDescriptor(_class4.prototype, "swingMotion1"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingMotion2", [_dec26, _dec27], Object.getOwnPropertyDescriptor(_class4.prototype, "swingMotion2"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "twistExtent", [_dec28, _dec29], Object.getOwnPropertyDescriptor(_class4.prototype, "twistExtent"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingExtent1", [_dec30, _dec31], Object.getOwnPropertyDescriptor(_class4.prototype, "swingExtent1"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingExtent2", [_dec32, _dec33], Object.getOwnPropertyDescriptor(_class4.prototype, "swingExtent2"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "twistRestitution", [_dec34, _dec35], Object.getOwnPropertyDescriptor(_class4.prototype, "twistRestitution"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingRestitution", [_dec36, _dec37], Object.getOwnPropertyDescriptor(_class4.prototype, "swingRestitution"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "enableSoftConstraintTwist", [_dec38, _dec39, _dec40], Object.getOwnPropertyDescriptor(_class4.prototype, "enableSoftConstraintTwist"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "twistStiffness", [_dec41, _dec42, _dec43], Object.getOwnPropertyDescriptor(_class4.prototype, "twistStiffness"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "twistDamping", [_dec44, _dec45, _dec46], Object.getOwnPropertyDescriptor(_class4.prototype, "twistDamping"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "enableSoftConstraintSwing", [_dec47, _dec48, _dec49], Object.getOwnPropertyDescriptor(_class4.prototype, "enableSoftConstraintSwing"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingStiffness", [_dec50, _dec51, _dec52], Object.getOwnPropertyDescriptor(_class4.prototype, "swingStiffness"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "swingDamping", [_dec53, _dec54, _dec55], Object.getOwnPropertyDescriptor(_class4.prototype, "swingDamping"), _class4.prototype), _descriptor0 = _applyDecoratedDescriptor(_class4.prototype, "_swing1Motion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class4.prototype, "_swing2Motion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "_twistMotion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EConstraintMode.FREE;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "_twistExtent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "_swingExtent1", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "_swingExtent2", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class4.prototype, "_enableSoftConstraintSwing", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class4.prototype, "_swingBounciness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class4.prototype, "_swingStiffness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class4.prototype, "_swingDamping", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class4.prototype, "_enableSoftConstraintTwist", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class4.prototype, "_twistBounciness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class4.prototype, "_twistStiffness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class4.prototype, "_twistDamping", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class4)) || _class3));
      /**
       * @en The linear driver settings of the configurable constraint.
       * @zh 可配置约束的线性驱动器设置。
       */
      _export("LinearDriverSettings", LinearDriverSettings = (_dec56 = ccclass('cc.LinearDriverSettings'), _dec57 = type(EDriverMode), _dec58 = tooltip('i18n:physics3d.constraint.linearDriver.xMode'), _dec59 = type(EDriverMode), _dec60 = tooltip('i18n:physics3d.constraint.linearDriver.yMode'), _dec61 = type(EDriverMode), _dec62 = tooltip('i18n:physics3d.constraint.linearDriver.zMode'), _dec63 = type(Vec3), _dec64 = tooltip('i18n:physics3d.constraint.linearDriver.targetPosition'), _dec65 = type(Vec3), _dec66 = tooltip('i18n:physics3d.constraint.linearDriver.targetVelocity'), _dec67 = type(CCFloat), _dec68 = tooltip('i18n:physics3d.constraint.linearDriver.strength'), _dec56(_class5 = (_class6 = class LinearDriverSettings {
        get xDrive() {
          return this._xDrive;
        }
        set xDrive(v) {
          this._xDrive = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(0, v);
          }
        }
        get yDrive() {
          return this._yDrive;
        }
        set yDrive(v) {
          this._yDrive = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(1, v);
          }
        }
        get zDrive() {
          return this._zDrive;
        }
        set zDrive(v) {
          this._zDrive = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(2, v);
          }
        }
        get targetPosition() {
          return this._target;
        }
        set targetPosition(v) {
          Vec3.copy(this._target, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearMotorTarget(v);
          }
        }
        get targetVelocity() {
          return this._velocity;
        }
        set targetVelocity(v) {
          Vec3.copy(this._velocity, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearMotorVelocity(v);
          }
        }
        get strength() {
          return this._strength;
        }
        set strength(v) {
          this._strength = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setLinearMotorForceLimit(v);
          }
        }
        /**
         * @engineInternal
         */
        set impl(v) {
          this._impl = v;
        }
        constructor(configurableConstraint) {
          _initializerDefineProperty(this, "_target", _descriptor22, this);
          _initializerDefineProperty(this, "_velocity", _descriptor23, this);
          _initializerDefineProperty(this, "_xDrive", _descriptor24, this);
          _initializerDefineProperty(this, "_yDrive", _descriptor25, this);
          _initializerDefineProperty(this, "_zDrive", _descriptor26, this);
          _initializerDefineProperty(this, "_strength", _descriptor27, this);
          this._impl = void 0;
          this._impl = configurableConstraint;
        }
      }, _applyDecoratedDescriptor(_class6.prototype, "xDrive", [_dec57, _dec58], Object.getOwnPropertyDescriptor(_class6.prototype, "xDrive"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "yDrive", [_dec59, _dec60], Object.getOwnPropertyDescriptor(_class6.prototype, "yDrive"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "zDrive", [_dec61, _dec62], Object.getOwnPropertyDescriptor(_class6.prototype, "zDrive"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "targetPosition", [_dec63, _dec64], Object.getOwnPropertyDescriptor(_class6.prototype, "targetPosition"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "targetVelocity", [_dec65, _dec66], Object.getOwnPropertyDescriptor(_class6.prototype, "targetVelocity"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "strength", [_dec67, _dec68], Object.getOwnPropertyDescriptor(_class6.prototype, "strength"), _class6.prototype), _descriptor22 = _applyDecoratedDescriptor(_class6.prototype, "_target", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class6.prototype, "_velocity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class6.prototype, "_xDrive", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class6.prototype, "_yDrive", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class6.prototype, "_zDrive", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class6.prototype, "_strength", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class6)) || _class5));
      /**
       * @en The angular driver settings of the configurable constraint.
       * @zh 可配置约束的角度驱动器设置。
       */
      _export("AngularDriverSettings", AngularDriverSettings = (_dec69 = ccclass('cc.AngularDriverSettings'), _dec70 = type(EDriverMode), _dec71 = tooltip('i18n:physics3d.constraint.angularDriver.twistMode'), _dec72 = type(EDriverMode), _dec73 = tooltip('i18n:physics3d.constraint.angularDriver.swingMode1'), _dec74 = type(EDriverMode), _dec75 = tooltip('i18n:physics3d.constraint.angularDriver.swingMode2'), _dec76 = type(Vec3), _dec77 = tooltip('i18n:physics3d.constraint.angularDriver.targetOrientation'), _dec78 = type(Vec3), _dec79 = tooltip('i18n:physics3d.constraint.angularDriver.targetAngularVelocity'), _dec80 = type(CCFloat), _dec81 = tooltip('i18n:physics3d.constraint.angularDriver.strength'), _dec69(_class7 = (_class8 = class AngularDriverSettings {
        get twistDrive() {
          return this._twistDrive;
        }
        set twistDrive(v) {
          this._twistDrive = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(3, v);
          }
        }
        get swingDrive1() {
          return this._swingDrive1;
        }
        set swingDrive1(v) {
          this._swingDrive1 = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(4, v);
          }
        }
        get swingDrive2() {
          return this._swingDrive2;
        }
        set swingDrive2(v) {
          this._swingDrive2 = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setDriverMode(5, v);
          }
        }
        get targetOrientation() {
          return this._targetOrientation;
        }
        set targetOrientation(v) {
          Vec3.copy(this._targetOrientation, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularMotorTarget(v);
          }
        }
        get targetVelocity() {
          return this._targetVelocity;
        }
        set targetVelocity(v) {
          Vec3.copy(this._targetVelocity, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularMotorVelocity(v);
          }
        }
        get strength() {
          return this._strength;
        }
        set strength(v) {
          this._strength = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._impl.setAngularMotorForceLimit(v);
          }
        }
        /**
         * @engineInternal
         */
        set impl(v) {
          this._impl = v;
        }
        constructor(configurableConstraint) {
          _initializerDefineProperty(this, "_swingDrive1", _descriptor28, this);
          _initializerDefineProperty(this, "_swingDrive2", _descriptor29, this);
          _initializerDefineProperty(this, "_twistDrive", _descriptor30, this);
          _initializerDefineProperty(this, "_targetOrientation", _descriptor31, this);
          _initializerDefineProperty(this, "_targetVelocity", _descriptor32, this);
          _initializerDefineProperty(this, "_strength", _descriptor33, this);
          this._impl = void 0;
          this._impl = configurableConstraint;
        }
      }, _applyDecoratedDescriptor(_class8.prototype, "twistDrive", [_dec70, _dec71], Object.getOwnPropertyDescriptor(_class8.prototype, "twistDrive"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "swingDrive1", [_dec72, _dec73], Object.getOwnPropertyDescriptor(_class8.prototype, "swingDrive1"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "swingDrive2", [_dec74, _dec75], Object.getOwnPropertyDescriptor(_class8.prototype, "swingDrive2"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "targetOrientation", [_dec76, _dec77], Object.getOwnPropertyDescriptor(_class8.prototype, "targetOrientation"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "targetVelocity", [_dec78, _dec79], Object.getOwnPropertyDescriptor(_class8.prototype, "targetVelocity"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "strength", [_dec80, _dec81], Object.getOwnPropertyDescriptor(_class8.prototype, "strength"), _class8.prototype), _descriptor28 = _applyDecoratedDescriptor(_class8.prototype, "_swingDrive1", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor29 = _applyDecoratedDescriptor(_class8.prototype, "_swingDrive2", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor30 = _applyDecoratedDescriptor(_class8.prototype, "_twistDrive", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EDriverMode.DISABLED;
        }
      }), _descriptor31 = _applyDecoratedDescriptor(_class8.prototype, "_targetOrientation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor32 = _applyDecoratedDescriptor(_class8.prototype, "_targetVelocity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor33 = _applyDecoratedDescriptor(_class8.prototype, "_strength", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class8)) || _class7));
      /**
       * @en The configurable constraint component.
       * The configurable constraint provides all the functionality of other constraints, and provides comprehensive configurable options.
       * @zh 可配置约束组件。
       * 可配置约束提供了其他约束的所有功能支持，提供了全面的可配置选项。
       */
      _export("ConfigurableConstraint", ConfigurableConstraint = (_dec82 = ccclass('cc.ConfigurableConstraint'), _dec83 = help('i18n:cc.ConfigurableConstraint'), _dec84 = menu('Physics/ConfigurableConstraint(beta)'), _dec85 = type(Vec3), _dec86 = tooltip('i18n:physics3d.constraint.axis'), _dec87 = type(Vec3), _dec88 = tooltip('i18n:physics3d.constraint.secondaryAxis'), _dec89 = type(Vec3), _dec90 = tooltip('i18n:physics3d.constraint.pivotA'), _dec91 = type(Vec3), _dec92 = tooltip('i18n:physics3d.constraint.pivotB'), _dec93 = type(CCBoolean), _dec94 = tooltip('i18n:physics3d.constraint.autoCalculatePivotB'), _dec95 = type(CCFloat), _dec96 = tooltip('i18n:physics3d.constraint.breakForce'), _dec97 = type(CCFloat), _dec98 = tooltip('i18n:physics3d.constraint.breakTorque'), _dec99 = type(LinearLimitSettings), _dec100 = tooltip('i18n:physics3d.constraint.linearLimit'), _dec101 = type(AngularLimitSettings), _dec102 = tooltip('i18n:physics3d.constraint.angularLimit'), _dec103 = type(LinearDriverSettings), _dec104 = tooltip('i18n:physics3d.constraint.linearDrive'), _dec105 = type(AngularDriverSettings), _dec106 = tooltip('i18n:physics3d.constraint.angularDrive'), _dec107 = formerlySerializedAs('linearLimitSettings'), _dec108 = formerlySerializedAs('angularLimitSettings'), _dec109 = formerlySerializedAs('linearDriverSettings'), _dec110 = formerlySerializedAs('angularDriverSettings'), _dec82(_class9 = _dec83(_class9 = _dec84(_class9 = (_class0 = class ConfigurableConstraint extends Constraint {
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
         * @en The secondary axis of the constraint in the local coordinate system of the attached rigid body.
         * @zh 约束关节在连接刚体的本地坐标系中的第二轴。
         */
        get secondaryAxis() {
          return this._secondaryAxis;
        }
        set secondaryAxis(v) {
          Vec3.copy(this._secondaryAxis, v);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setSecondaryAxis(this._secondaryAxis);
          }
        }

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
         * The pivotB is derived automatically.
         * @zh
         * pivotB 会自动计算。
         */
        get autoPivotB() {
          return this._autoPivotB;
        }
        set autoPivotB(v) {
          this._autoPivotB = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setAutoPivotB(this._autoPivotB);
          }
        }

        /**
         * @en
         * The break force threshold of the constraint.
         * @zh
         * 约束的断裂力阈值。
         */
        get breakForce() {
          return this._breakForce;
        }
        set breakForce(v) {
          this._breakForce = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setBreakForce(v);
          }
        }

        /**
         * @en
         * The break torque threshold of the constraint.
         * @zh
         * 约束的断裂扭矩阈值。
         */
        get breakTorque() {
          return this._breakTorque;
        }
        set breakTorque(v) {
          this._breakTorque = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.constraint.setBreakTorque(v);
          }
        }

        /**
         * @en
         * The linear limit settings of the constraint.
         * @zh
         * 线性限制设置。
         */
        get linearLimitSettings() {
          return this._linearLimitSettings;
        }
        set linearLimitSettings(v) {
          this._linearLimitSettings = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            const constraint = this.constraint;
            constraint.setConstraintMode(0, v.xMotion);
            constraint.setConstraintMode(1, v.yMotion);
            constraint.setConstraintMode(2, v.zMotion);
            const upper = v.upper;
            const lower = v.lower;
            constraint.setLinearLimit(0, lower.x, upper.x);
            constraint.setLinearLimit(1, lower.y, upper.y);
            constraint.setLinearLimit(2, lower.z, upper.z);
            constraint.setLinearSoftConstraint(v.enableSoftConstraint);
            constraint.setLinearDamping(v.damping);
            constraint.setLinearStiffness(v.stiffness);
            constraint.setLinearRestitution(v.restitution);
          }
        }

        /**
         * @en
         * The angular limit settings of the constraint.
         * @zh
         * 角度限制设置。
         */
        get angularLimitSettings() {
          return this._angularLimitSettings;
        }
        set angularLimitSettings(v) {
          this._angularLimitSettings = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            const constraint = this.constraint;
            constraint.setConstraintMode(3, v.twistMotion);
            constraint.setConstraintMode(4, v.swingMotion1);
            constraint.setConstraintMode(5, v.swingMotion2);
            constraint.setAngularExtent(v.twistExtent, v.swingExtent1, v.swingExtent2);
            constraint.setTwistRestitution(v.twistRestitution);
            constraint.setSwingRestitution(v.swingRestitution);
            constraint.setTwistSoftConstraint(v.enableSoftConstraintTwist);
            constraint.setSwingSoftConstraint(v.enableSoftConstraintSwing);
            constraint.setTwistDamping(v.twistDamping);
            constraint.setSwingDamping(v.swingDamping);
            constraint.setTwistStiffness(v.twistStiffness);
            constraint.setSwingStiffness(v.swingStiffness);
          }
        }

        /**
         * @en
         * The linear drive settings of the constraint.
         * @zh
         * 线性驱动设置。
         */
        get linearDriverSettings() {
          return this._linearDriverSettings;
        }
        set linearDriverSettings(v) {
          this._linearDriverSettings = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            const constraint = this.constraint;
            constraint.setDriverMode(0, v.xDrive);
            constraint.setDriverMode(1, v.yDrive);
            constraint.setDriverMode(2, v.zDrive);
            constraint.setLinearMotorTarget(v.targetPosition);
            constraint.setLinearMotorVelocity(v.targetVelocity);
            constraint.setLinearMotorForceLimit(v.strength);
          }
        }

        /**
         * @en
         * The angular drive settings of the constraint.
         * @zh
         * 角度驱动设置。
         */
        get angularDriverSettings() {
          return this._angularDriverSettings;
        }
        set angularDriverSettings(v) {
          this._angularDriverSettings = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            const constraint = this.constraint;
            constraint.setDriverMode(3, v.twistDrive);
            constraint.setDriverMode(4, v.swingDrive1);
            constraint.setDriverMode(5, v.swingDrive2);
            constraint.setAngularMotorTarget(v.targetOrientation);
            constraint.setAngularMotorVelocity(v.targetVelocity);
            constraint.setAngularMotorForceLimit(v.strength);
          }
        }
        get constraint() {
          return this._constraint;
        }
        constructor() {
          super(EConstraintType.CONFIGURABLE);
          _initializerDefineProperty(this, "_breakForce", _descriptor34, this);
          _initializerDefineProperty(this, "_breakTorque", _descriptor35, this);
          _initializerDefineProperty(this, "_linearLimitSettings", _descriptor36, this);
          _initializerDefineProperty(this, "_angularLimitSettings", _descriptor37, this);
          _initializerDefineProperty(this, "_linearDriverSettings", _descriptor38, this);
          _initializerDefineProperty(this, "_angularDriverSettings", _descriptor39, this);
          _initializerDefineProperty(this, "_pivotA", _descriptor40, this);
          _initializerDefineProperty(this, "_pivotB", _descriptor41, this);
          _initializerDefineProperty(this, "_autoPivotB", _descriptor42, this);
          _initializerDefineProperty(this, "_axis", _descriptor43, this);
          _initializerDefineProperty(this, "_secondaryAxis", _descriptor44, this);
          this._linearLimitSettings = new LinearLimitSettings(this.constraint);
          this._angularLimitSettings = new AngularLimitSettings(this.constraint);
          this._linearDriverSettings = new LinearDriverSettings(this.constraint);
          this._angularDriverSettings = new AngularDriverSettings(this.constraint);
        }
        onLoad() {
          super.onLoad();
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.linearLimitSettings.impl = this.constraint;
            this.angularLimitSettings.impl = this.constraint;
            this.linearDriverSettings.impl = this.constraint;
            this.angularDriverSettings.impl = this.constraint;
          }
        }
      }, _applyDecoratedDescriptor(_class0.prototype, "axis", [_dec85, _dec86], Object.getOwnPropertyDescriptor(_class0.prototype, "axis"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "secondaryAxis", [_dec87, _dec88], Object.getOwnPropertyDescriptor(_class0.prototype, "secondaryAxis"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "pivotA", [_dec89, _dec90], Object.getOwnPropertyDescriptor(_class0.prototype, "pivotA"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "pivotB", [_dec91, _dec92], Object.getOwnPropertyDescriptor(_class0.prototype, "pivotB"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "autoPivotB", [_dec93, _dec94], Object.getOwnPropertyDescriptor(_class0.prototype, "autoPivotB"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "breakForce", [_dec95, _dec96], Object.getOwnPropertyDescriptor(_class0.prototype, "breakForce"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "breakTorque", [_dec97, _dec98], Object.getOwnPropertyDescriptor(_class0.prototype, "breakTorque"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "linearLimitSettings", [_dec99, _dec100], Object.getOwnPropertyDescriptor(_class0.prototype, "linearLimitSettings"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "angularLimitSettings", [_dec101, _dec102], Object.getOwnPropertyDescriptor(_class0.prototype, "angularLimitSettings"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "linearDriverSettings", [_dec103, _dec104], Object.getOwnPropertyDescriptor(_class0.prototype, "linearDriverSettings"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "angularDriverSettings", [_dec105, _dec106], Object.getOwnPropertyDescriptor(_class0.prototype, "angularDriverSettings"), _class0.prototype), _descriptor34 = _applyDecoratedDescriptor(_class0.prototype, "_breakForce", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1e8;
        }
      }), _descriptor35 = _applyDecoratedDescriptor(_class0.prototype, "_breakTorque", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1e8;
        }
      }), _descriptor36 = _applyDecoratedDescriptor(_class0.prototype, "_linearLimitSettings", [serializable, _dec107], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor37 = _applyDecoratedDescriptor(_class0.prototype, "_angularLimitSettings", [serializable, _dec108], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor38 = _applyDecoratedDescriptor(_class0.prototype, "_linearDriverSettings", [serializable, _dec109], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor39 = _applyDecoratedDescriptor(_class0.prototype, "_angularDriverSettings", [serializable, _dec110], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor40 = _applyDecoratedDescriptor(_class0.prototype, "_pivotA", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor41 = _applyDecoratedDescriptor(_class0.prototype, "_pivotB", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor42 = _applyDecoratedDescriptor(_class0.prototype, "_autoPivotB", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor43 = _applyDecoratedDescriptor(_class0.prototype, "_axis", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 1, 0);
        }
      }), _descriptor44 = _applyDecoratedDescriptor(_class0.prototype, "_secondaryAxis", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(1, 0, 0);
        }
      }), _class0)) || _class9) || _class9) || _class9));
    }
  };
});