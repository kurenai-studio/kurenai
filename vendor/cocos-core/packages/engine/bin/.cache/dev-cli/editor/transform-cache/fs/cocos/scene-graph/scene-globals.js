System.register("q-bundled:///fs/cocos/scene-graph/scene-globals.js", ["../core/data/decorators/index.js", "../asset/assets/texture-cube.js", "../core/data/utils/attribute.js", "../core/math/index.js", "../render-scene/scene/ambient.js", "../render-scene/scene/shadows.js", "../render-scene/scene/skybox.js", "../render-scene/scene/fog.js", "../core/global-exports.js", "../core/platform/debug.js", "../asset/assets/material.js", "../core/index.js", "./node-event.js", "../render-scene/scene/post-settings.js", "../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, visible, type, displayOrder, readOnly, slide, range, rangeStep, editable, serializable, rangeMin, tooltip, formerlySerializedAs, displayName, TextureCube, CCFloat, CCInteger, Color, Quat, Vec3, Vec2, Vec4, v3, Ambient, ShadowType, ShadowSize, EnvironmentLightingType, FogType, legacyCC, warnID, Material, cclegacy, NodeEventType, ToneMappingType, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _class3, _class4, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _dec69, _class5, _class6, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _FogInfo, _dec70, _dec71, _dec72, _dec73, _dec74, _dec75, _dec76, _dec77, _dec78, _dec79, _dec80, _dec81, _dec82, _dec83, _dec84, _dec85, _dec86, _dec87, _dec88, _dec89, _class7, _class8, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _dec90, _dec91, _dec92, _dec93, _dec94, _dec95, _dec96, _dec97, _dec98, _class9, _class0, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _dec99, _dec100, _dec101, _dec102, _dec103, _dec104, _dec105, _dec106, _dec107, _class1, _class10, _descriptor38, _descriptor39, _descriptor40, _dec108, _dec109, _dec110, _class11, _class12, _descriptor41, _dec111, _dec112, _dec113, _dec114, _dec115, _dec116, _dec117, _dec118, _dec119, _dec120, _dec121, _dec122, _dec123, _dec124, _dec125, _dec126, _dec127, _dec128, _dec129, _dec130, _class13, _class14, _descriptor42, _descriptor43, _descriptor44, _descriptor45, _descriptor46, _descriptor47, _descriptor48, _descriptor49, _descriptor50, _dec131, _dec132, _class15, _class16, _descriptor51, _descriptor52, _descriptor53, _descriptor54, _descriptor55, _descriptor56, _descriptor57, _descriptor58, _descriptor59, _descriptor60, _up, _v3, _v4, _col, _qt, normalizeHDRColor, AmbientInfo, SkyboxInfo, FogInfo, ShadowsInfo, DEFAULT_WORLD_MIN_POS, DEFAULT_WORLD_MAX_POS, DEFAULT_OCTREE_DEPTH, OctreeInfo, SkinInfo, PostSettingsInfo, LightProbeInfo, SceneGlobals;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      visible = _coreDataDecoratorsIndexJs.visible;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      readOnly = _coreDataDecoratorsIndexJs.readOnly;
      slide = _coreDataDecoratorsIndexJs.slide;
      range = _coreDataDecoratorsIndexJs.range;
      rangeStep = _coreDataDecoratorsIndexJs.rangeStep;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      displayName = _coreDataDecoratorsIndexJs.displayName;
    }, function (_assetAssetsTextureCubeJs) {
      TextureCube = _assetAssetsTextureCubeJs.TextureCube;
    }, function (_coreDataUtilsAttributeJs) {
      CCFloat = _coreDataUtilsAttributeJs.CCFloat;
      CCInteger = _coreDataUtilsAttributeJs.CCInteger;
    }, function (_coreMathIndexJs) {
      Color = _coreMathIndexJs.Color;
      Quat = _coreMathIndexJs.Quat;
      Vec3 = _coreMathIndexJs.Vec3;
      Vec2 = _coreMathIndexJs.Vec2;
      Vec4 = _coreMathIndexJs.Vec4;
      v3 = _coreMathIndexJs.v3;
    }, function (_renderSceneSceneAmbientJs) {
      Ambient = _renderSceneSceneAmbientJs.Ambient;
    }, function (_renderSceneSceneShadowsJs) {
      ShadowType = _renderSceneSceneShadowsJs.ShadowType;
      ShadowSize = _renderSceneSceneShadowsJs.ShadowSize;
    }, function (_renderSceneSceneSkyboxJs) {
      EnvironmentLightingType = _renderSceneSceneSkyboxJs.EnvironmentLightingType;
    }, function (_renderSceneSceneFogJs) {
      FogType = _renderSceneSceneFogJs.FogType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_nodeEventJs) {
      NodeEventType = _nodeEventJs.NodeEventType;
    }, function (_renderSceneScenePostSettingsJs) {
      ToneMappingType = _renderSceneScenePostSettingsJs.ToneMappingType;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
    }],
    execute: function () {
      /* eslint-disable func-names */
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
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
      */
      _up = new Vec3(0, 1, 0);
      _v3 = new Vec3();
      _v4 = new Vec4();
      _col = new Color();
      _qt = new Quat(); // Normalize HDR color
      normalizeHDRColor = color => {
        const intensity = 1.0 / Math.max(Math.max(Math.max(color.x, color.y), color.z), 0.0001);
        if (intensity < 1.0) {
          color.x *= intensity;
          color.y *= intensity;
          color.z *= intensity;
        }
      };
      /**
       * @en Environment lighting configuration in the Scene
       * @zh 场景的环境光照相关配置
       */
      _export("AmbientInfo", AmbientInfo = (_dec = ccclass('cc.AmbientInfo'), _dec2 = visible(() => {
        const scene = legacyCC.director.getScene();
        const skybox = scene.globals.skybox;
        if (skybox.useIBL && skybox.applyDiffuseMap) {
          return false;
        } else {
          return true;
        }
      }), _dec3 = tooltip('i18n:ambient.skyLightingColor'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:ambient.skyIllum'), _dec6 = range([0, Number.POSITIVE_INFINITY, 100]), _dec7 = visible(() => {
        const scene = legacyCC.director.getScene();
        const skybox = scene.globals.skybox;
        if (skybox.useIBL && skybox.applyDiffuseMap) {
          return false;
        } else {
          return true;
        }
      }), _dec8 = tooltip('i18n:ambient.groundLightingColor'), _dec9 = formerlySerializedAs('_skyColor'), _dec0 = formerlySerializedAs('_skyIllum'), _dec1 = formerlySerializedAs('_groundAlbedo'), _dec(_class = (_class2 = class AmbientInfo {
        constructor() {
          _initializerDefineProperty(this, "_skyColorHDR", _descriptor, this);
          _initializerDefineProperty(this, "_skyIllumHDR", _descriptor2, this);
          _initializerDefineProperty(this, "_groundAlbedoHDR", _descriptor3, this);
          _initializerDefineProperty(this, "_skyColorLDR", _descriptor4, this);
          _initializerDefineProperty(this, "_skyIllumLDR", _descriptor5, this);
          _initializerDefineProperty(this, "_groundAlbedoLDR", _descriptor6, this);
          this._resource = null;
        }
        /**
         * @en The sky color in HDR mode
         * @zh HDR 模式下的天空光照色
         */
        get skyColorHDR() {
          return this._skyColorHDR;
        }

        /**
         * @en The ground color in HDR mode
         * @zh HDR 模式下的地面光照色
         */
        get groundAlbedoHDR() {
          return this._groundAlbedoHDR;
        }

        /**
         * @en Sky illuminance in HDR mode
         * @zh HDR 模式下的天空亮度
         */
        get skyIllumHDR() {
          return this._skyIllumHDR;
        }

        /**
         * @en The sky color in LDR mode
         * @zh LDR 模式下的天空光照色
         */
        get skyColorLDR() {
          return this._skyColorLDR;
        }

        /**
         * @en The ground color in LDR mode
         * @zh LDR 模式下的地面光照色
         */
        get groundAlbedoLDR() {
          return this._groundAlbedoLDR;
        }

        /**
         * @en Sky illuminance in LDR mode
         * @zh LDR 模式下的天空亮度
         */
        get skyIllumLDR() {
          return this._skyIllumLDR;
        }

        /**
         * @en Sky lighting color configurable in editor with color picker
         * @zh 编辑器中可配置的天空光照颜色（通过颜色拾取器）
         */
        set skyLightingColor(val) {
          _v4.set(val.x, val.y, val.z, val.w);
          if (getPipelineSceneData().isHDR) {
            this._skyColorHDR.set(_v4);
          } else {
            this._skyColorLDR.set(_v4);
          }
          if (this._resource) {
            this._resource.skyColor.set(_v4);
          }
        }
        get skyLightingColor() {
          const isHDR = getPipelineSceneData().isHDR;
          _v4.set(isHDR ? this._skyColorHDR : this._skyColorLDR);
          normalizeHDRColor(_v4);
          return _col.set(_v4.x * 255, _v4.y * 255, _v4.z * 255, 255);
        }

        /**
         * @internal
         */
        set skyColor(val) {
          if (getPipelineSceneData().isHDR) {
            this._skyColorHDR.set(val);
          } else {
            this._skyColorLDR.set(val);
          }
          if (this._resource) {
            this._resource.skyColor.set(val);
          }
        }

        /**
         * @en Sky illuminance
         * @zh 天空亮度
         */
        set skyIllum(val) {
          if (getPipelineSceneData().isHDR) {
            this._skyIllumHDR = val;
          } else {
            this._skyIllumLDR = val;
          }
          if (this._resource) {
            this._resource.skyIllum = val;
          }
        }
        get skyIllum() {
          if (getPipelineSceneData().isHDR) {
            return this._skyIllumHDR;
          } else {
            return this._skyIllumLDR;
          }
        }

        /**
         * @en Ground lighting color configurable in editor with color picker
         * @zh 编辑器中可配置的地面光照颜色（通过颜色拾取器）
         */
        set groundLightingColor(val) {
          _v4.set(val.x, val.y, val.z, val.w);
          if (getPipelineSceneData().isHDR) {
            this._groundAlbedoHDR.set(_v4);
          } else {
            this._groundAlbedoLDR.set(_v4);
          }
          if (this._resource) {
            this._resource.groundAlbedo.set(_v4);
          }
        }
        get groundLightingColor() {
          const isHDR = getPipelineSceneData().isHDR;
          _v4.set(isHDR ? this._groundAlbedoHDR : this._groundAlbedoLDR);
          normalizeHDRColor(_v4);
          return _col.set(_v4.x * 255, _v4.y * 255, _v4.z * 255, 255);
        }

        /**
         * @internal
         */
        set groundAlbedo(val) {
          if (getPipelineSceneData().isHDR) {
            this._groundAlbedoHDR.set(val);
          } else {
            this._groundAlbedoLDR.set(val);
          }
          if (this._resource) {
            this._resource.groundAlbedo.set(val);
          }
        }
        /**
         * @en Activate the ambient lighting configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用环境光照设置，不需要手动调用
         * @param resource The ambient configuration object in the render scene
         */
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "skyLightingColor", [_dec2, editable, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "skyLightingColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "skyIllum", [editable, _dec4, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "skyIllum"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "groundLightingColor", [_dec7, editable, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "groundLightingColor"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_skyColorHDR", [serializable, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec4(0.2, 0.5, 0.8, 1.0);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_skyIllumHDR", [serializable, _dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Ambient.SKY_ILLUM;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_groundAlbedoHDR", [serializable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec4(0.2, 0.2, 0.2, 1.0);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_skyColorLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec4(0.2, 0.5, 0.8, 1.0);
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_skyIllumLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Ambient.SKY_ILLUM;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_groundAlbedoLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec4(0.2, 0.2, 0.2, 1.0);
        }
      }), _class2)) || _class));
      legacyCC.AmbientInfo = AmbientInfo;

      /**
       * @en Skybox related configuration
       * @zh 天空盒相关配置
       */
      _export("SkyboxInfo", SkyboxInfo = (_dec10 = ccclass('cc.SkyboxInfo'), _dec11 = tooltip('i18n:skybox.enabled'), _dec12 = type(EnvironmentLightingType), _dec13 = tooltip('i18n:skybox.EnvironmentLightingType'), _dec14 = tooltip('i18n:skybox.useHDR'), _dec15 = type(TextureCube), _dec16 = tooltip('i18n:skybox.envmap'), _dec17 = type(CCFloat), _dec18 = range([0, 360, 1]), _dec19 = tooltip('i18n:skybox.rotationAngle'), _dec20 = visible(function () {
        if (this.useIBL && this.applyDiffuseMap) {
          return true;
        }
        return false;
      }), _dec21 = type(TextureCube), _dec22 = displayOrder(100), _dec23 = visible(function () {
        var _this$_resource;
        if ((_this$_resource = this._resource) != null && _this$_resource.reflectionMap) {
          return true;
        }
        return false;
      }), _dec24 = type(TextureCube), _dec25 = displayOrder(100), _dec26 = type(Material), _dec27 = tooltip('i18n:skybox.material'), _dec28 = type(TextureCube), _dec29 = formerlySerializedAs('_envmap'), _dec30 = type(TextureCube), _dec31 = type(TextureCube), _dec32 = type(TextureCube), _dec33 = type(Material), _dec34 = type(TextureCube), _dec35 = type(TextureCube), _dec10(_class3 = (_class4 = class SkyboxInfo {
        constructor() {
          _initializerDefineProperty(this, "_envLightingType", _descriptor7, this);
          _initializerDefineProperty(this, "_envmapHDR", _descriptor8, this);
          _initializerDefineProperty(this, "_envmapLDR", _descriptor9, this);
          _initializerDefineProperty(this, "_diffuseMapHDR", _descriptor0, this);
          _initializerDefineProperty(this, "_diffuseMapLDR", _descriptor1, this);
          _initializerDefineProperty(this, "_enabled", _descriptor10, this);
          _initializerDefineProperty(this, "_useHDR", _descriptor11, this);
          _initializerDefineProperty(this, "_editableMaterial", _descriptor12, this);
          _initializerDefineProperty(this, "_reflectionHDR", _descriptor13, this);
          _initializerDefineProperty(this, "_reflectionLDR", _descriptor14, this);
          _initializerDefineProperty(this, "_rotationAngle", _descriptor15, this);
          this._resource = null;
        }
        /**
         * @en Whether to use diffuse convolution map. Enabled -> Will use map specified. Disabled -> Will revert to hemispheric lighting
         * @zh 是否为IBL启用漫反射卷积图？不启用的话将使用默认的半球光照
         */
        set applyDiffuseMap(val) {
          if (this._resource) {
            this._resource.useDiffuseMap = val;
          }
        }
        get applyDiffuseMap() {
          if (EnvironmentLightingType.DIFFUSEMAP_WITH_REFLECTION === this._envLightingType) {
            return true;
          }
          return false;
        }
        /**
         * @en Whether activate skybox in the scene
         * @zh 是否启用天空盒？
         */
        set enabled(val) {
          if (this._enabled === val) return;
          this._enabled = val;
          if (this._resource) {
            this._resource.enabled = this._enabled;
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @zh 环境反射类型
         * @en environment reflection type
         */
        set envLightingType(val) {
          if (!this.envmap && EnvironmentLightingType.HEMISPHERE_DIFFUSE !== val) {
            this.useIBL = false;
            this.applyDiffuseMap = false;
            this._envLightingType = EnvironmentLightingType.HEMISPHERE_DIFFUSE;
            warnID(15001);
          } else {
            if (EnvironmentLightingType.HEMISPHERE_DIFFUSE === val) {
              this.useIBL = false;
              this.applyDiffuseMap = false;
            } else if (EnvironmentLightingType.AUTOGEN_HEMISPHERE_DIFFUSE_WITH_REFLECTION === val) {
              this.useIBL = true;
              this.applyDiffuseMap = false;
            } else if (EnvironmentLightingType.DIFFUSEMAP_WITH_REFLECTION === val) {
              this.useIBL = true;
              this.applyDiffuseMap = true;
            }
            this._envLightingType = val;
          }
        }
        get envLightingType() {
          return this._envLightingType;
        }
        /**
         * @en Whether use environment lighting
         * @zh 是否启用环境光照？
         */
        set useIBL(val) {
          if (this._resource) {
            this._resource.useIBL = val;
          }
        }
        get useIBL() {
          if (EnvironmentLightingType.HEMISPHERE_DIFFUSE !== this._envLightingType) {
            return true;
          }
          return false;
        }

        /**
         * @en Toggle HDR (TODO: This SHOULD be moved into it's own subgroup away from skybox)
         * @zh 是否启用HDR？
         */
        set useHDR(val) {
          getPipelineSceneData().isHDR = val;
          this._useHDR = val;
          const resource = this._resource;

          // Switch UI to and from LDR/HDR textures depends on HDR state
          if (resource) {
            if (this.envLightingType === EnvironmentLightingType.DIFFUSEMAP_WITH_REFLECTION) {
              if (this.diffuseMap === null) {
                this.envLightingType = EnvironmentLightingType.AUTOGEN_HEMISPHERE_DIFFUSE_WITH_REFLECTION;
                warnID(15000);
              } else if (this.diffuseMap.isDefault) {
                warnID(15002);
              }
            }
          }
          if (resource) {
            resource.useHDR = this._useHDR;
            resource.updateMaterialRenderInfo();
          }
        }
        get useHDR() {
          getPipelineSceneData().isHDR = this._useHDR;
          return this._useHDR;
        }

        /**
         * @en The texture cube used for the skybox
         * @zh 使用的立方体贴图
         */
        set envmap(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._envmapHDR = val;
            this._reflectionHDR = null;
          } else {
            this._envmapLDR = val;
            this._reflectionLDR = null;
          }
          if (!val) {
            if (isHDR) {
              this._diffuseMapHDR = null;
            } else {
              this._diffuseMapLDR = null;
            }
            this.applyDiffuseMap = false;
            this.useIBL = false;
            this.envLightingType = EnvironmentLightingType.HEMISPHERE_DIFFUSE;
            warnID(15001);
          }
          const resource = this._resource;
          if (resource) {
            resource.setEnvMaps(this._envmapHDR, this._envmapLDR);
            resource.setDiffuseMaps(this._diffuseMapHDR, this._diffuseMapLDR);
            resource.setReflectionMaps(this._reflectionHDR, this._reflectionLDR);
            resource.useDiffuseMap = this.applyDiffuseMap;
            resource.envmap = val;
          }
        }
        get envmap() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._envmapHDR;
          } else {
            return this._envmapLDR;
          }
        }

        /**
         * @en Rotate the skybox
         * @zh 旋转天空盒
         */
        set rotationAngle(val) {
          this._rotationAngle = val;
          if (this._resource) {
            this._resource.setRotationAngle(this._rotationAngle);
          }
        }
        get rotationAngle() {
          return this._rotationAngle;
        }

        /**
         * @en The optional diffusion convolution map used in tandem with IBL
         * @zh 使用的漫反射卷积图
         */
        set diffuseMap(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._diffuseMapHDR = val;
          } else {
            this._diffuseMapLDR = val;
          }
          if (this._resource) {
            this._resource.setDiffuseMaps(this._diffuseMapHDR, this._diffuseMapLDR);
          }
        }
        get diffuseMap() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._diffuseMapHDR;
          } else {
            return this._diffuseMapLDR;
          }
        }

        /**
         * @en Convolutional map using environmental reflections
         * @zh 使用环境反射卷积图
         */
        set reflectionMap(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._reflectionHDR = val;
          } else {
            this._reflectionLDR = val;
          }
          if (this._resource) {
            this._resource.setReflectionMaps(this._reflectionHDR, this._reflectionLDR);
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

        /**
         * @en Use custom skybox material
         * @zh 使用自定义的天空盒材质
         */
        set skyboxMaterial(val) {
          this._editableMaterial = val;
          if (this._resource) {
            this._resource.setSkyboxMaterial(this._editableMaterial);
          }
        }
        get skyboxMaterial() {
          return this._editableMaterial;
        }
        /**
         * @en Activate the skybox configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用天空盒设置，不需要手动调用
         * @param resource The skybox configuration object in the render scene
         */
        activate(resource) {
          this.envLightingType = this._envLightingType;
          this._resource = resource;
          resource.initialize(this);
          resource.setEnvMaps(this._envmapHDR, this._envmapLDR);
          resource.setDiffuseMaps(this._diffuseMapHDR, this._diffuseMapLDR);
          resource.setSkyboxMaterial(this._editableMaterial);
          resource.setReflectionMaps(this._reflectionHDR, this._reflectionLDR);
          resource.setRotationAngle(this._rotationAngle);
          resource.activate(); // update global DS first
        }

        /**
         * @en When the environment map changed will call this function to update scene.
         * @zh 环境贴图发生变化时，会调用此函数更新场景。
         * @param val environment map
         */
        updateEnvMap(val) {
          if (!val) {
            this.applyDiffuseMap = false;
            this.useIBL = false;
            this.envLightingType = EnvironmentLightingType.HEMISPHERE_DIFFUSE;
            warnID(15001);
          }
          const resource = this._resource;
          if (resource) {
            resource.setEnvMaps(this._envmapHDR, this._envmapLDR);
            resource.setDiffuseMaps(this._diffuseMapHDR, this._diffuseMapLDR);
            resource.setReflectionMaps(this._reflectionHDR, this._reflectionLDR);
            resource.useDiffuseMap = this.applyDiffuseMap;
            resource.envmap = val;
          }
        }

        /**
         * @en
         * Set custom skybox material properties.
         * @zh
         * 设置自定义的天空盒材质属性。
         * @param name @en The target property name. @zh 目标 property 名称。
         * @param val @en The target value. @zh 需要设置的目标值。
         * @param passIdx
         * @en The pass to apply to. Will apply to all passes if not specified.
         * @zh 设置此属性的 pass 索引，如果没有指定，则会设置此属性到所有 pass 上。
         */
        setMaterialProperty(name, val, passIdx) {
          const resource = this._resource;
          if (!resource) return;
          const editableMaterial = resource.editableMaterial;
          if (resource.enabled && editableMaterial) {
            editableMaterial.setProperty(name, val, passIdx);
            editableMaterial.passes.forEach(pass => {
              pass.update();
            });
          }
        }
      }, _applyDecoratedDescriptor(_class4.prototype, "enabled", [editable, _dec11], Object.getOwnPropertyDescriptor(_class4.prototype, "enabled"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "envLightingType", [editable, _dec12, _dec13], Object.getOwnPropertyDescriptor(_class4.prototype, "envLightingType"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "useHDR", [editable, _dec14], Object.getOwnPropertyDescriptor(_class4.prototype, "useHDR"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "envmap", [editable, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class4.prototype, "envmap"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "rotationAngle", [_dec17, _dec18, slide, _dec19], Object.getOwnPropertyDescriptor(_class4.prototype, "rotationAngle"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "diffuseMap", [_dec20, editable, readOnly, _dec21, _dec22], Object.getOwnPropertyDescriptor(_class4.prototype, "diffuseMap"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "reflectionMap", [_dec23, editable, readOnly, _dec24, _dec25], Object.getOwnPropertyDescriptor(_class4.prototype, "reflectionMap"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "skyboxMaterial", [editable, _dec26, _dec27], Object.getOwnPropertyDescriptor(_class4.prototype, "skyboxMaterial"), _class4.prototype), _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "_envLightingType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EnvironmentLightingType.HEMISPHERE_DIFFUSE;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "_envmapHDR", [serializable, _dec28, _dec29], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class4.prototype, "_envmapLDR", [serializable, _dec30], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class4.prototype, "_diffuseMapHDR", [serializable, _dec31], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class4.prototype, "_diffuseMapLDR", [serializable, _dec32], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "_enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "_useHDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "_editableMaterial", [serializable, _dec33], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "_reflectionHDR", [serializable, _dec34], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class4.prototype, "_reflectionLDR", [serializable, _dec35], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class4.prototype, "_rotationAngle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class4)) || _class3));
      legacyCC.SkyboxInfo = SkyboxInfo;

      /**
       * @zh 全局雾相关配置
       * @en Global fog configuration
       */
      _export("FogInfo", FogInfo = (_dec36 = ccclass('cc.FogInfo'), _dec37 = tooltip('i18n:fog.enabled'), _dec38 = displayOrder(0), _dec39 = tooltip('i18n:fog.accurate'), _dec40 = displayOrder(0), _dec41 = tooltip('i18n:fog.fogColor'), _dec42 = type(FogType), _dec43 = displayOrder(1), _dec44 = tooltip('i18n:fog.type'), _dec45 = visible(function () {
        return this._type !== FogType.LAYERED && this._type !== FogType.LINEAR;
      }), _dec46 = type(CCFloat), _dec47 = range([0, 1, 0.01]), _dec48 = tooltip('i18n:fog.fogDensity'), _dec49 = visible(function () {
        return this._type !== FogType.LAYERED;
      }), _dec50 = type(CCFloat), _dec51 = rangeStep(0.01), _dec52 = tooltip('i18n:fog.fogStart'), _dec53 = visible(function () {
        return this._type === FogType.LINEAR;
      }), _dec54 = type(CCFloat), _dec55 = rangeStep(0.01), _dec56 = tooltip('i18n:fog.fogEnd'), _dec57 = visible(function () {
        return this._type !== FogType.LINEAR;
      }), _dec58 = type(CCFloat), _dec59 = rangeMin(0.01), _dec60 = rangeStep(0.01), _dec61 = tooltip('i18n:fog.fogAtten'), _dec62 = visible(function () {
        return this._type === FogType.LAYERED;
      }), _dec63 = type(CCFloat), _dec64 = rangeStep(0.01), _dec65 = tooltip('i18n:fog.fogTop'), _dec66 = visible(function () {
        return this._type === FogType.LAYERED;
      }), _dec67 = type(CCFloat), _dec68 = rangeStep(0.01), _dec69 = tooltip('i18n:fog.fogRange'), _dec36(_class5 = (_class6 = (_FogInfo = class FogInfo {
        constructor() {
          _initializerDefineProperty(this, "_type", _descriptor16, this);
          _initializerDefineProperty(this, "_fogColor", _descriptor17, this);
          _initializerDefineProperty(this, "_enabled", _descriptor18, this);
          _initializerDefineProperty(this, "_fogDensity", _descriptor19, this);
          _initializerDefineProperty(this, "_fogStart", _descriptor20, this);
          _initializerDefineProperty(this, "_fogEnd", _descriptor21, this);
          _initializerDefineProperty(this, "_fogAtten", _descriptor22, this);
          _initializerDefineProperty(this, "_fogTop", _descriptor23, this);
          _initializerDefineProperty(this, "_fogRange", _descriptor24, this);
          _initializerDefineProperty(this, "_accurate", _descriptor25, this);
          this._resource = null;
        }
        /**
         * @zh 是否启用全局雾效
         * @en Enable global fog
         */
        set enabled(val) {
          if (this._enabled === val) return;
          this._enabled = val;
          const resource = this._resource;
          if (resource) {
            resource.enabled = val;
            if (val) {
              resource.type = this._type;
            }
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @zh 是否启用精确雾效(像素雾)计算
         * @en Enable accurate fog (pixel fog)
         */
        set accurate(val) {
          if (this._accurate === val) return;
          this._accurate = val;
          const resource = this._resource;
          if (resource) {
            resource.accurate = val;
            if (val) {
              resource.type = this._type;
            }
          }
        }
        get accurate() {
          return this._accurate;
        }

        /**
         * @zh 全局雾颜色
         * @en Global fog color
         */
        set fogColor(val) {
          this._fogColor.set(val);
          if (this._resource) {
            this._resource.fogColor = this._fogColor;
          }
        }
        get fogColor() {
          return this._fogColor;
        }

        /**
         * @zh 全局雾类型
         * @en Global fog type
         */
        get type() {
          return this._type;
        }
        set type(val) {
          this._type = val;
          if (this._resource) {
            this._resource.type = val;
          }
        }

        /**
         * @zh 全局雾浓度
         * @en Global fog density
         */
        get fogDensity() {
          return this._fogDensity;
        }
        set fogDensity(val) {
          this._fogDensity = val;
          if (this._resource) {
            this._resource.fogDensity = val;
          }
        }

        /**
         * @zh 雾效起始位置
         * @en Global fog start position
         */
        get fogStart() {
          return this._fogStart;
        }
        set fogStart(val) {
          this._fogStart = val;
          if (this._resource) {
            this._resource.fogStart = val;
          }
        }

        /**
         * @zh 雾效结束位置，只适用于线性雾
         * @en Global fog end position, only for linear fog
         */
        get fogEnd() {
          return this._fogEnd;
        }
        set fogEnd(val) {
          this._fogEnd = val;
          if (this._resource) {
            this._resource.fogEnd = val;
          }
        }

        /**
         * @zh 雾效衰减
         * @en Global fog attenuation
         */
        get fogAtten() {
          return this._fogAtten;
        }
        set fogAtten(val) {
          this._fogAtten = val;
          if (this._resource) {
            this._resource.fogAtten = val;
          }
        }

        /**
         * @zh 雾效顶部范围，只适用于层级雾
         * @en Global fog top range, only for layered fog
         */
        get fogTop() {
          return this._fogTop;
        }
        set fogTop(val) {
          this._fogTop = val;
          if (this._resource) {
            this._resource.fogTop = val;
          }
        }

        /**
         * @zh 雾效范围，只适用于层级雾
         * @en Global fog range, only for layered fog
         */
        get fogRange() {
          return this._fogRange;
        }
        set fogRange(val) {
          this._fogRange = val;
          if (this._resource) {
            this._resource.fogRange = val;
          }
        }
        /**
         * @en Activate the fog configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用雾效设置，不需要手动调用
         * @param resource The fog configuration object in the render scene
         */
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
          resource.activate();
        }
      }, _FogInfo.FogType = FogType, _FogInfo), _applyDecoratedDescriptor(_class6.prototype, "enabled", [editable, _dec37, _dec38], Object.getOwnPropertyDescriptor(_class6.prototype, "enabled"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "accurate", [editable, _dec39, _dec40], Object.getOwnPropertyDescriptor(_class6.prototype, "accurate"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogColor", [editable, _dec41], Object.getOwnPropertyDescriptor(_class6.prototype, "fogColor"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "type", [editable, _dec42, _dec43, _dec44], Object.getOwnPropertyDescriptor(_class6.prototype, "type"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogDensity", [_dec45, _dec46, _dec47, slide, _dec48], Object.getOwnPropertyDescriptor(_class6.prototype, "fogDensity"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogStart", [_dec49, _dec50, _dec51, _dec52], Object.getOwnPropertyDescriptor(_class6.prototype, "fogStart"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogEnd", [_dec53, _dec54, _dec55, _dec56], Object.getOwnPropertyDescriptor(_class6.prototype, "fogEnd"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogAtten", [_dec57, _dec58, _dec59, _dec60, _dec61], Object.getOwnPropertyDescriptor(_class6.prototype, "fogAtten"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogTop", [_dec62, _dec63, _dec64, _dec65], Object.getOwnPropertyDescriptor(_class6.prototype, "fogTop"), _class6.prototype), _applyDecoratedDescriptor(_class6.prototype, "fogRange", [_dec66, _dec67, _dec68, _dec69], Object.getOwnPropertyDescriptor(_class6.prototype, "fogRange"), _class6.prototype), _descriptor16 = _applyDecoratedDescriptor(_class6.prototype, "_type", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return FogType.LINEAR;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class6.prototype, "_fogColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color('#C8C8C8');
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class6.prototype, "_enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class6.prototype, "_fogDensity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class6.prototype, "_fogStart", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class6.prototype, "_fogEnd", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 300;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class6.prototype, "_fogAtten", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class6.prototype, "_fogTop", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.5;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class6.prototype, "_fogRange", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.2;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class6.prototype, "_accurate", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class6)) || _class5));
      /**
       * @en Scene level shadow related configuration
       * @zh 场景级别阴影相关的配置
       */
      _export("ShadowsInfo", ShadowsInfo = (_dec70 = ccclass('cc.ShadowsInfo'), _dec71 = tooltip('i18n:shadow.enabled'), _dec72 = tooltip('i18n:shadow.type'), _dec73 = type(ShadowType), _dec74 = tooltip('i18n:shadow.shadowColor'), _dec75 = visible(function () {
        return this._type === ShadowType.Planar;
      }), _dec76 = tooltip('i18n:shadow.planeDirection'), _dec77 = visible(function () {
        return this._type === ShadowType.Planar;
      }), _dec78 = tooltip('i18n:shadow.planeHeight'), _dec79 = type(CCFloat), _dec80 = visible(function () {
        return this._type === ShadowType.Planar;
      }), _dec81 = tooltip('i18n:shadow.planeBias'), _dec82 = type(CCFloat), _dec83 = visible(function () {
        return this._type === ShadowType.Planar;
      }), _dec84 = tooltip('i18n:shadow.maxReceived'), _dec85 = type(CCInteger), _dec86 = visible(function () {
        return this._type === ShadowType.ShadowMap;
      }), _dec87 = tooltip('i18n:shadow.shadowMapSize'), _dec88 = type(ShadowSize), _dec89 = visible(function () {
        return this._type === ShadowType.ShadowMap;
      }), _dec70(_class7 = (_class8 = class ShadowsInfo {
        constructor() {
          _initializerDefineProperty(this, "_enabled", _descriptor26, this);
          _initializerDefineProperty(this, "_type", _descriptor27, this);
          _initializerDefineProperty(this, "_normal", _descriptor28, this);
          _initializerDefineProperty(this, "_distance", _descriptor29, this);
          _initializerDefineProperty(this, "_planeBias", _descriptor30, this);
          _initializerDefineProperty(this, "_shadowColor", _descriptor31, this);
          _initializerDefineProperty(this, "_maxReceived", _descriptor32, this);
          _initializerDefineProperty(this, "_size", _descriptor33, this);
          this._resource = null;
        }
        /**
         * @en Whether activate planar shadow
         * @zh 是否启用平面阴影？
         */
        set enabled(val) {
          if (this._enabled === val) return;
          this._enabled = val;
          const resource = this._resource;
          if (resource) {
            resource.enabled = val;
            if (val) {
              resource.type = this._type;
            }
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en The type of the shadow
         * @zh 阴影渲染的类型
         */
        set type(val) {
          this._type = val;
          if (this._resource) {
            this._resource.type = val;
          }
        }
        get type() {
          return this._type;
        }

        /**
         * @en Shadow color
         * @zh 阴影颜色
         */
        set shadowColor(val) {
          this._shadowColor.set(val);
          if (this._resource) {
            this._resource.shadowColor = val;
          }
        }
        get shadowColor() {
          return this._shadowColor;
        }

        /**
         * @en The normal of the plane which receives shadow
         * @zh 阴影接收平面的法线
         */
        set planeDirection(val) {
          Vec3.copy(this._normal, val);
          if (this._resource) {
            this._resource.normal = val;
          }
        }
        get planeDirection() {
          return this._normal;
        }

        /**
         * @en The distance from coordinate origin to the receiving plane.
         * @zh 阴影接收平面与原点的距离
         */
        set planeHeight(val) {
          this._distance = val;
          if (this._resource) {
            this._resource.distance = val;
          }
        }
        get planeHeight() {
          return this._distance;
        }

        /**
         * @en Positional offset values in planar shading calculations.
         * @zh 平面阴影计算中的位置偏移值。
         */
        set planeBias(val) {
          this._planeBias = val;
          if (this._resource) {
            this._resource.planeBias = val;
          }
        }
        get planeBias() {
          return this._planeBias;
        }

        /**
         * @en get or set shadow max received
         * @zh 获取或者设置阴影接收的最大光源数量
         */
        set maxReceived(val) {
          this._maxReceived = val;
          if (this._resource) {
            this._resource.maxReceived = val;
          }
        }
        get maxReceived() {
          return this._maxReceived;
        }

        /**
         * @en get or set shadow map size
         * @zh 获取或者设置阴影纹理大小
         */
        set shadowMapSize(value) {
          const resource = this._resource;
          this._size.set(value, value);
          if (resource) {
            resource.size.set(value, value);
            resource.shadowMapDirty = true;
          }
        }
        get shadowMapSize() {
          return this._size.x;
        }
        /**
         * @en Set plane which receives shadow with the given node's world transformation
         * @zh 根据指定节点的世界变换设置阴影接收平面的信息
         * @param node The node for setting up the plane
         */
        setPlaneFromNode(node) {
          node.getWorldRotation(_qt);
          this.planeDirection = Vec3.transformQuat(_v3, _up, _qt);
          node.getWorldPosition(_v3);
          this.planeHeight = Vec3.dot(this._normal, _v3);
        }

        /**
         * @en Activate the shadow configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用阴影设置，不需要手动调用
         * @param resource The shadow configuration object in the render scene
         */
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
          resource.activate();
        }
      }, _applyDecoratedDescriptor(_class8.prototype, "enabled", [editable, _dec71], Object.getOwnPropertyDescriptor(_class8.prototype, "enabled"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "type", [_dec72, editable, _dec73], Object.getOwnPropertyDescriptor(_class8.prototype, "type"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "shadowColor", [_dec74, _dec75], Object.getOwnPropertyDescriptor(_class8.prototype, "shadowColor"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "planeDirection", [_dec76, _dec77], Object.getOwnPropertyDescriptor(_class8.prototype, "planeDirection"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "planeHeight", [_dec78, editable, _dec79, _dec80], Object.getOwnPropertyDescriptor(_class8.prototype, "planeHeight"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "planeBias", [_dec81, editable, _dec82, _dec83], Object.getOwnPropertyDescriptor(_class8.prototype, "planeBias"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "maxReceived", [_dec84, _dec85, _dec86], Object.getOwnPropertyDescriptor(_class8.prototype, "maxReceived"), _class8.prototype), _applyDecoratedDescriptor(_class8.prototype, "shadowMapSize", [_dec87, _dec88, _dec89], Object.getOwnPropertyDescriptor(_class8.prototype, "shadowMapSize"), _class8.prototype), _descriptor26 = _applyDecoratedDescriptor(_class8.prototype, "_enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class8.prototype, "_type", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ShadowType.Planar;
        }
      }), _descriptor28 = _applyDecoratedDescriptor(_class8.prototype, "_normal", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 1, 0);
        }
      }), _descriptor29 = _applyDecoratedDescriptor(_class8.prototype, "_distance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor30 = _applyDecoratedDescriptor(_class8.prototype, "_planeBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor31 = _applyDecoratedDescriptor(_class8.prototype, "_shadowColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 76);
        }
      }), _descriptor32 = _applyDecoratedDescriptor(_class8.prototype, "_maxReceived", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 4;
        }
      }), _descriptor33 = _applyDecoratedDescriptor(_class8.prototype, "_size", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(1024, 1024);
        }
      }), _class8)) || _class7));
      legacyCC.ShadowsInfo = ShadowsInfo;
      _export("DEFAULT_WORLD_MIN_POS", DEFAULT_WORLD_MIN_POS = new Vec3(-1024.0, -1024.0, -1024.0));
      _export("DEFAULT_WORLD_MAX_POS", DEFAULT_WORLD_MAX_POS = new Vec3(1024.0, 1024.0, 1024.0));
      _export("DEFAULT_OCTREE_DEPTH", DEFAULT_OCTREE_DEPTH = 8);
      /**
       * @en Scene management and culling configuration based on octree
       * @zh 基于八叉树的场景剔除配置
       */
      _export("OctreeInfo", OctreeInfo = (_dec90 = ccclass('cc.OctreeInfo'), _dec91 = tooltip('i18n:octree_culling.enabled'), _dec92 = tooltip('i18n:octree_culling.minPos'), _dec93 = displayName('World MinPos'), _dec94 = tooltip('i18n:octree_culling.maxPos'), _dec95 = displayName('World MaxPos'), _dec96 = range([4, 12, 1]), _dec97 = type(CCInteger), _dec98 = tooltip('i18n:octree_culling.depth'), _dec90(_class9 = (_class0 = class OctreeInfo {
        constructor() {
          _initializerDefineProperty(this, "_enabled", _descriptor34, this);
          _initializerDefineProperty(this, "_minPos", _descriptor35, this);
          _initializerDefineProperty(this, "_maxPos", _descriptor36, this);
          _initializerDefineProperty(this, "_depth", _descriptor37, this);
          this._resource = null;
        }
        /**
         * @en Whether activate scene culling based on octree
         * @zh 是否启用八叉树加速剔除？
         */
        set enabled(val) {
          if (this._enabled === val) return;
          this._enabled = val;
          if (this._resource) {
            this._resource.enabled = val;
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en The minimal position of the scene bounding box.
         * Objects entirely outside the bounding box will be culled, other objects will be managed dynamically.
         * @zh 场景包围盒的最小位置，完全超出包围盒的物体会被剔除，其他物体根据情况被动态剔除。
         */
        set minPos(val) {
          this._minPos = val;
          if (this._resource) {
            this._resource.minPos = val;
          }
        }
        get minPos() {
          return this._minPos;
        }

        /**
         * @en The maximum position of the scene bounding box.
         * Objects entirely outside the bounding box will be culled, other objects will be managed dynamically.
         * @zh 场景包围盒的最大位置，完全超出包围盒的物体会被剔除，其他物体根据情况被动态剔除。
         */
        set maxPos(val) {
          this._maxPos = val;
          if (this._resource) {
            this._resource.maxPos = val;
          }
        }
        get maxPos() {
          return this._maxPos;
        }

        /**
         * @en The depth of the octree.
         * @zh 八叉树的深度。
         */
        set depth(val) {
          this._depth = val;
          if (this._resource) {
            this._resource.depth = val;
          }
        }
        get depth() {
          return this._depth;
        }
        /**
         * @en Activate the octree configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用八叉树设置，不需要手动调用
         * @param resource The octree configuration object in the render scene
         */
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
        }
      }, _applyDecoratedDescriptor(_class0.prototype, "enabled", [editable, _dec91], Object.getOwnPropertyDescriptor(_class0.prototype, "enabled"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "minPos", [editable, _dec92, _dec93], Object.getOwnPropertyDescriptor(_class0.prototype, "minPos"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "maxPos", [editable, _dec94, _dec95], Object.getOwnPropertyDescriptor(_class0.prototype, "maxPos"), _class0.prototype), _applyDecoratedDescriptor(_class0.prototype, "depth", [editable, _dec96, slide, _dec97, _dec98], Object.getOwnPropertyDescriptor(_class0.prototype, "depth"), _class0.prototype), _descriptor34 = _applyDecoratedDescriptor(_class0.prototype, "_enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor35 = _applyDecoratedDescriptor(_class0.prototype, "_minPos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(DEFAULT_WORLD_MIN_POS);
        }
      }), _descriptor36 = _applyDecoratedDescriptor(_class0.prototype, "_maxPos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(DEFAULT_WORLD_MAX_POS);
        }
      }), _descriptor37 = _applyDecoratedDescriptor(_class0.prototype, "_depth", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return DEFAULT_OCTREE_DEPTH;
        }
      }), _class0)) || _class9));
      legacyCC.OctreeInfo = OctreeInfo;

      /**
       * @en Global skin in the render scene.
       * @zh 渲染场景中的全局皮肤后处理设置。
       */
      _export("SkinInfo", SkinInfo = (_dec99 = ccclass('cc.SkinInfo'), _dec100 = tooltip('i18n:skin.enabled'), _dec101 = visible(false), _dec102 = range([0.0, 0.1, 0.001]), _dec103 = type(CCFloat), _dec104 = tooltip('i18n:skin.blurRadius'), _dec105 = range([0.0, 10.0, 0.1]), _dec106 = type(CCFloat), _dec107 = tooltip('i18n:skin.sssIntensity'), _dec99(_class1 = (_class10 = class SkinInfo {
        constructor() {
          _initializerDefineProperty(this, "_enabled", _descriptor38, this);
          _initializerDefineProperty(this, "_blurRadius", _descriptor39, this);
          _initializerDefineProperty(this, "_sssIntensity", _descriptor40, this);
          this._resource = null;
        }
        /**
         * @en Enable skip.
         * @zh 是否开启皮肤后效。
         */
        set enabled(val) {
          if (this._enabled === val) return;
          this._enabled = val;
          if (this._resource) {
            this._resource.enabled = val;
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en Getter/Setter sampler width.
         * @zh 设置或者获取采样宽度。
         */
        set blurRadius(val) {
          this._blurRadius = val;
          if (this._resource) {
            this._resource.blurRadius = val;
          }
        }
        get blurRadius() {
          return this._blurRadius;
        }

        /**
         * @en Getter/Setter depth unit scale.
         * @zh 设置或者获取深度单位比例。
         */
        set sssIntensity(val) {
          this._sssIntensity = val;
          if (this._resource) {
            this._resource.sssIntensity = val;
          }
        }
        get sssIntensity() {
          return this._sssIntensity;
        }
        /**
         * @en Activate the skin configuration in the render scene, no need to invoke manually.
         * @zh 在渲染场景中启用皮肤设置，不需要手动调用
         * @param resource The skin configuration object in the render scene
         */
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
        }
      }, _applyDecoratedDescriptor(_class10.prototype, "enabled", [editable, readOnly, _dec100], Object.getOwnPropertyDescriptor(_class10.prototype, "enabled"), _class10.prototype), _applyDecoratedDescriptor(_class10.prototype, "blurRadius", [_dec101, editable, _dec102, slide, _dec103, _dec104], Object.getOwnPropertyDescriptor(_class10.prototype, "blurRadius"), _class10.prototype), _applyDecoratedDescriptor(_class10.prototype, "sssIntensity", [editable, _dec105, slide, _dec106, _dec107], Object.getOwnPropertyDescriptor(_class10.prototype, "sssIntensity"), _class10.prototype), _descriptor38 = _applyDecoratedDescriptor(_class10.prototype, "_enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor39 = _applyDecoratedDescriptor(_class10.prototype, "_blurRadius", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.01;
        }
      }), _descriptor40 = _applyDecoratedDescriptor(_class10.prototype, "_sssIntensity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3.0;
        }
      }), _class10)) || _class1));
      legacyCC.SkinInfo = SkinInfo;
      _export("PostSettingsInfo", PostSettingsInfo = (_dec108 = ccclass('cc.PostSettingsInfo'), _dec109 = type(ToneMappingType), _dec110 = tooltip('i18n:tone_mapping.toneMappingType'), _dec108(_class11 = (_class12 = class PostSettingsInfo {
        constructor() {
          _initializerDefineProperty(this, "_toneMappingType", _descriptor41, this);
          this._resource = null;
        }
        /**
         * @zh 色调映射类型
         * @en Tone mapping type
         */
        set toneMappingType(val) {
          this._toneMappingType = val;
          if (this._resource) {
            this._resource.toneMappingType = val;
          }
        }
        get toneMappingType() {
          return this._toneMappingType;
        }
        activate(resource) {
          this._resource = resource;
          resource.initialize(this);
          resource.activate();
        }
      }, _applyDecoratedDescriptor(_class12.prototype, "toneMappingType", [editable, _dec109, _dec110], Object.getOwnPropertyDescriptor(_class12.prototype, "toneMappingType"), _class12.prototype), _descriptor41 = _applyDecoratedDescriptor(_class12.prototype, "_toneMappingType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ToneMappingType.DEFAULT;
        }
      }), _class12)) || _class11));
      legacyCC.PostSettingsInfo = PostSettingsInfo;
      /**
       * @en light probe configuration
       * @zh 光照探针配置
       */
      _export("LightProbeInfo", LightProbeInfo = (_dec111 = ccclass('cc.LightProbeInfo'), _dec112 = range([0, 100, 1]), _dec113 = type(CCFloat), _dec114 = tooltip('i18n:light_probe.giScale'), _dec115 = displayName('GIScale'), _dec116 = range([64, 65535, 1]), _dec117 = type(CCInteger), _dec118 = tooltip('i18n:light_probe.giSamples'), _dec119 = displayName('GISamples'), _dec120 = range([1, 4, 1]), _dec121 = type(CCInteger), _dec122 = tooltip('i18n:light_probe.bounces'), _dec123 = range([0.0, 0.05, 0.001]), _dec124 = type(CCFloat), _dec125 = tooltip('i18n:light_probe.reduceRinging'), _dec126 = tooltip('i18n:light_probe.showWireframe'), _dec127 = tooltip('i18n:light_probe.showConvex'), _dec128 = range([0, 100, 1]), _dec129 = type(CCFloat), _dec130 = tooltip('i18n:light_probe.lightProbeSphereVolume'), _dec111(_class13 = (_class14 = class LightProbeInfo {
        constructor() {
          _initializerDefineProperty(this, "_giScale", _descriptor42, this);
          _initializerDefineProperty(this, "_giSamples", _descriptor43, this);
          _initializerDefineProperty(this, "_bounces", _descriptor44, this);
          _initializerDefineProperty(this, "_reduceRinging", _descriptor45, this);
          _initializerDefineProperty(this, "_showProbe", _descriptor46, this);
          _initializerDefineProperty(this, "_showWireframe", _descriptor47, this);
          _initializerDefineProperty(this, "_showConvex", _descriptor48, this);
          _initializerDefineProperty(this, "_data", _descriptor49, this);
          _initializerDefineProperty(this, "_lightProbeSphereVolume", _descriptor50, this);
          this._nodes = [];
          this._scene = null;
          this._resource = null;
        }
        /**
         * @en GI multiplier
         * @zh GI乘数
         */
        set giScale(val) {
          if (this._giScale === val) return;
          this._giScale = val;
          if (this._resource) {
            this._resource.giScale = val;
          }
        }
        get giScale() {
          return this._giScale;
        }

        /**
         * @en GI sample counts
         * @zh GI 采样数量
         */
        set giSamples(val) {
          if (this._giSamples === val) return;
          this._giSamples = val;
          if (this._resource) {
            this._resource.giSamples = val;
          }
        }
        get giSamples() {
          return this._giSamples;
        }

        /**
         * @en light bounces
         * @zh 光照反弹次数
         */
        set bounces(val) {
          if (this._bounces === val) return;
          this._bounces = val;
          if (this._resource) {
            this._resource.bounces = val;
          }
        }
        get bounces() {
          return this._bounces;
        }

        /**
         * @en Reduce ringing of light probe
         * @zh 减少光照探针的振铃效果
         */
        set reduceRinging(val) {
          if (this._reduceRinging === val) return;
          this._reduceRinging = val;
          if (this._resource) {
            this._resource.reduceRinging = val;
          }
        }
        get reduceRinging() {
          return this._reduceRinging;
        }

        /**
         * @en Whether to show light probe
         * @zh 是否显示光照探针
         */
        set showProbe(val) {
          if (this._showProbe === val) return;
          this._showProbe = val;
          if (this._resource) {
            this._resource.showProbe = val;
          }
        }
        get showProbe() {
          return this._showProbe;
        }

        /**
         * @en Whether to show light probe's connection
         * @zh 是否显示光照探针连线
         */
        set showWireframe(val) {
          if (this._showWireframe === val) return;
          this._showWireframe = val;
          if (this._resource) {
            this._resource.showWireframe = val;
          }
        }
        get showWireframe() {
          return this._showWireframe;
        }

        /**
         * @en Whether to show light probe's convex
         * @zh 是否显示光照探针凸包
         */
        set showConvex(val) {
          if (this._showConvex === val) return;
          this._showConvex = val;
          if (this._resource) {
            this._resource.showConvex = val;
          }
        }
        get showConvex() {
          return this._showConvex;
        }

        /**
         * @en light probe's vertex and tetrahedron data
         * @zh 光照探针顶点及四面体数据
         */
        set data(val) {
          if (this._data === val) return;
          this._data = val;
          if (this._resource) {
            this._resource.data = val;
          }
        }
        get data() {
          return this._data;
        }

        /**
         * @en The value of all light probe sphere display size
         * @zh 光照探针全局显示大小
         */
        set lightProbeSphereVolume(val) {
          if (this._lightProbeSphereVolume === val) return;
          this._lightProbeSphereVolume = val;
          if (this._resource) {
            this._resource.lightProbeSphereVolume = val;
          }
        }
        get lightProbeSphereVolume() {
          return this._lightProbeSphereVolume;
        }
        activate(scene, resource) {
          this._scene = scene;
          this._resource = resource;
          resource.initialize(this);
        }
        onProbeBakeFinished() {
          this.onProbeBakingChanged(this._scene);
        }
        onProbeBakeCleared() {
          this.clearSHCoefficients();
          this.onProbeBakingChanged(this._scene);
        }
        onProbeBakingChanged(node) {
          if (!node) {
            return;
          }
          node.emit(NodeEventType.LIGHT_PROBE_BAKING_CHANGED);
          node.children.forEach(child => {
            this.onProbeBakingChanged(child);
          });
        }
        clearSHCoefficients() {
          if (!this._data) {
            return;
          }
          this._data.probes.forEach(probe => {
            probe.coefficients.length = 0;
          });
          this.clearAllSHUBOs();
        }
        isUniqueNode() {
          return this._nodes.length === 1;
        }
        addNode(node) {
          if (!node) {
            return false;
          }
          for (let i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i].node === node) {
              return false;
            }
          }
          this._nodes.push({
            node,
            probes: null
          });
          return true;
        }
        removeNode(node) {
          if (!node) {
            return false;
          }
          const index = this._nodes.findIndex(element => element.node === node);
          if (index === -1) {
            return false;
          }
          this._nodes.splice(index, 1);
          return true;
        }
        syncData(node, probes) {
          for (let i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i].node === node) {
              this._nodes[i].probes = probes;
              return;
            }
          }
        }
        update(updateTet = true) {
          if (!cclegacy.internal.LightProbesData) {
            return;
          }
          if (!this._data) {
            this._data = new cclegacy.internal.LightProbesData();
            if (this._resource) {
              this._resource.data = this._data;
            }
          }
          const points = [];
          for (let i = 0; i < this._nodes.length; i++) {
            const probeNode = this._nodes[i];
            const node = probeNode.node;
            const probes = probeNode.probes;
            const worldPosition = node.worldPosition;
            if (!probes) {
              continue;
            }
            for (let j = 0; j < probes.length; j++) {
              const position = v3();
              Vec3.add(position, probes[j], worldPosition);
              points.push(position);
            }
          }
          const pointCount = points.length;
          if (pointCount < 4) {
            this.resetAllTetraIndices();
            this._data.reset();
            return;
          }
          this._data.updateProbes(points);
          if (updateTet) {
            this.resetAllTetraIndices();
            this._data.updateTetrahedrons();
          }
        }
        clearAllSHUBOs() {
          if (!this._scene) {
            return;
          }
          const renderScene = this._scene.renderScene;
          if (!renderScene) {
            return;
          }
          const models = renderScene.models;
          models.forEach(model => {
            model.clearSHUBOs();
          });
        }
        resetAllTetraIndices() {
          if (!this._scene) {
            return;
          }
          const renderScene = this._scene.renderScene;
          if (!renderScene) {
            return;
          }
          const models = renderScene.models;
          models.forEach(model => {
            model.tetrahedronIndex = -1;
          });
        }
      }, _applyDecoratedDescriptor(_class14.prototype, "giScale", [editable, _dec112, _dec113, _dec114, _dec115], Object.getOwnPropertyDescriptor(_class14.prototype, "giScale"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "giSamples", [editable, _dec116, _dec117, _dec118, _dec119], Object.getOwnPropertyDescriptor(_class14.prototype, "giSamples"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "bounces", [editable, _dec120, _dec121, _dec122], Object.getOwnPropertyDescriptor(_class14.prototype, "bounces"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "reduceRinging", [editable, _dec123, slide, _dec124, _dec125], Object.getOwnPropertyDescriptor(_class14.prototype, "reduceRinging"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "showWireframe", [editable, _dec126], Object.getOwnPropertyDescriptor(_class14.prototype, "showWireframe"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "showConvex", [editable, _dec127], Object.getOwnPropertyDescriptor(_class14.prototype, "showConvex"), _class14.prototype), _applyDecoratedDescriptor(_class14.prototype, "lightProbeSphereVolume", [editable, _dec128, _dec129, _dec130], Object.getOwnPropertyDescriptor(_class14.prototype, "lightProbeSphereVolume"), _class14.prototype), _descriptor42 = _applyDecoratedDescriptor(_class14.prototype, "_giScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor43 = _applyDecoratedDescriptor(_class14.prototype, "_giSamples", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1024;
        }
      }), _descriptor44 = _applyDecoratedDescriptor(_class14.prototype, "_bounces", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor45 = _applyDecoratedDescriptor(_class14.prototype, "_reduceRinging", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor46 = _applyDecoratedDescriptor(_class14.prototype, "_showProbe", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor47 = _applyDecoratedDescriptor(_class14.prototype, "_showWireframe", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor48 = _applyDecoratedDescriptor(_class14.prototype, "_showConvex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor49 = _applyDecoratedDescriptor(_class14.prototype, "_data", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor50 = _applyDecoratedDescriptor(_class14.prototype, "_lightProbeSphereVolume", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class14)) || _class13));
      /**
       * @en All scene related global parameters, it affects all content in the corresponding scene
       * @zh 各类场景级别的渲染参数，将影响全场景的所有物体
       */
      _export("SceneGlobals", SceneGlobals = (_dec131 = ccclass('cc.SceneGlobals'), _dec132 = type(SkyboxInfo), _dec131(_class15 = (_class16 = class SceneGlobals {
        constructor() {
          /**
           * @en The environment lighting configuration
           * @zh 场景的环境光照相关配置
           */
          _initializerDefineProperty(this, "ambient", _descriptor51, this);
          /**
           * @en Scene level shadow related configuration
           * @zh 平面阴影相关配置
           */
          _initializerDefineProperty(this, "shadows", _descriptor52, this);
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          _initializerDefineProperty(this, "_skybox", _descriptor53, this);
          /**
           * @en Global fog configuration
           * @zh 全局雾相关配置
           */
          _initializerDefineProperty(this, "fog", _descriptor54, this);
          /**
           * @en Octree related configuration
           * @zh 八叉树相关配置
           */
          _initializerDefineProperty(this, "octree", _descriptor55, this);
          /**
           * @en Octree related configuration
           * @zh 八叉树相关配置
           */
          _initializerDefineProperty(this, "skin", _descriptor56, this);
          /**
           * @en Light probe related configuration
           * @zh 光照探针相关配置
           */
          _initializerDefineProperty(this, "lightProbeInfo", _descriptor57, this);
          /**
           * @en Tone mapping related configuration
           * @zh 色调映射相关配置
           */
          _initializerDefineProperty(this, "postSettings", _descriptor58, this);
          /**
           * @en bake with stationary main light
           * @zh 主光源是否以静止状态烘培
           */
          _initializerDefineProperty(this, "bakedWithStationaryMainLight", _descriptor59, this);
          /**
           * @en bake lightmap with highp mode
           * @zh 是否使用高精度模式烘培光照图
           */
          _initializerDefineProperty(this, "bakedWithHighpLightmap", _descriptor60, this);
          /**
           * @en disable light map
           * @zh 关闭光照图效果
           */
          this.disableLightmap = false;
        }
        /**
         * @en Skybox related configuration
         * @zh 天空盒相关配置
         */
        get skybox() {
          return this._skybox;
        }
        set skybox(value) {
          this._skybox = value;
        }
        /**
         * @en Activate and initialize the global configurations of the scene, no need to invoke manually.
         * @zh 启用和初始化场景全局配置，不需要手动调用
         */
        activate(scene) {
          const sceneData = legacyCC.director.root.pipeline.pipelineSceneData;
          this.skybox.activate(sceneData.skybox);
          this.ambient.activate(sceneData.ambient);
          this.shadows.activate(sceneData.shadows);
          this.fog.activate(sceneData.fog);
          this.octree.activate(sceneData.octree);
          this.skin.activate(sceneData.skin);
          this.postSettings.activate(sceneData.postSettings);
          if (this.lightProbeInfo && sceneData.lightProbes) {
            this.lightProbeInfo.activate(scene, sceneData.lightProbes);
          }
          const root = legacyCC.director.root;
          root.onGlobalPipelineStateChanged();
        }
      }, _descriptor51 = _applyDecoratedDescriptor(_class16.prototype, "ambient", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AmbientInfo();
        }
      }), _descriptor52 = _applyDecoratedDescriptor(_class16.prototype, "shadows", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new ShadowsInfo();
        }
      }), _descriptor53 = _applyDecoratedDescriptor(_class16.prototype, "_skybox", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new SkyboxInfo();
        }
      }), _descriptor54 = _applyDecoratedDescriptor(_class16.prototype, "fog", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new FogInfo();
        }
      }), _applyDecoratedDescriptor(_class16.prototype, "skybox", [editable, _dec132], Object.getOwnPropertyDescriptor(_class16.prototype, "skybox"), _class16.prototype), _descriptor55 = _applyDecoratedDescriptor(_class16.prototype, "octree", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new OctreeInfo();
        }
      }), _descriptor56 = _applyDecoratedDescriptor(_class16.prototype, "skin", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new SkinInfo();
        }
      }), _descriptor57 = _applyDecoratedDescriptor(_class16.prototype, "lightProbeInfo", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new LightProbeInfo();
        }
      }), _descriptor58 = _applyDecoratedDescriptor(_class16.prototype, "postSettings", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new PostSettingsInfo();
        }
      }), _descriptor59 = _applyDecoratedDescriptor(_class16.prototype, "bakedWithStationaryMainLight", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor60 = _applyDecoratedDescriptor(_class16.prototype, "bakedWithHighpLightmap", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class16)) || _class15));
      legacyCC.SceneGlobals = SceneGlobals;
    }
  };
});