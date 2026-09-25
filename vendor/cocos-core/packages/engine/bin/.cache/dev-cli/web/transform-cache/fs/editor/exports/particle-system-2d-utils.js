System.register("q-bundled:///fs/editor/exports/particle-system-2d-utils.js", ["../../cocos/particle-2d/png-reader.js", "../../cocos/particle-2d/tiff-reader.js", "../../external/compression/ZipUtils.js", "../../cocos/particle-2d/particle-system-2d.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_cocosParticle2dPngReaderJs) {
      _export("PNGReader", _cocosParticle2dPngReaderJs.PNGReader);
    }, function (_cocosParticle2dTiffReaderJs) {
      _export("TiffReader", _cocosParticle2dTiffReaderJs.TiffReader);
    }, function (_externalCompressionZipUtilsJs) {
      _export("codec", _externalCompressionZipUtilsJs.default);
    }, function (_cocosParticle2dParticleSystem2dJs) {
      _export({
        getImageFormatByData: _cocosParticle2dParticleSystem2dJs.getImageFormatByData,
        ImageFormat: _cocosParticle2dParticleSystem2dJs.ImageFormat
      });
    }],
    execute: function () {}
  };
});