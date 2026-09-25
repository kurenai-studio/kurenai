System.register("q-bundled:///fs/pal/pacer/pacer-web.js", ["../../../virtual/internal%253Aconstants.js", "../../cocos/core/data/utils/asserts.js"], function (_export, _context) {
  "use strict";

  var EDITOR, USE_XR, assertIsTrue, Pacer;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_cocosCoreDataUtilsAssertsJs) {
      assertIsTrue = _cocosCoreDataUtilsAssertsJs.assertIsTrue;
    }],
    execute: function () {
      _export("Pacer", Pacer = class Pacer {
        constructor() {
          this._ccprivate$_stHandle = 0;
          this._ccprivate$_onTick = null;
          this._ccprivate$_targetFrameRate = 60;
          this._ccprivate$_frameTime = 0;
          this._ccprivate$_startTime = 0;
          this._ccprivate$_isPlaying = false;
          this._ccprivate$_frameCount = 0;
          this._ccprivate$_callback = null;
          this._ccprivate$_rAF = void 0;
          this._ccprivate$_cAF = void 0;
          this._handleRAF = stamp => {
            const currTime = performance.now();
            const elapseTime = currTime - this._ccprivate$_startTime;
            const elapseFrame = Math.floor(elapseTime / this._ccprivate$_frameTime);
            if (elapseFrame < 0) {
              this._ccprivate$_startTime = currTime;
              this._ccprivate$_frameCount = 0;
            }
            if (elapseFrame < this._ccprivate$_frameCount) {
              this._ccprivate$_stHandle = this._ccprivate$_rAF.call(window, this._handleRAF);
            } else {
              this._ccprivate$_frameCount = elapseFrame + 1;
              if (this._ccprivate$_callback) {
                this._ccprivate$_callback();
              }
            }
          };
          this._ccprivate$_frameTime = 1000 / this._ccprivate$_targetFrameRate;
          this._ccprivate$_rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
          this._ccprivate$_cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.webkitCancelRequestAnimationFrame || window.msCancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.ocancelAnimationFrame;
        }
        get targetFrameRate() {
          return this._ccprivate$_targetFrameRate;
        }
        set targetFrameRate(val) {
          if (this._ccprivate$_targetFrameRate !== val) {
            assertIsTrue(val > 0);
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
          var _globalThis$__globalX;
          if (this._ccprivate$_isPlaying) return;
          const recordStartTime = EDITOR || this._ccprivate$_rAF === undefined || USE_XR && ((_globalThis$__globalX = globalThis.__globalXR) == null ? void 0 : _globalThis$__globalX.isWebXR);
          const updateCallback = () => {
            if (recordStartTime) this._ccprivate$_startTime = performance.now();
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
          this._ccprivate$_frameCount = 0;
        }
        stop() {
          if (!this._ccprivate$_isPlaying) return;
          this._ccprivate$_ctTime(this._ccprivate$_stHandle);
          this._ccprivate$_stHandle = 0;
          this._ccprivate$_isPlaying = false;
          this._ccprivate$_frameCount = 0;
        }
        _ccprivate$_stTime(callback) {
          var _globalThis$__globalX2;
          if (EDITOR || this._ccprivate$_rAF === undefined || USE_XR && (_globalThis$__globalX2 = globalThis.__globalXR) != null && _globalThis$__globalX2.isWebXR) {
            const currTime = performance.now();
            const elapseTime = Math.max(0, currTime - this._ccprivate$_startTime);
            const timeToCall = Math.max(0, this._ccprivate$_frameTime - elapseTime);
            return setTimeout(callback, timeToCall);
          }
          this._ccprivate$_callback = callback;
          return this._ccprivate$_rAF.call(window, this._handleRAF);
        }
        _ccprivate$_ctTime(id) {
          var _globalThis$__globalX3;
          if (EDITOR || this._ccprivate$_cAF === undefined || USE_XR && (_globalThis$__globalX3 = globalThis.__globalXR) != null && _globalThis$__globalX3.isWebXR) {
            clearTimeout(id);
          } else if (id) {
            this._ccprivate$_cAF.call(window, id);
          }
        }
      });
    }
  };
});