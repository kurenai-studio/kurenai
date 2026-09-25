System.register("q-bundled:///fs/cocos/rendering/post-process/passes/forward-transparency-pass.js", ["../../../gfx/index.js", "../../custom/types.js", "../../custom/define.js", "../utils/pass-context.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var ClearFlagBit, Format, LightInfo, QueueHint, SceneFlags, getCameraUniqueID, passContext, BasePass, getRTFormatBeforeToneMapping, getShadowMapSampler, ForwardTransparencyPass;
  _export("ForwardTransparencyPass", void 0);
  return {
    setters: [function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_customTypesJs) {
      LightInfo = _customTypesJs.LightInfo;
      QueueHint = _customTypesJs.QueueHint;
      SceneFlags = _customTypesJs.SceneFlags;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_basePassJs) {
      BasePass = _basePassJs.BasePass;
      getRTFormatBeforeToneMapping = _basePassJs.getRTFormatBeforeToneMapping;
      getShadowMapSampler = _basePassJs.getShadowMapSampler;
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
      _export("ForwardTransparencyPass", ForwardTransparencyPass = class ForwardTransparencyPass extends BasePass {
        constructor(...args) {
          super(...args);
          this.name = 'ForwardTransparencyPass';
          this.enableInAllEditorCamera = true;
          this.depthBufferShadingScale = 1;
        }
        slotName(camera, index = 0) {
          return this.lastPass.slotName(camera, index);
        }
        render(camera, ppl) {
          passContext.clearFlag = ClearFlagBit.NONE;
          const output = this.lastPass.slotName(camera, 0);
          const outputDS = passContext.depthSlotName;
          const cameraID = getCameraUniqueID(camera);
          const isOffScreen = true;
          passContext.updatePassViewPort().addRenderPass('default', `${this.name}_${cameraID}`).addRasterView(output, getRTFormatBeforeToneMapping(ppl), isOffScreen).addRasterView(outputDS, Format.DEPTH_STENCIL, isOffScreen).version();
          const pass = passContext.pass;
          const shadowPass = passContext.shadowPass;
          if (shadowPass) {
            for (const dirShadowName of shadowPass.mainLightShadows) {
              if (ppl.containsResource(dirShadowName)) {
                pass.addTexture(dirShadowName, 'cc_shadowMap', getShadowMapSampler());
              }
            }
            for (const spotShadowName of shadowPass.spotLightShadows) {
              if (ppl.containsResource(spotShadowName)) {
                pass.addTexture(spotShadowName, 'cc_spotShadowMap', getShadowMapSampler());
              }
            }
          }
          pass.addQueue(QueueHint.RENDER_TRANSPARENT).addSceneOfCamera(camera, new LightInfo(), SceneFlags.UI | SceneFlags.TRANSPARENT_OBJECT | SceneFlags.GEOMETRY);
        }
      });
    }
  };
});