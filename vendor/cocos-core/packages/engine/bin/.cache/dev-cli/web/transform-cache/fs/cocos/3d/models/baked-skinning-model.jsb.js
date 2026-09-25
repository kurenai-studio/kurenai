System.register("q-bundled:///fs/cocos/3d/models/baked-skinning-model.jsb.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var cclegacy, BakedSkinningModel, MorphModel, bakedSkinningModelProto, oldDestroy, oldBindSkeleton;
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      _export("BakedSkinningModel", BakedSkinningModel = jsb.BakedSkinningModel);
      cclegacy.BakedSkinningModel = jsb.BakedSkinningModel;
      MorphModel = jsb.MorphModel;
      bakedSkinningModelProto = BakedSkinningModel.prototype;
      bakedSkinningModelProto._ctor = function () {
        jsb.Model.prototype._ctor.call(this);
        this.uploadedAnim = undefined;
        this._dataPoolManager = cclegacy.director.root.dataPoolManager;
        const jointTextureInfo = new Float32Array(4);
        const animInfo = this._dataPoolManager.jointAnimationInfo.getData();
        this._jointsMedium = {
          buffer: null,
          jointTextureInfo,
          animInfo,
          texture: null,
          boundsInfo: null
        };
        this._skeleton = null;
        this._mesh = null;
      };
      oldDestroy = bakedSkinningModelProto.destroy;
      bakedSkinningModelProto.destroy = function () {
        this.uploadedAnim = undefined; // uninitialized
        this._jointsMedium.boundsInfo = null;
        this._applyJointTexture();
        oldDestroy.call(this);
      };
      oldBindSkeleton = bakedSkinningModelProto.bindSkeleton;
      bakedSkinningModelProto.bindSkeleton = function (skeleton = null, skinningRoot = null, mesh = null) {
        this._skeleton = skeleton;
        this._mesh = mesh;
        if (!skeleton || !skinningRoot || !mesh) {
          return;
        }
        this.transform = skinningRoot;
        const resMgr = this._dataPoolManager;
        this._jointsMedium.animInfo = resMgr.jointAnimationInfo.getData(skinningRoot.uuid);
        const animInfo = this._jointsMedium.animInfo;
        this.syncAnimInfoForJS(animInfo.buffer, animInfo.data, animInfo.dirtyForJSB);
        oldBindSkeleton.apply(this, arguments);
      };
      bakedSkinningModelProto.uploadAnimation = function (anim) {
        var _texture;
        if (!this._skeleton || !this._mesh || this.uploadedAnim === anim) {
          return;
        }
        this.uploadedAnim = anim;
        this.setUploadedAnimForJS(!!anim);
        const resMgr = this._dataPoolManager;
        let texture = null;
        let modelBounds = null;
        if (anim) {
          texture = resMgr.jointTexturePool.getSequencePoseTexture(this._skeleton, anim, this._mesh, this.transform);
          this._jointsMedium.boundsInfo = texture && texture.bounds.get(this._mesh.hash);
          modelBounds = null; // don't calc bounds again in Model
        } else {
          texture = resMgr.jointTexturePool.getDefaultPoseTexture(this._skeleton, this._mesh, this.transform);
          this._jointsMedium.boundsInfo = null;
          modelBounds = texture && texture.bounds.get(this._mesh.hash)[0];
        }
        this._applyJointTexture(texture);
        const {
          jointTextureInfo
        } = this._jointsMedium;
        const tex = (_texture = texture) == null ? void 0 : _texture.handle.texture;
        this.syncDataForJS(this._jointsMedium.boundsInfo, modelBounds, jointTextureInfo[0], jointTextureInfo[1], jointTextureInfo[2], jointTextureInfo[3], tex, this._jointsMedium.animInfo.data);
      };
      bakedSkinningModelProto._applyJointTexture = function (texture = null) {
        const oldTex = this._jointsMedium.texture;
        if (oldTex && oldTex !== texture) {
          this._dataPoolManager.jointTexturePool.releaseHandle(oldTex);
        }
        this._jointsMedium.texture = texture;
        if (!texture) {
          return;
        }
        const {
          jointTextureInfo
        } = this._jointsMedium;
        jointTextureInfo[0] = texture.handle.texture.width;
        jointTextureInfo[1] = this._skeleton.joints.length;
        jointTextureInfo[2] = texture.pixelOffset + 0.1; // guard against floor() underflow
        jointTextureInfo[3] = 1 / jointTextureInfo[0];
      };
    }
  };
});