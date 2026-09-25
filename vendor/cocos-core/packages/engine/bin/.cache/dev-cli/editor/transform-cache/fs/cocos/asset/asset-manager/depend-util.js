System.register("q-bundled:///fs/cocos/asset/asset-manager/depend-util.js", ["../../../../virtual/internal%253Aconstants.js", "../../serialization/deserialize.js", "./cache.js", "./deserialize.js", "./helper.js", "./shared.js", "./depend-maps.js", "../../core/index.js", "../../serialization/ccon.js"], function (_export, _context) {
  "use strict";

  var BUILD, EDITOR, hasNativeDep, isCompiledJson, parseUuidDependencies, Cache, deserialize, decodeUuid, files, parsed, dependMap, nativeDependMap, assertIsNonNullable, CCON, DependUtil;
  _export("DependUtil", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_serializationDeserializeJs) {
      hasNativeDep = _serializationDeserializeJs.hasNativeDep;
      isCompiledJson = _serializationDeserializeJs.isCompiledJson;
      parseUuidDependencies = _serializationDeserializeJs.parseUuidDependencies;
    }, function (_cacheJs) {
      Cache = _cacheJs.default;
    }, function (_deserializeJs) {
      deserialize = _deserializeJs.default;
    }, function (_helperJs) {
      decodeUuid = _helperJs.decodeUuid;
    }, function (_sharedJs) {
      files = _sharedJs.files;
      parsed = _sharedJs.parsed;
    }, function (_dependMapsJs) {
      dependMap = _dependMapsJs.dependMap;
      nativeDependMap = _dependMapsJs.nativeDependMap;
    }, function (_coreIndexJs) {
      assertIsNonNullable = _coreIndexJs.assertIsNonNullable;
    }, function (_serializationCconJs) {
      CCON = _serializationCconJs.CCON;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en
       * Manages asset's dependency list, it is a singleton. You can access it via [[AssetManager.dependUtil]].
       *
       * @zh
       * 管理资源的依赖列表，这是一个单例, 你能通过 [[AssetManager.dependUtil]] 访问它。
       *
       */
      _export("DependUtil", DependUtil = class DependUtil {
        /**
         * @en Global singleton for [[DependUtil]]. You can access it via [[AssetManager.dependUtil]].
         * @zh [[DependUtil]] 的全局单例. 你可以通过 [[AssetManager.dependUtil]] 访问.
         */
        static get instance() {
          if (!this._instance) {
            this._instance = new DependUtil();
          }
          return this._instance;
        }
        constructor() {
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._depends = new Cache();
        }

        /**
         * @engineInternal
         */
        init() {
          this._depends.clear();
        }

        /**
         * @en
         * Gets asset's native dependency. For example, ImageAsset's native dependency is image.
         * Note: You will need to have loaded this resource to query this information.
         *
         * @zh
         * 获取资源的原生依赖，例如 ImageAsset 的原生依赖是图片。
         * 注意：你需要加载过该资源，才能查询此信息。
         *
         * @param uuid @en asset's uuid. @zh 资源的 uuid。
         * @returns @en The native dependency information of this asset. @zh 资源的原生依赖的信息。
         *
         * @example
         * var dep = dependUtil.getNativeDep('fcmR3XADNLgJ1ByKhqcC5Z');
         * @deprecated Since v3.7, this is an engine internal interface.
         * If you want to know the native dependency of the asset, use [[Asset.nativeUrl]] instead.
         */
        getNativeDep(uuid) {
          const depend = this._depends.get(uuid);
          if (depend && depend.nativeDep) {
            return {
              ...depend.nativeDep
            };
          }
          return null;
        }

        /**
         * @en
         * Gets asset's direct referencing dependency list. For example, Material's dependencies are Texture, effect asset etc.
         * Note: You will need to have loaded this resource to query this information.
         *
         * @zh
         * 获取资源直接引用的依赖列表，例如，材质的直接依赖资源是 Texture, Effect 等。
         * 注意：你需要加载过该资源，才能查询此信息。
         *
         * @param uuid @en asset's uuid. @zh 资源的 uuid。
         * @returns @en The direct referencing dependency asset list. @zh 直接引用的依赖资源列表。
         *
         * @example
         * var deps = dependUtil.getDeps('fcmR3XADNLgJ1ByKhqcC5Z');
         *
         */
        getDeps(uuid) {
          if (this._depends.has(uuid)) {
            return this._depends.get(uuid).deps;
          }
          return [];
        }

        /**
         * @en
         * Gets dependency list of the loaded asset, include indirect reference.
         * Note: You will need to have loaded this resource to query this information.
         *
         * @zh
         * 获取某个已经加载好的资源的所有依赖资源列表，包括间接引用的资源，并保存在数组中返回。
         * 注意：你需要加载过该资源，才能查询此信息。
         *
         * @param uuid @en asset's uuid. @zh 资源的 uuid。
         * @returns
         * @en The all dependency list including direct reference and indirect reference.
         * @zh 所有依赖列表，包括直接引用的与间接引用的。
         *
         * @example
         * var deps = dependUtil.getDepsRecursively('fcmR3XADNLgJ1ByKhqcC5Z');
         *
         */
        getDepsRecursively(uuid) {
          const exclude = Object.create(null);
          const depends = [];
          this._descend(uuid, exclude, depends);
          return depends;
        }

        /**
         * @engineInternal
         */
        remove(uuid) {
          this._depends.remove(uuid);
        }

        /**
         * @en
         * Extracts dependency list from serialized data or asset and then store in cache.
         *
         * @zh
         * 从序列化数据或资源中提取出依赖列表，并且存储在缓存中。
         *
         * @param uuid - The uuid of serialized data or asset
         * @param json - Serialized data or asset
         * @returns dependency list, include non-native and native dependency
         *
         * @example
         * downloader.downloadFile('test.json', { xhrResponseType: 'json'}, null, (err, file) => {
         *     var dependencies = parse('fcmR3XADNLgJ1ByKhqcC5Z', file);
         * });
         *
         * @engineInternal
         */
        parse(uuid, json) {
          let out = null;
          if (Array.isArray(json) || json.__type__ || json instanceof CCON) {
            if (this._depends.has(uuid)) {
              return this._depends.get(uuid);
            }

            // TODO: json: any[] is not assigned to IFileData
            // workaround: mark json as any
            // issue: https://github.com/cocos/cocos-engine/issues/14642
            if (Array.isArray(json) && (!(BUILD || isCompiledJson(json)) || !hasNativeDep(json))) {
              out = {
                deps: this._parseDepsFromJson(json)
              };
            } else {
              try {
                const asset = deserialize(json, {
                  __uuid__: uuid
                });
                out = this._parseDepsFromAsset(asset);
                if (out.nativeDep) {
                  out.nativeDep.uuid = uuid;
                }
                parsed.add(`${uuid}@import`, asset);
              } catch (e) {
                files.remove(`${uuid}@import`);
                out = {
                  deps: []
                };
              }
            }
          } else {
            // get deps from an existing asset
            if (!EDITOR && this._depends.has(uuid)) {
              out = this._depends.get(uuid);
              if (out.parsedFromExistAsset) {
                return out;
              }
            }
            out = this._parseDepsFromAsset(json);
          }
          // cache dependency list
          this._depends.add(uuid, out);
          return out;
        }
        _parseDepsFromAsset(asset) {
          const out = {
            deps: [],
            parsedFromExistAsset: true
          };
          const deps = dependMap.get(asset);
          assertIsNonNullable(deps);
          for (let i = 0, l = deps.length; i < l; i++) {
            out.deps.push(deps[i].uuid);
          }
          if (nativeDependMap.has(asset)) {
            out.nativeDep = asset._nativeDep;
          }
          return out;
        }
        _parseDepsFromJson(json) {
          const depends = parseUuidDependencies(json);
          depends.forEach((uuid, index) => depends[index] = decodeUuid(uuid));
          return depends;
        }
        _descend(uuid, exclude, depends) {
          const deps = this.getDeps(uuid);
          for (let i = 0; i < deps.length; i++) {
            const depend = deps[i];
            if (!exclude[depend]) {
              exclude[depend] = true;
              depends.push(depend);
              this._descend(depend, exclude, depends);
            }
          }
        }
      });
      DependUtil._instance = void 0;
      _export("default", DependUtil.instance);
    }
  };
});