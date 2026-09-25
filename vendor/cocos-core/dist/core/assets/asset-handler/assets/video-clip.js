"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoHandler = void 0;
const cc_1 = require("cc");
const utils_1 = require("../utils");
exports.VideoHandler = {
    name: 'video-clip',
    // assetType: js.getClassName(VideoClip),
    assetType: 'cc.VideoClip',
    importer: {
        version: '1.0.0',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            await asset.copyToLibrary(asset.extname, asset.source);
            let duration = 10;
            try {
                duration = await (0, utils_1.getMediaDuration)(asset.source);
            }
            catch (error) {
                console.error(`Loading video ${asset.source} failed, the video you are using may be in a corrupted format or not supported by the current browser version of the editor, in the latter case you can ignore this error.`);
                console.debug(error);
            }
            const video = createVideo(asset, duration);
            const serializeJSON = EditorExtends.serialize(video);
            await asset.saveToLibrary('.json', serializeJSON);
            return true;
        },
    },
};
exports.default = exports.VideoHandler;
function createVideo(asset, duration) {
    const video = new cc_1.VideoClip();
    // @ts-ignore
    duration && (video._duration = duration);
    video.name = asset.basename;
    video._setRawAsset(asset.extname);
    return video;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlkZW8tY2xpcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy92aWRlby1jbGlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLDJCQUErQjtBQUMvQixvQ0FBNEM7QUFFL0IsUUFBQSxZQUFZLEdBQWlCO0lBQ3RDLElBQUksRUFBRSxZQUFZO0lBQ2xCLHlDQUF5QztJQUN6QyxTQUFTLEVBQUUsY0FBYztJQUN6QixRQUFRLEVBQUU7UUFDTixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQztnQkFDRCxRQUFRLEdBQUcsTUFBTSxJQUFBLHdCQUFnQixFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUNULGlCQUFpQixLQUFLLENBQUMsTUFBTSw0S0FBNEssQ0FDNU0sQ0FBQztnQkFDRixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFXLENBQUM7WUFDL0QsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNsRCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsb0JBQVksQ0FBQztBQUU1QixTQUFTLFdBQVcsQ0FBQyxLQUFZLEVBQUUsUUFBaUI7SUFFaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxjQUFTLEVBQUUsQ0FBQztJQUM5QixhQUFhO0lBQ2IsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQztJQUV6QyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDNUIsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbEMsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgVmlkZW9DbGlwIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgZ2V0TWVkaWFEdXJhdGlvbiB9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNvbnN0IFZpZGVvSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIG5hbWU6ICd2aWRlby1jbGlwJyxcbiAgICAvLyBhc3NldFR5cGU6IGpzLmdldENsYXNzTmFtZShWaWRlb0NsaXApLFxuICAgIGFzc2V0VHlwZTogJ2NjLlZpZGVvQ2xpcCcsXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5jb3B5VG9MaWJyYXJ5KGFzc2V0LmV4dG5hbWUsIGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICBsZXQgZHVyYXRpb24gPSAxMDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSBhd2FpdCBnZXRNZWRpYUR1cmF0aW9uKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBMb2FkaW5nIHZpZGVvICR7YXNzZXQuc291cmNlfSBmYWlsZWQsIHRoZSB2aWRlbyB5b3UgYXJlIHVzaW5nIG1heSBiZSBpbiBhIGNvcnJ1cHRlZCBmb3JtYXQgb3Igbm90IHN1cHBvcnRlZCBieSB0aGUgY3VycmVudCBicm93c2VyIHZlcnNpb24gb2YgdGhlIGVkaXRvciwgaW4gdGhlIGxhdHRlciBjYXNlIHlvdSBjYW4gaWdub3JlIHRoaXMgZXJyb3IuYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdmlkZW8gPSBjcmVhdGVWaWRlbyhhc3NldCwgZHVyYXRpb24pO1xuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHZpZGVvKSBhcyBzdHJpbmc7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFZpZGVvSGFuZGxlcjtcblxuZnVuY3Rpb24gY3JlYXRlVmlkZW8oYXNzZXQ6IEFzc2V0LCBkdXJhdGlvbj86IG51bWJlcikge1xuXG4gICAgY29uc3QgdmlkZW8gPSBuZXcgVmlkZW9DbGlwKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGR1cmF0aW9uICYmICh2aWRlby5fZHVyYXRpb24gPSBkdXJhdGlvbik7XG5cbiAgICB2aWRlby5uYW1lID0gYXNzZXQuYmFzZW5hbWU7XG4gICAgdmlkZW8uX3NldFJhd0Fzc2V0KGFzc2V0LmV4dG5hbWUpO1xuXG4gICAgcmV0dXJuIHZpZGVvO1xufVxuIl19