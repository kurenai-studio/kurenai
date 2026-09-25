System.register("q-bundled:///fs/cocos/rendering/post-process/passes/taa-pass.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../../game/index.js", "../../../gfx/index.js", "../../../render-scene/scene/index.js", "../../custom/types.js", "../../custom/define.js", "../components/taa.js", "../components/taa-mask.js", "../utils/pass-context.js", "./base-pass.js", "./setting-pass.js", "../../../asset/asset-manager/index.js", "../../../render-scene/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, Mat4, Vec2, Vec4, game, ClearFlagBit, Format, CameraUsage, ResourceResidency, getCameraUniqueID, TAA, TAAMask, passContext, disablePostProcessForDebugView, getSetting, SettingPass, builtinResMgr, MaterialInstance, TAAPass, tempVec4, halton8, SampleOffsets;
  _export("TAAPass", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      Vec2 = _coreIndexJs.Vec2;
      Vec4 = _coreIndexJs.Vec4;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_renderSceneSceneIndexJs) {
      CameraUsage = _renderSceneSceneIndexJs.CameraUsage;
    }, function (_customTypesJs) {
      ResourceResidency = _customTypesJs.ResourceResidency;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_componentsTaaJs) {
      TAA = _componentsTaaJs.TAA;
    }, function (_componentsTaaMaskJs) {
      TAAMask = _componentsTaaMaskJs.TAAMask;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_basePassJs) {
      disablePostProcessForDebugView = _basePassJs.disablePostProcessForDebugView;
    }, function (_settingPassJs) {
      getSetting = _settingPassJs.getSetting;
      SettingPass = _settingPassJs.SettingPass;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_renderSceneIndexJs) {
      MaterialInstance = _renderSceneIndexJs.MaterialInstance;
    }],
    execute: function () {
      tempVec4 = new Vec4();
      halton8 = [new Vec2(0.5, 1.0 / 3), new Vec2(0.25, 2.0 / 3), new Vec2(0.75, 1.0 / 9), new Vec2(0.125, 4.0 / 9), new Vec2(0.625, 7.0 / 9), new Vec2(0.375, 2.0 / 9), new Vec2(0.875, 5.0 / 9), new Vec2(0.0625, 8.0 / 9)];
      halton8.forEach(v => {
        v.x -= 0.5;
        v.y -= 0.5;
      });
      SampleOffsets = {
        // 2xMSAA
        // Pattern docs: http://msdn.microsoft.com/en-us/library/windows/desktop/ff476218(v=vs.85).aspx
        //   N.
        //   .S
        x2: [new Vec2(-4.0 / 16.0, -4.0 / 16.0), new Vec2(4.0 / 16.0, 4.0 / 16.0)],
        // 3xMSAA
        //   A..
        //   ..B
        //   .C.
        // Rolling circle pattern (A,B,C).
        x3: [new Vec2(-2.0 / 3.0, -2.0 / 3.0), new Vec2(2 / 3, 0 / 3), new Vec2(0 / 3, 2 / 3)],
        // 4xMSAA
        // Pattern docs: http://msdn.microsoft.com/en-us/library/windows/desktop/ff476218(v=vs.85).aspx
        //   .N..
        //   ...E
        //   W...
        //   ..S.
        // Rolling circle pattern (N,E,S,W).
        x4: [new Vec2(-2 / 16, -6 / 16), new Vec2(6 / 16, -2 / 16), new Vec2(2 / 16, 6 / 16), new Vec2(-6 / 16, 2 / 16)],
        x5: [
        // Compressed 4 sample pattern on same vertical and horizontal line (less temporal flicker).
        // Compressed 1/2 works better than correct 2/3 (reduced temporal flicker).
        //   . N .
        //   W . E
        //   . S .
        // Rolling circle pattern (N,E,S,W).
        new Vec2(0, -1 / 2), new Vec2(1 / 2, 0), new Vec2(0, 1 / 2), new Vec2(-1 / 2, 0)],
        halton8
      };
      _export("TAAPass", TAAPass = class TAAPass extends SettingPass {
        constructor(...args) {
          super(...args);
          this.name = 'TAAPass';
          this.effectName = 'pipeline/post-process/taa';
          this.outputNames = ['TAA_First', 'TAA_Second'];
          this.prevMatViewProj = new Mat4();
          this.taaTextureIndex = -2;
          this.samples = SampleOffsets.halton8;
          this.sampleIndex = -1;
          this.sampleOffset = new Vec2();
          this.forceRender = true;
          this.dirty = false;
          this.taaMaskMaterial = void 0;
          this.firstRender = true;
        }
        get setting() {
          return getSetting(TAA);
        }
        checkEnable(camera) {
          let enable = super.checkEnable(camera);
          if (EDITOR && camera.cameraUsage === CameraUsage.PREVIEW) {
            enable = false;
          }
          if (disablePostProcessForDebugView()) {
            enable = false;
          }
          return enable;
        }
        slotName(camera, index = 0) {
          if (!this.checkEnable(camera)) {
            return this.lastPass.slotName(camera, index);
          }
          if (this.taaTextureIndex < 0) {
            return super.slotName(camera, 0);
          }
          return super.slotName(camera, (this.taaTextureIndex + 1) % 2);
        }
        applyCameraJitter(camera) {
          camera._isProjDirty = true;
          camera.update(true);
          camera.matProj.m12 += this.sampleOffset.x;
          camera.matProj.m13 += this.sampleOffset.y;
          Mat4.invert(camera.matProjInv, camera.matProj);
          Mat4.multiply(camera.matViewProj, camera.matProj, camera.matView);
          Mat4.invert(camera.matViewProjInv, camera.matViewProj);
          camera.frustum.update(camera.matViewProj, camera.matViewProjInv);
        }
        updateSample() {
          if (this.dirty || this.forceRender) {
            this.sampleIndex++;
            this.taaTextureIndex++;
            this.dirty = false;
          }
          let offset = this.samples[this.sampleIndex % this.samples.length];
          if (this.sampleIndex === -1) {
            offset = Vec2.ZERO;
          }
          const setting = this.setting;
          this.sampleOffset.x = offset.x * setting.sampleScale / game.canvas.width;
          this.sampleOffset.y = offset.y * setting.sampleScale / game.canvas.height;
        }
        render(camera, ppl) {
          const cameraID = getCameraUniqueID(camera);
          passContext.clearFlag = ClearFlagBit.COLOR;
          Vec4.set(passContext.clearColor, 0, 0, 0, 1);
          const firstRender = this.firstRender;
          if (firstRender) {
            this.prevMatViewProj.set(camera.matViewProj);
            this.firstRender = false;
          }
          const setting = this.setting;
          passContext.updatePassViewPort();
          const width = passContext.passViewport.width;
          const height = passContext.passViewport.height;
          let material = this.material;
          const taaMask = camera.node.getComponent(TAAMask);
          let maskTex;
          if (taaMask && taaMask.enabledInHierarchy) {
            maskTex = taaMask.mask;
          }
          if (maskTex) {
            if (!this.taaMaskMaterial) {
              const mi = new MaterialInstance({
                parent: material
              });
              mi.recompileShaders({
                USE_TAA_MASK: !EDITOR
              });
              this.taaMaskMaterial = mi;
            }
            material = this.taaMaskMaterial;
            material.setProperty('motionMaskTex', maskTex);
          } else {
            const black = builtinResMgr.get('black-texture');
            maskTex = black;
            material.setProperty('motionMaskTex', maskTex);
          }
          material.setProperty('taaParams1', tempVec4.set(this.sampleOffset.x, this.sampleOffset.y, setting.feedback, 0));
          material.setProperty('taaTextureSize', tempVec4.set(1 / width, 1 / height, 1 / width, 1 / height));
          material.setProperty('taaPrevViewProj', this.prevMatViewProj);
          this.prevMatViewProj.set(camera.matViewProj);
          passContext.material = material;

          // input output
          const input0 = this.lastPass.slotName(camera, 0);
          let historyTexture = super.slotName(camera, this.taaTextureIndex % 2);
          if (firstRender) {
            historyTexture = input0;
          }
          const slot0 = this.slotName(camera, 0);
          const depthTex = passContext.depthSlotName;
          const layoutName = `DeferredTAA${this.taaTextureIndex < 0 ? -1 : this.taaTextureIndex % 2}`;
          passContext.addRenderPass(layoutName, `CameraTAAPass${cameraID}`).setPassInput(input0, 'inputTexture').setPassInput(depthTex, 'depthTex').setPassInput(historyTexture, 'taaPrevTexture').addRasterView(slot0, Format.RGBA16F, true, ResourceResidency.PERSISTENT).blitScreen(0).version();
        }
      });
    }
  };
});