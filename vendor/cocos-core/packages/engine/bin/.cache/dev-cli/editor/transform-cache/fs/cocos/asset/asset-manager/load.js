System.register("q-bundled:///fs/cocos/asset/asset-manager/load.js", ["../../../../virtual/internal%253Aconstants.js", "../assets/asset.js", "../../core/index.js", "./pack-manager.js", "./parser.js", "./pipeline.js", "./shared.js", "./task.js", "./utilities.js", "./depend-maps.js"], function (_export, _context) {
  "use strict";

  var BUILD, EDITOR, PREVIEW, Asset, error, cclegacy, errorID, packManager, parser, Pipeline, assets, files, parsed, pipeline, Task, cache, checkCircleReference, clear, forEach, gatherAsset, getDepends, setProperties, nativeDependMap, onLoadedInvokedMap, loadOneAssetPipeline;
  function load(task, done) {
    let firstTask = false;
    if (!task.progress) {
      task.progress = {
        finish: 0,
        total: task.input.length,
        canInvoke: true
      };
      firstTask = true;
    }
    const {
      options,
      progress
    } = task;
    options.__exclude__ = options.__exclude__ || Object.create(null);
    task.output = [];
    forEach(task.input, (item, cb) => {
      const subTask = Task.create({
        input: item,
        onProgress: task.onProgress,
        options,
        progress,
        onComplete: (err, result) => {
          if (err && !task.isFinished) {
            if (!cclegacy.assetManager.force || firstTask) {
              if (BUILD) {
                error(err.message, err.stack);
              }
              progress.canInvoke = false;
              done(err);
            } else if (progress.canInvoke) {
              task.dispatch('progress', ++progress.finish, progress.total, item);
            }
          }
          task.output.push(result);
          subTask.recycle();
          cb(null);
        }
      });
      loadOneAssetPipeline.async(subTask);
    }, () => {
      options.__exclude__ = null;
      if (task.isFinished) {
        clear(task, true);
        task.dispatch('error');
        return;
      }
      gatherAsset(task);
      clear(task, true);
      done();
    });
  }
  function loadDepends(task, asset, done) {
    const {
      input: item,
      progress
    } = task;
    const {
      uuid,
      id,
      options,
      config
    } = item;
    const {
      cacheAsset
    } = options;
    const depends = [];
    // add reference avoid being released during loading dependencies
    if (asset.addRef) {
      asset.addRef();
    }
    getDepends(uuid, asset, Object.create(null), depends, config);
    if (progress.canInvoke) {
      task.dispatch('progress', ++progress.finish, progress.total += depends.length, item);
    }
    const repeatItem = task.options.__exclude__[uuid] = {
      content: asset,
      finish: false,
      callbacks: [{
        done,
        item
      }]
    };
    const subTask = Task.create({
      input: depends,
      options: task.options,
      onProgress: task.onProgress,
      onError: Task.prototype.recycle,
      progress,
      onComplete: err => {
        if (asset.decRef) {
          asset.decRef(false);
        }
        repeatItem.finish = true;
        repeatItem.err = err;
        if (!err) {
          const output = Array.isArray(subTask.output) ? subTask.output : [subTask.output];
          const map = Object.create(null);
          for (const dependAsset of output) {
            if (!dependAsset) {
              continue;
            }
            map[dependAsset instanceof Asset ? `${dependAsset._uuid}@import` : `${uuid}@native`] = dependAsset;
          }
          setProperties(uuid, asset, map);
          try {
            if (typeof asset.onLoaded === 'function' && !onLoadedInvokedMap.has(asset) && !nativeDependMap.has(asset)) {
              asset.onLoaded();
              onLoadedInvokedMap.add(asset);
            }
          } catch (e) {
            errorID(16352, uuid, e.message, e.stack);
            if (EDITOR || PREVIEW) {
              if (asset instanceof Asset) {
                asset.initDefault();
              } else {
                // TODO: remove it.
                // scene asset might be a json in editor or preview
                cclegacy.SceneAsset.prototype.initDefault.call(asset);
              }
            }
          }
          files.remove(id);
          parsed.remove(id);
          if (!BUILD && asset.validate && !asset.validate()) {
            error(`The asset ${uuid} is invalid for some reason and will be reverted to default asset, please check it out!`);
            asset.initDefault();
          }
          cache(uuid, asset, cacheAsset);
          subTask.recycle();
        }
        const callbacks = repeatItem.callbacks;
        for (let i = 0, l = callbacks.length; i < l; i++) {
          const cb = callbacks[i];
          if (asset.addRef) {
            asset.addRef();
          }
          cb.item.content = asset;
          cb.done(err);
        }
        callbacks.length = 0;
      }
    });
    pipeline.async(subTask);
  }
  _export("default", load);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
    }, function (_assetsAssetJs) {
      Asset = _assetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
      cclegacy = _coreIndexJs.cclegacy;
      errorID = _coreIndexJs.errorID;
    }, function (_packManagerJs) {
      packManager = _packManagerJs.default;
    }, function (_parserJs) {
      parser = _parserJs.default;
    }, function (_pipelineJs) {
      Pipeline = _pipelineJs.Pipeline;
    }, function (_sharedJs) {
      assets = _sharedJs.assets;
      files = _sharedJs.files;
      parsed = _sharedJs.parsed;
      pipeline = _sharedJs.pipeline;
    }, function (_taskJs) {
      Task = _taskJs.default;
    }, function (_utilitiesJs) {
      cache = _utilitiesJs.cache;
      checkCircleReference = _utilitiesJs.checkCircleReference;
      clear = _utilitiesJs.clear;
      forEach = _utilitiesJs.forEach;
      gatherAsset = _utilitiesJs.gatherAsset;
      getDepends = _utilitiesJs.getDepends;
      setProperties = _utilitiesJs.setProperties;
    }, function (_dependMapsJs) {
      nativeDependMap = _dependMapsJs.nativeDependMap;
      onLoadedInvokedMap = _dependMapsJs.onLoadedInvokedMap;
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
      loadOneAssetPipeline = new Pipeline('loadOneAsset', [function fetch(task, done) {
        const item = task.output = task.input;
        const {
          options,
          isNative,
          uuid,
          file
        } = item;
        const {
          reloadAsset
        } = options;
        if (file || !reloadAsset && !isNative && assets.has(uuid)) {
          done();
          return;
        }
        packManager.load(item, task.options, (err, data) => {
          item.file = data;
          done(err);
        });
      }, function parse(task, done) {
        const item = task.output = task.input;
        const progress = task.progress;
        const exclude = task.options.__exclude__;
        const {
          id,
          file,
          options
        } = item;
        if (item.isNative) {
          parser.parse(id, file, item.ext, options, (err, asset) => {
            if (err) {
              done(err);
              return;
            }
            item.content = asset;
            if (progress.canInvoke) {
              task.dispatch('progress', ++progress.finish, progress.total, item);
            }
            files.remove(id);
            parsed.remove(id);
            done();
          });
        } else {
          const {
            uuid
          } = item;
          if (uuid in exclude) {
            const {
              finish,
              content,
              err,
              callbacks
            } = exclude[uuid];
            if (progress.canInvoke) {
              task.dispatch('progress', ++progress.finish, progress.total, item);
            }
            if (finish || checkCircleReference(uuid, uuid, exclude)) {
              if (content) {
                content.addRef();
              }
              item.content = content;
              done(err);
            } else {
              callbacks.push({
                done,
                item
              });
            }
          } else if (!options.reloadAsset && assets.has(uuid)) {
            const asset = assets.get(uuid);
            item.content = asset.addRef();
            if (progress.canInvoke) {
              task.dispatch('progress', ++progress.finish, progress.total, item);
            }
            done();
          } else {
            options.__uuid__ = uuid;
            parser.parse(id, file, 'import', options, (err, asset) => {
              if (err) {
                done(err);
                return;
              }
              loadDepends(task, asset, done);
            });
          }
        }
      }]);
    }
  };
});