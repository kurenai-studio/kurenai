System.register("q-bundled:///fs/cocos/animation/types.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var ccenum, geometry, WrappedInfo, WrapMode;
  function isLerpable(object) {
    return typeof object.lerp === 'function';
  }
  _export({
    WrappedInfo: void 0,
    isLerpable: isLerpable
  });
  return {
    setters: [function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
      geometry = _coreIndexJs.geometry;
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
       * 动画使用的循环模式。
       */
      _export("WrapMode", WrapMode = function (WrapMode) {
        /**
         * 向 Animation Component 或者 AnimationClip 查找 wrapMode
         */
        WrapMode[WrapMode["Default"] = geometry.WrapModeMask.Default] = "Default";
        /**
         * 动画只播放一遍
         */
        WrapMode[WrapMode["Normal"] = geometry.WrapModeMask.Normal] = "Normal";
        /**
         * 从最后一帧或结束位置开始反向播放，到第一帧或开始位置停止
         */
        WrapMode[WrapMode["Reverse"] = geometry.WrapModeMask.Reverse] = "Reverse";
        /**
         * 循环播放
         */
        WrapMode[WrapMode["Loop"] = geometry.WrapModeMask.Loop] = "Loop";
        /**
         * 反向循环播放
         */
        WrapMode[WrapMode["LoopReverse"] = geometry.WrapModeMask.Loop | geometry.WrapModeMask.Reverse] = "LoopReverse";
        /**
         * 从第一帧播放到最后一帧，然后反向播放回第一帧，到第一帧后再正向播放，如此循环
         */
        WrapMode[WrapMode["PingPong"] = geometry.WrapModeMask.PingPong] = "PingPong";
        /**
         * 从最后一帧开始反向播放，其他同 PingPong
         */
        WrapMode[WrapMode["PingPongReverse"] = geometry.WrapModeMask.PingPong | geometry.WrapModeMask.Reverse] = "PingPongReverse";
        return WrapMode;
      }({}));
      ccenum(WrapMode);

      /**
       * For internal
       */
      _export("WrappedInfo", WrappedInfo = class WrappedInfo {
        constructor(info) {
          this.ratio = 0;
          this.time = 0;
          this.direction = 1;
          this.stopped = true;
          this.iterations = 0;
          this.frameIndex = undefined;
          if (info) {
            this.set(info);
          }
        }
        set(info) {
          this.ratio = info.ratio;
          this.time = info.time;
          this.direction = info.direction;
          this.stopped = info.stopped;
          this.iterations = info.iterations;
          this.frameIndex = info.frameIndex;
        }
      });
    }
  };
});