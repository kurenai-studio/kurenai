System.register("q-bundled:///fs/cocos/sorting/sorting-layers.js", ["../../../virtual/internal%253Aconstants.js", "../game/director.js", "../game/index.js", "../core/platform/debug.js", "../core/settings.js", "../core/value-types/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, director, Game, game, errorID, settings, SettingsCategory, Enum, SortingLayers, SortingLayer;
  _export("SortingLayers", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }, function (_gameIndexJs) {
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
    }, function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
    }, function (_coreSettingsJs) {
      settings = _coreSettingsJs.settings;
      SettingsCategory = _coreSettingsJs.SettingsCategory;
    }, function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
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
      SortingLayer = {
        default: 0
      };
      game.on(Game.EVENT_POST_SUBSYSTEM_INIT, () => {
        SortingLayers.init();
      });

      /**
       * @zh 排序层管理器，用于在 sorting 组件中帮助用户进行对象分组并进行层级排序。
       * 在sorting组件中，layer 的排序优先级高于 sortingOrder。
       * @en Sorting layers manager, Used in the sorting component to help the user group objects and perform layer sorting.
       * In the sorting component, layer has higher sorting priority than sortingOrder.
       * */
      _export("SortingLayers", SortingLayers = class SortingLayers {
        /**
         * @zh 计算排序优先级
         * @en Calculate sorting priority
         */
        static getSortingPriority(layer = 0, order = 0) {
          return (layer + (1 << 15) << 16 | order + (1 << 15)) >>> 0;
        }
        static getDefaultPriority() {
          return this.getSortingPriority(SortingLayer.default, 0);
        }

        /**
         * @zh 获取 Layer 顺序索引
         * @en Get Layer index by id
         */
        static getLayerIndex(layer = 0) {
          let index = 0;
          if (this.indexMap.has(layer)) {
            index = this.indexMap.get(layer);
          } else {
            errorID(2105);
          }
          return index;
        }

        /**
         * @zh 通过 Layer 名字获取 Layer 顺序索引值
         * @en Get Layer index by name
         */
        static getLayerIndexByName(name) {
          const id = this.getLayerByName(name);
          return this.getLayerIndex(id);
        }

        /**
         * @zh 获取 Layer 名字
         * @en Get Layer name by id
         */
        static getLayerName(layer = 0) {
          let name = '';
          if (this.nameMap.has(layer)) {
            name = this.nameMap.get(layer);
          } else {
            errorID(2105);
          }
          return name;
        }

        /**
         * @zh 通过 Layer 名字获取 Layer id 值
         * @en Get Layer id by name
         */
        static getLayerByName(name) {
          const count = this.nameMap.size;
          const keyIterator = this.nameMap.keys();
          let key = 0;
          for (let i = 0; i < count; i++) {
            key = keyIterator.next().value;
            if (this.nameMap.get(key) === name) return key;
          }
          errorID(2106);
          return 0;
        }

        /**
         * @zh 检查 Layer id 有效性
         * @en Check Layer id validity
         */
        static isLayerValid(id) {
          // check valid
          if (this.indexMap.has(id)) {
            return true;
          } else {
            errorID(2105);
            return false;
          }
        }

        /**
         * @zh 获取内置 Sorting Layer 数组
         * @en Get Builtin Layer array
         */
        static getBuiltinLayers() {
          return [{
            id: 0,
            name: 'default',
            value: 0
          }];
          // Tips：If want ues more builtin layer, builtin layer id should smaller than 0, custom layer id is bigger than 0
          // 'default' layer id is 0
        }

        /**
         * @engineInternal
         */
        static init() {
          let sortingLayers = settings.querySettings(SettingsCategory.ENGINE, 'sortingLayers');
          if (!sortingLayers || sortingLayers.length === 0) {
            sortingLayers = this.getBuiltinLayers();
          }
          SortingLayers.resetState();
          for (let i = 0; i < sortingLayers.length; i++) {
            const layer = sortingLayers[i];
            SortingLayers.setLayer(layer.id, layer.name, layer.value);
            SortingLayers.Enum[layer.name] = layer.id;
          }
          Enum.update(SortingLayers.Enum);
          Enum.sortList(SortingLayers.Enum, (a, b) => SortingLayers.getLayerIndex(a.value) - SortingLayers.getLayerIndex(b.value));
          if (EDITOR) {
            const scene = director.getScene();
            if (!scene) {
              return;
            }
            scene.walk(node => {
              const sort = node.getComponent('cc.Sorting');
              if (sort) {
                // HACK: Property '_updateSortingPriority' does not exist on type 'Component'.
                // we can't import Sorting class in this module.
                sort._updateSortingPriority();
              }
            });
          }
        }

        /**
         * @engineInternal
         */
        static setLayer(layer, layerName, layerIndex) {
          this.nameMap.set(layer, layerName);
          this.indexMap.set(layer, layerIndex);
        }

        /**
         * @engineInternal
         */
        static resetState() {
          const oldItem = Object.keys(SortingLayers.Enum);
          for (let i = 0; i < oldItem.length; i++) {
            delete SortingLayers.Enum[SortingLayers.Enum[oldItem[i]]];
            delete SortingLayers.Enum[oldItem[i]];
          }
          SortingLayers.indexMap.clear();
          SortingLayers.nameMap.clear();
        }
      });
      SortingLayers.nameMap = new Map();
      SortingLayers.indexMap = new Map();
      /**
       * @en All sortinglayers in an Enum
       * @zh 以 Enum 形式存在的所有排序层列表
       */
      SortingLayers.Enum = Enum(SortingLayer);
    }
  };
});