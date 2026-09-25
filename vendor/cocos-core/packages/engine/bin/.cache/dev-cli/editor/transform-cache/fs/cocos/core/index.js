System.register("q-bundled:///fs/cocos/core/index.js", ["./global-exports.js", "./geometry/index.js", "./math/index.js", "./memop/index.js", "./deprecated.js", "./deprecated-3.7.0.js", "./value-types/index.js", "./utils/index.js", "./data/index.js", "./event/index.js", "./platform/index.js", "./scheduler.js", "./curves/index.js", "./settings.js", "./system.js", "./algorithm/index.js", "./curves/bezier.js", "./internal-index.js"], function (_export, _context) {
  "use strict";

  var legacyCC, VERSION, geometry, math, memop;
  return {
    setters: [function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
      VERSION = _globalExportsJs.VERSION;
      _export("cclegacy", _globalExportsJs.cclegacy);
    }, function (_geometryIndexJs) {
      geometry = _geometryIndexJs;
    }, function (_mathIndexJs) {
      math = _mathIndexJs;
      var _exportObj = {};
      for (var _key in _mathIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _mathIndexJs[_key];
      }
      _export(_exportObj);
    }, function (_memopIndexJs) {
      memop = _memopIndexJs;
      var _exportObj2 = {};
      for (var _key2 in _memopIndexJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _memopIndexJs[_key2];
      }
      _export(_exportObj2);
    }, function (_deprecatedJs) {}, function (_deprecated370Js) {}, function (_valueTypesIndexJs) {
      var _exportObj3 = {};
      for (var _key3 in _valueTypesIndexJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _valueTypesIndexJs[_key3];
      }
      _export(_exportObj3);
    }, function (_utilsIndexJs) {
      var _exportObj4 = {};
      for (var _key4 in _utilsIndexJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _utilsIndexJs[_key4];
      }
      _export(_exportObj4);
    }, function (_dataIndexJs) {
      var _exportObj5 = {};
      for (var _key5 in _dataIndexJs) {
        if (_key5 !== "default" && _key5 !== "__esModule") _exportObj5[_key5] = _dataIndexJs[_key5];
      }
      _export(_exportObj5);
    }, function (_eventIndexJs) {
      var _exportObj6 = {};
      for (var _key6 in _eventIndexJs) {
        if (_key6 !== "default" && _key6 !== "__esModule") _exportObj6[_key6] = _eventIndexJs[_key6];
      }
      _export(_exportObj6);
    }, function (_platformIndexJs) {
      var _exportObj7 = {};
      for (var _key7 in _platformIndexJs) {
        if (_key7 !== "default" && _key7 !== "__esModule") _exportObj7[_key7] = _platformIndexJs[_key7];
      }
      _export(_exportObj7);
    }, function (_schedulerJs) {
      var _exportObj8 = {};
      for (var _key8 in _schedulerJs) {
        if (_key8 !== "default" && _key8 !== "__esModule") _exportObj8[_key8] = _schedulerJs[_key8];
      }
      _export(_exportObj8);
    }, function (_curvesIndexJs) {
      var _exportObj9 = {};
      for (var _key9 in _curvesIndexJs) {
        if (_key9 !== "default" && _key9 !== "__esModule") _exportObj9[_key9] = _curvesIndexJs[_key9];
      }
      _export(_exportObj9);
    }, function (_settingsJs) {
      var _exportObj0 = {};
      for (var _key0 in _settingsJs) {
        if (_key0 !== "default" && _key0 !== "__esModule") _exportObj0[_key0] = _settingsJs[_key0];
      }
      _export(_exportObj0);
    }, function (_systemJs) {
      var _exportObj1 = {};
      for (var _key1 in _systemJs) {
        if (_key1 !== "default" && _key1 !== "__esModule") _exportObj1[_key1] = _systemJs[_key1];
      }
      _export(_exportObj1);
    }, function (_algorithmIndexJs) {
      var _exportObj10 = {};
      for (var _key10 in _algorithmIndexJs) {
        if (_key10 !== "default" && _key10 !== "__esModule") _exportObj10[_key10] = _algorithmIndexJs[_key10];
      }
      _export(_exportObj10);
    }, function (_curvesBezierJs) {
      var _exportObj11 = {};
      for (var _key11 in _curvesBezierJs) {
        if (_key11 !== "default" && _key11 !== "__esModule") _exportObj11[_key11] = _curvesBezierJs[_key11];
      }
      _export(_exportObj11);
    }, function (_internalIndexJs) {
      var _exportObj12 = {};
      for (var _key12 in _internalIndexJs) {
        if (_key12 !== "default" && _key12 !== "__esModule") _exportObj12[_key12] = _internalIndexJs[_key12];
      }
      _export(_exportObj12);
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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

      legacyCC.math = math;
      legacyCC.geometry = geometry;
      _export("math", math);
      _export("memop", memop);
      _export("geometry", geometry);
      _export("VERSION", VERSION); // TODO: should not include engine internal exports when module mechanism is implemented.
    }
  };
});