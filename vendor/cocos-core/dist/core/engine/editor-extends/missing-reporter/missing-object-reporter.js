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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2luZy1vYmplY3QtcmVwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvbWlzc2luZy1yZXBvcnRlci9taXNzaW5nLW9iamVjdC1yZXBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUViLHlEQUFxRDtBQUNyRCwrREFBdUM7QUFDdkMseUNBQTJCO0FBQzNCLDhEQUFnRDtBQUNoRCx5REFBMkM7QUFFM0MsTUFBYSxxQkFBc0IsU0FBUSxrQ0FBZTtJQUV0RCxRQUFRLENBQUMsR0FBUSxFQUFFLEtBQVUsRUFBRSxhQUFrQixFQUFFLE9BQVksRUFBRSxtQkFBd0I7UUFDckYsSUFBSSxZQUFZLENBQUM7UUFDakIsSUFBSSxHQUFHLFlBQVksRUFBRSxDQUFDLFNBQVMsSUFBSSxHQUFHLFlBQVksRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pELFlBQVksR0FBRyxHQUFHLENBQUM7UUFDdkIsQ0FBQzthQUFNLENBQUM7WUFDSixZQUFZLEdBQUcsSUFBQSxrQkFBUSxFQUFDLGFBQWEsRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDLFNBQVMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQztRQUVELElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLFlBQVksWUFBWSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDdkMsTUFBTSxTQUFTLEdBQUcsa0NBQWUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUQsT0FBTyxHQUFHLE9BQU8sU0FBUyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FB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S0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3RDLENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxrQ0FBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRXZGLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQVEsRUFBRSxHQUFRLEVBQUUsV0FBZ0IsRUFBRSxhQUFrQixFQUFFLEVBQUU7WUFDaEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxXQUFXLElBQUksV0FBVyxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNoRyxDQUFDO1FBQ0wsQ0FBQyxFQUFFO1lBQ0MsWUFBWSxFQUFFLElBQUk7U0FDckIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBM0lELHNEQTJJQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgTWlzc2luZ1JlcG9ydGVyIH0gZnJvbSAnLi9taXNzaW5nLXJlcG9ydGVyJztcbmltcG9ydCBmaW5kTGFzdCBmcm9tICdsb2Rhc2gvZmluZExhc3QnO1xuaW1wb3J0ICogYXMgcHMgZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBPYmplY3RXYWxrZXIgZnJvbSAnLi9vYmplY3Qtd2Fsa2VyJztcbmltcG9ydCAqIGFzIGFzc2V0ZGIgZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdPYmplY3RSZXBvcnRlciBleHRlbmRzIE1pc3NpbmdSZXBvcnRlciB7XG5cbiAgICBkb1JlcG9ydChvYmo6IGFueSwgdmFsdWU6IGFueSwgcGFyc2VkT2JqZWN0czogYW55LCByb290VXJsOiBhbnksIGluUm9vdEJyaWVmTG9jYXRpb246IGFueSkge1xuICAgICAgICBsZXQgcGFyc2luZ093bmVyO1xuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgY2MuQ29tcG9uZW50IHx8IG9iaiBpbnN0YW5jZW9mIGNjLkFzc2V0KSB7XG4gICAgICAgICAgICBwYXJzaW5nT3duZXIgPSBvYmo7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzaW5nT3duZXIgPSBmaW5kTGFzdChwYXJzZWRPYmplY3RzLCAoeDogYW55KSA9PiAoeCBpbnN0YW5jZW9mIGNjLkNvbXBvbmVudCB8fCB4IGluc3RhbmNlb2YgY2MuQXNzZXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBieU93bmVyID0gJyc7XG4gICAgICAgIGlmIChwYXJzaW5nT3duZXIgaW5zdGFuY2VvZiBjYy5Db21wb25lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IG93bmVyVHlwZSA9IE1pc3NpbmdSZXBvcnRlci5nZXRPYmplY3RUeXBlKHBhcnNpbmdPd25lcik7XG4gICAgICAgICAgICBieU93bmVyID0gYCBieSAke293bmVyVHlwZX0gXCIke2NjLmpzLmdldENsYXNzTmFtZShwYXJzaW5nT3duZXIpfVwiYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNpbmdPd25lciA9IGZpbmRMYXN0KHBhcnNlZE9iamVjdHMsICh4OiBhbnkpID0+ICh4IGluc3RhbmNlb2YgY2MuTm9kZSkpO1xuICAgICAgICAgICAgaWYgKHBhcnNpbmdPd25lcikge1xuICAgICAgICAgICAgICAgIGJ5T3duZXIgPSBgIGJ5IG5vZGUgXCIke3BhcnNpbmdPd25lci5uYW1lfVwiYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmZvO1xuICAgICAgICBjb25zdCB2YWx1ZUlzVXJsID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbiAgICAgICAgaWYgKHZhbHVlSXNVcmwpIHtcbiAgICAgICAgICAgIGluZm8gPSBgQXNzZXQgXCIke3ZhbHVlfVwiIHVzZWQke2J5T3duZXJ9JHtpblJvb3RCcmllZkxvY2F0aW9ufSBpcyBtaXNzaW5nLmA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0VHlwZSA9IGNjLmpzLmdldENsYXNzTmFtZSh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0VHlwZS5zdGFydHNXaXRoKCdjYy4nKSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFR5cGUgPSB0YXJnZXRUeXBlLnNsaWNlKDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgY2MuQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBtaXNzaW5nIGFzc2V0XG4gICAgICAgICAgICAgICAgaW5mbyA9IGBUaGUgJHt0YXJnZXRUeXBlfSB1c2VkJHtieU93bmVyfSR7aW5Sb290QnJpZWZMb2NhdGlvbn0gaXMgbWlzc2luZy5gO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtaXNzaW5nIG9iamVjdFxuICAgICAgICAgICAgICAgIGluZm8gPSBgVGhlICR7dGFyZ2V0VHlwZX0gcmVmZXJlbmNlZCR7YnlPd25lcn0ke2luUm9vdEJyaWVmTG9jYXRpb259IGlzIGludmFsaWQuYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGluZm8gKz0gTWlzc2luZ1JlcG9ydGVyLklORk9fREVUQUlMRUQ7XG4gICAgICAgIGlmIChwYXJzaW5nT3duZXIgaW5zdGFuY2VvZiBjYy5Db21wb25lbnQpIHtcbiAgICAgICAgICAgIHBhcnNpbmdPd25lciA9IHBhcnNpbmdPd25lci5ub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwYXJzaW5nT3duZXIgaW5zdGFuY2VvZiBjYy5Ob2RlKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5vZGUgPSBwYXJzaW5nT3duZXI7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBub2RlLm5hbWU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG5vZGUucGFyZW50ICYmICEobm9kZS5wYXJlbnQgaW5zdGFuY2VvZiBjYy5TY2VuZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICBwYXRoID0gYCR7bm9kZS5uYW1lfS8ke3BhdGh9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5mbyArPSBgTm9kZSBwYXRoOiBcIiR7cGF0aH1cIlxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cblxuICAgICAgICBpZiAocm9vdFVybCkge1xuICAgICAgICAgICAgaW5mbyArPSBgQXNzZXQgdXJsOiBcIiR7cm9vdFVybH1cIlxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgY2MuQXNzZXQgJiYgdmFsdWUuX3V1aWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXNzZXRkYi5xdWVyeU1pc3NpbmdJbmZvKHZhbHVlLl91dWlkLm1hdGNoKC9bXkBdKi8pWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8gKz0gYEFzc2V0IGZpbGU6IFwiJHthc3NldEluZm8ucGF0aH1cIlxcbmA7XG4gICAgICAgICAgICAgICAgICAgIGluZm8gKz0gYEFzc2V0IGRlbGV0ZWQgdGltZTogXCIke25ldyBEYXRlKGFzc2V0SW5mby5yZW1vdmVUaW1lKS50b0xvY2FsZVN0cmluZygpfVwiXFxuYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG4gICAgICAgICAgICAvLyBpbmZvID0gcGtnLmV4ZWNTeW5jKCdhc3NldC1kYicsICdxdWVyeUFzc2V0SW5mbycsIHRoaXMucm9vdC5fdXVpZCk7XG4gICAgICAgICAgICBpbmZvICs9IGBNaXNzaW5nIHV1aWQ6IFwiJHt2YWx1ZS5fdXVpZH1cIlxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5zbGljZSgwLCAtMSk7IC8vIHJlbW92ZSBsYXN0ICdcXG4nXG5cbiAgICAgICAgLy8g5Zug5Li65oql6ZSZ5b6I5aSa77yM55So5oi35Lya6KeJ5b6X5piv57yW6L6R5Zmo5LiN56iz5a6a77yM5omA5Lul5pqC5pe26ZqQ6JeP6ZSZ6K+vXG4gICAgICAgIGlmIChjb25zb2xlW3RoaXMub3V0cHV0TGV2ZWxdKSB7XG4gICAgICAgICAgICBjb25zb2xlW3RoaXMub3V0cHV0TGV2ZWxdKGluZm8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGluZm8pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVwb3J0KCkge1xuICAgICAgICBsZXQgcm9vdFVybDogYW55O1xuICAgICAgICBsZXQgaW5mbzogYW55O1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgY2MuQXNzZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IE1hbmFnZXI6IElBc3NldFdvcmtlck1hbmFnZXIgPSBnbG9iYWxUaGlzLk1hbmFnZXI7XG4gICAgICAgICAgICAgICAgaWYgKE1hbmFnZXIgJiYgTWFuYWdlci5hc3NldE1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IE1hbmFnZXIuYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvKHRoaXMucm9vdC5fdXVpZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5mbyA9IHBrZy5leGVjU3luYygnYXNzZXQtZGInLCAncXVlcnlBc3NldEluZm8nLCB0aGlzLnJvb3QuX3V1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgaW5mbyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb290VXJsID0gaW5mbyA/IGluZm8ucGF0aCA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgcm9vdFR5cGUgPSBNaXNzaW5nUmVwb3J0ZXIuZ2V0T2JqZWN0VHlwZSh0aGlzLnJvb3QpO1xuICAgICAgICBjb25zdCBpblJvb3RCcmllZkxvY2F0aW9uID0gcm9vdFVybCA/IGAgaW4gJHtyb290VHlwZX0gXCIke3BzLmJhc2VuYW1lKHJvb3RVcmwpfVwiYCA6ICcnO1xuXG4gICAgICAgIE9iamVjdFdhbGtlci53YWxrKHRoaXMucm9vdCwgKG9iajogYW55LCBrZXk6IGFueSwgdmFsdWU6IGFueSwgcGFyc2VkT2JqZWN0czogYW55LCBwYXJzZWRLZXlzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1pc3NpbmdPYmplY3RzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRvUmVwb3J0KG9iaiwgdmFsdWUsIHBhcnNlZE9iamVjdHMsIHJvb3RVcmwsIGluUm9vdEJyaWVmTG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXBvcnRCeU93bmVyKCkge1xuICAgICAgICBsZXQgcm9vdFVybDogYW55O1xuICAgICAgICBsZXQgaW5mbzogYW55O1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgY2MuQXNzZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IE1hbmFnZXI6IElBc3NldFdvcmtlck1hbmFnZXIgPSBnbG9iYWxUaGlzLk1hbmFnZXI7XG4gICAgICAgICAgICAgICAgaWYgKE1hbmFnZXIgJiYgTWFuYWdlci5hc3NldERCTWFuYWdlci5yZWFkeSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvID0gTWFuYWdlci5hc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8odGhpcy5yb290Ll91dWlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBpbmZvID0gcGtnLmV4ZWNTeW5jKCdhc3NldC1kYicsICdxdWVyeUFzc2V0SW5mbycsIHRoaXMucm9vdC5fdXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBpbmZvID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvb3RVcmwgPSBpbmZvID8gaW5mby5wYXRoIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb290VHlwZSA9IE1pc3NpbmdSZXBvcnRlci5nZXRPYmplY3RUeXBlKHRoaXMucm9vdCk7XG4gICAgICAgIGNvbnN0IGluUm9vdEJyaWVmTG9jYXRpb24gPSByb290VXJsID8gYCBpbiAke3Jvb3RUeXBlfSBcIiR7cHMuYmFzZW5hbWUocm9vdFVybCl9XCJgIDogJyc7XG5cbiAgICAgICAgT2JqZWN0V2Fsa2VyLndhbGtQcm9wZXJ0aWVzKHRoaXMucm9vdCwgKG9iajogYW55LCBrZXk6IGFueSwgYWN0dWFsVmFsdWU6IGFueSwgcGFyc2VkT2JqZWN0czogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMubWlzc2luZ093bmVycy5nZXQob2JqKTtcbiAgICAgICAgICAgIGlmIChwcm9wcyAmJiAoa2V5IGluIHByb3BzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydFZhbHVlID0gcHJvcHNba2V5XTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvUmVwb3J0KG9iaiwgcmVwb3J0VmFsdWUgfHwgYWN0dWFsVmFsdWUsIHBhcnNlZE9iamVjdHMsIHJvb3RVcmwsIGluUm9vdEJyaWVmTG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBkb250U2tpcE51bGw6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==