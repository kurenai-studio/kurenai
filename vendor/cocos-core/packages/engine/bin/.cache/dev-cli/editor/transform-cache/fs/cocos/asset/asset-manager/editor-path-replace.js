System.register("q-bundled:///fs/cocos/asset/asset-manager/editor-path-replace.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "./shared.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NATIVE, NODEJS, PREVIEW, TEST, assert, settings, SettingsCategory, cclegacy, fetchPipeline, pipeline;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NATIVE = _virtualInternal253AconstantsJs.NATIVE;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      assert = _coreIndexJs.assert;
      settings = _coreIndexJs.settings;
      SettingsCategory = _coreIndexJs.SettingsCategory;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_sharedJs) {
      fetchPipeline = _sharedJs.fetchPipeline;
      pipeline = _sharedJs.pipeline;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      /* eslint-disable no-console */
      /* eslint-disable no-trailing-spaces */
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      /* eslint-disable @typescript-eslint/ban-types */
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

      if ((EDITOR || PREVIEW || NODEJS) && !TEST) {
        const cache = {};
        const resolveMap = {};
        const replaceExtension = (task, done) => {
          task.output = task.input;
          (async () => {
            for (let i = 0; i < task.input.length; i++) {
              const item = task.input[i];
              if (!item.uuid || item.isNative) {
                continue;
              }
              try {
                // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-unsafe-argument
                const extension = await queryExtension(item.overrideUuid || item.uuid);
                if (extension) {
                  item.ext = extension;
                  item.url = item.url.replace('.json', extension);
                }
              } catch (err) {
                continue;
              }
            }
          })().then(() => {
            done(null, null);
          }).catch(reason => {
            done(reason, null);
          });
        };
        const fetchText = url => new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onload = () => {
            if (xhr.status !== 200) {
              reject();
              return;
            }
            resolve(xhr.response);
          };
          xhr.onabort = xhr.ontimeout = xhr.onerror = () => {
            reject();
          };
          xhr.send(null);
        });
        const queryExtension = async uuid => {
          if (uuid in cache) {
            if (cache[uuid] !== null) {
              return cache[uuid];
            }
            return new Promise(resolve => {
              resolveMap[uuid] = resolveMap[uuid] || [];
              resolveMap[uuid].push(resolve);
            });
          }
          cache[uuid] = null;
          try {
            let text = '';
            if (EDITOR) {
              const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
              // Current rule: If an asset has only one .bin file, then it is in CCON format.
              if (info && info.library['.bin'] && Object.keys(info.library).length === 1) {
                text = '.cconb';
              }
            } else if (NODEJS) {
              const importBase = cclegacy.assetManager.generalImportBase;
              let useAssetDB = true;
              if (importBase && (importBase.startsWith('http://') || importBase.startsWith('https://'))) {
                // cli：场景使用的是网络路径
                const requestUrl = `${importBase}/query-extname/${uuid}`;
                try {
                  text = await fetchText(requestUrl);
                  useAssetDB = false;
                } catch (e) {
                  console.warn(`Failed to get file type from URL: ${requestUrl}. Error: ${e}`);
                  text = '';
                }
              }
              // 如果网络路径没有配置，或者不是网络路径，或者请求异常，使用AssetDB
              if (useAssetDB && globalThis.AssetDB) {
                var _globalThis$AssetDB$q;
                const meta = await ((_globalThis$AssetDB$q = globalThis.AssetDB.queryAsset(uuid)) == null ? void 0 : _globalThis$AssetDB$q.meta);
                // Current rule: If an asset has only one .bin file, then it is in CCON format.
                if (meta && meta.files.length === 1 && meta.files[0] === '.bin') {
                  text = '.cconb';
                }
              }
            } else {
              let previewServer = '';
              if (NATIVE) {
                previewServer = settings.querySettings(SettingsCategory.PATH, 'previewServer') || '';
                assert(Boolean(previewServer));
              }
              text = await fetchText(`${previewServer}/query-extname/${uuid}`);
            }
            cache[uuid] = text;
            if (resolveMap[uuid]) {
              resolveMap[uuid].forEach(func => func(text));
              resolveMap[uuid] = [];
            }
            return text;
          } catch (error) {
            console.error(error);
            cache[uuid] = '';
            return '';
          }
        };
        pipeline.insert(replaceExtension, 1);
        fetchPipeline.insert(replaceExtension, 1);
      }
    }
  };
});