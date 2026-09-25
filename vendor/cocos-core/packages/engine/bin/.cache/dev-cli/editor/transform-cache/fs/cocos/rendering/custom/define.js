System.register("q-bundled:///fs/cocos/rendering/custom/define.js", ["../../gfx/index.js", "../../render-scene/scene/camera.js", "../../render-scene/scene/shadows.js", "../../render-scene/scene/light.js", "../define.js", "./types.js", "../../core/index.js", "../../core/geometry/index.js", "./utils.js"], function (_export, _context) {
  "use strict";

  var BufferInfo, Buffer, BufferUsageBit, ClearFlagBit, Color, LoadOp, Format, Rect, Sampler, StoreOp, Texture, Viewport, MemoryUsageBit, Camera, SkyBoxFlagValue, CSMLevel, ShadowType, LightType, UBOForwardLightEnum, supportsR32FloatTexture, supportsRGBA16HalfFloatTexture, AttachmentType, LightInfo, QueueHint, ResourceResidency, SceneFlags, UpdateFrequency, Vec4, geometry, toRadian, cclegacy, RecyclePool, AABB, getUBOTypeCount, ShadowInfo, DescBuffManager, ConstantBlockInfo, RenderPassMergeInfo, _rangedDirLightBoundingBox, _tmpBoundingBox, AntiAliasing, shadowPass, shadowInfo, buffsMap, currBindBuffs, layouts, uniformBlockMap, constantBlockMap, kLightMeterScale, passOrders, rpCombineMap, rpMergeInfos, rpMergeInfoPool;
  function getRTFormatBeforeToneMapping(ppl) {
    const useFloatOutput = ppl.getMacroBool('CC_USE_FLOAT_OUTPUT');
    return ppl.pipelineSceneData.isHDR && useFloatOutput && supportsRGBA16HalfFloatTexture(ppl.device) ? Format.RGBA16F : Format.RGBA8;
  }
  function validPunctualLightsCulling(pipeline, camera) {
    const sceneData = pipeline.pipelineSceneData;
    const validPunctualLights = sceneData.validPunctualLights;
    validPunctualLights.length = 0;
    const _sphere = geometry.Sphere.create(0, 0, 0, 1);
    const {
      spotLights
    } = camera.scene;
    const disableLightmap = camera.node.scene.globals.disableLightmap;
    for (let i = 0; i < spotLights.length; i++) {
      const light = spotLights[i];
      if (light.baked && !disableLightmap) {
        continue;
      }
      geometry.Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
      if (geometry.intersect.sphereFrustum(_sphere, camera.frustum)) {
        validPunctualLights.push(light);
      }
    }
    const {
      sphereLights
    } = camera.scene;
    for (let i = 0; i < sphereLights.length; i++) {
      const light = sphereLights[i];
      if (light.baked && !disableLightmap) {
        continue;
      }
      geometry.Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
      if (geometry.intersect.sphereFrustum(_sphere, camera.frustum)) {
        validPunctualLights.push(light);
      }
    }
    const {
      pointLights
    } = camera.scene;
    for (let i = 0; i < pointLights.length; i++) {
      const light = pointLights[i];
      if (light.baked) {
        continue;
      }
      geometry.Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
      if (geometry.intersect.sphereFrustum(_sphere, camera.frustum)) {
        validPunctualLights.push(light);
      }
    }
    const {
      rangedDirLights
    } = camera.scene;
    for (let i = 0; i < rangedDirLights.length; i++) {
      const light = rangedDirLights[i];
      AABB.transform(_tmpBoundingBox, _rangedDirLightBoundingBox, light.node.getWorldMatrix());
      if (geometry.intersect.aabbFrustum(_tmpBoundingBox, camera.frustum)) {
        validPunctualLights.push(light);
      }
    }
    // in jsb, std::vector is not synchronized, so we need to assign it manually
    sceneData.validPunctualLights = validPunctualLights;
  }
  function getCameraUniqueID(camera) {
    return camera.cameraId;
  }
  function getLoadOpOfClearFlag(clearFlag, attachment) {
    let loadOp = LoadOp.CLEAR;
    if (!(clearFlag & ClearFlagBit.COLOR) && attachment === AttachmentType.RENDER_TARGET) {
      if (clearFlag & SkyBoxFlagValue.VALUE) {
        loadOp = LoadOp.CLEAR;
      } else {
        loadOp = LoadOp.LOAD;
      }
    }
    if ((clearFlag & ClearFlagBit.DEPTH_STENCIL) !== ClearFlagBit.DEPTH_STENCIL && attachment === AttachmentType.DEPTH_STENCIL) {
      if (!(clearFlag & ClearFlagBit.DEPTH)) loadOp = LoadOp.LOAD;
      if (!(clearFlag & ClearFlagBit.STENCIL)) loadOp = LoadOp.LOAD;
    }
    return loadOp;
  }
  function getRenderArea(camera, width, height, light = null, level = 0, out = undefined) {
    out = out || new Rect();
    const vp = camera ? camera.viewport : new Rect(0, 0, 1, 1);
    const w = width;
    const h = height;
    out.x = vp.x * w;
    out.y = vp.y * h;
    out.width = vp.width * w;
    out.height = vp.height * h;
    if (light) {
      switch (light.type) {
        case LightType.DIRECTIONAL:
          {
            const mainLight = light;
            if (mainLight.shadowFixedArea || mainLight.csmLevel === CSMLevel.LEVEL_1) {
              out.x = 0;
              out.y = 0;
              out.width = w;
              out.height = h;
            } else {
              const screenSpaceSignY = cclegacy.director.root.device.capabilities.screenSpaceSignY;
              out.x = level % 2 * 0.5 * w;
              if (screenSpaceSignY > 0) {
                out.y = (1 - Math.floor(level / 2)) * 0.5 * h;
              } else {
                out.y = Math.floor(level / 2) * 0.5 * h;
              }
              out.width = 0.5 * w;
              out.height = 0.5 * h;
            }
            break;
          }
        case LightType.SPOT:
          {
            out.x = 0;
            out.y = 0;
            out.width = w;
            out.height = h;
            break;
          }
        default:
      }
    }
    return out;
  }
  function buildShadowPass(passName, ppl, camera, light, level, width, height) {
    const fboW = width;
    const fboH = height;
    const area = getRenderArea(camera, width, height, light, level);
    width = area.width;
    height = area.height;
    const device = ppl.device;
    const shadowMapName = passName;
    if (!ppl.containsResource(shadowMapName)) {
      const format = supportsR32FloatTexture(device) ? Format.R32F : Format.RGBA8;
      ppl.addRenderTarget(shadowMapName, format, fboW, fboH, ResourceResidency.MANAGED);
      ppl.addDepthStencil(`${shadowMapName}Depth`, Format.DEPTH_STENCIL, fboW, fboH, ResourceResidency.MANAGED);
    }
    ppl.updateRenderTarget(shadowMapName, fboW, fboH);
    ppl.updateDepthStencil(`${shadowMapName}Depth`, fboW, fboH);
    if (!level) {
      shadowPass = ppl.addRenderPass(width, height, 'default');
      shadowPass.name = passName;
      shadowPass.setViewport(new Viewport(0, 0, fboW, fboH));
      shadowPass.addRenderTarget(shadowMapName, LoadOp.CLEAR, StoreOp.STORE, new Color(1, 1, 1, camera.clearColor.w));
      shadowPass.addDepthStencil(`${shadowMapName}Depth`, LoadOp.CLEAR, StoreOp.DISCARD, camera.clearDepth, camera.clearStencil, ClearFlagBit.DEPTH_STENCIL);
    }
    const queue = shadowPass.addQueue(QueueHint.RENDER_OPAQUE, 'shadow-caster');
    queue.addScene(camera, SceneFlags.SHADOW_CASTER | SceneFlags.OPAQUE_OBJECT | SceneFlags.MASK).useLightFrustum(light, light.type !== LightType.DIRECTIONAL ? 0 : level);
    queue.setViewport(new Viewport(area.x, area.y, area.width, area.height));
  }
  function buildReflectionProbePass(camera, ppl, probe, renderWindow, faceIdx) {
    const cameraName = `Camera${faceIdx}`;
    const area = probe.renderArea();
    const width = area.x;
    const height = area.y;
    const probeCamera = probe.camera;
    const probePassRTName = `reflectionProbePassColor${cameraName}`;
    const probePassDSName = `reflectionProbePassDS${cameraName}`;
    if (!ppl.containsResource(probePassRTName)) {
      ppl.addRenderWindow(probePassRTName, Format.RGBA8, width, height, renderWindow);
      ppl.addDepthStencil(probePassDSName, Format.DEPTH_STENCIL, width, height, ResourceResidency.EXTERNAL);
    }
    ppl.updateRenderWindow(probePassRTName, renderWindow);
    ppl.updateDepthStencil(probePassDSName, width, height);
    const probePass = ppl.addRenderPass(width, height, 'default');
    probePass.name = `ReflectionProbePass${faceIdx}`;
    probePass.setViewport(new Viewport(0, 0, width, height));
    probePass.addRenderTarget(probePassRTName, getLoadOpOfClearFlag(probeCamera.clearFlag, AttachmentType.RENDER_TARGET), StoreOp.STORE, new Color(probeCamera.clearColor.x, probeCamera.clearColor.y, probeCamera.clearColor.z, probeCamera.clearColor.w));
    probePass.addDepthStencil(probePassDSName, getLoadOpOfClearFlag(probeCamera.clearFlag, AttachmentType.DEPTH_STENCIL), StoreOp.STORE, probeCamera.clearDepth, probeCamera.clearStencil, probeCamera.clearFlag);
    const passBuilder = probePass.addQueue(QueueHint.RENDER_OPAQUE, 'reflect-map');
    const lightInfo = new LightInfo();
    lightInfo.probe = probe;
    passBuilder.addSceneOfCamera(camera, lightInfo, SceneFlags.REFLECTION_PROBE | SceneFlags.OPAQUE_OBJECT);
    updateCameraUBO(passBuilder, probeCamera, ppl);
  }
  function buildShadowPasses(cameraName, camera, ppl) {
    validPunctualLightsCulling(ppl, camera);
    const pipeline = ppl;
    const shadow = pipeline.pipelineSceneData.shadows;
    const validPunctualLights = ppl.pipelineSceneData.validPunctualLights;
    shadowInfo.reset();
    const shadows = ppl.pipelineSceneData.shadows;
    if (!shadow.enabled || shadow.type !== ShadowType.ShadowMap) {
      return shadowInfo;
    }
    shadowInfo.shadowEnabled = true;
    let n = 0;
    let m = 0;
    for (; n < shadow.maxReceived && m < validPunctualLights.length;) {
      const light = validPunctualLights[m];
      if (light.type === LightType.SPOT) {
        const spotLight = light;
        if (spotLight.shadowEnabled) {
          shadowInfo.validLights.push(light);
          n++;
        }
      }
      m++;
    }
    const {
      mainLight
    } = camera.scene;
    // build shadow map
    const mapWidth = shadows.size.x;
    const mapHeight = shadows.size.y;
    if (mainLight && mainLight.shadowEnabled) {
      shadowInfo.mainLightShadowNames[0] = `MainLightShadow${cameraName}`;
      if (mainLight.shadowFixedArea) {
        buildShadowPass(shadowInfo.mainLightShadowNames[0], ppl, camera, mainLight, 0, mapWidth, mapHeight);
      } else {
        const csmLevel = pipeline.pipelineSceneData.csmSupported ? mainLight.csmLevel : 1;
        shadowInfo.mainLightShadowNames[0] = `MainLightShadow${cameraName}`;
        for (let i = 0; i < csmLevel; i++) {
          buildShadowPass(shadowInfo.mainLightShadowNames[0], ppl, camera, mainLight, i, mapWidth, mapHeight);
        }
      }
    }
    for (let l = 0; l < shadowInfo.validLights.length; l++) {
      const light = shadowInfo.validLights[l];
      const passName = `SpotLightShadow${l.toString()}${cameraName}`;
      shadowInfo.spotLightShadowNames[l] = passName;
      buildShadowPass(passName, ppl, camera, light, 0, mapWidth, mapHeight);
    }
    return shadowInfo;
  }
  function updateCameraUBO(setter, camera, ppl) {
    const pipeline = cclegacy.director.root.pipeline;
    const sceneData = ppl.pipelineSceneData;
    const skybox = sceneData.skybox;
    // setter.addConstant('CCCamera');
    setter.setMat4('cc_matView', camera.matView);
    setter.setMat4('cc_matViewInv', camera.node.worldMatrix);
    setter.setMat4('cc_matProj', camera.matProj);
    setter.setMat4('cc_matProjInv', camera.matProjInv);
    setter.setMat4('cc_matViewProj', camera.matViewProj);
    setter.setMat4('cc_matViewProjInv', camera.matViewProjInv);
    setter.setVec4('cc_cameraPos', new Vec4(camera.position.x, camera.position.y, camera.position.z, pipeline.getCombineSignY()));
    // eslint-disable-next-line max-len
    setter.setVec4('cc_surfaceTransform', new Vec4(camera.surfaceTransform, 0.0, Math.cos(toRadian(skybox.getRotationAngle())), Math.sin(toRadian(skybox.getRotationAngle()))));
    // eslint-disable-next-line max-len
    setter.setVec4('cc_screenScale', new Vec4(sceneData.shadingScale, sceneData.shadingScale, 1.0 / sceneData.shadingScale, 1.0 / sceneData.shadingScale));
    setter.setVec4('cc_exposure', new Vec4(camera.exposure, 1.0 / camera.exposure, sceneData.isHDR ? 1.0 : 0.0, 1.0 / Camera.standardExposureValue));
  }
  function bindDescValue(desc, binding, value) {
    if (value instanceof Buffer) {
      desc.bindBuffer(binding, value);
    } else if (value instanceof Texture) {
      desc.bindTexture(binding, value);
    } else if (value instanceof Sampler) {
      desc.bindSampler(binding, value);
    }
  }
  function bindGlobalDesc(desc, binding, value) {
    bindDescValue(desc, binding, value);
  }
  function getDescBinding(descId, descData) {
    const layoutData = descData;
    // find descriptor binding
    for (const block of layoutData.descriptorSetLayoutData.descriptorBlocks) {
      for (let i = 0; i !== block.descriptors.length; ++i) {
        if (descId === block.descriptors[i].descriptorID) {
          return block.offset + i;
        }
      }
    }
    return -1;
  }
  function getDescBindingFromName(bindingName) {
    const pipeline = cclegacy.director.root.pipeline;
    const layoutGraph = pipeline.layoutGraph;
    const vertIds = layoutGraph.v();
    const descId = layoutGraph.attributeIndex.get(bindingName);
    let currDesData;
    for (const i of vertIds) {
      const layout = layoutGraph.getLayout(i);
      const sets = layout.getSets();
      for (const [k, descData] of sets) {
        const layoutData = descData.descriptorSetLayoutData;
        const blocks = layoutData.descriptorBlocks;
        for (const b of blocks) {
          for (const ds of b.descriptors) {
            if (ds.descriptorID === descId) {
              currDesData = descData;
              return getDescBinding(descId, currDesData);
            }
          }
        }
      }
    }
    return -1;
  }
  function getDescriptorSetDataFromLayout(layoutName) {
    const descLayout = layouts.get(layoutName);
    if (descLayout) {
      return descLayout;
    }
    const webPip = cclegacy.director.root.pipeline;
    const stageId = webPip.layoutGraph.locateChild(webPip.layoutGraph.N, layoutName);
    const layout = webPip.layoutGraph.getLayout(stageId);
    const layoutData = layout.getSet(UpdateFrequency.PER_PASS);
    layouts.set(layoutName, layoutData);
    return layoutData;
  }
  function getDescriptorSetDataFromLayoutId(id) {
    const webPip = cclegacy.director.root.pipeline;
    const layout = webPip.layoutGraph.getLayout(id);
    const layoutData = layout.getSet(UpdateFrequency.PER_PASS);
    return layoutData;
  }
  function updateGlobalDescBinding(data, sceneId, idxRD, layoutName = 'default') {
    updatePerPassUBO(layoutName, sceneId, idxRD, data);
  }
  function getUniformBlock(block, layoutName) {
    const webPip = cclegacy.director.root.pipeline;
    const lg = webPip.layoutGraph;
    const nodeId = lg.locateChild(0xFFFFFFFF, layoutName);
    const ppl = lg.getLayout(nodeId);
    const layout = ppl.getSet(UpdateFrequency.PER_PASS).descriptorSetLayoutData;
    const nameID = lg.attributeIndex.get(block);
    return layout.uniformBlocks.get(nameID);
  }
  function getUniformOffset(uniform, block, layout) {
    const uniformBlock = getUniformBlock(block, layout);
    if (!uniformBlock) return -1;
    let offset = 0;
    for (const currUniform of uniformBlock.members) {
      const currCount = getUBOTypeCount(currUniform.type);
      if (currUniform.name === uniform) {
        return offset;
      }
      offset += currCount * currUniform.count;
    }
    return -1;
  }
  function copyToConstantBuffer(target, val, offset) {
    let isImparity = false;
    if (offset < 0 || offset > target.length) {
      return isImparity;
    }
    const length = Math.min(val.length, target.length - offset);
    for (let i = 0; i < length; i++) {
      if (target[offset + i] !== val[i]) {
        target[offset + i] = val[i];
        isImparity = true;
      }
    }
    return isImparity;
  }
  function addConstantBuffer(block, layout) {
    let buffers = uniformBlockMap.get(block);
    if (buffers) {
      return buffers;
    }
    buffers = [];
    const webPip = cclegacy.director.root.pipeline;
    const lg = webPip.layoutGraph;
    let currCount = 0;
    const currBlock = getUniformBlock(block, layout);
    if (!currBlock) return null;
    for (const uniform of currBlock.members) {
      currCount += getUBOTypeCount(uniform.type) * uniform.count;
    }
    buffers.length = currCount;
    buffers.fill(0);
    uniformBlockMap.set(block, buffers);
    return buffers;
  }
  function updateGlobalDescBuffer(descKey, vals) {
    let currDescBuff = buffsMap.get(descKey);
    if (!currDescBuff) {
      buffsMap.set(descKey, new DescBuffManager(vals.length * 4, 2));
      currDescBuff = buffsMap.get(descKey);
    }
    currDescBuff.updateData(vals);
  }
  function updateConstantBlock(constantBuff, data, descriptorSetData, sceneId, idxRD) {
    const blockId = constantBuff.blockId;
    const buffer = constantBuff.buffer;
    const isImparity = copyToConstantBuffer(buffer, data, constantBuff.offset);
    const bindId = getDescBinding(blockId, descriptorSetData);
    const desc = descriptorSetData.descriptorSet;
    if (isImparity || !desc.getBuffer(bindId) && bindId !== -1) {
      const descKey = `${blockId}${bindId}${idxRD}${sceneId}`;
      currBindBuffs.set(descKey, bindId);
      updateGlobalDescBuffer(descKey, buffer);
    }
  }
  function updateDefaultConstantBlock(blockId, sceneId, idxRD, vals, setData) {
    const bindId = getDescBinding(blockId, setData);
    if (bindId === -1) {
      return;
    }
    const descKey = `${blockId}${bindId}${idxRD}${sceneId}`;
    currBindBuffs.set(descKey, bindId);
    updateGlobalDescBuffer(descKey, vals);
  }
  function updatePerPassUBO(layout, sceneId, idxRD, user) {
    const {
      constants,
      samplers,
      textures,
      buffers
    } = user;
    const webPip = cclegacy.director.root.pipeline;
    const lg = webPip.layoutGraph;
    const descriptorSetData = getDescriptorSetDataFromLayout(layout);
    currBindBuffs.clear();
    for (const [key, data] of constants) {
      let constantBlock = constantBlockMap.get(key);
      if (!constantBlock) {
        const currMemKey = Array.from(lg.constantIndex).find(([_, v]) => v === key)[0];
        for (const [block, blockId] of lg.attributeIndex) {
          const constantBuff = addConstantBuffer(block, layout);
          if (!constantBuff) continue;
          const offset = getUniformOffset(currMemKey, block, layout);
          // not found
          if (offset === -1) {
            // Although the current uniformMem does not belong to the current uniform block,
            // it does not mean that it should not be bound to the corresponding descriptor.
            updateDefaultConstantBlock(blockId, sceneId, idxRD, constantBuff, descriptorSetData);
            continue;
          }
          constantBlockMap.set(key, new ConstantBlockInfo());
          constantBlock = constantBlockMap.get(key);
          constantBlock.buffer = constantBuff;
          constantBlock.blockId = blockId;
          constantBlock.offset = offset;
          updateConstantBlock(constantBlock, data, descriptorSetData, sceneId, idxRD);
        }
      } else {
        updateConstantBlock(constantBlock, data, descriptorSetData, sceneId, idxRD);
      }
    }
    const descriptorSet = descriptorSetData.descriptorSet;
    for (const [key, value] of textures) {
      const bindId = getDescBinding(key, descriptorSetData);
      if (bindId === -1) {
        continue;
      }
      const tex = descriptorSet.getTexture(bindId);
      if (value !== tex
      // @ts-ignore
      || !tex.gpuTexture && !(tex.gpuTextureView && tex.gpuTextureView.gpuTexture)) {
        bindGlobalDesc(descriptorSet, bindId, value);
      }
    }
    for (const [key, value] of samplers) {
      const bindId = getDescBinding(key, descriptorSetData);
      if (bindId === -1) {
        continue;
      }
      const sampler = descriptorSet.getSampler(bindId);
      if (sampler !== value) {
        bindGlobalDesc(descriptorSet, bindId, value);
      }
    }
    for (const [key, value] of currBindBuffs) {
      const buffManager = buffsMap.get(key);
      buffManager.updateBuffer(value, descriptorSetData);
    }
    for (const [key, value] of buffers) {
      const bindId = getDescBinding(key, descriptorSetData);
      if (bindId === -1) {
        continue;
      }
      const buffer = descriptorSet.getBuffer(bindId);
      if (!buffer) {
        bindGlobalDesc(descriptorSet, bindId, value);
      }
    }
  }
  function hashCombineKey(val) {
    return `${val}-`;
  }
  function hashCombineStr(str) {
    // DJB2 HASH
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  function bool(val) {
    return !!val;
  }
  function AlignUp(value, alignment) {
    return value + (alignment - 1) & ~(alignment - 1);
  }
  function SetLightUBO(light, bHDR, exposure, shadowInfo, buffer, offset, elemSize) {
    const vec4Array = new Float32Array(4);
    let size = 0.0;
    let range = 0.0;
    let luminanceHDR = 0.0;
    let luminanceLDR = 0.0;
    if (light && light.type === LightType.SPHERE) {
      const sphereLight = light;
      vec4Array[0] = sphereLight.position.x;
      vec4Array[1] = sphereLight.position.y;
      vec4Array[2] = sphereLight.position.z;
      vec4Array[3] = LightType.SPHERE;
      size = sphereLight.size;
      range = sphereLight.range;
      luminanceHDR = sphereLight.luminanceHDR;
      luminanceLDR = sphereLight.luminanceLDR;
    } else if (light && light.type === LightType.SPOT) {
      const spotLight = light;
      vec4Array[0] = spotLight.position.x;
      vec4Array[1] = spotLight.position.y;
      vec4Array[2] = spotLight.position.z;
      vec4Array[3] = LightType.SPOT;
      size = spotLight.size;
      range = spotLight.range;
      luminanceHDR = spotLight.luminanceHDR;
      luminanceLDR = spotLight.luminanceLDR;
    } else if (light && light.type === LightType.POINT) {
      const pointLight = light;
      vec4Array[0] = pointLight.position.x;
      vec4Array[1] = pointLight.position.y;
      vec4Array[2] = pointLight.position.z;
      vec4Array[3] = LightType.POINT;
      size = 0.0;
      range = pointLight.range;
      luminanceHDR = pointLight.luminanceHDR;
      luminanceLDR = pointLight.luminanceLDR;
    } else if (light && light.type === LightType.RANGED_DIRECTIONAL) {
      const rangedDirLight = light;
      vec4Array[0] = rangedDirLight.position.x;
      vec4Array[1] = rangedDirLight.position.y;
      vec4Array[2] = rangedDirLight.position.z;
      vec4Array[3] = LightType.RANGED_DIRECTIONAL;
      size = 0.0;
      range = 0.0;
      luminanceHDR = rangedDirLight.illuminanceHDR;
      luminanceLDR = rangedDirLight.illuminanceLDR;
    }
    let index = offset + UBOForwardLightEnum.LIGHT_POS_OFFSET;
    buffer.set(vec4Array, index);
    index = offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET;
    vec4Array.set([size, range, 0, 0]);
    buffer.set(vec4Array, index);
    index = offset + UBOForwardLightEnum.LIGHT_COLOR_OFFSET;
    const color = light ? light.color : new Color();
    if (light && light.useColorTemperature) {
      const tempRGB = light.colorTemperatureRGB;
      buffer[index++] = color.x * tempRGB.x;
      buffer[index++] = color.y * tempRGB.y;
      buffer[index++] = color.z * tempRGB.z;
    } else {
      buffer[index++] = color.x;
      buffer[index++] = color.y;
      buffer[index++] = color.z;
    }
    if (bHDR) {
      buffer[index] = luminanceHDR * exposure * kLightMeterScale;
    } else {
      buffer[index] = luminanceLDR;
    }
    switch (light ? light.type : LightType.UNKNOWN) {
      case LightType.SPHERE:
        buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 2] = 0;
        buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 3] = 0;
        break;
      case LightType.SPOT:
        {
          const spotLight = light;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 2] = spotLight.spotAngle;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 3] = shadowInfo && shadowInfo.enabled && spotLight.shadowEnabled && shadowInfo.type === ShadowType.ShadowMap ? 1.0 : 0.0;
          index = offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET;
          const direction = spotLight.direction;
          buffer[index++] = direction.x;
          buffer[index++] = direction.y;
          buffer[index] = direction.z;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 0] = 0;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 1] = 0;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 2] = 0;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 3] = spotLight.angleAttenuationStrength;
        }
        break;
      case LightType.POINT:
        buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 2] = 0;
        buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 3] = 0;
        break;
      case LightType.RANGED_DIRECTIONAL:
        {
          const rangedDirLight = light;
          const right = rangedDirLight.right;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 0] = right.x;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 1] = right.y;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 2] = right.z;
          buffer[offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET + 3] = 0;
          const direction = rangedDirLight.direction;
          buffer[offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET + 0] = direction.x;
          buffer[offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET + 1] = direction.y;
          buffer[offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET + 2] = direction.z;
          buffer[offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET + 3] = 0;
          const scale = rangedDirLight.scale;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 0] = scale.x * 0.5;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 1] = scale.y * 0.5;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 2] = scale.z * 0.5;
          buffer[offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET + 3] = 0;
        }
        break;
      default:
        break;
    }
  }
  function getSubpassOrPassID(sceneId, rg, lg) {
    const queueId = rg.getParent(sceneId);
    const subpassOrPassID = rg.getParent(queueId);
    const passId = rg.getParent(subpassOrPassID);
    let layoutId = lg.N;
    // single render pass
    if (passId === rg.N) {
      const layoutName = rg.getLayout(subpassOrPassID);
      layoutId = lg.locateChild(lg.N, layoutName);
    } else {
      const passLayoutName = rg.getLayout(passId);
      const passLayoutId = lg.locateChild(lg.N, passLayoutName);
      const subpassLayoutName = rg.getLayout(subpassOrPassID);
      if (subpassLayoutName.length === 0) {
        layoutId = passLayoutId;
      } else {
        const subpassLayoutId = lg.locateChild(passLayoutId, subpassLayoutName);
        layoutId = subpassLayoutId;
      }
    }
    return layoutId;
  }
  function resetPassMGState() {
    rpMergeInfoPool.reset();
    rpMergeInfos.clear();
    rpCombineMap.clear();
    passOrders.length = 0;
  }
  function processPassMG(pass) {
    const currCHash = rpCombineMap.get(pass);
    const currRPInfo = rpMergeInfoPool.add();
    if (!rpMergeInfos.has(pass)) {
      rpMergeInfos.set(pass, currRPInfo);
    }
    currRPInfo.init(currCHash);
    const poLen = passOrders.length;
    if (poLen !== 0) {
      let isLoadOP = false;
      for (const [_, raster] of pass.rasterViews) {
        if (raster.loadOp === LoadOp.LOAD) {
          isLoadOP = true;
          break;
        }
      }
      const prevPass = passOrders[poLen - 1];
      if (isLoadOP && rpCombineMap.get(prevPass) === currCHash) {
        const prevInfo = rpMergeInfos.get(prevPass);
        prevInfo.needEndRP = false;
        currRPInfo.needBeginRP = false;
      }
    }
    passOrders.push(pass);
  }
  function genHashValue(pass) {
    const hashCodeParts = [];
    const combineHashParts = [];
    for (const [name, raster] of pass.rasterViews) {
      const commonParts = [hashCombineKey(name), hashCombineKey(raster.slotName), hashCombineKey(raster.accessType), hashCombineKey(raster.attachmentType), hashCombineKey(raster.storeOp), hashCombineKey(raster.clearFlags), hashCombineKey(raster.slotID), hashCombineKey(raster.shaderStageFlags)];
      const extraParts = [hashCombineKey(raster.loadOp), hashCombineKey(raster.clearColor.x), hashCombineKey(raster.clearColor.y), hashCombineKey(raster.clearColor.z), hashCombineKey(raster.clearColor.w)];
      const fullHash = commonParts.concat(extraParts).join('');
      const combineHash = commonParts.join('');
      hashCodeParts.push(fullHash);
      combineHashParts.push(combineHash);
    }
    const subpassGraph = pass.subpassGraph;
    const subpasses = subpassGraph._subpasses;
    for (const subpass of subpasses) {
      const resolvePairs = subpass.resolvePairs;
      for (const resolve of resolvePairs) {
        const commonParts = [hashCombineKey(resolve.source), hashCombineKey(resolve.target)];
        const combineHash = commonParts.join('');
        combineHashParts.push(combineHash);
      }
    }
    pass.hashValue = hashCombineStr(hashCodeParts.join(''));
    rpCombineMap.set(pass, hashCombineStr(combineHashParts.join('')));
    processPassMG(pass);
  }
  _export({
    getRTFormatBeforeToneMapping: getRTFormatBeforeToneMapping,
    validPunctualLightsCulling: validPunctualLightsCulling,
    getCameraUniqueID: getCameraUniqueID,
    getLoadOpOfClearFlag: getLoadOpOfClearFlag,
    getRenderArea: getRenderArea,
    buildShadowPass: buildShadowPass,
    buildReflectionProbePass: buildReflectionProbePass,
    ShadowInfo: void 0,
    buildShadowPasses: buildShadowPasses,
    updateCameraUBO: updateCameraUBO,
    getDescBinding: getDescBinding,
    getDescBindingFromName: getDescBindingFromName,
    getDescriptorSetDataFromLayout: getDescriptorSetDataFromLayout,
    getDescriptorSetDataFromLayoutId: getDescriptorSetDataFromLayoutId,
    updateGlobalDescBinding: updateGlobalDescBinding,
    updatePerPassUBO: updatePerPassUBO,
    hashCombineKey: hashCombineKey,
    hashCombineStr: hashCombineStr,
    bool: bool,
    AlignUp: AlignUp,
    SetLightUBO: SetLightUBO,
    getSubpassOrPassID: getSubpassOrPassID,
    RenderPassMergeInfo: void 0,
    resetPassMGState: resetPassMGState,
    processPassMG: processPassMG,
    genHashValue: genHashValue
  });
  return {
    setters: [function (_gfxIndexJs) {
      BufferInfo = _gfxIndexJs.BufferInfo;
      Buffer = _gfxIndexJs.Buffer;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
      LoadOp = _gfxIndexJs.LoadOp;
      Format = _gfxIndexJs.Format;
      Rect = _gfxIndexJs.Rect;
      Sampler = _gfxIndexJs.Sampler;
      StoreOp = _gfxIndexJs.StoreOp;
      Texture = _gfxIndexJs.Texture;
      Viewport = _gfxIndexJs.Viewport;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
    }, function (_renderSceneSceneCameraJs) {
      Camera = _renderSceneSceneCameraJs.Camera;
      SkyBoxFlagValue = _renderSceneSceneCameraJs.SkyBoxFlagValue;
    }, function (_renderSceneSceneShadowsJs) {
      CSMLevel = _renderSceneSceneShadowsJs.CSMLevel;
      ShadowType = _renderSceneSceneShadowsJs.ShadowType;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_defineJs) {
      UBOForwardLightEnum = _defineJs.UBOForwardLightEnum;
      supportsR32FloatTexture = _defineJs.supportsR32FloatTexture;
      supportsRGBA16HalfFloatTexture = _defineJs.supportsRGBA16HalfFloatTexture;
    }, function (_typesJs) {
      AttachmentType = _typesJs.AttachmentType;
      LightInfo = _typesJs.LightInfo;
      QueueHint = _typesJs.QueueHint;
      ResourceResidency = _typesJs.ResourceResidency;
      SceneFlags = _typesJs.SceneFlags;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }, function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      geometry = _coreIndexJs.geometry;
      toRadian = _coreIndexJs.toRadian;
      cclegacy = _coreIndexJs.cclegacy;
      RecyclePool = _coreIndexJs.RecyclePool;
    }, function (_coreGeometryIndexJs) {
      AABB = _coreGeometryIndexJs.AABB;
    }, function (_utilsJs) {
      getUBOTypeCount = _utilsJs.getUBOTypeCount;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _rangedDirLightBoundingBox = new AABB(0.0, 0.0, 0.0, 0.5, 0.5, 0.5);
      _tmpBoundingBox = new AABB(); // Anti-aliasing type, other types will be gradually added in the future
      _export("AntiAliasing", AntiAliasing = /*#__PURE__*/function (AntiAliasing) {
        AntiAliasing[AntiAliasing["NONE"] = 0] = "NONE";
        AntiAliasing[AntiAliasing["FXAA"] = 1] = "FXAA";
        AntiAliasing[AntiAliasing["FXAAHQ"] = 2] = "FXAAHQ";
        return AntiAliasing;
      }({}));
      _export("ShadowInfo", ShadowInfo = class ShadowInfo {
        constructor() {
          this.shadowEnabled = false;
          this.mainLightShadowNames = [];
          this.spotLightShadowNames = [];
          this.validLights = [];
        }
        reset() {
          this.shadowEnabled = false;
          this.mainLightShadowNames.length = 0;
          this.spotLightShadowNames.length = 0;
          this.validLights.length = 0;
        }
      });
      shadowInfo = new ShadowInfo();
      DescBuffManager = class DescBuffManager {
        constructor(bufferSize, numBuffers = 2) {
          this.buffers = [];
          this.currBuffIdx = 0;
          this.device = void 0;
          this.currUniform = void 0;
          this._root = void 0;
          const root = this._root = cclegacy.director.root;
          const device = root.device;
          this.device = device;
          this.currUniform = new Float32Array(bufferSize / 4);
          for (let i = 0; i < numBuffers; i++) {
            const bufferInfo = new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, bufferSize, bufferSize);
            this.buffers.push(this.device.createBuffer(bufferInfo));
          }
        }
        getCurrentBuffer() {
          const {
            director
          } = cclegacy;
          this.currBuffIdx = director.getTotalFrames() % this.buffers.length;
          return this.buffers[this.currBuffIdx];
        }
        updateData(vals) {
          this.currUniform.set(vals);
        }
        updateBuffer(bindId, setData) {
          const descriptorSet = setData.descriptorSet;
          const buffer = this.getCurrentBuffer();
          buffer.update(this.currUniform);
          bindGlobalDesc(descriptorSet, bindId, buffer);
        }
      };
      buffsMap = new Map();
      currBindBuffs = new Map();
      layouts = new Map();
      uniformBlockMap = new Map();
      ConstantBlockInfo = class ConstantBlockInfo {
        constructor() {
          this.offset = -1;
          this.buffer = [];
          this.blockId = -1;
        }
      };
      constantBlockMap = new Map();
      kLightMeterScale = 10000;
      _export("RenderPassMergeInfo", RenderPassMergeInfo = class RenderPassMergeInfo {
        constructor(combineHash = 0, needBeginRP = true, needEndRP = true) {
          this.combineHash = combineHash;
          this.needBeginRP = needBeginRP;
          this.needEndRP = needEndRP;
        }
        init(combineHash, needBeginRP = true, needEndRP = true) {
          this.combineHash = combineHash;
          this.needBeginRP = needBeginRP;
          this.needEndRP = needEndRP;
        }
      });
      passOrders = [];
      rpCombineMap = new Map();
      _export("rpMergeInfos", rpMergeInfos = new Map());
      rpMergeInfoPool = new RecyclePool(() => new RenderPassMergeInfo(), 16);
    }
  };
});