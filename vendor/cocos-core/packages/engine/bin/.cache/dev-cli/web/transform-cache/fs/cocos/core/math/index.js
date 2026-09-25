System.register("q-bundled:///fs/cocos/core/math/index.js", ["./bits.js", "./deprecated.js", "./math-native-ext.js", "./vec2.js", "./vec3.js", "./vec4.js", "./quat.js", "./mat3.js", "./mat4.js", "./size.js", "./rect.js", "./color.js", "./utils.js", "./type-define.js", "./math-base.js"], function (_export, _context) {
  "use strict";

  var bits;
  return {
    setters: [function (_bitsJs) {
      bits = _bitsJs;
    }, function (_deprecatedJs) {}, function (_mathNativeExtJs) {}, function (_vec2Js) {
      _export({
        Vec2: _vec2Js.Vec2,
        v2: _vec2Js.v2
      });
    }, function (_vec3Js) {
      _export({
        Vec3: _vec3Js.Vec3,
        v3: _vec3Js.v3
      });
    }, function (_vec4Js) {
      _export({
        Vec4: _vec4Js.Vec4,
        v4: _vec4Js.v4
      });
    }, function (_quatJs) {
      _export({
        Quat: _quatJs.Quat,
        quat: _quatJs.quat
      });
    }, function (_mat3Js) {
      _export("Mat3", _mat3Js.Mat3);
    }, function (_mat4Js) {
      _export({
        Mat4: _mat4Js.Mat4,
        mat4: _mat4Js.mat4,
        preTransforms: _mat4Js.preTransforms
      });
    }, function (_sizeJs) {
      _export({
        Size: _sizeJs.Size,
        size: _sizeJs.size
      });
    }, function (_rectJs) {
      _export({
        Rect: _rectJs.Rect,
        rect: _rectJs.rect
      });
    }, function (_colorJs) {
      _export({
        Color: _colorJs.Color,
        color: _colorJs.color
      });
    }, function (_utilsJs) {
      var _exportObj = {};
      for (var _key in _utilsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _utilsJs[_key];
      }
      _export(_exportObj);
    }, function (_typeDefineJs) {
      var _exportObj2 = {};
      for (var _key2 in _typeDefineJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _typeDefineJs[_key2];
      }
      _export(_exportObj2);
    }, function (_mathBaseJs) {
      var _exportObj3 = {};
      for (var _key3 in _mathBaseJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _mathBaseJs[_key3];
      }
      _export(_exportObj3);
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
       * Export module bits.
       */
      _export("bits", bits); // engine internal exports
    }
  };
});