'use strict';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpriteFrameHandler = void 0;
exports.trimImage = trimImage;
const asset_db_1 = require("@cocos/asset-db");
const cc = __importStar(require("cc"));
const utils_1 = require("../utils");
const i18n_1 = __importDefault(require("../../../base/i18n"));
const texture_base_1 = require("./texture-base");
try {
    require('sharp');
}
catch (error) {
    console.error(error);
    console.error(i18n_1.default.t('importer.sharp_error'));
}
const Sharp = require('sharp');
Sharp.cache(false);
const defaultSpriteFrameUserData = (0, texture_base_1.makeDefaultSpriteFrameBaseAssetUserData)();
exports.SpriteFrameHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'sprite-frame',
    assetType: 'cc.SpriteFrame',
    userDataConfig: {
        default: {
            trimType: {
                default: 'auto',
                label: 'i18n:ENGINE.assets.spriteFrame.trimType',
                description: 'i18n:ENGINE.assets.spriteFrame.trimTypeTip',
                render: {
                    ui: 'ui-select',
                    items: [
                        {
                            label: 'i18n:importer.property_schema.sprite_frame.trim_type_auto',
                            value: 'auto',
                        },
                        {
                            label: 'i18n:importer.property_schema.sprite_frame.trim_type_custom',
                            value: 'custom',
                        },
                        {
                            label: 'i18n:importer.property_schema.sprite_frame.trim_type_none',
                            value: 'none',
                        },
                    ],
                },
            },
        },
    },
    propertySchemaConfig: {
        trimType: {
            title: 'i18n:ENGINE.assets.spriteFrame.trimType',
            description: 'i18n:ENGINE.assets.spriteFrame.trimTypeTip',
            type: 'string',
            default: 'auto',
            enum: ['auto', 'custom', 'none'],
            enumDescriptions: [
                'i18n:importer.property_schema.sprite_frame.trim_type_auto',
                'i18n:importer.property_schema.sprite_frame.trim_type_custom',
                'i18n:importer.property_schema.sprite_frame.trim_type_none',
            ],
        },
        trimThreshold: {
            default: defaultSpriteFrameUserData.trimThreshold,
            title: 'i18n:ENGINE.assets.spriteFrame.trimThreshold',
            description: 'i18n:ENGINE.assets.spriteFrame.trimThresholdTip',
            type: 'number',
            minimum: 0,
            step: 1,
        },
        packable: {
            default: defaultSpriteFrameUserData.packable,
            title: 'i18n:ENGINE.assets.spriteFrame.packable',
            description: 'i18n:ENGINE.assets.spriteFrame.packableTip',
            type: 'boolean',
        },
        pixelsToUnit: {
            default: defaultSpriteFrameUserData.pixelsToUnit,
            title: 'i18n:ENGINE.assets.spriteFrame.pixelsToUnit',
            description: 'i18n:ENGINE.assets.spriteFrame.pixelsToUnitTip',
            type: 'number',
            minimum: 1,
            step: 1,
        },
        pivotX: {
            default: defaultSpriteFrameUserData.pivotX,
            title: 'i18n:ENGINE.assets.spriteFrame.pivotX',
            description: 'i18n:ENGINE.assets.spriteFrame.pivotXTip',
            type: 'number',
            minimum: 0,
            maximum: 1,
            step: 0.01,
        },
        pivotY: {
            default: defaultSpriteFrameUserData.pivotY,
            title: 'i18n:ENGINE.assets.spriteFrame.pivotY',
            description: 'i18n:ENGINE.assets.spriteFrame.pivotYTip',
            type: 'number',
            minimum: 0,
            maximum: 1,
            step: 0.01,
        },
        meshType: {
            default: defaultSpriteFrameUserData.meshType,
            title: 'i18n:ENGINE.assets.spriteFrame.meshType',
            description: 'i18n:ENGINE.assets.spriteFrame.meshTypeTip',
            type: 'number',
            enum: [0, 1],
            enumDescriptions: [
                'i18n:importer.property_schema.sprite_frame.mesh_type_rect',
                'i18n:importer.property_schema.sprite_frame.mesh_type_polygon',
            ],
        },
        borderTop: {
            default: defaultSpriteFrameUserData.borderTop,
            title: 'i18n:ENGINE.assets.spriteFrame.borderTop',
            description: 'i18n:ENGINE.assets.spriteFrame.borderTopTip',
            type: 'number',
            minimum: 0,
            step: 1,
        },
        borderBottom: {
            default: defaultSpriteFrameUserData.borderBottom,
            title: 'i18n:ENGINE.assets.spriteFrame.borderBottom',
            description: 'i18n:ENGINE.assets.spriteFrame.borderBottomTip',
            type: 'number',
            minimum: 0,
            step: 1,
        },
        borderLeft: {
            default: defaultSpriteFrameUserData.borderLeft,
            title: 'i18n:ENGINE.assets.spriteFrame.borderLeft',
            description: 'i18n:ENGINE.assets.spriteFrame.borderLeftTip',
            type: 'number',
            minimum: 0,
            step: 1,
        },
        borderRight: {
            default: defaultSpriteFrameUserData.borderRight,
            title: 'i18n:ENGINE.assets.spriteFrame.borderRight',
            description: 'i18n:ENGINE.assets.spriteFrame.borderRightTip',
            type: 'number',
            minimum: 0,
            step: 1,
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.12',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            // 如果没有生成 json 文件，则重新生成
            if (!asset.parent) {
                return false;
            }
            if (asset.parent.meta.importer === 'image') {
                const userData = asset.userData;
                let file;
                // TODO 此处需要更换通用写法，这样容易漏掉一些新格式支持的更新
                // @ts-ignore
                if (['.tga', '.hdr', '.bmp', '.exr', '.znt', '.psd'].includes(asset.parent.extname.toLowerCase())) {
                    file = asset.parent.library + '.png';
                }
                else {
                    file = asset.parent.source;
                }
                const MIN_SIZE = 1;
                const imageData = await Sharp(file).raw().toBuffer({ resolveWithObject: true });
                if (!imageData) {
                    return false;
                }
                if (userData.trimThreshold === undefined) {
                    userData.trimThreshold = 1;
                }
                userData.rotated = !!userData.rotated;
                userData.packable = userData.packable === undefined ? true : userData.packable;
                userData.rawHeight = imageData.info.height;
                userData.rawWidth = imageData.info.width;
                if (userData.trimType === 'auto') {
                    if (imageData.info.channels !== 4) {
                        userData.width = imageData.info.width;
                        userData.height = imageData.info.height;
                        userData.trimX = 0;
                        userData.trimY = 0;
                    }
                    else {
                        const rect = (0, utils_1.getTrimRect)(Buffer.from(imageData.data), userData.rawWidth, userData.rawHeight, userData.trimThreshold);
                        userData.width = Math.max(rect[2], MIN_SIZE);
                        userData.height = Math.max(rect[3], MIN_SIZE);
                        userData.trimX = cc.clamp(rect[0], 0, userData.rawWidth - userData.width);
                        userData.trimY = cc.clamp(rect[1], 0, userData.rawHeight - userData.height);
                    }
                }
                else if (userData.trimType === 'none') {
                    userData.trimX = 0;
                    userData.trimY = 0;
                    userData.width = imageData.info.width;
                    userData.height = imageData.info.height;
                }
                else {
                    userData.trimX = cc.clamp(userData.trimX, 0, userData.rawWidth - MIN_SIZE);
                    userData.trimY = cc.clamp(userData.trimY, 0, userData.rawHeight - MIN_SIZE);
                    userData.width = cc.clamp(userData.width === -1 ? userData.rawWidth : userData.width, MIN_SIZE, userData.rawWidth - userData.trimX);
                    userData.height = cc.clamp(userData.height === -1 ? userData.rawHeight : userData.height, MIN_SIZE, userData.rawHeight - userData.trimY);
                }
                userData.offsetX = userData.trimX + userData.width / 2 - userData.rawWidth / 2;
                userData.offsetY = -(userData.trimY + userData.height / 2 - userData.rawHeight / 2);
                userData.borderLeft = cc.clamp(userData.borderLeft, 0, userData.width);
                userData.borderRight = cc.clamp(userData.borderRight, 0, userData.width - userData.borderLeft);
                userData.borderTop = cc.clamp(userData.borderTop, 0, userData.height);
                userData.borderBottom = cc.clamp(userData.borderBottom, 0, userData.height - userData.borderTop);
                // userData.pixelsToUnit = 100;
                // userData.pivotX = 0.5;
                // userData.pivotY = 0.5;
                // userData.meshType = 0;
                initVerticesData(userData);
            }
            // userData.vertices = undefined;
            const spriteFrame = createSpriteFrame(asset);
            if (asset.parent instanceof asset_db_1.Asset) {
                spriteFrame.name = spriteFrame.name || asset.parent.basename || '';
            }
            getTexture(asset, spriteFrame);
            const serializeJSON = EditorExtends.serialize(spriteFrame);
            await asset.saveToLibrary('.json', serializeJSON);
            // plist 文件下导入的 sprite 序列化信息会记录父资源 uuid 但在依赖关系上并不依赖，需要走反序列化获取对的依赖关系
            const depends = (0, utils_1.getDependUUIDList)(JSON.parse(serializeJSON));
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.SpriteFrameHandler;
async function trimImage(source, dest, options) {
    const image = Sharp(source).extract({
        left: options.trimX,
        top: options.trimY,
        width: options.rotated ? options.height : options.width,
        height: options.rotated ? options.width : options.height,
    });
    if (options.rotated) {
        image.rotate(270);
    }
    return await image.toFile(dest);
}
function createSpriteFrame(asset) {
    const userData = asset.userData;
    const sprite = new cc.SpriteFrame();
    sprite.name = asset.displayName ? asset.displayName : asset._name;
    sprite.atlasUuid = userData.atlasUuid;
    // @ts-ignore
    sprite._rect = cc.rect(userData.trimX, userData.trimY, userData.width, userData.height);
    // @ts-ignore
    sprite._originalSize = cc.size(userData.rawWidth, userData.rawHeight);
    // @ts-ignore
    sprite._offset = cc.v2(userData.offsetX, userData.offsetY);
    // @ts-ignore
    sprite._capInsets = [userData.borderLeft, userData.borderTop, userData.borderRight, userData.borderBottom];
    // @ts-ignore
    sprite._rotated = userData.rotated;
    // @ts-ignore
    sprite._packable = userData.packable;
    // @ts-ignore
    sprite._pixelsToUnit = userData.pixelsToUnit;
    // @ts-ignore
    sprite._pivot = cc.v2(userData.pivotX, userData.pivotY);
    // @ts-ignore
    sprite._meshType = userData.meshType;
    // @ts-ignore
    initVertices(sprite, userData);
    return sprite;
}
function getTexture(asset, spriteFrame) {
    const userData = asset.userData;
    // Get Texture
    const imageUuidOrDatabaseUri = userData.imageUuidOrDatabaseUri;
    if (!imageUuidOrDatabaseUri) {
        return;
    }
    else {
        let imageUuid = null;
        if (userData.isUuid) {
            imageUuid = imageUuidOrDatabaseUri;
        }
        else {
            imageUuid = (0, asset_db_1.queryUUID)(imageUuidOrDatabaseUri);
            if (!imageUuid) {
                console.warn(`Cannot find image ${(0, asset_db_1.queryPath)(imageUuidOrDatabaseUri) || ''}.`);
            }
        }
        if (imageUuid !== null) {
            // @ts-ignore
            spriteFrame._texture = EditorExtends.serialize.asAsset(imageUuid, cc.Texture2D);
        }
    }
}
function initVerticesData(userData) {
    if (userData.vertices === undefined) {
        userData.vertices = {
            rawPosition: [],
            indexes: [],
            uv: [],
            nuv: [],
            minPos: [],
            maxPos: [],
        };
    }
    const vertices = userData.vertices;
    vertices.rawPosition.length = 0;
    if (userData.meshType === cc.SpriteFrame.MeshType.POLYGON) {
        // 使用 Bayazit 来生成顶点并赋值
    }
    else {
        const width = userData.width;
        const height = userData.height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const texw = userData.rawWidth;
        const texh = userData.rawHeight;
        const rectX = userData.trimX;
        const rectY = texh - userData.trimY - height;
        const l = texw === 0 ? 0 : rectX / texw;
        const r = texw === 0 ? 1 : (rectX + width) / texw;
        const t = texh === 0 ? 1 : (rectY + height) / texh;
        const b = texh === 0 ? 0 : rectY / texh;
        vertices.rawPosition = [-halfWidth, -halfHeight, 0, halfWidth, -halfHeight, 0, -halfWidth, halfHeight, 0, halfWidth, halfHeight, 0];
        vertices.uv = [rectX, rectY + height, rectX + width, rectY + height, rectX, rectY, rectX + width, rectY];
        vertices.nuv = [l, b, r, b, l, t, r, t];
        vertices.indexes = [0, 1, 2, 2, 1, 3];
        vertices.minPos = [-halfWidth, -halfHeight, 0];
        vertices.maxPos = [halfWidth, halfHeight, 0];
    }
}
function initVertices(sprite, userData) {
    const userVertices = userData.vertices;
    sprite.vertices = {
        rawPosition: [],
        positions: [],
        indexes: userVertices.indexes,
        uv: userVertices.uv,
        nuv: userVertices.nuv,
        minPos: cc.v3(userVertices.minPos[0], userVertices.minPos[1], userVertices.minPos[2]),
        maxPos: cc.v3(userVertices.maxPos[0], userVertices.maxPos[1], userVertices.maxPos[2]),
    };
    const vertices = sprite.vertices;
    const rawPosition = userVertices.rawPosition;
    const tempVec3 = cc.v3();
    for (let i = 0; i < rawPosition.length; i += 3) {
        tempVec3.set(rawPosition[i], rawPosition[i + 1], rawPosition[i + 2]);
        vertices.rawPosition.push(tempVec3.clone());
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ByaXRlLWZyYW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3Nwcml0ZS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNSYiw4QkFXQztBQS9SRCw4Q0FBNEU7QUFDNUUsdUNBQXlCO0FBSXpCLG9DQUEwRDtBQUMxRCw4REFBc0M7QUFDdEMsaURBQXlFO0FBRXpFLElBQUksQ0FBQztJQUNELE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztJQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRS9CLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFbkIsTUFBTSwwQkFBMEIsR0FBRyxJQUFBLHNEQUF1QyxHQUFFLENBQUM7QUFFaEUsUUFBQSxrQkFBa0IsR0FBaUI7SUFDNUMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxjQUFjO0lBRXBCLFNBQVMsRUFBRSxnQkFBZ0I7SUFFM0IsY0FBYyxFQUFFO1FBQ1osT0FBTyxFQUFFO1lBQ0wsUUFBUSxFQUFFO2dCQUNOLE9BQU8sRUFBRSxNQUFNO2dCQUNmLEtBQUssRUFBRSx5Q0FBeUM7Z0JBQ2hELFdBQVcsRUFBRSw0Q0FBNEM7Z0JBQ3pELE1BQU0sRUFBRTtvQkFDSixFQUFFLEVBQUUsV0FBVztvQkFDZixLQUFLLEVBQUU7d0JBQ0g7NEJBQ0ksS0FBSyxFQUFFLDJEQUEyRDs0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Q0FBQyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUM7b0JBQzNFLFFBQVEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDO29CQUM1RSxRQUFRLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQ3JCLFFBQVEsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQzFELFFBQVEsRUFDUixRQUFRLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQ3JDLENBQUM7b0JBQ0YsUUFBUSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUN0QixRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUM3RCxRQUFRLEVBQ1IsUUFBUSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUN0QyxDQUFDO2dCQUNOLENBQUM7Z0JBRUQsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2dCQUMvRSxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRXBGLFFBQVEsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JB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QVksQ0FBQyxPQUFPO1FBQzdCLEVBQUUsRUFBRSxZQUFZLENBQUMsRUFBRTtRQUNuQixHQUFHLEVBQUUsWUFBWSxDQUFDLEdBQUc7UUFDckIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEYsQ0FBQztJQUNGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDakMsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQztJQUM3QyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDekIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldCwgVmlydHVhbEFzc2V0LCBxdWVyeVBhdGgsIHF1ZXJ5VVVJRCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XG5cbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgU3ByaXRlRnJhbWVCYXNlQXNzZXRVc2VyRGF0YSwgU3ByaXRlRnJhbWVBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5pbXBvcnQgeyBnZXRUcmltUmVjdCwgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgbWFrZURlZmF1bHRTcHJpdGVGcmFtZUJhc2VBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi90ZXh0dXJlLWJhc2UnO1xuXG50cnkge1xuICAgIHJlcXVpcmUoJ3NoYXJwJyk7XG59IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIGNvbnNvbGUuZXJyb3IoaTE4bi50KCdpbXBvcnRlci5zaGFycF9lcnJvcicpKTtcbn1cblxuY29uc3QgU2hhcnAgPSByZXF1aXJlKCdzaGFycCcpO1xuXG5TaGFycC5jYWNoZShmYWxzZSk7XG5cbmNvbnN0IGRlZmF1bHRTcHJpdGVGcmFtZVVzZXJEYXRhID0gbWFrZURlZmF1bHRTcHJpdGVGcmFtZUJhc2VBc3NldFVzZXJEYXRhKCk7XG5cbmV4cG9ydCBjb25zdCBTcHJpdGVGcmFtZUhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdzcHJpdGUtZnJhbWUnLFxuXG4gICAgYXNzZXRUeXBlOiAnY2MuU3ByaXRlRnJhbWUnLFxuXG4gICAgdXNlckRhdGFDb25maWc6IHtcbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgdHJpbVR5cGU6IHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUudHJpbVR5cGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLnRyaW1UeXBlVGlwJyxcbiAgICAgICAgICAgICAgICByZW5kZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdWk6ICd1aS1zZWxlY3QnLFxuICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuc3ByaXRlX2ZyYW1lLnRyaW1fdHlwZV9hdXRvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLnNwcml0ZV9mcmFtZS50cmltX3R5cGVfY3VzdG9tJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2N1c3RvbScsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuc3ByaXRlX2ZyYW1lLnRyaW1fdHlwZV9ub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHByb3BlcnR5U2NoZW1hQ29uZmlnOiB7XG4gICAgICAgIHRyaW1UeXBlOiB7XG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS50cmltVHlwZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS50cmltVHlwZVRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdhdXRvJyxcbiAgICAgICAgICAgIGVudW06IFsnYXV0bycsICdjdXN0b20nLCAnbm9uZSddLFxuICAgICAgICAgICAgZW51bURlc2NyaXB0aW9uczogW1xuICAgICAgICAgICAgICAgICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5zcHJpdGVfZnJhbWUudHJpbV90eXBlX2F1dG8nLFxuICAgICAgICAgICAgICAgICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5zcHJpdGVfZnJhbWUudHJpbV90eXBlX2N1c3RvbScsXG4gICAgICAgICAgICAgICAgJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLnNwcml0ZV9mcmFtZS50cmltX3R5cGVfbm9uZScsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB0cmltVGhyZXNob2xkOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0U3ByaXRlRnJhbWVVc2VyRGF0YS50cmltVGhyZXNob2xkLFxuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUudHJpbVRocmVzaG9sZCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS50cmltVGhyZXNob2xkVGlwJyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgIH0sXG4gICAgICAgIHBhY2thYmxlOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0U3ByaXRlRnJhbWVVc2VyRGF0YS5wYWNrYWJsZSxcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLnBhY2thYmxlJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLnBhY2thYmxlVGlwJyxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgICAgcGl4ZWxzVG9Vbml0OiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0U3ByaXRlRnJhbWVVc2VyRGF0YS5waXhlbHNUb1VuaXQsXG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5waXhlbHNUb1VuaXQnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUucGl4ZWxzVG9Vbml0VGlwJyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgbWluaW11bTogMSxcbiAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgIH0sXG4gICAgICAgIHBpdm90WDoge1xuICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdFNwcml0ZUZyYW1lVXNlckRhdGEucGl2b3RYLFxuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUucGl2b3RYJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLnBpdm90WFRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICBtYXhpbXVtOiAxLFxuICAgICAgICAgICAgc3RlcDogMC4wMSxcbiAgICAgICAgfSxcbiAgICAgICAgcGl2b3RZOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0U3ByaXRlRnJhbWVVc2VyRGF0YS5waXZvdFksXG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5waXZvdFknLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUucGl2b3RZVGlwJyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgICAgIG1heGltdW06IDEsXG4gICAgICAgICAgICBzdGVwOiAwLjAxLFxuICAgICAgICB9LFxuICAgICAgICBtZXNoVHlwZToge1xuICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdFNwcml0ZUZyYW1lVXNlckRhdGEubWVzaFR5cGUsXG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5tZXNoVHlwZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5tZXNoVHlwZVRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGVudW06IFswLCAxXSxcbiAgICAgICAgICAgIGVudW1EZXNjcmlwdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuc3ByaXRlX2ZyYW1lLm1lc2hfdHlwZV9yZWN0JyxcbiAgICAgICAgICAgICAgICAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuc3ByaXRlX2ZyYW1lLm1lc2hfdHlwZV9wb2x5Z29uJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvcmRlclRvcDoge1xuICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdFNwcml0ZUZyYW1lVXNlckRhdGEuYm9yZGVyVG9wLFxuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUuYm9yZGVyVG9wJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLmJvcmRlclRvcFRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICB9LFxuICAgICAgICBib3JkZXJCb3R0b206IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmF1bHRTcHJpdGVGcmFtZVVzZXJEYXRhLmJvcmRlckJvdHRvbSxcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLmJvcmRlckJvdHRvbScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5ib3JkZXJCb3R0b21UaXAnLFxuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICAgICAgc3RlcDogMSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9yZGVyTGVmdDoge1xuICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdFNwcml0ZUZyYW1lVXNlckRhdGEuYm9yZGVyTGVmdCxcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLnNwcml0ZUZyYW1lLmJvcmRlckxlZnQnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuc3ByaXRlRnJhbWUuYm9yZGVyTGVmdFRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICB9LFxuICAgICAgICBib3JkZXJSaWdodDoge1xuICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdFNwcml0ZUZyYW1lVXNlckRhdGEuYm9yZGVyUmlnaHQsXG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5ib3JkZXJSaWdodCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5zcHJpdGVGcmFtZS5ib3JkZXJSaWdodFRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMTInLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahOagh+iusFxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgICAgICog5ZCO57ut55qE5LiA57O75YiX5pON5L2c6YO95LiN5Lya5omn6KGMXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ55Sf5oiQIGpzb24g5paH5Lu277yM5YiZ6YeN5paw55Sf5oiQXG4gICAgICAgICAgICBpZiAoIWFzc2V0LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFzc2V0LnBhcmVudC5tZXRhLmltcG9ydGVyID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBTcHJpdGVGcmFtZUJhc2VBc3NldFVzZXJEYXRhO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8g5q2k5aSE6ZyA6KaB5pu05o2i6YCa55So5YaZ5rOV77yM6L+Z5qC35a655piT5ryP5o6J5LiA5Lqb5paw5qC85byP5pSv5oyB55qE5pu05pawXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGlmIChbJy50Z2EnLCAnLmhkcicsICcuYm1wJywgJy5leHInLCAnLnpudCcsICcucHNkJ10uaW5jbHVkZXMoYXNzZXQucGFyZW50LmV4dG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGFzc2V0LnBhcmVudC5saWJyYXJ5ICsgJy5wbmcnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBhc3NldC5wYXJlbnQuc291cmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBNSU5fU0laRSA9IDE7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgU2hhcnAoZmlsZSkucmF3KCkudG9CdWZmZXIoeyByZXNvbHZlV2l0aE9iamVjdDogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIWltYWdlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1c2VyRGF0YS50cmltVGhyZXNob2xkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEudHJpbVRocmVzaG9sZCA9IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdXNlckRhdGEucm90YXRlZCA9ICEhdXNlckRhdGEucm90YXRlZDtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5wYWNrYWJsZSA9IHVzZXJEYXRhLnBhY2thYmxlID09PSB1bmRlZmluZWQgPyB0cnVlIDogdXNlckRhdGEucGFja2FibGU7XG4gICAgICAgICAgICAgICAgdXNlckRhdGEucmF3SGVpZ2h0ID0gaW1hZ2VEYXRhLmluZm8uaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHVzZXJEYXRhLnJhd1dpZHRoID0gaW1hZ2VEYXRhLmluZm8ud2lkdGg7XG5cbiAgICAgICAgICAgICAgICBpZiAodXNlckRhdGEudHJpbVR5cGUgPT09ICdhdXRvJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW1hZ2VEYXRhLmluZm8uY2hhbm5lbHMgIT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLndpZHRoID0gaW1hZ2VEYXRhLmluZm8ud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5oZWlnaHQgPSBpbWFnZURhdGEuaW5mby5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50cmltWCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50cmltWSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN0ID0gZ2V0VHJpbVJlY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQnVmZmVyLmZyb20oaW1hZ2VEYXRhLmRhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnJhd1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnJhd0hlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50cmltVGhyZXNob2xkLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLndpZHRoID0gTWF0aC5tYXgocmVjdFsyXSwgTUlOX1NJWkUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEuaGVpZ2h0ID0gTWF0aC5tYXgocmVjdFszXSwgTUlOX1NJWkUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEudHJpbVggPSBjYy5jbGFtcChyZWN0WzBdLCAwLCB1c2VyRGF0YS5yYXdXaWR0aCAtIHVzZXJEYXRhLndpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnRyaW1ZID0gY2MuY2xhbXAocmVjdFsxXSwgMCwgdXNlckRhdGEucmF3SGVpZ2h0IC0gdXNlckRhdGEuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXNlckRhdGEudHJpbVR5cGUgPT09ICdub25lJykge1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50cmltWCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnRyaW1ZID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEud2lkdGggPSBpbWFnZURhdGEuaW5mby53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEuaGVpZ2h0ID0gaW1hZ2VEYXRhLmluZm8uaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnRyaW1YID0gY2MuY2xhbXAodXNlckRhdGEudHJpbVgsIDAsIHVzZXJEYXRhLnJhd1dpZHRoIC0gTUlOX1NJWkUpO1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50cmltWSA9IGNjLmNsYW1wKHVzZXJEYXRhLnRyaW1ZLCAwLCB1c2VyRGF0YS5yYXdIZWlnaHQgLSBNSU5fU0laRSk7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLndpZHRoID0gY2MuY2xhbXAoXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS53aWR0aCA9PT0gLTEgPyB1c2VyRGF0YS5yYXdXaWR0aCA6IHVzZXJEYXRhLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTUlOX1NJWkUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5yYXdXaWR0aCAtIHVzZXJEYXRhLnRyaW1YLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5oZWlnaHQgPSBjYy5jbGFtcChcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLmhlaWdodCA9PT0gLTEgPyB1c2VyRGF0YS5yYXdIZWlnaHQgOiB1c2VyRGF0YS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBNSU5fU0laRSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLnJhd0hlaWdodCAtIHVzZXJEYXRhLnRyaW1ZLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHVzZXJEYXRhLm9mZnNldFggPSB1c2VyRGF0YS50cmltWCArIHVzZXJEYXRhLndpZHRoIC8gMiAtIHVzZXJEYXRhLnJhd1dpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5vZmZzZXRZID0gLSh1c2VyRGF0YS50cmltWSArIHVzZXJEYXRhLmhlaWdodCAvIDIgLSB1c2VyRGF0YS5yYXdIZWlnaHQgLyAyKTtcblxuICAgICAgICAgICAgICAgIHVzZXJEYXRhLmJvcmRlckxlZnQgPSBjYy5jbGFtcCh1c2VyRGF0YS5ib3JkZXJMZWZ0LCAwLCB1c2VyRGF0YS53aWR0aCk7XG4gICAgICAgICAgICAgICAgdXNlckRhdGEuYm9yZGVyUmlnaHQgPSBjYy5jbGFtcCh1c2VyRGF0YS5ib3JkZXJSaWdodCwgMCwgdXNlckRhdGEud2lkdGggLSB1c2VyRGF0YS5ib3JkZXJMZWZ0KTtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5ib3JkZXJUb3AgPSBjYy5jbGFtcCh1c2VyRGF0YS5ib3JkZXJUb3AsIDAsIHVzZXJEYXRhLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgdXNlckRhdGEuYm9yZGVyQm90dG9tID0gY2MuY2xhbXAodXNlckRhdGEuYm9yZGVyQm90dG9tLCAwLCB1c2VyRGF0YS5oZWlnaHQgLSB1c2VyRGF0YS5ib3JkZXJUb3ApO1xuXG4gICAgICAgICAgICAgICAgLy8gdXNlckRhdGEucGl4ZWxzVG9Vbml0ID0gMTAwO1xuICAgICAgICAgICAgICAgIC8vIHVzZXJEYXRhLnBpdm90WCA9IDAuNTtcbiAgICAgICAgICAgICAgICAvLyB1c2VyRGF0YS5waXZvdFkgPSAwLjU7XG4gICAgICAgICAgICAgICAgLy8gdXNlckRhdGEubWVzaFR5cGUgPSAwO1xuICAgICAgICAgICAgICAgIGluaXRWZXJ0aWNlc0RhdGEodXNlckRhdGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1c2VyRGF0YS52ZXJ0aWNlcyA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgY29uc3Qgc3ByaXRlRnJhbWUgPSBjcmVhdGVTcHJpdGVGcmFtZShhc3NldCk7XG4gICAgICAgICAgICBpZiAoYXNzZXQucGFyZW50IGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgICAgICBzcHJpdGVGcmFtZS5uYW1lID0gc3ByaXRlRnJhbWUubmFtZSB8fCBhc3NldC5wYXJlbnQuYmFzZW5hbWUgfHwgJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnZXRUZXh0dXJlKGFzc2V0LCBzcHJpdGVGcmFtZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShzcHJpdGVGcmFtZSk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICAvLyBwbGlzdCDmlofku7bkuIvlr7zlhaXnmoQgc3ByaXRlIOW6j+WIl+WMluS/oeaBr+S8muiusOW9leeItui1hOa6kCB1dWlkIOS9huWcqOS+nei1luWFs+ezu+S4iuW5tuS4jeS+nei1lu+8jOmcgOimgei1sOWPjeW6j+WIl+WMluiOt+WPluWvueeahOS+nei1luWFs+ezu1xuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KEpTT04ucGFyc2Uoc2VyaWFsaXplSlNPTikpO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcbmV4cG9ydCBkZWZhdWx0IFNwcml0ZUZyYW1lSGFuZGxlcjtcblxuZXhwb3J0IGludGVyZmFjZSBUcmltT3B0aW9ucyB7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICB0cmltWDogbnVtYmVyO1xuICAgIHRyaW1ZOiBudW1iZXI7XG4gICAgcm90YXRlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyaW1JbWFnZShzb3VyY2U6IHN0cmluZywgZGVzdDogc3RyaW5nLCBvcHRpb25zOiBUcmltT3B0aW9ucykge1xuICAgIGNvbnN0IGltYWdlID0gU2hhcnAoc291cmNlKS5leHRyYWN0KHtcbiAgICAgICAgbGVmdDogb3B0aW9ucy50cmltWCxcbiAgICAgICAgdG9wOiBvcHRpb25zLnRyaW1ZLFxuICAgICAgICB3aWR0aDogb3B0aW9ucy5yb3RhdGVkID8gb3B0aW9ucy5oZWlnaHQgOiBvcHRpb25zLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IG9wdGlvbnMucm90YXRlZCA/IG9wdGlvbnMud2lkdGggOiBvcHRpb25zLmhlaWdodCxcbiAgICB9KTtcbiAgICBpZiAob3B0aW9ucy5yb3RhdGVkKSB7XG4gICAgICAgIGltYWdlLnJvdGF0ZSgyNzApO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgaW1hZ2UudG9GaWxlKGRlc3QpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTcHJpdGVGcmFtZShhc3NldDogQXNzZXQpIHtcbiAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhO1xuICAgIGNvbnN0IHNwcml0ZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSgpO1xuICAgIHNwcml0ZS5uYW1lID0gYXNzZXQuZGlzcGxheU5hbWUgPyBhc3NldC5kaXNwbGF5TmFtZSA6IGFzc2V0Ll9uYW1lO1xuICAgIHNwcml0ZS5hdGxhc1V1aWQgPSB1c2VyRGF0YS5hdGxhc1V1aWQ7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fcmVjdCA9IGNjLnJlY3QodXNlckRhdGEudHJpbVgsIHVzZXJEYXRhLnRyaW1ZLCB1c2VyRGF0YS53aWR0aCwgdXNlckRhdGEuaGVpZ2h0KTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBzcHJpdGUuX29yaWdpbmFsU2l6ZSA9IGNjLnNpemUodXNlckRhdGEucmF3V2lkdGgsIHVzZXJEYXRhLnJhd0hlaWdodCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fb2Zmc2V0ID0gY2MudjIodXNlckRhdGEub2Zmc2V0WCwgdXNlckRhdGEub2Zmc2V0WSk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fY2FwSW5zZXRzID0gW3VzZXJEYXRhLmJvcmRlckxlZnQsIHVzZXJEYXRhLmJvcmRlclRvcCwgdXNlckRhdGEuYm9yZGVyUmlnaHQsIHVzZXJEYXRhLmJvcmRlckJvdHRvbV07XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fcm90YXRlZCA9IHVzZXJEYXRhLnJvdGF0ZWQ7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fcGFja2FibGUgPSB1c2VyRGF0YS5wYWNrYWJsZTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgc3ByaXRlLl9waXhlbHNUb1VuaXQgPSB1c2VyRGF0YS5waXhlbHNUb1VuaXQ7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fcGl2b3QgPSBjYy52Mih1c2VyRGF0YS5waXZvdFgsIHVzZXJEYXRhLnBpdm90WSk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNwcml0ZS5fbWVzaFR5cGUgPSB1c2VyRGF0YS5tZXNoVHlwZTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaW5pdFZlcnRpY2VzKHNwcml0ZSwgdXNlckRhdGEpO1xuICAgIHJldHVybiBzcHJpdGU7XG59XG5cbmZ1bmN0aW9uIGdldFRleHR1cmUoYXNzZXQ6IFZpcnR1YWxBc3NldCwgc3ByaXRlRnJhbWU6IGNjLlNwcml0ZUZyYW1lKSB7XG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBTcHJpdGVGcmFtZUFzc2V0VXNlckRhdGE7XG4gICAgLy8gR2V0IFRleHR1cmVcbiAgICBjb25zdCBpbWFnZVV1aWRPckRhdGFiYXNlVXJpID0gdXNlckRhdGEuaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaTtcbiAgICBpZiAoIWltYWdlVXVpZE9yRGF0YWJhc2VVcmkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpbWFnZVV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAodXNlckRhdGEuaXNVdWlkKSB7XG4gICAgICAgICAgICBpbWFnZVV1aWQgPSBpbWFnZVV1aWRPckRhdGFiYXNlVXJpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2VVdWlkID0gcXVlcnlVVUlEKGltYWdlVXVpZE9yRGF0YWJhc2VVcmkpO1xuICAgICAgICAgICAgaWYgKCFpbWFnZVV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbm5vdCBmaW5kIGltYWdlICR7cXVlcnlQYXRoKGltYWdlVXVpZE9yRGF0YWJhc2VVcmkpIHx8ICcnfS5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaW1hZ2VVdWlkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBzcHJpdGVGcmFtZS5fdGV4dHVyZSA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplLmFzQXNzZXQoaW1hZ2VVdWlkLCBjYy5UZXh0dXJlMkQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0VmVydGljZXNEYXRhKHVzZXJEYXRhOiBTcHJpdGVGcmFtZUJhc2VBc3NldFVzZXJEYXRhKSB7XG4gICAgaWYgKHVzZXJEYXRhLnZlcnRpY2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdXNlckRhdGEudmVydGljZXMgPSB7XG4gICAgICAgICAgICByYXdQb3NpdGlvbjogW10sXG4gICAgICAgICAgICBpbmRleGVzOiBbXSxcbiAgICAgICAgICAgIHV2OiBbXSxcbiAgICAgICAgICAgIG51djogW10sXG4gICAgICAgICAgICBtaW5Qb3M6IFtdLFxuICAgICAgICAgICAgbWF4UG9zOiBbXSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdmVydGljZXMgPSB1c2VyRGF0YS52ZXJ0aWNlcztcbiAgICB2ZXJ0aWNlcy5yYXdQb3NpdGlvbi5sZW5ndGggPSAwO1xuXG4gICAgaWYgKHVzZXJEYXRhLm1lc2hUeXBlID09PSBjYy5TcHJpdGVGcmFtZS5NZXNoVHlwZS5QT0xZR09OKSB7XG4gICAgICAgIC8vIOS9v+eUqCBCYXlheml0IOadpeeUn+aIkOmhtueCueW5tui1i+WAvFxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdXNlckRhdGEud2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHVzZXJEYXRhLmhlaWdodDtcbiAgICAgICAgY29uc3QgaGFsZldpZHRoID0gd2lkdGggLyAyO1xuICAgICAgICBjb25zdCBoYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgdGV4dyA9IHVzZXJEYXRhLnJhd1dpZHRoO1xuICAgICAgICBjb25zdCB0ZXhoID0gdXNlckRhdGEucmF3SGVpZ2h0O1xuICAgICAgICBjb25zdCByZWN0WCA9IHVzZXJEYXRhLnRyaW1YO1xuICAgICAgICBjb25zdCByZWN0WSA9IHRleGggLSB1c2VyRGF0YS50cmltWSAtIGhlaWdodDtcbiAgICAgICAgY29uc3QgbCA9IHRleHcgPT09IDAgPyAwIDogcmVjdFggLyB0ZXh3O1xuICAgICAgICBjb25zdCByID0gdGV4dyA9PT0gMCA/IDEgOiAocmVjdFggKyB3aWR0aCkgLyB0ZXh3O1xuICAgICAgICBjb25zdCB0ID0gdGV4aCA9PT0gMCA/IDEgOiAocmVjdFkgKyBoZWlnaHQpIC8gdGV4aDtcbiAgICAgICAgY29uc3QgYiA9IHRleGggPT09IDAgPyAwIDogcmVjdFkgLyB0ZXhoO1xuICAgICAgICB2ZXJ0aWNlcy5yYXdQb3NpdGlvbiA9IFstaGFsZldpZHRoLCAtaGFsZkhlaWdodCwgMCwgaGFsZldpZHRoLCAtaGFsZkhlaWdodCwgMCwgLWhhbGZXaWR0aCwgaGFsZkhlaWdodCwgMCwgaGFsZldpZHRoLCBoYWxmSGVpZ2h0LCAwXTtcbiAgICAgICAgdmVydGljZXMudXYgPSBbcmVjdFgsIHJlY3RZICsgaGVpZ2h0LCByZWN0WCArIHdpZHRoLCByZWN0WSArIGhlaWdodCwgcmVjdFgsIHJlY3RZLCByZWN0WCArIHdpZHRoLCByZWN0WV07XG4gICAgICAgIHZlcnRpY2VzLm51diA9IFtsLCBiLCByLCBiLCBsLCB0LCByLCB0XTtcbiAgICAgICAgdmVydGljZXMuaW5kZXhlcyA9IFswLCAxLCAyLCAyLCAxLCAzXTtcbiAgICAgICAgdmVydGljZXMubWluUG9zID0gWy1oYWxmV2lkdGgsIC1oYWxmSGVpZ2h0LCAwXTtcbiAgICAgICAgdmVydGljZXMubWF4UG9zID0gW2hhbGZXaWR0aCwgaGFsZkhlaWdodCwgMF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0VmVydGljZXMoc3ByaXRlOiBjYy5TcHJpdGVGcmFtZSwgdXNlckRhdGE6IFNwcml0ZUZyYW1lQmFzZUFzc2V0VXNlckRhdGEpIHtcbiAgICBjb25zdCB1c2VyVmVydGljZXMgPSB1c2VyRGF0YS52ZXJ0aWNlcztcbiAgICBzcHJpdGUudmVydGljZXMgPSB7XG4gICAgICAgIHJhd1Bvc2l0aW9uOiBbXSxcbiAgICAgICAgcG9zaXRpb25zOiBbXSxcbiAgICAgICAgaW5kZXhlczogdXNlclZlcnRpY2VzLmluZGV4ZXMsXG4gICAgICAgIHV2OiB1c2VyVmVydGljZXMudXYsXG4gICAgICAgIG51djogdXNlclZlcnRpY2VzLm51dixcbiAgICAgICAgbWluUG9zOiBjYy52Myh1c2VyVmVydGljZXMubWluUG9zWzBdLCB1c2VyVmVydGljZXMubWluUG9zWzFdLCB1c2VyVmVydGljZXMubWluUG9zWzJdKSxcbiAgICAgICAgbWF4UG9zOiBjYy52Myh1c2VyVmVydGljZXMubWF4UG9zWzBdLCB1c2VyVmVydGljZXMubWF4UG9zWzFdLCB1c2VyVmVydGljZXMubWF4UG9zWzJdKSxcbiAgICB9O1xuICAgIGNvbnN0IHZlcnRpY2VzID0gc3ByaXRlLnZlcnRpY2VzO1xuICAgIGNvbnN0IHJhd1Bvc2l0aW9uID0gdXNlclZlcnRpY2VzLnJhd1Bvc2l0aW9uO1xuICAgIGNvbnN0IHRlbXBWZWMzID0gY2MudjMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhd1Bvc2l0aW9uLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIHRlbXBWZWMzLnNldChyYXdQb3NpdGlvbltpXSwgcmF3UG9zaXRpb25baSArIDFdLCByYXdQb3NpdGlvbltpICsgMl0pO1xuICAgICAgICB2ZXJ0aWNlcy5yYXdQb3NpdGlvbi5wdXNoKHRlbXBWZWMzLmNsb25lKCkpO1xuICAgIH1cbn1cbiJdfQ==