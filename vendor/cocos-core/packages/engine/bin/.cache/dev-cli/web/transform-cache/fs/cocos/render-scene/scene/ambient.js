System.register("q-bundled:///fs/cocos/render-scene/scene/ambient.js", ["../../core/index.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var Vec4, cclegacy, getPipelineSceneData, Ambient;
  _export("Ambient", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
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
      /**
       * @en Ambient lighting representation in the render scene.
       * The initial data is setup in [[SceneGlobals.ambient]].
       * @zh 渲染场景中的环境光照设置。
       * 初始值是由 [[SceneGlobals.ambient]] 设置的。
       */
      _export("Ambient", Ambient = class Ambient {
        constructor() {
          this._groundAlbedoHDR = new Vec4(0.2, 0.2, 0.2, 1.0);
          this._skyColorHDR = new Vec4(0.2, 0.5, 0.8, 1.0);
          this._skyIllumHDR = 0;
          this._groundAlbedoLDR = new Vec4(0.2, 0.2, 0.2, 1.0);
          this._skyColorLDR = new Vec4(0.2, 0.5, 0.8, 1.0);
          this._skyIllumLDR = 0;
          this._mipmapCount = 1;
          this._enabled = false;
        }
        /**
         * @en Enable ambient
         * @zh 是否开启环境光
         */
        set enabled(val) {
          this._enabled = val;
        }
        get enabled() {
          return this._enabled;
        }
        /**
         * @en Sky color
         * @zh 天空颜色
         */
        get skyColor() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._skyColorHDR;
          } else {
            return this._skyColorLDR;
          }
        }
        set skyColor(color) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._skyColorHDR.set(color);
          } else {
            this._skyColorLDR.set(color);
          }
        }

        /**
         * @en Sky illuminance
         * @zh 天空亮度
         */
        get skyIllum() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._skyIllumHDR;
          } else {
            return this._skyIllumLDR;
          }
        }
        set skyIllum(illum) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._skyIllumHDR = illum;
          } else {
            this._skyIllumLDR = illum;
          }
        }
        /**
         * @en Ground color
         * @zh 地面颜色
         */
        get groundAlbedo() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._groundAlbedoHDR;
          } else {
            return this._groundAlbedoLDR;
          }
        }
        set groundAlbedo(color) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._groundAlbedoHDR.set(color);
          } else {
            this._groundAlbedoLDR.set(color);
          }
        }
        initialize(ambientInfo) {
          // Init HDR/LDR from serialized data on load
          this._skyColorHDR = ambientInfo.skyColorHDR;
          this._groundAlbedoHDR.set(ambientInfo.groundAlbedoHDR);
          this._skyIllumHDR = ambientInfo.skyIllumHDR;
          this._skyColorLDR = ambientInfo.skyColorLDR;
          this._groundAlbedoLDR.set(ambientInfo.groundAlbedoLDR);
          this._skyIllumLDR = ambientInfo.skyIllumLDR;
        }
      });
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
      cclegacy.Ambient = Ambient;
    }
  };
});