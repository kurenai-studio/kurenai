System.register("q-bundled:///fs/cocos/rendering/post-process/passes/fxaa-pass.js", ["../../../core/index.js", "../../../gfx/index.js", "../../custom/define.js", "../utils/pass-context.js", "./setting-pass.js", "../components/fxaa.js"], function (_export, _context) {
  "use strict";

  var Vec4, Format, getCameraUniqueID, passContext, getSetting, SettingPass, FXAA, FxaaPass;
  _export("FxaaPass", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }, function (_componentsFxaaJs) {
      FXAA = _componentsFxaaJs.FXAA;
    }],
    execute: function () {
      _export("FxaaPass", FxaaPass = class FxaaPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'FxaaPass';
          this.effectName = 'pipeline/post-process/fxaa-hq';
          this.outputNames = ['FxaaColor'];
        }
        get setting() {
          return getSetting(FXAA);
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          passContext.clearBlack();
          passContext.material = this.material;
          const setting = this.setting;
          const input = this.lastPass.slotName(camera, 0);
          const output = this.slotName(camera);
          passContext.updatePassViewPort();
          const width = passContext.passViewport.width;
          const height = passContext.passViewport.height;
          passContext.material.setProperty('texSize', new Vec4(width, height, 1.0 / width, 1.0 / height), 0);
          passContext.addRenderPass('fxaa', `fxaa${cameraID}`).setPassInput(input, 'sceneColorMap').addRasterView(output, Format.RGBA8).blitScreen(0).version();
        }
      });
    }
  };
});