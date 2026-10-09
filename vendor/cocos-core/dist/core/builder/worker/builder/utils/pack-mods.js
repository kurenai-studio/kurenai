"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packMods = packMods;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const concat_with_sourcemaps_1 = __importDefault(require("concat-with-sourcemaps"));
/**
 * 打包指定的所有脚本到一个单独的脚本中。
 * @param mods
 * @param chunkMappings
 * @param outFile
 * @param options
 */
async function packMods(mods, chunkMappings, outFile, options) {
    const { sourceMaps } = options;
    const concat = new concat_with_sourcemaps_1.default(true, 'all.js', '\n');
    if (options.wrap) {
        concat.add(null, 'System.register([], function(_export, _context) { return { execute: function () {');
    }
    for (const mod of mods) {
        concat.add(null, mod.code, mod.map);
    }
    if (Object.keys(chunkMappings).length !== 0) {
        concat.add(null, `\
(function(r) {
${Object.keys(chunkMappings).map((mapping) => `  r('${mapping}', '${chunkMappings[mapping]}');`).join('\n')} 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});\
`);
    }
    if (options.wrap) {
        concat.add(null, '} }; });');
    }
    if (sourceMaps && concat.sourceMap) {
        if (sourceMaps === 'inline') {
            const b64 = Buffer.from(concat.sourceMap).toString('base64');
            concat.add(null, `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${b64}`);
        }
        else {
            concat.add(null, `//# sourceMappingURL=${path_1.default.basename(outFile)}.map`);
        }
    }
    await fs_extra_1.default.ensureDir(path_1.default.dirname(outFile));
    await fs_extra_1.default.writeFile(outFile, concat.content.toString());
    if (sourceMaps && concat.sourceMap && sourceMaps !== 'inline') {
        await fs_extra_1.default.writeFile(`${outFile}.map`, concat.sourceMap);
    }
}
