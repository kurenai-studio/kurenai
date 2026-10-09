"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationPolicy = void 0;
var OptimizationPolicy;
(function (OptimizationPolicy) {
    OptimizationPolicy[OptimizationPolicy["AUTO"] = 0] = "AUTO";
    OptimizationPolicy[OptimizationPolicy["SINGLE_INSTANCE"] = 1] = "SINGLE_INSTANCE";
    OptimizationPolicy[OptimizationPolicy["MULTI_INSTANCE"] = 2] = "MULTI_INSTANCE";
})(OptimizationPolicy || (exports.OptimizationPolicy = OptimizationPolicy = {}));
