System.register("q-bundled:///fs/cocos/asset/asset-manager/preprocess.js", ["./shared.js", "./task.js"], function (_export, _context) {
  "use strict";

  var RequestType, transformPipeline, Task;
  function preprocess(task, done) {
    const options = task.options;
    const subOptions = Object.create(null);
    const leftOptions = Object.create(null);
    for (const op in options) {
      switch (op) {
        // can't set these attributes in options
        case RequestType.PATH:
        case RequestType.UUID:
        case RequestType.DIR:
        case RequestType.SCENE:
        case RequestType.URL:
          break;
        // only need these attributes to transform url
        case '__requestType__':
        case '__isNative__':
        case 'ext':
        case 'type':
        case '__nativeName__':
        case 'audioLoadMode':
        case 'bundle':
          subOptions[op] = options[op];
          break;
        // other settings, left to next pipe
        case '__exclude__':
        case '__outputAsArray__':
          leftOptions[op] = options[op];
          break;
        default:
          subOptions[op] = options[op];
          leftOptions[op] = options[op];
          break;
      }
    }
    task.options = leftOptions;

    // transform url
    const subTask = Task.create({
      input: task.input,
      options: subOptions
    });
    let err = null;
    try {
      task.output = task.source = transformPipeline.sync(subTask);
    } catch (e) {
      err = e;
      for (let i = 0, l = subTask.output.length; i < l; i++) {
        subTask.output[i].recycle();
      }
    }
    subTask.recycle();
    done(err);
  }
  _export("default", preprocess);
  return {
    setters: [function (_sharedJs) {
      RequestType = _sharedJs.RequestType;
      transformPipeline = _sharedJs.transformPipeline;
    }, function (_taskJs) {
      Task = _taskJs.default;
    }],
    execute: function () {}
  };
});