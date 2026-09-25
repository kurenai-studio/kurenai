System.register("q-bundled:///fs/cocos/2d/assembler/label/letter-font.js", ["./bmfontUtils.js", "./font-utils.js"], function (_export, _context) {
  "use strict";

  var BmfontUtils, shareLabelInfo, LetterAtlas, computeHash, LetterFont, _atlasWidth, _atlasHeight, _isBold, _shareAtlas;
  _export("LetterFont", void 0);
  return {
    setters: [function (_bmfontUtilsJs) {
      BmfontUtils = _bmfontUtilsJs.BmfontUtils;
    }, function (_fontUtilsJs) {
      shareLabelInfo = _fontUtilsJs.shareLabelInfo;
      LetterAtlas = _fontUtilsJs.LetterAtlas;
      computeHash = _fontUtilsJs.computeHash;
    }],
    execute: function () {
      /*
       Copyright (c) 2018-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _atlasWidth = 1024;
      _atlasHeight = 1024;
      _isBold = false;
      _shareAtlas = null;
      _export("LetterFont", LetterFont = class LetterFont extends BmfontUtils {
        getAssemblerData() {
          if (!_shareAtlas) {
            _shareAtlas = new LetterAtlas(_atlasWidth, _atlasHeight);
          }
          return _shareAtlas.getTexture();
        }
        _updateFontFamily(comp) {
          shareLabelInfo.fontAtlas = _shareAtlas;
          shareLabelInfo.fontFamily = this._getFontFamily(comp);

          // outline
          const isOutlined = comp.enableOutline && comp.outlineWidth > 0;
          if (isOutlined) {
            shareLabelInfo.isOutlined = true;
            shareLabelInfo.margin = comp.outlineWidth;
            shareLabelInfo.out = comp.outlineColor.clone();
            shareLabelInfo.out.a = comp.outlineColor.a * comp.color.a / 255.0;
          } else {
            shareLabelInfo.isOutlined = false;
            shareLabelInfo.margin = 0;
          }
        }
        _getFontFamily(comp) {
          let fontFamily = 'Arial';
          if (!comp.useSystemFont) {
            if (comp.font) {
              fontFamily = comp.font._nativeAsset || 'Arial';
            }
          } else {
            fontFamily = comp.fontFamily || 'Arial';
          }
          return fontFamily;
        }
        _updateLabelInfo(comp) {
          shareLabelInfo.fontDesc = this._getFontDesc();
          shareLabelInfo.color.set(comp.color);
          shareLabelInfo.hash = computeHash(shareLabelInfo);
        }
        _getFontDesc() {
          let fontDesc = `${shareLabelInfo.fontSize.toString()}px `;
          fontDesc += shareLabelInfo.fontFamily;
          if (_isBold) {
            fontDesc = `bold ${fontDesc}`;
          }
          return fontDesc;
        }
      });
    }
  };
});