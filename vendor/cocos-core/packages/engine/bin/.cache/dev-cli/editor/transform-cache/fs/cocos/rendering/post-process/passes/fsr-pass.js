System.register("q-bundled:///fs/cocos/rendering/post-process/passes/fsr-pass.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../../gfx/index.js", "../../../render-scene/scene/index.js", "../../custom/define.js", "../utils/pass-context.js", "../components/fsr.js", "./setting-pass.js"], function (_export, _context) {
  "use strict";

  var EDITOR, clamp, Vec4, Format, CameraUsage, getCameraUniqueID, passContext, FSR, getSetting, SettingPass, FSRPass, tempVec4;
  _export("FSRPass", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreIndexJs) {
      clamp = _coreIndexJs.clamp;
      Vec4 = _coreIndexJs.Vec4;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
    }, function (_renderSceneSceneIndexJs) {
      CameraUsage = _renderSceneSceneIndexJs.CameraUsage;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_componentsFsrJs) {
      FSR = _componentsFsrJs.FSR;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }],
    execute: function () {
      tempVec4 = new Vec4();
      _export("FSRPass", FSRPass = class FSRPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'FSRPass';
          this.effectName = 'pipeline/post-process/fsr';
          this.outputNames = ['FSRColor'];
        }
        get setting() {
          return getSetting(FSR);
        }
        checkEnable(camera) {
          let enable = super.checkEnable(camera);
          if (EDITOR && camera.cameraUsage === CameraUsage.PREVIEW) {
            enable = false;
          }
          return enable;
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          passContext.material = this.material;
          passContext.clearBlack();
          passContext.updatePassViewPort(1 / passContext.shadingScale, 0);
          const inputWidth = Math.floor(passContext.passViewport.width * passContext.shadingScale);
          const inputHeight = Math.floor(passContext.passViewport.height * passContext.shadingScale);
          const outWidth = Math.floor(passContext.passViewport.width);
          const outHeight = Math.floor(passContext.passViewport.height);
          const setting = this.setting;
          this.material.setProperty('fsrParams', tempVec4.set(clamp(1.0 - setting.sharpness, 0.02, 0.98), 0, 0, 0));
          this.material.setProperty('texSize', tempVec4.set(inputWidth, inputHeight, outWidth, outHeight));
          const input0 = this.lastPass.slotName(camera, 0);
          const easu = `FSR_EASU${cameraID}`;
          passContext.addRenderPass('post-process', `CameraFSR_EASU_Pass${cameraID}`).setPassInput(input0, 'outputResultMap').addRasterView(easu, Format.RGBA8).blitScreen(0).version();
          const slot0 = this.slotName(camera, 0);
          passContext.addRenderPass('post-process', `CameraFSR_RCAS_Pass${cameraID}`).setPassInput(easu, 'outputResultMap').addRasterView(slot0, Format.RGBA8).blitScreen(1).version();
        }
      });
    }
  };
});