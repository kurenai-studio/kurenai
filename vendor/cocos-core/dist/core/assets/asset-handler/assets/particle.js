'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleHandler = void 0;
const image_utils_1 = require("./utils/image-utils");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const BlendFactor = cc_1.gfx.BlendFactor;
const { PositionType, EmitterMode } = cc_1.ParticleSystem2D;
const plist = require('plist');
const defaultParticlesUseData = {
    totalParticles: 150,
    life: 1,
    lifeVar: 0,
    emissionRate: 10,
    duration: -1,
    srcBlendFactor: BlendFactor.SRC_ALPHA,
    dstBlendFactor: BlendFactor.ONE_MINUS_CONSTANT_ALPHA,
    startColor: new cc_1.Color(255, 255, 255, 255),
    startColorVar: new cc_1.Color(0, 0, 0, 0),
    endColor: new cc_1.Color(255, 255, 255, 0),
    endColorVar: new cc_1.Color(0, 0, 0, 0),
    startSize: 50,
    startSizeVar: 0,
    endSize: 0,
    endSizeVar: 0,
    positionType: PositionType.FREE,
    sourcePos: new cc_1.Vec2(0, 0),
    posVar: new cc_1.Vec2(0, 0),
    angle: 90,
    angleVar: 20,
    startSpin: 0,
    startSpinVar: 0,
    endSpin: 0,
    endSpinVar: 0,
    emitterMode: EmitterMode.GRAVITY,
    gravity: new cc_1.Vec2(0, 0),
    speed: 180,
    speedVar: 50,
    radialAccel: 80,
    radialAccelVar: 0,
    tangentialAccel: 0,
    tangentialAccelVar: 0,
    rotationIsDir: false,
    startRadius: 0,
    startRadiusVar: 0,
    endRadius: 0,
    endRadiusVar: 0,
    rotatePerS: 0,
    rotatePerSVar: 0,
    spriteFrameUuid: '',
};
function getBlendFactor2DTo3D(value) {
    switch (value) {
        case 0: // ZERO
            return BlendFactor.ZERO;
        case 1: // ONE
            return BlendFactor.ONE;
        case 0x302: // SRC_ALPHA
            return BlendFactor.SRC_ALPHA;
        case 0x304: // DST_ALPHA
            return BlendFactor.DST_ALPHA;
        case 0x303: // ONE_MINUS_SRC_ALPHA
            return BlendFactor.ONE_MINUS_SRC_ALPHA;
        case 0x305: // ONE_MINUS_DST_ALPHA
            return BlendFactor.ONE_MINUS_DST_ALPHA;
        case 0x300: // SRC_COLOR
            return BlendFactor.SRC_COLOR;
        case 0x306: // DST_COLOR
            return BlendFactor.DST_COLOR;
        case 0x301: // ONE_MINUS_SRC_COLOR
            return BlendFactor.ONE_MINUS_SRC_COLOR;
        case 0x307: // ONE_MINUS_DST_COLOR
            return BlendFactor.ONE_MINUS_DST_COLOR;
    }
    return value;
}
exports.ParticleHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'particle',
    // 引擎内对应的类型
    assetType: 'cc.ParticleAsset',
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        try {
            const data = plist.parse(await (0, fs_extra_1.readFile)(asset.source, 'utf8'));
            return typeof data.maxParticles !== 'undefined';
        }
        catch (e) {
            return false;
        }
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.2',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否更新的 boolean
         * 如果返回 true，则会更新依赖这个资源的所有资源
         * @param asset
         */
        async import(asset) {
            const userData = asset.userData;
            // @ts-ignore
            Object.keys(defaultParticlesUseData).forEach((key) => {
                if (!(key in userData)) {
                    // @ts-ignore
                    userData[key] = defaultParticlesUseData[key];
                }
            });
            const ext = (0, path_1.extname)(asset.source);
            // 如果当前资源没有导入，则开始导入当前资源
            if (!(await asset.existsInLibrary('.json')) && asset._assetDB) {
                // 读取 plist 的配置信息
                const data = plist.parse(await (0, fs_extra_1.readFile)(asset.source, 'utf8'));
                await syncParticleData(asset);
                const particle = createParticle(asset);
                if (data.blendFuncSource) {
                    data.blendFuncSource = getBlendFactor2DTo3D(data.blendFuncSource);
                }
                if (data.blendFuncDestination) {
                    data.blendFuncDestination = getBlendFactor2DTo3D(data.blendFuncDestination);
                }
                if (data.textureImageData) {
                    delete data.textureFileName;
                    delete data.spriteFrameUuid;
                }
                else if (data.spriteFrameUuid) {
                    if (!data.spriteFrameUuid.endsWith('@f9941')) {
                        data.spriteFrameUuid = data.spriteFrameUuid + '@f9941';
                    }
                    asset.depend(data.spriteFrameUuid);
                    userData.spriteFrameUuid = data.spriteFrameUuid;
                    particle.spriteFrame = EditorExtends.serialize.asAsset(data.spriteFrameUuid, cc_1.SpriteFrame);
                    delete data.textureFileName;
                    delete data.textureImageData;
                }
                else if (data.textureFileName) {
                    // 如果 plist 内指定了 texture file，则找到这张图片
                    const textureBaseName = (0, path_1.basename)(data.textureFileName);
                    const texturePath = (0, path_1.join)((0, path_1.dirname)(asset.source), textureBaseName);
                    asset.depend(texturePath);
                    const uuid = asset._assetDB.pathToUuid(texturePath);
                    if ((0, fs_extra_1.existsSync)(texturePath)) {
                        if (uuid) {
                            const textureAsset = asset._assetDB.getAsset(uuid);
                            await (0, image_utils_1.changeImageDefaultType)(textureAsset, 'sprite-frame');
                            const spriteFrameUuid = uuid + '@f9941';
                            particle.spriteFrame = EditorExtends.serialize.asAsset(spriteFrameUuid, cc_1.SpriteFrame);
                            userData.spriteFrameUuid = spriteFrameUuid;
                            data.spriteFrameUuid = spriteFrameUuid;
                            delete data.textureFileName;
                            delete data.textureImageData;
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        console.error(`Particle import failed: Unable to find file Texture, the path: ${texturePath}`);
                        return false;
                    }
                }
                const source = plist.build(data);
                await asset.saveToLibrary(ext, source);
                const serializeJSON = EditorExtends.serialize(particle);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
            }
            return true;
        },
    },
};
exports.default = exports.ParticleHandler;
function createParticle(asset) {
    const particle = new cc.ParticleAsset();
    particle.name = asset.basename;
    particle._setRawAsset(asset.extname);
    return particle;
}
async function syncParticleData(asset) {
    const userData = asset.userData;
    const dict = plist.parse(await (0, fs_extra_1.readFile)(asset.source, 'utf8'));
    userData.totalParticles = parseInt(dict['maxParticles'] || 0);
    userData.life = parseFloat(dict['particleLifespan'] || 0);
    userData.lifeVar = parseFloat(dict['particleLifespanVariance'] || 0);
    userData.emissionRate = dict['emissionRate'] || Math.min(userData.totalParticles / userData.life, Number.MAX_VALUE);
    userData.duration = parseFloat(dict['duration'] || 0);
    userData.srcBlendFactor = parseInt(dict['blendFuncSource'] || BlendFactor.SRC_ALPHA);
    userData.dstBlendFactor = parseInt(dict['blendFuncDestination'] || BlendFactor.ONE_MINUS_SRC_ALPHA);
    const startColor = userData.startColor;
    startColor.r = parseFloat(dict['startColorRed'] || 0) * 255;
    startColor.g = parseFloat(dict['startColorGreen'] || 0) * 255;
    startColor.b = parseFloat(dict['startColorBlue'] || 0) * 255;
    startColor.a = parseFloat(dict['startColorAlpha'] || 0) * 255;
    const startColorVar = userData.startColorVar;
    startColorVar.r = parseFloat(dict['startColorVarianceRed'] || 0) * 255;
    startColorVar.g = parseFloat(dict['startColorVarianceGreen'] || 0) * 255;
    startColorVar.b = parseFloat(dict['startColorVarianceBlue'] || 0) * 255;
    startColorVar.a = parseFloat(dict['startColorVarianceAlpha'] || 0) * 255;
    const endColor = userData.endColor;
    endColor.r = parseFloat(dict['finishColorRed'] || 0) * 255;
    endColor.g = parseFloat(dict['finishColorGreen'] || 0) * 255;
    endColor.b = parseFloat(dict['finishColorBlue'] || 0) * 255;
    endColor.a = parseFloat(dict['finishColorAlpha'] || 0) * 255;
    const endColorVar = userData.endColorVar;
    endColorVar.r = parseFloat(dict['finishColorVarianceRed'] || 0) * 255;
    endColorVar.g = parseFloat(dict['finishColorVarianceGreen'] || 0) * 255;
    endColorVar.b = parseFloat(dict['finishColorVarianceBlue'] || 0) * 255;
    endColorVar.a = parseFloat(dict['finishColorVarianceAlpha'] || 0) * 255;
    // particle size
    userData.startSize = parseFloat(dict['startParticleSize'] || 0);
    userData.startSizeVar = parseFloat(dict['startParticleSizeVariance'] || 0);
    userData.endSize = parseFloat(dict['finishParticleSize'] || 0);
    userData.endSizeVar = parseFloat(dict['finishParticleSizeVariance'] || 0);
    // position
    // Make empty positionType value and old version compatible
    userData.positionType = parseFloat(dict['positionType'] !== undefined ? dict['positionType'] : 0);
    userData.sourcePos = new cc_1.Vec2(0, 0);
    const x = parseFloat(dict['sourcePositionVariancex'] || 0);
    const y = parseFloat(dict['sourcePositionVariancey'] || 0);
    userData.posVar = new cc_1.Vec2(x, y);
    // angle
    userData.angle = parseFloat(dict['angle'] || 0);
    userData.angleVar = parseFloat(dict['angleVariance'] || 0);
    // Spinning
    userData.startSpin = parseFloat(dict['rotationStart'] || 0);
    userData.startSpinVar = parseFloat(dict['rotationStartVariance'] || 0);
    userData.endSpin = parseFloat(dict['rotationEnd'] || 0);
    userData.endSpinVar = parseFloat(dict['rotationEndVariance'] || 0);
    userData.emitterMode = parseInt(dict['emitterType'] || 0);
    // Mode A: Gravity + tangential accel + radial accel
    if (userData.emitterMode === EmitterMode.GRAVITY) {
        // gravity
        const gravityx = parseFloat(dict['gravityx'] || 0);
        const gravityy = parseFloat(dict['gravityy'] || 0);
        userData.gravity = new cc_1.Vec2(gravityx, gravityy);
        // speed
        userData.speed = parseFloat(dict['speed'] || 0);
        userData.speedVar = parseFloat(dict['speedVariance'] || 0);
        // radial acceleration
        userData.radialAccel = parseFloat(dict['radialAcceleration'] || 0);
        userData.radialAccelVar = parseFloat(dict['radialAccelVariance'] || 0);
        // tangential acceleration
        userData.tangentialAccel = parseFloat(dict['tangentialAcceleration'] || 0);
        userData.tangentialAccelVar = parseFloat(dict['tangentialAccelVariance'] || 0);
        // rotation is dir
        let locRotationIsDir = dict['rotationIsDir'] || '';
        if (locRotationIsDir !== null) {
            locRotationIsDir = locRotationIsDir.toString().toLowerCase();
            userData.rotationIsDir = locRotationIsDir === 'true' || locRotationIsDir === '1';
        }
        else {
            userData.rotationIsDir = false;
        }
    }
    else if (userData.emitterMode === EmitterMode.RADIUS) {
        // or Mode B: radius movement
        userData.startRadius = parseFloat(dict['maxRadius'] || 0);
        userData.startRadiusVar = parseFloat(dict['maxRadiusVariance'] || 0);
        userData.endRadius = parseFloat(dict['minRadius'] || 0);
        userData.endRadiusVar = parseFloat(dict['minRadiusVariance'] || 0);
        userData.rotatePerS = parseFloat(dict['rotatePerSecond'] || 0);
        userData.rotatePerSVar = parseFloat(dict['rotatePerSecondVariance'] || 0);
    }
}
