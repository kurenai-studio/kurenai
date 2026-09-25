System.register("q-bundled:///fs/cocos/asset/asset-manager/pack-manager.js", ["../assets/image-asset.js", "../assets/texture-2d.js", "../../serialization/deserialize.js", "../../core/index.js", "./cache.js", "./downloader.js", "./helper.js", "./shared.js", "../../serialization/ccon.js", "./bin-package-unpack.js"], function (_export, _context) {
  "use strict";

  var ImageAsset, Texture2D, packCustomObjData, unpackJSONs, assertIsTrue, error, errorID, js, Cache, downloader, transform, files, decodeCCONBinary, binPackageUnpack, PackManager;
  _export("PackManager", void 0);
  return {
    setters: [function (_assetsImageAssetJs) {
      ImageAsset = _assetsImageAssetJs.ImageAsset;
    }, function (_assetsTexture2dJs) {
      Texture2D = _assetsTexture2dJs.Texture2D;
    }, function (_serializationDeserializeJs) {
      packCustomObjData = _serializationDeserializeJs.packCustomObjData;
      unpackJSONs = _serializationDeserializeJs.unpackJSONs;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      error = _coreIndexJs.error;
      errorID = _coreIndexJs.errorID;
      js = _coreIndexJs.js;
    }, function (_cacheJs) {
      Cache = _cacheJs.default;
    }, function (_downloaderJs) {
      downloader = _downloaderJs.default;
    }, function (_helperJs) {
      transform = _helperJs.transform;
    }, function (_sharedJs) {
      files = _sharedJs.files;
    }, function (_serializationCconJs) {
      decodeCCONBinary = _serializationCconJs.decodeCCONBinary;
    }, function (_binPackageUnpackJs) {
      binPackageUnpack = _binPackageUnpackJs.binPackageUnpack;
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
       * Handle the packed asset, include unpacking, loading, cache and so on. It is a singleton. All member can be accessed with `assetManager.packManager`
       *
       * @zh
       * 处理打包资源，包括拆包，加载，缓存等等，这是一个单例, 所有成员能通过 `assetManager.packManager` 访问
       *
       */
      _export("PackManager", PackManager = class PackManager {
        constructor() {
          this._loading = new Cache();
          this._unpackers = {
            '.json': this.unpackJson,
            '.bin': this.unpackBin
          };
        }
        /**
         * @en
         * Unpack the json, revert to what it was before packing
         *
         * @zh
         * 拆解 json 包，恢复为打包之前的内容
         *
         * @param pack - The pack
         * @param json - The content of pack
         * @param options - Some optional parameters
         * @param onComplete - Callback when finish unpacking
         * @param onComplete.err - The occurred error, null indicates success
         * @param onComplete.content - The unpacked assets
         *
         * @example
         * downloader.downloadFile('pack.json', { xhrResponseType: 'json'}, null, (err, file) => {
         *      packManager.unpackJson(['a', 'b'], file, null, (err, data) => console.log(err));
         * });
         *
         */
        unpackJson(pack, json, options, onComplete) {
          const out = js.createMap(true);
          let err = null;
          if (Array.isArray(json)) {
            json = unpackJSONs(json);
            if (json.length !== pack.length) {
              errorID(4915);
            }
            for (let i = 0; i < pack.length; i++) {
              out[`${pack[i]}@import`] = json[i];
            }
          } else {
            const textureType = js.getClassId(Texture2D);
            const imageAssetType = js.getClassId(ImageAsset);
            if (json.type === textureType && json.data) {
              const datas = json.data;
              if (datas.length !== pack.length) {
                errorID(4915);
              }
              for (let i = 0; i < pack.length; i++) {
                out[`${pack[i]}@import`] = packCustomObjData(textureType, {
                  base: datas[i][0],
                  mipmaps: datas[i][1]
                });
              }
            } else if (json.type === imageAssetType && json.data) {
              const datas = json.data;
              if (datas.length !== pack.length) {
                errorID(4915);
              }
              for (let i = 0; i < pack.length; i++) {
                out[`${pack[i]}@import`] = datas[i];
              }
            } else {
              err = new Error('unmatched type pack!');
              onComplete(err, null);
              return;
            }
          }
          onComplete(err, out);
        }
        unpackBin(pack, buffer, options, onComplete) {
          const out = js.createMap(true);
          let err = null;
          try {
            const uint8Arrays = binPackageUnpack(buffer);
            // TODO Maybe it can be optimized through read file stream on the native side.
            pack.forEach((uuid, index) => out[`${uuid}@import`] = decodeCCONBinary(uint8Arrays[index]));
          } catch (e) {
            err = e;
          }
          onComplete(err, out);
        }
        init() {
          this._loading.clear();
        }

        /**
         * @en
         * Register custom handler if you want to change default behavior or extend packManager to unpack other format pack
         *
         * @zh
         * 当你想修改默认行为或者拓展 packManager 来拆分其他格式的包时可以注册自定义的 handler
         *
         * @param type - Extension likes '.bin' or map likes {'.bin': binHandler, '.ab': abHandler}
         * @param handler - handler
         * @param handler.packUuid - The uuid of pack
         * @param handler.data - The content of pack
         * @param handler.options - Some optional parameters
         * @param handler.onComplete - Callback when finishing unpacking
         *
         * @example
         * packManager.register('.bin', (packUuid, file, options, onComplete) => onComplete(null, null));
         * packManager.register({
         *  '.bin': (packUuid, file, options, onComplete) => onComplete(null, null),
         *  '.ab': (packUuid, file, options, onComplete) => onComplete(null, null),
         * });
         */

        register(type, handler) {
          if (typeof type === 'object') {
            js.mixin(this._unpackers, type);
          } else {
            this._unpackers[type] = handler;
          }
        }

        /**
         * @en
         * Use corresponding handler to unpack package
         *
         * @zh
         * 用对应的 handler 来进行解包
         *
         * @method unpack
         * @param pack - The uuid of packed assets
         * @param data - The packed data
         * @param type - The type indicates that which handler should be used to download, such as '.jpg'
         * @param options - Some optional parameter
         * @param onComplete - callback when finishing unpacking
         * @param onComplete.err -  The occurred error, null indicates success
         * @param onComplete.data - Original assets
         *
         * @example
         * downloader.downloadFile('pack.json', {xhrResponseType: 'json'}, null, (err, file) => {
         *      packManager.unpack(['2fawq123d', '1zsweq23f'], file, '.json', null, (err, data) => console.log(err));
         * });
         *
         */
        unpack(pack, data, type, options, onComplete) {
          if (!data) {
            onComplete(new Error('package data is wrong!'));
            return;
          }
          const unpacker = this._unpackers[type];
          unpacker(pack, data, options, onComplete);
        }

        /**
         * @en
         * Download request item, If item is not in any package, download as usual. Otherwise, download the corresponding package and unpack it.
         * And then retrieve the corresponding content form it.
         *
         * @zh
         * 下载请求对象，如果请求对象不在任何包内，则正常下载，否则下载对应的 package 并进行拆解，并取回包内对应的内容
         *
         * @param item - Some item you want to download
         * @param options - Some optional parameters
         * @param onComplete - Callback when finished
         * @param onComplete.err - The occurred error, null indicates success
         * @param onComplete.data - The unpacked data retrieved from package
         *
         * @example
         * var requestItem = AssetManager.RequestItem.create();
         * requestItem.uuid = 'fcmR3XADNLgJ1ByKhqcC5Z';
         * requestItem.info = config.getAssetInfo('fcmR3XADNLgJ1ByKhqcC5Z');
         * packManager.load(requestItem, null, (err, data) => console.log(err));
         *
         */
        load(item, options, onComplete) {
          // if not in any package, download as uausl
          if (item.isNative || !item.info || !item.info.packs) {
            downloader.download(item.id, item.url, item.ext, item.options, onComplete);
            return;
          }
          if (files.has(item.id)) {
            onComplete(null, files.get(item.id));
            return;
          }
          const packs = item.info.packs;

          // find a loading package
          const loadingPack = packs.find(val => this._loading.has(val.uuid));
          if (loadingPack) {
            const req = this._loading.get(loadingPack.uuid);
            assertIsTrue(req);
            req.push({
              onComplete,
              id: item.id
            });
            return;
          }

          // download a new package
          const pack = packs[0];
          this._loading.add(pack.uuid, [{
            onComplete,
            id: item.id
          }]);

          // find the url of pack
          assertIsTrue(item.config);
          const url = transform(pack.uuid, {
            ext: pack.ext,
            bundle: item.config.name
          });
          const done = (err, data) => {
            files.remove(pack.uuid);
            if (err) {
              error(err.message, err.stack);
            }
            // unpack package
            this.unpack(pack.packedUuids, data, pack.ext, item.options, (err2, result) => {
              if (!err2) {
                for (const id in result) {
                  files.add(id, result[id]);
                }
              }
              const callbacks = this._loading.remove(pack.uuid);
              assertIsTrue(callbacks);
              for (let i = 0, l = callbacks.length; i < l; i++) {
                const cb = callbacks[i];
                if (err || err2) {
                  cb.onComplete(err || err2);
                  continue;
                }
                const unpackedData = result[cb.id];
                if (!unpackedData) {
                  cb.onComplete(new Error('can not retrieve data from package'));
                } else {
                  cb.onComplete(null, unpackedData);
                }
              }
            });
          };
          if (pack.ext === '.bin') {
            // FIXME _downloadArrayBuffer is not a public API
            downloader._downloadArrayBuffer(url, item.options, done);
          } else if (pack.ext === '.json') {
            downloader.download(pack.uuid, url, pack.ext, item.options, done);
          } else {
            errorID(4916, pack.ext);
          }
        }
      });
      _export("default", new PackManager());
    }
  };
});