System.register("q-bundled:///fs/cocos/rendering/custom/framework.js", ["../define.js", "../../gfx/base/define.js", "../../core/math/color.js"], function (_export, _context) {
  "use strict";

  var supportsR32FloatTexture, Format, editorPipelineSettings, forceResize, _resizedWindows;
  function setEditorPipelineSettings(settings) {
    editorPipelineSettings = settings;
    forceResize = true;
  }
  function getEditorPipelineSettings() {
    return editorPipelineSettings;
  }

  //-----------------------------------------------------------------
  // Editor preview end
  //-----------------------------------------------------------------

  function forceResizeAllWindows() {
    forceResize = true;
  }
  function defaultWindowResize(ppl, window, width, height) {
    ppl.addRenderWindow(window.colorName, Format.BGRA8, width, height, window);
    ppl.addDepthStencil(window.depthStencilName, Format.DEPTH_STENCIL, width, height);
    // CSM
    const id = window.renderWindowId;
    const shadowFormat = supportsR32FloatTexture(ppl.device) ? Format.R32F : Format.RGBA8;
    const shadowSize = ppl.pipelineSceneData.shadows.size;
    ppl.addRenderTarget(`ShadowMap${id}`, shadowFormat, shadowSize.x, shadowSize.y);
    ppl.addDepthStencil(`ShadowDepth${id}`, Format.DEPTH_STENCIL, shadowSize.x, shadowSize.y);
  }
  function dispatchResizeEvents(cameras, builder, ppl) {
    if (!builder.windowResize) {
      // No game window resize handler defined.
      // Following old prodecure, do nothing
      return;
    }

    // Resize all windows.
    // Notice: A window might be resized multiple times with different cameras.
    // User should avoid resource collision between different cameras.
    for (const camera of cameras) {
      if (!camera.window.isRenderWindowResized() && !forceResize) {
        continue;
      }
      const width = Math.max(Math.floor(camera.window.width), 1);
      const height = Math.max(Math.floor(camera.window.height), 1);
      builder.windowResize(ppl, camera.window, camera, width, height);
      _resizedWindows.push(camera.window);
    }

    // Reset resize flags
    for (const window of _resizedWindows) {
      window.setRenderWindowResizeHandled();
    }

    // Clear resized windows
    _resizedWindows.length = 0;

    // For editor preview
    forceResize = false;
  }
  _export({
    setEditorPipelineSettings: setEditorPipelineSettings,
    getEditorPipelineSettings: getEditorPipelineSettings,
    forceResizeAllWindows: forceResizeAllWindows,
    defaultWindowResize: defaultWindowResize,
    dispatchResizeEvents: dispatchResizeEvents
  });
  return {
    setters: [function (_defineJs) {
      supportsR32FloatTexture = _defineJs.supportsR32FloatTexture;
    }, function (_gfxBaseDefineJs) {
      Format = _gfxBaseDefineJs.Format;
    }, function (_coreMathColorJs) {
      _export("packRGBE", _coreMathColorJs.packRGBE);
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
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
      //-----------------------------------------------------------------
      // Editor preview begin
      //-----------------------------------------------------------------
      editorPipelineSettings = null;
      forceResize = false;
      _resizedWindows = [];
    }
  };
});