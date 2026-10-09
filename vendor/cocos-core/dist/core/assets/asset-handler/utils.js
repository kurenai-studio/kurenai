'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateStep = void 0;
exports.i18nTranslate = i18nTranslate;
exports.getDependUUIDList = getDependUUIDList;
exports.getDependList = getDependList;
exports.deserialize = deserialize;
exports.getDeserializeResult = getDeserializeResult;
exports.linkToAssetTarget = linkToAssetTarget;
exports.clamp = clamp;
exports.getPixiel = getPixiel;
exports.getTrimRect = getTrimRect;
exports.removeNull = removeNull;
exports.openCode = openCode;
exports.mergeMeta = mergeMeta;
exports.getMediaDuration = getMediaDuration;
const i18n_1 = __importDefault(require("../../base/i18n"));
const utils_1 = __importDefault(require("../../base/utils"));
const missing_class_reporter_1 = require("../../engine/editor-extends/missing-reporter/missing-class-reporter");
function i18nTranslate(key, ...args) {
    let translated = i18n_1.default.t(key);
    if (typeof args[0] === 'object') {
        const paramArgument = args[0];
        const matches = translated.match(/{(\w+)}/g);
        if (matches) {
            for (const match of matches) {
                const name = match.substr(1, match.length - 2);
                translated = translated.replace(match, paramArgument[name]);
            }
        }
    }
    return translated;
}
function getDependUUIDList(content, uuid) {
    if (typeof content === 'string') {
        // 注意：此方法无法匹配出脚本引用的 uuid
        let arr = content.match(/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}(@[a-z0-9]+){0,}/g);
        if (arr) {
            // https://stackoverflow.com/questions/32813720/nodejs-profiling-parent-in-sliced-string
            arr = JSON.parse(JSON.stringify(Array.from(new Set(arr)).filter((id) => id !== uuid)));
        }
        // const arr = content.match(/"__uuid__":( )?"[^"]+/g);
        return arr || [];
    }
    // console.warn('Unable to extract dependencies properly');
    return getDeserializeResult(content).uuids;
}
function getDependList(content) {
    if (typeof content === 'string') {
        // TODO 此方式依赖了目前的字符串格式，有风险，但由于目前脚本加载无法在导入之前完成，无法正常反序列化
        const uuids = getDependUUIDList(content);
        const classTypes = content.match(/"__type__":\s*"([0-9a-zA-Z+/]{22,23})"/g);
        const dependScriptUuids = classTypes ? classTypes.toString().match(/[0-9a-zA-Z+/]{22,23}/g) || [] : [];
        // https://stackoverflow.com/questions/32813720/nodejs-profiling-parent-in-sliced-string
        return {
            uuids,
            dependScriptUuids: Array.from(new Set(dependScriptUuids.map((classId) => utils_1.default.UUID.decompressUUID(classId)))),
        };
    }
    const info = getDeserializeResult(content);
    return {
        uuids: info.uuids,
        dependScriptUuids: info.dependScriptUuids,
    };
}
function deserialize(json) {
    return getDeserializeResult(json).instance;
}
function getDeserializeResult(json) {
    const deserializeDetails = new cc.deserialize.Details();
    deserializeDetails.reset();
    missing_class_reporter_1.MissingClass.reset();
    missing_class_reporter_1.MissingClass.hasMissingClass = false;
    const dependScriptID = new Set();
    function classFinder(classId) {
        if (utils_1.default.UUID.isUUID(classId)) {
            dependScriptID.add(utils_1.default.UUID.decompressUUID(classId));
        }
        return missing_class_reporter_1.MissingClass.classFinder(classId);
    }
    const deserializedAsset = cc.deserialize(json, deserializeDetails, {
        classFinder,
    });
    deserializeDetails.assignAssetsBy(function (uuid, options) {
        return EditorExtends.serialize.asAsset(uuid);
    });
    return {
        instance: deserializedAsset,
        uuids: deserializeDetails.uuidList,
        dependScriptUuids: Array.from(dependScriptID),
        classFinder: missing_class_reporter_1.MissingClass.classFinder,
    };
}
function linkToAssetTarget(uuid) {
    return `{asset(${uuid})}`;
}
/**
 * 判断 val 的值是否超出
 * @param val
 * @param min
 * @param max
 */
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}
/**
 * 获取一个像素的颜色值
 * @param data
 * @param x
 * @param y
 * @param imgWidth
 */
