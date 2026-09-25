System.register("q-bundled:///fs/cocos/animation/tracks/quat-track.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../define.js", "./track.js"], function (_export, _context) {
  "use strict";

  var ccclass, QuatCurve, Quat, CLASS_NAME_PREFIX_ANIM, createEvalSymbol, SingleChannelTrack, QuatTrackEval, _dec, _class, QuatTrack;
  _export("QuatTrackEval", void 0);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_coreIndexJs) {
      QuatCurve = _coreIndexJs.QuatCurve;
      Quat = _coreIndexJs.Quat;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_trackJs) {
      SingleChannelTrack = _trackJs.SingleChannelTrack;
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
       * @en
       * A quaternion track animates a quaternion(rotation) attribute of target.
       * @zh
       * 四元数轨道描述目标上某个四元数（旋转）属性的动画。
       */
      _export("QuatTrack", QuatTrack = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}QuatTrack`), _dec(_class = class QuatTrack extends SingleChannelTrack {
        /**
         * @internal
         */
        createCurve() {
          return new QuatCurve();
        }

        /**
         * @internal
         */
        [createEvalSymbol]() {
          return new QuatTrackEval(this.channels()[0].curve);
        }
      }) || _class));
      _export("QuatTrackEval", QuatTrackEval = class QuatTrackEval {
        constructor(_curve) {
          this._result = new Quat();
          this._curve = _curve;
        }
        get requiresDefault() {
          return false;
        }
        evaluate(time) {
          this._curve.evaluate(time, this._result);
          return this._result;
        }
      });
    }
  };
});