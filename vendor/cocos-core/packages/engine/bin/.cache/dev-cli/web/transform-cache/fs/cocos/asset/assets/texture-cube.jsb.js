System.register("q-bundled:///fs/cocos/asset/assets/texture-cube.jsb.js", ["./asset-enum.js", "../../core/index.js", "./simple-texture.js", "../../../../virtual/internal%253Aconstants.js", "../../native-binding/decorators.js"], function (_export, _context) {
  "use strict";

  var TextureFilter, PixelFormat, WrapMode, js, cclegacy, EDITOR, NODEJS, TEST, patch_cc_TextureCube, textureCubeProto, FaceIndex, MipmapMode, TextureCube, oldOnLoaded;
  return {
    setters: [function (_assetEnumJs) {
      TextureFilter = _assetEnumJs.TextureFilter;
      PixelFormat = _assetEnumJs.PixelFormat;
      WrapMode = _assetEnumJs.WrapMode;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_simpleTextureJs) {}, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_TextureCube = _nativeBindingDecoratorsJs.patch_cc_TextureCube;
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
      textureCubeProto = jsb.TextureCube.prototype;
      FaceIndex = /*#__PURE__*/function (FaceIndex) {
        FaceIndex[FaceIndex["right"] = 0] = "right";
        FaceIndex[FaceIndex["left"] = 1] = "left";
        FaceIndex[FaceIndex["top"] = 2] = "top";
        FaceIndex[FaceIndex["bottom"] = 3] = "bottom";
        FaceIndex[FaceIndex["front"] = 4] = "front";
        FaceIndex[FaceIndex["back"] = 5] = "back";
        return FaceIndex;
      }(FaceIndex || {});
      MipmapMode = /*#__PURE__*/function (MipmapMode) {
        MipmapMode[MipmapMode["NONE"] = 0] = "NONE";
        MipmapMode[MipmapMode["AUTO"] = 1] = "AUTO";
        MipmapMode[MipmapMode["BAKED_CONVOLUTION_MAP"] = 2] = "BAKED_CONVOLUTION_MAP";
        return MipmapMode;
      }(MipmapMode || {});
      textureCubeProto.createNode = null;
      _export("TextureCube", TextureCube = jsb.TextureCube);
      TextureCube.Filter = TextureFilter;
      TextureCube.PixelFormat = PixelFormat;
      TextureCube.WrapMode = WrapMode;
      textureCubeProto._ctor = function () {
        jsb.SimpleTexture.prototype._ctor.apply(this, arguments);
        this._mipmaps = null;
        this._mipmapAtlas = null;
      };
      Object.defineProperty(textureCubeProto, 'mipmaps', {
        get() {
          return this._mipmaps;
        },
        set(value) {
          this._mipmaps = value;
          this.setMipmaps(value);
        }
      });
      Object.defineProperty(textureCubeProto, 'image', {
        get() {
          return this._mipmaps.length === 0 ? null : this._mipmaps[0];
        },
        set(value) {
          this.mipmaps = value ? [value] : [];
        }
      });
      oldOnLoaded = textureCubeProto.onLoaded;
      textureCubeProto.onLoaded = function () {
        if (this._mipmapMode === MipmapMode.BAKED_CONVOLUTION_MAP) {
          this.setMipmapAtlasForJS(this._mipmapAtlas);
        } else {
          this.setMipmapsForJS(this._mipmaps);
        }
        oldOnLoaded.apply(this);
      };
      textureCubeProto._serialize = function (ctxForExporting) {
        if (EDITOR || TEST || NODEJS) {
          if (this._mipmapMode === MipmapMode.BAKED_CONVOLUTION_MAP) {
            const atlas = this._mipmapAtlas.atlas;
            let uuids = {};
            if (ctxForExporting && ctxForExporting._compressUuid) {
              uuids = {
                front: EditorExtends.UuidUtils.compressUuid(atlas.front._uuid, true),
                back: EditorExtends.UuidUtils.compressUuid(atlas.back._uuid, true),
                left: EditorExtends.UuidUtils.compressUuid(atlas.left._uuid, true),
                right: EditorExtends.UuidUtils.compressUuid(atlas.right._uuid, true),
                top: EditorExtends.UuidUtils.compressUuid(atlas.top._uuid, true),
                bottom: EditorExtends.UuidUtils.compressUuid(atlas.bottom._uuid, true)
              };
            } else {
              uuids = {
                front: atlas.front._uuid,
                back: atlas.back._uuid,
                left: atlas.left._uuid,
                right: atlas.right._uuid,
                top: atlas.top._uuid,
                bottom: atlas.bottom._uuid
              };
            }
            return {
              base: jsb.TextureBase.prototype._serialize(ctxForExporting),
              rgbe: this.isRGBE,
              mipmapMode: this._mipmapMode,
              mipmapAtlas: uuids,
              mipmapLayout: this._mipmapAtlas.layout
            };
          } else {
            return {
              base: jsb.TextureBase.prototype._serialize(ctxForExporting),
              rgbe: this.isRGBE,
              mipmaps: this._mipmaps.map(mipmap => ctxForExporting && ctxForExporting._compressUuid ? {
                front: EditorExtends.UuidUtils.compressUuid(mipmap.front._uuid, true),
                back: EditorExtends.UuidUtils.compressUuid(mipmap.back._uuid, true),
                left: EditorExtends.UuidUtils.compressUuid(mipmap.left._uuid, true),
                right: EditorExtends.UuidUtils.compressUuid(mipmap.right._uuid, true),
                top: EditorExtends.UuidUtils.compressUuid(mipmap.top._uuid, true),
                bottom: EditorExtends.UuidUtils.compressUuid(mipmap.bottom._uuid, true)
              } : {
                front: mipmap.front._uuid,
                back: mipmap.back._uuid,
                left: mipmap.left._uuid,
                right: mipmap.right._uuid,
                top: mipmap.top._uuid,
                bottom: mipmap.bottom._uuid
              })
            };
          }
        }
        return null;
      };
      textureCubeProto._deserialize = function (serializedData, handle) {
        const data = serializedData;
        jsb.TextureBase.prototype._deserialize.call(this, data.base, handle);
        this.isRGBE = data.rgbe;
        if (data.mipmapMode != undefined) {
          this._mipmapMode = data.mipmapMode;
        }
        if (this._mipmapMode === MipmapMode.BAKED_CONVOLUTION_MAP) {
          const mipmapAtlas = data.mipmapAtlas;
          const mipmapLayout = data.mipmapLayout;
          this._mipmapAtlas = {
            atlas: {},
            layout: mipmapLayout
          };
          this._mipmapAtlas.atlas = {
            front: new jsb.ImageAsset(),
            back: new jsb.ImageAsset(),
            left: new jsb.ImageAsset(),
            right: new jsb.ImageAsset(),
            top: new jsb.ImageAsset(),
            bottom: new jsb.ImageAsset()
          };
          if (mipmapAtlas) {
            const imageAssetClassId = js.getClassId(jsb.ImageAsset);
            handle.result.push(this._mipmapAtlas.atlas, `front`, mipmapAtlas.front, imageAssetClassId);
            handle.result.push(this._mipmapAtlas.atlas, `back`, mipmapAtlas.back, imageAssetClassId);
            handle.result.push(this._mipmapAtlas.atlas, `left`, mipmapAtlas.left, imageAssetClassId);
            handle.result.push(this._mipmapAtlas.atlas, `right`, mipmapAtlas.right, imageAssetClassId);
            handle.result.push(this._mipmapAtlas.atlas, `top`, mipmapAtlas.top, imageAssetClassId);
            handle.result.push(this._mipmapAtlas.atlas, `bottom`, mipmapAtlas.bottom, imageAssetClassId);
          }
        } else {
          this._mipmaps = new Array(data.mipmaps.length);
          for (let i = 0; i < data.mipmaps.length; ++i) {
            // Prevent resource load failed
            this._mipmaps[i] = {
              front: new jsb.ImageAsset(),
              back: new jsb.ImageAsset(),
              left: new jsb.ImageAsset(),
              right: new jsb.ImageAsset(),
              top: new jsb.ImageAsset(),
              bottom: new jsb.ImageAsset()
            };
            const mipmap = data.mipmaps[i];
            const imageAssetClassId = js.getClassId(jsb.ImageAsset);
            handle.result.push(this._mipmaps[i], `front`, mipmap.front, imageAssetClassId);
            handle.result.push(this._mipmaps[i], `back`, mipmap.back, imageAssetClassId);
            handle.result.push(this._mipmaps[i], `left`, mipmap.left, imageAssetClassId);
            handle.result.push(this._mipmaps[i], `right`, mipmap.right, imageAssetClassId);
            handle.result.push(this._mipmaps[i], `top`, mipmap.top, imageAssetClassId);
            handle.result.push(this._mipmaps[i], `bottom`, mipmap.bottom, imageAssetClassId);
          }
        }
      };
      cclegacy.TextureCube = jsb.TextureCube;

      // handle meta data, it is generated automatically
      patch_cc_TextureCube({
        TextureCube,
        MipmapMode
      });
    }
  };
});