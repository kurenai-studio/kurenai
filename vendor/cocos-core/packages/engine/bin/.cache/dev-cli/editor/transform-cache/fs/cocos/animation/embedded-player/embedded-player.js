System.register("q-bundled:///fs/cocos/animation/embedded-player/embedded-player.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../define.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, EditorExtendable, CLASS_NAME_PREFIX_ANIM, EmbeddedPlayable, EmbeddedPlayableState, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, EmbeddedPlayer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export({
    EmbeddedPlayable: void 0,
    EmbeddedPlayableState: void 0
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      EditorExtendable = _coreIndexJs.EditorExtendable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
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
      _export("EmbeddedPlayer", EmbeddedPlayer = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}EmbeddedPlayer`), _dec(_class = (_class2 = class EmbeddedPlayer extends EditorExtendable {
        constructor(...args) {
          super(...args);
          /**
           * @en
           * Begin time, in seconds.
           * @zh
           * 开始时间，以秒为单位。
           */
          _initializerDefineProperty(this, "begin", _descriptor, this);
          /**
            * @en
            * End time, in seconds.
            * @zh
            * 结束时间，以秒为单位。
            */
          _initializerDefineProperty(this, "end", _descriptor2, this);
          /**
            * @en
            * Whether the speed of this embedded player should be reconciled with the host animation clip.
            * @zh
            * 子区域的播放速度是否应和宿主动画剪辑保持一致。
            */
          _initializerDefineProperty(this, "reconciledSpeed", _descriptor3, this);
          /**
           * @en
           * Player of the embedded player.
           * @zh
           * 子区域的播放器。
           */
          _initializerDefineProperty(this, "playable", _descriptor4, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "begin", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "end", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "reconciledSpeed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "playable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      _export("EmbeddedPlayable", EmbeddedPlayable = class EmbeddedPlayable {});
      _export("EmbeddedPlayableState", EmbeddedPlayableState = class EmbeddedPlayableState {
        constructor(randomAccess) {
          this._randomAccess = randomAccess;
        }

        /**
         * @zh
         * 是否可以随意调整此播放器到任何时间。
         * @en
         * Indicates if this player can be adjusted to any time.
         */
        get randomAccess() {
          return this._randomAccess;
        }

        /**
         * @zh
         * 销毁此播放器。
         * @zh
         * Destroys this player state.
         */

        /**
         * @zh
         * 该方法在此播放器开始播放时触发。
         * @en
         * This method is called when this player gets to play.
         */

        /**
         * @zh
         * 该方法在此播放器暂停播放时触发。
         * @en
         * This method is called when this player pauses.
         */

        /**
         * @zh
         * 该方法在此播放器结束播放时触发，或在宿主动画剪辑本身停止播放时触发。
         * @en
         * This method is called when this player ends its playback, and is called when the host animation clip is stopped.
         */

        /**
         * @zh
         * 如果 [[`EmbeddedPlayer.reconciledSpeed`]] 为 `true`，则在宿主的播放速度改变时触发。
         * @en
         * If [[`EmbeddedPlayer.reconciledSpeed`]] is `true`, is called when the host changes its speed.
         * @param speed The speed.
         */

        setTime(_time) {}
      });
    }
  };
});