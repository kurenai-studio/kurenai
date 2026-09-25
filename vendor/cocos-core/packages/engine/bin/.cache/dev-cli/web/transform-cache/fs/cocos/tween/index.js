System.register("q-bundled:///fs/cocos/tween/index.js", ["./tween-progress.js", "./tween.js", "./export-api.js", "./tween-system.js", "./tween-action.js"], function (_export, _context) {
  "use strict";

  var tweenProgress;
  return {
    setters: [function (_tweenProgressJs) {
      tweenProgress = _tweenProgressJs;
    }, function (_tweenJs) {
      var _exportObj = {};
      for (var _key in _tweenJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _tweenJs[_key];
      }
      _export(_exportObj);
    }, function (_exportApiJs) {
      var _exportObj2 = {};
      for (var _key2 in _exportApiJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _exportApiJs[_key2];
      }
      _export(_exportObj2);
    }, function (_tweenSystemJs) {
      _export("TweenSystem", _tweenSystemJs.TweenSystem);
    }, function (_tweenActionJs) {
      _export("TweenAction", _tweenActionJs.TweenAction);
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("tweenProgress", tweenProgress);
    }
  };
});