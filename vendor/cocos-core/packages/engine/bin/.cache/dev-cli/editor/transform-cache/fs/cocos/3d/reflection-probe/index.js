System.register("q-bundled:///fs/cocos/3d/reflection-probe/index.js", ["./reflection-probe-component.js", "./reflection-probe-manager.js", "./reflection-probe-enum.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_reflectionProbeComponentJs) {
      _export("ReflectionProbe", _reflectionProbeComponentJs.ReflectionProbe);
    }, function (_reflectionProbeManagerJs) {
      _export("ReflectionProbeManager", _reflectionProbeManagerJs.ReflectionProbeManager);
    }, function (_reflectionProbeEnumJs) {
      _export("ReflectionProbeType", _reflectionProbeEnumJs.ReflectionProbeType);
    }],
    execute: function () {}
  };
});