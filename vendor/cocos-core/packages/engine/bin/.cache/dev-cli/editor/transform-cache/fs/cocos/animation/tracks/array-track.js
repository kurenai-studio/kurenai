System.register("q-bundled:///fs/cocos/animation/tracks/array-track.js", ["../../core/index.js", "../define.js", "./track.js"], function (_export, _context) {
  "use strict";

  var _decorator, RealCurve, CLASS_NAME_PREFIX_ANIM, createEvalSymbol, Channel, Track, RealArrayTrackEval, _dec, _class, _class2, _descriptor, ccclass, serializable, RealArrayTrack;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("RealArrayTrackEval", void 0);
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
      RealCurve = _coreIndexJs.RealCurve;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_trackJs) {
      Channel = _trackJs.Channel;
      Track = _trackJs.Track;
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
        serializable
      } = _decorator);
      /**
       * @en
       * A real array track animates a real array attribute of target(such as morph weights of mesh renderer).
       * Every element in the array is corresponding to a real channel.
       * @zh
       * 实数数组轨道描述目标上某个实数数组属性（例如网格渲染器的形变权重）的动画。
       * 数组中的每个元素都对应一条实数通道。
       */
      _export("RealArrayTrack", RealArrayTrack = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}RealArrayTrack`), _dec(_class = (_class2 = class RealArrayTrack extends Track {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_channels", _descriptor, this);
        }
        /**
         * @en The number of elements in the array which this track produces.
         * If you increased the count, there will be new empty real channels appended.
         * Otherwise if you decreased the count, the last specified number channels would be removed.
         * @zh 此轨道产生的数组元素的数量。
         * 当你增加数量时，会增加新的空实数通道；当你减少数量时，最后几个指定数量的通道会被移除。
         */
        get elementCount() {
          return this._channels.length;
        }
        set elementCount(value) {
          const {
            _channels: channels
          } = this;
          const nChannels = channels.length;
          if (value < nChannels) {
            this._channels.splice(value);
          } else if (value > nChannels) {
            this._channels.push(...Array.from({
              length: value - nChannels
            }, () => new Channel(new RealCurve())));
          }
        }

        /**
         * @en The channels of the track.
         * @zh 返回此轨道的所有通道的数组。
         */
        channels() {
          return this._channels;
        }

        /**
         * @internal
         */
        [createEvalSymbol]() {
          return new RealArrayTrackEval(this._channels.map(({
            curve
          }) => curve));
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_channels", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      _export("RealArrayTrackEval", RealArrayTrackEval = class RealArrayTrackEval {
        constructor(_curves) {
          this._curves = _curves;
          this._result = new Array(_curves.length).fill(0.0);
        }
        get requiresDefault() {
          return false;
        }
        evaluate(time) {
          const {
            _result: result
          } = this;
          const nElements = result.length;
          for (let iElement = 0; iElement < nElements; ++iElement) {
            result[iElement] = this._curves[iElement].evaluate(time);
          }
          return this._result;
        }
      });
    }
  };
});