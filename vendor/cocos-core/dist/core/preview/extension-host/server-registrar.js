"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMiddlewareContribution = buildMiddlewareContribution;
function convert(routes, seen) {
    const out = [];
    for (const r of routes || []) {
        if (!r || !r.url || typeof r.handle !== 'function') {
            continue;
        }
        const key = String(r.url);
        if (seen.has(key)) {
            console.warn(`[ExtensionHost] duplicate preview route ignored: ${key}`);
            continue;
        }
        seen.add(key);
        out.push({
            url: r.url,
            handler: async (req, res, next) => {
                try {
                    await r.handle(req, res, next);
                }
                catch (err) {
                    if (next) {
                        next(err);
                    }
                    else {
                        console.error(`[ExtensionHost] route handler error for ${key}:`, err);
                        if (!res.headersSent) {
                            res.status(500).end();
                        }
                    }
                }
            },
        });
    }
    return out;
}
/**
 * 把若干扩展 server 贡献的 get/post 路由转换为 CLI 的 IMiddlewareContribution：
 * - handle -> handler（并包一层 try/catch -> next(err)）
 * - 同方法内按 url 去重（先到先得）
 */
function buildMiddlewareContribution(routeSets) {
    const seenGet = new Set();
    const seenPost = new Set();
    const get = [];
    const post = [];
    for (const set of routeSets) {
        get.push(...convert(set.get, seenGet));
        post.push(...convert(set.post, seenPost));
    }
    return { get, post };
}
