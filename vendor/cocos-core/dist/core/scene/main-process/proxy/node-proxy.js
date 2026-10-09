"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeProxy = void 0;
const rpc_1 = require("../rpc");
const dump_converter_1 = require("./dump-converter");
exports.NodeProxy = {
    async createByType(params) {
        const result = await rpc_1.Rpc.getInstance().request('Node', 'createByType', [params]);
        return result ? dump_converter_1.DumpConverter.toNode(result) : null;
    },
    async createByAsset(params) {
        const result = await rpc_1.Rpc.getInstance().request('Node', 'createByAsset', [params]);
        return result ? dump_converter_1.DumpConverter.toNode(result) : null;
    },
    delete(params) {
        return rpc_1.Rpc.getInstance().request('Node', 'delete', [params]);
    },
    async update(params) {
        const nodeDump = await rpc_1.Rpc.getInstance().request('Node', 'query', [{ path: params.path }]);
        if (!nodeDump) {
            throw new Error(`Node not found: ${params.path}`);
        }
        const properties = {};
        if (params.properties) {
            const p = params.properties;
            if (p.position)
                properties.position = p.position;
            if (p.rotation)
                properties.rotation = p.rotation;
            if (p.scale)
                properties.scale = p.scale;
            if (p.active !== undefined)
                properties.active = p.active;
            if (p.mobility !== undefined)
                properties.mobility = p.mobility;
            if (p.layer !== undefined)
                properties.layer = p.layer;
        }
        for (const [key, value] of Object.entries(properties)) {
            const propDef = nodeDump[key];
            if (!propDef) {
                throw new Error(`Property '${key}' not found on node`);
            }
            await rpc_1.Rpc.getInstance().request('Node', 'setProperty', [{
                    nodePath: params.path,
                    path: key,
                    dump: { ...propDef, value },
                }]);
        }
        let currentPath = params.path;
        if (params.name) {
            const nameDef = nodeDump.name;
            if (!nameDef) {
                throw new Error('Property \'name\' not found on node');
            }
            await rpc_1.Rpc.getInstance().request('Node', 'setProperty', [{
                    nodePath: params.path,
                    path: 'name',
                    dump: { ...nameDef, value: params.name },
                }]);
            const nodeUuid = nodeDump.uuid?.value;
            if (!nodeUuid) {
                throw new Error(`Node at '${params.path}' has no uuid, cannot resolve renamed path`);
            }
            // After name/path decoupling, rename no longer simply replaces the last path segment
            // (same-name siblings produce suffixes); must reverse-lookup via UUID from NodePathManager
            const realPath = await rpc_1.Rpc.getInstance().request('Node', 'getPathByUuid', [nodeUuid]);
            if (!realPath) {
                throw new Error(`Cannot resolve path for node '${nodeUuid}' after rename`);
            }
            currentPath = realPath;
        }
        return { path: currentPath };
    },
    async query(params) {
        const result = await rpc_1.Rpc.getInstance().request('Node', 'query', [{
                path: params?.path ?? '',
                includeChildren: params?.includeChildren ?? false,
                includeComponents: params?.includeComponents ?? false,
            }]);
        if (!result)
            return null;
        return dump_converter_1.DumpConverter.toNode(result, { path: params?.path });
    },
    queryNodeTree(params) {
        return rpc_1.Rpc.getInstance().request('Node', 'queryNodeTree', [params]);
    },
};
