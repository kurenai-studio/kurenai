System.register("q-bundled:///fs/cocos/rendering/post-process/passes/forward-pass.js", ["../../../core/index.js", "../../../gfx/index.js", "../../../render-scene/scene/index.js", "../../custom/types.js", "../../custom/define.js", "../utils/pass-context.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var Vec4, ClearFlagBit, Format, ShadowType, SkyBoxFlagValue, LightInfo, QueueHint, SceneFlags, getCameraUniqueID, passContext, BasePass, getRTFormatBeforeToneMapping, getShadowMapSampler, ForwardPass;
  _export("ForwardPass", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Format = _gfxIndexJs.Format;
    }, function (_renderSceneSceneIndexJs) {
      ShadowType = _renderSceneSceneIndexJs.ShadowType;
      SkyBoxFlagValue = _renderSceneSceneIndexJs.SkyBoxFlagValue;
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
      _export("ForwardPass", ForwardPass = class ForwardPass extends BasePass {
        constructor(...args) {
          super(...args);
          this.name = 'ForwardPass';
          this.outputNames = ['ForwardColor', 'ForwardDS'];
          this.enableInAllEditorCamera = true;
          this.depthBufferShadingScale = 1;
        }
        calcDepthSlot(camera) {
          const depthSlotName = !!passContext.depthSlotName;
          let canUsePrevDepth = !(camera.clearFlag & ClearFlagBit.DEPTH_STENCIL);
          canUsePrevDepth = canUsePrevDepth && passContext.shadingScale === this.depthBufferShadingScale;
          if (canUsePrevDepth) {
            if (!depthSlotName) passContext.depthSlotName = super.slotName(camera, 1);
            return;
          }
          this.depthBufferShadingScale = passContext.shadingScale;
          passContext.depthSlotName = super.slotName(camera, 1);
        }
        slotName(camera, index = 0) {
          if (index === 1) {
            return passContext.depthSlotName;
          }
          return super.slotName(camera, index);
        }
        render(camera, ppl) {
          var _camera$scene;
          passContext.clearFlag = ClearFlagBit.COLOR | camera.clearFlag & ClearFlagBit.DEPTH_STENCIL | camera.clearFlag & SkyBoxFlagValue.VALUE;
          Vec4.set(passContext.clearColor, 0, 0, 0, 0);
          Vec4.set(passContext.clearDepthColor, camera.clearDepth, camera.clearStencil, 0, 0);
          this.calcDepthSlot(camera);
          const slot0 = this.slotName(camera, 0);
          const slot1 = this.slotName(camera, 1);
          const cameraID = getCameraUniqueID(camera);
          const isOffScreen = true;
          passContext.updatePassViewPort().addRenderPass('default', `${this.name}_${cameraID}`).addRasterView(slot0, getRTFormatBeforeToneMapping(ppl), isOffScreen).addRasterView(slot1, Format.DEPTH_STENCIL, isOffScreen).version();
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
          const forwardQueue = pass.addQueue(QueueHint.RENDER_OPAQUE);
          forwardQueue.addSceneOfCamera(camera, new LightInfo(), SceneFlags.OPAQUE_OBJECT | SceneFlags.CUTOUT_OBJECT | SceneFlags.GEOMETRY);
          const forwardAddQueue = pass.addQueue(QueueHint.RENDER_TRANSPARENT, 'forward-add');
          passContext.addSceneLights(forwardAddQueue, camera);
          const shadowInfo = ppl.pipelineSceneData.shadows;
          if ((_camera$scene = camera.scene) != null && _camera$scene.mainLight && shadowInfo.enabled && shadowInfo.type === ShadowType.Planar) {
            var _camera$scene2;
            pass.addQueue(QueueHint.RENDER_TRANSPARENT, 'planar-shadow').addSceneOfCamera(camera, new LightInfo((_camera$scene2 = camera.scene) == null ? void 0 : _camera$scene2.mainLight), SceneFlags.TRANSPARENT_OBJECT | SceneFlags.SHADOW_CASTER | SceneFlags.GEOMETRY);
          }
          passContext.forwardPass = this;
        }
      });
    }
  };
});