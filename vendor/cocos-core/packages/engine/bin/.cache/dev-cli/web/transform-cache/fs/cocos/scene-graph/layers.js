System.register("q-bundled:///fs/cocos/scene-graph/layers.js", ["../core/value-types/index.js", "../core/global-exports.js", "../core/math/bits.js", "../core/index.js", "../core/data/utils/asserts.js", "../core/platform/debug.js", "../core/settings.js"], function (_export, _context) {
  "use strict";

  var BitMask, Enum, legacyCC, log2, js, assertIsTrue, getError, warnID, settings, SettingsCategory, Layers, layerList;
  _export("Layers", void 0);
  return {
    setters: [function (_coreValueTypesIndexJs) {
      BitMask = _coreValueTypesIndexJs.BitMask;
      Enum = _coreValueTypesIndexJs.Enum;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_coreMathBitsJs) {
      log2 = _coreMathBitsJs.log2;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_corePlatformDebugJs) {
      getError = _corePlatformDebugJs.getError;
      warnID = _corePlatformDebugJs.warnID;
    }, function (_coreSettingsJs) {
      settings = _coreSettingsJs.settings;
      SettingsCategory = _coreSettingsJs.SettingsCategory;
    }],
    execute: function () {
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
      // built-in layers, users can use 0~19 bits, 20~31 are system preserve bits.
      layerList = {
        NONE: 0,
        IGNORE_RAYCAST: 1 << 20,
        GIZMOS: 1 << 21,
        EDITOR: 1 << 22,
        UI_3D: 1 << 23,
        SCENE_GIZMO: 1 << 24,
        UI_2D: 1 << 25,
        PROFILER: 1 << 28,
        DEFAULT: 1 << 30,
        ALL: 0xffffffff
      };
      /**
       * @zh 节点层管理器，层数据是以掩码数据方式存储在 [[Node.layer]] 中，用于射线检测、物理碰撞和用户自定义脚本逻辑。
       * 每个节点可属于一个或多个层，可通过 “包含式” 或 “排除式” 两种检测器进行层检测。
       * @en Node's layer manager, it's stored as bit mask data in [[Node.layer]].
       * Layer information is widely used in raycast, physics and user logic.
       * Every node can be assigned to multiple layers with different bit masks, you can setup layer with inclusive or exclusive operation.
       */
      _export("Layers", Layers = class Layers {
        constructor() {}
        /**
         * @en All layers in an Enum
         * @zh 以 Enum 形式存在的所有层列表
         */

        /**
         * @internal
         */
        static init() {
          const userLayers = settings.querySettings(SettingsCategory.ENGINE, 'customLayers');
          if (!userLayers) return;
          for (let i = 0; i < userLayers.length; i++) {
            const layer = userLayers[i];
            Layers.addLayer(layer.name, layer.bit);
          }
        }

        /**
         * @en
         * Make a layer mask accepting nothing but the listed layers
         * @zh
         * 创建一个包含式层检测器，只接受列表中的层
         * @param includes All accepted layers
         * @return A filter which can detect all accepted layers
         */
        static makeMaskInclude(includes) {
          return includes.reduce((mask, inc) => mask | inc, 0);
        }

        /**
         * @en
         * Make a layer mask accepting everything but the listed layers
         * @zh
         * 创建一个排除式层检测器，只拒绝列表中的层
         * @param excludes All excluded layers
         * @return A filter which can detect for excluded layers
         */
        static makeMaskExclude(excludes) {
          return ~Layers.makeMaskInclude(excludes);
        }

        /**
         * @zh 添加一个新层，用户可编辑 0 - 19 位为用户自定义层
         * @en Add a new layer, user can use layers from bit position 0 to 19, other bits are reserved.
         * @param name Layer's name
         * @param bitNum Layer's bit position
         */
        static addLayer(name, bitNum) {
          if (bitNum === undefined) {
            warnID(16364);
            return;
          }
          if (bitNum > 19 || bitNum < 0) {
            warnID(16365);
            return;
          }
          const val = 1 << bitNum;
          assertIsTrue(!Layers.Enum[name], getError(2104, name));
          Layers.Enum[name] = val;
          js.value(Layers.Enum, String(val), name);
          Layers.BitMask[name] = val;
          js.value(Layers.BitMask, String(val), name);
          BitMask.update(Layers.BitMask);
          Enum.update(Layers.Enum);
        }

        /**
         * @en Remove a layer, user can remove layers from bit position 0 to 19, other bits are reserved.
         * @zh 移除一个层，用户可编辑 0 - 19 位为用户自定义层
         * @param bitNum Layer's bit position
         */
        static deleteLayer(bitNum) {
          if (bitNum > 19 || bitNum < 0) {
            warnID(16366);
            return;
          }
          const val = 1 << bitNum;
          delete Layers.Enum[Layers.Enum[val]];
          delete Layers.Enum[val];
          delete Layers.BitMask[Layers.BitMask[val]];
          delete Layers.BitMask[val];
          BitMask.update(Layers.BitMask);
          Enum.update(Layers.Enum);
        }

        /**
         * @en Given a layer name, returns the layer index as defined by either a Builtin or a User Layer in the Tags and Layers manager.
         * @zh 给定层名称，返回由标记和层管理器中的内置层或用户层定义的层索引。
         * @param name layer's name
         */
        static nameToLayer(name) {
          if (name === undefined) {
            warnID(16367);
            return -1;
          }
          return log2(Layers.Enum[name]);
        }

        /**
         * @en Given a layer number, returns the name of the layer as defined in either a Builtin or a User Layer in the Tags and Layers manager.
         * @zh 给定层数，返回在标记和层管理器中的内置层或用户层中定义的层名称。
         * @param bitNum layer's value
         */
        static layerToName(bitNum) {
          if (bitNum > 31 || bitNum < 0) {
            warnID(16368);
            return '';
          }
          return Layers.Enum[1 << bitNum];
        }
      });
      Layers.Enum = Enum(layerList);
      /**
       * @en All layers in [[BitMask]] type
       * @zh 包含所有层的 [[BitMask]]
       */
      Layers.BitMask = BitMask({
        ...layerList
      });
      legacyCC.Layers = Layers;
    }
  };
});