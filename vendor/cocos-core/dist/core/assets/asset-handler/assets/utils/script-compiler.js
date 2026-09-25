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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LWNvbXBpbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3V0aWxzL3NjcmlwdC1jb21waWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLHNEQWdCQztBQWxCRCxtREFBcUM7QUFFOUIsS0FBSyxVQUFVLHFCQUFxQixDQUFDLElBQVksRUFBRSxPQUFzQztJQUM1RixxREFBcUQ7SUFDckQsMkRBQTJEO0lBQzNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN4RCxNQUFNLFdBQVcsR0FBRyxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQ2pELE9BQU8sRUFBRSxXQUFXO1FBQ3BCLE9BQU8sRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUN6QyxDQUFDLENBQUM7SUFDSCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDZixPQUFPO1lBQ0gsSUFBSTtTQUNQLENBQUM7SUFDTixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksRUFBRSxXQUFXLENBQUMsSUFBYztLQUNuQyxDQUFDO0FBQ04sQ0FBQztBQUVELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxPQUFzQyxFQUFtQixFQUFFO0lBQ2pGLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQ2pEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQlAsRUFDTztRQUNJLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsYUFBYTtRQUNiLHFCQUFxQixFQUFFLElBQUk7S0FDdkIsQ0FDWCxDQUFDO0lBRUYsT0FBTztRQUNILE9BQU8sRUFBRTtZQUNMLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDckIsSUFBSSxhQUFhLENBQUM7Z0JBQ2xCLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUN2QixhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FDM0MsS0FBSyxFQUNMLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUNsRCxLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQzVHLENBQ0osQ0FBQztnQkFDTixDQUFDO2dCQUVELElBQUksUUFBUSxDQUFDO2dCQUNiLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNsQixRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FDdEMsS0FBSyxFQUNMLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FDNUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUM1RyxDQUNKLENBQUM7Z0JBQ04sQ0FBQztnQkFFRCxJQUFJLGdCQUFnQixDQUFDO2dCQUNyQixJQUFJLE9BQU8sQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2xFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQzlDLEtBQUssRUFDTCxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQ3pDLEtBQUssQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FDdkcsQ0FDSixDQUFDO2dCQUNOLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7b0JBQ2pDLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7b0JBQzdCLGdCQUFnQjtvQkFDaEIsYUFBYTtvQkFDYixRQUFRO2lCQUNYLENBQUMsQ0FBQztZQUNQLENBQUM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1QbHVnaW5TY3JpcHQoY29kZTogc3RyaW5nLCBvcHRpb25zOiB0cmFuc2Zvcm1QbHVnaW5TY3JpcHQuT3B0aW9ucykge1xuICAgIC8vIOaooeaLnyBiYWJlbCDnmoQgYXV0byBjb21wYWN0IOihjOS4uu+8jOi2hei/hyA1MDBrYiDkuI3lvIDlkK8gY29tcGFjdCDpgInpoblcbiAgICAvLyBiYWJlbCBjb21wYWN0IOmAiemhuem7mOiupOS8oOWFpSAnYXV0byfvvIzlvZPohJrmnKzotoXov4cgNTAwIGtiIOaXtu+8jOS8muacieaKpemUmeaPkOekuu+8jOW9seWTjeeUqOaIt+S9k+mqjFxuICAgIGNvbnN0IGF1dG9Db21wYWN0ID0gY29kZS5sZW5ndGggPiA1MDAwMDAgPyBmYWxzZSA6IHRydWU7XG4gICAgY29uc3QgYmFiZWxSZXN1bHQgPSBhd2FpdCBiYWJlbC50cmFuc2Zvcm1Bc3luYyhjb2RlLCB7XG4gICAgICAgIGNvbXBhY3Q6IGF1dG9Db21wYWN0LFxuICAgICAgICBwbHVnaW5zOiBbW3dyYXBQbHVnaW5TY3JpcHQob3B0aW9ucyldXSxcbiAgICB9KTtcbiAgICBpZiAoIWJhYmVsUmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBjb2RlOiBiYWJlbFJlc3VsdC5jb2RlIGFzIHN0cmluZyxcbiAgICB9O1xufVxuXG5jb25zdCB3cmFwUGx1Z2luU2NyaXB0ID0gKG9wdGlvbnM6IHRyYW5zZm9ybVBsdWdpblNjcmlwdC5PcHRpb25zKTogYmFiZWwuUGx1Z2luT2JqID0+IHtcbiAgICBjb25zdCBwcm9ncmFtQm9keVRlbXBsYXRlID0gYmFiZWwudGVtcGxhdGUuc3RhdGVtZW50cyhcbiAgICAgICAgYChmdW5jdGlvbihyb290KSB7XG4gICAgJSVISURFX0NPTU1PTkpTJSU7XG4gICAgJSVISURFX0FNRCUlO1xuICAgICUlU0lNVUxBVEVfR0xPQkFMUyUlO1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgJSVPUklHSU5BTF9DT0RFJSVcbiAgICB9KS5jYWxsKHJvb3QpO1xufSkoXG4gICAgLy8gVGhlIGVudmlyb25tZW50LXNwZWNpZmljIGdsb2JhbC5cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBnbG9iYWxUaGlzO1xuICAgICAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSByZXR1cm4gc2VsZjtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSByZXR1cm4gd2luZG93O1xuICAgICAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBnbG9iYWw7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiB0aGlzO1xuICAgICAgICByZXR1cm4ge307XG4gICAgfSkuY2FsbCh0aGlzKSxcbik7XG5gLFxuICAgICAgICB7XG4gICAgICAgICAgICBwcmVzZXJ2ZUNvbW1lbnRzOiB0cnVlLFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3ludGFjdGljUGxhY2Vob2xkZXJzOiB0cnVlLFxuICAgICAgICB9IGFzIGFueSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmlzaXRvcjoge1xuICAgICAgICAgICAgUHJvZ3JhbTogKHBhdGgsIHN0YXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IEhJREVfQ09NTU9OSlM7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGlkZUNvbW1vbkpzKSB7XG4gICAgICAgICAgICAgICAgICAgIEhJREVfQ09NTU9OSlMgPSBiYWJlbC50eXBlcy52YXJpYWJsZURlY2xhcmF0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBbJ2V4cG9ydHMnLCAnbW9kdWxlJywgJ3JlcXVpcmUnXS5tYXAoKHZhcmlhYmxlTmFtZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWJlbC50eXBlcy52YXJpYWJsZURlY2xhcmF0b3IoYmFiZWwudHlwZXMuaWRlbnRpZmllcih2YXJpYWJsZU5hbWUpLCBiYWJlbC50eXBlcy5pZGVudGlmaWVyKCd1bmRlZmluZWQnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBISURFX0FNRDtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oaWRlQW1kKSB7XG4gICAgICAgICAgICAgICAgICAgIEhJREVfQU1EID0gYmFiZWwudHlwZXMudmFyaWFibGVEZWNsYXJhdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgICd2YXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgWydkZWZpbmUnXS5tYXAoKHZhcmlhYmxlTmFtZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWJlbC50eXBlcy52YXJpYWJsZURlY2xhcmF0b3IoYmFiZWwudHlwZXMuaWRlbnRpZmllcih2YXJpYWJsZU5hbWUpLCBiYWJlbC50eXBlcy5pZGVudGlmaWVyKCd1bmRlZmluZWQnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBTSU1VTEFURV9HTE9CQUxTO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnNpbXVsYXRlR2xvYmFscyAmJiBvcHRpb25zLnNpbXVsYXRlR2xvYmFscy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgU0lNVUxBVEVfR0xPQkFMUyA9IGJhYmVsLnR5cGVzLnZhcmlhYmxlRGVjbGFyYXRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAndmFyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc2ltdWxhdGVHbG9iYWxzLm1hcCgodmFyaWFibGVOYW1lKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVsLnR5cGVzLnZhcmlhYmxlRGVjbGFyYXRvcihiYWJlbC50eXBlcy5pZGVudGlmaWVyKHZhcmlhYmxlTmFtZSksIGJhYmVsLnR5cGVzLmlkZW50aWZpZXIoJ3Jvb3QnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhdGgubm9kZS5ib2R5ID0gcHJvZ3JhbUJvZHlUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIE9SSUdJTkFMX0NPREU6IHBhdGgubm9kZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICBTSU1VTEFURV9HTE9CQUxTLFxuICAgICAgICAgICAgICAgICAgICBISURFX0NPTU1PTkpTLFxuICAgICAgICAgICAgICAgICAgICBISURFX0FNRCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbn07XG5leHBvcnQgbmFtZXNwYWNlIHRyYW5zZm9ybVBsdWdpblNjcmlwdCB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgICAgICAgc2ltdWxhdGVHbG9iYWxzOiBzdHJpbmdbXTtcbiAgICAgICAgaGlkZUNvbW1vbkpzOiBib29sZWFuO1xuICAgICAgICBoaWRlQW1kOiBib29sZWFuO1xuICAgIH1cbn1cbiJdfQ==