System.register("q-bundled:///fs/cocos/rendering/post-process/components/blit-screen.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../asset/assets/index.js", "../../../core/data/class-decorator.js", "../../../core/data/decorators/index.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var EDITOR, Material, property, serializable, ccclass, disallowMultiple, executeInEditMode, help, menu, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class3, _class4, _descriptor3, _descriptor4, BlitScreenMaterial, BlitScreen;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_coreDataClassDecoratorJs) {
      property = _coreDataClassDecoratorJs.property;
      serializable = _coreDataClassDecoratorJs.serializable;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      BlitScreenMaterial = (_dec = ccclass('cc.BlitScreenMaterial'), _dec2 = property(Material), _dec3 = property(Material), _dec4 = property({
        serializable: true
      }), _dec(_class = (_class2 = class BlitScreenMaterial {
        constructor() {
          _initializerDefineProperty(this, "_material", _descriptor, this);
          _initializerDefineProperty(this, "enable", _descriptor2, this);
        }
        get material() {
          return this._material;
        }
        set material(v) {
          this._material = v;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_material", [_dec2, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _applyDecoratedDescriptor(_class2.prototype, "material", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "material"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class);
      _export("BlitScreen", BlitScreen = (_dec5 = ccclass('cc.BlitScreen'), _dec6 = help('cc.BlitScreen'), _dec7 = menu('PostProcess/BlitScreen'), _dec8 = property(Material), _dec9 = property({
        type: Material,
        visible: false
      }), _dec0 = property(BlitScreenMaterial), _dec1 = property(BlitScreenMaterial), _dec5(_class3 = _dec6(_class3 = _dec7(_class3 = disallowMultiple(_class3 = executeInEditMode(_class3 = (_class4 = class BlitScreen extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_activeMaterials", _descriptor3, this);
          _initializerDefineProperty(this, "_materials", _descriptor4, this);
        }
        get activeMaterials() {
          return this._activeMaterials;
        }
        set activeMaterials(v) {
          this._activeMaterials = v;
          for (let i = 0; i < this._materials.length; i++) {
            for (let j = 0; j < v.length; j++) {
              if (this._materials[i] && v[j]) {
                var _this$_materials$i$ma;
                if (((_this$_materials$i$ma = this._materials[i].material) == null ? void 0 : _this$_materials$i$ma.uuid) === v[j].uuid) {
                  this._materials[i].material = v[j];
                }
              }
            }
          }
        }
        get materials() {
          return this._materials;
        }
        set materials(v) {
          this._materials = v;
          if (EDITOR) {
            setTimeout(() => {
              globalThis.cce.Engine.repaintInEditMode();
            }, 50);
          }
          this.updateActiveMaterials();
        }
        updateActiveMaterials() {
          const materials = this._materials;
          this._activeMaterials.length = 0;
          for (let i = 0; i < materials.length; i++) {
            const m = materials[i];
            if (m.enable && m.material) {
              this._activeMaterials.push(m.material);
            }
          }
        }
        onLoad() {
          this.updateActiveMaterials();
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_activeMaterials", [_dec8, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "activeMaterials", [_dec9], Object.getOwnPropertyDescriptor(_class4.prototype, "activeMaterials"), _class4.prototype), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_materials", [_dec0, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "materials", [_dec1], Object.getOwnPropertyDescriptor(_class4.prototype, "materials"), _class4.prototype), _class4)) || _class3) || _class3) || _class3) || _class3) || _class3));
    }
  };
});