System.register("q-bundled:///fs/cocos/root.js", ["../../virtual/internal%253Aconstants.js", "./core/index.js", "./rendering/debug-view.js", "./render-scene/scene/index.js", "./render-scene/scene/light.js", "./render-scene/core/render-scene.js", "./render-scene/core/render-window.js", "./gfx/index.js", "./rendering/pipeline-event.js", "./rendering/define.js", "./xr/xr-enums.js", "./rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var USE_XR, Pool, cclegacy, warnID, settings, macro, errorID, SettingsCategory, debug, DebugView, Camera, CameraType, TrackingType, LightType, RenderScene, RenderWindow, ColorAttachment, DepthStencilAttachment, RenderPassInfo, StoreOp, deviceManager, LegacyRenderMode, PipelineEventProcessor, localDescriptorSetLayout_ResizeMaxJoints, UBOCameraEnum, UBOGlobalEnum, UBOLocalEnum, UBOShadowEnum, UBOWorldBound, XREye, XRPoseType, getPipelineSceneData, Root;
  _export("Root", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_coreIndexJs) {
      Pool = _coreIndexJs.Pool;
      cclegacy = _coreIndexJs.cclegacy;
      warnID = _coreIndexJs.warnID;
      settings = _coreIndexJs.settings;
      macro = _coreIndexJs.macro;
      errorID = _coreIndexJs.errorID;
      SettingsCategory = _coreIndexJs.SettingsCategory;
      debug = _coreIndexJs.debug;
    }, function (_renderingDebugViewJs) {
      DebugView = _renderingDebugViewJs.DebugView;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      CameraType = _renderSceneSceneIndexJs.CameraType;
      TrackingType = _renderSceneSceneIndexJs.TrackingType;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_renderSceneCoreRenderSceneJs) {
      RenderScene = _renderSceneCoreRenderSceneJs.RenderScene;
    }, function (_renderSceneCoreRenderWindowJs) {
      RenderWindow = _renderSceneCoreRenderWindowJs.RenderWindow;
    }, function (_gfxIndexJs) {
      ColorAttachment = _gfxIndexJs.ColorAttachment;
      DepthStencilAttachment = _gfxIndexJs.DepthStencilAttachment;
      RenderPassInfo = _gfxIndexJs.RenderPassInfo;
      StoreOp = _gfxIndexJs.StoreOp;
      deviceManager = _gfxIndexJs.deviceManager;
      LegacyRenderMode = _gfxIndexJs.LegacyRenderMode;
    }, function (_renderingPipelineEventJs) {
      PipelineEventProcessor = _renderingPipelineEventJs.PipelineEventProcessor;
    }, function (_renderingDefineJs) {
      localDescriptorSetLayout_ResizeMaxJoints = _renderingDefineJs.localDescriptorSetLayout_ResizeMaxJoints;
      UBOCameraEnum = _renderingDefineJs.UBOCameraEnum;
      UBOGlobalEnum = _renderingDefineJs.UBOGlobalEnum;
      UBOLocalEnum = _renderingDefineJs.UBOLocalEnum;
      UBOShadowEnum = _renderingDefineJs.UBOShadowEnum;
      UBOWorldBound = _renderingDefineJs.UBOWorldBound;
    }, function (_xrXrEnumsJs) {
      XREye = _xrXrEnumsJs.XREye;
      XRPoseType = _xrXrEnumsJs.XRPoseType;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @en Initialization information for the Root
       * @zh Root 初始化描述信息
       */
      /**
       * @en Creation information for the Root
       * @zh 场景创建描述信息
       */
      /**
       * @en The root manager of the renderer which manages all device resources and the render pipeline.
       * @zh 基础渲染器管理类，管理所有设备相关的资源创建以及渲染管线。
       */
      _export("Root", Root = class Root {
        /**
         * @en The GFX device
         * @zh GFX 设备
         */
        get device() {
          return this._device;
        }

        /**
         * @en The main window
         * @zh 主窗口
         */
        get mainWindow() {
          return this._mainWindow;
        }

        /**
         * @en The current active window
         * @zh 当前激活的窗口
         */
        set curWindow(window) {
          this._curWindow = window;
        }
        get curWindow() {
          return this._curWindow;
        }

        /**
         * @e The temporary window for data transmission
         * @zh 临时窗口（用于数据传输）
         * @internal
         */
        set tempWindow(window) {
          this._tempWindow = window;
        }
        get tempWindow() {
          return this._tempWindow;
        }

        /**
         * @en The windows list
         * @zh 窗口列表
         */
        get windows() {
          return this._windows;
        }

        /**
         * @zh
         * 启用自定义渲染管线
         */
        get usesCustomPipeline() {
          return this._usesCustomPipeline;
        }

        /**
         * @en The render pipeline
         * @zh 渲染管线
         */
        get pipeline() {
          return this._pipeline;
        }

        /**
         * @en The custom render pipeline
         * @zh 自定义渲染管线
         */
        get customPipeline() {
          return this._customPipeline;
        }

        /**
         * @en The pipeline events
         * @zh 渲染管线事件
         */
        get pipelineEvent() {
          return this._pipelineEvent;
        }

        /**
         * @en The draw batch manager for 2D UI, for engine internal usage, user do not need to use this.
         * @zh 2D UI 渲染合批管理器，引擎内部使用，用户无需使用此接口
         */
        get batcher2D() {
          return this._batcher;
        }

        /**
         * @en Render scenes list
         * @zh 渲染场景列表
         */
        get scenes() {
          return this._scenes;
        }

        /**
         * @en The debug view manager for rendering
         * @zh 渲染调试管理器
         */
        get debugView() {
          return this._debugView;
        }

        /**
         * @en The time cumulated in seconds since the game began running.
         * @zh 累计时间（秒）。
         */
        get cumulativeTime() {
          return this._cumulativeTime;
        }

        /**
         * @en The current frame time in seconds.
         * @zh 帧时间（秒）。
         */
        get frameTime() {
          return this._frameTime;
        }

        /**
         * @en The frame count during the last second
         * @zh 一秒内的累计帧数
         */
        get frameCount() {
          return this._frameCount;
        }

        /**
         * @en The recent frame rate for the last second
         * @zh 当前每秒帧率
         */
        get fps() {
          return this._fps;
        }

        /**
         * @en The wanted frame rate set by user
         * @zh 每秒设定帧率
         */
        set fixedFPS(fps) {
          if (fps > 0) {
            this._fixedFPS = fps;
          }
        }
        get fixedFPS() {
          return this._fixedFPS;
        }

        /**
         * @internal
         */
        get dataPoolManager() {
          return this._dataPoolMgr;
        }

        /**
         * @en Whether the built-in deferred pipeline is used.
         * @zh 是否启用内置延迟渲染管线
         */
        get useDeferredPipeline() {
          return this._useDeferredPipeline;
        }
        get cameraList() {
          return this._cameraList;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */

        /**
         * @en The constructor of the root, user shouldn't create the root instance, it's managed by the [[Director]].
         * @zh 构造函数，用户不应该自己创建任何 Root 对象，它是由 [[Director]] 管理的。
         * @param device GFX device
         */
        constructor(device) {
          this._createSceneFun = null;
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._createWindowFun = null;
          this._windows = [];
          this._mainWindow = null;
          this._curWindow = null;
          this._tempWindow = null;
          this._usesCustomPipeline = true;
          this._pipeline = null;
          this._pipelineEvent = new PipelineEventProcessor();
          this._classicPipeline = null;
          this._customPipeline = null;
          this._batcher = null;
          this._scenes = [];
          this._modelPools = new Map();
          this._cameraPool = null;
          this._lightPools = new Map();
          this._debugView = new DebugView();
          this._fpsTime = 0;
          this._frameCount = 0;
          this._fps = 0;
          this._fixedFPS = 0;
          this._useDeferredPipeline = false;
          this._cumulativeTime = 0;
          this._frameTime = 0;
          this._cameraList = [];
          this._device = device;
          this._dataPoolMgr = cclegacy.internal.DataPoolManager && new cclegacy.internal.DataPoolManager(device);
          RenderScene.registerCreateFunc(this);
          RenderWindow.registerCreateFunc(this);
          this._cameraPool = new Pool(() => new Camera(this._device), 4, cam => cam.destroy());
        }

        /**
         * @en The initialization function, user shouldn't initialize the root, it's managed by the [[Director]].
         * @zh 初始化函数，用户不应该自己初始化 Root，它是由 [[Director]] 管理的。
         * @param info Root initialization information
         */
        initialize(info) {
          var _this$_dataPoolMgr;
          const swapchain = deviceManager.swapchain;
          const colorAttachment = new ColorAttachment();
          colorAttachment.format = swapchain.colorTexture.format;
          const depthStencilAttachment = new DepthStencilAttachment();
          depthStencilAttachment.format = swapchain.depthStencilTexture.format;
          depthStencilAttachment.depthStoreOp = StoreOp.DISCARD;
          depthStencilAttachment.stencilStoreOp = StoreOp.DISCARD;
          const renderPassInfo = new RenderPassInfo([colorAttachment], depthStencilAttachment);
          this._mainWindow = this.createWindow({
            title: 'rootMainWindow',
            width: swapchain.width,
            height: swapchain.height,
            renderPassInfo,
            swapchain
          });
          this._curWindow = this._mainWindow;
          const customJointTextureLayouts = settings.querySettings(SettingsCategory.ANIMATION, 'customJointTextureLayouts') || [];
          (_this$_dataPoolMgr = this._dataPoolMgr) == null || _this$_dataPoolMgr.jointTexturePool.registerCustomTextureLayouts(customJointTextureLayouts);
          this._resizeMaxJointForDS();
        }

        /**
         * @en Destroy the root, user shouldn't invoke this function, it will cause undefined behavior.
         * @zh 销毁 Root，用户不应该调用此方法，会造成未知行为。
         */
        destroy() {
          this.destroyScenes();
          if (this._pipeline) {
            this._pipeline.destroy();
            this._pipeline = null;
            this._pipelineEvent = null;
          }
          if (this._batcher) {
            this._batcher.destroy();
            this._batcher = null;
          }
          this._curWindow = null;
          this._mainWindow = null;
          this.dataPoolManager.clear();
          if (cclegacy.rendering) {
            cclegacy.rendering.destroy();
          }
        }

        /**
         * @en Resize the on-screen render windows.
         * @zh 重置在屏窗口的大小。
         * @param width The new width of the window.
         * @param height The new height of the window.
         * @param windowId The system window ID, optional for now.
         */
        resize(width, height, windowId) {
          this._windows.forEach(window => {
            if (window.swapchain) {
              window.resize(width, height);
            }
          });
        }

        /**
         * @en Setup the render pipeline
         * @zh 设置渲染管线
         * @param rppl The render pipeline
         * @returns The setup is successful or not
         */
        setRenderPipeline(useCustomPipeline) {
          const {
            internal,
            director,
            rendering,
            legacy_rendering
          } = cclegacy;
          if (rendering === undefined && legacy_rendering === undefined) {
            errorID(1223);
            return false;
          }
          //-----------------------------------------------
          // prepare classic pipeline
          //-----------------------------------------------
          let isCreateDefaultPipeline = false;
          if (useCustomPipeline) {
            this._customPipeline = rendering.createCustomPipeline();
            isCreateDefaultPipeline = true;
            this._pipeline = this._customPipeline;
            // Use default _pipelineEvent
            debug(`Using custom pipeline: ${macro.CUSTOM_PIPELINE_NAME}`);
          } else {
            const rppl = legacy_rendering.createDefaultPipeline();
            isCreateDefaultPipeline = true;
            debug(`Using legacy pipeline`);
            this._classicPipeline = rppl;
            this._pipeline = this._classicPipeline;
            this._pipelineEvent = this._classicPipeline; // Use forward pipeline's pipeline event
            this._usesCustomPipeline = false;
          }
          const renderMode = settings.querySettings(SettingsCategory.RENDERING, 'renderMode');
          if (renderMode !== LegacyRenderMode.HEADLESS || this._classicPipeline) {
            if (!this._pipeline.activate(this._mainWindow.swapchain)) {
              if (isCreateDefaultPipeline) {
                this._pipeline.destroy();
              }
              this._classicPipeline = null;
              this._customPipeline = null;
              this._pipeline = null;
              this._pipelineEvent = null;
              return false;
            }
          }

          //-----------------------------------------------
          // pipeline initialization completed
          //-----------------------------------------------
          const scene = director.getScene();
          if (scene) {
            scene.globals.activate();
          }
          this.onGlobalPipelineStateChanged();
          if (!this._batcher && internal.Batcher2D) {
            this._batcher = new internal.Batcher2D(this);
            if (!this._batcher.initialize()) {
              this.destroy();
              return false;
            }
          }
          return true;
        }

        /**
         * @en Notify the pipeline and all scenes that the global pipeline state have been updated so that they can update their render data and states.
         * @zh 通知渲染管线和所有场景全局管线状态已更新，需要更新自身状态。
         */
        onGlobalPipelineStateChanged() {
          for (let i = 0; i < this._scenes.length; i++) {
            this._scenes[i].onGlobalPipelineStateChanged();
          }
          if (getPipelineSceneData().skybox.enabled) {
            getPipelineSceneData().skybox.model.onGlobalPipelineStateChanged();
          }
          this._pipeline.onGlobalPipelineStateChanged();
        }

        /**
         * @en Active the render window as the [[curWindow]]
         * @zh 激活指定窗口为当前窗口 [[curWindow]]
         * @param window The render window to be activated
         */
        activeWindow(window) {
          this._curWindow = window;
        }

        /**
         * @en Reset the time cumulated
         * @zh 重置累计时间
         */
        resetCumulativeTime() {
          this._cumulativeTime = 0;
        }

        /**
         * @en The entry function of the render process for every frame.
         * @zh 用于每帧执行渲染流程的入口函数
         * @param deltaTime @en The delta time since last update. @zh 距离上一帧间隔时间
         */
        frameMove(deltaTime) {
          var _globalThis$__globalX;
          this._frameTime = deltaTime;
          ++this._frameCount;
          this._cumulativeTime += deltaTime;
          this._fpsTime += deltaTime;
          if (this._fpsTime > 1.0) {
            this._fps = this._frameCount;
            this._frameCount = 0;
            this._fpsTime = 0.0;
          }
          if (USE_XR && (_globalThis$__globalX = globalThis.__globalXR) != null && _globalThis$__globalX.isWebXR) {
            this._doWebXRFrameMove();
          } else {
            this._frameMoveBegin();
            this._frameMoveProcess();
            this._frameMoveEnd();
          }
        }

        /**
         * @en Create a render window
         * @zh 创建一个新的窗口
         * @param info @en The window creation information @zh 窗口描述信息
         */
        createWindow(info) {
          const window = this._createWindowFun(this);
          window.initialize(this.device, info);
          this._windows.push(window);
          return window;
        }

        /**
         * @en Destroy a render window
         * @zh 销毁指定的窗口
         * @param window The render window to be destroyed
         */
        destroyWindow(window) {
          for (let i = 0; i < this._windows.length; ++i) {
            if (this._windows[i] === window) {
              window.destroy();
              this._windows.splice(i, 1);
              return;
            }
          }
        }

        /**
         * @en Destroy all render windows
         * @zh 销毁全部窗口
         */
        destroyWindows() {
          this._windows.forEach(window => {
            window.destroy();
          });
          this._windows.length = 0;
        }

        /**
         * @en Create a render scene
         * @zh 创建渲染场景
         * @param info @en The creation information for render scene @zh 渲染场景描述信息
         */
        createScene(info) {
          const scene = this._createSceneFun(this);
          scene.initialize(info);
          this._scenes.push(scene);
          return scene;
        }

        /**
         * @en Destroy the given render scene
         * @zh 销毁指定的渲染场景
         * @param scene @en The render scene to be destroyed. @zh 要销毁的渲染场景
         */
        destroyScene(scene) {
          for (let i = 0; i < this._scenes.length; ++i) {
            if (this._scenes[i] === scene) {
              scene.destroy();
              this._scenes.splice(i, 1);
              return;
            }
          }
        }

        /**
         * @en Destroy all render scenes.
         * @zh 销毁全部场景。
         */
        destroyScenes() {
          this._scenes.forEach(scene => {
            scene.destroy();
          });
          this._scenes.length = 0;
        }

        /**
         * @en Create a model
         * @zh 创建模型
         * @param ModelCtor @en The class of the model @zh 模型的类
         * @returns The model created
         */
        createModel(ModelCtor) {
          let p = this._modelPools.get(ModelCtor);
          if (!p) {
            this._modelPools.set(ModelCtor, new Pool(() => new ModelCtor(), 10, obj => obj.destroy()));
            p = this._modelPools.get(ModelCtor);
          }
          const model = p.alloc();
          model.initialize();
          return model;
        }

        /**
         * @en Destroy the given model
         * @zh 销毁指定的模型
         * @param m @en The model to be destroyed @zh 要销毁的模型
         */
        destroyModel(m) {
          const p = this._modelPools.get(m.constructor);
          if (p) {
            p.free(m);
            if (m.scene) {
              m.scene.removeModel(m);
            }
          } else {
            warnID(1300, m.constructor.name);
          }
          m.destroy();
        }

        /**
         * @en Create a camera
         * @zh 创建一个相机
         * @returns The camera created.
         */
        createCamera() {
          return this._cameraPool.alloc();
        }

        /**
         * @en Create a light source
         * @zh 创建光源
         * @param LightCtor @en The class of the light @zh 光源的类
         * @returns The light created
         */
        createLight(LightCtor) {
          let l = this._lightPools.get(LightCtor);
          if (!l) {
            this._lightPools.set(LightCtor, new Pool(() => new LightCtor(), 4, obj => obj.destroy()));
            l = this._lightPools.get(LightCtor);
          }
          const light = l.alloc();
          light.initialize();
          return light;
        }

        /**
         * @en Destroy the given light
         * @zh 销毁指定的光源
         * @param l @en The light to be destroyed @zh 要销毁的光源
         */
        destroyLight(l) {
          if (l.scene) {
            switch (l.type) {
              case LightType.DIRECTIONAL:
                l.scene.removeDirectionalLight(l);
                break;
              case LightType.SPHERE:
                l.scene.removeSphereLight(l);
                break;
              case LightType.SPOT:
                l.scene.removeSpotLight(l);
                break;
              case LightType.POINT:
                l.scene.removePointLight(l);
                break;
              case LightType.RANGED_DIRECTIONAL:
                l.scene.removeRangedDirLight(l);
                break;
              default:
                break;
            }
          }
          l.destroy();
        }

        /**
         * @en recycle the given light to light object pool
         * @zh 回收指定的光源到对象池
         * @param l @en The light to be recycled @zh 要回收的光源
         */
        recycleLight(l) {
          const p = this._lightPools.get(l.constructor);
          if (p) {
            p.free(l);
            if (l.scene) {
              switch (l.type) {
                case LightType.DIRECTIONAL:
                  l.scene.removeDirectionalLight(l);
                  break;
                case LightType.SPHERE:
                  l.scene.removeSphereLight(l);
                  break;
                case LightType.SPOT:
                  l.scene.removeSpotLight(l);
                  break;
                case LightType.POINT:
                  l.scene.removePointLight(l);
                  break;
                case LightType.RANGED_DIRECTIONAL:
                  l.scene.removeRangedDirLight(l);
                  break;
                default:
                  break;
              }
            }
          }
        }
        _doWebXRFrameMove() {
          if (!USE_XR) return;
          const xr = globalThis.__globalXR;
          if (!xr) {
            return;
          }
          const windows = this._windows;
          const cameraList = this._cameraList;
          const viewCount = xr.webXRMatProjs ? xr.webXRMatProjs.length : 1;
          if (!xr.webXRWindowMap) {
            xr.webXRWindowMap = new Map();
          }
          let allCameras = [];
          const webxrHmdPoseInfos = xr.webxrHmdPoseInfos;
          for (let xrEye = 0; xrEye < viewCount; xrEye++) {
            for (const window of windows) {
              allCameras = allCameras.concat(window.cameras);
              if (window.swapchain) {
                xr.webXRWindowMap.set(window, xrEye);
              }
            }
            if (webxrHmdPoseInfos) {
              let cameraPosition = [0, 0, 0];
              for (let i = 0; i < webxrHmdPoseInfos.length; i++) {
                const info = webxrHmdPoseInfos[i];
                if (info.code === XRPoseType.VIEW_LEFT && xrEye === XREye.LEFT || info.code === XRPoseType.VIEW_RIGHT && xrEye === XREye.RIGHT) {
                  cameraPosition[0] = info.position.x;
                  cameraPosition[1] = info.position.y;
                  cameraPosition[2] = info.position.z;
                  break;
                }
              }
              allCameras.forEach(cam => {
                if (cam.trackingType !== TrackingType.NO_TRACKING && cam.node) {
                  const isTrackingRotation = cam.trackingType === TrackingType.ROTATION;
                  if (isTrackingRotation) {
                    cameraPosition = [0, 0, 0];
                  }
                  cam.node.setPosition(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
                }
              });
            }
            allCameras.length = 0;
            this._frameMoveBegin();
            this._frameMoveProcess();
            for (let i = cameraList.length - 1; i >= 0; i--) {
              const camera = cameraList[i];
              const isMismatchedCam = xrEye === XREye.LEFT && camera.cameraType === CameraType.RIGHT_EYE || xrEye === XREye.RIGHT && camera.cameraType === CameraType.LEFT_EYE;
              if (isMismatchedCam) {
                // currently is left eye loop, so right camera do not need active
                cameraList.splice(i, 1);
              }
            }
            this._frameMoveEnd();
          }
        }
        _frameMoveBegin() {
          for (let i = 0; i < this._scenes.length; ++i) {
            this._scenes[i].removeBatches();
          }
          this._cameraList.length = 0;
        }
        _frameMoveProcess() {
          const {
            director
          } = cclegacy;
          const windows = this._windows;
          const cameraList = this._cameraList;
          for (let i = 0; i < windows.length; i++) {
            const window = windows[i];
            window.extractRenderCameras(cameraList);
          }
          if (this._pipeline && cameraList.length > 0) {
            this._device.acquire([deviceManager.swapchain]);
            const scenes = this._scenes;
            const stamp = director.getTotalFrames();
            if (this._batcher) {
              this._batcher.update();
              this._batcher.uploadBuffers();
            }
            for (let i = 0; i < scenes.length; i++) {
              scenes[i].update(stamp);
            }
          }
        }
        _frameMoveEnd() {
          const {
            director,
            Director
          } = cclegacy;
          const cameraList = this._cameraList;
          if (this._pipeline && cameraList.length > 0) {
            director.emit(Director.EVENT_BEFORE_COMMIT);
            cameraList.sort((a, b) => a.priority - b.priority);
            for (let i = 0; i < cameraList.length; ++i) {
              var _cameraList$i$geometr;
              (_cameraList$i$geometr = cameraList[i].geometryRenderer) == null || _cameraList$i$geometr.update();
            }
            director.emit(Director.EVENT_BEFORE_RENDER);
            this._pipeline.render(cameraList);
            director.emit(Director.EVENT_AFTER_RENDER);
            this._device.present();
          }
          if (this._batcher) this._batcher.reset();
        }
        _resizeMaxJointForDS() {
          // TODO: usedUBOVectorCount should be estimated more carefully, the UBOs used could vary in different scenes.
          const usedUBOVectorCount = Math.max((UBOGlobalEnum.COUNT + UBOCameraEnum.COUNT + UBOShadowEnum.COUNT + UBOLocalEnum.COUNT + UBOWorldBound.COUNT) / 4, 100);
          let maxJoints = Math.floor((deviceManager.gfxDevice.capabilities.maxVertexUniformVectors - usedUBOVectorCount) / 3);
          maxJoints = maxJoints < 256 ? maxJoints : 256;
          localDescriptorSetLayout_ResizeMaxJoints(maxJoints);
        }
      });
      cclegacy.Root = Root;
    }
  };
});