System.register("q-bundled:///fs/cocos/rendering/post-process/passes/forward-transparency-simple-pass.js", ["../../custom/types.js", "../utils/pass-context.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var LightInfo, QueueHint, SceneFlags, passContext, BasePass, ForwardTransparencySimplePass;
  _export("ForwardTransparencySimplePass", void 0);
  return {
    setters: [function (_customTypesJs) {
      LightInfo = _customTypesJs.LightInfo;
      QueueHint = _customTypesJs.QueueHint;
      SceneFlags = _customTypesJs.SceneFlags;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_basePassJs) {
      BasePass = _basePassJs.BasePass;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("ForwardTransparencySimplePass", ForwardTransparencySimplePass = class ForwardTransparencySimplePass extends BasePass {
        constructor(...args) {
          super(...args);
          this.name = 'ForwardTransparencySimplePass';
        }
        slotName(camera, index = 0) {
          return passContext.forwardPass.slotName(camera, index);
        }
        render(camera, ppl) {
          const pass = passContext.pass;
          pass.addQueue(QueueHint.RENDER_TRANSPARENT).addSceneOfCamera(camera, new LightInfo(), SceneFlags.UI | SceneFlags.TRANSPARENT_OBJECT | SceneFlags.GEOMETRY);
        }
      });
    }
  };
});