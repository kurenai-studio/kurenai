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
exports.DragonBonesHandler = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");
const utils_1 = require("../../utils");
const DRAGONBONES_ENCODING = { encoding: 'utf8' };
function basenameNoExt(p) {
    const b = path.basename(p);
    const ext = path.extname(p);
    return b.substring(0, b.length - ext.length);
}
exports.DragonBonesHandler = {
    name: 'dragonbones',
    assetType: 'dragonBones.DragonBonesAsset',
    async validate(asset) {
        let json;
        const assetpath = asset.source;
        if (assetpath.endsWith('.json')) {
            const text = fs.readFileSync(assetpath, 'utf8');
            try {
                json = JSON.parse(text);
            }
            catch (e) {
                return false;
            }
        }
        else {
            const bin = fs.readFileSync(assetpath);
            try {
                // https://github.com/nodejs/node/issues/11132
                const ab = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
                json = cc_1.dragonBones.BinaryDataParser.getInstance().parseDragonBonesData(ab);
            }
            catch (e) {
                return false;
            }
        }
        if (!json) {
            return false;
        }
        return Array.isArray(json.armature) || !!json.armatures;
    },
    importer: {
        version: '1.0.2',
        async import(asset) {
            const fspath = asset.source;
            const data = await fse.readFile(fspath, DRAGONBONES_ENCODING);
            const dragonBone = new cc_1.dragonBones.DragonBonesAsset();
            dragonBone.name = basenameNoExt(fspath);
            if (fspath.endsWith('.json')) {
                dragonBone.dragonBonesJson = data;
            }
            else {
                await asset.copyToLibrary('.dbbin', fspath);
                dragonBone._setRawAsset('.dbbin');
            }
            const serializeJSON = EditorExtends.serialize(dragonBone);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.DragonBonesHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ29uYm9uZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZHJhZ29uYm9uZXMvZHJhZ29uYm9uZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQUN6Qiw4Q0FBZ0M7QUFFaEMsMkJBQWlDO0FBRWpDLHVDQUFnRDtBQUdoRCxNQUFNLG9CQUFvQixHQUFHLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBRWxELFNBQVMsYUFBYSxDQUFDLENBQVM7SUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVZLFFBQUEsa0JBQWtCLEdBQWlCO0lBQzVDLElBQUksRUFBRSxhQUFhO0lBRW5CLFNBQVMsRUFBRSw4QkFBOEI7SUFFekMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFZO1FBQ3ZCLElBQUksSUFBSSxDQUFDO1FBQ1QsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMvQixJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM5QixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUM7Z0JBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztRQUNMLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUM7Z0JBQ0QsOENBQThDO2dCQUM5QyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLEdBQUcsZ0JBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvRSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzVELENBQUM7SUFFRCxRQUFRLEVBQUU7UUFDTixPQUFPLEVBQUUsT0FBTztRQUNoQixLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7WUFDckIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUM1QixNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDOUQsTUFBTSxVQUFVLEdBQVEsSUFBSSxnQkFBVyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDM0QsVUFBVSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLFVBQVUsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDSixNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsMEJBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgZnNlIGZyb20gJ2ZzLWV4dHJhJztcblxuaW1wb3J0IHsgZHJhZ29uQm9uZXMgfSBmcm9tICdjYyc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmNvbnN0IERSQUdPTkJPTkVTX0VOQ09ESU5HID0geyBlbmNvZGluZzogJ3V0ZjgnIH07XG5cbmZ1bmN0aW9uIGJhc2VuYW1lTm9FeHQocDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiID0gcGF0aC5iYXNlbmFtZShwKTtcbiAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocCk7XG4gICAgcmV0dXJuIGIuc3Vic3RyaW5nKDAsIGIubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG59XG5cbmV4cG9ydCBjb25zdCBEcmFnb25Cb25lc0hhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICBuYW1lOiAnZHJhZ29uYm9uZXMnLFxuXG4gICAgYXNzZXRUeXBlOiAnZHJhZ29uQm9uZXMuRHJhZ29uQm9uZXNBc3NldCcsXG5cbiAgICBhc3luYyB2YWxpZGF0ZShhc3NldDogQXNzZXQpIHtcbiAgICAgICAgbGV0IGpzb247XG4gICAgICAgIGNvbnN0IGFzc2V0cGF0aCA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgaWYgKGFzc2V0cGF0aC5lbmRzV2l0aCgnLmpzb24nKSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGZzLnJlYWRGaWxlU3luYyhhc3NldHBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGJpbiA9IGZzLnJlYWRGaWxlU3luYyhhc3NldHBhdGgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvaXNzdWVzLzExMTMyXG4gICAgICAgICAgICAgICAgY29uc3QgYWIgPSBiaW4uYnVmZmVyLnNsaWNlKGJpbi5ieXRlT2Zmc2V0LCBiaW4uYnl0ZU9mZnNldCArIGJpbi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBqc29uID0gZHJhZ29uQm9uZXMuQmluYXJ5RGF0YVBhcnNlci5nZXRJbnN0YW5jZSgpLnBhcnNlRHJhZ29uQm9uZXNEYXRhKGFiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGpzb24uYXJtYXR1cmUpIHx8ICEhanNvbi5hcm1hdHVyZXM7XG4gICAgfSxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIHZlcnNpb246ICcxLjAuMicsXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZzcGF0aCA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmc2UucmVhZEZpbGUoZnNwYXRoLCBEUkFHT05CT05FU19FTkNPRElORyk7XG4gICAgICAgICAgICBjb25zdCBkcmFnb25Cb25lOiBhbnkgPSBuZXcgZHJhZ29uQm9uZXMuRHJhZ29uQm9uZXNBc3NldCgpO1xuICAgICAgICAgICAgZHJhZ29uQm9uZS5uYW1lID0gYmFzZW5hbWVOb0V4dChmc3BhdGgpO1xuICAgICAgICAgICAgaWYgKGZzcGF0aC5lbmRzV2l0aCgnLmpzb24nKSkge1xuICAgICAgICAgICAgICAgIGRyYWdvbkJvbmUuZHJhZ29uQm9uZXNKc29uID0gZGF0YTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuY29weVRvTGlicmFyeSgnLmRiYmluJywgZnNwYXRoKTtcbiAgICAgICAgICAgICAgICBkcmFnb25Cb25lLl9zZXRSYXdBc3NldCgnLmRiYmluJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShkcmFnb25Cb25lKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgc2VyaWFsaXplSlNPTik7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERyYWdvbkJvbmVzSGFuZGxlcjtcbiJdfQ==