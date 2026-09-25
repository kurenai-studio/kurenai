System.register("q-bundled:///fs/pal/pacer/pacer-nodejs.js", [], function (_export, _context) {
  "use strict";

  var Pacer;
  return {
    setters: [],
    execute: function () {
      _export("Pacer", Pacer = class Pacer {
        constructor() {
          this._ccprivate$_stHandle = 0;
          this._ccprivate$_onTick = null;
          this._ccprivate$_targetFrameRate = 60;
          this._ccprivate$_frameTime = 0;
          this._ccprivate$_startTime = 0;
          this._ccprivate$_isPlaying = false;
          this._ccprivate$_isPlaying = false;
        }
        get targetFrameRate() {
          return this._ccprivate$_targetFrameRate;
        }
        set targetFrameRate(val) {
          if (this._ccprivate$_targetFrameRate !== val) {
            this._ccprivate$_targetFrameRate = val;
            this._ccprivate$_frameTime = 1000 / this._ccprivate$_targetFrameRate;
            if (this._ccprivate$_isPlaying) {
              this.stop();
              this.start();
            }
          }
        }
        set onTick(val) {
          this._ccprivate$_onTick = val;
        }
        get onTick() {
          return this._ccprivate$_onTick;
        }
        start() {
          if (this._ccprivate$_isPlaying) return;
          const updateCallback = () => {
            if (this._ccprivate$_isPlaying) {
              this._ccprivate$_stHandle = this._ccprivate$_stTime(updateCallback);
            }
            if (this._ccprivate$_onTick) {
              this._ccprivate$_onTick();
            }
          };
          this._ccprivate$_startTime = performance.now();
          this._ccprivate$_stHandle = this._ccprivate$_stTime(updateCallback);
          this._ccprivate$_isPlaying = true;
        }
        stop() {
          if (!this._ccprivate$_isPlaying) return;
          this._ccprivate$_ctTime(this._ccprivate$_stHandle);
          this._ccprivate$_stHandle = 0;
          this._ccprivate$_isPlaying = false;
        }
        _ccprivate$_stTime(callback) {
          const currTime = performance.now();
          const elapseTime = Math.max(0, currTime - this._ccprivate$_startTime);
          const timeToCall = Math.max(0, this._ccprivate$_frameTime - elapseTime);
          return setTimeout(callback, timeToCall);
        }
        _ccprivate$_ctTime(id) {
          clearTimeout(id);
        }
      });
    }
  };
});