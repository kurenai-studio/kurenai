"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScriptMetadataNodes = createScriptMetadataNodes;
const metadata_1 = require("../../configuration/script/metadata");
function createScriptMetadataNodes() {
    return [
        (0, metadata_1.createNode)('script', 'i18n:configuration.script.title', 'script', {
            'script.useDefineForClassFields': {
                type: 'boolean',
                default: true,
                title: 'i18n:configuration.script.useDefineForClassFields.title',
            },
            'script.allowDeclareFields': {
                type: 'boolean',
                default: true,
                title: 'i18n:configuration.script.allowDeclareFields.title',
            },
            'script.loose': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.loose.title',
            },
            'script.guessCommonJsExports': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.guessCommonJsExports.title',
                description: 'i18n:configuration.script.guessCommonJsExports.description',
            },
            'script.exportsConditions': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.script.exportsConditions.title',
            },
            'script.sortingPlugin': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.script.sortingPlugin.title',
                description: 'i18n:configuration.script.sortingPlugin.description',
                items: {
                    type: 'string',
                    title: 'i18n:configuration.script.sortingPlugin.itemTitle',
                    ui: 'asset-picker',
                    assetType: 'cc.Script',
                    valueField: 'uuid',
                    displayFields: ['url', 'name'],
                    query: {
                        userData: {
                            isPlugin: true,
                        },
                    },
                },
            },
            'script.preserveSymlinks': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.preserveSymlinks.title',
            },
            'script.importMap': {
                type: 'string',
                default: '',
                title: 'i18n:configuration.script.importMap.title',
            },
            'script.previewBrowserslistConfigFile': {
                type: 'string',
                default: '',
                title: 'i18n:configuration.script.previewBrowserslistConfigFile.title',
            },
            'script.updateAutoUpdateImportConfig': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.updateAutoUpdateImportConfig.title',
            },
        }, 9),
    ];
}
