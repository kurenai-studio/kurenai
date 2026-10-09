"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_TYPE = exports.PREFAB_TYPE = exports.JOINT_MASK_TYPE = exports.ANIMATION_MASK_TYPE = void 0;
exports.assertRecord = assertRecord;
exports.normalizeJointPath = normalizeJointPath;
exports.normalizeJointMasks = normalizeJointMasks;
exports.jointMasksToDump = jointMasksToDump;
exports.extractPrefabJointPaths = extractPrefabJointPaths;
exports.applyJointChanges = applyJointChanges;
exports.ANIMATION_MASK_TYPE = 'cc.animation.AnimationMask';
exports.JOINT_MASK_TYPE = 'cc.JointMask';
exports.PREFAB_TYPE = 'cc.Prefab';
exports.NODE_TYPE = 'cc.Node';
function assertRecord(value, message) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(message);
    }
}
function normalizeJointPath(path) {
    return path.split('/').map((segment) => segment.trim()).filter(Boolean).join('/');
}
function normalizeJointMasks(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error('AnimationMask _jointMasks must be an array');
    }
    const result = [];
    const seen = new Set();
    for (const item of value) {
        assertRecord(item, 'AnimationMask joint mask item must be an object');
        const path = normalizeJointPath(String(item.path ?? ''));
        if (!path) {
            continue;
        }
        if (seen.has(path)) {
            throw new Error(`Duplicate AnimationMask joint path: ${path}`);
        }
        seen.add(path);
        result.push({
            __type__: typeof item.__type__ === 'string' ? item.__type__ : exports.JOINT_MASK_TYPE,
            path,
            enabled: item.enabled !== false,
        });
    }
    return result;
}
function jointMasksToDump(assetUuid, jointMasks) {
    const nodeMap = new Map();
    for (const mask of jointMasks) {
        nodeMap.set(mask.path, {
            path: mask.path,
            enabled: mask.enabled,
        });
    }
    const roots = [];
    const sorted = Array.from(nodeMap.values()).sort((a, b) => a.path.localeCompare(b.path));
    for (const node of sorted) {
        const parentPath = findNearestExplicitParentPath(node.path, nodeMap);
        if (!parentPath) {
            roots.push(node);
            continue;
        }
        const parent = nodeMap.get(parentPath);
        parent.children = parent.children || [];
        parent.children.push(node);
    }
    return {
        version: 1,
        assetUuid,
        joints: roots,
    };
}
function findNearestExplicitParentPath(path, nodeMap) {
    let index = path.lastIndexOf('/');
    while (index > 0) {
        const parentPath = path.slice(0, index);
        if (nodeMap.has(parentPath)) {
            return parentPath;
        }
        index = parentPath.lastIndexOf('/');
    }
    return null;
}
function isNodeRef(value) {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && typeof value.__id__ === 'number';
}
function extractPrefabJointPaths(prefabJSON) {
    const root = prefabJSON[1];
    assertRecord(root, 'Prefab JSON must contain root node at index 1');
    if (root.__type__ !== exports.NODE_TYPE) {
        throw new Error('Prefab JSON root entry must be cc.Node');
    }
    const paths = [];
    const seen = new Set();
    visitChildren(root, '');
    return paths;
    function visitChildren(node, parentPath) {
        const children = Array.isArray(node._children) ? node._children : [];
        for (const childRef of children) {
            if (!isNodeRef(childRef)) {
                continue;
            }
            const child = prefabJSON[childRef.__id__];
            if (!child || child.__type__ !== exports.NODE_TYPE) {
                continue;
            }
            const name = String(child._name ?? '').trim();
            if (!name) {
                continue;
            }
            const path = parentPath ? `${parentPath}/${name}` : name;
            if (seen.has(path)) {
                throw new Error(`Duplicate skeleton joint path: ${path}`);
            }
            seen.add(path);
            paths.push(path);
            visitChildren(child, path);
        }
    }
}
function applyJointChanges(jointMasks, changes) {
    const result = jointMasks.map((joint) => ({ ...joint }));
    const pathToJoint = new Map(result.map((joint) => [joint.path, joint]));
    for (const change of changes) {
        const path = normalizeJointPath(change.path);
        if (!path) {
            throw new Error('AnimationMask change path must not be empty');
        }
        const target = pathToJoint.get(path);
        if (!target) {
            throw new Error(`AnimationMask joint path not found: ${path}`);
        }
        const shouldUpdate = (joint) => joint.path === path || (!!change.recursive && joint.path.startsWith(`${path}/`));
        for (const joint of result) {
            if (shouldUpdate(joint)) {
                joint.enabled = change.enabled;
            }
        }
    }
    return result;
}
