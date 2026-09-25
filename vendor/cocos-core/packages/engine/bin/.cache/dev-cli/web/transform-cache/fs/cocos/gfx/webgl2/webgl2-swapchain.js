System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-swapchain.js", ["../../../../virtual/internal%253Aconstants.js", "pal/system-info", "../../core/platform/debug.js", "./webgl2-state-cache.js", "./webgl2-texture.js", "../base/define.js", "../base/swapchain.js", "./webgl2-define.js", "../../../pal/system-info/enum-type/index.js", "./webgl2-gpu-objects.js", "../gl-constants.js", "../../core/platform/macro.js"], function (_export, _context) {
  "use strict";

  var EDITOR, USE_XR, systemInfo, warnID, warn, debug, WebGL2StateCache, WebGL2Texture, Format, TextureInfo, TextureFlagBit, TextureType, TextureUsageBit, BufferTextureCopy, Swapchain, WebGL2DeviceManager, OS, IWebGL2BlitManager, WebGLConstants, macro, WebGL2Swapchain, eventWebGLContextLost;
  function initStates(gl) {
    gl.activeTexture(WebGLConstants.TEXTURE0);
    gl.pixelStorei(WebGLConstants.PACK_ALIGNMENT, 1);
    gl.pixelStorei(WebGLConstants.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(WebGLConstants.UNPACK_FLIP_Y_WEBGL, false);
    gl.bindFramebuffer(WebGLConstants.FRAMEBUFFER, null);

    // rasterizer state
    gl.enable(WebGLConstants.SCISSOR_TEST);
    gl.enable(WebGLConstants.CULL_FACE);
    gl.cullFace(WebGLConstants.BACK);
    gl.frontFace(WebGLConstants.CCW);
    gl.polygonOffset(0.0, 0.0);

    // depth stencil state
    gl.enable(WebGLConstants.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(WebGLConstants.LESS);
    gl.stencilFuncSeparate(WebGLConstants.FRONT, WebGLConstants.ALWAYS, 1, 0xffff);
    gl.stencilOpSeparate(WebGLConstants.FRONT, WebGLConstants.KEEP, WebGLConstants.KEEP, WebGLConstants.KEEP);
    gl.stencilMaskSeparate(WebGLConstants.FRONT, 0xffff);
    gl.stencilFuncSeparate(WebGLConstants.BACK, WebGLConstants.ALWAYS, 1, 0xffff);
    gl.stencilOpSeparate(WebGLConstants.BACK, WebGLConstants.KEEP, WebGLConstants.KEEP, WebGLConstants.KEEP);
    gl.stencilMaskSeparate(WebGLConstants.BACK, 0xffff);
    gl.disable(WebGLConstants.STENCIL_TEST);

    // blend state
    gl.disable(WebGLConstants.SAMPLE_ALPHA_TO_COVERAGE);
    gl.disable(WebGLConstants.BLEND);
    gl.blendEquationSeparate(WebGLConstants.FUNC_ADD, WebGLConstants.FUNC_ADD);
    gl.blendFuncSeparate(WebGLConstants.ONE, WebGLConstants.ZERO, WebGLConstants.ONE, WebGLConstants.ZERO);
    gl.colorMask(true, true, true, true);
    gl.blendColor(0.0, 0.0, 0.0, 0.0);
  }
  function getExtension(gl, ext) {
    const prefixes = ['', 'WEBKIT_', 'MOZ_'];
    for (let i = 0; i < prefixes.length; ++i) {
      const _ext = gl.getExtension(prefixes[i] + ext);
      if (_ext) {
        return _ext;
      }
    }
    return null;
  }
  function getExtensions(gl) {
    const res = {
      EXT_texture_filter_anisotropic: getExtension(gl, 'EXT_texture_filter_anisotropic'),
      EXT_color_buffer_half_float: getExtension(gl, 'EXT_color_buffer_half_float'),
      EXT_color_buffer_float: getExtension(gl, 'EXT_color_buffer_float'),
      WEBGL_compressed_texture_etc1: getExtension(gl, 'WEBGL_compressed_texture_etc1'),
      WEBGL_compressed_texture_etc: getExtension(gl, 'WEBGL_compressed_texture_etc'),
      WEBGL_compressed_texture_pvrtc: getExtension(gl, 'WEBGL_compressed_texture_pvrtc'),
      WEBGL_compressed_texture_astc: getExtension(gl, 'WEBGL_compressed_texture_astc'),
      WEBGL_compressed_texture_s3tc: getExtension(gl, 'WEBGL_compressed_texture_s3tc'),
      WEBGL_compressed_texture_s3tc_srgb: getExtension(gl, 'WEBGL_compressed_texture_s3tc_srgb'),
      WEBGL_debug_shaders: getExtension(gl, 'WEBGL_debug_shaders'),
      WEBGL_lose_context: getExtension(gl, 'WEBGL_lose_context'),
      WEBGL_debug_renderer_info: getExtension(gl, 'WEBGL_debug_renderer_info'),
      OES_texture_half_float_linear: getExtension(gl, 'OES_texture_half_float_linear'),
      OES_texture_float_linear: getExtension(gl, 'OES_texture_float_linear'),
      WEBGL_multi_draw: null,
      useVAO: true
    };

    // platform-specific extension hacks
    // eslint-disable-next-line no-lone-blocks
    {
      // Mobile implementation seems to have performance issues
      if (systemInfo.os !== OS.ANDROID && systemInfo.os !== OS.IOS) {
        res.WEBGL_multi_draw = getExtension(gl, 'WEBGL_multi_draw');
      }
    }
    return res;
  }
  function getContext(canvas) {
    let context = null;
    try {
      var _globalThis$__globalX;
      if (USE_XR && (_globalThis$__globalX = globalThis.__globalXR) != null && _globalThis$__globalX.webxrCompatible) {
        const glAttribs = {
          alpha: macro.ENABLE_TRANSPARENT_CANVAS,
          antialias: EDITOR || macro.ENABLE_WEBGL_ANTIALIAS,
          depth: true,
          stencil: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          xrCompatible: true
        };
        context = canvas.getContext('webgl2', glAttribs);
        return context;
      }
      const webGLCtxAttribs = {
        alpha: macro.ENABLE_TRANSPARENT_CANVAS,
        antialias: EDITOR || macro.ENABLE_WEBGL_ANTIALIAS,
        depth: true,
        stencil: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      };
      context = canvas.getContext('webgl2', webGLCtxAttribs);
    } catch (err) {
      return null;
    }
    return context;
  }

  /** @mangle */
  _export({
    getExtensions: getExtensions,
    getContext: getContext,
    WebGL2Swapchain: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
      warn = _corePlatformDebugJs.warn;
      debug = _corePlatformDebugJs.debug;
    }, function (_webgl2StateCacheJs) {
      WebGL2StateCache = _webgl2StateCacheJs.WebGL2StateCache;
    }, function (_webgl2TextureJs) {
      WebGL2Texture = _webgl2TextureJs.WebGL2Texture;
    }, function (_baseDefineJs) {
      Format = _baseDefineJs.Format;
      TextureInfo = _baseDefineJs.TextureInfo;
      TextureFlagBit = _baseDefineJs.TextureFlagBit;
      TextureType = _baseDefineJs.TextureType;
      TextureUsageBit = _baseDefineJs.TextureUsageBit;
      BufferTextureCopy = _baseDefineJs.BufferTextureCopy;
    }, function (_baseSwapchainJs) {
      Swapchain = _baseSwapchainJs.Swapchain;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      OS = _palSystemInfoEnumTypeIndexJs.OS;
    }, function (_webgl2GpuObjectsJs) {
      IWebGL2BlitManager = _webgl2GpuObjectsJs.IWebGL2BlitManager;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
    }, function (_corePlatformMacroJs) {
      macro = _corePlatformMacroJs.macro;
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
      eventWebGLContextLost = 'webglcontextlost';
      _export("WebGL2Swapchain", WebGL2Swapchain = class WebGL2Swapchain extends Swapchain {
        constructor() {
          super();
          this.stateCache = new WebGL2StateCache();
          this.nullTex2D = null;
          this.nullTexCube = null;
          this._canvas = null;
          this._webGL2ContextLostHandler = null;
          this._extensions = null;
          this._blitManager = null;
        }
        get extensions() {
          return this._extensions;
        }
        get blitManager() {
          return this._blitManager;
        }
        initialize(info) {
          const self = this;
          self._canvas = info.windowHandle;
          self._webGL2ContextLostHandler = self._onWebGLContextLost.bind(self);
          self._canvas.addEventListener(eventWebGLContextLost, self._webGL2ContextLostHandler);
          const {
            instance
          } = WebGL2DeviceManager;
          const {
            gl,
            capabilities
          } = instance;
          self.stateCache.initialize(capabilities.maxTextureUnits, capabilities.maxUniformBufferBindings, capabilities.maxVertexAttributes);
          self._extensions = getExtensions(gl);

          // init states
          initStates(gl);
          const colorFmt = Format.RGBA8;
          let depthStencilFmt = Format.DEPTH_STENCIL;
          const depthBits = gl.getParameter(WebGLConstants.DEPTH_BITS);
          const stencilBits = gl.getParameter(WebGLConstants.STENCIL_BITS);
          if (depthBits && stencilBits) depthStencilFmt = Format.DEPTH_STENCIL;else if (depthBits) depthStencilFmt = Format.DEPTH;
          self._colorTexture = new WebGL2Texture();
          self._colorTexture.initAsSwapchainTexture({
            swapchain: self,
            format: colorFmt,
            width: info.width,
            height: info.height
          });
          self._depthStencilTexture = new WebGL2Texture();
          self._depthStencilTexture.initAsSwapchainTexture({
            swapchain: self,
            format: depthStencilFmt,
            width: info.width,
            height: info.height
          });

          // create default null texture
          self.nullTex2D = instance.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE));
          self.nullTexCube = instance.createTexture(new TextureInfo(TextureType.CUBE, TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE, 6));
          const nullTexRegion = new BufferTextureCopy();
          nullTexRegion.texExtent.width = 2;
          nullTexRegion.texExtent.height = 2;
          const nullTexBuff = new Uint8Array(self.nullTex2D.size);
          nullTexBuff.fill(0);
          instance.copyBuffersToTexture([nullTexBuff], self.nullTex2D, [nullTexRegion]);
          nullTexRegion.texSubres.layerCount = 6;
          instance.copyBuffersToTexture([nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff], self.nullTexCube, [nullTexRegion]);
          self._blitManager = new IWebGL2BlitManager();
        }
        destroy() {
          const self = this;
          if (self._canvas && self._webGL2ContextLostHandler) {
            self._canvas.removeEventListener(eventWebGLContextLost, self._webGL2ContextLostHandler);
            self._webGL2ContextLostHandler = null;
          }
          if (self.nullTex2D) {
            self.nullTex2D.destroy();
            self.nullTex2D = null;
          }
          if (self.nullTexCube) {
            self.nullTexCube.destroy();
            self.nullTexCube = null;
          }
          if (self._blitManager) {
            self._blitManager.destroy();
            self._blitManager = null;
          }
          self._extensions = null;
          self._canvas = null;
        }
        resize(width, height, surfaceTransform) {
          const self = this;
          if (self._colorTexture.width !== width || self._colorTexture.height !== height) {
            debug(`Resizing swapchain: ${width}x${height}`);
            self._canvas.width = width;
            self._canvas.height = height;
            self._colorTexture.resize(width, height);
            self._depthStencilTexture.resize(width, height);
          }
        }
        _onWebGLContextLost(event) {
          warnID(11000);
          warn(event);
          // 2020.9.3: `preventDefault` is not available on some platforms
          // event.preventDefault();
        }
      });
    }
  };
});