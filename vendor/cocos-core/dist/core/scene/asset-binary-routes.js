"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSET_BINARY_MAX_BYTES = void 0;
exports.readBinaryBody = readBinaryBody;
exports.createAssetBinaryRoutes = createAssetBinaryRoutes;
const BINARY_CONTENT_TYPE = 'application/octet-stream';
exports.ASSET_BINARY_MAX_BYTES = 50 * 1024 * 1024;
class HttpRequestError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
class RequestAbortedError extends Error {
    constructor() {
        super('Binary request was aborted');
    }
}
function getHeaderValue(value) {
    return Array.isArray(value) ? value[0] : value;
}
function isOctetStreamRequest(req) {
    const contentType = getHeaderValue(req.headers['content-type']);
    return contentType?.split(';', 1)[0].trim().toLowerCase() === BINARY_CONTENT_TYPE;
}
function isAssetUuid(value) {
    return typeof value === 'string'
        && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}
function hasOnlyQueryKeys(req, keys) {
    const allowed = new Set(keys);
    return Object.keys(req.query).every((key) => allowed.has(key));
}
function sendError(res, status, error) {
    if (!res.headersSent && !res.destroyed) {
        res.status(status).json({ error });
    }
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Aggregates a binary request body locally to the binary Asset routes.
 * The helper keeps the 50 MiB transport policy out of the global JSON parser
 * and checks chunks even when Content-Length is absent or untrusted.
 */
function readBinaryBody(req, limit = exports.ASSET_BINARY_MAX_BYTES) {
    const contentLength = Number(getHeaderValue(req.headers?.['content-length']));
    if (Number.isFinite(contentLength) && contentLength > limit) {
        return Promise.reject(new HttpRequestError(413, 'Raw binary body exceeds 50 MiB'));
    }
    return new Promise((resolve, reject) => {
        const chunks = [];
        let length = 0;
        let settled = false;
        const cleanup = () => {
            req.off('data', onData);
            req.off('end', onEnd);
            req.off('error', onError);
            req.off('aborted', onAborted);
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(error);
        };
        const onData = (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            length += buffer.length;
            if (length > limit) {
                fail(new HttpRequestError(413, 'Raw binary body exceeds 50 MiB'));
                req.resume();
                return;
            }
            chunks.push(buffer);
        };
        const onEnd = () => {
            if (settled)
                return;
            settled = true;
            cleanup();
            resolve(Buffer.concat(chunks, length));
        };
        const onError = (error) => fail(error);
        const onAborted = () => fail(new RequestAbortedError());
        req.on('data', onData);
        req.once('end', onEnd);
        req.once('error', onError);
        req.once('aborted', onAborted);
    });
}
function createDefaultDependencies() {
    return {
        async loadAssetManager() {
            const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
            return assetManager;
        },
    };
}
function handleRouteError(error, res) {
    if (error instanceof RequestAbortedError) {
        return;
    }
    if (error instanceof HttpRequestError) {
        sendError(res, error.status, error.message);
        return;
    }
    sendError(res, 500, errorMessage(error));
}
/**
 * Creates the narrow browser-facing binary Asset write routes.
 * All identifier, metadata, body-size, and error translation rules stay here;
 * callers only receive the stable save/create operations.
 */
function createAssetBinaryRoutes(dependencies = createDefaultDependencies()) {
    return [
        {
            url: '/assets/binary/v1/save/:assetUuid',
            async handler(req, res) {
                if (!isOctetStreamRequest(req)) {
                    sendError(res, 415, 'Content-Type must be application/octet-stream');
                    return;
                }
                if (!hasOnlyQueryKeys(req, [])) {
                    sendError(res, 400, 'save does not accept query parameters');
                    return;
                }
                const { assetUuid } = req.params;
                if (!isAssetUuid(assetUuid)) {
                    sendError(res, 400, 'assetUuid must be a UUID');
                    return;
                }
                try {
                    const content = await readBinaryBody(req);
                    const assetManager = await dependencies.loadAssetManager();
                    const result = await assetManager.saveAsset(assetUuid, content);
                    res.status(200).json(result);
                }
                catch (error) {
                    handleRouteError(error, res);
                }
            },
        },
        {
            url: '/assets/binary/v1/create',
            async handler(req, res) {
                if (!isOctetStreamRequest(req)) {
                    sendError(res, 415, 'Content-Type must be application/octet-stream');
                    return;
                }
                if (!hasOnlyQueryKeys(req, ['target', 'overwrite'])) {
                    sendError(res, 400, 'create accepts only target and overwrite query parameters');
                    return;
                }
                const { target, overwrite } = req.query;
                if (typeof target !== 'string' || !target.startsWith('db://')) {
                    sendError(res, 400, 'target must be a db:// URL');
                    return;
                }
                if (overwrite !== 'true' && overwrite !== 'false') {
                    sendError(res, 400, 'overwrite must be true or false');
                    return;
                }
                try {
                    const content = await readBinaryBody(req);
                    const assetManager = await dependencies.loadAssetManager();
                    const result = await assetManager.createAsset({
                        target,
                        overwrite: overwrite === 'true',
                        content,
                    });
                    res.status(200).json(result);
                }
                catch (error) {
                    handleRouteError(error, res);
                }
            },
        },
    ];
}
