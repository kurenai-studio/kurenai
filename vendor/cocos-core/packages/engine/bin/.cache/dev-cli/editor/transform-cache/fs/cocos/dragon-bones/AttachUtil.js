System.register("q-bundled:///fs/cocos/dragon-bones/AttachUtil.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var Mat4, _decorator, _dec, _class, _tempMat4, ccclass, AttachUtil;
  return {
    setters: [function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      _decorator = _coreIndexJs._decorator;
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
      _tempMat4 = new Mat4();
      ({
        ccclass
      } = _decorator);
      /**
       * @engineInternal Since v3.7.2 this is an engine private class.
       * Users no need to call any function in this class.
       */
      /**
       * @en Attach node tool.
       * @zh 挂点工具类。
       * @class dragonBones.AttachUtil
       */
      _export("AttachUtil", AttachUtil = (_dec = ccclass('dragonBones.AttachUtil'), _dec(_class = class AttachUtil {
        constructor() {
          this._inited = false;
          this._armature = null;
          this._armatureNode = null;
          this._armatureDisplay = null;
        }
        /**
         * @en Initializes parameters.
         * @zh 初始化参数设置。
         */
        init(armatureDisplay) {
          this._inited = true;
          this._armature = armatureDisplay._armature;
          this._armatureNode = armatureDisplay.node;
          this._armatureDisplay = armatureDisplay;
        }
        /**
         * @en Resets parameter values.
         * @zh 重置参数设置。
         */
        reset() {
          this._inited = false;
          this._armature = null;
          this._armatureNode = null;
          this._armatureDisplay = null;
        }
        /**
         * @en Synchronize transformation of nodes attached to bones.
         * @zh 同步变换附着在骨骼上节点。
         */
        _syncAttachedNode() {
          if (!this._inited) return;
          const rootMatrix = this._armatureNode.worldMatrix;
          let boneInfos = null;
          const isCached = this._armatureDisplay.isAnimationCached();
          if (isCached && this._armatureDisplay) {
            boneInfos = this._armatureDisplay._curFrame && this._armatureDisplay._curFrame.boneInfos;
            if (!boneInfos) return;
          }
          const sockets = this._armatureDisplay.sockets;
          const socketNodes = this._armatureDisplay.socketNodes;
          const matrixHandle = (node, boneMat) => {
            const tm = _tempMat4;
            tm.m00 = boneMat.a;
            tm.m01 = boneMat.b;
            tm.m04 = -boneMat.c;
            tm.m05 = -boneMat.d;
            tm.m12 = boneMat.tx;
            tm.m13 = boneMat.ty;
            node.matrix = _tempMat4;
          };
          const bones = this._armature.getBones();
          for (let l = sockets.length - 1; l >= 0; l--) {
            const sock = sockets[l];
            const boneNode = sock.target;
            if (!boneNode) continue;
            // Node has been destroy
            if (!boneNode.isValid) {
              socketNodes.delete(sock.path);
              sockets.splice(l, 1);
              continue;
            }
            // Bone has been destroy
            const bone = isCached ? boneInfos[sock.boneIndex] : bones[sock.boneIndex];
            if (!bone) continue;

            // if (!bone) {
            //     boneNode.removeFromParent();
            //     boneNode.destroy();
            //     socketNodes.delete(sock.path);
            //     sockets.splice(l, 1);
            //     continue;
            // }
            matrixHandle(boneNode, bone.globalTransformMatrix);
          }
        }
      }) || _class));
    }
  };
});