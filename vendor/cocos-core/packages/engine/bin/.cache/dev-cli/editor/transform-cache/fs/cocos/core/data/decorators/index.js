System.register("q-bundled:///fs/cocos/core/data/decorators/index.js", ["./ccclass.js", "./component.js", "./serializable.js", "./editable.js", "./type.js", "./override.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_ccclassJs) {
      _export("ccclass", _ccclassJs.ccclass);
    }, function (_componentJs) {
      var _exportObj = {};
      for (var _key in _componentJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _componentJs[_key];
      }
      _export(_exportObj);
    }, function (_serializableJs) {
      _export({
        serializable: _serializableJs.serializable,
        formerlySerializedAs: _serializableJs.formerlySerializedAs,
        editorOnly: _serializableJs.editorOnly,
        uniquelyReferenced: _serializableJs.uniquelyReferenced
      });
    }, function (_editableJs) {
      var _exportObj2 = {};
      for (var _key2 in _editableJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _editableJs[_key2];
      }
      _export(_exportObj2);
    }, function (_typeJs) {
      var _exportObj3 = {};
      for (var _key3 in _typeJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _typeJs[_key3];
      }
      _export(_exportObj3);
    }, function (_overrideJs) {
      _export("override", _overrideJs.override);
    }],
    execute: function () {}
  };
});