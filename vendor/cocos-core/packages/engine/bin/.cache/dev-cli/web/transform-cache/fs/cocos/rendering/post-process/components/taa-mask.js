System.register("q-bundled:///fs/cocos/rendering/post-process/components/taa-mask.js", ["../../../asset/assets/index.js", "../../../core/index.js", "../../../core/data/class-decorator.js", "../../../core/data/decorators/index.js", "../../../game/index.js", "../../../misc/index.js", "../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var RenderTexture, warn, property, ccclass, menu, game, Camera, Component, _dec, _dec2, _dec3, _class, _class2, _descriptor, TAAMask;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_assetAssetsIndexJs) {
      RenderTexture = _assetAssetsIndexJs.RenderTexture;
    }, function (_coreIndexJs) {
      warn = _coreIndexJs.warn;
    }, function (_coreDataClassDecoratorJs) {
      property = _coreDataClassDecoratorJs.property;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      menu = _coreDataDecoratorsIndexJs.menu;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_miscIndexJs) {
      Camera = _miscIndexJs.Camera;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }],
    execute: function () {
      _export("TAAMask", TAAMask = (_dec = ccclass('TAAMask'), _dec2 = menu('PostProcess/TAAMask'), _dec3 = property(Camera), _dec(_class = _dec2(_class = (_class2 = class TAAMask extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "maskCamera", _descriptor, this);
          this._mask = void 0;
        }
        get mask() {
          if (!this.maskCamera || !this.maskCamera.enabledInHierarchy) {
            return undefined;
          }
          if (!this.enabledInHierarchy) {
            return undefined;
          }
          return this._mask;
        }
        start() {
          if (!this.maskCamera) {
            warn('Can not find a Camera for TAAMask');
            return;
          }
          const tex = new RenderTexture();
          tex.reset({
            width: game.canvas.width,
            height: game.canvas.height
          });
          this._mask = tex;
          this.maskCamera.targetTexture = tex;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "maskCamera", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class2)) || _class) || _class));
    }
  };
});