System.register("q-bundled:///fs/cocos/rendering/custom/web-types.js", [], function (_export, _context) {
  "use strict";

  var ProgramInfo, ProgramGroup;
  _export({
    ProgramInfo: void 0,
    ProgramGroup: void 0
  });
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com
      
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
      /**
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       * The following section is auto-generated.
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       */
      /* eslint-disable max-len */
      _export("ProgramInfo", ProgramInfo = class ProgramInfo {
        constructor(programInfo, shaderInfo, attributes, blockSizes, handleMap) {
          this.programInfo = programInfo;
          this.shaderInfo = shaderInfo;
          this.attributes = attributes;
          this.blockSizes = blockSizes;
          this.handleMap = handleMap;
        }
      });
      _export("ProgramGroup", ProgramGroup = class ProgramGroup {
        constructor() {
          this.programInfos = new Map();
          this.programProxies = new Map();
        }
      });
    }
  };
});