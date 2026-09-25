System.register("q-bundled:///fs/cocos/asset/assets/texture-base.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "./asset.js", "./asset-enum.js", "../../gfx/index.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, TEST, ccclass, serializable, Asset, TextureFilter, PixelFormat, WrapMode, Format, SamplerInfo, deviceManager, errorID, murmurhash2_32_gc, ccenum, cclegacy, js, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _TextureBase, idGenerator, TextureBase;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_assetJs) {
      Asset = _assetJs.Asset;
    }, function (_assetEnumJs) {
      TextureFilter = _assetEnumJs.TextureFilter;
      PixelFormat = _assetEnumJs.PixelFormat;
      WrapMode = _assetEnumJs.WrapMode;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
      SamplerInfo = _gfxIndexJs.SamplerInfo;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
      ccenum = _coreIndexJs.ccenum;
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
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

      ccenum(Format);
      idGenerator = new js.IDGenerator('Tex');
      /**
       * @en The base texture class, it defines features shared by all textures.
       * @zh 贴图资源基类。它定义了所有贴图共用的概念。
       */
      _export("TextureBase", TextureBase = (_dec = ccclass('cc.TextureBase'), _dec(_class = (_class2 = (_TextureBase = class TextureBase extends Asset {
        /**
         * @en Whether the pixel data is compressed.
         * @zh 此贴图是否为压缩的像素格式。
         */
        get isCompressed() {
          return this._format >= PixelFormat.RGB_ETC1 && this._format <= PixelFormat.RGBA_ASTC_12x12 || this._format >= PixelFormat.RGB_A_PVRTC_2BPPV1 && this._format <= PixelFormat.RGBA_ETC1;
        }

        /**
         * @en Whether it is a compressed alpha channel texture
         * @zh 是否为压缩的透明通道贴图
         */
        get isAlphaAtlas() {
          return this._format === PixelFormat.RGBA_ETC1 || this._format === PixelFormat.RGB_A_PVRTC_4BPPV1 || this._format === PixelFormat.RGB_A_PVRTC_2BPPV1;
        }

        /**
         * @en Pixel width of the texture.
         * @zh 此贴图的像素宽度。
         */
        get width() {
          return this._width;
        }

        /**
         * @en Pixel height of the texture.
         * @zh 此贴图的像素高度。
         */
        get height() {
          return this._height;
        }

        /**
         * @en The pixel format enum.
         * @zh 像素格式枚举类型。
         */

        constructor(name) {
          super(name);

          // Id for generate hash in material
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_format", _descriptor, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_minFilter", _descriptor2, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_magFilter", _descriptor3, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_mipFilter", _descriptor4, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_wrapS", _descriptor5, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_wrapT", _descriptor6, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_wrapR", _descriptor7, this);
          /**
           * @engineInternal
           */
          _initializerDefineProperty(this, "_anisotropy", _descriptor8, this);
          /**
           * @engineInternal
           * @mangle
           */
          this._width = 1;
          /**
           * @engineInternal
           * @mangle
           */
          this._height = 1;
          this._samplerInfo = new SamplerInfo();
          this._gfxSampler = null;
          this._gfxDevice = null;
          this._textureHash = 0;
          this._id = idGenerator.getNewId();
          this._gfxDevice = this._getGFXDevice();
          this._textureHash = murmurhash2_32_gc(this._id, 666);
        }

        /**
         * @en Gets the id of the texture.
         * @zh 获取标识符。
         * @returns @en The id of this texture. @zh 此贴图的 id。
         */
        getId() {
          return this._id;
        }

        /**
         * @en Gets the pixel format.
         * @zh 获取像素格式。
         * @returns @en The pixel format. @zh 像素格式。
         */
        getPixelFormat() {
          return this._format;
        }

        /**
         * @en Gets the anisotropy.
         * @zh 获取各向异性。
         * @returns @en The anisotropy. @zh 各项异性值。
         */
        getAnisotropy() {
          return this._anisotropy;
        }

        /**
         * @en Sets the wrap mode of the texture.
         * Be noted, if the size of the texture is not power of two, only [[WrapMode.CLAMP_TO_EDGE]] is allowed.
         * @zh 设置此贴图的缠绕模式。
         * 注意，若贴图尺寸不是 2 的整数幂，缠绕模式仅允许 [[WrapMode.CLAMP_TO_EDGE]]。
         * @param wrapS @en S(U) coordinate wrap mode. @zh S(U) 坐标系缠绕模式.
         * @param wrapT @en T(V) coordinate wrap mode. @zh T(V) 坐标系缠绕模式.
         * @param wrapR @en R(W) coordinate wrap mode. @zh R(W) 坐标系缠绕模式.
         */
        setWrapMode(wrapS, wrapT, wrapR) {
          if (wrapR === undefined) wrapR = wrapS; // wrap modes should be as consistent as possible for performance

          this._wrapS = wrapS;
          this._samplerInfo.addressU = wrapS;
          this._wrapT = wrapT;
          this._samplerInfo.addressV = wrapT;
          this._wrapR = wrapR;
          this._samplerInfo.addressW = wrapR;
          if (this._gfxDevice) {
            this._gfxSampler = this._gfxDevice.getSampler(this._samplerInfo);
          }
        }

        /**
         * @en Sets the texture's filter mode.
         * @zh 设置此贴图的过滤算法。
         * @param minFilter @en Filter mode for scale down. @zh 贴图缩小时使用的过滤模式。
         * @param magFilter @en Filter mode for scale up. @zh 贴图放大时使用的过滤模式。
         */
        setFilters(minFilter, magFilter) {
          this._minFilter = minFilter;
          this._samplerInfo.minFilter = minFilter;
          this._magFilter = magFilter;
          this._samplerInfo.magFilter = magFilter;
          if (this._gfxDevice) {
            this._gfxSampler = this._gfxDevice.getSampler(this._samplerInfo);
          }
        }

        /**
         * @en Sets the texture's mip filter mode.
         * @zh 设置此贴图的多层 mip 过滤算法。
         * @param mipFilter @en Filter mode for multiple mip level. @zh 多层 mip 过滤模式。
         */
        setMipFilter(mipFilter) {
          this._mipFilter = mipFilter;
          this._samplerInfo.mipFilter = mipFilter;
          if (this._gfxDevice) {
            this._gfxSampler = this._gfxDevice.getSampler(this._samplerInfo);
          }
        }

        /**
         * @en Sets the texture's anisotropy.
         * @zh 设置此贴图的各向异性。
         * @param anisotropy @en The anisotropy to be set. Max value is 16. @zh 待设置的各向异性数值。最大值为16
         */
        setAnisotropy(anisotropy) {
          anisotropy = Math.min(anisotropy, 16);
          this._anisotropy = anisotropy;
          this._samplerInfo.maxAnisotropy = anisotropy;
          if (this._gfxDevice) {
            this._gfxSampler = this._gfxDevice.getSampler(this._samplerInfo);
          }
        }

        /**
         * @en Destroy the current texture, clear up the related GPU resources.
         * @zh 销毁此贴图，并释放占用的 GPU 资源。
         */
        destroy() {
          var _cclegacy$director$ro;
          const destroyed = super.destroy();
          if (destroyed && (_cclegacy$director$ro = cclegacy.director.root) != null && _cclegacy$director$ro.batcher2D) {
            cclegacy.director.root.batcher2D._releaseDescriptorSetCache(this._textureHash);
          }
          return destroyed;
        }

        /**
         * @en Gets the texture hash.
         * @zh 获取此贴图的哈希值。
         */
        getHash() {
          return this._textureHash;
        }

        /**
         * @en Gets the GFX Texture resource
         * @zh 获取此贴图底层的 GFX 贴图对象。
         */
        getGFXTexture() {
          return null;
        }

        /**
         * @en Gets the internal GFX sampler hash.
         * @zh 获取此贴图内部使用的 GFX 采样器信息。
         * @private
         */
        getSamplerInfo() {
          return this._samplerInfo;
        }

        /**
         * @en Gets the sampler resource for the texture
         * @zh 获取此贴图底层的 GFX 采样信息。
         */
        getGFXSampler() {
          if (!this._gfxSampler) {
            if (this._gfxDevice) {
              this._gfxSampler = this._gfxDevice.getSampler(this._samplerInfo);
            } else {
              errorID(9302);
            }
          }
          return this._gfxSampler;
        }

        // SERIALIZATION

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _serialize(ctxForExporting) {
          if (EDITOR || NODEJS || TEST) {
            return `${this._minFilter},${this._magFilter},${this._wrapS},${this._wrapT},${this._mipFilter},${this._anisotropy}`;
          }
          return '';
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _deserialize(serializedData, handle) {
          const data = serializedData;
          const fields = data.split(',');
          fields.unshift('');
          if (fields.length >= 5) {
            // decode filters
            this.setFilters(parseInt(fields[1]), parseInt(fields[2]));
            // decode wraps
            this.setWrapMode(parseInt(fields[3]), parseInt(fields[4]));
          }
          if (fields.length >= 7) {
            this.setMipFilter(parseInt(fields[5]));
            this.setAnisotropy(parseInt(fields[6]));
          }
        }
        _getGFXDevice() {
          return deviceManager.gfxDevice;
        }
        _getGFXFormat() {
          return this._getGFXPixelFormat(this._format);
        }
        _setGFXFormat(format) {
          this._format = format === undefined ? PixelFormat.RGBA8888 : format;
        }
        _getGFXPixelFormat(format) {
          if (format === PixelFormat.RGBA_ETC1) {
            format = PixelFormat.RGB_ETC1;
          } else if (format === PixelFormat.RGB_A_PVRTC_4BPPV1) {
            format = PixelFormat.RGB_PVRTC_4BPPV1;
          } else if (format === PixelFormat.RGB_A_PVRTC_2BPPV1) {
            format = PixelFormat.RGB_PVRTC_2BPPV1;
          }
          return format;
        }
      }, _TextureBase.PixelFormat = PixelFormat, _TextureBase.WrapMode = WrapMode, _TextureBase.Filter = TextureFilter, _TextureBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_format", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PixelFormat.RGBA8888;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_minFilter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TextureFilter.LINEAR;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_magFilter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TextureFilter.LINEAR;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_mipFilter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TextureFilter.NONE;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_wrapS", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return WrapMode.REPEAT;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_wrapT", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return WrapMode.REPEAT;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_wrapR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return WrapMode.REPEAT;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_anisotropy", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
      cclegacy.TextureBase = TextureBase;
    }
  };
});