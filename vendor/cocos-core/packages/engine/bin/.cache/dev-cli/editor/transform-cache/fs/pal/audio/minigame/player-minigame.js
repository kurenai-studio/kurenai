System.register("q-bundled:///fs/pal/audio/minigame/player-minigame.js", ["pal/minigame", "pal/system-info", "../../../../virtual/internal%253Aconstants.js", "../../../cocos/core/event/index.js", "../type.js", "../../../cocos/core/index.js", "../operation-queue.js"], function (_export, _context) {
  "use strict";

  var minigame, systemInfo, HUAWEI, VIVO, OPPO, TAOBAO, TAOBAO_MINIGAME, EventTarget, AudioState, AudioEvent, AudioType, clamp01, clamp, enqueueOperation, OneShotAudioMinigame, _class, AudioPlayerMinigame;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_virtualInternal253AconstantsJs) {
      HUAWEI = _virtualInternal253AconstantsJs.HUAWEI;
      VIVO = _virtualInternal253AconstantsJs.VIVO;
      OPPO = _virtualInternal253AconstantsJs.OPPO;
      TAOBAO = _virtualInternal253AconstantsJs.TAOBAO;
      TAOBAO_MINIGAME = _virtualInternal253AconstantsJs.TAOBAO_MINIGAME;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_typeJs) {
      AudioState = _typeJs.AudioState;
      AudioEvent = _typeJs.AudioEvent;
      AudioType = _typeJs.AudioType;
    }, function (_cocosCoreIndexJs) {
      clamp01 = _cocosCoreIndexJs.clamp01;
      clamp = _cocosCoreIndexJs.clamp;
    }, function (_operationQueueJs) {
      enqueueOperation = _operationQueueJs.enqueueOperation;
    }],
    execute: function () {
      _export("OneShotAudioMinigame", OneShotAudioMinigame = class OneShotAudioMinigame {
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
        constructor(nativeAudio, volume) {
          this._ccprivate$_onPlayCb = void 0;
          this._ccprivate$_onEndCb = void 0;
          this._ccprivate$_innerAudioContext = nativeAudio;
          nativeAudio.volume = volume;
          nativeAudio.onPlay(() => {
            var _this$_ccprivate$_onP;
            (_this$_ccprivate$_onP = this._ccprivate$_onPlayCb) == null || _this$_ccprivate$_onP.call(this);
          });
          const endCallback = () => {
            if (this._ccprivate$_innerAudioContext) {
              var _this$_ccprivate$_onE;
              this._ccprivate$_innerAudioContext = null;
              systemInfo.off("hide", this._ccprivate$_onInterruptedBegin, this);
              systemInfo.off("show", this._ccprivate$_onInterruptedEnd, this);
              (_this$_ccprivate$_onE = this._ccprivate$_onEndCb) == null || _this$_ccprivate$_onE.call(this);
              nativeAudio.destroy();
            }
          };
          nativeAudio.onEnded(endCallback);
          nativeAudio.onStop(endCallback);
          systemInfo.on("hide", this._ccprivate$_onInterruptedBegin, this);
          systemInfo.on("show", this._ccprivate$_onInterruptedEnd, this);
        }
        _ccprivate$_onInterruptedBegin() {
          this._ccprivate$_innerAudioContext.pause();
        }
        _ccprivate$_onInterruptedEnd() {
          this._ccprivate$_innerAudioContext.play();
        }
        play() {
          this._ccprivate$_innerAudioContext.play();
        }
        stop() {
          this._ccprivate$_innerAudioContext.stop();
        }
      });
      _export("AudioPlayerMinigame", AudioPlayerMinigame = (_class = class AudioPlayerMinigame {
        _ccprivate$_resetSeekCache() {
          this._ccprivate$_cacheTime = 0;
          this._ccprivate$_needSeek = false;
          this._ccprivate$_seeking = false;
          if ((HUAWEI || VIVO || OPPO) && this._ccprivate$_innerAudioContext) {
            this._ccprivate$_innerAudioContext.startTime = 0;
          }
        }
        constructor(innerAudioContext) {
          this._ccprivate$_state = AudioState.INIT;
          this._ccprivate$_cacheTime = 0;
          this._ccprivate$_needSeek = false;
          this._ccprivate$_seeking = false;
          this._ccprivate$_readyToHandleOnShow = false;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_operationQueue = [];
          const self = this;
          self._ccprivate$_innerAudioContext = innerAudioContext;
          systemInfo.on("hide", self._ccprivate$_onInterruptedBegin, self);
          systemInfo.on("show", self._ccprivate$_onInterruptedEnd, self);
          const eventTarget = self._ccprivate$_eventTarget;
          self._ccprivate$_onPlay = () => {
            self._ccprivate$_state = AudioState.PLAYING;
            eventTarget.emit(AudioEvent.PLAYED);
            if (self._ccprivate$_needSeek) {
              self.seek(self._ccprivate$_cacheTime).catch(e => {});
            }
          };
          innerAudioContext.onPlay(self._ccprivate$_onPlay);
          self._ccprivate$_onPause = () => {
            self._ccprivate$_state = AudioState.PAUSED;
            try {
              const currentTime = self._ccprivate$_innerAudioContext.currentTime;
              if (currentTime !== null && currentTime !== undefined) {
                self._ccprivate$_cacheTime = currentTime;
              }
            } catch {}
            eventTarget.emit(AudioEvent.PAUSED);
          };
          innerAudioContext.onPause(self._ccprivate$_onPause);
          self._ccprivate$_onStop = () => {
            self._ccprivate$_state = AudioState.STOPPED;
            self._ccprivate$_resetSeekCache();
            eventTarget.emit(AudioEvent.STOPPED);
            if (TAOBAO || TAOBAO_MINIGAME) ;else {
              const currentTime = self._ccprivate$_innerAudioContext ? self._ccprivate$_innerAudioContext.currentTime : 0;
              if (currentTime !== 0) {
                self._ccprivate$_innerAudioContext.seek(0);
              }
            }
          };
          innerAudioContext.onStop(self._ccprivate$_onStop);
          self._ccprivate$_onSeeked = () => {
            eventTarget.emit(AudioEvent.SEEKED);
            self._ccprivate$_seeking = false;
            if (self._ccprivate$_needSeek) {
              self._ccprivate$_needSeek = false;
              if (self._ccprivate$_cacheTime.toFixed(2) !== self._ccprivate$_innerAudioContext.currentTime.toFixed(2)) {
                self.seek(self._ccprivate$_cacheTime).catch(e => {});
              }
            }
          };
          innerAudioContext.onSeeked(self._ccprivate$_onSeeked);
          self._ccprivate$_onEnded = () => {
            self._ccprivate$_state = AudioState.INIT;
            self._ccprivate$_resetSeekCache();
            eventTarget.emit(AudioEvent.ENDED);
          };
          innerAudioContext.onEnded(self._ccprivate$_onEnded);
        }
        destroy() {
          const self = this;
          systemInfo.off("hide", self._ccprivate$_onInterruptedBegin, self);
          systemInfo.off("show", self._ccprivate$_onInterruptedEnd, self);
          const innerAudioContext = self._ccprivate$_innerAudioContext;
          if (innerAudioContext) {
            ["Play", "Pause", "Stop", "Seeked", "Ended"].forEach(event => {
              self._ccprivate$_offEvent(event);
            });
            innerAudioContext.stop();
            innerAudioContext.destroy();
            self._ccprivate$_innerAudioContext = null;
            self._ccprivate$_state = AudioState.INIT;
          }
        }
        _ccprivate$_onInterruptedBegin() {
          if (this._ccprivate$_state === AudioState.PLAYING) {
            this.pause().then(() => {
              this._ccprivate$_state = AudioState.INTERRUPTED;
              this._ccprivate$_readyToHandleOnShow = true;
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_BEGIN);
            }).catch(e => {});
          }
        }
        _ccprivate$_onInterruptedEnd() {
          if (!this._ccprivate$_readyToHandleOnShow) {
            this._ccprivate$_eventTarget.once(AudioEvent.INTERRUPTION_END, this._ccprivate$_onInterruptedEnd, this);
            return;
          }
          if (this._ccprivate$_state === AudioState.INTERRUPTED) {
            this.play().then(() => {
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_END);
            }).catch(e => {});
          }
          this._ccprivate$_readyToHandleOnShow = false;
        }
        _ccprivate$_offEvent(eventName) {
          if (this[`_on${eventName}`]) {
            this._ccprivate$_innerAudioContext[`off${eventName}`](this[`_on${eventName}`]);
            this[`_on${eventName}`] = null;
          }
        }
        get src() {
          return this._ccprivate$_innerAudioContext ? this._ccprivate$_innerAudioContext.src : "";
        }
        get type() {
          return AudioType.MINIGAME_AUDIO;
        }
        static load(url) {
          return new Promise((resolve, reject) => {
            AudioPlayerMinigame.loadNative(url).then(innerAudioContext => {
              resolve(new AudioPlayerMinigame(innerAudioContext));
            }).catch(reject);
          });
        }
        static loadNative(url) {
          return new Promise((resolve, reject) => {
            const innerAudioContext = minigame.createInnerAudioContext();
            const timer = setTimeout(() => {
              clearEvent();
              resolve(innerAudioContext);
            }, 8000);
            function clearEvent() {
              innerAudioContext.offCanplay(success);
              innerAudioContext.offError(fail);
            }
            function success() {
              clearEvent();
              clearTimeout(timer);
              resolve(innerAudioContext);
            }
            function fail(err) {
              clearEvent();
              clearTimeout(timer);
              console.error("failed to load innerAudioContext");
              reject(new Error(err));
            }
            innerAudioContext.onCanplay(success);
            innerAudioContext.onError(fail);
            innerAudioContext.src = url;
          });
        }
        static loadOneShotAudio(url, volume) {
          return new Promise((resolve, reject) => {
            AudioPlayerMinigame.loadNative(url).then(innerAudioContext => {
              resolve(new OneShotAudioMinigame(innerAudioContext, volume));
            }).catch(reject);
          });
        }
        get state() {
          return this._ccprivate$_state;
        }
        get loop() {
          return this._ccprivate$_innerAudioContext.loop;
        }
        set loop(val) {
          this._ccprivate$_innerAudioContext.loop = val;
        }
        get volume() {
          return this._ccprivate$_innerAudioContext.volume;
        }
        set volume(val) {
          val = clamp01(val);
          this._ccprivate$_innerAudioContext.volume = val;
        }
        get duration() {
          return this._ccprivate$_innerAudioContext.duration;
        }
        get currentTime() {
          if ((HUAWEI || VIVO || OPPO) && (this._ccprivate$_state === AudioState.STOPPED || this._ccprivate$_state === AudioState.INIT)) {
            return this._ccprivate$_innerAudioContext.startTime;
          }
          if (this._ccprivate$_state !== AudioState.PLAYING || this._ccprivate$_needSeek || this._ccprivate$_seeking) {
            return this._ccprivate$_cacheTime;
          }
          return this._ccprivate$_innerAudioContext.currentTime;
        }
        get sampleRate() {
          return 0;
        }
        getPCMData(channelIndex) {
          return undefined;
        }
        seek(time) {
          return new Promise(resolve => {
            if (this._ccprivate$_state === AudioState.PLAYING && !this._ccprivate$_seeking) {
              time = clamp(time, 0, this.duration);
              this._ccprivate$_seeking = true;
              this._ccprivate$_cacheTime = time;
              this._ccprivate$_eventTarget.once(AudioEvent.SEEKED, resolve);
              this._ccprivate$_innerAudioContext.seek(time);
            } else {
              if ((HUAWEI || VIVO || OPPO) && (this._ccprivate$_state === AudioState.STOPPED || this._ccprivate$_state === AudioState.INIT)) {
                this._ccprivate$_innerAudioContext.startTime = time;
              } else if (this._ccprivate$_cacheTime !== time) {
                this._ccprivate$_cacheTime = time;
                this._ccprivate$_needSeek = true;
              }
              resolve();
            }
          });
        }
        play() {
          return new Promise(resolve => {
            this._ccprivate$_eventTarget.once(AudioEvent.PLAYED, resolve);
            this._ccprivate$_innerAudioContext.play();
          });
        }
        pause() {
          return new Promise(resolve => {
            if (this.state !== AudioState.PLAYING) {
              resolve();
            } else {
              this._ccprivate$_eventTarget.once(AudioEvent.PAUSED, resolve);
              this._ccprivate$_innerAudioContext.pause();
            }
          });
        }
        stop() {
          return new Promise(resolve => {
            if (AudioState.INIT === this._ccprivate$_state) {
              this._ccprivate$_resetSeekCache();
              resolve();
              return;
            }
            this._ccprivate$_eventTarget.once(AudioEvent.STOPPED, resolve);
            this._ccprivate$_innerAudioContext.stop();
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
    }
  };
});