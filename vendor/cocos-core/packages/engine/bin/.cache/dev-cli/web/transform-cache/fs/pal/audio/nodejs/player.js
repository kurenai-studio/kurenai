System.register("q-bundled:///fs/pal/audio/nodejs/player.js", ["../type.js", "../../../cocos/core/event/index.js", "../../../cocos/core/global-exports.js", "../../../cocos/core/index.js", "../operation-queue.js"], function (_export, _context) {
  "use strict";

  var AudioState, AudioType, AudioEvent, EventTarget, legacyCC, clamp01, enqueueOperation, OneShotAudio, _class, INVALID_AUDIO_ID, AudioBufferFormat, AudioPlayer;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_typeJs) {
      AudioState = _typeJs.AudioState;
      AudioType = _typeJs.AudioType;
      AudioEvent = _typeJs.AudioEvent;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }, function (_cocosCoreIndexJs) {
      clamp01 = _cocosCoreIndexJs.clamp01;
    }, function (_operationQueueJs) {
      enqueueOperation = _operationQueueJs.enqueueOperation;
    }],
    execute: function () {
      INVALID_AUDIO_ID = -1;
      (function (AudioBufferFormat) {
        AudioBufferFormat[AudioBufferFormat["UNKNOWN"] = 0] = "UNKNOWN";
        AudioBufferFormat[AudioBufferFormat["SIGNED_8"] = 1] = "SIGNED_8";
        AudioBufferFormat[AudioBufferFormat["UNSIGNED_8"] = 2] = "UNSIGNED_8";
        AudioBufferFormat[AudioBufferFormat["SIGNED_16"] = 3] = "SIGNED_16";
        AudioBufferFormat[AudioBufferFormat["UNSIGNED_16"] = 4] = "UNSIGNED_16";
        AudioBufferFormat[AudioBufferFormat["SIGNED_32"] = 5] = "SIGNED_32";
        AudioBufferFormat[AudioBufferFormat["UNSIGNED_32"] = 6] = "UNSIGNED_32";
        AudioBufferFormat[AudioBufferFormat["FLOAT_32"] = 7] = "FLOAT_32";
        AudioBufferFormat[AudioBufferFormat["FLOAT_64"] = 8] = "FLOAT_64";
      })(AudioBufferFormat || (AudioBufferFormat = {}));
      ({
        [AudioBufferFormat.UNKNOWN]: undefined,
        [AudioBufferFormat.SIGNED_8]: {},
        [AudioBufferFormat.UNSIGNED_8]: {},
        [AudioBufferFormat.SIGNED_16]: {},
        [AudioBufferFormat.UNSIGNED_16]: {},
        [AudioBufferFormat.SIGNED_32]: {},
        [AudioBufferFormat.UNSIGNED_32]: {},
        [AudioBufferFormat.FLOAT_32]: {},
        [AudioBufferFormat.FLOAT_64]: {}
      });
      _export("OneShotAudio", OneShotAudio = class OneShotAudio {
        get onPlay() {
          return this._ccprivate$_onPlayCb;
        }
        set onPlay(cb) {
          this._ccprivate$_onPlayCb = cb;
        }
        get onEnd() {
          return this._ccprivate$_onEndCb;
        }
        set onEnd(cb) {
          this._ccprivate$_onEndCb = cb;
        }
        constructor(url, volume) {
          this._ccprivate$_id = INVALID_AUDIO_ID;
          this._ccprivate$_onPlayCb = void 0;
          this._ccprivate$_onEndCb = void 0;
        }
        play() {}
        stop() {
          if (this._ccprivate$_id === INVALID_AUDIO_ID) {
            return;
          }
        }
      });
      _export("AudioPlayer", AudioPlayer = (_class = class AudioPlayer {
        constructor(url) {
          this._ccprivate$_id = INVALID_AUDIO_ID;
          this._ccprivate$_state = AudioState.INIT;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_operationQueue = [];
          this._ccprivate$_cachedState = {
            duration: 1,
            loop: false,
            currentTime: 0,
            volume: 1
          };
        }
        destroy() {}
        static load(url, opts) {
          return new Promise((resolve, reject) => {
            AudioPlayer.loadNative(url, opts).then(url => {
              resolve(new AudioPlayer(url));
            }).catch(err => reject(err));
          });
        }
        static loadNative(url, opts) {
          return new Promise((resolve, reject) => {
            console.warn("Audio file parsing is not supported.");
            resolve(url);
          });
        }
        static loadOneShotAudio(url, volume, opts) {
          return new Promise((resolve, reject) => {
            AudioPlayer.loadNative(url, opts).then(url => {
              resolve(new OneShotAudio(url, volume));
            }).catch(reject);
          });
        }
        get _isValid() {
          return this._ccprivate$_id !== INVALID_AUDIO_ID;
        }
        get src() {
          return "";
        }
        get type() {
          return AudioType.NATIVE_AUDIO;
        }
        get state() {
          return this._ccprivate$_state;
        }
        get loop() {
          if (!this._isValid) {
            return this._ccprivate$_cachedState.loop;
          }
          return false;
        }
        set loop(val) {
          if (this._isValid) ;
          this._ccprivate$_cachedState.loop = val;
        }
        get volume() {
          if (!this._isValid) {
            return this._ccprivate$_cachedState.volume;
          }
          return 0;
        }
        set volume(val) {
          val = clamp01(val);
          if (this._isValid) ;
          this._ccprivate$_cachedState.volume = val;
        }
        get duration() {
          if (!this._isValid) {
            return this._ccprivate$_cachedState.duration;
          }
          return 0;
        }
        get currentTime() {
          if (!this._isValid) {
            return this._ccprivate$_cachedState.currentTime;
          }
          return 0;
        }
        get sampleRate() {
          return 0;
        }
        getPCMData(channelIndex) {
          return undefined;
        }
        seek(time) {
          return new Promise(resolve => {
            if (this._isValid) ;
            this._ccprivate$_cachedState.currentTime = time;
            return resolve();
          });
        }
        play() {
          return new Promise(resolve => {
            resolve();
          });
        }
        pause() {
          return new Promise(resolve => {
            resolve();
          });
        }
        stop() {
          return new Promise(resolve => {
            resolve();
          });
        }
        onInterruptionBegin(cb) {
          this._ccprivate$_eventTarget.on(AudioEvent.INTERRUPTION_BEGIN, cb);
        }
        offInterruptionBegin(cb) {
          this._ccprivate$_eventTarget.off(AudioEvent.INTERRUPTION_BEGIN, cb);
        }
        onInterruptionEnd(cb) {
          this._ccprivate$_eventTarget.on(AudioEvent.INTERRUPTION_END, cb);
        }
        offInterruptionEnd(cb) {
          this._ccprivate$_eventTarget.off(AudioEvent.INTERRUPTION_END, cb);
        }
        onEnded(cb) {
          this._ccprivate$_eventTarget.on(AudioEvent.ENDED, cb);
        }
        offEnded(cb) {
          this._ccprivate$_eventTarget.off(AudioEvent.ENDED, cb);
        }
      }, _applyDecoratedDescriptor(_class.prototype, "seek", [enqueueOperation], Object.getOwnPropertyDescriptor(_class.prototype, "seek"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "play", [enqueueOperation], Object.getOwnPropertyDescriptor(_class.prototype, "play"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "pause", [enqueueOperation], Object.getOwnPropertyDescriptor(_class.prototype, "pause"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "stop", [enqueueOperation], Object.getOwnPropertyDescriptor(_class.prototype, "stop"), _class.prototype), _class));
      legacyCC.AudioPlayer = AudioPlayer;
    }
  };
});