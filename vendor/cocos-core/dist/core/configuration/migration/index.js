"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationList = exports.CocosConfigLoader = exports.CocosMigration = exports.CocosMigrationManager = void 0;
__exportStar(require("./types"), exports);
var cocos_migration_manager_1 = require("./cocos-migration-manager");
Object.defineProperty(exports, "CocosMigrationManager", { enumerable: true, get: function () { return cocos_migration_manager_1.CocosMigrationManager; } });
var cocos_migration_1 = require("./cocos-migration");
Object.defineProperty(exports, "CocosMigration", { enumerable: true, get: function () { return cocos_migration_1.CocosMigration; } });
var cocos_config_loader_1 = require("./cocos-config-loader");
Object.defineProperty(exports, "CocosConfigLoader", { enumerable: true, get: function () { return cocos_config_loader_1.CocosConfigLoader; } });
var register_migration_1 = require("./register-migration");
Object.defineProperty(exports, "getMigrationList", { enumerable: true, get: function () { return register_migration_1.getMigrationList; } });
