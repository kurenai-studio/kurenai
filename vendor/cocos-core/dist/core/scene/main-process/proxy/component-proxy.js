"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentProxy = void 0;
const assets_1 = require("../../../assets");
const rpc_1 = require("../rpc");
const dump_converter_1 = require("./dump-converter");
const asset_reference_resolver_1 = require("./asset-reference-resolver");
exports.ComponentProxy = {
    async add(params) {
        const result = await rpc_1.Rpc.getInstance().request('Component', 'add', [params]);
        return dump_converter_1.DumpConverter.toComponent(result);
    },
    remove(params) {
        return rpc_1.Rpc.getInstance().request('Component', 'remove', [params]);
    },
    async query(params) {
        const result = await rpc_1.Rpc.getInstance().request('Component', 'query', [params]);
        if (!result)
            return null;
        if (typeof params !== 'string') {
            return dump_converter_1.DumpConverter.toComponent(result);
        }
        return result;
    },
    async setProperty(params) {
        const segments = params.componentPath.split('/');
        segments.pop();
        const nodePath = segments.join('/');
        const compDump = await rpc_1.Rpc.getInstance().request('Component', 'query', [params.componentPath]);
        if (!compDump) {
            throw new Error(`Component not found: ${params.componentPath}`);
        }
        const nodeTree = await rpc_1.Rpc.getInstance().request('Node', 'queryNodeTree', [{ path: nodePath }]);
        if (!nodeTree) {
            throw new Error(`Node not found: ${nodePath}`);
        }
        const compUuid = compDump.value?.uuid?.value;
        const compIndex = nodeTree.components.findIndex((c) => c.value === compUuid);
        if (compIndex < 0) {
            throw new Error(`Component index not found: ${params.componentPath}`);
        }
        const assetInfoCache = new Map();
        const queryAssetInfo = (urlOrUuid) => {
            let pending = assetInfoCache.get(urlOrUuid);
            if (!pending) {
                pending = Promise.resolve(assets_1.assetManager.queryAssetInfo(urlOrUuid, ['subAssets', 'extends']));
                assetInfoCache.set(urlOrUuid, pending);
            }
            return pending;
        };
        const pendingUpdates = [];
        for (const [key, value] of Object.entries(params.properties)) {
            const propDef = compDump.value?.[key];
            if (!propDef) {
                throw new Error(`Property '${key}' not found on component`);
            }
            let dumpValue;
            if (propDef.isArray && propDef.elementTypeData && Array.isArray(value)) {
                const expectedAssetType = (0, asset_reference_resolver_1.getExpectedAssetType)(propDef);
                const resolvedItems = expectedAssetType
                    ? await Promise.all(value.map((item) => (0, asset_reference_resolver_1.resolveAssetReference)(item, expectedAssetType, key, queryAssetInfo)))
                    : value;
                dumpValue = resolvedItems.map((item, i) => ({
                    ...propDef.elementTypeData,
                    name: String(i),
                    value: item,
                }));
            }
            else {
                const expectedAssetType = (0, asset_reference_resolver_1.getExpectedAssetType)(propDef);
                dumpValue = expectedAssetType
                    ? await (0, asset_reference_resolver_1.resolveAssetReference)(value, expectedAssetType, key, queryAssetInfo)
                    : value;
            }
            pendingUpdates.push({ key, propDef, dumpValue });
        }
        for (const { key, propDef, dumpValue } of pendingUpdates) {
            await rpc_1.Rpc.getInstance().request('Component', 'setProperty', [{
                    nodePath,
                    path: `__comps__.${compIndex}.${key}`,
                    dump: { ...propDef, value: dumpValue },
                    record: params.record,
                }]);
        }
        return true;
    },
    regeneratePolygon2DPoints(options) {
        return rpc_1.Rpc.getInstance().request('Component', 'regeneratePolygon2DPoints', [options]);
    },
    queryAll() {
        return rpc_1.Rpc.getInstance().request('Component', 'queryAll');
    },
    recalculateLODGroupBounds(options) {
        return rpc_1.Rpc.getInstance().request('Component', 'recalculateLODGroupBounds', [options]);
    },
    insertLOD(options) {
        return rpc_1.Rpc.getInstance().request('Component', 'insertLOD', [options]);
    },
    eraseLOD(options) {
        return rpc_1.Rpc.getInstance().request('Component', 'eraseLOD', [options]);
    },
    queryLODGroupRelativeHeight(options) {
        return rpc_1.Rpc.getInstance().request('Component', 'queryLODGroupRelativeHeight', [options]);
    },
};
