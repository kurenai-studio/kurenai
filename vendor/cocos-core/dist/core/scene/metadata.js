"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSceneMetadataNodes = createSceneMetadataNodes;
const metadata_1 = require("../configuration/script/metadata");
function createSceneMetadataNodes(defaultConfig) {
    return [
        (0, metadata_1.createNode)('scene.tick', 'i18n:configuration.scene.tick.title', 'scene', {
            'scene.tick': {
                type: 'boolean',
                default: defaultConfig.tick,
                title: 'i18n:configuration.scene.tick.title',
                description: 'i18n:configuration.scene.tick.description',
            },
        }, 30),
    ];
}
