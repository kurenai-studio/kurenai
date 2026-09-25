System.register("q-bundled:///fs/cocos/asset/asset-manager/fetch.js", ["../../core/index.js", "./pack-manager.js", "./shared.js", "./task.js", "./utilities.js"], function (_export, _context) {
  "use strict";

  var error, cclegacy, packManager, assets, fetchPipeline, Task, clear, forEach, getDepends;
  function fetch(task, done) {
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
    const depends = [];
    const total = progress.total;
    const exclude = options.__exclude__ = options.__exclude__ || Object.create(null);
    task.output = [];
    forEach(task.input, (item, cb) => {
      if (!item.isNative && assets.has(item.uuid)) {
        const asset = assets.get(item.uuid);
        item.content = asset.addRef();
        task.output.push(item);
        if (progress.canInvoke) {
          task.dispatch('progress', ++progress.finish, progress.total, item);
        }
        cb();
        return;
      }
      packManager.load(item, task.options, (err, data) => {
        if (err) {
          if (!task.isFinished) {
            if (!cclegacy.assetManager.force || firstTask) {
              error(err.message, err.stack);
              progress.canInvoke = false;
              done(err);
            } else {
              task.output.push(item);
              if (progress.canInvoke) {
                task.dispatch('progress', ++progress.finish, progress.total, item);
              }
            }
          }
        } else if (!task.isFinished) {
          item.file = data;
          task.output.push(item);
          if (!item.isNative) {
            exclude[item.uuid] = true;
            getDepends(item.uuid, data, exclude, depends, item.config);
            progress.total = total + depends.length;
          }
          if (progress.canInvoke) {
            task.dispatch('progress', ++progress.finish, progress.total, item);
          }
        }
        cb();
      });
    }, () => {
      if (task.isFinished) {
        clear(task, true);
        task.dispatch('error');
        return;
      }
      if (depends.length > 0) {
        // stage 2 , download depend asset
        const subTask = Task.create({
          input: depends,
          progress,
          options,
          onProgress: task.onProgress,
          onError: Task.prototype.recycle,
          onComplete: err => {
            if (!err) {
              task.output.push(...subTask.output);
              subTask.recycle();
            }
            if (firstTask) {
              decreaseRef(task);
            }
            done(err);
          }
        });
        fetchPipeline.async(subTask);
        return;
      }
      if (firstTask) {
        decreaseRef(task);
      }
      done();
    });
  }
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

  function decreaseRef(task) {
    const output = task.output;
    for (let i = 0, l = output.length; i < l; i++) {
      if (output[i].content) {
        output[i].content.decRef(false);
      }
    }
  }
  _export("default", fetch);
  return {
    setters: [function (_coreIndexJs) {
      error = _coreIndexJs.error;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_packManagerJs) {
      packManager = _packManagerJs.default;
    }, function (_sharedJs) {
      assets = _sharedJs.assets;
      fetchPipeline = _sharedJs.fetchPipeline;
    }, function (_taskJs) {
      Task = _taskJs.default;
    }, function (_utilitiesJs) {
      clear = _utilitiesJs.clear;
      forEach = _utilitiesJs.forEach;
      getDepends = _utilitiesJs.getDepends;
    }],
    execute: function () {}
  };
});