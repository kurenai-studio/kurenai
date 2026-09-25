'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const global_1 = require("../../../../../global");
const PLATFORM = 'web-desktop';
const buildTemplateDir = (0, path_1.join)(global_1.GlobalPaths.enginePath, `templates/${PLATFORM}`);
const config = {
    displayName: 'i18n:web-desktop.title',
    platformType: 'HTML5',
    doc: 'editor/publish/publish-web.html',
    options: {
        useWebGPU: {
            label: 'WEBGPU',
            type: 'boolean',
            default: false,
            description: 'i18n:web-desktop.tips.webgpu',
            experiment: true,
        },
        resolution: {
            type: 'object',
            label: 'i18n:web-desktop.options.resolution',
            properties: {
                designWidth: {
                    label: 'i18n:web-desktop.options.design_width',
                    type: 'number',
                    default: 1280,
                },
                designHeight: {
                    label: 'i18n:web-desktop.options.design_height',
                    type: 'number',
                    default: 960,
                },
            },
            default: {
                designWidth: 1280,
                designHeight: 960,
            },
        },
    },
    commonOptions: {
        polyfills: {
            default: {
                asyncFunctions: true,
            },
        },
        nativeCodeBundleMode: {
            default: 'both',
        },
        overwriteProjectSettings: {
            default: {
                includeModules: {
                    'gfx-webgl2': 'on',
                },
            },
        },
    },
    hooks: './src/hooks',
    textureCompressConfig: {
        platformType: 'web',
        support: {
            rgb: [],
            rgba: [],
        },
    },
    assetBundleConfig: {
        supportedCompressionTypes: ['none', 'merge_dep', 'merge_all_json'],
        platformType: 'web',
    },
    buildTemplateConfig: {
        templates: ['index.ejs'].map((url) => {
            return {
                path: (0, path_1.join)(buildTemplateDir, url),
                destUrl: url,
            };
        }),
        version: '1.0.0',
    },
    customBuildStages: [{
            hook: 'run',
            name: 'run',
            requiredBuildOptions: false,
        }],
};
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9wbGF0Zm9ybXMvd2ViLWRlc2t0b3Avc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWIsK0JBQTRCO0FBRTVCLGtEQUFvRDtBQUNwRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUM7QUFDL0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLFdBQUksRUFBQyxvQkFBVyxDQUFDLFVBQVUsRUFBRSxhQUFhLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFFL0UsTUFBTSxNQUFNLEdBQStCO0lBQ3ZDLFdBQVcsRUFBRSx3QkFBd0I7SUFDckMsWUFBWSxFQUFFLE9BQU87SUFDckIsR0FBRyxFQUFFLGlDQUFpQztJQUN0QyxPQUFPLEVBQUU7UUFDTCxTQUFTLEVBQUU7WUFDUCxLQUFLLEVBQUUsUUFBUTtZQUNmLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxXQUFXLEVBQUUsOEJBQThCO1lBQzNDLFVBQVUsRUFBRSxJQUFJO1NBQ25CO1FBQ0QsVUFBVSxFQUFFO1lBQ1IsSUFBSSxFQUFFLFFBQVE7WUFDZCxLQUFLLEVBQUUscUNBQXFDO1lBQzVDLFVBQVUsRUFBRTtnQkFDUixXQUFXLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLHVDQUF1QztvQkFDOUMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2hCO2dCQUNELFlBQVksRUFBRTtvQkFDVixLQUFLLEVBQUUsd0NBQXdDO29CQUMvQyxJQUFJLEVBQUUsUUFBUTtvQkFDZCxPQUFPLEVBQUUsR0FBRztpQkFDZjthQUNKO1lBQ0QsT0FBTyxFQUFFO2dCQUNMLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixZQUFZLEVBQUUsR0FBRzthQUNwQjtTQUNKO0tBQ0o7SUFDRCxhQUFhLEVBQUU7UUFDWCxTQUFTLEVBQUU7WUFDUCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUk7YUFDdkI7U0FDSjtRQUNELG9CQUFvQixFQUFFO1lBQ2xCLE9BQU8sRUFBRSxNQUFNO1NBQ2xCO1FBQ0Qsd0JBQXdCLEVBQUU7WUFDdEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRTtvQkFDWixZQUFZLEVBQUUsSUFBSTtpQkFDckI7YUFDSjtTQUNKO0tBQ0o7SUFDRCxLQUFLLEVBQUUsYUFBYTtJQUNwQixxQkFBcUIsRUFBRTtRQUNuQixZQUFZLEVBQUUsS0FBSztRQUNuQixPQUFPLEVBQUU7WUFDTCxHQUFHLEVBQUUsRUFBRTtZQUNQLElBQUksRUFBRSxFQUFFO1NBQ1g7S0FDSjtJQUNELGlCQUFpQixFQUFFO1FBQ2YseUJBQXlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDO1FBQ2xFLFlBQVksRUFBRSxLQUFLO0tBQ3RCO0lBQ0QsbUJBQW1CLEVBQUU7UUFDakIsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDakMsT0FBTztnQkFDSCxJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDO2dCQUNqQyxPQUFPLEVBQUUsR0FBRzthQUNmLENBQUM7UUFDTixDQUFDLENBQUM7UUFDRixPQUFPLEVBQUUsT0FBTztLQUNuQjtJQUNELGlCQUFpQixFQUFFLENBQUM7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLG9CQUFvQixFQUFFLEtBQUs7U0FDOUIsQ0FBQztDQUNMLENBQUM7QUFFRixrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2dsb2JhbCc7XG5jb25zdCBQTEFURk9STSA9ICd3ZWItZGVza3RvcCc7XG5jb25zdCBidWlsZFRlbXBsYXRlRGlyID0gam9pbihHbG9iYWxQYXRocy5lbmdpbmVQYXRoLCBgdGVtcGxhdGVzLyR7UExBVEZPUk19YCk7XG5cbmNvbnN0IGNvbmZpZzogSVBsYXRmb3JtQnVpbGRQbHVnaW5Db25maWcgPSB7XG4gICAgZGlzcGxheU5hbWU6ICdpMThuOndlYi1kZXNrdG9wLnRpdGxlJyxcbiAgICBwbGF0Zm9ybVR5cGU6ICdIVE1MNScsXG4gICAgZG9jOiAnZWRpdG9yL3B1Ymxpc2gvcHVibGlzaC13ZWIuaHRtbCcsXG4gICAgb3B0aW9uczoge1xuICAgICAgICB1c2VXZWJHUFU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnV0VCR1BVJyxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOndlYi1kZXNrdG9wLnRpcHMud2ViZ3B1JyxcbiAgICAgICAgICAgIGV4cGVyaW1lbnQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlc29sdXRpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlYi1kZXNrdG9wLm9wdGlvbnMucmVzb2x1dGlvbicsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgZGVzaWduV2lkdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlYi1kZXNrdG9wLm9wdGlvbnMuZGVzaWduX3dpZHRoJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDEyODAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkZXNpZ25IZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlYi1kZXNrdG9wLm9wdGlvbnMuZGVzaWduX2hlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiA5NjAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgZGVzaWduV2lkdGg6IDEyODAsXG4gICAgICAgICAgICAgICAgZGVzaWduSGVpZ2h0OiA5NjAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY29tbW9uT3B0aW9uczoge1xuICAgICAgICBwb2x5ZmlsbHM6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBhc3luY0Z1bmN0aW9uczogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG5hdGl2ZUNvZGVCdW5kbGVNb2RlOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnYm90aCcsXG4gICAgICAgIH0sXG4gICAgICAgIG92ZXJ3cml0ZVByb2plY3RTZXR0aW5nczoge1xuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICdnZngtd2ViZ2wyJzogJ29uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGhvb2tzOiAnLi9zcmMvaG9va3MnLFxuICAgIHRleHR1cmVDb21wcmVzc0NvbmZpZzoge1xuICAgICAgICBwbGF0Zm9ybVR5cGU6ICd3ZWInLFxuICAgICAgICBzdXBwb3J0OiB7XG4gICAgICAgICAgICByZ2I6IFtdLFxuICAgICAgICAgICAgcmdiYTogW10sXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBhc3NldEJ1bmRsZUNvbmZpZzoge1xuICAgICAgICBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzOiBbJ25vbmUnLCAnbWVyZ2VfZGVwJywgJ21lcmdlX2FsbF9qc29uJ10sXG4gICAgICAgIHBsYXRmb3JtVHlwZTogJ3dlYicsXG4gICAgfSxcbiAgICBidWlsZFRlbXBsYXRlQ29uZmlnOiB7XG4gICAgICAgIHRlbXBsYXRlczogWydpbmRleC5lanMnXS5tYXAoKHVybCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsIHVybCksXG4gICAgICAgICAgICAgICAgZGVzdFVybDogdXJsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSksXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgfSxcbiAgICBjdXN0b21CdWlsZFN0YWdlczogW3tcbiAgICAgICAgaG9vazogJ3J1bicsXG4gICAgICAgIG5hbWU6ICdydW4nLFxuICAgICAgICByZXF1aXJlZEJ1aWxkT3B0aW9uczogZmFsc2UsXG4gICAgfV0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXX0=