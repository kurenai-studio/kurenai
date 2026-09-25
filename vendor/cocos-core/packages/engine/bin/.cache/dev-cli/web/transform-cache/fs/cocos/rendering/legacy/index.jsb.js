System.register("q-bundled:///fs/cocos/rendering/legacy/index.jsb.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/global-exports.js", "../../core/index.js", "../../native-binding/decorators.js", "../../core/data/class-decorator.js", "../../asset/assets/render-texture.js"], function (_export, _context) {
  "use strict";

  var OPEN_HARMONY, legacyCC, ccenum, CCString, decors, ccclass, serializable, editable, type, RenderTexture, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _dec3, _dec4, _class3, _descriptor3, _descriptor4, _descriptor5, ForwardPipeline, ForwardFlow, ShadowFlow, ForwardStage, ShadowStage, DeferredPipeline, MainFlow, LightingStage, PostProcessStage, GbufferStage, BloomStage, ReflectionProbeFlow, ReflectionProbeStage, RenderPipeline, RenderFlow, RenderStage, forwardPipelineProto, oldForwardOnLoaded, forwardFlowProto, shadowFlowProto, forwardStageProto, shadowStageProto, deferredPipelineProto, oldDeferredOnLoaded, mainFlowProto, gbufferStageProto, lightingStageProto, bloomStageProto, postProcessStageProto, reflectionProbeFlowProto, reflectionProbeStage, RenderTextureConfig, RenderQueueSortMode, RenderQueueDesc, proxyArrayAttribute, Material;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /*
   Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
  
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

  function createDefaultPipeline() {
    const rppl = new ForwardPipeline();
    if (!window.oh) {
      rppl.initialize({
        flows: []
      });
    }
    return rppl;
  }
  function proxyArrayAttributeImpl(proto, attr) {
    const proxyTarget = `_${attr}_target`;
    let arrayProxy = (self, targetArrayAttr) => {
      return new Proxy(self[targetArrayAttr], {
        get(targetArray, prop, receiver) {
          return Reflect.get(targetArray, prop, receiver);
        },
        set(targetArray, prop, receiver) {
          const ret = Reflect.set(targetArray, prop, receiver);
          self[targetArrayAttr] = targetArray;
          return ret;
        }
      });
    };
    Object.defineProperty(proto, attr, {
      configurable: true,
      enumerable: true,
      get: function () {
        this[proxyTarget] || (this[proxyTarget] = []);
        return arrayProxy(this, proxyTarget);
      },
      set: function (v) {
        this[proxyTarget] = v;
      }
    });
  }
  _export("createDefaultPipeline", createDefaultPipeline);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      OPEN_HARMONY = _virtualInternal253AconstantsJs.OPEN_HARMONY;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
      CCString = _coreIndexJs.CCString;
    }, function (_nativeBindingDecoratorsJs) {
      decors = _nativeBindingDecoratorsJs;
    }, function (_coreDataClassDecoratorJs) {
      ccclass = _coreDataClassDecoratorJs.ccclass;
      serializable = _coreDataClassDecoratorJs.serializable;
      editable = _coreDataClassDecoratorJs.editable;
      type = _coreDataClassDecoratorJs.type;
    }, function (_assetAssetsRenderTextureJs) {
      RenderTexture = _assetAssetsRenderTextureJs.RenderTexture;
    }],
    execute: function () {
      _export("ForwardPipeline", ForwardPipeline = nr.ForwardPipeline);
      _export("ForwardFlow", ForwardFlow = nr.ForwardFlow);
      _export("ShadowFlow", ShadowFlow = nr.ShadowFlow);
      _export("ForwardStage", ForwardStage = nr.ForwardStage);
      _export("ShadowStage", ShadowStage = nr.ShadowStage);
      _export("DeferredPipeline", DeferredPipeline = nr.DeferredPipeline);
      _export("MainFlow", MainFlow = nr.MainFlow);
      _export("LightingStage", LightingStage = nr.LightingStage);
      _export("PostProcessStage", PostProcessStage = nr.PostProcessStage);
      _export("GbufferStage", GbufferStage = nr.GbufferStage);
      _export("BloomStage", BloomStage = nr.BloomStage);
      _export("ReflectionProbeFlow", ReflectionProbeFlow = nr.ReflectionProbeFlow);
      _export("ReflectionProbeStage", ReflectionProbeStage = nr.ReflectionProbeStage);
      _export("RenderPipeline", RenderPipeline = nr.RenderPipeline);
      _export("RenderFlow", RenderFlow = nr.RenderFlow);
      _export("RenderStage", RenderStage = nr.RenderStage);
      legacyCC.RenderFlow = RenderFlow;
      legacyCC.RenderStage = RenderStage;
      legacyCC.RenderPipeline = RenderPipeline;
      // ForwardPipeline
      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      forwardPipelineProto = ForwardPipeline.prototype;
      forwardPipelineProto._ctor = function () {
        this._tag = 0;
        this._flows = [];
      };
      forwardPipelineProto.init = function () {
        for (let i = 0; i < this._flows.length; i++) {
          this._flows[i].init(this);
        }
        const info = {
          tag: this._tag,
          flows: this._flows
        };
        this.initialize(info);
      };
      oldForwardOnLoaded = forwardPipelineProto.onLoaded; // hook to invoke init after deserialization
      forwardPipelineProto.onLoaded = function () {
        if (oldForwardOnLoaded) oldForwardOnLoaded.call(this);
        for (let i = 0; i < this._flows.length; i++) {
          this._flows[i].init(this);
        }
        const info = {
          tag: this._tag,
          flows: this._flows
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      forwardFlowProto = ForwardFlow.prototype;
      forwardFlowProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this._stages = [];
      };
      forwardFlowProto.init = function (pipeline) {
        for (let i = 0; i < this._stages.length; i++) {
          this._stages[i].init(pipeline);
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          stages: this._stages
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      shadowFlowProto = ShadowFlow.prototype;
      shadowFlowProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this._stages = [];
      };
      shadowFlowProto.init = function (pipeline) {
        for (let i = 0; i < this._stages.length; i++) {
          this._stages[i].init(pipeline);
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          stages: this._stages
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      forwardStageProto = ForwardStage.prototype;
      forwardStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
      };
      forwardStageProto.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      shadowStageProto = ShadowStage.prototype;
      shadowStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
      };
      shadowStageProto.init = function (pipeline) {
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: []
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      deferredPipelineProto = DeferredPipeline.prototype;
      deferredPipelineProto._ctor = function () {
        this._tag = 0;
        this._flows = [];
        this.renderTextures = [];
        this.materials = [];
      };
      oldDeferredOnLoaded = deferredPipelineProto.onLoaded; // hook to invoke init after deserialization
      deferredPipelineProto.onLoaded = function () {
        if (oldDeferredOnLoaded) oldDeferredOnLoaded.call(this);
        for (let i = 0; i < this._flows.length; i++) {
          this._flows[i].init(this);
        }
        let info = {
          tag: this._tag,
          flows: this._flows
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      mainFlowProto = MainFlow.prototype;
      mainFlowProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this._stages = [];
      };
      mainFlowProto.init = function (pipeline) {
        for (let i = 0; i < this._stages.length; i++) {
          this._stages[i].init(pipeline);
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          stages: this._stages
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      gbufferStageProto = GbufferStage.prototype;
      gbufferStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
      };
      gbufferStageProto.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      lightingStageProto = LightingStage.prototype;
      lightingStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
        this._deferredMaterial = null;
      };
      lightingStageProto.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        pipeline.pipelineSceneData.deferredLightingMaterial = this._deferredMaterial;
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      bloomStageProto = BloomStage.prototype;
      bloomStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
        this._bloomMaterial = null;
      };
      bloomStageProto.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        pipeline.pipelineSceneData.bloomMaterial = this._bloomMaterial;
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      postProcessStageProto = PostProcessStage.prototype;
      postProcessStageProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
        this._postProcessMaterial = null;
      };
      postProcessStageProto.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        pipeline.pipelineSceneData.postProcessMaterial = this._postProcessMaterial;
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      reflectionProbeFlowProto = ReflectionProbeFlow.prototype;
      reflectionProbeFlowProto._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this._stages = [];
      };
      reflectionProbeFlowProto.init = function (pipeline) {
        for (let i = 0; i < this._stages.length; i++) {
          this._stages[i].init(pipeline);
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          stages: this._stages
        };
        this.initialize(info);
      };

      // TODO: we mark it as type of any, because here we have many dynamic injected property @dumganhar
      reflectionProbeStage = ReflectionProbeStage.prototype;
      reflectionProbeStage._ctor = function () {
        this._name = 0;
        this._priority = 0;
        this._tag = 0;
        this.renderQueues = [];
      };
      reflectionProbeStage.init = function (pipeline) {
        const queues = [];
        for (let i = 0; i < this.renderQueues.length; i++) {
          // @ts-ignore
          queues.push(this.renderQueues[i].init());
        }
        const info = {
          name: this._name,
          priority: this._priority,
          tag: this._tag,
          renderQueues: queues
        };
        this.initialize(info);
      };
      RenderTextureConfig = (_dec = ccclass('RenderTextureConfig'), _dec2 = type(RenderTexture), _dec(_class = (_class2 = class RenderTextureConfig {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor, this);
          _initializerDefineProperty(this, "texture", _descriptor2, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "texture", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class);
      _export("RenderQueueSortMode", RenderQueueSortMode = /*#__PURE__*/function (RenderQueueSortMode) {
        RenderQueueSortMode[RenderQueueSortMode["FRONT_TO_BACK"] = 0] = "FRONT_TO_BACK";
        RenderQueueSortMode[RenderQueueSortMode["BACK_TO_FRONT"] = 1] = "BACK_TO_FRONT";
        return RenderQueueSortMode;
      }({}));
      ccenum(RenderQueueSortMode);
      _export("RenderQueueDesc", RenderQueueDesc = (_dec3 = type(RenderQueueSortMode), _dec4 = type([CCString]), _class3 = class RenderQueueDesc {
        constructor() {
          /**
          * @en Whether the render queue is a transparent queue
          * @zh 当前队列是否是半透明队列
          */
          _initializerDefineProperty(this, "isTransparent", _descriptor3, this);
          /**
           * @en The sort mode of the render queue
           * @zh 渲染队列的排序模式
           */
          _initializerDefineProperty(this, "sortMode", _descriptor4, this);
          /**
          * @en The stages using this queue
          * @zh 使用当前渲染队列的阶段列表
          */
          _initializerDefineProperty(this, "stages", _descriptor5, this);
          this.stages = [];
        }
        init() {
          return new nr.RenderQueueDesc(this.isTransparent, this.sortMode, this.stages);
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class3.prototype, "isTransparent", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class3.prototype, "sortMode", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return RenderQueueSortMode.FRONT_TO_BACK;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class3.prototype, "stages", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class3));
      proxyArrayAttribute = proxyArrayAttributeImpl;
      if (!OPEN_HARMONY) {
        // WORKAROUND: the proxy array getLength crashed on OH platform
        proxyArrayAttribute(RenderFlow.prototype, '_stages');
        proxyArrayAttribute(RenderPipeline.prototype, '_flows');
      }

      //-------------------- register types -------------------- 
      Material = jsb.Material;
      decors.patch_GbufferStage({
        GbufferStage,
        RenderQueueDesc
      });
      decors.patch_LightingStage({
        LightingStage,
        RenderQueueDesc,
        Material
      });
      decors.patch_BloomStage({
        BloomStage,
        Material
      });
      decors.patch_PostProcessStage({
        PostProcessStage,
        Material,
        RenderQueueDesc
      });
      decors.patch_ForwardStage({
        ForwardStage,
        RenderQueueDesc
      });
      decors.patch_ShadowStage({
        ShadowStage
      });
      decors.patch_ReflectionProbeStage({
        ReflectionProbeStage
      });
      decors.patch_MainFlow({
        MainFlow
      });
      decors.patch_ForwardFlow({
        ForwardFlow
      });
      decors.patch_ShadowFlow({
        ShadowFlow
      });
      decors.patch_ReflectionProbeFlow({
        ReflectionProbeFlow
      });
      decors.patch_ForwardPipeline({
        ForwardPipeline,
        RenderTextureConfig
      });
      decors.patch_DeferredPipeline({
        DeferredPipeline,
        RenderTextureConfig
      });
      decors.patch_RenderQueueDesc({
        RenderQueueDesc,
        RenderQueueSortMode,
        CCString
      });
      decors.patch_RenderStage({
        RenderStage
      });
      decors.patch_RenderFlow({
        RenderFlow,
        RenderStage
      });
      decors.patch_cc_RenderPipeline({
        RenderPipeline,
        RenderFlow
      });
    }
  };
});