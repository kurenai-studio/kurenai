System.register("q-bundled:///fs/cocos/video/video-player-impl-web.js", ["pal/screen-adapter", "../core/index.js", "../core/platform/index.js", "../game/index.js", "../core/utils/misc.js", "./video-player-enums.js", "./video-player-impl.js", "../gfx/index.js", "../../pal/system-info/enum-type/index.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var screenAdapter, mat4, visibleRect, sys, screen, warn, game, contains, VideoPlayerEventType, READY_STATE, VideoPlayerImpl, ClearFlagBit, BrowserType, OS, ccwindow, VideoPlayerImplWeb, ccdocument, MIN_ZINDEX, _mat4_temp;
  _export("VideoPlayerImplWeb", void 0);
  return {
    setters: [function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_coreIndexJs) {
      mat4 = _coreIndexJs.mat4;
      visibleRect = _coreIndexJs.visibleRect;
    }, function (_corePlatformIndexJs) {
      sys = _corePlatformIndexJs.sys;
      screen = _corePlatformIndexJs.screen;
      warn = _corePlatformIndexJs.warn;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_coreUtilsMiscJs) {
      contains = _coreUtilsMiscJs.contains;
    }, function (_videoPlayerEnumsJs) {
      VideoPlayerEventType = _videoPlayerEnumsJs.VideoPlayerEventType;
      READY_STATE = _videoPlayerEnumsJs.READY_STATE;
    }, function (_videoPlayerImplJs) {
      VideoPlayerImpl = _videoPlayerImplJs.VideoPlayerImpl;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      BrowserType = _palSystemInfoEnumTypeIndexJs.BrowserType;
      OS = _palSystemInfoEnumTypeIndexJs.OS;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
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
      ccdocument = ccwindow.document;
      MIN_ZINDEX = -(2 ** 15);
      _mat4_temp = mat4();
      /** @mangle */
      _export("VideoPlayerImplWeb", VideoPlayerImplWeb = class VideoPlayerImplWeb extends VideoPlayerImpl {
        constructor(component) {
          super(component);
          this._eventList = new Map();
          // use stay on bottom
          this._clearColorA = -1;
          this._clearFlag = void 0;
        }
        addListener(type, handler) {
          if (!this._video) {
            return;
          }
          this._eventList.set(type, handler);
          this._video.addEventListener(type, handler);
        }
        removeAllListeners() {
          this._eventList.forEach((handler, type) => {
            if (!this._video) {
              return;
            }
            this._video.removeEventListener(type, handler);
          });
          this._eventList.clear();
        }
        canPlay() {
          if (this.video) {
            const promise = this.video.play();
            // the play API can only be initiated by user gesture.
            if (ccwindow.Promise && promise instanceof Promise) {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              promise.catch(error => {
                // Auto-play was prevented
                // Show a UI element to let the user manually start playback
              }).then(() => {
                // calibration time
                this.syncCurrentTime();
              });
            }
          }
        }
        pause() {
          if (this.video) {
            this.video.pause();
            this._cachedCurrentTime = this.video.currentTime;
          }
        }
        resume() {
          this.play();
        }
        stop() {
          if (this.video) {
            this._ignorePause = true;
            this.video.currentTime = 0;
            this.video.pause();
            this._cachedCurrentTime = 0;
            setTimeout(() => {
              this._ignorePause = false;
              this.dispatchEvent(VideoPlayerEventType.STOPPED);
            }, 0);
          }
        }
        syncClip(clip) {
          this.removeVideoPlayer();
          if (!clip) {
            return;
          }
          this.createVideoPlayer(clip.nativeUrl);
        }
        syncURL(url) {
          this.removeVideoPlayer();
          if (!url) {
            return;
          }
          this.createVideoPlayer(url);
        }
        syncPlaybackRate(val) {
          if (sys.browserType === BrowserType.UC) {
            warn('playbackRate is not supported by the uc mobile browser.');
            return;
          }
          if (this.video) {
            this.video.playbackRate = val;
          }
        }
        syncVolume(val) {
          if (this.video) {
            this.video.volume = val;
          }
        }
        syncMute(enabled) {
          if (this.video) {
            this.video.muted = enabled;
          }
        }
        syncLoop(enabled) {
          if (this.video) {
            this.video.loop = enabled;
          }
        }
        getDuration() {
          if (!this.video) {
            return 0;
          }
          return this.video.duration;
        }
        getCurrentTime() {
          if (this.video) {
            return this.video.currentTime;
          }
          return -1;
        }
        seekTo(val) {
          if (this.video) {
            this.video.currentTime = val;
            this._cachedCurrentTime = this.video.currentTime;
          }
        }
        canFullScreen(enabled) {
          // NOTE: below we visited some non-standard web interfaces to complement browser compatibility
          const video = this._video;
          if (!video || video.readyState !== READY_STATE.HAVE_ENOUGH_DATA) {
            return;
          }
          if (sys.os === OS.IOS && sys.isBrowser) {
            if (enabled) {
              if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
              }
            } else if (video.webkitExitFullscreen) {
              video.webkitExitFullscreen();
            }
            this._fullScreenOnAwake = video.webkitDisplayingFullscreen;
            return;
          }

          // If video does not support native full-screen playback,
          // change to setting the video size to full screen.
          if (!screen.supportsFullScreen) {
            this._fullScreenOnAwake = enabled;
            this._forceUpdate = true;
            this.syncMatrix();
            return;
          }
          if (enabled) {
            // fix IE full screen content is not centered
            if (sys.browserType === BrowserType.IE) {
              video.style.transform = '';
            }
            // Monitor video entry and exit full-screen events
            video.setAttribute('x5-video-player-fullscreen', 'true');
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            screen.requestFullScreen(video, document => {
              const fullscreenElement = sys.browserType === BrowserType.IE ? document.msFullscreenElement : document.fullscreenElement;
              this._fullScreenOnAwake = fullscreenElement === video;
            }, () => {
              this._fullScreenOnAwake = false;
            });
          } else {
            video.removeAttribute('x5-video-player-fullscreen');
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            screen.exitFullScreen();
          }
        }
        syncStayOnBottom(enabled) {
          if (this._video) {
            this._video.style['z-index'] = enabled ? MIN_ZINDEX : 0;
            this._stayOnBottom = enabled;
          }
          this._dirty = true;
        }
        syncKeepAspectRatio(enabled) {
          this._keepAspectRatio = enabled;
          if (enabled && this._loadedMeta && this._video) {
            this.syncUITransform(this._video.videoWidth, this._video.videoHeight);
          }
        }
        removeVideoPlayer() {
          const video = this._video;
          if (video) {
            if (contains(game.container, video)) {
              game.container.removeChild(video);
              this.removeAllListeners();
            }
          }
          this._cachedCurrentTime = 0;
          this._playing = false;
          this._loaded = false;
          this._loadedMeta = false;
          this._video = null;
        }
        createVideoPlayer(url) {
          const video = this._video = ccdocument.createElement('video');
          video.className = 'cocosVideo';
          video.style.visibility = 'hidden';
          video.style.position = 'absolute';
          video.style.bottom = '0px';
          video.style.left = '0px';
          // video.style['object-fit'] = 'none';
          video.style['transform-origin'] = '0px 100% 0px';
          video.style['-webkit-transform-origin'] = '0px 100% 0px';
          video.setAttribute('preload', 'auto');
          video.setAttribute('webkit-playsinline', '');
          // This x5-playsinline tag must be added, otherwise the play, pause events will only fire once, in the qq browser.
          video.setAttribute('x5-playsinline', '');
          video.setAttribute('playsinline', '');
          this._bindDomEvent();
          game.container.appendChild(video);
          const source = ccdocument.createElement('source');
          video.appendChild(source);
          source.src = url;
        }
        _bindDomEvent() {
          const video = this._video;
          this.addListener('loadedmetadata', this.onLoadedMetadata.bind(this));
          this.addListener('canplay', this.onCanPlay.bind(this));
          this.addListener('canplaythrough', this.onCanPlay.bind(this));
          this.addListener('play', this.onPlay.bind(this));
          this.addListener('playing', this.onPlaying.bind(this));
          this.addListener('pause', this.onPause.bind(this));
          this.addListener('click', this.onClick.bind(this));
          this.addListener('ended', this.onEnded.bind(this));
          this.addListener('error', this.onError.bind(this));
        }
        onCanPlay(e) {
          const video = e.target;
          if (this._loaded && video) {
            return;
          }
          // eslint-disable-next-line default-case
          switch (video.readyState) {
            case READY_STATE.HAVE_METADATA:
            case READY_STATE.HAVE_ENOUGH_DATA:
              {
                super.onCanPlay(e);
                break;
              }
          }
        }
        enable() {
          if (this._video) {
            this._visible = true;
            if (this._video.style.visibility === 'visible') {
              return;
            }
            this._video.style.visibility = 'visible';
          }
        }
        disable(noPause) {
          if (this._video) {
            if (!noPause && this._playing) {
              this._video.pause();
            }
            this._visible = false;
            if (this._video.style.visibility === 'hidden') {
              return;
            }
            this._video.style.visibility = 'hidden';
          }
        }
        syncMatrix() {
          if (!this._video || !this._visible || !this._component) return;
          const camera = this.UICamera;
          if (!camera) {
            return;
          }

          // use stayOnBottom
          if (this._dirty) {
            this._dirty = false;
            if (this._stayOnBottom) {
              this._clearColorA = camera.clearColor.w;
              this._clearFlag = camera.clearFlag;
              camera.clearColor.w = 0;
              camera.clearFlag = ClearFlagBit.ALL;
            } else if (this._clearFlag) {
              camera.clearColor.w = this._clearColorA;
              camera.clearFlag = this._clearFlag;
              this._clearColorA = -1;
              this._clearFlag = null;
            }
          }
          this._component.node.getWorldMatrix(_mat4_temp);
          camera.update(true);
          camera.worldMatrixToScreen(_mat4_temp, _mat4_temp, game.canvas.width, game.canvas.height);
          let width = 0;
          let height = 0;
          if (this._fullScreenOnAwake) {
            width = visibleRect.width;
            height = visibleRect.height;
          } else {
            width = this._uiTrans.contentSize.width;
            height = this._uiTrans.contentSize.height;
          }
          if (!this._forceUpdate && this._m00 === _mat4_temp.m00 && this._m01 === _mat4_temp.m01 && this._m04 === _mat4_temp.m04 && this._m05 === _mat4_temp.m05 && this._m12 === _mat4_temp.m12 && this._m13 === _mat4_temp.m13 && this._w === width && this._h === height) {
            return;
          }

          // update matrix cache
          this._m00 = _mat4_temp.m00;
          this._m01 = _mat4_temp.m01;
          this._m04 = _mat4_temp.m04;
          this._m05 = _mat4_temp.m05;
          this._m12 = _mat4_temp.m12;
          this._m13 = _mat4_temp.m13;
          this._w = width;
          this._h = height;

          // TODO: implement videoPlayer in PAL
          const dpr = screenAdapter.devicePixelRatio;
          const scaleX = 1 / dpr;
          const scaleY = 1 / dpr;
          const container = game.container;
          const sx = _mat4_temp.m00 * scaleX;
          const b = _mat4_temp.m01;
          const c = _mat4_temp.m04;
          const sy = _mat4_temp.m05 * scaleY;
          this._video.style.width = `${this._w}px`;
          this._video.style.height = `${this._h}px`;
          if (sys.browserType !== BrowserType.MOBILE_QQ) {
            this._video.style.objectFit = this._keepAspectRatio ? 'none' : 'fill';
          } else {
            warn('keepAspectRatio is not supported by the qq mobile browser.');
          }
          const w = this._w * scaleX;
          const h = this._h * scaleY;
          const {
            x,
            y
          } = this._uiTrans.anchorPoint;
          const appx = w * _mat4_temp.m00 * x;
          const appy = h * _mat4_temp.m05 * y;
          const offsetX = container && container.style.paddingLeft ? parseInt(container.style.paddingLeft) : 0;
          const offsetY = container && container.style.paddingBottom ? parseInt(container.style.paddingBottom) : 0;
          const tx = _mat4_temp.m12 * scaleX - appx + offsetX;
          const ty = _mat4_temp.m13 * scaleY - appy + offsetY;
          const matrix = `matrix(${sx},${-b},${-c},${sy},${tx},${-ty})`;
          this._video.style.transform = matrix;
          this._video.style['-webkit-transform'] = matrix;
          // video style would change when enter fullscreen on IE
          // there is no way to add fullscreenchange event listeners on IE so that we can restore the cached video style
          if (sys.browserType !== BrowserType.IE) {
            this._forceUpdate = false;
          }
        }
      });
    }
  };
});