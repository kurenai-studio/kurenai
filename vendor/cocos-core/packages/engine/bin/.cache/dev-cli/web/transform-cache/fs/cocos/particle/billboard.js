System.register("q-bundled:///fs/cocos/particle/billboard.js", ["../core/data/decorators/index.js", "../asset/asset-manager/index.js", "../3d/misc/index.js", "../asset/assets/index.js", "../scene-graph/component.js", "../gfx/index.js", "../core/index.js", "../render-scene/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, tooltip, type, serializable, builtinResMgr, createMesh, Material, Texture2D, Component, Attribute, AttributeName, Format, PrimitiveMode, Color, toDegree, toRadian, Vec4, cclegacy, scene, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, Billboard;
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
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_dMiscIndexJs) {
      createMesh = _dMiscIndexJs.createMesh;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_gfxIndexJs) {
      Attribute = _gfxIndexJs.Attribute;
      AttributeName = _gfxIndexJs.AttributeName;
      Format = _gfxIndexJs.Format;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      toDegree = _coreIndexJs.toDegree;
      toRadian = _coreIndexJs.toRadian;
      Vec4 = _coreIndexJs.Vec4;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
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
      _export("Billboard", Billboard = (_dec = ccclass('cc.Billboard'), _dec2 = help('i18n:cc.Billboard'), _dec3 = menu('Effects/Billboard'), _dec4 = type(Texture2D), _dec5 = type(Texture2D), _dec6 = tooltip('i18n:billboard.texture'), _dec7 = tooltip('i18n:billboard.height'), _dec8 = tooltip('i18n:billboard.width'), _dec9 = tooltip('i18n:billboard.rotation'), _dec0 = tooltip('i18n:billboard.technique'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class Billboard extends Component {
        /**
         * @zh Billboard纹理。
         */
        get texture() {
          return this._texture;
        }
        set texture(val) {
          this._texture = val;
          this.updateTexture();
        }
        updateTexture() {
          if (this._material) {
            this._material.setProperty('mainTexture', this._texture);
          }
        }
        /**
         * @zh 高度。
         */
        get height() {
          return this._height;
        }
        set height(val) {
          this._height = val;
          this.updateHeight();
        }
        updateHeight() {
          if (this._material) {
            this._uniform.y = this._height;
            this._material.setProperty('cc_size_rotation', this._uniform);
          }
        }
        /**
         * @zh 宽度。
         */
        get width() {
          return this._width;
        }
        set width(val) {
          this._width = val;
          this.updateWidth();
        }
        updateWidth() {
          if (this._material) {
            this._uniform.x = this._width;
            this._material.setProperty('cc_size_rotation', this._uniform);
          }
        }
        /**
         * @zh billboard绕中心点旋转的角度
         */
        get rotation() {
          return Math.round(toDegree(this._rotation) * 100) / 100;
        }
        set rotation(val) {
          this._rotation = toRadian(val);
          this.updateRotation();
        }
        updateRotation() {
          if (this._material) {
            this._uniform.z = this._rotation;
            this._material.setProperty('cc_size_rotation', this._uniform);
          }
        }
        get technique() {
          return this._techIndex;
        }
        set technique(val) {
          var _this$_material;
          // clamp technique index
          val = Math.floor(val);
          const techs = (_this$_material = this._material) == null || (_this$_material = _this$_material.effectAsset) == null ? void 0 : _this$_material.techniques;
          if (techs && val >= techs.length) {
            val = techs.length - 1;
          }
          if (val < 0) {
            val = 0;
          }
          // set technique index
          this._techIndex = val;
          // recreate model
          this.updateTechnique();
        }
        updateTechnique() {
          if (this._model && this._mesh && this._material && this._material.technique !== this._techIndex) {
            // destroy model
            this.detachFromScene();
            this._model.destroy();
            this._model = null;
            this._material.destroy();
            this._material = null;
            this._mesh.destroy();
            this._mesh = null;
            // recreate model
            this.createModel();
            // set properties
            this.updateWidth();
            this.updateHeight();
            this.updateRotation();
            this.updateTexture();
            // enable/disable model
            if (this.enabled) {
              this.attachToScene();
              this._model.enabled = true;
            } else {
              this._model.enabled = false;
            }
          }
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_texture", _descriptor, this);
          _initializerDefineProperty(this, "_height", _descriptor2, this);
          _initializerDefineProperty(this, "_width", _descriptor3, this);
          _initializerDefineProperty(this, "_rotation", _descriptor4, this);
          _initializerDefineProperty(this, "_techIndex", _descriptor5, this);
          this._model = null;
          this._mesh = null;
          this._material = null;
          this._uniform = new Vec4(1, 1, 0, 0);
        }
        onLoad() {
          this.createModel();
        }
        onEnable() {
          this.attachToScene();
          this._model.enabled = true;
          this.updateWidth();
          this.updateHeight();
          this.updateRotation();
          this.updateTexture();
          this.updateTechnique();
        }
        onDisable() {
          this.detachFromScene();
        }
        attachToScene() {
          if (this._model && this.node && this.node.scene) {
            if (this._model.scene) {
              this.detachFromScene();
            }
            this._getRenderScene().addModel(this._model);
          }
        }
        detachFromScene() {
          if (this._model && this._model.scene) {
            this._model.scene.removeModel(this._model);
          }
        }
        createModel() {
          this._mesh = createMesh({
            primitiveMode: PrimitiveMode.TRIANGLE_LIST,
            positions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            uvs: [0, 0, 1, 0, 0, 1, 1, 1],
            colors: [Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a, Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a, Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a, Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a],
            attributes: [new Attribute(AttributeName.ATTR_POSITION, Format.RGB32F), new Attribute(AttributeName.ATTR_TEX_COORD, Format.RG32F), new Attribute(AttributeName.ATTR_COLOR, Format.RGBA8UI, true)],
            indices: [0, 1, 2, 1, 2, 3]
          }, undefined, {
            calculateBounds: false
          });
          const model = this._model = cclegacy.director.root.createModel(scene.Model);
          model.node = model.transform = this.node;
          if (this._material == null) {
            this._material = new Material();
            this._material.copy(builtinResMgr.get('default-billboard-material'), {
              technique: this._techIndex
            });
          }
          model.initSubModel(0, this._mesh.renderingSubMeshes[0], this._material);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_texture", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "texture", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "texture"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_height", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "height", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "height"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_width", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "width", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "width"), _class2.prototype), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_rotation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "rotation", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "rotation"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_techIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "technique", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "technique"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});