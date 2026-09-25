System.register("q-bundled:///fs/cocos/scene-graph/index.js", ["./component-event-handler.schema.js", "./node-event-processor.js", "./deprecated.js", "./deprecated-3.7.0.js", "./node.js", "./scene.js", "./layers.js", "./find.js", "./node-enum.js", "./node-event.js", "./scene-globals.js", "./component-event-handler.js", "./component.js", "./node-activator.js", "./prefab/index.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_componentEventHandlerSchemaJs) {}, function (_nodeEventProcessorJs) {}, function (_deprecatedJs) {
      var _exportObj = {};
      for (var _key in _deprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _deprecatedJs[_key];
      }
      _export(_exportObj);
    }, function (_deprecated370Js) {}, function (_nodeJs) {
      _export({
        Node: _nodeJs.Node,
        BaseNode: _nodeJs.Node
      });
    }, function (_sceneJs) {
      _export("Scene", _sceneJs.Scene);
    }, function (_layersJs) {
      _export("Layers", _layersJs.Layers);
    }, function (_findJs) {
      _export("find", _findJs.find);
    }, function (_nodeEnumJs) {
      var _exportObj2 = {};
      for (var _key2 in _nodeEnumJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _nodeEnumJs[_key2];
      }
      _export(_exportObj2);
    }, function (_nodeEventJs) {
      var _exportObj3 = {};
      for (var _key3 in _nodeEventJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _nodeEventJs[_key3];
      }
      _export(_exportObj3);
    }, function (_sceneGlobalsJs) {
      var _exportObj4 = {};
      for (var _key4 in _sceneGlobalsJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _sceneGlobalsJs[_key4];
      }
      _export(_exportObj4);
    }, function (_componentEventHandlerJs) {
      _export("EventHandler", _componentEventHandlerJs.EventHandler);
    }, function (_componentJs) {
      _export("Component", _componentJs.Component);
    }, function (_nodeActivatorJs) {
      _export("NodeActivator", _nodeActivatorJs.default);
    }, function (_prefabIndexJs) {
      _export("Prefab", _prefabIndexJs.Prefab);
    }],
    execute: function () {}
  };
});