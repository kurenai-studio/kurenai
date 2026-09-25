System.register("q-bundled:///fs/cocos/animation/tracks/vector-track.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../define.js", "./track.js", "./utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, RealCurve, Vec2, Vec3, Vec4, CLASS_NAME_PREFIX_ANIM, createEvalSymbol, Channel, Track, maskIfEmpty, Vec2TrackEval, Vec3TrackEval, Vec4TrackEval, _dec, _class, _class2, _descriptor, _descriptor2, CHANNEL_NAMES, VectorTrack;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export({
    Vec2TrackEval: void 0,
    Vec3TrackEval: void 0,
    Vec4TrackEval: void 0
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      RealCurve = _coreIndexJs.RealCurve;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
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
      CHANNEL_NAMES = ['X', 'Y', 'Z', 'W'];
      /**
       * @en
       * A vector track animates a vector(in 2, 3, 4 dimension) attribute of target.
       * @zh
       * 向量轨道描述目标上某个（二、三、四维）向量属性的动画。
       */
      _export("VectorTrack", VectorTrack = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}VectorTrack`), _dec(_class = (_class2 = class VectorTrack extends Track {
        constructor() {
          super();
          _initializerDefineProperty(this, "_channels", _descriptor, this);
          _initializerDefineProperty(this, "_nComponents", _descriptor2, this);
          this._channels = new Array(4);
          for (let i = 0; i < this._channels.length; ++i) {
            const channel = new Channel(new RealCurve());
            channel.name = CHANNEL_NAMES[i];
            this._channels[i] = channel;
          }
        }

        /**
         * @en Gets or sets the count of components(dimension) available while evaluating of this track.
         * @zh 获取或设置此轨道在求值时有效的分量数（维度）。
         */
        get componentsCount() {
          return this._nComponents;
        }
        set componentsCount(value) {
          this._nComponents = value;
        }

        /**
         * @en The four channel of the track.
         * @zh 返回此轨道的四条通道。
         * @returns An readonly four length array in which
         * the element at n denotes the channel of n-th vector component.
         */
        channels() {
          return this._channels;
        }

        /**
         * @internal
         */
        [createEvalSymbol]() {
          switch (this._nComponents) {
            default:
            case 2:
              return new Vec2TrackEval(maskIfEmpty(this._channels[0].curve), maskIfEmpty(this._channels[1].curve));
            case 3:
              return new Vec3TrackEval(maskIfEmpty(this._channels[0].curve), maskIfEmpty(this._channels[1].curve), maskIfEmpty(this._channels[2].curve));
            case 4:
              return new Vec4TrackEval(maskIfEmpty(this._channels[0].curve), maskIfEmpty(this._channels[1].curve), maskIfEmpty(this._channels[2].curve), maskIfEmpty(this._channels[3].curve));
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_channels", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_nComponents", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 4;
        }
      }), _class2)) || _class));
      _export("Vec2TrackEval", Vec2TrackEval = class Vec2TrackEval {
        constructor(_x, _y) {
          this._result = new Vec2();
          this._x = _x;
          this._y = _y;
        }
        get requiresDefault() {
          return !this._x || !this._y;
        }
        evaluate(time, defaultValue) {
          if (defaultValue) {
            Vec2.copy(this._result, defaultValue);
          }
          if (this._x) {
            this._result.x = this._x.evaluate(time);
          }
          if (this._y) {
            this._result.y = this._y.evaluate(time);
          }
          return this._result;
        }
      });
      _export("Vec3TrackEval", Vec3TrackEval = class Vec3TrackEval {
        constructor(_x, _y, _z) {
          this._result = new Vec3();
          this._x = _x;
          this._y = _y;
          this._z = _z;
        }
        get requiresDefault() {
          return !this._x || !this._y || !this._z;
        }
        evaluate(time, defaultValue) {
          const {
            _x,
            _y,
            _z,
            _result
          } = this;
          if (defaultValue) {
            Vec3.copy(_result, defaultValue);
          }
          if (_x) {
            _result.x = _x.evaluate(time);
          }
          if (_y) {
            _result.y = _y.evaluate(time);
          }
          if (_z) {
            _result.z = _z.evaluate(time);
          }
          return _result;
        }
      });
      _export("Vec4TrackEval", Vec4TrackEval = class Vec4TrackEval {
        constructor(_x, _y, _z, _w) {
          this._result = new Vec4();
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
            Vec4.copy(this._result, defaultValue);
          }
          if (this._x) {
            this._result.x = this._x.evaluate(time);
          }
          if (this._y) {
            this._result.y = this._y.evaluate(time);
          }
          if (this._z) {
            this._result.z = this._z.evaluate(time);
          }
          if (this._w) {
            this._result.w = this._w.evaluate(time);
          }
          return this._result;
        }
      });
    }
  };
});