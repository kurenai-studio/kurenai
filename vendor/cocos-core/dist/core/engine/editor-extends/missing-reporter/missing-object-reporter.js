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
exports.MissingObjectReporter = void 0;
const missing_reporter_1 = require("./missing-reporter");
const findLast_1 = __importDefault(require("lodash/findLast"));
const ps = __importStar(require("path"));
const ObjectWalker = __importStar(require("./object-walker"));
const assetdb = __importStar(require("@cocos/asset-db"));
class MissingObjectReporter extends missing_reporter_1.MissingReporter {
    doReport(obj, value, parsedObjects, rootUrl, inRootBriefLocation) {
        let parsingOwner;
        if (obj instanceof cc.Component || obj instanceof cc.Asset) {
            parsingOwner = obj;
        }
        else {
            parsingOwner = (0, findLast_1.default)(parsedObjects, (x) => (x instanceof cc.Component || x instanceof cc.Asset));
        }
        let byOwner = '';
        if (parsingOwner instanceof cc.Component) {
            const ownerType = missing_reporter_1.MissingReporter.getObjectType(parsingOwner);
            byOwner = ` by ${ownerType} "${cc.js.getClassName(parsingOwner)}"`;
        }
        else {
            parsingOwner = (0, findLast_1.default)(parsedObjects, (x) => (x instanceof cc.Node));
            if (parsingOwner) {
                byOwner = ` by node "${parsingOwner.name}"`;
            }
        }
        let info;
        const valueIsUrl = typeof value === 'string';
        if (valueIsUrl) {
            info = `Asset "${value}" used${byOwner}${inRootBriefLocation} is missing.`;
        }
        else {
            let targetType = cc.js.getClassName(value);
            if (targetType.startsWith('cc.')) {
                targetType = targetType.slice(3);
            }
            if (value instanceof cc.Asset) {
                // missing asset
                info = `The ${targetType} used${byOwner}${inRootBriefLocation} is missing.`;
            }
            else {
                // missing object
                info = `The ${targetType} referenced${byOwner}${inRootBriefLocation} is invalid.`;
            }
        }
        info += missing_reporter_1.MissingReporter.INFO_DETAILED;
        if (parsingOwner instanceof cc.Component) {
            parsingOwner = parsingOwner.node;
        }
        try {
            if (parsingOwner instanceof cc.Node) {
                let node = parsingOwner;
                let path = node.name;
                while (node.parent && !(node.parent instanceof cc.Scene)) {
                    node = node.parent;
                    path = `${node.name}/${path}`;
                }
                info += `Node path: "${path}"\n`;
            }
        }
        catch (error) { }
        if (rootUrl) {
            info += `Asset url: "${rootUrl}"\n`;
        }
        if (value instanceof cc.Asset && value._uuid) {
            try {
                const assetInfo = assetdb.queryMissingInfo(value._uuid.match(/[^@]*/)[0]);
                if (assetInfo) {
                    info += `Asset file: "${assetInfo.path}"\n`;
                    info += `Asset deleted time: "${new Date(assetInfo.removeTime).toLocaleString()}"\n`;
                }
            }
            catch (error) { }
            // info = pkg.execSync('asset-db', 'queryAssetInfo', this.root._uuid);
            info += `Missing uuid: "${value._uuid}"\n`;
        }
        info.slice(0, -1); // remove last '\n'
        // 因为报错很多，用户会觉得是编辑器不稳定，所以暂时隐藏错误
        if (console[this.outputLevel]) {
            console[this.outputLevel](info);
        }
        else {
            console.warn(info);
        }
    }
    report() {
        let rootUrl;
        let info;
        if (this.root instanceof cc.Asset) {
            try {
                // @ts-ignore
                const Manager = globalThis.Manager;
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
        const rootType = missing_reporter_1.MissingReporter.getObjectType(this.root);
        const inRootBriefLocation = rootUrl ? ` in ${rootType} "${ps.basename(rootUrl)}"` : '';
        ObjectWalker.walk(this.root, (obj, key, value, parsedObjects, parsedKeys) => {
            if (this.missingObjects.has(value)) {
                this.doReport(obj, value, parsedObjects, rootUrl, inRootBriefLocation);
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
                if (Manager && Manager.assetDBManager.ready) {
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
        const rootType = missing_reporter_1.MissingReporter.getObjectType(this.root);
        const inRootBriefLocation = rootUrl ? ` in ${rootType} "${ps.basename(rootUrl)}"` : '';
        ObjectWalker.walkProperties(this.root, (obj, key, actualValue, parsedObjects) => {
            const props = this.missingOwners.get(obj);
            if (props && (key in props)) {
                const reportValue = props[key];
                this.doReport(obj, reportValue || actualValue, parsedObjects, rootUrl, inRootBriefLocation);
            }
        }, {
            dontSkipNull: true,
        });
    }
}
exports.MissingObjectReporter = MissingObjectReporter;
