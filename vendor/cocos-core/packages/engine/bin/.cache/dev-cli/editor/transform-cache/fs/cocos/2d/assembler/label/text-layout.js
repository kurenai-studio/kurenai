System.register("q-bundled:///fs/cocos/2d/assembler/label/text-layout.js", ["../../../core/index.js"], function (_export, _context) {
  "use strict";

  var Size, TextLayout;
  _export("TextLayout", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Size = _coreIndexJs.Size;
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
      _export("TextLayout", TextLayout = class TextLayout {
        constructor() {
          // Layout common
          // alignment
          this.horizontalAlign = 0;
          // Enum  // both
          this.verticalAlign = 0;
          // Enum // both
          this.wrapping = true;
          // both
          this.overFlow = 0;
          // Enum  // both
          this.lineHeight = 10;
          // both
          // bmfont extra part
          this.maxLineWidth = 0;
          // bmfont
          this.spacingX = 0;
          // bmfont
          // bmfont used temp value
          this.textWidthTemp = 0;
          this.textHeightTemp = 0;
          this.textDimensions = new Size();
          this.horizontalKerning = [];
          this.numberOfLines = 1;
          this.linesOffsetX = [];
          // layout
          this.letterOffsetY = 0;
          this.tailoredTopY = 0;
          this.tailoredBottomY = 0;
          this.textDesiredHeight = 0;
          this.linesWidth = [];
        }
        reset() {
          this.horizontalAlign = 0;
          this.verticalAlign = 0;
          this.wrapping = true;
          this.overFlow = 0;
          this.lineHeight = 10;
          this.maxLineWidth = 0;
          this.spacingX = 0;
          this.textWidthTemp = 0;
          this.textHeightTemp = 0;
          this.textDimensions.set();
          this.horizontalKerning.length = 0;
          this.numberOfLines = 1;
          this.linesOffsetX.length = 0;
          this.letterOffsetY = 0;
          this.tailoredTopY = 0;
          this.tailoredBottomY = 0;
          this.textDesiredHeight = 0;
          this.linesWidth.length = 0;
        }
      });
    }
  };
});