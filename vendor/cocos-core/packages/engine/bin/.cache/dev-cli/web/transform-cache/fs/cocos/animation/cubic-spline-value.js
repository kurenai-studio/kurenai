System.register("q-bundled:///fs/cocos/animation/cubic-spline-value.js", ["../core/data/decorators/index.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, Quat, Vec2, Vec3, Vec4, _dec2, _class3, _class4, _descriptor4, _descriptor5, _descriptor6, CubicSplineVec2Value, CubicSplineVec3Value, CubicSplineVec4Value, CubicSplineQuatValue, CubicSplineNumberValue;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); } /*
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
  function makeCubicSplineValueConstructor(name, ConstructorX, scaleFx, scaleAndAdd) {
    var _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3;
    let tempValue = new ConstructorX();
    let m0 = new ConstructorX();
    let m1 = new ConstructorX();
    let CubicSplineValueClass = (_dec = ccclass(name), _dec(_class = (_class2 = class CubicSplineValueClass {
      constructor(dataPoint, inTangent, outTangent) {
        _initializerDefineProperty(this, "dataPoint", _descriptor, this);
        _initializerDefineProperty(this, "inTangent", _descriptor2, this);
        _initializerDefineProperty(this, "outTangent", _descriptor3, this);
        this.dataPoint = dataPoint || new ConstructorX();
        this.inTangent = inTangent || new ConstructorX();
        this.outTangent = outTangent || new ConstructorX();
      }
      lerp(to, t, dt) {
        const p0 = this.dataPoint;
        const p1 = to.dataPoint;
        // dt => t_k+1 - t_k
        m0 = scaleFx(m0, this.inTangent, dt);
        m1 = scaleFx(m1, to.outTangent, dt);
        const t_3 = t * t * t;
        const t_2 = t * t;
        const f_0 = 2 * t_3 - 3 * t_2 + 1;
        const f_1 = t_3 - 2 * t_2 + t;
        const f_2 = -2 * t_3 + 3 * t_2;
        const f_3 = t_3 - t_2;
        tempValue = scaleFx(tempValue, p0, f_0);
        tempValue = scaleAndAdd(tempValue, tempValue, m0, f_1);
        tempValue = scaleAndAdd(tempValue, tempValue, p1, f_2);
        tempValue = scaleAndAdd(tempValue, tempValue, m1, f_3);
        return tempValue;
      }
      getNoLerp() {
        return this.dataPoint;
      }
    }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "dataPoint", [serializable], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return new ConstructorX();
      }
    }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "inTangent", [serializable], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return new ConstructorX();
      }
    }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "outTangent", [serializable], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return new ConstructorX();
      }
    }), _class2)) || _class); // TODO: This comparison appears to be unintentional because the types 'new () => T' and 'typeof Quat' have no overlap. @Lelie Leight
    // Tracking issue: https://github.com/cocos/cocos-engine/issues/14640
    if (ConstructorX === Quat) {
      const lerp = CubicSplineValueClass.prototype.lerp;
      CubicSplineValueClass.prototype.lerp = function (to, t, dt) {
        const result = lerp.call(this, to, t, dt);
        Quat.normalize(result, result);
        return result;
      };
    }
    return CubicSplineValueClass;
  }

  /**
   * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
   */
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
    }],
    execute: function () {
      _export("CubicSplineVec2Value", CubicSplineVec2Value = makeCubicSplineValueConstructor('cc.CubicSplineVec2Value', Vec2, Vec2.multiplyScalar, Vec2.scaleAndAdd));
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      _export("CubicSplineVec3Value", CubicSplineVec3Value = makeCubicSplineValueConstructor('cc.CubicSplineVec3Value', Vec3, Vec3.multiplyScalar, Vec3.scaleAndAdd));
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      _export("CubicSplineVec4Value", CubicSplineVec4Value = makeCubicSplineValueConstructor('cc.CubicSplineVec4Value', Vec4, Vec4.multiplyScalar, Vec4.scaleAndAdd));
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      _export("CubicSplineQuatValue", CubicSplineQuatValue = makeCubicSplineValueConstructor('cc.CubicSplineQuatValue', Quat, Quat.multiplyScalar, Quat.scaleAndAdd));
      /**
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      _export("CubicSplineNumberValue", CubicSplineNumberValue = (_dec2 = ccclass('cc.CubicSplineNumberValue'), _dec2(_class3 = (_class4 = class CubicSplineNumberValue {
        constructor(dataPoint, inTangent, outTangent) {
          _initializerDefineProperty(this, "dataPoint", _descriptor4, this);
          _initializerDefineProperty(this, "inTangent", _descriptor5, this);
          _initializerDefineProperty(this, "outTangent", _descriptor6, this);
          this.dataPoint = dataPoint;
          this.inTangent = inTangent;
          this.outTangent = outTangent;
        }
        lerp(to, t, dt) {
          const p0 = this.dataPoint;
          const p1 = to.dataPoint;
          // dt => t_k+1 - t_k
          const m0 = this.outTangent * dt;
          const m1 = to.inTangent * dt;
          const t_3 = t * t * t;
          const t_2 = t * t;
          const f_0 = 2 * t_3 - 3 * t_2 + 1;
          const f_1 = t_3 - 2 * t_2 + t;
          const f_2 = -2 * t_3 + 3 * t_2;
          const f_3 = t_3 - t_2;
          return p0 * f_0 + m0 * f_1 + p1 * f_2 + m1 * f_3;
        }
        getNoLerp() {
          return this.dataPoint;
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "dataPoint", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "inTangent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "outTangent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class4)) || _class3));
    }
  };
});