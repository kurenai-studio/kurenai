System.register("q-bundled:///fs/cocos/animation/marionette/animation-graph.js", ["../../core/data/decorators/index.js", "../../core/index.js", "./ownership.js", "./variable/index.js", "./errors.js", "./state-machine/motion-state.js", "./state-machine/state.js", "../../serialization/deserialize-symbols.js", "../define.js", "./animation-graph-like.js", "../../core/utils/internal.js", "./pose-graph/pose-graph.js", "./event/event-binding.js", "../../serialization/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, serializable, js, clamp, assertIsNonNullable, assertIsTrue, EditorExtendable, shift, assertsOwnedBy, own, markAsDangling, ownerSymbol, createVariable, InvalidTransitionError, MotionState, State, outgoingsSymbol, incomingsSymbol, InteractiveState, onAfterDeserializedTag, CLASS_NAME_PREFIX_ANIM, AnimationGraphLike, createInstanceofProxy, renameObjectProperty, PoseGraph, AnimationGraphEventBinding, instantiate, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _dec2, _class3, _class4, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _dec3, _class5, _class6, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _dec4, _class7, _dec5, _class8, _class9, _descriptor10, _dec6, _class0, _class1, _descriptor11, _descriptor12, _descriptor13, _dec7, _class10, _class11, _descriptor14, _dec8, _class12, _class13, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _dec9, _class14, _class15, _descriptor20, _dec0, _class16, _class17, _descriptor21, _dec1, _class18, _class19, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _dec10, _class20, _class21, _descriptor28, _descriptor29, Transition, DurationalTransition, AnimationTransition, EmptyState, EmptyStateTransition, ProceduralPoseState, ProceduralPoseState_, ProceduralPoseTransition, ProceduralPoseTransition_, StateMachine, SubStateMachine, PoseGraphStash, Layer, LayerBlending, AnimationGraph;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function isAnimationTransition(transition) {
    return transition instanceof AnimationTransition;
  }
  _export("isAnimationTransition", isAnimationTransition);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      clamp = _coreIndexJs.clamp;
      assertIsNonNullable = _coreIndexJs.assertIsNonNullable;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      EditorExtendable = _coreIndexJs.EditorExtendable;
      shift = _coreIndexJs.shift;
    }, function (_ownershipJs) {
      assertsOwnedBy = _ownershipJs.assertsOwnedBy;
      own = _ownershipJs.own;
      markAsDangling = _ownershipJs.markAsDangling;
      ownerSymbol = _ownershipJs.ownerSymbol;
    }, function (_variableIndexJs) {
      createVariable = _variableIndexJs.createVariable;
    }, function (_errorsJs) {
      InvalidTransitionError = _errorsJs.InvalidTransitionError;
    }, function (_stateMachineMotionStateJs) {
      MotionState = _stateMachineMotionStateJs.MotionState;
    }, function (_stateMachineStateJs) {
      State = _stateMachineStateJs.State;
      outgoingsSymbol = _stateMachineStateJs.outgoingsSymbol;
      incomingsSymbol = _stateMachineStateJs.incomingsSymbol;
      InteractiveState = _stateMachineStateJs.InteractiveState;
    }, function (_serializationDeserializeSymbolsJs) {
      onAfterDeserializedTag = _serializationDeserializeSymbolsJs.onAfterDeserializedTag;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_animationGraphLikeJs) {
      AnimationGraphLike = _animationGraphLikeJs.AnimationGraphLike;
    }, function (_coreUtilsInternalJs) {
      createInstanceofProxy = _coreUtilsInternalJs.createInstanceofProxy;
      renameObjectProperty = _coreUtilsInternalJs.renameObjectProperty;
    }, function (_poseGraphPoseGraphJs) {
      PoseGraph = _poseGraphPoseGraphJs.PoseGraph;
    }, function (_eventEventBindingJs) {
      AnimationGraphEventBinding = _eventEventBindingJs.AnimationGraphEventBinding;
    }, function (_serializationIndexJs) {
      instantiate = _serializationIndexJs.instantiate;
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
      _export("State", State);
      Transition = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}Transition`), _dec(_class = (_class2 = class Transition extends EditorExtendable {
        constructor(from, to, conditions) {
          super();
          /**
           * The transition source.
           */
          _initializerDefineProperty(this, "from", _descriptor, this);
          /**
           * The transition target.
           */
          _initializerDefineProperty(this, "to", _descriptor2, this);
          /**
           * The transition condition.
           */
          _initializerDefineProperty(this, "conditions", _descriptor3, this);
          this[ownerSymbol] = void 0;
          this.from = from;
          this.to = to;
          if (conditions) {
            this.conditions = conditions;
          }
        }
        copyTo(that) {
          that.conditions = this.conditions.map(condition => condition.clone());
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "from", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "to", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "conditions", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class);
      DurationalTransition = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}DurationalTransition`), _dec2(_class3 = (_class4 = class DurationalTransition extends Transition {
        constructor(...args) {
          super(...args);
          /**
           * @en The start time of (final) destination motion state when this transition starts.
           * Its unit is seconds if `relativeDestinationStart` is `false`,
           * Otherwise, its unit is the duration of destination motion state.
           * @zh 此过渡开始时，（最终）目标动作状态的起始时间。
           * 如果 `relativeDestinationStart`为 `false`，其单位是秒，否则其单位是目标动作状态的周期。
           */
          _initializerDefineProperty(this, "destinationStart", _descriptor4, this);
          /**
           * @en Determines the unit of destination start time. See `destinationStart`.
           * @zh 决定了目标起始时间的单位。见 `destinationStart`。
           */
          _initializerDefineProperty(this, "relativeDestinationStart", _descriptor5, this);
          /**
           * @zh 过渡开始事件绑定，此处绑定的事件会在过渡开始时触发。
           * @en Transition start event binding. The event bound here will be triggered on the transition starts.
           */
          _initializerDefineProperty(this, "startEventBinding", _descriptor6, this);
          /**
           * @zh 过渡结束事件绑定，此处绑定的事件会在过渡结束时触发。
           * @en Transition end event binding. The event bound here will be triggered on the transition ends.
           */
          _initializerDefineProperty(this, "endEventBinding", _descriptor7, this);
          this[ownerSymbol] = void 0;
        }
        copyTo(that) {
          super.copyTo(that);
          that.destinationStart = this.destinationStart;
          that.relativeDestinationStart = this.relativeDestinationStart;
          this.startEventBinding.copyTo(that.startEventBinding);
          this.endEventBinding.copyTo(that.endEventBinding);
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "destinationStart", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "relativeDestinationStart", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "startEventBinding", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AnimationGraphEventBinding();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "endEventBinding", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AnimationGraphEventBinding();
        }
      }), _class4)) || _class3);
      AnimationTransition = (_dec3 = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationTransition`), _dec3(_class5 = (_class6 = class AnimationTransition extends DurationalTransition {
        constructor(...args) {
          super(...args);
          /**
           * The transition duration.
           * The unit of the duration is the real duration of transition source
           * if `relativeDuration` is `true` or seconds otherwise.
           */
          _initializerDefineProperty(this, "duration", _descriptor8, this);
          /**
           * Determines the unit of transition duration. See `duration`.
           */
          _initializerDefineProperty(this, "relativeDuration", _descriptor9, this);
          _initializerDefineProperty(this, "exitConditionEnabled", _descriptor0, this);
          _initializerDefineProperty(this, "_exitCondition", _descriptor1, this);
        }
        get exitCondition() {
          return this._exitCondition;
        }
        set exitCondition(value) {
          assertIsTrue(value >= 0.0);
          this._exitCondition = value;
        }
        copyTo(that) {
          super.copyTo(that);
          that.duration = this.duration;
          that.relativeDuration = this.relativeDuration;
          that.exitConditionEnabled = this.exitConditionEnabled;
          that.exitCondition = this.exitCondition;
        }
      }, _descriptor8 = _applyDecoratedDescriptor(_class6.prototype, "duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class6.prototype, "relativeDuration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class6.prototype, "exitConditionEnabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class6.prototype, "_exitCondition", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class6)) || _class5);
      _export("EmptyState", EmptyState = (_dec4 = ccclass(`${CLASS_NAME_PREFIX_ANIM}EmptyState`), _dec4(_class7 = class EmptyState extends State {}) || _class7));
      _export("EmptyStateTransition", EmptyStateTransition = (_dec5 = ccclass(`${CLASS_NAME_PREFIX_ANIM}EmptyStateTransition`), _dec5(_class8 = (_class9 = class EmptyStateTransition extends DurationalTransition {
        constructor(...args) {
          super(...args);
          /**
           * The transition duration, in seconds.
           */
          _initializerDefineProperty(this, "duration", _descriptor10, this);
        }
        copyTo(that) {
          super.copyTo(that);
          that.duration = this.duration;
        }
      }, _descriptor10 = _applyDecoratedDescriptor(_class9.prototype, "duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _class9)) || _class8));
      ProceduralPoseState = (_dec6 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ProceduralPoseState`), _dec6(_class0 = (_class1 = class ProceduralPoseState extends State {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "graph", _descriptor11, this);
          /**
           * @zh 状态进入事件绑定，此处绑定的事件会在状态机向该状态过渡时触发。
           * @en State entered event binding. The event bound here will be triggered
           * when the state machine starts to transition into this state.
           */
          _initializerDefineProperty(this, "transitionInEventBinding", _descriptor12, this);
          /**
           * @zh 状态离开事件绑定，此处绑定的事件会在状态机从该状态离开时触发。
           * @en State left event binding. The event bound here will be triggered
           * when the state machine starts to transition out from this state.
           */
          _initializerDefineProperty(this, "transitionOutEventBinding", _descriptor13, this);
        }
        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive() {
          this.graph.__callOnAfterDeserializeRecursive();
        }
        copyTo(that) {
          super.copyTo(that);
          this.transitionInEventBinding.copyTo(that.transitionInEventBinding);
          this.transitionOutEventBinding.copyTo(that.transitionOutEventBinding);
          return this;
        }
      }, _descriptor11 = _applyDecoratedDescriptor(_class1.prototype, "graph", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new PoseGraph();
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class1.prototype, "transitionInEventBinding", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AnimationGraphEventBinding();
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class1.prototype, "transitionOutEventBinding", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AnimationGraphEventBinding();
        }
      }), _class1)) || _class0);
      _export("ProceduralPoseState", ProceduralPoseState_ = createInstanceofProxy(ProceduralPoseState));
      ProceduralPoseTransition = (_dec7 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ProceduralPoseTransition`), _dec7(_class10 = (_class11 = class ProceduralPoseTransition extends DurationalTransition {
        constructor(...args) {
          super(...args);
          /**
           * The transition duration, in seconds.
           */
          _initializerDefineProperty(this, "duration", _descriptor14, this);
        }
        copyTo(that) {
          super.copyTo(that);
          that.duration = this.duration;
        }
      }, _descriptor14 = _applyDecoratedDescriptor(_class11.prototype, "duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _class11)) || _class10);
      _export("ProceduralPoseTransition", ProceduralPoseTransition_ = createInstanceofProxy(ProceduralPoseTransition));
      _export("StateMachine", StateMachine = (_dec8 = ccclass('cc.animation.StateMachine'), _dec8(_class12 = (_class13 = class StateMachine extends EditorExtendable {
        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive() {
          this[onAfterDeserializedTag]();
          const nStates = this._states.length;
          for (let iState = 0; iState < nStates; ++iState) {
            const state = this._states[iState];
            if (state instanceof SubStateMachine) {
              state.stateMachine.__callOnAfterDeserializeRecursive();
            } else if (state instanceof ProceduralPoseState) {
              state.__callOnAfterDeserializeRecursive();
            } else if (state instanceof MotionState) {
              state.__callOnAfterDeserializeRecursive();
            }
          }
        }
        constructor(allowEmptyStates) {
          super();
          _initializerDefineProperty(this, "_states", _descriptor15, this);
          _initializerDefineProperty(this, "_transitions", _descriptor16, this);
          _initializerDefineProperty(this, "_entryState", _descriptor17, this);
          _initializerDefineProperty(this, "_exitState", _descriptor18, this);
          _initializerDefineProperty(this, "_anyState", _descriptor19, this);
          /**
           * @internal
           */
          this._allowEmptyStates = true;
          this._allowEmptyStates = allowEmptyStates != null ? allowEmptyStates : false;
          this._entryState = this._addState(new State());
          this._entryState.name = 'Entry';
          this._exitState = this._addState(new State());
          this._exitState.name = 'Exit';
          this._anyState = this._addState(new State());
          this._anyState.name = 'Any';
        }
        [onAfterDeserializedTag]() {
          this._states.forEach(state => own(state, this));
          this._transitions.forEach(transition => {
            transition.from[outgoingsSymbol].push(transition);
            transition.to[incomingsSymbol].push(transition);
          });
        }
        get allowEmptyStates() {
          return this._allowEmptyStates;
        }

        /**
         * The entry state.
         */
        get entryState() {
          return this._entryState;
        }

        /**
         * The exit state.
         */
        get exitState() {
          return this._exitState;
        }

        /**
         * The any state.
         */
        get anyState() {
          return this._anyState;
        }

        /**
         * Gets an iterator to all states within this graph.
         * @returns The iterator.
         */
        states() {
          return this._states;
        }

        /**
         * Gets an iterator to all transitions within this graph.
         * @returns The iterator.
         */
        transitions() {
          return this._transitions;
        }

        /**
         * Gets the transitions between specified states.
         * @param from Transition source.
         * @param to Transition target.
         * @returns Iterator to the transitions
         */
        getTransitionsBetween(from, to) {
          assertsOwnedBy(from, this);
          assertsOwnedBy(to, this);
          return from[outgoingsSymbol].filter(transition => transition.to === to);
        }

        /**
         * @en
         * Gets all transitions outgoing from specified state.
         * @zh
         * 获取从指定状态引出的所有过渡。
         * @param from @en The state. @zh 指定状态。
         * @returns @en Iterable to result transitions, in priority order. @zh 到结果过渡的迭代器，按优先级顺序。
         */
        getOutgoings(from) {
          assertsOwnedBy(from, this);
          return from[outgoingsSymbol];
        }

        /**
         * Gets all incoming transitions of specified state.
         * @param to The state.
         * @returns Result transitions.
         */
        getIncomings(to) {
          assertsOwnedBy(to, this);
          return to[incomingsSymbol];
        }

        /**
         * Adds a motion state into this state machine.
         * @returns The newly created motion.
         */
        addMotion() {
          return this._addState(new MotionState());
        }

        /**
         * Adds a sub state machine into this state machine.
         * @returns The newly created state machine.
         */
        addSubStateMachine() {
          return this._addState(new SubStateMachine(this._allowEmptyStates));
        }

        /**
         * Adds an empty state into this state machine.
         * @returns The newly created empty state.
         */
        addEmpty() {
          if (!this._allowEmptyStates) {
            throw new Error(`Empty states are now allowed in this state machine.`);
          }
          return this._addState(new EmptyState());
        }

        /**
         * @zh 向此状态机中添加一项姿势状态。
         * @en Adds an pose state into this state machine.
         * @returns @zh 新创建的姿势状态。 @en The newly created pose state.
         */
        addProceduralPoseState() {
          return this._addState(new ProceduralPoseState());
        }

        /**
         * Removes specified state from this state machine.
         * @param state The state to remove.
         */
        remove(state) {
          assertsOwnedBy(state, this);
          if (state === this.entryState || state === this.exitState || state === this.anyState) {
            return;
          }
          this.eraseTransitionsIncludes(state);
          js.array.remove(this._states, state);
          markAsDangling(state);
        }

        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         */

        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         */

        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         */

        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         * @throws `InvalidTransitionError` if:
         * - the target state is entry or any, or
         * - the source state is exit.
         */

        connect(from, to, conditions) {
          assertsOwnedBy(from, this);
          assertsOwnedBy(to, this);
          if (to === this.entryState) {
            throw new InvalidTransitionError('to-entry');
          }
          if (to === this.anyState) {
            throw new InvalidTransitionError('to-any');
          }
          if (from === this.exitState) {
            throw new InvalidTransitionError('from-exit');
          }
          const transition = from instanceof MotionState || from === this._anyState ? new AnimationTransition(from, to, conditions) : from instanceof EmptyState ? new EmptyStateTransition(from, to, conditions) : from instanceof ProceduralPoseState ? new ProceduralPoseTransition(from, to, conditions) : new Transition(from, to, conditions);
          own(transition, this);
          this._transitions.push(transition);
          from[outgoingsSymbol].push(transition);
          to[incomingsSymbol].push(transition);
          return transition;
        }
        disconnect(from, to) {
          assertsOwnedBy(from, this);
          assertsOwnedBy(to, this);
          const oTransitions = from[outgoingsSymbol];
          const iTransitions = to[incomingsSymbol];
          const transitions = this._transitions;
          const oTransitionsToRemove = oTransitions.filter(oTransition => oTransition.to === to);
          const nOTransitionToRemove = oTransitionsToRemove.length;
          for (let iOTransitionToRemove = 0; iOTransitionToRemove < nOTransitionToRemove; ++iOTransitionToRemove) {
            const oTransition = oTransitionsToRemove[iOTransitionToRemove];
            js.array.remove(oTransitions, oTransition);
            assertIsTrue(js.array.remove(transitions, oTransition));
            assertIsNonNullable(js.array.removeIf(iTransitions, transition => transition === oTransition));
            markAsDangling(oTransition);
          }
        }
        removeTransition(removal) {
          assertIsTrue(js.array.remove(this._transitions, removal));
          assertIsNonNullable(js.array.removeIf(removal.from[outgoingsSymbol], transition => transition === removal));
          assertIsNonNullable(js.array.removeIf(removal.to[incomingsSymbol], transition => transition === removal));
          markAsDangling(removal);
        }
        eraseOutgoings(from) {
          assertsOwnedBy(from, this);
          const oTransitions = from[outgoingsSymbol];
          for (let iOTransition = 0; iOTransition < oTransitions.length; ++iOTransition) {
            const oTransition = oTransitions[iOTransition];
            const to = oTransition.to;
            assertIsTrue(js.array.remove(this._transitions, oTransition));
            assertIsNonNullable(js.array.removeIf(to[incomingsSymbol], transition => transition === oTransition));
            markAsDangling(oTransition);
          }
          oTransitions.length = 0;
        }
        eraseIncomings(to) {
          assertsOwnedBy(to, this);
          const iTransitions = to[incomingsSymbol];
          for (let iITransition = 0; iITransition < iTransitions.length; ++iITransition) {
            const iTransition = iTransitions[iITransition];
            const from = iTransition.from;
            assertIsTrue(js.array.remove(this._transitions, iTransition));
            assertIsNonNullable(js.array.removeIf(from[outgoingsSymbol], transition => transition === iTransition));
            markAsDangling(iTransition);
          }
          iTransitions.length = 0;
        }
        eraseTransitionsIncludes(state) {
          this.eraseIncomings(state);
          this.eraseOutgoings(state);
        }

        /**
         * @en
         * Adjusts the priority of a transition.
         *
         * To demonstrate, one can imagine a transition array sorted by their priority.
         * - If `diff` is zero, nothing's gonna happen.
         * - Negative `diff` raises the priority:
         *   `diff` number of transitions originally having higher priority than `adjusting`
         *   will then have lower priority than `adjusting`.
         * - Positive `diff` reduce the priority:
         *   `|diff|` number of transitions originally having lower priority than `adjusting`
         *   will then have higher priority than `adjusting`.
         *
         * If the number of transitions indicated by `diff`
         * is more than the actual one, the actual number would be taken.
         * @zh
         * 调整过渡的优先级。
         *
         * 为了说明，可以想象一个由优先级排序的过渡数组。
         * - 如果 `diff` 是 0，无事发生。
         * - 负的 `diff` 会提升该过渡的优先级：原本优先于 `adjusting` 的 `diff` 条过渡的优先级会设置为低于 `adjusting`。
         * - 正的 `diff` 会降低该过渡的优先级：原本优先级低于 `adjusting` 的 `|diff|` 条过渡会设置为优先于 `adjusting`。
         *
         * 如果 `diff` 指示的过渡数量比实际多，则会使用实际数量。
         *
         * @param adjusting @en The transition to adjust the priority. @zh 需要调整优先级的过渡。
         * @param diff @en Indicates how to adjust the priority. @zh 指示如何调整优先级。
         */
        adjustTransitionPriority(adjusting, diff) {
          const {
            from
          } = adjusting;
          if (diff === 0) {
            return;
          }
          const outgoings = from[outgoingsSymbol];
          const iAdjusting = outgoings.indexOf(adjusting);
          assertIsTrue(iAdjusting >= 0);
          const iNew = clamp(iAdjusting + diff, 0, outgoings.length - 1);
          {
            // 1. Adjust the order in entire transition array, which is used for serialization.
            // We're doing a discrete movement: move without bother other outgoings from other motion
            const {
              _transitions: globalTransitions
            } = this;
            const adjustingIndexInGlobal = globalTransitions.indexOf(adjusting);
            assertIsTrue(adjustingIndexInGlobal >= 0);
            let lastPlaceholder = adjustingIndexInGlobal;
            if (iNew > iAdjusting) {
              // Shift right
              for (let iOutgoing = iAdjusting + 1; iOutgoing <= iNew; ++iOutgoing) {
                const outgoing = outgoings[iOutgoing];
                const indexInGlobal = globalTransitions.indexOf(outgoing);
                assertIsTrue(indexInGlobal >= 0);
                globalTransitions[lastPlaceholder] = outgoing;
                lastPlaceholder = indexInGlobal;
              }
            } else if (iAdjusting > iNew) {
              // Shift left
              for (let iOutgoing = iAdjusting - 1; iOutgoing >= iNew; --iOutgoing) {
                const outgoing = outgoings[iOutgoing];
                const indexInGlobal = globalTransitions.indexOf(outgoing);
                assertIsTrue(indexInGlobal >= 0);
                globalTransitions[lastPlaceholder] = outgoing;
                lastPlaceholder = indexInGlobal;
              }
            }
            globalTransitions[lastPlaceholder] = adjusting;
          }
          // eslint-disable-next-line no-lone-blocks
          {
            // 2. Adjust the order in outgoing array.
            shift(outgoings, iAdjusting, iNew);
          }
        }
        copyTo(that) {
          // Clear that first
          const thatStatesOld = that._states.filter(state => {
            switch (state) {
              case that._entryState:
              case that._exitState:
              case that._anyState:
                return true;
              default:
                return false;
            }
          });
          for (const thatStateOld of thatStatesOld) {
            that.remove(thatStateOld);
          }
          const stateMap = new Map();
          for (const state of this._states) {
            switch (state) {
              case this._entryState:
                stateMap.set(state, that._entryState);
                break;
              case this._exitState:
                stateMap.set(state, that._exitState);
                break;
              case this._anyState:
                stateMap.set(state, that._anyState);
                break;
              default:
                if (state instanceof MotionState || state instanceof SubStateMachine || state instanceof EmptyState || state instanceof ProceduralPoseState) {
                  if (state instanceof EmptyState && !that._allowEmptyStates) {
                    continue;
                  }
                  const thatState = instantiate(state);
                  that._addState(thatState);
                  stateMap.set(state, thatState);
                } else {
                  assertIsTrue(false);
                }
                break;
            }
          }
          for (const transition of this._transitions) {
            if (!that._allowEmptyStates) {
              if (transition.from instanceof EmptyState || transition.to instanceof EmptyState) {
                continue;
              }
            }
            const thatFrom = stateMap.get(transition.from);
            const thatTo = stateMap.get(transition.to);
            assertIsTrue(thatFrom && thatTo);
            const thatTransition = that.connect(thatFrom, thatTo);
            thatTransition.conditions = transition.conditions.map(condition => condition.clone());
            if (thatTransition instanceof AnimationTransition) {
              assertIsTrue(transition instanceof AnimationTransition);
              transition.copyTo(thatTransition);
            } else if (thatTransition instanceof EmptyStateTransition) {
              assertIsTrue(transition instanceof EmptyStateTransition);
              transition.copyTo(thatTransition);
            } else if (thatTransition instanceof ProceduralPoseState) {
              assertIsTrue(transition instanceof ProceduralPoseState);
              transition.copyTo(thatTransition);
            } else {
              transition.copyTo(thatTransition);
            }
          }
        }
        clone() {
          const that = new StateMachine(this._allowEmptyStates);
          this.copyTo(that);
          return that;
        }
        _addState(state) {
          own(state, this);
          this._states.push(state);
          return state;
        }
      }, _descriptor15 = _applyDecoratedDescriptor(_class13.prototype, "_states", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class13.prototype, "_transitions", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class13.prototype, "_entryState", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor18 = _applyDecoratedDescriptor(_class13.prototype, "_exitState", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor19 = _applyDecoratedDescriptor(_class13.prototype, "_anyState", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class13)) || _class12));
      _export("SubStateMachine", SubStateMachine = (_dec9 = ccclass('cc.animation.SubStateMachine'), _dec9(_class14 = (_class15 = class SubStateMachine extends InteractiveState {
        constructor(allowEmptyStates) {
          super();
          _initializerDefineProperty(this, "_stateMachine", _descriptor20, this);
          this._stateMachine = new StateMachine(allowEmptyStates);
        }
        get stateMachine() {
          return this._stateMachine;
        }
        copyTo(that) {
          super.copyTo(that);
          this._stateMachine.copyTo(that._stateMachine);
        }
      }, _descriptor20 = _applyDecoratedDescriptor(_class15.prototype, "_stateMachine", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class15)) || _class14));
      _export("PoseGraphStash", PoseGraphStash = (_dec0 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseGraphStash`), _dec0(_class16 = (_class17 = class PoseGraphStash extends EditorExtendable {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "graph", _descriptor21, this);
        }
      }, _descriptor21 = _applyDecoratedDescriptor(_class17.prototype, "graph", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new PoseGraph();
        }
      }), _class17)) || _class16));
      _export("Layer", Layer = (_dec1 = ccclass('cc.animation.Layer'), _dec1(_class18 = (_class19 = class Layer {
        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive() {
          this.stateMachine._allowEmptyStates = true;
          this.stateMachine.__callOnAfterDeserializeRecursive();
          for (const stashId in this._stashes) {
            const stash = this._stashes[stashId];
            stash.graph.__callOnAfterDeserializeRecursive();
          }
        }
        stashes() {
          return Object.entries(this._stashes);
        }
        getStash(id) {
          return this._stashes[id];
        }
        addStash(id) {
          return this._stashes[id] = new PoseGraphStash();
        }
        removeStash(id) {
          delete this._stashes[id];
        }
        renameStash(id, newId) {
          this._stashes = renameObjectProperty(this._stashes, id, newId);
        }

        /**
         * @marked_as_engine_private
         */
        constructor() {
          this[ownerSymbol] = void 0;
          _initializerDefineProperty(this, "_stateMachine", _descriptor22, this);
          _initializerDefineProperty(this, "name", _descriptor23, this);
          _initializerDefineProperty(this, "weight", _descriptor24, this);
          _initializerDefineProperty(this, "mask", _descriptor25, this);
          _initializerDefineProperty(this, "additive", _descriptor26, this);
          _initializerDefineProperty(this, "_stashes", _descriptor27, this);
          this._stateMachine = new StateMachine(true);
        }
        get stateMachine() {
          return this._stateMachine;
        }
      }, _descriptor22 = _applyDecoratedDescriptor(_class19.prototype, "_stateMachine", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor23 = _applyDecoratedDescriptor(_class19.prototype, "name", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class19.prototype, "weight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class19.prototype, "mask", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class19.prototype, "additive", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class19.prototype, "_stashes", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return {};
        }
      }), _class19)) || _class18));
      _export("LayerBlending", LayerBlending = /*#__PURE__*/function (LayerBlending) {
        LayerBlending[LayerBlending["override"] = 0] = "override";
        LayerBlending[LayerBlending["additive"] = 1] = "additive";
        return LayerBlending;
      }({}));
      /**
       * @en
       * An opacity type which denotes what the animation graph seems like outside the engine.
       * @zh
       * 一个非透明的类型，它是动画图在引擎外部的表示。
       */
      _export("AnimationGraph", AnimationGraph = (_dec10 = ccclass('cc.animation.AnimationGraph'), _dec10(_class20 = (_class21 = class AnimationGraph extends AnimationGraphLike {
        constructor() {
          super();
          _initializerDefineProperty(this, "_layers", _descriptor28, this);
          _initializerDefineProperty(this, "_variables", _descriptor29, this);
        }
        onLoaded() {
          const {
            _layers: layers
          } = this;
          const nLayers = layers.length;
          for (let iLayer = 0; iLayer < nLayers; ++iLayer) {
            layers[iLayer].__callOnAfterDeserializeRecursive();
          }
        }
        get layers() {
          return this._layers;
        }
        get variables() {
          return Object.entries(this._variables);
        }

        /**
         * Adds a layer.
         * @returns The new layer.
         */
        addLayer() {
          const layer = new Layer();
          this._layers.push(layer);
          return layer;
        }

        /**
         * Removes a layer.
         * @param index Index to the layer to remove.
         */
        removeLayer(index) {
          js.array.removeAt(this._layers, index);
        }

        /**
         * Adjusts the layer's order.
         * @param index
         * @param newIndex
         */
        moveLayer(index, newIndex) {
          shift(this._layers, index, newIndex);
        }

        /**
         * Adds a variable into this graph.
         * @param name The variable's name.
         * @param type The variable's type.
         * @param initialValue Initial value.
         */
        addVariable(name, type, initialValue) {
          const variable = createVariable(type, initialValue);
          this._variables[name] = variable;
          return variable;
        }
        removeVariable(name) {
          delete this._variables[name];
        }
        getVariable(name) {
          return this._variables[name];
        }

        /**
         * @zh 重命名一个变量。注意，所有对该变量的引用都不会修改。
         * 如果变量的原始名称不存在或者新的名称已存在，此方法不会做任何事。
         * 变量在图中的顺序会保持不变。
         * @en Renames an variable. Note, this won't changes any reference to the variable.
         * If the original name of the variable doesn't exists or
         * the new name has already existed, this method won't do anything.
         * The variable's order in the graph is also retained.
         * @param name @zh 要重命名的变量的名字。 @en The name of the variable to be renamed.
         * @param newName @zh 新的名字。 @en New name.
         */
        renameVariable(name, newName) {
          this._variables = renameObjectProperty(this._variables, name, newName);
        }
      }, _descriptor28 = _applyDecoratedDescriptor(_class21.prototype, "_layers", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor29 = _applyDecoratedDescriptor(_class21.prototype, "_variables", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return {};
        }
      }), _class21)) || _class20));
    }
  };
});