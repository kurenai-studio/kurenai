System.register("q-bundled:///fs/cocos/physics-2d/framework/components/joints/relative-joint-2d.js", ["./joint-2d.js", "../../physics-types.js", "../../../../core/index.js", "../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var Joint2D, EJoint2DType, Vec3, Vec2, Quat, _decorator, CCFloat, CCBoolean, help, serializable, tooltip, type, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, tempVec3_1, tempVec3_2, ccclass, menu, RelativeJoint2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_joint2dJs) {
      Joint2D = _joint2dJs.Joint2D;
    }, function (_physicsTypesJs) {
      EJoint2DType = _physicsTypesJs.EJoint2DType;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Vec2 = _coreIndexJs.Vec2;
      Quat = _coreIndexJs.Quat;
      _decorator = _coreIndexJs._decorator;
      CCFloat = _coreIndexJs.CCFloat;
      CCBoolean = _coreIndexJs.CCBoolean;
    }, function (_coreDataDecoratorsIndexJs) {
      help = _coreDataDecoratorsIndexJs.help;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
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
      tempVec3_1 = new Vec3();
      tempVec3_2 = new Vec3();
      ({
        ccclass,
        menu
      } = _decorator);
      _export("RelativeJoint2D", RelativeJoint2D = (_dec = ccclass('cc.RelativeJoint2D'), _dec2 = help('i18n:cc.Joint2D'), _dec3 = menu('Physics2D/Joints/RelativeJoint2D'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics2d.joint.maxForce'), _dec6 = type(CCFloat), _dec7 = tooltip('i18n:physics2d.joint.maxTorque'), _dec8 = type(CCFloat), _dec9 = tooltip('i18n:physics2d.joint.correctionFactor'), _dec0 = type(Vec2), _dec1 = tooltip('i18n:physics2d.joint.linearOffset'), _dec10 = type(CCFloat), _dec11 = tooltip('i18n:physics2d.joint.angularOffset'), _dec12 = type(CCBoolean), _dec13 = tooltip('i18n:physics2d.joint.autoCalcOffset'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class RelativeJoint2D extends Joint2D {
        constructor(...args) {
          super(...args);
          this.TYPE = EJoint2DType.RELATIVE;
          /// private properties
          _initializerDefineProperty(this, "_maxForce", _descriptor, this);
          _initializerDefineProperty(this, "_maxTorque", _descriptor2, this);
          _initializerDefineProperty(this, "_correctionFactor", _descriptor3, this);
          _initializerDefineProperty(this, "_angularOffset", _descriptor4, this);
          _initializerDefineProperty(this, "_linearOffset", _descriptor5, this);
          _initializerDefineProperty(this, "_autoCalcOffset", _descriptor6, this);
        }
        /**
         * @en
         * The maximum force can be applied to rigidbody.
         * @zh
         * 可以应用于刚体的最大的力值。
         */
        get maxForce() {
          return this._maxForce;
        }
        set maxForce(v) {
          this._maxForce = v;
          if (this._joint) {
            this._joint.setMaxForce(v);
          }
        }

        /**
         * @en
         * The maximum torque can be applied to rigidbody.
         * @zh
         * 可以应用于刚体的最大扭矩值。
         */
        get maxTorque() {
          return this._maxTorque;
        }
        set maxTorque(v) {
          this._maxTorque = v;
          if (this._joint) {
            this._joint.setMaxTorque(v);
          }
        }

        /**
         * @en
         * The position correction factor in the range [0,1].
         * @zh
         * 位置矫正系数，范围为 [0, 1]。
         */
        get correctionFactor() {
          return this._correctionFactor;
        }
        set correctionFactor(v) {
          this._correctionFactor = v;
          if (this._joint) {
            this._joint.setCorrectionFactor(v);
          }
        }

        /**
         * @en
         * The linear offset from connected rigidbody to rigidbody.
         * @zh
         * 关节另一端的刚体相对于起始端刚体的位置偏移量。
         */
        get linearOffset() {
          if (this._autoCalcOffset) {
            if (this.connectedBody) {
              return Vec2.subtract(this._linearOffset, this.connectedBody.node.worldPosition, this.node.worldPosition);
            } else {
              //if connected body is not set, use scene origin as connected body
              return Vec2.subtract(this._linearOffset, new Vec2(0, 0), this.node.worldPosition);
            }
          }
          return this._linearOffset;
        }
        set linearOffset(v) {
          this._linearOffset.set(v);
          if (this._joint) {
            this._joint.setLinearOffset(v);
          }
        }

        /**
         * @en
         * The angular offset from connected rigidbody to rigidbody.
         * @zh
         * 关节另一端的刚体相对于起始端刚体的角度偏移量。
         */
        get angularOffset() {
          if (this._autoCalcOffset) {
            Quat.toEuler(tempVec3_1, this.node.worldRotation);
            if (this.connectedBody) {
              Quat.toEuler(tempVec3_2, this.connectedBody.node.worldRotation);
            } else {
              //if connected body is not set, use scene origin as connected body
              Quat.toEuler(tempVec3_2, new Quat()); //?
            }
            this._angularOffset = tempVec3_2.z - tempVec3_1.z;
          }
          return this._angularOffset;
        }
        set angularOffset(v) {
          this._angularOffset = v;
          if (this._joint) {
            this._joint.setAngularOffset(v);
          }
        }

        /**
         * @en
         * Auto calculate the angularOffset and linearOffset between the connected two rigid bodies.
         * @zh
         * 自动计算关节连接的两个刚体间的 angularOffset 和 linearOffset。
         */
        get autoCalcOffset() {
          return this._autoCalcOffset;
        }
        set autoCalcOffset(v) {
          this._autoCalcOffset = v;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "maxForce", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "maxForce"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxTorque", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "maxTorque"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "correctionFactor", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "correctionFactor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "linearOffset", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "linearOffset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angularOffset", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "angularOffset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "autoCalcOffset", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "autoCalcOffset"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_maxForce", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_maxTorque", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.7;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_correctionFactor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_angularOffset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_linearOffset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_autoCalcOffset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});