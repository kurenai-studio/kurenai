System.register("q-bundled:///fs/cocos/asset/assets/texture-2d.jsb.js", ["../../../../virtual/internal%253Aconstants.js", "./image-asset.js", "./simple-texture.js", "./texture-base.jsb.js", "../../core/index.js", "./asset-enum.js", "../../native-binding/decorators.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, TEST, ImageAsset, SimpleTexture, TextureBase, js, cclegacy, TextureFilter, PixelFormat, WrapMode, patch_cc_Texture2D, texture2DProto, Texture2D, oldInitDefault, oldOnLoaded;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_imageAssetJs) {
      ImageAsset = _imageAssetJs.ImageAsset;
    }, function (_simpleTextureJs) {
      SimpleTexture = _simpleTextureJs.SimpleTexture;
    }, function (_textureBaseJsbJs) {
      TextureBase = _textureBaseJsbJs.TextureBase;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_assetEnumJs) {
      TextureFilter = _assetEnumJs.TextureFilter;
      PixelFormat = _assetEnumJs.PixelFormat;
      WrapMode = _assetEnumJs.WrapMode;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_Texture2D = _nativeBindingDecoratorsJs.patch_cc_Texture2D;
    }],
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
      texture2DProto = jsb.Texture2D.prototype;
      texture2DProto.createNode = null;
      _export("Texture2D", Texture2D = jsb.Texture2D);
      Texture2D.Filter = TextureFilter;
      Texture2D.PixelFormat = PixelFormat;
      Texture2D.WrapMode = WrapMode;
      texture2DProto._ctor = function () {
        // TODO: Property '_ctor' does not exist on type 'SimpleTexture'.
        // issue: https://github.com/cocos/cocos-engine/issues/14644
        SimpleTexture.prototype._ctor.apply(this, arguments);
        this._mipmaps = [];
      };
      oldInitDefault = texture2DProto.initDefault;
      texture2DProto.initDefault = function (uuid) {
        oldInitDefault.call(this, uuid);
        this._mipmaps = this.getMipmaps();
      };
      texture2DProto._serialize = function (ctxForExporting) {
        if (EDITOR || NODEJS || TEST) {
          return {
            base: TextureBase.prototype._serialize(ctxForExporting),
            mipmaps: this._mipmaps.map(mipmap => {
              if (!mipmap || !mipmap._uuid) {
                return null;
              }
              let uuid = mipmap._uuid;
              if (ctxForExporting) {
                if (ctxForExporting._compressUuid) {
                  uuid = EditorExtends.UuidUtils.compressUuid(mipmap._uuid, true);
                }
                if (uuid) {
                  ctxForExporting.dependsOn('_textureSource', uuid);
                }
              }
              return uuid;
            })
          };
        }
        return null;
      };
      texture2DProto._deserialize = function (serializedData, handle) {
        const data = serializedData;
        // NOTE: _deserialize expect 3 arguments
        TextureBase.prototype._deserialize.call(this, data.base, undefined);
        this._mipmaps = new Array(data.mipmaps.length);
        for (let i = 0; i < data.mipmaps.length; ++i) {
          // Prevent resource load failed
          this._mipmaps[i] = new ImageAsset();
          if (!data.mipmaps[i]) {
            continue;
          }
          const mipmapUUID = data.mipmaps[i];
          handle.result.push(this._mipmaps, `${i}`, mipmapUUID, js.getClassId(ImageAsset));
        }
      };
      oldOnLoaded = texture2DProto.onLoaded;
      texture2DProto.onLoaded = function () {
        this.syncMipmapsForJS(this._mipmaps);
        oldOnLoaded.call(this);
      };
      Object.defineProperty(texture2DProto, 'image', {
        configurable: true,
        enumerable: true,
        get() {
          return this._mipmaps.length === 0 ? null : this._mipmaps[0];
        },
        set(value) {
          this.mipmaps = value ? [value] : [];
        }
      });
      Object.defineProperty(texture2DProto, 'mipmaps', {
        configurable: true,
        enumerable: true,
        get() {
          return this._mipmaps;
        },
        set(arr) {
          for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i]._syncDataToNative();
          }
          this._mipmaps = arr;
          this.setMipmaps(arr);
        }
      });
      cclegacy.Texture2D = jsb.Texture2D;

      // handle meta data, it is generated automatically
      patch_cc_Texture2D({
        Texture2D,
        ImageAsset
      });
    }
  };
});