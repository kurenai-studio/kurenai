System.register("q-bundled:///fs/cocos/rendering/custom/compiler.js", ["./effect.js", "./graph.js", "./render-graph.js", "./types.js"], function (_export, _context) {
  "use strict";

  var VectorGraphColorMap, DefaultVisitor, depthFirstSearch, ReferenceGraphView, RasterSubpass, RenderGraphValue, AccessType, ResourceResidency, SceneFlags, PassVisitor, PassManagerVisitor, ResourceVisitor, ResourceUseContext, CompilerContext, Compiler, ResourceManagerVisitor, readViews, context;
  _export({
    Compiler: void 0,
    ResourceManagerVisitor: void 0
  });
  return {
    setters: [function (_effectJs) {
      VectorGraphColorMap = _effectJs.VectorGraphColorMap;
    }, function (_graphJs) {
      DefaultVisitor = _graphJs.DefaultVisitor;
      depthFirstSearch = _graphJs.depthFirstSearch;
      ReferenceGraphView = _graphJs.ReferenceGraphView;
    }, function (_renderGraphJs) {
      RasterSubpass = _renderGraphJs.RasterSubpass;
      RenderGraphValue = _renderGraphJs.RenderGraphValue;
    }, function (_typesJs) {
      AccessType = _typesJs.AccessType;
      ResourceResidency = _typesJs.ResourceResidency;
      SceneFlags = _typesJs.SceneFlags;
    }],
    execute: function () {
      /****************************************************************************
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      ****************************************************************************/
      readViews = new Map();
      PassVisitor = class PassVisitor {
        constructor(context) {
          this.queueID = 0xFFFFFFFF;
          this.sceneID = 0xFFFFFFFF;
          this.passID = 0xFFFFFFFF;
          this.dispatchID = 0xFFFFFFFF;
          this.subpassID = 0xFFFFFFFF;
          // output resourcetexture id
          this.resID = 0xFFFFFFFF;
          this.context = void 0;
          this._currPass = null;
          this._rasterSubpass = null;
          this._resVisitor = void 0;
          this.context = context;
          this._resVisitor = new ResourceVisitor(this.context);
        }
        _isRasterPass(u) {
          return this.context.renderGraph.h(RenderGraphValue.RasterPass, u);
        }
        _isCopyPass(u) {
          return this.context.renderGraph.h(RenderGraphValue.Copy, u);
        }
        _isCompute(u) {
          return this.context.renderGraph.h(RenderGraphValue.Compute, u);
        }
        _isDispatch(u) {
          return this.context.renderGraph.h(RenderGraphValue.Dispatch, u);
        }
        _isQueue(u) {
          return this.context.renderGraph.h(RenderGraphValue.Queue, u);
        }
        _isShadowMap(u) {
          const sceneData = this._getSceneData(u);
          if (sceneData) {
            return sceneData.light && !!sceneData.light.light && (sceneData.flags & SceneFlags.SHADOW_CASTER) !== 0;
          }
          return false;
        }
        _getSceneData(u) {
          if (!this.context.renderGraph.h(RenderGraphValue.Scene, u)) {
            return null;
          }
          return this.context.renderGraph.j(u);
        }
        _isScene(u) {
          return this.context.renderGraph.h(RenderGraphValue.Scene, u);
        }
        _isBlit(u) {
          return this.context.renderGraph.h(RenderGraphValue.Blit, u);
        }
        _isRasterSubpass(u) {
          return this.context.renderGraph.object(u) instanceof RasterSubpass;
        }
        _useResourceInfo(input, raster) {
          const resContext = this.context.resourceContext;
          const useContext = resContext.get(input);
          const resGraph = this.context.resourceGraph;
          // There are resources being used
          if (useContext) {
            const rasters = useContext.rasters;
            const passRaster = rasters.get(this.passID);
            if (passRaster === raster) {
              return;
            }
            const computes = useContext.computes;
            let isPreRaster = false;
            for (const [passId, currRaster] of rasters) {
              if (passId > this.passID) {
                isPreRaster = true;
              }
            }
            for (const [passId] of computes) {
              if (passId > this.passID) {
                isPreRaster = true;
                break;
              }
            }
            rasters.set(this.passID, raster);
          } else {
            const resId = resGraph.vertex(input);
            const trait = resGraph.getTraits(resId);
            switch (trait.residency) {
              case ResourceResidency.PERSISTENT:
                break;
              default:
            }
            const useContext = new ResourceUseContext();
            resContext.set(input, useContext);
            useContext.rasters.set(this.passID, raster);
          }
        }
        _fetchValidPass() {
          const rg = this.context.renderGraph;
          const resContext = this.context.resourceContext;
          const outputId = this.resID;
          const outputName = this.context.resourceGraph.vertexName(outputId);
          readViews.clear();
          const pass = this._currPass;
          const subpasses = pass.subpassGraph._subpasses;
          const validPass = rg.getValid(this.passID);
          for (const [readName, raster] of pass.rasterViews) {
            // Check whether the subpass contains the output resources
            let isSubpassOutput = false;
            for (const subpass of subpasses) {
              if (isSubpassOutput) break;
              for (const resolve of subpass.resolvePairs) {
                if (resolve.target === outputName && resolve.source === readName) {
                  isSubpassOutput = true;
                  break;
                }
              }
            }
            // find the pass
            if ((readName === outputName || isSubpassOutput) && raster.accessType !== AccessType.READ) {
              this._useResourceInfo(readName, raster);
              rg.setValid(this.passID, true);
              rg.setValid(this.queueID, true);
              rg.setValid(this.sceneID, true);
              continue;
            }
            if (raster.accessType !== AccessType.WRITE) {
              readViews.set(readName, raster);
            }
          }
          if (validPass) return;
          if (rg.getValid(this.sceneID)) {
            for (const [readName, raster] of pass.rasterViews) {
              context.pipeline.resourceUses.push(readName);
            }
            let resourceGraph;
            let vertID;
            for (const [rasterName, raster] of readViews) {
              resourceGraph = this.context.resourceGraph;
              vertID = resourceGraph.find(rasterName);
              if (vertID !== 0xFFFFFFFF) {
                this._resVisitor.resID = vertID;
                resourceGraph.visitVertex(this._resVisitor, vertID);
              }
            }
            for (const [computeName, cViews] of pass.computeViews) {
              let resUseContext = resContext.get(computeName);
              if (!resUseContext) {
                resUseContext = new ResourceUseContext();
                resContext.set(computeName, resUseContext);
              }
              const computes = resUseContext.computes;
              const currUseComputes = computes.get(this.passID);
              if (currUseComputes) {
                currUseComputes.push(cViews);
              } else {
                computes.set(this.passID, [cViews]);
              }
              resourceGraph = this.context.resourceGraph;
              vertID = resourceGraph.find(computeName);
              if (vertID !== 0xFFFFFFFF) {
                this._resVisitor.resID = vertID;
                resourceGraph.visitVertex(this._resVisitor, vertID);
              }
            }
          }
        }
        applyID(id, resId) {
          this.resID = resId;
          if (this._isRasterPass(id) || this._isCopyPass(id) || this._isCompute(id)) {
            this.passID = id;
          } else if (this._isQueue(id)) {
            this.queueID = id;
          } else if (this._isRasterSubpass(id)) {
            this.subpassID = id;
          } else if (this._isScene(id) || this._isBlit(id)) {
            this.sceneID = id;
          } else if (this._isDispatch(id)) {
            this.dispatchID = id;
          }
        }
        rasterPass(pass) {
          // const rg = this.context.renderGraph;
          // Since the pass is valid, there is no need to continue traversing.
          // if (rg.getValid(this.passID)) {
          //     return;
          // }
          this._currPass = pass;
        }
        rasterSubpass(value) {
          this._rasterSubpass = value;
        }
        computeSubpass(value) {
          // noop
        }
        compute(value) {
          this._currPass = value;
          const rg = context.renderGraph;
          if (rg.getValid(this.passID)) {
            // Avoid revisiting a valid pass and recursive dependency cycles.
            return;
          }
          rg.setValid(this.passID, true);
          // Trace READ dependencies only; WRITE dependencies are produced by this pass.
          const resourceGraph = this.context.resourceGraph;
          for (const [computeName, cViews] of value.computeViews) {
            if (!cViews.length || cViews[0].accessType !== AccessType.READ) continue;
            const vertID = resourceGraph.find(computeName);
            if (vertID !== 0xFFFFFFFF) {
              this._resVisitor.resID = vertID;
              resourceGraph.visitVertex(this._resVisitor, vertID);
            }
          }
        }
        resolve(value) {
          // noop
        }
        copy(value) {
          const rg = context.renderGraph;
          if (rg.getValid(this.passID)) {
            return;
          }
          const resourceGraph = this.context.resourceGraph;
          this._currPass = value;
          const outputId = this.resID;
          const outputName = resourceGraph.vertexName(outputId);
          let vertID;
          for (const pair of value.copyPairs) {
            if (pair.target === outputName) {
              rg.setValid(this.passID, true);
              vertID = resourceGraph.find(pair.source);
              if (vertID !== 0xFFFFFFFF) {
                this._resVisitor.resID = vertID;
                resourceGraph.visitVertex(this._resVisitor, vertID);
              }
            }
          }
        }
        move(value) {
          // noop
        }
        raytrace(value) {
          // noop
        }
        queue(value) {
          // noop
        }
        scene(value) {
          this._fetchValidPass();
        }
        blit(value) {
          this._fetchValidPass();
        }
        dispatch(value) {
          const rg = this.context.renderGraph;
          rg.setValid(this.queueID, true);
          rg.setValid(this.dispatchID, true);
        }
        clear(value) {
          // noop
        }
        viewport(value) {
          // noop
        }
      };
      PassManagerVisitor = class PassManagerVisitor extends DefaultVisitor {
        set resId(value) {
          this._resId = value;
          this._colorMap.colors.length = context.renderGraph.nv();
        }
        get resId() {
          return this._resId;
        }
        constructor(context, resId) {
          super();
          this._colorMap = void 0;
          this._graphView = void 0;
          this._passVisitor = void 0;
          this._resId = 0xFFFFFFFF;
          this._resId = resId;
          this._passVisitor = new PassVisitor(context);
          this._graphView = new ReferenceGraphView(context.renderGraph);
          this._colorMap = new VectorGraphColorMap(context.renderGraph.nv());
        }
        get graphView() {
          return this._graphView;
        }
        get colorMap() {
          return this._colorMap;
        }
        discoverVertex(u, gv) {
          const g = gv.g;
          this._passVisitor.applyID(u, this.resId);
          g.visitVertex(this._passVisitor, u);
        }
      };
      ResourceVisitor = class ResourceVisitor {
        constructor(context) {
          this._context = void 0;
          this.resID = 0xFFFFFFFF;
          this._passManagerVis = void 0;
          this._context = context;
        }
        managedBuffer(value) {
          // noop
        }
        managedTexture(value) {
          // noop
        }
        managed(value) {
          this.dependency();
        }
        persistentBuffer(value) {
          // noop
        }
        dependency() {
          if (!this._passManagerVis) {
            this._passManagerVis = new PassManagerVisitor(this._context, this.resID);
          } else {
            this._passManagerVis.resId = this.resID;
          }
          depthFirstSearch(this._passManagerVis.graphView, this._passManagerVis, this._passManagerVis.colorMap);
        }
        persistentTexture(value) {
          this.dependency();
        }
        framebuffer(value) {
          this.dependency();
        }
        swapchain(value) {
          this.dependency();
        }
        formatView(value) {
          // noop
        }
        subresourceView(value) {
          // noop
        }
      };
      ResourceUseContext = class ResourceUseContext {
        constructor() {
          // <passID, pass view>
          this.rasters = new Map();
          // <pass Use ID, compute views>
          this.computes = new Map();
        }
      };
      CompilerContext = class CompilerContext {
        constructor() {
          this.resourceGraph = void 0;
          this.pipeline = void 0;
          this.renderGraph = void 0;
          this.layoutGraph = void 0;
          this.resourceContext = void 0;
        }
        set(pipeline, resGraph, renderGraph, layoutGraph) {
          this.pipeline = pipeline;
          this.resourceGraph = resGraph;
          this.renderGraph = renderGraph;
          this.layoutGraph = layoutGraph;
          if (!this.resourceContext) {
            this.resourceContext = new Map();
          }
          this.resourceContext.clear();
        }
      };
      _export("Compiler", Compiler = class Compiler {
        constructor(pipeline, renderGraph, resGraph, layoutGraph) {
          this._resourceGraph = void 0;
          this._pipeline = void 0;
          this._layoutGraph = void 0;
          this._visitor = void 0;
          this._pipeline = pipeline;
          this._resourceGraph = resGraph;
          this._layoutGraph = layoutGraph;
          context.set(this._pipeline, this._resourceGraph, renderGraph, this._layoutGraph);
          this._visitor = new ResourceManagerVisitor(context);
        }
        compile(rg) {
          context.set(this._pipeline, this._resourceGraph, rg, this._layoutGraph);
          context.pipeline.resourceUses.length = 0;
          this._visitor.colorMap.colors.length = context.resourceGraph.nv();
          depthFirstSearch(this._resourceGraph, this._visitor, this._visitor.colorMap);
        }
      });
      context = new CompilerContext();
      _export("ResourceManagerVisitor", ResourceManagerVisitor = class ResourceManagerVisitor extends DefaultVisitor {
        constructor(context) {
          super();
          this._colorMap = void 0;
          this._resourceGraph = void 0;
          this._resVisitor = void 0;
          this._colorMap = new VectorGraphColorMap(context.resourceGraph.nv());
          this._resourceGraph = context.resourceGraph;
          this._resVisitor = new ResourceVisitor(context);
        }
        get colorMap() {
          return this._colorMap;
        }
        discoverVertex(u, gv) {
          const traits = this._resourceGraph.getTraits(u);
          if (traits.residency === ResourceResidency.MANAGED || traits.residency === ResourceResidency.MEMORYLESS) {
            return;
          }
          this._resVisitor.resID = u;
          this._resourceGraph.visitVertex(this._resVisitor, u);
        }
      });
    }
  };
});