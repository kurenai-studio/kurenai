System.register("q-bundled:///fs/cocos/rendering/pipeline-event.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, PipelineEventProcessor, PipelineEventType;
  _export("PipelineEventProcessor", void 0);
  return {
    setters: [function (_coreIndexJs) {
      EventTarget = _coreIndexJs.EventTarget;
    }],
    execute: function () {
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
      _export("PipelineEventType", PipelineEventType = /*#__PURE__*/function (PipelineEventType) {
        /**
         * @en
         * The event type for render frame begin event
         *
         * @zh
         * 帧渲染开始事件。
         */
        PipelineEventType["RENDER_FRAME_BEGIN"] = "render-frame-begin";
        /**
          * @en
          * The event type for render frame end event
          *
          * @zh
          * 帧渲染结束事件。
          */
        PipelineEventType["RENDER_FRAME_END"] = "render-frame-end";
        /**
         * @en
         * The event type for render camera begin event
         *
         * @zh
         * 相机渲染开始事件。
         */
        PipelineEventType["RENDER_CAMERA_BEGIN"] = "render-camera-begin";
        /**
         * @en
         * The event type for render camera end event
         *
         * @zh
         * 相机渲染结束事件。
         */
        PipelineEventType["RENDER_CAMERA_END"] = "render-camera-end";
        /**
          * @en
          * FBO attachment texture zoom event
          *
          * @zh
          * FBO附件纹理缩放事件。
          */
        PipelineEventType["ATTACHMENT_SCALE_CAHNGED"] = "attachment-scale-changed";
        return PipelineEventType;
      }({}));
      _export("PipelineEventProcessor", PipelineEventProcessor = class PipelineEventProcessor extends EventTarget {
        constructor() {
          super();
          this.eventTargetOn = super.on;
          this.eventTargetOnce = super.once;
        }
        on(type, callback, target, once) {
          return this.eventTargetOn(type, callback, target, once);
        }
        once(type, callback, target) {
          return this.eventTargetOnce(type, callback, target);
        }
      });
    }
  };
});