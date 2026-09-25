System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/decorator/node.js", ["../../../../core/index.js", "../foundation/pose-graph-node.js", "../foundation/authoring/node-authoring.js"], function (_export, _context) {
  "use strict";

  var error, js, PoseGraphNode, getOrCreateNodeEditorMetadata, poseGraphNodeCategory, poseGraphCreateNodeFactory, poseGraphNodeHide, poseGraphNodeAppearance;
  function makeNodeEditorMetadataModifier(edit) {
    return target => {
      if (!checkDecoratingClass(target)) {
        return;
      }
      const metadata = getOrCreateNodeEditorMetadata(target);
      edit(metadata);
    };
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  function checkDecoratingClass(fn) {
    if (!js.isChildClassOf(fn, PoseGraphNode)) {
      error(`This kind of decorator should only be applied to pose graph node classes.`);
      return false;
    }
    return true;
  }
  return {
    setters: [function (_coreIndexJs) {
      error = _coreIndexJs.error;
      js = _coreIndexJs.js;
    }, function (_foundationPoseGraphNodeJs) {
      PoseGraphNode = _foundationPoseGraphNodeJs.PoseGraphNode;
    }, function (_foundationAuthoringNodeAuthoringJs) {
      getOrCreateNodeEditorMetadata = _foundationAuthoringNodeAuthoringJs.getOrCreateNodeEditorMetadata;
    }],
    execute: function () {
      _export("poseGraphNodeCategory", poseGraphNodeCategory = category => makeNodeEditorMetadataModifier(metadata => {
        metadata.category = category;
      }));
      _export("poseGraphCreateNodeFactory", poseGraphCreateNodeFactory = factory => makeNodeEditorMetadataModifier(metadata => {
        metadata.factory = factory;
      }));
      _export("poseGraphNodeHide", poseGraphNodeHide = (hide = true) => makeNodeEditorMetadataModifier(metadata => {
        metadata.hide = hide;
      }));
      _export("poseGraphNodeAppearance", poseGraphNodeAppearance = appearance => makeNodeEditorMetadataModifier(metadata => {
        var _metadata$appearance;
        Object.assign((_metadata$appearance = metadata.appearance) != null ? _metadata$appearance : metadata.appearance = {}, appearance);
      }));
    }
  };
});