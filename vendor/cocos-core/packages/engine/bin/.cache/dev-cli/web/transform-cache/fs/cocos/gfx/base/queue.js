System.register("q-bundled:///fs/cocos/gfx/base/queue.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var GFXObject, ObjectType, QueueType, Queue;
  _export("Queue", void 0);
  return {
    setters: [function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
      QueueType = _defineJs.QueueType;
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
       * @en GFX Queue.
       * @zh GFX 队列。
       */
      _export("Queue", Queue = class Queue extends GFXObject {
        /**
         * @en Get current type.
         * @zh 队列类型。
         */
        get type() {
          return this._type;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.QUEUE);
          this._type = QueueType.GRAPHICS;
        }

        /**
         * @en Submit command buffers.
         * @zh 提交命令缓冲数组。
         * @param cmdBuffs The command buffers to be submitted.
         * @param fence The syncing fence.
         */
      });
    }
  };
});