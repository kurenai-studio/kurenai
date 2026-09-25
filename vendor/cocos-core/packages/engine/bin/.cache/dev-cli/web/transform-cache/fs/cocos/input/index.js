System.register("q-bundled:///fs/cocos/input/index.js", ["./deprecated.js", "./input.js", "./system-event.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deprecatedJs) {}, function (_inputJs) {
      _export({
        input: _inputJs.input,
        Input: _inputJs.Input
      });
    }, function (_systemEventJs) {
      _export({
        systemEvent: _systemEventJs.systemEvent,
        SystemEvent: _systemEventJs.SystemEvent
      });
    }],
    execute: function () {}
  };
});