System.register("q-bundled:///fs/exports/base.js", ["../cocos/core/global-exports.js", "../predefine.js", "../cocos/core/legacy.js", "../cocos/render-scene/index.js", "../cocos/gfx/index.js", "../cocos/core/index.js", "../cocos/rendering/index.js", "../cocos/scene-graph/index.js", "../cocos/misc/index.js", "../cocos/game/index.js", "../cocos/root.js", "../cocos/serialization/index.js", "../cocos/asset/assets/index.js", "../cocos/asset/asset-manager/index.js", "../extensions/ccpool/node-pool.js", "../cocos/input/types/index.js", "../cocos/input/index.js", "../cocos/native-binding/index.js"], function (_export, _context) {
  "use strict";

  var legacyCC, renderer, gfx;
  return {
    setters: [function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }, function (_predefineJs) {}, function (_cocosCoreLegacyJs) {}, function (_cocosRenderSceneIndexJs) {
      renderer = _cocosRenderSceneIndexJs;
    }, function (_cocosGfxIndexJs) {
      gfx = _cocosGfxIndexJs;
    }, function (_cocosCoreIndexJs) {
      var _exportObj = {};
      for (var _key in _cocosCoreIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocosCoreIndexJs[_key];
      }
      _export(_exportObj);
    }, function (_cocosRenderingIndexJs) {
      var _exportObj2 = {};
      for (var _key2 in _cocosRenderingIndexJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _cocosRenderingIndexJs[_key2];
      }
      _export(_exportObj2);
    }, function (_cocosSceneGraphIndexJs) {
      var _exportObj3 = {};
      for (var _key3 in _cocosSceneGraphIndexJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _cocosSceneGraphIndexJs[_key3];
      }
      _export(_exportObj3);
    }, function (_cocosMiscIndexJs) {
      var _exportObj4 = {};
      for (var _key4 in _cocosMiscIndexJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _cocosMiscIndexJs[_key4];
      }
      _export(_exportObj4);
    }, function (_cocosGameIndexJs) {
      var _exportObj5 = {};
      for (var _key5 in _cocosGameIndexJs) {
        if (_key5 !== "default" && _key5 !== "__esModule") _exportObj5[_key5] = _cocosGameIndexJs[_key5];
      }
      _export(_exportObj5);
    }, function (_cocosRootJs) {
      _export("Root", _cocosRootJs.Root);
    }, function (_cocosSerializationIndexJs) {
      var _exportObj6 = {};
      for (var _key6 in _cocosSerializationIndexJs) {
        if (_key6 !== "default" && _key6 !== "__esModule") _exportObj6[_key6] = _cocosSerializationIndexJs[_key6];
      }
      _export(_exportObj6);
    }, function (_cocosAssetAssetsIndexJs) {
      var _exportObj7 = {};
      for (var _key7 in _cocosAssetAssetsIndexJs) {
        if (_key7 !== "default" && _key7 !== "__esModule") _exportObj7[_key7] = _cocosAssetAssetsIndexJs[_key7];
      }
      _export(_exportObj7);
    }, function (_cocosAssetAssetManagerIndexJs) {
      var _exportObj8 = {};
      for (var _key8 in _cocosAssetAssetManagerIndexJs) {
        if (_key8 !== "default" && _key8 !== "__esModule") _exportObj8[_key8] = _cocosAssetAssetManagerIndexJs[_key8];
      }
      _export(_exportObj8);
    }, function (_extensionsCcpoolNodePoolJs) {
      var _exportObj9 = {};
      for (var _key9 in _extensionsCcpoolNodePoolJs) {
        if (_key9 !== "default" && _key9 !== "__esModule") _exportObj9[_key9] = _extensionsCcpoolNodePoolJs[_key9];
      }
      _export(_exportObj9);
    }, function (_cocosInputTypesIndexJs) {
      var _exportObj0 = {};
      for (var _key0 in _cocosInputTypesIndexJs) {
        if (_key0 !== "default" && _key0 !== "__esModule") _exportObj0[_key0] = _cocosInputTypesIndexJs[_key0];
      }
      _export(_exportObj0);
    }, function (_cocosInputIndexJs) {
      var _exportObj1 = {};
      for (var _key1 in _cocosInputIndexJs) {
        if (_key1 !== "default" && _key1 !== "__esModule") _exportObj1[_key1] = _cocosInputIndexJs[_key1];
      }
      _export(_exportObj1);
    }, function (_cocosNativeBindingIndexJs) {
      var _exportObj10 = {};
      for (var _key10 in _cocosNativeBindingIndexJs) {
        if (_key10 !== "default" && _key10 !== "__esModule") _exportObj10[_key10] = _cocosNativeBindingIndexJs[_key10];
      }
      _export(_exportObj10);
    }],
    execute: function () {
      /*
       Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated engine source code (the "Software"), a limited,
       worldwide, royalty-free, non-assignable, revocable and non-exclusive license
       to use Cocos Creator solely to develop games on your target platforms. You shall
       not use Cocos Creator software for developing other software or tools that's
       used for developing games. You are not granted to publish, distribute,
       sublicense, and/or sell copies of Cocos Creator.
      
       The software or tools in this License Agreement are licensed, not sold.
       Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
       */
      // has to import predefines first
      // tslint:disable-next-line: ordered-imports
      //TODO(PP): should rename it to render-scene
      // LOAD ENGINE CORE
      _export("gfx", gfx);
      _export("renderer", renderer);
      legacyCC.renderer = renderer;
    }
  };
});