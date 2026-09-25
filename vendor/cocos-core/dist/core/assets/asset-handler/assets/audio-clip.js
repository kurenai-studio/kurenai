"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const utils_1 = require("../utils");
const AudioHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'audio-clip',
    // 引擎内对应的类型
    assetType: 'cc.AudioClip',
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
            // 如果当前资源没有导入，则开始导入当前资源
            // 0 - WEBAUDIO, 1 - DOM
            asset.userData.downloadMode = 0;
            await asset.copyToLibrary(asset.extname, asset.source);
            let duration = 0;
            // 如果当前资源没有生成 audio，则开始生成 audio
            try {
                duration = await (0, utils_1.getMediaDuration)(asset.source);
            }
            catch (error) {
                console.error(error);
                console.error(`Loading audio ${asset.source} failed, the audio you are using may be in a corrupted format or not supported by the current browser version of the editor, in the latter case you can ignore this error.`);
            }
            const audio = createAudio(asset, duration);
            await asset.saveToLibrary('.json', EditorExtends.serialize(audio));
            return true;
        },
    },
};
exports.default = AudioHandler;
function createAudio(asset, duration) {
    const audio = new cc_1.AudioClip();
    // @ts-ignore
    audio._loadMode = asset.userData.downloadMode;
    // @ts-ignore
    audio._duration = duration;
    audio.name = asset.basename;
    audio._setRawAsset(asset.extname);
    return audio;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW8tY2xpcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9hdWRpby1jbGlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsMkJBQStCO0FBQy9CLG9DQUE0QztBQUU1QyxNQUFNLFlBQVksR0FBaUI7SUFDL0IsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxZQUFZO0lBRWxCLFdBQVc7SUFDWCxTQUFTLEVBQUUsY0FBYztJQUV6QixRQUFRLEVBQUU7UUFDTixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQix1QkFBdUI7WUFDdkIsd0JBQXdCO1lBQ3hCLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNoQyxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLCtCQUErQjtZQUMvQixJQUFJLENBQUM7Z0JBQ0QsUUFBUSxHQUFHLE1BQU0sSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsT0FBTyxDQUFDLEtBQUssQ0FDVCxpQkFBaUIsS0FBSyxDQUFDLE1BQU0sNEtBQTRLLENBQzVNLENBQUM7WUFDTixDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQyxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuRSxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsWUFBWSxDQUFDO0FBRTVCLFNBQVMsV0FBVyxDQUFDLEtBQVksRUFBRSxRQUFnQjtJQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLGNBQVMsRUFBRSxDQUFDO0lBQzlCLGFBQWE7SUFDYixLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO0lBQzlDLGFBQWE7SUFDYixLQUFLLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUUzQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDNUIsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbEMsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IEF1ZGlvQ2xpcCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGdldE1lZGlhRHVyYXRpb24gfSBmcm9tICcuLi91dGlscyc7XG5cbmNvbnN0IEF1ZGlvSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2F1ZGlvLWNsaXAnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuQXVkaW9DbGlwJyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahOagh+iusFxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgICAgICog5ZCO57ut55qE5LiA57O75YiX5pON5L2c6YO95LiN5Lya5omn6KGMXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5b2T5YmN6LWE5rqQ5rKh5pyJ5a+85YWl77yM5YiZ5byA5aeL5a+85YWl5b2T5YmN6LWE5rqQXG4gICAgICAgICAgICAvLyAwIC0gV0VCQVVESU8sIDEgLSBET01cbiAgICAgICAgICAgIGFzc2V0LnVzZXJEYXRhLmRvd25sb2FkTW9kZSA9IDA7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5jb3B5VG9MaWJyYXJ5KGFzc2V0LmV4dG5hbWUsIGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgICAgICAgLy8g5aaC5p6c5b2T5YmN6LWE5rqQ5rKh5pyJ55Sf5oiQIGF1ZGlv77yM5YiZ5byA5aeL55Sf5oiQIGF1ZGlvXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gYXdhaXQgZ2V0TWVkaWFEdXJhdGlvbihhc3NldC5zb3VyY2UpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICBgTG9hZGluZyBhdWRpbyAke2Fzc2V0LnNvdXJjZX0gZmFpbGVkLCB0aGUgYXVkaW8geW91IGFyZSB1c2luZyBtYXkgYmUgaW4gYSBjb3JydXB0ZWQgZm9ybWF0IG9yIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGN1cnJlbnQgYnJvd3NlciB2ZXJzaW9uIG9mIHRoZSBlZGl0b3IsIGluIHRoZSBsYXR0ZXIgY2FzZSB5b3UgY2FuIGlnbm9yZSB0aGlzIGVycm9yLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0gY3JlYXRlQXVkaW8oYXNzZXQsIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUoYXVkaW8pKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBBdWRpb0hhbmRsZXI7XG5cbmZ1bmN0aW9uIGNyZWF0ZUF1ZGlvKGFzc2V0OiBBc3NldCwgZHVyYXRpb246IG51bWJlcik6IEF1ZGlvQ2xpcCB7XG4gICAgY29uc3QgYXVkaW8gPSBuZXcgQXVkaW9DbGlwKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGF1ZGlvLl9sb2FkTW9kZSA9IGFzc2V0LnVzZXJEYXRhLmRvd25sb2FkTW9kZTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYXVkaW8uX2R1cmF0aW9uID0gZHVyYXRpb247XG5cbiAgICBhdWRpby5uYW1lID0gYXNzZXQuYmFzZW5hbWU7XG4gICAgYXVkaW8uX3NldFJhd0Fzc2V0KGFzc2V0LmV4dG5hbWUpO1xuXG4gICAgcmV0dXJuIGF1ZGlvO1xufVxuIl19