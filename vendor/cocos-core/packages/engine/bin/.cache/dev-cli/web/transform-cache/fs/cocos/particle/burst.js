System.register("q-bundled:///fs/cocos/particle/burst.js", ["../core/data/decorators/index.js", "../core/math/index.js", "./animator/curve-range.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, editable, range, approxGE, approxLT, repeat, CurveRange, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, Burst;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_coreMathIndexJs) {
      approxGE = _coreMathIndexJs.approxGE;
      approxLT = _coreMathIndexJs.approxLT;
      repeat = _coreMathIndexJs.repeat;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
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
       * @en
       * A burst is a particle emission event, where a number of particles are all emitted at the same time
       * @zh
       * Burst 是粒子的一种发射事件，触发时很多粒子将会同时喷出
       */
      _export("default", Burst = (_dec = ccclass('cc.Burst'), _dec2 = type(CurveRange), _dec3 = range([0, Number.POSITIVE_INFINITY, 1]), _dec(_class = (_class2 = class Burst {
        /**
         *  @en The time from particle system start until this burst triggered.
         *  @zh 粒子系统开始运行到触发此次 Brust 的时间。
         */
        get time() {
          return this._time;
        }
        set time(val) {
          this._time = val;
          this._curTime = val;
        }
        /**
         * @en Burst trigger count.
         * @zh Burst 的触发次数。
         */
        get repeatCount() {
          return this._repeatCount;
        }
        set repeatCount(val) {
          this._repeatCount = val;
          this._remainingCount = val;
        }

        /**
         * @en Trigger interval count.
         * @zh 每次触发的间隔时间。
         */

        constructor() {
          _initializerDefineProperty(this, "_time", _descriptor, this);
          _initializerDefineProperty(this, "_repeatCount", _descriptor2, this);
          _initializerDefineProperty(this, "repeatInterval", _descriptor3, this);
          /**
           * @en Burst particle count.
           * @zh 发射的粒子的数量。
           */
          _initializerDefineProperty(this, "count", _descriptor4, this);
          this._remainingCount = 0;
          this._curTime = 0.0;
        }

        /**
         * @en Update burst trigger
         * @zh 更新触发事件
         * @param psys @en Particle system to burst. @zh 要触发的粒子系统。
         * @param dt @en Update interval time. @zh 粒子系统更新的间隔时间。
         * @internal
         */
        update(psys, dt) {
          if (this._remainingCount === 0) {
            this._remainingCount = this._repeatCount;
            this._curTime = this._time;
          }
          if (this._remainingCount > 0) {
            let preFrameTime = repeat(psys.time - psys.startDelay.evaluate(0, 1), psys.duration) - dt;
            preFrameTime = preFrameTime > 0.0 ? preFrameTime : 0.0;
            const curFrameTime = repeat(psys.time - psys.startDelay.evaluate(0, 1), psys.duration);
            if (approxGE(this._curTime, preFrameTime) && approxLT(this._curTime, curFrameTime)) {
              psys.emit(this.count.evaluate(this._curTime / psys.duration, 1), dt - (curFrameTime - this._curTime));
              this._curTime += this.repeatInterval;
              --this._remainingCount;
            }
          }
        }

        /**
         * @en Reset remaining burst count and burst time to zero.
         * @zh 重置触发时间和留存的触发次数为零。
         */
        reset() {
          this._remainingCount = 0;
          this._curTime = 0.0;
        }

        /**
         * @en Get the max particle count this burst trigger.
         * @zh 获取最大的触发粒子数量。
         * @param psys @en Particle system to burst. @zh 要触发的粒子系统。
         * @returns @en burst max particle count. @zh 一次最多触发的粒子个数。
         */
        getMaxCount(psys) {
          return this.count.getMax() * Math.min(Math.ceil(psys.duration / this.repeatInterval), this.repeatCount);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_time", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "time", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "time"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_repeatCount", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "repeatCount", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "repeatCount"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "repeatInterval", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "count", [_dec2, serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _class2)) || _class));
    }
  };
});