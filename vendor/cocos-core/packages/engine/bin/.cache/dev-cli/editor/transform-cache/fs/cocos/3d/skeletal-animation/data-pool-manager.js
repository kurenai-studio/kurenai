System.register("q-bundled:///fs/cocos/3d/skeletal-animation/data-pool-manager.js", ["./skeletal-animation-utils.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var JointAnimationInfo, JointTexturePool, cclegacy, DataPoolManager;
  _export("DataPoolManager", void 0);
  return {
    setters: [function (_skeletalAnimationUtilsJs) {
      JointAnimationInfo = _skeletalAnimationUtilsJs.JointAnimationInfo;
      JointTexturePool = _skeletalAnimationUtilsJs.JointTexturePool;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      _export("DataPoolManager", DataPoolManager = class DataPoolManager {
        constructor(device) {
          this.jointTexturePool = void 0;
          this.jointAnimationInfo = void 0;
          this.jointTexturePool = new JointTexturePool(device);
          this.jointAnimationInfo = new JointAnimationInfo(device);
        }
        releaseSkeleton(skeleton) {
          this.jointTexturePool.releaseSkeleton(skeleton);
        }
        releaseAnimationClip(clip) {
          this.jointTexturePool.releaseAnimationClip(clip);
        }
        clear() {
          this.jointTexturePool.clear();
          this.jointAnimationInfo.clear();
        }
      });
      cclegacy.internal.DataPoolManager = DataPoolManager;
    }
  };
});