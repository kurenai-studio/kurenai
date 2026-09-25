System.register("q-bundled:///fs/cocos/render-scene/scene/index.jsb.js", ["../../core/index.js", "./model.js", "./submodel.js", "./camera.js", "./reflection-probe.js"], function (_export, _context) {
  "use strict";

  var Enum, cclegacy, LODData, LODGroup, Ambient, LightType, nt2lm, Light, DirectionalLight, SpotLight, SphereLight, PointLight, RangedDirectionalLight, FogType, FOG_TYPE_NONE, FogInfo, Fog, ShadowSize, ShadowType, PCFType, CSMLevel, CSMOptimizationMode, EnvironmentLightingType, ToneMappingType, ShadowsInfo, Shadows, COEFFICIENT_OF_EXPANSION, Skybox, PostSettings;
  /**
   * Light related.
   */

  // Color temperature (in Kelvin) to RGB
  function ColorTemperatureToRGB(rgb, kelvin) {
    if (kelvin < 1000.0) {
      kelvin = 1000.0;
    } else if (kelvin > 15000.0) {
      kelvin = 15000.0;
    }

    // Approximate Planckian locus in CIE 1960 UCS
    const kSqr = kelvin * kelvin;
    const u = (0.860117757 + 1.54118254e-4 * kelvin + 1.28641212e-7 * kSqr) / (1.0 + 8.42420235e-4 * kelvin + 7.08145163e-7 * kSqr);
    const v = (0.317398726 + 4.22806245e-5 * kelvin + 4.20481691e-8 * kSqr) / (1.0 - 2.89741816e-5 * kelvin + 1.61456053e-7 * kSqr);
    const d = 2.0 * u - 8.0 * v + 4.0;
    const x = 3.0 * u / d;
    const y = 2.0 * v / d;
    const z = 1.0 - x - y;
    const X = 1.0 / y * x;
    const Z = 1.0 / y * z;

    // XYZ to RGB with BT.709 primaries
    rgb.x = 3.2404542 * X + -1.5371385 + -0.4985314 * Z;
    rgb.y = -0.9692660 * X + 1.8760108 + 0.0415560 * Z;
    rgb.z = 0.0556434 * X + -0.2040259 + 1.0572252 * Z;
  }
  _export("ColorTemperatureToRGB", ColorTemperatureToRGB);
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_modelJs) {
      var _exportObj = {};
      for (var _key in _modelJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _modelJs[_key];
      }
      _export(_exportObj);
    }, function (_submodelJs) {
      var _exportObj2 = {};
      for (var _key2 in _submodelJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _submodelJs[_key2];
      }
      _export(_exportObj2);
    }, function (_cameraJs) {
      var _exportObj3 = {};
      for (var _key3 in _cameraJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _cameraJs[_key3];
      }
      _export(_exportObj3);
    }, function (_reflectionProbeJs) {
      var _exportObj4 = {};
      for (var _key4 in _reflectionProbeJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _reflectionProbeJs[_key4];
      }
      _export(_exportObj4);
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("LODData", LODData = jsb.LODData);
      _export("LODGroup", LODGroup = jsb.LODGroup); // NOTE: why don't we export FogInfo and ShadowInfo from 'index.ts' 
      _export("Ambient", Ambient = jsb.Ambient);
      cclegacy.Ambient = Ambient;

      /**
       * @en Default sun illuminance
       * @zh 默认太阳亮度
       */
      Ambient.SUN_ILLUM = 65000.0;
      /**
       * @en Default sky illuminance
       * @zh 默认天空亮度
       */
      Ambient.SKY_ILLUM = 20000.0;
      _export("LightType", LightType = /*#__PURE__*/function (LightType) {
        LightType[LightType["DIRECTIONAL"] = 0] = "DIRECTIONAL";
        LightType[LightType["SPHERE"] = 1] = "SPHERE";
        LightType[LightType["SPOT"] = 2] = "SPOT";
        LightType[LightType["POINT"] = 3] = "POINT";
        LightType[LightType["RANGED_DIRECTIONAL"] = 4] = "RANGED_DIRECTIONAL";
        LightType[LightType["UNKNOWN"] = 5] = "UNKNOWN";
        return LightType;
      }({}));
      _export("nt2lm", nt2lm = size => 4 * Math.PI * Math.PI * size * size);
      _export("Light", Light = jsb.Light);
      cclegacy.Light = jsb.Light;
      _export("DirectionalLight", DirectionalLight = jsb.DirectionalLight);
      cclegacy.DirectionalLight = jsb.DirectionalLight;
      _export("SpotLight", SpotLight = jsb.SpotLight);
      cclegacy.SpotLight = jsb.SpotLight;
      _export("SphereLight", SphereLight = jsb.SphereLight);
      cclegacy.SphereLight = jsb.SphereLight;
      _export("PointLight", PointLight = jsb.PointLight);
      cclegacy.PointLight = jsb.PointLight;
      _export("RangedDirectionalLight", RangedDirectionalLight = jsb.RangedDirectionalLight);
      cclegacy.RangedDirectionalLight = jsb.RangedDirectionalLight;

      /**
       * Fog related.
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
      _export("FOG_TYPE_NONE", FOG_TYPE_NONE = FogType.LAYERED + 1);
      _export("FogInfo", FogInfo = jsb.FogInfo);
      _export("Fog", Fog = jsb.Fog);
      cclegacy.Fog = Fog;

      /**
       * Shadows related.
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
      _export("PCFType", PCFType = Enum({
        /**
         * @zh x1 次采样
         * @en x1 times
         * @readonly
         */
        HARD: 0,
        /**
         * @zh x4 次采样
         * @en x4 times
         * @readonly
         */
        SOFT: 1,
        /**
         * @zh x9 次采样
         * @en x9 times
         * @readonly
         */
        SOFT_2X: 2,
        /**
         * @zh x16 次采样
         * @en x16 times
         * @readonly
         */
        SOFT_4X: 3
      }));
      _export("CSMLevel", CSMLevel = Enum({
        /**
         * @zh 1 个层级
         * @en level 1
         * @readonly
         */
        LEVEL_1: 1,
        /**
         * @zh 2 个层级
         * @en level 2
         * @readonly
         */
        LEVEL_2: 2,
        /**
         * @zh 3 个层级
         * @en level 3
         * @readonly
         */
        LEVEL_3: 3,
        /**
         * @zh 4 个层级
         * @en level 4
         * @readonly
         */
        LEVEL_4: 4
      }));
      /**
       * @zh 级联阴影性能优化模式。
       * @en The CSM performance optimization mode
       * @enum Shadows.CSMOptimizationMode
       */
      _export("CSMOptimizationMode", CSMOptimizationMode = Enum({
        /**
         * @zh 没有性能优化
         * @en has no performance optimization
         * @readonly
         */
        NONE: 1,
        /**
         * @zh 2 个层级
         * @en level 2
         * @readonly
         */
        RemoveDuplicates: 2,
        /**
          * @zh 3 个层级
          * @en level 3
          * @readonly
          */
        DisableRotationFix: 3
      }));
      _export("EnvironmentLightingType", EnvironmentLightingType = Enum({
        /**
         * @zh
         * 半球漫反射
         * @en
         * hemisphere diffuse
         * @readonly
         */
        HEMISPHERE_DIFFUSE: 0,
        /**
         * @zh
         * 半球漫反射和环境反射
         * @en
         * hemisphere diffuse and Environment reflection
         * @readonly
         */
        AUTOGEN_HEMISPHERE_DIFFUSE_WITH_REFLECTION: 1,
        /**
         * @zh
         * 漫反射卷积图和环境反射
         * @en
         * diffuse convolution map and environment reflection
         * @readonly
         */
        DIFFUSEMAP_WITH_REFLECTION: 2
      }));
      _export("ToneMappingType", ToneMappingType = Enum({
        DEFAULT: 0,
        LINEAR: 1
      }));
      _export("ShadowsInfo", ShadowsInfo = jsb.ShadowsInfo);
      _export("Shadows", Shadows = jsb.Shadows);
      cclegacy.Shadows = Shadows;

      /**
       * @en MAX_FAR. This is shadow camera max far.
       * @zh 阴影相机的最远视距。
       */

      Object.defineProperty(Shadows, "MAX_FAR", {
        configurable: true,
        enumerable: true,
        get() {
          return 2000.0;
        }
      });
      COEFFICIENT_OF_EXPANSION = 2.0 * Math.sqrt(3.0);
      /**
       * @en EXPANSION_RATIO. This is shadow boundingBox Coefficient of expansion.
       * @zh 阴影包围盒扩大系数。
       */
      Object.defineProperty(Shadows, 'COEFFICIENT_OF_EXPANSION', {
        configurable: true,
        enumerable: true,
        get() {
          return COEFFICIENT_OF_EXPANSION;
        }
      });
      _export("Skybox", Skybox = jsb.Skybox);
      cclegacy.Skybox = Skybox;
      _export("PostSettings", PostSettings = jsb.PostSettings);
      cclegacy.PostSettings = PostSettings;
    }
  };
});