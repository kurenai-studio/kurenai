System.register("q-bundled:///fs/cocos/rendering/post-process/components/post-process-setting.js", ["../../../core/data/decorators/index.js", "../../../scene-graph/index.js", "./post-process.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, requireComponent, Component, PostProcess, _dec, _dec2, _class, PostProcessSetting;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_postProcessJs) {
      PostProcess = _postProcessJs.PostProcess;
    }],
    execute: function () {
      _export("PostProcessSetting", PostProcessSetting = (_dec = ccclass('cc.PostProcessSetting'), _dec2 = requireComponent(PostProcess), _dec(_class = _dec2(_class = executeInEditMode(_class = class PostProcessSetting extends Component {
        onEnable() {
          const pp = this.getComponent(PostProcess);
          pp == null || pp.addSetting(this);
        }
        onDisable() {
          const pp = this.getComponent(PostProcess);
          pp == null || pp.removeSetting(this);
        }
      }) || _class) || _class) || _class));
    }
  };
});