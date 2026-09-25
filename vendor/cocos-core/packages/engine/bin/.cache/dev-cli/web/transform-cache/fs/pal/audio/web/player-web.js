System.register("q-bundled:///fs/pal/audio/web/player-web.js", ["../../../../virtual/internal%253Aconstants.js", "../type.js", "../../../cocos/core/event/index.js", "../../../cocos/core/index.js", "../../../cocos/core/platform/debug.js", "../operation-queue.js", "../audio-timer.js", "../audio-buffer-manager.js", "../../../cocos/game/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, AudioState, AudioPCMDataView, AudioEvent, AudioType, EventTarget, clamp01, debug, enqueueOperation, AudioTimer, audioBufferManager, game, Game, AudioContextAgent, OneShotAudioWeb, _class, AudioContextClass, _contextRunningEvent, audioContextAgent, AudioPlayerWeb;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_typeJs) {
      AudioState = _typeJs.AudioState;
      AudioPCMDataView = _typeJs.AudioPCMDataView;
      AudioEvent = _typeJs.AudioEvent;
      AudioType = _typeJs.AudioType;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosCoreIndexJs) {
      clamp01 = _cocosCoreIndexJs.clamp01;
    }, function (_cocosCorePlatformDebugJs) {
      debug = _cocosCorePlatformDebugJs;
    }, function (_operationQueueJs) {
      enqueueOperation = _operationQueueJs.enqueueOperation;
    }, function (_audioTimerJs) {
      AudioTimer = _audioTimerJs.default;
    }, function (_audioBufferManagerJs) {
      audioBufferManager = _audioBufferManagerJs.audioBufferManager;
    }, function (_cocosGameIndexJs) {
      game = _cocosGameIndexJs.game;
      Game = _cocosGameIndexJs.Game;
    }],
    execute: function () {
      AudioContextClass = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
      _contextRunningEvent = "on-context-running";
      _export("AudioContextAgent", AudioContextAgent = class AudioContextAgent {
        constructor() {
          this._ccprivate$_eventTarget = void 0;
          this._ccprivate$_context = void 0;
          this._ccprivate$_isRunning = false;
          this._ccprivate$_context = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext)();
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_context.onstatechange = () => {
            if (this._ccprivate$_context.state === "running") {
              this._ccprivate$_isRunning = true;
              this._ccprivate$_eventTarget.emit(_contextRunningEvent);
            } else {
              this._ccprivate$_isRunning = false;
            }
          };
        }
        get isRunning() {
          return this._ccprivate$_isRunning;
        }
        get currentTime() {
          return this._ccprivate$_context.currentTime;
        }
        onceRunning(cb, target) {
          this._ccprivate$_eventTarget.once(_contextRunningEvent, cb, target);
        }
        offRunning(cb, target) {
          this._ccprivate$_eventTarget.off(_contextRunningEvent, cb, target);
        }
        decodeAudioData(audioData) {
          return new Promise((resolve, reject) => {
            const promise = this._ccprivate$_context.decodeAudioData(audioData, audioBuffer => {
              resolve(audioBuffer);
            }, err => {
              console.error("failed to load Web Audio", err);
            });
            promise == null || promise.catch(reject);
          });
        }
        runContext() {
          return new Promise(resolve => {
            if (this.isRunning) {
              resolve();
              return;
            }
            const context = this._ccprivate$_context;
            if (!context.resume) {
              resolve();
              return;
            }
            if (context.state === "suspended") {
              context.resume().catch(e => {
                debug.warn("runContext error", e);
              });
            } else if (context.state === "running") {
              resolve();
              return;
            }
            const canvas = document.getElementById("GameCanvas");
            const onGesture = () => {
              context.resume().then(() => {
                canvas == null || canvas.removeEventListener("touchend", onGesture, {
                  capture: true
                });
                canvas == null || canvas.removeEventListener("mouseup", onGesture, {
                  capture: true
                });
                resolve();
              }).catch(e => {
                debug.warn("onGesture resume error", e);
              });
            };
            canvas == null || canvas.addEventListener("touchend", onGesture, {
              capture: true
            });
            canvas == null || canvas.addEventListener("mouseup", onGesture, {
              capture: true
            });
          });
        }
        createBufferSource(audioBuffer, loop) {
          const sourceBufferNode = this._ccprivate$_context.createBufferSource();
          if (audioBuffer !== undefined) {
            sourceBufferNode.buffer = audioBuffer;
          }
          if (loop !== undefined) {
            sourceBufferNode.loop = loop;
          }
          return sourceBufferNode;
        }
        createGain(volume) {
          if (volume === void 0) {
            volume = 1;
          }
          const gainNode = this._ccprivate$_context.createGain();
          this.setGainValue(gainNode, volume);
          return gainNode;
        }
        setGainValue(gain, volume) {
          if (gain.gain.setTargetAtTime) {
            try {
              gain.gain.setTargetAtTime(volume, this._ccprivate$_context.currentTime, 0);
            } catch (e) {
              gain.gain.setTargetAtTime(volume, this._ccprivate$_context.currentTime, 0.01);
            }
          } else {
            gain.gain.value = volume;
          }
        }
        connectContext(audioNode) {
          if (!this._ccprivate$_context) {
            return;
          }
          audioNode.connect(this._ccprivate$_context.destination);
        }
      });
      AudioContextAgent.support = !!AudioContextClass;
      if (AudioContextAgent.support) {
        audioContextAgent = new AudioContextAgent();
      }
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
          this._ccprivate$_duration = void 0;
          this._ccprivate$_bufferSourceNode = void 0;
          this._ccprivate$_onPlayCb = void 0;
          this._ccprivate$_currentTimer = 0;
          this._ccprivate$_url = void 0;
          this._ccprivate$_onEndCb = void 0;
          this._ccprivate$_duration = audioBuffer.duration;
          this._ccprivate$_url = url;
          this._ccprivate$_bufferSourceNode = audioContextAgent.createBufferSource(audioBuffer, false);
          const gainNode = audioContextAgent.createGain(volume);
          this._ccprivate$_bufferSourceNode.connect(gainNode);
          audioContextAgent.connectContext(gainNode);
        }
        play() {
          if (EDITOR_NOT_IN_PREVIEW) {
            return;
          }
          this._ccprivate$_bufferSourceNode.start();
          audioContextAgent.runContext().then(() => {
            var _this$onPlay;
            (_this$onPlay = this.onPlay) == null || _this$onPlay.call(this);
            this._ccprivate$_currentTimer = window.setTimeout(() => {
              var _this$onEnd;
              audioBufferManager._ccprivate$tryReleasingCache(this._ccprivate$_url);
              (_this$onEnd = this.onEnd) == null || _this$onEnd.call(this);
            }, this._ccprivate$_duration * 1000);
          }).catch(e => {
            debug.warn("play error", e);
          });
        }
        stop() {
          clearTimeout(this._ccprivate$_currentTimer);
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
          this._ccprivate$_currentTimer = 0;
          this._ccprivate$_volume = 1;
          this._ccprivate$_loop = false;
          this._ccprivate$_state = AudioState.INIT;
          this._ccprivate$_audioTimer = void 0;
          this._ccprivate$_runningCallback = void 0;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_operationQueue = [];
          this._ccprivate$_audioBuffer = audioBuffer;
          this._ccprivate$_audioTimer = new AudioTimer(audioBuffer);
          this._ccprivate$_gainNode = audioContextAgent.createGain();
          audioContextAgent.connectContext(this._ccprivate$_gainNode);
          this._ccprivate$_src = url;
          game.on(Game.EVENT_PAUSE, this._ccprivate$_onInterruptedBegin, this);
          game.on(Game.EVENT_RESUME, this._ccprivate$_onInterruptedEnd, this);
        }
        destroy() {
          window.clearTimeout(this._ccprivate$_currentTimer);
          this._ccprivate$_audioTimer.destroy();
          if (this._ccprivate$_audioBuffer) {
            this._ccprivate$_audioBuffer = null;
          }
          audioBufferManager._ccprivate$tryReleasingCache(this._ccprivate$_src);
          game.off(Game.EVENT_PAUSE, this._ccprivate$_onInterruptedBegin, this);
          game.off(Game.EVENT_RESUME, this._ccprivate$_onInterruptedEnd, this);
          this._ccprivate$offRunning();
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
            const xhr = new XMLHttpRequest();
            const errInfo = `load audio failed: ${url}, status: `;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 0) {
                audioContextAgent.decodeAudioData(xhr.response).then(decodedAudioBuffer => {
                  audioBufferManager._ccprivate$addCache(url, decodedAudioBuffer);
                  resolve(decodedAudioBuffer);
                }).catch(e => {
                  debug.warn("loadNative error", url, e);
                });
              } else {
                reject(new Error(`${errInfo}${xhr.status}(no response)`));
              }
            };
            xhr.onerror = () => {
              reject(new Error(`${errInfo}${xhr.status}(error)`));
            };
            xhr.ontimeout = () => {
              reject(new Error(`${errInfo}${xhr.status}(time out)`));
            };
            xhr.onabort = () => {
              reject(new Error(`${errInfo}${xhr.status}(abort)`));
            };
            xhr.send(null);
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
        get sampleRate() {
          return this._ccprivate$_audioBuffer.sampleRate;
        }
        getPCMData(channelIndex) {
          return new AudioPCMDataView(this._ccprivate$_audioBuffer.getChannelData(channelIndex), 1);
        }
        _ccprivate$_onInterruptedBegin() {
          if (this._ccprivate$_state === AudioState.PLAYING) {
            this.pause().then(() => {
              this._ccprivate$_state = AudioState.INTERRUPTED;
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_BEGIN);
            }).catch(e => {
              debug.warn("_onInterruptedBegin error", e);
            });
          }
        }
        _ccprivate$_onInterruptedEnd() {
          if (this._ccprivate$_state === AudioState.INTERRUPTED) {
            this.play().then(() => {
              this._ccprivate$_eventTarget.emit(AudioEvent.INTERRUPTION_END);
            }).catch(e => {
              debug.warn("_onInterruptedEnd error", e);
            });
          }
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
          audioContextAgent.setGainValue(this._ccprivate$_gainNode, val);
        }
        get duration() {
          return this._ccprivate$_audioBuffer.duration;
        }
        get currentTime() {
          return this._ccprivate$_audioTimer.currentTime;
        }
        _ccprivate$offRunning() {
          if (this._ccprivate$_runningCallback) {
            audioContextAgent.offRunning(this._ccprivate$_runningCallback);
            this._ccprivate$_runningCallback = undefined;
          }
        }
        seek(time) {
          return new Promise(resolve => {
            this._ccprivate$offRunning();
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
          this._ccprivate$offRunning();
          if (EDITOR_NOT_IN_PREVIEW) {
            return Promise.resolve();
          }
          return this._ccprivate$_doPlay();
        }
        _ccprivate$_doPlay() {
          return new Promise(resolve => {
            if (audioContextAgent.isRunning) {
              this._ccprivate$_startSourceNode();
              resolve();
            } else {
              this._ccprivate$offRunning();
              this._ccprivate$_runningCallback = () => {
                this._ccprivate$_startSourceNode();
                resolve();
              };
              audioContextAgent.onceRunning(this._ccprivate$_runningCallback);
              audioContextAgent.runContext().catch(e => {
                debug.warn("doPlay error", e);
              });
            }
          });
        }
        _ccprivate$_startSourceNode() {
          this._ccprivate$_stopSourceNode();
          this._ccprivate$_sourceNode = audioContextAgent.createBufferSource(this._ccprivate$_audioBuffer, this.loop);
          this._ccprivate$_sourceNode.connect(this._ccprivate$_gainNode);
          this._ccprivate$_sourceNode.loop = this._ccprivate$_loop;
          this._ccprivate$_sourceNode.start(0, this._ccprivate$_audioTimer.currentTime);
          this._ccprivate$_state = AudioState.PLAYING;
          this._ccprivate$_audioTimer.start();
          const checkEnded = () => {
            if (this.loop) {
              this._ccprivate$_currentTimer = window.setTimeout(checkEnded, this._ccprivate$_audioBuffer.duration * 1000);
            } else {
              this._ccprivate$_audioTimer.stop();
              this._ccprivate$_eventTarget.emit(AudioEvent.ENDED);
              this._ccprivate$_state = AudioState.INIT;
            }
          };
          window.clearTimeout(this._ccprivate$_currentTimer);
          this._ccprivate$_currentTimer = window.setTimeout(checkEnded, (this._ccprivate$_audioBuffer.duration - this._ccprivate$_audioTimer.currentTime) * 1000);
        }
        _ccprivate$_stopSourceNode() {
          try {
            if (this._ccprivate$_sourceNode) {
              this._ccprivate$_sourceNode.stop();
              this._ccprivate$_sourceNode.disconnect();
              this._ccprivate$_sourceNode.buffer = null;
              this._ccprivate$_sourceNode = undefined;
            }
          } catch (e) {}
        }
        pause() {
          this._ccprivate$offRunning();
          if (this._ccprivate$_state !== AudioState.PLAYING || !this._ccprivate$_sourceNode) {
            return Promise.resolve();
          }
          this._ccprivate$_audioTimer.pause();
          this._ccprivate$_state = AudioState.PAUSED;
          window.clearTimeout(this._ccprivate$_currentTimer);
          this._ccprivate$_stopSourceNode();
          return Promise.resolve();
        }
        stop() {
          this._ccprivate$offRunning();
          if (!this._ccprivate$_sourceNode) {
            this._ccprivate$_audioTimer.stop();
            this._ccprivate$_state = AudioState.STOPPED;
            return Promise.resolve();
          }
          this._ccprivate$_audioTimer.stop();
          this._ccprivate$_state = AudioState.STOPPED;
          window.clearTimeout(this._ccprivate$_currentTimer);
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