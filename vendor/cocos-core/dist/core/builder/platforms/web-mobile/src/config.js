'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const global_1 = require("../../../../../global");
const PLATFORM = 'web-mobile';
const buildTemplateDir = (0, path_1.join)(global_1.GlobalPaths.enginePath, `templates/${PLATFORM}`);
const config = {
    displayName: 'i18n:web-mobile.title',
    platformType: 'HTML5',
    doc: 'editor/publish/publish-web.html',
    hooks: './src/hooks',
    textureCompressConfig: {
        platformType: 'web',
        support: {
            rgb: [
                'etc2_rgb',
                'etc1_rgb',
                'pvrtc_4bits_rgb',
                'pvrtc_2bits_rgb',
                'astc_4x4',
                'astc_5x5',
                'astc_6x6',
                'astc_8x8',
                'astc_10x5',
                'astc_10x10',
                'astc_12x12',
            ],
            rgba: [
                'etc2_rgba',
                'etc1_rgb_a',
                'pvrtc_4bits_rgb_a',
                'pvrtc_4bits_rgba',
                'pvrtc_2bits_rgb_a',
                'pvrtc_2bits_rgba',
                'astc_4x4',
                'astc_5x5',
                'astc_6x6',
                'astc_8x8',
                'astc_10x5',
                'astc_10x10',
                'astc_12x12',
            ],
        },
    },
    assetBundleConfig: {
        supportedCompressionTypes: ['none', 'merge_dep', 'merge_all_json'],
        platformType: 'web',
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
    options: {
        useWebGPU: {
            label: 'WEBGPU',
            type: 'boolean',
            default: false,
            description: 'i18n:web-mobile.tips.webgpu',
            experiment: true,
        },
        orientation: {
            label: 'i18n:web-mobile.options.orientation',
            default: 'auto',
            type: 'enum',
            items: ['auto', 'landscape', 'portrait'],
        },
        embedWebDebugger: {
            label: 'i18n:web-mobile.options.web_debugger',
            type: 'boolean',
            default: false,
        },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9wbGF0Zm9ybXMvd2ViLW1vYmlsZS9zcmMvY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFFYiwrQkFBNEI7QUFFNUIsa0RBQW9EO0FBRXBELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQztBQUU5QixNQUFNLGdCQUFnQixHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFXLENBQUMsVUFBVSxFQUFFLGFBQWEsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUUvRSxNQUFNLE1BQU0sR0FBK0I7SUFDdkMsV0FBVyxFQUFFLHVCQUF1QjtJQUNwQyxZQUFZLEVBQUUsT0FBTztJQUNyQixHQUFHLEVBQUUsaUNBQWlDO0lBQ3RDLEtBQUssRUFBRSxhQUFhO0lBQ3BCLHFCQUFxQixFQUFFO1FBQ25CLFlBQVksRUFBRSxLQUFLO1FBQ25CLE9BQU8sRUFBRTtZQUNMLEdBQUcsRUFBRTtnQkFDRCxVQUFVO2dCQUNWLFVBQVU7Z0JBQ1YsaUJBQWlCO2dCQUNqQixpQkFBaUI7Z0JBQ2pCLFVBQVU7Z0JBQ1YsVUFBVTtnQkFDVixVQUFVO2dCQUNWLFVBQVU7Z0JBQ1YsV0FBVztnQkFDWCxZQUFZO2dCQUNaLFlBQVk7YUFDZjtZQUNELElBQUksRUFBRTtnQkFDRixXQUFXO2dCQUNYLFlBQVk7Z0JBQ1osbUJBQW1CO2dCQUNuQixrQkFBa0I7Z0JBQ2xCLG1CQUFtQjtnQkFDbkIsa0JBQWtCO2dCQUNsQixVQUFVO2dCQUNWLFVBQVU7Z0JBQ1YsVUFBVTtnQkFDVixVQUFVO2dCQUNWLFdBQVc7Z0JBQ1gsWUFBWTtnQkFDWixZQUFZO2FBQ2Y7U0FDSjtLQUNKO0lBQ0QsaUJBQWlCLEVBQUU7UUFDZix5QkFBeUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLENBQUM7UUFDbEUsWUFBWSxFQUFFLEtBQUs7S0FDdEI7SUFDRCxhQUFhLEVBQUU7UUFDWCxTQUFTLEVBQUU7WUFDUCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUk7YUFDdkI7U0FDSjtRQUNELG9CQUFvQixFQUFFO1lBQ2xCLE9BQU8sRUFBRSxNQUFNO1NBQ2xCO1FBQ0Qsd0JBQXdCLEVBQUU7WUFDdEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRTtvQkFDWixZQUFZLEVBQUUsSUFBSTtpQkFDckI7YUFDSjtTQUNKO0tBQ0o7SUFDRCxPQUFPLEVBQUU7UUFDTCxTQUFTLEVBQUU7WUFDUCxLQUFLLEVBQUUsUUFBUTtZQUNmLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxXQUFXLEVBQUUsNkJBQTZCO1lBQzFDLFVBQVUsRUFBRSxJQUFJO1NBQ25CO1FBQ0QsV0FBVyxFQUFFO1lBQ1QsS0FBSyxFQUFFLHFDQUFxQztZQUM1QyxPQUFPLEVBQUUsTUFBTTtZQUNmLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUM7U0FDM0M7UUFDRCxnQkFBZ0IsRUFBRTtZQUNkLEtBQUssRUFBRSxzQ0FBc0M7WUFDN0MsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztTQUNqQjtLQUNKO0lBQ0QsbUJBQW1CLEVBQUU7UUFDakIsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDakMsT0FBTztnQkFDSCxJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDO2dCQUNqQyxPQUFPLEVBQUUsR0FBRzthQUNmLENBQUM7UUFDTixDQUFDLENBQUM7UUFDRixPQUFPLEVBQUUsT0FBTztLQUNuQjtJQUNELGlCQUFpQixFQUFFLENBQUM7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLG9CQUFvQixFQUFFLEtBQUs7U0FDOUIsQ0FBQztDQUNMLENBQUM7QUFFRixrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2dsb2JhbCc7XG5cbmNvbnN0IFBMQVRGT1JNID0gJ3dlYi1tb2JpbGUnO1xuXG5jb25zdCBidWlsZFRlbXBsYXRlRGlyID0gam9pbihHbG9iYWxQYXRocy5lbmdpbmVQYXRoLCBgdGVtcGxhdGVzLyR7UExBVEZPUk19YCk7XG5cbmNvbnN0IGNvbmZpZzogSVBsYXRmb3JtQnVpbGRQbHVnaW5Db25maWcgPSB7XG4gICAgZGlzcGxheU5hbWU6ICdpMThuOndlYi1tb2JpbGUudGl0bGUnLFxuICAgIHBsYXRmb3JtVHlwZTogJ0hUTUw1JyxcbiAgICBkb2M6ICdlZGl0b3IvcHVibGlzaC9wdWJsaXNoLXdlYi5odG1sJyxcbiAgICBob29rczogJy4vc3JjL2hvb2tzJyxcbiAgICB0ZXh0dXJlQ29tcHJlc3NDb25maWc6IHtcbiAgICAgICAgcGxhdGZvcm1UeXBlOiAnd2ViJyxcbiAgICAgICAgc3VwcG9ydDoge1xuICAgICAgICAgICAgcmdiOiBbXG4gICAgICAgICAgICAgICAgJ2V0YzJfcmdiJyxcbiAgICAgICAgICAgICAgICAnZXRjMV9yZ2InLFxuICAgICAgICAgICAgICAgICdwdnJ0Y180Yml0c19yZ2InLFxuICAgICAgICAgICAgICAgICdwdnJ0Y18yYml0c19yZ2InLFxuICAgICAgICAgICAgICAgICdhc3RjXzR4NCcsXG4gICAgICAgICAgICAgICAgJ2FzdGNfNXg1JyxcbiAgICAgICAgICAgICAgICAnYXN0Y182eDYnLFxuICAgICAgICAgICAgICAgICdhc3RjXzh4OCcsXG4gICAgICAgICAgICAgICAgJ2FzdGNfMTB4NScsXG4gICAgICAgICAgICAgICAgJ2FzdGNfMTB4MTAnLFxuICAgICAgICAgICAgICAgICdhc3RjXzEyeDEyJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZ2JhOiBbXG4gICAgICAgICAgICAgICAgJ2V0YzJfcmdiYScsXG4gICAgICAgICAgICAgICAgJ2V0YzFfcmdiX2EnLFxuICAgICAgICAgICAgICAgICdwdnJ0Y180Yml0c19yZ2JfYScsXG4gICAgICAgICAgICAgICAgJ3B2cnRjXzRiaXRzX3JnYmEnLFxuICAgICAgICAgICAgICAgICdwdnJ0Y18yYml0c19yZ2JfYScsXG4gICAgICAgICAgICAgICAgJ3B2cnRjXzJiaXRzX3JnYmEnLFxuICAgICAgICAgICAgICAgICdhc3RjXzR4NCcsXG4gICAgICAgICAgICAgICAgJ2FzdGNfNXg1JyxcbiAgICAgICAgICAgICAgICAnYXN0Y182eDYnLFxuICAgICAgICAgICAgICAgICdhc3RjXzh4OCcsXG4gICAgICAgICAgICAgICAgJ2FzdGNfMTB4NScsXG4gICAgICAgICAgICAgICAgJ2FzdGNfMTB4MTAnLFxuICAgICAgICAgICAgICAgICdhc3RjXzEyeDEyJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBhc3NldEJ1bmRsZUNvbmZpZzoge1xuICAgICAgICBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzOiBbJ25vbmUnLCAnbWVyZ2VfZGVwJywgJ21lcmdlX2FsbF9qc29uJ10sXG4gICAgICAgIHBsYXRmb3JtVHlwZTogJ3dlYicsXG4gICAgfSxcbiAgICBjb21tb25PcHRpb25zOiB7XG4gICAgICAgIHBvbHlmaWxsczoge1xuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIGFzeW5jRnVuY3Rpb25zOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbmF0aXZlQ29kZUJ1bmRsZU1vZGU6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdib3RoJyxcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcndyaXRlUHJvamVjdFNldHRpbmdzOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgaW5jbHVkZU1vZHVsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2dmeC13ZWJnbDInOiAnb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgb3B0aW9uczoge1xuICAgICAgICB1c2VXZWJHUFU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnV0VCR1BVJyxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOndlYi1tb2JpbGUudGlwcy53ZWJncHUnLFxuICAgICAgICAgICAgZXhwZXJpbWVudDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgb3JpZW50YXRpb246IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjp3ZWItbW9iaWxlLm9wdGlvbnMub3JpZW50YXRpb24nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2F1dG8nLFxuICAgICAgICAgICAgdHlwZTogJ2VudW0nLFxuICAgICAgICAgICAgaXRlbXM6IFsnYXV0bycsICdsYW5kc2NhcGUnLCAncG9ydHJhaXQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgZW1iZWRXZWJEZWJ1Z2dlcjoge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOndlYi1tb2JpbGUub3B0aW9ucy53ZWJfZGVidWdnZXInLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZFRlbXBsYXRlQ29uZmlnOiB7XG4gICAgICAgIHRlbXBsYXRlczogWydpbmRleC5lanMnXS5tYXAoKHVybCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsIHVybCksXG4gICAgICAgICAgICAgICAgZGVzdFVybDogdXJsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSksXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgfSxcbiAgICBjdXN0b21CdWlsZFN0YWdlczogW3tcbiAgICAgICAgaG9vazogJ3J1bicsXG4gICAgICAgIG5hbWU6ICdydW4nLFxuICAgICAgICByZXF1aXJlZEJ1aWxkT3B0aW9uczogZmFsc2UsXG4gICAgfV0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXX0=