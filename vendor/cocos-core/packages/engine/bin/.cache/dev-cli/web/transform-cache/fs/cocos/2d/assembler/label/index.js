System.register("q-bundled:///fs/cocos/2d/assembler/label/index.js", ["../../assets/index.js", "../../components/index.js", "./bmfont.js", "./letter.js", "./ttf.js", "./text-processing.js"], function (_export, _context) {
  "use strict";

  var BitmapFont, CacheMode, Label, bmfont, letter, ttf, TextProcessing, labelAssembler;
  return {
    setters: [function (_assetsIndexJs) {
      BitmapFont = _assetsIndexJs.BitmapFont;
    }, function (_componentsIndexJs) {
      CacheMode = _componentsIndexJs.CacheMode;
      Label = _componentsIndexJs.Label;
    }, function (_bmfontJs) {
      bmfont = _bmfontJs.bmfont;
    }, function (_letterJs) {
      letter = _letterJs.letter;
    }, function (_ttfJs) {
      ttf = _ttfJs.ttf;
    }, function (_textProcessingJs) {
      TextProcessing = _textProcessingJs.TextProcessing;
    }],
    execute: function () {
      /*
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
      _export("labelAssembler", labelAssembler = {
        getAssembler(comp) {
          let assembler = ttf;
          if (comp.font instanceof BitmapFont) {
            assembler = bmfont;
          } else if (comp.cacheMode === CacheMode.CHAR) {
            assembler = letter;
          }
          return assembler;
        }

        // Skip invalid labels (without own _assembler)
        // updateRenderData(label) {
        //     return label.__allocedDatas;
        // }
      });
      _export("ttf", ttf);
      _export("bmfont", bmfont);
      _export("letter", letter);
      _export("TextProcessing", TextProcessing);
      Label.Assembler = labelAssembler;
    }
  };
});