System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-queue.js", ["../base/queue.js"], function (_export, _context) {
  "use strict";

  var Queue, WebGL2Queue;
  _export("WebGL2Queue", void 0);
  return {
    setters: [function (_baseQueueJs) {
      Queue = _baseQueueJs.Queue;
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
      /** @mangle */
      _export("WebGL2Queue", WebGL2Queue = class WebGL2Queue extends Queue {
        constructor() {
          super();
          this.numDrawCalls = 0;
          this.numInstances = 0;
          this.numTris = 0;
        }
        initialize(info) {
          this._type = info.type;
        }
        destroy() {}
        submit(cmdBuffs) {
          for (let i = 0; i < cmdBuffs.length; i++) {
            const cmdBuff = cmdBuffs[i];
            // WebGL2CmdFuncExecuteCmds(this._device as WebGL2Device, cmdBuff.cmdPackage); // opted out
            this.numDrawCalls += cmdBuff.numDrawCalls;
            this.numInstances += cmdBuff.numInstances;
            this.numTris += cmdBuff.numTris;
          }
        }
        clear() {
          this.numDrawCalls = 0;
          this.numInstances = 0;
          this.numTris = 0;
        }
      });
    }
  };
});