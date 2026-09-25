System.register("q-bundled:///fs/cocos/rendering/custom/render-graph.js", ["./graph.js", "../../gfx/index.js", "./types.js", "../../core/memop/index.js"], function (_export, _context) {
  "use strict";

  var AdjI, ED, InEI, OutE, OutEI, AccessFlagBit, ClearFlagBit, Color, Format, LoadOp, SampleCount, ShaderStageFlagBit, StoreOp, TextureFlagBit, TextureType, Viewport, AccessType, AttachmentType, ClearValueType, LightInfo, QueueHint, ResourceDimension, ResourceFlags, ResourceResidency, SceneFlags, RecyclePool, ClearValue, RasterView, ComputeView, ResourceDesc, ResourceTraits, RenderSwapchain, ResourceStates, ManagedBuffer, PersistentBuffer, ManagedTexture, PersistentTexture, ManagedResource, Subpass, SubpassGraphVertex, SubpassGraph, RasterSubpass, ComputeSubpass, RasterPass, PersistentRenderPassAndFramebuffer, FormatView, SubresourceView, ResourceGraphVertex, ResourceGraph, ComputePass, ResolvePass, CopyPass, MovePass, RaytracePass, ClearView, RenderQueue, SceneData, Dispatch, Blit, RenderData, RenderGraphVertex, RenderGraph, RenderGraphObjectPool, SubpassGraphComponent, ResourceGraphValue, ResourceGraphComponent, CullingFlags, BlitType, RenderGraphValue, RenderGraphComponent;
  /*
   Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
  
   https://www.cocos.com
  
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

  /**
   * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
   * The following section is auto-generated.
   * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
   */
  /* eslint-disable max-len */

  function resetColor(v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    v.w = 0;
  }
  function resetViewport(v) {
    v.left = 0;
    v.top = 0;
    v.width = 0;
    v.height = 0;
    v.minDepth = 0;
    v.maxDepth = 1;
  }
  function getResourceGraphValueName(e) {
    switch (e) {
      case ResourceGraphValue.Managed:
        return 'Managed';
      case ResourceGraphValue.ManagedBuffer:
        return 'ManagedBuffer';
      case ResourceGraphValue.ManagedTexture:
        return 'ManagedTexture';
      case ResourceGraphValue.PersistentBuffer:
        return 'PersistentBuffer';
      case ResourceGraphValue.PersistentTexture:
        return 'PersistentTexture';
      case ResourceGraphValue.Framebuffer:
        return 'Framebuffer';
      case ResourceGraphValue.Swapchain:
        return 'Swapchain';
      case ResourceGraphValue.FormatView:
        return 'FormatView';
      case ResourceGraphValue.SubresourceView:
        return 'SubresourceView';
      default:
        return '';
    }
  }
  function getRenderGraphValueName(e) {
    switch (e) {
      case RenderGraphValue.RasterPass:
        return 'RasterPass';
      case RenderGraphValue.RasterSubpass:
        return 'RasterSubpass';
      case RenderGraphValue.ComputeSubpass:
        return 'ComputeSubpass';
      case RenderGraphValue.Compute:
        return 'Compute';
      case RenderGraphValue.Resolve:
        return 'Resolve';
      case RenderGraphValue.Copy:
        return 'Copy';
      case RenderGraphValue.Move:
        return 'Move';
      case RenderGraphValue.Raytrace:
        return 'Raytrace';
      case RenderGraphValue.Queue:
        return 'Queue';
      case RenderGraphValue.Scene:
        return 'Scene';
      case RenderGraphValue.Blit:
        return 'Blit';
      case RenderGraphValue.Dispatch:
        return 'Dispatch';
      case RenderGraphValue.Clear:
        return 'Clear';
      case RenderGraphValue.Viewport:
        return 'Viewport';
      default:
        return '';
    }
  }
  function createPool(Constructor) {
    return new RecyclePool(() => new Constructor(), 16);
  }
  _export({
    ClearValue: void 0,
    RasterView: void 0,
    ComputeView: void 0,
    ResourceDesc: void 0,
    ResourceTraits: void 0,
    RenderSwapchain: void 0,
    ResourceStates: void 0,
    ManagedBuffer: void 0,
    PersistentBuffer: void 0,
    ManagedTexture: void 0,
    PersistentTexture: void 0,
    ManagedResource: void 0,
    Subpass: void 0,
    SubpassGraphVertex: void 0,
    SubpassGraph: void 0,
    RasterSubpass: void 0,
    ComputeSubpass: void 0,
    RasterPass: void 0,
    PersistentRenderPassAndFramebuffer: void 0,
    FormatView: void 0,
    SubresourceView: void 0,
    getResourceGraphValueName: getResourceGraphValueName,
    ResourceGraphVertex: void 0,
    ResourceGraph: void 0,
    ComputePass: void 0,
    ResolvePass: void 0,
    CopyPass: void 0,
    MovePass: void 0,
    RaytracePass: void 0,
    ClearView: void 0,
    RenderQueue: void 0,
    SceneData: void 0,
    Dispatch: void 0,
    Blit: void 0,
    RenderData: void 0,
    getRenderGraphValueName: getRenderGraphValueName,
    RenderGraphVertex: void 0,
    RenderGraph: void 0,
    RenderGraphObjectPool: void 0
  });
  return {
    setters: [function (_graphJs) {
      AdjI = _graphJs.AdjI;
      ED = _graphJs.ED;
      InEI = _graphJs.InEI;
      OutE = _graphJs.OutE;
      OutEI = _graphJs.OutEI;
    }, function (_gfxIndexJs) {
      AccessFlagBit = _gfxIndexJs.AccessFlagBit;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
      Format = _gfxIndexJs.Format;
      LoadOp = _gfxIndexJs.LoadOp;
      SampleCount = _gfxIndexJs.SampleCount;
      ShaderStageFlagBit = _gfxIndexJs.ShaderStageFlagBit;
      StoreOp = _gfxIndexJs.StoreOp;
      TextureFlagBit = _gfxIndexJs.TextureFlagBit;
      TextureType = _gfxIndexJs.TextureType;
      Viewport = _gfxIndexJs.Viewport;
    }, function (_typesJs) {
      AccessType = _typesJs.AccessType;
      AttachmentType = _typesJs.AttachmentType;
      ClearValueType = _typesJs.ClearValueType;
      LightInfo = _typesJs.LightInfo;
      QueueHint = _typesJs.QueueHint;
      ResourceDimension = _typesJs.ResourceDimension;
      ResourceFlags = _typesJs.ResourceFlags;
      ResourceResidency = _typesJs.ResourceResidency;
      SceneFlags = _typesJs.SceneFlags;
    }, function (_coreMemopIndexJs) {
      RecyclePool = _coreMemopIndexJs.RecyclePool;
    }],
    execute: function () {
      _export("ClearValue", ClearValue = class ClearValue {
        constructor(x = 0, y = 0, z = 0, w = 0) {
          this.x = x;
          this.y = y;
          this.z = z;
          this.w = w;
        }
        reset(x, y, z, w) {
          this.x = x;
          this.y = y;
          this.z = z;
          this.w = w;
        }
      });
      _export("RasterView", RasterView = class RasterView {
        constructor(slotName = '', accessType = AccessType.WRITE, attachmentType = AttachmentType.RENDER_TARGET, loadOp = LoadOp.LOAD, storeOp = StoreOp.STORE, clearFlags = ClearFlagBit.ALL, clearColor = new Color(), shaderStageFlags = ShaderStageFlagBit.NONE) {
          this.slotName1 = '';
          this.slotID = 0;
          this.slotName = slotName;
          this.accessType = accessType;
          this.attachmentType = attachmentType;
          this.loadOp = loadOp;
          this.storeOp = storeOp;
          this.clearFlags = clearFlags;
          this.clearColor = clearColor;
          this.shaderStageFlags = shaderStageFlags;
        }
        reset(slotName, accessType, attachmentType, loadOp, storeOp, clearFlags, shaderStageFlags) {
          this.slotName = slotName;
          this.slotName1 = '';
          this.accessType = accessType;
          this.attachmentType = attachmentType;
          this.loadOp = loadOp;
          this.storeOp = storeOp;
          this.clearFlags = clearFlags;
          resetColor(this.clearColor);
          this.slotID = 0;
          this.shaderStageFlags = shaderStageFlags;
        }
      });
      _export("ComputeView", ComputeView = class ComputeView {
        constructor(name = '', accessType = AccessType.READ, clearFlags = ClearFlagBit.NONE, clearValueType = ClearValueType.NONE, clearValue = new ClearValue(), shaderStageFlags = ShaderStageFlagBit.NONE) {
          this.plane = 0;
          this.name = name;
          this.accessType = accessType;
          this.clearFlags = clearFlags;
          this.clearValueType = clearValueType;
          this.clearValue = clearValue;
          this.shaderStageFlags = shaderStageFlags;
        }
        reset(name, accessType, clearFlags, clearValueType, shaderStageFlags) {
          this.name = name;
          this.accessType = accessType;
          this.plane = 0;
          this.clearFlags = clearFlags;
          this.clearValueType = clearValueType;
          this.clearValue.reset(0, 0, 0, 0);
          this.shaderStageFlags = shaderStageFlags;
        }
      });
      _export("ResourceDesc", ResourceDesc = class ResourceDesc {
        constructor() {
          this.dimension = ResourceDimension.BUFFER;
          this.alignment = 0;
          this.width = 0;
          this.height = 0;
          this.depthOrArraySize = 0;
          this.mipLevels = 0;
          this.format = Format.UNKNOWN;
          this.sampleCount = SampleCount.X1;
          this.textureFlags = TextureFlagBit.NONE;
          this.flags = ResourceFlags.NONE;
          this.viewType = TextureType.TEX2D;
        }
        reset() {
          this.dimension = ResourceDimension.BUFFER;
          this.alignment = 0;
          this.width = 0;
          this.height = 0;
          this.depthOrArraySize = 0;
          this.mipLevels = 0;
          this.format = Format.UNKNOWN;
          this.sampleCount = SampleCount.X1;
          this.textureFlags = TextureFlagBit.NONE;
          this.flags = ResourceFlags.NONE;
          this.viewType = TextureType.TEX2D;
        }
      });
      _export("ResourceTraits", ResourceTraits = class ResourceTraits {
        constructor(residency = ResourceResidency.MANAGED) {
          this.residency = residency;
        }
        reset(residency) {
          this.residency = residency;
        }
      });
      _export("RenderSwapchain", RenderSwapchain = class RenderSwapchain {
        constructor(swapchain = null, isDepthStencil = false) {
          /*pointer*/
          this.renderWindow = null;
          this.currentID = 0;
          this.numBackBuffers = 0;
          this.generation = 0xFFFFFFFF;
          this.swapchain = swapchain;
          this.isDepthStencil = isDepthStencil;
        }
        reset(swapchain, isDepthStencil) {
          this.swapchain = swapchain;
          this.renderWindow = null;
          this.currentID = 0;
          this.numBackBuffers = 0;
          this.generation = 0xFFFFFFFF;
          this.isDepthStencil = isDepthStencil;
        }
      });
      _export("ResourceStates", ResourceStates = class ResourceStates {
        constructor() {
          this.states = AccessFlagBit.NONE;
        }
        reset() {
          this.states = AccessFlagBit.NONE;
        }
      });
      _export("ManagedBuffer", ManagedBuffer = class ManagedBuffer {
        constructor(buffer = null) {
          this.fenceValue = 0;
          this.buffer = buffer;
        }
        reset(buffer) {
          this.buffer = buffer;
          this.fenceValue = 0;
        }
      });
      _export("PersistentBuffer", PersistentBuffer = class PersistentBuffer {
        constructor(buffer = null) {
          this.fenceValue = 0;
          this.buffer = buffer;
        }
        reset(buffer) {
          this.buffer = buffer;
          this.fenceValue = 0;
        }
      });
      _export("ManagedTexture", ManagedTexture = class ManagedTexture {
        constructor(texture = null) {
          this.fenceValue = 0;
          this.texture = texture;
        }
        reset(texture) {
          this.texture = texture;
          this.fenceValue = 0;
        }
      });
      _export("PersistentTexture", PersistentTexture = class PersistentTexture {
        constructor(texture = null) {
          this.fenceValue = 0;
          this.texture = texture;
        }
        reset(texture) {
          this.texture = texture;
          this.fenceValue = 0;
        }
      });
      _export("ManagedResource", ManagedResource = class ManagedResource {
        constructor() {
          this.unused = 0;
        }
        reset() {
          this.unused = 0;
        }
      });
      _export("Subpass", Subpass = class Subpass {
        constructor() {
          this.rasterViews = new Map();
          this.computeViews = new Map();
          this.resolvePairs = [];
        }
        reset() {
          this.rasterViews.clear();
          this.computeViews.clear();
          this.resolvePairs.length = 0;
        }
      }); //=================================================================
      // SubpassGraph
      //=================================================================
      // Graph Concept
      _export("SubpassGraphVertex", SubpassGraphVertex = class SubpassGraphVertex {
        constructor() {
          /** Out edge list */
          this.o = [];
          /** In edge list */
          this.i = [];
        }
      }); //-----------------------------------------------------------------
      // ComponentGraph Concept
      _export("SubpassGraphComponent", SubpassGraphComponent = {
        Name: 0,
        Subpass: 1
      });
      //-----------------------------------------------------------------
      // SubpassGraph Implementation
      _export("SubpassGraph", SubpassGraph = class SubpassGraph {
        constructor() {
          //-----------------------------------------------------------------
          // Graph
          /** null vertex descriptor */
          this.N = 0xFFFFFFFF;
          this.x = [];
          this._names = [];
          this._subpasses = [];
        }
        // type edge_descriptor = ED;
        //-----------------------------------------------------------------
        // IncidenceGraph
        // type out_edge_iterator = OutEI;
        // type degree_size_type = number;
        edge(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        source(e) {
          return e.source;
        }
        target(e) {
          return e.target;
        }
        oe(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        od(v) {
          return this.x[v].o.length;
        }
        //-----------------------------------------------------------------
        // BidirectionalGraph
        // type in_edge_iterator = InEI;
        ie(v) {
          return new InEI(this.x[v].i.values(), v);
        }
        id(v) {
          return this.x[v].i.length;
        }
        d(v) {
          return this.od(v) + this.id(v);
        }
        //-----------------------------------------------------------------
        // AdjacencyGraph
        // type adjacency_iterator = AdjI;
        adj(v) {
          return new AdjI(this, this.oe(v));
        }
        //-----------------------------------------------------------------
        // VertexListGraph
        v() {
          return this.x.keys();
        }
        nv() {
          return this.x.length;
        }
        //-----------------------------------------------------------------
        // EdgeListGraph
        ne() {
          let numEdges = 0;
          for (const v of this.v()) {
            numEdges += this.od(v);
          }
          return numEdges;
        }
        //-----------------------------------------------------------------
        // MutableGraph
        clear() {
          // ComponentGraph
          this._names.length = 0;
          this._subpasses.length = 0;
          // Graph Vertices
          this.x.length = 0;
        }
        addVertex(name, subpass) {
          const vert = new SubpassGraphVertex();
          const v = this.x.length;
          this.x.push(vert);
          this._names.push(name);
          this._subpasses.push(subpass);
          return v;
        }
        addEdge(u, v) {
          // update in/out edge list
          this.x[u].o.push(new OutE(v));
          this.x[v].i.push(new OutE(u));
          return new ED(u, v);
        }
        //-----------------------------------------------------------------
        // NamedGraph
        vertexName(v) {
          return this._names[v];
        }
        //-----------------------------------------------------------------
        // ComponentGraph
        getName(v) {
          return this._names[v];
        }
        setName(v, value) {
          this._names[v] = value;
        }
        getSubpass(v) {
          return this._subpasses[v];
        }
      });
      _export("RasterSubpass", RasterSubpass = class RasterSubpass {
        constructor(subpassID = 0xFFFFFFFF, count = 1, quality = 0) {
          this.rasterViews = new Map();
          this.computeViews = new Map();
          this.resolvePairs = [];
          this.viewport = new Viewport();
          this.showStatistics = false;
          this.subpassID = subpassID;
          this.count = count;
          this.quality = quality;
        }
        reset(subpassID, count, quality) {
          this.rasterViews.clear();
          this.computeViews.clear();
          this.resolvePairs.length = 0;
          resetViewport(this.viewport);
          this.subpassID = subpassID;
          this.count = count;
          this.quality = quality;
          this.showStatistics = false;
        }
      });
      _export("ComputeSubpass", ComputeSubpass = class ComputeSubpass {
        constructor(subpassID = 0xFFFFFFFF) {
          this.rasterViews = new Map();
          this.computeViews = new Map();
          this.subpassID = subpassID;
        }
        reset(subpassID) {
          this.rasterViews.clear();
          this.computeViews.clear();
          this.subpassID = subpassID;
        }
      });
      _export("RasterPass", RasterPass = class RasterPass {
        constructor() {
          this.rasterViews = new Map();
          this.computeViews = new Map();
          this.attachmentIndexMap = new Map();
          this.textures = new Map();
          this.subpassGraph = new SubpassGraph();
          this.width = 0;
          this.height = 0;
          this.count = 1;
          this.quality = 0;
          this.viewport = new Viewport();
          this.versionName = '';
          this.version = 0;
          this.hashValue = 0;
          this.showStatistics = false;
        }
        reset() {
          this.rasterViews.clear();
          this.computeViews.clear();
          this.attachmentIndexMap.clear();
          this.textures.clear();
          this.subpassGraph.clear();
          this.width = 0;
          this.height = 0;
          this.count = 1;
          this.quality = 0;
          resetViewport(this.viewport);
          this.versionName = '';
          this.version = 0;
          this.hashValue = 0;
          this.showStatistics = false;
        }
      });
      _export("PersistentRenderPassAndFramebuffer", PersistentRenderPassAndFramebuffer = class PersistentRenderPassAndFramebuffer {
        constructor(renderPass = null, framebuffer = null) {
          this.clearColors = [];
          this.clearDepth = 0;
          this.clearStencil = 0;
          this.renderPass = renderPass;
          this.framebuffer = framebuffer;
        }
        reset(renderPass, framebuffer) {
          this.renderPass = renderPass;
          this.framebuffer = framebuffer;
          this.clearColors.length = 0;
          this.clearDepth = 0;
          this.clearStencil = 0;
        }
      });
      _export("FormatView", FormatView = class FormatView {
        constructor() {
          this.format = Format.UNKNOWN;
        }
        reset() {
          this.format = Format.UNKNOWN;
        }
      });
      _export("SubresourceView", SubresourceView = class SubresourceView {
        constructor() {
          /*refcount*/
          this.textureView = null;
          this.format = Format.UNKNOWN;
          this.indexOrFirstMipLevel = 0;
          this.numMipLevels = 0;
          this.firstArraySlice = 0;
          this.numArraySlices = 0;
          this.firstPlane = 0;
          this.numPlanes = 0;
        }
        reset() {
          this.textureView = null;
          this.format = Format.UNKNOWN;
          this.indexOrFirstMipLevel = 0;
          this.numMipLevels = 0;
          this.firstArraySlice = 0;
          this.numArraySlices = 0;
          this.firstPlane = 0;
          this.numPlanes = 0;
        }
      }); //=================================================================
      // ResourceGraph
      //=================================================================
      // PolymorphicGraph Concept
      _export("ResourceGraphValue", ResourceGraphValue = {
        Managed: 0,
        ManagedBuffer: 1,
        ManagedTexture: 2,
        PersistentBuffer: 3,
        PersistentTexture: 4,
        Framebuffer: 5,
        Swapchain: 6,
        FormatView: 7,
        SubresourceView: 8
      });
      //-----------------------------------------------------------------
      // Graph Concept
      _export("ResourceGraphVertex", ResourceGraphVertex = class ResourceGraphVertex {
        constructor(id, object) {
          /** Out edge list */
          this.o = [];
          /** In edge list */
          this.i = [];
          /** Polymorphic object Id */
          this.t = void 0;
          /** Polymorphic object */
          this.j = void 0;
          this.id = id;
          this.object = object;
          this.t = id;
          this.j = object;
        }
      }); //-----------------------------------------------------------------
      // ComponentGraph Concept
      _export("ResourceGraphComponent", ResourceGraphComponent = {
        Name: 0,
        Desc: 1,
        Traits: 2,
        States: 3,
        Sampler: 4
      });
      //-----------------------------------------------------------------
      // ResourceGraph Implementation
      _export("ResourceGraph", ResourceGraph = class ResourceGraph {
        constructor() {
          //-----------------------------------------------------------------
          // Graph
          /** null vertex descriptor */
          this.N = 0xFFFFFFFF;
          this.x = [];
          this._names = [];
          this._descs = [];
          this._traits = [];
          this._states = [];
          this._samplerInfo = [];
          this._valueIndex = new Map();
          this.renderPasses = new Map();
          this.nextFenceValue = 0;
          this.version = 0;
        }
        // type edge_descriptor = ED;
        //-----------------------------------------------------------------
        // IncidenceGraph
        // type out_edge_iterator = OutEI;
        // type degree_size_type = number;
        edge(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        source(e) {
          return e.source;
        }
        target(e) {
          return e.target;
        }
        oe(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        od(v) {
          return this.x[v].o.length;
        }
        //-----------------------------------------------------------------
        // BidirectionalGraph
        // type in_edge_iterator = InEI;
        ie(v) {
          return new InEI(this.x[v].i.values(), v);
        }
        id(v) {
          return this.x[v].i.length;
        }
        d(v) {
          return this.od(v) + this.id(v);
        }
        //-----------------------------------------------------------------
        // AdjacencyGraph
        // type adjacency_iterator = AdjI;
        adj(v) {
          return new AdjI(this, this.oe(v));
        }
        //-----------------------------------------------------------------
        // VertexListGraph
        v() {
          return this.x.keys();
        }
        nv() {
          return this.x.length;
        }
        //-----------------------------------------------------------------
        // EdgeListGraph
        ne() {
          let numEdges = 0;
          for (const v of this.v()) {
            numEdges += this.od(v);
          }
          return numEdges;
        }
        //-----------------------------------------------------------------
        // MutableGraph
        clear() {
          // Members
          this.renderPasses.clear();
          this.nextFenceValue = 0;
          this.version = 0;
          // UuidGraph
          this._valueIndex.clear();
          // ComponentGraph
          this._names.length = 0;
          this._descs.length = 0;
          this._traits.length = 0;
          this._states.length = 0;
          this._samplerInfo.length = 0;
          // Graph Vertices
          this.x.length = 0;
        }
        addVertex(id, object, name, desc, traits, states, sampler, u = 0xFFFFFFFF) {
          const vert = new ResourceGraphVertex(id, object);
          const v = this.x.length;
          this.x.push(vert);
          this._names.push(name);
          this._descs.push(desc);
          this._traits.push(traits);
          this._states.push(states);
          this._samplerInfo.push(sampler);
          // UuidGraph
          this._valueIndex.set(name, v);

          // ReferenceGraph
          if (u !== 0xFFFFFFFF) {
            this.addEdge(u, v);
          }
          return v;
        }
        addEdge(u, v) {
          // update in/out edge list
          this.x[u].o.push(new OutE(v));
          this.x[v].i.push(new OutE(u));
          return new ED(u, v);
        }
        //-----------------------------------------------------------------
        // NamedGraph
        vertexName(v) {
          return this._names[v];
        }
        //-----------------------------------------------------------------
        // ComponentGraph
        getName(v) {
          return this._names[v];
        }
        setName(v, value) {
          this._names[v] = value;
        }
        getDesc(v) {
          return this._descs[v];
        }
        getTraits(v) {
          return this._traits[v];
        }
        getStates(v) {
          return this._states[v];
        }
        getSampler(v) {
          return this._samplerInfo[v];
        }
        //-----------------------------------------------------------------
        // PolymorphicGraph
        h(id, v) {
          return this.x[v].t === id;
        }
        w(v) {
          return this.x[v].t;
        }
        object(v) {
          return this.x[v].j;
        }
        value(id, v) {
          if (this.x[v].t === id) {
            return this.x[v].j;
          } else {
            throw Error('value id not match');
          }
        }
        visitVertex(visitor, v) {
          const vert = this.x[v];
          switch (vert.t) {
            case ResourceGraphValue.Managed:
              return visitor.managed(vert.j);
            case ResourceGraphValue.ManagedBuffer:
              return visitor.managedBuffer(vert.j);
            case ResourceGraphValue.ManagedTexture:
              return visitor.managedTexture(vert.j);
            case ResourceGraphValue.PersistentBuffer:
              return visitor.persistentBuffer(vert.j);
            case ResourceGraphValue.PersistentTexture:
              return visitor.persistentTexture(vert.j);
            case ResourceGraphValue.Framebuffer:
              return visitor.framebuffer(vert.j);
            case ResourceGraphValue.Swapchain:
              return visitor.swapchain(vert.j);
            case ResourceGraphValue.FormatView:
              return visitor.formatView(vert.j);
            case ResourceGraphValue.SubresourceView:
              return visitor.subresourceView(vert.j);
            default:
              throw Error('polymorphic type not found');
          }
        }
        j(v) {
          return this.x[v].j;
        }
        //-----------------------------------------------------------------
        // ReferenceGraph
        // type reference_descriptor = ED;
        // type child_iterator = OutEI;
        // type parent_iterator = InEI;
        reference(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        parent(e) {
          return e.source;
        }
        child(e) {
          return e.target;
        }
        children(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        numChildren(v) {
          return this.x[v].o.length;
        }
        getParent(v) {
          if (v === 0xFFFFFFFF) {
            return 0xFFFFFFFF;
          }
          const list = this.x[v].i;
          if (list.length === 0) {
            return 0xFFFFFFFF;
          } else {
            return list[0].target;
          }
        }
        //-----------------------------------------------------------------
        // MutableReferenceGraph
        addReference(u, v) {
          return this.addEdge(u, v);
        }
        //-----------------------------------------------------------------
        // UuidGraph
        contains(key) {
          return this._valueIndex.has(key);
        }
        vertex(key) {
          return this._valueIndex.get(key);
        }
        find(key) {
          const v = this._valueIndex.get(key);
          if (v === undefined) return 0xFFFFFFFF;
          return v;
        }
      });
      _export("ComputePass", ComputePass = class ComputePass {
        constructor() {
          this.computeViews = new Map();
          this.textures = new Map();
        }
        reset() {
          this.computeViews.clear();
          this.textures.clear();
        }
      });
      _export("ResolvePass", ResolvePass = class ResolvePass {
        constructor() {
          this.resolvePairs = [];
        }
        reset() {
          this.resolvePairs.length = 0;
        }
      });
      _export("CopyPass", CopyPass = class CopyPass {
        constructor() {
          this.copyPairs = [];
          this.uploadPairs = [];
        }
        reset() {
          this.copyPairs.length = 0;
          this.uploadPairs.length = 0;
        }
      });
      _export("MovePass", MovePass = class MovePass {
        constructor() {
          this.movePairs = [];
        }
        reset() {
          this.movePairs.length = 0;
        }
      });
      _export("RaytracePass", RaytracePass = class RaytracePass {
        constructor() {
          this.computeViews = new Map();
        }
        reset() {
          this.computeViews.clear();
        }
      });
      _export("ClearView", ClearView = class ClearView {
        constructor(slotName = '', clearFlags = ClearFlagBit.ALL, clearColor = new Color()) {
          this.slotName = slotName;
          this.clearFlags = clearFlags;
          this.clearColor = clearColor;
        }
        reset(slotName, clearFlags) {
          this.slotName = slotName;
          this.clearFlags = clearFlags;
          resetColor(this.clearColor);
        }
      });
      _export("RenderQueue", RenderQueue = class RenderQueue {
        constructor(hint = QueueHint.RENDER_OPAQUE, phaseID = 0xFFFFFFFF, passLayoutID = 0xFFFFFFFF) {
          this.viewport = null;
          this.hint = hint;
          this.phaseID = phaseID;
          this.passLayoutID = passLayoutID;
        }
        reset(hint, phaseID, passLayoutID) {
          this.hint = hint;
          this.phaseID = phaseID;
          this.passLayoutID = passLayoutID;
          this.viewport = null;
        }
      });
      _export("CullingFlags", CullingFlags = {
        NONE: 0,
        CAMERA_FRUSTUM: 1,
        LIGHT_FRUSTUM: 2,
        LIGHT_BOUNDS: 4
      });
      _export("SceneData", SceneData = class SceneData {
        constructor(scene = null, camera = null, flags = SceneFlags.NONE, light = new LightInfo(), cullingFlags = CullingFlags.CAMERA_FRUSTUM, shadingLight = null) {
          this.scene = scene;
          this.camera = camera;
          this.light = light;
          this.flags = flags;
          this.cullingFlags = cullingFlags;
          this.shadingLight = shadingLight;
        }
        reset(scene, camera, flags, cullingFlags, shadingLight) {
          this.scene = scene;
          this.camera = camera;
          this.light.reset(null, 0, false, null);
          this.flags = flags;
          this.cullingFlags = cullingFlags;
          this.shadingLight = shadingLight;
        }
      });
      _export("Dispatch", Dispatch = class Dispatch {
        constructor(material = null, passID = 0, threadGroupCountX = 0, threadGroupCountY = 0, threadGroupCountZ = 0) {
          this.material = material;
          this.passID = passID;
          this.threadGroupCountX = threadGroupCountX;
          this.threadGroupCountY = threadGroupCountY;
          this.threadGroupCountZ = threadGroupCountZ;
        }
        reset(material, passID, threadGroupCountX, threadGroupCountY, threadGroupCountZ) {
          this.material = material;
          this.passID = passID;
          this.threadGroupCountX = threadGroupCountX;
          this.threadGroupCountY = threadGroupCountY;
          this.threadGroupCountZ = threadGroupCountZ;
        }
      });
      _export("BlitType", BlitType = {
        FULLSCREEN_QUAD: 0,
        DRAW_2D: 1,
        DRAW_PROFILE: 2,
        DRAW_3D: 3
      });
      _export("Blit", Blit = class Blit {
        constructor(material = null, passID = 0, sceneFlags = SceneFlags.NONE, camera = null, blitType = BlitType.FULLSCREEN_QUAD) {
          this.models = [];
          this.material = material;
          this.passID = passID;
          this.sceneFlags = sceneFlags;
          this.camera = camera;
          this.blitType = blitType;
        }
        reset(material, passID, sceneFlags, camera, blitType) {
          this.material = material;
          this.passID = passID;
          this.sceneFlags = sceneFlags;
          this.camera = camera;
          this.blitType = blitType;
          this.models.length = 0;
        }
      });
      _export("RenderData", RenderData = class RenderData {
        constructor() {
          this.constants = new Map();
          this.buffers = new Map();
          this.textures = new Map();
          this.samplers = new Map();
          this.custom = '';
        }
        reset() {
          this.constants.clear();
          this.buffers.clear();
          this.textures.clear();
          this.samplers.clear();
          this.custom = '';
        }
      }); //=================================================================
      // RenderGraph
      //=================================================================
      // PolymorphicGraph Concept
      _export("RenderGraphValue", RenderGraphValue = {
        RasterPass: 0,
        RasterSubpass: 1,
        ComputeSubpass: 2,
        Compute: 3,
        Resolve: 4,
        Copy: 5,
        Move: 6,
        Raytrace: 7,
        Queue: 8,
        Scene: 9,
        Blit: 10,
        Dispatch: 11,
        Clear: 12,
        Viewport: 13
      });
      //-----------------------------------------------------------------
      // Graph Concept
      _export("RenderGraphVertex", RenderGraphVertex = class RenderGraphVertex {
        constructor(id, object) {
          /** Out edge list */
          this.o = [];
          /** In edge list */
          this.i = [];
          /** Child edge list */
          this.c = [];
          /** Parent edge list */
          this.p = [];
          /** Polymorphic object Id */
          this.t = void 0;
          /** Polymorphic object */
          this.j = void 0;
          this.id = id;
          this.object = object;
          this.t = id;
          this.j = object;
        }
      }); //-----------------------------------------------------------------
      // ComponentGraph Concept
      _export("RenderGraphComponent", RenderGraphComponent = {
        Name: 0,
        Layout: 1,
        Data: 2,
        Valid: 3
      });
      //-----------------------------------------------------------------
      // RenderGraph Implementation
      _export("RenderGraph", RenderGraph = class RenderGraph {
        constructor() {
          //-----------------------------------------------------------------
          // Graph
          /** null vertex descriptor */
          this.N = 0xFFFFFFFF;
          this.x = [];
          this._names = [];
          this._layoutNodes = [];
          this._data = [];
          this._valid = [];
          this.index = new Map();
          this.sortedVertices = [];
          this.globalRenderData = new RenderData();
        }
        // type edge_descriptor = ED;
        //-----------------------------------------------------------------
        // IncidenceGraph
        // type out_edge_iterator = OutEI;
        // type degree_size_type = number;
        edge(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        source(e) {
          return e.source;
        }
        target(e) {
          return e.target;
        }
        oe(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        od(v) {
          return this.x[v].o.length;
        }
        //-----------------------------------------------------------------
        // BidirectionalGraph
        // type in_edge_iterator = InEI;
        ie(v) {
          return new InEI(this.x[v].i.values(), v);
        }
        id(v) {
          return this.x[v].i.length;
        }
        d(v) {
          return this.od(v) + this.id(v);
        }
        //-----------------------------------------------------------------
        // AdjacencyGraph
        // type adjacency_iterator = AdjI;
        adj(v) {
          return new AdjI(this, this.oe(v));
        }
        //-----------------------------------------------------------------
        // VertexListGraph
        v() {
          return this.x.keys();
        }
        nv() {
          return this.x.length;
        }
        //-----------------------------------------------------------------
        // EdgeListGraph
        ne() {
          let numEdges = 0;
          for (const v of this.v()) {
            numEdges += this.od(v);
          }
          return numEdges;
        }
        //-----------------------------------------------------------------
        // MutableGraph
        clear() {
          // Members
          this.index.clear();
          this.sortedVertices.length = 0;
          this.globalRenderData.reset();
          // ComponentGraph
          this._names.length = 0;
          this._layoutNodes.length = 0;
          this._data.length = 0;
          this._valid.length = 0;
          // Graph Vertices
          this.x.length = 0;
        }
        addVertex(id, object, name, layout, data, valid, u = 0xFFFFFFFF) {
          const vert = new RenderGraphVertex(id, object);
          const v = this.x.length;
          this.x.push(vert);
          this._names.push(name);
          this._layoutNodes.push(layout);
          this._data.push(data);
          this._valid.push(valid);

          // ReferenceGraph
          if (u !== 0xFFFFFFFF) {
            this.x[u].c.push(new OutE(v));
            vert.p.push(new OutE(u));
          }
          return v;
        }
        addEdge(u, v) {
          // update in/out edge list
          this.x[u].o.push(new OutE(v));
          this.x[v].i.push(new OutE(u));
          return new ED(u, v);
        }
        //-----------------------------------------------------------------
        // NamedGraph
        vertexName(v) {
          return this._names[v];
        }
        //-----------------------------------------------------------------
        // ComponentGraph
        getName(v) {
          return this._names[v];
        }
        setName(v, value) {
          this._names[v] = value;
        }
        getLayout(v) {
          return this._layoutNodes[v];
        }
        setLayout(v, value) {
          this._layoutNodes[v] = value;
        }
        getData(v) {
          return this._data[v];
        }
        getValid(v) {
          return this._valid[v];
        }
        setValid(v, value) {
          this._valid[v] = value;
        }
        //-----------------------------------------------------------------
        // PolymorphicGraph
        h(id, v) {
          return this.x[v].t === id;
        }
        w(v) {
          return this.x[v].t;
        }
        object(v) {
          return this.x[v].j;
        }
        value(id, v) {
          if (this.x[v].t === id) {
            return this.x[v].j;
          } else {
            throw Error('value id not match');
          }
        }
        visitVertex(visitor, v) {
          const vert = this.x[v];
          switch (vert.t) {
            case RenderGraphValue.RasterPass:
              return visitor.rasterPass(vert.j);
            case RenderGraphValue.RasterSubpass:
              return visitor.rasterSubpass(vert.j);
            case RenderGraphValue.ComputeSubpass:
              return visitor.computeSubpass(vert.j);
            case RenderGraphValue.Compute:
              return visitor.compute(vert.j);
            case RenderGraphValue.Resolve:
              return visitor.resolve(vert.j);
            case RenderGraphValue.Copy:
              return visitor.copy(vert.j);
            case RenderGraphValue.Move:
              return visitor.move(vert.j);
            case RenderGraphValue.Raytrace:
              return visitor.raytrace(vert.j);
            case RenderGraphValue.Queue:
              return visitor.queue(vert.j);
            case RenderGraphValue.Scene:
              return visitor.scene(vert.j);
            case RenderGraphValue.Blit:
              return visitor.blit(vert.j);
            case RenderGraphValue.Dispatch:
              return visitor.dispatch(vert.j);
            case RenderGraphValue.Clear:
              return visitor.clear(vert.j);
            case RenderGraphValue.Viewport:
              return visitor.viewport(vert.j);
            default:
              throw Error('polymorphic type not found');
          }
        }
        j(v) {
          return this.x[v].j;
        }
        //-----------------------------------------------------------------
        // ReferenceGraph
        // type reference_descriptor = ED;
        // type child_iterator = OutEI;
        // type parent_iterator = InEI;
        reference(u, v) {
          for (const oe of this.x[u].c) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        parent(e) {
          return e.source;
        }
        child(e) {
          return e.target;
        }
        children(v) {
          return new OutEI(this.x[v].c.values(), v);
        }
        numChildren(v) {
          return this.x[v].c.length;
        }
        getParent(v) {
          if (v === 0xFFFFFFFF) {
            return 0xFFFFFFFF;
          }
          const list = this.x[v].p;
          if (list.length === 0) {
            return 0xFFFFFFFF;
          } else {
            return list[0].target;
          }
        }
        //-----------------------------------------------------------------
        // MutableReferenceGraph
        addReference(u, v) {
          // update in/out edge list
          this.x[u].c.push(new OutE(v));
          this.x[v].p.push(new OutE(u));
          return new ED(u, v);
        }
      });
      _export("RenderGraphObjectPool", RenderGraphObjectPool = class RenderGraphObjectPool {
        constructor(renderCommon) {
          this.renderCommon = void 0;
          this.cv = createPool(ClearValue);
          this.rv = createPool(RasterView);
          this.cv1 = createPool(ComputeView);
          this.rd = createPool(ResourceDesc);
          this.rt = createPool(ResourceTraits);
          this.rs = createPool(RenderSwapchain);
          this.rs1 = createPool(ResourceStates);
          this.mb = createPool(ManagedBuffer);
          this.pb = createPool(PersistentBuffer);
          this.mt = createPool(ManagedTexture);
          this.pt = createPool(PersistentTexture);
          this.mr = createPool(ManagedResource);
          this.s = createPool(Subpass);
          this.sg = createPool(SubpassGraph);
          this.rs2 = createPool(RasterSubpass);
          this.cs = createPool(ComputeSubpass);
          this.rp = createPool(RasterPass);
          this.prpaf = createPool(PersistentRenderPassAndFramebuffer);
          this.fv = createPool(FormatView);
          this.sv = createPool(SubresourceView);
          this.rg = createPool(ResourceGraph);
          this.cp = createPool(ComputePass);
          this.rp1 = createPool(ResolvePass);
          this.cp1 = createPool(CopyPass);
          this.mp = createPool(MovePass);
          this.rp2 = createPool(RaytracePass);
          this.cv2 = createPool(ClearView);
          this.rq = createPool(RenderQueue);
          this.sd = createPool(SceneData);
          this.d = createPool(Dispatch);
          this.b = createPool(Blit);
          this.rd1 = createPool(RenderData);
          this.rg1 = createPool(RenderGraph);
          this.renderCommon = renderCommon;
        }
        reset() {
          this.cv.reset(); // ClearValue
          this.rv.reset(); // RasterView
          this.cv1.reset(); // ComputeView
          this.rd.reset(); // ResourceDesc
          this.rt.reset(); // ResourceTraits
          this.rs.reset(); // RenderSwapchain
          this.rs1.reset(); // ResourceStates
          this.mb.reset(); // ManagedBuffer
          this.pb.reset(); // PersistentBuffer
          this.mt.reset(); // ManagedTexture
          this.pt.reset(); // PersistentTexture
          this.mr.reset(); // ManagedResource
          this.s.reset(); // Subpass
          this.sg.reset(); // SubpassGraph
          this.rs2.reset(); // RasterSubpass
          this.cs.reset(); // ComputeSubpass
          this.rp.reset(); // RasterPass
          this.prpaf.reset(); // PersistentRenderPassAndFramebuffer
          this.fv.reset(); // FormatView
          this.sv.reset(); // SubresourceView
          this.rg.reset(); // ResourceGraph
          this.cp.reset(); // ComputePass
          this.rp1.reset(); // ResolvePass
          this.cp1.reset(); // CopyPass
          this.mp.reset(); // MovePass
          this.rp2.reset(); // RaytracePass
          this.cv2.reset(); // ClearView
          this.rq.reset(); // RenderQueue
          this.sd.reset(); // SceneData
          this.d.reset(); // Dispatch
          this.b.reset(); // Blit
          this.rd1.reset(); // RenderData
          this.rg1.reset(); // RenderGraph
        }
        createClearValue(x = 0, y = 0, z = 0, w = 0) {
          const v = this.cv.add(); // ClearValue
          v.reset(x, y, z, w);
          return v;
        }
        createRasterView(slotName = '', accessType = AccessType.WRITE, attachmentType = AttachmentType.RENDER_TARGET, loadOp = LoadOp.LOAD, storeOp = StoreOp.STORE, clearFlags = ClearFlagBit.ALL, shaderStageFlags = ShaderStageFlagBit.NONE) {
          const v = this.rv.add(); // RasterView
          v.reset(slotName, accessType, attachmentType, loadOp, storeOp, clearFlags, shaderStageFlags);
          return v;
        }
        createComputeView(name = '', accessType = AccessType.READ, clearFlags = ClearFlagBit.NONE, clearValueType = ClearValueType.NONE, shaderStageFlags = ShaderStageFlagBit.NONE) {
          const v = this.cv1.add(); // ComputeView
          v.reset(name, accessType, clearFlags, clearValueType, shaderStageFlags);
          return v;
        }
        createResourceDesc() {
          const v = this.rd.add(); // ResourceDesc
          v.reset();
          return v;
        }
        createResourceTraits(residency = ResourceResidency.MANAGED) {
          const v = this.rt.add(); // ResourceTraits
          v.reset(residency);
          return v;
        }
        createRenderSwapchain(swapchain = null, isDepthStencil = false) {
          const v = this.rs.add(); // RenderSwapchain
          v.reset(swapchain, isDepthStencil);
          return v;
        }
        createResourceStates() {
          const v = this.rs1.add(); // ResourceStates
          v.reset();
          return v;
        }
        createManagedBuffer(buffer = null) {
          const v = this.mb.add(); // ManagedBuffer
          v.reset(buffer);
          return v;
        }
        createPersistentBuffer(buffer = null) {
          const v = this.pb.add(); // PersistentBuffer
          v.reset(buffer);
          return v;
        }
        createManagedTexture(texture = null) {
          const v = this.mt.add(); // ManagedTexture
          v.reset(texture);
          return v;
        }
        createPersistentTexture(texture = null) {
          const v = this.pt.add(); // PersistentTexture
          v.reset(texture);
          return v;
        }
        createManagedResource() {
          const v = this.mr.add(); // ManagedResource
          v.reset();
          return v;
        }
        createSubpass() {
          const v = this.s.add(); // Subpass
          v.reset();
          return v;
        }
        createSubpassGraph() {
          const v = this.sg.add(); // SubpassGraph
          v.clear();
          return v;
        }
        createRasterSubpass(subpassID = 0xFFFFFFFF, count = 1, quality = 0) {
          const v = this.rs2.add(); // RasterSubpass
          v.reset(subpassID, count, quality);
          return v;
        }
        createComputeSubpass(subpassID = 0xFFFFFFFF) {
          const v = this.cs.add(); // ComputeSubpass
          v.reset(subpassID);
          return v;
        }
        createRasterPass() {
          const v = this.rp.add(); // RasterPass
          v.reset();
          return v;
        }
        createPersistentRenderPassAndFramebuffer(renderPass = null, framebuffer = null) {
          const v = this.prpaf.add(); // PersistentRenderPassAndFramebuffer
          v.reset(renderPass, framebuffer);
          return v;
        }
        createFormatView() {
          const v = this.fv.add(); // FormatView
          v.reset();
          return v;
        }
        createSubresourceView() {
          const v = this.sv.add(); // SubresourceView
          v.reset();
          return v;
        }
        createResourceGraph() {
          const v = this.rg.add(); // ResourceGraph
          v.clear();
          return v;
        }
        createComputePass() {
          const v = this.cp.add(); // ComputePass
          v.reset();
          return v;
        }
        createResolvePass() {
          const v = this.rp1.add(); // ResolvePass
          v.reset();
          return v;
        }
        createCopyPass() {
          const v = this.cp1.add(); // CopyPass
          v.reset();
          return v;
        }
        createMovePass() {
          const v = this.mp.add(); // MovePass
          v.reset();
          return v;
        }
        createRaytracePass() {
          const v = this.rp2.add(); // RaytracePass
          v.reset();
          return v;
        }
        createClearView(slotName = '', clearFlags = ClearFlagBit.ALL) {
          const v = this.cv2.add(); // ClearView
          v.reset(slotName, clearFlags);
          return v;
        }
        createRenderQueue(hint = QueueHint.RENDER_OPAQUE, phaseID = 0xFFFFFFFF, passLayoutID = 0xFFFFFFFF) {
          const v = this.rq.add(); // RenderQueue
          v.reset(hint, phaseID, passLayoutID);
          return v;
        }
        createSceneData(scene = null, camera = null, flags = SceneFlags.NONE, cullingFlags = CullingFlags.CAMERA_FRUSTUM, shadingLight = null) {
          const v = this.sd.add(); // SceneData
          v.reset(scene, camera, flags, cullingFlags, shadingLight);
          return v;
        }
        createDispatch(material = null, passID = 0, threadGroupCountX = 0, threadGroupCountY = 0, threadGroupCountZ = 0) {
          const v = this.d.add(); // Dispatch
          v.reset(material, passID, threadGroupCountX, threadGroupCountY, threadGroupCountZ);
          return v;
        }
        createBlit(material = null, passID = 0, sceneFlags = SceneFlags.NONE, camera = null, blitType = BlitType.FULLSCREEN_QUAD) {
          const v = this.b.add(); // Blit
          v.reset(material, passID, sceneFlags, camera, blitType);
          return v;
        }
        createRenderData() {
          const v = this.rd1.add(); // RenderData
          v.reset();
          return v;
        }
        createRenderGraph() {
          const v = this.rg1.add(); // RenderGraph
          v.clear();
          return v;
        }
      });
    }
  };
});