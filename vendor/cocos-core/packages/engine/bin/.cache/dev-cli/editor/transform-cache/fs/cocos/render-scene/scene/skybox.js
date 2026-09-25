System.register("q-bundled:///fs/cocos/render-scene/scene/skybox.js", ["../../asset/asset-manager/builtin-res-mgr.js", "../../asset/assets/material.js", "../../rendering/define.js", "../core/material-instance.js", "../../gfx/index.js", "../../core/index.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var builtinResMgr, Material, UNIFORM_ENVIRONMENT_BINDING, UNIFORM_DIFFUSEMAP_BINDING, MaterialInstance, deviceManager, Enum, cclegacy, getPipelineSceneData, Skybox, skybox_mesh, skybox_material, EnvironmentLightingType;
  _export("Skybox", void 0);
  return {
    setters: [function (_assetAssetManagerBuiltinResMgrJs) {
      builtinResMgr = _assetAssetManagerBuiltinResMgrJs.builtinResMgr;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_renderingDefineJs) {
      UNIFORM_ENVIRONMENT_BINDING = _renderingDefineJs.UNIFORM_ENVIRONMENT_BINDING;
      UNIFORM_DIFFUSEMAP_BINDING = _renderingDefineJs.UNIFORM_DIFFUSEMAP_BINDING;
    }, function (_coreMaterialInstanceJs) {
      MaterialInstance = _coreMaterialInstanceJs.MaterialInstance;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
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
      skybox_mesh = null;
      skybox_material = null;
      _export("EnvironmentLightingType", EnvironmentLightingType = /*#__PURE__*/function (EnvironmentLightingType) {
        /**
         * @zh
         * 半球漫反射
         * @en
         * hemisphere diffuse
         * @readonly
         */
        EnvironmentLightingType[EnvironmentLightingType["HEMISPHERE_DIFFUSE"] = 0] = "HEMISPHERE_DIFFUSE";
        /**
         * @zh
         * 半球漫反射和环境反射
         * @en
         * hemisphere diffuse and Environment reflection
         * @readonly
         */
        EnvironmentLightingType[EnvironmentLightingType["AUTOGEN_HEMISPHERE_DIFFUSE_WITH_REFLECTION"] = 1] = "AUTOGEN_HEMISPHERE_DIFFUSE_WITH_REFLECTION";
        /**
         * @zh
         * 漫反射卷积图和环境反射
         * @en
         * diffuse convolution map and environment reflection
         * @readonly
         */
        EnvironmentLightingType[EnvironmentLightingType["DIFFUSEMAP_WITH_REFLECTION"] = 2] = "DIFFUSEMAP_WITH_REFLECTION";
        return EnvironmentLightingType;
      }({}));
      Enum(EnvironmentLightingType);

      /**
       * @en The skybox configuration of the render scene,
       * currently some rendering options like hdr and ibl lighting configuration is also here.
       * @zh 渲染场景的天空盒配置，目前一些渲染配置，比如 HDR 模式和环境光照配置也在 Skybox 中。
       */
      _export("Skybox", Skybox = class Skybox {
        constructor() {
          this._envmapLDR = null;
          this._envmapHDR = null;
          this._diffuseMapLDR = null;
          this._diffuseMapHDR = null;
          this._globalDSManager = null;
          this._model = null;
          this._default = null;
          this._enabled = false;
          this._useIBL = false;
          this._useHDR = true;
          this._useDiffuseMap = false;
          this._editableMaterial = null;
          this._activated = false;
          this._reflectionHDR = null;
          this._reflectionLDR = null;
          this._rotationAngle = 0;
        }
        /**
         * @en The Model object of the skybox
         * @zh 天空盒的 Model 对象
         */
        get model() {
          return this._model;
        }

        /**
         * @en Whether activate skybox in the scene
         * @zh 是否启用天空盒？
         */
        get enabled() {
          return this._enabled;
        }
        set enabled(val) {
          this._enabled = val;
          if (val) this.activate();else this._updatePipeline();
        }

        /**
         * @en Whether HDR mode is enabled
         * @zh 是否启用HDR？
         */
        get useHDR() {
          return this._useHDR;
        }
        set useHDR(val) {
          this._useHDR = val;
          this.setEnvMaps(this._envmapHDR, this._envmapLDR);
        }

        /**
         * @en Whether use image based lighting for PBR materials
         * @zh 是否启用IBL？
         */
        get useIBL() {
          return this._useIBL;
        }
        set useIBL(val) {
          this._useIBL = val;
          this._updatePipeline();
        }

        /**
         * @en Whether use diffuse convolution map lighting
         * @zh 是否为IBL启用漫反射卷积图？
         */
        get useDiffuseMap() {
          return this._useDiffuseMap;
        }
        set useDiffuseMap(val) {
          this._useDiffuseMap = val;
          this._updatePipeline();
        }

        /**
         * @en Whether enable RGBE data support in skybox shader
         * @zh 是否需要开启 shader 内的 RGBE 数据支持？
         */
        get isRGBE() {
          if (this.envmap) {
            return this.envmap.isRGBE;
          } else {
            return false;
          }
        }

        /**
         * @en Whether to use offline baked convolutional maps
         * @zh 是否使用离线烘焙的卷积图？
         */
        get useConvolutionMap() {
          if (this.reflectionMap) {
            return this.reflectionMap.isUsingOfflineMipmaps();
          }
          if (this.envmap) {
            return this.envmap.isUsingOfflineMipmaps();
          }
          return false;
        }

        /**
         * @en The texture cube used for the skybox
         * @zh 使用的立方体贴图
         */
        get envmap() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._envmapHDR;
          } else {
            return this._envmapLDR;
          }
        }
        set envmap(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this.setEnvMaps(val, this._envmapLDR);
          } else {
            this.setEnvMaps(this._envmapHDR, val);
          }
        }

        /**
         * @en The texture cube used diffuse convolution map
         * @zh 使用的漫反射卷积图
         */
        get diffuseMap() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._diffuseMapHDR;
          } else {
            return this._diffuseMapLDR;
          }
        }
        set diffuseMap(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this.setDiffuseMaps(val, this._diffuseMapLDR);
          } else {
            this.setDiffuseMaps(this._diffuseMapHDR, val);
          }
        }
        get reflectionMap() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._reflectionHDR;
          } else {
            return this._reflectionLDR;
          }
        }
        get editableMaterial() {
          return this._editableMaterial;
        }
        initialize(skyboxInfo) {
          this._activated = false;
          this._enabled = skyboxInfo.enabled;
          this._useIBL = skyboxInfo.useIBL;
          this._useDiffuseMap = skyboxInfo.applyDiffuseMap;
          this._useHDR = skyboxInfo.useHDR;
        }

        /**
         * @en Set the environment maps for HDR and LDR mode
         * @zh 为 HDR 和 LDR 模式设置环境贴图
         * @param envmapHDR @en Environment map for HDR mode @zh HDR 模式下的环境贴图
         * @param envmapLDR @en Environment map for LDR mode @zh LDR 模式下的环境贴图
         */
        setEnvMaps(envmapHDR, envmapLDR) {
          this._envmapHDR = envmapHDR;
          this._envmapLDR = envmapLDR;
          this._updateGlobalBinding();
          this._updatePipeline();
        }

        /**
         * @en Set the diffuse maps
         * @zh 设置环境光漫反射贴图
         * @param diffuseMapHDR @en Diffuse map for HDR mode @zh HDR 模式下的漫反射贴图
         * @param diffuseMapLDR  @en Diffuse map for LDR mode @zh LDR 模式下的漫反射贴图
         */
        setDiffuseMaps(diffuseMapHDR, diffuseMapLDR) {
          this._diffuseMapHDR = diffuseMapHDR;
          this._diffuseMapLDR = diffuseMapLDR;
          this._updateGlobalBinding();
          this._updatePipeline();
        }

        /**
         * @en Set custom skybox material
         * @zh 设置自定义的天空盒材质
         * @param skyboxMat  @en Skybox material @zh 天空盒材质
         */
        setSkyboxMaterial(skyboxMat) {
          if (skyboxMat) {
            this._editableMaterial = new MaterialInstance({
              parent: skyboxMat
            });
            this._editableMaterial.recompileShaders({
              USE_RGBE_CUBEMAP: this.isRGBE
            });
          } else {
            this._editableMaterial = null;
          }
          this._updatePipeline();
        }

        /**
         * @en Set the environment reflection convolution map
         * @zh 设置环境反射卷积图
         * @param reflectionHDR  @en Reflection convolution map for HDR mode @zh HDR 模式下的反射卷积图
         * @param reflectionLDR  @en Reflection convolution map for LDR mode @zh LDR 模式下的反射卷积图
         */
        setReflectionMaps(reflectionHDR, reflectionLDR) {
          this._reflectionHDR = reflectionHDR;
          this._reflectionLDR = reflectionLDR;
          this._updateGlobalBinding();
          this._updatePipeline();
        }

        /**
         * @en Set skybox rotation angle
         * @zh 设置天空盒旋转角度
         * @param angle  @en rotation angle @zh 旋转角度
         */
        setRotationAngle(angle) {
          this._rotationAngle = angle;
        }
        getRotationAngle() {
          return this._rotationAngle;
        }
        updateMaterialRenderInfo() {
          this._updateGlobalBinding();
          this._updatePipeline();
        }
        activate() {
          const pipeline = cclegacy.director.root.pipeline;
          this._globalDSManager = pipeline.globalDSManager;
          this._default = builtinResMgr.get('default-cube-texture');
          if (!this._model) {
            this._model = cclegacy.director.root.createModel(cclegacy.renderer.scene.Model);
            //The skybox material has added properties of 'environmentMap' that need local ubo
            //this._model._initLocalDescriptors = () => {};
            //this._model._initWorldBoundDescriptors = () => {};
          }
          let isRGBE = this._default.isRGBE;
          let isUseConvolutionMap = this._default.isUsingOfflineMipmaps();
          if (this.envmap) {
            isRGBE = this.envmap.isRGBE;
            isUseConvolutionMap = this.envmap.isUsingOfflineMipmaps();
          }
          if (!skybox_material) {
            const mat = new Material();
            mat.initialize({
              effectName: 'pipeline/skybox',
              defines: {
                USE_RGBE_CUBEMAP: isRGBE
              }
            });
            skybox_material = new MaterialInstance({
              parent: mat
            });
          }
          if (this.enabled) {
            if (!skybox_mesh) {
              skybox_mesh = cclegacy.utils.createMesh(cclegacy.primitives.box({
                width: 2,
                height: 2,
                length: 2
              }));
            }
            if (this._editableMaterial) {
              this._model.initSubModel(0, skybox_mesh.renderingSubMeshes[0], this._editableMaterial);
            } else {
              this._model.initSubModel(0, skybox_mesh.renderingSubMeshes[0], skybox_material);
            }
          }
          if (!this.envmap) {
            this.envmap = this._default;
          }
          if (!this.diffuseMap) {
            this.diffuseMap = this._default;
          }
          this._updateGlobalBinding();
          this._updatePipeline();
          this._activated = true;
        }
        _updatePipeline() {
          const root = cclegacy.director.root;
          const pipeline = root.pipeline;
          const useIBLValue = this.useIBL ? this.isRGBE ? 2 : 1 : 0;
          const useDiffuseMapValue = this.useIBL && this.useDiffuseMap && this.diffuseMap && this.diffuseMap !== this._default ? this.isRGBE ? 2 : 1 : 0;
          const useHDRValue = this.useHDR;
          const useConvMapValue = this.useConvolutionMap;
          if (pipeline.macros.CC_USE_IBL !== useIBLValue || pipeline.macros.CC_USE_DIFFUSEMAP !== useDiffuseMapValue || pipeline.macros.CC_USE_HDR !== useHDRValue || pipeline.macros.CC_IBL_CONVOLUTED !== useConvMapValue) {
            pipeline.macros.CC_USE_IBL = useIBLValue;
            pipeline.macros.CC_USE_DIFFUSEMAP = useDiffuseMapValue;
            pipeline.macros.CC_USE_HDR = useHDRValue;
            pipeline.macros.CC_IBL_CONVOLUTED = useConvMapValue;
            if (this._activated) {
              root.onGlobalPipelineStateChanged();
            }
          }
          if (this.enabled) {
            const envmap = this.envmap ? this.envmap : this._default;
            const skyboxMat = this._editableMaterial ? this._editableMaterial : skybox_material;
            if (skyboxMat) {
              skyboxMat.setProperty('environmentMap', envmap);
              skyboxMat.recompileShaders({
                USE_RGBE_CUBEMAP: this.isRGBE
              });
            }
            if (this._model) {
              this._model.setSubModelMaterial(0, skyboxMat);
              this._updateSubModes();
            }
          }
        }
        _updateGlobalBinding() {
          // If it is a new pipeline, you should not set it up because it has its own configuration logic.
          if (cclegacy.rendering) {
            return;
          }
          if (this._globalDSManager) {
            const device = deviceManager.gfxDevice;
            if (this.reflectionMap) {
              const texture = this.reflectionMap.getGFXTexture();
              const sampler = device.getSampler(this.reflectionMap.getSamplerInfo());
              this._globalDSManager.bindSampler(UNIFORM_ENVIRONMENT_BINDING, sampler);
              this._globalDSManager.bindTexture(UNIFORM_ENVIRONMENT_BINDING, texture);
            } else {
              const envmap = this.envmap ? this.envmap : this._default;
              if (envmap) {
                const texture = envmap.getGFXTexture();
                const sampler = device.getSampler(envmap.getSamplerInfo());
                this._globalDSManager.bindSampler(UNIFORM_ENVIRONMENT_BINDING, sampler);
                this._globalDSManager.bindTexture(UNIFORM_ENVIRONMENT_BINDING, texture);
              }
            }
            const diffuseMap = this.diffuseMap ? this.diffuseMap : this._default;
            if (diffuseMap) {
              const texture = diffuseMap.getGFXTexture();
              const sampler = device.getSampler(diffuseMap.getSamplerInfo());
              this._globalDSManager.bindSampler(UNIFORM_DIFFUSEMAP_BINDING, sampler);
              this._globalDSManager.bindTexture(UNIFORM_DIFFUSEMAP_BINDING, texture);
            }
            this._globalDSManager.update();
          }
        }
        _updateSubModes() {
          if (this._model) {
            const subModels = this._model.subModels;
            for (let i = 0; i < subModels.length; i++) {
              subModels[i].update();
            }
          }
        }
      });
      cclegacy.Skybox = Skybox;
    }
  };
});