"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImportMetadataNodes = createImportMetadataNodes;
const metadata_1 = require("../configuration/script/metadata");
const import_config_defaults_1 = require("./import-config-defaults");
function createImportMetadataNodes() {
    return [
        (0, metadata_1.createNode)('import', 'i18n:configuration.import.title', 'import', {
            'import.globList': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.import.globList.title',
                description: 'i18n:configuration.import.globList.description',
                items: { type: 'string', title: 'i18n:configuration.import.globList.itemTitle' },
            },
            'import.restoreAssetDBFromCache': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.import.restoreAssetDBFromCache.title',
            },
            'import.createTemplateRoot': {
                type: 'string',
                default: import_config_defaults_1.DEFAULT_CREATE_TEMPLATE_ROOT,
                title: 'i18n:configuration.import.createTemplateRoot.title',
            },
            'import.userDataTemplate': (0, metadata_1.objectSchema)(undefined, {
                title: 'i18n:configuration.import.userDataTemplate.title',
                description: 'i18n:configuration.import.userDataTemplate.description',
                additionalProperties: true,
            }),
            'import.fbx.material.smart': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.import.fbx.material.smart.title',
            },
        }, 10),
    ];
}
