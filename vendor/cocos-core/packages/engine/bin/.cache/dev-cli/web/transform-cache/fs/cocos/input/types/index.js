System.register("q-bundled:///fs/cocos/input/types/index.js", ["./event/index.js", "./acceleration.js", "./event-enum.js", "./key-code.js", "./touch.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_eventIndexJs) {
      var _exportObj = {};
      for (var _key in _eventIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _eventIndexJs[_key];
      }
      _export(_exportObj);
    }, function (_accelerationJs) {
      var _exportObj2 = {};
      for (var _key2 in _accelerationJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _accelerationJs[_key2];
      }
      _export(_exportObj2);
    }, function (_eventEnumJs) {
      _export("SystemEventType", _eventEnumJs.SystemEventType);
    }, function (_keyCodeJs) {
      var _exportObj3 = {};
      for (var _key3 in _keyCodeJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _keyCodeJs[_key3];
      }
      _export(_exportObj3);
    }, function (_touchJs) {
      var _exportObj4 = {};
      for (var _key4 in _touchJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _touchJs[_key4];
      }
      _export(_exportObj4);
    }],
    execute: function () {}
  };
});