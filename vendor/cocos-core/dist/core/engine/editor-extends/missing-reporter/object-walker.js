'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectWalker = exports.ObjectWalkerBehavior = void 0;
exports.walk = walk;
exports.walkProperties = walkProperties;
exports.getNextProperty = getNextProperty;
// ObjectWalkerBehavior
class ObjectWalkerBehavior {
    walk(obj, key, val) { }
    root;
    constructor(root) {
        this.root = root;
    }
    parseObject(val) {
        if (Array.isArray(val)) {
            this.forEach(val);
        }
        else {
            const klass = val.constructor;
            if (val instanceof cc.Asset || // skip Asset
                (klass !== Object && !cc.js.getClassId(val, false)) // skip non-serializable or other type objects
            ) {
                if (val !== this.root) {
                    return;
                }
            }
            const props = klass && klass.__props__;
            if (props) {
                // CCClass or fastDefine
                this.parseCCClass(val, klass, props);
            }
            else {
                this.forIn(val);
            }
        }
    }
    parseCCClass(val, klass, props) {
        const attrs = cc.Class.Attr.getClassAttrs(klass);
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (attrs[prop + cc.Class.Attr.DELIMETER + 'serializable'] === false) {
                continue;
            }
            this.walk(val, prop, val[prop]);
        }
    }
    forIn(val) {
        for (const key in val) {
            if (
            // eslint-disable-next-line no-prototype-builtins
            val.hasOwnProperty(key) &&
                (key.charCodeAt(0) !== 95 || key.charCodeAt(1) !== 95) // not starts with __
            ) {
                this.walk(val, key, val[key]);
            }
        }
    }
    forEach(val) {
        for (let i = 0, len = val.length; i < len; ++i) {
            this.walk(val, '' + i, val[i]);
        }
    }
}
exports.ObjectWalkerBehavior = ObjectWalkerBehavior;
// ObjectWalker
// Traverse all objects recursively.
// Each object will be navigated only once in the value parameter in callback.
class ObjectWalker extends ObjectWalkerBehavior {
    iteratee;
    parsedObjects;
    parsedKeys;
    ignoreParent;
    ignoreSubPrefabHelper;
    walked = new Set();
    constructor(root, iteratee, options) {
        super(root);
        this.iteratee = iteratee;
        this.parsedObjects = [];
        this.parsedKeys = [];
        this.walked.add(root);
        this.ignoreParent = options && options.ignoreParent;
        this.ignoreSubPrefabHelper = options && options.ignoreSubPrefabHelper;
        if (this.ignoreParent) {
            if (this.root instanceof cc.Component) {
                this.ignoreParent = this.root.node;
            }
            else if (this.root instanceof cc.Node) {
                this.ignoreParent = this.root;
            }
            else {
                return cc.error('can only ignore parent of scene node');
            }
        }
        this.parseObject(root);
    }
    walk(obj, key, val) {
        const isObj = val && typeof val === 'object';
        if (isObj) {
            if (this.walked.has(val)) {
                return;
            }
            if (this.ignoreParent) {
                if (val instanceof cc.Node) {
                    if (!val.isChildOf(this.ignoreParent)) {
                        return;
                    }
                }
                else if (val instanceof cc.Component) {
                    if (!val.node.isChildOf(this.ignoreParent)) {
                        return;
                    }
                }
            }
            if (this.ignoreSubPrefabHelper && val instanceof cc._PrefabInfo && val.root !== obj) {
                return;
            }
            this.walked.add(val);
            this.iteratee(obj, key, val, this.parsedObjects, this.parsedKeys);
            this.parsedObjects.push(obj);
            this.parsedKeys.push(key);
            this.parseObject(val);
            this.parsedObjects.pop();
            this.parsedKeys.pop();
        }
    }
}
exports.ObjectWalker = ObjectWalker;
// FACADE
/**
 * Traverse all objects recursively
 * @param {Object} root
 * @param {Function} iteratee
 * @param {Object} iteratee.object
 * @param {String} iteratee.property
 * @param {Object} iteratee.value - per object will be navigated ONLY once in this parameter
 * @param {Object[]} iteratee.parsedObjects - parsed object path, NOT contains the "object" parameter
 */
function walk(root, iteratee) {
    new ObjectWalker(root, iteratee);
}
const staticDummyWalker = new ObjectWalkerBehavior(null);
// enumerate properties not recursively
function doWalkProperties(obj, iteratee) {
    const SKIP_INVALID_TYPES_EVEN_IF_ROOT = null;
    staticDummyWalker.root = SKIP_INVALID_TYPES_EVEN_IF_ROOT;
    staticDummyWalker.walk = iteratee;
    staticDummyWalker.parseObject(obj);
}
/**
 * Traverse all object's properties recursively
 * @param {Object}   root
 * @param {Function} iteratee
 * @param {Object}     iteratee.object
 * @param {String}     iteratee.property - per object property will be navigated ONLY once in this parameter
 * @param {Object}     iteratee.value - per object may be navigated MORE than once in this parameter
 * @param {Object[]}   iteratee.parsedObjects - parsed object path, NOT contains the "object" parameter
 * @param {Object}   [options]
 * @param {Boolean}    [options.dontSkipNull = false]
 */
function walkProperties(root, iteratee, options) {
    const dontSkipNull = options && options.dontSkipNull;
    new ObjectWalker(root, function (obj, key, value, parsedObjects) {
        // 如果 value 已经遍历过，ObjectWalker 不会枚举其余对象对 value 的引用
        // 所以这里拿到 value 后自己再枚举一次 value 内的引用
        const noPropToWalk = !value || typeof value !== 'object';
        if (noPropToWalk) {
            return;
        }
        parsedObjects.push(obj);
        doWalkProperties(value, function (obj, key, val) {
            const isObj = typeof val === 'object';
            if (isObj) {
                if (dontSkipNull || val) {
                    iteratee(obj, key, val, parsedObjects);
                }
            }
        });
        parsedObjects.pop();
    }, options);
}
function getNextProperty(parsedObjects, parsingObject, object) {
    let nextObj;
    const i = parsedObjects.lastIndexOf(object);
    if (i === parsedObjects.length - 1) {
        nextObj = parsingObject;
    }
    else if (0 <= i && i < parsedObjects.length - 1) {
        nextObj = parsedObjects[i + 1];
    }
    else {
        return '';
    }
    let foundKey = '';
    doWalkProperties(object, function (obj, key, val) {
        if (val === nextObj) {
            foundKey = key;
        }
    });
    return foundKey;
}
