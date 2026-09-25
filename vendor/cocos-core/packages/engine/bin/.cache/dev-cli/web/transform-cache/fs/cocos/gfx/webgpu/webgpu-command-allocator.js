System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-command-allocator.js", ["../../core/memop/cached-array.js", "./webgpu-commands.js"], function (_export, _context) {
  "use strict";

  var CachedArray, WebGPUCmdBeginRenderPass, WebGPUCmdBindStates, WebGPUCmdCopyBufferToTexture, WebGPUCmdDraw, WebGPUCmdUpdateBuffer, WebGPUCommandPool, WebGPUCommandAllocator;
  _export({
    WebGPUCommandPool: void 0,
    WebGPUCommandAllocator: void 0
  });
  return {
    setters: [function (_coreMemopCachedArrayJs) {
      CachedArray = _coreMemopCachedArrayJs.CachedArray;
    }, function (_webgpuCommandsJs) {
      WebGPUCmdBeginRenderPass = _webgpuCommandsJs.WebGPUCmdBeginRenderPass;
      WebGPUCmdBindStates = _webgpuCommandsJs.WebGPUCmdBindStates;
      WebGPUCmdCopyBufferToTexture = _webgpuCommandsJs.WebGPUCmdCopyBufferToTexture;
      WebGPUCmdDraw = _webgpuCommandsJs.WebGPUCmdDraw;
      WebGPUCmdUpdateBuffer = _webgpuCommandsJs.WebGPUCmdUpdateBuffer;
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
      _export("WebGPUCommandPool", WebGPUCommandPool = class WebGPUCommandPool {
        constructor(Clazz, count) {
          this._frees = void 0;
          this._freeIdx = 0;
          this._freeCmds = void 0;
          this._frees = new Array(count);
          this._freeCmds = new CachedArray(count);
          for (let i = 0; i < count; ++i) {
            this._frees[i] = new Clazz();
          }
          this._freeIdx = count - 1;
        }
        alloc(Clazz) {
          if (this._freeIdx < 0) {
            const size = this._frees.length * 2;
            const temp = this._frees;
            this._frees = new Array(size);
            const increase = size - temp.length;
            for (let i = 0; i < increase; ++i) {
              this._frees[i] = new Clazz();
            }
            for (let i = increase, j = 0; i < size; ++i, ++j) {
              this._frees[i] = temp[j];
            }
            this._freeIdx += increase;
          }
          const cmd = this._frees[this._freeIdx];
          this._frees[this._freeIdx--] = null;
          ++cmd.refCount;
          return cmd;
        }
        free(cmd) {
          if (--cmd.refCount === 0) {
            this._freeCmds.push(cmd);
          }
        }
        freeCmds(cmds) {
          const cmdLength = cmds.length;
          for (let i = 0; i < cmdLength; ++i) {
            if (--cmds.array[i].refCount === 0) {
              this._freeCmds.push(cmds.array[i]);
            }
          }
        }
        release() {
          const freeCmdLength = this._freeCmds.length;
          for (let i = 0; i < freeCmdLength; ++i) {
            const cmd = this._freeCmds.array[i];
            cmd.clear();
            this._frees[++this._freeIdx] = cmd;
          }
          this._freeCmds.clear();
        }
      });
      _export("WebGPUCommandAllocator", WebGPUCommandAllocator = class WebGPUCommandAllocator {
        constructor() {
          this.beginRenderPassCmdPool = void 0;
          this.bindStatesCmdPool = void 0;
          this.drawCmdPool = void 0;
          this.updateBufferCmdPool = void 0;
          this.copyBufferToTextureCmdPool = void 0;
          this.beginRenderPassCmdPool = new WebGPUCommandPool(WebGPUCmdBeginRenderPass, 1);
          this.bindStatesCmdPool = new WebGPUCommandPool(WebGPUCmdBindStates, 1);
          this.drawCmdPool = new WebGPUCommandPool(WebGPUCmdDraw, 1);
          this.updateBufferCmdPool = new WebGPUCommandPool(WebGPUCmdUpdateBuffer, 1);
          this.copyBufferToTextureCmdPool = new WebGPUCommandPool(WebGPUCmdCopyBufferToTexture, 1);
        }
        clearCmds(cmdPackage) {
          if (cmdPackage.beginRenderPassCmds.length) {
            this.beginRenderPassCmdPool.freeCmds(cmdPackage.beginRenderPassCmds);
            cmdPackage.beginRenderPassCmds.clear();
          }
          if (cmdPackage.bindStatesCmds.length) {
            this.bindStatesCmdPool.freeCmds(cmdPackage.bindStatesCmds);
            cmdPackage.bindStatesCmds.clear();
          }
          if (cmdPackage.drawCmds.length) {
            this.drawCmdPool.freeCmds(cmdPackage.drawCmds);
            cmdPackage.drawCmds.clear();
          }
          if (cmdPackage.updateBufferCmds.length) {
            this.updateBufferCmdPool.freeCmds(cmdPackage.updateBufferCmds);
            cmdPackage.updateBufferCmds.clear();
          }
          if (cmdPackage.copyBufferToTextureCmds.length) {
            this.copyBufferToTextureCmdPool.freeCmds(cmdPackage.copyBufferToTextureCmds);
            cmdPackage.copyBufferToTextureCmds.clear();
          }
          cmdPackage.cmds.clear();
        }
        releaseCmds() {
          this.beginRenderPassCmdPool.release();
          this.bindStatesCmdPool.release();
          this.drawCmdPool.release();
          this.updateBufferCmdPool.release();
          this.copyBufferToTextureCmdPool.release();
        }
      });
    }
  };
});