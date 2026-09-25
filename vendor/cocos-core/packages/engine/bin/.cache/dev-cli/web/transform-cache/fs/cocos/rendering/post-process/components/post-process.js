System.register("q-bundled:///fs/cocos/rendering/post-process/components/post-process.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/data/class-decorator.js", "../../../core/data/decorators/index.js", "../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, property, serializable, ccclass, disallowMultiple, executeInEditMode, help, range, slide, tooltip, Component, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _PostProcess, PostProcess;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreDataClassDecoratorJs) {
      property = _coreDataClassDecoratorJs.property;
      serializable = _coreDataClassDecoratorJs.serializable;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      range = _coreDataDecoratorsIndexJs.range;
      slide = _coreDataDecoratorsIndexJs.slide;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }],
    execute: function () {
      _export("PostProcess", PostProcess = (_dec = ccclass('cc.PostProcess'), _dec2 = help('cc.PostProcess'), _dec3 = tooltip('i18n:postprocess.global'), _dec4 = tooltip('i18n:postprocess.shadingScale'), _dec5 = range([0.01, 4, 0.01]), _dec6 = tooltip('i18n:postprocess.enableShadingScaleInEditor'), _dec(_class = _dec2(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = (_PostProcess = class PostProcess extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "global", _descriptor, this);
          _initializerDefineProperty(this, "_shadingScale", _descriptor2, this);
          _initializerDefineProperty(this, "enableShadingScaleInEditor", _descriptor3, this);
          this.settings = new Map();
        }
        get shadingScale() {
          return this._shadingScale;
        }
        set shadingScale(v) {
          this._shadingScale = v;
          if (EDITOR) {
            setTimeout(() => {
              globalThis.cce.Engine.repaintInEditMode();
            }, 50);
          }
        }
        addSetting(setting) {
          this.settings.set(setting.constructor, setting);
        }
        removeSetting(setting) {
          this.settings.delete(setting.constructor);
        }
        getSetting(ctor) {
          return this.settings.get(ctor);
        }
        onEnable() {
          PostProcess.all.push(this);
        }
        onDisable() {
          const idx = PostProcess.all.indexOf(this);
          if (idx !== -1) {
            PostProcess.all.splice(idx, 1);
          }
        }
      }, _PostProcess.all = [], _PostProcess), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "global", [_dec3, property, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_shadingScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "shadingScale", [_dec4, slide, _dec5, property], Object.getOwnPropertyDescriptor(_class2.prototype, "shadingScale"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "enableShadingScaleInEditor", [_dec6, property, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});