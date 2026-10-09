'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.clamp01 = clamp01;
exports.add = add;
exports.sub = sub;
exports.multi = multi;
exports.divide = divide;
exports.toFixed = toFixed;
/**
 * 取给定边界范围的值
 * Take the value of the given boundary range
 * @param {number} val
 * @param {number} min
 * @param {number} max
 */
function clamp(val, min, max) {
    return Math.min.call(null, Math.max.call(null, val, min), max);
}
/**
 * 将给定的数值限制在0到1的范围内。
 * @param val 需要限制的数值。
 * @returns 返回限制后的数值，确保在0到1之间。
 */
function clamp01(val) {
    return clamp(val, 0, 1);
}
/**
 * 加法函数
 * 入参：函数内部转化时会先转字符串再转数值，因而传入字符串或 number 均可
 * 返回值：arg1 加上 arg2 的精确结果
 * @param {number|string} arg1
 * @param {number|string} arg2
 */
function add(arg1, arg2) {
    arg1 = toValidNumber(arg1);
    arg2 = toValidNumber(arg2);
    const { maxPow, num1, num2 } = _computeMaxPow(arg1, arg2);
    return (num1 + num2) / maxPow;
}
/**
 * 减法函数
 * 入参：函数内部转化时会先转字符串再转数值，因而传入字符串或 number 均可
 * 返回值：arg1 减 arg2的精确结果
 * @param {number|string} arg1
 * @param {number|string} arg2
 */
function sub(arg1, arg2) {
    arg1 = toValidNumber(arg1);
    arg2 = toValidNumber(arg2);
    const { maxPow, num1, num2 } = _computeMaxPow(arg1, arg2);
    return (num1 - num2) / maxPow;
}
/**
 * 乘法函数
 * @param arg1
 * @param arg2
 * @returns
 */
function multi(arg1, arg2) {
    arg1 = toValidNumber(arg1);
    arg2 = toValidNumber(arg2);
    const { maxPow, num1, num2 } = _computeMaxPow(arg1, arg2);
    return num1 * num2 / maxPow / maxPow;
}
/**
 * 除法函数
 * @param arg1
 * @param arg2
 * @returns
 */
function divide(arg1, arg2) {
    arg1 = toValidNumber(arg1);
    arg2 = toValidNumber(arg2);
    if (!arg2) {
        return arg1 > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    const { num1, num2 } = _computeMaxPow(arg1, arg2);
    return num1 / num2;
}
function toValidNumber(str) {
    str = Number(str);
    // 需要判断是否是无限大或者是无限小
    if (typeof str === 'number' && !Number.isNaN(str) && isFinite(str)) {
        return str;
    }
    throw new Error(`Invalid params ${str}`);
}
/**
 * 计算两个数值小数点位数的最大位数与10的乘积,与最大精度
 * 入参：函数内部转化时会先转字符串再转数值，因而传入字符串或number均可
 * 返回值：
 * @param {number|string} arg1
 * @param {number|string} arg2
 */
function _computeMaxPow(arg1, arg2) {
    let maxPreci;
    const str1 = toNonExponential(arg1);
    const str2 = toNonExponential(arg2);
    const r1 = _comPreci(str1);
    const r2 = _comPreci(str2);
    maxPreci = Math.max(r1, r2);
    const maxPow = Math.pow(10, maxPreci);
    if (maxPreci > 20) {
        maxPreci = 20;
    }
    const num1 = Number(str1.replace('.', '') + Array(maxPreci - r1).fill(0).join(''));
    const num2 = Number(str2.replace('.', '') + Array(maxPreci - r2).fill(0).join(''));
    return {
        maxPow,
        maxPreci,
        num1,
        num2,
    };
}
/**
 * 移除科学计数法，转为正常的小数点形式
 * @param num
 * @returns
 */
function toNonExponential(num) {
    const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
    return num.toFixed(Math.max(0, (m[1] || '').length - Number(m[2])));
}
/**
 * 计算数值的精度（小数点位数）
 * 返回值：该数值的小数点位数
 * @param {Number || String} value
 */
function _comPreci(value) {
    let rang;
    try {
        rang = value.split('.')[1].length;
    }
    catch (error) {
        rang = 0;
    }
    return rang;
}
/**
 * 保留小数点
 * @param val
 * @param num
 */
function toFixed(val, num) {
    return parseFloat((Math.round(val * Math.pow(10, num)) / Math.pow(10, num)).toFixed(num));
}
