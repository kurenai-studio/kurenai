System.register("q-bundled:///fs/cocos/core/curves/real-curve-param.js", [], function (_export, _context) {
  "use strict";

  var RealInterpolationMode, ExtrapolationMode, TangentWeightMode;
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en
       * The method used for interpolation method between value of a keyframe and its next keyframe.
       * @zh
       * 在某关键帧（前一帧）和其下一帧之间插值时使用的插值方式。
       */
      _export("RealInterpolationMode", RealInterpolationMode = /*#__PURE__*/function (RealInterpolationMode) {
        /**
         * @en
         * Perform linear interpolation between previous keyframe value and next keyframe value.
         * @zh
         * 在前一帧和后一帧之间执行线性插值。
         */
        RealInterpolationMode[RealInterpolationMode["LINEAR"] = 0] = "LINEAR";
        /**
         * @en
         * Always use the value from this keyframe.
         * @zh
         * 永远使用前一帧的值。
         */
        RealInterpolationMode[RealInterpolationMode["CONSTANT"] = 1] = "CONSTANT";
        /**
         * @en
         * Perform cubic(hermite) interpolation between previous keyframe value and next keyframe value.
         * @zh
         * 在前一帧和后一帧之间执行立方插值。
         */
        RealInterpolationMode[RealInterpolationMode["CUBIC"] = 2] = "CUBIC";
        return RealInterpolationMode;
      }({}));
      /**
       * @en
       * Specifies how to extrapolate the value
       * if input time is underflow(less than the the first frame time) or
       * overflow(greater than the last frame time) when evaluating an curve.
       * @zh
       * 在求值曲线时，指定当输入时间下溢（小于第一帧的时间）或上溢（大于最后一帧的时间）时应该如何推断结果值。
       */
      _export("ExtrapolationMode", ExtrapolationMode = /*#__PURE__*/function (ExtrapolationMode) {
        /**
         * @en
         * Compute the result
         * according to the first two frame's linear trend in the case of underflow and
         * according to the last two frame's linear trend in the case of overflow.
         * If there are less than two frames, fallback to `CLAMP`.
         * @zh
         * 下溢时，根据前两帧的线性趋势计算结果；上溢时，根据最后两帧的线性趋势计算结果。
         * 如果曲线帧数小于 2，回退到  `CLAMP`。
         */
        ExtrapolationMode[ExtrapolationMode["LINEAR"] = 0] = "LINEAR";
        /**
         * @en
         * Use first frame's value in the case of underflow,
         * use last frame's value in the case of overflow.
         * @zh
         * 下溢时，使用第一帧的值；上溢时，使用最后一帧的值。
         */
        ExtrapolationMode[ExtrapolationMode["CLAMP"] = 1] = "CLAMP";
        /**
         * @en
         * Computes the result as if the curve is infinitely and continuously looped.
         * @zh
         * 求值时将该曲线视作是无限连续循环的。
         */
        ExtrapolationMode[ExtrapolationMode["LOOP"] = 2] = "LOOP";
        /**
         * @en
         * Computes the result as if the curve is infinitely and continuously looped in a ping-pong manner.
         * @zh
         * 求值时将该曲线视作是以“乒乓”的形式无限连续循环的。
         */
        ExtrapolationMode[ExtrapolationMode["PING_PONG"] = 3] = "PING_PONG";
        return ExtrapolationMode;
      }({}));
      /**
       * @en
       * Specifies both side tangent weight mode of a keyframe value.
       * @zh
       * 指定关键帧两侧的切线权重模式。
       */
      _export("TangentWeightMode", TangentWeightMode = /*#__PURE__*/function (TangentWeightMode) {
        /**
         * @en
         * Neither side of the keyframe carries tangent weight information.
         * @zh
         * 关键帧的两侧都不携带切线权重信息。
         */
        TangentWeightMode[TangentWeightMode["NONE"] = 0] = "NONE";
        /**
         * @en
         * Only left side of the keyframe carries tangent weight information.
         * @zh
         * 仅关键帧的左侧携带切线权重信息。
         */
        TangentWeightMode[TangentWeightMode["LEFT"] = 1] = "LEFT";
        /**
         * @en
         * Only right side of the keyframe carries tangent weight information.
         * @zh
         * 仅关键帧的右侧携带切线权重信息。
         */
        TangentWeightMode[TangentWeightMode["RIGHT"] = 2] = "RIGHT";
        /**
         * @en
         * Both sides of the keyframe carries tangent weight information.
         * @zh
         * 关键帧的两侧都携带切线权重信息。
         */
        TangentWeightMode[TangentWeightMode["BOTH"] = 3] = "BOTH";
        return TangentWeightMode;
      }({}));
    }
  };
});