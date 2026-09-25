System.register("q-bundled:///fs/pal/pacer/pacer-native.js", ["../../cocos/core/data/utils/asserts.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, Pacer;
  return {
    setters: [function (_cocosCoreDataUtilsAssertsJs) {
      assertIsTrue = _cocosCoreDataUtilsAssertsJs.assertIsTrue;
    }],
    execute: function () {
      _export("Pacer", Pacer = class Pacer {
        constructor() {
          this._ccprivate$_rafHandle = 0;
          this._ccprivate$_onTick = null;
          this._ccprivate$_targetFrameRate = 60;
          this._ccprivate$_isPlaying = false;
          this._ccprivate$_updateCallback = () => {
            if (this._ccprivate$_isPlaying) {
              this._ccprivate$_rafHandle = requestAnimationFrame(this._ccprivate$_updateCallback);
            }
            if (this._ccprivate$_onTick) {
              this._ccprivate$_onTick();
            }
          };
        }
        get targetFrameRate() {
          return this._ccprivate$_targetFrameRate;
        }
        set targetFrameRate(val) {
          if (this._ccprivate$_targetFrameRate !== val) {
            assertIsTrue(val > 0);
            this._ccprivate$_targetFrameRate = val;
            jsb.setPreferredFramesPerSecond(this._ccprivate$_targetFrameRate);
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
          this._ccprivate$_rafHandle = requestAnimationFrame(this._ccprivate$_updateCallback);
          this._ccprivate$_isPlaying = true;
        }
        stop() {
          if (!this._ccprivate$_isPlaying) return;
          cancelAnimationFrame(this._ccprivate$_rafHandle);
          this._ccprivate$_rafHandle = 0;
          this._ccprivate$_isPlaying = false;
        }
      });
    }
  };
});