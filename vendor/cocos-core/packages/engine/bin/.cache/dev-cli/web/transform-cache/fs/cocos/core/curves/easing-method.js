System.register("q-bundled:///fs/cocos/core/curves/easing-method.js", ["../algorithm/easing.js", "../data/utils/asserts.js"], function (_export, _context) {
  "use strict";

  var easing, assertIsTrue, EasingMethod, easingMethodFnMap;
  function getEasingFn(easingMethod) {
    assertIsTrue(easingMethod in easingMethodFnMap);
    return easingMethodFnMap[easingMethod];
  }
  _export("getEasingFn", getEasingFn);
  return {
    setters: [function (_algorithmEasingJs) {
      easing = _algorithmEasingJs;
    }, function (_dataUtilsAssertsJs) {
      assertIsTrue = _dataUtilsAssertsJs.assertIsTrue;
    }],
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
       * @engineInternal
       */
      _export("EasingMethod", EasingMethod = /*#__PURE__*/function (EasingMethod) {
        EasingMethod[EasingMethod["LINEAR"] = 0] = "LINEAR";
        EasingMethod[EasingMethod["CONSTANT"] = 1] = "CONSTANT";
        EasingMethod[EasingMethod["QUAD_IN"] = 2] = "QUAD_IN";
        EasingMethod[EasingMethod["QUAD_OUT"] = 3] = "QUAD_OUT";
        EasingMethod[EasingMethod["QUAD_IN_OUT"] = 4] = "QUAD_IN_OUT";
        EasingMethod[EasingMethod["QUAD_OUT_IN"] = 5] = "QUAD_OUT_IN";
        EasingMethod[EasingMethod["CUBIC_IN"] = 6] = "CUBIC_IN";
        EasingMethod[EasingMethod["CUBIC_OUT"] = 7] = "CUBIC_OUT";
        EasingMethod[EasingMethod["CUBIC_IN_OUT"] = 8] = "CUBIC_IN_OUT";
        EasingMethod[EasingMethod["CUBIC_OUT_IN"] = 9] = "CUBIC_OUT_IN";
        EasingMethod[EasingMethod["QUART_IN"] = 10] = "QUART_IN";
        EasingMethod[EasingMethod["QUART_OUT"] = 11] = "QUART_OUT";
        EasingMethod[EasingMethod["QUART_IN_OUT"] = 12] = "QUART_IN_OUT";
        EasingMethod[EasingMethod["QUART_OUT_IN"] = 13] = "QUART_OUT_IN";
        EasingMethod[EasingMethod["QUINT_IN"] = 14] = "QUINT_IN";
        EasingMethod[EasingMethod["QUINT_OUT"] = 15] = "QUINT_OUT";
        EasingMethod[EasingMethod["QUINT_IN_OUT"] = 16] = "QUINT_IN_OUT";
        EasingMethod[EasingMethod["QUINT_OUT_IN"] = 17] = "QUINT_OUT_IN";
        EasingMethod[EasingMethod["SINE_IN"] = 18] = "SINE_IN";
        EasingMethod[EasingMethod["SINE_OUT"] = 19] = "SINE_OUT";
        EasingMethod[EasingMethod["SINE_IN_OUT"] = 20] = "SINE_IN_OUT";
        EasingMethod[EasingMethod["SINE_OUT_IN"] = 21] = "SINE_OUT_IN";
        EasingMethod[EasingMethod["EXPO_IN"] = 22] = "EXPO_IN";
        EasingMethod[EasingMethod["EXPO_OUT"] = 23] = "EXPO_OUT";
        EasingMethod[EasingMethod["EXPO_IN_OUT"] = 24] = "EXPO_IN_OUT";
        EasingMethod[EasingMethod["EXPO_OUT_IN"] = 25] = "EXPO_OUT_IN";
        EasingMethod[EasingMethod["CIRC_IN"] = 26] = "CIRC_IN";
        EasingMethod[EasingMethod["CIRC_OUT"] = 27] = "CIRC_OUT";
        EasingMethod[EasingMethod["CIRC_IN_OUT"] = 28] = "CIRC_IN_OUT";
        EasingMethod[EasingMethod["CIRC_OUT_IN"] = 29] = "CIRC_OUT_IN";
        EasingMethod[EasingMethod["ELASTIC_IN"] = 30] = "ELASTIC_IN";
        EasingMethod[EasingMethod["ELASTIC_OUT"] = 31] = "ELASTIC_OUT";
        EasingMethod[EasingMethod["ELASTIC_IN_OUT"] = 32] = "ELASTIC_IN_OUT";
        EasingMethod[EasingMethod["ELASTIC_OUT_IN"] = 33] = "ELASTIC_OUT_IN";
        EasingMethod[EasingMethod["BACK_IN"] = 34] = "BACK_IN";
        EasingMethod[EasingMethod["BACK_OUT"] = 35] = "BACK_OUT";
        EasingMethod[EasingMethod["BACK_IN_OUT"] = 36] = "BACK_IN_OUT";
        EasingMethod[EasingMethod["BACK_OUT_IN"] = 37] = "BACK_OUT_IN";
        EasingMethod[EasingMethod["BOUNCE_IN"] = 38] = "BOUNCE_IN";
        EasingMethod[EasingMethod["BOUNCE_OUT"] = 39] = "BOUNCE_OUT";
        EasingMethod[EasingMethod["BOUNCE_IN_OUT"] = 40] = "BOUNCE_IN_OUT";
        EasingMethod[EasingMethod["BOUNCE_OUT_IN"] = 41] = "BOUNCE_OUT_IN";
        EasingMethod[EasingMethod["SMOOTH"] = 42] = "SMOOTH";
        EasingMethod[EasingMethod["FADE"] = 43] = "FADE";
        return EasingMethod;
      }({}));
      easingMethodFnMap = {
        [EasingMethod.CONSTANT]: easing.constant,
        [EasingMethod.LINEAR]: easing.linear,
        [EasingMethod.QUAD_IN]: easing.quadIn,
        [EasingMethod.QUAD_OUT]: easing.quadOut,
        [EasingMethod.QUAD_IN_OUT]: easing.quadInOut,
        [EasingMethod.QUAD_OUT_IN]: easing.quadOutIn,
        [EasingMethod.CUBIC_IN]: easing.cubicIn,
        [EasingMethod.CUBIC_OUT]: easing.cubicOut,
        [EasingMethod.CUBIC_IN_OUT]: easing.cubicInOut,
        [EasingMethod.CUBIC_OUT_IN]: easing.cubicOutIn,
        [EasingMethod.QUART_IN]: easing.quartIn,
        [EasingMethod.QUART_OUT]: easing.quartOut,
        [EasingMethod.QUART_IN_OUT]: easing.quartInOut,
        [EasingMethod.QUART_OUT_IN]: easing.quartOutIn,
        [EasingMethod.QUINT_IN]: easing.quintIn,
        [EasingMethod.QUINT_OUT]: easing.quintOut,
        [EasingMethod.QUINT_IN_OUT]: easing.quintInOut,
        [EasingMethod.QUINT_OUT_IN]: easing.quintOutIn,
        [EasingMethod.SINE_IN]: easing.sineIn,
        [EasingMethod.SINE_OUT]: easing.sineOut,
        [EasingMethod.SINE_IN_OUT]: easing.sineInOut,
        [EasingMethod.SINE_OUT_IN]: easing.sineOutIn,
        [EasingMethod.EXPO_IN]: easing.expoIn,
        [EasingMethod.EXPO_OUT]: easing.expoOut,
        [EasingMethod.EXPO_IN_OUT]: easing.expoInOut,
        [EasingMethod.EXPO_OUT_IN]: easing.expoOutIn,
        [EasingMethod.CIRC_IN]: easing.circIn,
        [EasingMethod.CIRC_OUT]: easing.circOut,
        [EasingMethod.CIRC_IN_OUT]: easing.circInOut,
        [EasingMethod.CIRC_OUT_IN]: easing.circOutIn,
        [EasingMethod.ELASTIC_IN]: easing.elasticIn,
        [EasingMethod.ELASTIC_OUT]: easing.elasticOut,
        [EasingMethod.ELASTIC_IN_OUT]: easing.elasticInOut,
        [EasingMethod.ELASTIC_OUT_IN]: easing.elasticOutIn,
        [EasingMethod.BACK_IN]: easing.backIn,
        [EasingMethod.BACK_OUT]: easing.backOut,
        [EasingMethod.BACK_IN_OUT]: easing.backInOut,
        [EasingMethod.BACK_OUT_IN]: easing.backOutIn,
        [EasingMethod.BOUNCE_IN]: easing.bounceIn,
        [EasingMethod.BOUNCE_OUT]: easing.bounceOut,
        [EasingMethod.BOUNCE_IN_OUT]: easing.bounceInOut,
        [EasingMethod.BOUNCE_OUT_IN]: easing.bounceOutIn,
        [EasingMethod.SMOOTH]: easing.smooth,
        [EasingMethod.FADE]: easing.fade
      };
    }
  };
});