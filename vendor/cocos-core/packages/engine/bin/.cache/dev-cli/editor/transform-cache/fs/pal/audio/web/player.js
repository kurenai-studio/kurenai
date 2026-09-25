System.register("q-bundled:///fs/pal/audio/web/player.js", ["../../../cocos/core/index.js", "../type.js", "./player-dom.js", "./player-web.js"], function (_export, _context) {
  "use strict";

  var warnID, AudioType, AudioPlayerDOM, AudioContextAgent, AudioPlayerWeb, OneShotAudio, AudioPlayer;
  return {
    setters: [function (_cocosCoreIndexJs) {
      warnID = _cocosCoreIndexJs.warnID;
    }, function (_typeJs) {
      AudioType = _typeJs.AudioType;
    }, function (_playerDomJs) {
      AudioPlayerDOM = _playerDomJs.AudioPlayerDOM;
    }, function (_playerWebJs) {
      AudioContextAgent = _playerWebJs.AudioContextAgent;
      AudioPlayerWeb = _playerWebJs.AudioPlayerWeb;
    }],
    execute: function () {
      _export("OneShotAudio", OneShotAudio = class OneShotAudio {
        get onPlay() {
          return this._ccprivate$_audio.onPlay;
        }
        set onPlay(v) {
          this._ccprivate$_audio.onPlay = v;
        }
        get onEnd() {
          return this._ccprivate$_audio.onEnd;
        }
        set onEnd(v) {
          this._ccprivate$_audio.onEnd = v;
        }
        constructor(audio) {
          this._ccprivate$_audio = void 0;
          this._ccprivate$_audio = audio;
        }
        play() {
          this._ccprivate$_audio.play();
        }
        stop() {
          this._ccprivate$_audio.stop();
        }
      });
      _export("AudioPlayer", AudioPlayer = class AudioPlayer {
        constructor(player) {
          this._ccprivate$_player = void 0;
          this._ccprivate$_player = player;
        }
        static load(url, opts) {
          return new Promise((resolve, reject) => {
            if ((opts == null ? void 0 : opts.audioLoadMode) === AudioType.DOM_AUDIO || !AudioContextAgent.support) {
              if (!AudioContextAgent.support) {
                warnID(5201);
              }
              AudioPlayerDOM.load(url).then(domPlayer => {
                resolve(new AudioPlayer(domPlayer));
              }).catch(reject);
            } else {
              AudioPlayerWeb.load(url).then(webPlayer => {
                resolve(new AudioPlayer(webPlayer));
              }).catch(reject);
            }
          });
        }
        destroy() {
          this._ccprivate$_player.destroy();
        }
        static loadNative(url, opts) {
          if ((opts == null ? void 0 : opts.audioLoadMode) === AudioType.DOM_AUDIO || !AudioContextAgent.support) {
            if (!AudioContextAgent.support) {
              warnID(5201);
            }
            return AudioPlayerDOM.loadNative(url);
          }
          return AudioPlayerWeb.loadNative(url);
        }
        static loadOneShotAudio(url, volume, opts) {
          return new Promise((resolve, reject) => {
            if ((opts == null ? void 0 : opts.audioLoadMode) === AudioType.DOM_AUDIO || !AudioContextAgent.support) {
              if (!AudioContextAgent.support) {
                warnID(5201);
              }
              AudioPlayerDOM.loadOneShotAudio(url, volume).then(oneShotAudioDOM => {
                resolve(new OneShotAudio(oneShotAudioDOM));
              }).catch(reject);
            } else {
              AudioPlayerWeb.loadOneShotAudio(url, volume).then(oneShotAudioWeb => {
                resolve(new OneShotAudio(oneShotAudioWeb));
              }).catch(reject);
            }
          });
        }
        get src() {
          return this._ccprivate$_player.src;
        }
        get type() {
          return this._ccprivate$_player.type;
        }
        get state() {
          return this._ccprivate$_player.state;
        }
        get loop() {
          return this._ccprivate$_player.loop;
        }
        set loop(val) {
          this._ccprivate$_player.loop = val;
        }
        get volume() {
          return this._ccprivate$_player.volume;
        }
        set volume(val) {
          this._ccprivate$_player.volume = val;
        }
        get duration() {
          return this._ccprivate$_player.duration;
        }
        get currentTime() {
          return this._ccprivate$_player.currentTime;
        }
        get sampleRate() {
          return this._ccprivate$_player.sampleRate;
        }
        getPCMData(channelIndex) {
          return this._ccprivate$_player.getPCMData(channelIndex);
        }
        seek(time) {
          return this._ccprivate$_player.seek(time);
        }
        play() {
          return this._ccprivate$_player.play();
        }
        pause() {
          return this._ccprivate$_player.pause();
        }
        stop() {
          return this._ccprivate$_player.stop();
        }
        onInterruptionBegin(cb) {
          this._ccprivate$_player.onInterruptionBegin(cb);
        }
        offInterruptionBegin(cb) {
          this._ccprivate$_player.offInterruptionBegin(cb);
        }
        onInterruptionEnd(cb) {
          this._ccprivate$_player.onInterruptionEnd(cb);
        }
        offInterruptionEnd(cb) {
          this._ccprivate$_player.offInterruptionEnd(cb);
        }
        onEnded(cb) {
          this._ccprivate$_player.onEnded(cb);
        }
        offEnded(cb) {
          this._ccprivate$_player.offEnded(cb);
        }
      });
      AudioPlayer.maxAudioChannel = 24;
    }
  };
});