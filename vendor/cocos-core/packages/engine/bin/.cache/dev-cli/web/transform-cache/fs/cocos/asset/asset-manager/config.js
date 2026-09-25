System.register("q-bundled:///fs/cocos/asset/asset-manager/config.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "./cache.js", "./helper.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, TEST, js, cclegacy, Cache, decodeUuid, normalize, Config, isMatchByWord, processOptions;
  _export("default", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_cacheJs) {
      Cache = _cacheJs.default;
    }, function (_helperJs) {
      decodeUuid = _helperJs.decodeUuid;
      normalize = _helperJs.normalize;
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
       * @en Th asset's meta information. Used to obtain information about the asset.
       * @zh 资源的元信息。用于获取资源的相关信息。
       */
      /**
       * @en Information about the merged files.
       * @zh 合并文件的信息。
       */
      /**
       * @en Addressable asset information, you can look up the path of the asset in the project and the type of the asset.
       * @zh 可寻址资源的信息，你可以查询到该资源在项目中的路径与资源的类型。
       */
      /**
       * @en Information about the scene asset.
       * @zh 场景资源的相关信息。
       */
      isMatchByWord = (path, test) => {
        if (path.length > test.length) {
          const nextAscii = path.charCodeAt(test.length);
          return nextAscii === 47; // '/'
        }
        return true;
      };
      processOptions = options => {
        if (EDITOR_NOT_IN_PREVIEW || TEST) {
          return;
        }
        let uuids = options.uuids;
        const paths = options.paths;
        const types = options.types;
        const bundles = options.deps;
        const realEntries = options.paths = Object.create(null);
        if (options.debug === false) {
          for (let i = 0, l = uuids.length; i < l; i++) {
            uuids[i] = decodeUuid(uuids[i]);
          }
          for (const id in paths) {
            const entry = paths[id];
            const type = entry[1];
            entry[1] = types[type];
          }
        } else {
          const out = Object.create(null);
          for (let i = 0, l = uuids.length; i < l; i++) {
            const uuid = uuids[i];
            uuids[i] = out[uuid] = decodeUuid(uuid);
          }
          uuids = out;
        }
        for (const id in paths) {
          const entry = paths[id];
          realEntries[uuids[id]] = entry;
        }
        const scenes = options.scenes;
        for (const name in scenes) {
          const uuid = scenes[name];
          scenes[name] = uuids[uuid];
        }
        const packs = options.packs;
        for (const packId in packs) {
          const packedIds = packs[packId];
          for (let j = 0; j < packedIds.length; ++j) {
            packedIds[j] = uuids[packedIds[j]];
          }
        }
        const versions = options.versions;
        if (versions) {
          for (const folder in versions) {
            const entries = versions[folder];
            for (let i = 0; i < entries.length; i += 2) {
              const uuid = entries[i];
              entries[i] = uuids[uuid] || uuid;
            }
          }
        }
        const redirect = options.redirect;
        if (redirect) {
          for (let i = 0; i < redirect.length; i += 2) {
            redirect[i] = uuids[redirect[i]];
            redirect[i + 1] = bundles[redirect[i + 1]];
          }
        }
        const extensionMap = options.extensionMap;
        if (extensionMap) {
          for (const ext in options.extensionMap) {
            if (!Object.prototype.hasOwnProperty.call(options.extensionMap, ext)) {
              continue;
            }
            options.extensionMap[ext].forEach((uuid, index) => {
              options.extensionMap[ext][index] = uuids[uuid] || uuid;
            });
          }
        }
      };
      _export("default", Config = class Config {
        constructor() {
          this.name = '';
          this.base = '';
          this.importBase = '';
          this.nativeBase = '';
          this.deps = null;
          this.assetInfos = new Cache();
          this.scenes = new Cache();
          this.paths = new Cache();
        }
        init(options) {
          processOptions(options);
          this.importBase = options.importBase || '';
          this.nativeBase = options.nativeBase || '';
          this.base = options.base || '';
          this.name = options.name || '';
          this.deps = options.deps || [];
          // init
          this._initUuid(options.uuids);
          this._initPath(options.paths);
          this._initScene(options.scenes);
          this._initPackage(options.packs, options.extensionMap['.cconb']);
          this._initVersion(options.versions);
          this._initRedirect(options.redirect);
          for (const ext in options.extensionMap) {
            if (!Object.prototype.hasOwnProperty.call(options.extensionMap, ext)) {
              continue;
            }
            options.extensionMap[ext].forEach(uuid => {
              const assetInfo = this.assetInfos.get(uuid);
              if (assetInfo) {
                assetInfo.extension = ext;
              }
            });
          }
        }
        getInfoWithPath(path, type) {
          if (!path) {
            return null;
          }
          path = normalize(path);
          const items = this.paths.get(path);
          if (items) {
            if (type) {
              for (let i = 0, l = items.length; i < l; i++) {
                const assetInfo = items[i];
                if (js.isChildClassOf(assetInfo.ctor, type)) {
                  return assetInfo;
                }
              }
            } else {
              return items[0];
            }
          }
          return null;
        }
        getDirWithPath(path, type, out) {
          path = normalize(path);
          if (path[path.length - 1] === '/') {
            path = path.slice(0, -1);
          }
          const infos = out || [];
          this.paths.forEach((items, p) => {
            if (p.startsWith(path) && isMatchByWord(p, path) || !path) {
              for (let i = 0, l = items.length; i < l; i++) {
                const entry = items[i];
                if (!type || js.isChildClassOf(entry.ctor, type)) {
                  infos.push(entry);
                }
              }
            }
          });
          return infos;
        }
        getAssetInfo(uuid) {
          return this.assetInfos.get(uuid) || null;
        }
        getSceneInfo(name) {
          if (!name.endsWith('.scene')) {
            name += '.scene';
          }
          if (name[0] !== '/' && !name.startsWith('db://')) {
            name = `/${name}`;
          }
          // search scene
          const info = this.scenes.find((val, key) => key.endsWith(name));
          return info;
        }
        destroy() {
          this.paths.destroy();
          this.scenes.destroy();
          this.assetInfos.destroy();
        }
        _initUuid(uuidList) {
          if (!uuidList) {
            return;
          }
          this.assetInfos.clear();
          for (let i = 0, l = uuidList.length; i < l; i++) {
            const uuid = uuidList[i];
            this.assetInfos.add(uuid, {
              uuid
            });
          }
        }
        _initPath(pathList) {
          if (!pathList) {
            return;
          }
          const paths = this.paths;
          paths.clear();
          for (const uuid in pathList) {
            const info = pathList[uuid];
            const path = info[0];
            const type = info[1];
            const isSubAsset = info.length === 3;
            const assetInfo = this.assetInfos.get(uuid);
            assetInfo.path = path;
            assetInfo.ctor = js.getClassById(type);
            if (paths.has(path)) {
              if (isSubAsset) {
                paths.get(path).push(assetInfo);
              } else {
                paths.get(path).unshift(assetInfo);
              }
            } else {
              paths.add(path, [assetInfo]);
            }
          }
        }
        _initScene(sceneList) {
          if (!sceneList) {
            return;
          }
          const scenes = this.scenes;
          scenes.clear();
          const assetInfos = this.assetInfos;
          for (const sceneName in sceneList) {
            const uuid = sceneList[sceneName];
            const assetInfo = assetInfos.get(uuid);
            assetInfo.url = sceneName;
            scenes.add(sceneName, assetInfo);
          }
        }
        _initPackage(packageList, cconbUuids) {
          if (!packageList) {
            return;
          }
          const assetInfos = this.assetInfos;
          for (const packUuid in packageList) {
            const uuids = packageList[packUuid];
            const isCconb = (uuids == null ? void 0 : uuids.length) > 0 && (cconbUuids == null ? void 0 : cconbUuids.includes(uuids[0]));
            const ext = isCconb ? '.bin' : '.json';
            const pack = {
              uuid: packUuid,
              packedUuids: uuids,
              ext
            };
            assetInfos.add(packUuid, pack);
            for (let i = 0, l = uuids.length; i < l; i++) {
              const uuid = uuids[i];
              const assetInfo = assetInfos.get(uuid);
              const assetPacks = assetInfo.packs;
              if (assetPacks) {
                if (l === 1) {
                  assetPacks.unshift(pack);
                } else {
                  assetPacks.push(pack);
                }
              } else {
                assetInfo.packs = [pack];
              }
            }
          }
        }
        _initVersion(versions) {
          if (!versions) {
            return;
          }
          const assetInfos = this.assetInfos;
          let entries = versions.import;
          if (entries) {
            for (let i = 0, l = entries.length; i < l; i += 2) {
              const uuid = entries[i];
              const assetInfo = assetInfos.get(uuid);
              assetInfo.ver = entries[i + 1];
            }
          }
          entries = versions.native;
          if (entries) {
            for (let i = 0, l = entries.length; i < l; i += 2) {
              const uuid = entries[i];
              const assetInfo = assetInfos.get(uuid);
              assetInfo.nativeVer = entries[i + 1];
            }
          }
        }
        _initRedirect(redirect) {
          if (!redirect) {
            return;
          }
          const assetInfos = this.assetInfos;
          for (let i = 0, l = redirect.length; i < l; i += 2) {
            const uuid = redirect[i];
            const assetInfo = assetInfos.get(uuid);
            assetInfo.redirect = redirect[i + 1];
          }
        }
      });
      if (TEST) {
        cclegacy._Test.Config = Config;
      }
    }
  };
});