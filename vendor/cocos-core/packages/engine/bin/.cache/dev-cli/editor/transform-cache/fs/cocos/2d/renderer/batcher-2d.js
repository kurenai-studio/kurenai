System.register("q-bundled:///fs/cocos/2d/renderer/batcher-2d.js", ["../../../../virtual/internal%253Aconstants.js", "../../asset/assets/material.js", "../../gfx/index.js", "../../core/index.js", "./stencil-manager.js", "./draw-batch.js", "../../rendering/define.js", "./static-vb-accessor.js", "./vertex-format.js", "../assembler/utils.js", "../../render-scene/index.js", "../../asset/asset-manager/index.js", "../../asset/assets/index.js", "./render-entity.js"], function (_export, _context) {
  "use strict";

  var DEBUG, JSB, USE_SORTING_2D, Material, DescriptorSetInfo, BufferInfo, BufferUsageBit, MemoryUsageBit, deviceManager, PrimitiveMode, CachedArray, Pool, Mat4, cclegacy, assertIsTrue, assert, approx, EPSILON, RecyclePool, Stage, StencilManager, DrawBatch2D, ModelLocalBindings, UBOLocalEnum, StaticVBAccessor, getAttributeStride, vfmt, vfmtPosUvColor, updateOpacity, scene, builtinResMgr, RenderingSubMesh, RenderEntityFillColorType, Batcher2D, LocalDescriptorSet, DescriptorSetCache, sorting2DCount, _dsInfo, m4_1, recordedRendererInfoPool;
  /**
   * @engineInternal
   */
  function _setSorting2DCount(v) {
    sorting2DCount = v;
    if (JSB) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      n2d.Batcher2d.setSorting2DCount(v);
    }
  }
  _export({
    _setSorting2DCount: _setSorting2DCount,
    Batcher2D: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      JSB = _virtualInternal253AconstantsJs.JSB;
      USE_SORTING_2D = _virtualInternal253AconstantsJs.USE_SORTING_2D;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_gfxIndexJs) {
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      deviceManager = _gfxIndexJs.deviceManager;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
    }, function (_coreIndexJs) {
      CachedArray = _coreIndexJs.CachedArray;
      Pool = _coreIndexJs.Pool;
      Mat4 = _coreIndexJs.Mat4;
      cclegacy = _coreIndexJs.cclegacy;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      assert = _coreIndexJs.assert;
      approx = _coreIndexJs.approx;
      EPSILON = _coreIndexJs.EPSILON;
      RecyclePool = _coreIndexJs.RecyclePool;
    }, function (_stencilManagerJs) {
      Stage = _stencilManagerJs.Stage;
      StencilManager = _stencilManagerJs.StencilManager;
    }, function (_drawBatchJs) {
      DrawBatch2D = _drawBatchJs.DrawBatch2D;
    }, function (_renderingDefineJs) {
      ModelLocalBindings = _renderingDefineJs.ModelLocalBindings;
      UBOLocalEnum = _renderingDefineJs.UBOLocalEnum;
    }, function (_staticVbAccessorJs) {
      StaticVBAccessor = _staticVbAccessorJs.StaticVBAccessor;
    }, function (_vertexFormatJs) {
      getAttributeStride = _vertexFormatJs.getAttributeStride;
      vfmt = _vertexFormatJs.vfmt;
      vfmtPosUvColor = _vertexFormatJs.vfmtPosUvColor;
    }, function (_assemblerUtilsJs) {
      updateOpacity = _assemblerUtilsJs.updateOpacity;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_assetAssetsIndexJs) {
      RenderingSubMesh = _assetAssetsIndexJs.RenderingSubMesh;
    }, function (_renderEntityJs) {
      RenderEntityFillColorType = _renderEntityJs.RenderEntityFillColorType;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      sorting2DCount = 0;
      _dsInfo = new DescriptorSetInfo(null);
      m4_1 = new Mat4();
      recordedRendererInfoPool = new RecyclePool(() => ({
        uiRenderer: null,
        finalOpacity: 0,
        opacityDirty: false
      }), 128);
      /**
       * @en UI rendering process
       * @zh UI 渲染流程
       */
      _export("Batcher2D", Batcher2D = class Batcher2D {
        get nativeObj() {
          return this._nativeObj;
        }
        get currBufferAccessor() {
          if (this._staticVBBuffer) return this._staticVBBuffer;
          // create if not set
          this._staticVBBuffer = this.switchBufferAccessor();
          return this._staticVBBuffer;
        }
        get batches() {
          return this._batches;
        }
        set currStaticRoot(value) {
          this._currStaticRoot = value;
        }

        /**
         * @deprecated since v3.8.7
         */
        set currIsStatic(value) {}
        constructor(_root) {
          this._screens = [];
          this._staticVBBuffer = null;
          this._bufferAccessors = new Map();
          this._currBID = -1;
          this._indexStart = 0;
          this._emptyMaterial = new Material();
          this._currRenderData = null;
          this._currMaterial = this._emptyMaterial;
          this._currTexture = null;
          this._currSampler = null;
          this._currStaticRoot = null;
          this._currComponent = null;
          this._currTransform = null;
          this._currTextureHash = 0;
          this._currSamplerHash = 0;
          this._currLayer = 0;
          this._currDepthStencilStateStage = null;
          this._currHash = 0;
          //for middleware
          this._currIsMiddleware = false;
          this._middlewareEnableBatch = false;
          this._middlewareBuffer = null;
          this._middlewareIndexStart = 0;
          this._middlewareIndexCount = 0;
          this._pOpacity = 1;
          this._opacityDirty = 0;
          // DescriptorSet Cache Map
          this._descriptorSetCache = new DescriptorSetCache();
          this._meshDataArray = [];
          // mask use
          this._maskClearModel = null;
          this._maskClearMtl = null;
          this._maskModelMesh = null;
          this._recordedRendererInfoQueue = [];
          this._root = _root;
          this.device = _root.device;
          this._batches = new CachedArray(64);
          this._drawBatchPool = new Pool(() => new DrawBatch2D(), 128, obj => obj.destroy(this));
        }
        getRecordedRendererInfoQueue() {
          return this._recordedRendererInfoQueue;
        }
        initialize() {
          return true;
        }
        destroy() {
          this._recordedRendererInfoQueue.length = 0;
          for (let i = 0; i < this._batches.length; i++) {
            if (this._batches.array[i]) {
              this._batches.array[i].destroy(this);
            }
          }
          this._batches.destroy();
          for (const accessor of this._bufferAccessors.values()) {
            accessor.destroy();
          }
          this._bufferAccessors.clear();
          if (this._drawBatchPool) {
            this._drawBatchPool.destroy();
          }
          this._descriptorSetCache.destroy();
          StencilManager.sharedManager.destroy();
          if (this._maskClearModel && this._maskModelMesh) {
            cclegacy.director.root.destroyModel(this._maskClearModel);
            this._maskModelMesh.destroy();
          }
          if (this._maskClearMtl) {
            this._maskClearMtl.destroy();
          }
        }
        syncRootNodesToNative() {
          if (JSB) {
            const rootNodes = [];
            for (const screen of this._screens) {
              rootNodes.push(screen.node);
            }
            this._nativeObj.syncRootNodesToNative(rootNodes);
          }
        }

        /**
         * @en
         * Add the managed Canvas.
         *
         * @zh
         * 添加屏幕组件管理。
         *
         * @param comp @en The render root of 2d.
         *             @zh 2d 渲染入口组件。
         */
        addScreen(comp) {
          this._screens.push(comp);
          this._screens.sort(this._screenSort);
          if (JSB) {
            this.syncRootNodesToNative();
          }
        }

        /**
         * @zh
         * Removes the Canvas from the list.
         *
         * @param comp @en The target to removed.
         *             @zh 被移除的屏幕。
         */
        removeScreen(comp) {
          const idx = this._screens.indexOf(comp);
          if (idx === -1) {
            return;
          }
          this._screens.splice(idx, 1);
          if (JSB) {
            this.syncRootNodesToNative();
          }
        }
        sortScreens() {
          this._screens.sort(this._screenSort);
          if (JSB) {
            this.syncRootNodesToNative();
          }
        }
        getFirstRenderCamera(node) {
          if (node.scene && node.scene.renderScene) {
            const cameras = node.scene.renderScene.cameras;
            for (let i = 0; i < cameras.length; i++) {
              const camera = cameras[i];
              if (camera.visibility & node.layer) {
                return camera;
              }
            }
          }
          return null;
        }
        update() {
          if (JSB) {
            return;
          }
          const screens = this._screens;
          let offset = 0;
          for (let i = 0; i < screens.length; ++i) {
            const screen = screens[i];
            const scene = screen._getRenderScene();
            if (!screen.enabledInHierarchy || !scene) {
              continue;
            }
            // Reset state and walk
            this._opacityDirty = 0;
            this._pOpacity = 1;
            this.walk(screen.node);
            if (USE_SORTING_2D && sorting2DCount > 0) {
              this._flushRecordedUIRenderers();
            }
            this.autoMergeBatches(this._currComponent);
            this.resetRenderStates();
            let batchPriority = 0;
            if (this._batches.length > offset) {
              for (; offset < this._batches.length; ++offset) {
                const batch = this._batches.array[offset];
                if (batch.model) {
                  const subModels = batch.model.subModels;
                  for (let j = 0; j < subModels.length; j++) {
                    subModels[j].priority = batchPriority++;
                  }
                } else {
                  batch.descriptorSet = this._descriptorSetCache.getDescriptorSet(batch);
                }
                scene.addBatch(batch);
              }
            }
          }
          if (USE_SORTING_2D && sorting2DCount > 0) {
            recordedRendererInfoPool.reset();
          }
        }
        uploadBuffers() {
          if (JSB) {
            this._nativeObj.uploadBuffers();
          } else if (this._batches.length > 0) {
            const length = this._meshDataArray.length;
            for (let i = 0; i < length; i++) {
              this._meshDataArray[i].uploadBuffers();
            }
            for (const accessor of this._bufferAccessors.values()) {
              accessor.uploadBuffers();
              accessor.reset();
            }
            this._descriptorSetCache.update();
          }
        }
        reset() {
          if (JSB) {
            this._nativeObj.reset();
          } else {
            for (let i = 0; i < this._batches.length; ++i) {
              const batch = this._batches.array[i];
              if (batch.isStatic) {
                continue;
              }
              batch.clear();
              this._drawBatchPool.free(batch);
            }
            // Reset buffer accessors
            for (const accessor of this._bufferAccessors.values()) {
              accessor.reset();
            }
            const length = this._meshDataArray.length;
            for (let i = 0; i < length; i++) {
              this._meshDataArray[i].freeIAPool();
            }
            this._meshDataArray.length = 0;
            this._staticVBBuffer = null;
            this._currBID = -1;
            this._indexStart = 0;
            this._currHash = 0;
            this._currLayer = 0;
            this._currRenderData = null;
            this._currMaterial = this._emptyMaterial;
            this._currTexture = null;
            this._currSampler = null;
            this._currComponent = null;
            this._currTransform = null;
            this._batches.clear();
            StencilManager.sharedManager.reset();
          }
        }

        /**
         * @zh 如果有必要，为相应的顶点布局切换网格缓冲区。
         * @en Switch the mesh buffer for corresponding vertex layout if necessary.
         * @param attributes use VertexFormat.vfmtPosUvColor by default
         */
        switchBufferAccessor(attributes = vfmtPosUvColor) {
          const strideBytes = attributes === vfmtPosUvColor ? 36 /* 9x4 */ : getAttributeStride(attributes);
          // If current accessor not compatible with the requested attributes
          if (!this._staticVBBuffer || this._staticVBBuffer.vertexFormatBytes !== strideBytes) {
            let accessor = this._bufferAccessors.get(strideBytes);
            if (!accessor) {
              accessor = new StaticVBAccessor(this.device, attributes);
              this._bufferAccessors.set(strideBytes, accessor);
            }
            this._staticVBBuffer = accessor;
            this._currBID = -1;
          }
          return this._staticVBBuffer;
        }
        registerBufferAccessor(key, accessor) {
          this._bufferAccessors.set(key, accessor);
        }
        updateBuffer(attributes, bid) {
          const accessor = this.switchBufferAccessor(attributes);
          // If accessor changed, then current bid will be reset to -1, this check will pass too
          if (this._currBID !== bid) {
            this._currBID = bid;
            this._indexStart = accessor.getMeshBuffer(bid).indexOffset;
          }
        }

        /**
         * @en
         * Render component data submission process of UI.
         * The submitted vertex data is the UI for world coordinates.
         * For example: The UI components except Graphics and UIModel.
         *
         * @zh
         * UI 渲染组件数据提交流程（针对提交的顶点数据是世界坐标的提交流程，例如：除 Graphics 和 UIModel 的大部分 ui 组件）。
         * 此处的数据最终会生成需要提交渲染的 model 数据。
         *
         * @param comp - The committed renderable component
         * @param renderData - The render data being committed
         * @param frame - Texture or sprite frame related to the draw batch, could be null
         * @param assembler - The assembler for the current component, could be null
         * @param transform - Node type transform, if passed, then batcher will consider it's using model matrix, could be null
         */
        commitComp(comp, renderData, frame, assembler, transform) {
          let dataHash = 0;
          let mat;
          let bufferID = -1;
          if (renderData && renderData.chunk) {
            if (!renderData.isValid()) return;
            dataHash = renderData.dataHash;
            mat = renderData.material;
            bufferID = renderData.chunk.bufferId;
          }
          // Notice: A little hack, if it is for mask, not need update here, while control by stencilManger
          if (comp.stencilStage === Stage.ENTER_LEVEL || comp.stencilStage === Stage.ENTER_LEVEL_INVERTED) {
            this._insertMaskBatch(comp);
          } else {
            comp.stencilStage = StencilManager.sharedManager.stage;
          }
          const depthStencilStateStage = comp.stencilStage;
          if (this._currHash !== dataHash || dataHash === 0 || this._currMaterial !== mat || this._currDepthStencilStateStage !== depthStencilStateStage) {
            // Merge all previous data to a render batch, and update buffer for next render data
            this.autoMergeBatches(this._currComponent);
            if (renderData && !renderData._isMeshBuffer) {
              this.updateBuffer(renderData.vertexFormat, bufferID);
            }
            this._currRenderData = renderData;
            this._currHash = renderData ? renderData.dataHash : 0;
            this._currComponent = comp;
            this._currTransform = transform;
            this._currMaterial = comp.getRenderMaterial(0);
            this._currDepthStencilStateStage = depthStencilStateStage;
            this._currLayer = comp.node.layer;
            if (frame) {
              if (DEBUG) {
                assert(frame.isValid, 'frame should not be invalid, it may have been released');
              }
              this._currTexture = frame.getGFXTexture();
              this._currSampler = frame.getGFXSampler();
              this._currTextureHash = frame.getHash();
              this._currSamplerHash = this._currSampler.hash;
            } else {
              this._currTexture = null;
              this._currSampler = null;
              this._currTextureHash = 0;
              this._currSamplerHash = 0;
            }
          }
          if (assembler.fillBuffers) assembler.fillBuffers(comp, this);
        }

        /**
         * @en
         * Render component data submission process for individual [[gfx.InputAssembler]]
         * @zh
         * 渲染组件中针对独立 [[gfx.InputAssembler]] 的提交流程
         * 例如：Spine 和 DragonBones 等包含动态数据和材质的组件在内部管理 IA 并提交批次
         * @param comp - The committed renderable component
         * @param ia - The committed [[gfx.InputAssembler]]
         * @param tex - The texture used
         * @param mat - The material used
         * @param [transform] - The related node transform if the render data is based on node's local coordinates
         * @deprecated since v3.6.2, please use [[commitMiddleware]] instead
         */
        commitIA(renderComp, ia, tex, mat, transform) {
          // if the last comp is spriteComp, previous comps should be batched.
          if (this._currMaterial !== this._emptyMaterial) {
            this.autoMergeBatches(this._currComponent);
            this.resetRenderStates();
          }
          let depthStencil = null;
          let dssHash = 0;
          if (renderComp) {
            renderComp.stencilStage = StencilManager.sharedManager.stage;
            if (renderComp.customMaterial !== null) {
              depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage, mat);
            } else {
              depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage);
            }
            dssHash = StencilManager.sharedManager.getStencilHash(renderComp.stencilStage);
          }
          const curDrawBatch = this._currStaticRoot ? this._currStaticRoot._requireDrawBatch() : this._drawBatchPool.alloc();
          curDrawBatch.visFlags = renderComp.node.layer;
          curDrawBatch.inputAssembler = ia;
          curDrawBatch.useLocalData = transform || null;
          if (tex) {
            curDrawBatch.texture = tex.getGFXTexture();
            curDrawBatch.sampler = tex.getGFXSampler();
            curDrawBatch.textureHash = tex.getHash();
            curDrawBatch.samplerHash = curDrawBatch.sampler.hash;
          }
          curDrawBatch.fillPasses(mat || null, depthStencil, dssHash, null);
          this._batches.push(curDrawBatch);
        }

        /**
         * @en
         * Render component data submission process for middleware2d components
         * @zh
         * 渲染组件中针对2D中间件组件渲染数据的提交流程
         * 例如：Spine 和 DragonBones 包含动态数据和材质的组件
         * @param comp - The committed renderable component
         * @param meshBuffer - The MeshBuffer used
         * @param indexOffset - indices offset
         * @param indexCount - indices count
         * @param tex - The texture used
         * @param mat - The material used
         * @param enableBatch - component support multi draw batch or not
         */
        commitMiddleware(comp, meshBuffer, indexOffset, indexCount, tex, mat, enableBatch) {
          // check if need merge draw batch
          const texture = tex.getGFXTexture();
          if (enableBatch && this._middlewareEnableBatch && this._middlewareBuffer === meshBuffer && this._currTexture === texture && this._currMaterial.hash === mat.hash && this._middlewareIndexStart + this._middlewareIndexCount === indexOffset && this._currLayer === comp.node.layer) {
            this._middlewareIndexCount += indexCount;
          } else {
            this.autoMergeBatches(this._currComponent);
            this.resetRenderStates();
            this._currComponent = comp;
            this._currTexture = texture;
            this._currSampler = tex.getGFXSampler();
            this._currTextureHash = tex.getHash();
            this._currLayer = comp.node.layer;
            this._currSamplerHash = this._currSampler.hash;
            this._currHash = 0;
            this._currTransform = enableBatch ? null : comp.node;
            this._middlewareEnableBatch = enableBatch;
            this._middlewareBuffer = meshBuffer;
            this._currMaterial = mat;
            this._middlewareIndexStart = indexOffset;
            this._middlewareIndexCount = indexCount;
          }
          this._currIsMiddleware = true;
        }

        /**
         * @en
         * Render component data submission process of UI.
         * The submitted vertex data is the UI for local coordinates.
         * For example: The UI components of Graphics and UIModel.
         *
         * @zh
         * UI 渲染组件数据提交流程（针对例如： Graphics 和 UIModel 等数据量较为庞大的 ui 组件）。
         *
         * @param comp - The committed renderable component
         * @param model - The committed model
         * @param mat - The material used, could be null
         */
        commitModel(comp, model, mat) {
          // if the last comp is spriteComp, previous comps should be batched.
          if (this._currMaterial !== this._emptyMaterial) {
            this.autoMergeBatches(this._currComponent);
            this.resetRenderStates();
          }
          let depthStencil = null;
          let dssHash = 0;
          if (mat) {
            // Notice: A little hack, if it is for mask, not need update here, while control by stencilManger
            if (comp.stencilStage === Stage.ENTER_LEVEL || comp.stencilStage === Stage.ENTER_LEVEL_INVERTED) {
              this._insertMaskBatch(comp);
            } else {
              comp.stencilStage = StencilManager.sharedManager.stage;
            }
            depthStencil = StencilManager.sharedManager.getStencilStage(comp.stencilStage, mat);
            dssHash = StencilManager.sharedManager.getStencilHash(comp.stencilStage);
          }
          const stamp = cclegacy.director.getTotalFrames();
          if (model) {
            model.updateTransform(stamp);
            model.updateUBOs(stamp);
          }
          for (let i = 0; i < model.subModels.length; i++) {
            const curDrawBatch = this._drawBatchPool.alloc();
            const subModel = model.subModels[i];
            curDrawBatch.visFlags = comp.node.layer;
            curDrawBatch.model = model;
            curDrawBatch.texture = null;
            curDrawBatch.sampler = null;
            curDrawBatch.useLocalData = null;
            if (!depthStencil) {
              depthStencil = null;
            }
            curDrawBatch.fillPasses(mat, depthStencil, dssHash, subModel.patches);
            curDrawBatch.inputAssembler = subModel.inputAssembler;
            curDrawBatch.model.visFlags = curDrawBatch.visFlags;
            curDrawBatch.descriptorSet = subModel.descriptorSet;
            this._batches.push(curDrawBatch);
          }
        }
        setupStaticBatch(staticComp, bufferAccessor) {
          this.finishMergeBatches();
          this._staticVBBuffer = bufferAccessor;
          this.currStaticRoot = staticComp;
        }
        endStaticBatch() {
          this.finishMergeBatches();
          this.currStaticRoot = null;
          // Clear linear buffer to switch to the correct internal accessor
          this._staticVBBuffer = null;
          this.switchBufferAccessor();
        }

        /**
         * @en
         * Submit separate render data.
         * This data does not participate in the batch.
         *
         * @zh
         * 提交独立渲染数据.
         * @param comp @en The UIStaticBatch component.
         *             @zh 静态组件
         */
        commitStaticBatch(comp) {
          this._batches.concat(comp.drawBatchList);
          this.finishMergeBatches();
        }

        /**
         * @en
         * End a section of render data and submit according to the batch condition.
         *
         * @zh
         * 根据合批条件，结束一段渲染数据并提交。
         */
        autoMergeBatches(renderComp) {
          if (this._currIsMiddleware) {
            this.mergeBatchesForMiddleware(renderComp);
            return;
          }
          const mat = this._currMaterial;
          if (!mat) {
            return;
          }
          let ia;
          const rd = this._currRenderData;
          const accessor = this._staticVBBuffer;
          // Previous batch using mesh buffer
          if (rd && rd._isMeshBuffer) {
            ia = rd.requestIA(this.device);
            if (this._meshDataArray.indexOf(rd) === -1) {
              this._meshDataArray.push(rd);
            }
          } else if (accessor) {
            // Previous batch using static vb buffer
            const bid = this._currBID;
            const buf = accessor.getMeshBuffer(bid);
            if (!buf) {
              return;
            }
            const indexCount = buf.indexOffset - this._indexStart;
            if (indexCount <= 0) return;
            assertIsTrue(this._indexStart < buf.indexOffset);
            buf.setDirty();
            // Request ia
            ia = buf.requireFreeIA(this.device);
            ia.firstIndex = this._indexStart;
            ia.indexCount = indexCount;
            // Update index tracker and bid
            this._indexStart = buf.indexOffset;
          }
          this._currBID = -1;

          // Request ia failed
          if (!ia || !this._currTexture) {
            return;
          }
          let depthStencil = null;
          let dssHash = 0;
          if (renderComp) {
            if (renderComp.customMaterial !== null) {
              depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage, mat);
            } else {
              depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage);
            }
            dssHash = StencilManager.sharedManager.getStencilHash(renderComp.stencilStage);
          }
          const curDrawBatch = this._currStaticRoot ? this._currStaticRoot._requireDrawBatch() : this._drawBatchPool.alloc();
          curDrawBatch.visFlags = this._currLayer;
          curDrawBatch.texture = this._currTexture;
          curDrawBatch.sampler = this._currSampler;
          curDrawBatch.inputAssembler = ia;
          curDrawBatch.useLocalData = this._currTransform;
          curDrawBatch.textureHash = this._currTextureHash;
          curDrawBatch.samplerHash = this._currSamplerHash;
          curDrawBatch.fillPasses(mat, depthStencil, dssHash, null);
          this._batches.push(curDrawBatch);
        }
        mergeBatchesForMiddleware(renderComp) {
          let depthStencil = null;
          let dssHash = 0;
          renderComp.stencilStage = StencilManager.sharedManager.stage;
          if (renderComp.customMaterial !== null) {
            depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage, this._currMaterial);
          } else {
            depthStencil = StencilManager.sharedManager.getStencilStage(renderComp.stencilStage);
          }
          dssHash = StencilManager.sharedManager.getStencilHash(renderComp.stencilStage);
          const curDrawBatch = this._currStaticRoot ? this._currStaticRoot._requireDrawBatch() : this._drawBatchPool.alloc();
          curDrawBatch.visFlags = renderComp.node.layer;
          const ia = this._middlewareBuffer.requireFreeIA(this.device);
          ia.firstIndex = this._middlewareIndexStart;
          ia.indexCount = this._middlewareIndexCount;
          curDrawBatch.inputAssembler = ia;
          curDrawBatch.useLocalData = this._currTransform;
          curDrawBatch.texture = this._currTexture;
          curDrawBatch.sampler = this._currSampler;
          curDrawBatch.textureHash = this._currTextureHash;
          curDrawBatch.samplerHash = this._currSamplerHash;
          curDrawBatch.fillPasses(this._currMaterial || null, depthStencil, dssHash, null);
          this._batches.push(curDrawBatch);
          this._currIsMiddleware = false;
          this._middlewareBuffer = null;
        }

        /**
         * @en
         * Force changes to current batch data and merge
         *
         * @zh
         * 强行修改当前批次数据并合并。
         *
         * @param material @en The material of the current batch.
         *                 @zh 当前批次的材质。
         * @param sprite @en Sprite frame of current batch.
         *               @zh 当前批次的精灵帧。
         */
        forceMergeBatches(material, frame, renderComp) {
          this._currMaterial = material;
          if (frame) {
            this._currTexture = frame.getGFXTexture();
            this._currSampler = frame.getGFXSampler();
            this._currTextureHash = frame.getHash();
            this._currSamplerHash = this._currSampler.hash;
          } else {
            this._currTexture = this._currSampler = null;
            this._currTextureHash = this._currSamplerHash = 0;
          }
          this._currLayer = renderComp.node.layer;
          this.autoMergeBatches(renderComp);
        }
        resetRenderStates() {
          this._currMaterial = this._emptyMaterial;
          this._currRenderData = null;
          this._currTexture = null;
          this._currComponent = null;
          this._currTransform = null;
          this._currTextureHash = 0;
          this._currSamplerHash = 0;
          this._currLayer = 0;
        }

        /**
         * @en
         * Forced to merge the data of the previous batch to start a new batch.
         *
         * @zh
         * 强制合并上一个批次的数据，开启新一轮合批。
         */
        finishMergeBatches() {
          this.autoMergeBatches();
          this.resetRenderStates();
        }

        /**
         * @en
         * Force to change the current material.
         *
         * @zh
         * 强制刷新材质。
         */
        flushMaterial(mat) {
          this._currMaterial = mat;
        }
        _handleUIRenderer(render, finalOpacity, opacityDirty) {
          const renderData = render ? render.renderData : null;
          const vertexCount = renderData ? renderData.vertexCount : 0;

          // Render assembler update logic
          if (render && render.enabledInHierarchy) {
            render.fillBuffers(this); // for rendering
          }

          // Update cascaded opacity to vertex buffer
          if (opacityDirty && vertexCount > 0) {
            // HARD COUPLING
            switch (render.getFillColorType()) {
              case RenderEntityFillColorType.COLOR:
                {
                  updateOpacity(renderData, finalOpacity);
                  break;
                }
              case RenderEntityFillColorType.VERTEX:
                {
                  // Use vertex color directly, so do nothing here.
                  break;
                }
              default:
                break;
            }
            const buffer = renderData.getMeshBuffer();
            if (buffer) {
              buffer.setDirty();
            }
          }
        }
        _recordUIRenderer(render, finalOpacity, opacityDirty) {
          if (!USE_SORTING_2D) return null;
          const queue = this.getRecordedRendererInfoQueue();
          const info = recordedRendererInfoPool.add();
          info.uiRenderer = render;
          info.finalOpacity = finalOpacity;
          info.opacityDirty = opacityDirty;
          queue.push(info);
          return info;
        }
        _flushRecordedUIRenderers() {
          if (!USE_SORTING_2D) return;
          const queue = this.getRecordedRendererInfoQueue();
          const length = queue.length;
          if (length === 0) return;
          queue.sort((a, b) => a.uiRenderer.priority - b.uiRenderer.priority);
          for (let i = 0; i < length; i++) {
            const info = queue[i];
            const render = info.uiRenderer;
            if (render) {
              this._handleUIRenderer(render, info.finalOpacity, info.opacityDirty);
              if (render.enabledInHierarchy) {
                render.postUpdateAssembler(this);
              }
            }
            info.finalOpacity = 1;
            info.opacityDirty = false;
            info.uiRenderer = null;
          }
          queue.length = 0;
        }
        walk(node, level = 0) {
          if (!node.activeInHierarchy) {
            return;
          }
          const children = node.children;
          const uiProps = node._uiProps;
          const render = uiProps.uiComp;

          // Save opacity
          const parentOpacity = this._pOpacity;
          let opacity = parentOpacity;
          // TODO Always cascade ui property's local opacity before remove it
          const selfOpacity = render && render.color ? render.color.a / 255 : 1;
          this._pOpacity = opacity *= selfOpacity * uiProps.localOpacity;
          // TODO Set opacity to ui property's opacity before remove it
          uiProps.setOpacity(opacity);
          const visable = !approx(opacity, 0, EPSILON);
          if (visable) {
            if (uiProps.colorDirty) {
              // Cascade color dirty state
              this._opacityDirty++;
            }
            if (render) {
              if (USE_SORTING_2D && sorting2DCount > 0) {
                if (render.stencilStage === Stage.ENTER_LEVEL || render.stencilStage === Stage.ENTER_LEVEL_INVERTED) {
                  this._flushRecordedUIRenderers();
                  this.autoMergeBatches(this._currComponent);
                  this.resetRenderStates();
                }
                this._recordUIRenderer(render, opacity, !!this._opacityDirty);
              } else {
                this._handleUIRenderer(render, opacity, !!this._opacityDirty);
              }
            }
            if (children.length > 0 && !node._static) {
              for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                this.walk(child, level);
              }
            }
            if (uiProps.colorDirty) {
              // Reduce cascaded color dirty state
              this._opacityDirty--;
              // Reset color dirty
              uiProps.colorDirty = false;
            }
          }
          // Restore opacity
          this._pOpacity = parentOpacity;

          // Post render assembler update logic
          // ATTENTION: Will also reset colorDirty inside postUpdateAssembler
          if (render && render.enabledInHierarchy) {
            if (!USE_SORTING_2D) {
              render.postUpdateAssembler(this);
            }
            if (visable && (render.stencilStage === Stage.ENTER_LEVEL || render.stencilStage === Stage.ENTER_LEVEL_INVERTED)) {
              if (USE_SORTING_2D && sorting2DCount > 0) {
                this._flushRecordedUIRenderers();
              }
              if (StencilManager.sharedManager.getMaskStackSize() > 0) {
                this.autoMergeBatches(this._currComponent);
                this.resetRenderStates();
                StencilManager.sharedManager.exitMask();
              }
            }
          }
          level += 1;
        }
        _screenSort(a, b) {
          return a.node.siblingIndex - b.node.siblingIndex;
        }

        // TODO: Not a good way to do the job
        // Although it's a private method, it is invoked in text-processing.ts and texture-base.ts
        // by legacyCC.director.root.batcher2D._releaseDescriptorSetCache
        /**
         * @engineInternal
         * @mangle
         */
        _releaseDescriptorSetCache(textureHash, sampler = null) {
          if (JSB) {
            this._nativeObj.releaseDescriptorSetCache(textureHash, sampler);
          } else {
            this._descriptorSetCache.releaseDescriptorSetCache(textureHash);
          }
        }

        // Mask use
        _createClearModel() {
          if (!this._maskClearModel) {
            this._maskClearMtl = builtinResMgr.get('default-clear-stencil');
            this._maskClearModel = cclegacy.director.root.createModel(scene.Model);
            const stride = getAttributeStride(vfmt);
            const gfxDevice = deviceManager.gfxDevice;
            const vertexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, 4 * stride, stride));
            const vb = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
            vertexBuffer.update(vb);
            const indexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, 6 * Uint16Array.BYTES_PER_ELEMENT, Uint16Array.BYTES_PER_ELEMENT));
            const ib = new Uint16Array([0, 1, 2, 2, 1, 3]);
            indexBuffer.update(ib);
            this._maskModelMesh = new RenderingSubMesh([vertexBuffer], vfmt, PrimitiveMode.TRIANGLE_LIST, indexBuffer);
            this._maskModelMesh.subMeshIdx = 0;
            this._maskClearModel.initSubModel(0, this._maskModelMesh, this._maskClearMtl);
          }
        }
        _insertMaskBatch(comp) {
          this.autoMergeBatches(this._currComponent);
          this.resetRenderStates();
          this._createClearModel();
          this._maskClearModel.node = this._maskClearModel.transform = comp.node;
          const stencilManager = StencilManager.sharedManager;
          stencilManager.pushMask(1); //not need object，only use length
          const stage = stencilManager.clear(comp); //invert

          let depthStencil = null;
          let dssHash = 0;
          const mat = this._maskClearMtl;
          if (mat) {
            depthStencil = stencilManager.getStencilStage(stage, mat);
            dssHash = stencilManager.getStencilHash(stage);
          }
          const model = this._maskClearModel;
          const stamp = cclegacy.director.getTotalFrames();
          if (model) {
            model.updateTransform(stamp);
            model.updateUBOs(stamp);
          }
          for (let i = 0; i < model.subModels.length; i++) {
            const curDrawBatch = this._drawBatchPool.alloc();
            const subModel = model.subModels[i];
            curDrawBatch.visFlags = comp.node.layer;
            curDrawBatch.model = model;
            curDrawBatch.texture = null;
            curDrawBatch.sampler = null;
            curDrawBatch.useLocalData = null;
            if (!depthStencil) {
              depthStencil = null;
            }
            curDrawBatch.fillPasses(mat, depthStencil, dssHash, subModel.patches);
            curDrawBatch.inputAssembler = subModel.inputAssembler;
            curDrawBatch.model.visFlags = curDrawBatch.visFlags;
            curDrawBatch.descriptorSet = subModel.descriptorSet;
            this._batches.push(curDrawBatch);
          }
          stencilManager.enableMask();
        }

        //sync mesh buffer to naive
        syncMeshBuffersToNative(accId, buffers) {
          if (JSB) {
            const nativeBuffers = buffers.map(buf => buf.nativeObj);
            this._nativeObj.syncMeshBuffersToNative(accId, nativeBuffers);
          }
        }
      });
      /** @mangle */
      LocalDescriptorSet = class LocalDescriptorSet {
        // NOTE: Internal modules should avoid using getter/setter accessors since we're using babel to convert TS to JS
        // and terser minifier could not handle the getter/setter generated JS code correctly.
        // See the issue: https://github.com/terser/terser/issues/322
        // Change get descriptorSet() to getDescriptorSet() in v3.8.6.
        getDescriptorSet() {
          return this._descriptorSet;
        }
        constructor() {
          this._descriptorSet = null;
          this._transform = null;
          this._textureHash = 0;
          this._samplerHash = 0;
          this._localBuffer = null;
          this._transformUpdate = true;
          const device = deviceManager.gfxDevice;
          this._localData = new Float32Array(UBOLocalEnum.COUNT);
          this._localBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, UBOLocalEnum.SIZE, UBOLocalEnum.SIZE));
        }
        initialize(batch) {
          const device = deviceManager.gfxDevice;
          this._transform = batch.useLocalData;
          this._textureHash = batch.textureHash;
          this._samplerHash = batch.samplerHash;
          _dsInfo.layout = batch.passes[0].localSetLayout;
          this._descriptorSet = device.createDescriptorSet(_dsInfo);
          this._descriptorSet.bindBuffer(UBOLocalEnum.BINDING, this._localBuffer);
          const binding = ModelLocalBindings.SAMPLER_SPRITE;
          this._descriptorSet.bindTexture(binding, batch.texture);
          this._descriptorSet.bindSampler(binding, batch.sampler);
          this._descriptorSet.update();
          this._transformUpdate = true;
        }
        updateTransform(transform) {
          if (transform === this._transform) return;
          this._transform = transform;
          this._transformUpdate = true;
          this.uploadLocalData();
        }
        equals(transform, textureHash, samplerHash) {
          return this._transform === transform && this._textureHash === textureHash && this._samplerHash === samplerHash;
        }
        reset() {
          this._transform = null;
          this._textureHash = 0;
          this._samplerHash = 0;
        }
        destroy() {
          if (this._localBuffer) {
            this._localBuffer.destroy();
            this._localBuffer = null;
          }
          if (this._descriptorSet) {
            this._descriptorSet.destroy();
            this._descriptorSet = null;
          }
          this._localData = null;
        }
        isValid() {
          return this._transform && this._transform.isValid;
        }
        uploadLocalData() {
          const node = this._transform;
          if (node.hasChangedFlags || node.isTransformDirty()) {
            node.updateWorldTransform();
            this._transformUpdate = true;
          }
          if (this._transformUpdate) {
            const worldMatrix = node.worldMatrix;
            Mat4.toArray(this._localData, worldMatrix, UBOLocalEnum.MAT_WORLD_OFFSET);
            Mat4.invert(m4_1, worldMatrix);
            Mat4.transpose(m4_1, m4_1);
            if (!JSB) {
              // fix precision lost of webGL on android device
              // scale worldIT mat to around 1.0 by product its sqrt of determinant.
              const det = Mat4.determinant(m4_1);
              const factor = 1.0 / Math.sqrt(det);
              Mat4.multiplyScalar(m4_1, m4_1, factor);
            }
            Mat4.toArray(this._localData, m4_1, UBOLocalEnum.MAT_WORLD_IT_OFFSET);
            this._localBuffer.update(this._localData);
            this._transformUpdate = false;
          }
        }
      };
      /** @mangle */
      DescriptorSetCache = class DescriptorSetCache {
        constructor() {
          this._descriptorSetCache = new Map();
          this._dsCacheHashByTexture = new Map();
          this._localDescriptorSetCache = [];
          this._localCachePool = new Pool(() => new LocalDescriptorSet(), 16, obj => obj.destroy());
        }
        getDescriptorSet(batch) {
          if (batch.useLocalData) {
            const caches = this._localDescriptorSetCache;
            for (let i = 0, len = caches.length; i < len; i++) {
              const cache = caches[i];
              if (cache.equals(batch.useLocalData, batch.textureHash, batch.samplerHash)) {
                return cache.getDescriptorSet();
              }
            }
            const localDs = this._localCachePool.alloc();
            localDs.initialize(batch);
            this._localDescriptorSetCache.push(localDs);
            return localDs.getDescriptorSet();
          } else {
            const hash = batch.textureHash ^ batch.samplerHash;
            if (this._descriptorSetCache.has(hash)) {
              return this._descriptorSetCache.get(hash);
            } else {
              _dsInfo.layout = batch.passes[0].localSetLayout;
              const descriptorSet = deviceManager.gfxDevice.createDescriptorSet(_dsInfo);
              const binding = ModelLocalBindings.SAMPLER_SPRITE;
              descriptorSet.bindTexture(binding, batch.texture);
              descriptorSet.bindSampler(binding, batch.sampler);
              descriptorSet.update();
              this._descriptorSetCache.set(hash, descriptorSet);
              this._dsCacheHashByTexture.set(batch.textureHash, hash);
              return descriptorSet;
            }
          }
        }
        update() {
          const caches = this._localDescriptorSetCache;
          const length = caches.length;
          if (length === 0) {
            return;
          }
          const uselessArray = [];
          for (let i = 0; i < length; i++) {
            const value = caches[i];
            if (value.isValid()) {
              value.uploadLocalData();
            } else {
              value.reset();
              const pos = caches.indexOf(value);
              uselessArray.push(pos);
            }
          }
          for (let i = uselessArray.length - 1; i >= 0; i--) {
            const index = uselessArray[i];
            const localDs = caches[index];
            caches.splice(index, 1);
            this._localCachePool.free(localDs);
          }
        }
        reset() {
          const caches = this._localDescriptorSetCache;
          const length = caches.length;
          for (let i = 0; i < length; i++) {
            const value = caches[i];
            this._localCachePool.free(value);
          }
          this._localDescriptorSetCache.length = 0;
        }
        releaseDescriptorSetCache(textureHash) {
          const key = this._dsCacheHashByTexture.get(textureHash);
          if (key && this._descriptorSetCache.has(key)) {
            this._descriptorSetCache.get(key).destroy();
            this._descriptorSetCache.delete(key);
            this._dsCacheHashByTexture.delete(textureHash);
          }
        }
        destroy() {
          for (const value of this._descriptorSetCache.values()) {
            value.destroy();
          }
          this._descriptorSetCache.clear();
          this._dsCacheHashByTexture.clear();
          this._localDescriptorSetCache.length = 0;
          this._localCachePool.destroy();
        }
      };
      cclegacy.internal.Batcher2D = Batcher2D;
    }
  };
});