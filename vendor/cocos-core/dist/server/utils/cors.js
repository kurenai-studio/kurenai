"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cors = cors;
/**
 * 手动设置 CORS 头
 * @param req
 * @param res
 * @param next
 */
function cors(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // 允许所有域
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    res.header('Access-Control-Expose-Headers', 'Content-Type, Cache-Control'); // 允许客户端访问这些头部
    // 预检请求直接返回 204
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
}
