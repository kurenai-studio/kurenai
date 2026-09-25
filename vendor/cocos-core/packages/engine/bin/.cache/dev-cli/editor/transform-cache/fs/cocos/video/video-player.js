System.register("q-bundled:///fs/cocos/video/video-player.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../core/platform/index.js", "../scene-graph/index.js", "../2d/framework/index.js", "../core/math/index.js", "./assets/video-clip.js", "./video-player-impl-manager.js", "./video-player-enums.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, executeInEditMode, help, menu, slide, range, requireComponent, tooltip, type, serializable, EDITOR_NOT_IN_PREVIEW, NODEJS, warn, Component, ComponentEventHandler, UITransform, clamp, VideoClip, VideoPlayerImplManager, VideoPlayerEventType, ResourceType, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _VideoPlayer, VideoPlayer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      slide = _coreDataDecoratorsIndexJs.slide;
      range = _coreDataDecoratorsIndexJs.range;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_corePlatformIndexJs) {
      warn = _corePlatformIndexJs.warn;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
      ComponentEventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_coreMathIndexJs) {
      clamp = _coreMathIndexJs.clamp;
    }, function (_assetsVideoClipJs) {
      VideoClip = _assetsVideoClipJs.VideoClip;
    }, function (_videoPlayerImplManagerJs) {
      VideoPlayerImplManager = _videoPlayerImplManagerJs.VideoPlayerImplManager;
    }, function (_videoPlayerEnumsJs) {
      VideoPlayerEventType = _videoPlayerEnumsJs.VideoPlayerEventType;
      ResourceType = _videoPlayerEnumsJs.ResourceType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      /**
       * @en
       * VideoPlayer is a component for playing videos, you can use it for showing videos in your game.
       * Because different platforms have different authorization, API and control methods for VideoPlayer component.
       * And have not yet formed a unified standard, only Web, iOS, and Android platforms are currently supported.
       * @zh
       * Video 组件，用于在游戏中播放视频。
       * 由于不同平台对于 VideoPlayer 组件的授权、API、控制方式都不同，还没有形成统一的标准，所以目前只支持 Web、iOS 和 Android 平台。
       */
      _export("VideoPlayer", VideoPlayer = (_dec = ccclass('cc.VideoPlayer'), _dec2 = help('i18n:cc.VideoPlayer'), _dec3 = menu('Video/VideoPlayer'), _dec4 = requireComponent(UITransform), _dec5 = type(VideoClip), _dec6 = type(ResourceType), _dec7 = tooltip('i18n:videoplayer.resourceType'), _dec8 = tooltip('i18n:videoplayer.remoteURL'), _dec9 = type(VideoClip), _dec0 = tooltip('i18n:videoplayer.clip'), _dec1 = tooltip('i18n:videoplayer.playOnAwake'), _dec10 = range([0.0, 10, 1.0]), _dec11 = tooltip('i18n:videoplayer.playbackRate'), _dec12 = range([0.0, 1.0, 0.1]), _dec13 = tooltip('i18n:videoplayer.volume'), _dec14 = tooltip('i18n:videoplayer.mute'), _dec15 = tooltip('i18n:videoplayer.loop'), _dec16 = tooltip('i18n:videoplayer.keepAspectRatio'), _dec17 = tooltip('i18n:videoplayer.fullScreenOnAwake'), _dec18 = tooltip('i18n:videoplayer.stayOnBottom'), _dec19 = type([ComponentEventHandler]), _dec20 = displayOrder(100), _dec21 = tooltip('i18n:videoplayer.videoPlayerEvent'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = (_VideoPlayer = class VideoPlayer extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_resourceType", _descriptor, this);
          _initializerDefineProperty(this, "_remoteURL", _descriptor2, this);
          _initializerDefineProperty(this, "_clip", _descriptor3, this);
          _initializerDefineProperty(this, "_playOnAwake", _descriptor4, this);
          _initializerDefineProperty(this, "_volume", _descriptor5, this);
          _initializerDefineProperty(this, "_mute", _descriptor6, this);
          _initializerDefineProperty(this, "_playbackRate", _descriptor7, this);
          _initializerDefineProperty(this, "_loop", _descriptor8, this);
          _initializerDefineProperty(this, "_fullScreenOnAwake", _descriptor9, this);
          _initializerDefineProperty(this, "_stayOnBottom", _descriptor0, this);
          _initializerDefineProperty(this, "_keepAspectRatio", _descriptor1, this);
          this._impl = null;
          this._cachedCurrentTime = 0;
          /**
           * @en
           * The video player's callback, it will be triggered in certain situations, such as playing, paused, stopped and completed.
           * @zh
           * 视频播放回调函数，该回调函数会在特定情况被触发，比如播放中，暂时，停止和完成播放。
           */
          _initializerDefineProperty(this, "videoPlayerEvent", _descriptor10, this);
        }

        /**
         * @en
         * The resource type of video player, REMOTE for remote url and LOCAL for local file path.
         * @zh
         * 视频来源：REMOTE 表示远程视频 URL，LOCAL 表示本地视频地址。
         */
        get resourceType() {
          return this._resourceType;
        }
        set resourceType(val) {
          if (this._resourceType !== val) {
            this._resourceType = val;
            this.syncSource();
          }
        }

        /**
         * @en
         * The remote URL of video.
         * @zh
         * 远程视频的 URL。
         */
        get remoteURL() {
          return this._remoteURL;
        }
        set remoteURL(val) {
          if (this._remoteURL !== val) {
            this._remoteURL = val;
            this.syncSource();
          }
        }

        /**
         * @en
         * The local video clip.
         * @zh
         * 本地视频剪辑。
         */
        get clip() {
          return this._clip;
        }
        set clip(val) {
          if (this._clip !== val) {
            this._clip = val;
            this.syncSource();
          }
        }

        /**
         * @en
         * Whether the video start playing automatically after loaded.
         * @zh
         * 视频加载后是否自动开始播放。
         */
        get playOnAwake() {
          return this._playOnAwake;
        }
        set playOnAwake(value) {
          this._playOnAwake = value;
        }

        /**
         * @en
         * The Video playback rate. The value range is from [0.0 ~ 10.0].
         * @zh
         * 视频播放时的速率, 值的区间为[0.0 ~ 10.0]。
         */
        get playbackRate() {
          return this._playbackRate;
        }
        set playbackRate(value) {
          this._playbackRate = value;
          if (this._impl) {
            this._impl.syncPlaybackRate(value);
          }
        }

        /**
         * @en
         * The volume of the video. The value range is from [0.0 ~ 1.0].
         * @zh
         * 视频的音量. 值的区间为[0.0 ~ 1.0]。
         */
        get volume() {
          return this._volume;
        }
        set volume(value) {
          this._volume = value;
          if (this._impl) {
            this._impl.syncVolume(value);
          }
        }

        /**
         * @en
         * Mutes the VideoPlayer. When the volume is set to 0, the volume is muted, and unmuted is to restore the original volume.
         * @zh
         * 是否静音视频。设置音量为0时是静音，取消静音是恢复原来的音量。
         */
        get mute() {
          return this._mute;
        }
        set mute(value) {
          this._mute = value;
          if (this._impl) {
            this._impl.syncMute(value);
          }
        }

        /**
         * @en
         * Whether the video should play again when it ends.
         * @zh
         * 视频是否应在结束时再次播放。
         */
        get loop() {
          return this._loop;
        }
        set loop(value) {
          this._loop = value;
          if (this._impl) {
            this._impl.syncLoop(value);
          }
        }

        /**
         * @en
         * Whether to keep the original aspect ratio of the video.
         * @zh
         * 是否保持视频原来的宽高比。
         */
        get keepAspectRatio() {
          return this._keepAspectRatio;
        }
        set keepAspectRatio(value) {
          if (this._keepAspectRatio !== value) {
            this._keepAspectRatio = value;
            if (this._impl) {
              this._impl.syncKeepAspectRatio(value);
            }
          }
        }

        /**
         * @en
         * Whether to play the video in full screen.
         * @zh
         * 是否全屏播放视频。
         */
        get fullScreenOnAwake() {
          if (!EDITOR_NOT_IN_PREVIEW) {
            if (this._impl) {
              this._fullScreenOnAwake = this._impl.fullScreenOnAwake;
              return this._fullScreenOnAwake;
            }
          }
          return this._fullScreenOnAwake;
        }
        set fullScreenOnAwake(value) {
          if (this._fullScreenOnAwake !== value) {
            this._fullScreenOnAwake = value;
            if (this._impl) {
              this._impl.syncFullScreenOnAwake(value);
            }
          }
        }

        /**
         * @en
         * Always at the bottom of the game view.
         * This property relies on the translucency feature of Canvas, please enable ENABLE_TRANSPARENT_CANVAS in project preferences.
         * Note: It's only available on the Web platform.
         * Due to the support and limitations of each browser, the effect may not be guaranteed to be consistent.
         * @zh
         * 永远在游戏视图最底层。
         * 该属性依赖 Canvas 的半透明特性，请在项目偏好设置里开启 ENABLE_TRANSPARENT_CANVAS。
         * 注意：该属性只有在 Web 平台上有效果。由于各浏览器的支持与限制，效果可能无法保证一致。
         */
        get stayOnBottom() {
          return this._stayOnBottom;
        }
        set stayOnBottom(value) {
          if (this._stayOnBottom !== value) {
            this._stayOnBottom = value;
            if (this._impl) {
              this._impl.syncStayOnBottom(value);
            }
          }
        }
        /**
         * @en
         * Gets the original video object, generally used for user customization.
         * @zh
         * 获取原始视频对象，一般用于用户定制。
         */
        get nativeVideo() {
          return this._impl && this._impl.video || null;
        }

        /**
         * @en
         * Gets the time progress of the current video playback.
         * @zh
         * 获取当前视频播放的时间进度。
         */
        get currentTime() {
          if (!this._impl) {
            return this._cachedCurrentTime;
          }
          return this._impl.getCurrentTime();
        }

        /**
         * @en
         * Sets the time point when the video starts to play, in seconds.
         * @zh
         * 设置视频开始播放的时间点，单位是秒。
         */
        set currentTime(val) {
          if (Number.isNaN(val)) {
            warn(`illegal video time! value:${val}`);
            return;
          }
          val = clamp(val, 0, this.duration);
          this._cachedCurrentTime = val;
          if (this._impl) {
            this._impl.seekTo(val);
          }
        }

        /**
         * @en
         * Gets the audio duration, in seconds.
         * @zh
         * 获取以秒为单位的视频总时长。
         */
        get duration() {
          if (!this._impl) {
            return 0;
          }
          return this._impl.getDuration();
        }

        /**
         * @en
         * Gets current audio state.
         * @zh
         * 获取当前视频状态。
         */
        get state() {
          if (!this._impl) {
            return VideoPlayerEventType.NONE;
          }
          return this._impl.state;
        }

        /**
         * @en
         * Whether the current video is playing, The return value type is Boolean.
         * @zh
         * 当前视频是否正在播放，返回值为布尔类型。
         */
        get isPlaying() {
          if (!this._impl) {
            return false;
          }
          return this._impl.isPlaying;
        }
        syncSource() {
          const impl = this._impl;
          if (!impl) {
            return;
          }
          if (this._resourceType === ResourceType.REMOTE) {
            impl.syncURL(this._remoteURL);
          } else {
            impl.syncClip(this._clip);
          }
          this._cachedCurrentTime = 0;
          impl.syncLoop(this._loop);
          impl.syncVolume(this._volume);
          impl.syncMute(this._mute);
          impl.seekTo(this._cachedCurrentTime);
          impl.syncPlaybackRate(this._playbackRate);
          impl.syncStayOnBottom(this._stayOnBottom);
          impl.syncKeepAspectRatio(this._keepAspectRatio);
          impl.syncFullScreenOnAwake(this._fullScreenOnAwake);
        }
        __preload() {
          if (EDITOR_NOT_IN_PREVIEW || NODEJS) {
            return;
          }
          this._impl = VideoPlayerImplManager.getImpl(this);
          this.syncSource();
          const {
            componentEventList
          } = this._impl;
          componentEventList.set(VideoPlayerEventType.META_LOADED, this.onMetaLoaded.bind(this));
          componentEventList.set(VideoPlayerEventType.READY_TO_PLAY, this.onReadyToPlay.bind(this));
          componentEventList.set(VideoPlayerEventType.PLAYING, this.onPlaying.bind(this));
          componentEventList.set(VideoPlayerEventType.PAUSED, this.onPaused.bind(this));
          componentEventList.set(VideoPlayerEventType.STOPPED, this.onStopped.bind(this));
          componentEventList.set(VideoPlayerEventType.COMPLETED, this.onCompleted.bind(this));
          componentEventList.set(VideoPlayerEventType.ERROR, this.onError.bind(this));
          componentEventList.set(VideoPlayerEventType.CLICKED, this.onClicked.bind(this));
          if (this._playOnAwake && this._impl.loaded) {
            this.play();
          }
        }
        onEnable() {
          if (this._impl) {
            this._impl.enable();
          }
        }
        onDisable() {
          if (this._impl) {
            this._impl.disable();
          }
        }
        onDestroy() {
          if (this._impl) {
            this._impl.destroy();
            this._impl = null;
          }
        }
        update(dt) {
          if (this._impl) {
            this._impl.syncMatrix();
          }
        }
        onMetaLoaded() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.META_LOADED);
          this.node.emit('meta-loaded', this);
        }
        onReadyToPlay() {
          if (this._playOnAwake && !this.isPlaying) {
            this.play();
          }
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.READY_TO_PLAY);
          this.node.emit(VideoPlayerEventType.READY_TO_PLAY, this);
        }
        onPlaying() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.PLAYING);
          this.node.emit(VideoPlayerEventType.PLAYING, this);
        }
        onPaused() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.PAUSED);
          this.node.emit(VideoPlayerEventType.PAUSED, this);
        }
        onStopped() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.STOPPED);
          this.node.emit(VideoPlayerEventType.STOPPED, this);
        }
        onCompleted() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.COMPLETED);
          this.node.emit(VideoPlayerEventType.COMPLETED, this);
        }
        onError() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.ERROR);
          this.node.emit(VideoPlayerEventType.ERROR, this);
        }
        onClicked() {
          ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayerEventType.CLICKED);
          this.node.emit(VideoPlayerEventType.CLICKED, this);
        }

        /**
         * @en
         * Play the clip.<br>
         * Restart if already playing.<br>
         * Resume if paused.
         * @zh
         * 开始播放。<br>
         * 如果视频处于正在播放状态，将会重新开始播放视频。<br>
         * 如果视频处于暂停状态，则会继续播放视频。
         */
        play() {
          if (this._impl) {
            this._impl.play();
          }
        }

        /**
         * @en
         * Resume the clip.
         * If a video is paused, call this method to resume playing.
         * @zh
         * 继续播放。如果一个视频播放被暂停播放了，调用这个接口可以继续播放。
         */
        resume() {
          if (this._impl) {
            this._impl.resume();
          }
        }

        /**
         * @en
         * Pause the clip.
         * @zh
         * 暂停播放。
         */
        pause() {
          if (this._impl) {
            this._impl.pause();
          }
        }

        /**
         * @en
         * Stop the clip.
         * @zh
         * 停止播放。
         */
        stop() {
          if (this._impl) {
            this._impl.stop();
          }
        }
      }, _VideoPlayer.EventType = VideoPlayerEventType, _VideoPlayer.ResourceType = ResourceType, _VideoPlayer), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_resourceType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ResourceType.LOCAL;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_remoteURL", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_clip", [_dec5, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_playOnAwake", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_volume", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_mute", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_playbackRate", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_loop", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_fullScreenOnAwake", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_stayOnBottom", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_keepAspectRatio", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "resourceType", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "resourceType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "remoteURL", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "remoteURL"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clip", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "clip"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "playOnAwake", [_dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "playOnAwake"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "playbackRate", [slide, _dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "playbackRate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "volume", [slide, _dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "volume"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mute", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "mute"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "loop", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "loop"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "keepAspectRatio", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "keepAspectRatio"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fullScreenOnAwake", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "fullScreenOnAwake"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "stayOnBottom", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "stayOnBottom"), _class2.prototype), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "videoPlayerEvent", [serializable, _dec19, _dec20, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class)); // TODO Since jsb adapter does not support import cc, put it on internal first and adjust it later.
      legacyCC.internal.VideoPlayer = VideoPlayer;
    }
  };
});