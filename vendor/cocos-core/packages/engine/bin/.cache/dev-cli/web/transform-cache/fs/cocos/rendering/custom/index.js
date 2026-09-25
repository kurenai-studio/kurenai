System.register("q-bundled:///fs/cocos/rendering/custom/index.js", ["../../../external/compression/zlib.min.js", "./web-pipeline.js", "../../core/platform/macro.js", "./layout-graph.js", "./binary-archive.js", "./web-program-library.js", "./layout-graph-utils.js", "./framework.js", "./types.js", "./pipeline.js", "./archive.js"], function (_export, _context) {
  "use strict";

  var zlib, WebPipeline, macro, LayoutGraphData, loadLayoutGraphData, BinaryInputArchive, WebProgramLibrary, initializeLayoutGraphData, terminateLayoutGraphData, getCustomPassID, getCustomPhaseID, getCustomSubpassID, forceResizeAllWindows, _pipeline, INVALID_ID, defaultLayoutGraph, LAYOUT_HEADER_SIZE, enableEffectImport, programLib, customPipelineBuilderMap;
  function createCustomPipeline() {
    const layoutGraph = defaultLayoutGraph;
    const ppl = new WebPipeline(layoutGraph);
    const pplName = macro.CUSTOM_PIPELINE_NAME;
    ppl.setCustomPipelineName(pplName);
    programLib.pipeline = ppl;
    _pipeline = ppl;
    return ppl;
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
      // On bytedance emulator, arrayBuffer might be Uint8Array
      // Here we use uint8Array to erase the difference.
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = new DataView(uint8Array.buffer, uint8Array.byteOffset, LAYOUT_HEADER_SIZE);
      if (header.getUint32(0) === INVALID_ID) {
        // Data is compressed
        const inflator = new zlib.Inflate(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + LAYOUT_HEADER_SIZE));
        const decompressed = inflator.decompress();
        const readBinaryData = new BinaryInputArchive(decompressed.buffer, decompressed.byteOffset);
        loadLayoutGraphData(readBinaryData, defaultLayoutGraph);
      } else {
        // Data is not compressed
        const readBinaryData = new BinaryInputArchive(uint8Array.buffer, uint8Array.byteOffset);
        loadLayoutGraphData(readBinaryData, defaultLayoutGraph);
      }
    }
    initializeLayoutGraphData(device, defaultLayoutGraph);
  }
  function destroy() {
    terminateLayoutGraphData(defaultLayoutGraph);
  }
  function getPassID(name) {
    return getCustomPassID(defaultLayoutGraph, name);
  }
  function getSubpassID(passID, name) {
    return getCustomSubpassID(defaultLayoutGraph, passID, name);
  }
  function getPhaseID(passID, name) {
    return getCustomPhaseID(defaultLayoutGraph, passID, name);
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
    }, function (_webPipelineJs) {
      WebPipeline = _webPipelineJs.WebPipeline;
    }, function (_corePlatformMacroJs) {
      macro = _corePlatformMacroJs.macro;
    }, function (_layoutGraphJs) {
      LayoutGraphData = _layoutGraphJs.LayoutGraphData;
      loadLayoutGraphData = _layoutGraphJs.loadLayoutGraphData;
    }, function (_binaryArchiveJs) {
      BinaryInputArchive = _binaryArchiveJs.BinaryInputArchive;
    }, function (_webProgramLibraryJs) {
      WebProgramLibrary = _webProgramLibraryJs.WebProgramLibrary;
    }, function (_layoutGraphUtilsJs) {
      initializeLayoutGraphData = _layoutGraphUtilsJs.initializeLayoutGraphData;
      terminateLayoutGraphData = _layoutGraphUtilsJs.terminateLayoutGraphData;
      getCustomPassID = _layoutGraphUtilsJs.getCustomPassID;
      getCustomPhaseID = _layoutGraphUtilsJs.getCustomPhaseID;
      getCustomSubpassID = _layoutGraphUtilsJs.getCustomSubpassID;
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
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      defaultLayoutGraph = new LayoutGraphData();
      LAYOUT_HEADER_SIZE = 8;
      _export("enableEffectImport", enableEffectImport = true);
      _export("programLib", programLib = new WebProgramLibrary(defaultLayoutGraph));
      _export("customPipelineBuilderMap", customPipelineBuilderMap = new Map());
    }
  };
});