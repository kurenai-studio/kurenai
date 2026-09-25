System.register("q-bundled:///fs/pal/audio/audio-buffer-manager.js", ["../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var warnID, AudioBufferManager, audioBufferManager;
  return {
    setters: [function (_cocosCorePlatformDebugJs) {
      warnID = _cocosCorePlatformDebugJs.warnID;
    }],
    execute: function () {
      AudioBufferManager = class AudioBufferManager {
        constructor() {
          this._ccprivate$_audioBufferDataMap = {};
        }
        _ccprivate$addCache(url, audioBuffer) {
          const audioBufferData = this._ccprivate$_audioBufferDataMap[url];
          if (audioBufferData) {
            warnID(5204, url);
            return;
          }
          this._ccprivate$_audioBufferDataMap[url] = {
            _ccprivate$usedCount: 1,
            _ccprivate$audioBuffer: audioBuffer
          };
        }
        _ccprivate$retainCache(url) {
          const audioBufferData = this._ccprivate$_audioBufferDataMap[url];
          if (!audioBufferData) {
            warnID(5203, url);
            return;
          }
          audioBufferData._ccprivate$usedCount++;
        }
        _ccprivate$getCache(url) {
          const audioBufferData = this._ccprivate$_audioBufferDataMap[url];
          return audioBufferData == null ? void 0 : audioBufferData._ccprivate$audioBuffer;
        }
        _ccprivate$tryReleasingCache(url) {
          const audioBufferData = this._ccprivate$_audioBufferDataMap[url];
          if (!audioBufferData) {
            warnID(5203, url);
            return;
          }
          if (--audioBufferData._ccprivate$usedCount <= 0) {
            delete this._ccprivate$_audioBufferDataMap[url];
          }
        }
      };
      _export("audioBufferManager", audioBufferManager = new AudioBufferManager());
    }
  };
});