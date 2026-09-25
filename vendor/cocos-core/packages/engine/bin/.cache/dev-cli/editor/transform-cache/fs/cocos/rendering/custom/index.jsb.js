System.register("q-bundled:///fs/cocos/rendering/custom/index.jsb.js", ["../../../external/compression/zlib.min.js", "./framework.js", "./types.js", "./pipeline.js", "./archive.js"], function (_export, _context) {
  "use strict";

  var zlib, forceResizeAllWindows, _pipeline, INVALID_ID, enableEffectImport, LAYOUT_HEADER_SIZE, _renderModule, customPipelineBuilderMap;
  function createCustomPipeline() {
    _pipeline = render.Factory.createPipeline();
    return _pipeline;
  }
  function setCustomPipeline(name, builder) {
    customPipelineBuilderMap.set(name, builder);
    forceResizeAllWindows();
  }
  function getCustomPipeline(name) {
    let builder = customPipelineBuilderMap.get(name);
    if (!builder) {
      builder = customPipelineBuilderMap.get('Forward');
    }
    return builder;
  }
  function init(device, arrayBuffer) {
    if (arrayBuffer && arrayBuffer.byteLength >= LAYOUT_HEADER_SIZE) {
      const header = new DataView(arrayBuffer, 0, LAYOUT_HEADER_SIZE);
      if (header.getUint32(0) === INVALID_ID) {
        // Data is compressed
        const inflator = new zlib.Inflate(new Uint8Array(arrayBuffer, LAYOUT_HEADER_SIZE));
        const decompressed = inflator.decompress();
        _renderModule = render.Factory.init(device, decompressed.buffer);
      } else {
        // Data is not compressed
        _renderModule = render.Factory.init(device, arrayBuffer);
      }
    } else {
      _renderModule = render.Factory.init(device, new ArrayBuffer(0));
    }
  }
  function destroy() {
    render.Factory.destroy(_renderModule);
  }
  function getPassID(name) {
    if (name === undefined) {
      return _renderModule.getPassID('default');
    }
    return _renderModule.getPassID(name);
  }
  function getSubpassID(passID, name) {
    return _renderModule.getSubpassID(passID, name);
  }
  function getPhaseID(passID, name) {
    if (name === undefined) {
      return _renderModule.getPhaseID(passID, 'default');
    }
    if (typeof name === 'number') {
      return _renderModule.getPhaseID(passID, name.toString());
    }
    return _renderModule.getPhaseID(passID, name);
  }
  function completePhaseName(name) {
    if (typeof name === 'number') {
      return name.toString();
    } else if (typeof name === 'string') {
      return name;
    } else {
      return 'default';
    }
  }
  _export({
    createCustomPipeline: createCustomPipeline,
    setCustomPipeline: setCustomPipeline,
    getCustomPipeline: getCustomPipeline,
    init: init,
    destroy: destroy,
    getPassID: getPassID,
    getSubpassID: getSubpassID,
    getPhaseID: getPhaseID,
    completePhaseName: completePhaseName
  });
  return {
    setters: [function (_externalCompressionZlibMinJs) {
      zlib = _externalCompressionZlibMinJs.default;
    }, function (_frameworkJs) {
      forceResizeAllWindows = _frameworkJs.forceResizeAllWindows;
      var _exportObj = {};
      for (var _key in _frameworkJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _frameworkJs[_key];
      }
      _export(_exportObj);
    }, function (_typesJs) {
      var _exportObj2 = {};
      for (var _key2 in _typesJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _typesJs[_key2];
      }
      _export(_exportObj2);
    }, function (_pipelineJs) {
      var _exportObj3 = {};
      for (var _key3 in _pipelineJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _pipelineJs[_key3];
      }
      _export(_exportObj3);
    }, function (_archiveJs) {
      var _exportObj4 = {};
      for (var _key4 in _archiveJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _archiveJs[_key4];
      }
      _export(_exportObj4);
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
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
      _pipeline = null;
      _export("INVALID_ID", INVALID_ID = 0xFFFFFFFF);
      _export("enableEffectImport", enableEffectImport = true);
      LAYOUT_HEADER_SIZE = 8;
      _export("customPipelineBuilderMap", customPipelineBuilderMap = new Map());
    }
  };
});