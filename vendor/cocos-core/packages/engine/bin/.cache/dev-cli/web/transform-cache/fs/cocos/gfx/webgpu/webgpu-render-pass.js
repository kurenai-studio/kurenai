System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-render-pass.js", ["../base/render-pass.js", "../base/define.js"], function (_export, _context) {
  "use strict";

  var RenderPass, LoadOp, StoreOp, Format, WebGPURenderPass;
  _export("WebGPURenderPass", void 0);
  return {
    setters: [function (_baseRenderPassJs) {
      RenderPass = _baseRenderPassJs.RenderPass;
    }, function (_baseDefineJs) {
      LoadOp = _baseDefineJs.LoadOp;
      StoreOp = _baseDefineJs.StoreOp;
      Format = _baseDefineJs.Format;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      _export("WebGPURenderPass", WebGPURenderPass = class WebGPURenderPass extends RenderPass {
        constructor(...args) {
          super(...args);
          this._gpuRenderPass = null;
        }
        get gpuRenderPass() {
          return this._gpuRenderPass;
        }
        _generateColorAttachment(colorAttachment) {
          return {
            view: {},
            // later
            loadOp: colorAttachment.loadOp === LoadOp.LOAD ? 'load' : 'clear',
            // what ever as long as not 'load'
            storeOp: colorAttachment.storeOp === StoreOp.STORE ? 'store' : 'discard'
          };
        }
        _generateDSAttachment(dsAttachment) {
          const depthStencilDescriptor = {};
          depthStencilDescriptor.depthClearValue = 1.0;
          depthStencilDescriptor.depthLoadOp = dsAttachment.depthLoadOp === LoadOp.CLEAR ? 'clear' : 'load';
          depthStencilDescriptor.depthStoreOp = dsAttachment.depthStoreOp === StoreOp.STORE ? 'store' : 'discard';
          depthStencilDescriptor.stencilClearValue = 0.0;
          depthStencilDescriptor.stencilLoadOp = dsAttachment.stencilLoadOp === LoadOp.CLEAR ? 'clear' : 'load';
          depthStencilDescriptor.stencilStoreOp = dsAttachment.stencilStoreOp === StoreOp.STORE ? 'store' : 'discard';
          depthStencilDescriptor.view = {};
          return depthStencilDescriptor;
        }
        initialize(info) {
          this._colorInfos = info.colorAttachments;
          this._depthStencilInfo = info.depthStencilAttachment;
          this._subpasses = info.subpasses;
          const colorDescriptions = [];
          const originalColorDesc = [];
          for (const attachment of info.colorAttachments) {
            originalColorDesc[colorDescriptions.length] = this._generateColorAttachment(attachment);
            colorDescriptions[colorDescriptions.length] = this._generateColorAttachment(attachment);
          }
          const renderPassDesc = {
            colorAttachments: colorDescriptions
          };
          const originalRPDesc = {
            colorAttachments: originalColorDesc
          };
          if (info.depthStencilAttachment.format !== Format.UNKNOWN) {
            const depthStencilDescriptor = this._generateDSAttachment(info.depthStencilAttachment);
            const originalDepthStencilDesc = this._generateDSAttachment(info.depthStencilAttachment);
            renderPassDesc.depthStencilAttachment = depthStencilDescriptor;
            originalRPDesc.depthStencilAttachment = originalDepthStencilDesc;
          }
          this._gpuRenderPass = {
            colorAttachments: this._colorInfos,
            depthStencilAttachment: this._depthStencilInfo,
            nativeRenderPass: renderPassDesc,
            originalRP: originalRPDesc
          };
        }
        destroy() {
          this._gpuRenderPass = null;
        }
      });
    }
  };
});