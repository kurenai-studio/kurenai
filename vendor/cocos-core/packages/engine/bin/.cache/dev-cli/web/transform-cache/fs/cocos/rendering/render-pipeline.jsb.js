System.register("q-bundled:///fs/cocos/rendering/render-pipeline.jsb.js", ["../core/index.js", "./render-pipeline.js"], function (_export, _context) {
  "use strict";

  var cclegacy, RenderPipeline;
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderPipelineJs) {
      _export({
        IRenderPipelineInfo: _renderPipelineJs.IRenderPipelineInfo,
        MAX_BLOOM_FILTER_PASS_NUM: _renderPipelineJs.MAX_BLOOM_FILTER_PASS_NUM,
        BloomRenderData: _renderPipelineJs.BloomRenderData,
        PipelineRenderData: _renderPipelineJs.PipelineRenderData
      });
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
      _export("RenderPipeline", RenderPipeline = nr.RenderPipeline);
      // Do not delete, for the class detection of editor
      cclegacy.RenderPipeline = RenderPipeline;
    }
  };
});