System.register("q-bundled:///fs/cocos/gfx/device-manager.js", ["../../../virtual/internal%253Aconstants.js", "../core/index.js", "./base/define.js", "./base/device.js", "../../pal/system-info/enum-type/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, JSB, cclegacy, getError, sys, screen, settings, errorID, Settings, DeviceInfo, SwapchainInfo, Device, BrowserType, DeviceManager, LegacyRenderMode, RenderType, deviceManager;
  _export("DeviceManager", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      getError = _coreIndexJs.getError;
      sys = _coreIndexJs.sys;
      screen = _coreIndexJs.screen;
      settings = _coreIndexJs.settings;
      errorID = _coreIndexJs.errorID;
      Settings = _coreIndexJs.Settings;
    }, function (_baseDefineJs) {
      DeviceInfo = _baseDefineJs.DeviceInfo;
      SwapchainInfo = _baseDefineJs.SwapchainInfo;
    }, function (_baseDeviceJs) {
      Device = _baseDeviceJs.Device;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      BrowserType = _palSystemInfoEnumTypeIndexJs.BrowserType;
    }],
    execute: function () {
      /* eslint-disable max-len */
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en
       * Sets the renderer type, only useful on web
       *
       * @zh
       * 渲染模式。
       * 设置渲染器类型，仅适用于 web 端
       * @internal
       */
      _export("LegacyRenderMode", LegacyRenderMode = /*#__PURE__*/function (LegacyRenderMode) {
        /**
         * @en
         * Automatically chosen by engine.
         * @zh
         * 通过引擎自动选择。
         */
        LegacyRenderMode[LegacyRenderMode["AUTO"] = 0] = "AUTO";
        /**
         * @en
         * Forced to use canvas renderer.
         * @zh
         * 强制使用 canvas 渲染。
         */
        LegacyRenderMode[LegacyRenderMode["CANVAS"] = 1] = "CANVAS";
        /**
         * @en
         * Forced to use WebGL renderer, but this will be ignored on mobile browsers.
         * @zh
         * 强制使用 WebGL 渲染，但是在部分 Android 浏览器中这个选项会被忽略。
         */
        LegacyRenderMode[LegacyRenderMode["WEBGL"] = 2] = "WEBGL";
        /**
         * @en
         * Use Headless Renderer, which is useful in test or server env, only for internal use by cocos team for now
         * @zh
         * 使用空渲染器，可以用于测试和服务器端环境，目前暂时用于 Cocos 内部测试使用。
         */
        LegacyRenderMode[LegacyRenderMode["HEADLESS"] = 3] = "HEADLESS";
        /**
         * @en
         * Force WebGPU rendering, but this option will be ignored in some browsers.
         * @zh
         * 强制使用 WebGPU 渲染，但是在部分浏览器中这个选项会被忽略。
         */
        LegacyRenderMode[LegacyRenderMode["WEBGPU"] = 4] = "WEBGPU";
        return LegacyRenderMode;
      }({}));
      /**
       * @internal
       */
      _export("RenderType", RenderType = /*#__PURE__*/function (RenderType) {
        RenderType[RenderType["UNKNOWN"] = -1] = "UNKNOWN";
        RenderType[RenderType["CANVAS"] = 0] = "CANVAS";
        RenderType[RenderType["WEBGL"] = 1] = "WEBGL";
        RenderType[RenderType["WEBGPU"] = 2] = "WEBGPU";
        RenderType[RenderType["OPENGL"] = 3] = "OPENGL";
        RenderType[RenderType["HEADLESS"] = 4] = "HEADLESS";
        return RenderType;
      }({}));
      /**
       * @internal
       */
      _export("DeviceManager", DeviceManager = class DeviceManager {
        constructor() {
          this.initialized = false;
          this._gfxDevice = void 0;
          this._canvas = null;
          this._swapchain = void 0;
          this._renderType = RenderType.UNKNOWN;
          this._deviceInitialized = false;
        }
        get gfxDevice() {
          return this._gfxDevice;
        }
        get swapchain() {
          return this._swapchain;
        }
        _tryInitializeWebGPUDevice(DeviceConstructor, info) {
          if (this._deviceInitialized) {
            return Promise.resolve(true);
          }
          if (DeviceConstructor) {
            this._gfxDevice = new DeviceConstructor();
            return new Promise((resolve, reject) => {
              this._gfxDevice.initialize(info).then(val => {
                this._deviceInitialized = val;
                resolve(val);
              }).catch(err => {
                reject(err);
              });
            });
          }
          return Promise.resolve(false);
        }
        _tryInitializeDeviceSync(DeviceConstructor, info) {
          if (this._deviceInitialized) {
            return true;
          }
          if (DeviceConstructor) {
            this._gfxDevice = new DeviceConstructor();
            this._deviceInitialized = this._gfxDevice.initialize(info);
          }
          return this._deviceInitialized;
        }
        init(canvas, bindingMappingInfo) {
          // Avoid setup to be called twice.
          if (this.initialized) {
            return true;
          }
          const renderMode = settings.querySettings(Settings.Category.RENDERING, 'renderMode');
          this._canvas = canvas;
          if (this._canvas) {
            this._canvas.oncontextmenu = () => false;
          }
          this._renderType = this._determineRenderType(renderMode);
          this._deviceInitialized = false;
          const deviceInfo = new DeviceInfo(bindingMappingInfo);
          // WebGL or WebGPU context created successfully
          if (this._renderType === RenderType.WEBGL || this._renderType === RenderType.WEBGPU) {
            if (JSB && globalThis.gfx) {
              this._gfxDevice = gfx.DeviceManager.create(deviceInfo);
            } else {
              let useWebGL2 = !!globalThis.WebGL2RenderingContext;
              const userAgent = globalThis.navigator.userAgent.toLowerCase();
              // UC browser implementation doesn't conform to WebGL2 standard
              if (sys.browserType === BrowserType.UC) {
                useWebGL2 = false;
              }
              Device.canvas = canvas;
              if (this._renderType === RenderType.WEBGPU && cclegacy.WebGPUDevice) {
                return new Promise((resolve, reject) => {
                  this._tryInitializeWebGPUDevice(cclegacy.WebGPUDevice, deviceInfo).then(val => {
                    this._initSwapchain();
                    resolve(val);
                  }).catch(err => {
                    reject(err);
                  });
                });
              }
              if (useWebGL2 && cclegacy.WebGL2Device) {
                this._tryInitializeDeviceSync(cclegacy.WebGL2Device, deviceInfo);
              }
              if (cclegacy.WebGLDevice) {
                this._tryInitializeDeviceSync(cclegacy.WebGLDevice, deviceInfo);
              }
              if (cclegacy.EmptyDevice) {
                this._tryInitializeDeviceSync(cclegacy.EmptyDevice, deviceInfo);
              }
              this._initSwapchain();
            }
          } else if (this._renderType === RenderType.HEADLESS && cclegacy.EmptyDevice) {
            this._tryInitializeDeviceSync(cclegacy.EmptyDevice, deviceInfo);
            this._initSwapchain();
          }
          if (!this._gfxDevice) {
            // todo fix here for wechat game
            errorID(16337);
            this._renderType = RenderType.UNKNOWN;
            return false;
          }
          return true;
        }
        _initSwapchain() {
          const swapchainInfo = new SwapchainInfo(1, this._canvas);
          const windowSize = screen.windowSize;
          swapchainInfo.width = windowSize.width;
          swapchainInfo.height = windowSize.height;
          this._swapchain = this._gfxDevice.createSwapchain(swapchainInfo);
        }
        _supportWebGPU() {
          return 'gpu' in globalThis.navigator;
        }
        _determineRenderType(renderMode) {
          if (typeof renderMode !== 'number' || renderMode > LegacyRenderMode.WEBGPU || renderMode < LegacyRenderMode.AUTO) {
            renderMode = LegacyRenderMode.AUTO;
          }
          // Determine RenderType
          let renderType = RenderType.CANVAS;
          let supportRender = false;
          if (renderMode === LegacyRenderMode.CANVAS) {
            renderType = RenderType.CANVAS;
            supportRender = true;
          } else if (renderMode === LegacyRenderMode.AUTO || renderMode === LegacyRenderMode.WEBGPU) {
            renderType = this._supportWebGPU() && !EDITOR ? RenderType.WEBGPU : RenderType.WEBGL;
            supportRender = true;
          } else if (renderMode === LegacyRenderMode.WEBGL) {
            renderType = RenderType.WEBGL;
            supportRender = true;
          } else if (renderMode === LegacyRenderMode.HEADLESS) {
            renderType = RenderType.HEADLESS;
            supportRender = true;
          }
          if (!supportRender) {
            throw new Error(getError(3820, renderMode));
          }
          return renderType;
        }
      });
      /**
       * @internal
       */
      _export("deviceManager", deviceManager = new DeviceManager());
    }
  };
});