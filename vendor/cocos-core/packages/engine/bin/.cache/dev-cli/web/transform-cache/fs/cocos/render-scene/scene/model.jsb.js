System.register("q-bundled:///fs/cocos/render-scene/scene/model.jsb.js", ["../../gfx/index.js"], function (_export, _context) {
  "use strict";

  var deviceManager, ModelType, Model, modelProto, oldCreateBoundingShape;
  return {
    setters: [function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("ModelType", ModelType = /*#__PURE__*/function (ModelType) {
        ModelType[ModelType["DEFAULT"] = 0] = "DEFAULT";
        ModelType[ModelType["SKINNING"] = 1] = "SKINNING";
        ModelType[ModelType["BAKED_SKINNING"] = 2] = "BAKED_SKINNING";
        ModelType[ModelType["BATCH_2D"] = 3] = "BATCH_2D";
        ModelType[ModelType["PARTICLE_BATCH"] = 4] = "PARTICLE_BATCH";
        ModelType[ModelType["LINE"] = 5] = "LINE";
        return ModelType;
      }({}));
      _export("Model", Model = jsb.Model);
      modelProto = Model.prototype;
      modelProto._ctor = function () {
        this._device = deviceManager.gfxDevice;
      };
      oldCreateBoundingShape = modelProto.createBoundingShape;
      modelProto.createBoundingShape = function (minPos, maxPos) {
        if (!minPos || !maxPos) {
          return;
        }
        oldCreateBoundingShape.call(this, minPos, maxPos);
      };
    }
  };
});