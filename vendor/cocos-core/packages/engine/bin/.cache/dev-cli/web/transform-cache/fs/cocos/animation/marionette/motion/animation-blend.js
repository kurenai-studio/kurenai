System.register("q-bundled:///fs/cocos/animation/marionette/motion/animation-blend.js", ["../../../core/index.js", "./motion.js", "../create-eval.js", "../errors.js", "../../define.js", "../graph-debug.js", "../animation-graph-editor-extras-clone-helper.js", "../../core/pose.js"], function (_export, _context) {
  "use strict";

  var _decorator, editorExtrasTag, Motion, createEval, VariableTypeMismatchedError, CLASS_NAME_PREFIX_ANIM, getMotionRuntimeID, RUNTIME_ID_ENABLED, cloneAnimationGraphEditorExtrasFrom, blendPoseInto, AnimationBlendEval, AnimationBlendPort, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, ccclass, serializable, AnimationBlendItem, AnimationBlend;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function validateBlendParam(val, name) {
    if (typeof val !== 'number') {
      // TODO var name?
      throw new VariableTypeMismatchedError(name, 'number');
    }
  }
  _export({
    AnimationBlendEval: void 0,
    validateBlendParam: validateBlendParam
  });
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
      editorExtrasTag = _coreIndexJs.editorExtrasTag;
    }, function (_motionJs) {
      Motion = _motionJs.Motion;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_errorsJs) {
      VariableTypeMismatchedError = _errorsJs.VariableTypeMismatchedError;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_graphDebugJs) {
      getMotionRuntimeID = _graphDebugJs.getMotionRuntimeID;
      RUNTIME_ID_ENABLED = _graphDebugJs.RUNTIME_ID_ENABLED;
    }, function (_animationGraphEditorExtrasCloneHelperJs) {
      cloneAnimationGraphEditorExtrasFrom = _animationGraphEditorExtrasCloneHelperJs.cloneAnimationGraphEditorExtrasFrom;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
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
        serializable
      } = _decorator);
      _export("AnimationBlendItem", AnimationBlendItem = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationBlendItem`), _dec(_class = (_class2 = class AnimationBlendItem {
        constructor() {
          _initializerDefineProperty(this, "motion", _descriptor, this);
        }
        clone() {
          const that = new AnimationBlendItem();
          this._copyTo(that);
          return that;
        }
        _copyTo(that) {
          var _this$motion$clone, _this$motion;
          that.motion = (_this$motion$clone = (_this$motion = this.motion) == null ? void 0 : _this$motion.clone()) != null ? _this$motion$clone : null;
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "motion", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      _export("AnimationBlend", AnimationBlend = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationBlend`), _dec2(_class3 = (_class4 = class AnimationBlend extends Motion {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "name", _descriptor2, this);
        }
        copyTo(that) {
          that.name = this.name;
          that[editorExtrasTag] = cloneAnimationGraphEditorExtrasFrom(this);
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "name", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class4)) || _class3));
      _export("AnimationBlendEval", AnimationBlendEval = class AnimationBlendEval {
        constructor(context, ignoreEmbeddedPlayers, base, children, inputs) {
          this._childEvaluators = children.map(child => {
            var _child$motion$createE, _child$motion;
            return (_child$motion$createE = (_child$motion = child.motion) == null ? void 0 : _child$motion[createEval](context, ignoreEmbeddedPlayers)) != null ? _child$motion$createE : null;
          });
          this._weights = new Array(this._childEvaluators.length).fill(0);
          this._inputs = [...inputs];
          if (RUNTIME_ID_ENABLED) {
            this.runtimeId = getMotionRuntimeID(base);
          }
        }
        createPort() {
          return new AnimationBlendPort(this, this._childEvaluators.map(childEval => {
            var _childEval$createPort;
            return (_childEval$createPort = childEval == null ? void 0 : childEval.createPort()) != null ? _childEval$createPort : null;
          }));
        }
        get childCount() {
          return this._weights.length;
        }
        getChildWeight(childIndex) {
          return this._weights[childIndex];
        }
        getChildMotionEval(childIndex) {
          return this._childEvaluators[childIndex];
        }
        get duration() {
          let uniformDuration = 0.0;
          for (let iChild = 0; iChild < this._childEvaluators.length; ++iChild) {
            var _this$_childEvaluator, _this$_childEvaluator2;
            uniformDuration += ((_this$_childEvaluator = (_this$_childEvaluator2 = this._childEvaluators[iChild]) == null ? void 0 : _this$_childEvaluator2.duration) != null ? _this$_childEvaluator : 0.0) * this._weights[iChild];
          }
          return uniformDuration;
        }
        getClipStatuses(baseWeight) {
          const {
            _childEvaluators: children,
            _weights: weights
          } = this;
          const nChildren = children.length;
          let iChild = 0;
          let currentChildIterator;
          return {
            next() {
              // eslint-disable-next-line no-constant-condition
              while (true) {
                if (currentChildIterator) {
                  const result = currentChildIterator.next();
                  if (!result.done) {
                    return result;
                  }
                }
                if (iChild >= nChildren) {
                  return {
                    done: true,
                    value: undefined
                  };
                } else {
                  const child = children[iChild];
                  currentChildIterator = child == null ? void 0 : child.getClipStatuses(baseWeight * weights[iChild]);
                  ++iChild;
                }
              }
            }
          };
        }
        __evaluatePort(port, progress, context) {
          const nChild = this._childEvaluators.length;
          let sumWeight = 0.0;
          let finalPose = null;
          for (let iChild = 0; iChild < nChild; ++iChild) {
            var _port$childPorts$iChi;
            const childWeight = this._weights[iChild];
            if (!childWeight) {
              continue;
            }
            const childOutput = (_port$childPorts$iChi = port.childPorts[iChild]) == null ? void 0 : _port$childPorts$iChi.evaluate(progress, context);
            if (!childOutput) {
              continue;
            }
            sumWeight += childWeight;
            if (!finalPose) {
              finalPose = childOutput;
            } else {
              if (sumWeight) {
                const t = childWeight / sumWeight;
                blendPoseInto(finalPose, childOutput, t);
              }
              context.popPose();
            }
          }
          if (finalPose) {
            return finalPose;
          }
          return context.pushDefaultedPose();
        }
        overrideClips(context) {
          for (let iChild = 0; iChild < this._childEvaluators.length; ++iChild) {
            var _this$_childEvaluator3;
            (_this$_childEvaluator3 = this._childEvaluators[iChild]) == null || _this$_childEvaluator3.overrideClips(context);
          }
        }
        setInput(value, index) {
          this._inputs[index] = value;
          this.doEval();
        }
        doEval() {
          this.eval(this._weights, this._inputs);
        }
      });
      AnimationBlendPort = class AnimationBlendPort {
        constructor(host, childPorts) {
          this.childPorts = [];
          this._host = void 0;
          this._host = host;
          this.childPorts = childPorts;
        }
        evaluate(progress, context) {
          return this._host.__evaluatePort(this, progress, context);
        }
        reenter() {
          const {
            childPorts
          } = this;
          const nChildPorts = childPorts.length;
          for (let iChild = 0; iChild < nChildPorts; ++iChild) {
            var _childPorts$iChild;
            (_childPorts$iChild = childPorts[iChild]) == null || _childPorts$iChild.reenter();
          }
        }
      };
    }
  };
});