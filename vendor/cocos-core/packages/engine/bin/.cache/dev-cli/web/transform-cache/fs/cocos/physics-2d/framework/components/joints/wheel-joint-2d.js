System.register("q-bundled:///fs/cocos/physics-2d/framework/components/joints/wheel-joint-2d.js", ["./joint-2d.js", "../../../../core/index.js", "../../physics-types.js", "../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var Joint2D, CCBoolean, CCFloat, _decorator, EJoint2DType, help, serializable, tooltip, type, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, ccclass, menu, WheelJoint2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_joint2dJs) {
      Joint2D = _joint2dJs.Joint2D;
    }, function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      _decorator = _coreIndexJs._decorator;
    }, function (_physicsTypesJs) {
      EJoint2DType = _physicsTypesJs.EJoint2DType;
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
      ({
        ccclass,
        menu
      } = _decorator);
      _export("WheelJoint2D", WheelJoint2D = (_dec = ccclass('cc.WheelJoint2D'), _dec2 = help('i18n:cc.Joint2D'), _dec3 = menu('Physics2D/Joints/WheelJoint2D'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics2d.joint.angle'), _dec6 = type(CCBoolean), _dec7 = tooltip('i18n:physics2d.joint.enableMotor'), _dec8 = type(CCFloat), _dec9 = tooltip('i18n:physics2d.joint.maxMotorTorque'), _dec0 = type(CCFloat), _dec1 = tooltip('i18n:physics2d.joint.motorSpeed'), _dec10 = type(CCFloat), _dec11 = tooltip('i18n:physics2d.joint.frequency'), _dec12 = type(CCFloat), _dec13 = tooltip('i18n:physics2d.joint.dampingRatio'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class WheelJoint2D extends Joint2D {
        constructor(...args) {
          super(...args);
          this.TYPE = EJoint2DType.WHEEL;
          /// private properties
          _initializerDefineProperty(this, "_angle", _descriptor, this);
          _initializerDefineProperty(this, "_enableMotor", _descriptor2, this);
          _initializerDefineProperty(this, "_maxMotorTorque", _descriptor3, this);
          _initializerDefineProperty(this, "_motorSpeed", _descriptor4, this);
          _initializerDefineProperty(this, "_frequency", _descriptor5, this);
          _initializerDefineProperty(this, "_dampingRatio", _descriptor6, this);
        }
        /**
         * @en Wheel susspension direction.
         * @zh 轮子震动方向。
         */
        get angle() {
          return this._angle;
        }
        set angle(v) {
          this._angle = v;
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
          if (this._joint) {
            this._joint.enableMotor(v);
          }
        }

        /**
         * @en
         * The maxium torque can be applied to rigidbody to rearch the target motor speed.
         * @zh
         * 可以施加到刚体的最大扭矩。
         */
        get maxMotorTorque() {
          return this._maxMotorTorque;
        }
        set maxMotorTorque(v) {
          this._maxMotorTorque = v;
          if (this._joint) {
            this._joint.setMaxMotorTorque(v);
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
         * The spring frequency.
         * @zh
         * 弹性系数。
         */
        get frequency() {
          return this._frequency;
        }
        set frequency(v) {
          this._frequency = v;
          if (this._joint) {
            this._joint.setFrequency(v);
          }
        }

        /**
         * @en
         * The damping ratio.
         * @zh
         * 阻尼，表示关节变形后，恢复到初始状态受到的阻力。
         */
        get dampingRatio() {
          return this._dampingRatio;
        }
        set dampingRatio(v) {
          this._dampingRatio = v;
          if (this._joint) {
            this._joint.setDampingRatio(v);
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "angle", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "angle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableMotor", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "enableMotor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxMotorTorque", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "maxMotorTorque"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "motorSpeed", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "motorSpeed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "frequency", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "frequency"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "dampingRatio", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "dampingRatio"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_angle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 90;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_enableMotor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_maxMotorTorque", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1000;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_motorSpeed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_frequency", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_dampingRatio", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.7;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});