System.register("q-bundled:///fs/cocos/rendering/post-process/passes/color-grading-pass.js", ["../../../core/index.js", "../../../gfx/index.js", "../../custom/define.js", "../utils/pass-context.js", "./setting-pass.js", "../components/index.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var Vec2, Vec4, ClearFlagBit, Format, getCameraUniqueID, passContext, getSetting, SettingPass, ColorGrading, disablePostProcessForDebugView, ColorGradingPass;
  _export("ColorGradingPass", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      Vec4 = _coreIndexJs.Vec4;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }, function (_componentsIndexJs) {
      ColorGrading = _componentsIndexJs.ColorGrading;
    }, function (_basePassJs) {
      disablePostProcessForDebugView = _basePassJs.disablePostProcessForDebugView;
    }],
    execute: function () {
      _export("ColorGradingPass", ColorGradingPass = class ColorGradingPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'ColorGradingPass';
          this.effectName = 'pipeline/post-process/color-grading';
          this.outputNames = ['ColorGrading'];
        }
        get setting() {
          return getSetting(ColorGrading);
        }
        checkEnable(camera) {
          let enable = super.checkEnable(camera);
          if (disablePostProcessForDebugView()) {
            enable = false;
          }
          return enable;
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          passContext.clearFlag = ClearFlagBit.COLOR;
          Vec4.set(passContext.clearColor, 0, 0, 0, 1);
          passContext.material = this.material;
          const setting = this.setting;
          this.material.setProperty('colorGradingMap', setting.colorGradingMap);
          this.material.setProperty('contribute', setting.contribute);
          const textureSize = setting.colorGradingMap ? new Vec2(setting.colorGradingMap.width, setting.colorGradingMap.height) : new Vec2(1.0, 1.0);
          this.material.setProperty('lutTextureSize', textureSize);
          const input = this.lastPass.slotName(camera, 0);
          const slot = this.slotName(camera, 0);
          const isSquareMap = setting.colorGradingMap && setting.colorGradingMap.width === setting.colorGradingMap.height;
          const passName = isSquareMap ? 'color-grading-8x8' : 'color-grading-nx1';
          const passIndx = isSquareMap ? 1 : 0;
          passContext.updatePassViewPort().addRenderPass(passName, `color-grading${cameraID}`).setPassInput(input, 'sceneColorMap').addRasterView(slot, Format.RGBA8).blitScreen(passIndx).version();
        }
      });
    }
  };
});