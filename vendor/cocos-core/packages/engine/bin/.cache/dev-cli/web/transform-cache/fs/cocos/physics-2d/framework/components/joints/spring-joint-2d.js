System.register("q-bundled:///fs/cocos/physics-2d/framework/components/joints/spring-joint-2d.js", ["./joint-2d.js", "../../physics-types.js", "../../../../core/index.js", "../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var Joint2D, EJoint2DType, CCBoolean, CCFloat, Vec3, _decorator, help, serializable, tooltip, type, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, ccclass, menu, SpringJoint2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_joint2dJs) {
      Joint2D = _joint2dJs.Joint2D;
    }, function (_physicsTypesJs) {
      EJoint2DType = _physicsTypesJs.EJoint2DType;
    }, function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      Vec3 = _coreIndexJs.Vec3;
      _decorator = _coreIndexJs._decorator;
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
      _export("SpringJoint2D", SpringJoint2D = (_dec = ccclass('cc.SpringJoint2D'), _dec2 = help('i18n:cc.Joint2D'), _dec3 = menu('Physics2D/Joints/SpringJoint2D'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics2d.joint.frequency'), _dec6 = type(CCFloat), _dec7 = tooltip('i18n:physics2d.joint.dampingRatio'), _dec8 = type(CCFloat), _dec9 = tooltip('i18n:physics2d.joint.distance'), _dec0 = type(CCBoolean), _dec1 = tooltip('i18n:physics2d.joint.autoCalcDistance'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class SpringJoint2D extends Joint2D {
        constructor(...args) {
          super(...args);
          this.TYPE = EJoint2DType.SPRING;
          /// private properties
          _initializerDefineProperty(this, "_frequency", _descriptor, this);
          _initializerDefineProperty(this, "_dampingRatio", _descriptor2, this);
          _initializerDefineProperty(this, "_distance", _descriptor3, this);
          _initializerDefineProperty(this, "_autoCalcDistance", _descriptor4, this);
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

        /**
         * @en
         * The distance separating the two ends of the joint.
         * @zh
         * 关节两端的距离。
         */
        get distance() {
          if (this._autoCalcDistance) {
            if (this.connectedBody) {
              return Vec3.distance(this.node.worldPosition, this.connectedBody.node.worldPosition);
            } else {
              //if connected body is not set, use scene origin as connected body
              return Vec3.len(this.node.worldPosition);
            }
          }
          return this._distance;
        }
        set distance(v) {
          this._distance = v;
          if (this._joint) {
            this._joint.setDistance(v);
          }
        }

        /**
         * @en
         * Auto calculate the distance between the connected two rigid bodies.
         * @zh
         * 自动计算关节连接的两个刚体间的距离。
         */
        get autoCalcDistance() {
          return this._autoCalcDistance;
        }
        set autoCalcDistance(v) {
          this._autoCalcDistance = v;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "frequency", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "frequency"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "dampingRatio", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "dampingRatio"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "distance", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "distance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "autoCalcDistance", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "autoCalcDistance"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_frequency", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_dampingRatio", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.7;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_distance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_autoCalcDistance", [serializable], {
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