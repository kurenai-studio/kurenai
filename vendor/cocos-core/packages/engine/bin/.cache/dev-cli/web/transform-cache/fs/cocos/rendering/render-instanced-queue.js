System.register("q-bundled:///fs/cocos/rendering/render-instanced-queue.js", ["./instanced-buffer.js", "./pipeline-state-manager.js", "./define.js"], function (_export, _context) {
  "use strict";

  var instancingCompareFn, PipelineStateManager, SetIndex, RenderInstancedQueue;
  _export("RenderInstancedQueue", void 0);
  return {
    setters: [function (_instancedBufferJs) {
      instancingCompareFn = _instancedBufferJs.instancingCompareFn;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
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
       * @en Render queue for instanced batching
       * @zh 渲染合批队列。
       */
      _export("RenderInstancedQueue", RenderInstancedQueue = class RenderInstancedQueue {
        constructor() {
          /**
           * @en A set of instanced buffer
           * @zh Instance 合批缓存集合。
           */
          this.queue = new Set();
          this._renderQueue = [];
        }
        /**
         * @en Clear the render queue
         * @zh 清空渲染队列。
         */
        clear() {
          const it = this.queue.values();
          let res = it.next();
          while (!res.done) {
            res.value.clear();
            res = it.next();
          }
          this._renderQueue.length = 0;
          this.queue.clear();
        }
        sort() {
          const sortedArray = Array.from(this.queue).sort(instancingCompareFn);
          sortedArray.forEach(item => {
            var _item$pass$blendState;
            if (!((_item$pass$blendState = item.pass.blendState.targets[0]) != null && _item$pass$blendState.blend)) {
              this._renderQueue.push(item);
            }
          });
          sortedArray.forEach(item => {
            var _item$pass$blendState2;
            if ((_item$pass$blendState2 = item.pass.blendState.targets[0]) != null && _item$pass$blendState2.blend) {
              this._renderQueue.push(item);
            }
          });
        }
        uploadBuffers(cmdBuff) {
          const it = this.queue.values();
          let res = it.next();
          while (!res.done) {
            if (res.value.hasPendingModels) res.value.uploadBuffers(cmdBuff);
            res = it.next();
          }
        }

        /**
         * @en Record command buffer for the current queue
         * @zh 记录命令缓冲。
         * @param cmdBuff The command buffer to store the result
         */
        recordCommandBuffer(device, renderPass, cmdBuff, descriptorSet = null, dynamicOffsets) {
          const it = this._renderQueue.length === 0 ? this.queue.values() : this._renderQueue[Symbol.iterator]();
          let res = it.next();
          while (!res.done) {
            const {
              instances,
              pass,
              hasPendingModels
            } = res.value;
            if (hasPendingModels) {
              cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
              let lastPSO = null;
              for (let b = 0; b < instances.length; ++b) {
                const instance = instances[b];
                if (!instance.count) {
                  continue;
                }
                const shader = instance.shader;
                const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, instance.ia);
                if (lastPSO !== pso) {
                  cmdBuff.bindPipelineState(pso);
                  lastPSO = pso;
                }
                if (descriptorSet) cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, descriptorSet);
                if (dynamicOffsets) {
                  cmdBuff.bindDescriptorSet(SetIndex.LOCAL, instance.descriptorSet, dynamicOffsets);
                } else {
                  cmdBuff.bindDescriptorSet(SetIndex.LOCAL, instance.descriptorSet, res.value.dynamicOffsets);
                }
                cmdBuff.bindInputAssembler(instance.ia);
                cmdBuff.draw(instance.ia);
              }
            }
            res = it.next();
          }
        }
      });
    }
  };
});