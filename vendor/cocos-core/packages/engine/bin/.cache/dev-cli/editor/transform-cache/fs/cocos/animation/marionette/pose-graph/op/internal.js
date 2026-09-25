System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/op/internal.js", ["../pose-node.js", "../foundation/authoring/input-authoring.js", "../pure-value-node.js", "../../../../core/index.js", "../foundation/type-system.js", "../foundation/pose-graph-node.js"], function (_export, _context) {
  "use strict";

  var PoseNode, globalPoseGraphNodeInputManager, PureValueNode, assertIsTrue, error, PoseGraphType, PoseGraphNode, POSE_NODE_OUTPUT_BINDING_KEY, getOutputKeys;
  function getInputKeys(node) {
    return globalPoseGraphNodeInputManager.getInputKeys(node);
  }
  function isValidInputKey(node, key) {
    return globalPoseGraphNodeInputManager.hasInput(node, key);
  }
  function getInputMetadata(node, key) {
    return globalPoseGraphNodeInputManager.getInputMetadata(node, key);
  }
  function getInputConstantValue(node, key) {
    if (!globalPoseGraphNodeInputManager.hasInput(node, key)) {
      return undefined;
    }
    if (globalPoseGraphNodeInputManager.isPoseInput(node, key)) {
      // Pose input's "constant value" is defined as `null`.
      return null;
    }
    return getPureValueInputConstantValue(node, key);
  }
  function getInputBinding(graph, node, key) {
    var _graph$getShell;
    return (_graph$getShell = graph.getShell(node)) == null ? void 0 : _graph$getShell.findBinding(key);
  }
  function getInputInsertInfos(node) {
    return globalPoseGraphNodeInputManager.getInputInsertInfos(node);
  }
  function insertInput(graph, node, insertId) {
    return globalPoseGraphNodeInputManager.insertInput(graph, node, insertId);
  }
  function deleteInput(graph, node, key) {
    globalPoseGraphNodeInputManager.deleteInput(graph, node, key);
  }
  function getOutputType(node, outputId) {
    if (node instanceof PoseNode) {
      return PoseGraphType.POSE;
    } else if (node instanceof PureValueNode) {
      const outputIndex = Number(outputId);
      if (outputIndex < 0 || outputIndex >= node.outputCount) {
        throw new Error(`${node} does not have specified output key ${outputId}`);
      } else {
        return node.getOutputType(outputIndex);
      }
    } else {
      throw new Error(`${node} does not have specified output key.`);
    }
  }
  function connectNode(graph, node, key, producer, outputKey) {
    const consumerNode = node;
    const consumerShell = graph.getShell(node);
    if (!consumerShell) {
      error(`Consumer node is not with in graph!`);
      return;
    }
    const inputMetadata = getInputMetadata(consumerNode, key);
    if (!inputMetadata) {
      error(`Consumer node does not have such specified input key ${key}`);
      return;
    }
    let outputIndex = 0;
    let outputType;
    if (producer instanceof PureValueNode) {
      if (typeof outputKey !== 'number') {
        error(`Output key is not specified.`);
        return;
      }
      const outputIndex = Number(outputKey);
      if (outputIndex < 0 || outputIndex >= producer.outputCount) {
        error(`Producer node does not have such specified output key ${key}`);
        return;
      }
      outputType = producer.getOutputType(outputIndex);
    } else {
      if ((outputKey != null ? outputKey : POSE_NODE_OUTPUT_BINDING_KEY) !== POSE_NODE_OUTPUT_BINDING_KEY) {
        error(`Pose nodes have and only have single output.`);
        return;
      }
      outputType = PoseGraphType.POSE;
    }
    const inputType = inputMetadata.type;
    if (inputType !== outputType) {
      error(`Type mismatch: input has type ${PoseGraphType[inputType]}, output has type ${PoseGraphType[outputType]}.`);
      return;
    }

    // We currently do not allow a pose producer to be connected to multiple consumers.
    if (outputType === PoseGraphType.POSE) {
      for (const node of graph.nodes()) {
        const shell = graph.getShell(node);
        assertIsTrue(shell);
        shell.deleteBindingTo(producer);
      }
    }
    const [propertyKey, elementIndex = -1] = key;
    const property = consumerNode[propertyKey];
    if (elementIndex >= 0) {
      if (!Array.isArray(property)) {
        return;
      }
      if (elementIndex >= property.length) {
        return;
      }
      consumerShell.addBinding([propertyKey, elementIndex], producer, outputIndex);
    } else {
      consumerShell.addBinding([propertyKey], producer, outputIndex);
    }
  }
  function disconnectNode(graph, node, key) {
    var _graph$getShell2;
    (_graph$getShell2 = graph.getShell(node)) == null || _graph$getShell2.deleteBinding(key);
  }
  function connectOutputNode(graph, producer) {
    const {
      outputNode
    } = graph;
    const outputNodeInputKeys = getInputKeys(outputNode);
    assertIsTrue(outputNodeInputKeys.length === 1);
    connectNode(graph, outputNode, outputNodeInputKeys[0], producer);
  }
  function hasInputBinding(graph, node, key, producerNode, producerOutputKey) {
    const binding = getInputBinding(graph, node, key);
    if (!binding) {
      return false;
    }
    return binding.producer === producerNode && binding.outputIndex === producerOutputKey;
  }
  function getPureValueInputConstantValue(node, inputKey) {
    const [propertyKey, elementIndex = -1] = inputKey;
    const property = node[propertyKey];
    if (!Array.isArray(property)) {
      return property;
    }
    if (elementIndex < 0 || elementIndex >= property.length) {
      return undefined;
    }
    return property[elementIndex];
  }
  function isWellFormedInputKey(test) {
    if (!Array.isArray(test)) {
      return false;
    }
    if (test.length > 2) {
      return false;
    }
    if (typeof test[0] !== 'string') {
      return false;
    }
    if (test.length > 1) {
      const e1 = test[1];
      if (typeof e1 !== 'number' || e1 < 0 || !Number.isFinite(e1)) {
        return false;
      }
    }
    return true;
  }
  _export({
    getInputKeys: getInputKeys,
    isValidInputKey: isValidInputKey,
    getInputMetadata: getInputMetadata,
    getInputConstantValue: getInputConstantValue,
    getInputBinding: getInputBinding,
    getInputInsertInfos: getInputInsertInfos,
    insertInput: insertInput,
    deleteInput: deleteInput,
    getOutputType: getOutputType,
    connectNode: connectNode,
    disconnectNode: disconnectNode,
    connectOutputNode: connectOutputNode,
    hasInputBinding: hasInputBinding,
    isWellFormedInputKey: isWellFormedInputKey
  });
  return {
    setters: [function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
    }, function (_foundationAuthoringInputAuthoringJs) {
      globalPoseGraphNodeInputManager = _foundationAuthoringInputAuthoringJs.globalPoseGraphNodeInputManager;
    }, function (_pureValueNodeJs) {
      PureValueNode = _pureValueNodeJs.PureValueNode;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      error = _coreIndexJs.error;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_foundationPoseGraphNodeJs) {
      PoseGraphNode = _foundationPoseGraphNodeJs.PoseGraphNode;
    }],
    execute: function () {
      _export("Node", PoseGraphNode);
      _export("PoseGraphType", PoseGraphType);
      POSE_NODE_OUTPUT_BINDING_KEY = 0;
      _export("getOutputKeys", getOutputKeys = (() => {
        const poseNodeOutputKeys = Object.freeze([POSE_NODE_OUTPUT_BINDING_KEY]);
        return node => {
          if (node instanceof PoseNode) {
            return poseNodeOutputKeys;
          } else if (node instanceof PureValueNode) {
            // TODO: optimize me
            const outputCount = node.outputCount;
            return Array.from({
              length: outputCount
            }, (_, i) => i);
          } else {
            return [];
          }
        };
      })());
    }
  };
});