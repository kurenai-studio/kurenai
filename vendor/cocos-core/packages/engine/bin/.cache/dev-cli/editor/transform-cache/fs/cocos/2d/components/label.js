System.register("q-bundled:///fs/cocos/2d/components/label.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "pal/minigame", "../assets/index.js", "../../asset/assets/index.js", "../../core/index.js", "../assembler/label/font-utils.js", "../framework/ui-renderer.js", "../../asset/assets/texture-base.js", "../../asset/assets/asset-enum.js", "../../gfx/index.js", "../assembler/label/text-style.js", "../assembler/label/text-layout.js", "../assembler/label/text-output-data.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, displayOrder, visible, multiline, type, serializable, editable, BYTEDANCE, EDITOR, JSB, minigame, BitmapFont, Font, SpriteFrame, ImageAsset, Texture2D, ccenum, cclegacy, Color, Vec2, CanvasPool, InstanceMaterialType, UIRenderer, TextureBase, PixelFormat, BlendFactor, TextStyle, TextLayout, TextOutputLayoutData, TextOutputRenderData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _Label, tempColor, HorizontalTextAlignment, VerticalTextAlignment, Overflow, CacheMode, Label;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      visible = _coreDataDecoratorsIndexJs.visible;
      multiline = _coreDataDecoratorsIndexJs.multiline;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      BYTEDANCE = _virtualInternal253AconstantsJs.BYTEDANCE;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_assetsIndexJs) {
      BitmapFont = _assetsIndexJs.BitmapFont;
      Font = _assetsIndexJs.Font;
      SpriteFrame = _assetsIndexJs.SpriteFrame;
    }, function (_assetAssetsIndexJs) {
      ImageAsset = _assetAssetsIndexJs.ImageAsset;
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
      cclegacy = _coreIndexJs.cclegacy;
      Color = _coreIndexJs.Color;
      Vec2 = _coreIndexJs.Vec2;
    }, function (_assemblerLabelFontUtilsJs) {
      CanvasPool = _assemblerLabelFontUtilsJs.CanvasPool;
    }, function (_frameworkUiRendererJs) {
      InstanceMaterialType = _frameworkUiRendererJs.InstanceMaterialType;
      UIRenderer = _frameworkUiRendererJs.UIRenderer;
    }, function (_assetAssetsTextureBaseJs) {
      TextureBase = _assetAssetsTextureBaseJs.TextureBase;
    }, function (_assetAssetsAssetEnumJs) {
      PixelFormat = _assetAssetsAssetEnumJs.PixelFormat;
    }, function (_gfxIndexJs) {
      BlendFactor = _gfxIndexJs.BlendFactor;
    }, function (_assemblerLabelTextStyleJs) {
      TextStyle = _assemblerLabelTextStyleJs.TextStyle;
    }, function (_assemblerLabelTextLayoutJs) {
      TextLayout = _assemblerLabelTextLayoutJs.TextLayout;
    }, function (_assemblerLabelTextOutputDataJs) {
      TextOutputLayoutData = _assemblerLabelTextOutputDataJs.TextOutputLayoutData;
      TextOutputRenderData = _assemblerLabelTextOutputDataJs.TextOutputRenderData;
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
      tempColor = Color.WHITE.clone();
      /**
       * @en Enum for horizontal text alignment.
       *
       * @zh 文本横向对齐类型。
       */
      _export("HorizontalTextAlignment", HorizontalTextAlignment = /*#__PURE__*/function (HorizontalTextAlignment) {
        /**
         * @en Alignment left for text.
         *
         * @zh 左对齐。
         */
        HorizontalTextAlignment[HorizontalTextAlignment["LEFT"] = 0] = "LEFT";
        /**
         * @en Alignment center for text.
         *
         * @zh 中心对齐。
         */
        HorizontalTextAlignment[HorizontalTextAlignment["CENTER"] = 1] = "CENTER";
        /**
         * @en Alignment right for text.
         *
         * @zh 右对齐。
         */
        HorizontalTextAlignment[HorizontalTextAlignment["RIGHT"] = 2] = "RIGHT";
        return HorizontalTextAlignment;
      }({}));
      ccenum(HorizontalTextAlignment);

      /**
       * @en Enum for vertical text alignment.
       *
       * @zh 文本垂直对齐类型。
       */
      _export("VerticalTextAlignment", VerticalTextAlignment = /*#__PURE__*/function (VerticalTextAlignment) {
        /**
         * @en Alignment top for text.
         *
         * @zh 上对齐。
         */
        VerticalTextAlignment[VerticalTextAlignment["TOP"] = 0] = "TOP";
        /**
         * @en Alignment center for text.
         *
         * @zh 中心对齐。
         */
        VerticalTextAlignment[VerticalTextAlignment["CENTER"] = 1] = "CENTER";
        /**
         * @en Alignment bottom for text.
         *
         * @zh 下对齐。
         */
        VerticalTextAlignment[VerticalTextAlignment["BOTTOM"] = 2] = "BOTTOM";
        return VerticalTextAlignment;
      }({}));
      ccenum(VerticalTextAlignment);

      /**
       * @en Enum for Overflow.
       *
       * @zh 文本溢出行为类型。
       */
      _export("Overflow", Overflow = /*#__PURE__*/function (Overflow) {
        /**
         * @en None.
         *
         * @zh 不做任何限制。
         */
        Overflow[Overflow["NONE"] = 0] = "NONE";
        /**
         * @en In CLAMP mode, when label content goes out of the bounding box, it will be clipped.
         *
         * @zh CLAMP 模式中，当文本内容超出边界框时，多余的会被截断。
         */
        Overflow[Overflow["CLAMP"] = 1] = "CLAMP";
        /**
         * @en In SHRINK mode, the font size will change dynamically to adapt the content size.
         * This mode may takes up more CPU resources when the label is refreshed.
         *
         * @zh SHRINK 模式，字体大小会动态变化，以适应内容大小。这个模式在文本刷新的时候可能会占用较多 CPU 资源。
         */
        Overflow[Overflow["SHRINK"] = 2] = "SHRINK";
        /**
         * @en In RESIZE_HEIGHT mode, you can only change the width of label and the height is changed automatically.
         *
         * @zh 在 RESIZE_HEIGHT 模式下，只能更改文本的宽度，高度是自动改变的。
         */
        Overflow[Overflow["RESIZE_HEIGHT"] = 3] = "RESIZE_HEIGHT";
        return Overflow;
      }({}));
      ccenum(Overflow);

      /**
       * @en Enum for cache mode.
       *
       * @zh 文本图集缓存类型。
       */
      _export("CacheMode", CacheMode = /*#__PURE__*/function (CacheMode) {
        /**
         * @en Do not do any caching.
         *
         * @zh 不做任何缓存。
         */
        CacheMode[CacheMode["NONE"] = 0] = "NONE";
        /**
         * @en In BITMAP mode, cache the label as a static image and add it to the dynamic atlas for batch rendering,
         * and can batching with Sprites using broken images.
         *
         * @zh BITMAP 模式，将 label 缓存成静态图像并加入到动态图集，以便进行批次合并，可与使用碎图的 Sprite 进行合批。
         * （注：动态图集在 Chrome 以及微信小游戏暂时关闭，该功能无效）。
         */
        CacheMode[CacheMode["BITMAP"] = 1] = "BITMAP";
        /**
         * @en In CHAR mode, split text into characters and cache characters into a dynamic atlas which the size of 1024 * 1024.
         *
         * @zh CHAR 模式，将文本拆分为字符，并将字符缓存到一张单独的大小为 1024 * 1024 的图集中进行重复使用，不再使用动态图集。
         * （注：当图集满时将不再进行缓存，暂时不支持 SHRINK 自适应文本尺寸（后续完善））。
         */
        CacheMode[CacheMode["CHAR"] = 2] = "CHAR";
        return CacheMode;
      }({}));
      ccenum(CacheMode);

      /**
       * @en
       * The Label Component.
       *
       * @zh
       * 文字标签组件。
       */
      _export("Label", Label = (_dec = ccclass('cc.Label'), _dec2 = help('i18n:cc.Label'), _dec3 = executionOrder(110), _dec4 = menu('2D/Label'), _dec5 = displayOrder(4), _dec6 = type(HorizontalTextAlignment), _dec7 = displayOrder(5), _dec8 = type(VerticalTextAlignment), _dec9 = displayOrder(6), _dec0 = displayOrder(7), _dec1 = displayOrder(8), _dec10 = visible(function () {
        return !this._isSystemFontUsed && this._font instanceof BitmapFont;
      }), _dec11 = displayOrder(9), _dec12 = type(Overflow), _dec13 = displayOrder(10), _dec14 = displayOrder(11), _dec15 = displayOrder(12), _dec16 = displayOrder(13), _dec17 = visible(function () {
        return this._isSystemFontUsed;
      }), _dec18 = type(Font), _dec19 = displayOrder(13), _dec20 = visible(function () {
        return !this._isSystemFontUsed;
      }), _dec21 = type(CacheMode), _dec22 = displayOrder(14), _dec23 = displayOrder(15), _dec24 = displayOrder(16), _dec25 = displayOrder(17), _dec26 = visible(function () {
        return this._isUnderline;
      }), _dec27 = displayOrder(18), _dec28 = visible(function () {
        return !(this._font instanceof BitmapFont);
      }), _dec29 = displayOrder(19), _dec30 = visible(function () {
        return this._enableOutline && !(this._font instanceof BitmapFont);
      }), _dec31 = displayOrder(20), _dec32 = visible(function () {
        return this._enableOutline && !(this._font instanceof BitmapFont);
      }), _dec33 = displayOrder(21), _dec34 = visible(function () {
        return !(this._font instanceof BitmapFont) && this.cacheMode !== CacheMode.CHAR;
      }), _dec35 = displayOrder(22), _dec36 = visible(function () {
        return this._enableShadow && !(this._font instanceof BitmapFont) && this.cacheMode !== CacheMode.CHAR;
      }), _dec37 = displayOrder(23), _dec38 = visible(function () {
        return this._enableShadow && !(this._font instanceof BitmapFont) && this.cacheMode !== CacheMode.CHAR;
      }), _dec39 = displayOrder(24), _dec40 = visible(function () {
        return this._enableShadow && !(this._font instanceof BitmapFont) && this.cacheMode !== CacheMode.CHAR;
      }), _dec41 = displayOrder(25), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = (_Label = class Label extends UIRenderer {
        /**
         * @en
         * Content string of label.
         *
         * @zh
         * 标签显示的文本内容。
         */
        get string() {
          return this._string;
        }
        set string(value) {
          if (value === null || value === undefined) {
            value = '';
          } else {
            value = value.toString();
          }
          if (this._string === value) {
            return;
          }
          this._string = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Horizontal Alignment of label.
         *
         * @zh
         * 文本内容的水平对齐方式。
         */
        get horizontalAlign() {
          return this._horizontalAlign;
        }
        set horizontalAlign(value) {
          if (this._horizontalAlign === value) {
            return;
          }
          this._horizontalAlign = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Vertical Alignment of label.
         *
         * @zh
         * 文本内容的垂直对齐方式。
         */
        get verticalAlign() {
          return this._verticalAlign;
        }
        set verticalAlign(value) {
          if (this._verticalAlign === value) {
            return;
          }
          this._verticalAlign = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * The actual rendering font size in shrink mode.
         *
         * @zh
         * SHRINK 模式下面文本实际渲染的字体大小。
         */
        get actualFontSize() {
          return this._actualFontSize;
        }
        set actualFontSize(value) {
          this._actualFontSize = value;
        }

        /**
         * @en
         * Font size of label.
         *
         * @zh
         * 文本字体大小。
         */
        get fontSize() {
          return this._fontSize;
        }
        set fontSize(value) {
          if (this._fontSize === value) {
            return;
          }
          this._fontSize = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Line Height of label.
         *
         * @zh
         * 文本行高。
         */
        get lineHeight() {
          return this._lineHeight;
        }
        set lineHeight(value) {
          if (this._lineHeight === value) {
            return;
          }
          this._lineHeight = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * The spacing between text characters, only available in BMFont.
         *
         * @zh
         * 文本字符之间的间距。仅在使用 BMFont 位图字体时生效。
         */
        get spacingX() {
          return this._spacingX;
        }
        set spacingX(value) {
          if (this._spacingX === value) {
            return;
          }
          this._spacingX = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Overflow of label.
         *
         * @zh
         * 文字显示超出范围时的处理方式。
         */
        get overflow() {
          return this._overflow;
        }
        set overflow(value) {
          if (this._overflow === value) {
            return;
          }
          this._overflow = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Whether auto wrap label when string width is large than label width.
         *
         * @zh
         * 是否自动换行。
         */
        get enableWrapText() {
          return this._enableWrapText;
        }
        set enableWrapText(value) {
          if (this._enableWrapText === value) {
            return;
          }
          this._enableWrapText = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Whether use system font name or not.
         *
         * @zh
         * 是否使用系统字体。
         */
        get useSystemFont() {
          return this._isSystemFontUsed;
        }
        set useSystemFont(value) {
          if (this._isSystemFontUsed === value) {
            return;
          }
          this.destroyRenderData();
          if (EDITOR) {
            if (!value && this._isSystemFontUsed && this._userDefinedFont) {
              this.font = this._userDefinedFont;
              this.spacingX = this._spacingX;
              return;
            }
          }
          this._isSystemFontUsed = !!value;
          if (value) {
            this.font = null;
          }
          this._flushAssembler();
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Font family of label, only take effect when useSystemFont property is true.
         *
         * @zh
         * 文本字体名称, 只在 useSystemFont 属性为 true 的时候生效。
         */
        get fontFamily() {
          return this._fontFamily;
        }
        set fontFamily(value) {
          if (this._fontFamily === value) {
            return;
          }
          this._fontFamily = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * The font of label.
         *
         * @zh
         * 文本字体。
         */
        get font() {
          // return this._N$file;
          return this._font;
        }
        set font(value) {
          if (this._font === value) {
            return;
          }

          // if delete the font, we should change isSystemFontUsed to true
          this._isSystemFontUsed = !value;
          if (EDITOR) {
            this._userDefinedFont = value;
          }

          // this._N$file = value;
          this._font = value;
          // if (value && this._isSystemFontUsed)
          //     this._isSystemFontUsed = false;

          this.destroyRenderData();
          this._fontAtlas = null;
          this.updateRenderData(true);
        }

        /**
         * @en
         * The cache mode of label. This mode only supports system fonts.
         *
         * @zh
         * 文本缓存模式, 该模式只支持系统字体。
         */
        get cacheMode() {
          return this._cacheMode;
        }
        set cacheMode(value) {
          const oldCacheMode = this._cacheMode;
          if (oldCacheMode === value) {
            return;
          }
          if (oldCacheMode === CacheMode.BITMAP && !(this._font instanceof BitmapFont) && this._ttfSpriteFrame) {
            this._ttfSpriteFrame._resetDynamicAtlasFrame();
          }
          if (oldCacheMode === CacheMode.CHAR) {
            this._ttfSpriteFrame = null;
            this.destroyLetterTexture();
          }
          this._cacheMode = value;
          this.updateRenderData(true);
        }

        /**
         * @en
         * Whether the font is bold.
         *
         * @zh
         * 字体是否加粗。
         */
        get isBold() {
          return this._isBold;
        }
        set isBold(value) {
          if (this._isBold === value) {
            return;
          }
          this._isBold = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Whether the font is italic.
         *
         * @zh
         * 字体是否倾斜。
         */
        get isItalic() {
          return this._isItalic;
        }
        set isItalic(value) {
          if (this._isItalic === value) {
            return;
          }
          this._isItalic = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Whether the font is underline.
         *
         * @zh
         * 字体是否加下划线。
         */
        get isUnderline() {
          return this._isUnderline;
        }
        set isUnderline(value) {
          if (this._isUnderline === value) {
            return;
          }
          this._isUnderline = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en The height of underline.
         * @zh 下划线高度。
         */
        get underlineHeight() {
          return this._underlineHeight;
        }
        set underlineHeight(value) {
          if (this._underlineHeight === value) return;
          this._underlineHeight = value;
          this._markForUpdateRenderData();
        }

        /**
         ** @en
         ** Outline effect used to change the display, only for system fonts or TTF fonts.
         **
         ** @zh
         ** 描边效果组件,用于字体描边,只能用于系统字体或 ttf 字体。
         **/
        get enableOutline() {
          return this._enableOutline;
        }
        set enableOutline(value) {
          if (this._enableOutline === value) return;
          this._enableOutline = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Outline color.
         *
         * @zh
         * 改变描边的颜色。
         */
        get outlineColor() {
          return this._outlineColor;
        }
        set outlineColor(value) {
          if (this._outlineColor === value) return;
          this._outlineColor.set(value);
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Change the outline width.
         *
         * @zh
         * 改变描边的宽度。
         */
        get outlineWidth() {
          return this._outlineWidth;
        }
        set outlineWidth(value) {
          if (this._outlineWidth === value) return;
          this._outlineWidth = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en Shadow effect for Label component, only for system fonts or TTF fonts. Disabled when cache mode is char.
         * @zh 用于给 Label 组件添加阴影效果，只能用于系统字体或 ttf 字体。在缓存模式为 char 时不可用。
         */
        get enableShadow() {
          return this._enableShadow;
        }
        set enableShadow(value) {
          if (this._enableShadow === value) return;
          this._enableShadow = value;
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Shadow color.
         *
         * @zh
         * 阴影的颜色。
         */
        get shadowColor() {
          return this._shadowColor;
        }
        set shadowColor(value) {
          if (this._shadowColor === value) return;
          this._shadowColor.set(value);
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Offset between font and shadow.
         *
         * @zh
         * 字体与阴影的偏移。
         */
        get shadowOffset() {
          return this._shadowOffset;
        }
        set shadowOffset(value) {
          if (this._shadowOffset === value) return;
          this._shadowOffset.set(value);
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * A non-negative float specifying the level of shadow blur.
         *
         * @zh
         * 阴影的模糊程度。
         */
        get shadowBlur() {
          return this._shadowBlur;
        }
        set shadowBlur(value) {
          if (this._shadowBlur === value) return;
          this._shadowBlur = value;
          this._markForUpdateRenderData();
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get spriteFrame() {
          return this._texture;
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get ttfSpriteFrame() {
          return this._ttfSpriteFrame;
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get assemblerData() {
          return this._assemblerData;
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get fontAtlas() {
          return this._fontAtlas;
        }
        set fontAtlas(value) {
          this._fontAtlas = value;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _bmFontOriginalSize() {
          if (this._font instanceof BitmapFont) {
            return this._font.fontSize;
          } else {
            return -1;
          }
        }

        /**
         * @engineInternal
         */
        get textStyle() {
          return this._textStyle;
        }
        /**
         * @engineInternal
         */
        get textLayout() {
          return this._textLayout;
        }
        /**
         * @engineInternal
         */
        get textRenderData() {
          return this._textRenderData;
        }
        /**
         * @engineInternal
         */
        get textLayoutData() {
          return this._textLayoutData;
        }
        /**
         * @engineInternal
         */
        get contentWidth() {
          return this._contentWidth;
        }

        /**
         * @engineInternal
         */
        set contentWidth(val) {
          this._contentWidth = val;
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_string", _descriptor, this);
          _initializerDefineProperty(this, "_horizontalAlign", _descriptor2, this);
          _initializerDefineProperty(this, "_verticalAlign", _descriptor3, this);
          _initializerDefineProperty(this, "_actualFontSize", _descriptor4, this);
          _initializerDefineProperty(this, "_fontSize", _descriptor5, this);
          _initializerDefineProperty(this, "_fontFamily", _descriptor6, this);
          _initializerDefineProperty(this, "_lineHeight", _descriptor7, this);
          _initializerDefineProperty(this, "_overflow", _descriptor8, this);
          _initializerDefineProperty(this, "_enableWrapText", _descriptor9, this);
          _initializerDefineProperty(this, "_font", _descriptor0, this);
          _initializerDefineProperty(this, "_isSystemFontUsed", _descriptor1, this);
          _initializerDefineProperty(this, "_spacingX", _descriptor10, this);
          _initializerDefineProperty(this, "_isItalic", _descriptor11, this);
          _initializerDefineProperty(this, "_isBold", _descriptor12, this);
          _initializerDefineProperty(this, "_isUnderline", _descriptor13, this);
          _initializerDefineProperty(this, "_underlineHeight", _descriptor14, this);
          _initializerDefineProperty(this, "_cacheMode", _descriptor15, this);
          _initializerDefineProperty(this, "_enableOutline", _descriptor16, this);
          _initializerDefineProperty(this, "_outlineColor", _descriptor17, this);
          _initializerDefineProperty(this, "_outlineWidth", _descriptor18, this);
          _initializerDefineProperty(this, "_enableShadow", _descriptor19, this);
          _initializerDefineProperty(this, "_shadowColor", _descriptor20, this);
          _initializerDefineProperty(this, "_shadowOffset", _descriptor21, this);
          _initializerDefineProperty(this, "_shadowBlur", _descriptor22, this);
          // don't need serialize
          // 这个保存了旧项目的 file 数据
          this._N$file = null;
          this._texture = null;
          this._ttfSpriteFrame = null;
          this._userDefinedFont = null;
          this._assemblerData = null;
          this._fontAtlas = null;
          this._letterTexture = null;
          this._contentWidth = 0;
          this._textStyle = null;
          this._textLayout = null;
          this._textRenderData = null;
          this._textLayoutData = null;
          if (EDITOR) {
            this._userDefinedFont = null;
          }
          this._ttfSpriteFrame = null;
          this._textStyle = new TextStyle();
          this._textLayout = new TextLayout();
          this._textLayoutData = new TextOutputLayoutData();
          this._textRenderData = new TextOutputRenderData();
        }
        onEnable() {
          super.onEnable();

          // TODO: Hack for barbarians
          if (!this._font && !this._isSystemFontUsed) {
            this.useSystemFont = true;
          }
          // Reapply default font family if necessary
          if (this._isSystemFontUsed && !this._fontFamily) {
            this.fontFamily = 'Arial';
          }
          this._applyFontTexture();
        }
        destroyTtfSpriteFrame() {
          if (!this._ttfSpriteFrame) {
            return;
          }
          this._ttfSpriteFrame._resetDynamicAtlasFrame();
          const tex = this._ttfSpriteFrame.texture;
          this._ttfSpriteFrame.destroy();
          if (tex) {
            const tex2d = tex;
            if (tex2d.image) {
              tex2d.image.destroy();
            }
            tex.destroy();
          }
          this._ttfSpriteFrame = null;
        }

        // Override
        _onPreDestroy() {
          super._onPreDestroy();
          if (!this._isOnLoadCalled) {
            // If _objFlags does not contain IsOnLoadCalled, it is possible to destroy the ttfSpriteFrame.
            this.destroyTtfSpriteFrame();
          }
        }
        onDestroy() {
          if (this._assembler && this._assembler.resetAssemblerData) {
            this._assembler.resetAssemblerData(this._assemblerData);
          }
          this._assemblerData = null;
          this.destroyTtfSpriteFrame();
          // Don't set null for properties which are init in constructor.
          // this._textStyle = null;
          // this._textLayout = null;
          // this._textRenderData = null;
          // this._textLayoutData = null;

          this.destroyLetterTexture();
          super.onDestroy();
        }
        destroyLetterTexture() {
          const letterTexture = this._letterTexture;
          if (letterTexture) {
            letterTexture.decRef(false);
            if (letterTexture.refCount <= 0) {
              letterTexture.destroy();
            }
          }
          this._letterTexture = null;
        }

        /**
         * @en update render data.
         * @zh 更新渲染相关数据。
         * @param force @en Whether to force an immediate update. @zh 是否立马强制更新渲染数据。
         */
        updateRenderData(force = false) {
          if (force) {
            this._flushAssembler();
            // Hack: Fixed the bug that richText wants to get the label length by _measureText,
            // _assembler.updateRenderData will update the content size immediately.
            if (this.renderData) this.renderData.vertDirty = true;
            this._applyFontTexture();
          }
          if (this._assembler) {
            this._assembler.updateRenderData(this);
          }
        }
        _render(render) {
          render.commitComp(this, this.renderData, this._texture, this._assembler, null);
        }

        // Cannot use the base class methods directly because BMFont and CHAR cannot be updated in assambler with just color.
        _updateColor() {
          super._updateColor();
          this._markForUpdateRenderData();
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setEntityColor(color) {
          if (JSB) {
            if (this._font instanceof BitmapFont) {
              this._renderEntity.color = color;
            } else {
              tempColor.set(255, 255, 255, color.a);
              this._renderEntity.color = tempColor;
            }
          }
        }
        _canRender() {
          if (!super._canRender() || !this._string) {
            return false;
          }
          const font = this._font;
          if (font && font instanceof BitmapFont) {
            const spriteFrame = font.spriteFrame;
            // cannot be activated if texture not loaded yet
            if (!spriteFrame || !spriteFrame.texture) {
              return false;
            }
          }
          return true;
        }
        _flushAssembler() {
          const assembler = Label.Assembler.getAssembler(this);
          if (this._assembler !== assembler) {
            this.destroyRenderData();
            this._assembler = assembler;
            this.textStyle.reset();
            this.textLayout.reset();
            this.textLayoutData.reset();
            this.textRenderData.reset();
          }
          if (!this.renderData) {
            if (this._assembler && this._assembler.createData) {
              this._renderData = this._assembler.createData(this);
              this.renderData.material = this.getRenderMaterial(0);
              this._updateColor();
            }
          }
        }
        _applyFontTexture() {
          this._markForUpdateRenderData();
          const font = this._font;
          if (font instanceof BitmapFont) {
            const spriteFrame = font.spriteFrame;
            if (spriteFrame && spriteFrame.texture) {
              this._texture = spriteFrame;
              if (this.renderData) {
                this.renderData.textureDirty = true;
              }
              this.changeMaterialForDefine();
              if (this._assembler) {
                this._assembler.updateRenderData(this);
              }
            }
          } else {
            if (this.cacheMode === CacheMode.CHAR) {
              const oldLetterTexture = this._letterTexture;
              const letterTexture = this._assembler.getAssemblerData();
              if (letterTexture !== oldLetterTexture) {
                this.destroyLetterTexture();
                if (letterTexture) {
                  letterTexture.addRef();
                }
              }
              this._texture = this._letterTexture = letterTexture;
            } else if (!this._ttfSpriteFrame) {
              this._ttfSpriteFrame = new SpriteFrame();
              this._assemblerData = this._assembler.getAssemblerData();
              const image = new ImageAsset(this._assemblerData.canvas);
              const texture = new Texture2D();
              texture.image = image;
              this._ttfSpriteFrame.texture = texture;
            }
            if (this.cacheMode !== CacheMode.CHAR) {
              // this._frame._refreshTexture(this._texture);
              this._texture = this._ttfSpriteFrame;
            }
            this.changeMaterialForDefine();
          }
        }
        changeMaterialForDefine() {
          if (!this._texture) {
            return;
          }
          let value = false;
          if (this.cacheMode !== CacheMode.CHAR) {
            const spriteFrame = this._texture;
            const texture = spriteFrame.texture;
            if (texture instanceof TextureBase) {
              const format = texture.getPixelFormat();
              value = format === PixelFormat.RGBA_ETC1 || format === PixelFormat.RGB_A_PVRTC_4BPPV1 || format === PixelFormat.RGB_A_PVRTC_2BPPV1;
            }
          }
          if (value) {
            this._instanceMaterialType = InstanceMaterialType.USE_ALPHA_SEPARATED;
          } else {
            this._instanceMaterialType = InstanceMaterialType.ADD_COLOR_AND_TEXTURE;
          }
          this.updateMaterial();
        }

        /**
         * @engineInternal
         * @mangle
         */
        _updateBlendFunc() {
          // override for BYTEDANCE
          if (BYTEDANCE) {
            // need to fix ttf font black border at the sdk verion lower than 2.0.0
            const sysInfo = minigame.getSystemInfoSync();
            if (Number.parseInt(sysInfo.SDKVersion[0]) < 2) {
              if (this._srcBlendFactor === BlendFactor.SRC_ALPHA && !minigame.isDevTool && !(this._font instanceof BitmapFont) && !this._customMaterial) {
                // Premultiplied alpha on runtime when sdk verion is lower than 2.0.0
                this._srcBlendFactor = BlendFactor.ONE;
              }
            }
          }
          super._updateBlendFunc();
        }
      }, _Label.HorizontalAlign = HorizontalTextAlignment, _Label.VerticalAlign = VerticalTextAlignment, _Label.Overflow = Overflow, _Label.CacheMode = CacheMode, _Label._canvasPool = CanvasPool.getInstance(), _Label), _applyDecoratedDescriptor(_class2.prototype, "string", [_dec5, multiline], Object.getOwnPropertyDescriptor(_class2.prototype, "string"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "horizontalAlign", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "horizontalAlign"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "verticalAlign", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "verticalAlign"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fontSize", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "fontSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lineHeight", [_dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "lineHeight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spacingX", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "spacingX"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "overflow", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "overflow"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableWrapText", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "enableWrapText"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "useSystemFont", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "useSystemFont"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fontFamily", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "fontFamily"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "font", [_dec18, _dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "font"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cacheMode", [_dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "cacheMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isBold", [_dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "isBold"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isItalic", [_dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "isItalic"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isUnderline", [_dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "isUnderline"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "underlineHeight", [_dec26, editable, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "underlineHeight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableOutline", [editable, _dec28, _dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "enableOutline"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "outlineColor", [editable, _dec30, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "outlineColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "outlineWidth", [editable, _dec32, _dec33], Object.getOwnPropertyDescriptor(_class2.prototype, "outlineWidth"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableShadow", [editable, _dec34, _dec35], Object.getOwnPropertyDescriptor(_class2.prototype, "enableShadow"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowColor", [editable, _dec36, _dec37], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowOffset", [editable, _dec38, _dec39], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowOffset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowBlur", [editable, _dec40, _dec41], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowBlur"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_string", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'label';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_horizontalAlign", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return HorizontalTextAlignment.CENTER;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_verticalAlign", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return VerticalTextAlignment.CENTER;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_actualFontSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_fontSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 40;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_fontFamily", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'Arial';
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_lineHeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 40;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_overflow", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Overflow.NONE;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_enableWrapText", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_font", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_isSystemFontUsed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_spacingX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_isItalic", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_isBold", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_isUnderline", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_underlineHeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_cacheMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CacheMode.NONE;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "_enableOutline", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_outlineColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 255);
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "_outlineWidth", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "_enableShadow", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "_shadowColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 255);
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "_shadowOffset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(2, 2);
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "_shadowBlur", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      cclegacy.Label = Label;
    }
  };
});