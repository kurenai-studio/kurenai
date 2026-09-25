System.register("q-bundled:///fs/cocos/render-scene/scene/octree.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, Octree;
  _export("Octree", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
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
       * @en The octree culling configuration of the render scene
       * @zh 渲染场景的八叉树剔除配置
       */
      _export("Octree", Octree = class Octree {
        constructor() {
          this._enabled = false;
          this._minPos = new Vec3(0, 0, 0);
          this._maxPos = new Vec3(0, 0, 0);
          this._depth = 0;
        }
        /**
         * @en Whether octree culling is enabled in the render scene
         * @zh 是否开启八叉树加速剔除
         */
        set enabled(val) {
          this._enabled = val;
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en Minimum position of the scene's bounding box
         * @zh 场景包围盒最小值
         */
        get minPos() {
          return this._minPos;
        }
        set minPos(val) {
          this._minPos = val;
        }

        /**
         * @en Maximum position of the scene's bounding box
         * @zh 场景包围盒最大值
         */
        get maxPos() {
          return this._maxPos;
        }
        set maxPos(val) {
          this._maxPos = val;
        }

        /**
         * @en The depth of the octree
         * @zh 八叉树深度
         */
        get depth() {
          return this._depth;
        }
        set depth(val) {
          this._depth = val;
        }
        initialize(octreeInfo) {
          this._enabled = octreeInfo.enabled;
          this._minPos = octreeInfo.minPos;
          this._maxPos = octreeInfo.maxPos;
          this._depth = octreeInfo.depth;
        }
      });
    }
  };
});