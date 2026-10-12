'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const share_1 = require("./share");
const astcTypes = ['astc_4x4', 'astc_5x5', 'astc_6x6', 'astc_8x8', 'astc_10x5', 'astc_10x10', 'astc_12x12'];
const config = {
    displayName: 'i18n:wechatgame.title',
    platformType: 'WECHAT',
    doc: 'editor/publish/publish-wechatgame.html',
    // 平台自定义校验规则:分离引擎仅支持「非 debug + 内置引擎」(迁移自 Creator verifyRuleMap)。
    // 引擎类型取 options.engineInfo(构建期已注入);拿不到时不阻断(配置页校验端点就绪后由其兜底)。
    verifyRuleMap: {
        separateEngine: {
            func: (value, options) => {
                if (!value || options.debug) {
                    return true;
                }
                const type = options.engineInfo?.typescript?.type;
                return type === undefined || type === 'builtin';
            },
            message: 'i18n:wechatgame.error.separate_engine',
        },
    },
    options: {
        orientation: {
            default: 'portrait',
            label: 'i18n:wechatgame.options.orientation',
            type: 'enum',
            items: [
                {
                    label: 'i18n:wechatgame.options.landscape',
                    // 微信运行时没办法判断方向，导致重力感应经常会方向错乱，暂时锁死方向
                    value: 'landscapeRight',
                },
                {
                    label: 'i18n:wechatgame.options.portrait',
                    value: 'portrait',
                },
            ],
        },
        appid: {
            label: 'AppId',
            default: 'wx6ac3f5090a6b99c5',
            type: 'string',
            verifyRules: ['required'],
        },
        buildOpenDataContextTemplate: {
            label: 'i18n:wechatgame.options.gen_open_data_context_template',
            description: 'i18n:wechatgame.options.gen_open_data_context_template_tips',
            type: 'boolean',
            default: false,
        },
        wasmSubpackage: {
            label: 'i18n:wechatgame.options.wasm_subpackage',
            description: 'i18n:wechatgame.options.wasm_subpackage_tips',
            type: 'boolean',
            default: false,
        },
        separateEngine: {
            type: 'boolean',
            default: false,
            verifyRules: ['separateEngine'],
        },
        highPerformanceMode: {
            type: 'boolean',
            default: false,
        },
    },
    commonOptions: {
        polyfills: {
            hidden: true,
        },
        useBuiltinServer: {
            hidden: false,
        },
        startSceneAssetBundle: {
            hidden: false,
        },
        useSplashScreen: {
            hidden: false,
        },
        wasmCompressionMode: {
            hidden: false,
        },
        nativeCodeBundleMode: {
            default: 'wasm',
        },
        overwriteProjectSettings: {
            default: {
                macroConfig: {
                    cleanupImageCache: 'on',
                },
            },
        },
    },
    hooks: './hooks',
    textureCompressConfig: {
        platformType: 'miniGame',
        support: {
            rgb: ['etc1_rgb', 'pvrtc_4bits_rgb', 'pvrtc_2bits_rgb', 'etc2_rgb', ...astcTypes],
            rgba: ['etc1_rgb_a', 'pvrtc_4bits_rgb_a', 'pvrtc_4bits_rgba', 'etc2_rgba', 'pvrtc_2bits_rgb_a', 'pvrtc_2bits_rgba', ...astcTypes],
        },
    },
    assetBundleConfig: {
        supportedCompressionTypes: ['none', 'merge_dep', 'merge_all_json', 'zip', 'subpackage'],
        platformType: 'miniGame',
    },
    customBuildStages: [{
            name: 'run',
            hook: 'run',
            displayName: 'i18n:wechatgame.run.label',
            description: 'i18n:wechatgame.run.description',
            parallelism: 'all',
        }],
    buildTemplateConfig: {
        templates: ['game.ejs', 'game.json', 'project.config.json'].map((url) => {
            return {
                path: (0, path_1.join)(share_1.Paths.internalTemplateDir, url),
                destUrl: url,
            };
        }),
        version: '1.0.0',
    },
};
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWIsK0JBQTRCO0FBQzVCLG1DQUFnQztBQUdoQyxNQUFNLFNBQVMsR0FBMkIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztBQUVwSSxNQUFNLE1BQU0sR0FBK0I7SUFDdkMsV0FBVyxFQUFFLHVCQUF1QjtJQUNwQyxZQUFZLEVBQUUsUUFBUTtJQUN0QixHQUFHLEVBQUUsd0NBQXdDO0lBQzdDLGdFQUFnRTtJQUNoRSw0REFBNEQ7SUFDNUQsYUFBYSxFQUFFO1FBQ1gsY0FBYyxFQUFFO1lBQ1osSUFBSSxFQUFFLENBQUMsS0FBYyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzFCLE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFJLE9BQStELENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUM7Z0JBQzNHLE9BQU8sSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLEtBQUssU0FBUyxDQUFDO1lBQ3BELENBQUM7WUFDRCxPQUFPLEVBQUUsdUNBQXVDO1NBQ25EO0tBQ0o7SUFDRCxPQUFPLEVBQUU7UUFDTCxXQUFXLEVBQUU7WUFDVCxPQUFPLEVBQUUsVUFBVTtZQUNuQixLQUFLLEVBQUUscUNBQXFDO1lBQzVDLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFO2dCQUNIO29CQUNJLEtBQUssRUFBRSxtQ0FBbUM7b0JBQzFDLG9DQUFvQztvQkFDcEMsS0FBSyxFQUFFLGdCQUFnQjtpQkFDMUI7Z0JBQ0Q7b0JBQ0ksS0FBSyxFQUFFLGtDQUFrQztvQkFDekMsS0FBSyxFQUFFLFVBQVU7aUJBQ3BCO2FBQ0o7U0FDSjtRQUNELEtBQUssRUFBRTtZQUNILEtBQUssRUFBRSxPQUFPO1lBQ2QsT0FBTyxFQUFFLG9CQUFvQjtZQUM3QixJQUFJLEVBQUUsUUFBUTtZQUNkLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQztTQUM1QjtRQUNELDRCQUE0QixFQUFFO1lBQzFCLEtBQUssRUFBRSx3REFBd0Q7WUFDL0QsV0FBVyxFQUFFLDZEQUE2RDtZQUMxRSxJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1NBQ2pCO1FBQ0QsY0FBYyxFQUFFO1lBQ1osS0FBSyxFQUFFLHlDQUF5QztZQUNoRCxXQUFXLEVBQUUsOENBQThDO1lBQzNELElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7U0FDakI7UUFDRCxjQUFjLEVBQUU7WUFDWixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7U0FDbEM7UUFDRCxtQkFBbUIsRUFBRTtZQUNqQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1NBQ2pCO0tBQ0o7SUFDRCxhQUFhLEVBQUU7UUFDWCxTQUFTLEVBQUU7WUFDUCxNQUFNLEVBQUUsSUFBSTtTQUNmO1FBQ0QsZ0JBQWdCLEVBQUU7WUFDZCxNQUFNLEVBQUUsS0FBSztTQUNoQjtRQUNELHFCQUFxQixFQUFFO1lBQ25CLE1BQU0sRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsZUFBZSxFQUFFO1lBQ2IsTUFBTSxFQUFFLEtBQUs7U0FDaEI7UUFDRCxtQkFBbUIsRUFBRTtZQUNqQixNQUFNLEVBQUUsS0FBSztTQUNoQjtRQUNELG9CQUFvQixFQUFFO1lBQ2xCLE9BQU8sRUFBRSxNQUFNO1NBQ2xCO1FBQ0Qsd0JBQXdCLEVBQUU7WUFDdEIsT0FBTyxFQUFFO2dCQUNMLFdBQVcsRUFBRTtvQkFDVCxpQkFBaUIsRUFBRSxJQUFJO2lCQUMxQjthQUNKO1NBQ0o7S0FDSjtJQUNELEtBQUssRUFBRSxTQUFTO0lBQ2hCLHFCQUFxQixFQUFFO1FBQ25CLFlBQVksRUFBRSxVQUFVO1FBQ3hCLE9BQU8sRUFBRTtZQUNMLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUM7WUFDakYsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLFNBQVMsQ0FBQztTQUNwSTtLQUNKO0lBQ0QsaUJBQWlCLEVBQUU7UUFDZix5QkFBeUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQztRQUN2RixZQUFZLEVBQUUsVUFBVTtLQUMzQjtJQUNELGlCQUFpQixFQUFFLENBQUM7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLFdBQVcsRUFBRSwyQkFBMkI7WUFDeEMsV0FBVyxFQUFFLGlDQUFpQztZQUM5QyxXQUFXLEVBQUUsS0FBSztTQUNyQixDQUFDO0lBQ0YsbUJBQW1CLEVBQUU7UUFDakIsU0FBUyxFQUFFLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3BFLE9BQU87Z0JBQ0gsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLGFBQUssQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUM7Z0JBQzFDLE9BQU8sRUFBRSxHQUFHO2FBQ2YsQ0FBQztRQUNOLENBQUMsQ0FBQztRQUNGLE9BQU8sRUFBRSxPQUFPO0tBQ25CO0NBQ0osQ0FBQztBQUVGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUGF0aHMgfSBmcm9tICcuL3NoYXJlJztcbmltcG9ydCB7IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnLCBJVGV4dHVyZUNvbXByZXNzVHlwZSwgSUJ1aWxkVGFza09wdGlvbiB9IGZyb20gJ0Bjb2Nvcy9jb2Nvcy1jbGktdHlwZXMvYnVpbGRlcic7XG5cbmNvbnN0IGFzdGNUeXBlczogSVRleHR1cmVDb21wcmVzc1R5cGVbXSA9IFsnYXN0Y180eDQnLCAnYXN0Y181eDUnLCAnYXN0Y182eDYnLCAnYXN0Y184eDgnLCAnYXN0Y18xMHg1JywgJ2FzdGNfMTB4MTAnLCAnYXN0Y18xMngxMiddO1xuXG5jb25zdCBjb25maWc6IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnID0ge1xuICAgIGRpc3BsYXlOYW1lOiAnaTE4bjp3ZWNoYXRnYW1lLnRpdGxlJyxcbiAgICBwbGF0Zm9ybVR5cGU6ICdXRUNIQVQnLFxuICAgIGRvYzogJ2VkaXRvci9wdWJsaXNoL3B1Ymxpc2gtd2VjaGF0Z2FtZS5odG1sJyxcbiAgICAvLyDlubPlj7Doh6rlrprkuYnmoKHpqozop4TliJk65YiG56a75byV5pOO5LuF5pSv5oyB44CM6Z2eIGRlYnVnICsg5YaF572u5byV5pOO44CNKOi/geenu+iHqiBDcmVhdG9yIHZlcmlmeVJ1bGVNYXAp44CCXG4gICAgLy8g5byV5pOO57G75Z6L5Y+WIG9wdGlvbnMuZW5naW5lSW5mbyjmnoTlu7rmnJ/lt7Lms6jlhaUpO+aLv+S4jeWIsOaXtuS4jemYu+aWrSjphY3nva7pobXmoKHpqoznq6/ngrnlsLHnu6rlkI7nlLHlhbblhZzlupUp44CCXG4gICAgdmVyaWZ5UnVsZU1hcDoge1xuICAgICAgICBzZXBhcmF0ZUVuZ2luZToge1xuICAgICAgICAgICAgZnVuYzogKHZhbHVlOiBib29sZWFuLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCBvcHRpb25zLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gKG9wdGlvbnMgYXMgeyBlbmdpbmVJbmZvPzogeyB0eXBlc2NyaXB0PzogeyB0eXBlPzogc3RyaW5nIH0gfSB9KS5lbmdpbmVJbmZvPy50eXBlc2NyaXB0Py50eXBlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlID09PSB1bmRlZmluZWQgfHwgdHlwZSA9PT0gJ2J1aWx0aW4nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpMThuOndlY2hhdGdhbWUuZXJyb3Iuc2VwYXJhdGVfZW5naW5lJyxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgb3JpZW50YXRpb246IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdwb3J0cmFpdCcsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46d2VjaGF0Z2FtZS5vcHRpb25zLm9yaWVudGF0aW9uJyxcbiAgICAgICAgICAgIHR5cGU6ICdlbnVtJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46d2VjaGF0Z2FtZS5vcHRpb25zLmxhbmRzY2FwZScsXG4gICAgICAgICAgICAgICAgICAgIC8vIOW+ruS/oei/kOihjOaXtuayoeWKnuazleWIpOaWreaWueWQke+8jOWvvOiHtOmHjeWKm+aEn+W6lOe7j+W4uOS8muaWueWQkemUmeS5se+8jOaaguaXtumUgeatu+aWueWQkVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2xhbmRzY2FwZVJpZ2h0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlY2hhdGdhbWUub3B0aW9ucy5wb3J0cmFpdCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAncG9ydHJhaXQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBhcHBpZDoge1xuICAgICAgICAgICAgbGFiZWw6ICdBcHBJZCcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnd3g2YWMzZjUwOTBhNmI5OWM1JyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgdmVyaWZ5UnVsZXM6IFsncmVxdWlyZWQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGRPcGVuRGF0YUNvbnRleHRUZW1wbGF0ZToge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlY2hhdGdhbWUub3B0aW9ucy5nZW5fb3Blbl9kYXRhX2NvbnRleHRfdGVtcGxhdGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOndlY2hhdGdhbWUub3B0aW9ucy5nZW5fb3Blbl9kYXRhX2NvbnRleHRfdGVtcGxhdGVfdGlwcycsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgd2FzbVN1YnBhY2thZ2U6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjp3ZWNoYXRnYW1lLm9wdGlvbnMud2FzbV9zdWJwYWNrYWdlJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjp3ZWNoYXRnYW1lLm9wdGlvbnMud2FzbV9zdWJwYWNrYWdlX3RpcHMnLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcGFyYXRlRW5naW5lOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIHZlcmlmeVJ1bGVzOiBbJ3NlcGFyYXRlRW5naW5lJ10sXG4gICAgICAgIH0sXG4gICAgICAgIGhpZ2hQZXJmb3JtYW5jZU1vZGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY29tbW9uT3B0aW9uczoge1xuICAgICAgICBwb2x5ZmlsbHM6IHtcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdXNlQnVpbHRpblNlcnZlcjoge1xuICAgICAgICAgICAgaGlkZGVuOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnRTY2VuZUFzc2V0QnVuZGxlOiB7XG4gICAgICAgICAgICBoaWRkZW46IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB1c2VTcGxhc2hTY3JlZW46IHtcbiAgICAgICAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHdhc21Db21wcmVzc2lvbk1vZGU6IHtcbiAgICAgICAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIG5hdGl2ZUNvZGVCdW5kbGVNb2RlOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnd2FzbScsXG4gICAgICAgIH0sXG4gICAgICAgIG92ZXJ3cml0ZVByb2plY3RTZXR0aW5nczoge1xuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIG1hY3JvQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXBJbWFnZUNhY2hlOiAnb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgaG9va3M6ICcuL2hvb2tzJyxcbiAgICB0ZXh0dXJlQ29tcHJlc3NDb25maWc6IHtcbiAgICAgICAgcGxhdGZvcm1UeXBlOiAnbWluaUdhbWUnLFxuICAgICAgICBzdXBwb3J0OiB7XG4gICAgICAgICAgICByZ2I6IFsnZXRjMV9yZ2InLCAncHZydGNfNGJpdHNfcmdiJywgJ3B2cnRjXzJiaXRzX3JnYicsICdldGMyX3JnYicsIC4uLmFzdGNUeXBlc10sXG4gICAgICAgICAgICByZ2JhOiBbJ2V0YzFfcmdiX2EnLCAncHZydGNfNGJpdHNfcmdiX2EnLCAncHZydGNfNGJpdHNfcmdiYScsICdldGMyX3JnYmEnLCAncHZydGNfMmJpdHNfcmdiX2EnLCAncHZydGNfMmJpdHNfcmdiYScsIC4uLmFzdGNUeXBlc10sXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBhc3NldEJ1bmRsZUNvbmZpZzoge1xuICAgICAgICBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzOiBbJ25vbmUnLCAnbWVyZ2VfZGVwJywgJ21lcmdlX2FsbF9qc29uJywgJ3ppcCcsICdzdWJwYWNrYWdlJ10sXG4gICAgICAgIHBsYXRmb3JtVHlwZTogJ21pbmlHYW1lJyxcbiAgICB9LFxuICAgIGN1c3RvbUJ1aWxkU3RhZ2VzOiBbe1xuICAgICAgICBuYW1lOiAncnVuJyxcbiAgICAgICAgaG9vazogJ3J1bicsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnaTE4bjp3ZWNoYXRnYW1lLnJ1bi5sYWJlbCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjp3ZWNoYXRnYW1lLnJ1bi5kZXNjcmlwdGlvbicsXG4gICAgICAgIHBhcmFsbGVsaXNtOiAnYWxsJyxcbiAgICB9XSxcbiAgICBidWlsZFRlbXBsYXRlQ29uZmlnOiB7XG4gICAgICAgIHRlbXBsYXRlczogWydnYW1lLmVqcycsICdnYW1lLmpzb24nLCAncHJvamVjdC5jb25maWcuanNvbiddLm1hcCgodXJsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IGpvaW4oUGF0aHMuaW50ZXJuYWxUZW1wbGF0ZURpciwgdXJsKSxcbiAgICAgICAgICAgICAgICBkZXN0VXJsOiB1cmwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xuIl19