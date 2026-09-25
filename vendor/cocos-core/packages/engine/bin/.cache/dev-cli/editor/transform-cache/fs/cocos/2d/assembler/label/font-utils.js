System.register("q-bundled:///fs/cocos/2d/assembler/label/font-utils.js", ["../../../../../virtual/internal%253Aconstants.js", "../../assets/bitmap-font.js", "../../../core/index.js", "../../../asset/assets/index.js", "../../../asset/assets/asset-enum.js", "../../../gfx/index.js", "../../utils/text-utils.js", "../../../game/director.js", "../../../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var JSB, FontAtlas, FontLetterDefinition, Color, macro, warnID, ImageAsset, Texture2D, PixelFormat, BufferTextureCopy, safeMeasureText, BASELINE_RATIO, MIDDLE_RATIO, getBaselineOffset, getSymbolCodeAt, director, DirectorEvent, ccwindow, CanvasPool, LetterTexture, LetterRenderTexture, LetterAtlas, _canvasPool, WHITE, space, bleed, _backgroundStyle, BASELINE_OFFSET, shareLabelInfo;
  function computeHash(labelInfo) {
    const hashData = '';
    const color = labelInfo.color.toHEX();
    let out = '';
    if (labelInfo.isOutlined && labelInfo.margin > 0) {
      out = out + labelInfo.margin + labelInfo.out.toHEX();
    }
    return hashData + labelInfo.fontSize + labelInfo.fontFamily + color + out;
  }
  _export({
    CanvasPool: void 0,
    LetterRenderTexture: void 0,
    LetterAtlas: void 0,
    computeHash: computeHash
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_assetsBitmapFontJs) {
      FontAtlas = _assetsBitmapFontJs.FontAtlas;
      FontLetterDefinition = _assetsBitmapFontJs.FontLetterDefinition;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      macro = _coreIndexJs.macro;
      warnID = _coreIndexJs.warnID;
    }, function (_assetAssetsIndexJs) {
      ImageAsset = _assetAssetsIndexJs.ImageAsset;
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_assetAssetsAssetEnumJs) {
      PixelFormat = _assetAssetsAssetEnumJs.PixelFormat;
    }, function (_gfxIndexJs) {
      BufferTextureCopy = _gfxIndexJs.BufferTextureCopy;
    }, function (_utilsTextUtilsJs) {
      safeMeasureText = _utilsTextUtilsJs.safeMeasureText;
      BASELINE_RATIO = _utilsTextUtilsJs.BASELINE_RATIO;
      MIDDLE_RATIO = _utilsTextUtilsJs.MIDDLE_RATIO;
      getBaselineOffset = _utilsTextUtilsJs.getBaselineOffset;
      getSymbolCodeAt = _utilsTextUtilsJs.getSymbolCodeAt;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
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
      _export("CanvasPool", CanvasPool = class CanvasPool {
        static getInstance() {
          if (!_canvasPool) {
            _canvasPool = new CanvasPool();
          }
          return _canvasPool;
        }
        constructor() {
          this.pool = [];
        }
        get() {
          let data = this.pool.pop();
          if (!data) {
            const canvas = ccwindow.document.createElement('canvas');
            const context = canvas.getContext('2d');
            data = {
              canvas,
              context
            };
          }
          return data;
        }
        put(canvas) {
          if (this.pool.length >= macro.MAX_LABEL_CANVAS_POOL_SIZE) {
            if (JSB) {
              const c = canvas.canvas;
              if (c && c._destroy) {
                c._destroy();
              }
              canvas.canvas = null;
              canvas.context = null;
            }
            return;
          }
          this.pool.push(canvas);
        }
      }); // export function packToDynamicAtlas(comp, frame) {
      //     // TODO: Material API design and export from editor could affect the material activation process
      //     // need to update the logic here
      //     if (frame && !TEST) {
      //         if (!frame._original && dynamicAtlasManager) {
      //             let packedFrame = dynamicAtlasManager.insertSpriteFrame(frame);
      //             if (packedFrame) {
      //                 frame._setDynamicAtlasFrame(packedFrame);
      //             }
      //         }
      //         if (comp.sharedMaterials[0].getProperty('texture') !== frame._texture) {
      //             comp._activateMaterial();
      //         }
      //     }
      // }
      WHITE = Color.WHITE.clone();
      space = 0;
      bleed = 2;
      _backgroundStyle = `rgba(255, 255, 255, ${(1 / 255).toFixed(3)})`;
      BASELINE_OFFSET = getBaselineOffset();
      LetterTexture = class LetterTexture {
        constructor(char, labelInfo) {
          this.image = null;
          this.data = null;
          this.canvas = null;
          this.context = null;
          this.width = 0;
          this.height = 0;
          this.offsetY = 0;
          this.char = char;
          this.labelInfo = labelInfo;
          this.hash = `${getSymbolCodeAt(char, 0)}${labelInfo.hash}`;
        }
        updateRenderData() {
          this._updateProperties();
          this._updateTexture();
        }
        destroy() {
          this.image = null;
          CanvasPool.getInstance().put(this.data);
          this.data = null;
        }
        _updateProperties() {
          this.data = CanvasPool.getInstance().get();
          this.canvas = this.data.canvas;
          this.context = this.data.context;
          if (this.context) {
            const fontScale = this.labelInfo.fontScale;
            this.context.font = this.labelInfo.fontDesc;
            const width = safeMeasureText(this.context, this.char, this.labelInfo.fontDesc);
            const blank = this.labelInfo.margin * 2 + bleed;
            this.width = parseFloat(width.toFixed(2)) * fontScale + blank;
            this.height = (1 + BASELINE_RATIO) * this.labelInfo.fontSize * fontScale + blank;
            this.offsetY = -(this.labelInfo.fontSize * BASELINE_RATIO) * fontScale / 2;
          }
          if (this.canvas.width !== this.width) {
            this.canvas.width = this.width;
          }
          if (this.canvas.height !== this.height) {
            this.canvas.height = this.height;
          }
          if (!this.image) {
            this.image = new ImageAsset();
          }
          this.image.reset(this.canvas);
        }
        _updateTexture() {
          if (!this.context || !this.canvas) {
            return;
          }
          const context = this.context;
          const labelInfo = this.labelInfo;
          const width = this.canvas.width;
          const height = this.canvas.height;
          const fontScale = labelInfo.fontScale;
          context.textAlign = 'center';
          context.textBaseline = 'alphabetic';
          context.clearRect(0, 0, width, height);
          // Add a white background to avoid black edges.
          context.fillStyle = _backgroundStyle;
          context.fillRect(0, 0, width, height);
          context.font = labelInfo.fontDesc.replace(/(\d+)(\.\d+)?(px|em|rem|pt)/g, (w, m, n, u) => (+m * fontScale + (+n || 0) * fontScale).toString() + u);
          const fontSize = labelInfo.fontSize * fontScale;
          const startX = width / 2;
          const startY = height / 2 + fontSize * MIDDLE_RATIO + fontSize * BASELINE_OFFSET;
          const color = labelInfo.color;
          // use round for line join to avoid sharp intersect point
          context.lineJoin = 'round';
          context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${1})`;
          if (labelInfo.isOutlined) {
            const strokeColor = labelInfo.out || WHITE;
            context.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
            context.lineWidth = labelInfo.margin * 2 * fontScale;
            context.strokeText(this.char, startX, startY);
          }
          context.fillText(this.char, startX, startY);

          // this.texture.handleLoadedTexture();
          // (this.image as Texture2D).updateImage();
        }
      };
      _export("LetterRenderTexture", LetterRenderTexture = class LetterRenderTexture extends Texture2D {
        /**
         * @en
         * Init the render texture with size.
         * @zh
         * 初始化 render texture。
         * @param [width]
         * @param [height]
         * @param [string]
         */
        initWithSize(width, height, format = PixelFormat.RGBA8888) {
          this.reset({
            width,
            height,
            format
          });
        }

        /**
         * @en Draw a texture to the specified position
         * @zh 将指定的图片渲染到指定的位置上。
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
      _export("LetterAtlas", LetterAtlas = class LetterAtlas {
        get width() {
          return this._width;
        }
        get height() {
          return this._height;
        }
        constructor(width, height) {
          this._x = space;
          this._y = space;
          this._nextY = space;
          this._width = 0;
          this._height = 0;
          this._halfBleed = 0;
          this._dirty = false;
          const texture = new LetterRenderTexture();
          texture.initWithSize(width, height);
          this.fontDefDictionary = new FontAtlas(texture);
          this._halfBleed = bleed / 2;
          this._width = width;
          this._height = height;
          director.on(DirectorEvent.BEFORE_SCENE_LAUNCH, this.beforeSceneLoad, this);
        }
        insertLetterTexture(letterTexture) {
          const img = letterTexture.image;
          const device = director.root.device;
          if (!img || !this.fontDefDictionary || !device) {
            return null;
          }
          const width = img.width;
          const height = img.height;
          if (this._x + width + space > this._width) {
            this._x = space;
            this._y = this._nextY;
          }
          if (this._y + height > this._nextY) {
            this._nextY = this._y + height + space;
          }
          if (this._nextY > this._height) {
            warnID(12100);
            return null;
          }
          if (!this.fontDefDictionary.texture) {
            return null;
          }
          const rt = this.fontDefDictionary.texture;
          rt.drawTextureAt(img, this._x, this._y);
          this._dirty = true;
          const letterDefinition = new FontLetterDefinition();
          letterDefinition.u = this._x + this._halfBleed;
          letterDefinition.v = this._y + this._halfBleed;
          letterDefinition.valid = true;
          letterDefinition.w = letterTexture.width - bleed;
          letterDefinition.h = letterTexture.height - bleed;
          letterDefinition.xAdvance = letterDefinition.w;
          letterDefinition.offsetY = letterTexture.offsetY;
          this._x += width + space;
          this.fontDefDictionary.addLetterDefinitions(letterTexture.hash, letterDefinition);
          /*
          const region = new BufferTextureCopy();
          region.texOffset.x = letterDefinition.offsetX;
          region.texOffset.y = letterDefinition.offsetY;
          region.texExtent.width = letterDefinition.w;
          region.texExtent.height = letterDefinition.h;
          */

          return letterDefinition;
        }
        update() {
          if (!this._dirty) {
            return;
          }
          // this.texture.update();
          this._dirty = false;
        }
        reset() {
          this._x = space;
          this._y = space;
          this._nextY = space;

          // const chars = this.letterDefinitions;
          // for (let i = 0, l = (Object.keys(chars)).length; i < l; i++) {
          //     const char = chars[i];
          //     if (!char.valid) {
          //         continue;
          //     }
          //     char.destroy();
          // }

          // this.letterDefinitions = createMap();
          this.fontDefDictionary.clear();
        }
        destroy() {
          this.reset();
          const dict = this.fontDefDictionary;
          if (dict && dict.texture) {
            dict.texture = null;
          }
        }
        getTexture() {
          return this.fontDefDictionary.getTexture();
        }
        beforeSceneLoad() {
          this.clearAllCache();
        }
        clearAllCache() {
          this.destroy();
          const texture = new LetterRenderTexture();
          texture.initWithSize(this._width, this._height);
          this.fontDefDictionary.texture = texture;
        }
        getLetter(key) {
          return this.fontDefDictionary.letterDefinitions[key];
        }
        getLetterDefinitionForChar(char, labelInfo) {
          const hash = getSymbolCodeAt(char, 0) + labelInfo.hash;
          let letter = this.fontDefDictionary.letterDefinitions[hash];
          if (!letter) {
            const temp = new LetterTexture(char, labelInfo);
            temp.updateRenderData();
            letter = this.insertLetterTexture(temp);
            temp.destroy();
          }
          return letter;
        }
      });
      _export("shareLabelInfo", shareLabelInfo = {
        fontAtlas: null,
        fontSize: 0,
        lineHeight: 0,
        hAlign: 0,
        vAlign: 0,
        hash: '',
        fontFamily: '',
        fontDesc: 'Arial',
        color: Color.WHITE.clone(),
        isOutlined: false,
        out: Color.WHITE.clone(),
        margin: 0,
        fontScale: 1
      });
    }
  };
});