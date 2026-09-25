System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/errors.js", [], function (_export, _context) {
  "use strict";

  var AddNonFreestandingNodeError, OperationOnFreestandingNodeError;
  _export({
    AddNonFreestandingNodeError: void 0,
    OperationOnFreestandingNodeError: void 0
  });
  return {
    setters: [],
    execute: function () {
      _export("AddNonFreestandingNodeError", AddNonFreestandingNodeError = class AddNonFreestandingNodeError extends Error {
        constructor(node) {
          super(`Can not add the specified ${node.toString()} since it has already been added into another graph.`);
        }
      });
      _export("OperationOnFreestandingNodeError", OperationOnFreestandingNodeError = class OperationOnFreestandingNodeError extends Error {
        constructor(node) {
          super(`Can not perform specified operation on ${node.toString()} since it has not been added in to graph.`);
        }
      });
    }
  };
});