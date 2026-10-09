"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CREATE_TEMPLATE_ROOT = void 0;
exports.resolveImportTemplateRoot = resolveImportTemplateRoot;
const path_1 = require("path");
exports.DEFAULT_CREATE_TEMPLATE_ROOT = '.creator/templates';
function resolveImportTemplateRoot(projectRoot, configuredPath = exports.DEFAULT_CREATE_TEMPLATE_ROOT) {
    if ((0, path_1.isAbsolute)(configuredPath)) {
        return configuredPath;
    }
    return (0, path_1.join)(projectRoot, configuredPath);
}
