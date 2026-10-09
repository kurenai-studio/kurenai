"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatorManager = exports.validator = void 0;
const validator_1 = require("./validator");
/**
 * 数据校验类
 */
class ValidatorManager {
    validators = {};
    defaultValidator = new validator_1.Validator();
    /**
     * 添加校验规则
     * @param name
     * @param func
     * @param pkgName
     */
    addRule(name, rule, pkgName) {
        let validator = this.defaultValidator;
        if (pkgName) {
            this.validators[pkgName] = this.validators[pkgName] || new validator_1.Validator();
            validator = this.validators[pkgName];
        }
        validator.add(name, rule);
    }
    // TODO 后续可以设计走完所有校验的校验接口，可以在界面提示上优化，列出当前属性需要满足的条件里有哪些错误
    /**
     * 数据校验入口
     * @param value
     * @param rules
     * @param pkgName
     * @param options
     * @return 返回错误提示，数值正常则不报错
     */
    async check(value, rules, options, pkgName = '') {
        if (!Array.isArray(rules)) {
            return '';
        }
        try {
            // 非必选参数空值时不做校验
            if (['', undefined, null].includes(value) && !rules.includes('required')) {
                return '';
            }
            for (const rule of rules) {
                const validator = this.validators[pkgName] || this.defaultValidator;
                if (!validator.has(rule)) {
                    console.warn(`Rule ${rule} is not exist.(pkgName: ${pkgName})`);
                    return '';
                }
                const err = await validator.checkRuleWithMessage(rule, value, options);
                if (err) {
                    return err;
                }
            }
        }
        catch (error) {
            return error.message;
        }
        return '';
    }
}
exports.validator = new validator_1.Validator();
exports.validatorManager = new ValidatorManager();
