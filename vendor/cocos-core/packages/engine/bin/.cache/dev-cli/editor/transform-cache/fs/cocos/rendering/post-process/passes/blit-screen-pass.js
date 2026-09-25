System.register("q-bundled:///fs/cocos/rendering/post-process/passes/blit-screen-pass.js", ["../../../gfx/index.js", "../../custom/define.js", "../utils/pass-context.js", "./setting-pass.js", "../components/blit-screen.js"], function (_export, _context) {
  "use strict";

  var Format, getCameraUniqueID, passContext, getSetting, SettingPass, BlitScreen, BlitScreenPass, outputNames;
  _export("BlitScreenPass", void 0);
  return {
    setters: [function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }, function (_componentsBlitScreenJs) {
      BlitScreen = _componentsBlitScreenJs.BlitScreen;
    }],
    execute: function () {
      outputNames = ['BlitScreenColor0', 'BlitScreenColor1'];
      _export("BlitScreenPass", BlitScreenPass = class BlitScreenPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'BlitScreenPass';
          this.effectName = 'pipeline/post-process/blit-screen';
          this.outputName = outputNames[0];
        }
        get setting() {
          return getSetting(BlitScreen);
        }
        slotName(camera, index = 0) {
          return this.outputName;
        }
        checkEnable(camera) {
          const enable = super.checkEnable(camera);
          const setting = this.setting;
          return enable && setting.activeMaterials.length > 0;
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          passContext.clearBlack();
          let input0 = this.lastPass.slotName(camera, 0);
          let slotIdx = 0;
          const materials = this.setting.activeMaterials;
          for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            passContext.material = material;
            const slotName = `${outputNames[slotIdx]}${cameraID}`;
            slotIdx = ++slotIdx % 2;
            passContext.updatePassViewPort().addRenderPass('post-process', `${this.name}${cameraID}${slotIdx}`).setPassInput(input0, 'inputTexture').addRasterView(slotName, Format.RGBA8).blitScreen(0).version();
            input0 = slotName;
          }
          this.outputName = input0;
        }
      });
    }
  };
});