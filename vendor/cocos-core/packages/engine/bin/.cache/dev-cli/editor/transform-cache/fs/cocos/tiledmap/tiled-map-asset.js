System.register("q-bundled:///fs/cocos/tiledmap/tiled-map-asset.js", ["../core/data/decorators/index.js", "../asset/assets/asset.js", "../core/index.js", "../2d/assets/index.js", "../asset/assets/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, Asset, CCString, Size, SpriteFrame, TextAsset, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, TiledMapAsset;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      CCString = _coreIndexJs.CCString;
      Size = _coreIndexJs.Size;
    }, function (_dAssetsIndexJs) {
      SpriteFrame = _dAssetsIndexJs.SpriteFrame;
    }, function (_assetAssetsIndexJs) {
      TextAsset = _assetAssetsIndexJs.TextAsset;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @en
       * Class for tiled map asset handling.
       * @zh
       * 用于获取 tiled map 资源类
       * @class TiledMapAsset
       * @extends Asset
       *
       */
      _export("TiledMapAsset", TiledMapAsset = (_dec = ccclass('cc.TiledMapAsset'), _dec2 = type([TextAsset]), _dec3 = type([CCString]), _dec4 = type([SpriteFrame]), _dec5 = type([SpriteFrame]), _dec6 = type([CCString]), _dec7 = type([CCString]), _dec8 = type([Size]), _dec(_class = (_class2 = class TiledMapAsset extends Asset {
        constructor() {
          super();
          _initializerDefineProperty(this, "tmxXmlStr", _descriptor, this);
          _initializerDefineProperty(this, "tsxFiles", _descriptor2, this);
          _initializerDefineProperty(this, "tsxFileNames", _descriptor3, this);
          /**
           * @en
           * SpriteFrame array
           * @zh
           * SpriteFrame 数组
           */
          _initializerDefineProperty(this, "spriteFrames", _descriptor4, this);
          /**
           * @en
           * ImageLayerSpriteFrame array
           * @zh
           * ImageLayerSpriteFrame 数组
           * @property {SpriteFrame[]} imageLayerSpriteFrame
           */
          _initializerDefineProperty(this, "imageLayerSpriteFrame", _descriptor5, this);
          /**
           * @en
           * Name of each object in imageLayerSpriteFrame
           * @zh
           * 每个 imageLayerSpriteFrame 名称
           * @property {String[]} imageLayerTextureNames
           */
          _initializerDefineProperty(this, "imageLayerSpriteFrameNames", _descriptor6, this);
          /**
           * @en
           * Name of each object in spriteFrames
           * @zh
           * 每个 SpriteFrame 名称
           * @property {String[]} spriteFrameNames
           */
          _initializerDefineProperty(this, "spriteFrameNames", _descriptor7, this);
          /**
           * @en
           * Size of each object in spriteFrames
           * @zh
           * 每个 SpriteFrame 的大小
           * @property {Size[]} spriteFrameSizes
           */
          _initializerDefineProperty(this, "spriteFrameSizes", _descriptor8, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "tmxXmlStr", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "tsxFiles", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "tsxFileNames", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "spriteFrames", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "imageLayerSpriteFrame", [serializable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "imageLayerSpriteFrameNames", [serializable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "spriteFrameNames", [serializable, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "spriteFrameSizes", [serializable, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
    }
  };
});