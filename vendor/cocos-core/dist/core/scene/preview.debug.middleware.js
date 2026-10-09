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
exports.default = {
    get: [],
    post: [
        {
            url: '/create-asset',
            async handler(req, res) {
                try {
                    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                    const { dbURL, content } = req.body;
                    if (!dbURL) {
                        return res.status(400).json({ error: 'dbURL is required' });
                    }
                    const result = await assetManager.createAsset({ target: dbURL, content: content || '' });
                    res.status(200).json({ success: true, result });
                }
                catch (e) {
                    res.status(500).json({ error: e.message });
                }
            },
        },
        {
            url: '/delete-asset',
            async handler(req, res) {
                try {
                    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                    const { dbURL } = req.body;
                    if (!dbURL) {
                        return res.status(400).json({ error: 'dbURL is required' });
                    }
                    const result = await assetManager.removeAsset(dbURL, { useTrash: false });
                    res.status(200).json({ success: true, result });
                }
                catch (e) {
                    res.status(500).json({ error: e.message });
                }
            },
        },
    ],
    socket: {
        connection: (_socket) => { },
        disconnect: (_socket) => { }
    },
};