function getPixiel(buffer, x, y, imgWidth) {
    const idx = x * 4 + y * imgWidth * 4;
    return {
        r: buffer[idx],
        g: buffer[idx + 1],
        b: buffer[idx + 2],
        a: buffer[idx + 3],
    };
}
/**
 * 获取非透明像素的矩形大小
 * @param data
 * @param w
 * @param h
 * @param trimThreshold
 */
function getTrimRect(buffer, w, h, trimThreshold) {
    // A B C
    // D x F
    // G H I
    const threshold = trimThreshold;
    let tx = w;
    let ty = h;
    let tw = 0;
    let th = 0;
    let x;
    let y;
    // trim A B C
    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            if (getPixiel(buffer, x, y, w).a >= threshold) {
                ty = y;
                y = h;
                break;
            }
        }
    }
    // trim G H I
    for (y = h - 1; y >= ty; y--) {
        for (x = 0; x < w; x++) {
            if (getPixiel(buffer, x, y, w).a >= threshold) {
                th = y - ty + 1;
                y = 0;
                break;
            }
        }
    }
    // trim D
    for (x = 0; x < w; x++) {
        for (y = ty; y < ty + th; y++) {
            if (getPixiel(buffer, x, y, w).a >= threshold) {
                tx = x;
                x = w;
                break;
            }
        }
    }
    // trim F
    for (x = w - 1; x >= tx; x--) {
        for (y = ty; y < ty + th; y++) {
            if (getPixiel(buffer, x, y, w).a >= threshold) {
                tw = x - tx + 1;
                x = 0;
                break;
            }
        }
    }
    return [tx, ty, tw, th];
}
function removeNull(sceneData, assetUuid) {
    let hasNull = false;
    for (const nodeData of sceneData) {
        if (nodeData._children && nodeData._children.length) {
            for (let i = 0; i < nodeData._children.length; i++) {
                const el = nodeData._children[i];
                if (!el) {
                    nodeData._children.splice(i, 1);
                    hasNull = true;
                    console.warn(i18n_1.default.t('importer.invalid_node_data', {
                        assetUuid,
                        type: i18n_1.default.t('importer.node'),
                        value: String(el),
                    }));
                    i--;
                    continue;
                }
            }
        }
        if (nodeData._components) {
            for (let i = 0; i < nodeData._components.length; i++) {
                const el = nodeData._components[i];
                if (!el) {
                    nodeData._components.splice(i, 1);
                    console.warn(i18n_1.default.t('importer.invalid_node_data', {
                        assetUuid,
                        type: i18n_1.default.t('importer.component'),
                        value: String(el),
                    }));
                    hasNull = true;
                    i--;
                    continue;
                }
            }
        }
    }
    return hasNull;
}
async function findVsCode() {
    const appPath = '';
    // TODO
    return appPath;
}
class MigrateStep {
    resolveQueue = [];
    hold() {
        return new Promise((resolve) => {
            this.resolveQueue.push(resolve);
            if (this.resolveQueue.length === 1) {
                resolve();
                // @ts-ignore
                resolve.hasResolve = true;
            }
        });
    }
    step() {
        const resolve = this.resolveQueue.shift();
        resolve && resolve();
        if (resolve && resolve.hasResolve) {
            this.step();
        }
    }
}
exports.MigrateStep = MigrateStep;
async function openCode(asset) {
    return false;
}
/**
 * 将两个 meta 合并
 * 因为 meta 的可能被其他 asset 直接引用，所以不能直接覆盖
 * subMetas 里的数据是另一个 asset 的 meta，所以也需要拷贝
 * @param a
 * @param b
 */
function mergeMeta(a, b) {
    Object.keys(b).map((key) => {
        if (key === 'subMetas') {
            Object.keys(b.subMetas).forEach((id) => {
                if (!a.subMetas[id]) {
                    a.subMetas[id] = {};
                }
                mergeMeta(a.subMetas[id], b.subMetas[id]);
            });
            if (a.subMetas) {
                Object.keys(a.subMetas).forEach((id) => {
                    if (!(id in b.subMetas)) {
                        delete a.subMetas[id];
                    }
                });
            }
        }
        else {
            // @ts-ignore
            a[key] = b[key];
        }
    });
}
async function getMediaDuration(filePath) {
    try {
        // kurenai: pure JS instead of the ffprobe binary, which only shipped for darwin-arm64.
        return require('./media-duration').mediaDuration(filePath);
    }
    catch (error) {
        throw new Error(`获取媒体时长失败: ${error.message}`);
    }
}
