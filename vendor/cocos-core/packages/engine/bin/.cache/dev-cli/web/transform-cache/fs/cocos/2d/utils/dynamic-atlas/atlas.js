System.register("q-bundled:///fs/cocos/2d/utils/dynamic-atlas/atlas.js", ["../../../asset/assets/asset-enum.js", "../../../asset/assets/texture-2d.js", "../../../gfx/index.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var PixelFormat, Texture2D, BufferTextureCopy, cclegacy, js, warnID, Atlas, DynamicAtlasTexture, space;
  function drawTextureAt(texture, image, x, y) {
    texture.drawTextureAt(image, x, y);
  }
  _export({
    Atlas: void 0,
    DynamicAtlasTexture: void 0
  });
  return {
    setters: [function (_assetAssetsAssetEnumJs) {
      PixelFormat = _assetAssetsAssetEnumJs.PixelFormat;
    }, function (_assetAssetsTexture2dJs) {
      Texture2D = _assetAssetsTexture2dJs.Texture2D;
    }, function (_gfxIndexJs) {
      BufferTextureCopy = _gfxIndexJs.BufferTextureCopy;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      warnID = _coreIndexJs.warnID;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      space = 2;
      _export("Atlas", Atlas = class Atlas {
        constructor(width, height) {
          this._innerTextureInfos = {};
          this._innerSpriteFrames = [];
          this._count = 0;
          const texture = new DynamicAtlasTexture();
          texture.initWithSize(width, height);
          this._texture = texture;
          this._width = width;
          this._height = height;
          this._x = space;
          this._y = space;
          this._nextY = space;
        }

        /**
         * @en
         * Append a sprite frame into the dynamic atlas.
         *
         * @zh
         * 添加碎图进入动态图集。
         *
         * @method insertSpriteFrame
         * @param spriteFrame  the sprite frame that will be inserted in the atlas.
         */
        insertSpriteFrame(spriteFrame) {
          const rect = spriteFrame.rect;
          // Todo:No renderTexture
          const texture = spriteFrame.texture;
          const info = this._innerTextureInfos[texture.getId()];
          let sx = rect.x;
          let sy = rect.y;
          if (info) {
            sx += info.x;
            sy += info.y;
          } else {
            const width = texture.width;
            const height = texture.height;
            if (this._x + width + space > this._width) {
              this._x = space;
              this._y = this._nextY;
            }
            if (this._y + height + space > this._nextY) {
              this._nextY = this._y + height + space;
            }
            if (this._nextY > this._height) {
              return null;
            }
            const thisTexture = this._texture;
            const image = texture.image;
            if (cclegacy.internal.dynamicAtlasManager.textureBleeding) {
              // Smaller frame is more likely to be affected by linear filter
              if (width <= 8 || height <= 8) {
                drawTextureAt(thisTexture, image, this._x - 1, this._y - 1);
                drawTextureAt(thisTexture, image, this._x - 1, this._y + 1);
                drawTextureAt(thisTexture, image, this._x + 1, this._y - 1);
                drawTextureAt(thisTexture, image, this._x + 1, this._y + 1);
              }
              drawTextureAt(thisTexture, image, this._x - 1, this._y);
              drawTextureAt(thisTexture, image, this._x + 1, this._y);
              drawTextureAt(thisTexture, image, this._x, this._y - 1);
              drawTextureAt(thisTexture, image, this._x, this._y + 1);
            }
            drawTextureAt(thisTexture, image, this._x, this._y);
            this._innerTextureInfos[texture.getId()] = {
              x: this._x,
              y: this._y,
              texture
            };
            this._count++;
            sx += this._x;
            sy += this._y;
            this._x += width + space;
          }
          const frame = {
            x: sx,
            y: sy,
            texture: this._texture
          };
          this._innerSpriteFrames.push(spriteFrame);
          return frame;
        }
        removeSpriteFrame(spriteFrame) {
          js.array.fastRemove(this._innerSpriteFrames, spriteFrame);
        }

        /**
         * @en
         * Delete a texture from the atlas.
         *
         * @zh
         * 从动态图集中删除某张纹理。
         *
         * @method deleteAtlasTexture
         * @param texture  the texture that will be removed from the atlas.
         */
        deleteInnerTexture(texture) {
          if (texture && this._innerTextureInfos[texture.getId()]) {
            delete this._innerTextureInfos[texture.getId()];
            this._count--;
          }
        }

        /**
         * @en
         * Whether the atlas is empty.
         *
         * @zh
         * 图集是否为空图集。
         *
         * @method isEmpty
         */
        isEmpty() {
          return this._count <= 0;
        }

        /**
         * @en
         * Reset the dynamic atlas.
         *
         * @zh
         * 重置该动态图集。
         *
         * @method reset
        */
        reset() {
          this._x = space;
          this._y = space;
          this._nextY = space;
          const frames = this._innerSpriteFrames;
          for (let i = 0, l = frames.length; i < l; i++) {
            const frame = frames[i];
            if (!frame.isValid) {
              continue;
            }
            frame._resetDynamicAtlasFrame();
          }
          this._innerSpriteFrames.length = 0;
          this._innerTextureInfos = {};
        }

        /**
         * @en
         * Reset the dynamic atlas, and destroy the texture of the atlas.
         *
         * @zh
         * 重置该动态图集，并销毁该图集的纹理。
         *
         * @method destroy
        */
        destroy() {
          this.reset();
          this._texture.destroy();
        }
      });
      _export("DynamicAtlasTexture", DynamicAtlasTexture = class DynamicAtlasTexture extends Texture2D {
        /**
         * @en
         * Initialize the render texture.
         *
         * @zh
         * 初始化 render texture。
         *
         * @method initWithSize
         */
        initWithSize(width, height, format = PixelFormat.RGBA8888) {
          this.reset({
            width,
            height,
            format
          });
        }

        /**
         * @en
         * Draw a texture to the specified position.
         *
         * @zh
         * 将指定的图片渲染到指定的位置上。
         *
         * @method drawTextureAt
         * @param {Texture2D} image
         * @param {Number} x
         * @param {Number} y
         */
        drawTextureAt(image, x, y) {
          const gfxTexture = this.getGFXTexture();
          if (!image || !gfxTexture) {
            return;
          }
          const gfxDevice = this._getGFXDevice();
          if (!gfxDevice) {
            warnID(16363);
            return;
          }
          const region = new BufferTextureCopy();
          region.texOffset.x = x;
          region.texOffset.y = y;
          region.texExtent.width = image.width;
          region.texExtent.height = image.height;
          gfxDevice.copyTexImagesToTexture([image.data], gfxTexture, [region]);
        }
      });
    }
  };
});