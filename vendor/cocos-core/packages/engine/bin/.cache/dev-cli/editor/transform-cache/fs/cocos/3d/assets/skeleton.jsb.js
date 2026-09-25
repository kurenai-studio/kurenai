System.register("q-bundled:///fs/cocos/3d/assets/skeleton.jsb.js", ["../../core/index.js", "../../asset/assets/asset.js", "../../native-binding/decorators.js"], function (_export, _context) {
  "use strict";

  var CCString, cclegacy, Mat4, Asset, patch_cc_Skeleton, Skeleton, skeletonProto, oldSkeletonProtoOnLoaded;
  return {
    setters: [function (_coreIndexJs) {
      CCString = _coreIndexJs.CCString;
      cclegacy = _coreIndexJs.cclegacy;
      Mat4 = _coreIndexJs.Mat4;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_Skeleton = _nativeBindingDecoratorsJs.patch_cc_Skeleton;
    }],
    execute: function () {
      /*
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
      _export("Skeleton", Skeleton = jsb.Skeleton);
      cclegacy.Skeleton = Skeleton;
      skeletonProto = Skeleton.prototype;
      Object.defineProperty(skeletonProto, 'bindposes', {
        enumerable: true,
        configurable: true,
        get() {
          return this._bindposes;
        },
        set(v) {
          this._bindposes = v;
          this._setBindposes(v);
        }
      });
      skeletonProto._ctor = function () {
        jsb.Asset.prototype._ctor.apply(this, arguments);
        this._bindposes = [];
      };
      skeletonProto.destroy = function () {
        var _cclegacy$director$ro;
        (_cclegacy$director$ro = cclegacy.director.root) == null || (_cclegacy$director$ro = _cclegacy$director$ro.dataPoolManager) == null || _cclegacy$director$ro.releaseSkeleton(this);
        return Asset.prototype.destroy.call(this);
      };
      oldSkeletonProtoOnLoaded = skeletonProto.onLoaded;
      skeletonProto.onLoaded = function () {
        this._setBindposes(this._bindposes);
        oldSkeletonProtoOnLoaded.call(this);
      };

      // handle meta data, it is generated automatically
      patch_cc_Skeleton({
        Skeleton,
        CCString,
        Mat4
      });
    }
  };
});