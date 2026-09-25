System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/authoring/node-authoring.js", [], function (_export, _context) {
  "use strict";

  var nodeEditorMetadataMap;
  function getPoseGraphNodeEditorMetadata(classConstructor) {
    return nodeEditorMetadataMap.get(classConstructor);
  }
  function getOrCreateNodeEditorMetadata(constructor) {
    const existing = nodeEditorMetadataMap.get(constructor);
    if (existing) {
      return existing;
    } else {
      const metadata = {};
      nodeEditorMetadataMap.set(constructor, metadata);
      return metadata;
    }
  }
  _export({
    getPoseGraphNodeEditorMetadata: getPoseGraphNodeEditorMetadata,
    getOrCreateNodeEditorMetadata: getOrCreateNodeEditorMetadata
  });
  return {
    setters: [],
    execute: function () {
      /**
       * @zh 描述某类型结点的编辑器外观选项。
       * @en Describes the editor appearance of a type of nodes.
       */
      nodeEditorMetadataMap = new WeakMap();
    }
  };
});