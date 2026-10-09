'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
const i18n_1 = __importDefault(require("../../i18n"));
const i18n_class_1 = require("./i18n-class");
Object.defineProperty(exports, "I18n", { enumerable: true, get: function () { return i18n_class_1.I18n; } });
exports.default = new i18n_class_1.I18n(i18n_1.default);
