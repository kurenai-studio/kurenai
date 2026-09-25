System.register("q-bundled:///fs/cocos/rendering/post-process/passes/dof-pass.js", ["../../../gfx/index.js", "../../custom/define.js", "../utils/pass-context.js", "./setting-pass.js", "./base-pass.js", "../../../core/index.js", "../components/dof.js"], function (_export, _context) {
  "use strict";

  var ClearFlagBit, Format, getCameraUniqueID, passContext, getSetting, SettingPass, disablePostProcessForDebugView, Vec4, DOF, DofPass;
  _export("DofPass", void 0);
  return {
    setters: [function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }, function (_basePassJs) {
      disablePostProcessForDebugView = _basePassJs.disablePostProcessForDebugView;
    }, function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
    }, function (_componentsDofJs) {
      DOF = _componentsDofJs.DOF;
    }],
    execute: function () {
      _export("DofPass", DofPass = class DofPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'DOFPass';
          this.effectName = 'pipeline/post-process/dof';
          this.outputNames = ['DOFColor'];
        }
        get setting() {
          return getSetting(DOF);
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
          const passViewport = passContext.passViewport;
          passContext.material = this.material;
          const setting = this.setting;
          const width = passViewport.width;
          const height = passViewport.height;
          const cocParams = new Vec4(setting.focusDistance, setting.focusRange, setting.bokehRadius, 0.0);
          const mainTexTexelSize = new Vec4(1.0 / width, 1.0 / height, width, height);
          this.material.setProperty('cocParams', cocParams);
          this.material.setProperty('mainTexTexelSize', mainTexTexelSize);
          const slot = this.slotName(camera, 0);
          const colorTex = this.lastPass.slotName(camera, 0);
          const depthTex = this.lastPass.slotName(camera, 1);

          // compute CoC
          const outputCOC = `DOF_CIRCLE_OF_CONFUSION${cameraID}`;
          passContext.updatePassViewPort().addRenderPass('dof-coc', `dof-coc${cameraID}`).setPassInput(depthTex, 'DepthTex').addRasterView(outputCOC, Format.RGBA8).blitScreen(0).version();

          // downscale
          const outputPrefilter = `DOF_PREFILTER${cameraID}`;
          passContext.updatePassViewPort(0.5).addRenderPass('dof-prefilter', `dof-prefilter${cameraID}`).setPassInput(colorTex, 'colorTex').setPassInput(outputCOC, 'cocTex').addRasterView(outputPrefilter, Format.RGBA8).blitScreen(1).version();

          // bokeh blur
          const outputBokeh = `DOF_BOKEH${cameraID}`;
          passContext.updatePassViewPort(0.5).addRenderPass('dof-bokeh', `dof-bokeh${cameraID}`).setPassInput(outputPrefilter, 'prefilterTex').addRasterView(outputBokeh, Format.RGBA8).blitScreen(2).version();

          //filtering
          const outputFilter = `DOF_FILTER${cameraID}`;
          passContext.updatePassViewPort(0.5).addRenderPass('dof-filter', `dof-filter${cameraID}`).setPassInput(outputBokeh, 'bokehTex').addRasterView(outputFilter, Format.RGBA8).blitScreen(3).version();

          //combine
          passContext.updatePassViewPort().addRenderPass('dof-combine', `dof-combine${cameraID}`).setPassInput(outputFilter, 'filterTex').setPassInput(outputCOC, 'cocTex').setPassInput(colorTex, 'colorTex').addRasterView(slot, Format.RGBA8).blitScreen(4).version();
        }
      });
    }
  };
});