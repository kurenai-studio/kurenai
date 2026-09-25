System.register("q-bundled:///fs/cocos/asset/assets/image-asset.jsb.js", ["../../../../virtual/internal%253Aconstants.js", "../../gfx/index.js", "./asset-enum.js", "../../core/index.js", "../../native-binding/decorators.js", "./asset.js"], function (_export, _context) {
  "use strict";

  var ALIPAY, XIAOMI, JSB, TEST, EDITOR, NODEJS, Format, FormatFeatureBit, deviceManager, PixelFormat, sys, macro, warnID, cclegacy, patch_cc_ImageAsset, ImageAsset, jsbWindow, extnames, imageAssetProto, superDestroy;
  function isImageBitmap(imageSource) {
    return !!(sys.hasFeature(sys.Feature.IMAGE_BITMAP) && imageSource instanceof ImageBitmap);
  }
  function isNativeImage(imageSource) {
    if (ALIPAY || XIAOMI) {
      // We're unable to grab the constructors of Alipay native image or canvas object.
      return !('_data' in imageSource);
    }
    if (JSB && imageSource._compressed === true) {
      return false;
    }
    return imageSource instanceof jsbWindow.HTMLImageElement || imageSource instanceof jsbWindow.HTMLCanvasElement || isImageBitmap(imageSource);
  }

  // TODO: we mark imageAssetProto as type of any, because here we have many dynamic injected property @dumganhar
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      ALIPAY = _virtualInternal253AconstantsJs.ALIPAY;
      XIAOMI = _virtualInternal253AconstantsJs.XIAOMI;
      JSB = _virtualInternal253AconstantsJs.JSB;
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_assetEnumJs) {
      PixelFormat = _assetEnumJs.PixelFormat;
    }, function (_coreIndexJs) {
      sys = _coreIndexJs.sys;
      macro = _coreIndexJs.macro;
      warnID = _coreIndexJs.warnID;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_ImageAsset = _nativeBindingDecoratorsJs.patch_cc_ImageAsset;
    }, function (_assetJs) {}],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("ImageAsset", ImageAsset = jsb.ImageAsset);
      jsbWindow = jsb.window;
      extnames = ['.png', '.jpg', '.jpeg', '.bmp', '.webp', '.pvr', '.pkm', '.astc'];
      imageAssetProto = ImageAsset.prototype;
      imageAssetProto._ctor = function (nativeAsset) {
        jsb.Asset.prototype._ctor.apply(this, arguments);
        this._width = 0;
        this._height = 0;
        this._nativeData = {
          _data: null,
          width: 0,
          height: 0,
          format: 0,
          _compressed: false,
          mipmapLevelDataSize: []
        };
        if (nativeAsset !== undefined) {
          this.reset(nativeAsset);
        }
      };
      Object.defineProperty(imageAssetProto, '_nativeAsset', {
        configurable: true,
        enumerable: true,
        get() {
          return this._nativeData;
        },
        set(value) {
          if (!(value instanceof jsbWindow.HTMLElement) && !isImageBitmap(value)) {
            value.format = value.format || this.format;
          }
          this.reset(value);
        }
      });
      Object.defineProperty(imageAssetProto, 'data', {
        configurable: true,
        enumerable: true,
        get() {
          if (this._nativeData && isNativeImage(this._nativeData)) {
            return this._nativeData;
          }
          return this._nativeData && this._nativeData._data;
        }
      });
      imageAssetProto._setRawAsset = function (filename, inLibrary = true) {
        if (inLibrary !== false) {
          this._native = filename || '';
        } else {
          this._native = `/${filename}`; // simply use '/' to tag location where is not in the library
        }
      };

      // TODO: Property 'format' does not exist on type 'HTMLCanvasElement'.
      // imageAssetProto.reset = function (data: ImageSource) {
      imageAssetProto.reset = function (data) {
        this._nativeData = data;
        if (data.format !== undefined && !this.isFormatFixed()) {
          this.format = data.format;
        }
        this._syncDataToNative();
      };
      superDestroy = jsb.Asset.prototype.destroy;
      imageAssetProto.destroy = function () {
        if (this.data && this.data instanceof jsbWindow.HTMLImageElement) {
          this.data.src = '';
          this._setRawAsset('');
          this.data.destroy();
        } else if (isImageBitmap(this.data)) {
          this.data.close && this.data.close();
        }
        return superDestroy.call(this);
      };
      Object.defineProperty(imageAssetProto, 'width', {
        configurable: true,
        enumerable: true,
        get() {
          var _this$_nativeData;
          return ((_this$_nativeData = this._nativeData) == null ? void 0 : _this$_nativeData.width) || this._width;
        }
      });
      Object.defineProperty(imageAssetProto, 'height', {
        configurable: true,
        enumerable: true,
        get() {
          var _this$_nativeData2;
          return ((_this$_nativeData2 = this._nativeData) == null ? void 0 : _this$_nativeData2.height) || this._height;
        }
      });
      imageAssetProto._syncDataToNative = function () {
        const data = this._nativeData;
        this._width = data.width;
        this._height = data.height;
        this.setWidth(this._width);
        this.setHeight(this._height);
        this.url = this.nativeUrl;
        if (data instanceof jsbWindow.HTMLCanvasElement) {
          this.setData(data._data.data);
        } else if (data instanceof jsbWindow.HTMLImageElement) {
          this.setData(data._data);
          if (data._mipmapLevelDataSize) {
            this.setMipmapLevelDataSize(data._mipmapLevelDataSize);
          }
        } else {
          if (!this._nativeData._data) {
            console.error(`[ImageAsset] setData bad argument ${this._nativeData}`);
            return;
          }
          this.setData(this._nativeData._data);
          if (this._nativeData.mipmapLevelDataSize) {
            this.setMipmapLevelDataSize(this._nativeData.mipmapLevelDataSize);
          }
        }
      };
      imageAssetProto._serialize = function () {
        if (EDITOR || NODEJS || TEST) {
          let targetExtensions;
          if (this._native) {
            targetExtensions = [this._native];
          }
          if (!targetExtensions) {
            return '';
          }
          const extensionIndices = [];
          for (const targetExtension of targetExtensions) {
            const extensionFormat = targetExtension.split('@');
            const i = extnames.indexOf(extensionFormat[0]);
            let exportedExtensionID = i < 0 ? targetExtension : `${i}`;
            if (extensionFormat[1]) {
              exportedExtensionID += `@${extensionFormat[1]}`;
            }
            extensionIndices.push(exportedExtensionID);
          }
          return {
            fmt: extensionIndices.join('_'),
            w: this.width,
            h: this.height
          };
        }
      };
      imageAssetProto._deserialize = function (data) {
        let fmtStr = '';
        if (typeof data === 'string') {
          fmtStr = data;
        } else {
          this._width = data.w;
          this._height = data.h;
          fmtStr = data.fmt;
        }
        const device = deviceManager.gfxDevice;
        const extensionIDs = fmtStr.split('_');
        let preferedExtensionIndex = Number.MAX_VALUE;
        // let format = this._format;
        let format = this.format;
        let ext = '';
        const SupportTextureFormats = macro.SUPPORT_TEXTURE_FORMATS;
        for (const extensionID of extensionIDs) {
          const extFormat = extensionID.split('@');
          const i = parseInt(extFormat[0], undefined);
          // const tmpExt = ImageAsset.extnames[i] || extFormat[0];
          const tmpExt = extnames[i] || extFormat[0];
          const index = SupportTextureFormats.indexOf(tmpExt);
          if (index !== -1 && index < preferedExtensionIndex) {
            // const fmt = extFormat[1] ? parseInt(extFormat[1]) : this._format;
            const fmt = extFormat[1] ? parseInt(extFormat[1]) : this.format;

            // check whether or not support compressed texture
            if (tmpExt === '.astc' && (!device || !(device.getFormatFeatures(Format.ASTC_RGBA_4X4) & FormatFeatureBit.SAMPLED_TEXTURE))) {
              continue;
            } else if (tmpExt === '.pvr' && (!device || !(device.getFormatFeatures(Format.PVRTC_RGBA4) & FormatFeatureBit.SAMPLED_TEXTURE))) {
              continue;
            } else if ((fmt === PixelFormat.RGB_ETC1 || fmt === PixelFormat.RGBA_ETC1) && (!device || !(device.getFormatFeatures(Format.ETC_RGB8) & FormatFeatureBit.SAMPLED_TEXTURE))) {
              continue;
            } else if ((fmt === PixelFormat.RGB_ETC2 || fmt === PixelFormat.RGBA_ETC2) && (!device || !(device.getFormatFeatures(Format.ETC2_RGB8) & FormatFeatureBit.SAMPLED_TEXTURE))) {
              continue;
            } else if (tmpExt === '.webp' && !sys.hasFeature(sys.Feature.WEBP)) {
              continue;
            }
            preferedExtensionIndex = index;
            ext = tmpExt;
            format = fmt;
          }
        }
        if (ext) {
          this._setRawAsset(ext);
          this.setFixedFormat(format);
        } else {
          warnID(3121);
        }
      };
      cclegacy.ImageAsset = jsb.ImageAsset;

      // handle meta data, it is generated automatically
      patch_cc_ImageAsset({
        ImageAsset
      });
    }
  };
});