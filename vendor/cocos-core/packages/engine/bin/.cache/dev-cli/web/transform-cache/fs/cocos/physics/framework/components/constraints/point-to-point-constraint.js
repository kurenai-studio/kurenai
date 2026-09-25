System.register("q-bundled:///fs/cocos/physics/framework/components/constraints/point-to-point-constraint.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "./constraint.js", "../../../../core/index.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, type, serializable, tooltip, EDITOR_NOT_IN_PREVIEW, Constraint, Vec3, EConstraintType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, PointToPointConstraint;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_constraintJs) {
      Constraint = _constraintJs.Constraint;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
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
       * @en The point to point constraint.
       * It locks the relative position of the pivots between two rigid bodies.
       * @zh 点对点约束。
       * 点对点约束会锁定两个刚体间的连接点的相对位置。
       */
      _export("PointToPointConstraint", PointToPointConstraint = (_dec = ccclass('cc.PointToPointConstraint'), _dec2 = help('i18n:cc.PointToPointConstraint'), _dec3 = menu('Physics/PointToPointConstraint(beta)'), _dec4 = type(Vec3), _dec5 = tooltip('i18n:physics3d.constraint.pivotA'), _dec6 = type(Vec3), _dec7 = tooltip('i18n:physics3d.constraint.pivotB'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PointToPointConstraint extends Constraint {
        /**
         * @en
         * The pivot point of the constraint in the local coordinate system of the attached rigid body.
         * @zh
         * 约束关节在连接刚体本地坐标系中的位置。
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
         * 约束关节在连接刚体本地坐标系中的位置。
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
        get constraint() {
          return this._constraint;
        }
        constructor() {
          super(EConstraintType.POINT_TO_POINT);
          _initializerDefineProperty(this, "_pivotA", _descriptor, this);
          _initializerDefineProperty(this, "_pivotB", _descriptor2, this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "pivotA", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "pivotA"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "pivotB", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "pivotB"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_pivotA", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_pivotB", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});