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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYmluYXJ5LXJvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL2Fzc2V0LWJpbmFyeS1yb3V0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOERBLHdDQStDQztBQTJCRCwwREFtRUM7QUF2TUQsTUFBTSxtQkFBbUIsR0FBRywwQkFBMEIsQ0FBQztBQUMxQyxRQUFBLHNCQUFzQixHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBV3ZELE1BQU0sZ0JBQWlCLFNBQVEsS0FBSztJQUNYO0lBQXJCLFlBQXFCLE1BQWMsRUFBRSxPQUFlO1FBQ2hELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQURFLFdBQU0sR0FBTixNQUFNLENBQVE7SUFFbkMsQ0FBQztDQUNKO0FBRUQsTUFBTSxtQkFBb0IsU0FBUSxLQUFLO0lBQ25DO1FBQ0ksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNKO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBb0M7SUFDeEQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxHQUFZO0lBQ3RDLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDaEUsT0FBTyxXQUFXLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUN0RixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsS0FBYztJQUMvQixP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RUFBRSxDQUFDO29CQUNoRCxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO29CQUN2RCxPQUFPO2dCQUNYLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMxQyxNQUFNLFlBQVksR0FBRyxNQUFNLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUMzRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxXQUFXLENBQUM7d0JBQzFDLE1BQU07d0JBQ04sU0FBUyxFQUFFLFNBQVMsS0FBSyxNQUFNO3dCQUMvQixPQUFPO3FCQUNWLENBQUMsQ0FBQztvQkFDSCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNiLGdCQUFnQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDakMsQ0FBQztZQUNMLENBQUM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHR5cGUgeyBJR2V0UG9zdENvbmZpZyB9IGZyb20gJy4uLy4uL3NlcnZlci9pbnRlcmZhY2VzJztcbmltcG9ydCB0eXBlIHsgSUFzc2V0SW5mbyB9IGZyb20gJy4uL2Fzc2V0cy9AdHlwZXMvcHVibGljJztcblxuY29uc3QgQklOQVJZX0NPTlRFTlRfVFlQRSA9ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuZXhwb3J0IGNvbnN0IEFTU0VUX0JJTkFSWV9NQVhfQllURVMgPSA1MCAqIDEwMjQgKiAxMDI0O1xuXG5pbnRlcmZhY2UgQXNzZXRCaW5hcnlNYW5hZ2VyIHtcbiAgICBzYXZlQXNzZXQoYXNzZXRVdWlkOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlcik6IFByb21pc2U8SUFzc2V0SW5mbz47XG4gICAgY3JlYXRlQXNzZXQob3B0aW9uczogeyB0YXJnZXQ6IHN0cmluZzsgb3ZlcndyaXRlOiBib29sZWFuOyBjb250ZW50OiBCdWZmZXIgfSk6IFByb21pc2U8SUFzc2V0SW5mbz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRCaW5hcnlSb3V0ZURlcGVuZGVuY2llcyB7XG4gICAgbG9hZEFzc2V0TWFuYWdlcigpOiBQcm9taXNlPEFzc2V0QmluYXJ5TWFuYWdlcj47XG59XG5cbmNsYXNzIEh0dHBSZXF1ZXN0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IocmVhZG9ubHkgc3RhdHVzOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmNsYXNzIFJlcXVlc3RBYm9ydGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCdCaW5hcnkgcmVxdWVzdCB3YXMgYWJvcnRlZCcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0SGVhZGVyVmFsdWUodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZVswXSA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc09jdGV0U3RyZWFtUmVxdWVzdChyZXE6IFJlcXVlc3QpOiBib29sZWFuIHtcbiAgICBjb25zdCBjb250ZW50VHlwZSA9IGdldEhlYWRlclZhbHVlKHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSk7XG4gICAgcmV0dXJuIGNvbnRlbnRUeXBlPy5zcGxpdCgnOycsIDEpWzBdLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBCSU5BUllfQ09OVEVOVF9UWVBFO1xufVxuXG5mdW5jdGlvbiBpc0Fzc2V0VXVpZCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIHN0cmluZyB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgJiYgL15bMC05YS1mXXs4fSg/Oi1bMC05YS1mXXs0fSl7M30tWzAtOWEtZl17MTJ9JC9pLnRlc3QodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYXNPbmx5UXVlcnlLZXlzKHJlcTogUmVxdWVzdCwga2V5czogcmVhZG9ubHkgc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICBjb25zdCBhbGxvd2VkID0gbmV3IFNldChrZXlzKTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVxLnF1ZXJ5KS5ldmVyeSgoa2V5KSA9PiBhbGxvd2VkLmhhcyhrZXkpKTtcbn1cblxuZnVuY3Rpb24gc2VuZEVycm9yKHJlczogUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBlcnJvcjogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQgJiYgIXJlcy5kZXN0cm95ZWQpIHtcbiAgICAgICAgcmVzLnN0YXR1cyhzdGF0dXMpLmpzb24oeyBlcnJvciB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGVycm9yTWVzc2FnZShlcnJvcjogdW5rbm93bik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbn1cblxuLyoqXG4gKiBBZ2dyZWdhdGVzIGEgYmluYXJ5IHJlcXVlc3QgYm9keSBsb2NhbGx5IHRvIHRoZSBiaW5hcnkgQXNzZXQgcm91dGVzLlxuICogVGhlIGhlbHBlciBrZWVwcyB0aGUgNTAgTWlCIHRyYW5zcG9ydCBwb2xpY3kgb3V0IG9mIHRoZSBnbG9iYWwgSlNPTiBwYXJzZXJcbiAqIGFuZCBjaGVja3MgY2h1bmtzIGV2ZW4gd2hlbiBDb250ZW50LUxlbmd0aCBpcyBhYnNlbnQgb3IgdW50cnVzdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJpbmFyeUJvZHkocmVxOiBSZXF1ZXN0LCBsaW1pdCA9IEFTU0VUX0JJTkFSWV9NQVhfQllURVMpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOdW1iZXIoZ2V0SGVhZGVyVmFsdWUocmVxLmhlYWRlcnM/LlsnY29udGVudC1sZW5ndGgnXSkpO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoY29udGVudExlbmd0aCkgJiYgY29udGVudExlbmd0aCA+IGxpbWl0KSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgSHR0cFJlcXVlc3RFcnJvcig0MTMsICdSYXcgYmluYXJ5IGJvZHkgZXhjZWVkcyA1MCBNaUInKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEJ1ZmZlcj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgICAgIGxldCBsZW5ndGggPSAwO1xuICAgICAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXEub2ZmKCdkYXRhJywgb25EYXRhKTtcbiAgICAgICAgICAgIHJlcS5vZmYoJ2VuZCcsIG9uRW5kKTtcbiAgICAgICAgICAgIHJlcS5vZmYoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgICByZXEub2ZmKCdhYm9ydGVkJywgb25BYm9ydGVkKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZmFpbCA9IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGlmIChzZXR0bGVkKSByZXR1cm47XG4gICAgICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IG9uRGF0YSA9IChjaHVuazogQnVmZmVyIHwgVWludDhBcnJheSB8IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmlzQnVmZmVyKGNodW5rKSA/IGNodW5rIDogQnVmZmVyLmZyb20oY2h1bmspO1xuICAgICAgICAgICAgbGVuZ3RoICs9IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgICBpZiAobGVuZ3RoID4gbGltaXQpIHtcbiAgICAgICAgICAgICAgICBmYWlsKG5ldyBIdHRwUmVxdWVzdEVycm9yKDQxMywgJ1JhdyBiaW5hcnkgYm9keSBleGNlZWRzIDUwIE1pQicpKTtcbiAgICAgICAgICAgICAgICByZXEucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2h1bmtzLnB1c2goYnVmZmVyKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb25FbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoc2V0dGxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoY2h1bmtzLCBsZW5ndGgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb25FcnJvciA9IChlcnJvcjogRXJyb3IpID0+IGZhaWwoZXJyb3IpO1xuICAgICAgICBjb25zdCBvbkFib3J0ZWQgPSAoKSA9PiBmYWlsKG5ldyBSZXF1ZXN0QWJvcnRlZEVycm9yKCkpO1xuXG4gICAgICAgIHJlcS5vbignZGF0YScsIG9uRGF0YSk7XG4gICAgICAgIHJlcS5vbmNlKCdlbmQnLCBvbkVuZCk7XG4gICAgICAgIHJlcS5vbmNlKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICByZXEub25jZSgnYWJvcnRlZCcsIG9uQWJvcnRlZCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlZmF1bHREZXBlbmRlbmNpZXMoKTogQXNzZXRCaW5hcnlSb3V0ZURlcGVuZGVuY2llcyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXN5bmMgbG9hZEFzc2V0TWFuYWdlcigpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0TWFuYWdlcjtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVSb3V0ZUVycm9yKGVycm9yOiB1bmtub3duLCByZXM6IFJlc3BvbnNlKTogdm9pZCB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgUmVxdWVzdEFib3J0ZWRFcnJvcikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBSZXF1ZXN0RXJyb3IpIHtcbiAgICAgICAgc2VuZEVycm9yKHJlcywgZXJyb3Iuc3RhdHVzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZW5kRXJyb3IocmVzLCA1MDAsIGVycm9yTWVzc2FnZShlcnJvcikpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIG5hcnJvdyBicm93c2VyLWZhY2luZyBiaW5hcnkgQXNzZXQgd3JpdGUgcm91dGVzLlxuICogQWxsIGlkZW50aWZpZXIsIG1ldGFkYXRhLCBib2R5LXNpemUsIGFuZCBlcnJvciB0cmFuc2xhdGlvbiBydWxlcyBzdGF5IGhlcmU7XG4gKiBjYWxsZXJzIG9ubHkgcmVjZWl2ZSB0aGUgc3RhYmxlIHNhdmUvY3JlYXRlIG9wZXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBc3NldEJpbmFyeVJvdXRlcyhcbiAgICBkZXBlbmRlbmNpZXM6IEFzc2V0QmluYXJ5Um91dGVEZXBlbmRlbmNpZXMgPSBjcmVhdGVEZWZhdWx0RGVwZW5kZW5jaWVzKCksXG4pOiBJR2V0UG9zdENvbmZpZ1tdIHtcbiAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgICB1cmw6ICcvYXNzZXRzL2JpbmFyeS92MS9zYXZlLzphc3NldFV1aWQnLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzT2N0ZXRTdHJlYW1SZXF1ZXN0KHJlcSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VuZEVycm9yKHJlcywgNDE1LCAnQ29udGVudC1UeXBlIG11c3QgYmUgYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPbmx5UXVlcnlLZXlzKHJlcSwgW10pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRFcnJvcihyZXMsIDQwMCwgJ3NhdmUgZG9lcyBub3QgYWNjZXB0IHF1ZXJ5IHBhcmFtZXRlcnMnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB7IGFzc2V0VXVpZCB9ID0gcmVxLnBhcmFtcztcbiAgICAgICAgICAgICAgICBpZiAoIWlzQXNzZXRVdWlkKGFzc2V0VXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VuZEVycm9yKHJlcywgNDAwLCAnYXNzZXRVdWlkIG11c3QgYmUgYSBVVUlEJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEJpbmFyeUJvZHkocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRNYW5hZ2VyID0gYXdhaXQgZGVwZW5kZW5jaWVzLmxvYWRBc3NldE1hbmFnZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVBc3NldChhc3NldFV1aWQsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdXJsOiAnL2Fzc2V0cy9iaW5hcnkvdjEvY3JlYXRlJyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc09jdGV0U3RyZWFtUmVxdWVzdChyZXEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRFcnJvcihyZXMsIDQxNSwgJ0NvbnRlbnQtVHlwZSBtdXN0IGJlIGFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaGFzT25seVF1ZXJ5S2V5cyhyZXEsIFsndGFyZ2V0JywgJ292ZXJ3cml0ZSddKSkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kRXJyb3IocmVzLCA0MDAsICdjcmVhdGUgYWNjZXB0cyBvbmx5IHRhcmdldCBhbmQgb3ZlcndyaXRlIHF1ZXJ5IHBhcmFtZXRlcnMnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB7IHRhcmdldCwgb3ZlcndyaXRlIH0gPSByZXEucXVlcnk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdzdHJpbmcnIHx8ICF0YXJnZXQuc3RhcnRzV2l0aCgnZGI6Ly8nKSkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kRXJyb3IocmVzLCA0MDAsICd0YXJnZXQgbXVzdCBiZSBhIGRiOi8vIFVSTCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvdmVyd3JpdGUgIT09ICd0cnVlJyAmJiBvdmVyd3JpdGUgIT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VuZEVycm9yKHJlcywgNDAwLCAnb3ZlcndyaXRlIG11c3QgYmUgdHJ1ZSBvciBmYWxzZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHJlYWRCaW5hcnlCb2R5KHJlcSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0TWFuYWdlciA9IGF3YWl0IGRlcGVuZGVuY2llcy5sb2FkQXNzZXRNYW5hZ2VyKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFzc2V0TWFuYWdlci5jcmVhdGVBc3NldCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IG92ZXJ3cml0ZSA9PT0gJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlUm91dGVFcnJvcihlcnJvciwgcmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIF07XG59XG4iXX0=