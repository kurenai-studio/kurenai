"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installEditorShim = installEditorShim;
const uuid_1 = require("../../base/utils/uuid");
const editor_shim_1 = require("../../base/editor-shim");
/**
 * 安装 Node 侧的 `global.Editor` 垫片，供项目扩展的主进程/server 代码在 CLI 里运行。
 * 仅覆盖扩展实际用到的子集（以 localization-editor 为基准），随需增长。
 * 同一会话单例：重复安装只刷新 Project.path。
 *
 * 必须在 require 任何扩展模块之前安装：扩展 bundle 在模块求值期就会访问 Editor.Project.path。
 */
function installEditorShim(ctx) {
    const g = globalThis;
    if (g.Editor && g.Editor.__cliExtensionHost) {
        (0, editor_shim_1.ensureEditorProjectPath)(ctx.projectPath);
        return;
    }
    g.Editor = {
        __cliExtensionHost: true,
        Project: {},
        Message: {
            request: (domain, message, ...args) => ctx.bus.dispatch(domain, message, ...args),
            send: (domain, message, ...args) => { void ctx.bus.dispatch(domain, message, ...args); },
            broadcast: () => { },
        },
        Profile: {
            getProject: ctx.profileStore.getProject,
            setProject: ctx.profileStore.setProject,
            removeProject: ctx.profileStore.removeProject,
            getConfig: ctx.profileStore.getConfig,
            setConfig: ctx.profileStore.setConfig,
            removeConfig: ctx.profileStore.removeConfig,
        },
        I18n: { t: (key) => key },
        Utils: {
            UUID: {
                compressUUID: (uuid, min) => (0, uuid_1.compressUUID)(uuid, !!min),
                decompressUUID: (uuid) => (0, uuid_1.decompressUUID)(uuid),
            },
        },
        Metrics: { trackEvent: () => { } },
        Panel: { open: () => { }, close: () => { } },
    };
    (0, editor_shim_1.ensureEditorProjectPath)(ctx.projectPath);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLXNoaW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L2V4dGVuc2lvbi1ob3N0L2VkaXRvci1zaGltLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0JBLDhDQWlDQztBQW5ERCxnREFBcUU7QUFDckUsd0RBQWlFO0FBVWpFOzs7Ozs7R0FNRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEdBQXNCO0lBQ3BELE1BQU0sQ0FBQyxHQUFHLFVBQWlCLENBQUM7SUFDNUIsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMxQyxJQUFBLHFDQUF1QixFQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6QyxPQUFPO0lBQ1gsQ0FBQztJQUNELENBQUMsQ0FBQyxNQUFNLEdBQUc7UUFDUCxrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLE9BQU8sRUFBRSxFQUFFO1FBQ1gsT0FBTyxFQUFFO1lBQ0wsT0FBTyxFQUFFLENBQUMsTUFBYyxFQUFFLE9BQWUsRUFBRSxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUN4RyxJQUFJLEVBQUUsQ0FBQyxNQUFjLEVBQUUsT0FBZSxFQUFFLEdBQUcsSUFBVyxFQUFFLEVBQUUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0csU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFlLENBQUM7U0FDbkM7UUFDRCxPQUFPLEVBQUU7WUFDTCxVQUFVLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVO1lBQ3ZDLFVBQVUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVU7WUFDdkMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYTtZQUM3QyxTQUFTLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTO1lBQ3JDLFNBQVMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVM7WUFDckMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsWUFBWTtTQUM5QztRQUNELElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFO1FBQ2pDLEtBQUssRUFBRTtZQUNILElBQUksRUFBRTtnQkFDRixZQUFZLEVBQUUsQ0FBQyxJQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFBLG1CQUFZLEVBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0JBQ3hFLGNBQWMsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBQSxxQkFBYyxFQUFDLElBQUksQ0FBQzthQUN6RDtTQUNKO1FBQ0QsT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFlLENBQUMsRUFBRTtRQUM5QyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBZSxDQUFDLEVBQUU7S0FDdkUsQ0FBQztJQUNGLElBQUEscUNBQXVCLEVBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb21wcmVzc1VVSUQsIGRlY29tcHJlc3NVVUlEIH0gZnJvbSAnLi4vLi4vYmFzZS91dGlscy91dWlkJztcbmltcG9ydCB7IGVuc3VyZUVkaXRvclByb2plY3RQYXRoIH0gZnJvbSAnLi4vLi4vYmFzZS9lZGl0b3Itc2hpbSc7XG5pbXBvcnQgeyBNZXNzYWdlQnVzIH0gZnJvbSAnLi9tZXNzYWdlLWJ1cyc7XG5pbXBvcnQgeyBQcm9maWxlU3RvcmUgfSBmcm9tICcuL3Byb2ZpbGUtc3RvcmUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVkaXRvclNoaW1Db250ZXh0IHtcbiAgICBwcm9qZWN0UGF0aDogc3RyaW5nO1xuICAgIGJ1czogTWVzc2FnZUJ1cztcbiAgICBwcm9maWxlU3RvcmU6IFByb2ZpbGVTdG9yZTtcbn1cblxuLyoqXG4gKiDlronoo4UgTm9kZSDkvqfnmoQgYGdsb2JhbC5FZGl0b3JgIOWeq+eJh++8jOS+m+mhueebruaJqeWxleeahOS4u+i/m+eoiy9zZXJ2ZXIg5Luj56CB5ZyoIENMSSDph4zov5DooYzjgIJcbiAqIOS7heimhuebluaJqeWxleWunumZheeUqOWIsOeahOWtkOmbhu+8iOS7pSBsb2NhbGl6YXRpb24tZWRpdG9yIOS4uuWfuuWHhu+8ie+8jOmaj+mcgOWinumVv+OAglxuICog5ZCM5LiA5Lya6K+d5Y2V5L6L77ya6YeN5aSN5a6J6KOF5Y+q5Yi35pawIFByb2plY3QucGF0aOOAglxuICpcbiAqIOW/hemhu+WcqCByZXF1aXJlIOS7u+S9leaJqeWxleaooeWdl+S5i+WJjeWuieijhe+8muaJqeWxlSBidW5kbGUg5Zyo5qih5Z2X5rGC5YC85pyf5bCx5Lya6K6/6ZeuIEVkaXRvci5Qcm9qZWN0LnBhdGjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxFZGl0b3JTaGltKGN0eDogRWRpdG9yU2hpbUNvbnRleHQpOiB2b2lkIHtcbiAgICBjb25zdCBnID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG4gICAgaWYgKGcuRWRpdG9yICYmIGcuRWRpdG9yLl9fY2xpRXh0ZW5zaW9uSG9zdCkge1xuICAgICAgICBlbnN1cmVFZGl0b3JQcm9qZWN0UGF0aChjdHgucHJvamVjdFBhdGgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGcuRWRpdG9yID0ge1xuICAgICAgICBfX2NsaUV4dGVuc2lvbkhvc3Q6IHRydWUsXG4gICAgICAgIFByb2plY3Q6IHt9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICByZXF1ZXN0OiAoZG9tYWluOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IGN0eC5idXMuZGlzcGF0Y2goZG9tYWluLCBtZXNzYWdlLCAuLi5hcmdzKSxcbiAgICAgICAgICAgIHNlbmQ6IChkb21haW46IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4geyB2b2lkIGN0eC5idXMuZGlzcGF0Y2goZG9tYWluLCBtZXNzYWdlLCAuLi5hcmdzKTsgfSxcbiAgICAgICAgICAgIGJyb2FkY2FzdDogKCkgPT4geyAvKiBuby1vcCAqLyB9LFxuICAgICAgICB9LFxuICAgICAgICBQcm9maWxlOiB7XG4gICAgICAgICAgICBnZXRQcm9qZWN0OiBjdHgucHJvZmlsZVN0b3JlLmdldFByb2plY3QsXG4gICAgICAgICAgICBzZXRQcm9qZWN0OiBjdHgucHJvZmlsZVN0b3JlLnNldFByb2plY3QsXG4gICAgICAgICAgICByZW1vdmVQcm9qZWN0OiBjdHgucHJvZmlsZVN0b3JlLnJlbW92ZVByb2plY3QsXG4gICAgICAgICAgICBnZXRDb25maWc6IGN0eC5wcm9maWxlU3RvcmUuZ2V0Q29uZmlnLFxuICAgICAgICAgICAgc2V0Q29uZmlnOiBjdHgucHJvZmlsZVN0b3JlLnNldENvbmZpZyxcbiAgICAgICAgICAgIHJlbW92ZUNvbmZpZzogY3R4LnByb2ZpbGVTdG9yZS5yZW1vdmVDb25maWcsXG4gICAgICAgIH0sXG4gICAgICAgIEkxOG46IHsgdDogKGtleTogc3RyaW5nKSA9PiBrZXkgfSxcbiAgICAgICAgVXRpbHM6IHtcbiAgICAgICAgICAgIFVVSUQ6IHtcbiAgICAgICAgICAgICAgICBjb21wcmVzc1VVSUQ6ICh1dWlkOiBzdHJpbmcsIG1pbj86IGJvb2xlYW4pID0+IGNvbXByZXNzVVVJRCh1dWlkLCAhIW1pbiksXG4gICAgICAgICAgICAgICAgZGVjb21wcmVzc1VVSUQ6ICh1dWlkOiBzdHJpbmcpID0+IGRlY29tcHJlc3NVVUlEKHV1aWQpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWV0cmljczogeyB0cmFja0V2ZW50OiAoKSA9PiB7IC8qIG5vLW9wICovIH0gfSxcbiAgICAgICAgUGFuZWw6IHsgb3BlbjogKCkgPT4geyAvKiBuby1vcCAqLyB9LCBjbG9zZTogKCkgPT4geyAvKiBuby1vcCAqLyB9IH0sXG4gICAgfTtcbiAgICBlbnN1cmVFZGl0b3JQcm9qZWN0UGF0aChjdHgucHJvamVjdFBhdGgpO1xufVxuIl19