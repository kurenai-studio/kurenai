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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdG9yLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3NoYXJlL3ZhbGlkYXRvci1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUF3QztBQUV4Qzs7R0FFRztBQUNILE1BQU0sZ0JBQWdCO0lBQ1YsVUFBVSxHQUE4QixFQUFFLENBQUM7SUFDM0MsZ0JBQWdCLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7SUFFM0M7Ozs7O09BS0c7SUFDSCxPQUFPLENBQUMsSUFBWSxFQUFFLElBQXVCLEVBQUUsT0FBZ0I7UUFDM0QsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQ3RDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDVixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxxQkFBUyxFQUFFLENBQUM7WUFDdkUsU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCx3REFBd0Q7SUFFeEQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBVSxFQUFFLEtBQWUsRUFBRSxPQUFhLEVBQUUsT0FBTyxHQUFHLEVBQUU7UUFDaEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QixPQUFPLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDRCxlQUFlO1lBQ2YsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN2RSxPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUM7WUFDRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN2QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksMkJBQTJCLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ2hFLE9BQU8sRUFBRSxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxTQUFTLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDTixPQUFPLEdBQUcsQ0FBQztnQkFDZixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN6QixDQUFDO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0NBQ0o7QUFFWSxRQUFBLFNBQVMsR0FBRyxJQUFJLHFCQUFTLEVBQUUsQ0FBQztBQUU1QixRQUFBLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElWZXJpZmljYXRpb25SdWxlIH0gZnJvbSAnLi4vQHR5cGVzJztcbmltcG9ydCB7IFZhbGlkYXRvciB9IGZyb20gJy4vdmFsaWRhdG9yJztcblxuLyoqXG4gKiDmlbDmja7moKHpqoznsbtcbiAqL1xuY2xhc3MgVmFsaWRhdG9yTWFuYWdlciB7XG4gICAgcHJpdmF0ZSB2YWxpZGF0b3JzOiBSZWNvcmQ8c3RyaW5nLCBWYWxpZGF0b3I+ID0ge307XG4gICAgcHJpdmF0ZSBkZWZhdWx0VmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcigpO1xuXG4gICAgLyoqXG4gICAgICog5re75Yqg5qCh6aqM6KeE5YiZXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKiBAcGFyYW0gZnVuY1xuICAgICAqIEBwYXJhbSBwa2dOYW1lXG4gICAgICovXG4gICAgYWRkUnVsZShuYW1lOiBzdHJpbmcsIHJ1bGU6IElWZXJpZmljYXRpb25SdWxlLCBwa2dOYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIGxldCB2YWxpZGF0b3IgPSB0aGlzLmRlZmF1bHRWYWxpZGF0b3I7XG4gICAgICAgIGlmIChwa2dOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvcnNbcGtnTmFtZV0gPSB0aGlzLnZhbGlkYXRvcnNbcGtnTmFtZV0gfHwgbmV3IFZhbGlkYXRvcigpO1xuICAgICAgICAgICAgdmFsaWRhdG9yID0gdGhpcy52YWxpZGF0b3JzW3BrZ05hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHZhbGlkYXRvci5hZGQobmFtZSwgcnVsZSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyDlkI7nu63lj6/ku6Xorr7orqHotbDlrozmiYDmnInmoKHpqoznmoTmoKHpqozmjqXlj6PvvIzlj6/ku6XlnKjnlYzpnaLmj5DnpLrkuIrkvJjljJbvvIzliJflh7rlvZPliY3lsZ7mgKfpnIDopoHmu6HotrPnmoTmnaHku7bph4zmnInlk6rkupvplJnor69cblxuICAgIC8qKlxuICAgICAqIOaVsOaNruagoemqjOWFpeWPo1xuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqIEBwYXJhbSBydWxlc1xuICAgICAqIEBwYXJhbSBwa2dOYW1lXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIOi/lOWbnumUmeivr+aPkOekuu+8jOaVsOWAvOato+W4uOWImeS4jeaKpemUmVxuICAgICAqL1xuICAgIGFzeW5jIGNoZWNrKHZhbHVlOiBhbnksIHJ1bGVzOiBzdHJpbmdbXSwgb3B0aW9ucz86IGFueSwgcGtnTmFtZSA9ICcnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJ1bGVzKSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOmdnuW/hemAieWPguaVsOepuuWAvOaXtuS4jeWBmuagoemqjFxuICAgICAgICAgICAgaWYgKFsnJywgdW5kZWZpbmVkLCBudWxsXS5pbmNsdWRlcyh2YWx1ZSkgJiYgIXJ1bGVzLmluY2x1ZGVzKCdyZXF1aXJlZCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBydWxlIG9mIHJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gdGhpcy52YWxpZGF0b3JzW3BrZ05hbWVdIHx8IHRoaXMuZGVmYXVsdFZhbGlkYXRvcjtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRvci5oYXMocnVsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBSdWxlICR7cnVsZX0gaXMgbm90IGV4aXN0Lihwa2dOYW1lOiAke3BrZ05hbWV9KWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGF3YWl0IHZhbGlkYXRvci5jaGVja1J1bGVXaXRoTWVzc2FnZShydWxlLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IoKTtcblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRvck1hbmFnZXIgPSBuZXcgVmFsaWRhdG9yTWFuYWdlcigpO1xuIl19