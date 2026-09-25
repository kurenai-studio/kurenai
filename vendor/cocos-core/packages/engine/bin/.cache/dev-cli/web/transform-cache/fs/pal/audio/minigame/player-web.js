System.register("q-bundled:///fs/pal/audio/minigame/player-web.js", ["pal/minigame", "../../../cocos/core/index.js", "../../../cocos/core/platform/debug.js", "../../../cocos/core/event/index.js", "../audio-buffer-manager.js", "../audio-timer.js", "../operation-queue.js", "../type.js", "../../../cocos/game/index.js"], function (_export, _context) {
  "use strict";

  var minigame, clamp01, debug, EventTarget, audioBufferManager, AudioTimer, enqueueOperation, AudioState, AudioEvent, AudioType, AudioPCMDataView, game, Game, OneShotAudioWeb, _minigame$tt, _class, audioContext, AudioPlayerWeb;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_cocosCoreIndexJs) {
      clamp01 = _cocosCoreIndexJs.clamp01;
    }, function (_cocosCorePlatformDebugJs) {
      debug = _cocosCorePlatformDebugJs;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_audioBufferManagerJs) {
      audioBufferManager = _audioBufferManagerJs.audioBufferManager;
    }, function (_audioTimerJs) {
      AudioTimer = _audioTimerJs.default;
    }, function (_operationQueueJs) {
      enqueueOperation = _operationQueueJs.enqueueOperation;
    }, function (_typeJs) {
      AudioState = _typeJs.AudioState;
      AudioEvent = _typeJs.AudioEvent;
      AudioType = _typeJs.AudioType;
      AudioPCMDataView = _typeJs.AudioPCMDataView;
    }, function (_cocosGameIndexJs) {
      game = _cocosGameIndexJs.game;
      Game = _cocosGameIndexJs.Game;
    }],
    execute: function () {
      audioContext = (_minigame$tt = minigame.tt) == null || _minigame$tt.getAudioContext == null ? void 0 : _minigame$tt.getAudioContext();
      _export("OneShotAudioWeb", OneShotAudioWeb = class OneShotAudioWeb {
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
        constructor(audioBuffer, volume, url) {
          this._ccprivate$_bufferSourceNode = void 0;
          this._ccprivate$_onPlayCb = void 0;
          this._ccprivate$_url = void 0;
          this._ccprivate$_onEndCb = void 0;
          this._ccprivate$_bufferSourceNode = audioContext.createBufferSource();
          this._ccprivate$_bufferSourceNode.buffer = audioBuffer;
          this._ccprivate$_bufferSourceNode.loop = false;
          this._ccprivate$_url = url;
          const gainNode = audioContext.createGain();
          gainNode.gain.value = volume;
          this._ccprivate$_bufferSourceNode.connect(gainNode);
          gainNode.connect(audioContext.destination);
        }
        play() {
          var _this$onPlay;
          this._ccprivate$_bufferSourceNode.start();
          (_this$onPlay = this.onPlay) == null || _this$onPlay.call(this);
          this._ccprivate$_bufferSourceNode.onended = () => {
            var _this$_ccprivate$_onE;
            audioBufferManager._ccprivate$tryReleasingCache(this._ccprivate$_url);
            (_this$_ccprivate$_onE = this._ccprivate$_onEndCb) == null || _this$_ccprivate$_onE.call(this);
          };
        }
        stop() {
          this._ccprivate$_bufferSourceNode.onended = null;
          audioBufferManager._ccprivate$tryReleasingCache(this._ccprivate$_url);
          this._ccprivate$_bufferSourceNode.stop();
          this._ccprivate$_bufferSourceNode.disconnect();
          this._ccprivate$_bufferSourceNode.buffer = null;
        }
      });
      _export("AudioPlayerWeb", AudioPlayerWeb = (_class = class AudioPlayerWeb {
        constructor(audioBuffer, url) {
          this._ccprivate$_src = void 0;
          this._ccprivate$_audioBuffer = void 0;
          this._ccprivate$_sourceNode = void 0;
          this._ccprivate$_gainNode = void 0;
          this._ccprivate$_volume = 1;
          this._ccprivate$_loop = false;
          this._ccprivate$_state = AudioState.INIT;
          this._ccprivate$_audioTimer = void 0;
          this._ccprivate$_readyToHandleOnShow = false;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_operationQueue = [];
          this._ccprivate$_audioBuffer = audioBuffer;
          this._ccprivate$_audioTimer = new AudioTimer(audioBuffer);
          this._ccprivate$_gainNode = audioContext.createGain();
          this._ccprivate$_gainNode.connect(audioContext.destination);
          this._ccprivate$_src = url;
          game.on(Game.EVENT_PAUSE, this._ccprivate$_onInterruptedBegin, this);
          game.on(Game.EVENT_RESUME, this._ccprivate$_onInterruptedEnd, this);
        }
        destroy() {
          this._ccprivate$_audioTimer.destroy();
          if (this._ccprivate$_audioBuffer) {
            this._ccprivate$_audioBuffer = null;
          }
          audioBufferManager._ccprivate$tryReleasingCache(this._ccprivate$_src);
          game.off(Game.EVENT_PAUSE, this._ccprivate$_onInterruptedBegin, this);
          game.off(Game.EVENT_RESUME, this._ccprivate$_onInterruptedEnd, this);
        }
        _ccprivate$_onInterruptedBegin() {
          if (this._ccprivate$_state === AudioState.PLAYING) {
            this.pause().then(() => {
              this._ccprivate$_state = AudioState.INTERRUPTED;
              this._ccprivate$_readyToHandleOnShow = true;
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_BEGIN);
            }).catch(e => {
              debug.warn("_onInterruptedBegin error", e);
            });
          }
        }
        _ccprivate$_onInterruptedEnd() {
          if (!this._ccprivate$_readyToHandleOnShow) {
            this._ccprivate$_eventTarget.once(AudioEvent.INTERRUPTION_BEGIN, this._ccprivate$_onInterruptedEnd, this);
            return;
          }
          if (this._ccprivate$_state === AudioState.INTERRUPTED) {
            this.play().then(() => {
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_END);
            }).catch(e => {
              debug.warn("_onInterruptedEnd error", e);
            });
          }
          this._ccprivate$_readyToHandleOnShow = false;
        }
        static load(url) {
          return new Promise((resolve, reject) => {
            AudioPlayerWeb.loadNative(url).then(audioBuffer => {
              resolve(new AudioPlayerWeb(audioBuffer, url));
            }).catch(reject);
          });
        }
        static loadNative(url) {
          return new Promise((resolve, reject) => {
            const cachedAudioBuffer = audioBufferManager._ccprivate$getCache(url);
            if (cachedAudioBuffer) {
              audioBufferManager._ccprivate$retainCache(url);
              resolve(cachedAudioBuffer);
              return;
            }
            globalThis.fsUtils.readArrayBuffer(url, (err, arrayBuffer) => {
              if (err) {
                reject(err);
                return;
              }
              audioContext.decodeAudioData(arrayBuffer).then(decodedAudioBuffer => {
                audioBufferManager._ccprivate$addCache(url, decodedAudioBuffer);
                resolve(decodedAudioBuffer);
              }).catch(reject);
            });
          });
        }
        static loadOneShotAudio(url, volume) {
          return new Promise((resolve, reject) => {
            AudioPlayerWeb.loadNative(url).then(audioBuffer => {
              const oneShotAudio = new OneShotAudioWeb(audioBuffer, volume, url);
              resolve(oneShotAudio);
            }).catch(reject);
          });
        }
        get src() {
          return this._ccprivate$_src;
        }
        get type() {
          return AudioType.WEB_AUDIO;
        }
        get state() {
          return this._ccprivate$_state;
        }
        get loop() {
          return this._ccprivate$_loop;
        }
        set loop(val) {
          this._ccprivate$_loop = val;
          if (this._ccprivate$_sourceNode) {
            this._ccprivate$_sourceNode.loop = val;
          }
        }
        get volume() {
          return this._ccprivate$_volume;
        }
        set volume(val) {
          val = clamp01(val);
          this._ccprivate$_volume = val;
          this._ccprivate$_gainNode.gain.value = val;
        }
        get duration() {
          return this._ccprivate$_audioBuffer.duration;
        }
        get currentTime() {
          return this._ccprivate$_audioTimer.currentTime;
        }
        get sampleRate() {
          return this._ccprivate$_audioBuffer.sampleRate;
        }
        getPCMData(channelIndex) {
          return new AudioPCMDataView(this._ccprivate$_audioBuffer.getChannelData(channelIndex), 1);
        }
        seek(time) {
          return new Promise(resolve => {
            this._ccprivate$_audioTimer.seek(time);
            if (this._ccprivate$_state === AudioState.PLAYING) {
              this._ccprivate$_doPlay().then(resolve).catch(e => {
                debug.warn("seek error", e);
              });
            } else {
              resolve();
            }
          });
        }
        play() {
          return this._ccprivate$_doPlay();
        }
        _ccprivate$_doPlay() {
          return new Promise(resolve => {
            this._ccprivate$_stopSourceNode();
            this._ccprivate$_sourceNode = audioContext.createBufferSource();
            this._ccprivate$_sourceNode.buffer = this._ccprivate$_audioBuffer;
            this._ccprivate$_sourceNode.loop = this._ccprivate$_loop;
            this._ccprivate$_sourceNode.connect(this._ccprivate$_gainNode);
            this._ccprivate$_sourceNode.start(0, this._ccprivate$_audioTimer.currentTime);
            this._ccprivate$_state = AudioState.PLAYING;
            this._ccprivate$_audioTimer.start();
            this._ccprivate$_sourceNode.onended = () => {
              this._ccprivate$_audioTimer.stop();
              this._ccprivate$_eventTarget.emit(AudioEvent.ENDED);
              this._ccprivate$_state = AudioState.INIT;
            };
            resolve();
          });
        }
        _ccprivate$_stopSourceNode() {
          try {
            if (this._ccprivate$_sourceNode) {
              this._ccprivate$_sourceNode.onended = null;
              this._ccprivate$_sourceNode.stop();
              this._ccprivate$_sourceNode.disconnect();
              this._ccprivate$_sourceNode.buffer = null;
              this._ccprivate$_sourceNode = undefined;
            }
          } catch (e) {}
        }
        pause() {
          if (this._ccprivate$_state !== AudioState.PLAYING || !this._ccprivate$_sourceNode) {
            return Promise.resolve();
          }
          this._ccprivate$_audioTimer.pause();
          this._ccprivate$_state = AudioState.PAUSED;
          this._ccprivate$_stopSourceNode();
          return Promise.resolve();
        }
        stop() {
          if (!this._ccprivate$_sourceNode) {
            this._ccprivate$_audioTimer.stop();
            this._ccprivate$_state = AudioState.STOPPED;
            return Promise.resolve();
          }
          this._ccprivate$_audioTimer.stop();
          this._ccprivate$_state = AudioState.STOPPED;
          this._ccprivate$_stopSourceNode();
          return Promise.resolve();
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