"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseModuleRootURL = getDatabaseModuleRootURL;
function getDatabaseModuleRootURL(dbID) {
    return `db://${dbID}/`;
}
