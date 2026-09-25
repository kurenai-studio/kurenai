System.register("q-bundled:///fs/cocos/physics/framework/components/constraints/fixed-constraint.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "./constraint.js", "../../../../core/index.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, serializable, formerlySerializedAs, type, tooltip, EDITOR_NOT_IN_PREVIEW, Constraint, CCFloat, EConstraintType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, FixedConstraint;
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
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_constraintJs) {
      Constraint = _constraintJs.Constraint;
    }, function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
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
       * @en The fixed constraint.
       * It locks the relative position and rotation between two rigid bodies.
       * @zh 固定关节。
       * 固定关节会锁定两个刚体间的相对位置和相对旋转。
       */
      _export("FixedConstraint", FixedConstraint = (_dec = ccclass('cc.FixedConstraint'), _dec2 = help('i18n:cc.FixedConstraint'), _dec3 = menu('Physics/FixedConstraint(beta)'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics3d.constraint.breakForce'), _dec6 = type(CCFloat), _dec7 = tooltip('i18n:physics3d.constraint.breakTorque'), _dec8 = formerlySerializedAs('breakForce'), _dec9 = formerlySerializedAs('breakTorque'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class FixedConstraint extends Constraint {
        /**
         * @en
         * The maximum force that can be applied to the constraint before it breaks.
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
         * The maximum torque that can be applied to the constraint before it breaks.
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
        get constraint() {
          return this._constraint;
        }
        constructor() {
          super(EConstraintType.FIXED);
          _initializerDefineProperty(this, "_breakForce", _descriptor, this);
          _initializerDefineProperty(this, "_breakTorque", _descriptor2, this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "breakForce", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "breakForce"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "breakTorque", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "breakTorque"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_breakForce", [serializable, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1e8;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_breakTorque", [serializable, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1e8;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});