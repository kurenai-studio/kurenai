"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationPriority = void 0;
var OperationPriority;
(function (OperationPriority) {
    OperationPriority[OperationPriority["Preview"] = 999] = "Preview";
    OperationPriority[OperationPriority["Gizmo"] = 99] = "Gizmo";
    OperationPriority[OperationPriority["Camera"] = 98] = "Camera";
})(OperationPriority || (exports.OperationPriority = OperationPriority = {}));
