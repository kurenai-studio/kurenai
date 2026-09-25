System.register("q-bundled:///fs/cocos/particle/line.js", ["../core/data/decorators/index.js", "../asset/assets/index.js", "../core/index.js", "./models/line-model.js", "../asset/asset-manager/index.js", "./animator/curve-range.js", "./animator/gradient-range.js", "../misc/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, tooltip, displayOrder, type, serializable, range, visible, override, displayName, Material, Texture2D, Vec3, cclegacy, Vec4, Vec2, LineModel, builtinResMgr, CurveRange, GradientRange, ModelRenderer, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, CC_USE_WORLD_SPACE, CC_USE_WORLD_SCALE, define, Line;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      range = _coreDataDecoratorsIndexJs.range;
      visible = _coreDataDecoratorsIndexJs.visible;
      override = _coreDataDecoratorsIndexJs.override;
      displayName = _coreDataDecoratorsIndexJs.displayName;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      Vec4 = _coreIndexJs.Vec4;
      Vec2 = _coreIndexJs.Vec2;
    }, function (_modelsLineModelJs) {
      LineModel = _modelsLineModelJs.LineModel;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
    }, function (_animatorGradientRangeJs) {
      GradientRange = _animatorGradientRangeJs.default;
    }, function (_miscIndexJs) {
      ModelRenderer = _miscIndexJs.ModelRenderer;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      CC_USE_WORLD_SPACE = 'CC_USE_WORLD_SPACE';
      CC_USE_WORLD_SCALE = 'CC_USE_WORLD_SCALE';
      define = {
        CC_USE_WORLD_SPACE: false,
        CC_USE_WORLD_SCALE: true
      };
      _export("Line", Line = (_dec = ccclass('cc.Line'), _dec2 = help('i18n:cc.Line'), _dec3 = menu('Effects/Line'), _dec4 = type(Texture2D), _dec5 = type(Texture2D), _dec6 = displayOrder(0), _dec7 = tooltip('i18n:line.texture'), _dec8 = type(Material), _dec9 = displayOrder(1), _dec0 = tooltip('i18n:line.material'), _dec1 = displayName('Material'), _dec10 = visible(false), _dec11 = displayOrder(1), _dec12 = tooltip('i18n:line.worldSpace'), _dec13 = type([Vec3]), _dec14 = type([Vec3]), _dec15 = displayOrder(2), _dec16 = tooltip('i18n:line.positions'), _dec17 = type(CurveRange), _dec18 = range([0, 1]), _dec19 = displayOrder(3), _dec20 = tooltip('i18n:line.width'), _dec21 = type(GradientRange), _dec22 = displayOrder(6), _dec23 = tooltip('i18n:line.color'), _dec24 = type(Vec2), _dec25 = displayOrder(4), _dec26 = tooltip('i18n:line.tile'), _dec27 = type(Vec2), _dec28 = displayOrder(5), _dec29 = tooltip('i18n:line.offset'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class Line extends ModelRenderer {
        /**
         * @zh 显示的纹理。
         * @en Texture used.
         */
        get texture() {
          return this._texture;
        }
        set texture(val) {
          this._texture = val;
          if (this.material) {
            this.material.setProperty('mainTexture', val);
          }
        }
        get lineMaterial() {
          return this.getSharedMaterial(0);
        }
        set lineMaterial(val) {
          this.setSharedMaterial(val, 0);
        }
        get sharedMaterials() {
          return super.sharedMaterials;
        }
        set sharedMaterials(val) {
          super.sharedMaterials = val;
        }
        /**
         * @zh positions是否为世界空间坐标。
         * @en Whether positions are world space coordinates.
         */
        get worldSpace() {
          return this._worldSpace;
        }
        set worldSpace(val) {
          this._worldSpace = val;
          const matIns = this.getMaterialInstance(0);
          if (matIns) {
            define[CC_USE_WORLD_SPACE] = this.worldSpace;
            matIns.recompileShaders(define);
            if (this._models[0]) {
              this._models[0].setSubModelMaterial(0, matIns);
            }
          }
        }
        /**
         * @en Inflection point positions of each polyline.
         * @zh 每段折线的拐点坐标。
         */
        get positions() {
          return this._positions;
        }
        set positions(val) {
          this._positions = val;
          if (this._models[0]) {
            const lineModel = this._models[0];
            lineModel.addLineVertexData(this._positions, this.width, this.color);
          }
        }

        /**
         * @zh 线段的宽度。
         * @en Width of this line.
         */
        get width() {
          return this._width;
        }
        set width(val) {
          this._width = val;
          if (this._models[0]) {
            const lineModel = this._models[0];
            lineModel.addLineVertexData(this._positions, this._width, this._color);
          }
        }
        /**
         * @zh 线段颜色。
         * @en Color of this line.
         */
        get color() {
          return this._color;
        }
        set color(val) {
          this._color = val;
          if (this._models[0]) {
            const lineModel = this._models[0];
            lineModel.addLineVertexData(this._positions, this._width, this._color);
          }
        }
        /**
         * @zh 图块数。
         * @en Texture tile count.
         */
        get tile() {
          return this._tile;
        }
        set tile(val) {
          this._tile.set(val);
          if (this.material) {
            this._tile_offset.x = this._tile.x;
            this._tile_offset.y = this._tile.y;
            this.material.setProperty('mainTiling_Offset', this._tile_offset);
          }
        }
        get offset() {
          return this._offset;
        }
        set offset(val) {
          this._offset.set(val);
          if (this.material) {
            this._tile_offset.z = this._offset.x;
            this._tile_offset.w = this._offset.y;
            this.material.setProperty('mainTiling_Offset', this._tile_offset);
          }
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_texture", _descriptor, this);
          _initializerDefineProperty(this, "_material", _descriptor2, this);
          _initializerDefineProperty(this, "_worldSpace", _descriptor3, this);
          _initializerDefineProperty(this, "_positions", _descriptor4, this);
          _initializerDefineProperty(this, "_width", _descriptor5, this);
          _initializerDefineProperty(this, "_color", _descriptor6, this);
          _initializerDefineProperty(this, "_tile", _descriptor7, this);
          this._tile_offset = new Vec4();
          _initializerDefineProperty(this, "_offset", _descriptor8, this);
        }
        onLoad() {
          const model = cclegacy.director.root.createModel(LineModel);
          if (this._models.length === 0) {
            this._models.push(model);
          } else {
            this._models[0] = model;
          }
          model.node = model.transform = this.node;
          if (this._material) {
            this.lineMaterial = this._material;
            this._material = null;
          }
          if (this.lineMaterial === null) {
            const mat = builtinResMgr.get('default-trail-material');
            this.material = mat;
          }
          const matIns = this.getMaterialInstance(0);
          if (matIns) {
            define[CC_USE_WORLD_SPACE] = this.worldSpace;
            matIns.recompileShaders(define);
            model.updateMaterial(matIns);
          }
          model.setCapacity(100);
        }
        onEnable() {
          super.onEnable();
          if (this._models.length === 0 || !this._models[0]) {
            return;
          }
          this._attachToScene();
          this.texture = this._texture;
          this.tile = this._tile;
          this.offset = this._offset;
          const lineModel = this._models[0];
          lineModel.addLineVertexData(this._positions, this.width, this.color);
        }
        onDisable() {
          if (this._models.length > 0 && this._models[0]) {
            this._detachFromScene();
          }
        }
        _attachToScene() {
          super._attachToScene();
          if (this._models.length > 0 && this._models[0] && this.node && this.node.scene) {
            const lineModel = this._models[0];
            if (lineModel.scene) {
              this._detachFromScene();
            }
            this._getRenderScene().addModel(lineModel);
          }
        }

        /**
         * @engineInternal
         */
        _detachFromScene() {
          super._detachFromScene();
          if (this._models.length > 0 && this._models[0]) {
            const lineModel = this._models[0];
            if (lineModel.scene) {
              lineModel.scene.removeModel(lineModel);
            }
          }
        }
        updateColor() {
          if (this._color) {
            if (this._models[0]) {
              const lineModel = this._models[0];
              lineModel.addLineVertexData(this._positions, this._width, this._color);
            }
          }
        }
        _onMaterialModified(index, material) {
          super._onMaterialModified(index, material);
          const matIns = this.getMaterialInstance(0);
          if (matIns) {
            define[CC_USE_WORLD_SPACE] = this.worldSpace;
            matIns.recompileShaders(define);
            if (this._models[0]) {
              const lineModel = this._models[0];
              lineModel.updateMaterial(matIns);
            }
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_texture", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "texture", [_dec5, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "texture"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_material", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "lineMaterial", [_dec8, _dec9, _dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "lineMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sharedMaterials", [override, _dec10, serializable], Object.getOwnPropertyDescriptor(_class2.prototype, "sharedMaterials"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_worldSpace", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "worldSpace", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "worldSpace"), _class2.prototype), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_positions", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "positions", [_dec14, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "positions"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "width", [_dec17, _dec18, _dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "width"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_width", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "color", [_dec21, _dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_color", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new GradientRange();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_tile", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(1, 1);
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "tile", [_dec24, _dec25, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "tile"), _class2.prototype), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_offset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(0, 0);
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "offset", [_dec27, _dec28, _dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "offset"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});