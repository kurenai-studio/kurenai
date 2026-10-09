"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBuildPath = registerBuildPath;
exports.getBuildPath = getBuildPath;
exports.getBuildUrlPath = getBuildUrlPath;
const path_1 = require("path");
const fs_1 = require("fs");
const buildMaps = {};
const destMaps = {};
function registerBuildPath(platform, name, dest) {
    const key = `${platform}/${name}`;
    buildMaps[key] = dest;
    destMaps[dest] = key;
}
function getBuildPath(platform, name) {
    return buildMaps[`${platform}/${name}`];
}
function getBuildUrlPath(dest) {
    return destMaps[dest];
}
exports.default = {
    get: [
        {
            /**
             * http://localhost:xxxx/build/web-desktop/outputName/index.html
             */
            url: /^\/build\/([^/]+)\/([^/]+)\/(.*)/,
            async handler(req, res) {
                const platform = req.params[0];
                const name = req.params[1];
                const dest = getBuildPath(platform, name);
                const file = req.params[2];
                if (dest && file) {
                    const path = (0, path_1.join)(dest, file);
                    if ((0, fs_1.existsSync)(path)) {
                        return res.sendFile(path);
                    }
                }
                return res.status(404).send(`${req.url} 资源不存在`);
            },
        }
    ]
};
