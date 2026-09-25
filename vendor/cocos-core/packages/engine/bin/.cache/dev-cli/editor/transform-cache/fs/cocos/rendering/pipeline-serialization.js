System.register("q-bundled:///fs/cocos/rendering/pipeline-serialization.js", ["../core/data/decorators/index.js", "../core/index.js", "../gfx/index.js", "../asset/assets/render-texture.js", "../asset/assets/material.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, editable, CCString, ccenum, AccessFlagBit, Format, LoadOp, StoreOp, TextureType, TextureUsageBit, RenderTexture, Material, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _dec5, _dec6, _class3, _class4, _descriptor7, _descriptor8, _dec7, _dec8, _class5, _class6, _descriptor9, _descriptor0, _dec9, _dec0, _dec1, _class7, _class8, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class9, _class0, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _class1, _class10, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _dec24, _dec25, _dec26, _class11, _class12, _descriptor28, _descriptor29, _descriptor30, _dec27, _dec28, _dec29, _class13, _class14, _descriptor31, _descriptor32, _descriptor33, RenderFlowTag, RenderTextureDesc, RenderTextureConfig, MaterialConfig, FrameBufferDesc, ColorDesc, DepthStencilDesc, RenderPassDesc, RenderQueueSortMode, RenderQueueDesc;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_coreIndexJs) {
      CCString = _coreIndexJs.CCString;
      ccenum = _coreIndexJs.ccenum;
    }, function (_gfxIndexJs) {
      AccessFlagBit = _gfxIndexJs.AccessFlagBit;
      Format = _gfxIndexJs.Format;
      LoadOp = _gfxIndexJs.LoadOp;
      StoreOp = _gfxIndexJs.StoreOp;
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
    }, function (_assetAssetsRenderTextureJs) {
      RenderTexture = _assetAssetsRenderTextureJs.RenderTexture;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
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

      ccenum(TextureType);
      ccenum(TextureUsageBit);
      ccenum(StoreOp);
      ccenum(LoadOp);
      ccenum(AccessFlagBit);
      ccenum(Format);

      /**
       * @en The tag of the render flow, including SCENE, POSTPROCESS and UI.
       * @zh 渲染流程的标签，包含：常规场景（SCENE），后处理（POSTPROCESS），UI 界面（UI）
       */
      _export("RenderFlowTag", RenderFlowTag = /*#__PURE__*/function (RenderFlowTag) {
        RenderFlowTag[RenderFlowTag["SCENE"] = 0] = "SCENE";
        RenderFlowTag[RenderFlowTag["POSTPROCESS"] = 1] = "POSTPROCESS";
        RenderFlowTag[RenderFlowTag["UI"] = 2] = "UI";
        return RenderFlowTag;
      }({}));
      ccenum(RenderFlowTag);
      _export("RenderTextureDesc", RenderTextureDesc = (_dec = ccclass('RenderTextureDesc'), _dec2 = type(TextureType), _dec3 = type(TextureUsageBit), _dec4 = type(Format), _dec(_class = (_class2 = class RenderTextureDesc {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor, this);
          _initializerDefineProperty(this, "type", _descriptor2, this);
          _initializerDefineProperty(this, "usage", _descriptor3, this);
          _initializerDefineProperty(this, "format", _descriptor4, this);
          _initializerDefineProperty(this, "width", _descriptor5, this);
          _initializerDefineProperty(this, "height", _descriptor6, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TextureType.TEX2D;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "usage", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TextureUsageBit.COLOR_ATTACHMENT;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "format", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Format.UNKNOWN;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "width", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "height", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _class2)) || _class));
      _export("RenderTextureConfig", RenderTextureConfig = (_dec5 = ccclass('RenderTextureConfig'), _dec6 = type(RenderTexture), _dec5(_class3 = (_class4 = class RenderTextureConfig {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor7, this);
          _initializerDefineProperty(this, "texture", _descriptor8, this);
        }
      }, _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "name", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "texture", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class4)) || _class3));
      _export("MaterialConfig", MaterialConfig = (_dec7 = ccclass('MaterialConfig'), _dec8 = type(Material), _dec7(_class5 = (_class6 = class MaterialConfig {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor9, this);
          _initializerDefineProperty(this, "material", _descriptor0, this);
        }
      }, _descriptor9 = _applyDecoratedDescriptor(_class6.prototype, "name", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class6.prototype, "material", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class6)) || _class5));
      _export("FrameBufferDesc", FrameBufferDesc = (_dec9 = ccclass('FrameBufferDesc'), _dec0 = type([CCString]), _dec1 = type(RenderTexture), _dec9(_class7 = (_class8 = class FrameBufferDesc {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor1, this);
          _initializerDefineProperty(this, "renderPass", _descriptor10, this);
          _initializerDefineProperty(this, "colorTextures", _descriptor11, this);
          _initializerDefineProperty(this, "depthStencilTexture", _descriptor12, this);
          _initializerDefineProperty(this, "texture", _descriptor13, this);
        }
      }, _descriptor1 = _applyDecoratedDescriptor(_class8.prototype, "name", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class8.prototype, "renderPass", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class8.prototype, "colorTextures", [_dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class8.prototype, "depthStencilTexture", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class8.prototype, "texture", [_dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class8)) || _class7));
      _export("ColorDesc", ColorDesc = (_dec10 = ccclass('ColorDesc'), _dec11 = type(Format), _dec12 = type(LoadOp), _dec13 = type(StoreOp), _dec14 = type(AccessFlagBit), _dec15 = type(AccessFlagBit), _dec10(_class9 = (_class0 = class ColorDesc {
        constructor() {
          _initializerDefineProperty(this, "format", _descriptor14, this);
          _initializerDefineProperty(this, "loadOp", _descriptor15, this);
          _initializerDefineProperty(this, "storeOp", _descriptor16, this);
          _initializerDefineProperty(this, "sampleCount", _descriptor17, this);
          _initializerDefineProperty(this, "beginAccesses", _descriptor18, this);
          _initializerDefineProperty(this, "endAccesses", _descriptor19, this);
        }
      }, _descriptor14 = _applyDecoratedDescriptor(_class0.prototype, "format", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Format.UNKNOWN;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class0.prototype, "loadOp", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LoadOp.CLEAR;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class0.prototype, "storeOp", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StoreOp.STORE;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class0.prototype, "sampleCount", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class0.prototype, "beginAccesses", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return AccessFlagBit.NONE;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class0.prototype, "endAccesses", [_dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return AccessFlagBit.COLOR_ATTACHMENT_WRITE;
        }
      }), _class0)) || _class9));
      _export("DepthStencilDesc", DepthStencilDesc = (_dec16 = ccclass('DepthStencilDesc'), _dec17 = type(Format), _dec18 = type(LoadOp), _dec19 = type(StoreOp), _dec20 = type(LoadOp), _dec21 = type(StoreOp), _dec22 = type(AccessFlagBit), _dec23 = type(AccessFlagBit), _dec16(_class1 = (_class10 = class DepthStencilDesc {
        constructor() {
          _initializerDefineProperty(this, "format", _descriptor20, this);
          _initializerDefineProperty(this, "depthLoadOp", _descriptor21, this);
          _initializerDefineProperty(this, "depthStoreOp", _descriptor22, this);
          _initializerDefineProperty(this, "stencilLoadOp", _descriptor23, this);
          _initializerDefineProperty(this, "stencilStoreOp", _descriptor24, this);
          _initializerDefineProperty(this, "sampleCount", _descriptor25, this);
          _initializerDefineProperty(this, "beginAccesses", _descriptor26, this);
          _initializerDefineProperty(this, "endAccesses", _descriptor27, this);
        }
      }, _descriptor20 = _applyDecoratedDescriptor(_class10.prototype, "format", [_dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Format.UNKNOWN;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class10.prototype, "depthLoadOp", [_dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LoadOp.CLEAR;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class10.prototype, "depthStoreOp", [_dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StoreOp.STORE;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class10.prototype, "stencilLoadOp", [_dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LoadOp.CLEAR;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class10.prototype, "stencilStoreOp", [_dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StoreOp.STORE;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class10.prototype, "sampleCount", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class10.prototype, "beginAccesses", [_dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return AccessFlagBit.NONE;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class10.prototype, "endAccesses", [_dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE;
        }
      }), _class10)) || _class1));
      _export("RenderPassDesc", RenderPassDesc = (_dec24 = ccclass('RenderPassDesc'), _dec25 = type([ColorDesc]), _dec26 = type(DepthStencilDesc), _dec24(_class11 = (_class12 = class RenderPassDesc {
        constructor() {
          _initializerDefineProperty(this, "index", _descriptor28, this);
          _initializerDefineProperty(this, "colorAttachments", _descriptor29, this);
          _initializerDefineProperty(this, "depthStencilAttachment", _descriptor30, this);
        }
      }, _descriptor28 = _applyDecoratedDescriptor(_class12.prototype, "index", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor29 = _applyDecoratedDescriptor(_class12.prototype, "colorAttachments", [_dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor30 = _applyDecoratedDescriptor(_class12.prototype, "depthStencilAttachment", [_dec26], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new DepthStencilDesc();
        }
      }), _class12)) || _class11));
      _export("RenderQueueSortMode", RenderQueueSortMode = /*#__PURE__*/function (RenderQueueSortMode) {
        RenderQueueSortMode[RenderQueueSortMode["FRONT_TO_BACK"] = 0] = "FRONT_TO_BACK";
        RenderQueueSortMode[RenderQueueSortMode["BACK_TO_FRONT"] = 1] = "BACK_TO_FRONT";
        return RenderQueueSortMode;
      }({}));
      ccenum(RenderQueueSortMode);

      /**
       * @en The render queue descriptor
       * @zh 渲染队列描述信息
       */
      _export("RenderQueueDesc", RenderQueueDesc = (_dec27 = ccclass('RenderQueueDesc'), _dec28 = type(RenderQueueSortMode), _dec29 = type([CCString]), _dec27(_class13 = (_class14 = class RenderQueueDesc {
        constructor() {
          /**
           * @en Whether the render queue is a transparent queue
           * @zh 当前队列是否是半透明队列
           */
          _initializerDefineProperty(this, "isTransparent", _descriptor31, this);
          /**
           * @en The sort mode of the render queue
           * @zh 渲染队列的排序模式
           */
          _initializerDefineProperty(this, "sortMode", _descriptor32, this);
          /**
           * @en The stages using this queue
           * @zh 使用当前渲染队列的阶段列表
           */
          _initializerDefineProperty(this, "stages", _descriptor33, this);
        }
      }, _descriptor31 = _applyDecoratedDescriptor(_class14.prototype, "isTransparent", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor32 = _applyDecoratedDescriptor(_class14.prototype, "sortMode", [_dec28], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return RenderQueueSortMode.FRONT_TO_BACK;
        }
      }), _descriptor33 = _applyDecoratedDescriptor(_class14.prototype, "stages", [_dec29], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class14)) || _class13));
    }
  };
});