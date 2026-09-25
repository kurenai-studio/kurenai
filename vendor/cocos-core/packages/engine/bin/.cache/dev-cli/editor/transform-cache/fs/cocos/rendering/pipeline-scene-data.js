System.register("q-bundled:///fs/cocos/rendering/pipeline-scene-data.js", ["../render-scene/scene/fog.js", "../render-scene/scene/ambient.js", "../render-scene/scene/skybox.js", "../render-scene/scene/shadows.js", "../render-scene/scene/octree.js", "../gfx/index.js", "../asset/assets/index.js", "./shadow/csm-layers.js", "../core/global-exports.js", "../render-scene/scene/skin.js", "../render-scene/scene/post-settings.js"], function (_export, _context) {
  "use strict";

  var Fog, Ambient, Skybox, Shadows, Octree, InputAssemblerInfo, BufferInfo, BufferUsageBit, MemoryUsageBit, Attribute, Format, Material, CSMLayers, cclegacy, Skin, PostSettings, PipelineSceneData, GEOMETRY_RENDERER_TECHNIQUE_COUNT;
  _export("PipelineSceneData", void 0);
  return {
    setters: [function (_renderSceneSceneFogJs) {
      Fog = _renderSceneSceneFogJs.Fog;
    }, function (_renderSceneSceneAmbientJs) {
      Ambient = _renderSceneSceneAmbientJs.Ambient;
    }, function (_renderSceneSceneSkyboxJs) {
      Skybox = _renderSceneSceneSkyboxJs.Skybox;
    }, function (_renderSceneSceneShadowsJs) {
      Shadows = _renderSceneSceneShadowsJs.Shadows;
    }, function (_renderSceneSceneOctreeJs) {
      Octree = _renderSceneSceneOctreeJs.Octree;
    }, function (_gfxIndexJs) {
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      Attribute = _gfxIndexJs.Attribute;
      Format = _gfxIndexJs.Format;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_shadowCsmLayersJs) {
      CSMLayers = _shadowCsmLayersJs.CSMLayers;
    }, function (_coreGlobalExportsJs) {
      cclegacy = _coreGlobalExportsJs.cclegacy;
    }, function (_renderSceneSceneSkinJs) {
      Skin = _renderSceneSceneSkinJs.Skin;
    }, function (_renderSceneScenePostSettingsJs) {
      PostSettings = _renderSceneScenePostSettingsJs.PostSettings;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
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
      GEOMETRY_RENDERER_TECHNIQUE_COUNT = 6;
      _export("PipelineSceneData", PipelineSceneData = class PipelineSceneData {
        /**
          * @en Is open HDR.
          * @zh 是否开启 HDR。
          * @readonly
          */
        get isHDR() {
          return this._isHDR;
        }
        set isHDR(val) {
          this._isHDR = val;
        }
        get shadingScale() {
          return this._shadingScale;
        }
        set shadingScale(val) {
          this._shadingScale = val;
        }
        get csmSupported() {
          return this._csmSupported;
        }
        set csmSupported(val) {
          this._csmSupported = val;
        }

        /**
         * @engineInternal
         * @en Get the Separable-SSS skin standard model.
         * @zh 获取全局的4s标准模型
         * @returns The model id
         */
        get standardSkinModel() {
          return this._standardSkinModel;
        }
        set standardSkinModel(val) {
          this._standardSkinModel = val;
        }

        /**
         * @engineInternal
         * @en Set the Separable-SSS skin standard model component.
         * @zh 设置一个全局的4s标准模型组件
         * @returns The model id
         */
        get standardSkinMeshRenderer() {
          return this._standardSkinMeshRenderer;
        }
        set standardSkinMeshRenderer(val) {
          if (this._standardSkinMeshRenderer && this._standardSkinMeshRenderer !== val) {
            this._standardSkinMeshRenderer.clearGlobalStandardSkinObjectFlag();
          }
          this._standardSkinMeshRenderer = val;
          this.standardSkinModel = val ? val.model : null;
        }
        get skinMaterialModel() {
          return this._skinMaterialModel;
        }
        set skinMaterialModel(val) {
          this._skinMaterialModel = val;
        }
        constructor() {
          this.fog = new Fog();
          this.ambient = new Ambient();
          this.skybox = new Skybox();
          this.shadows = new Shadows();
          this.csmLayers = new CSMLayers();
          this.octree = new Octree();
          this.skin = new Skin();
          this.postSettings = new PostSettings();
          this.lightProbes = cclegacy.internal.LightProbes ? new cclegacy.internal.LightProbes() : null;
          /**
            * @en The list for valid punctual Lights, only available after the scene culling of the current frame.
            * @zh 场景中精确的有效光源，仅在当前帧的场景剔除完成后有效。
            */
          this.validPunctualLights = [];
          /**
            * @en The list for render objects, only available after the scene culling of the current frame.
            * @zh 渲染对象数组，仅在当前帧的场景剔除完成后有效。
            */
          this.renderObjects = [];
          this.shadowFrameBufferMap = new Map();
          this._geometryRendererMaterials = [];
          this._geometryRendererPasses = [];
          this._geometryRendererShaders = [];
          this._occlusionQueryVertexBuffer = null;
          this._occlusionQueryIndicesBuffer = null;
          this._occlusionQueryInputAssembler = null;
          this._occlusionQueryMaterial = null;
          this._occlusionQueryShader = null;
          this._isHDR = true;
          this._shadingScale = 1.0;
          this._csmSupported = true;
          this._standardSkinMeshRenderer = null;
          this._standardSkinModel = null;
          this._skinMaterialModel = null;
          this._shadingScale = 1.0;
        }
        activate(device) {
          this._device = device;
          this.initGeometryRendererMaterials();
          this.initOcclusionQuery();
          return true;
        }
        initGeometryRendererMaterials() {
          let offset = 0;
          const geometryRendererMaterials = this._geometryRendererMaterials;
          for (let tech = 0; tech < GEOMETRY_RENDERER_TECHNIQUE_COUNT; tech++) {
            geometryRendererMaterials[tech] = new Material();
            geometryRendererMaterials[tech]._uuid = `geometry-renderer-material-${tech}`;
            geometryRendererMaterials[tech].initialize({
              effectName: 'internal/builtin-geometry-renderer',
              technique: tech
            });
            const passes = geometryRendererMaterials[tech].passes;
            for (let pass = 0; pass < passes.length; ++pass) {
              this._geometryRendererPasses[offset] = passes[pass];
              this._geometryRendererShaders[offset] = passes[pass].getShaderVariant();
              offset++;
            }
          }
        }
        get geometryRendererPasses() {
          return this._geometryRendererPasses;
        }
        get geometryRendererShaders() {
          return this._geometryRendererShaders;
        }
        initOcclusionQuery() {
          if (!this._occlusionQueryInputAssembler) {
            this._occlusionQueryInputAssembler = this._createOcclusionQueryIA();
          }
          if (!this._occlusionQueryMaterial) {
            const mat = new Material();
            mat._uuid = 'default-occlusion-query-material';
            mat.initialize({
              effectName: 'internal/builtin-occlusion-query'
            });
            this._occlusionQueryMaterial = mat;
            if (mat.passes.length > 0) {
              this._occlusionQueryShader = mat.passes[0].getShaderVariant();
            }
          }
        }
        getOcclusionQueryPass() {
          if (this._occlusionQueryMaterial && this._occlusionQueryMaterial.passes.length > 0) {
            return this._occlusionQueryMaterial.passes[0];
          }
          return null;
        }
        updatePipelineSceneData() {}
        destroy() {
          var _this$_occlusionQuery, _this$_occlusionQuery2, _this$_occlusionQuery3;
          this.shadows.destroy();
          this.csmLayers.destroy();
          this.validPunctualLights.length = 0;
          (_this$_occlusionQuery = this._occlusionQueryInputAssembler) == null || _this$_occlusionQuery.destroy();
          this._occlusionQueryInputAssembler = null;
          (_this$_occlusionQuery2 = this._occlusionQueryVertexBuffer) == null || _this$_occlusionQuery2.destroy();
          this._occlusionQueryVertexBuffer = null;
          (_this$_occlusionQuery3 = this._occlusionQueryIndicesBuffer) == null || _this$_occlusionQuery3.destroy();
          this._occlusionQueryIndicesBuffer = null;
          this._standardSkinMeshRenderer = null;
          this._standardSkinModel = null;
          this._skinMaterialModel = null;
        }
        _createOcclusionQueryIA() {
          // create vertex buffer
          const device = this._device;
          const vertices = new Float32Array([-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1]);
          const vbStride = Float32Array.BYTES_PER_ELEMENT * 3;
          const vbSize = vbStride * 8;
          this._occlusionQueryVertexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, vbSize, vbStride));
          this._occlusionQueryVertexBuffer.update(vertices);

          // create index buffer
          const indices = new Uint16Array([0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 1, 3, 7, 1, 7, 5, 0, 4, 6, 0, 6, 2, 0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3]);
          const ibStride = Uint16Array.BYTES_PER_ELEMENT;
          const ibSize = ibStride * 36;
          this._occlusionQueryIndicesBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, ibSize, ibStride));
          this._occlusionQueryIndicesBuffer.update(indices);
          const attributes = [new Attribute('a_position', Format.RGB32F)];

          // create cube input assembler
          const info = new InputAssemblerInfo(attributes, [this._occlusionQueryVertexBuffer], this._occlusionQueryIndicesBuffer);
          const inputAssembler = device.createInputAssembler(info);
          return inputAssembler;
        }
      });
    }
  };
});