System.register("q-bundled:///fs/cocos/scene-graph/scene-globals.jsb.js", ["../core/global-exports.js", "../core/data/index.js", "../asset/assets/texture-cube.js", "../core/value-types/index.js", "../render-scene/scene/index.js", "../asset/assets/material.js", "../core/math/index.js", "../native-binding/decorators.js"], function (_export, _context) {
  "use strict";

  var legacyCC, CCFloat, CCInteger, TextureCube, Enum, Ambient, EnvironmentLightingType, ToneMappingType, Material, Vec2, Vec3, Color, Vec4, decros, DEFAULT_WORLD_MIN_POS, DEFAULT_WORLD_MAX_POS, DEFAULT_OCTREE_DEPTH, FogType, ShadowSize, ShadowType, AmbientInfo, SkyboxInfo, FogInfo, ShadowsInfo, OctreeInfo, LightProbeInfo, SceneGlobals, SkinInfo, PostSettingsInfo;
  return {
    setters: [function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_coreDataIndexJs) {
      CCFloat = _coreDataIndexJs.CCFloat;
      CCInteger = _coreDataIndexJs.CCInteger;
    }, function (_assetAssetsTextureCubeJs) {
      TextureCube = _assetAssetsTextureCubeJs.TextureCube;
    }, function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }, function (_renderSceneSceneIndexJs) {
      Ambient = _renderSceneSceneIndexJs.Ambient;
      EnvironmentLightingType = _renderSceneSceneIndexJs.EnvironmentLightingType;
      ToneMappingType = _renderSceneSceneIndexJs.ToneMappingType;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_coreMathIndexJs) {
      Vec2 = _coreMathIndexJs.Vec2;
      Vec3 = _coreMathIndexJs.Vec3;
      Color = _coreMathIndexJs.Color;
      Vec4 = _coreMathIndexJs.Vec4;
    }, function (_nativeBindingDecoratorsJs) {
      decros = _nativeBindingDecoratorsJs;
    }],
    execute: function () {
      /*
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
      */
      _export("DEFAULT_WORLD_MIN_POS", DEFAULT_WORLD_MIN_POS = new Vec3(-1024.0, -1024.0, -1024.0));
      _export("DEFAULT_WORLD_MAX_POS", DEFAULT_WORLD_MAX_POS = new Vec3(1024.0, 1024.0, 1024.0));
      _export("DEFAULT_OCTREE_DEPTH", DEFAULT_OCTREE_DEPTH = 8);
      /**
       * @zh
       * 全局雾类型。
       * @en
       * The global fog type
       * @static
       * @enum FogInfo.FogType
       */
      _export("FogType", FogType = Enum({
        /**
         * @zh
         * 线性雾。
         * @en
         * Linear fog
         * @readonly
         */
        LINEAR: 0,
        /**
         * @zh
         * 指数雾。
         * @en
         * Exponential fog
         * @readonly
         */
        EXP: 1,
        /**
         * @zh
         * 指数平方雾。
         * @en
         * Exponential square fog
         * @readonly
         */
        EXP_SQUARED: 2,
        /**
         * @zh
         * 层叠雾。
         * @en
         * Layered fog
         * @readonly
         */
        LAYERED: 3
      }));
      /**
       * @zh 阴影贴图分辨率。
       * @en The shadow map size.
       * @static
       * @enum Shadows.ShadowSize
       */
      _export("ShadowSize", ShadowSize = Enum({
        /**
         * @zh 分辨率 256 * 256。
         * @en shadow resolution 256 * 256.
         * @readonly
         */
        Low_256x256: 256,
        /**
         * @zh 分辨率 512 * 512。
         * @en shadow resolution 512 * 512.
         * @readonly
         */
        Medium_512x512: 512,
        /**
         * @zh 分辨率 1024 * 1024。
         * @en shadow resolution 1024 * 1024.
         * @readonly
         */
        High_1024x1024: 1024,
        /**
         * @zh 分辨率 2048 * 2048。
         * @en shadow resolution 2048 * 2048.
         * @readonly
         */
        Ultra_2048x2048: 2048
      }));
      /**
       * @zh 阴影类型。
       * @en The shadow type
       * @enum Shadows.ShadowType
       */
      _export("ShadowType", ShadowType = Enum({
        /**
         * @zh 平面阴影。
         * @en Planar shadow
         * @property Planar
         * @readonly
         */
        Planar: 0,
        /**
         * @zh 阴影贴图。
         * @en Shadow type
         * @property ShadowMap
         * @readonly
         */
        ShadowMap: 1
      }));
      _export("AmbientInfo", AmbientInfo = jsb.AmbientInfo);
      legacyCC.AmbientInfo = AmbientInfo;
      _export("SkyboxInfo", SkyboxInfo = jsb.SkyboxInfo);
      legacyCC.SkyboxInfo = SkyboxInfo;
      _export("FogInfo", FogInfo = jsb.FogInfo);
      legacyCC.FogInfo = FogInfo;
      FogInfo.FogType = FogType;
      _export("ShadowsInfo", ShadowsInfo = jsb.ShadowsInfo);
      legacyCC.ShadowsInfo = ShadowsInfo;
      _export("OctreeInfo", OctreeInfo = jsb.OctreeInfo);
      legacyCC.OctreeInfo = OctreeInfo;
      _export("LightProbeInfo", LightProbeInfo = jsb.LightProbeInfo);
      //legacyCC.LightProbeInfo = LightProbeInfo;
      _export("SceneGlobals", SceneGlobals = jsb.SceneGlobals);
      legacyCC.SceneGlobals = SceneGlobals;
      _export("SkinInfo", SkinInfo = jsb.SkinInfo);
      legacyCC.SkinInfo = SkinInfo;
      _export("PostSettingsInfo", PostSettingsInfo = jsb.PostSettingsInfo);
      legacyCC.PostSettingsInfo = PostSettingsInfo;
      (function () {
        const sceneGlobalsProto = SceneGlobals.prototype;
        sceneGlobalsProto._ctor = function () {
          this._ambientRef = this.getAmbientInfo();
          this._shadowsRef = this.getShadowsInfo();
          this._skyboxRef = this.getSkyboxInfo();
          this._fogRef = this.getFogInfo();
          this._octreeRef = this.getOctreeInfo();
          this._lightProbeRef = this.getLightProbeInfo();
          this._skinRef = this.getSkinInfo();
          this._postSettingsRef = this.getPostSettingsInfo();
        };
        Object.defineProperty(sceneGlobalsProto, 'ambient', {
          enumerable: true,
          configurable: true,
          get() {
            return this._ambientRef;
          },
          set(v) {
            this._ambientRef = v;
            this.setAmbientInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'shadows', {
          enumerable: true,
          configurable: true,
          get() {
            return this._shadowsRef;
          },
          set(v) {
            this._shadowsRef = v;
            this.setShadowsInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, '_skybox', {
          enumerable: true,
          configurable: true,
          get() {
            return this._skyboxRef;
          },
          set(v) {
            this._skyboxRef = v;
            this.setSkyboxInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'skybox', {
          enumerable: true,
          configurable: true,
          get() {
            return this._skyboxRef;
          },
          set(v) {
            this._skyboxRef = v;
            this.setSkyboxInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'fog', {
          enumerable: true,
          configurable: true,
          get() {
            return this._fogRef;
          },
          set(v) {
            this._fogRef = v;
            this.setFogInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'octree', {
          enumerable: true,
          configurable: true,
          get() {
            return this._octreeRef;
          },
          set(v) {
            this._octreeRef = v;
            this.setOctreeInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'lightProbeInfo', {
          enumerable: true,
          configurable: true,
          get() {
            return this._lightProbeRef;
          },
          set(v) {
            this._lightProbeRef = v;
            this.setLightProbeInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'skin', {
          enumerable: true,
          configurable: true,
          get() {
            return this._skinRef;
          },
          set(v) {
            this._skinRef = v;
            this.setSkinInfo(v);
          }
        });
        Object.defineProperty(sceneGlobalsProto, 'postSettings', {
          enumerable: true,
          configurable: true,
          get() {
            return this._postSettingsRef;
          },
          set(v) {
            this._postSettingsRef = v;
            this.setPostSettingsInfo(v);
          }
        });
      })();

      // handle meta data, it is generated automatically

      decros.patch_cc_SceneGlobals({
        SceneGlobals,
        AmbientInfo,
        SkyboxInfo,
        FogInfo,
        ShadowsInfo,
        LightProbeInfo,
        OctreeInfo,
        SkinInfo,
        PostSettingsInfo
      });
      decros.patch_cc_OctreeInfo({
        OctreeInfo,
        CCInteger,
        Vec3,
        DEFAULT_WORLD_MAX_POS,
        DEFAULT_WORLD_MIN_POS,
        DEFAULT_OCTREE_DEPTH
      });
      decros.patch_cc_ShadowsInfo({
        ShadowsInfo,
        ShadowType,
        CCFloat,
        CCInteger,
        ShadowSize,
        Vec3,
        Color,
        Vec2
      });
      decros.patch_cc_FogInfo({
        FogInfo,
        FogType,
        CCFloat,
        Color
      });
      decros.patch_cc_SkyboxInfo({
        SkyboxInfo,
        EnvironmentLightingType,
        TextureCube,
        CCFloat,
        Material
      });
      decros.patch_cc_AmbientInfo({
        AmbientInfo,
        Vec4,
        Ambient,
        CCFloat,
        legacyCC
      });
      decros.patch_cc_LightProbeInfo({
        LightProbeInfo,
        CCFloat,
        CCInteger
      });
      decros.patch_cc_SkinInfo({
        SkinInfo,
        CCFloat
      });
      decros.patch_cc_PostSettingsInfo({
        PostSettingsInfo,
        ToneMappingType
      });
    }
  };
});