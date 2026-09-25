System.register("q-bundled:///fs/cocos/2d/components/index.js", ["./label.js", "./sprite.js", "./ui-mesh-renderer.js", "./label-outline.js", "./ui-static-batch.js", "./label-shadow.js", "./ui-opacity.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_labelJs) {
      var _exportObj = {};
      for (var _key in _labelJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _labelJs[_key];
      }
      _export(_exportObj);
    }, function (_spriteJs) {
      _export("Sprite", _spriteJs.Sprite);
    }, function (_uiMeshRendererJs) {
      _export("UIMeshRenderer", _uiMeshRendererJs.UIMeshRenderer);
    }, function (_labelOutlineJs) {
      _export("LabelOutline", _labelOutlineJs.LabelOutline);
    }, function (_uiStaticBatchJs) {
      _export("UIStaticBatch", _uiStaticBatchJs.UIStaticBatch);
    }, function (_labelShadowJs) {
      _export("LabelShadow", _labelShadowJs.LabelShadow);
    }, function (_uiOpacityJs) {
      _export("UIOpacity", _uiOpacityJs.UIOpacity);
    }, function (_deprecatedJs) {
      var _exportObj2 = {};
      for (var _key2 in _deprecatedJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _deprecatedJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});