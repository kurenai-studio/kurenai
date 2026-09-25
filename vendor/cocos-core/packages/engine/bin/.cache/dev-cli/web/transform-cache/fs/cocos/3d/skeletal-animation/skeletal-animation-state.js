System.register("q-bundled:///fs/cocos/3d/skeletal-animation/skeletal-animation-state.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../animation/animation-state.js", "./skeletal-animation-data-hub.js"], function (_export, _context) {
  "use strict";

  var JSB, Mat4, Quat, Vec3, cclegacy, AnimationState, SkelAnimDataHub, SkeletalAnimationState, m4_1, m4_2;
  _export("SkeletalAnimationState", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_animationAnimationStateJs) {
      AnimationState = _animationAnimationStateJs.AnimationState;
    }, function (_skeletalAnimationDataHubJs) {
      SkelAnimDataHub = _skeletalAnimationDataHubJs.SkelAnimDataHub;
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
      m4_1 = new Mat4();
      m4_2 = new Mat4();
      /**
       * @en The animation state for skeletal animations.
       * @zh 骨骼动画的动画状态控制对象。
       */
      _export("SkeletalAnimationState", SkeletalAnimationState = class SkeletalAnimationState extends AnimationState {
        constructor(clip, name = '') {
          super(clip, name);
          this._frames = 1;
          this._bakedDuration = 0;
          this._animInfo = null;
          this._sockets = [];
          this._animInfoMgr = void 0;
          this._parent = null;
          this._curvesInited = false;
          this._animInfoMgr = cclegacy.director.root.dataPoolManager.jointAnimationInfo;
        }
        initialize(root) {
          if (this._curveLoaded) {
            return;
          }
          this._parent = root.getComponent('cc.SkeletalAnimation');
          const baked = this._parent.useBakedAnimation;
          this._doNotCreateEval = baked;
          super.initialize(root);
          this._curvesInited = !baked;
          const {
            frames,
            samples
          } = SkelAnimDataHub.getOrExtract(this.clip);
          this._frames = frames - 1;
          this._animInfo = this._animInfoMgr.getData(root.uuid);
          this._bakedDuration = this._frames / samples; // last key
          this.setUseBaked(baked);
        }
        onPlay() {
          super.onPlay();
          const baked = this._parent.useBakedAnimation;
          if (baked) {
            this._animInfoMgr.switchClip(this._animInfo, this.clip);
            const users = this._parent.getUsers();
            users.forEach(user => {
              user.uploadAnimation(this.clip);
            });
          }
        }

        /**
         * @internal This method only friends to `SkeletalAnimation`.
         */
        setUseBaked(useBaked) {
          if (useBaked) {
            this._sampleCurves = this._sampleCurvesBaked;
            this.duration = this._bakedDuration;
          } else {
            this._sampleCurves = super._sampleCurves;
            this.duration = this.clip.duration;
            if (!this._curvesInited) {
              this._curveLoaded = false;
              super.initialize(this._targetNode);
              this._curvesInited = true;
            }
          }
        }

        /**
         * @en Rebuild animation curves and register the socket transforms per frame to the sockets. It will replace the internal sockets list.
         * @zh 为所有指定挂点更新动画曲线运算结果，并存储所有挂点的逐帧变换矩阵。这个方法会用传入的挂点更新取代内部挂点列表。
         * @param sockets @en The sockets need update @zh 需要重建的挂点列表
         * @returns void
         */
        rebuildSocketCurves(sockets) {
          this._sockets.length = 0;
          if (!this._targetNode) {
            return;
          }
          const root = this._targetNode;
          for (let i = 0; i < sockets.length; ++i) {
            const socket = sockets[i];
            const targetNode = root.getChildByPath(socket.path);
            if (!socket.target) {
              continue;
            }
            const clipData = SkelAnimDataHub.getOrExtract(this.clip);
            let animPath = socket.path;
            let source = clipData.joints[animPath];
            let animNode = targetNode;
            let downstream;
            while (!source) {
              const idx = animPath.lastIndexOf('/');
              animPath = animPath.substring(0, idx);
              source = clipData.joints[animPath];
              if (animNode) {
                if (!downstream) {
                  downstream = Mat4.identity(m4_2);
                }
                Mat4.fromRTS(m4_1, animNode.rotation, animNode.position, animNode.scale);
                Mat4.multiply(downstream, m4_1, downstream);
                animNode = animNode.parent;
              }
              if (idx < 0) {
                break;
              }
            }
            const curveData = source && source.transforms;
            const {
              frames
            } = clipData;
            const transforms = [];
            for (let f = 0; f < frames; f++) {
              let mat;
              if (curveData && downstream) {
                // curve & static two-way combination
                mat = Mat4.multiply(m4_1, curveData[f], downstream);
              } else if (curveData) {
                // there is a curve directly controlling the joint
                mat = curveData[f];
              } else if (downstream) {
                // fallback to default pose if no animation curve can be found upstream
                mat = downstream;
              } else {
                // bottom line: render the original mesh as-is
                mat = new Mat4();
              }
              const tfm = {
                pos: new Vec3(),
                rot: new Quat(),
                scale: new Vec3()
              };
              Mat4.toSRT(mat, tfm.rot, tfm.pos, tfm.scale);
              transforms.push(tfm);
            }
            this._sockets.push({
              target: socket.target,
              frames: transforms
            });
          }
        }
        _sampleCurvesBaked(time) {
          const ratio = time / this.duration;
          const info = this._animInfo;
          const clip = this.clip;

          // Ensure I'm the one on which the anim info is sampling.
          if (info.currentClip !== clip) {
            // If not, switch to me.
            this._animInfoMgr.switchClip(this._animInfo, clip);
            const users = this._parent.getUsers();
            users.forEach(user => {
              user.uploadAnimation(clip);
            });
            info.data[0] = -1; // reset frame index to -1. sampleCurves will calculate frame to 0.
          }
          const curFrame = ratio * this._frames + 0.5 | 0;
          if (curFrame === info.data[0]) {
            return;
          }
          info.data[0] = curFrame;
          info.dirty = true;
          if (JSB) {
            info.dirtyForJSB[0] = 1;
          }
          for (let i = 0; i < this._sockets.length; ++i) {
            const {
              target,
              frames
            } = this._sockets[i];
            const {
              pos,
              rot,
              scale
            } = frames[curFrame]; // ratio guaranteed to be in [0, 1]
            target.setRTS(rot, pos, scale);
          }
        }
      });
    }
  };
});