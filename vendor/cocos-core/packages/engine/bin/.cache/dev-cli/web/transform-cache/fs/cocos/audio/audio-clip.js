System.register("q-bundled:///fs/cocos/audio/audio-clip.js", ["../core/data/decorators/index.js", "pal/audio", "../asset/assets/asset.js", "../core/index.js", "../../pal/audio/type.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, override, AudioPlayer, Asset, cclegacy, AudioState, AudioType, _dec, _class, _class2, _descriptor, _AudioClip, AudioClip;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      override = _coreDataDecoratorsIndexJs.override;
    }, function (_palAudio) {
      AudioPlayer = _palAudio.AudioPlayer;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_palAudioTypeJs) {
      AudioState = _palAudioTypeJs.AudioState;
      AudioType = _palAudioTypeJs.AudioType;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * The audio clip asset.
       * @zh
       * 音频片段资源。
       */
      _export("AudioClip", AudioClip = (_dec = ccclass('cc.AudioClip'), _dec(_class = (_class2 = (_AudioClip = class AudioClip extends Asset {
        /**
         * @engineInternal
         */
        set duration(v) {
          this._duration = v;
        }
        constructor(name) {
          super(name);
          _initializerDefineProperty(this, "_duration", _descriptor, this);
          // we serialize this because it's unavailable at runtime on some platforms
          this._loadMode = AudioType.UNKNOWN_AUDIO;
          this._meta = null;
          this._player = null;
        }
        destroy() {
          var _this$_player;
          const destroyResult = super.destroy();
          (_this$_player = this._player) == null || _this$_player.destroy();
          this._player = null;
          if (this._meta) {
            this._meta.player = null;
          }
          return destroyResult;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        set _nativeAsset(meta) {
          this._meta = meta;
          if (meta) {
            this._loadMode = meta.type;
            this._player = meta.player;
          } else {
            this._meta = null;
            this._loadMode = AudioType.UNKNOWN_AUDIO;
            this._duration = 0;
          }
        }
        get _nativeAsset() {
          return this._meta;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeDep() {
          return {
            uuid: this._uuid,
            audioLoadMode: this.loadMode,
            ext: this._native,
            __isNative__: true
          };
        }
        get loadMode() {
          return this._loadMode;
        }
        validate() {
          return !!this._meta;
        }
        getDuration() {
          // Dynamicly loaded audioClip._duration is 0
          if (this._duration) {
            return this._duration;
          }
          return this._meta ? this._meta.duration : 0;
        }

        // #region deprecated method
        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.state instead.
         */
        get state() {
          return this._player ? this._player.state : AudioState.INIT;
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.getCurrentTime() instead.
         */
        getCurrentTime() {
          return this._player ? this._player.currentTime : 0;
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.getVolume() instead.
         */
        getVolume() {
          return this._player ? this._player.volume : 0;
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.getLoop() instead.
         */
        getLoop() {
          return this._player ? this._player.loop : false;
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.setCurrentTime() instead.
         */
        setCurrentTime(time) {
          var _this$_player2;
          (_this$_player2 = this._player) == null || _this$_player2.seek(time).catch(e => {});
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.setVolume() instead.
         */
        setVolume(volume) {
          if (this._player) {
            this._player.volume = volume;
          }
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.setLoop() instead.
         */
        setLoop(loop) {
          if (this._player) {
            this._player.loop = loop;
          }
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.play() instead.
         */
        play() {
          var _this$_player3;
          (_this$_player3 = this._player) == null || _this$_player3.play().catch(e => {});
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.pause() instead.
         */
        pause() {
          var _this$_player4;
          (_this$_player4 = this._player) == null || _this$_player4.pause().catch(e => {});
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.stop() instead.
         */
        stop() {
          var _this$_player5;
          (_this$_player5 = this._player) == null || _this$_player5.stop().catch(e => {});
        }

        /**
         * @deprecated since v3.1.0, please use AudioSource.prototype.playOneShot() instead.
         */
        playOneShot(volume = 1) {
          if (this._nativeAsset) {
            AudioPlayer.loadOneShotAudio(this._nativeAsset.url, volume).then(oneShotAudio => {
              oneShotAudio.play();
            }).catch(e => {});
          }
        }
        // #endregion deprecated method
      }, _AudioClip.AudioType = AudioType, _AudioClip), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "_nativeDep", [override], Object.getOwnPropertyDescriptor(_class2.prototype, "_nativeDep"), _class2.prototype), _class2)) || _class));
      cclegacy.AudioClip = AudioClip;
    }
  };
});