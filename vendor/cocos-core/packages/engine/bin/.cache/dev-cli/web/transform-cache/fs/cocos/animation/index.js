System.register("q-bundled:///fs/cocos/animation/index.js", ["./animation.js", "./animation-curve.js", "./animation-clip.js", "./animation-manager.js", "./animation-state.js", "./animation-component.js", "./transform-utils.js"], function (_export, _context) {
  "use strict";

  var animation;
  return {
    setters: [function (_animationJs) {
      animation = _animationJs;
    }, function (_animationCurveJs) {
      var _exportObj = {};
      for (var _key in _animationCurveJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _animationCurveJs[_key];
      }
      _export(_exportObj);
    }, function (_animationClipJs) {
      _export("AnimationClip", _animationClipJs.AnimationClip);
    }, function (_animationManagerJs) {
      var _exportObj2 = {};
      for (var _key2 in _animationManagerJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _animationManagerJs[_key2];
      }
      _export(_exportObj2);
    }, function (_animationStateJs) {
      _export("AnimationState", _animationStateJs.AnimationState);
    }, function (_animationComponentJs) {
      _export({
        Animation: _animationComponentJs.Animation,
        AnimationComponent: _animationComponentJs.AnimationComponent
      });
    }, function (_transformUtilsJs) {
      var _exportObj3 = {};
      for (var _key3 in _transformUtilsJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _transformUtilsJs[_key3];
      }
      _export(_exportObj3);
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
      _export("animation", animation);
    }
  };
});