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
