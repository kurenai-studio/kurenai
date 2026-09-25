System.register("q-bundled:///fs/cocos/2d/assembler/label/text-style.js", ["../../../core/index.js"], function (_export, _context) {
  "use strict";

  var Color, TextStyle;
  _export("TextStyle", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("TextStyle", TextStyle = class TextStyle {
        constructor() {
          // ---------------ttf extra part-----------------
          // bold // style
          this.isBold = false;
          // ttf
          // Italic // style
          this.isItalic = false;
          // ttf
          // under line // style
          this.isUnderline = false;
          // ttf
          this.underlineHeight = 1;
          // ttf
          // outline style
          this.isOutlined = false;
          // both // ttf & char
          this.outlineColor = Color.WHITE.clone();
          // both // ttf & char
          this.outlineWidth = 1;
          // both // ttf & char
          // shadowStyle
          this.hasShadow = false;
          // ttf
          this.shadowColor = Color.BLACK.clone();
          // ttf
          this.shadowBlur = 2;
          // ttf
          this.shadowOffsetX = 0;
          // ttf
          this.shadowOffsetY = 0;
          // ttf
          this.color = Color.WHITE.clone();
          // both
          this.fontSize = 40;
          // input fonSize // both
          this.actualFontSize = 0;
          // both
          this.isSystemFontUsed = false;
          // both // ttf & char
          // -----------------------bitMap extra part-------------------------
          this.originFontSize = 0;
          //Layout // both
          this.bmfontScale = 1.0;
          // both
          // font info // todo merge to font
          this.fontFamily = 'Arial';
          // both
          this.fontDesc = '';
          // both
          // -----------------------bitMap extra part-------------------------
          // font info // todo remove
          this.fntConfig = null;
          // For char mode,not have asset
          this.spriteFrame = null;
          // For char mode,not have spriteFrame in asset
          this.fontScale = 1;
        }
        reset() {
          this.isBold = false;
          this.isItalic = false;
          this.isUnderline = false;
          this.underlineHeight = 1;
          this.isOutlined = false;
          this.outlineColor.set();
          this.outlineWidth = 1;
          this.hasShadow = false;
          this.shadowColor.set();
          this.shadowBlur = 2;
          this.shadowOffsetX = 0;
          this.shadowOffsetY = 0;
        }
      });
    }
  };
});