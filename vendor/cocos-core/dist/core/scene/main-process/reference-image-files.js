"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceImageFiles = exports.ReferenceImageFileService = void 0;
/** Node-side external-image reader used by Scene services without importing files into AssetDB. */
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const MIME_BY_EXTENSION = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
};
/** Node-only file boundary; it returns a JSON-safe data URL, never a Buffer. */
class ReferenceImageFileService {
    async readDataUrl(filePath) {
        if (typeof filePath !== 'string' || !path_1.default.isAbsolute(filePath)) {
            throw new Error('Reference image path must be absolute.');
        }
        const mime = MIME_BY_EXTENSION[path_1.default.extname(filePath).toLowerCase()];
        if (!mime) {
            throw new Error('Reference image format must be PNG, JPG, or JPEG.');
        }
        let data;
        try {
            data = await fs_1.promises.readFile(filePath);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Unable to read reference image: ${message}`);
        }
        return `data:${mime};base64,${data.toString('base64')}`;
    }
}
exports.ReferenceImageFileService = ReferenceImageFileService;
exports.referenceImageFiles = new ReferenceImageFileService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlLWltYWdlLWZpbGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvbWFpbi1wcm9jZXNzL3JlZmVyZW5jZS1pbWFnZS1maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxtR0FBbUc7QUFDbkcsMkJBQW9DO0FBQ3BDLGdEQUF3QjtBQUd4QixNQUFNLGlCQUFpQixHQUEyQjtJQUM5QyxNQUFNLEVBQUUsV0FBVztJQUNuQixNQUFNLEVBQUUsWUFBWTtJQUNwQixPQUFPLEVBQUUsWUFBWTtDQUN4QixDQUFDO0FBRUYsZ0ZBQWdGO0FBQ2hGLE1BQWEseUJBQXlCO0lBQ2xDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBZ0I7UUFDOUIsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxjQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDN0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFDRCxJQUFJLElBQVksQ0FBQztRQUNqQixJQUFJLENBQUM7WUFDRCxJQUFJLEdBQUcsTUFBTSxhQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsTUFBTSxPQUFPLEdBQUcsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUNELE9BQU8sUUFBUSxJQUFJLFdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO0lBQzVELENBQUM7Q0FDSjtBQWxCRCw4REFrQkM7QUFFWSxRQUFBLG1CQUFtQixHQUFHLElBQUkseUJBQXlCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBOb2RlLXNpZGUgZXh0ZXJuYWwtaW1hZ2UgcmVhZGVyIHVzZWQgYnkgU2NlbmUgc2VydmljZXMgd2l0aG91dCBpbXBvcnRpbmcgZmlsZXMgaW50byBBc3NldERCLiAqL1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB0eXBlIHsgSVJlZmVyZW5jZUltYWdlRmlsZVNlcnZpY2UgfSBmcm9tICcuLi9jb21tb24vcmVmZXJlbmNlLWltYWdlJztcblxuY29uc3QgTUlNRV9CWV9FWFRFTlNJT046IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgJy5wbmcnOiAnaW1hZ2UvcG5nJyxcbiAgICAnLmpwZyc6ICdpbWFnZS9qcGVnJyxcbiAgICAnLmpwZWcnOiAnaW1hZ2UvanBlZycsXG59O1xuXG4vKiogTm9kZS1vbmx5IGZpbGUgYm91bmRhcnk7IGl0IHJldHVybnMgYSBKU09OLXNhZmUgZGF0YSBVUkwsIG5ldmVyIGEgQnVmZmVyLiAqL1xuZXhwb3J0IGNsYXNzIFJlZmVyZW5jZUltYWdlRmlsZVNlcnZpY2UgaW1wbGVtZW50cyBJUmVmZXJlbmNlSW1hZ2VGaWxlU2VydmljZSB7XG4gICAgYXN5bmMgcmVhZERhdGFVcmwoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGlmICh0eXBlb2YgZmlsZVBhdGggIT09ICdzdHJpbmcnIHx8ICFwYXRoLmlzQWJzb2x1dGUoZmlsZVBhdGgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZmVyZW5jZSBpbWFnZSBwYXRoIG11c3QgYmUgYWJzb2x1dGUuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWltZSA9IE1JTUVfQllfRVhURU5TSU9OW3BhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKV07XG4gICAgICAgIGlmICghbWltZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWZlcmVuY2UgaW1hZ2UgZm9ybWF0IG11c3QgYmUgUE5HLCBKUEcsIG9yIEpQRUcuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRhdGE6IEJ1ZmZlcjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlUGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmVhZCByZWZlcmVuY2UgaW1hZ2U6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYGRhdGE6JHttaW1lfTtiYXNlNjQsJHtkYXRhLnRvU3RyaW5nKCdiYXNlNjQnKX1gO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHJlZmVyZW5jZUltYWdlRmlsZXMgPSBuZXcgUmVmZXJlbmNlSW1hZ2VGaWxlU2VydmljZSgpO1xuIl19