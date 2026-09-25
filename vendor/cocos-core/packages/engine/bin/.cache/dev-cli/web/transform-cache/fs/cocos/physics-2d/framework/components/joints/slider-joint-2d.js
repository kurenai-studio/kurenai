System.register("q-bundled:///fs/cocos/physics-2d/framework/components/joints/slider-joint-2d.js", ["./joint-2d.js", "../../physics-types.js", "../../../../core/index.js", "../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var Joint2D, EJoint2DType, Vec2, toDegree, _decorator, CCFloat, CCBoolean, help, serializable, tooltip, type, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, tempVec2, ccclass, menu, SliderJoint2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_joint2dJs) {
      Joint2D = _joint2dJs.Joint2D;
    }, function (_physicsTypesJs) {
      EJoint2DType = _physicsTypesJs.EJoint2DType;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      toDegree = _coreIndexJs.toDegree;
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
      tempVec2 = new Vec2();
      ({
        ccclass,
        menu
      } = _decorator);
      _export("SliderJoint2D", SliderJoint2D = (_dec = ccclass('cc.SliderJoint2D'), _dec2 = help('i18n:cc.Joint2D'), _dec3 = menu('Physics2D/Joints/SliderJoint2D'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics2d.joint.angle'), _dec6 = type(CCBoolean), _dec7 = tooltip('i18n:physics2d.joint.autoCalcAngle'), _dec8 = type(CCBoolean), _dec9 = tooltip('i18n:physics2d.joint.enableMotor'), _dec0 = type(CCFloat), _dec1 = tooltip('i18n:physics2d.joint.maxMotorForce'), _dec10 = type(CCFloat), _dec11 = tooltip('i18n:physics2d.joint.motorSpeed'), _dec12 = type(CCBoolean), _dec13 = tooltip('i18n:physics2d.joint.enableLimit'), _dec14 = type(CCFloat), _dec15 = tooltip('i18n:physics2d.joint.lowerLimit'), _dec16 = type(CCFloat), _dec17 = tooltip('i18n:physics2d.joint.upperLimit'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class SliderJoint2D extends Joint2D {
        constructor(...args) {
          super(...args);
          this.TYPE = EJoint2DType.SLIDER;
          /// private properties
          _initializerDefineProperty(this, "_angle", _descriptor, this);
          _initializerDefineProperty(this, "_autoCalcAngle", _descriptor2, this);
          _initializerDefineProperty(this, "_enableMotor", _descriptor3, this);
          _initializerDefineProperty(this, "_maxMotorForce", _descriptor4, this);
          _initializerDefineProperty(this, "_motorSpeed", _descriptor5, this);
          _initializerDefineProperty(this, "_enableLimit", _descriptor6, this);
          _initializerDefineProperty(this, "_lowerLimit", _descriptor7, this);
          _initializerDefineProperty(this, "_upperLimit", _descriptor8, this);
        }
        /**
         * @en Slide direction.
         * @zh 滑动的方向。
         */
        get angle() {
          if (this._autoCalcAngle) {
            if (this.connectedBody) {
              Vec2.subtract(tempVec2, this.connectedBody.node.worldPosition, this.node.worldPosition);
            } else {
              Vec2.subtract(tempVec2, new Vec2(0, 0), this.node.worldPosition);
            }
            this._angle = toDegree(Math.atan2(tempVec2.y, tempVec2.x));
          }
          return this._angle;
        }
        set angle(v) {
          this._angle = v;
        }

        /**
         * @en Auto calculate slide direction according to the slide direction.
         * @zh 根据连接的两个刚体自动计算滑动方向。
         */
        get autoCalcAngle() {
          return this._autoCalcAngle;
        }
        set autoCalcAngle(v) {
          this._autoCalcAngle = v;
        }

        /**
         * @en
         * Enable joint motor?
         * @zh
         * 是否开启关节马达？
         */
        get enableMotor() {
          return this._enableMotor;
        }
        set enableMotor(v) {
          this._enableMotor = v;
        }

        /**
         * @en
         * The maxium force can be applied to rigidbody to rearch the target motor speed.
         * @zh
         * 可以施加到刚体的最大力。
         */
        get maxMotorForce() {
          return this._maxMotorForce;
        }
        set maxMotorForce(v) {
          this._maxMotorForce = v;
          if (this._joint) {
            this._joint.setMaxMotorForce(v);
          }
        }

        /**
         * @en
         * The expected motor speed.
         * @zh
         * 期望的马达速度。
         */
        get motorSpeed() {
          return this._motorSpeed;
        }
        set motorSpeed(v) {
          this._motorSpeed = v;
          if (this._joint) {
            this._joint.setMotorSpeed(v);
          }
        }

        /**
         * @en
         * Enable joint distance limit?
         * @zh
         * 是否开启关节的距离限制？
         */
        get enableLimit() {
          return this._enableLimit;
        }
        set enableLimit(v) {
          this._enableLimit = v;
        }

        /**
         * @en
         * The lower joint limit.
         * @zh
         * 刚体能够移动的最小值。
         */
        get lowerLimit() {
          return this._lowerLimit;
        }
        set lowerLimit(v) {
          this._lowerLimit = v;
          if (this._joint) {
            this._joint.setLowerLimit(v);
          }
        }

        /**
         * @en
         * The lower joint limit.
         * @zh
         * 刚体能够移动的最大值。
         */
        get upperLimit() {
          return this._upperLimit;
        }
        set upperLimit(v) {
          this._upperLimit = v;
          if (this._joint) {
            this._joint.setUpperLimit(v);
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "angle", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "angle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "autoCalcAngle", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "autoCalcAngle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableMotor", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "enableMotor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxMotorForce", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "maxMotorForce"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "motorSpeed", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "motorSpeed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableLimit", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "enableLimit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lowerLimit", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "lowerLimit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "upperLimit", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "upperLimit"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_angle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_autoCalcAngle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_enableMotor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_maxMotorForce", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1000;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_motorSpeed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1000;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_enableLimit", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_lowerLimit", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_upperLimit", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});