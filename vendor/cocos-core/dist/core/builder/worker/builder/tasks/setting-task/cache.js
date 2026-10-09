"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const fast_glob_1 = __importDefault(require("fast-glob"));
async function handle(options, result, cache) {
    let settingsPath = result.paths.settings;
    if (!(0, fs_extra_1.existsSync)(settingsPath)) {
        const settingsPaths = await (0, fast_glob_1.default)('settings*.json', { cwd: (0, path_1.dirname)(result.paths.settings), absolute: true });
        settingsPath = settingsPaths[0];
        if (!settingsPath || !(0, fs_extra_1.existsSync)(settingsPath)) {
            console.error(`Can not find cache settings failed in ${(0, path_1.dirname)(result.paths.settings)} when build ${options.platform}.`);
            return;
        }
    }
    result.paths.settings = settingsPath;
    result.settings = (0, fs_extra_1.readJSONSync)(settingsPath);
}
