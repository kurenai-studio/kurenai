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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2luZy1jbGFzcy1yZXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9taXNzaW5nLXJlcG9ydGVyL21pc3NpbmctY2xhc3MtcmVwb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFYiwwQ0FBNEI7QUFDNUIseUNBQTJCO0FBQzNCLDhEQUFnRDtBQUNoRCx5REFBMkM7QUFFM0MseURBQXFEO0FBQ3JELGdFQUF3QztBQUV4QyxTQUFTLE1BQU0sQ0FBQyxZQUFpQixFQUFFLE9BQVksRUFBRSxLQUFVLEVBQUUsR0FBUTtJQUNqRSxNQUFNLFNBQVMsR0FBRyxrQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2RCxNQUFNLFNBQVMsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUUxQyxJQUFJLEtBQUssWUFBWSxFQUFFLENBQUMsVUFBVSxJQUFJLEtBQUssWUFBWSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0QsSUFBSSxJQUFJLENBQUM7UUFDVCxJQUFJLFNBQVMsQ0FBQztRQUNkLElBQUksSUFBSSxDQUFDO1FBQ1QsSUFBSSxZQUFZLFlBQVksRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3ZDLFNBQVMsR0FBRyxZQUFZLENBQUM7WUFDekIsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDMUIsQ0FBQzthQUFNLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEdBQUcsWUFBWSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sU0FB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RUYsYUFBYTtBQUNiLG9CQUFZLENBQUMsV0FBVyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQWEsRUFBRSxXQUFnQixFQUFFLFFBQWEsRUFBRSxXQUFnQjtJQUNoSCxNQUFNLEVBQUUsR0FBRyxvQkFBWSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDN0UsSUFBSSxFQUFFLEVBQUUsQ0FBQztRQUNMLG9CQUFZLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7QUFDTCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHBzIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgT2JqZWN0V2Fsa2VyIGZyb20gJy4vb2JqZWN0LXdhbGtlcic7XG5pbXBvcnQgKiBhcyBhc3NldGRiIGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5cbmltcG9ydCB7IE1pc3NpbmdSZXBvcnRlciB9IGZyb20gJy4vbWlzc2luZy1yZXBvcnRlcic7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vYmFzZS91dGlscyc7XG5cbmZ1bmN0aW9uIHJlcG9ydChwYXJzaW5nT3duZXI6IGFueSwgY2xhc3NJZDogYW55LCBhc3NldDogYW55LCB1cmw6IGFueSkge1xuICAgIGNvbnN0IGFzc2V0VHlwZSA9IE1pc3NpbmdSZXBvcnRlci5nZXRPYmplY3RUeXBlKGFzc2V0KTtcbiAgICBjb25zdCBhc3NldE5hbWUgPSB1cmwgJiYgcHMuYmFzZW5hbWUodXJsKTtcblxuICAgIGlmIChhc3NldCBpbnN0YW5jZW9mIGNjLlNjZW5lQXNzZXQgfHwgYXNzZXQgaW5zdGFuY2VvZiBjYy5QcmVmYWIpIHtcbiAgICAgICAgbGV0IGluZm87XG4gICAgICAgIGxldCBjb21wb25lbnQ7XG4gICAgICAgIGxldCBub2RlO1xuICAgICAgICBpZiAocGFyc2luZ093bmVyIGluc3RhbmNlb2YgY2MuQ29tcG9uZW50KSB7XG4gICAgICAgICAgICBjb21wb25lbnQgPSBwYXJzaW5nT3duZXI7XG4gICAgICAgICAgICBub2RlID0gY29tcG9uZW50Lm5vZGU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2MuTm9kZS5pc05vZGUocGFyc2luZ093bmVyKSkge1xuICAgICAgICAgICAgbm9kZSA9IHBhcnNpbmdPd25lcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IElOX0xPQ0FUSU9OID0gYXNzZXROYW1lID8gYCBpbiAke2Fzc2V0VHlwZX0gXCIke2Fzc2V0TmFtZX1cImAgOiAnJztcbiAgICAgICAgbGV0IGRldGFpbGVkQ2xhc3NJZCA9IGNsYXNzSWQ7XG4gICAgICAgIGxldCBpc1NjcmlwdCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGxldCBjb21wTmFtZSA9IGNjLmpzLmdldENsYXNzTmFtZShjb21wb25lbnQpO1xuICAgICAgICAgICAgLy8gbWlzc2luZyBwcm9wZXJ0eSB0eXBlXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgY2MuX01pc3NpbmdTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICBpc1NjcmlwdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZGV0YWlsZWRDbGFzc0lkID0gY29tcE5hbWUgPSBjb21wb25lbnQuXyRlcmlhbGl6ZWQuX190eXBlX187XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmZvID0gYENsYXNzIFwiJHtjbGFzc0lkfVwiIHVzZWQgYnkgY29tcG9uZW50IFwiJHtjb21wTmFtZX1cIiR7SU5fTE9DQVRJT059IGlzIG1pc3Npbmcgb3IgaW52YWxpZC5gO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIC8vIG1pc3NpbmcgY29tcG9uZW50XG4gICAgICAgICAgICBpc1NjcmlwdCA9IHRydWU7XG4gICAgICAgICAgICBpbmZvID0gYFNjcmlwdCBcIiR7Y2xhc3NJZH1cIiBhdHRhY2hlZCB0byBcIiR7bm9kZS5uYW1lfVwiJHtJTl9MT0NBVElPTn0gaXMgbWlzc2luZyBvciBpbnZhbGlkLmA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbmZvICs9IE1pc3NpbmdSZXBvcnRlci5JTkZPX0RFVEFJTEVEO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgY2hpbGQgPSBub2RlO1xuICAgICAgICAgICAgbGV0IHBhdGggPSBjaGlsZC5uYW1lO1xuICAgICAgICAgICAgd2hpbGUgKGNoaWxkLnBhcmVudCAmJiAhKGNoaWxkLnBhcmVudCBpbnN0YW5jZW9mIGNjLlNjZW5lKSkge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucGFyZW50O1xuICAgICAgICAgICAgICAgIHBhdGggPSBgJHtjaGlsZC5uYW1lfS8ke3BhdGh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZm8gKz0gYE5vZGUgcGF0aDogXCIke3BhdGh9XCJcXG5gO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG5cbiAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgaW5mbyArPSBgQXNzZXQgdXJsOiBcIiR7dXJsfVwiXFxuYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1NjcmlwdCAmJiBVdGlscy5VVUlELmlzVVVJRChkZXRhaWxlZENsYXNzSWQpKSB7XG4gICAgICAgICAgICBjb25zdCBzY3JpcHRVdWlkID0gVXRpbHMuVVVJRC5kZWNvbXByZXNzVVVJRChkZXRhaWxlZENsYXNzSWQpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRJbmZvID0gYXNzZXRkYi5xdWVyeU1pc3NpbmdJbmZvKHNjcmlwdFV1aWQubWF0Y2goL1teQF0qLykhWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICBpbmZvICs9IGBTY3JpcHQgZmlsZTogXCIke3NjcmlwdEluZm8ucGF0aH1cIlxcbmA7XG4gICAgICAgICAgICAgICAgICAgIGluZm8gKz0gYFNjcmlwdCBkZWxldGVkIHRpbWU6IFwiJHtuZXcgRGF0ZShzY3JpcHRJbmZvLnJlbW92ZVRpbWUpLnRvTG9jYWxlU3RyaW5nKCl9XCJcXG5gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgICAgIGluZm8gKz0gYFNjcmlwdCBVVUlEOiBcIiR7c2NyaXB0VXVpZH1cIlxcbmA7XG4gICAgICAgICAgICBpbmZvICs9IGBDbGFzcyBJRDogXCIke2RldGFpbGVkQ2xhc3NJZH1cIlxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5zbGljZSgwLCAtMSk7IC8vIHJlbW92ZSBsYXN0ICdcXG4nXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoaW5mbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbWlzc2luZyBDdXN0b21Bc3NldCA/IG5vdCB5ZXQgaW1wbGVtZW50ZWRcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcG9ydEJ5V2Fsa2VyKHZhbHVlOiBhbnksIG9iajogYW55LCBwYXJzZWRPYmplY3RzOiBhbnksIGFzc2V0OiBhbnksIHVybD86IGFueSwgY2xhc3NJZD86IGFueSkge1xuICAgIGNsYXNzSWQgPSBjbGFzc0lkIHx8ICh2YWx1ZS5fJGVyaWFsaXplZCAmJiB2YWx1ZS5fJGVyaWFsaXplZC5fX3R5cGVfXyk7XG4gICAgbGV0IHBhcnNpbmdPd25lcjtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgY2MuQ29tcG9uZW50IHx8IGNjLk5vZGUuaXNOb2RlKG9iaikpIHtcbiAgICAgICAgcGFyc2luZ093bmVyID0gb2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnNpbmdPd25lciA9IF8uZmluZExhc3QocGFyc2VkT2JqZWN0cywgKHg6IGFueSkgPT4gKHggaW5zdGFuY2VvZiBjYy5Db21wb25lbnQgfHwgY2MuTm9kZS5pc05vZGUoeCkpKTtcbiAgICB9XG4gICAgYXdhaXQgcmVwb3J0KHBhcnNpbmdPd25lciwgY2xhc3NJZCwgYXNzZXQsIHVybCk7XG59XG5cbi8vIE1JU1NJTkcgQ0xBU1MgUkVQT1JURVJcblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdDbGFzc1JlcG9ydGVyIGV4dGVuZHMgTWlzc2luZ1JlcG9ydGVyIHtcblxuICAgIHJlcG9ydCgpIHtcbiAgICAgICAgT2JqZWN0V2Fsa2VyLndhbGsodGhpcy5yb290LCAob2JqOiBhbnksIGtleTogYW55LCB2YWx1ZTogYW55LCBwYXJzZWRPYmplY3RzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1pc3NpbmdPYmplY3RzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXBvcnRCeVdhbGtlcih2YWx1ZSwgb2JqLCBwYXJzZWRPYmplY3RzLCB0aGlzLnJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXBvcnRCeU93bmVyKCkge1xuICAgICAgICBsZXQgcm9vdFVybDogYW55O1xuICAgICAgICBsZXQgaW5mbzogYW55O1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgY2MuQXNzZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IE1hbmFnZXI6IElBc3NldFdvcmtlck1hbmFnZXIgPSBnbG9iYWxUaGlzLk1hbmFnZXI7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGlmIChNYW5hZ2VyICYmIE1hbmFnZXIuYXNzZXRNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8gPSBNYW5hZ2VyLmFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh0aGlzLnJvb3QuX3V1aWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluZm8gPSBwa2cuZXhlY1N5bmMoJ2Fzc2V0LWRiJywgJ3F1ZXJ5QXNzZXRJbmZvJywgdGhpcy5yb290Ll91dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIGluZm8gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm9vdFVybCA9IGluZm8gPyBpbmZvLnBhdGggOiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0V2Fsa2VyLndhbGtQcm9wZXJ0aWVzKHRoaXMucm9vdCwgKG9iajogYW55LCBrZXk6IGFueSwgdmFsdWU6IGFueSwgcGFyc2VkT2JqZWN0czogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMubWlzc2luZ093bmVycy5nZXQob2JqKTtcbiAgICAgICAgICAgIGlmIChwcm9wcyAmJiAoa2V5IGluIHByb3BzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVJZCA9IHByb3BzW2tleV07XG4gICAgICAgICAgICAgICAgcmVwb3J0QnlXYWxrZXIodmFsdWUsIG9iaiwgcGFyc2VkT2JqZWN0cywgdGhpcy5yb290LCByb290VXJsLCB0eXBlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBkb250U2tpcE51bGw6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLy8g55So6L+Z5Liq5qih5Z2X5p2l5qCH6K6w5om+5LiN5Yiw6ISa5pys55qE5a+56LGhXG5leHBvcnQgY29uc3QgTWlzc2luZ0NsYXNzID0ge1xuICAgIHJlcG9ydGVyOiBuZXcgTWlzc2luZ0NsYXNzUmVwb3J0ZXIoKSxcbiAgICBjbGFzc0ZpbmRlcihpZDogYW55LCBvd25lcj86IGFueSwgcHJvcE5hbWU/OiBhbnkpIHtcbiAgICAgICAgY29uc3QgY2xzID0gY2MuanMuZ2V0Q2xhc3NCeUlkKGlkKTtcbiAgICAgICAgaWYgKGNscykge1xuICAgICAgICAgICAgcmV0dXJuIGNscztcbiAgICAgICAgfSBlbHNlIGlmIChpZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBNaXNzaW5nIGNsYXNzOiAke2lkfWApO1xuICAgICAgICAgICAgTWlzc2luZ0NsYXNzLmhhc01pc3NpbmdDbGFzcyA9IHRydWU7XG4gICAgICAgICAgICBNaXNzaW5nQ2xhc3MucmVwb3J0ZXIuc3Rhc2hCeU93bmVyKG93bmVyLCBwcm9wTmFtZSwgaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgaGFzTWlzc2luZ0NsYXNzOiBmYWxzZSxcbiAgICByZXBvcnRNaXNzaW5nQ2xhc3MoYXNzZXQ6IGFueSkge1xuICAgICAgICBpZiAoIWFzc2V0Ll91dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1pc3NpbmdDbGFzcy5oYXNNaXNzaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgIE1pc3NpbmdDbGFzcy5yZXBvcnRlci5yb290ID0gYXNzZXQ7XG4gICAgICAgICAgICBNaXNzaW5nQ2xhc3MucmVwb3J0ZXIucmVwb3J0QnlPd25lcigpO1xuICAgICAgICAgICAgTWlzc2luZ0NsYXNzLmhhc01pc3NpbmdDbGFzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZXNldCgpIHtcbiAgICAgICAgTWlzc2luZ0NsYXNzLnJlcG9ydGVyLnJlc2V0KCk7XG4gICAgfSxcbn07XG5cbi8vIEB0cy1pZ25vcmVcbk1pc3NpbmdDbGFzcy5jbGFzc0ZpbmRlci5vbkRlcmVmZXJlbmNlZCA9IGZ1bmN0aW9uIChjdXJPd25lcjogYW55LCBjdXJQcm9wTmFtZTogYW55LCBuZXdPd25lcjogYW55LCBuZXdQcm9wTmFtZTogYW55KSB7XG4gICAgY29uc3QgaWQgPSBNaXNzaW5nQ2xhc3MucmVwb3J0ZXIucmVtb3ZlU3Rhc2hlZEJ5T3duZXIoY3VyT3duZXIsIGN1clByb3BOYW1lKTtcbiAgICBpZiAoaWQpIHtcbiAgICAgICAgTWlzc2luZ0NsYXNzLnJlcG9ydGVyLnN0YXNoQnlPd25lcihuZXdPd25lciwgbmV3UHJvcE5hbWUsIGlkKTtcbiAgICB9XG59O1xuIl19