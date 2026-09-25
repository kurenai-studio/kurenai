System.register("q-bundled:///fs/pal/audio/audio-timer.js", ["../../cocos/core/math/utils.js"], function (_export, _context) {
  "use strict";

  var clamp, AudioTimer;
  return {
    setters: [function (_cocosCoreMathUtilsJs) {
      clamp = _cocosCoreMathUtilsJs.clamp;
    }],
    execute: function () {
      _export("default", AudioTimer = class AudioTimer {
        constructor(nativeAudio) {
          this._ccprivate$_nativeAudio = void 0;
          this._ccprivate$_startTime = 0;
          this._ccprivate$_startOffset = 0;
          this._ccprivate$_isPaused = true;
          this._ccprivate$_nativeAudio = nativeAudio;
        }
        destroy() {
          this._ccprivate$_nativeAudio = undefined;
        }
        get duration() {
          return this._ccprivate$_nativeAudio.duration;
        }
        get currentTime() {
          if (this._ccprivate$_isPaused) {
            return this._ccprivate$_startOffset;
          } else {
            return this._ccprivate$_calculateCurrentTime();
          }
        }
        _ccprivate$_now() {
          return performance.now() / 1000;
        }
        _ccprivate$_calculateCurrentTime() {
          const timePassed = this._ccprivate$_now() - this._ccprivate$_startTime;
          const currentTime = this._ccprivate$_startOffset + timePassed;
          if (currentTime >= this.duration) {
            this._ccprivate$_startTime = this._ccprivate$_now();
            this._ccprivate$_startOffset = 0;
          }
          return currentTime % this.duration;
        }
        start() {
          this._ccprivate$_isPaused = false;
          this._ccprivate$_startTime = this._ccprivate$_now();
        }
        pause() {
          if (this._ccprivate$_isPaused) {
            return;
          }
          this._ccprivate$_isPaused = true;
          this._ccprivate$_startOffset = this._ccprivate$_calculateCurrentTime();
        }
        stop() {
          this._ccprivate$_isPaused = true;
          this._ccprivate$_startOffset = 0;
        }
        seek(time) {
          this._ccprivate$_startTime = this._ccprivate$_now();
          this._ccprivate$_startOffset = clamp(time, 0, this.duration);
        }
      });
    }
  };
});