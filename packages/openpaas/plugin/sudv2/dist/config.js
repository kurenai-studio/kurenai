'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = require("path");
const share_1 = require("./share");
const ENCRYPT_KEY_PATTERN = /^\w{32}$/;
exports.config = {
    displayName: 'i18n:openpaas.title',
    platformType: share_1.PLATFORM,
    doc: 'editor/publish/publish-sudv2-mini-game.html',
    hooks: './hooks.js',
    verifyRuleMap: {
        encryptKey: {
            func: (value) => ENCRYPT_KEY_PATTERN.test(String(value ?? '').trim()),
            message: 'i18n:openpaas.tips.encrypt_key_error',
        },
    },
    options: {
        appid: {
            label: 'i18n:openpaas.options.app_id',
            description: 'i18n:openpaas.options.version_code_tips',
            type: 'string',
            verifyLevel: 'warn'
        },
        package: {
            default: 'com.sud.cocos',
            label: 'i18n:openpaas.options.package',
            description: 'i18n:openpaas.options.package_hint',
            hidden: true,
            type: 'string',
        },
        icon: {
            type: 'string',
            default: './icon/icon.png',
            label: 'i18n:openpaas.options.icon',
            description: 'i18n:openpaas.options.icon_hint',
            hidden: true,
        },
        minPlatformVersion: {
            default: '2.0.0',
            type: 'string',
            label: 'i18n:openpaas.options.min_platform_version',
            description: 'i18n:openpaas.options.min_platform_version_hint',
            hidden: true,
        },
        versionName: {
            default: '0.0.1',
            type: 'string',
            label: 'i18n:openpaas.options.version_name',
            description: 'i18n:openpaas.options.version_name_hint',
            verifyRules: ['required'],
        },
        versionCode: {
            default: '1',
            label: 'i18n:openpaas.options.version_code',
            hidden: true,
            description: 'i18n:openpaas.options.version_code_tips',
            type: 'string',
        },
        runtimeVersion: {
            default: '1056',
            label: 'i18n:openpaas.options.runtime_version',
            description: 'i18n:openpaas.options.runtime_version_hint',
            type: 'string',
            hidden: true,
        },
        minRuntimeVersion: {
            default: '2.0.0',
            type: 'string',
            label: 'i18n:openpaas.options.support_min_platform',
            description: 'i18n:openpaas.options.support_min_platform_hint',
            hidden: true,
        },
        privatePemPath: {
            default: '',
            type: 'string',
            label: 'i18n:openpaas.options.key_path',
            description: 'i18n:openpaas.options.key_path_hint',
        },
        encryptKey: {
            default: '00112233445566778899aabbccddeeff',
            type: 'string',
            label: 'i18n:openpaas.options.encrypt_key',
            description: 'i18n:openpaas.options.encrypt_key_hint',
            hidden: true,
        },
        networkTimeout: {
            default: {
                XMLHttpRequest: '6000',
                Websocket: '6000',
                uploadFile: '6000',
                downloadFile: '6000',
            },
            properties: {},
            type: 'object',
            label: 'i18n:openpaas.options.network_timeout',
            description: 'i18n:openpaas.options.network_timeout_hint',
        },
        workers: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.workers',
            description: 'i18n:openpaas.options.workers_hint',
        },
        context: {
            default: {},
            properties: {},
            type: 'object',
            hidden: true,
            label: 'i18n:openpaas.options.context',
            description: 'i18n:openpaas.options.context_hint',
        },
        context_signature: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.context_signature',
            description: 'i18n:openpaas.options.context_signature_hint',
        },
        public_key: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.public_key',
            description: 'i18n:openpaas.options.public_key_hint',
        },
        context_signature_version: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.context_signature_version',
            description: 'i18n:openpaas.options.context_signature_version_hint',
        },
        context_ordered_json: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.context_ordered_json',
            description: 'i18n:openpaas.options.context_ordered_json_hint',
        },
        permissions: {
            default: [],
            type: 'array',
            hidden: true,
            label: 'i18n:openpaas.options.permissions',
            description: 'i18n:openpaas.options.permissions_hint',
            items: {
                type: 'object',
                properties: {
                    Key: {
                        type: 'string',
                    },
                    Value: {
                        type: 'string',
                    },
                },
            },
        },
        fullScreen: {
            default: true,
            type: 'boolean',
            label: 'i18n:openpaas.options.full_screen',
            description: 'i18n:openpaas.options.full_screen_hint',
            hidden: true,
        },
        backgroundColor: {
            default: '#000000',
            hidden: true,
            type: 'string',
            label: 'i18n:openpaas.options.background_color',
            description: 'i18n:openpaas.options.background_color_hint',
        },
        appkey: {
            label: 'i18n:openpaas.options.app_key',
            description: 'i18n:openpaas.options.app_key_hint',
            type: 'string',
            hidden: true,
        },
        uploadEnv: {
            default: 'prod',
            label: 'i18n:openpaas.options.upload_env',
            description: 'i18n:openpaas.options.upload_env_hint',
            type: 'enum',
            hidden: true,
            items: [{
                    label: 'dev',
                    value: 'dev',
                }, {
                    label: 'fat',
                    value: 'fat',
                }, {
                    label: 'prod',
                    value: 'prod',
                }],
        },
        accessToken: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.access_token',
            description: 'i18n:openpaas.options.access_token_hint',
        },
        codeVersion: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'i18n:openpaas.options.code_version',
            description: 'i18n:openpaas.options.code_version_hint',
        },
        package_id: {
            default: '',
            type: 'string',
            hidden: true,
            label: 'Package ID',
        },
        deviceOrientation: {
            default: 'portrait',
            label: 'i18n:openpaas.options.screen_orientation',
            description: 'i18n:openpaas.options.screen_orientation_hint',
            type: 'enum',
            items: [
                {
                    label: 'i18n:openpaas.options.portrait',
                    value: 'portrait',
                },
                {
                    label: 'i18n:openpaas.options.landscape',
                    value: 'landscape',
                },
            ],
        },
        enableWebBuild: {
            type: 'boolean',
            label: 'i18n:openpaas.options.enableWebBuild',
            description: 'i18n:openpaas.options.enable_web_build_hint',
            default: false,
            hidden: true,
        }
        // NOTE: 经渠道方确定，咪咕平台需要关闭引擎分离的功能，后续如果需要，由渠道方来推动需�?
        // separateEngine: {
        //     label: 'i18n:openpaas.options.separate_engine',
        //     description: 'i18n:openpaas.options.separate_engine_tips',
        //     default: false,
        //     render: {
        //         ui: 'ui-checkbox',
        //     },
        // },
        // NOTE: 经讨论，runtime 平台需要关闭引擎分包的优化，后续如果需要，由渠道方来推动需�?
        // wasmSubpackage: {
        //     label: 'i18n:openpaas.options.wasm_subpackage',
        //     description: 'i18n:openpaas.options.wasm_subpackage_tips',
        //     render: {
        //         ui: 'ui-checkbox',
        //     },
        // },
    },
    supportPlatforms: {
        hidden: true,
        platforms: ['web-desktop', 'web-mobile'], // 可附带构建的子平台列表
        controlledBy: 'enableWebBuild', // 指向 platformOptions 中的 boolean key
    },
    textureCompressConfig: {
        platformType: 'miniGame',
        support: {
            rgb: ['etc1_rgb'],
            rgba: ['etc1_rgb_a'],
        },
    },
    commonOptions: {
        buildStageGroup: {
            default: {
                build: ['make', 'upload'],
            },
        }
    },
    buildTemplateConfig: {
        templates: [{
                path: (0, path_1.join)(__dirname, '../static/build-template/main.ejs'),
                destUrl: 'main.js',
            }],
        version: '1.0.0',
    },
    assetBundleConfig: {
        supportedCompressionTypes: ['none', 'merge_dep', 'merge_all_json', 'zip', 'subpackage'],
        platformType: 'miniGame',
    },
    customBuildStages: [{
            name: 'make',
            displayName: 'i18n:openpaas.make.label',
            hook: 'make',
            hidden: true,
        }, {
            name: 'upload',
            hook: 'upload',
            displayName: 'i18n:openpaas.publish.label',
            description: 'i18n:openpaas.publish.description',
            parallelism: 'all',
            hidden: true,
        }, {
            name: 'publish',
            hook: 'publish',
            displayName: 'i18n:openpaas.publish.label',
            description: 'i18n:openpaas.publish.description',
            parallelism: 'all',
        }]
};
exports.default = exports.config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUdiLCtCQUE0QjtBQUM1QixtQ0FBbUM7QUFFbkMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7QUFFMUIsUUFBQSxNQUFNLEdBQStCO0lBQzlDLFdBQVcsRUFBRSxxQkFBcUI7SUFDbEMsWUFBWSxFQUFFLGdCQUFRO0lBQ3RCLEdBQUcsRUFBRSw2Q0FBNkM7SUFDbEQsS0FBSyxFQUFFLFlBQVk7SUFDbkIsYUFBYSxFQUFFO1FBQ1gsVUFBVSxFQUFFO1lBQ1IsSUFBSSxFQUFFLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM3RSxPQUFPLEVBQUUsc0NBQXNDO1NBQ2xEO0tBQ0o7SUFDRCxPQUFPLEVBQUU7UUFDTCxLQUFLLEVBQUU7WUFDSCxLQUFLLEVBQUUsOEJBQThCO1lBQ3JDLFdBQVcsRUFBRSx5Q0FBeUM7WUFDdEQsSUFBSSxFQUFFLFFBQVE7WUFDZCxXQUFXLEVBQUUsTUFBTTtTQUN0QjtRQUNELE9BQU8sRUFBRTtZQUNMLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLEtBQUssRUFBRSwrQkFBK0I7WUFDdEMsV0FBVyxFQUFFLG9DQUFvQztZQUNqRCxNQUFNLEVBQUUsSUFBSTtZQUNaLElBQUksRUFBRSxRQUFRO1NBQ2pCO1FBQ0QsSUFBSSxFQUFFO1lBQ0YsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsaUJBQWlCO1lBQzFCLEtBQUssRUFBRSw0QkFBNEI7WUFDbkMsV0FBVyxFQUFFLGlDQUFpQztZQUM5QyxNQUFNLEVBQUUsSUFBSTtTQUNmO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDaEIsT0FBTyxFQUFFLE9BQU87WUFDaEIsSUFBSSxFQUFFLFFB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RSw2QkFBNkI7WUFDMUMsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxXQUFXLEVBQUUsS0FBSztZQUNsQixNQUFNLEVBQUUsSUFBSTtTQUNmLEVBQUU7WUFDQyxJQUFJLEVBQUUsU0FBUztZQUNmLElBQUksRUFBRSxTQUFTO1lBQ2YsV0FBVyxFQUFFLDZCQUE2QjtZQUMxQyxXQUFXLEVBQUUsbUNBQW1DO1lBQ2hELFdBQVcsRUFBRSxLQUFLO1NBQ3JCLENBQUM7Q0FDTCxDQUFDO0FBRUYsa0JBQWUsY0FBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZyB9IGZyb20gJ0Bjb2Nvcy9jb2Nvcy1jbGktdHlwZXMvYnVpbGRlcic7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBQTEFURk9STSB9IGZyb20gJy4vc2hhcmUnO1xuXG5jb25zdCBFTkNSWVBUX0tFWV9QQVRURVJOID0gL15cXHd7MzJ9JC87XG5cbmV4cG9ydCBjb25zdCBjb25maWc6IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnID0ge1xuICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpvcGVucGFhcy50aXRsZScsXG4gICAgcGxhdGZvcm1UeXBlOiBQTEFURk9STSxcbiAgICBkb2M6ICdlZGl0b3IvcHVibGlzaC9wdWJsaXNoLXN1ZHYyLW1pbmktZ2FtZS5odG1sJyxcbiAgICBob29rczogJy4vaG9va3MuanMnLFxuICAgIHZlcmlmeVJ1bGVNYXA6IHtcbiAgICAgICAgZW5jcnlwdEtleToge1xuICAgICAgICAgICAgZnVuYzogKHZhbHVlOiBzdHJpbmcpID0+IEVOQ1JZUFRfS0VZX1BBVFRFUk4udGVzdChTdHJpbmcodmFsdWUgPz8gJycpLnRyaW0oKSksXG4gICAgICAgICAgICBtZXNzYWdlOiAnaTE4bjpvcGVucGFhcy50aXBzLmVuY3J5cHRfa2V5X2Vycm9yJyxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgYXBwaWQ6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmFwcF9pZCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy52ZXJzaW9uX2NvZGVfdGlwcycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIHZlcmlmeUxldmVsOiAnd2FybidcbiAgICAgICAgfSxcbiAgICAgICAgcGFja2FnZToge1xuICAgICAgICAgICAgZGVmYXVsdDogJ2NvbS5zdWQuY29jb3MnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMucGFja2FnZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5wYWNrYWdlX2hpbnQnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIH0sXG4gICAgICAgIGljb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVmYXVsdDogJy4vaWNvbi9pY29uLnBuZycsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5pY29uJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmljb25faGludCcsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG1pblBsYXRmb3JtVmVyc2lvbjoge1xuICAgICAgICAgICAgZGVmYXVsdDogJzIuMC4wJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMubWluX3BsYXRmb3JtX3ZlcnNpb24nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMubWluX3BsYXRmb3JtX3ZlcnNpb25faGludCcsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHZlcnNpb25OYW1lOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnMC4wLjEnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy52ZXJzaW9uX25hbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMudmVyc2lvbl9uYW1lX2hpbnQnLFxuICAgICAgICAgICAgdmVyaWZ5UnVsZXM6IFsncmVxdWlyZWQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgdmVyc2lvbkNvZGU6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcxJyxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnZlcnNpb25fY29kZScsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy52ZXJzaW9uX2NvZGVfdGlwcycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcbiAgICAgICAgcnVudGltZVZlcnNpb246IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcxMDU2JyxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnJ1bnRpbWVfdmVyc2lvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5ydW50aW1lX3ZlcnNpb25faGludCcsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluUnVudGltZVZlcnNpb246IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcyLjAuMCcsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnN1cHBvcnRfbWluX3BsYXRmb3JtJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnN1cHBvcnRfbWluX3BsYXRmb3JtX2hpbnQnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwcml2YXRlUGVtUGF0aDoge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmtleV9wYXRoJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmtleV9wYXRoX2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBlbmNyeXB0S2V5OiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnMDAxMTIyMzM0NDU1NjY3Nzg4OTlhYWJiY2NkZGVlZmYnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5lbmNyeXB0X2tleScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5lbmNyeXB0X2tleV9oaW50JyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbmV0d29ya1RpbWVvdXQ6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBYTUxIdHRwUmVxdWVzdDogJzYwMDAnLFxuICAgICAgICAgICAgICAgIFdlYnNvY2tldDogJzYwMDAnLFxuICAgICAgICAgICAgICAgIHVwbG9hZEZpbGU6ICc2MDAwJyxcbiAgICAgICAgICAgICAgICBkb3dubG9hZEZpbGU6ICc2MDAwJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMubmV0d29ya190aW1lb3V0JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLm5ldHdvcmtfdGltZW91dF9oaW50JyxcbiAgICAgICAgfSxcbiAgICAgICAgd29ya2Vyczoge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLndvcmtlcnMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMud29ya2Vyc19oaW50JyxcbiAgICAgICAgfSxcbiAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgZGVmYXVsdDoge30sXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuY29udGV4dCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5jb250ZXh0X2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0X3NpZ25hdHVyZToge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmNvbnRleHRfc2lnbmF0dXJlJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmNvbnRleHRfc2lnbmF0dXJlX2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaWNfa2V5OiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMucHVibGljX2tleScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5wdWJsaWNfa2V5X2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0X3NpZ25hdHVyZV92ZXJzaW9uOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuY29udGV4dF9zaWduYXR1cmVfdmVyc2lvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5jb250ZXh0X3NpZ25hdHVyZV92ZXJzaW9uX2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0X29yZGVyZWRfanNvbjoge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmNvbnRleHRfb3JkZXJlZF9qc29uJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmNvbnRleHRfb3JkZXJlZF9qc29uX2hpbnQnLFxuICAgICAgICB9LFxuICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMucGVybWlzc2lvbnMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMucGVybWlzc2lvbnNfaGludCcsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgVmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBmdWxsU2NyZWVuOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuZnVsbF9zY3JlZW4nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuZnVsbF9zY3JlZW5faGludCcsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjoge1xuICAgICAgICAgICAgZGVmYXVsdDogJyMwMDAwMDAnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5iYWNrZ3JvdW5kX2NvbG9yJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmJhY2tncm91bmRfY29sb3JfaGludCcsXG4gICAgICAgIH0sXG4gICAgICAgIGFwcGtleToge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuYXBwX2tleScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5hcHBfa2V5X2hpbnQnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHVwbG9hZEVudjoge1xuICAgICAgICAgICAgZGVmYXVsdDogJ3Byb2QnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMudXBsb2FkX2VudicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy51cGxvYWRfZW52X2hpbnQnLFxuICAgICAgICAgICAgdHlwZTogJ2VudW0nLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdkZXYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGV2JyxcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2ZhdCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdmYXQnLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAncHJvZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdwcm9kJyxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICB9LFxuICAgICAgICBhY2Nlc3NUb2tlbjoge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmFjY2Vzc190b2tlbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5hY2Nlc3NfdG9rZW5faGludCcsXG4gICAgICAgIH0sXG4gICAgICAgIGNvZGVWZXJzaW9uOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuY29kZV92ZXJzaW9uJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLmNvZGVfdmVyc2lvbl9oaW50JyxcbiAgICAgICAgfSxcbiAgICAgICAgcGFja2FnZV9pZDoge1xuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIGxhYmVsOiAnUGFja2FnZSBJRCcsXG4gICAgICAgIH0sXG4gICAgICAgIGRldmljZU9yaWVudGF0aW9uOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAncG9ydHJhaXQnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuc2NyZWVuX29yaWVudGF0aW9uJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnNjcmVlbl9vcmllbnRhdGlvbl9oaW50JyxcbiAgICAgICAgICAgIHR5cGU6ICdlbnVtJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5wb3J0cmFpdCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAncG9ydHJhaXQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5sYW5kc2NhcGUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2xhbmRzY2FwZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGVuYWJsZVdlYkJ1aWxkOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5lbmFibGVXZWJCdWlsZCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy5lbmFibGVfd2ViX2J1aWxkX2hpbnQnLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIH1cbiAgICAgICAgLy8gTk9URTog57uP5rig6YGT5pa556Gu5a6a77yM5ZKq5ZKV5bmz5Y+w6ZyA6KaB5YWz6Zet5byV5pOO5YiG56a755qE5Yqf6IO977yM5ZCO57ut5aaC5p6c6ZyA6KaB77yM55Sx5rig6YGT5pa55p2l5o6o5Yqo6ZyA77+9P1xuICAgICAgICAvLyBzZXBhcmF0ZUVuZ2luZToge1xuICAgICAgICAvLyAgICAgbGFiZWw6ICdpMThuOm9wZW5wYWFzLm9wdGlvbnMuc2VwYXJhdGVfZW5naW5lJyxcbiAgICAgICAgLy8gICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLnNlcGFyYXRlX2VuZ2luZV90aXBzJyxcbiAgICAgICAgLy8gICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAvLyAgICAgcmVuZGVyOiB7XG4gICAgICAgIC8vICAgICAgICAgdWk6ICd1aS1jaGVja2JveCcsXG4gICAgICAgIC8vICAgICB9LFxuICAgICAgICAvLyB9LFxuICAgICAgICAvLyBOT1RFOiDnu4/orqjorrrvvIxydW50aW1lIOW5s+WPsOmcgOimgeWFs+mXreW8leaTjuWIhuWMheeahOS8mOWMlu+8jOWQjue7reWmguaenOmcgOimge+8jOeUsea4oOmBk+aWueadpeaOqOWKqOmcgO+/vT9cbiAgICAgICAgLy8gd2FzbVN1YnBhY2thZ2U6IHtcbiAgICAgICAgLy8gICAgIGxhYmVsOiAnaTE4bjpvcGVucGFhcy5vcHRpb25zLndhc21fc3VicGFja2FnZScsXG4gICAgICAgIC8vICAgICBkZXNjcmlwdGlvbjogJ2kxOG46b3BlbnBhYXMub3B0aW9ucy53YXNtX3N1YnBhY2thZ2VfdGlwcycsXG4gICAgICAgIC8vICAgICByZW5kZXI6IHtcbiAgICAgICAgLy8gICAgICAgICB1aTogJ3VpLWNoZWNrYm94JyxcbiAgICAgICAgLy8gICAgIH0sXG4gICAgICAgIC8vIH0sXG4gICAgfSxcbiAgICBzdXBwb3J0UGxhdGZvcm1zOiB7XG4gICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgcGxhdGZvcm1zOiBbJ3dlYi1kZXNrdG9wJywgJ3dlYi1tb2JpbGUnXSwgICAvLyDlj6/pmYTluKbmnoTlu7rnmoTlrZDlubPlj7DliJfooahcbiAgICAgICAgY29udHJvbGxlZEJ5OiAnZW5hYmxlV2ViQnVpbGQnLCAgICAgICAgICAgICAvLyDmjIflkJEgcGxhdGZvcm1PcHRpb25zIOS4reeahCBib29sZWFuIGtleVxuICAgIH0sXG4gICAgdGV4dHVyZUNvbXByZXNzQ29uZmlnOiB7XG4gICAgICAgIHBsYXRmb3JtVHlwZTogJ21pbmlHYW1lJyxcbiAgICAgICAgc3VwcG9ydDoge1xuICAgICAgICAgICAgcmdiOiBbJ2V0YzFfcmdiJ10sXG4gICAgICAgICAgICByZ2JhOiBbJ2V0YzFfcmdiX2EnXSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGNvbW1vbk9wdGlvbnM6IHtcbiAgICAgICAgYnVpbGRTdGFnZUdyb3VwOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgYnVpbGQ6IFsnbWFrZScsICd1cGxvYWQnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGJ1aWxkVGVtcGxhdGVDb25maWc6IHtcbiAgICAgICAgdGVtcGxhdGVzOiBbe1xuICAgICAgICAgICAgcGF0aDogam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMvYnVpbGQtdGVtcGxhdGUvbWFpbi5lanMnKSxcbiAgICAgICAgICAgIGRlc3RVcmw6ICdtYWluLmpzJyxcbiAgICAgICAgfV0sXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgfSxcbiAgICBhc3NldEJ1bmRsZUNvbmZpZzoge1xuICAgICAgICBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzOiBbJ25vbmUnLCAnbWVyZ2VfZGVwJywgJ21lcmdlX2FsbF9qc29uJywgJ3ppcCcsICdzdWJwYWNrYWdlJ10sXG4gICAgICAgIHBsYXRmb3JtVHlwZTogJ21pbmlHYW1lJyxcbiAgICB9LFxuICAgIGN1c3RvbUJ1aWxkU3RhZ2VzOiBbe1xuICAgICAgICBuYW1lOiAnbWFrZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpvcGVucGFhcy5tYWtlLmxhYmVsJyxcbiAgICAgICAgaG9vazogJ21ha2UnLFxuICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgfSwge1xuICAgICAgICBuYW1lOiAndXBsb2FkJyxcbiAgICAgICAgaG9vazogJ3VwbG9hZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpvcGVucGFhcy5wdWJsaXNoLmxhYmVsJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOm9wZW5wYWFzLnB1Ymxpc2guZGVzY3JpcHRpb24nLFxuICAgICAgICBwYXJhbGxlbGlzbTogJ2FsbCcsXG4gICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdwdWJsaXNoJyxcbiAgICAgICAgaG9vazogJ3B1Ymxpc2gnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ2kxOG46b3BlbnBhYXMucHVibGlzaC5sYWJlbCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpvcGVucGFhcy5wdWJsaXNoLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgcGFyYWxsZWxpc206ICdhbGwnLFxuICAgIH1dXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXX0=