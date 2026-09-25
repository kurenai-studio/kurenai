System.register("q-bundled:///fs/cocos/dragon-bones/DragonBonesAtlasAsset.js", ["../../../virtual/internal%253Aconstants.js", "./ArmatureCache.js", "../core/index.js", "../asset/assets/index.js", "../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var JSB, ArmatureCache, cclegacy, _decorator, Asset, Texture2D, Node, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, ccclass, serializable, type, DragonBonesAtlasAsset;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_ArmatureCacheJs) {
      ArmatureCache = _ArmatureCacheJs.ArmatureCache;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      _decorator = _coreIndexJs._decorator;
    }, function (_assetAssetsIndexJs) {
      Asset = _assetAssetsIndexJs.Asset;
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
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
      ({
        ccclass,
        serializable,
        type
      } = _decorator);
      /**
       * @en The skeleton atlas data of dragonBones.
       * @zh DragonBones 的骨骼纹理数据。
       * @class DragonBonesAtlasAsset
       * @extends Asset
       */
      _export("DragonBonesAtlasAsset", DragonBonesAtlasAsset = (_dec = ccclass('dragonBones.DragonBonesAtlasAsset'), _dec2 = type(Texture2D), _dec(_class = (_class2 = class DragonBonesAtlasAsset extends Asset {
        constructor() {
          super();
          /**
           * @en atlas of json file.
           * @zh 纹理图集的 json 文件。
           */
          _initializerDefineProperty(this, "_atlasJson", _descriptor, this);
          /**
           * @en 2D Texture.
           * @zh 2D 纹理。
           */
          _initializerDefineProperty(this, "_texture", _descriptor2, this);
          /**
           * @en Data with json format for Describing the atlas information.
           * @zh 描述图集信息的 json 数据。
           */
          _initializerDefineProperty(this, "_atlasJsonData", _descriptor3, this);
          /**
           * @en Dragonbones instance of CCFactory.
           * @zh Dragonbones 工厂实例。
           */
          this._factory = null;
          /**
           * @en The texture atlas data.
           * @zh 贴图集数据。
           */
          _initializerDefineProperty(this, "_textureAtlasData", _descriptor4, this);
          this._clear();
        }
        get atlasJson() {
          return this._atlasJson;
        }
        set atlasJson(value) {
          this._atlasJson = value;
          this._atlasJsonData = JSON.parse(this.atlasJson);
          this._clear();
        }
        /**
         * @en 2D texture.
         * @zh 2D 纹理。
         * @property {Texture2D} texture
         */
        get texture() {
          return this._texture;
        }
        set texture(value) {
          this._texture = value;
          this._clear();
        }
        /**
         * @en Create a new node with Dragonbones component.
         * @zh 创建一个附带龙骨组件的 node 节点。
         */
        createNode(callback) {
          const node = new Node(this.name);
          const armatureDisplay = node.addComponent('dragonBones.ArmatureDisplay');
          armatureDisplay.dragonAtlasAsset = this;
          return callback(null, node);
        }

        /**
         * @en Atlas resource initialization. Parse the original atlas data and atlas object into a
         * TextureAtlasData instance, and cache it to the factory.
         * @zh 图集资源初始化。将原始贴图集数据和贴图集对象解析为 TextureAtlasData 实例，并缓存到工厂中。
         */
        init(factory) {
          this._factory = factory;
          if (!this._atlasJsonData) {
            this._atlasJsonData = JSON.parse(this.atlasJson);
          }
          const atlasJsonObj = this._atlasJsonData;

          // If create by manual, uuid is empty.
          this._uuid = this._uuid || atlasJsonObj.name;
          if (this._textureAtlasData) {
            factory.addTextureAtlasData(this._textureAtlasData, this._uuid);
          } else {
            this._textureAtlasData = factory.parseTextureAtlasData(atlasJsonObj, this.texture, this._uuid);
          }
        }
        /**
         * @en Destroy altas assets.
         * @zh 销毁图集资源。
         */
        destroy() {
          this._clear();
          return super.destroy();
        }
        _clear() {
          if (JSB) return;
          if (this._factory) {
            ArmatureCache.sharedCache.resetArmature(this._uuid);
            this._factory.removeTextureAtlasData(this._uuid, true);
            this._factory.removeDragonBonesDataByUUID(this._uuid, true);
          }
          this._textureAtlasData = null;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_atlasJson", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_texture", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_atlasJsonData", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return {};
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_textureAtlasData", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      cclegacy.internal.DragonBonesAtlasAsset = DragonBonesAtlasAsset;
    }
  };
});