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
exports.MissingClass = exports.MissingClassReporter = void 0;
const _ = __importStar(require("lodash"));
const ps = __importStar(require("path"));
const ObjectWalker = __importStar(require("./object-walker"));
const assetdb = __importStar(require("@cocos/asset-db"));
const missing_reporter_1 = require("./missing-reporter");
const utils_1 = __importDefault(require("../../../base/utils"));
function report(parsingOwner, classId, asset, url) {
    const assetType = missing_reporter_1.MissingReporter.getObjectType(asset);
    const assetName = url && ps.basename(url);
    if (asset instanceof cc.SceneAsset || asset instanceof cc.Prefab) {
        let info;
        let component;
        let node;
        if (parsingOwner instanceof cc.Component) {
            component = parsingOwner;
            node = component.node;
        }
        else if (cc.Node.isNode(parsingOwner)) {
            node = parsingOwner;
        }
        const IN_LOCATION = assetName ? ` in ${assetType} "${assetName}"` : '';
        let detailedClassId = classId;
        let isScript = false;
        if (component) {
            let compName = cc.js.getClassName(component);
            // missing property type
            if (component instanceof cc._MissingScript) {
                isScript = true;
                detailedClassId = compName = component._$erialized.__type__;
            }
            info = `Class "${classId}" used by component "${compName}"${IN_LOCATION} is missing or invalid.`;
        }
        else if (node) {
            // missing component
            isScript = true;
            info = `Script "${classId}" attached to "${node.name}"${IN_LOCATION} is missing or invalid.`;
        }
        else {
            return;
        }
        info += missing_reporter_1.MissingReporter.INFO_DETAILED;
        try {
            let child = node;
            let path = child.name;
            while (child.parent && !(child.parent instanceof cc.Scene)) {
                child = child.parent;
                path = `${child.name}/${path}`;
            }
            info += `Node path: "${path}"\n`;
        }
        catch (error) { }
        if (url) {
            info += `Asset url: "${url}"\n`;
        }
        if (isScript && utils_1.default.UUID.isUUID(detailedClassId)) {
            const scriptUuid = utils_1.default.UUID.decompressUUID(detailedClassId);
            try {
                const scriptInfo = assetdb.queryMissingInfo(scriptUuid.match(/[^@]*/)[0]);
                if (scriptInfo) {
                    info += `Script file: "${scriptInfo.path}"\n`;
                    info += `Script deleted time: "${new Date(scriptInfo.removeTime).toLocaleString()}"\n`;
                }
            }
            catch (error) { }
            info += `Script UUID: "${scriptUuid}"\n`;
            info += `Class ID: "${detailedClassId}"\n`;
        }
        info.slice(0, -1); // remove last '\n'
        console.error(info);
    }
    else {
        // missing CustomAsset ? not yet implemented
    }
}
async function reportByWalker(value, obj, parsedObjects, asset, url, classId) {
    classId = classId || (value._$erialized && value._$erialized.__type__);
    let parsingOwner;
    if (obj instanceof cc.Component || cc.Node.isNode(obj)) {
        parsingOwner = obj;
    }
    else {
        parsingOwner = _.findLast(parsedObjects, (x) => (x instanceof cc.Component || cc.Node.isNode(x)));
    }
    await report(parsingOwner, classId, asset, url);
}
// MISSING CLASS REPORTER
class MissingClassReporter extends missing_reporter_1.MissingReporter {
    report() {
        ObjectWalker.walk(this.root, (obj, key, value, parsedObjects) => {
            if (this.missingObjects.has(value)) {
                reportByWalker(value, obj, parsedObjects, this.root);
            }
        });
    }
    reportByOwner() {
        let rootUrl;
        let info;
        if (this.root instanceof cc.Asset) {
            try {
                // @ts-ignore
                const Manager = globalThis.Manager;
                // @ts-ignore
                if (Manager && Manager.assetManager) {
                    info = Manager.assetManager.queryAssetInfo(this.root._uuid);
                }
                else {
                    // info = pkg.execSync('asset-db', 'queryAssetInfo', this.root._uuid);
                }
            }
            catch (error) {
                console.error(error);
                info = null;
            }
            rootUrl = info ? info.path : null;
        }
        ObjectWalker.walkProperties(this.root, (obj, key, value, parsedObjects) => {
            const props = this.missingOwners.get(obj);
            if (props && (key in props)) {
                const typeId = props[key];
                reportByWalker(value, obj, parsedObjects, this.root, rootUrl, typeId);
            }
        }, {
            dontSkipNull: true,
        });
    }
}
exports.MissingClassReporter = MissingClassReporter;
// 用这个模块来标记找不到脚本的对象
exports.MissingClass = {
    reporter: new MissingClassReporter(),
    classFinder(id, owner, propName) {
        const cls = cc.js.getClassById(id);
        if (cls) {
            return cls;
        }
        else if (id) {
            console.warn(`Missing class: ${id}`);
            exports.MissingClass.hasMissingClass = true;
            exports.MissingClass.reporter.stashByOwner(owner, propName, id);
        }
        return null;
    },
    hasMissingClass: false,
    reportMissingClass(asset) {
        if (!asset._uuid) {
            return;
        }
        if (exports.MissingClass.hasMissingClass) {
            exports.MissingClass.reporter.root = asset;
            exports.MissingClass.reporter.reportByOwner();
            exports.MissingClass.hasMissingClass = false;
        }
    },
    reset() {
        exports.MissingClass.reporter.reset();
    },
};
// @ts-ignore
exports.MissingClass.classFinder.onDereferenced = function (curOwner, curPropName, newOwner, newPropName) {
    const id = exports.MissingClass.reporter.removeStashedByOwner(curOwner, curPropName);
    if (id) {
        exports.MissingClass.reporter.stashByOwner(newOwner, newPropName, id);
    }
};
