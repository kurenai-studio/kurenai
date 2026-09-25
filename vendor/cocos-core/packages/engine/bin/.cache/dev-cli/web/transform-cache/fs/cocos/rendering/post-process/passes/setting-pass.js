System.register("q-bundled:///fs/cocos/rendering/post-process/passes/setting-pass.js", ["../components/post-process-setting.js", "../utils/pass-context.js", "./base-pass.js"], function (_export, _context) {
  "use strict";

  var PostProcessSetting, passContext, BasePass, SettingPass;
  function getSetting(settingClass) {
    const cls = settingClass;
    const setting = passContext.postProcess && passContext.postProcess.getSetting(cls);
    return setting;
  }
  _export({
    getSetting: getSetting,
    SettingPass: void 0
  });
  return {
    setters: [function (_componentsPostProcessSettingJs) {
      PostProcessSetting = _componentsPostProcessSettingJs.PostProcessSetting;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_basePassJs) {
      BasePass = _basePassJs.BasePass;
    }],
    execute: function () {
      _export("SettingPass", SettingPass = class SettingPass extends BasePass {
        constructor(...args) {
          super(...args);
          this.getSetting = getSetting;
        }
        get setting() {
          return this.getSetting(PostProcessSetting);
        }
        checkEnable(camera) {
          const enable = super.checkEnable(camera);
          const setting = this.setting;
          return enable && !!setting && setting.enabledInHierarchy;
        }
      });
    }
  };
});