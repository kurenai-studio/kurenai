System.register("q-bundled:///fs/cocos/rendering/custom/scene-culling.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/geometry/index.js", "../../gfx/index.js", "../../render-scene/index.js", "../../render-scene/scene/index.js", "../../scene-graph/index.js", "./define.js", "./render-graph.js", "./types.js", "./web-pipeline-types.js", "./layout-graph-utils.js"], function (_export, _context) {
  "use strict";

  var DEBUG, Vec3, RecyclePool, assert, cclegacy, intersect, AABB, BufferInfo, BufferViewInfo, MemoryUsageBit, BufferUsageBit, deviceManager, BatchingSchemes, CSMLevel, LightType, ProbeType, SkyBoxFlagValue, ShadowType, Layers, bool, AlignUp, SetLightUBO, hashCombineKey, CullingFlags, RenderGraphValue, SceneFlags, RenderQueue, RenderQueueQuery, instancePool, getUniformBlockSize, CullingPools, FrustumCullingKey, LightBoundsCullingKey, LightBoundsCulling, LightBoundsCullingResult, FrustumCulling, SceneCulling, LightResource, REFLECTION_PROBE_DEFAULT_MASK, objIdMap, cullingKeys, objectCount, pSceneData, transWorldBounds, _tempVec3, rangedDirLightBoundingBox, lightAABB;
  function objectID(claze) {
    if (!objIdMap.has(claze)) objIdMap.set(claze, ++objectCount);
    return objIdMap.get(claze);
  }
  function computeCullingKey(sceneData, castShadows, refId = -1) {
    cullingKeys = '';
    const camera = sceneData.camera;
    const light = sceneData.light.light;
    const lightLevel = sceneData.light.level;
    const reflectProbe = sceneData.light.probe;
    const shadeLight = sceneData.shadingLight;
    cullingKeys += hashCombineKey(camera ? objectID(camera) : 0);
    cullingKeys += hashCombineKey(reflectProbe ? objectID(reflectProbe) : 0);
    cullingKeys += hashCombineKey(refId === -1 && light ? objectID(light) : 0);
    cullingKeys += hashCombineKey(refId !== -1 && shadeLight ? objectID(shadeLight) : 0);
    cullingKeys += hashCombineKey(refId === -1 ? lightLevel : 0);
    cullingKeys += hashCombineKey(castShadows ? 1 : 0);
    cullingKeys += hashCombineKey(refId);
    return cullingKeys;
  }
  function makeRenderQueueKey(frustumCulledResultID, lightBoundsCulledResultID, queueLayoutID) {
    return `${frustumCulledResultID}-${lightBoundsCulledResultID}-${queueLayoutID}`;
  }
  function extractRenderQueueKey(key) {
    const keys = key.split('-');
    return [parseInt(keys[0]), parseInt(keys[1]), parseInt(keys[2])];
  }
  function isNodeVisible(node, visibility) {
    return node && (visibility & node.layer) === node.layer;
  }
  function isModelVisible(model, visibility) {
    return !!(visibility & model.visFlags);
  }
  function isVisible(model, visibility) {
    return isNodeVisible(model.node, visibility) || isModelVisible(model, visibility);
  }
  function isReflectProbeMask(model) {
    return bool((model.node.layer & REFLECTION_PROBE_DEFAULT_MASK) === model.node.layer || REFLECTION_PROBE_DEFAULT_MASK & model.visFlags);
  }
  function isFrustumVisible(model, frustum, castShadow) {
    const modelWorldBounds = model.worldBounds;
    const shadows = pSceneData.shadows;
    if (castShadow && shadows.type === ShadowType.Planar) {
      AABB.transform(transWorldBounds, modelWorldBounds, shadows.matLight);
      return !intersect.aabbFrustum(transWorldBounds, frustum);
    }
    return !intersect.aabbFrustum(modelWorldBounds, frustum);
  }
  function isIntersectAABB(lAABB, rAABB) {
    return !intersect.aabbWithAABB(lAABB, rAABB);
  }
  function sceneCulling(scene, camera, camOrLightFrustum, castShadow, probe, models) {
    const skybox = pSceneData.skybox;
    const skyboxModel = skybox.model;
    const visibility = camera.visibility;
    const camSkyboxFlag = camera.clearFlag & SkyBoxFlagValue.VALUE;
    if (!castShadow && skybox && skybox.enabled && skyboxModel && camSkyboxFlag) {
      models.push(skyboxModel);
    }
    for (const model of scene.models) {
      if (!model.enabled || !model.node || castShadow && !model.castShadow) {
        continue;
      }
      if (scene.isCulledByLod(camera, model)) {
        continue;
      }
      const wBounds = model.worldBounds;
      if (!probe) {
        if (!isVisible(model, visibility)) {
          continue;
        }
        // frustum culling
        if (wBounds && isFrustumVisible(model, camOrLightFrustum, castShadow)) {
          continue;
        }
        models.push(model);
      } else if (probe.probeType === ProbeType.CUBE) {
        if (!wBounds || !model.bakeToReflectionProbe) {
          continue;
        }
        if (!isVisible(model, visibility)) {
          continue;
        }
        if (isIntersectAABB(wBounds, probe.boundingBox)) {
          continue;
        }
        models.push(model);
      } else if (isReflectProbeMask(model)) {
        models.push(model);
      }
    }
  }
  function computeSortingDepth(camera, model) {
    let depth = 0;
    if (model.node) {
      Vec3.subtract(_tempVec3, model.worldBounds ? model.worldBounds.center : model.node.worldPosition, camera.position);
      depth = Vec3.dot(_tempVec3, camera.forward);
    }
    return depth;
  }
  function addRenderObject(phaseLayoutId, isDrawOpaqueOrMask, isDrawBlend, isDrawProbe, camera, model, queue) {
    const probeQueue = queue.probeQueue;
    if (isDrawProbe) {
      probeQueue.addToProbeQueue(model, phaseLayoutId);
    }
    const subModels = model.subModels;
    const subModelCount = subModels.length;
    const skyboxModel = pSceneData.skybox.model;
    const depth = computeSortingDepth(camera, model);
    for (let subModelIdx = 0; subModelIdx < subModelCount; ++subModelIdx) {
      const subModel = subModels[subModelIdx];
      const passes = subModel.passes;
      const passCount = passes.length;
      const probePhase = probeQueue.probeMap.includes(subModel);
      if (probePhase) phaseLayoutId = probeQueue.defaultId;
      for (let passIdx = 0; passIdx < passCount; ++passIdx) {
        if (model === skyboxModel && !subModelIdx && !passIdx && isDrawOpaqueOrMask) {
          queue.opaqueQueue.add(model, depth, subModelIdx, passIdx);
          continue;
        }
        const pass = passes[passIdx];
        // check phase
        const phaseAllowed = phaseLayoutId === pass.phaseID;
        if (!phaseAllowed) {
          continue;
        }
        // check scene flags
        const is_blend = pass.blendState.targets[0].blend;
        const isOpaqueOrMask = !is_blend;
        if (!isDrawBlend && is_blend) {
          // skip transparent object
          continue;
        }
        if (!isDrawOpaqueOrMask && isOpaqueOrMask) {
          // skip opaque object
          continue;
        }

        // add object to queue
        if (pass.batchingScheme === BatchingSchemes.INSTANCING) {
          if (is_blend) {
            queue.transparentInstancingQueue.add(pass, subModel, passIdx);
          } else {
            queue.opaqueInstancingQueue.add(pass, subModel, passIdx);
          }
        } else if (is_blend) {
          queue.transparentQueue.add(model, depth, subModelIdx, passIdx);
        } else {
          queue.opaqueQueue.add(model, depth, subModelIdx, passIdx);
        }
      }
    }
  }
  _export({
    SceneCulling: void 0,
    LightResource: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      RecyclePool = _coreIndexJs.RecyclePool;
      assert = _coreIndexJs.assert;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_coreGeometryIndexJs) {
      intersect = _coreGeometryIndexJs.intersect;
      AABB = _coreGeometryIndexJs.AABB;
    }, function (_gfxIndexJs) {
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferViewInfo = _gfxIndexJs.BufferViewInfo;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_renderSceneIndexJs) {
      BatchingSchemes = _renderSceneIndexJs.BatchingSchemes;
    }, function (_renderSceneSceneIndexJs) {
      CSMLevel = _renderSceneSceneIndexJs.CSMLevel;
      LightType = _renderSceneSceneIndexJs.LightType;
      ProbeType = _renderSceneSceneIndexJs.ProbeType;
      SkyBoxFlagValue = _renderSceneSceneIndexJs.SkyBoxFlagValue;
      ShadowType = _renderSceneSceneIndexJs.ShadowType;
    }, function (_sceneGraphIndexJs) {
      Layers = _sceneGraphIndexJs.Layers;
    }, function (_defineJs) {
      bool = _defineJs.bool;
      AlignUp = _defineJs.AlignUp;
      SetLightUBO = _defineJs.SetLightUBO;
      hashCombineKey = _defineJs.hashCombineKey;
    }, function (_renderGraphJs) {
      CullingFlags = _renderGraphJs.CullingFlags;
      RenderGraphValue = _renderGraphJs.RenderGraphValue;
    }, function (_typesJs) {
      SceneFlags = _typesJs.SceneFlags;
    }, function (_webPipelineTypesJs) {
      RenderQueue = _webPipelineTypesJs.RenderQueue;
      RenderQueueQuery = _webPipelineTypesJs.RenderQueueQuery;
      instancePool = _webPipelineTypesJs.instancePool;
    }, function (_layoutGraphUtilsJs) {
      getUniformBlockSize = _layoutGraphUtilsJs.getUniformBlockSize;
    }],
    execute: function () {
      CullingPools = class CullingPools {
        constructor() {
          this.frustumCullingKeyRecycle = new RecyclePool(() => new FrustumCullingKey(), 8);
          this.frustumCullingsRecycle = new RecyclePool(() => new FrustumCulling(), 8);
          this.lightBoundsCullingRecycle = new RecyclePool(() => new LightBoundsCulling(), 8);
          this.lightBoundsCullingResultRecycle = new RecyclePool(() => new LightBoundsCullingResult(), 8);
          this.lightBoundsCullingKeyRecycle = new RecyclePool(() => new LightBoundsCullingKey(), 8);
          this.renderQueueRecycle = new RecyclePool(() => new RenderQueue(), 8);
          this.renderQueueQueryRecycle = new RecyclePool(() => new RenderQueueQuery(), 8);
        }
      };
      REFLECTION_PROBE_DEFAULT_MASK = Layers.makeMaskExclude([Layers.BitMask.UI_2D, Layers.BitMask.UI_3D, Layers.BitMask.GIZMOS, Layers.BitMask.EDITOR, Layers.BitMask.SCENE_GIZMO, Layers.BitMask.PROFILER]);
      objIdMap = new WeakMap();
      cullingKeys = '';
      objectCount = 0;
      FrustumCullingKey = class FrustumCullingKey {
        constructor(sceneData = null, castShadows = false) {
          this.sceneData = null;
          this.castShadows = false;
          this.sceneData = sceneData;
          this.castShadows = castShadows;
        }
        update(sceneData, castShadows) {
          this.sceneData = sceneData;
          this.castShadows = castShadows;
        }
      };
      LightBoundsCullingKey = class LightBoundsCullingKey {
        constructor(sceneData = null, frustumCullingID = -1) {
          this.sceneData = null;
          this.frustumCullingID = -1;
          this.sceneData = sceneData;
          this.frustumCullingID = frustumCullingID;
        }
        update(sceneData = null, frustumCullingID = -1) {
          this.sceneData = sceneData;
          this.frustumCullingID = frustumCullingID;
        }
      };
      LightBoundsCulling = class LightBoundsCulling {
        constructor() {
          this.resultKeyIndex = new Map();
          this.resultIndex = new Map();
        }
        update() {
          this.resultIndex.clear();
          this.resultKeyIndex.clear();
        }
      };
      LightBoundsCullingResult = class LightBoundsCullingResult {
        constructor() {
          this.instances = [];
          this.lightByteOffset = 0xFFFFFFFF;
        }
        update() {
          this.instances.length = 0;
          this.lightByteOffset = 0xFFFFFFFF;
          return this;
        }
      };
      FrustumCulling = class FrustumCulling {
        constructor() {
          // key: hash val
          this.resultIndex = new Map();
          this.resultKeyIndex = new Map();
        }
        update() {
          this.resultIndex.clear();
          this.resultKeyIndex.clear();
        }
      };
      transWorldBounds = new AABB();
      _tempVec3 = new Vec3();
      rangedDirLightBoundingBox = new AABB(0, 0, 0, 0.5, 0.5, 0.5);
      lightAABB = new AABB();
      _export("SceneCulling", SceneCulling = class SceneCulling {
        constructor() {
          this.frustumCullings = new Map();
          this.frustumCullingResults = [];
          this.lightBoundsCullings = new Map();
          this.lightBoundsCullingResults = [];
          this.renderQueueIndex = new Map();
          this.renderQueues = [];
          this.renderQueueQueryIndex = new Map();
          this.cullingPools = new CullingPools();
          // source id
          this.numFrustumCulling = 0;
          this.numLightBoundsCulling = 0;
          // target id
          this.numRenderQueues = 0;
          this.layoutGraph = void 0;
          this.renderGraph = void 0;
          this.enableLightCulling = true;
          this.kFilterMask = SceneFlags.SHADOW_CASTER | SceneFlags.REFLECTION_PROBE;
          this.kDrawMask = SceneFlags.OPAQUE | SceneFlags.MASK | SceneFlags.BLEND;
          this.kAllMask = this.kFilterMask | this.kDrawMask;
        }
        resetPool() {
          const cullingPools = this.cullingPools;
          cullingPools.frustumCullingKeyRecycle.reset();
          cullingPools.frustumCullingsRecycle.reset();
          cullingPools.lightBoundsCullingRecycle.reset();
          cullingPools.lightBoundsCullingResultRecycle.reset();
          cullingPools.lightBoundsCullingKeyRecycle.reset();
          cullingPools.renderQueueRecycle.reset();
          cullingPools.renderQueueQueryRecycle.reset();
          instancePool.reset();
        }
        clear() {
          this.resetPool();
          this.frustumCullings.clear();
          this.frustumCullingResults.length = 0;
          this.lightBoundsCullings.clear();
          this.lightBoundsCullingResults.length = 0;
          this.renderQueueIndex.clear();
          this.renderQueues.length = 0;
          this.renderQueueQueryIndex.clear();
          this.numLightBoundsCulling = 0;
          this.numFrustumCulling = 0;
          this.numRenderQueues = 0;
        }
        buildRenderQueues(rg, lg, pplSceneData) {
          this.layoutGraph = lg;
          this.renderGraph = rg;
          pSceneData = pplSceneData;
          this.collectCullingQueries(rg);
          this.batchFrustumCulling(pplSceneData);
          this.batchLightBoundsCulling();
          this.fillRenderQueues();
        }
        getOrCreateLightBoundsCulling(sceneData, frustumCullingID) {
          var _sceneData$shadingLig;
          if (!(sceneData.cullingFlags & CullingFlags.LIGHT_BOUNDS)) {
            return 0xFFFFFFFF; // Return an empty ID.
          }
          if (((_sceneData$shadingLig = sceneData.shadingLight) == null ? void 0 : _sceneData$shadingLig.type) === LightType.DIRECTIONAL) {
            return 0xFFFFFFFF;
          }
          if (!this.enableLightCulling) {
            return 0xFFFFFFFF; // Return an empty ID.
          }
          const scene = sceneData.scene;
          let queries = this.lightBoundsCullings.get(scene);
          if (!queries) {
            const cullingQuery = this.cullingPools.lightBoundsCullingRecycle.add();
            cullingQuery.update();
            this.lightBoundsCullings.set(scene, cullingQuery);
            queries = this.lightBoundsCullings.get(scene);
          }
          const key = computeCullingKey(sceneData, false, frustumCullingID);
          const cullNum = queries.resultIndex.get(key);
          if (cullNum !== undefined) {
            return cullNum;
          }
          const lightBoundsCullingID = this.numLightBoundsCulling++;
          if (this.numLightBoundsCulling > this.lightBoundsCullingResults.length) {
            this.lightBoundsCullingResults.push(this.cullingPools.lightBoundsCullingResultRecycle.add().update());
          }
          queries.resultIndex.set(key, lightBoundsCullingID);
          const cullingKey = this.cullingPools.lightBoundsCullingKeyRecycle.add();
          cullingKey.update(sceneData, frustumCullingID);
          queries.resultKeyIndex.set(key, cullingKey);
          return lightBoundsCullingID;
        }
        getOrCreateFrustumCulling(sceneId) {
          const sceneData = this.renderGraph.j(sceneId);
          const scene = sceneData.scene;
          let queries = this.frustumCullings.get(scene);
          if (!queries) {
            const cullingQuery = this.cullingPools.frustumCullingsRecycle.add();
            cullingQuery.update();
            this.frustumCullings.set(scene, cullingQuery);
            queries = this.frustumCullings.get(scene);
          }
          const castShadow = bool(sceneData.flags & SceneFlags.SHADOW_CASTER);
          const key = computeCullingKey(sceneData, castShadow);
          const cullNum = queries.resultIndex.get(key);
          if (cullNum !== undefined) {
            return cullNum;
          }
          const frustumCulledResultID = this.numFrustumCulling++;
          if (this.numFrustumCulling > this.frustumCullingResults.length) {
            this.frustumCullingResults.push([]);
          }
          queries.resultIndex.set(key, frustumCulledResultID);
          const cullingKey = this.cullingPools.frustumCullingKeyRecycle.add();
          cullingKey.update(sceneData, castShadow);
          queries.resultKeyIndex.set(key, cullingKey);
          return frustumCulledResultID;
        }
        getOrCreateRenderQueue(renderQueueKey, sceneFlags, camera) {
          const renderQueueID = this.renderQueueIndex.get(renderQueueKey);
          if (renderQueueID !== undefined) {
            const rq = this.renderQueues[renderQueueID];
            if (DEBUG) {
              assert(rq.camera === camera);
              assert((rq.sceneFlags & this.kFilterMask) === (sceneFlags & this.kFilterMask));
            }
            rq.sceneFlags |= sceneFlags & this.kDrawMask;
            return renderQueueID;
          }
          const targetID = this.numRenderQueues++;

          // renderQueues are not cleared, so we can reuse the space
          // this->renderQueues.size() is more like a capacity
          if (this.numRenderQueues > this.renderQueues.length) {
            const renderQueue = this.cullingPools.renderQueueRecycle.add();
            renderQueue.update();
            this.renderQueues.push(renderQueue);
          }
          const rq = this.renderQueues[targetID];

          // Update render queue index
          this.renderQueueIndex.set(renderQueueKey, targetID);

          // Update render queue
          if (DEBUG) {
            assert(rq.empty());
            assert(rq.camera === null);
            assert(rq.sceneFlags === SceneFlags.NONE);
            assert(camera !== null);
            assert(this.renderQueueIndex.size === this.numRenderQueues);
          }
          rq.camera = camera;
          rq.sceneFlags = sceneFlags & this.kAllMask;
          return targetID;
        }
        collectCullingQueries(rg) {
          for (const v of rg.v()) {
            if (!rg.h(RenderGraphValue.Scene, v) || !rg.getValid(v)) {
              continue;
            }
            const sceneData = rg.j(v);
            if (!sceneData.scene) {
              continue;
            }
            const frustumCulledResultID = this.getOrCreateFrustumCulling(v);
            const lightBoundsCullingID = this.getOrCreateLightBoundsCulling(sceneData, frustumCulledResultID);

            // Get render queue phaseLayoutID
            const queueID = rg.getParent(v);
            if (DEBUG) {
              assert(queueID !== 0xFFFFFFFF);
              assert(rg.h(RenderGraphValue.Queue, queueID));
            }
            const renderQueue = rg.j(queueID);
            const phaseLayoutID = renderQueue.phaseID;

            // Make render queue key
            const renderQueueKey = makeRenderQueueKey(frustumCulledResultID, lightBoundsCullingID, phaseLayoutID);

            // Get or create render queue
            const renderCamera = sceneData.light.probe ? sceneData.light.probe.camera : sceneData.camera;
            const renderQueueID = this.getOrCreateRenderQueue(renderQueueKey, sceneData.flags, renderCamera);

            // add render queue query
            const renderQueueQuery = this.cullingPools.renderQueueQueryRecycle.add();
            renderQueueQuery.update(frustumCulledResultID, lightBoundsCullingID, renderQueueID);

            // add render queue to query source
            this.renderQueueQueryIndex.set(v, renderQueueQuery);
          }
        }
        uploadInstancing(cmdBuffer) {
          for (let queueID = 0; queueID !== this.numRenderQueues; ++queueID) {
            const queue = this.renderQueues[queueID];
            queue.opaqueInstancingQueue.uploadBuffers(cmdBuffer);
            queue.transparentInstancingQueue.uploadBuffers(cmdBuffer);
          }
        }
        _getPhaseIdFromScene(scene) {
          const rg = this.renderGraph;
          const renderQueueId = rg.getParent(scene);
          const graphRenderQueue = rg.j(renderQueueId);
          return graphRenderQueue.phaseID;
        }
        getBuiltinShadowFrustum(pplSceneData, camera, mainLight, level) {
          const csmLayers = pplSceneData.csmLayers;
          const csmLevel = mainLight.csmLevel;
          let frustum;
          const shadows = pplSceneData.shadows;
          if (shadows.type === ShadowType.Planar) {
            return camera.frustum;
          }
          if (shadows.enabled && shadows.type === ShadowType.ShadowMap && mainLight && mainLight.node) {
            // pplSceneData.updateShadowUBORange(UBOShadowEnum.SHADOW_COLOR_OFFSET, shadows.shadowColor);
            csmLayers.update(pplSceneData, camera);
          }
          if (mainLight.shadowFixedArea || csmLevel === CSMLevel.LEVEL_1) {
            return csmLayers.specialLayer.validFrustum;
          }
          return csmLayers.layers[level].validFrustum;
        }
        batchFrustumCulling(pplSceneData) {
          for (const [scene, queries] of this.frustumCullings) {
            for (const [key, frustomCulledResultID] of queries.resultIndex) {
              const cullingKey = queries.resultKeyIndex.get(key);
              const sceneData = cullingKey.sceneData;
              const light = sceneData.light.light;
              const level = sceneData.light.level;
              const castShadow = cullingKey.castShadows;
              const probe = sceneData.light.probe;
              const camera = probe ? probe.camera : sceneData.camera;
              const models = this.frustumCullingResults[frustomCulledResultID];
              if (probe) {
                sceneCulling(scene, camera, camera.frustum, castShadow, probe, models);
                continue;
              }
              if (light) {
                switch (light.type) {
                  case LightType.SPOT:
                    sceneCulling(scene, camera, light.frustum, castShadow, null, models);
                    break;
                  case LightType.DIRECTIONAL:
                    {
                      const frustum = this.getBuiltinShadowFrustum(pplSceneData, camera, light, level);
                      sceneCulling(scene, camera, frustum, castShadow, null, models);
                    }
                    break;
                  default:
                }
              } else {
                sceneCulling(scene, camera, camera.frustum, castShadow, null, models);
              }
            }
          }
        }
        executeSphereLightCulling(light, frustumCullingResult, lightBoundsCullingResult) {
          const lightAABB = light.aabb;
          const visibility = light.visibility;
          for (const model of frustumCullingResult) {
            if (!isVisible(model, visibility)) {
              continue;
            }
            const modelBounds = model.worldBounds;
            if (!modelBounds || intersect.aabbWithAABB(modelBounds, lightAABB)) {
              lightBoundsCullingResult.push(model);
            }
          }
        }
        executeSpotLightCulling(light, frustumCullingResult, lightBoundsCullingResult) {
          const lightAABB = light.aabb;
          const lightFrustum = light.frustum;
          const visibility = light.visibility;
          for (const model of frustumCullingResult) {
            if (!isVisible(model, visibility)) {
              continue;
            }
            const modelBounds = model.worldBounds;
            if (!modelBounds || intersect.aabbWithAABB(lightAABB, modelBounds) && intersect.aabbFrustum(modelBounds, lightFrustum)) {
              lightBoundsCullingResult.push(model);
            }
          }
        }
        executePointLightCulling(light, frustumCullingResult, lightBoundsCullingResult) {
          const lightAABB = light.aabb;
          const visibility = light.visibility;
          for (const model of frustumCullingResult) {
            if (!isVisible(model, visibility)) {
              continue;
            }
            const modelBounds = model.worldBounds;
            if (!modelBounds || intersect.aabbWithAABB(lightAABB, modelBounds)) {
              lightBoundsCullingResult.push(model);
            }
          }
        }
        executeRangedDirectionalLightCulling(light, frustumCullingResult, lightBoundsCullingResult) {
          const visibility = light.visibility;
          rangedDirLightBoundingBox.transform(light.node.worldMatrix, null, null, null, lightAABB);
          for (const model of frustumCullingResult) {
            if (!isVisible(model, visibility)) {
              continue;
            }
            const modelBounds = model.worldBounds;
            if (!modelBounds || intersect.aabbWithAABB(lightAABB, modelBounds)) {
              lightBoundsCullingResult.push(model);
            }
          }
        }
        batchLightBoundsCulling() {
          for (const [scene, queries] of this.lightBoundsCullings) {
            for (const [key, cullingID] of queries.resultIndex) {
              const cullingKey = queries.resultKeyIndex.get(key);
              const sceneData = cullingKey.sceneData;
              const frustumCullingID = cullingKey.frustumCullingID;
              const frustumCullingResult = this.frustumCullingResults[frustumCullingID];
              const lightBoundsCullingResult = this.lightBoundsCullingResults[cullingID];
              switch (sceneData.shadingLight.type) {
                case LightType.SPHERE:
                  {
                    const light = sceneData.shadingLight;
                    this.executeSphereLightCulling(light, frustumCullingResult, lightBoundsCullingResult.instances);
                  }
                  break;
                case LightType.SPOT:
                  {
                    const light = sceneData.shadingLight;
                    this.executeSpotLightCulling(light, frustumCullingResult, lightBoundsCullingResult.instances);
                  }
                  break;
                case LightType.POINT:
                  {
                    const light = sceneData.shadingLight;
                    this.executePointLightCulling(light, frustumCullingResult, lightBoundsCullingResult.instances);
                  }
                  break;
                case LightType.RANGED_DIRECTIONAL:
                  {
                    const light = sceneData.shadingLight;
                    this.executeRangedDirectionalLightCulling(light, frustumCullingResult, lightBoundsCullingResult.instances);
                  }
                  break;
                case LightType.DIRECTIONAL:
                case LightType.UNKNOWN:
                default:
              }
            }
          }
        }
        _getModelsByCullingResults(lightBoundsCullingID, frustomCulledResultID) {
          // is culled by light bounds
          if (lightBoundsCullingID !== 0xFFFFFFFF) {
            if (lightBoundsCullingID < this.lightBoundsCullingResults.length) {
              return this.lightBoundsCullingResults[lightBoundsCullingID].instances;
            } else {
              return [];
            }
          }
          // not culled by light bounds
          if (frustomCulledResultID < this.frustumCullingResults.length) {
            return this.frustumCullingResults[frustomCulledResultID];
          } else {
            return [];
          }
        }
        fillRenderQueues() {
          for (const [key, targetID] of this.renderQueueIndex) {
            // render queue target
            const renderQueue = this.renderQueues[targetID];
            if (DEBUG) {
              assert(targetID < this.renderQueues.length);
              assert(renderQueue.empty());
            }
            const [frustomCulledResultID, lightBoundsCullingID, phaseLayoutID] = extractRenderQueueKey(key);

            // check scene flags
            const isDrawBlend = bool(renderQueue.sceneFlags & SceneFlags.BLEND);
            const isDrawOpaqueOrMask = bool(renderQueue.sceneFlags & (SceneFlags.OPAQUE | SceneFlags.MASK));
            const isDrawShadowCaster = bool(renderQueue.sceneFlags & SceneFlags.SHADOW_CASTER);
            const isDrawProbe = bool(renderQueue.sceneFlags & SceneFlags.REFLECTION_PROBE);
            if (!isDrawShadowCaster && !isDrawBlend && !isDrawOpaqueOrMask && !isDrawProbe) {
              // nothing to draw
              continue;
            }

            // culling source
            const sourceModels = this._getModelsByCullingResults(lightBoundsCullingID, frustomCulledResultID);

            // skybox
            const camera = renderQueue.camera;

            // fill render queue
            for (const model of sourceModels) {
              addRenderObject(phaseLayoutID, isDrawOpaqueOrMask, isDrawBlend, isDrawProbe, camera, model, renderQueue);
            }
            // post-processing
            renderQueue.sort();
          }
        }
      });
      _export("LightResource", LightResource = class LightResource {
        constructor() {
          this.cpuBuffer = void 0;
          this.programLibrary = void 0;
          this.device = null;
          this.elementSize = 0;
          this.maxNumLights = 16;
          this.binding = 0xFFFFFFFF;
          this.resized = false;
          this.lightBuffer = void 0;
          this.firstLightBufferView = null;
          this.lights = [];
          this.lightIndex = new Map();
        }
        init(programLib, deviceIn, maxNumLights) {
          this.device = deviceIn;
          this.programLibrary = programLib;
          const instanceLayout = this.programLibrary.localLayoutData;
          const attrID = programLib.layoutGraph.attributeIndex.get('CCForwardLight');
          const uniformBlock = instanceLayout.uniformBlocks.get(attrID);
          this.elementSize = AlignUp(getUniformBlockSize(uniformBlock.members), this.device.capabilities.uboOffsetAlignment);
          this.maxNumLights = maxNumLights;
          this.binding = programLib.localLayoutData.bindingMap.get(attrID);
          const bufferSize = this.elementSize * this.maxNumLights;
          this.lightBuffer = this.device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, bufferSize, this.elementSize));
          this.firstLightBufferView = this.device.createBuffer(new BufferViewInfo(this.lightBuffer, 0, this.elementSize));
          this.cpuBuffer = new Float32Array(bufferSize / Float32Array.BYTES_PER_ELEMENT);
          this.resized = true;
        }
        buildLights(sceneCulling, bHDR, shadowInfo) {
          // Build light buffer
          for (const [scene, lightBoundsCullings] of sceneCulling.lightBoundsCullings) {
            for (const [key, lightBoundsCullingID] of lightBoundsCullings.resultIndex) {
              const lightBoundsCulling = lightBoundsCullings.resultKeyIndex.get(key);
              const sceneData = lightBoundsCulling.sceneData;
              let exposure = 1.0;
              if (sceneData.camera) {
                exposure = sceneData.camera.exposure;
              } else if (sceneData.light.probe && sceneData.light.probe.camera) {
                exposure = sceneData.light.probe.camera.exposure;
              } else {
                throw new Error('Unexpected situation: No camera or probe found.');
              }
              const lightByteOffset = this.addLight(sceneData.shadingLight, bHDR, exposure, shadowInfo);

              // Save light byte offset for each light bounds culling
              const result = sceneCulling.lightBoundsCullingResults[lightBoundsCullingID];
              result.lightByteOffset = lightByteOffset;
            }
          }

          // Assign light byte offset to each queue
          for (const [sceneID, query] of sceneCulling.renderQueueQueryIndex) {
            if (query.lightBoundsCulledResultID === 0xFFFFFFFF) {
              continue;
            }
            const lightByteOffset = sceneCulling.lightBoundsCullingResults[query.lightBoundsCulledResultID].lightByteOffset;
            sceneCulling.renderQueues[query.renderQueueTarget].lightByteOffset = lightByteOffset;
          }
        }
        tryUpdateRenderSceneLocalDescriptorSet(sceneCulling) {
          if (!sceneCulling.lightBoundsCullings.size) {
            return;
          }
          for (const [scene, culling] of sceneCulling.frustumCullings) {
            for (const model of scene.models) {
              if (!model) {
                throw new Error('Unexpected null model.');
              }
              for (const submodel of model.subModels) {
                const set = submodel.descriptorSet;
                const prev = set.getBuffer(this.binding);
                if (this.resized || prev !== this.firstLightBufferView) {
                  set.bindBuffer(this.binding, this.firstLightBufferView);
                  set.update();
                }
              }
            }
          }
          this.resized = false;
        }
        clear() {
          if (!this.lightBuffer) return;
          this.cpuBuffer.fill(0);
          this.lights.length = 0;
          this.lightIndex.clear();
        }

        /**
         * @en Adds a light to the light buffer and returns its byte offset.
         * @zh 将光源添加到光源缓冲区，并返回其字节偏移量。
         * @param light @en The light to add. @zh 要添加的光源。
         * @param bHDR @en Whether HDR rendering is enabled. @zh 是否启用 HDR 渲染。
         * @param exposure @en The camera exposure value. @zh 相机曝光值。
         * @param shadowInfo @en The shadow settings, or null if shadows are disabled. @zh 阴影设置，若禁用阴影则为 null。
         * @returns @en The byte offset of the light in the light buffer. @zh 光源在光源缓冲区中的字节偏移量。
         */
        addLight(light, bHDR, exposure, shadowInfo) {
          // Already added
          const existingLightID = this.lightIndex.get(light);
          if (existingLightID !== undefined) {
            return existingLightID * this.elementSize;
          }
          if (!this.lightBuffer) {
            const programLib = cclegacy.rendering.programLib;
            this.init(programLib, deviceManager.gfxDevice, 16);
          }

          // Resize buffer if needed
          if (this.lights.length === this.maxNumLights) {
            this.resized = true;
            this.maxNumLights *= 2;
            const bufferSize = this.elementSize * this.maxNumLights;
            this.lightBuffer.resize(bufferSize);
            this.firstLightBufferView = this.device.createBuffer(new BufferViewInfo(this.lightBuffer, 0, this.elementSize));
            const prevCpuBuffer = this.cpuBuffer;
            this.cpuBuffer = new Float32Array(bufferSize / Float32Array.BYTES_PER_ELEMENT);
            this.cpuBuffer.set(prevCpuBuffer);
          }

          // Add light
          const lightID = this.lights.length;
          this.lights[lightID] = light;
          this.lightIndex.set(light, lightID);

          // Update buffer
          const offset = this.elementSize / Float32Array.BYTES_PER_ELEMENT * lightID;
          SetLightUBO(light, bHDR, exposure, shadowInfo, this.cpuBuffer, offset, this.elementSize);
          return lightID * this.elementSize;
        }
        buildLightBuffer(cmdBuffer) {
          if (!this.lightBuffer) return;
          cmdBuffer.updateBuffer(this.lightBuffer, this.cpuBuffer, this.lights.length * this.elementSize / Float32Array.BYTES_PER_ELEMENT);
        }
      });
    }
  };
});