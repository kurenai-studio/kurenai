System.register("q-bundled:///fs/cocos/render-scene/index.js", ["./scene/index.js", "./utils.js", "./core/constants.js", "./core/pass-utils.js", "./core/pass.js", "./core/program-lib.js", "./core/texture-buffer-pool.js", "./core/material-instance.js", "./core/pass-instance.js", "./core/memory-pools.js", "./core/render-scene.js", "./core/render-window.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  var scene;
  return {
    setters: [function (_sceneIndexJs) {
      scene = _sceneIndexJs;
    }, function (_utilsJs) {
      _export("createIA", _utilsJs.createIA);
    }, function (_coreConstantsJs) {
      var _exportObj = {};
      for (var _key in _coreConstantsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _coreConstantsJs[_key];
      }
      _export(_exportObj);
    }, function (_corePassUtilsJs) {
      var _exportObj2 = {};
      for (var _key2 in _corePassUtilsJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _corePassUtilsJs[_key2];
      }
      _export(_exportObj2);
    }, function (_corePassJs) {
      var _exportObj3 = {};
      for (var _key3 in _corePassJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _corePassJs[_key3];
      }
      _export(_exportObj3);
    }, function (_coreProgramLibJs) {
      _export({
        programLib: _coreProgramLibJs.programLib,
        getDeviceShaderVersion: _coreProgramLibJs.getDeviceShaderVersion
      });
    }, function (_coreTextureBufferPoolJs) {
      var _exportObj4 = {};
      for (var _key4 in _coreTextureBufferPoolJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _coreTextureBufferPoolJs[_key4];
      }
      _export(_exportObj4);
    }, function (_coreMaterialInstanceJs) {
      var _exportObj5 = {};
      for (var _key5 in _coreMaterialInstanceJs) {
        if (_key5 !== "default" && _key5 !== "__esModule") _exportObj5[_key5] = _coreMaterialInstanceJs[_key5];
      }
      _export(_exportObj5);
    }, function (_corePassInstanceJs) {
      var _exportObj6 = {};
      for (var _key6 in _corePassInstanceJs) {
        if (_key6 !== "default" && _key6 !== "__esModule") _exportObj6[_key6] = _corePassInstanceJs[_key6];
      }
      _export(_exportObj6);
    }, function (_coreMemoryPoolsJs) {
      var _exportObj7 = {};
      for (var _key7 in _coreMemoryPoolsJs) {
        if (_key7 !== "default" && _key7 !== "__esModule") _exportObj7[_key7] = _coreMemoryPoolsJs[_key7];
      }
      _export(_exportObj7);
    }, function (_coreRenderSceneJs) {
      var _exportObj8 = {};
      for (var _key8 in _coreRenderSceneJs) {
        if (_key8 !== "default" && _key8 !== "__esModule") _exportObj8[_key8] = _coreRenderSceneJs[_key8];
      }
      _export(_exportObj8);
    }, function (_coreRenderWindowJs) {
      _export("RenderWindow", _coreRenderWindowJs.RenderWindow);
    }, function (_deprecatedJs) {
      var _exportObj9 = {};
      for (var _key9 in _deprecatedJs) {
        if (_key9 !== "default" && _key9 !== "__esModule") _exportObj9[_key9] = _deprecatedJs[_key9];
      }
      _export(_exportObj9);
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
      /** @export_if context.buildTimeConstants.NATIVE */
      _export("scene", scene);
    }
  };
});