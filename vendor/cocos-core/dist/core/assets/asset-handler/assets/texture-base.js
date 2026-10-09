'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultWrapModeT = exports.defaultWrapModeS = exports.defaultMipFilter = exports.defaultMagFilter = exports.defaultMinFilter = void 0;
exports.makeDefaultTextureBaseAssetUserData = makeDefaultTextureBaseAssetUserData;
exports.createTextureBasePropertySchema = createTextureBasePropertySchema;
exports.makeDefaultSpriteFrameBaseAssetUserData = makeDefaultSpriteFrameBaseAssetUserData;
exports.getWrapMode = getWrapMode;
exports.getWrapModeString = getWrapModeString;
exports.getFilter = getFilter;
exports.getFilterString = getFilterString;
exports.applyTextureBaseAssetUserData = applyTextureBaseAssetUserData;
exports.migrateAnisotropy = migrateAnisotropy;
exports.defaultMinFilter = 'linear';
exports.defaultMagFilter = 'linear';
exports.defaultMipFilter = 'none';
exports.defaultWrapModeS = 'repeat';
exports.defaultWrapModeT = 'repeat';
function makeDefaultTextureBaseAssetUserData() {
    return {
        wrapModeS: exports.defaultWrapModeS,
        wrapModeT: exports.defaultWrapModeT,
        minfilter: exports.defaultMinFilter,
        magfilter: exports.defaultMagFilter,
        mipfilter: exports.defaultMipFilter,
        anisotropy: 0,
    };
}
function createTextureBasePropertySchema() {
    return {
        wrapModeS: {
            title: 'i18n:ENGINE.assets.texture.wrapModeS',
            description: 'i18n:ENGINE.assets.texture.wrapModeSTip',
            type: 'string',
            default: exports.defaultWrapModeS,
            enum: ['repeat', 'clamp-to-edge', 'mirrored-repeat'],
            enumDescriptions: [
                'i18n:importer.property_schema.texture.wrap_repeat',
                'i18n:importer.property_schema.texture.wrap_clamp_to_edge',
                'i18n:importer.property_schema.texture.wrap_mirrored_repeat',
            ],
        },
        wrapModeT: {
            title: 'i18n:ENGINE.assets.texture.wrapModeT',
            description: 'i18n:ENGINE.assets.texture.wrapModeTTip',
            type: 'string',
            default: exports.defaultWrapModeT,
            enum: ['repeat', 'clamp-to-edge', 'mirrored-repeat'],
            enumDescriptions: [
                'i18n:importer.property_schema.texture.wrap_repeat',
                'i18n:importer.property_schema.texture.wrap_clamp_to_edge',
                'i18n:importer.property_schema.texture.wrap_mirrored_repeat',
            ],
        },
        minfilter: {
            title: 'i18n:ENGINE.assets.texture.minfilter',
            description: 'i18n:ENGINE.assets.texture.minfilterTip',
            type: 'string',
            default: exports.defaultMinFilter,
            enum: ['none', 'nearest', 'linear'],
            enumDescriptions: [
                'i18n:importer.property_schema.texture.filter_none',
                'i18n:importer.property_schema.texture.filter_nearest',
                'i18n:importer.property_schema.texture.filter_linear',
            ],
        },
        magfilter: {
            title: 'i18n:ENGINE.assets.texture.magfilter',
            description: 'i18n:ENGINE.assets.texture.magfilterTip',
            type: 'string',
            default: exports.defaultMagFilter,
            enum: ['nearest', 'linear'],
            enumDescriptions: [
                'i18n:importer.property_schema.texture.filter_nearest',
                'i18n:importer.property_schema.texture.filter_linear',
            ],
        },
        mipfilter: {
            title: 'i18n:ENGINE.assets.texture.mipfilter',
            description: 'i18n:ENGINE.assets.texture.mipfilterTip',
            type: 'string',
            default: exports.defaultMipFilter,
            enum: ['none', 'nearest', 'linear'],
            enumDescriptions: [
                'i18n:importer.property_schema.texture.filter_none',
                'i18n:importer.property_schema.texture.filter_nearest',
                'i18n:importer.property_schema.texture.filter_linear',
            ],
        },
        anisotropy: {
            title: 'i18n:ENGINE.assets.texture.anisotropy',
            description: 'i18n:ENGINE.assets.texture.anisotropyTip',
            type: 'number',
            default: 0,
            minimum: 0,
            step: 1,
        },
    };
}
function makeDefaultSpriteFrameBaseAssetUserData() {
    return {
        trimThreshold: 1,
        rotated: false,
        offsetX: 0,
        offsetY: 0,
        trimX: 0,
        trimY: 0,
        width: 80,
        height: 80,
        rawWidth: 80,
        rawHeight: 80,
        borderTop: 0,
        borderBottom: 0,
        borderLeft: 0,
        borderRight: 0,
        packable: true,
        pixelsToUnit: 100,
        pivotX: 0.5,
        pivotY: 0.5,
        meshType: 0,
        vertices: {
            rawPosition: [],
            indexes: [],
            uv: [],
            nuv: [],
            minPos: [],
            maxPos: [],
        },
    };
}
function getWrapMode(wrapMode) {
    switch (wrapMode) {
        // @ts-ignore
        case 'clamp-to-edge':
            return cc.TextureBase.WrapMode.CLAMP_TO_EDGE;
        // @ts-ignore
        case 'repeat':
            return cc.TextureBase.WrapMode.REPEAT;
        // @ts-ignore
        case 'mirrored-repeat':
            return cc.TextureBase.WrapMode.MIRRORED_REPEAT;
    }
}
function getWrapModeString(num) {
    switch (num) {
        // @ts-ignore
        case cc.TextureBase.WrapMode.CLAMP_TO_EDGE:
            return 'clamp-to-edge';
        // @ts-ignore
        case cc.TextureBase.WrapMode.REPEAT:
            return 'repeat';
        // @ts-ignore
        case cc.TextureBase.WrapMode.MIRRORED_REPEAT:
            return 'mirrored-repeat';
    }
}
function getFilter(filter) {
    switch (filter) {
        // @ts-ignore
        case 'nearest':
            return cc.TextureBase.Filter.NEAREST;
        // @ts-ignore
        case 'linear':
            return cc.TextureBase.Filter.LINEAR;
        // @ts-ignore
        case 'none':
            return cc.TextureBase.Filter.NONE;
    }
}
function getFilterString(num) {
    switch (num) {
        // @ts-ignore
        case cc.TextureBase.Filter.NEAREST:
            return 'nearest';
        // @ts-ignore
        case cc.TextureBase.Filter.LINEAR:
            return 'linear';
        // @ts-ignore
        case cc.TextureBase.Filter.NONE:
            return 'none';
    }
}
// @ts-ignore
function applyTextureBaseAssetUserData(userData, texture) {
    texture.setWrapMode(getWrapMode(userData.wrapModeS), getWrapMode(userData.wrapModeT));
    texture.setFilters(getFilter(userData.minfilter), getFilter(userData.magfilter));
    texture.setMipFilter(getFilter(userData.mipfilter));
    texture.setAnisotropy(userData.anisotropy);
}
async function migrateAnisotropy(asset) {
    const userData = asset.userData;
    if (!userData || !userData.anisotropy) {
        return;
    }
    userData.anisotropy = 0;
}
