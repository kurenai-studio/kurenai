System.register("q-bundled:///fs/pal/audio/audio-timer.d.js", [], function (_export, _context) {
  "use strict";

  var AudioTimer;
  _export("default", void 0);
  return {
    setters: [],
    execute: function () {
      /**
       * Tool class to calculate audio current time.
       * For some platforms where audio.currentTime doesn't work well or isn't implemented.
       */
      _export("default", AudioTimer = class AudioTimer {
        constructor() {
          this._nativeAudio = void 0;
          this._startTime = void 0;
          this._startOffset = void 0;
          this._isPaused = void 0;
          this._now = void 0;
          this._calculateCurrentTime = void 0;
        }
        /**
         * Get the current time of audio timer.
         */
        /**
         * Start the audio timer.
         * Call this method when audio is played.
         */
        /**
         * Pause the audio timer.
         * Call this method when audio is paused or interrupted.
         */
        /**
         * Stop the audio timer.
         * Call this method when audio playing ended or audio is stopped.
         */
        /**
         * Seek the audio timer.
         * Call this method when audio is seeked.
         */
      });
    }
  };
});