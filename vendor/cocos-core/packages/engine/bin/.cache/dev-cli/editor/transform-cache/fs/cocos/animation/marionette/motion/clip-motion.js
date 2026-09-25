System.register("q-bundled:///fs/cocos/animation/marionette/motion/clip-motion.js", ["../../../core/index.js", "../../animation-clip.js", "../animation-graph-editor-extras-clone-helper.js", "../create-eval.js", "../graph-debug.js", "./motion.js", "../../wrap.js", "../../types.js", "../../../core/geometry/index.js", "../animation-graph-animation-clip-binding.js"], function (_export, _context) {
  "use strict";

  var editorExtrasTag, _decorator, editable, serializable, AnimationClip, cloneAnimationGraphEditorExtrasFrom, createEval, getMotionRuntimeID, RUNTIME_ID_ENABLED, Motion, wrap, WrappedInfo, WrapModeMask, createAnimationAGEvaluation, ClipMotionEval, ClipMotionPort, _dec, _dec2, _class, _class2, _descriptor, ccclass, type, ClipMotion, evaluatePortTag;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      editorExtrasTag = _coreIndexJs.editorExtrasTag;
      _decorator = _coreIndexJs._decorator;
      editable = _coreIndexJs.editable;
      serializable = _coreIndexJs.serializable;
    }, function (_animationClipJs) {
      AnimationClip = _animationClipJs.AnimationClip;
    }, function (_animationGraphEditorExtrasCloneHelperJs) {
      cloneAnimationGraphEditorExtrasFrom = _animationGraphEditorExtrasCloneHelperJs.cloneAnimationGraphEditorExtrasFrom;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_graphDebugJs) {
      getMotionRuntimeID = _graphDebugJs.getMotionRuntimeID;
      RUNTIME_ID_ENABLED = _graphDebugJs.RUNTIME_ID_ENABLED;
    }, function (_motionJs) {
      Motion = _motionJs.Motion;
    }, function (_wrapJs) {
      wrap = _wrapJs.wrap;
    }, function (_typesJs) {
      WrappedInfo = _typesJs.WrappedInfo;
    }, function (_coreGeometryIndexJs) {
      WrapModeMask = _coreGeometryIndexJs.WrapModeMask;
    }, function (_animationGraphAnimationClipBindingJs) {
      createAnimationAGEvaluation = _animationGraphAnimationClipBindingJs.createAnimationAGEvaluation;
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
      ({
        ccclass,
        type
      } = _decorator);
      _export("ClipMotion", ClipMotion = (_dec = ccclass('cc.animation.ClipMotion'), _dec2 = type(AnimationClip), _dec(_class = (_class2 = class ClipMotion extends Motion {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "clip", _descriptor, this);
        }
        [createEval](context, ignoreEmbeddedPlayers) {
          if (!this.clip) {
            return null;
          }
          const clipMotionEval = new ClipMotionEval(context, this.clip, ignoreEmbeddedPlayers);
          if (RUNTIME_ID_ENABLED) {
            clipMotionEval.runtimeId = getMotionRuntimeID(this);
          }
          return clipMotionEval;
        }
        clone() {
          const that = new ClipMotion();
          that.clip = this.clip;
          that[editorExtrasTag] = cloneAnimationGraphEditorExtrasFrom(this);
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "clip", [_dec2, editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      evaluatePortTag = Symbol('EvaluatePort');
      ClipMotionEval = class ClipMotionEval {
        /**
         * @internal
         */

        constructor(context, clip, ignoreEmbeddedPlayers) {
          var _context$clipOverride, _context$clipOverride2;
          this._clipEmbeddedPlayerEval = null;
          this._frameEventEval = null;
          this._wrapInfo = new WrappedInfo();
          this._duration = 0.0;
          this._ignoreEmbeddedPlayers = void 0;
          this._originalClip = clip;
          this._ignoreEmbeddedPlayers = ignoreEmbeddedPlayers;
          const overriding = (_context$clipOverride = (_context$clipOverride2 = context.clipOverrides) == null ? void 0 : _context$clipOverride2.get(clip)) != null ? _context$clipOverride : clip;
          this._setClip(overriding, context);
        }
        get duration() {
          return this._duration;
        }
        createPort() {
          return new ClipMotionPort(this);
        }
        getClipStatuses(baseWeight) {
          let got = false;
          return {
            next: () => {
              if (got) {
                return {
                  done: true,
                  value: undefined
                };
              } else {
                got = true;
                return {
                  done: false,
                  // TODO: `__DEBUG_ID__` does not exist on ClipStatus, please fix it @Leslie Leigh
                  // tracking issue: https://github.com/cocos/cocos-engine/issues/15307
                  value: {
                    __DEBUG_ID__: this.__DEBUG__ID__,
                    clip: this._clip,
                    weight: baseWeight
                  }
                };
              }
            }
          };
        }
        [evaluatePortTag](progress, context) {
          var _this$_frameEventEval, _this$_clipEmbeddedPl;
          const {
            _duration: duration,
            _clip: {
              duration: clipDuration
            },
            _clipEval: clipEval
          } = this;
          const elapsedTime = duration * progress;
          const {
            wrapMode
          } = this._clip;
          const repeatCount = (wrapMode & WrapModeMask.Loop) === WrapModeMask.Loop ? Infinity : 1;
          const wrapInfo = wrap(elapsedTime, duration, wrapMode, repeatCount, false, this._wrapInfo);

          // Transform the motion space time(scaled by clip speed) into clip space time.
          const clipTime = wrapInfo.ratio * clipDuration;
          const pose = clipEval.evaluate(clipTime, context);

          // Sample frame events.
          (_this$_frameEventEval = this._frameEventEval) == null || _this$_frameEventEval.sample(wrapInfo.ratio, wrapInfo.direction, wrapInfo.iterations);

          // Evaluate embedded players.
          (_this$_clipEmbeddedPl = this._clipEmbeddedPlayerEval) == null || _this$_clipEmbeddedPl.evaluate(clipTime, Math.trunc(wrapInfo.iterations));
          return pose;
        }
        overrideClips(context) {
          const {
            _originalClip: originalClip
          } = this;
          const clipOverrides = context.clipOverrides;
          const overriding = clipOverrides && clipOverrides.get ? clipOverrides.get(originalClip) : null;
          if (overriding) {
            this._setClip(overriding, context);
          }
        }
        reenter() {
          var _this$_frameEventEval2;
          (_this$_frameEventEval2 = this._frameEventEval) == null || _this$_frameEventEval2.reset();
        }

        /**
         * Preserved here for clip overriding.
         */

        /**
         * Actual clip used. Will be equal to `this._originalClip` if not being override.
         */

        _setClip(clip, context) {
          var _this$_clipEval;
          (_this$_clipEval = this._clipEval) == null || _this$_clipEval.destroy();
          this._frameEventEval = null;
          if (this._clipEmbeddedPlayerEval) {
            this._clipEmbeddedPlayerEval.destroy();
            this._clipEmbeddedPlayerEval = null;
          }
          this._clip = clip;
          this._duration = clip.speed === 0.0 ? 0.0 : clip.duration / clip.speed; // TODO, a test for `clip.speed === 0` is required!
          this._clipEval = createAnimationAGEvaluation(clip, context);
          this._frameEventEval = clip.createEventEvaluator(context.origin);
          if (!this._ignoreEmbeddedPlayers && clip.containsAnyEmbeddedPlayer()) {
            this._clipEmbeddedPlayerEval = clip.createEmbeddedPlayerEvaluator(context.origin);
          }
        }
      };
      ClipMotionPort = class ClipMotionPort {
        constructor(host) {
          this._eval = void 0;
          this._eval = host;
        }
        evaluate(progress, context) {
          return this._eval[evaluatePortTag](progress, context);
        }
        reenter() {
          this._eval.reenter();
        }
      };
    }
  };
});