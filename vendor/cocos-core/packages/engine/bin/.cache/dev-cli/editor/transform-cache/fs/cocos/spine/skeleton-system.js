System.register("q-bundled:///fs/cocos/spine/skeleton-system.js", ["../game/director.js", "../core/index.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var director, System, SystemPriority, legacyCC, SkeletonSystem;
  _export("SkeletonSystem", void 0);
  return {
    setters: [function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }, function (_coreIndexJs) {
      System = _coreIndexJs.System;
      SystemPriority = _coreIndexJs.SystemPriority;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      _export("SkeletonSystem", SkeletonSystem = class SkeletonSystem extends System {
        constructor() {
          super();
          this._skeletons = new Set();
        }

        /**
         * @en
         * Gets the instance of the Spine Skeleton system.
         * @zh
         * 获取 Spine 骨骼系统的单例。
         */
        static getInstance() {
          if (!SkeletonSystem._instance) {
            SkeletonSystem._instance = new SkeletonSystem();
            director.registerSystem(SkeletonSystem.ID, SkeletonSystem._instance, SystemPriority.HIGH);
          }
          return SkeletonSystem._instance;
        }
        add(skeleton) {
          if (!skeleton) return;
          if (!this._skeletons.has(skeleton)) {
            this._skeletons.add(skeleton);
          }
        }
        remove(skeleton) {
          if (!skeleton) return;
          if (this._skeletons.has(skeleton)) {
            this._skeletons.delete(skeleton);
          }
        }
        postUpdate(dt) {
          if (!this._skeletons) {
            return;
          }
          this._skeletons.forEach(skeleton => {
            skeleton.updateAnimation(dt);
          });
        }
        prepareRenderData() {
          if (!this._skeletons) {
            return;
          }
          this._skeletons.forEach(skeleton => {
            skeleton._markForUpdateRenderData();
          });
        }
      });
      /**
       * @en
       * The ID flag of the system.
       * @zh
       * 此系统的 ID 标记。
       */
      SkeletonSystem.ID = 'SKELETON';
      SkeletonSystem._instance = void 0;
      legacyCC.internal.SpineSkeletonSystem = SkeletonSystem;
    }
  };
});