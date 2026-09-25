System.register("q-bundled:///fs/cocos/rendering/post-process/passes/skin-pass.js", ["../../../core/index.js", "../../custom/types.js", "../../custom/define.js", "../utils/pass-context.js", "../../../gfx/index.js", "./setting-pass.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var Vec4, Vec3, cclegacy, warnID, LightInfo, QueueHint, SceneFlags, getCameraUniqueID, passContext, ClearFlagBit, Format, SettingPass, forceEnableFloatOutput, getRTFormatBeforeToneMapping, getShadowMapSampler, SSSSBlurData, SkinPass, COPY_INPUT_DS_PASS_INDEX, SSSS_BLUR_X_PASS_INDEX, SSSS_BLUR_Y_PASS_INDEX, _varianceArray, _strengthParameterArray, _vec3Temp, _vec3Temp2, _vec4Temp, _vec4Temp2, EXPONENT, I_SAMPLES_COUNT;
  function hasSkinObject(ppl) {
    const sceneData = ppl.pipelineSceneData;
    return sceneData.skin.enabled && sceneData.skinMaterialModel !== null;
  }
  _export({
    SSSSBlurData: void 0,
    SkinPass: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      warnID = _coreIndexJs.warnID;
    }, function (_customTypesJs) {
      LightInfo = _customTypesJs.LightInfo;
      QueueHint = _customTypesJs.QueueHint;
      SceneFlags = _customTypesJs.SceneFlags;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_settingPassJs) {
      SettingPass = _settingPassJs.SettingPass;
    }, function (_basePassJs) {
      forceEnableFloatOutput = _basePassJs.forceEnableFloatOutput;
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
      _export("COPY_INPUT_DS_PASS_INDEX", COPY_INPUT_DS_PASS_INDEX = 0);
      _export("SSSS_BLUR_X_PASS_INDEX", SSSS_BLUR_X_PASS_INDEX = 1);
      _export("SSSS_BLUR_Y_PASS_INDEX", SSSS_BLUR_Y_PASS_INDEX = 2);
      _varianceArray = [0.0484, 0.187, 0.567, 1.99, 7.41];
      _strengthParameterArray = [0.100, 0.118, 0.113, 0.358, 0.078];
      _vec3Temp = new Vec3();
      _vec3Temp2 = new Vec3();
      _vec4Temp = new Vec4();
      _vec4Temp2 = new Vec4();
      _export("EXPONENT", EXPONENT = 2.0);
      _export("I_SAMPLES_COUNT", I_SAMPLES_COUNT = 25);
      _export("SSSSBlurData", SSSSBlurData = class SSSSBlurData {
        get ssssStrength() {
          return this._v3SSSSStrength;
        }
        set ssssStrength(val) {
          this._v3SSSSStrength = val;
          this._updateSampleCount();
        }
        get ssssFallOff() {
          return this._v3SSSSFallOff;
        }
        set ssssFallOff(val) {
          this._v3SSSSFallOff = val;
          this._updateSampleCount();
        }
        get kernel() {
          return this._kernel;
        }
        /**
         * We use a falloff to modulate the shape of the profile. Big falloffs
         * spreads the shape making it wider, while small falloffs make it
         * narrower.
         */
        _gaussian(out, variance, r) {
          const xx = r / (0.001 + this._v3SSSSFallOff.x);
          out.x = Math.exp(-(xx * xx) / (2.0 * variance)) / (2.0 * 3.14 * variance);
          const yy = r / (0.001 + this._v3SSSSFallOff.y);
          out.y = Math.exp(-(yy * yy) / (2.0 * variance)) / (2.0 * 3.14 * variance);
          const zz = r / (0.001 + this._v3SSSSFallOff.z);
          out.z = Math.exp(-(zz * zz) / (2.0 * variance)) / (2.0 * 3.14 * variance);
        }

        /**
         * We used the red channel of the original skin profile defined in
         * [d'Eon07] for all three channels. We noticed it can be used for green
         * and blue channels (scaled using the falloff parameter) without
         * introducing noticeable differences and allowing for total control over
         * the profile. For example, it allows to create blue SSS gradients, which
         * could be useful in case of rendering blue creatures.
         */
        _profile(out, val) {
          for (let i = 0; i < 5; i++) {
            this._gaussian(_vec3Temp2, _varianceArray[i], val);
            _vec3Temp2.multiplyScalar(_strengthParameterArray[i]);
            out.add(_vec3Temp2);
          }
        }
        _updateSampleCount() {
          const strength = this._v3SSSSStrength;
          const nSamples = I_SAMPLES_COUNT;
          const range = nSamples > 20 ? 3.0 : 2.0;

          // Calculate the offsets:
          const step = 2.0 * range / (nSamples - 1);
          for (let i = 0; i < nSamples; i++) {
            const o = -range + i * step;
            const sign = o < 0.0 ? -1.0 : 1.0;
            // eslint-disable-next-line no-restricted-properties
            this._kernel[i].w = range * sign * Math.abs(o ** EXPONENT) / range ** EXPONENT;
          }

          // Calculate the weights:
          for (let i = 0; i < nSamples; i++) {
            const w0 = i > 0 ? Math.abs(this._kernel[i].w - this._kernel[i - 1].w) : 0.0;
            const w1 = i < nSamples - 1 ? Math.abs(this._kernel[i].w - this._kernel[i + 1].w) : 0.0;
            const area = (w0 + w1) / 2.0;
            _vec3Temp.set(0);
            this._profile(_vec3Temp, this._kernel[i].w);
            _vec3Temp.multiplyScalar(area);
            this._kernel[i].x = _vec3Temp.x;
            this._kernel[i].y = _vec3Temp.y;
            this._kernel[i].z = _vec3Temp.z;
          }

          // We want the offset 0.0 to come first:
          const remainder = nSamples % 2;
          _vec4Temp.set(this._kernel[(nSamples - remainder) / 2]);
          for (let i = (nSamples - remainder) / 2; i > 0; i--) {
            _vec4Temp2.set(this._kernel[i - 1]);
            this._kernel[i].set(_vec4Temp2);
          }
          this._kernel[0].set(_vec4Temp);

          // Calculate the sum of the weights, we will need to normalize them below:
          _vec3Temp.set(0.0);
          for (let i = 0; i < nSamples; i++) {
            _vec3Temp.add3f(this._kernel[i].x, this._kernel[i].y, this._kernel[i].z);
          }
          // Normalize the weights:
          for (let i = 0; i < nSamples; i++) {
            this._kernel[i].x /= _vec3Temp.x;
            this._kernel[i].y /= _vec3Temp.y;
            this._kernel[i].z /= _vec3Temp.z;
          }

          // Tweak them using the desired strength. The first one is:
          // lerp(1.0, kernel[0].rgb, strength)
          this._kernel[0].x = (1.0 - strength.x) * 1.0 + strength.x * this._kernel[0].x;
          this._kernel[0].y = (1.0 - strength.y) * 1.0 + strength.y * this._kernel[0].y;
          this._kernel[0].z = (1.0 - strength.z) * 1.0 + strength.z * this._kernel[0].z;

          // The others:
          // lerp(0.0, kernel[0].rgb, strength)
          for (let i = 1; i < nSamples; i++) {
            this._kernel[i].x *= strength.x;
            this._kernel[i].y *= strength.y;
            this._kernel[i].z *= strength.z;
          }
        }
        _init() {
          for (let i = 0; i < I_SAMPLES_COUNT; i++) {
            this._kernel[i] = new Vec4();
          }
          this._updateSampleCount();
        }
        constructor() {
          this._v3SSSSStrength = new Vec3(0.48, 0.41, 0.28);
          this._v3SSSSFallOff = new Vec3(1.0, 0.37, 0.3);
          this._kernel = [];
          this._init();
        }
      });
      _export("SkinPass", SkinPass = class SkinPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'SkinPass';
          this.effectName = 'pipeline/ssss-blur';
          this.outputNames = ['SSSSBlur', 'SSSSBlurDS'];
          this.ssssBlurData = new SSSSBlurData();
          this._activate = false;
          this.enableInAllEditorCamera = true;
        }
        checkEnable(camera) {
          const ppl = cclegacy.director.root.pipeline;
          let enable = hasSkinObject(ppl);
          if (enable) {
            if (!this._activate) {
              if (!ppl.getMacroBool('CC_USE_FLOAT_OUTPUT')) {
                warnID(16303);
              }
              if (!ppl.pipelineSceneData.standardSkinModel) {
                warnID(16304);
              }
              this._activate = true;
            }
            enable = forceEnableFloatOutput(ppl);
          }
          return enable;
        }
        render(camera, ppl) {
          var _this$lastPass;
          passContext.material = this.material;
          const inputRT = (_this$lastPass = this.lastPass) == null ? void 0 : _this$lastPass.slotName(camera, 0);
          const inputDS = passContext.depthSlotName;
          this._buildSSSSBlurPass(camera, ppl, inputRT, inputDS);
          this._buildSpecularPass(camera, ppl, inputRT, inputDS);
        }
        _buildSSSSBlurPass(camera, ppl, inputRT, inputDS) {
          const cameraID = getCameraUniqueID(camera);
          const pipelineSceneData = ppl.pipelineSceneData;
          let halfExtents = new Vec3(0.2, 0.2, 0.2);
          const standardSkinModel = pipelineSceneData.standardSkinModel;
          const skinMaterialModel = pipelineSceneData.skinMaterialModel;
          if (standardSkinModel && standardSkinModel.worldBounds) {
            halfExtents = standardSkinModel.worldBounds.halfExtents;
          } else if (skinMaterialModel && skinMaterialModel.worldBounds) {
            halfExtents = skinMaterialModel.worldBounds.halfExtents;
          }
          const boundingBox = Math.min(halfExtents.x, halfExtents.y, halfExtents.z) * 2.0;
          const skin = pipelineSceneData.skin;
          const ssssBlurRTName = super.slotName(camera, 0);
          const ssssBlurDSName = super.slotName(camera, 1);

          // ==== Copy input DS ===
          const copyInputDSPassLayoutName = 'copy-pass';
          const copyInputDSPass = `copyDS-pass${cameraID}`;
          let passIdx = COPY_INPUT_DS_PASS_INDEX;
          passContext.updatePassViewPort().addRenderPass(copyInputDSPassLayoutName, copyInputDSPass).setClearFlag(ClearFlagBit.COLOR).setClearColor(1.0, 0, 0, 0).setPassInput(inputDS, 'depthRaw').addRasterView(ssssBlurDSName, Format.RGBA8).blitScreen(passIdx).version();

          // ==== SSSS Blur X Pass ===
          passIdx = SSSS_BLUR_X_PASS_INDEX;
          const ssssblurXPassLayoutName = 'ssss-blurX';
          const ssssblurXPassPassName = `ssss-blurX${cameraID}`;
          this.material.setProperty('blurInfo', new Vec4(camera.fov, skin.blurRadius, boundingBox, skin.sssIntensity), passIdx);
          this.material.setProperty('kernel', this.ssssBlurData.kernel, passIdx);
          passContext.updatePassViewPort().addRenderPass(ssssblurXPassLayoutName, ssssblurXPassPassName).setPassInput(inputRT, 'colorTex').setPassInput(ssssBlurDSName, 'depthTex').setClearFlag(ClearFlagBit.COLOR).setClearColor(0, 0, 0, 1).addRasterView(ssssBlurRTName, getRTFormatBeforeToneMapping(ppl)).blitScreen(passIdx).version();

          // === SSSS Blur Y Pass ===
          passIdx = SSSS_BLUR_Y_PASS_INDEX;
          const ssssblurYPassLayoutName = 'ssss-blurY';
          const ssssblurYPassPassName = `ssss-blurY${cameraID}`;
          this.material.setProperty('blurInfo', new Vec4(camera.fov, skin.blurRadius, boundingBox, skin.sssIntensity), passIdx);
          this.material.setProperty('kernel', this.ssssBlurData.kernel, passIdx);
          passContext.updatePassViewPort().addRenderPass(ssssblurYPassLayoutName, ssssblurYPassPassName).setPassInput(ssssBlurRTName, 'colorTex').setPassInput(ssssBlurDSName, 'depthTex').setClearFlag(ClearFlagBit.NONE).setClearColor(0, 0, 0, 1).addRasterView(inputRT, getRTFormatBeforeToneMapping(ppl)).blitScreen(passIdx).version();
        }
        _buildSpecularPass(camera, ppl, inputRT, inputDS) {
          const cameraID = getCameraUniqueID(camera);
          const layoutName = 'specular-pass';
          const passName = `specular-pass${cameraID}`;
          passContext.updatePassViewPort().addRenderPass(layoutName, passName).setClearFlag(ClearFlagBit.NONE).setClearColor(0, 0, 0, 1).addRasterView(inputRT, getRTFormatBeforeToneMapping(ppl), true).setClearFlag(ClearFlagBit.NONE).setClearDepthColor(camera.clearDepth, camera.clearStencil, 0, 1).addRasterView(inputDS, Format.DEPTH_STENCIL, true).version();
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
          pass.addQueue(QueueHint.RENDER_OPAQUE, 'default').addSceneOfCamera(camera, new LightInfo(), SceneFlags.TRANSPARENT_OBJECT | SceneFlags.CUTOUT_OBJECT);
          pass.addQueue(QueueHint.RENDER_TRANSPARENT, 'forward-add').addSceneOfCamera(camera, new LightInfo(), SceneFlags.TRANSPARENT_OBJECT | SceneFlags.CUTOUT_OBJECT);
        }
        slotName(camera, index = 0) {
          return this.lastPass.slotName(camera, index);
        }
      });
    }
  };
});