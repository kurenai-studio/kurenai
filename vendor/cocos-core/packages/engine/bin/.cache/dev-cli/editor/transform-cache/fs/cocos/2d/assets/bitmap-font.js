System.register("q-bundled:///fs/cocos/2d/assets/bitmap-font.js", ["../../core/data/decorators/index.js", "./font.js", "./sprite-frame.js", "../../core/index.js", "../utils/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, editable, Font, SpriteFrame, cclegacy, js, warnID, getSymbolCodeAt, FontLetterDefinition, FontAtlas, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, BitmapFont;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export({
    FontLetterDefinition: void 0,
    FontAtlas: void 0
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_fontJs) {
      Font = _fontJs.Font;
    }, function (_spriteFrameJs) {
      SpriteFrame = _spriteFrameJs.SpriteFrame;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      warnID = _coreIndexJs.warnID;
    }, function (_utilsIndexJs) {
      getSymbolCodeAt = _utilsIndexJs.getSymbolCodeAt;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      _export("FontLetterDefinition", FontLetterDefinition = class FontLetterDefinition {
        constructor() {
          this.u = 0;
          this.v = 0;
          this.w = 0;
          this.h = 0;
          this.offsetX = 0;
          this.offsetY = 0;
          this.valid = false;
          this.xAdvance = 0;
        }
      });
      _export("FontAtlas", FontAtlas = class FontAtlas {
        constructor(texture) {
          this.letterDefinitions = {};
          this._texture = null;
          this.texture = texture;
        }
        set texture(texture) {
          const oldTexture = this._texture;
          if (oldTexture === texture) return;
          if (oldTexture) {
            oldTexture.decRef(false);
            if (oldTexture.refCount <= 0) {
              oldTexture.destroy();
            }
          }
          if (texture) {
            texture.addRef();
          }
          this._texture = texture;
        }
        get texture() {
          return this._texture;
        }
        addLetterDefinitions(letter, letterDefinition) {
          this.letterDefinitions[letter] = letterDefinition;
        }
        cloneLetterDefinition() {
          const copyLetterDefinitions = {};
          for (const key in this.letterDefinitions) {
            const value = new FontLetterDefinition();
            js.mixin(value, this.letterDefinitions[key]);
            copyLetterDefinitions[key] = value;
          }
          return copyLetterDefinitions;
        }
        getTexture() {
          return this._texture;
        }
        getLetter(key) {
          return this.letterDefinitions[key];
        }
        getLetterDefinitionForChar(char, labelInfo) {
          const key = getSymbolCodeAt(char, 0);
          const hasKey = Object.prototype.hasOwnProperty.call(this.letterDefinitions, key);
          let letter = null;
          if (hasKey) {
            letter = this.letterDefinitions[key];
          }
          return letter;
        }
        clear() {
          this.letterDefinitions = {};
        }
      });
      /**
       * @en Class for BitmapFont handling.
       * @zh 位图字体资源类。
       */
      _export("BitmapFont", BitmapFont = (_dec = ccclass('cc.BitmapFont'), _dec2 = type(SpriteFrame), _dec(_class = (_class2 = class BitmapFont extends Font {
        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */

        constructor() {
          super();
          /**
           * @deprecated since v3.7.0, Useless Code.
           */
          _initializerDefineProperty(this, "fntDataStr", _descriptor, this);
          /**
           * @en [[SpriteFrame]] of the bitmap font.
           * @zh 位图字体所使用的精灵。
           */
          _initializerDefineProperty(this, "spriteFrame", _descriptor2, this);
          /**
           * @en The font size.
           * @zh 文字尺寸。
           */
          _initializerDefineProperty(this, "fontSize", _descriptor3, this);
          /**
           * @en Font configuration.
           * @zh 字体配置。
           */
          _initializerDefineProperty(this, "fntConfig", _descriptor4, this);
        }
        onLoaded() {
          const spriteFrame = this.spriteFrame;
          if (!this.fontDefDictionary && spriteFrame) {
            this.fontDefDictionary = new FontAtlas(spriteFrame.texture);
          }
          const fntConfig = this.fntConfig;
          if (!fntConfig) {
            warnID(16376);
            return;
          }
          const fontDict = fntConfig.fontDefDictionary;
          for (const fontDef in fontDict) {
            const info = fontDict[fontDef];
            const letter = new FontLetterDefinition();
            const rect = info.rect;
            letter.offsetX = info.xOffset;
            letter.offsetY = info.yOffset;
            letter.w = rect.width;
            letter.h = rect.height;
            letter.u = rect.x;
            letter.v = rect.y;
            letter.valid = true;
            letter.xAdvance = info.xAdvance;
            this.fontDefDictionary.addLetterDefinitions(fontDef, letter);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "fntDataStr", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "spriteFrame", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fontSize", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "fntConfig", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      cclegacy.BitmapFont = BitmapFont;
    }
  };
});