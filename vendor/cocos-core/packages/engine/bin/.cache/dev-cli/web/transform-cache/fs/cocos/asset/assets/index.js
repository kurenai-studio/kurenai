System.register("q-bundled:///fs/cocos/asset/assets/index.js", ["./deprecation.js", "./asset.js", "./buffer-asset.js", "./scripts.js", "./rendering-sub-mesh.js", "./scene-asset.js", "./text-asset.js", "./json-asset.js", "./image-asset.js", "./texture-2d.js", "./texture-cube.js", "./effect-asset.js", "./material.js", "./render-texture.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deprecationJs) {}, function (_assetJs) {
      _export("Asset", _assetJs.Asset);
    }, function (_bufferAssetJs) {
      _export("BufferAsset", _bufferAssetJs.BufferAsset);
    }, function (_scriptsJs) {
      var _exportObj = {};
      for (var _key in _scriptsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _scriptsJs[_key];
      }
      _export(_exportObj);
    }, function (_renderingSubMeshJs) {
      _export("RenderingSubMesh", _renderingSubMeshJs.RenderingSubMesh);
    }, function (_sceneAssetJs) {
      _export("SceneAsset", _sceneAssetJs.SceneAsset);
    }, function (_textAssetJs) {
      _export("TextAsset", _textAssetJs.TextAsset);
    }, function (_jsonAssetJs) {
      _export("JsonAsset", _jsonAssetJs.default);
    }, function (_imageAssetJs) {
      _export("ImageAsset", _imageAssetJs.ImageAsset);
    }, function (_texture2dJs) {
      _export("Texture2D", _texture2dJs.Texture2D);
    }, function (_textureCubeJs) {
      _export("TextureCube", _textureCubeJs.TextureCube);
    }, function (_effectAssetJs) {
      _export("EffectAsset", _effectAssetJs.EffectAsset);
    }, function (_materialJs) {
      _export("Material", _materialJs.Material);
    }, function (_renderTextureJs) {
      _export("RenderTexture", _renderTextureJs.RenderTexture);
    }],
    execute: function () {}
  };
});