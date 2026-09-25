System.register("q-bundled:///fs/cocos/rendering/custom/web-pipeline-types.js", ["../../core/index.js", "../../gfx/index.js", "../../render-scene/scene/index.js", "../define.js", "../instanced-buffer.js", "../pipeline-state-manager.js", "./types.js", "../../asset/asset-manager/index.js"], function (_export, _context) {
  "use strict";

  var Mat4, RecyclePool, CoreColor, cclegacy, Quat, Vec4, Vec2, Vec3, toRadian, Color, deviceManager, Camera, CSMLevel, LightType, PCFType, ShadowType, SetIndex, supportsR32FloatTexture, InstancedBuffer, instancingCompareFn, PipelineStateManager, SceneFlags, UpdateFrequency, builtinResMgr, DrawInstance, ProbeHelperQueue, WebSetter, RenderDrawQueue, RenderInstancingQueue, RenderQueueQuery, RenderQueue, _uboVec, _uboVec3, _uboCol, _matView, _mulMatView, instancePool, CC_USE_RGBE_OUTPUT;
  function setTextureUBOView(setter, cfg, layout = 'default') {
    const skybox = cfg.skybox;
    const director = cclegacy.director;
    const root = director.root;
    const pipeline = root.pipeline;
    if (skybox.reflectionMap) {
      const texture = skybox.reflectionMap.getGFXTexture();
      const sampler = root.device.getSampler(skybox.reflectionMap.getSamplerInfo());
      setter.setTexture('cc_environment', texture);
      setter.setSampler('cc_environment', sampler);
    } else {
      const envmap = skybox.envmap ? skybox.envmap : builtinResMgr.get('default-cube-texture');
      if (envmap) {
        const texture = envmap.getGFXTexture();
        const sampler = root.device.getSampler(envmap.getSamplerInfo());
        setter.setTexture('cc_environment', texture);
        setter.setSampler('cc_environment', sampler);
      }
    }
    const diffuseMap = skybox.diffuseMap ? skybox.diffuseMap : builtinResMgr.get('default-cube-texture');
    if (diffuseMap) {
      const texture = diffuseMap.getGFXTexture();
      const sampler = root.device.getSampler(diffuseMap.getSamplerInfo());
      setter.setTexture('cc_diffuseMap', texture);
      setter.setSampler('cc_diffuseMap', sampler);
    }
    if (!setter.hasSampler('cc_shadowMap')) {
      setter.setSampler('cc_shadowMap', pipeline.defaultSampler);
    }
    if (!setter.hasTexture('cc_shadowMap')) {
      setter.setTexture('cc_shadowMap', pipeline.defaultShadowTexture);
    }
    if (!setter.hasSampler('cc_spotShadowMap')) {
      setter.setSampler('cc_spotShadowMap', pipeline.defaultSampler);
    }
    if (!setter.hasTexture('cc_spotShadowMap')) {
      setter.setTexture('cc_spotShadowMap', pipeline.defaultShadowTexture);
    }
  }
  function setCameraUBOValues(setter, camera, cfg, scene, layoutName = 'default') {
    var _skybox$envmap;
    const director = cclegacy.director;
    const root = director.root;
    const pipeline = root.pipeline;
    const shadowInfo = cfg.shadows;
    const skybox = cfg.skybox;
    const shadingScale = cfg.shadingScale;
    // Camera
    if (camera) {
      setter.setMat4('cc_matView', camera.matView);
      setter.setMat4('cc_matViewInv', camera.node.worldMatrix);
      setter.setMat4('cc_matProj', camera.matProj);
      setter.setMat4('cc_matProjInv', camera.matProjInv);
      setter.setMat4('cc_matViewProj', camera.matViewProj);
      setter.setMat4('cc_matViewProjInv', camera.matViewProjInv);
      _uboVec.set(camera.surfaceTransform, camera.cameraUsage, Math.cos(toRadian(skybox.getRotationAngle())), Math.sin(toRadian(skybox.getRotationAngle())));
      setter.setVec4('cc_surfaceTransform', _uboVec);
      _uboVec.set(camera.exposure, 1.0 / camera.exposure, cfg.isHDR ? 1.0 : 0.0, 1.0 / Camera.standardExposureValue);
      setter.setVec4('cc_exposure', _uboVec);
    }
    if (camera) {
      _uboVec.set(camera.position.x, camera.position.y, camera.position.z, pipeline.getCombineSignY());
    } else {
      _uboVec.set(0, 0, 0, pipeline.getCombineSignY());
    }
    setter.setVec4('cc_cameraPos', _uboVec);
    _uboVec.set(cfg.shadingScale, cfg.shadingScale, 1.0 / cfg.shadingScale, 1.0 / cfg.shadingScale);
    setter.setVec4('cc_screenScale', _uboVec);
    const mainLight = scene && scene.mainLight;
    if (mainLight) {
      const shadowEnable = mainLight.shadowEnabled && shadowInfo.type === ShadowType.ShadowMap ? 1.0 : 0.0;
      _uboVec.set(mainLight.direction.x, mainLight.direction.y, mainLight.direction.z, shadowEnable);
      setter.setVec4('cc_mainLitDir', _uboVec);
      let r = mainLight.color.x;
      let g = mainLight.color.y;
      let b = mainLight.color.z;
      if (mainLight.useColorTemperature) {
        r *= mainLight.colorTemperatureRGB.x;
        g *= mainLight.colorTemperatureRGB.y;
        b *= mainLight.colorTemperatureRGB.z;
      }
      let w = mainLight.illuminance;
      if (cfg.isHDR && camera) {
        w *= camera.exposure;
      }
      _uboVec.set(r, g, b, w);
      setter.setVec4('cc_mainLitColor', _uboVec);
    } else {
      _uboVec.set(0, 0, 1, 0);
      setter.setVec4('cc_mainLitDir', _uboVec);
      _uboVec.set(0, 0, 0, 0);
      setter.setVec4('cc_mainLitColor', _uboVec);
    }
    const ambient = cfg.ambient;
    const skyColor = ambient.skyColor;
    if (cfg.isHDR) {
      skyColor.w = ambient.skyIllum * (camera ? camera.exposure : 1);
    } else {
      skyColor.w = ambient.skyIllum;
    }
    _uboVec.set(skyColor.x, skyColor.y, skyColor.z, skyColor.w);
    setter.setVec4('cc_ambientSky', _uboVec);
    _uboVec.set(ambient.groundAlbedo.x, ambient.groundAlbedo.y, ambient.groundAlbedo.z, skybox.envmap ? (_skybox$envmap = skybox.envmap) == null ? void 0 : _skybox$envmap.mipmapLevel : 1.0);
    setter.setVec4('cc_ambientGround', _uboVec);
    const fog = cfg.fog;
    const colorTempRGB = fog.colorArray;
    _uboVec.set(colorTempRGB.x, colorTempRGB.y, colorTempRGB.z, colorTempRGB.z);
    setter.setVec4('cc_fogColor', _uboVec);
    _uboVec.set(fog.fogStart, fog.fogEnd, fog.fogDensity, 0.0);
    setter.setVec4('cc_fogBase', _uboVec);
    _uboVec.set(fog.fogTop, fog.fogRange, fog.fogAtten, 0.0);
    setter.setVec4('cc_fogAdd', _uboVec);
    if (camera) {
      _uboVec.set(camera.nearClip, camera.farClip, camera.getClipSpaceMinz(), 0.0);
      setter.setVec4('cc_nearFar', _uboVec);
      _uboVec.set(camera.viewport.x, camera.viewport.y, shadingScale * camera.window.width * camera.viewport.z, shadingScale * camera.window.height * camera.viewport.w);
      setter.setVec4('cc_viewPort', _uboVec);
    }
  }
  function getLayoutId(passLayout, phaseLayout) {
    const r = cclegacy.rendering;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return r.getPhaseID(r.getPassID(passLayout), phaseLayout);
  }
  function getPassIndexFromLayout(subModel, phaseLayoutId) {
    const passes = subModel.passes;
    for (let k = 0; k < passes.length; k++) {
      if (passes[k].phaseID === phaseLayoutId) {
        return k;
      }
    }
    return -1;
  }
  function setShadowUBOLightView(setter, camera, light, csmLevel, layout = 'default') {
    const director = cclegacy.director;
    const pipeline = director.root.pipeline;
    const device = pipeline.device;
    const sceneData = pipeline.pipelineSceneData;
    const shadowInfo = sceneData.shadows;
    if (shadowInfo.type === ShadowType.Planar) {
      return;
    }
    const csmLayers = sceneData.csmLayers;
    const packing = supportsR32FloatTexture(device) ? 0.0 : 1.0;
    const cap = pipeline.device.capabilities;
    // ShadowMap
    if (shadowInfo.enabled) {
      if (shadowInfo.type === ShadowType.ShadowMap) {
        // update CSM layers
        if (light && light.node && light.type === LightType.DIRECTIONAL) {
          csmLayers.update(sceneData, camera);
        }
      }
    }
    switch (light.type) {
      case LightType.DIRECTIONAL:
        {
          const mainLight = light;
          if (shadowInfo.enabled && mainLight && mainLight.shadowEnabled) {
            if (shadowInfo.type === ShadowType.ShadowMap) {
              let near = 0.1;
              let far = 0;
              let matShadowView;
              let matShadowProj;
              let matShadowViewProj;
              let levelCount = 0;
              if (mainLight.shadowFixedArea || mainLight.csmLevel === CSMLevel.LEVEL_1) {
                matShadowView = csmLayers.specialLayer.matShadowView;
                matShadowProj = csmLayers.specialLayer.matShadowProj;
                matShadowViewProj = csmLayers.specialLayer.matShadowViewProj;
                if (mainLight.shadowFixedArea) {
                  near = mainLight.shadowNear;
                  far = mainLight.shadowFar;
                  levelCount = 0;
                } else {
                  near = 0.1;
                  far = csmLayers.specialLayer.shadowCameraFar;
                  levelCount = 1;
                }
                _uboVec.set(LightType.DIRECTIONAL, packing, mainLight.shadowNormalBias, 0);
                setter.setVec4('cc_shadowLPNNInfo', _uboVec);
              } else {
                const layer = csmLayers.layers[csmLevel];
                matShadowView = layer.matShadowView;
                matShadowProj = layer.matShadowProj;
                matShadowViewProj = layer.matShadowViewProj;
                near = layer.splitCameraNear;
                far = layer.splitCameraFar;
                levelCount = mainLight.csmLevel;
              }
              setter.setMat4('cc_matLightView', matShadowView);
              _uboVec.set(matShadowProj.m10, matShadowProj.m14, matShadowProj.m11, matShadowProj.m15);
              setter.setVec4('cc_shadowProjDepthInfo', _uboVec);
              _uboVec.set(matShadowProj.m00, matShadowProj.m05, 1.0 / matShadowProj.m00, 1.0 / matShadowProj.m05);
              setter.setVec4('cc_shadowProjInfo', _uboVec);
              setter.setMat4('cc_matLightViewProj', matShadowViewProj);
              _uboVec.set(near, far, 0, 1.0 - mainLight.shadowSaturation);
              setter.setVec4('cc_shadowNFLSInfo', _uboVec);
              _uboVec.set(LightType.DIRECTIONAL, packing, mainLight.shadowNormalBias, levelCount);
              setter.setVec4('cc_shadowLPNNInfo', _uboVec);
              _uboVec.set(shadowInfo.size.x, shadowInfo.size.y, mainLight.shadowPcf, mainLight.shadowBias);
              setter.setVec4('cc_shadowWHPBInfo', _uboVec);
            }
          }
          break;
        }
      case LightType.SPOT:
        {
          const spotLight = light;
          if (shadowInfo.enabled && spotLight && spotLight.shadowEnabled) {
            Mat4.invert(_matView, spotLight.node.getWorldMatrix());
            setter.setMat4('cc_matLightView', _matView);
            Mat4.perspective(_mulMatView, spotLight.angle, 1.0, 0.001, spotLight.range, true, cap.clipSpaceMinZ, cap.clipSpaceSignY, 0);
            const matShadowInvProj = _mulMatView.clone().invert();
            const matShadowProj = _mulMatView.clone();
            Mat4.multiply(_matView, _mulMatView, _matView);
            setter.setMat4('cc_matLightViewProj', _matView);
            _uboVec.set(0.01, light.range, 0.0, 0.0);
            setter.setVec4('cc_shadowNFLSInfo', _uboVec);
            _uboVec.set(shadowInfo.size.x, shadowInfo.size.y, spotLight.shadowPcf, spotLight.shadowBias);
            setter.setVec4('cc_shadowWHPBInfo', _uboVec);
            _uboVec.set(LightType.SPOT, packing, spotLight.shadowNormalBias, 0.0);
            setter.setVec4('cc_shadowLPNNInfo', _uboVec);
            _uboVec.set(matShadowProj.m10, matShadowProj.m14, matShadowProj.m11, matShadowProj.m15);
            setter.setVec4('cc_shadowProjDepthInfo', _uboVec);
            _uboVec.set(matShadowInvProj.m10, matShadowInvProj.m14, matShadowInvProj.m11, matShadowInvProj.m15);
            setter.setVec4('cc_shadowInvProjDepthInfo', _uboVec);
            _uboVec.set(matShadowProj.m00, matShadowProj.m05, 1.0 / matShadowProj.m00, 1.0 / matShadowProj.m05);
            setter.setVec4('cc_shadowProjInfo', _uboVec);
          }
          break;
        }
      case LightType.SPHERE:
        {
          _uboVec.set(shadowInfo.size.x, shadowInfo.size.y, 1.0, 0.0);
          setter.setVec4('cc_shadowWHPBInfo', _uboVec);
          _uboVec.set(LightType.SPHERE, packing, 0.0, 0.0);
          setter.setVec4('cc_shadowLPNNInfo', _uboVec);
          break;
        }
      case LightType.POINT:
        {
          _uboVec.set(shadowInfo.size.x, shadowInfo.size.y, 1.0, 0.0);
          setter.setVec4('cc_shadowWHPBInfo', _uboVec);
          _uboVec.set(LightType.POINT, packing, 0.0, 0.0);
          setter.setVec4('cc_shadowLPNNInfo', _uboVec);
          break;
        }
      default:
    }
    _uboCol.set(shadowInfo.shadowColor.x, shadowInfo.shadowColor.y, shadowInfo.shadowColor.z, shadowInfo.shadowColor.w);
    setter.setColor('cc_shadowColor', _uboCol);
  }
  function getPCFRadius(shadowInfo, mainLight) {
    const shadowMapSize = shadowInfo.size.x;
    switch (mainLight.shadowPcf) {
      case PCFType.HARD:
        return 0.0;
      case PCFType.SOFT:
        return 1.0 / (shadowMapSize * 0.5);
      case PCFType.SOFT_2X:
        return 2.0 / (shadowMapSize * 0.5);
      case PCFType.SOFT_4X:
        return 3.0 / (shadowMapSize * 0.5);
      default:
    }
    return 0.0;
  }
  function setShadowUBOView(setter, camera, layout = 'default') {
    const director = cclegacy.director;
    const pipeline = director.root.pipeline;
    const device = pipeline.device;
    const scene = director.getScene();
    const mainLight = camera && camera.scene ? camera.scene.mainLight : scene ? scene.renderScene.mainLight : null;
    const sceneData = pipeline.pipelineSceneData;
    const shadowInfo = sceneData.shadows;
    const csmLayers = sceneData.csmLayers;
    const csmSupported = sceneData.csmSupported;
    const packing = supportsR32FloatTexture(device) ? 0.0 : 1.0;
    if (mainLight && shadowInfo.enabled) {
      if (shadowInfo.type === ShadowType.ShadowMap) {
        if (mainLight.shadowEnabled) {
          if (mainLight.shadowFixedArea || mainLight.csmLevel === CSMLevel.LEVEL_1 || !csmSupported) {
            const matShadowView = csmLayers.specialLayer.matShadowView;
            const matShadowProj = csmLayers.specialLayer.matShadowProj;
            const matShadowViewProj = csmLayers.specialLayer.matShadowViewProj;
            const near = mainLight.shadowNear;
            const far = mainLight.shadowFar;
            setter.setMat4('cc_matLightView', matShadowView);
            _uboVec.set(matShadowProj.m10, matShadowProj.m14, matShadowProj.m11, matShadowProj.m15);
            setter.setVec4('cc_shadowProjDepthInfo', _uboVec);
            _uboVec.set(matShadowProj.m00, matShadowProj.m05, 1.0 / matShadowProj.m00, 1.0 / matShadowProj.m05);
            setter.setVec4('cc_shadowProjInfo', _uboVec);
            setter.setMat4('cc_matLightViewProj', matShadowViewProj);
            _uboVec.set(near, far, 0, 1.0 - mainLight.shadowSaturation);
            setter.setVec4('cc_shadowNFLSInfo', _uboVec);
            _uboVec.set(LightType.DIRECTIONAL, packing, mainLight.shadowNormalBias, 0);
            setter.setVec4('cc_shadowLPNNInfo', _uboVec);
          } else {
            const layerThreshold = getPCFRadius(shadowInfo, mainLight);
            for (let i = 0; i < mainLight.csmLevel; i++) {
              const layer = csmLayers.layers[i];
              const matShadowView = layer.matShadowView;
              _uboVec.set(matShadowView.m00, matShadowView.m04, matShadowView.m08, layerThreshold);
              setter.setVec4('cc_csmViewDir0', _uboVec, i);
              _uboVec.set(matShadowView.m01, matShadowView.m05, matShadowView.m09, layer.splitCameraNear);
              setter.setVec4('cc_csmViewDir1', _uboVec, i);
              _uboVec.set(matShadowView.m02, matShadowView.m06, matShadowView.m10, layer.splitCameraFar);
              setter.setVec4('cc_csmViewDir2', _uboVec, i);
              const csmAtlas = layer.csmAtlas;
              setter.setVec4('cc_csmAtlas', csmAtlas, i);
              const matShadowViewProj = layer.matShadowViewProj;
              setter.setMat4('cc_matCSMViewProj', matShadowViewProj, i);
              const matShadowProj = layer.matShadowProj;
              _uboVec.set(matShadowProj.m10, matShadowProj.m14, matShadowProj.m11, matShadowProj.m15);
              setter.setVec4('cc_csmProjDepthInfo', _uboVec, i);
              _uboVec.set(matShadowProj.m00, matShadowProj.m05, 1.0 / matShadowProj.m00, 1.0 / matShadowProj.m05);
              setter.setVec4('cc_csmProjInfo', _uboVec, i);
            }
            _uboVec.set(mainLight.csmTransitionRange, 0, 0, 0);
            setter.setVec4('cc_csmSplitsInfo', _uboVec);
            _uboVec.set(0.1, mainLight.shadowDistance, 0, 1.0 - mainLight.shadowSaturation);
            setter.setVec4('cc_shadowNFLSInfo', _uboVec);
            _uboVec.set(LightType.DIRECTIONAL, packing, mainLight.shadowNormalBias, mainLight.csmLevel);
            setter.setVec4('cc_shadowLPNNInfo', _uboVec);
          }
          _uboVec.set(shadowInfo.size.x, shadowInfo.size.y, mainLight.shadowPcf, mainLight.shadowBias);
          setter.setVec4('cc_shadowWHPBInfo', _uboVec);
        }
      } else {
        Vec3.normalize(_uboVec3, shadowInfo.normal);
        _uboVec.set(_uboVec3.x, _uboVec3.y, _uboVec3.z, -shadowInfo.distance);
        setter.setVec4('cc_planarNDInfo', _uboVec);
        _uboVec.set(0, 0, 0, shadowInfo.planeBias);
        setter.setVec4('cc_shadowWHPBInfo', _uboVec);
      }
      setter.setMathColor('cc_shadowColor', shadowInfo.shadowColor);
    }
  }
  function recordCommand(cmdBuffer, _renderPass, pass, localDesc, shader, ia) {
    let pso;
    if (shader && ia) {
      pso = PipelineStateManager.getOrCreatePipelineState(deviceManager.gfxDevice, pass, shader, _renderPass, ia);
    }
    if (pso) {
      const _ia = ia;
      cmdBuffer.bindPipelineState(pso);
      cmdBuffer.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
      cmdBuffer.bindDescriptorSet(SetIndex.LOCAL, localDesc);
      cmdBuffer.bindInputAssembler(_ia);
      cmdBuffer.draw(_ia);
    }
  }
  _export({
    setTextureUBOView: setTextureUBOView,
    setCameraUBOValues: setCameraUBOValues,
    DrawInstance: void 0,
    ProbeHelperQueue: void 0,
    setShadowUBOLightView: setShadowUBOLightView,
    setShadowUBOView: setShadowUBOView,
    WebSetter: void 0,
    RenderDrawQueue: void 0,
    RenderInstancingQueue: void 0,
    RenderQueueQuery: void 0,
    recordCommand: recordCommand,
    RenderQueue: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      RecyclePool = _coreIndexJs.RecyclePool;
      CoreColor = _coreIndexJs.Color;
      cclegacy = _coreIndexJs.cclegacy;
      Quat = _coreIndexJs.Quat;
      Vec4 = _coreIndexJs.Vec4;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      toRadian = _coreIndexJs.toRadian;
    }, function (_gfxIndexJs) {
      Color = _gfxIndexJs.Color;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      CSMLevel = _renderSceneSceneIndexJs.CSMLevel;
      LightType = _renderSceneSceneIndexJs.LightType;
      PCFType = _renderSceneSceneIndexJs.PCFType;
      ShadowType = _renderSceneSceneIndexJs.ShadowType;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
      supportsR32FloatTexture = _defineJs.supportsR32FloatTexture;
    }, function (_instancedBufferJs) {
      InstancedBuffer = _instancedBufferJs.InstancedBuffer;
      instancingCompareFn = _instancedBufferJs.instancingCompareFn;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_typesJs) {
      SceneFlags = _typesJs.SceneFlags;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }],
    execute: function () {
      _uboVec = new Vec4();
      _uboVec3 = new Vec3();
      _uboCol = new Color();
      _matView = new Mat4();
      _mulMatView = new Mat4();
      _export("DrawInstance", DrawInstance = class DrawInstance {
        constructor(subModel = null, priority = 0, hash = 0, depth = 0, shaderID = 0, passIndex = 0) {
          this.subModel = void 0;
          this.priority = void 0;
          this.hash = void 0;
          this.depth = void 0;
          this.shaderID = void 0;
          this.passIndex = void 0;
          this.subModel = subModel;
          this.priority = priority;
          this.hash = hash;
          this.depth = depth;
          this.shaderID = shaderID;
          this.passIndex = passIndex;
        }
        update(subModel = null, priority = 0, hash = 0, depth = 0, shaderID = 0, passIndex = 0) {
          this.subModel = subModel;
          this.priority = priority;
          this.hash = hash;
          this.depth = depth;
          this.shaderID = shaderID;
          this.passIndex = passIndex;
        }
      });
      _export("instancePool", instancePool = new RecyclePool(() => new DrawInstance(), 8));
      CC_USE_RGBE_OUTPUT = 'CC_USE_RGBE_OUTPUT';
      _export("ProbeHelperQueue", ProbeHelperQueue = class ProbeHelperQueue {
        constructor() {
          this.probeMap = new Array();
          this.defaultId = getLayoutId('default', 'default');
        }
        clear() {
          this.probeMap.length = 0;
        }
        applyMacro() {
          for (const subModel of this.probeMap) {
            let patches = [{
              name: CC_USE_RGBE_OUTPUT,
              value: true
            }];
            if (subModel.patches) {
              patches = patches.concat(subModel.patches);
            }
            subModel.onMacroPatchesStateChanged(patches);
          }
        }
        removeMacro() {
          for (const subModel of this.probeMap) {
            if (!subModel.patches) continue;
            const patches = subModel.patches.filter(patch => patch.name !== CC_USE_RGBE_OUTPUT);
            if (patches.length === 0) {
              subModel.onMacroPatchesStateChanged(null);
            } else {
              subModel.onMacroPatchesStateChanged(patches);
            }
          }
        }
        addToProbeQueue(model, probeLayoutId) {
          const subModels = model.subModels;
          for (let j = 0; j < subModels.length; j++) {
            const subModel = subModels[j];

            //Filter transparent objects
            const isTransparent = subModel.passes[0].blendState.targets[0].blend;
            if (isTransparent) {
              continue;
            }
            let passIdx = getPassIndexFromLayout(subModel, probeLayoutId);
            let bUseReflectPass = true;
            if (passIdx < 0) {
              probeLayoutId = this.defaultId;
              passIdx = getPassIndexFromLayout(subModel, probeLayoutId);
              bUseReflectPass = false;
            }
            if (passIdx < 0) {
              continue;
            }
            if (!bUseReflectPass) {
              this.probeMap.push(subModel);
            }
          }
        }
      });
      _export("WebSetter", WebSetter = class WebSetter {
        constructor(data, lg) {
          // protected
          this._data = void 0;
          this._lg = void 0;
          this._vertID = -1;
          this._currBlock = void 0;
          this._currStage = '';
          this._currFrequency = UpdateFrequency.PER_PASS;
          this._currCount = void 0;
          this._currConstant = [];
          this._data = data;
          this._lg = lg;
        }
        get name() {
          return '';
        }
        set name(name) {
          // noop
        }
        setMat4(name, mat, idx = 0) {
          WebSetter.setMat4(this._lg, this._data, name, mat, idx);
        }
        static setMat4(lg, data, name, mat, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          Mat4.toArray(info.dataArr, mat, idx * 16);
          data.constants.set(info.constantID, info.dataArr);
        }
        setQuaternion(name, quat, idx = 0) {
          WebSetter.setQuaternion(this._lg, this._data, name, quat, idx);
        }
        static setQuaternion(lg, data, name, quat, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          Quat.toArray(info.dataArr, quat, idx * 4);
          data.constants.set(info.constantID, info.dataArr);
        }
        setColor(name, color, idx = 0) {
          WebSetter.setColor(this._lg, this._data, name, color, idx);
        }
        static setColor(lg, data, name, color, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          const currIdx = idx * 4;
          info.dataArr[0 + currIdx] = color.x;
          info.dataArr[1 + currIdx] = color.y;
          info.dataArr[2 + currIdx] = color.z;
          info.dataArr[3 + currIdx] = color.w;
          data.constants.set(info.constantID, info.dataArr);
        }
        setMathColor(name, color, idx = 0) {
          WebSetter.setMathColor(this._lg, this._data, name, color, idx);
        }
        static setMathColor(lg, data, name, color, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          CoreColor.toArray(info.dataArr, color, idx * 4);
          data.constants.set(info.constantID, info.dataArr);
        }
        static getConstantInfo(lg, data, name) {
          const constantID = lg.constantIndex.get(name);
          if (constantID === undefined) {
            throw new Error(`Constant with name ${name} not found.`);
          }
          const dataArr = data.constants.get(constantID) || [];
          return {
            constantID,
            dataArr
          };
        }
        setVec4(name, vec, idx = 0) {
          WebSetter.setVec4(this._lg, this._data, name, vec, idx);
        }
        static setVec4(lg, data, name, vec, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          Vec4.toArray(info.dataArr, vec, idx * 4);
          data.constants.set(info.constantID, info.dataArr);
        }
        setVec2(name, vec, idx = 0) {
          WebSetter.setVec2(this._lg, this._data, name, vec, idx);
        }
        static setVec2(lg, data, name, vec, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          Vec2.toArray(info.dataArr, vec, idx * 2);
          data.constants.set(info.constantID, info.dataArr);
        }
        setFloat(name, v, idx = 0) {
          WebSetter.setFloat(this._lg, this._data, name, v, idx);
        }
        static setFloat(lg, data, name, v, idx = 0) {
          const info = WebSetter.getConstantInfo(lg, data, name);
          info.dataArr[0 + idx] = v;
          data.constants.set(info.constantID, info.dataArr);
        }
        setArrayBuffer(name, arrayBuffer) {
          WebSetter.setArrayBuffer(this._lg, this._data, name, arrayBuffer);
        }
        static setArrayBuffer(lg, data, name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        setBuffer(name, buffer) {
          WebSetter.setBuffer(this._lg, this._data, name, buffer);
        }
        static setBuffer(lg, data, name, buffer) {
          const num = lg.attributeIndex.get(name);
          data.buffers.set(num, buffer);
        }
        setTexture(name, texture) {
          WebSetter.setTexture(this._lg, this._data, name, texture);
        }
        static setTexture(lg, data, name, texture) {
          const num = lg.attributeIndex.get(name);
          data.textures.set(num, texture);
        }
        setReadWriteBuffer(name, buffer) {
          WebSetter.setReadWriteBuffer(this._lg, this._data, name, buffer);
        }
        static setReadWriteBuffer(lg, data, name, buffer) {
          const num = lg.attributeIndex.get(name);
          data.buffers.set(num, buffer);
        }
        setReadWriteTexture(name, texture) {
          WebSetter.setReadWriteTexture(this._lg, this._data, name, texture);
        }
        static setReadWriteTexture(lg, data, name, texture) {
          const num = lg.attributeIndex.get(name);
          data.textures.set(num, texture);
        }
        setSampler(name, sampler) {
          WebSetter.setSampler(this._lg, this._data, name, sampler);
        }
        static setSampler(lg, data, name, sampler) {
          const num = lg.attributeIndex.get(name);
          data.samplers.set(num, sampler);
        }
        getParentLayout() {
          const director = cclegacy.director;
          const root = director.root;
          const pipeline = root.pipeline;
          const parId = pipeline.renderGraph.getParent(this._vertID);
          const layoutName = pipeline.renderGraph.getLayout(parId);
          return layoutName;
        }
        getCurrentLayout() {
          const director = cclegacy.director;
          const root = director.root;
          const pipeline = root.pipeline;
          const layoutName = pipeline.renderGraph.getLayout(this._vertID);
          return layoutName;
        }
        setBuiltinCameraConstants(camera) {
          const director = cclegacy.director;
          const root = director.root;
          const pipeline = root.pipeline;
          const layoutName = this.getParentLayout();
          setCameraUBOValues(this, camera, pipeline.pipelineSceneData, camera.scene, layoutName);
        }
        setBuiltinDirectionalLightFrustumConstants(camera, light, csmLevel = 0) {
          setShadowUBOLightView(this, camera, light, csmLevel);
        }
        setBuiltinSpotLightFrustumConstants(light) {
          setShadowUBOLightView(this, null, light, 0);
        }
        setBuiltinDirectionalLightConstants(light, camera) {
          setShadowUBOView(this, null, this.getParentLayout());
        }
        setBuiltinSphereLightConstants(light, camera) {
          const director = cclegacy.director;
          const pipeline = director.root.pipeline;
          const sceneData = pipeline.pipelineSceneData;
          _uboVec.set(light.position.x, light.position.y, light.position.z, LightType.SPHERE);
          this.setVec4('cc_lightPos', _uboVec);
          _uboVec.set(light.size, light.range, 0.0, 0.0);
          this.setVec4('cc_lightSizeRangeAngle', _uboVec);
          const isHDR = sceneData.isHDR;
          const lightMeterScale = 10000.0;
          _uboVec.set(light.color.x, light.color.y, light.color.z, 0);
          if (light.useColorTemperature) {
            const finalColor = light.finalColor;
            _uboVec.x = finalColor.x;
            _uboVec.y = finalColor.y;
            _uboVec.z = finalColor.z;
          }
          if (isHDR) {
            _uboVec.w = light.luminance * camera.exposure * lightMeterScale;
          } else {
            _uboVec.w = light.luminance;
          }
          this.setVec4('cc_lightColor', _uboVec);
        }
        setBuiltinSpotLightConstants(light, camera) {
          const director = cclegacy.director;
          const pipeline = director.root.pipeline;
          const sceneData = pipeline.pipelineSceneData;
          const shadowInfo = sceneData.shadows;
          _uboVec.set(light.position.x, light.position.y, light.position.z, LightType.SPOT);
          this.setVec4('cc_lightPos', _uboVec);
          _uboVec.set(light.size, light.range, light.spotAngle, shadowInfo.enabled && light.shadowEnabled && shadowInfo.type === ShadowType.ShadowMap ? 1 : 0);
          this.setVec4('cc_lightSizeRangeAngle', _uboVec);
          _uboVec.set(light.direction.x, light.direction.y, light.direction.z, 0);
          this.setVec4('cc_lightDir', _uboVec);
          const isHDR = sceneData.isHDR;
          const lightMeterScale = 10000.0;
          _uboVec.set(light.color.x, light.color.y, light.color.z, 0);
          if (light.useColorTemperature) {
            const finalColor = light.finalColor;
            _uboVec.x = finalColor.x;
            _uboVec.y = finalColor.y;
            _uboVec.z = finalColor.z;
          }
          if (isHDR) {
            _uboVec.w = light.luminance * camera.exposure * lightMeterScale;
          } else {
            _uboVec.w = light.luminance;
          }
          this.setVec4('cc_lightColor', _uboVec);
          _uboVec.set(0, 0, 0, light.angleAttenuationStrength);
          this.setVec4('cc_lightBoundingSizeVS', _uboVec);
        }
        setBuiltinPointLightConstants(light, camera) {
          const director = cclegacy.director;
          const pipeline = director.root.pipeline;
          const sceneData = pipeline.pipelineSceneData;
          _uboVec.set(light.position.x, light.position.y, light.position.z, LightType.POINT);
          this.setVec4('cc_lightPos', _uboVec);
          _uboVec.set(0.0, light.range, 0.0, 0.0);
          this.setVec4('cc_lightSizeRangeAngle', _uboVec);
          const isHDR = sceneData.isHDR;
          const lightMeterScale = 10000.0;
          if (light.useColorTemperature) {
            const finalColor = light.finalColor;
            _uboVec.x = finalColor.x;
            _uboVec.y = finalColor.y;
            _uboVec.z = finalColor.z;
          }
          if (isHDR) {
            _uboVec.w = light.luminance * camera.exposure * lightMeterScale;
          } else {
            _uboVec.w = light.luminance;
          }
          _uboVec.set(light.color.x, light.color.y, light.color.z, 0);
          this.setVec4('cc_lightColor', _uboVec);
        }
        setBuiltinRangedDirectionalLightConstants(light, camera) {
          const director = cclegacy.director;
          const pipeline = director.root.pipeline;
          const sceneData = pipeline.pipelineSceneData;
          _uboVec.set(light.position.x, light.position.y, light.position.z, LightType.RANGED_DIRECTIONAL);
          this.setVec4('cc_lightPos', _uboVec);
          _uboVec.set(light.right.x, light.right.y, light.right.z, 0.0);
          this.setVec4('cc_lightSizeRangeAngle', _uboVec);
          _uboVec.set(light.direction.x, light.direction.y, light.direction.z, 0);
          this.setVec4('cc_lightDir', _uboVec);
          const scale = light.scale;
          _uboVec.set(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5, 0);
          this.setVec4('cc_lightBoundingSizeVS', _uboVec);
          const isHDR = sceneData.isHDR;
          _uboVec.set(light.color.x, light.color.y, light.color.z, 0);
          if (light.useColorTemperature) {
            const finalColor = light.finalColor;
            _uboVec.x = finalColor.x;
            _uboVec.y = finalColor.y;
            _uboVec.z = finalColor.z;
          }
          if (isHDR) {
            _uboVec.w = light.illuminance * camera.exposure;
          } else {
            _uboVec.w = light.illuminance;
          }
          this.setVec4('cc_lightColor', _uboVec);
        }
        hasSampler(name) {
          const id = this._lg.constantIndex.get(name);
          if (id === undefined) {
            return false;
          }
          return this._data.samplers.has(id);
        }
        hasTexture(name) {
          const id = this._lg.constantIndex.get(name);
          if (id === undefined) {
            return false;
          }
          return this._data.textures.has(id);
        }
        setCustomBehavior(name) {
          throw new Error('Method not implemented.');
        }
      });
      _export("RenderDrawQueue", RenderDrawQueue = class RenderDrawQueue {
        constructor() {
          this.instances = new Array();
        }
        empty() {
          return this.instances.length === 0;
        }
        clear() {
          this.instances.length = 0;
        }
        add(model, depth, subModelIdx, passIdx) {
          const subModel = model.subModels[subModelIdx];
          const pass = subModel.passes[passIdx];
          const passPriority = pass.priority;
          const modelPriority = subModel.priority;
          const shaderId = subModel.shaders[passIdx].typedID;
          const hash = 0 << 30 | passPriority << 16 | modelPriority << 8 | passIdx;
          const priority = model.priority;
          const instance = instancePool.add();
          instance.update(subModel, priority, hash, depth, shaderId, passIdx);
          this.instances.push(instance);
        }
        /**
         * @en Comparison sorting function. Opaque objects are sorted by priority -> depth front to back -> shader ID.
         * @zh 比较排序函数。不透明对象按优先级 -> 深度由前向后 -> Shader ID 顺序排序。
         */
        sortOpaqueOrCutout() {
          this.instances.sort((lhs, rhs) => {
            if (lhs.hash !== rhs.hash) {
              return lhs.hash - rhs.hash;
            }
            if (lhs.depth !== rhs.depth) {
              return lhs.depth - rhs.depth;
            }
            return lhs.shaderID - rhs.shaderID;
          });
        }
        /**
         * @en Comparison sorting function. Transparent objects are sorted by priority -> depth back to front -> shader ID.
         * @zh 比较排序函数。半透明对象按优先级 -> 深度由后向前 -> Shader ID 顺序排序。
         */
        sortTransparent() {
          this.instances.sort((lhs, rhs) => {
            if (lhs.priority !== rhs.priority) {
              return lhs.priority - rhs.priority;
            }
            if (lhs.hash !== rhs.hash) {
              return lhs.hash - rhs.hash;
            }
            if (lhs.depth !== rhs.depth) {
              return rhs.depth - lhs.depth; // 注意此处的差值顺序，为了按照降序排列
            }
            return lhs.shaderID - rhs.shaderID;
          });
        }
        recordCommandBuffer(device, renderPass, cmdBuffer, ds = null, offset = 0, dynamicOffsets = null) {
          for (const instance of this.instances) {
            const subModel = instance.subModel;
            const passIdx = instance.passIndex;
            const inputAssembler = subModel.inputAssembler;
            const pass = subModel.passes[passIdx];
            const shader = subModel.shaders[passIdx];
            const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, inputAssembler);
            cmdBuffer.bindPipelineState(pso);
            cmdBuffer.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
            if (ds) {
              cmdBuffer.bindDescriptorSet(SetIndex.GLOBAL, ds, [offset]);
            }
            if (dynamicOffsets) {
              cmdBuffer.bindDescriptorSet(SetIndex.LOCAL, subModel.descriptorSet, dynamicOffsets);
            } else {
              cmdBuffer.bindDescriptorSet(SetIndex.LOCAL, subModel.descriptorSet);
            }
            cmdBuffer.bindInputAssembler(inputAssembler);
            cmdBuffer.draw(inputAssembler);
          }
        }
      });
      _export("RenderInstancingQueue", RenderInstancingQueue = class RenderInstancingQueue {
        constructor() {
          this.passInstances = new Map();
          this.instanceBuffers = new Array();
        }
        empty() {
          return this.passInstances.size === 0;
        }
        add(pass, subModel, passID) {
          const iter = this.passInstances.get(pass);
          if (iter === undefined) {
            const instanceBufferID = this.passInstances.size;
            if (instanceBufferID >= this.instanceBuffers.length) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              this.instanceBuffers.push(new InstancedBuffer(pass));
            }
            this.passInstances.set(pass, instanceBufferID);
            const instanceBuffer = this.instanceBuffers[instanceBufferID];
            instanceBuffer.pass = pass;
            const instances = instanceBuffer.instances;
          }
          const instancedBuffer = this.instanceBuffers[this.passInstances.get(pass)];
          instancedBuffer.merge(subModel, passID);
        }
        clear() {
          this.passInstances.clear();
          const instanceBuffers = this.instanceBuffers;
          instanceBuffers.forEach(instance => {
            instance.clear();
          });
        }
        sort() {
          this.instanceBuffers = this.instanceBuffers.sort(instancingCompareFn);
        }
        uploadBuffers(cmdBuffer) {
          for (const [pass, bufferID] of this.passInstances.entries()) {
            const instanceBuffer = this.instanceBuffers[bufferID];
            if (instanceBuffer.hasPendingModels) {
              instanceBuffer.uploadBuffers(cmdBuffer);
            }
          }
        }
        recordCommandBuffer(renderPass, cmdBuffer, ds = null, offset = 0, dynamicOffsets = null) {
          const renderQueue = this.instanceBuffers;
          for (const instanceBuffer of renderQueue) {
            if (!instanceBuffer.hasPendingModels) {
              continue;
            }
            const instances = instanceBuffer.instances;
            const drawPass = instanceBuffer.pass;
            cmdBuffer.bindDescriptorSet(SetIndex.MATERIAL, drawPass.descriptorSet);
            let lastPSO = null;
            for (const instance of instances) {
              if (!instance.count) {
                continue;
              }
              const pso = PipelineStateManager.getOrCreatePipelineState(deviceManager.gfxDevice, drawPass, instance.shader, renderPass, instance.ia);
              if (lastPSO !== pso) {
                cmdBuffer.bindPipelineState(pso);
                lastPSO = pso;
              }
              if (ds) {
                cmdBuffer.bindDescriptorSet(SetIndex.GLOBAL, ds, [offset]);
              }
              if (dynamicOffsets) {
                cmdBuffer.bindDescriptorSet(SetIndex.LOCAL, instance.descriptorSet, dynamicOffsets);
              } else {
                cmdBuffer.bindDescriptorSet(SetIndex.LOCAL, instance.descriptorSet, instanceBuffer.dynamicOffsets);
              }
              cmdBuffer.bindInputAssembler(instance.ia);
              cmdBuffer.draw(instance.ia);
            }
          }
        }
      });
      _export("RenderQueueQuery", RenderQueueQuery = class RenderQueueQuery {
        constructor(frustumCulledResultID = 0xFFFFFFFF, lightBoundsCulledResultID = 0xFFFFFFFF, renderQueueTargetIn = 0xFFFFFFFF) {
          this.frustumCulledResultID = void 0;
          this.lightBoundsCulledResultID = void 0;
          this.renderQueueTarget = void 0;
          this.frustumCulledResultID = frustumCulledResultID;
          this.lightBoundsCulledResultID = lightBoundsCulledResultID;
          this.renderQueueTarget = renderQueueTargetIn;
        }
        update(culledSourceIn = 0xFFFFFFFF, lightBoundsCulledResultID = 0xFFFFFFFF, renderQueueTargetIn = 0xFFFFFFFF) {
          this.frustumCulledResultID = culledSourceIn;
          this.lightBoundsCulledResultID = lightBoundsCulledResultID;
          this.renderQueueTarget = renderQueueTargetIn;
        }
      });
      _export("RenderQueue", RenderQueue = class RenderQueue {
        constructor() {
          this.probeQueue = new ProbeHelperQueue();
          this.opaqueQueue = new RenderDrawQueue();
          this.transparentQueue = new RenderDrawQueue();
          this.opaqueInstancingQueue = new RenderInstancingQueue();
          this.transparentInstancingQueue = new RenderInstancingQueue();
          this.camera = null;
          this.sceneFlags = SceneFlags.NONE;
          this.lightByteOffset = 0xFFFFFFFF;
        }
        sort() {
          this.opaqueQueue.sortOpaqueOrCutout();
          this.transparentQueue.sortTransparent();
          this.opaqueInstancingQueue.sort();
          this.transparentInstancingQueue.sort();
        }
        update() {
          this.probeQueue.clear();
          this.opaqueQueue.clear();
          this.transparentQueue.clear();
          this.opaqueInstancingQueue.clear();
          this.transparentInstancingQueue.clear();
          this.camera = null;
          this.sceneFlags = SceneFlags.NONE;
          this.lightByteOffset = 0xFFFFFFFF;
        }
        empty() {
          return this.opaqueQueue.empty() && this.transparentQueue.empty() && this.opaqueInstancingQueue.empty() && this.transparentInstancingQueue.empty();
        }
        recordCommands(cmdBuffer, renderPass, sceneFlags) {
          const offsets = this.lightByteOffset === 0xFFFFFFFF ? null : [this.lightByteOffset];
          if (sceneFlags & (SceneFlags.OPAQUE | SceneFlags.MASK)) {
            this.opaqueQueue.recordCommandBuffer(deviceManager.gfxDevice, renderPass, cmdBuffer, null, 0, offsets);
            this.opaqueInstancingQueue.recordCommandBuffer(renderPass, cmdBuffer, null, 0, offsets);
          }
          if (sceneFlags & SceneFlags.BLEND) {
            this.transparentInstancingQueue.recordCommandBuffer(renderPass, cmdBuffer, null, 0, offsets);
            this.transparentQueue.recordCommandBuffer(deviceManager.gfxDevice, renderPass, cmdBuffer, null, 0, offsets);
          }
        }
      });
    }
  };
});