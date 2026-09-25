System.register("q-bundled:///fs/cocos/rendering/post-process/passes/shadow-pass.js", ["../../custom/define.js", "../utils/pass-context.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var buildShadowPasses, getCameraUniqueID, passContext, BasePass, ShadowPass;
  _export("ShadowPass", void 0);
  return {
    setters: [function (_customDefineJs) {
      buildShadowPasses = _customDefineJs.buildShadowPasses;
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_basePassJs) {
      BasePass = _basePassJs.BasePass;
    }],
    execute: function () {
      _export("ShadowPass", ShadowPass = class ShadowPass extends BasePass {
        constructor(...args) {
          super(...args);
          this.name = 'ShadowPass';
          this.mainLightShadows = [];
          this.spotLightShadows = [];
        }
        render(camera, ppl) {
          passContext.shadowPass = this;
          const cameraID = getCameraUniqueID(camera);
          const cameraName = `Camera${cameraID}`;
          const shadowInfo = buildShadowPasses(cameraName, camera, ppl);
          this.mainLightShadows = shadowInfo.mainLightShadowNames;
          this.spotLightShadows = shadowInfo.spotLightShadowNames;
        }
      });
    }
  };
});