System.register("q-bundled:///fs/cocos/render-scene/scene/post-settings.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Enum, cclegacy, PostSettings, ToneMappingType;
  _export("PostSettings", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      _export("ToneMappingType", ToneMappingType = Enum({
        DEFAULT: 0,
        LINEAR: 1
      }));
      _export("PostSettings", PostSettings = class PostSettings {
        constructor() {
          this._toneMappingType = ToneMappingType.DEFAULT;
          this._activated = false;
        }
        set toneMappingType(val) {
          this._toneMappingType = val;
          this._updatePipeline();
        }
        get toneMappingType() {
          return this._toneMappingType;
        }
        initialize(postSettingsInfo) {
          this._toneMappingType = postSettingsInfo.toneMappingType;
        }
        activate() {
          this._updatePipeline();
          this._activated = true;
        }
        _updatePipeline() {
          const root = cclegacy.director.root;
          const pipeline = root.pipeline;
          pipeline.macros.CC_TONE_MAPPING_TYPE = this._toneMappingType;
          if (this._activated) {
            root.onGlobalPipelineStateChanged();
          }
        }
      });
    }
  };
});