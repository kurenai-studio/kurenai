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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9zaGFyZS92YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQWdDO0FBRWhDLDZEQUFxQztBQUVyQyxNQUFhLFNBQVM7SUFDVixNQUFNLENBQUMsbUJBQW1CLEdBQThDO1FBQzVFLFNBQVMsRUFBRTtZQUNQLElBQUksRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUNuQixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMzQixPQUFPLEtBQUssQ0FBQztnQkFDakIsQ0FBQztnQkFDRCxJQUFJLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sSUFBQSxlQUFVLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELE9BQU8sRUFBRSxrQ0FBa0M7U0FDOUM7UUFDRCxLQUFLLEVBQUU7WUFDSCxJQUFJLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQkFDakIsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUM7WUFDakQsQ0FBQztZQUNELE9BQU8sRUFBRSx3Q0FBd0M7U0FDcEQ7UUFDRCxRQUFRLEVBQUU7WUFDTixJQUFJLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQkFDakIsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLEVBQUUsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsT0FBTyxFQUFFLDJDQUEyQztTQUN2RDtRQUNELFVBQVUsRUFBRTtZQUNSLElBQUksRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUNqQixPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsT0FB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LElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsWUFBWTtZQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxRQUFRLFVBQVUsQ0FBQyxDQUFDO1lBQzdDLE9BQU87UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUM1QyxDQUFDOztBQXhJTCw4QkF5SUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgSUludGVybmFsVmVyaWZpY2F0aW9uUnVsZSwgSVZlcmlmaWNhdGlvblJ1bGVNYXAsIElWZXJpZmljYXRpb25SdWxlIH0gZnJvbSAnLi4vQHR5cGVzJztcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9iYXNlL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRvciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW50ZXJuYWxWZXJpZnlSdWxlczogUmVjb3JkPHN0cmluZywgSUludGVybmFsVmVyaWZpY2F0aW9uUnVsZT4gPSB7XG4gICAgICAgIHBhdGhFeGlzdDoge1xuICAgICAgICAgICAgZnVuYzogKHBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXRoID0gVXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcocGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4aXN0c1N5bmMocGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci53YXJuLnBhdGhfbm90X2V4aXN0JyxcbiAgICAgICAgfSxcbiAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgIGZ1bmM6ICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLnZhbGlkJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IHtcbiAgICAgICAgICAgIGZ1bmM6ICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09ICcnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpMThuOmJ1aWxkZXIudmVyaWZ5X3J1bGVfbWVzc2FnZS5yZXF1aXJlZCcsXG4gICAgICAgIH0sXG4gICAgICAgIG5vcm1hbE5hbWU6IHtcbiAgICAgICAgICAgIGZ1bmM6ICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC9eW2EtekEtWjAtOV8tXSokLy50ZXN0KHZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtZXNzYWdlOiAnaTE4bjpidWlsZGVyLnZlcmlmeV9ydWxlX21lc3NhZ2Uubm9ybWFsTmFtZScsXG4gICAgICAgIH0sXG4gICAgICAgIG5vQ2hpbmVzZToge1xuICAgICAgICAgICAgZnVuYzogKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIS8uKltcXHU0ZTAwLVxcdTlmYTVdKy4qJC8udGVzdCh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLm5vX2NoaW5lc2UnLFxuICAgICAgICB9LFxuICAgICAgICBhcnJheToge1xuICAgICAgICAgICAgZnVuYzogKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLmFycmF5JyxcbiAgICAgICAgfSxcbiAgICAgICAgc3RyaW5nOiB7XG4gICAgICAgICAgICBmdW5jOiAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpMThuOmJ1aWxkZXIudmVyaWZ5X3J1bGVfbWVzc2FnZS5zdHJpbmcnLFxuICAgICAgICB9LFxuICAgICAgICBudW1iZXI6IHtcbiAgICAgICAgICAgIGZ1bmM6ICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLm51bWJlcicsXG4gICAgICAgIH0sXG4gICAgICAgIGh0dHA6IHtcbiAgICAgICAgICAgIGZ1bmM6ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc3RhcnRzV2l0aCgnaHR0cCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpMThuOmJ1aWxkZXIudmVyaWZ5X3J1bGVfbWVzc2FnZS5odHRwJyxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5LiN5YWB6K645Lu75L2V6Z2e5rOV5a2X56ym55qE6Lev5b6EXG4gICAgICAgIHN0cmljdFBhdGg6IHtcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLnN0cmljdF9wYXRoJyxcbiAgICAgICAgfSxcbiAgICAgICAgbm9ybWFsUGF0aDoge1xuICAgICAgICAgICAgZnVuYzogKHZhbHVlPzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gL15bYS16QS1aXTpbXFxcXF0oKD8hICkoPyFbXlxcXFwvXSpcXHMrW1xcXFwvXSlbXFx3IC1dK1tcXFxcL10pKig/ISApKD8hW14uXSpcXHMrXFwuKVtcXHcgLV0rJC8udGVzdCh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ2kxOG46YnVpbGRlci52ZXJpZnlfcnVsZV9tZXNzYWdlLm5vcm1hbF9wYXRoJyxcbiAgICAgICAgfSxcbiAgICB9O1xuXG4gICAgcHVibGljIHN0YXRpYyBhZGRSdWxlKHJ1bGVOYW1lOiBzdHJpbmcsIHJ1bGU6IElJbnRlcm5hbFZlcmlmaWNhdGlvblJ1bGUpIHtcbiAgICAgICAgaWYgKFZhbGlkYXRvci5pbnRlcm5hbFZlcmlmeVJ1bGVzW3J1bGVOYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFZhbGlkYXRvci5pbnRlcm5hbFZlcmlmeVJ1bGVzW3J1bGVOYW1lXSA9IHJ1bGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjdXN0b21WZXJpZnlSdWxlczogSVZlcmlmaWNhdGlvblJ1bGVNYXAgPSB7fTtcblxuICAgIHB1YmxpYyBoYXMocnVsZU5hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBjaGVja1ZhbGl0b3IgPSB0aGlzLmN1c3RvbVZlcmlmeVJ1bGVzW3J1bGVOYW1lXSB8fCBWYWxpZGF0b3IuaW50ZXJuYWxWZXJpZnlSdWxlc1tydWxlTmFtZV07XG4gICAgICAgIGlmICghY2hlY2tWYWxpdG9yIHx8ICFjaGVja1ZhbGl0b3IuZnVuYykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeVJ1bGVNZXNzYWdlKHJ1bGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjaGVja1ZhbGl0b3IgPSB0aGlzLmN1c3RvbVZlcmlmeVJ1bGVzW3J1bGVOYW1lXSB8fCBWYWxpZGF0b3IuaW50ZXJuYWxWZXJpZnlSdWxlc1tydWxlTmFtZV07XG4gICAgICAgIHJldHVybiBjaGVja1ZhbGl0b3IgJiYgY2hlY2tWYWxpdG9yLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgcHVibGljIGNoZWNrV2l0aEludGVybmFsUnVsZShydWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCAuLi5hcmc6IGFueVtdKSB7XG4gICAgICAgIGNvbnN0IGNoZWNrVmFsaXRvciA9IFZhbGlkYXRvci5pbnRlcm5hbFZlcmlmeVJ1bGVzW3J1bGVOYW1lXTtcbiAgICAgICAgaWYgKCFjaGVja1ZhbGl0b3IgfHwgIWNoZWNrVmFsaXRvci5mdW5jKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgY2hlY2sgd2l0aCAke3ZhbHVlfTogUnVsZSAke3J1bGVOYW1lfSBpcyBub3QgZXhpc3QuYCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNoZWNrVmFsaXRvci5mdW5jKHZhbHVlLCAuLi5hcmcpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjaGVjayhydWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCAuLi5hcmc6IGFueVtdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiAhKGF3YWl0IHRoaXMuY2hlY2tSdWxlV2l0aE1lc3NhZ2UocnVsZU5hbWUsIHZhbHVlLCAuLi5hcmcpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hlY2tSdWxlV2l0aE1lc3NhZ2UocnVsZU5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgLi4uYXJnOiBhbnlbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGNvbnN0IGNoZWNrVmFsaXRvciA9IHRoaXMuY3VzdG9tVmVyaWZ5UnVsZXNbcnVsZU5hbWVdIHx8IFZhbGlkYXRvci5pbnRlcm5hbFZlcmlmeVJ1bGVzW3J1bGVOYW1lXTtcbiAgICAgICAgaWYgKCFjaGVja1ZhbGl0b3IgfHwgIWNoZWNrVmFsaXRvci5mdW5jKSB7XG4gICAgICAgICAgICByZXR1cm4gYEludmFsaWQgY2hlY2sgd2l0aCAke3ZhbHVlfTogUnVsZSAke3J1bGVOYW1lfSBpcyBub3QgZXhpc3QuYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYXdhaXQgY2hlY2tWYWxpdG9yLmZ1bmModmFsdWUsIC4uLmFyZykpIHtcbiAgICAgICAgICAgIC8vIOa3u+WKoOinhOWImeaXtuacieWIpOepuuWkhOeQhu+8jOaJgOS7peagoemqjOWksei0pee7k+aenOiCr+WumuS4jeS8muaYr+epuuWtl+espuS4slxuICAgICAgICAgICAgcmV0dXJuIGNoZWNrVmFsaXRvci5tZXNzYWdlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkKHJ1bGVOYW1lOiBzdHJpbmcsIHJ1bGU6IElWZXJpZmljYXRpb25SdWxlKSB7XG4gICAgICAgIGlmICghcnVsZSB8fCAhcnVsZS5mdW5jIHx8ICFydWxlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8g6K+m57uG5oql6ZSZXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEFkZCBydWxlICR7cnVsZU5hbWV9IGZhaWxlZCFgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1c3RvbVZlcmlmeVJ1bGVzW3J1bGVOYW1lXSA9IHJ1bGU7XG4gICAgfVxufVxuIl19