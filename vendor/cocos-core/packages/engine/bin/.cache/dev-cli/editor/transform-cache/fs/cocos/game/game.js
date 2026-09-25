System.register("q-bundled:///fs/cocos/game/game.js", ["../../../virtual/internal%253Aconstants.js", "pal/system-info", "pal/env", "pal/pacer", "../asset/asset-manager/asset-manager.js", "../core/index.js", "../input/index.js", "../gfx/index.js", "./splash-screen.js", "../scene-graph/index.js", "../asset/asset-manager/builtin-res-mgr.js", "./director.js", "../rendering/define.js", "../core/effect-settings.js"], function (_export, _context) {
  "use strict";

  var DEBUG, EDITOR, NATIVE, PREVIEW, TEST, EDITOR_NOT_IN_PREVIEW, WECHAT, USE_XR, NODEJS, systemInfo, findCanvas, loadJsFile, Pacer, assetManager, EventTarget, AsyncDelegate, sys, macro, VERSION, cclegacy, screen, settings, assert, garbageCollectionManager, DebugMode, warn, log, _resetDebugSetting, errorID, logID, SettingsCategory, input, deviceManager, LegacyRenderMode, SplashScreen, Layers, builtinResMgr, director, DirectorEvent, bindingMappingInfo, effectSettings, Game, querySettings, game;
  _export("Game", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NATIVE = _virtualInternal253AconstantsJs.NATIVE;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      WECHAT = _virtualInternal253AconstantsJs.WECHAT;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_palEnv) {
      findCanvas = _palEnv.findCanvas;
      loadJsFile = _palEnv.loadJsFile;
    }, function (_palPacer) {
      Pacer = _palPacer.Pacer;
    }, function (_assetAssetManagerAssetManagerJs) {
      assetManager = _assetAssetManagerAssetManagerJs.default;
    }, function (_coreIndexJs) {
      EventTarget = _coreIndexJs.EventTarget;
      AsyncDelegate = _coreIndexJs.AsyncDelegate;
      sys = _coreIndexJs.sys;
      macro = _coreIndexJs.macro;
      VERSION = _coreIndexJs.VERSION;
      cclegacy = _coreIndexJs.cclegacy;
      screen = _coreIndexJs.screen;
      settings = _coreIndexJs.settings;
      assert = _coreIndexJs.assert;
      garbageCollectionManager = _coreIndexJs.garbageCollectionManager;
      DebugMode = _coreIndexJs.DebugMode;
      warn = _coreIndexJs.warn;
      log = _coreIndexJs.log;
      _resetDebugSetting = _coreIndexJs._resetDebugSetting;
      errorID = _coreIndexJs.errorID;
      logID = _coreIndexJs.logID;
      SettingsCategory = _coreIndexJs.SettingsCategory;
    }, function (_inputIndexJs) {
      input = _inputIndexJs.input;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
      LegacyRenderMode = _gfxIndexJs.LegacyRenderMode;
    }, function (_splashScreenJs) {
      SplashScreen = _splashScreenJs.SplashScreen;
    }, function (_sceneGraphIndexJs) {
      Layers = _sceneGraphIndexJs.Layers;
    }, function (_assetAssetManagerBuiltinResMgrJs) {
      builtinResMgr = _assetAssetManagerBuiltinResMgrJs.builtinResMgr;
    }, function (_directorJs) {
      director = _directorJs.director;
      DirectorEvent = _directorJs.DirectorEvent;
    }, function (_renderingDefineJs) {
      bindingMappingInfo = _renderingDefineJs.bindingMappingInfo;
    }, function (_coreEffectSettingsJs) {
      effectSettings = _coreEffectSettingsJs.effectSettings;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      querySettings = settings.querySettings.bind(settings);
      /**
       * @zh
       * 游戏配置。
       * @en
       * Game configuration.
       */
      /**
       * @en An object to boot the game.
       * @zh 包含游戏主体信息并负责驱动游戏的游戏对象。
       */
      _export("Game", Game = class Game extends EventTarget {
        constructor() {
          super();
          /**
           * @en The outer frame of the game canvas; parent of game container.
           * @zh 游戏画布的外框，container 的父容器。
           *
           * @deprecated since 3.4.0, frame is a concept on web standard, please manager screens via the `screen` module.
           */
          this.frame = null;
          /**
           * @en The container of game canvas.
           * @zh 游戏画布的容器。
           *
           * @deprecated since 3.4.0, container is a concept on web standard, please manager screens via the `screen` module.
           */
          this.container = null;
          /**
           * @en The canvas of the game.
           * @zh 游戏的画布。
           */
          this.canvas = null;
          /**
           * @en The renderer backend of the game.
           * @zh 游戏的渲染器类型。
           */
          this.renderType = -1;
          this.eventTargetOn = super.on;
          this.eventTargetOnce = super.once;
          /**
           * @en
           * The current game configuration,
           * please be noticed any modification directly on this object after the game initialization won't take effect.
           * @zh
           * 当前的游戏配置
           * 注意：请不要直接修改这个对象，它不会有任何效果。
           */
          this.config = {};
          /**
           * @en Callback when the scripts of engine have been load.
           * @zh 当引擎完成启动后的回调函数。
           * @method onStart
           */
          this.onStart = null;
          /**
           * @en The expected delta time of each frame in milliseconds
           * @zh 期望帧率对应的每帧时间（以 ms 为单位）
           */
          this.frameTime = 1000 / 60;
          // states
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._isCloning = false;
          // deserializing or instantiating
          this._inited = false;
          this._engineInited = false;
          // whether the engine has inited
          this._rendererInitialized = false;
          this._paused = true;
          this._pausedByEngine = false;
          // frame control
          this._frameRate = 60;
          this._pacer = null;
          this._initTime = 0;
          this._startTime = 0;
          this._deltaTime = 0.0;
          this._useFixedDeltaTime = false;
          this._shouldLoadLaunchScene = true;
          /**
           * @en The event delegate pre base module initialization. At this point you can not use pal/logging/sys/settings API.
           * @zh 基础模块初始化之前的事件代理。在这个事件点你无法使用 pal/logging/sys/settings 的相关接口。
           */
          this.onPreBaseInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate post base module initialization. At this point you can use pal/logging/sys/settings API safely.
           * @zh 基础模块初始化之后的事件代理。在这个事件点你可以安全使用 pal/logging/sys/settings 的相关接口。
           */
          this.onPostBaseInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate pre infrastructure module initialization.
           * At this point you can not use assetManager/gfx/screen/builtinResMgr/macro/Layer API.
           * @zh 基础设施模块初始化之前的事件代理。在这个事件点你无法使用 assetManager/gfx/screen/builtinResMgr/macro/Layer 的相关接口。
           */
          this.onPreInfrastructureInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate post infrastructure module initialization.
           * At this point you can use assetManager/gfx/screen/builtinResMgr/macro/Layer API safely.
           *
           * @zh 基础设施模块初始化之后的事件代理。在这个事件点你可以安全使用 assetManager/gfx/screen/builtinResMgr/macro/Layer 的相关接口。
           */
          this.onPostInfrastructureInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate pre sub system module initialization. At this point you can not use physics/animation/rendering/tween/etc API.
           * @zh 子系统模块初始化之前的事件代理。在这个事件点你无法使用 physics/animation/rendering/tween/etc 的相关接口。
           */
          this.onPreSubsystemInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate post sub system module initialization. At this point you can use physics/animation/rendering/tween/etc API safely.
           * @zh 子系统模块初始化之后的事件代理。在这个事件点你可以安全使用 physics/animation/rendering/tween/etc 的相关接口。
           */
          this.onPostSubsystemInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate pre project data initialization.
           * At this point you can not access project data using [resources.load]/[director.loadScene] API.
           * @zh 项目数据初始化之前的事件代理。在这个事件点你无法使用访问项目数据的相关接口，例如 [resources.load]/[director.loadScene] 等 API。
           */
          this.onPreProjectInitDelegate = new AsyncDelegate();
          /**
           * @en The event delegate post project data initialization.
           * at this point you can access project data using [resources.load]/[director.loadScene] API safely.
           * @zh 项目数据初始化之后的事件代理。
           * 在这个事件点你可以安全使用访问项目数据的相关接口，例如 [resources.load]/[director.loadScene] 等 API。
           */
          this.onPostProjectInitDelegate = new AsyncDelegate();
        }

        /**
         * @en Indicates whether the engine and the renderer has been initialized
         * @zh 引擎和渲染器是否以完成初始化
         */
        get inited() {
          return this._inited;
        }

        /**
         * @en Expected frame rate of the game.
         * @zh 游戏的设定帧率。
         */
        get frameRate() {
          return this._frameRate;
        }
        set frameRate(frameRate) {
          if (typeof frameRate !== 'number') {
            frameRate = parseInt(frameRate, 10);
            if (Number.isNaN(frameRate)) {
              frameRate = 60;
            }
          }
          this._frameRate = frameRate;
          this.frameTime = 1000 / frameRate;
          if (this._pacer) this._pacer.targetFrameRate = this._frameRate;
        }

        /**
         * @en The delta time since last frame, unit: s.
         * @zh 获取上一帧的增量时间，以秒为单位。
         */
        get deltaTime() {
          return this._useFixedDeltaTime ? this.frameTime / 1000 : this._deltaTime;
        }

        /**
         * @en The total passed time since game start, unit: ms
         * @zh 获取从游戏开始到现在总共经过的时间，以毫秒为单位
         */
        get totalTime() {
          return performance.now() - this._initTime;
        }

        /**
         * @en The start time of the current frame in milliseconds.
         * @zh 获取当前帧开始的时间（以 ms 为单位）。
         */
        get frameStartTime() {
          return this._startTime;
        }
        // @Methods

        //  @Game play control

        /**
         * @en Set frame rate of game.
         * @zh 设置游戏帧率。
         * @deprecated since v3.3.0 please use [[game.frameRate]]
         */
        setFrameRate(frameRate) {
          this.frameRate = frameRate;
        }

        /**
         * @en Get frame rate set for the game, it doesn't represent the real frame rate.
         * @zh 获取设置的游戏帧率（不等同于实际帧率）。
         * @return frame rate
         * @deprecated since v3.3.0 please use [[game.frameRate]]
         */
        getFrameRate() {
          return this.frameRate;
        }

        /**
         * @en Run the game frame by frame with a fixed delta time correspond to frame rate.
         * @zh 以固定帧间隔执行一帧游戏循环，帧间隔与设定的帧率匹配。
         */
        step() {
          director.tick(this._calculateDT(true));
        }

        /**
         * @en Called by the engine to pause the game.
         * @zh 提供给引擎调用暂停游戏接口。
         */
        pauseByEngine() {
          if (this._paused) {
            return;
          }
          this._pausedByEngine = true;
          this.pause();
        }

        /**
         * @en Resume paused game by engine call.
         * @zh 提供给引擎调用恢复暂停游戏接口。
         */
        resumeByEngine() {
          if (this._pausedByEngine) {
            this.resume();
            this._pausedByEngine = false;
          }
        }

        /**
         * @en Pause the game main loop. This will pause:
         * - game logic execution
         * - rendering process
         * - input event dispatching (excluding Web and Minigame platforms)
         *
         * This is different with `director.pause()` which only pause the game logic execution.
         *
         * @zh 暂停游戏主循环。包含：
         * - 游戏逻辑
         * - 渲染
         * - 输入事件派发（Web 和小游戏平台除外）
         *
         * 这点和只暂停游戏逻辑的 `director.pause()` 不同。
         */
        pause() {
          var _this$_pacer;
          if (this._paused) {
            return;
          }
          this._paused = true;
          (_this$_pacer = this._pacer) == null || _this$_pacer.stop();
          this.emit(Game.EVENT_PAUSE);
        }

        /**
         * @en Resume the game from pause. This will resume:<br>
         * game logic execution, rendering process, event manager, background music and all audio effects.<br>
         * @zh 恢复游戏主循环。包含：游戏逻辑，渲染，事件处理，背景音乐和所有音效。
         */
        resume() {
          var _this$_pacer2;
          if (!this._paused) {
            return;
          }
          input._clearEvents();
          this._paused = false;
          (_this$_pacer2 = this._pacer) == null || _this$_pacer2.start();
          this.emit(Game.EVENT_RESUME);
        }

        /**
         * @en Check whether the game is paused.
         * @zh 判断游戏是否暂停。
         */
        isPaused() {
          return this._paused;
        }

        /**
         * @en Restart game.
         * @zh 重新开始游戏
         */
        restart() {
          const endFramePromise = new Promise(resolve => {
            director.once(DirectorEvent.END_FRAME, () => resolve());
          });
          return endFramePromise.then(() => {
            director.reset();
            cclegacy.Object._deferredDestroy();
            this.pause();
            this.resume();
            this._shouldLoadLaunchScene = true;
          }).then(() => {
            if (WECHAT) {
              return Promise.resolve([]);
            } else {
              return SplashScreen.createInstance().init();
            }
          }).then(() => {
            this._safeEmit(Game.EVENT_RESTART);
          });
        }

        /**
         * @en End game, it will close the game window
         * @zh 退出游戏
         */
        end() {
          systemInfo.close();
        }

        /**
         * @en
         * Register an callback of a specific event type on the game object.<br>
         * This type of event should be triggered via `emit`.<br>
         * @zh
         * 注册 game 的特定事件类型回调。这种类型的事件应该被 `emit` 触发。<br>
         *
         * @param type - A string representing the event type to listen for.
         * @param callback - The callback that will be invoked when the event is dispatched.<br>
         *                              The callback is ignored if it is a duplicate (the callbacks are unique).
         * @param target - The target (this object) to invoke the callback, can be null
         * @param once - After the first invocation, whether the callback should be unregistered.
         * @return - Just returns the incoming callback so you can save the anonymous function easier.
         */
        on(type, callback, target, once) {
          // Make sure EVENT_ENGINE_INITED callbacks to be invoked
          if (this.canRegisterEvent(type)) {
            callback.call(target);
          }
          return this.eventTargetOn(type, callback, target, once);
        }

        /**
         * @en
         * Register an callback of a specific event type on the game object,<br>
         * the callback will remove itself after the first time it is triggered.<br>
         * @zh
         * 注册 game 的特定事件类型回调，回调会在第一时间被触发后删除自身。
         *
         * @param type - A string representing the event type to listen for.
         * @param callback - The callback that will be invoked when the event is dispatched.<br>
         *                              The callback is ignored if it is a duplicate (the callbacks are unique).
         * @param target - The target (this object) to invoke the callback, can be null
         */
        once(type, callback, target) {
          // Make sure EVENT_ENGINE_INITED callbacks to be invoked
          if (this.canRegisterEvent(type)) {
            return callback.call(target);
          }
          return this.eventTargetOnce(type, callback, target);
        }
        canRegisterEvent(type) {
          return this._engineInited && type === Game.EVENT_ENGINE_INITED || this._inited && type === Game.EVENT_GAME_INITED || this._rendererInitialized && type === Game.EVENT_RENDERER_INITED;
        }

        /**
         * @en Init game with configuration object. Initialization process like below:
         * -PreBaseInitEvent
         * -BaseModuleInitialization(logging, sys, settings)
         * -PostBaseInitEvent
         * -PreInfrastructureInitEvent
         * -InfrastructureModuleInitialization(assetManager, builtinResMgr, gfxDevice, screen, Layer, macro)
         * -PostInfrastructureInitEvent
         * -PreSubsystemInitEvent
         * -SubsystemModuleInitialization(animation, physics, tween, ui, middleware, etc)
         * -PostSubsystemInitEvent
         * -EngineInitedEvent
         * -PreProjectDataInitEvent
         * -ProjectDataInitialization(GamePlayScripts, resources, etc)
         * -PostProjectDataInitEvent
         * -GameInitedEvent
         *
         * @zh 使用指定的配置初始化引擎。初始化流程如下：
         * -PreBaseInitEvent
         * -BaseModuleInitialization(logging, sys, settings)
         * -PostBaseInitEvent
         * -PreInfrastructureInitEvent
         * -InfrastructureModuleInitialization(assetManager, builtinResMgr, gfxDevice, screen, Layer, macro)
         * -PostInfrastructureInitEvent
         * -PreSubsystemInitEvent
         * -SubsystemModuleInitialization(animation, physics, tween, ui, middleware, etc)
         * -PostSubsystemInitEvent
         * -EngineInitedEvent
         * -PreProjectDataInitEvent
         * -ProjectDataInitialization(GamePlayScripts, resources, etc)
         * -PostProjectDataInitEvent
         * -GameInitedEvent
         * @param config - Pass configuration object
         */
        init(config) {
          this._compatibleWithOldParams(config);
          // DONT change the order unless you know what's you doing
          return Promise.resolve()
          // #region Base
          .then(() => {
            this.emit(Game.EVENT_PRE_BASE_INIT);
            return this.onPreBaseInitDelegate.dispatch();
          }).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.time('Init Base');
            }
            const debugMode = config.debugMode || DebugMode.NONE;
            _resetDebugSetting(debugMode);
          }).then(() => sys.init()).then(() => {
            this._initEvents();
          }).then(() => settings.init(config.settingsPath, config.overrideSettings)).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.timeEnd('Init Base');
            }
            this.emit(Game.EVENT_POST_BASE_INIT);
            return this.onPostBaseInitDelegate.dispatch();
          })
          // #endregion Base
          // #region Infrastructure
          .then(() => {
            this.emit(Game.EVENT_PRE_INFRASTRUCTURE_INIT);
            return this.onPreInfrastructureInitDelegate.dispatch();
          })
          // gfx init
          .then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.time('Init Infrastructure');
            }
            macro.init();
            this._initXR();
            const adapter = findCanvas();
            if (adapter) {
              this.canvas = adapter.canvas;
              this.frame = adapter.frame;
              this.container = adapter.container;
            }
            screen.init();
            garbageCollectionManager.init();
            return deviceManager.init(this.canvas, bindingMappingInfo);
          }).then(() => {
            const usesCustomPipeline = querySettings(SettingsCategory.RENDERING, 'customPipeline');
            if (usesCustomPipeline) {
              if (!cclegacy.rendering) {
                errorID(12109);
                return;
              }
              if (!macro.CUSTOM_PIPELINE_NAME) {
                // If custom pipeline is used, but the name is not set, use the default name
                macro.CUSTOM_PIPELINE_NAME = 'Builtin';
              }
            } else {
              // If custom pipeline is not used, disable custom-pipeline module
              cclegacy.rendering = undefined;
            }
            assetManager.init();
            builtinResMgr.init();
            Layers.init();
            this.initPacer();
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.timeEnd('Init Infrastructure');
            }
          }).then(() => {
            this.emit(Game.EVENT_POST_INFRASTRUCTURE_INIT);
            return this.onPostInfrastructureInitDelegate.dispatch();
          })
          // #endregion Infrastructure
          // #region Subsystem
          .then(() => {
            this.emit(Game.EVENT_PRE_SUBSYSTEM_INIT);
            return this.onPreSubsystemInitDelegate.dispatch();
          }).then(() => effectSettings.init(querySettings(SettingsCategory.RENDERING, 'effectSettingsPath'))).then(() => {
            // initialize custom render pipeline
            if (!cclegacy.rendering || !cclegacy.rendering.enableEffectImport) {
              return;
            }
            const renderMode = querySettings(SettingsCategory.RENDERING, 'renderMode');
            if (renderMode === LegacyRenderMode.HEADLESS) {
              cclegacy.rendering.init(deviceManager.gfxDevice, null);
              return;
            }
            const data = effectSettings.data;
            if (data === null) {
              errorID(1102);
              return;
            }
            cclegacy.rendering.init(deviceManager.gfxDevice, data);
          }).then(() => {
            const scriptPackages = querySettings(SettingsCategory.SCRIPTING, 'scriptPackages');
            if (scriptPackages) {
              return Promise.all(scriptPackages.map(pack => (specifier => new Promise(r => r(_context.import(`${specifier}`))))(pack)));
            }
            return Promise.resolve([]);
          }).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.time('Init SubSystem');
            }
            director.init();
            return builtinResMgr.loadBuiltinAssets();
          }).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.timeEnd('Init SubSystem');
            }
            this.emit(Game.EVENT_POST_SUBSYSTEM_INIT);
            return this.onPostSubsystemInitDelegate.dispatch();
          }).then(() => {
            log(`Cocos Creator v${VERSION}`);
            this.emit(Game.EVENT_ENGINE_INITED);
            this._engineInited = true;
          })
          // #endregion Subsystem
          // #region Project
          .then(() => {
            this.emit(Game.EVENT_PRE_PROJECT_INIT);
            return this.onPreProjectInitDelegate.dispatch();
          }).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.time('Init Project');
            }
            const jsList = querySettings(SettingsCategory.PLUGINS, 'jsList');
            let promise = Promise.resolve();
            if (jsList) {
              jsList.forEach(jsListFile => {
                promise = promise.then(() => loadJsFile(`${PREVIEW ? 'plugins' : 'src'}/${jsListFile}`));
              });
            }
            return promise;
          }).then(() => this._loadProjectBundles()).then(() => this._loadCCEScripts()).then(() => this._setupRenderPipeline()).then(() => this._loadPreloadAssets()).then(() => {
            builtinResMgr.compileBuiltinMaterial();
            if (WECHAT) {
              return Promise.resolve([]);
            }
            return SplashScreen.createInstance().init();
          }).then(() => {
            if (DEBUG) {
              // eslint-disable-next-line no-console
              console.timeEnd('Init Project');
            }
            this.emit(Game.EVENT_POST_PROJECT_INIT);
            return this.onPostProjectInitDelegate.dispatch();
          })
          // #endregion Project
          .then(() => {
            this._inited = true;
            this._safeEmit(Game.EVENT_GAME_INITED);
          });
        }
        _initXR() {
          var _querySettings;
          if (!USE_XR) return;
          if (typeof globalThis.__globalXR === 'undefined') {
            globalThis.__globalXR = {};
          }
          const globalXR = globalThis.__globalXR;
          globalXR.webxrCompatible = (_querySettings = querySettings(SettingsCategory.XR, 'webxrCompatible')) != null ? _querySettings : false;
          if (sys.isXR) {
            var _querySettings2, _querySettings3;
            // XrEntry must not be destroyed
            xr.entry = xr.XrEntry.getInstance();
            const xrMSAA = (_querySettings2 = querySettings(SettingsCategory.RENDERING, 'msaa')) != null ? _querySettings2 : 1;
            const xrRenderingScale = (_querySettings3 = querySettings(SettingsCategory.RENDERING, 'renderingScale')) != null ? _querySettings3 : 1.0;
            xr.entry.setMultisamplesRTT(xrMSAA);
            xr.entry.setRenderingScale(xrRenderingScale);
          }
        }
        _compatibleWithOldParams(config) {
          const overrideSettings = config.overrideSettings = config.overrideSettings || {};
          if ('showFPS' in config) {
            overrideSettings.profiling = overrideSettings.profiling || {};
            overrideSettings.profiling.showFPS = config.showFPS;
          }
          if ('frameRate' in config) {
            overrideSettings.screen = overrideSettings.screen || {};
            overrideSettings.screen.frameRate = config.frameRate;
          }
          if ('renderMode' in config) {
            overrideSettings.rendering = overrideSettings.rendering || {};
            overrideSettings.rendering.renderMode = config.renderMode;
          }
          if ('renderPipeline' in config) {
            overrideSettings.rendering = overrideSettings.rendering || {};
            overrideSettings.rendering.renderPipeline = config.renderPipeline;
          }
          if ('assetOptions' in config) {
            overrideSettings.assets = overrideSettings.assets || {};
            Object.assign(overrideSettings.assets, config.assetOptions);
          }
          if ('customJointTextureLayouts' in config) {
            overrideSettings.animation = overrideSettings.animation || {};
            overrideSettings.animation.customJointTextureLayouts = config.customJointTextureLayouts;
          }
          if ('physics' in config) {
            overrideSettings.physics = overrideSettings.physics || {};
            Object.assign(overrideSettings.physics, config.physics);
          }
          if ('orientation' in config) {
            overrideSettings.screen = overrideSettings.screen || {};
            overrideSettings.screen.orientation = config.orientation;
          }
          if ('exactFitScreen' in config) {
            overrideSettings.screen = overrideSettings.screen || {};
            overrideSettings.screen.exactFitScreen = config.exactFitScreen;
          }
        }
        _loadPreloadAssets() {
          const preloadAssets = querySettings(SettingsCategory.ASSETS, 'preloadAssets');
          if (!preloadAssets) return Promise.resolve([]);
          return Promise.all(preloadAssets.map(uuid => new Promise((resolve, reject) => {
            assetManager.loadAny(uuid, err => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            });
          })));
        }

        /**
         * @internal only for browser preview
         */
        _loadCCEScripts() {
          return new Promise((resolve, reject) => {
            // Since there is no script in the bundle during preview, we need to load the user's script in the following way
            if (PREVIEW && !TEST && !EDITOR && !NATIVE && !NODEJS) {
              const bundleName = 'cce:/internal/x/prerequisite-imports';
              (specifier => new Promise(r => r(_context.import(`${specifier}`))))(bundleName).then(() => resolve(), reason => reject(reason));
            } else if ((EDITOR || NODEJS) && globalThis.cce && globalThis.cce.Script) {
              globalThis.cce.Script.init().then(() => resolve());
            } else {
              resolve();
            }
          });
        }

        /**
         * @internal only for game-view
         */
        _loadProjectBundles() {
          const preloadBundles = querySettings(SettingsCategory.ASSETS, 'preloadBundles');
          if (!preloadBundles) return Promise.resolve([]);
          return Promise.all(preloadBundles.map(({
            bundle,
            version
          }) => new Promise((resolve, reject) => {
            const opts = {};
            if (version) opts.version = version;
            assetManager.loadBundle(bundle, opts, err => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            });
          })));
        }

        /**
         * @en Run game with configuration object and onStart function.
         * @zh 运行游戏，并且指定引擎配置和 onStart 的回调。
         * @param onStart - function to be executed after game initialized
         */
        run(onStart) {
          if (onStart) {
            this.onStart = onStart;
          }
          if (!this._inited || EDITOR_NOT_IN_PREVIEW) {
            return;
          }
          this.resume();
        }

        // @Methods
        /**
         * @engineInternal
         */
        _calculateDT(useFixedDeltaTime) {
          this._useFixedDeltaTime = useFixedDeltaTime;
          if (useFixedDeltaTime) {
            this._startTime = performance.now();
            return this.frameTime / 1000;
          }
          const now = performance.now();
          this._deltaTime = now > this._startTime ? (now - this._startTime) / 1000 : 0;
          if (this._deltaTime > Game.DEBUG_DT_THRESHOLD) {
            this._deltaTime = this.frameTime / 1000;
          }
          this._startTime = now;
          return this._deltaTime;
        }
        _updateCallback() {
          if (!this._inited) return;
          if (!WECHAT && SplashScreen.instance && !SplashScreen.instance.isFinished) {
            SplashScreen.instance.update(this._calculateDT(false));
          } else if (this._shouldLoadLaunchScene) {
            if (!WECHAT) {
              SplashScreen.releaseInstance();
            }
            this._shouldLoadLaunchScene = false;
            const launchScene = querySettings(SettingsCategory.LAUNCH, 'launchScene');
            if (launchScene) {
              // load scene
              director.loadScene(launchScene, () => {
                var _this$onStart;
                logID(1103, launchScene);
                this._initTime = performance.now();
                director.startAnimation();
                (_this$onStart = this.onStart) == null || _this$onStart.call(this);
              });
            } else {
              var _this$onStart2;
              this._initTime = performance.now();
              director.startAnimation();
              (_this$onStart2 = this.onStart) == null || _this$onStart2.call(this);
            }
          } else {
            director.tick(this._calculateDT(false));
          }
        }
        initPacer() {
          var _querySettings4;
          const frameRate = (_querySettings4 = querySettings(SettingsCategory.SCREEN, 'frameRate')) != null ? _querySettings4 : 60;
          assert(typeof frameRate === 'number');
          this._pacer = new Pacer();
          this._pacer.onTick = this._updateCallback.bind(this);
          this.frameRate = frameRate;
        }
        _initEvents() {
          systemInfo.on('show', this._onShow, this);
          systemInfo.on('hide', this._onHide, this);
          systemInfo.on('close', this._onClose, this);
        }
        _onHide() {
          this.emit(Game.EVENT_HIDE);
          this.pauseByEngine();
        }
        _onShow() {
          this.emit(Game.EVENT_SHOW);
          this.resumeByEngine();
        }
        _onClose() {
          this.emit(Game.EVENT_CLOSE);
          // TODO : Release Resources.
          systemInfo.exit();
        }

        //  @ Persist root node section
        /**
         * @en
         * Add a persistent root node to the game, the persistent node won't be destroyed during scene transition.<br>
         * The target node must be placed in the root level of hierarchy, otherwise this API won't have any effect.
         * @zh
         * 声明常驻根节点，该节点不会在场景切换中被销毁。<br>
         * 目标节点必须位于为层级的根节点，否则无效。
         * @param node - The node to be made persistent
         * @deprecated Since v3.6.0, please use director.addPersistRootNode instead.
         */
        addPersistRootNode(node) {
          director.addPersistRootNode(node);
        }

        /**
         * @en Remove a persistent root node.
         * @zh 取消常驻根节点。
         * @param node - The node to be removed from persistent node list
         * @deprecated Since v3.6.0, please use director.removePersistRootNode instead.
         */
        removePersistRootNode(node) {
          director.removePersistRootNode(node);
        }

        /**
         * @en Check whether the node is a persistent root node.
         * @zh 检查节点是否是常驻根节点。
         * @param node - The node to be checked.
         * @deprecated Since v3.6.0, please use director.isPersistRootNode instead.
         */
        isPersistRootNode(node) {
          return director.isPersistRootNode(node);
        }
        _setupRenderPipeline() {
          const usesCustomPipeline = querySettings(SettingsCategory.RENDERING, 'customPipeline');
          return this._setRenderPipeline(!!usesCustomPipeline);
        }
        _setRenderPipeline(customPipeline) {
          if (!director.root.setRenderPipeline(customPipeline)) {
            errorID(1222);
            return;
          }
          this._rendererInitialized = true;
          this._safeEmit(Game.EVENT_RENDERER_INITED);
        }
        _safeEmit(event) {
          if (EDITOR) {
            try {
              this.emit(event);
            } catch (e) {
              warn(e);
            }
          } else {
            this.emit(event);
          }
        }
      });
      /**
       * @en Event triggered when game hide to background.<br>
       * Please note that this event is not 100% guaranteed to be fired on Web platform,<br>
       * on native platforms, it corresponds to enter background event, os status bar or notification center may not trigger this event.
       * @zh 游戏进入后台时触发的事件。<br>
       * 请注意，在 WEB 平台，这个事件不一定会 100% 触发，这完全取决于浏览器的回调行为。<br>
       * 在原生平台，它对应的是应用被切换到后台事件，下拉菜单和上拉状态栏等不一定会触发这个事件，这取决于系统行为。
       * @example
       * ```ts
       * import { game } from 'cc';
       * game.on(Game.EVENT_HIDE, function () {
       *
       * });
       * ```
       */
      Game.EVENT_HIDE = 'game_on_hide';
      /**
       * @en Event triggered when game back to foreground<br>
       * Please note that this event is not 100% guaranteed to be fired on Web platform,<br>
       * on native platforms, it corresponds to enter foreground event.
       * @zh 游戏进入前台运行时触发的事件。<br>
       * 请注意，在 WEB 平台，这个事件不一定会 100% 触发，这完全取决于浏览器的回调行为。<br>
       * 在原生平台，它对应的是应用被切换到前台事件。
       */
      Game.EVENT_SHOW = 'game_on_show';
      /**
       * @en Event triggered when system in low memory status.<br>
       * This event is only triggered on native iOS/Android platform.
       * @zh 程序在内存不足时触发的事件。<br>
       * 该事件只会在 iOS/Android 平台触发。
       */
      Game.EVENT_LOW_MEMORY = 'game_on_low_memory';
      /**
       * @en Event triggered after game inited, at this point all engine objects and game scripts are loaded
       * @zh 游戏启动后的触发事件，此时加载所有的引擎对象和游戏脚本。
       */
      Game.EVENT_GAME_INITED = 'game_inited';
      /**
       * @en Event triggered after engine inited, at this point you will be able to use all engine classes.<br>
       * It was defined as EVENT_RENDERER_INITED in cocos creator v1.x and renamed in v2.0.
       * Since Cocos Creator v3.0, EVENT_RENDERER_INITED is a new event, look up define for details.
       * @zh 在引擎初始化之后触发的事件，此时您能够使用引擎所有的类。<br>
       * 它在 Cocos Creator v1.x 版本中名字为 EVENT_RENDERER_INITED，在 v2.0 更名为 EVENT_ENGINE_INITED
       * 并在 Cocos Creator v3.0 中将 EVENT_RENDERER_INITED 用作为渲染器初始化的事件。
       */
      Game.EVENT_ENGINE_INITED = 'engine_inited';
      /**
       * @en Event triggered after renderer inited, at this point you will be able to use all gfx renderer feature.<br>
       * @zh 在渲染器初始化之后触发的事件，此事件在 EVENT_ENGINE_INITED 之前触发，此时开始可使用 gfx 渲染框架。
       */
      Game.EVENT_RENDERER_INITED = 'renderer_inited';
      /**
       * @en Event triggered pre base module initialization, at this point you can not use pal/logging/sys/settings API.
       * @zh 基础模块初始化之前的事件，在这个事件点你无法使用 pal/logging/sys/settings 的相关接口。
       */
      Game.EVENT_PRE_BASE_INIT = 'pre_base_init';
      /**
       * @en Event triggered post base module initialization, at this point you can use pal/logging/sys/settings API safely.
       * @zh 基础模块初始化之后的事件，在这个事件点你可以安全使用 pal/logging/sys/settings 的相关接口。
       */
      Game.EVENT_POST_BASE_INIT = 'post_base_init';
      /**
       * @en Event triggered pre infrastructure initialization, at this point you can not use assetManager/gfx/screen/builtinResMgr/macro/Layer API.
       * @zh 基础设施初始化之前的事件，在这个事件点你无法使用 assetManager/gfx/screen/builtinResMgr/macro/Layer 的相关接口。
       */
      Game.EVENT_PRE_INFRASTRUCTURE_INIT = 'pre_infrastructure_init';
      /**
       * @en Event triggered post infrastructure initialization, at this point you can use assetManager/gfx/screen/builtinResMgr/macro/Layer API safely.
       * @zh 基础设施初始化之后的事件，在这个事件点你可以安全使用 assetManager/gfx/screen/builtinResMgr/macro/Layer 的相关接口。
       */
      Game.EVENT_POST_INFRASTRUCTURE_INIT = 'post_infrastructure_init';
      /**
       * @en Event triggered pre subsystem initialization, at this point you can not use physics/animation/rendering/tween/etc API.
       * @zh 子系统初始化之前的事件，在这个事件点你无法使用 physics/animation/rendering/tween/etc 的相关接口。
       */
      Game.EVENT_PRE_SUBSYSTEM_INIT = 'pre_subsystem_init';
      /**
       * @en Event triggered post subsystem initialization, at this point you can use physics/animation/rendering/tween/etc API safely.
       * @zh 子系统初始化之后的事件，在这个事件点你可以安全使用 physics/animation/rendering/tween/etc 的相关接口。
       */
      Game.EVENT_POST_SUBSYSTEM_INIT = 'post_subsystem_init';
      /**
       * @en Event triggered pre project data initialization,
       * at this point you can not access project data using [resources.load]/[director.loadScene] API.
       * @zh 项目数据初始化之前的事件，在这个事件点你无法使用访问项目数据的相关接口，例如 [resources.load]/[director.loadScene] 等 API。
       */
      Game.EVENT_PRE_PROJECT_INIT = 'pre_project_init';
      /**
       * @en Event triggered post project data initialization,
       * at this point you can access project data using [resources.load]/[director.loadScene] API safely.
       * @zh 项目数据初始化之后的事件，在这个事件点你可以安全使用访问项目数据的相关接口，例如 [resources.load]/[director.loadScene] 等 API。
       */
      Game.EVENT_POST_PROJECT_INIT = 'post_project_init';
      /**
       * @en Event triggered when game restart
       * @zh 调用restart后，触发事件
       */
      Game.EVENT_RESTART = 'game_on_restart';
      /**
       * @en Triggered when the game is paused.<br>
       * @zh 游戏暂停时触发该事件。<br>
       * @example
       * ```ts
       * import { game } from 'cc';
       * game.on(Game.EVENT_PAUSE, function () {
       *     //pause audio or video
       * });
       * ```
       */
      Game.EVENT_PAUSE = 'game_on_pause';
      /**
       * @en Triggered when the game is resumed.<br>
       * @zh 游戏恢复时触发该事件。<br>
       */
      Game.EVENT_RESUME = 'game_on_resume';
      /**
       * @en Triggered when the game will be closed. <br>
       * @zh 游戏将要关闭时触发的事件。<br>
       */
      Game.EVENT_CLOSE = 'game_on_close';
      /**
       * @en Web Canvas 2d API as renderer backend.
       * @zh 使用 Web Canvas 2d API 作为渲染器后端。
       */
      Game.RENDER_TYPE_CANVAS = 0;
      /**
       * @en WebGL API as renderer backend.
       * @zh 使用 WebGL API 作为渲染器后端。
       */
      Game.RENDER_TYPE_WEBGL = 1;
      /**
       * @en OpenGL API as renderer backend.
       * @zh 使用 OpenGL API 作为渲染器后端。
       */
      Game.RENDER_TYPE_OPENGL = 2;
      /**
       * @en Headless Renderer, usually used in test or server env
       * @zh 空渲染器，通常用于测试环境或服务器端模式
       */
      Game.RENDER_TYPE_HEADLESS = 3;
      /**
       * @en If delta time since last frame is more than this threshold in seconds,
       * the game timer will consider user is debugging and adjust the delta time to [[frameTime]].
       * @zh 如果距离上一帧的帧间隔超过了这个阈值（单位是 s），那么就会被认为正在调试，帧间隔会被自动调节为 [[frameTime]].
       */
      Game.DEBUG_DT_THRESHOLD = 1;
      cclegacy.Game = Game;

      /**
       * @en
       * This is a Game instance.
       * @zh
       * 这是一个 Game 类的实例，包含游戏主体信息并负责驱动游戏的游戏对象。
       */
      _export("game", game = cclegacy.game = new Game());
    }
  };
});