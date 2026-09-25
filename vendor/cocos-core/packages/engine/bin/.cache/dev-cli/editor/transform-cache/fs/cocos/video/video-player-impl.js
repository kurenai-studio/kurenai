System.register("q-bundled:///fs/cocos/video/video-player-impl.js", ["../core/global-exports.js", "../2d/framework/index.js", "./video-player-enums.js", "../core/platform/index.js", "../game/director.js"], function (_export, _context) {
  "use strict";

  var legacyCC, UITransform, VideoPlayerEventType, error, director, VideoPlayerImpl;
  _export("VideoPlayerImpl", void 0);
  return {
    setters: [function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_videoPlayerEnumsJs) {
      VideoPlayerEventType = _videoPlayerEnumsJs.VideoPlayerEventType;
    }, function (_corePlatformIndexJs) {
      error = _corePlatformIndexJs.error;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      _export("VideoPlayerImpl", VideoPlayerImpl = class VideoPlayerImpl {
        constructor(component) {
          this._componentEventList = new Map();
          this._state = VideoPlayerEventType.NONE;
          this._video = null;
          this._onInterruptedBegin = void 0;
          this._onInterruptedEnd = void 0;
          this._interrupted = false;
          this._loaded = false;
          this._loadedMeta = false;
          this._ignorePause = false;
          this._fullScreenOnAwake = false;
          this._visible = true;
          this._playing = false;
          this._cachedCurrentTime = -1;
          this._waitingFullscreen = false;
          this._waitingPlay = false;
          this._keepAspectRatio = false;
          this._component = null;
          this._uiTrans = null;
          this._node = null;
          this._stayOnBottom = false;
          this._dirty = false;
          this._forceUpdate = false;
          this._w = 0;
          this._h = 0;
          this._m00 = 0;
          this._m01 = 0;
          this._m04 = 0;
          this._m05 = 0;
          this._m12 = 0;
          this._m13 = 0;
          this._component = component;
          this._node = component.node;
          this._uiTrans = component.node.getComponent(UITransform);
          this._onInterruptedBegin = () => {
            if (!this.video || this._state !== VideoPlayerEventType.PLAYING) {
              return;
            }
            this.video.pause();
            this._interrupted = true;
          };
          this._onInterruptedEnd = () => {
            if (!this._interrupted || !this.video) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.video.play();
            this._interrupted = false;
          };
          /* handle pause & resume */
          legacyCC.game.on(legacyCC.Game.EVENT_PAUSE, this._onInterruptedBegin);
          legacyCC.game.on(legacyCC.Game.EVENT_RESUME, this._onInterruptedEnd);
        }

        //

        //

        // synchronizing video player data

        // get video player data

        get fullScreenOnAwake() {
          return this._fullScreenOnAwake;
        }
        get loaded() {
          return this._loaded;
        }
        get componentEventList() {
          return this._componentEventList;
        }
        get video() {
          return this._video;
        }
        get state() {
          return this._state;
        }
        get isPlaying() {
          return this._playing;
        }
        get UICamera() {
          return director.root.batcher2D.getFirstRenderCamera(this._node);
        }

        // video player event
        onLoadedMetadata(e) {
          this._loadedMeta = true;
          this._forceUpdate = true;
          if (this._visible) {
            this.enable();
          } else {
            this.disable();
          }
          this.dispatchEvent(VideoPlayerEventType.META_LOADED);
          const video = e.target;
          if (this._keepAspectRatio && video) {
            this.syncUITransform(video.videoWidth, video.videoHeight);
          }
          this.delayedFullScreen();
          this.delayedPlay();
        }
        onCanPlay(e) {
          this._loaded = true;
          this.dispatchEvent(VideoPlayerEventType.READY_TO_PLAY);
        }
        onPlay(e) {
          this._playing = true;
          this.dispatchEvent(VideoPlayerEventType.PLAYING);
        }
        onPlaying(e) {
          this.dispatchEvent(VideoPlayerEventType.PLAYING);
        }
        onPause(e) {
          this._playing = false;
          if (this._ignorePause) {
            this._ignorePause = false;
            return;
          }
          this.dispatchEvent(VideoPlayerEventType.PAUSED);
        }
        onStoped(e) {
          this._playing = false;
          this._ignorePause = false;
          this.dispatchEvent(VideoPlayerEventType.STOPPED);
        }
        onEnded(e) {
          this._playing = false;
          this.dispatchEvent(VideoPlayerEventType.COMPLETED);
        }
        onClick(e) {
          this.dispatchEvent(VideoPlayerEventType.CLICKED);
        }
        onError(e) {
          this.dispatchEvent(VideoPlayerEventType.ERROR);
          const video = e.target;
          if (video && video.error) {
            error(`Error ${video.error.code}; details: ${video.error.message}`);
          }
        }
        play() {
          if (this._loadedMeta || this._loaded) {
            this.canPlay();
          } else {
            this._waitingPlay = true;
          }
        }
        delayedPlay() {
          if (this._waitingPlay) {
            this.canPlay();
            this._waitingPlay = false;
          }
        }
        syncFullScreenOnAwake(enabled) {
          this._fullScreenOnAwake = enabled;
          if (this._loadedMeta || this._loaded) {
            this.canFullScreen(enabled);
          } else {
            this._waitingFullscreen = true;
          }
        }
        delayedFullScreen() {
          if (this._waitingFullscreen) {
            this.canFullScreen(this._fullScreenOnAwake);
            this._waitingFullscreen = false;
          }
        }
        dispatchEvent(key) {
          const callback = this._componentEventList.get(key);
          if (callback) {
            this._state = key;
            callback.call(this);
          }
        }
        syncUITransform(width, height) {
          const uiTrans = this._uiTrans;
          if (uiTrans) {
            uiTrans.width = width;
            uiTrans.height = height;
          }
        }
        syncCurrentTime() {
          if (!this.video) {
            return;
          }
          if (this._cachedCurrentTime !== -1 && this.video.currentTime !== this._cachedCurrentTime) {
            this.seekTo(this._cachedCurrentTime);
            this._cachedCurrentTime = -1;
          }
        }
        destroy() {
          this.removeVideoPlayer();
          this._componentEventList.clear();
          legacyCC.game.off(legacyCC.Game.EVENT_PAUSE, this._onInterruptedBegin);
          legacyCC.game.off(legacyCC.Game.EVENT_RESUME, this._onInterruptedEnd);
        }
      });
      legacyCC.internal.VideoPlayerImpl = VideoPlayerImpl;
    }
  };
});