"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const fs_1 = require("fs");
const utils_1 = __importDefault(require("../../base/utils"));
class Validator {
    static internalVerifyRules = {
        pathExist: {
            func: (path) => {
                if (typeof path !== 'string') {
                    return false;
                }
                path = utils_1.default.Path.resolveToRaw(path);
                return (0, fs_1.existsSync)(path);
            },
            message: 'i18n:builder.warn.path_not_exist',
        },
        valid: {
            func: (value) => {
                return value !== null && value !== undefined;
            },
            message: 'i18n:builder.verify_rule_message.valid',
        },
        required: {
            func: (value) => {
                return value !== null && value !== undefined && value !== '';
            },
            message: 'i18n:builder.verify_rule_message.required',
        },
        normalName: {
            func: (value) => {
                return /^[a-zA-Z0-9_-]*$/.test(value);
            },
            message: 'i18n:builder.verify_rule_message.normalName',
        },
        noChinese: {
            func: (value) => {
                return !/.*[\u4e00-\u9fa5]+.*$/.test(value);
            },
            message: 'i18n:builder.verify_rule_message.no_chinese',
        },
        array: {
            func: (value) => {
                return Array.isArray(value);
            },
            message: 'i18n:builder.verify_rule_message.array',
        },
        string: {
            func: (value) => {
                return typeof value === 'string';
            },
            message: 'i18n:builder.verify_rule_message.string',
        },
        number: {
            func: (value) => {
                return typeof value === 'number';
            },
            message: 'i18n:builder.verify_rule_message.number',
        },
        http: {
            func: (value) => {
                if (typeof value !== 'string') {
                    return false;
                }
                return value.startsWith('http');
            },
            message: 'i18n:builder.verify_rule_message.http',
        },
        // 不允许任何非法字符的路径
        strictPath: {
            func: () => {
                return false;
            },
            message: 'i18n:builder.verify_rule_message.strict_path',
        },
        normalPath: {
            func: (value) => {
                if (typeof value !== 'string') {
                    return false;
                }
                return /^[a-zA-Z]:[\\]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]*\s+\.)[\w -]+$/.test(value);
            },
            message: 'i18n:builder.verify_rule_message.normal_path',
        },
    };
    static addRule(ruleName, rule) {
        if (Validator.internalVerifyRules[ruleName]) {
            return;
        }
        Validator.internalVerifyRules[ruleName] = rule;
    }
    customVerifyRules = {};
    has(ruleName) {
        const checkValitor = this.customVerifyRules[ruleName] || Validator.internalVerifyRules[ruleName];
        if (!checkValitor || !checkValitor.func) {
            return false;
        }
        return true;
    }
    queryRuleMessage(ruleName) {
        const checkValitor = this.customVerifyRules[ruleName] || Validator.internalVerifyRules[ruleName];
        return checkValitor && checkValitor.message;
    }
    checkWithInternalRule(ruleName, value, ...arg) {
        const checkValitor = Validator.internalVerifyRules[ruleName];
        if (!checkValitor || !checkValitor.func) {
            console.warn(`Invalid check with ${value}: Rule ${ruleName} is not exist.`);
            return false;
        }
        return checkValitor.func(value, ...arg);
    }
    async check(ruleName, value, ...arg) {
        return !(await this.checkRuleWithMessage(ruleName, value, ...arg));
    }
    async checkRuleWithMessage(ruleName, value, ...arg) {
        const checkValitor = this.customVerifyRules[ruleName] || Validator.internalVerifyRules[ruleName];
        if (!checkValitor || !checkValitor.func) {
            return `Invalid check with ${value}: Rule ${ruleName} is not exist.`;
        }
        if (!await checkValitor.func(value, ...arg)) {
            // 添加规则时有判空处理，所以校验失败结果肯定不会是空字符串
            return checkValitor.message;
        }
        return '';
    }
    add(ruleName, rule) {
        if (!rule || !rule.func || !rule.message) {
            // TODO 详细报错
            console.warn(`Add rule ${ruleName} failed!`);
            return;
        }
        this.customVerifyRules[ruleName] = rule;
    }
}
exports.Validator = Validator;
