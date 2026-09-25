System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/state-machine-eval.js", ["../../../../../virtual/internal%253Aconstants.js", "../animation-graph.js", "../create-eval.js", "../parametric.js", "./condition/index.js", "./motion-state.js", "../../../core/index.js", "./state-machine-component.js", "../animation-graph-context.js", "../../core/pose.js", "../pose-graph/instantiation.js"], function (_export, _context) {
  "use strict";

  var DEBUG, isAnimationTransition, SubStateMachine, EmptyState, EmptyStateTransition, ProceduralPoseState, ProceduralPoseTransition, createEval, validateVariableExistence, validateVariableType, VariableType, TriggerCondition, MotionState, warnID, assertIsTrue, assertIsNonNullable, Pool, approx, clamp01, StateMachineComponent, AnimationGraphUpdateContextGenerator, blendPoseInto, instantiatePoseGraph, TopLevelStateMachineEvaluation, StateEval, EventifiedStateEval, InstantiatedComponents, VMSMEval, VMSMInternalState, SpecialStateEval, EmptyStateEval, ProceduralPoseStateEval, ConditionEvaluationContextImpl, ActivatedTransition, MAX_TRANSITIONS_PER_FRAME, emptyClipStatusesIterator, emptyClipStatusesIterable, NodeKind, StateTickFlag;
  function isRealState(stateEval) {
    return stateEval.kind === NodeKind.animation || stateEval.kind === NodeKind.empty || stateEval.kind === NodeKind.procedural;
  }
  function createStateStatusCache() {
    return {
      progress: 0.0
    };
  }
  function calcProgressUpdate(currentProgress, duration, deltaTime) {
    if (duration === 0.0) {
      // TODO?
      return 0.0;
    }
    const progress = currentProgress + deltaTime / duration;
    return progress;
  }
  function normalizeProgress(progress) {
    const signedFrac = progress - Math.trunc(progress);
    return signedFrac >= 0.0 ? signedFrac : 1.0 + signedFrac;
  }
  _export({
    StateEval: void 0,
    SpecialStateEval: void 0,
    EmptyStateEval: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_animationGraphJs) {
      isAnimationTransition = _animationGraphJs.isAnimationTransition;
      SubStateMachine = _animationGraphJs.SubStateMachine;
      EmptyState = _animationGraphJs.EmptyState;
      EmptyStateTransition = _animationGraphJs.EmptyStateTransition;
      ProceduralPoseState = _animationGraphJs.ProceduralPoseState;
      ProceduralPoseTransition = _animationGraphJs.ProceduralPoseTransition;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_parametricJs) {
      validateVariableExistence = _parametricJs.validateVariableExistence;
      validateVariableType = _parametricJs.validateVariableType;
      VariableType = _parametricJs.VariableType;
    }, function (_conditionIndexJs) {
      TriggerCondition = _conditionIndexJs.TriggerCondition;
    }, function (_motionStateJs) {
      MotionState = _motionStateJs.MotionState;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      assertIsNonNullable = _coreIndexJs.assertIsNonNullable;
      Pool = _coreIndexJs.Pool;
      approx = _coreIndexJs.approx;
      clamp01 = _coreIndexJs.clamp01;
    }, function (_stateMachineComponentJs) {
      StateMachineComponent = _stateMachineComponentJs.StateMachineComponent;
    }, function (_animationGraphContextJs) {
      AnimationGraphUpdateContextGenerator = _animationGraphContextJs.AnimationGraphUpdateContextGenerator;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_poseGraphInstantiationJs) {
      instantiatePoseGraph = _poseGraphInstantiationJs.instantiatePoseGraph;
    }],
    execute: function () {
      /**
       * The max transitions can be matched in single frame.
       *
       * @internal Only exported for test usage.
       */
      _export("MAX_TRANSITIONS_PER_FRAME", MAX_TRANSITIONS_PER_FRAME = 16);
      /**
       * @en
       * Runtime status of a transition.
       * @zh
       * 过渡的运行状态。
       */
      /**
       * @en
       * Runtime clip status of a motion state.
       * @zh
       * 动作状态中包含的剪辑的运行状态。
       */
      /**
       * @en
       * Runtime status of a motion state.
       * @zh
       * 动作状态的运行状态。
       */
      _export("TopLevelStateMachineEvaluation", TopLevelStateMachineEvaluation = class TopLevelStateMachineEvaluation {
        constructor(stateMachine, name, context) {
          this.passthroughWeight = 1.0;
          /**
           * Preserved here for clip overriding.
           */
          this._motionStates = [];
          /**
           * Preserved here for settle stage.
           */
          this._proceduralPoseStates = [];
          this._topLevelEntry = void 0;
          this._topLevelExit = void 0;
          this._currentNode = void 0;
          this._pendingTransitionPath = [];
          this._activatedTransitions = [];
          this._activatedTransitionPool = ActivatedTransition.createPool(4);
          this._updateContextGenerator = new AnimationGraphUpdateContextGenerator();
          this._conditionEvaluationContext = new ConditionEvaluationContextImpl();
          this._additive = false;
          this._additive = context.additive;
          this.name = name;
          this._controller = context.controller;
          const {
            entry,
            exit
          } = this._addStateMachine(stateMachine, null, context, name);
          this._topLevelEntry = entry;
          this._topLevelExit = exit;
          this._currentNode = entry;
          entry.increaseActiveReference();
          this._resetTrigger = context.triggerResetter;
        }

        /**
         * Indicates if this layer's top level graph reached its exit.
         */
        get exited() {
          return this._currentNode === this._topLevelExit;
        }
        settle(context) {
          const {
            _proceduralPoseStates: proceduralPoseStates
          } = this;
          const nProceduralPoseStates = proceduralPoseStates.length;
          for (let iState = 0; iState < nProceduralPoseStates; ++iState) {
            const state = proceduralPoseStates[iState];
            state.settle(context);
          }
        }
        reenter() {
          // Known problem: no callbacks are triggered.

          for (const transition of this._activatedTransitions) {
            transition.destination.decreaseActiveReference();
            this._activatedTransitionPool.free(transition);
          }
          this._activatedTransitions.length = 0;
          this._topLevelEntry.increaseActiveReference();
          this._currentNode.decreaseActiveReference();
          this._currentNode = this._topLevelEntry;
        }
        update(context) {
          assertIsTrue(!this.exited);
          this._loopMatchTransitions();
          this._resetStateTickFlagsAndWeights();
          this._updateActivatedTransitions(context.deltaTime);
          this._commitStateUpdates(context);
        }
        evaluate(context) {
          const sampled = this._sample(context);
          if (sampled) {
            return sampled;
          }
          return this._pushNullishPose(context);
        }
        getCurrentStateStatus() {
          const {
            _currentNode: currentNode
          } = this;
          if (currentNode.kind === NodeKind.animation) {
            return currentNode.getStatus();
          } else if (currentNode.kind === NodeKind.procedural) {
            return currentNode.getStatus();
          } else {
            return null;
          }
        }
        getCurrentClipStatuses() {
          const {
            _currentNode: currentNode
          } = this;
          if (currentNode.kind === NodeKind.animation) {
            return currentNode.getClipStatuses(currentNode.absoluteWeight);
          } else {
            return emptyClipStatusesIterable;
          }
        }
        getCurrentTransition(transitionStatus) {
          const {
            _activatedTransitions: activatedTransitions
          } = this;
          if (activatedTransitions.length === 0) {
            return false;
          }
          const lastActivatedTransition = activatedTransitions[activatedTransitions.length - 1];
          const baseDurationState = activatedTransitions.length === 1 ? this._currentNode : activatedTransitions[activatedTransitions.length - 2].destination; // Else, the previous transition's destination state.
          const absoluteDuration = lastActivatedTransition.getAbsoluteDuration(baseDurationState);
          transitionStatus.duration = absoluteDuration;
          transitionStatus.time = lastActivatedTransition.normalizedElapsedTime * absoluteDuration;
          return true;
        }
        getNextStateStatus() {
          const {
            _activatedTransitions: activatedTransitions
          } = this;
          if (activatedTransitions.length === 0) {
            return null;
          }
          const lastState = activatedTransitions[activatedTransitions.length - 1].destination;
          switch (lastState.kind) {
            default:
              break;
            case NodeKind.procedural:
              return lastState.getStatus();
            case NodeKind.animation:
              return lastState.getStatus();
          }
          return null;
        }
        getNextClipStatuses() {
          var _lastState$getClipSta;
          const {
            _activatedTransitions: activatedTransitions
          } = this;
          if (activatedTransitions.length === 0) {
            return emptyClipStatusesIterable;
          }
          const lastActivatedTransition = activatedTransitions[activatedTransitions.length - 1];
          const lastState = lastActivatedTransition.destination;
          switch (lastState.kind) {
            default:
              return emptyClipStatusesIterable;
            case NodeKind.animation:
              return (_lastState$getClipSta = lastState.getClipStatuses(lastActivatedTransition.destination.absoluteWeight)) != null ? _lastState$getClipSta : emptyClipStatusesIterable;
          }
        }
        overrideClips(context) {
          const {
            _motionStates: motionStates
          } = this;
          const nMotionStates = motionStates.length;
          for (let iMotionState = 0; iMotionState < nMotionStates; ++iMotionState) {
            const node = motionStates[iMotionState];
            node.overrideClips(context);
          }
        }
        _addStateMachine(graph, parentStateMachineInfo, context, __DEBUG_ID__) {
          const nodes = Array.from(graph.states());
          let entryEval;
          let anyNode;
          let exitEval;
          const nodeEvaluations = nodes.map(node => {
            if (node instanceof MotionState) {
              const motionStateEval = new VMSMEval(node, context);
              this._motionStates.push(motionStateEval);
              return motionStateEval;
            } else if (node === graph.entryState) {
              return entryEval = new SpecialStateEval(node, NodeKind.entry, node.name);
            } else if (node === graph.exitState) {
              return exitEval = new SpecialStateEval(node, NodeKind.exit, node.name);
            } else if (node === graph.anyState) {
              return anyNode = new SpecialStateEval(node, NodeKind.any, node.name);
            } else if (node instanceof EmptyState) {
              return new EmptyStateEval(node);
            } else if (node instanceof ProceduralPoseState) {
              const stateEval = new ProceduralPoseStateEval(node, context);
              this._proceduralPoseStates.push(stateEval);
              return stateEval;
            } else {
              assertIsTrue(node instanceof SubStateMachine);
              return null;
            }
          });
          assertIsNonNullable(entryEval, 'Entry node is missing');
          assertIsNonNullable(exitEval, 'Exit node is missing');
          assertIsNonNullable(anyNode, 'Any node is missing');
          const stateMachineInfo = {
            components: null,
            parent: parentStateMachineInfo,
            entry: entryEval,
            exit: exitEval,
            any: anyNode
          };
          for (let iNode = 0; iNode < nodes.length; ++iNode) {
            const nodeEval = nodeEvaluations[iNode];
            if (nodeEval) {
              nodeEval.stateMachine = stateMachineInfo;
            }
          }
          const subStateMachineInfos = nodes.map(node => {
            if (node instanceof SubStateMachine) {
              const subStateMachineInfo = this._addStateMachine(node.stateMachine, stateMachineInfo, context, `${__DEBUG_ID__}/${node.name}`);
              subStateMachineInfo.components = new InstantiatedComponents(node);
              return subStateMachineInfo;
            } else {
              return null;
            }
          });
          if (DEBUG) {
            for (const nodeEval of nodeEvaluations) {
              if (nodeEval) {
                nodeEval.setPrefix_debug(`${__DEBUG_ID__}/`);
              }
            }
          }
          for (let iNode = 0; iNode < nodes.length; ++iNode) {
            const node = nodes[iNode];
            const outgoingTemplates = graph.getOutgoings(node);
            let fromNode;
            if (node instanceof SubStateMachine) {
              const subStateMachineInfo = subStateMachineInfos[iNode];
              assertIsNonNullable(subStateMachineInfo);
              fromNode = subStateMachineInfo.exit;
            } else {
              const nodeEval = nodeEvaluations[iNode];
              assertIsNonNullable(nodeEval);
              fromNode = nodeEval;
            }
            for (const outgoing of outgoingTemplates) {
              const outgoingNode = outgoing.to;
              const iOutgoingNode = nodes.findIndex(nodeTemplate => nodeTemplate === outgoing.to);
              if (iOutgoingNode < 0) {
                assertIsTrue(false, 'Bad animation data');
              }
              let toNode;
              if (outgoingNode instanceof SubStateMachine) {
                const subStateMachineInfo = subStateMachineInfos[iOutgoingNode];
                assertIsNonNullable(subStateMachineInfo);
                toNode = subStateMachineInfo.entry;
              } else {
                const nodeEval = nodeEvaluations[iOutgoingNode];
                assertIsNonNullable(nodeEval);
                if (nodeEval instanceof VMSMEval) {
                  toNode = nodeEval.entry;
                } else {
                  toNode = nodeEval;
                }
              }
              const conditions = outgoing.conditions.map(condition => condition[createEval](context));
              const transitionEval = {
                conditions,
                to: toNode,
                triggers: undefined,
                duration: 0.0,
                normalizedDuration: false,
                destinationStart: 0.0,
                relativeDestinationStart: false,
                exitCondition: 0.0,
                exitConditionEnabled: false,
                activated: false,
                startEventBinding: undefined,
                endEventBinding: undefined
              };
              if (isAnimationTransition(outgoing) || outgoing instanceof EmptyStateTransition || outgoing instanceof ProceduralPoseTransition) {
                transitionEval.duration = outgoing.duration;
                transitionEval.destinationStart = outgoing.destinationStart;
                transitionEval.relativeDestinationStart = outgoing.relativeDestinationStart;
                if (outgoing.startEventBinding.isBound) {
                  transitionEval.startEventBinding = outgoing.startEventBinding;
                }
                if (outgoing.endEventBinding.isBound) {
                  transitionEval.endEventBinding = outgoing.endEventBinding;
                }
                if (isAnimationTransition(outgoing)) {
                  transitionEval.normalizedDuration = outgoing.relativeDuration;
                  transitionEval.exitConditionEnabled = outgoing.exitConditionEnabled;
                  transitionEval.exitCondition = outgoing.exitCondition;
                }
              }
              transitionEval.conditions.forEach((conditionEval, iCondition) => {
                const condition = outgoing.conditions[iCondition];
                if (condition instanceof TriggerCondition && condition.trigger) {
                  var _transitionEval$trigg;
                  // TODO: validates the existence of trigger?
                  ((_transitionEval$trigg = transitionEval.triggers) != null ? _transitionEval$trigg : transitionEval.triggers = []).push(condition.trigger);
                }
              });
              fromNode.addTransition(transitionEval);
            }
          }
          return stateMachineInfo;
        }

        /**
         * Loop match transitions util no match,
         * or util `MAX_TRANSITIONS_PER_FRAME` is reached(in case of circular transition formed or too long transition path).
         */
        _loopMatchTransitions() {
          const {
            _pendingTransitionPath: pendingTransitionPath,
            _activatedTransitions: activatedTransitions
          } = this;
          assertIsTrue(pendingTransitionPath.length === 0);
          let matchingSource = activatedTransitions.length === 0 ? this._currentNode : activatedTransitions[activatedTransitions.length - 1].destination;
          for
            /* The terminal condition is handled in loop body */
          (let iterations = 0;; ++iterations) {
            if (iterations >= MAX_TRANSITIONS_PER_FRAME) {
              let prettyPath = '';
              if (DEBUG) {
                const lastDestination = activatedTransitions[activatedTransitions.length - 1].destination;
                let loopFormPosition = -1;
                for (let i = activatedTransitions.length - 2; i >= 0; --i) {
                  if (activatedTransitions[i].destination === lastDestination) {
                    loopFormPosition = i;
                    break;
                  }
                }
                prettyPath = `${this._currentNode.name} --> ... --> `;
                const pathToPrint = loopFormPosition < 0 ? activatedTransitions.slice(-MAX_TRANSITIONS_PER_FRAME) // We didn't find a loop.
                : activatedTransitions.slice(loopFormPosition); // Find a loop, print from last loop position.
                prettyPath += `${pathToPrint.map(t => t.destination.name).join(' --> ')}`;
              }
              warnID(14000, MAX_TRANSITIONS_PER_FRAME, prettyPath);
              break;
            }
            const transition = this._matchNextTransition(matchingSource);
            if (!transition) {
              break;
            }
            const destinationState = transition.to;
            const currentMatchingSource = matchingSource;
            matchingSource = destinationState;
            if (!isRealState(destinationState)) {
              pendingTransitionPath.push(transition);
              continue;
            }

            // We found a self transition A->A, the transition is meaningless and not allowed.
            if (destinationState === currentMatchingSource) {
              break;
            }
            this._activateTransition(pendingTransitionPath, transition);
            pendingTransitionPath.length = 0;
          }
          pendingTransitionPath.length = 0;
        }
        _resetStateTickFlagsAndWeights() {
          const {
            _currentNode: currentNode,
            _activatedTransitions: activatedTransitions
          } = this;
          currentNode.resetTickFlagsAndWeight();
          for (let iTransition = 0; iTransition < activatedTransitions.length; ++iTransition) {
            const {
              destination
            } = activatedTransitions[iTransition];
            destination.resetTickFlagsAndWeight();
          }
        }
        _commitStateUpdates(parentContext) {
          const {
            _currentNode: currentNode,
            _activatedTransitions: activatedTransitions,
            _updateContextGenerator: updateContextGenerator
          } = this;

          // Update head state.
          this._commitStateUpdate(currentNode, parentContext);

          // Update states in transitions.
          for (let iTransition = 0; iTransition < activatedTransitions.length; ++iTransition) {
            const transition = activatedTransitions[iTransition];
            const {
              destination
            } = transition;
            this._commitStateUpdate(destination, parentContext);
          }
        }
        _commitStateUpdate(state, parentContext) {
          const {
            _updateContextGenerator: updateContextGenerator
          } = this;
          if (state.testTickFlag(StateTickFlag.UPDATED)) {
            // Don't evaluate a pose more than once.
            return;
          }
          state.setTickFlag(StateTickFlag.UPDATED);
          if (state.kind === NodeKind.animation) {
            state.update(parentContext.deltaTime, this._controller);
          } else if (state.kind === NodeKind.procedural) {
            const updateContext = updateContextGenerator.generate(parentContext.deltaTime, parentContext.indicativeWeight * state.absoluteWeight);
            state.update(updateContext);
          }
        }
        _sample(context) {
          const {
            _currentNode: currentNode,
            _activatedTransitions: activatedTransitions
          } = this;
          let passthroughWeight = 1.0;

          // Evaluate head state.
          let finalPose = null;
          let sumActualBlendedWeight = 0.0;
          if (currentNode.kind === NodeKind.animation) {
            var _currentNode$evaluate;
            finalPose = (_currentNode$evaluate = currentNode.evaluate(context)) != null ? _currentNode$evaluate : this._pushNullishPose(context);
          } else if (currentNode.kind === NodeKind.procedural) {
            var _currentNode$evaluate2;
            finalPose = (_currentNode$evaluate2 = currentNode.evaluate(context)) != null ? _currentNode$evaluate2 : this._pushNullishPose(context);
          } else {
            passthroughWeight -= currentNode.absoluteWeight;
            finalPose = null;
          }
          if (finalPose) {
            sumActualBlendedWeight = currentNode.absoluteWeight;
          }
          currentNode.setTickFlag(StateTickFlag.EVALUATED);
          for (let iTransition = 0; iTransition < activatedTransitions.length; ++iTransition) {
            const transition = activatedTransitions[iTransition];
            const {
              destination
            } = transition;
            if (destination.testTickFlag(StateTickFlag.EVALUATED)) {
              // Don't evaluate a pose more than once.
              continue;
            }
            destination.setTickFlag(StateTickFlag.EVALUATED);
            const destAbsoluteWeight = destination.absoluteWeight;
            let destPose;
            if (destination.kind === NodeKind.empty) {
              passthroughWeight -= destAbsoluteWeight;
              destPose = null;
            } else {
              var _destination$evaluate;
              destPose = (_destination$evaluate = destination.evaluate(context)) != null ? _destination$evaluate : this._pushNullishPose(context);
            }
            if (!destPose) {
              // We can't get a pose from transition destination.
              continue;
            }
            if (!finalPose) {
              // All previous states can't get a pose.
              finalPose = destPose;
            } else {
              sumActualBlendedWeight += destAbsoluteWeight;
              if (sumActualBlendedWeight) {
                const t = destAbsoluteWeight / sumActualBlendedWeight;
                blendPoseInto(finalPose, destPose, t);
                context.popPose();
              } else {
                finalPose = destPose;
              }
            }
          }
          this.passthroughWeight = passthroughWeight;
          return finalPose;
        }
        _pushNullishPose(context) {
          return this._additive ? context.pushZeroDeltaPose() : context.pushDefaultedPose();
        }

        /**
         * Searches for a transition which should be performed.
         * @param sourceState The transition source state.
         * @returns
         */
        _matchNextTransition(sourceState) {
          const transition = this._matchTransition(sourceState, sourceState);
          if (transition) {
            return transition;
          }
          if (sourceState.kind === NodeKind.animation || sourceState.kind === NodeKind.procedural) {
            const transition = this._matchAnyScoped(sourceState);
            if (transition) {
              return transition;
            }
          }
          return null;
        }

        /**
         * @param realNode Is used:
         * - to determinate the starting state machine from where the any states are matched;
         * - so we can solve transitions' relative durations.
         */
        _matchAnyScoped(realNode) {
          for (let ancestor = realNode.stateMachine; ancestor !== null; ancestor = ancestor.parent) {
            const transition = this._matchTransition(ancestor.any, realNode);
            if (transition) {
              return transition;
            }
          }
          return null;
        }

        /**
         * Searches for a transition which should be performed
         * if specified node updates for no more than `deltaTime` and less than `result.requires`.
         * We solve the relative durations of transitions based on duration of `realNode`.
         *
         * @returns The transition matched, or null if there's no matched transition.
         */
        _matchTransition(node, realNode) {
          assertIsTrue(node === realNode || node.kind === NodeKind.any);
          const {
            _conditionEvaluationContext: conditionEvaluationContext
          } = this;
          conditionEvaluationContext.set(realNode);
          const {
            outgoingTransitions
          } = node;
          const nTransitions = outgoingTransitions.length;
          for (let iTransition = 0; iTransition < nTransitions; ++iTransition) {
            const transition = outgoingTransitions[iTransition];
            if (transition.activated) {
              continue;
            }
            const {
              conditions
            } = transition;
            const nConditions = conditions.length;

            // Handle empty condition case.
            if (nConditions === 0) {
              if (node.kind === NodeKind.entry || node.kind === NodeKind.exit) {
                // These kinds of transition is definitely chosen.
                if (DEBUG) {
                  conditionEvaluationContext.unset();
                }
                return transition;
              }
              if (!transition.exitConditionEnabled) {
                // Invalid transition, ignored.
                continue;
              }
            }
            if (realNode.kind === NodeKind.animation && transition.exitConditionEnabled) {
              const exitTime = realNode.duration * transition.exitCondition;
              const currentStateTime = realNode.time;
              if (currentStateTime < exitTime) {
                break;
              }
            }
            let satisfied = true;
            for (let iCondition = 0; iCondition < nConditions; ++iCondition) {
              const condition = conditions[iCondition];
              if (!condition.eval(this._conditionEvaluationContext)) {
                satisfied = false;
                break;
              }
            }
            if (!satisfied) {
              continue;
            }

            // Arrive here means all conditions are satisfied,
            // and either the exit condition is disabled or the exit condition is just 0.0.
            if (DEBUG) {
              conditionEvaluationContext.unset();
            }
            return transition;
          }
          if (DEBUG) {
            conditionEvaluationContext.unset();
          }
          return null;
        }
        _activateTransition(prefix, lastTransition) {
          const destinationState = lastTransition.to;
          assertIsTrue(isRealState(destinationState));
          const activatedTransition = this._activatedTransitionPool.alloc();
          activatedTransition.reset(prefix, lastTransition);
          this._activatedTransitions.push(activatedTransition);

          // Reset triggers along the path.
          const nTransitions = activatedTransition.path.length;
          for (let iTransition = 0; iTransition < nTransitions; ++iTransition) {
            const transition = activatedTransition.path[iTransition];
            this._resetTriggersOnTransition(transition);
          }

          // Call enter hooks on detailed transitions.
          for (let iDetailedTransition = 0; iDetailedTransition < activatedTransition.path.length; ++iDetailedTransition) {
            const detailedTransition = activatedTransition.path[iDetailedTransition];
            // We're entering a state machine
            this._callEnterMethods(detailedTransition.to);
          }

          // Fire transition out event on source real state.
          assertIsTrue(this._activatedTransitions.length > 0);
          const previousState = this._activatedTransitions.length === 1 // this activating transition
          ? this._currentNode : this._activatedTransitions[this._activatedTransitions.length - 2].destination;
          if (previousState instanceof EventifiedStateEval) {
            if (previousState.transitionOutEventBinding) {
              this._emit(previousState.transitionOutEventBinding);
            }
          }

          // Fire start event on the transition.
          if (lastTransition.startEventBinding) {
            this._emit(lastTransition.startEventBinding);
          }

          // Fire transition in event on destination real target.
          if (destinationState instanceof EventifiedStateEval) {
            if (destinationState.transitionInEventBinding) {
              this._emit(destinationState.transitionInEventBinding);
            }
          }
        }

        /**
         * Update transitions, also update states within(includes the case of no transition).
         * @param deltaTime Time piece.
         * @returns
         */
        _updateActivatedTransitions(deltaTime) {
          const {
            _activatedTransitions: activatedTransitions
          } = this;
          let iTransition = activatedTransitions.length - 1;

          // Asserts: while updating transition sequences,
          // the "update consume time" of the last transition, let's say _t_,
          // always not less than those of preceding transitions.
          // The reason is, if it's less than, means the last transition does not consume all the `deltaTime`,
          // which further means the last transition was done and
          // once the last transition was done, all preceding transitions are dropped.
          //
          // All states involved after updating shall also update _t_ times.

          let remainingWeight = 1.0;
          let lastTransitionIndex = iTransition;
          for (; iTransition >= 0; --iTransition) {
            const transition = activatedTransitions[iTransition];
            const sourceState = iTransition === 0 ? this._currentNode : activatedTransitions[iTransition - 1].destination;
            transition.update(deltaTime, sourceState);

            // Once the transition is done, all previous transitions should be dropped
            // and we could break loop directly.
            if (transition.done) {
              this._dropActivatedTransitions(lastTransitionIndex);
              break;
            }

            // Allocate weight for the destination state.
            const destinationWeight = transition.normalizedElapsedTime * remainingWeight;
            transition.destination.increaseAbsoluteWeight(destinationWeight);
            remainingWeight *= 1.0 - transition.normalizedElapsedTime;
            lastTransitionIndex = iTransition - 1;
          }

          // Allocate remain weight to the latest current state.
          this._currentNode.increaseAbsoluteWeight(remainingWeight);
        }

        /**
         * Drops the transitions from `0` to `lastTransitionIndex` in `this._activatedTransitions`.
         * @note This methods may modifies the length of `this._activatedTransitions`.
         */
        _dropActivatedTransitions(lastTransitionIndex) {
          const {
            _activatedTransitions: activatedTransition,
            _activatedTransitionPool: activatedTransitionPool
          } = this;
          assertIsTrue(lastTransitionIndex >= 0 && lastTransitionIndex < activatedTransition.length);
          const lenSubpath = lastTransitionIndex + 1;
          const lastTransition = activatedTransition[lastTransitionIndex];
          const newCurrentState = lastTransition.destination;

          // Call exist hooks, then destroy the transition instance.
          // Call end event binding on last transition.
          {
            assertIsTrue(lastTransition.path.length !== 0);
            const lastRealTransition = lastTransition.path[lastTransition.path.length - 1];
            if (lastRealTransition.endEventBinding) {
              this._emit(lastRealTransition.endEventBinding);
            }
          }
          this._callExitMethods(this._currentNode);
          for (let iTransition = 0; iTransition <= lastTransitionIndex; ++iTransition) {
            const transition = activatedTransition[iTransition];

            // Except last transition,
            // all transitions' should have their destination state decreasing active reference.
            // The last transition don't need to decrease
            // since it will become current node.
            if (iTransition !== lastTransitionIndex) {
              transition.destination.decreaseActiveReference();
            }

            // Call exit hooks on detailed transitions.
            // If this is NOT the last transition, all detailed transitions would be exit.
            // Otherwise, the last detailed transition is not included.
            const iLastExitingDetailedTransition = iTransition === lastTransitionIndex ? transition.path.length - 1 : transition.path.length;
            for (let iDetailedTransition = 0; iDetailedTransition < iLastExitingDetailedTransition; ++iDetailedTransition) {
              const detailedTransition = transition.path[iDetailedTransition];
              this._callExitMethods(detailedTransition.to);
            }
            activatedTransitionPool.free(transition);
          }

          // Splice the subpath.
          if (lastTransitionIndex === activatedTransition.length - 1) {
            // Optimize for the usual case: there's only one transition.
            activatedTransition.length = 0;
          } else {
            // General case: this should be same with `activatedTransition.splice(firstTransitionIndex, lenSubpath)`.
            for (let iTransition = lastTransitionIndex + 1; iTransition < activatedTransition.length; ++iTransition) {
              activatedTransition[iTransition - lenSubpath] = activatedTransition[iTransition];
            }
            activatedTransition.length -= lenSubpath;
          }

          // Redefine the very first state.
          this._currentNode.decreaseActiveReference();
          this._currentNode = newCurrentState;
        }
        _resetTriggersOnTransition(transition) {
          const {
            triggers
          } = transition;
          if (triggers) {
            const nTriggers = triggers.length;
            for (let iTrigger = 0; iTrigger < nTriggers; ++iTrigger) {
              const trigger = triggers[iTrigger];
              this._resetTrigger(trigger);
            }
          }
        }
        _resetTrigger(name) {
          const {
            _triggerReset: triggerResetFn
          } = this;
          triggerResetFn(name);
        }
        _callEnterMethods(node) {
          var _node$stateMachine$co;
          const {
            _controller: controller
          } = this;
          switch (node.kind) {
            default:
              break;
            case NodeKind.animation:
              {
                node.components.callMotionStateEnterMethods(controller, node.getStatus());
                break;
              }
            case NodeKind.entry:
              (_node$stateMachine$co = node.stateMachine.components) == null || _node$stateMachine$co.callStateMachineEnterMethods(controller);
              break;
          }
        }
        _callExitMethods(node) {
          var _node$stateMachine$co2;
          const {
            _controller: controller
          } = this;
          switch (node.kind) {
            default:
              break;
            case NodeKind.animation:
              {
                node.components.callMotionStateExitMethods(controller, node.getStatus());
                break;
              }
            case NodeKind.exit:
              (_node$stateMachine$co2 = node.stateMachine.components) == null || _node$stateMachine$co2.callStateMachineExitMethods(controller);
              break;
          }
        }
        _emit(eventBinding) {
          eventBinding.emit(this._controller.node);
        }
      });
      emptyClipStatusesIterator = {
        next(..._args) {
          return {
            done: true,
            value: undefined
          };
        }
      };
      emptyClipStatusesIterable = {
        [Symbol.iterator]() {
          return emptyClipStatusesIterator;
        }
      };
      NodeKind = /*#__PURE__*/function (NodeKind) {
        NodeKind[NodeKind["entry"] = 0] = "entry";
        NodeKind[NodeKind["exit"] = 1] = "exit";
        NodeKind[NodeKind["any"] = 2] = "any";
        NodeKind[NodeKind["animation"] = 3] = "animation";
        NodeKind[NodeKind["empty"] = 4] = "empty";
        NodeKind[NodeKind["procedural"] = 5] = "procedural";
        return NodeKind;
      }(NodeKind || {});
      _export("StateEval", StateEval = class StateEval {
        /**
         * @internal
         */

        constructor(node) {
          this.name = void 0;
          this.outgoingTransitions = [];
          this._activeReferenceCount = 0;
          this._tickFlags = 0;
          this._absoluteWeight = 0.0;
          this.name = node.name;
        }
        /**
         * The absolute weight of this state.
         */
        get absoluteWeight() {
          return this._absoluteWeight;
        }

        /**
         * The count which counts how many places referencing this state:
         * - If the state is activated as current state, the count increased.
         * - If the state is activated as a transition destination, the count increased.
         */
        get activeReferenceCount() {
          return this._activeReferenceCount;
        }
        setPrefix_debug(prefix) {
          this.__DEBUG_ID__ = `${prefix}${this.name}`;
        }
        addTransition(transition) {
          this.outgoingTransitions.push(transition);
        }

        /**
         * Increases an active reference.
         */
        increaseActiveReference() {
          if (this._activeReferenceCount === 0) {
            this._absoluteWeight = 0.0;
            this._tickFlags = 0;
          }
          ++this._activeReferenceCount;
        }

        /**
         * Decrease an active reference.
         */
        decreaseActiveReference() {
          if (DEBUG) {
            this._checkActivated();
          }
          --this._activeReferenceCount;
        }
        resetTickFlagsAndWeight() {
          this._checkActivated();
          this._absoluteWeight = 0.0;
          this._tickFlags = 0;
        }
        increaseAbsoluteWeight(weight) {
          this._absoluteWeight += weight;
        }
        testTickFlag(flag) {
          if (DEBUG) {
            this._checkActivated();
          }
          return !!(this._tickFlags & flag);
        }
        setTickFlag(flag) {
          if (DEBUG) {
            this._checkActivated();
          }
          assertIsTrue(!this.testTickFlag(flag), `Can not set ${StateTickFlag[flag]} since it has been set!`);
          this._tickFlags |= flag;
        }
        _checkActivated() {
          assertIsTrue(this._activeReferenceCount > 0, `The state has not been activated`);
        }
      });
      EventifiedStateEval = class EventifiedStateEval extends StateEval {
        constructor(state) {
          super(state);
          this.transitionInEventBinding = undefined;
          this.transitionOutEventBinding = undefined;
          if (state.transitionInEventBinding.isBound) {
            this.transitionInEventBinding = state.transitionInEventBinding;
          }
          if (state.transitionOutEventBinding.isBound) {
            this.transitionOutEventBinding = state.transitionOutEventBinding;
          }
        }
      };
      StateTickFlag = /*#__PURE__*/function (StateTickFlag) {
        /**
         * The state has been updated in this tick?
         */
        StateTickFlag[StateTickFlag["UPDATED"] = 1] = "UPDATED";
        /**
         * The state has been evaluated in this tick?
         */
        StateTickFlag[StateTickFlag["EVALUATED"] = 2] = "EVALUATED";
        return StateTickFlag;
      }(StateTickFlag || {});
      InstantiatedComponents = class InstantiatedComponents {
        constructor(node) {
          this._components = node.instantiateComponents();
        }
        callMotionStateEnterMethods(controller, status) {
          this._callMotionStateCallbackIfNonDefault('onMotionStateEnter', controller, status);
        }
        callMotionStateUpdateMethods(controller, status) {
          this._callMotionStateCallbackIfNonDefault('onMotionStateUpdate', controller, status);
        }
        callMotionStateExitMethods(controller, status) {
          this._callMotionStateCallbackIfNonDefault('onMotionStateExit', controller, status);
        }
        callStateMachineEnterMethods(controller) {
          this._callStateMachineCallbackIfNonDefault('onStateMachineEnter', controller);
        }
        callStateMachineExitMethods(controller) {
          this._callStateMachineCallbackIfNonDefault('onStateMachineExit', controller);
        }
        _callMotionStateCallbackIfNonDefault(methodName, controller, status) {
          const {
            _components: components
          } = this;
          const nComponents = components.length;
          for (let iComponent = 0; iComponent < nComponents; ++iComponent) {
            const component = components[iComponent];
            if (component[methodName] !== StateMachineComponent.prototype[methodName]) {
              component[methodName](controller, status);
            }
          }
        }
        _callStateMachineCallbackIfNonDefault(methodName, controller) {
          const {
            _components: components
          } = this;
          const nComponents = components.length;
          for (let iComponent = 0; iComponent < nComponents; ++iComponent) {
            const component = components[iComponent];
            if (component[methodName] !== StateMachineComponent.prototype[methodName]) {
              component[methodName](controller);
            }
          }
        }
      };
      /**
       * Track the evaluation of a virtual motion state-machine.
       */
      VMSMEval = class VMSMEval {
        constructor(state, context) {
          var _state$motion$createE, _state$motion;
          this._source = null;
          this._baseSpeed = 1.0;
          this._speed = 1.0;
          this._publicState = void 0;
          this._privateState = void 0;
          const name = state.name;
          this._baseSpeed = state.speed;
          this._setSpeedMultiplier(1.0);
          if (state.speedMultiplierEnabled && state.speedMultiplier) {
            const speedMultiplierVarName = state.speedMultiplier;
            const varInstance = context.getVar(speedMultiplierVarName);
            if (validateVariableExistence(varInstance, speedMultiplierVarName)) {
              validateVariableType(varInstance.type, VariableType.FLOAT, speedMultiplierVarName);
              varInstance.bind(this._setSpeedMultiplier, this);
              const initialSpeedMultiplier = varInstance.value;
              this._setSpeedMultiplier(initialSpeedMultiplier);
            }
          }
          const sourceEval = (_state$motion$createE = (_state$motion = state.motion) == null ? void 0 : _state$motion[createEval](context, false)) != null ? _state$motion$createE : null;
          if (sourceEval) {
            Object.defineProperty(sourceEval, '__DEBUG_ID__', {
              value: name
            });
          }
          this._source = sourceEval;
          this._publicState = new VMSMInternalState(this, state, sourceEval == null ? void 0 : sourceEval.createPort());
          this._privateState = new VMSMInternalState(this, state, sourceEval == null ? void 0 : sourceEval.createPort());
          this.components = new InstantiatedComponents(state);
        }
        get duration() {
          var _this$_source$duratio, _this$_source;
          return (_this$_source$duratio = (_this$_source = this._source) == null ? void 0 : _this$_source.duration) != null ? _this$_source$duratio : 0.0;
        }
        get speed() {
          return this._speed;
        }
        get entry() {
          return this._publicState;
        }
        get stateMachine() {
          return this._stateMachine;
        }
        set stateMachine(value) {
          this._stateMachine = value;
          this._publicState.stateMachine = value;
          this._privateState.stateMachine = value;
        }
        setPrefix_debug(prefix) {
          this._publicState.setPrefix_debug(prefix);
          this._privateState.setPrefix_debug(prefix);
        }
        addTransition(transition) {
          // If the transition is a self transition,
          // copy the transition but modify it so that it point to the private state.
          if (transition.to === this._publicState) {
            this._publicState.addTransition({
              ...transition,
              to: this._privateState
            });
          } else {
            this._publicState.addTransition(transition);
          }
          this._privateState.addTransition(transition);
        }
        getClipStatuses(baseWeight) {
          const {
            _source: source
          } = this;
          if (!source) {
            return emptyClipStatusesIterable;
          } else {
            return {
              [Symbol.iterator]: () => source.getClipStatuses(baseWeight)
            };
          }
        }
        overrideClips(context) {
          var _this$_source2;
          (_this$_source2 = this._source) == null || _this$_source2.overrideClips(context);
        }
        _setSpeedMultiplier(value) {
          this._speed = this._baseSpeed * value;
        }
      };
      VMSMInternalState = class VMSMInternalState extends EventifiedStateEval {
        constructor(container, containerState, port) {
          super(containerState);
          this.kind = NodeKind.animation;
          this._container = void 0;
          this._progress = 0.0;
          this._port = void 0;
          this._statusCache = createStateStatusCache();
          this._container = container;
          this._port = port;
        }
        get duration() {
          return this._container.duration;
        }
        get components() {
          return this._container.components;
        }
        get normalizedTime() {
          return this._progress;
        }
        get time() {
          return this._progress * this._container.duration;
        }
        reenter(initialTimeNormalized) {
          var _this$_port;
          this._progress = initialTimeNormalized;
          (_this$_port = this._port) == null || _this$_port.reenter();
        }
        getStatus() {
          const {
            _statusCache: stateStatus
          } = this;
          if (DEBUG) {
            stateStatus.__DEBUG_ID__ = this.name;
          }
          stateStatus.progress = normalizeProgress(this._progress);
          return stateStatus;
        }
        getClipStatuses(baseWeight) {
          return this._container.getClipStatuses(baseWeight);
        }
        update(deltaTime, controller) {
          this._progress = calcProgressUpdate(this._progress, this.duration, deltaTime * this._container.speed);
          this._container.components.callMotionStateUpdateMethods(controller, this.getStatus());
        }
        evaluate(context) {
          var _this$_port$evaluate, _this$_port2;
          return (_this$_port$evaluate = (_this$_port2 = this._port) == null ? void 0 : _this$_port2.evaluate(this._progress, context)) != null ? _this$_port$evaluate : null;
        }
      };
      _export("SpecialStateEval", SpecialStateEval = class SpecialStateEval extends StateEval {
        constructor(node, kind, name) {
          super(node);
          this.kind = void 0;
          this.kind = kind;
        }
      });
      _export("EmptyStateEval", EmptyStateEval = class EmptyStateEval extends StateEval {
        constructor(node) {
          super(node);
          this.kind = NodeKind.empty;
        }
      });
      ProceduralPoseStateEval = class ProceduralPoseStateEval extends EventifiedStateEval {
        constructor(state, context) {
          super(state);
          this.kind = NodeKind.procedural;
          this.elapsedTime = 0.0;
          this.statusCache = createStateStatusCache();
          this._instantiatedPoseGraph = void 0;
          this._statusCache = createStateStatusCache();
          this._elapsedTime = 0.0;
          const instantiatedPoseGraph = instantiatePoseGraph(state.graph, context, true);
          instantiatedPoseGraph.bind(context);
          this._instantiatedPoseGraph = instantiatedPoseGraph;
          if (DEBUG) {
            this._statusCache.__DEBUG_ID__ = state.name;
          }
          this._statusCache.progress = 0.0;
        }
        settle(context) {
          this._instantiatedPoseGraph.settle(context);
        }
        reenter() {
          this._statusCache.progress = 0.0;
          this._instantiatedPoseGraph.reenter();
        }
        update(context) {
          this._elapsedTime += context.deltaTime;
          this._instantiatedPoseGraph.update(context);
        }
        evaluate(context) {
          var _this$_instantiatedPo;
          return (_this$_instantiatedPo = this._instantiatedPoseGraph.evaluate(context)) != null ? _this$_instantiatedPo : null;
        }
        getStatus() {
          this._statusCache.progress = normalizeProgress(this._elapsedTime);
          return this._statusCache;
        }
        countMotionTime() {
          return this._instantiatedPoseGraph.countMotionTime();
        }
      };
      ConditionEvaluationContextImpl = class ConditionEvaluationContextImpl {
        constructor() {
          this.sourceStateWeight = 0.0;
          this._sourceState = undefined;
        }
        set(sourceState) {
          this._sourceState = sourceState;
          if (isRealState(sourceState)) {
            assertIsTrue(sourceState.activeReferenceCount);
            // Cache the weight since it's cheap.
            this.sourceStateWeight = sourceState.absoluteWeight;
          } else {
            this.sourceStateWeight = 0.0;
          }
        }
        unset() {
          this._sourceState = undefined;
          this.sourceStateWeight = 0.0;
        }
        get sourceStateMotionTimeNormalized() {
          const {
            _sourceState: sourceState
          } = this;
          assertIsTrue(sourceState && (sourceState.kind === NodeKind.animation || sourceState.kind === NodeKind.procedural) && sourceState.activeReferenceCount, `State motion time is only defined on activated motion states and procedural pose states.`);
          switch (sourceState.kind) {
            case NodeKind.animation:
              return sourceState.normalizedTime;
            case NodeKind.procedural:
              return sourceState.countMotionTime();
            default:
              return 0.0;
          }
        }
      };
      /**
       * Describes an activated transition to a **real state**.
       */
      ActivatedTransition = class ActivatedTransition {
        constructor() {
          /**
           * The normalized time elapsed.
           */
          this.normalizedElapsedTime = 0.0;
          /**
           * The detailed transitions along which the transition is activated.
           * At least has one.
           */
          this.path = [];
          this._durationMultiplier = 1.0;
        }
        get done() {
          return approx(this.normalizedElapsedTime, 1.0, 1e-6);
        }
        getAbsoluteDuration(baseDurationState) {
          return this._getAbsoluteDurationUnscaled(baseDurationState) * this._durationMultiplier;
        }
        update(deltaTime, fromState) {
          // If the transitions is not starting with a concrete state.
          // We can directly finish the transition.
          if (!isRealState(fromState)) {
            this.normalizedElapsedTime = 1.0;
            return;
          }
          const transitionDurationAbsolute = this.getAbsoluteDuration(fromState);
          let contrib = 0.0;
          if (transitionDurationAbsolute <= 0.0) {
            contrib = 0.0;
            this.normalizedElapsedTime = 1.0;
          } else {
            const elapsedTransitionTime = this.normalizedElapsedTime * transitionDurationAbsolute;
            const remainTransitionTime = transitionDurationAbsolute - elapsedTransitionTime;
            assertIsTrue(remainTransitionTime >= 0.0);
            contrib = Math.min(remainTransitionTime, deltaTime);
            const newTransitionProgress = clamp01((elapsedTransitionTime + contrib) / transitionDurationAbsolute);
            this.normalizedElapsedTime = newTransitionProgress;
            assertIsTrue(newTransitionProgress >= 0.0 && newTransitionProgress <= 1.0);
          }
        }
        static createPool(initialCapacity) {
          const destructor = !DEBUG ? undefined : transitionInstance => {
            transitionInstance.normalizedElapsedTime = Number.NaN;
          };
          const pool = new Pool(() => new ActivatedTransition(), initialCapacity, destructor);
          return pool;
        }
        reset(prefix, lastTransition) {
          const destinationState = lastTransition.to;
          assertIsTrue(isRealState(destinationState));
          this.normalizedElapsedTime = 0.0;
          this.destination = destinationState;
          this.path = [...prefix, lastTransition];

          // Increase active reference on the state.
          const previousActiveReferenceCount = destinationState.activeReferenceCount;
          destinationState.increaseActiveReference();

          // If this is the initial activation, reenter the state.
          if (previousActiveReferenceCount === 0) {
            if (destinationState.kind === NodeKind.animation) {
              const {
                destinationStart,
                relativeDestinationStart: isRelativeDestinationStart
              } = this.path[0];
              const destinationStartRatio = isRelativeDestinationStart ? destinationStart : destinationState.duration === 0 ? 0.0 : destinationStart / destinationState.duration;
              destinationState.reenter(destinationStartRatio);
            } else if (destinationState.kind === NodeKind.procedural) {
              destinationState.reenter();
            }
          }

          // More the existing destination weight, less the transition duration.
          assertIsTrue(destinationState.activeReferenceCount > 0);
          this._durationMultiplier = 1.0 - destinationState.absoluteWeight;
        }
        _getAbsoluteDurationUnscaled(baseDurationState) {
          assertIsTrue(this.path.length !== 0);
          const {
            duration,
            normalizedDuration
          } = this.path[0];
          if (!normalizedDuration) {
            return duration;
          }
          const baseDuration = baseDurationState.kind === NodeKind.animation ? baseDurationState.duration : 1.0;
          return baseDuration * duration;
        }
      };
    }
  };
});