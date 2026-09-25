System.register("q-bundled:///fs/cocos/gfx/base/shader.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var GFXObject, ObjectType, Shader;
  _export("Shader", void 0);
  return {
    setters: [function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
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
      /**
       * @en GFX shader.
       * @zh GFX 着色器。
       */
      _export("Shader", Shader = class Shader extends GFXObject {
        get name() {
          return this._name;
        }
        get attributes() {
          return this._attributes;
        }
        get blocks() {
          return this._blocks;
        }
        get samplers() {
          return this._samplers;
        }
        get stages() {
          return this._stages;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.SHADER);
          this._name = '';
          /** @mangle */
          this._stages = [];
          /** @mangle */
          this._attributes = [];
          /** @mangle */
          this._blocks = [];
          /** @mangle */
          this._samplers = [];
        }
      });
    }
  };
});