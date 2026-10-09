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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPluginScript = transformPluginScript;
const babel = __importStar(require("@babel/core"));
async function transformPluginScript(code, options) {
    // 模拟 babel 的 auto compact 行为，超过 500kb 不开启 compact 选项
    // babel compact 选项默认传入 'auto'，当脚本超过 500 kb 时，会有报错提示，影响用户体验
    const autoCompact = code.length > 500000 ? false : true;
    const babelResult = await babel.transformAsync(code, {
        compact: autoCompact,
        plugins: [[wrapPluginScript(options)]],
    });
    if (!babelResult) {
        return {
            code,
        };
    }
    return {
        code: babelResult.code,
    };
}
const wrapPluginScript = (options) => {
    const programBodyTemplate = babel.template.statements(`(function(root) {
    %%HIDE_COMMONJS%%;
    %%HIDE_AMD%%;
    %%SIMULATE_GLOBALS%%;
    (function() {
        %%ORIGINAL_CODE%%
    }).call(root);
})(
    // The environment-specific global.
    (function() {
        if (typeof globalThis !== 'undefined') return globalThis;
        if (typeof self !== 'undefined') return self;
        if (typeof window !== 'undefined') return window;
        if (typeof global !== 'undefined') return global;
        if (typeof this !== 'undefined') return this;
        return {};
    }).call(this),
);
`, {
        preserveComments: true,
        // @ts-ignore
        syntacticPlaceholders: true,
    });
    return {
        visitor: {
            Program: (path, state) => {
                let HIDE_COMMONJS;
                if (options.hideCommonJs) {
                    HIDE_COMMONJS = babel.types.variableDeclaration('var', ['exports', 'module', 'require'].map((variableName) => babel.types.variableDeclarator(babel.types.identifier(variableName), babel.types.identifier('undefined'))));
                }
                let HIDE_AMD;
                if (options.hideAmd) {
                    HIDE_AMD = babel.types.variableDeclaration('var', ['define'].map((variableName) => babel.types.variableDeclarator(babel.types.identifier(variableName), babel.types.identifier('undefined'))));
                }
                let SIMULATE_GLOBALS;
                if (options.simulateGlobals && options.simulateGlobals.length !== 0) {
                    SIMULATE_GLOBALS = babel.types.variableDeclaration('var', options.simulateGlobals.map((variableName) => babel.types.variableDeclarator(babel.types.identifier(variableName), babel.types.identifier('root'))));
                }
                path.node.body = programBodyTemplate({
                    ORIGINAL_CODE: path.node.body,
                    SIMULATE_GLOBALS,
                    HIDE_COMMONJS,
                    HIDE_AMD,
                });
            },
        },
    };
};
