System.register("q-bundled:///fs/cocos/rendering/debug-view.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var cclegacy, DebugView, RenderingDebugViewType, DebugViewSingleType, DebugViewCompositeType;
  _export("DebugView", void 0);
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      RenderingDebugViewType = {
        NONE: 0,
        SINGLE: 1,
        COMPOSITE_AND_MISC: 2
      };
      /**
       * @zh
       * 渲染单项调试模式
       * @en
       * Rendering single debug mode
       * @readonly
       */
      _export("DebugViewSingleType", DebugViewSingleType = {
        NONE: 0,
        VERTEX_COLOR: 1,
        VERTEX_NORMAL: 2,
        VERTEX_TANGENT: 3,
        WORLD_POS: 4,
        VERTEX_MIRROR: 5,
        FACE_SIDE: 6,
        UV0: 7,
        UV1: 8,
        UV_LIGHTMAP: 9,
        PROJ_DEPTH: 10,
        LINEAR_DEPTH: 11,
        FRAGMENT_NORMAL: 12,
        FRAGMENT_TANGENT: 13,
        FRAGMENT_BINORMAL: 14,
        BASE_COLOR: 15,
        DIFFUSE_COLOR: 16,
        SPECULAR_COLOR: 17,
        TRANSPARENCY: 18,
        METALLIC: 19,
        ROUGHNESS: 20,
        SPECULAR_INTENSITY: 21,
        IOR: 22,
        DIRECT_DIFFUSE: 23,
        DIRECT_SPECULAR: 24,
        DIRECT_ALL: 25,
        ENV_DIFFUSE: 26,
        ENV_SPECULAR: 27,
        ENV_ALL: 28,
        EMISSIVE: 29,
        LIGHT_MAP: 30,
        SHADOW: 31,
        AO: 32,
        FRESNEL: 33,
        DIRECT_TRANSMIT_DIFFUSE: 34,
        DIRECT_TRANSMIT_SPECULAR: 35,
        ENV_TRANSMIT_DIFFUSE: 36,
        ENV_TRANSMIT_SPECULAR: 37,
        TRANSMIT_ALL: 38,
        DIRECT_TRT: 39,
        ENV_TRT: 40,
        TRT_ALL: 41,
        FOG: 42
      });
      /**
       * @zh
       * 渲染组合调试模式
       * @en
       * Rendering composite debug mode
       * @readonly
       */
      _export("DebugViewCompositeType", DebugViewCompositeType = {
        DIRECT_DIFFUSE: 0,
        DIRECT_SPECULAR: 1,
        ENV_DIFFUSE: 2,
        ENV_SPECULAR: 3,
        EMISSIVE: 4,
        LIGHT_MAP: 5,
        SHADOW: 6,
        AO: 7,
        NORMAL_MAP: 8,
        FOG: 9,
        TONE_MAPPING: 10,
        GAMMA_CORRECTION: 11,
        FRESNEL: 12,
        TRANSMIT_DIFFUSE: 13,
        TRANSMIT_SPECULAR: 14,
        TRT: 15,
        TT: 16,
        MAX_BIT_COUNT: 17
      });
      /**
       * @en Rendering debug view control class
       * @zh 渲染调试控制类
       */
      _export("DebugView", DebugView = class DebugView {
        /**
         * @en Toggle rendering single debug mode.
         * @zh 设置渲染单项调试模式。
         */
        get singleMode() {
          return this._singleMode;
        }
        set singleMode(val) {
          this._singleMode = val;
          this._updatePipeline();
        }

        /**
         * @en Toggle normal / pure lighting mode.
         * @zh 切换正常光照和仅光照模式。
         */
        get lightingWithAlbedo() {
          return this._lightingWithAlbedo;
        }
        set lightingWithAlbedo(val) {
          this._lightingWithAlbedo = val;
          this._updatePipeline();
        }

        /**
         * @en Toggle CSM layer coloration mode.
         * @zh 切换级联阴影染色调试模式。
         */
        get csmLayerColoration() {
          return this._csmLayerColoration;
        }
        set csmLayerColoration(val) {
          this._csmLayerColoration = val;
          this._updatePipeline();
        }
        get debugViewType() {
          return this._getType();
        }
        constructor() {
          this._singleMode = DebugViewSingleType.NONE;
          this._compositeModeValue = 0;
          this._lightingWithAlbedo = true;
          this._csmLayerColoration = false;
          this._activate();
        }

        /**
         * @en Whether enabled with specified rendering composite debug mode.
         * @zh 获取指定的渲染组合调试模式是否开启。
         * @param Specified composite type.
         */
        isCompositeModeEnabled(val) {
          const mode = this._compositeModeValue & 1 << val;
          return mode !== 0;
        }
        /**
         * @en Toggle specified rendering composite debug mode.
         * @zh 开关指定的渲染组合调试模式。
         * @param Specified composite type, enable or disable.
         */
        enableCompositeMode(val, enable) {
          this._enableCompositeMode(val, enable);
          this._updatePipeline();
        }

        /**
         * @en Toggle all rendering composite debug mode.
         * @zh 开关所有的渲染组合调试模式。
         */
        enableAllCompositeMode(enable) {
          this._enableAllCompositeMode(enable);
          this._updatePipeline();
        }

        /**
         * @en Get rendering debug view on / off state.
         * @zh 查询当前是否开启了渲染调试模式。
         */
        isEnabled() {
          return this._getType() !== RenderingDebugViewType.NONE;
        }

        /**
         * @en Disable all debug view modes, reset to standard rendering mode.
         * @zh 关闭所有的渲染调试模式，恢复到正常渲染。
         */
        reset() {
          this._activate();
          this._updatePipeline();
        }

        /**
         * @internal
         */
        _activate() {
          this._singleMode = DebugViewSingleType.NONE;
          this._enableAllCompositeMode(true);
          this._lightingWithAlbedo = true;
          this._csmLayerColoration = false;
        }
        _updatePipeline() {
          const root = cclegacy.director.root;
          const pipeline = root.pipeline;
          const useDebugView = this._getType();
          if (pipeline.macros.CC_USE_DEBUG_VIEW !== useDebugView) {
            pipeline.macros.CC_USE_DEBUG_VIEW = useDebugView;
            root.onGlobalPipelineStateChanged();
          }
        }
        _enableCompositeMode(val, enable) {
          if (enable) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            this._compositeModeValue |= 1 << val;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            this._compositeModeValue &= ~(1 << val);
          }
        }
        _enableAllCompositeMode(enable) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          for (let i = 0; i < DebugViewCompositeType.MAX_BIT_COUNT; i++) {
            if (enable) {
              this._compositeModeValue |= 1 << i;
            } else {
              this._compositeModeValue &= ~(1 << i);
            }
          }
        }
        _getType() {
          if (this._singleMode !== DebugViewSingleType.NONE) {
            return RenderingDebugViewType.SINGLE;
          } else if (this._lightingWithAlbedo !== true || this._csmLayerColoration !== false) {
            return RenderingDebugViewType.COMPOSITE_AND_MISC;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            for (let i = 0; i < DebugViewCompositeType.MAX_BIT_COUNT; i++) {
              if (!this.isCompositeModeEnabled(i)) {
                return RenderingDebugViewType.COMPOSITE_AND_MISC;
              }
            }
          }
          return RenderingDebugViewType.NONE;
        }
      });
    }
  };
});