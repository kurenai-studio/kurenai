System.register("q-bundled:///fs/cocos/core/memop/scalable-container.js", ["../utils/array.js"], function (_export, _context) {
  "use strict";

  var fastRemoveAt, ScalableContainer, ScalableContainerManager, scalableContainerManager;
  _export("ScalableContainer", void 0);
  return {
    setters: [function (_utilsArrayJs) {
      fastRemoveAt = _utilsArrayJs.fastRemoveAt;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("ScalableContainer", ScalableContainer = class ScalableContainer {
        constructor() {
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._poolHandle = -1;
          scalableContainerManager.addContainer(this);
        }
        destroy() {
          scalableContainerManager.removeContainer(this);
        }
      });
      /**
       * @en ScalableContainerManager is a sequence container that stores ScalableContainers.
       * It will shrink all managed ScalableContainer in a fixed interval.
       */
      ScalableContainerManager = class ScalableContainerManager {
        constructor() {
          this._pools = [];
          this._lastShrinkPassed = 0;
          /**
           * @en Shrink interval in seconds.
           */
          this.shrinkTimeSpan = 5;
        }

        /**
         * @en Add a ScalableContainer. Will add the same ScalableContainer instance once.
         * @param pool @en The ScalableContainer to add.
         */
        addContainer(pool) {
          if (pool._poolHandle !== -1) return;
          pool._poolHandle = this._pools.length;
          this._pools.push(pool);
        }

        /**
         * @en Remove a ScalableContainer.
         * @param pool @en The ScalableContainer to remove.
         */
        removeContainer(pool) {
          if (pool._poolHandle === -1) return;
          this._pools[this._pools.length - 1]._poolHandle = pool._poolHandle;
          fastRemoveAt(this._pools, pool._poolHandle);
          pool._poolHandle = -1;
        }

        /**
         * @en Try to shrink all managed ScalableContainers.
         */
        tryShrink() {
          for (let i = 0; i < this._pools.length; i++) {
            this._pools[i].tryShrink();
          }
        }

        /**
         * @en An update function invoked every frame.
         * @param dt @en Delta time of frame interval in secondes.
         */
        update(dt) {
          this._lastShrinkPassed += dt;
          if (this._lastShrinkPassed > this.shrinkTimeSpan) {
            this.tryShrink();
            this._lastShrinkPassed -= this.shrinkTimeSpan;
          }
        }
      };
      /**
       * @en A global ScalableContainerManager instance.
       */
      _export("scalableContainerManager", scalableContainerManager = new ScalableContainerManager());
    }
  };
});