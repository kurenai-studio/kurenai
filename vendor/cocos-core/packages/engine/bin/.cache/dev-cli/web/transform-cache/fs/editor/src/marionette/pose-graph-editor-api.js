System.register("q-bundled:///fs/editor/src/marionette/pose-graph-editor-api.js", ["../../../cocos/animation/marionette/pose-graph/foundation/pose-graph-node.js", "../../../cocos/animation/marionette/pose-graph/foundation/authoring/node-authoring.js", "../../exports/new-gen-anim.js", "../../../cocos/serialization/index.js", "../../../cocos/animation/marionette/pose-graph/graph-output-node.js", "../../../cocos/animation/marionette/pose-graph/pose-node.js", "../../../cocos/animation/marionette/pose-graph/pure-value-node.js", "../../../exports/base.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/use-stashed-pose.js", "./visit/visit-pose-node.js", "../../../cocos/animation/marionette/pose-graph/pose-graph.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/state-machine.js", "../../../cocos/core/data/utils/attribute.js", "./pose-graph/drag/index.js"], function (_export, _context) {
  "use strict";

  var PoseGraphNode, getPoseGraphNodeEditorMetadata, poseGraphOp, instantiate, PoseGraphOutputNode, PoseNode, PureValueNode, assertIsTrue, editorExtrasTag, PoseNodeUseStashedPose, visitPoseNodeInLayer, PoseGraph, PoseNodeStateMachine, attr;
  function* getCreatePoseGraphNodeEntries(classConstructor, createNodeContext) {
    if (classConstructor === PoseNode || classConstructor === PureValueNode || classConstructor === PoseGraphOutputNode) {
      return;
    }
    const nodeClassMetadata = getPoseGraphNodeEditorMetadata(classConstructor);
    if (!nodeClassMetadata) {
      yield {
        arg: undefined
      };
      return;
    }
    if (nodeClassMetadata.hide) {
      return;
    }
    if (nodeClassMetadata.factory) {
      for (const entry of nodeClassMetadata.factory.listEntries(createNodeContext)) {
        yield {
          category: nodeClassMetadata.category,
          subMenu: entry.menu,
          arg: entry.arg
        };
      }
    } else {
      yield {
        arg: undefined,
        category: nodeClassMetadata.category
      };
    }
  }
  function createPoseGraphNode(classConstructor, arg) {
    const nodeClassMetadata = getPoseGraphNodeEditorMetadata(classConstructor);
    if (nodeClassMetadata != null && nodeClassMetadata.factory) {
      return nodeClassMetadata.factory.create(arg);
    }
    return new classConstructor();
  }
  function getNodeAppearanceOptions(node) {
    const classConstructor = node.constructor;
    const metadata = getPoseGraphNodeEditorMetadata(classConstructor);
    return metadata == null ? void 0 : metadata.appearance;
  }
  function getInputConventionalI18nInfo(inputKey) {
    if (inputKey.length !== 1) {
      return [`inputs.${inputKey[0]}`, {
        elementIndex: inputKey[1]
      }];
    } else {
      return [`inputs.${inputKey}`];
    }
  }
  function getInputDefaultDisplayName(inputKey) {
    if (inputKey.length === 1) {
      return inputKey[0];
    } else {
      return `${inputKey[0]}[${inputKey[1]}]`;
    }
  }
  function getPoseGraphNodeInputAttrs(node, inputKey) {
    const [propertyName] = inputKey;
    const attrs = attr(node.constructor, propertyName);
    delete attrs.type;
    delete attrs.ctor;
    if (Array.isArray(node[propertyName])) {
      delete attrs['default'];
    }
    return attrs;
  }
  function clonePoseGraphNode(node) {
    return instantiate(node);
  }
  function copyPoseGraphOutputNode(node) {
    return {
      editorExtras: instantiate(node[editorExtrasTag])
    };
  }
  function pastPoseGraphOutputNode(node, copyInfo) {
    node[editorExtrasTag] = copyInfo.editorExtras;
  }
  function cloneInputKey(inputKey) {
    assertIsTrue(Array.isArray(inputKey) && inputKey.every(v => typeof v === 'number' || typeof v === 'string'));
    return inputKey.slice();
  }
  function copyPoseGraphNodes(poseGraph, nodes, options = {
    copyOutputNodeEditorExtras: true
  }) {
    const nodesDeduplicated = [...new Set(nodes)];

    // Copy nodes.
    const nodeCopyInfos = nodesDeduplicated.map(node => {
      if (node === poseGraph.outputNode) {
        return options.copyOutputNodeEditorExtras ? copyPoseGraphOutputNode(poseGraph.outputNode) : {};
      } else {
        return clonePoseGraphNode(node);
      }
    });

    // Copy bindings.
    const bindingCopyInfos = [];
    nodesDeduplicated.forEach((node, consumerNodeIndex) => {
      for (const inputKey of poseGraphOp.getInputKeys(node)) {
        const binding = poseGraphOp.getInputBinding(poseGraph, node, inputKey);
        if (!binding) {
          continue;
        }
        const producerNode = binding.producer;
        const producerNodeIndex = nodesDeduplicated.indexOf(producerNode);
        if (producerNodeIndex < 0) {
          continue;
        }
        bindingCopyInfos.push({
          consumer: consumerNodeIndex,
          inputKey: cloneInputKey(inputKey),
          producer: producerNodeIndex,
          outputKey: binding.outputIndex
        });
      }
    });
    return {
      nodes: nodeCopyInfos,
      bindings: bindingCopyInfos
    };
  }
  function copyStateMachineAsPoseGraphNode(stateMachine) {
    const poseGraph = new PoseGraph();
    const stateMachineNode = poseGraph.addNode(new PoseNodeStateMachine());
    stateMachine.copyTo(stateMachineNode.stateMachine);
    return copyPoseGraphNodes(poseGraph, [stateMachineNode]);
  }
  function pastePoseGraphNodes(poseGraph, copyInfo, options = {}) {
    const {
      nodes: nodeCopyInfos,
      bindings: bindingCopyInfos
    } = copyInfo;
    const addedNodes = [];

    // Past nodes.
    for (const nodeCopyInfo of nodeCopyInfos) {
      if (nodeCopyInfo instanceof PoseGraphNode) {
        nodeCopyInfo.__callOnAfterDeserializeRecursive == null || nodeCopyInfo.__callOnAfterDeserializeRecursive();
        poseGraph.addNode(nodeCopyInfo);
        addedNodes.push(nodeCopyInfo);
      } else {
        pastPoseGraphOutputNode(poseGraph.outputNode, nodeCopyInfo);
      }
    }

    // Paste bindings.
    for (const {
      consumer,
      inputKey,
      producer,
      outputKey
    } of bindingCopyInfos) {
      assertIsTrue(consumer >= 0 && consumer < nodeCopyInfos.length);
      assertIsTrue(producer >= 0 && producer < nodeCopyInfos.length);
      const consumerCopyInfo = nodeCopyInfos[consumer];
      const producerNode = nodeCopyInfos[producer];
      assertIsTrue(producerNode instanceof PoseGraphNode);
      if (!(consumerCopyInfo instanceof PoseGraphNode) && options.outputNodeBindingRedirect) {
        poseGraphOp.connectNode(poseGraph, options.outputNodeBindingRedirect.consumerNode, options.outputNodeBindingRedirect.inputKey, producerNode, outputKey);
        continue;
      }
      const consumerNode = consumerCopyInfo instanceof PoseGraphNode ? consumerCopyInfo : poseGraph.outputNode;
      poseGraphOp.connectNode(poseGraph, consumerNode, inputKey, producerNode, outputKey);
    }

    // We're doing a cut.
    nodeCopyInfos.length = 0;
    bindingCopyInfos.length = 0;
    return {
      addedNodes
    };
  }
  /**
   * Stash specified pose graph.
   * 
   * Creates a stash, then move all contents in the pose graph into the stash.
   * Then, create a "PoseNodeUseStashedPose" node to reference the newly created stash.
   * 
   * @param layer The layer that the pose graph belongs to.
   * @param poseGraph The pose graph to stash.
   * @param newStashId Id of the newStash.
   * @returns The stash operation result, or undefined if error occurred.
   */
  function stashPoseGraph(layer, poseGraph, newStashId) {
    // Stash already exists.
    if (layer.getStash(newStashId)) {
      return undefined;
    }
    const stash = layer.addStash(newStashId);

    // Copy nodes into stash graph.
    const copyInfo = copyPoseGraphNodes(poseGraph, [...poseGraph.nodes()]);
    pastePoseGraphNodes(stash.graph, copyInfo);

    // Clear original graph.
    for (const node of [...poseGraph.nodes()]) {
      if (node !== poseGraph.outputNode) {
        poseGraph.removeNode(node);
      }
    }

    // Add a `Use stash node into original graph.`
    const useStashNode = new PoseNodeUseStashedPose();
    useStashNode.stashName = newStashId;
    poseGraph.addNode(useStashNode);
    return {
      stash,
      useStashNode: useStashNode // Don't expose the node type.
    };
  }
  function* visitStashReferences(layer, stashId) {
    for (const poseNodeLocation of visitPoseNodeInLayer(layer)) {
      const [poseNode] = poseNodeLocation;
      if (poseNode instanceof PoseNodeUseStashedPose && poseNode.stashName === stashId) {
        yield {
          location: poseNodeLocation,
          alterReference(newStashName) {
            poseNode.stashName = newStashName;
          }
        };
      }
    }
  }
  _export({
    getCreatePoseGraphNodeEntries: getCreatePoseGraphNodeEntries,
    createPoseGraphNode: createPoseGraphNode,
    getNodeAppearanceOptions: getNodeAppearanceOptions,
    getInputConventionalI18nInfo: getInputConventionalI18nInfo,
    getInputDefaultDisplayName: getInputDefaultDisplayName,
    getPoseGraphNodeInputAttrs: getPoseGraphNodeInputAttrs,
    copyPoseGraphNodes: copyPoseGraphNodes,
    copyStateMachineAsPoseGraphNode: copyStateMachineAsPoseGraphNode,
    pastePoseGraphNodes: pastePoseGraphNodes,
    stashPoseGraph: stashPoseGraph,
    visitStashReferences: visitStashReferences
  });
  return {
    setters: [function (_cocosAnimationMarionettePoseGraphFoundationPoseGraphNodeJs) {
      PoseGraphNode = _cocosAnimationMarionettePoseGraphFoundationPoseGraphNodeJs.PoseGraphNode;
    }, function (_cocosAnimationMarionettePoseGraphFoundationAuthoringNodeAuthoringJs) {
      getPoseGraphNodeEditorMetadata = _cocosAnimationMarionettePoseGraphFoundationAuthoringNodeAuthoringJs.getPoseGraphNodeEditorMetadata;
    }, function (_exportsNewGenAnimJs) {
      poseGraphOp = _exportsNewGenAnimJs.poseGraphOp;
    }, function (_cocosSerializationIndexJs) {
      instantiate = _cocosSerializationIndexJs.instantiate;
    }, function (_cocosAnimationMarionettePoseGraphGraphOutputNodeJs) {
      PoseGraphOutputNode = _cocosAnimationMarionettePoseGraphGraphOutputNodeJs.PoseGraphOutputNode;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodeJs) {
      PoseNode = _cocosAnimationMarionettePoseGraphPoseNodeJs.PoseNode;
    }, function (_cocosAnimationMarionettePoseGraphPureValueNodeJs) {
      PureValueNode = _cocosAnimationMarionettePoseGraphPureValueNodeJs.PureValueNode;
    }, function (_exportsBaseJs) {
      assertIsTrue = _exportsBaseJs.assertIsTrue;
      editorExtrasTag = _exportsBaseJs.editorExtrasTag;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesUseStashedPoseJs) {
      PoseNodeUseStashedPose = _cocosAnimationMarionettePoseGraphPoseNodesUseStashedPoseJs.PoseNodeUseStashedPose;
    }, function (_visitVisitPoseNodeJs) {
      visitPoseNodeInLayer = _visitVisitPoseNodeJs.visitPoseNodeInLayer;
    }, function (_cocosAnimationMarionettePoseGraphPoseGraphJs) {
      PoseGraph = _cocosAnimationMarionettePoseGraphPoseGraphJs.PoseGraph;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs) {
      PoseNodeStateMachine = _cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs.PoseNodeStateMachine;
    }, function (_cocosCoreDataUtilsAttributeJs) {
      attr = _cocosCoreDataUtilsAttributeJs.attr;
    }, function (_poseGraphDragIndexJs) {
      var _exportObj = {};
      for (var _key in _poseGraphDragIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _poseGraphDragIndexJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {}
  };
});