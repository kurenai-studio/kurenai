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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFjay1tb2RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci91dGlscy9wYWNrLW1vZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFnQkEsNEJBNERDO0FBNUVELHdEQUEwQjtBQUMxQixnREFBc0I7QUFDdEIsb0ZBQXlEO0FBT3pEOzs7Ozs7R0FNRztBQUNJLEtBQUssVUFBVSxRQUFRLENBQzFCLElBQVksRUFDWixhQUFxQyxFQUNyQyxPQUFlLEVBQ2YsT0FBeUQ7SUFFekQsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUUvQixNQUFNLE1BQU0sR0FBRyxJQUFJLGdDQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFN0QsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxtRkFBbUYsQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFRCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFOztFQUV2QixNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsUUFBUSxPQUFPLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCMUcsQ0FBQyxDQUFDO0lBQ0MsQ0FBQztJQUVELElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELElBQUksVUFBVSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQyxJQUFJLFVBQVUsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMxQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsbUVBQW1FLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDL0YsQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSx3QkFBd0IsY0FBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekUsQ0FBQztJQUNMLENBQUM7SUFFRCxNQUFNLGtCQUFFLENBQUMsU0FBUyxDQUFDLGNBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN4QyxNQUFNLGtCQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdkQsSUFBSSxVQUFVLElBQUksTUFBTSxDQUFDLFNBQVMsSUFBSSxVQUFVLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDNUQsTUFBTSxrQkFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE9BQU8sTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRCxDQUFDO0FBRUwsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgcHMgZnJvbSAncGF0aCc7XG5pbXBvcnQgY29uY2F0V2l0aFNvdXJjZU1hcCBmcm9tICdjb25jYXQtd2l0aC1zb3VyY2VtYXBzJztcblxuaW50ZXJmYWNlIElNb2Qge1xuICAgIGNvZGU6IHN0cmluZztcbiAgICBtYXA/OiBzdHJpbmc7XG59XG5cbi8qKlxuICog5omT5YyF5oyH5a6a55qE5omA5pyJ6ISa5pys5Yiw5LiA5Liq5Y2V54us55qE6ISa5pys5Lit44CCXG4gKiBAcGFyYW0gbW9kcyBcbiAqIEBwYXJhbSBjaHVua01hcHBpbmdzIFxuICogQHBhcmFtIG91dEZpbGUgXG4gKiBAcGFyYW0gb3B0aW9ucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhY2tNb2RzKFxuICAgIG1vZHM6IElNb2RbXSxcbiAgICBjaHVua01hcHBpbmdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIG91dEZpbGU6IHN0cmluZyxcbiAgICBvcHRpb25zOiB7c291cmNlTWFwczogYm9vbGVhbiB8ICdpbmxpbmUnLCB3cmFwPzogYm9vbGVhbn0sXG4pIHtcbiAgICBjb25zdCB7IHNvdXJjZU1hcHMgfSA9IG9wdGlvbnM7XG5cbiAgICBjb25zdCBjb25jYXQgPSBuZXcgY29uY2F0V2l0aFNvdXJjZU1hcCh0cnVlLCAnYWxsLmpzJywgJ1xcbicpO1xuXG4gICAgaWYgKG9wdGlvbnMud3JhcCkge1xuICAgICAgICBjb25jYXQuYWRkKG51bGwsICdTeXN0ZW0ucmVnaXN0ZXIoW10sIGZ1bmN0aW9uKF9leHBvcnQsIF9jb250ZXh0KSB7IHJldHVybiB7IGV4ZWN1dGU6IGZ1bmN0aW9uICgpIHsnKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG1vZCBvZiBtb2RzKSB7XG4gICAgICAgIGNvbmNhdC5hZGQobnVsbCwgbW9kLmNvZGUsIG1vZC5tYXApO1xuICAgIH1cblxuICAgIGlmIChPYmplY3Qua2V5cyhjaHVua01hcHBpbmdzKS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgY29uY2F0LmFkZChudWxsLCBgXFxcbihmdW5jdGlvbihyKSB7XG4ke09iamVjdC5rZXlzKGNodW5rTWFwcGluZ3MpLm1hcCgobWFwcGluZykgPT4gYCAgcignJHttYXBwaW5nfScsICcke2NodW5rTWFwcGluZ3NbbWFwcGluZ119Jyk7YCkuam9pbignXFxuJyl9IFxufSkoZnVuY3Rpb24obWlkLCBjaWQpIHtcbiAgICBTeXN0ZW0ucmVnaXN0ZXIobWlkLCBbY2lkXSwgZnVuY3Rpb24gKF9leHBvcnQsIF9jb250ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2V0dGVyczogW2Z1bmN0aW9uKF9tKSB7XG4gICAgICAgICAgICB2YXIgX2V4cG9ydE9iaiA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBfa2V5IGluIF9tKSB7XG4gICAgICAgICAgICAgIGlmIChfa2V5ICE9PSBcImRlZmF1bHRcIiAmJiBfa2V5ICE9PSBcIl9fZXNNb2R1bGVcIikgX2V4cG9ydE9ialtfa2V5XSA9IF9tW19rZXldO1xuICAgICAgICAgICAgfVxuICAgICAgXG4gICAgICAgICAgICBfZXhwb3J0KF9leHBvcnRPYmopO1xuICAgICAgICB9XSxcbiAgICAgICAgZXhlY3V0ZTogZnVuY3Rpb24gKCkgeyB9XG4gICAgfTtcbiAgICB9KTtcbn0pO1xcXG5gKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy53cmFwKSB7XG4gICAgICAgIGNvbmNhdC5hZGQobnVsbCwgJ30gfTsgfSk7Jyk7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZU1hcHMgJiYgY29uY2F0LnNvdXJjZU1hcCkge1xuICAgICAgICBpZiAoc291cmNlTWFwcyA9PT0gJ2lubGluZScpIHtcbiAgICAgICAgICAgIGNvbnN0IGI2NCA9IEJ1ZmZlci5mcm9tKGNvbmNhdC5zb3VyY2VNYXApLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIGNvbmNhdC5hZGQobnVsbCwgYC8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCwke2I2NH1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbmNhdC5hZGQobnVsbCwgYC8vIyBzb3VyY2VNYXBwaW5nVVJMPSR7cHMuYmFzZW5hbWUob3V0RmlsZSl9Lm1hcGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBzLmRpcm5hbWUob3V0RmlsZSkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRGaWxlLCBjb25jYXQuY29udGVudC50b1N0cmluZygpKTtcbiAgICBpZiAoc291cmNlTWFwcyAmJiBjb25jYXQuc291cmNlTWFwICYmIHNvdXJjZU1hcHMgIT09ICdpbmxpbmUnKSB7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShgJHtvdXRGaWxlfS5tYXBgLCBjb25jYXQuc291cmNlTWFwKTtcbiAgICB9XG5cbn1cbiJdfQ==