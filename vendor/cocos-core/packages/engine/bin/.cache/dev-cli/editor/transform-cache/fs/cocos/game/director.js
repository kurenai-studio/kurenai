System.register("q-bundled:///fs/cocos/game/director.js", ["../../../virtual/internal%253Aconstants.js", "../asset/assets/scene-asset.js", "../core/index.js", "../input/index.js", "../root.js", "../scene-graph/index.js", "../scene-graph/component-scheduler.js", "../scene-graph/node-activator.js", "../core/memop/scalable-container.js", "../2d/framework/ui-renderer-manager.js", "../asset/asset-manager/index.js", "../gfx/index.js", "../asset/asset-manager/release-manager.js"], function (_export, _context) {
  "use strict";

  var DEBUG, EDITOR, BUILD, TEST, EDITOR_NOT_IN_PREVIEW, SceneAsset, System, EventTarget, Scheduler, js, errorID, error, assertID, warnID, macro, CCObject, CCObjectFlags, cclegacy, isValid, input, Root, Node, NodeEventType, Scene, ComponentScheduler, NodeActivator, scalableContainerManager, uiRendererManager, assetManager, deviceManager, releaseManager, Director, DirectorEvent, director;
  _export("Director", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_assetAssetsSceneAssetJs) {
      SceneAsset = _assetAssetsSceneAssetJs.SceneAsset;
    }, function (_coreIndexJs) {
      System = _coreIndexJs.System;
      EventTarget = _coreIndexJs.EventTarget;
      Scheduler = _coreIndexJs.Scheduler;
      js = _coreIndexJs.js;
      errorID = _coreIndexJs.errorID;
      error = _coreIndexJs.error;
      assertID = _coreIndexJs.assertID;
      warnID = _coreIndexJs.warnID;
      macro = _coreIndexJs.macro;
      CCObject = _coreIndexJs.CCObject;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      cclegacy = _coreIndexJs.cclegacy;
      isValid = _coreIndexJs.isValid;
    }, function (_inputIndexJs) {
      input = _inputIndexJs.input;
    }, function (_rootJs) {
      Root = _rootJs.Root;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
      NodeEventType = _sceneGraphIndexJs.NodeEventType;
      Scene = _sceneGraphIndexJs.Scene;
    }, function (_sceneGraphComponentSchedulerJs) {
      ComponentScheduler = _sceneGraphComponentSchedulerJs.ComponentScheduler;
    }, function (_sceneGraphNodeActivatorJs) {
      NodeActivator = _sceneGraphNodeActivatorJs.default;
    }, function (_coreMemopScalableContainerJs) {
      scalableContainerManager = _coreMemopScalableContainerJs.scalableContainerManager;
    }, function (_dFrameworkUiRendererManagerJs) {
      uiRendererManager = _dFrameworkUiRendererManagerJs.uiRendererManager;
    }, function (_assetAssetManagerIndexJs) {
      assetManager = _assetAssetManagerIndexJs.assetManager;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_assetAssetManagerReleaseManagerJs) {
      releaseManager = _assetAssetManagerReleaseManagerJs.releaseManager;
    }],
    execute: function () {
      /*
       Copyright (c) 2008-2010 Ricardo Quesada
       Copyright (c) 2011-2012 cocos2d-x.org
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
      /* spell-checker:words COORD, Quesada, INITED, Renerer */
      // ----------------------------------------------------------------------------------------------------------------------
      _export("DirectorEvent", DirectorEvent = /*#__PURE__*/function (DirectorEvent) {
        /**
         * @en The event which will be triggered when the singleton of Director initialized.
         * @zh Director 单例初始化时触发的事件
         * @event INIT
         */
        DirectorEvent["INIT"] = "director_init";
        /**
         * @en The event which will be triggered when the singleton of Director reset.
         * @zh Director 单例重置时触发的事件
         * @event RESET
         */
        DirectorEvent["RESET"] = "director_reset";
        /**
         * @en The event which will be triggered before loading a new scene.
         * @zh 加载新场景之前所触发的事件。
         * @event BEFORE_SCENE_LOADING
         */
        DirectorEvent["BEFORE_SCENE_LOADING"] = "director_before_scene_loading";
        /**
         * @en The event which will be triggered before launching a new scene.
         * @zh 运行新场景之前所触发的事件。
         * @event BEFORE_SCENE_LAUNCH
         */
        DirectorEvent["BEFORE_SCENE_LAUNCH"] = "director_before_scene_launch";
        /**
         * @en The event which will be triggered after launching a new scene.
         * @zh 运行新场景之后所触发的事件。
         * @event AFTER_SCENE_LAUNCH
         */
        DirectorEvent["AFTER_SCENE_LAUNCH"] = "director_after_scene_launch";
        /**
         * @en The event which will be triggered at the beginning of every frame.
         * @zh 每个帧的开始时所触发的事件。
         * @event BEFORE_UPDATE
         */
        DirectorEvent["BEFORE_UPDATE"] = "director_before_update";
        /**
         * @en The event which will be triggered after engine and components update logic.
         * @zh 将在引擎和组件 “update” 逻辑之后所触发的事件。
         * @event AFTER_UPDATE
         */
        DirectorEvent["AFTER_UPDATE"] = "director_after_update";
        /**
         * @en The event which will be triggered before the rendering process.
         * @zh 渲染过程之前所触发的事件。
         * @event BEFORE_DRAW
         */
        DirectorEvent["BEFORE_DRAW"] = "director_before_draw";
        /**
         * @en The event which will be triggered after the rendering process.
         * @zh 渲染过程之后所触发的事件。
         * @event AFTER_DRAW
         */
        DirectorEvent["AFTER_DRAW"] = "director_after_draw";
        /**
         * @en The event which will be triggered before the pipeline render commit.
         * @zh 当前渲染帧提交前所触发的事件。
         * @event BEFORE_COMMIT
         */
        DirectorEvent["BEFORE_COMMIT"] = "director_before_commit";
        /**
         * @en The event which will be triggered before the render pipeline processes the render scene.
         * @zh 当前帧将渲染场景提交到渲染管线之前所触发的事件。
         * @event BEFORE_RENDER
         */
        DirectorEvent["BEFORE_RENDER"] = "director_before_render";
        /**
         * @en The event which will be triggered after the render pipeline finishes the rendering process on CPU.
         * @zh 当前帧渲染管线渲染流程完成后所触发的事件。
         * @event AFTER_RENDER
         */
        DirectorEvent["AFTER_RENDER"] = "director_after_render";
        /**
         * @en The event which will be triggered before the physics process.<br/>
         * @zh 物理过程之前所触发的事件。
         * @event BEFORE_PHYSICS
         */
        DirectorEvent["BEFORE_PHYSICS"] = "director_before_physics";
        /**
         * @en The event which will be triggered after the physics process.<br/>
         * @zh 物理过程之后所触发的事件。
         * @event AFTER_PHYSICS
         */
        DirectorEvent["AFTER_PHYSICS"] = "director_after_physics";
        /**
         * @en The event which will be triggered at the frame begin.<br/>
         * @zh 一帧开始时所触发的事件。
         * @event BEGIN_FRAME
         */
        DirectorEvent["BEGIN_FRAME"] = "director_begin_frame";
        /**
         * @en The event which will be triggered at the frame end.<br/>
         * @zh 一帧结束之后所触发的事件。
         * @event END_FRAME
         */
        DirectorEvent["END_FRAME"] = "director_end_frame";
        return DirectorEvent;
      }({}));
      /**
       * @en
       * ATTENTION: USE `director` INSTEAD OF `Director`.
       * `director` is a singleton object which manage your game's logic flow.
       * Since the `director` is a singleton, you don't need to call any constructor or create functions,
       * the standard way to use it is by calling:
       * `director.methodName();`
       * It creates and handle the main Window and manages how and when to execute the Scenes.
       *
       * @zh
       * 注意：用 `director` 代替 `Director`。
       * `director` 一个管理你的游戏的逻辑流程的单例对象。
       * 由于 `director` 是一个单例，你不需要调用任何构造函数或创建函数，
       * 使用它的标准方法是通过调用：
       * `director.methodName();`
       * 它创建和处理主窗口并且管理什么时候执行场景。
       */
      _export("Director", Director = class Director extends EventTarget {
        constructor() {
          super();
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._compScheduler = new ComponentScheduler();
          // Scheduler for life-cycle methods in component
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._nodeActivator = new NodeActivator();
          this._invalid = false;
          this._paused = false;
          this._root = null;
          this._loadingScene = '';
          this._scene = null;
          this._totalFrames = 0;
          // FPS
          this._scheduler = new Scheduler();
          // Scheduler for user registration update
          this._systems = [];
          this._persistRootNodes = {};
        }

        /**
         * @en End the life of director in the next frame
         * @zh 执行完当前帧后停止 director 的执行
         */
        end() {
          this.once(DirectorEvent.END_FRAME, () => {
            this.purgeDirector();
          });
        }

        /**
         * @en Pause the director's ticker, only involve the game logic execution.<br>
         * It won't pause the rendering process nor the event manager.<br>
         * If you want to pause the entire game including rendering, audio and event,<br>
         * please use `game.pause`.
         * @zh 暂停正在运行的场景，该暂停只会停止游戏逻辑执行，但是不会停止渲染和 UI 响应。<br>
         * 如果想要更彻底得暂停游戏，包含渲染，音频和事件，请使用 `game.pause` 。
         */
        pause() {
          this._paused = true;
        }

        /**
         * @en Purge the `director` itself, including unschedule all schedule,<br>
         * remove all event listeners, clean up and exit the running scene, stops all animations, clear cached data.
         * @zh 清除 `director` 本身，包括停止所有的计时器，<br>
         * 移除所有的事件监听器，清理并退出当前运行的场景，停止所有动画，清理缓存数据。
         */
        purgeDirector() {
          // cleanup scheduler
          this._scheduler.unscheduleAll();
          this._compScheduler.unscheduleAll();
          this._nodeActivator.reset();
          if (!EDITOR) {
            if (isValid(this._scene)) {
              this._scene.destroy();
            }
            this._scene = null;
          }
          this.stopAnimation();

          // Clear all caches
          assetManager.releaseAll();
        }

        /**
         * @en Reset the director, can be used to restart the director after purge
         * @zh 重置此 Director，可用于在清除后重启 Director。
         */
        reset() {
          this.purgeDirector();
          for (const id in this._persistRootNodes) {
            this.removePersistRootNode(this._persistRootNodes[id]);
          }

          // Clear scene
          const scene = this.getScene();
          if (scene) {
            scene.destroy();
          }
          this.emit(DirectorEvent.RESET);
          this.startAnimation();
        }

        /**
         * @en
         * Run a scene. Replaces the running scene with a new one or enter the first scene.<br>
         * The new scene will be launched immediately.
         * @zh 运行指定场景。将正在运行的场景替换为（或重入为）新场景。新场景将立即启动。
         * @param scene - The need run scene.
         * @param onBeforeLoadScene - The function invoked at the scene before loading.
         * @param onLaunched - The function invoked at the scene after launch.
         */
        runSceneImmediate(scene, onBeforeLoadScene, onLaunched) {
          if (scene instanceof SceneAsset) scene = scene.scene;
          assertID(scene instanceof Scene, 1216);
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.time('InitScene');
          }
          scene._load(); // ensure scene initialized
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.timeEnd('InitScene');
          }
          // Re-attach or replace persist nodes
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.time('AttachPersist');
          }
          const persistNodeList = Object.keys(this._persistRootNodes).map(x => this._persistRootNodes[x]);
          for (let i = 0; i < persistNodeList.length; i++) {
            const node = persistNodeList[i];
            node.emit(NodeEventType.SCENE_CHANGED_FOR_PERSISTS, scene.renderScene);
            const existNode = scene.uuid === node._originalSceneId && scene.getChildByUuid(node.uuid);
            if (existNode) {
              // scene also contains the persist node, select the old one
              const index = existNode.siblingIndex;
              // restore to the old saving flag
              node.hideFlags &= ~CCObjectFlags.DontSave;
              node.hideFlags |= CCObjectFlags.DontSave & existNode.hideFlags;
              existNode._destroyImmediate();
              scene.insertChild(node, index);
            } else {
              node.hideFlags |= CCObjectFlags.DontSave;
              node.parent = scene;
            }
          }
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.timeEnd('AttachPersist');
          }
          const oldScene = this._scene;

          // unload scene
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.time('Destroy');
          }
          if (isValid(oldScene)) {
            oldScene.destroy();
          }
          if (!EDITOR) {
            // auto release assets
            if (BUILD && DEBUG) {
              // eslint-disable-next-line no-console
              console.time('AutoRelease');
            }
            releaseManager._autoRelease(oldScene, scene, this._persistRootNodes);
            if (BUILD && DEBUG) {
              // eslint-disable-next-line no-console
              console.timeEnd('AutoRelease');
            }
          }
          this._scene = null;

          // purge destroyed nodes belongs to old scene
          CCObject._deferredDestroy();
          // eslint-disable-next-line no-console
          if (BUILD && DEBUG) {
            console.timeEnd('Destroy');
          }
          if (onBeforeLoadScene) {
            onBeforeLoadScene();
          }
          this.emit(DirectorEvent.BEFORE_SCENE_LAUNCH, scene);

          // Run an Entity Scene
          this._scene = scene;
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.time('Activate');
          }
          scene._activate();
          if (BUILD && DEBUG) {
            // eslint-disable-next-line no-console
            console.timeEnd('Activate');
          }
          // start scene
          if (this._root) {
            this._root.resetCumulativeTime();
          }
          this.startAnimation();
          if (onLaunched) {
            onLaunched(null, scene);
          }
          this.emit(DirectorEvent.AFTER_SCENE_LAUNCH, scene);
        }

        /**
         * @en
         * Run a scene. Replaces the running scene with a new one or enter the first scene.<br>
         * The new scene will be launched at the end of the current frame.<br>
         * @zh 运行指定场景。
         * @param scene - The need run scene.
         * @param onBeforeLoadScene - The function invoked at the scene before loading.
         * @param onLaunched - The function invoked at the scene after launch.
         * @private
         */
        runScene(scene, onBeforeLoadScene, onLaunched) {
          if (scene instanceof SceneAsset) scene = scene.scene;
          assertID(Boolean(scene), 1205);
          assertID(scene instanceof Scene, 1216);

          // Delay run / replace scene to the end of the frame
          this.once(DirectorEvent.END_FRAME, () => {
            this.runSceneImmediate(scene, onBeforeLoadScene, onLaunched);
          });
        }

        /**
         * @en Loads the scene by its name.
         * @zh 通过场景名称进行加载场景。
         *
         * @param sceneName - The name of the scene to load.
         * @param onLaunched - callback, will be called after scene launched.
         * @return if error, return false
         */
        loadScene(sceneName, onLaunched, onUnloaded) {
          if (this._loadingScene) {
            warnID(1208, sceneName, this._loadingScene);
            return false;
          }
          const bundle = assetManager.bundles.find(bundle => !!bundle.getSceneInfo(sceneName));
          if (bundle) {
            this.emit(DirectorEvent.BEFORE_SCENE_LOADING, sceneName);
            this._loadingScene = sceneName;
            // eslint-disable-next-line no-console
            console.time(`LoadScene ${sceneName}`);
            bundle.loadScene(sceneName, (err, scene) => {
              // eslint-disable-next-line no-console
              console.timeEnd(`LoadScene ${sceneName}`);
              this._loadingScene = '';
              if (err) {
                error(err);
                if (onLaunched) {
                  onLaunched(err);
                }
              } else {
                this.runSceneImmediate(scene, onUnloaded, onLaunched);
              }
            });
            return true;
          } else {
            errorID(1209, sceneName);
            return false;
          }
        }

        /**
         * @en
         * Pre-loads the scene asset to reduces loading time. You can call this method at any time you want.<br>
         * After calling this method, you still need to launch the scene by `director.loadScene`.<br>
         * It will be totally fine to call `director.loadScene` at any time even if the preloading is not<br>
         * yet finished, the scene will be launched after loaded automatically.
         * @zh 预加载场景资源，你可以在任何时候调用这个方法。
         * 调用完后，你仍然需要通过 `director.loadScene` 来启动场景，因为这个方法不会执行场景加载操作。<br>
         * 就算预加载还没完成，你也可以直接调用 `director.loadScene`，加载完成后场景就会启动。
         * @param sceneName @en The name of the scene to load @zh 场景名称。
         * @param onLoaded @en Callback to execute once the scene is loaded @zh 加载回调。
         */

        /**
         * @en
         * Pre-loads the scene to reduces loading time. You can call this method at any time you want.<br>
         * After calling this method, you still need to launch the scene by `director.loadScene`.<br>
         * It will be totally fine to call `director.loadScene` at any time even if the preloading is not<br>
         * yet finished, the scene will be launched after loaded automatically.
         * @zh 预加载场景，你可以在任何时候调用这个方法。
         * 调用完后，你仍然需要通过 `director.loadScene` 来启动场景，因为这个方法不会执行场景加载操作。<br>
         * 就算预加载还没完成，你也可以直接调用 `director.loadScene`，加载完成后场景就会启动。
         * @param sceneName @en The name of scene to load @zh 场景名称。
         * @param onProgress @en Callback to execute when the load progression change.  @zh 加载进度回调。
         * @param onLoaded @en Callback to execute once the scene is loaded @zh 加载回调。
         */

        preloadScene(sceneName, onProgress, onLoaded) {
          const bundle = assetManager.bundles.find(bundle => !!bundle.getSceneInfo(sceneName));
          if (bundle) {
            // NOTE: the similar function signatures but defined as deferent function types.
            bundle.preloadScene(sceneName, null, onProgress, onLoaded);
          } else {
            const err = `Can not preload the scene "${sceneName}" because it is not in the build settings.`;
            if (onLoaded) {
              onLoaded(new Error(err));
            }
            error(`preloadScene: ${err}`);
          }
        }

        /**
         * @en Resume game logic execution after pause, if the current scene is not paused, nothing will happen.
         * @zh 恢复暂停场景的游戏逻辑，如果当前场景没有暂停将没任何事情发生。
         */
        resume() {
          this._paused = false;
        }
        get root() {
          return this._root;
        }

        /**
         * @en Returns current logic Scene.
         * @zh 获取当前逻辑场景。
         * @example
         * ```
         * import { director } from 'cc';
         * // This will help you to get the Canvas node in scene
         * director.getScene().getChildByName('Canvas');
         * ```
         */
        getScene() {
          return this._scene;
        }

        /**
         * @en Returns the delta time since last frame.
         * @zh 获取上一帧的增量时间。
         * @deprecated since v3.3.0, please use game.deltaTime instead
         */
        getDeltaTime() {
          return cclegacy.game.deltaTime;
        }

        /**
         * @en Returns the total passed time since game start, unit: ms
         * @zh 获取从游戏开始到现在总共经过的时间，单位为 ms
         * @deprecated since v3.3.0, please use game.totalTime instead
         */
        getTotalTime() {
          return cclegacy.game.totalTime;
        }

        /**
         * @en Returns the current time.
         * @zh 获取当前帧的时间。
         * @deprecated since v3.3.0, please use game.frameStartTime instead
         */
        getCurrentTime() {
          return cclegacy.game.frameStartTime;
        }

        /**
         * @en Returns how many frames were called since the director started.
         * @zh 获取 director 启动以来游戏运行的总帧数。
         */
        getTotalFrames() {
          return this._totalFrames;
        }

        /**
         * @en Returns whether or not the Director is paused.
         * @zh 是否处于暂停状态。
         */
        isPaused() {
          return this._paused;
        }

        /**
         * @en Returns the scheduler associated with this director.
         * @zh 获取和 director 相关联的调度器。
         */
        getScheduler() {
          return this._scheduler;
        }

        /**
         * @en Sets the scheduler associated with this director.
         * @zh 设置和 director 相关联的调度器。
         */
        setScheduler(scheduler) {
          if (this._scheduler !== scheduler) {
            this.unregisterSystem(this._scheduler);
            this._scheduler = scheduler;
            this.registerSystem(Scheduler.ID, scheduler, 200);
          }
        }

        /**
         * @en Register a system.
         * @zh 注册一个系统。
         */
        registerSystem(name, sys, priority) {
          sys.id = name;
          sys.priority = priority;
          this._systems.push(sys);
          this._systems.sort(System.sortByPriority);
        }
        unregisterSystem(sys) {
          js.array.fastRemove(this._systems, sys);
          this._systems.sort(System.sortByPriority);
        }

        /**
         * @en get a system.
         * @zh 获取一个 system。
         */
        getSystem(name) {
          return this._systems.find(sys => sys.id === name);
        }

        /**
         * @en Returns the `AnimationManager` associated with this director. Please use getSystem(AnimationManager.ID)
         * @zh 获取和 director 相关联的 `AnimationManager`（动画管理器）。请使用 getSystem(AnimationManager.ID) 来替代
         * @deprecated since 3.0.0
         */
        getAnimationManager() {
          return this.getSystem(cclegacy.AnimationManager.ID);
        }

        // Loop management
        /**
         * @en Starts the director
         * @zh 开始执行游戏逻辑
         */
        startAnimation() {
          this._invalid = false;
        }

        /**
         * @en Stops the director
         * @zh 停止执行游戏逻辑，每帧渲染会继续执行
         */
        stopAnimation() {
          this._invalid = true;
        }

        /**
         * @en Run main loop of director
         * @zh 运行主循环
         * @deprecated Since v3.6, please use [tick] instead
         */
        mainLoop(now) {
          let dt;
          if (EDITOR_NOT_IN_PREVIEW || TEST) {
            dt = now;
          } else {
            dt = cclegacy.game._calculateDT(false);
          }
          this.tick(dt);
        }

        /**
         * @en Run main loop of director
         * @zh 运行主循环
         * @param dt Delta time in seconds
         */
        tick(dt) {
          if (!this._invalid) {
            this.emit(DirectorEvent.BEGIN_FRAME);
            if (!EDITOR_NOT_IN_PREVIEW) {
              input._frameDispatchEvents();
            }

            // Update
            if (!this._paused) {
              this.emit(DirectorEvent.BEFORE_UPDATE);
              // Call start for new added components
              this._compScheduler.startPhase();
              // Update for components
              this._compScheduler.updatePhase(dt);
              // Update systems
              for (let i = 0; i < this._systems.length; ++i) {
                this._systems[i].update(dt);
              }
              // Late update for components
              this._compScheduler.lateUpdatePhase(dt);
              // User can use this event to do things after update
              this.emit(DirectorEvent.AFTER_UPDATE);
              // Destroy entities that have been removed recently
              CCObject._deferredDestroy();

              // Post update systems
              for (let i = 0; i < this._systems.length; ++i) {
                this._systems[i].postUpdate(dt);
              }
            }
            this.emit(DirectorEvent.BEFORE_DRAW);
            uiRendererManager.updateAllDirtyRenderers();
            this._root.frameMove(dt);
            this.emit(DirectorEvent.AFTER_DRAW);
            Node.resetHasChangedFlags();
            Node.clearNodeArray();
            scalableContainerManager.update(dt);
            this.emit(DirectorEvent.END_FRAME);
            this._totalFrames++;
          }
        }

        /**
         * @engineInternal
         * @en Build custom render pipeline
         * @zh 构建自定义渲染管线
         */
        buildRenderPipeline() {
          if (!this._root) {
            return;
          }
          // Here we should build the render pipeline.
          const ppl = this._root.customPipeline;
          const cameras = this._root.cameraList;
          ppl.beginSetup();
          const builder = cclegacy.rendering.getCustomPipeline(macro.CUSTOM_PIPELINE_NAME);
          cclegacy.rendering.dispatchResizeEvents(cameras, builder, ppl);
          builder.setup(cameras, ppl);
          ppl.endSetup();
        }
        setupRenderPipelineBuilder() {
          // Custom pipeline will only be used, when
          // 1. CUSTOM_PIPELINE_NAME is not empty
          //    (in CocosCreator/Project/Project Settings/Engine Manager/Macro Configuration/CUSTOM_PIPELINE_NAME)
          // 2. cclegacy.rendering is available
          // 3. The root node is created and uses custom pipeline
          if (macro.CUSTOM_PIPELINE_NAME !== '' && cclegacy.rendering && this._root && this._root.usesCustomPipeline) {
            this.on(DirectorEvent.BEFORE_SCENE_LAUNCH, cclegacy.rendering.forceResizeAllWindows, cclegacy.rendering);
          }
        }

        /**
         * @internal
         */
        init() {
          this._totalFrames = 0;
          this._paused = false;
          // Scheduler
          // TODO: have a solid organization of priority and expose to user
          this.registerSystem(Scheduler.ID, this._scheduler, 200);
          this._root = new Root(deviceManager.gfxDevice);
          const rootInfo = {};
          this._root.initialize(rootInfo);
          this.setupRenderPipelineBuilder();
          for (let i = 0; i < this._systems.length; i++) {
            this._systems[i].init();
          }
          this.emit(DirectorEvent.INIT);
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
         */
        addPersistRootNode(node) {
          if (!Node.isNode(node) || !node.uuid) {
            warnID(3800);
            return;
          }
          const id = node.uuid;
          if (!this._persistRootNodes[id]) {
            const scene = this._scene;
            if (isValid(scene)) {
              if (!node.parent) {
                node.parent = scene;
                node._originalSceneId = scene.uuid;
              } else if (!(node.parent instanceof Scene)) {
                warnID(3801);
                return;
              } else if (node.parent !== scene) {
                warnID(3802);
                return;
              } else {
                node._originalSceneId = scene.uuid;
              }
            }
            this._persistRootNodes[id] = node;
            node._persistNode = true;
            releaseManager._addPersistNodeRef(node);
          }
        }

        /**
         * @en Remove a persistent root node.
         * @zh 取消常驻根节点。
         * @param node - The node to be removed from persistent node list
         */
        removePersistRootNode(node) {
          const id = node.uuid || '';
          if (node === this._persistRootNodes[id]) {
            delete this._persistRootNodes[id];
            node._persistNode = false;
            node._originalSceneId = '';
            releaseManager._removePersistNodeRef(node);
          }
        }

        /**
         * @en Check whether the node is a persistent root node.
         * @zh 检查节点是否是常驻根节点。
         * @param node - The node to be checked
         */
        isPersistRootNode(node) {
          return !!node._persistNode;
        }
      });
      /**
       * @en The event which will be triggered when the singleton of Director initialized.
       * @zh Director 单例初始化时触发的事件
       * @event Director.EVENT_INIT
       */
      Director.EVENT_INIT = DirectorEvent.INIT;
      /**
       * @en The event which will be triggered when the singleton of Director reset.
       * @zh Director 单例重置时触发的事件
       * @event Director.EVENT_RESET
       */
      Director.EVENT_RESET = DirectorEvent.RESET;
      /**
       * @en The event which will be triggered before loading a new scene.
       * @zh 加载新场景之前所触发的事件。
       * @event Director.EVENT_BEFORE_SCENE_LOADING
       */
      Director.EVENT_BEFORE_SCENE_LOADING = DirectorEvent.BEFORE_SCENE_LOADING;
      /**
       * @en The event which will be triggered before launching a new scene.
       * @zh 运行新场景之前所触发的事件。
       * @event Director.EVENT_BEFORE_SCENE_LAUNCH
       */
      Director.EVENT_BEFORE_SCENE_LAUNCH = DirectorEvent.BEFORE_SCENE_LAUNCH;
      /**
       * @en The event which will be triggered after launching a new scene.
       * @zh 运行新场景之后所触发的事件。
       * @event Director.EVENT_AFTER_SCENE_LAUNCH
       */
      Director.EVENT_AFTER_SCENE_LAUNCH = DirectorEvent.AFTER_SCENE_LAUNCH;
      /**
       * @en The event which will be triggered at the beginning of every frame.
       * @zh 每个帧的开始时所触发的事件。
       * @event Director.EVENT_BEFORE_UPDATE
       */
      Director.EVENT_BEFORE_UPDATE = DirectorEvent.BEFORE_UPDATE;
      /**
       * @en The event which will be triggered after engine and components update logic.
       * @zh 将在引擎和组件 “update” 逻辑之后所触发的事件。
       * @event Director.EVENT_AFTER_UPDATE
       */
      Director.EVENT_AFTER_UPDATE = DirectorEvent.AFTER_UPDATE;
      /**
       * @en The event which will be triggered before the rendering process.
       * @zh 渲染过程之前所触发的事件。
       * @event Director.EVENT_BEFORE_DRAW
       */
      Director.EVENT_BEFORE_DRAW = DirectorEvent.BEFORE_DRAW;
      /**
       * @en The event which will be triggered after the rendering process.
       * @zh 渲染过程之后所触发的事件。
       * @event Director.EVENT_AFTER_DRAW
       */
      Director.EVENT_AFTER_DRAW = DirectorEvent.AFTER_DRAW;
      /**
       * @en The event which will be triggered before the pipeline render commit.
       * @zh 当前渲染帧提交前所触发的事件。
       * @event Director.EVENT_BEFORE_COMMIT
       */
      Director.EVENT_BEFORE_COMMIT = DirectorEvent.BEFORE_COMMIT;
      /**
       * @en The event which will be triggered before the render pipeline processes the render scene.
       * @zh 当前帧将渲染场景提交到渲染管线之前所触发的事件。
       * @event Director.EVENT_BEFORE_RENDER
       */
      Director.EVENT_BEFORE_RENDER = DirectorEvent.BEFORE_RENDER;
      /**
       * @en The event which will be triggered after the render pipeline finishes the rendering process on CPU.
       * @zh 当前帧渲染管线渲染流程完成后所触发的事件。
       * @event Director.EVENT_AFTER_RENDER
       */
      Director.EVENT_AFTER_RENDER = DirectorEvent.AFTER_RENDER;
      /**
       * @en The event which will be triggered before the physics process.<br/>
       * @zh 物理过程之前所触发的事件。
       * @event Director.EVENT_BEFORE_PHYSICS
       */
      Director.EVENT_BEFORE_PHYSICS = DirectorEvent.BEFORE_PHYSICS;
      /**
       * @en The event which will be triggered after the physics process.<br/>
       * @zh 物理过程之后所触发的事件。
       * @event Director.EVENT_AFTER_PHYSICS
       */
      Director.EVENT_AFTER_PHYSICS = DirectorEvent.AFTER_PHYSICS;
      /**
       * @en The event which will be triggered at the frame begin.<br/>
       * @zh 一帧开始时所触发的事件。
       * @event Director.EVENT_BEGIN_FRAME
       */
      Director.EVENT_BEGIN_FRAME = DirectorEvent.BEGIN_FRAME;
      /**
       * @en The event which will be triggered at the frame end.<br/>
       * @zh 一帧结束之后所触发的事件。
       * @event Director.EVENT_END_FRAME
       */
      Director.EVENT_END_FRAME = DirectorEvent.END_FRAME;
      Director.instance = void 0;
      cclegacy.Director = Director;
      cclegacy.DirectorEvent = DirectorEvent;

      /**
       * @en Director of the game, used to control game update loop and scene management
       * @zh 游戏的导演，用于控制游戏更新循环与场景管理。
       */
      _export("director", director = Director.instance = cclegacy.director = new Director());
    }
  };
});