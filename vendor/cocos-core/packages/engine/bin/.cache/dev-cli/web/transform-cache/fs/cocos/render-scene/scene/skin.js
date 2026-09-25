System.register("q-bundled:///fs/cocos/render-scene/scene/skin.js", [], function (_export, _context) {
  "use strict";

  var Skin;
  _export("Skin", void 0);
  return {
    setters: [],
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
       * @en Global skin in the render scene.
       * The initial data is setup in [[SceneGlobals.skip]].
       * @zh 渲染场景中的全局皮肤后处理设置。
       * 初始值是由 [[SceneGlobals.skin]] 设置的。
       */
      _export("Skin", Skin = class Skin {
        constructor() {
          this._enabled = true;
          this._blurRadius = 0.01;
          this._sssIntensity = 3.0;
        }
        /**
         * @en Enable skip.
         * @zh 是否开启皮肤后效。
         */
        set enabled(val) {
          this._enabled = val;
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en Getter/Setter sampler width.
         * @zh 设置或者获取采样宽度。
         */
        set blurRadius(val) {
          this._blurRadius = val;
        }
        get blurRadius() {
          return this._blurRadius;
        }

        /**
         * @en Getter/Setter depth unit scale.
         * @zh 设置或者获取深度单位比例。
         */
        set sssIntensity(val) {
          this._sssIntensity = val;
        }
        get sssIntensity() {
          return this._sssIntensity;
        }
        initialize(skinInfo) {
          this._enabled = skinInfo.enabled;
          this._blurRadius = skinInfo.blurRadius;
          this._sssIntensity = skinInfo.sssIntensity;
        }
      });
    }
  };
});