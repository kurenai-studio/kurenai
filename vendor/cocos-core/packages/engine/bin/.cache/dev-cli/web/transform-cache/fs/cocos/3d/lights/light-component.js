System.register("q-bundled:///fs/cocos/3d/lights/light-component.js", ["../../core/data/decorators/index.js", "../../scene-graph/component.js", "../../core/index.js", "../../render-scene/index.js", "../../rendering/define.js", "../../scene-graph/layers.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, range, slide, type, displayOrder, serializable, editable, Component, Color, Vec3, Enum, cclegacy, scene, CAMERA_DEFAULT_MASK, Layers, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class3, _class4, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _Light, _color_tmp, PhotometricTerm, StaticLightSettings, Light;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      range = _coreDataDecoratorsIndexJs.range;
      slide = _coreDataDecoratorsIndexJs.slide;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Vec3 = _coreIndexJs.Vec3;
      Enum = _coreIndexJs.Enum;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_renderingDefineJs) {
      CAMERA_DEFAULT_MASK = _renderingDefineJs.CAMERA_DEFAULT_MASK;
    }, function (_sceneGraphLayersJs) {
      Layers = _sceneGraphLayersJs.Layers;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
      _color_tmp = new Vec3();
      /**
       * @en The physical term used for light.
       * @zh 光源所使用的物理计量单位。
       */
      _export("PhotometricTerm", PhotometricTerm = Enum({
        LUMINOUS_FLUX: 0,
        LUMINANCE: 1
      }));
      /**
       * @en Static light settings.
       * @zh 静态灯光设置
       */
      StaticLightSettings = (_dec = ccclass('cc.StaticLightSettings'), _dec(_class = (_class2 = class StaticLightSettings {
        constructor() {
          _initializerDefineProperty(this, "_baked", _descriptor, this);
          _initializerDefineProperty(this, "_editorOnly", _descriptor2, this);
          _initializerDefineProperty(this, "_castShadow", _descriptor3, this);
        }
        /**
         * @en Whether the light is editor only.
         * @zh 是否只在编辑器里生效。
         */
        get editorOnly() {
          return this._editorOnly;
        }
        set editorOnly(val) {
          this._editorOnly = val;
        }

        /**
         * @en Whether the light is baked
         * @zh 光源是否被烘焙
         */
        get baked() {
          return this._baked;
        }
        set baked(val) {
          this._baked = val;
        }

        /**
         * @en Whether the light will cast shadow during baking process.
         * @zh 光源在烘焙时是否投射阴影。
         */
        get castShadow() {
          return this._castShadow;
        }
        set castShadow(val) {
          this._castShadow = val;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_baked", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_editorOnly", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_castShadow", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "editorOnly", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "editorOnly"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "castShadow", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "castShadow"), _class2.prototype), _class2)) || _class);
      /**
       * @en The base class of all light components, contains basic light settings for both real time light and baked light.
       * @zh 光源组件基类，包含实时光源和烘焙光源的基本配置信息。
       */
      _export("Light", Light = (_dec2 = ccclass('cc.Light'), _dec3 = tooltip('i18n:lights.color'), _dec4 = tooltip('i18n:lights.use_color_temperature'), _dec5 = range([1000, 15000, 100]), _dec6 = tooltip('i18n:lights.color_temperature'), _dec7 = type(StaticLightSettings), _dec8 = displayOrder(50), _dec9 = tooltip('i18n:lights.visibility'), _dec0 = displayOrder(255), _dec1 = type(Layers.BitMask), _dec2(_class3 = (_class4 = (_Light = class Light extends Component {
        /**
         * @en The color of the light.
         * @zh 光源颜色。
         */
        get color() {
          return this._color;
        }
        set color(val) {
          this._color = val.clone();
          if (this._light) {
            _color_tmp.x = val.r / 255.0;
            _color_tmp.y = val.g / 255.0;
            _color_tmp.z = val.b / 255.0;
            this._light.color = _color_tmp;
          }
        }

        /**
         * @en
         * Whether to enable light color temperature.
         * @zh
         * 是否启用光源色温。
         */
        get useColorTemperature() {
          return this._useColorTemperature;
        }
        set useColorTemperature(enable) {
          this._useColorTemperature = enable;
          if (this._light) {
            this._light.useColorTemperature = enable;
          }
        }

        /**
         * @en
         * The light color temperature.
         * @zh
         * 光源色温。
         */
        get colorTemperature() {
          return this._colorTemperature;
        }
        set colorTemperature(val) {
          this._colorTemperature = val;
          if (this._light) {
            this._light.colorTemperature = val;
          }
        }

        /**
         * @en
         * static light settings.
         * @zh
         * 静态灯光设置。
         */
        get staticSettings() {
          return this._staticSettings;
        }
        set staticSettings(val) {
          this._staticSettings = val;
        }

        /**
         * @en The light type.
         * @zh 光源类型。
         */
        get type() {
          return this._type;
        }

        /**
         * @en Whether the light is baked
         * @zh 光源是否被烘焙
         */
        get baked() {
          return this.staticSettings.baked;
        }
        set baked(val) {
          this.staticSettings.baked = val;
          if (this._light !== null) {
            this._light.baked = val;
          }
        }

        /**
         * @en Visibility mask of the light, declaring a set of node layers that will be visible to this light.
         * @zh 光照的可见性掩码，声明在当前光照中可见的节点层级集合。
         */
        set visibility(vis) {
          this._visibility = vis;
          if (this._light) {
            this._light.visibility = vis;
          }
          this._onUpdateReceiveDirLight();
        }
        get visibility() {
          return this._visibility;
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_color", _descriptor4, this);
          _initializerDefineProperty(this, "_useColorTemperature", _descriptor5, this);
          _initializerDefineProperty(this, "_colorTemperature", _descriptor6, this);
          _initializerDefineProperty(this, "_staticSettings", _descriptor7, this);
          _initializerDefineProperty(this, "_visibility", _descriptor8, this);
          this._type = scene.LightType.UNKNOWN;
          this._lightType = void 0;
          this._light = null;
          this._lightType = scene.Light;
        }
        onLoad() {
          this._createLight();
        }
        onEnable() {
          this._attachToScene();
        }
        onDisable() {
          this._detachFromScene();
        }
        onDestroy() {
          this._destroyLight();
        }
        _createLight() {
          if (!this._light) {
            this._light = cclegacy.director.root.createLight(this._lightType);
          }
          this.color = this._color;
          this.useColorTemperature = this._useColorTemperature;
          this.colorTemperature = this._colorTemperature;
          this._light.node = this.node;
          this._light.baked = this.baked;
          this._light.visibility = this.visibility;
        }
        _destroyLight() {
          if (this._light) {
            cclegacy.director.root.recycleLight(this._light);
            this._light = null;
          }
        }
        _attachToScene() {
          this._detachFromScene();
          if (this._light && !this._light.scene && this.node.scene) {
            const renderScene = this._getRenderScene();
            switch (this._type) {
              case scene.LightType.DIRECTIONAL:
                renderScene.addDirectionalLight(this._light);
                renderScene.setMainLight(this._light);
                break;
              case scene.LightType.SPHERE:
                renderScene.addSphereLight(this._light);
                break;
              case scene.LightType.SPOT:
                renderScene.addSpotLight(this._light);
                break;
              case scene.LightType.POINT:
                renderScene.addPointLight(this._light);
                break;
              case scene.LightType.RANGED_DIRECTIONAL:
                renderScene.addRangedDirLight(this._light);
                break;
              default:
                break;
            }
          }
        }
        _detachFromScene() {
          if (this._light && this._light.scene) {
            const renderScene = this._light.scene;
            switch (this._type) {
              case scene.LightType.DIRECTIONAL:
                renderScene.removeDirectionalLight(this._light);
                renderScene.unsetMainLight(this._light);
                break;
              case scene.LightType.SPHERE:
                renderScene.removeSphereLight(this._light);
                break;
              case scene.LightType.SPOT:
                renderScene.removeSpotLight(this._light);
                break;
              case scene.LightType.POINT:
                renderScene.removePointLight(this._light);
                break;
              case scene.LightType.RANGED_DIRECTIONAL:
                renderScene.removeRangedDirLight(this._light);
                break;
              default:
                break;
            }
          }
        }
        _onUpdateReceiveDirLight() {
          // do nothing
        }
      }, _Light.Type = scene.LightType, _Light.PhotometricTerm = PhotometricTerm, _Light), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_color", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "_useColorTemperature", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "_colorTemperature", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 6550;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "_staticSettings", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new StaticLightSettings();
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "_visibility", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CAMERA_DEFAULT_MASK;
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "color", [_dec3], Object.getOwnPropertyDescriptor(_class4.prototype, "color"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "useColorTemperature", [_dec4], Object.getOwnPropertyDescriptor(_class4.prototype, "useColorTemperature"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "colorTemperature", [slide, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class4.prototype, "colorTemperature"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "staticSettings", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class4.prototype, "staticSettings"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "visibility", [_dec9, _dec0, _dec1], Object.getOwnPropertyDescriptor(_class4.prototype, "visibility"), _class4.prototype), _class4)) || _class3));
    }
  };
});