System.register("q-bundled:///fs/cocos/animation/marionette/animation-graph-like.js", ["../../core/data/decorators/index.js", "../../asset/assets/asset.js", "../define.js"], function (_export, _context) {
  "use strict";

  var ccclass, Asset, CLASS_NAME_PREFIX_ANIM, _dec, _class, AnimationGraphLike;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @zh `AnimationGraph` 和 `AnimationGraphVariant` 的内部共同基类，
       * 仅用于特殊目的，不应另作它用，也不应导出为公开接口。
       * @en The common base class of `AnimationGraph` and `AnimationGraphVariant`
       * which exists for special purpose and should not be used otherwise and should not be exported.
       *
       * @internal This class serves as the editor switch of
       * animation graph asset and animation graph variant asset,
       * especially as the `graph` property on animation controller component.
       */
      _export("AnimationGraphLike", AnimationGraphLike = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationGraphLike`), _dec(_class = class AnimationGraphLike extends Asset {}) || _class));
    }
  };
});