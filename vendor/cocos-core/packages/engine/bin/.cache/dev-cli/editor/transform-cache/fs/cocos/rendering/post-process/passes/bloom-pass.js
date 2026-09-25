System.register("q-bundled:///fs/cocos/rendering/post-process/passes/bloom-pass.js", ["../../../core/index.js", "../../../gfx/index.js", "../../custom/define.js", "../utils/pass-context.js", "./setting-pass.js", "../components/index.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var Vec4, Format, getCameraUniqueID, passContext, getSetting, SettingPass, Bloom, disablePostProcessForDebugView, BloomPass, MAX_BLOOM_FILTER_PASS_NUM, BLOOM_DOWNSAMPLEPASS_INDEX, BLOOM_UPSAMPLEPASS_INDEX, BLOOM_COMBINEPASS_INDEX;
  _export("BloomPass", void 0);
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
    }, function (_componentsIndexJs) {
      Bloom = _componentsIndexJs.Bloom;
    }, function (_basePassJs) {
      disablePostProcessForDebugView = _basePassJs.disablePostProcessForDebugView;
    }],
    execute: function () {
      MAX_BLOOM_FILTER_PASS_NUM = 6;
      BLOOM_DOWNSAMPLEPASS_INDEX = 1;
      BLOOM_UPSAMPLEPASS_INDEX = BLOOM_DOWNSAMPLEPASS_INDEX + MAX_BLOOM_FILTER_PASS_NUM;
      BLOOM_COMBINEPASS_INDEX = BLOOM_UPSAMPLEPASS_INDEX + MAX_BLOOM_FILTER_PASS_NUM;
      _export("BloomPass", BloomPass = class BloomPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'BloomPass';
          this.effectName = 'pipeline/post-process/bloom';
          this.outputNames = ['BloomColor'];
          this._hdrInputName = '';
        }
        get setting() {
          return getSetting(Bloom);
        }
        checkEnable(camera) {
          let enable = super.checkEnable(camera);
          if (disablePostProcessForDebugView()) {
            enable = false;
          }
          return enable;
        }
        set hdrInputName(name) {
          this._hdrInputName = name;
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          const cameraName = `Camera${cameraID}`;
          const passViewport = passContext.passViewport;
          passContext.clearBlack();
          passContext.material = this.material;
          const setting = this.setting;
          const input = this.lastPass.slotName(camera, 0);
          const output = `BLOOM_PREFILTER_COLOR${cameraID}`;
          // prefilter pass
          let shadingScale = 1 / 2;
          const enableAlphaMask = setting.enableAlphaMask;
          const useHDRIntensity = setting.useHdrIlluminance;
          passContext.material.setProperty('texSize', new Vec4(useHDRIntensity, 0, setting.threshold, enableAlphaMask), 0);
          passContext.updatePassViewPort(shadingScale).addRenderPass('bloom-prefilter', `bloom-prefilter${cameraID}`).setPassInput(input, 'outputResultMap').setPassInput(this._hdrInputName, 'hdrInputMap').addRasterView(output, Format.RGBA8).blitScreen(0).version();

          // down sampler pass
          for (let i = 0; i < setting.iterations; ++i) {
            const texSize = new Vec4(passViewport.width, passViewport.height, 0, 0);
            const bloomPassDownSampleRTName = `dsBloomPassDownSampleColor${cameraName}${i}`;
            const downSamplerInput = i === 0 ? output : `dsBloomPassDownSampleColor${cameraName}${i - 1}`;
            passContext.material.setProperty('texSize', texSize, BLOOM_DOWNSAMPLEPASS_INDEX + i);
            shadingScale /= 2;
            passContext.updatePassViewPort(shadingScale).addRenderPass(`bloom-upsample${i}`, `bloom-upsample${i}${cameraID}`).setPassInput(downSamplerInput, 'bloomTexture').addRasterView(bloomPassDownSampleRTName, Format.RGBA8).blitScreen(BLOOM_DOWNSAMPLEPASS_INDEX + i).version();
          }

          // up sampler pass
          for (let i = 0; i < setting.iterations; ++i) {
            const texSize = new Vec4(passViewport.width, passViewport.height, 0, 0);
            const bloomPassUpSampleRTName = `dsBloomPassUpSampleColor${cameraName}${setting.iterations - 1 - i}`;
            const upSamplerInput = i === 0 ? `dsBloomPassDownSampleColor${cameraName}${setting.iterations - 1}` : `dsBloomPassUpSampleColor${cameraName}${setting.iterations - i}`;
            passContext.material.setProperty('texSize', texSize, BLOOM_UPSAMPLEPASS_INDEX + i);
            shadingScale *= 2;
            passContext.updatePassViewPort(shadingScale).addRenderPass(`bloom-downsample${i}`, `bloom-downsample${i}${cameraID}`).setPassInput(upSamplerInput, 'bloomTexture').addRasterView(bloomPassUpSampleRTName, Format.RGBA8).blitScreen(BLOOM_UPSAMPLEPASS_INDEX + i).version();
          }

          // combine Pass
          passContext.material.setProperty('texSize', new Vec4(0, 0, 0, setting.intensity), BLOOM_COMBINEPASS_INDEX);
          passContext.updatePassViewPort().addRenderPass(`bloom-combine`, `bloom-combine${cameraID}`).setPassInput(input, 'outputResultMap').setPassInput(`dsBloomPassUpSampleColor${cameraName}${0}`, 'bloomTexture').addRasterView(this.slotName(camera, 0), Format.RGBA8).blitScreen(BLOOM_COMBINEPASS_INDEX).version();
        }
      });
    }
  };
});