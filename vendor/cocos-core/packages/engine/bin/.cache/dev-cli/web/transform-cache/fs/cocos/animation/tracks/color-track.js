System.register("q-bundled:///fs/cocos/animation/tracks/color-track.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../define.js", "./track.js", "./utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, RealCurve, Color, CLASS_NAME_PREFIX_ANIM, createEvalSymbol, Channel, Track, maskIfEmpty, ColorTrackEval, _dec, _class, _class2, _descriptor, CHANNEL_NAMES, ColorTrack;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("ColorTrackEval", void 0);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      RealCurve = _coreIndexJs.RealCurve;
      Color = _coreIndexJs.Color;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_trackJs) {
      Channel = _trackJs.Channel;
      Track = _trackJs.Track;
    }, function (_utilsJs) {
      maskIfEmpty = _utilsJs.maskIfEmpty;
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
      CHANNEL_NAMES = ['Red', 'Green', 'Blue', 'Alpha'];
      /**
       * @en
       * A color track animates a color attribute of target.
       * @zh
       * 颜色轨道描述目标上某个颜色属性的动画。
       */
      _export("ColorTrack", ColorTrack = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}ColorTrack`), _dec(_class = (_class2 = class ColorTrack extends Track {
        constructor() {
          super();
          _initializerDefineProperty(this, "_channels", _descriptor, this);
          this._channels = new Array(4);
          for (let i = 0; i < this._channels.length; ++i) {
            const channel = new Channel(new RealCurve());
            channel.name = CHANNEL_NAMES[i];
            this._channels[i] = channel;
          }
        }

        /**
         * @en The four channel of the track.
         * @zh 返回此轨道的四条通道。
         * @returns An readonly four length array in which
         * the element at n denotes the channel of n-th(in order of RGBA) color component(in form of integer within 0-255).
         */
        channels() {
          return this._channels;
        }

        /**
         * @internal
         */
        [createEvalSymbol]() {
          return new ColorTrackEval(maskIfEmpty(this._channels[0].curve), maskIfEmpty(this._channels[1].curve), maskIfEmpty(this._channels[2].curve), maskIfEmpty(this._channels[3].curve));
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_channels", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class2)) || _class));
      _export("ColorTrackEval", ColorTrackEval = class ColorTrackEval {
        constructor(_x, _y, _z, _w) {
          this._result = new Color();
          this._x = _x;
          this._y = _y;
          this._z = _z;
          this._w = _w;
        }
        get requiresDefault() {
          return !this._x || !this._y || !this._z || !this._w;
        }
        evaluate(time, defaultValue) {
          if (defaultValue) {
            Color.copy(this._result, defaultValue);
          }
          if (this._x) {
            this._result.r = this._x.evaluate(time);
          }
          if (this._y) {
            this._result.g = this._y.evaluate(time);
          }
          if (this._z) {
            this._result.b = this._z.evaluate(time);
          }
          if (this._w) {
            this._result.a = this._w.evaluate(time);
          }
          return this._result;
        }
      });
    }
  };
});