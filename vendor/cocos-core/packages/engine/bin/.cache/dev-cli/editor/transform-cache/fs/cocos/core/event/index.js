System.register("q-bundled:///fs/cocos/core/event/index.js", ["./event-target.js", "./eventify.js", "./async-delegate.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_eventTargetJs) {
      _export("EventTarget", _eventTargetJs.EventTarget);
    }, function (_eventifyJs) {
      _export("Eventify", _eventifyJs.Eventify);
    }, function (_asyncDelegateJs) {
      _export("AsyncDelegate", _asyncDelegateJs.AsyncDelegate);
    }],
    execute: function () {}
  };
});