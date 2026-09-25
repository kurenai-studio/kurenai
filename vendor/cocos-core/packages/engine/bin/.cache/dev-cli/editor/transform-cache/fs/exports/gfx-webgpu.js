System.register("q-bundled:///fs/exports/gfx-webgpu.js", ["../cocos/gfx/webgpu/webgpu-device.js", "../cocos/core/global-exports.js"], function (_export, _context) {
  "use strict";

  var WebGPUDevice, legacyCC;
  return {
    setters: [function (_cocosGfxWebgpuWebgpuDeviceJs) {
      WebGPUDevice = _cocosGfxWebgpuWebgpuDeviceJs.WebGPUDevice;
    }, function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }],
    execute: function () {
      /**
       * @packageDocumentation
       * @hidden
       */
      _export("WebGPUDevice", WebGPUDevice);
      legacyCC.WebGPUDevice = WebGPUDevice;
    }
  };
});