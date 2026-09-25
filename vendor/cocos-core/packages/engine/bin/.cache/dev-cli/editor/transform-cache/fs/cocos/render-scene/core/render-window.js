System.register("q-bundled:///fs/cocos/render-scene/core/render-window.js", ["../../../../virtual/internal%253Aconstants.js", "pal/screen-adapter", "../../../pal/screen-adapter/enum-type/index.js", "../../gfx/index.js", "../../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var DEBUG, screenAdapter, Orientation, TextureType, TextureUsageBit, Format, TextureInfo, FramebufferInfo, SurfaceTransform, TextureFlagBit, warn, RenderWindow, orientationMap, _windowCount;
  _export("RenderWindow", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_palScreenAdapterEnumTypeIndexJs) {
      Orientation = _palScreenAdapterEnumTypeIndexJs.Orientation;
    }, function (_gfxIndexJs) {
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
      Format = _gfxIndexJs.Format;
      TextureInfo = _gfxIndexJs.TextureInfo;
      FramebufferInfo = _gfxIndexJs.FramebufferInfo;
      SurfaceTransform = _gfxIndexJs.SurfaceTransform;
      TextureFlagBit = _gfxIndexJs.TextureFlagBit;
    }, function (_corePlatformDebugJs) {
      warn = _corePlatformDebugJs.warn;
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
      // NOTE: `Orientation` is a flag enum whose composite members (LANDSCAPE, AUTO) are never
      // actual runtime orientations, so this map intentionally only covers the physical ones.
      // It is therefore typed as Partial rather than a total Record<Orientation, ...>.
      orientationMap = {
        [Orientation.PORTRAIT]: SurfaceTransform.IDENTITY,
        [Orientation.LANDSCAPE_RIGHT]: SurfaceTransform.ROTATE_90,
        [Orientation.PORTRAIT_UPSIDE_DOWN]: SurfaceTransform.ROTATE_180,
        [Orientation.LANDSCAPE_LEFT]: SurfaceTransform.ROTATE_270
      }; // _windowCount is used to generate the render window Id.
      // It is monotonic increasing and unique.
      _windowCount = 0;
      /**
       * @en The render window represents the render target, it could be an off screen frame buffer or the on screen buffer.
       * @zh 渲染窗口代表了一个渲染目标，可以是离屏的帧缓冲，也可以是屏幕缓冲
       */
      _export("RenderWindow", RenderWindow = class RenderWindow {
        /**
         * @en Get window width. Pre-rotated (i.e. rotationally invariant, always in identity/portrait mode) if possible.
         * If you want to get oriented size instead, you should use [[renderer.scene.Camera.width]] which corresponds to the current screen rotation.
         * @zh 获取窗口宽度。如果支持交换链预变换，返回值将始终处于单位旋转（竖屏）坐标系下。如果需要获取旋转后的尺寸，请使用 [[renderer.scene.Camera.width]]。
         */
        get width() {
          return this._width;
        }

        /**
         * @en Get window height. Pre-rotated (i.e. rotationally invariant, always in identity/portrait mode) if possible.
         * If you want to get oriented size instead, you should use [[renderer.scene.Camera.width]] which corresponds to the current screen rotation.
         * @zh 获取窗口高度。如果支持交换链预变换，返回值将始终处于单位旋转（竖屏）坐标系下。如果需要获取旋转后的尺寸，请使用 [[renderer.scene.Camera.height]]。
         */
        get height() {
          return this._height;
        }

        /**
         * @en Get the swapchain for this window, if there is one
         * @zh 如果存在的话，获取此窗口的交换链
         */
        get swapchain() {
          return this._swapchain;
        }

        /**
         * @en Get window frame buffer.
         * @zh 帧缓冲对象。
         */
        get framebuffer() {
          return this._framebuffer;
        }
        get cameras() {
          return this._cameras;
        }

        /**
         * @en Get render window Id.
         * Render windowd Id is used to identify the render window in the render pipeline.
         * @zh 获得渲染窗口Id。渲染窗口Id用于在渲染管线中标识渲染窗口。
         */
        get renderWindowId() {
          return this._renderWindowId;
        }

        /**
         * @en Get the name of the color attachment.
         * The name is used to identify the color attachment in the render pipeline.
         * @zh 获取颜色附件的名称。用于自定义渲染管线中的资源注册。
         */
        get colorName() {
          return this._colorName;
        }

        /**
         * @en Get the name of the depth stencil attachment.
         * The name is used to identify the depth stencil attachment in the render pipeline.
         * @zh 获取深度模板附件的名称。用于自定义渲染管线中的资源注册。
         */
        get depthStencilName() {
          return this._depthStencilName;
        }

        /**
         * @en The render pipeline should handle the resize event properly
         * @zh 渲染管线应该正确处理窗口大小变化事件
         */
        isRenderWindowResized() {
          return this._isResized;
        }

        /**
         * @en The render pipeline should set this value to false after handling the resize event
         * @zh 渲染管线应该在处理完窗口大小变化事件后将此值设置为 false
         */
        setRenderWindowResizeHandled() {
          this._isResized = false;
        }
        /**
         * @private
         */
        static registerCreateFunc(root) {
          root._createWindowFun = _root => new RenderWindow(_root);
        }
        constructor(root) {
          this._title = '';
          this._width = 1;
          this._height = 1;
          this._swapchain = null;
          this._renderPass = null;
          this._colorTextures = [];
          this._depthStencilTexture = null;
          this._cameras = [];
          this._hasOnScreenAttachments = false;
          this._hasOffScreenAttachments = false;
          this._framebuffer = null;
          this._device = null;
          // _renderWindowId is used to identify the render window in the render pipeline
          this._renderWindowId = _windowCount++;
          // _isResized is used to indicate whether the render window is resized
          this._isResized = true;
          // _colorName is used to identify the color attachment in the render pipeline
          this._colorName = `Color${this._renderWindowId}`;
          // _depthStencilName is used to identify the depth stencil attachment in the render pipeline
          this._depthStencilName = `DepthStencil${this._renderWindowId}`;
        }
        initialize(device, info) {
          if (info.title !== undefined) {
            this._title = info.title;
          }
          if (info.swapchain !== undefined) {
            this._swapchain = info.swapchain;
          }
          this._width = info.width;
          this._height = info.height;
          this._device = device;
          this._renderPass = device.createRenderPass(info.renderPassInfo);
          if (info.swapchain) {
            this._swapchain = info.swapchain;
            this._colorTextures.push(info.swapchain.colorTexture);
            this._depthStencilTexture = info.swapchain.depthStencilTexture;
          } else {
            for (let i = 0; i < info.renderPassInfo.colorAttachments.length; i++) {
              const textureInfo = new TextureInfo(TextureType.TEX2D, TextureUsageBit.COLOR_ATTACHMENT | TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_SRC, info.renderPassInfo.colorAttachments[i].format, this._width, this._height);
              if (info.externalFlag && (info.externalFlag & TextureFlagBit.EXTERNAL_NORMAL || info.externalFlag & TextureFlagBit.EXTERNAL_OES)) {
                textureInfo.flags |= info.externalFlag;
                textureInfo.externalRes = info.externalResLow ? info.externalResLow : 0;
              }
              this._colorTextures.push(device.createTexture(textureInfo));
            }
            if (info.renderPassInfo.depthStencilAttachment && info.renderPassInfo.depthStencilAttachment.format !== Format.UNKNOWN) {
              this._depthStencilTexture = device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.DEPTH_STENCIL_ATTACHMENT | TextureUsageBit.SAMPLED, info.renderPassInfo.depthStencilAttachment.format, this._width, this._height));
              this._hasOffScreenAttachments = true;
            }
          }
          this._framebuffer = device.createFramebuffer(new FramebufferInfo(this._renderPass, this._colorTextures, this._depthStencilTexture));
          return true;
        }
        destroy() {
          this.clearCameras();
          if (this._framebuffer) {
            this._framebuffer.destroy();
            this._framebuffer = null;
          }
          if (this._depthStencilTexture) {
            this._depthStencilTexture.destroy();
            this._depthStencilTexture = null;
          }
          for (let i = 0; i < this._colorTextures.length; i++) {
            const colorTexture = this._colorTextures[i];
            if (colorTexture) {
              colorTexture.destroy();
            }
          }
          this._colorTextures.length = 0;
          this._device = null;
        }

        /**
         * @en Resize window.
         * @zh 重置窗口大小。
         * @param width The new width.
         * @param height The new height.
         */
        resize(width, height) {
          if (this._swapchain) {
            const surfaceTransform = orientationMap[screenAdapter.orientation];
            if (DEBUG && surfaceTransform === undefined) {
              warn(`Unexpected screen orientation: ${screenAdapter.orientation}`);
            }
            this._swapchain.resize(width, height, surfaceTransform || SurfaceTransform.IDENTITY);
            this._width = this._swapchain.width;
            this._height = this._swapchain.height;
          } else {
            for (let i = 0; i < this._colorTextures.length; i++) {
              this._colorTextures[i].resize(width, height);
            }
            if (this._depthStencilTexture) {
              this._depthStencilTexture.resize(width, height);
            }
            this._width = width;
            this._height = height;
          }
          if (this.framebuffer) {
            this.framebuffer.destroy();
            this._framebuffer = this._device.createFramebuffer(new FramebufferInfo(this._renderPass, this._colorTextures, this._depthStencilTexture));
          }
          this._cameras.forEach(camera => {
            camera.resize(width, height);
          });

          // This resize should only be handled by the render pipeline
          this._isResized = true;
        }

        /**
         * @en Extract all render cameras attached to the render window to the output cameras list
         * @zh 将所有挂载到当前渲染窗口的摄像机存储到输出列表参数中
         * @param cameras @en The output cameras list, should be empty before invoke this function
         *                @zh 输出相机列表参数，传入时应该为空
         */
        extractRenderCameras(cameras) {
          for (let j = 0; j < this._cameras.length; j++) {
            const camera = this._cameras[j];
            if (camera.enabled) {
              camera.update();
              cameras.push(camera);
            }
          }
        }

        /**
         * @en Attach a new camera to the render window
         * @zh 添加渲染相机
         * @param camera @en The camera to attach @zh 要挂载的相机
         */
        attachCamera(camera) {
          for (let i = 0; i < this._cameras.length; i++) {
            if (this._cameras[i] === camera) {
              return;
            }
          }
          this._cameras.push(camera);
          this.sortCameras();

          // This resize should only be handled by the render pipeline
          // If the camera is attached to the render window,
          // resize handler should be called to update render window resouces
          this._isResized = true;
        }

        /**
         * @en Detach a camera from the render window
         * @zh 移除场景中的渲染相机
         * @param camera @en The camera to detach @zh 要移除的相机
         */
        detachCamera(camera) {
          for (let i = 0; i < this._cameras.length; ++i) {
            if (this._cameras[i] === camera) {
              this._cameras.splice(i, 1);
              return;
            }
          }
        }

        /**
         * @en Clear all attached cameras
         * @zh 清空全部渲染相机
         */
        clearCameras() {
          this._cameras.length = 0;
        }

        /**
         * @en Sort all attached cameras with priority
         * @zh 按照优先级对所有挂载的相机排序
         */
        sortCameras() {
          this._cameras.sort((a, b) => a.priority - b.priority);
        }
      });
    }
  };
});