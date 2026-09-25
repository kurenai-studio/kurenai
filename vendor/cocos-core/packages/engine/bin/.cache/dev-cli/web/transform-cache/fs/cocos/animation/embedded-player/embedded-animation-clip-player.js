System.register("q-bundled:///fs/cocos/animation/embedded-player/embedded-animation-clip-player.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../animation-state.js", "../define.js", "./embedded-player.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, errorID, AnimationState, CLASS_NAME_PREFIX_ANIM, EmbeddedPlayableState, EmbeddedPlayable, EmbeddedAnimationClipPlayableState, _dec, _class, _class2, _descriptor, _descriptor2, EmbeddedAnimationClipPlayable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
    }, function (_animationStateJs) {
      AnimationState = _animationStateJs.AnimationState;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_embeddedPlayerJs) {
      EmbeddedPlayableState = _embeddedPlayerJs.EmbeddedPlayableState;
      EmbeddedPlayable = _embeddedPlayerJs.EmbeddedPlayable;
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
       * @en
       * The embedded animation clip playable. The playable play animation clip on a embedded player.
       * @zh
       * 动画剪辑子区域播放器。此播放器在子区域上播放动画剪辑。
       */
      _export("EmbeddedAnimationClipPlayable", EmbeddedAnimationClipPlayable = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}EmbeddedAnimationClipPlayable`), _dec(_class = (_class2 = class EmbeddedAnimationClipPlayable extends EmbeddedPlayable {
        constructor(...args) {
          super(...args);
          /**
           * @en
           * Path to the node onto which the animation clip would be played, relative from animation context root.
           * @zh
           * 要播放动画剪辑的节点的路径，相对于动画上下文的根节点。
           */
          _initializerDefineProperty(this, "path", _descriptor, this);
          /**
           * @en
           * The animation clip to play.
           * @zh
           * 要播放的动画剪辑。
           */
          _initializerDefineProperty(this, "clip", _descriptor2, this);
        }
        instantiate(root) {
          const {
            clip,
            path
          } = this;
          if (!clip) {
            return null;
          }
          const clipRoot = root.getChildByPath(path);
          if (!clipRoot) {
            errorID(3938, path, root.getPathInHierarchy(), clip.name);
            return null;
          }
          const state = new AnimationState(clip);
          state.initialize(clipRoot);
          return new EmbeddedAnimationClipPlayableState(state);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "clip", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      EmbeddedAnimationClipPlayableState = class EmbeddedAnimationClipPlayableState extends EmbeddedPlayableState {
        constructor(animationState) {
          super(true);
          this._animationState = void 0;
          this._animationState = animationState;
        }
        destroy() {
          this._animationState.destroy();
        }

        /**
         * Plays the animation state at specified time.
         */
        play() {
          this._animationState.play();
        }

        /**
         * Pause the animation state.
         */
        pause() {
          this._animationState.pause();
        }

        /**
         * Stops the animation state.
         */
        stop() {
          this._animationState.stop();
        }

        /**
         * Sets the speed of the animation state.
         */
        setSpeed(speed) {
          this._animationState.speed = speed;
        }
        setTime(time) {
          this._animationState.time = time;
        }
      };
    }
  };
});