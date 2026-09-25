System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/instantiation.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../../serialization/index.js", "./pose-node.js", "./pure-value-node.js", "./pose-nodes/play-motion.js"], function (_export, _context) {
  "use strict";

  var DEBUG, assertIsTrue, warn, instantiate, PoseNode, PoseTransformSpaceRequirement, PureValueNode, PoseNodePlayMotion, InstantiatedPoseGraph, DependencyEvaluation, RuntimePVNodeEvaluation, RuntimePVNodePlainPropertyBinding, RuntimePVNodeArrayElementPropertyBinding;
  // cSpell:words Evaluatable

  function isEvaluatableNode(node) {
    return node instanceof PoseNode || node instanceof PureValueNode;
  }
  function instantiatePoseGraph(graph, linkContext, mayCountMotionTime = false) {
    const {
      outputNode
    } = graph;
    const outputNodeShell = graph.getShell(outputNode);
    assertIsTrue(outputNodeShell);
    const bindings = outputNodeShell.getBindings();
    // Output node can only has 1 or has no binding.
    assertIsTrue(bindings.length < 2);
    if (bindings.length === 0) {
      return new InstantiatedPoseGraph(undefined, mayCountMotionTime ? [] : undefined);
    }
    // If the output node has a binding, it must be pose node.
    const binding = bindings[0];
    assertIsTrue(binding.outputIndex === 0);
    assertIsTrue(binding.producer instanceof PoseNode);
    const instantiationMap = new Map();
    const mainRecord = instantiateNode(graph, binding.producer, instantiationMap, linkContext);
    assertIsTrue(mainRecord instanceof PoseNode);
    return new InstantiatedPoseGraph(mainRecord, mayCountMotionTime ? Array.from(instantiationMap.values()).filter(node => node instanceof PoseNodePlayMotion) : undefined);
  }
  function instantiateNode(graph, node, instantiationMap, linkContext) {
    const shell = graph.getShell(node);
    assertIsTrue(shell, `Want to instantiate an unbound graph?`);
    const existing = instantiationMap.get(node);
    if (existing) {
      return existing;
    }
    const instantiated = instantiate(node);

    // Invoke serialization callback.
    if ('__callOnAfterDeserializeRecursive' in instantiated) {
      instantiated.__callOnAfterDeserializeRecursive();
    }

    /** Link. */
    if (instantiated instanceof PureValueNode) {
      instantiated.link(linkContext);
    }

    /** Alias. */
    const consumerNode = instantiated;

    /**
     * Create the pv-node property binding records.
     */
    const runtimePVNodePropertyBindings = [];
    for (const {
      producer: producerNode,
      outputIndex: producerOutputIndex,
      inputPath: consumerInputPath
    } of shell.getBindings()) {
      if (!isEvaluatableNode(producerNode)) {
        warn(`There's a input bound to a node with unrecognized type.`);
        continue;
      }
      const producer = instantiateNode(graph, producerNode, instantiationMap, linkContext);
      if (producer instanceof PoseNode) {
        // Rule: pose nodes can only be used to feed pose nodes.
        assertIsTrue(consumerNode instanceof PoseNode);
        // Core code: link pose nodes.
        linkPoseNode(consumerNode, consumerInputPath, producer, producerOutputIndex);
      } else {
        const runtimePVNodePropertyBinding = linkPVNode(consumerNode, consumerInputPath, producer, producerOutputIndex);
        if (runtimePVNodePropertyBinding) {
          runtimePVNodePropertyBindings.push(runtimePVNodePropertyBinding);
        }
      }
    }

    // Create the dependency evaluation.
    const dependencyEvaluation = new DependencyEvaluation(runtimePVNodePropertyBindings);

    // Create the evaluation record.
    let evaluation;
    if (consumerNode instanceof PoseNode) {
      // If this is pose node. Injects the dependency.
      consumerNode._setDependencyEvaluation(dependencyEvaluation);
      evaluation = consumerNode;
    } else {
      // Otherwise, create the evaluation record.
      const pureValueNodeEvaluation = new RuntimePVNodeEvaluation(consumerNode, dependencyEvaluation);
      evaluation = pureValueNodeEvaluation;
    }
    instantiationMap.set(node, evaluation);
    return evaluation;
  }
  function linkPoseNode(consumerNode, consumerInputPath, producerNode, producerOutputIndex) {
    const [consumerPropertyKey, consumerElementIndex = -1] = consumerInputPath;
    if (!(consumerPropertyKey in consumerNode)) {
      // Invalid binding.
      warn(`Invalid binding: consumer node has no property ${consumerPropertyKey}`);
      return;
    }
    if (producerOutputIndex !== 0) {
      // Rule: pose nodes have and only have one output.
      warn(`Node ${producerNode.toString()} does not have specified output ${producerOutputIndex}.`);
      return;
    }
    const consumerProperty = consumerNode[consumerPropertyKey];

    // Plain property binding.

    if (consumerElementIndex < 0) {
      if (consumerProperty !== null) {
        // Invalid binding.
        warn(`Invalid binding: consumer node's input ${consumerPropertyKey} should be leaved as evaluation before evaluation.`);
        return;
      }
      consumerNode[consumerPropertyKey] = producerNode;
      return;
    }

    // The following is dedicated to array element bindings.

    if (!Array.isArray(consumerProperty)) {
      // Invalid binding.
      warn(`Invalid binding: consumer node's input ${consumerPropertyKey} should be an array.`);
      return;
    }
    if (consumerElementIndex >= consumerProperty.length) {
      // Invalid binding.
      warn(`Invalid binding: consumer node's input ${consumerPropertyKey} ` + `have length ${consumerProperty.length} but the binding specified ${consumerElementIndex}`);
      return;
    }
    if (consumerProperty[consumerElementIndex] !== null) {
      // Invalid binding.
      warn(`Invalid binding: consumer node's input ${consumerPropertyKey}[${consumerElementIndex}] should be leaved as null before evaluation`);
      return;
    }
    consumerProperty[consumerElementIndex] = producerNode;
  }
  function linkPVNode(consumerNode, consumerInputPath, producerRecord, producerOutputIndex) {
    const [consumerPropertyKey, consumerElementIndex = -1] = consumerInputPath;
    if (!(consumerPropertyKey in consumerNode)) {
      // Invalid binding.
      warn(`Invalid binding: consumer node has no property ${consumerPropertyKey}`);
      return undefined;
    }
    const consumerProperty = consumerNode[consumerPropertyKey];

    // Plain property binding.

    if (consumerElementIndex < 0) {
      return new RuntimePVNodePlainPropertyBinding(consumerNode, consumerPropertyKey, producerRecord, producerOutputIndex);
    }

    // The following is dedicated to array element bindings.

    if (!Array.isArray(consumerProperty)) {
      // Invalid binding.
      warn(`Invalid binding: consumer node's input ${consumerPropertyKey} should be an array.`);
      return undefined;
    }
    if (consumerElementIndex >= consumerProperty.length) {
      // Invalid binding.
      warn(`Invalid binding: consumer node's input ${consumerPropertyKey} ` + `have length ${consumerProperty.length} but the binding specified ${consumerElementIndex}`);
      return undefined;
    }
    return new RuntimePVNodeArrayElementPropertyBinding(consumerNode, consumerPropertyKey, consumerElementIndex, producerRecord, producerOutputIndex);
  }
  _export("instantiatePoseGraph", instantiatePoseGraph);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      warn = _coreIndexJs.warn;
    }, function (_serializationIndexJs) {
      instantiate = _serializationIndexJs.instantiate;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_pureValueNodeJs) {
      PureValueNode = _pureValueNodeJs.PureValueNode;
    }, function (_poseNodesPlayMotionJs) {
      PoseNodePlayMotion = _poseNodesPlayMotionJs.PoseNodePlayMotion;
    }],
    execute: function () {
      InstantiatedPoseGraph = class InstantiatedPoseGraph {
        constructor(_rootPoseNode, _countingPlayMotionNodes) {
          this._rootPoseNode = _rootPoseNode;
          this._countingPlayMotionNodes = _countingPlayMotionNodes;
        }
        bind(context) {
          var _this$_rootPoseNode;
          (_this$_rootPoseNode = this._rootPoseNode) == null || _this$_rootPoseNode.bind(context);
        }
        settle(context) {
          var _this$_rootPoseNode2;
          (_this$_rootPoseNode2 = this._rootPoseNode) == null || _this$_rootPoseNode2.settle(context);
        }
        reenter() {
          var _this$_rootPoseNode3;
          (_this$_rootPoseNode3 = this._rootPoseNode) == null || _this$_rootPoseNode3.reenter();
        }
        update(context) {
          var _this$_rootPoseNode4;
          (_this$_rootPoseNode4 = this._rootPoseNode) == null || _this$_rootPoseNode4.update(context);
        }
        evaluate(context) {
          var _this$_rootPoseNode$e, _this$_rootPoseNode5;
          return (_this$_rootPoseNode$e = (_this$_rootPoseNode5 = this._rootPoseNode) == null ? void 0 : _this$_rootPoseNode5.evaluate(context, PoseTransformSpaceRequirement.LOCAL)) != null ? _this$_rootPoseNode$e : null;
        }
        countMotionTime() {
          const {
            _countingPlayMotionNodes: playMotionNodes
          } = this;
          if (!playMotionNodes) {
            if (DEBUG) {
              assertIsTrue(false, `Should not call countMotionTime() on this pose graph ` + `since "mayCountMotionTime" was not passed to instantiatePoseGraph()`);
            }
            return 0.0;
          }
          let maxWeightedTime = 0.0;
          let maxWeight = Number.NEGATIVE_INFINITY;
          for (let iPlayMotionNode = 0; iPlayMotionNode < playMotionNodes.length; ++iPlayMotionNode) {
            const {
              elapsedMotionTime,
              lastIndicativeWeight
            } = playMotionNodes[iPlayMotionNode];
            if (lastIndicativeWeight > maxWeight) {
              maxWeight = lastIndicativeWeight;
              maxWeightedTime = elapsedMotionTime;
            }
          }
          return maxWeightedTime;
        }
      };
      DependencyEvaluation = class DependencyEvaluation {
        constructor(bindingEvaluations) {
          this._bindingEvaluations = void 0;
          this._bindingEvaluations = bindingEvaluations;
        }
        evaluate() {
          const {
            _bindingEvaluations: bindingEvaluations
          } = this;
          for (const binding of bindingEvaluations) {
            binding.evaluate();
          }
        }
      };
      RuntimePVNodeEvaluation = class RuntimePVNodeEvaluation {
        constructor(_node, _dependency) {
          this._outputs = void 0;
          this._node = _node;
          this._dependency = _dependency;
          this._outputs = new Array(_node.outputCount);
        }
        get node() {
          return this._node;
        }
        get outputCount() {
          return this._outputs.length;
        }
        getDefaultOutput() {
          return this.getOutput(0);
        }
        getOutput(outputIndex) {
          return this._outputs[outputIndex];
        }
        evaluate() {
          const {
            _node: node,
            _dependency: dependency
          } = this;
          // Evaluate the dependency.
          dependency.evaluate();
          // Evaluate the node.
          node.selfEvaluate(this._outputs);
        }
      };
      RuntimePVNodePlainPropertyBinding = class RuntimePVNodePlainPropertyBinding {
        constructor(_consumerNode, _consumerPropertyKey, _producerRecord, _producerOutputIndex) {
          this._consumerNode = _consumerNode;
          this._consumerPropertyKey = _consumerPropertyKey;
          this._producerRecord = _producerRecord;
          this._producerOutputIndex = _producerOutputIndex;
        }
        evaluate() {
          this._producerRecord.evaluate();
          this._consumerNode[this._consumerPropertyKey] = this._producerRecord.getOutput(this._producerOutputIndex);
        }
      };
      RuntimePVNodeArrayElementPropertyBinding = class RuntimePVNodeArrayElementPropertyBinding {
        constructor(_consumerNode, _consumerPropertyKey, _consumerElementIndex, _producerRecord, _producerOutputIndex) {
          this._consumerNode = _consumerNode;
          this._consumerPropertyKey = _consumerPropertyKey;
          this._consumerElementIndex = _consumerElementIndex;
          this._producerRecord = _producerRecord;
          this._producerOutputIndex = _producerOutputIndex;
        }
        evaluate() {
          this._producerRecord.evaluate();
          this._consumerNode[this._consumerPropertyKey][this._consumerElementIndex] = this._producerRecord.getOutput(this._producerOutputIndex);
        }
      };
    }
  };
});