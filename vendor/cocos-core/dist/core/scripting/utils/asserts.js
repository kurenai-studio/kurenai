"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asserts = asserts;
exports.assertsNonNullable = assertsNonNullable;
const assert_1 = require("assert");
function asserts(expr, message) {
    if (!expr) {
        throw new assert_1.AssertionError({ message });
    }
}
function assertsNonNullable(expr, message) {
    asserts(!(expr === null || expr === undefined), message);
}
