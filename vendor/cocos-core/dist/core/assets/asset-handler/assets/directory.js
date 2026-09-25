'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const InternalBundleName = ['internal', 'resources', 'main'];
const DirectoryHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'directory',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.2.0',
        /**
         * 实际导入流程
         * @param asset
         */
        async import(asset) {
            const userData = asset.userData;
            const url = (0, asset_db_1.queryUrl)(asset.uuid);
            if (url === 'db://assets/resources') {
                userData.isBundle = true;
                userData.bundleConfigID = userData.bundleConfigID ?? 'default';
                userData.bundleName = 'resources';
                userData.priority = 8;
            }
            return true;
        },
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newFolder',
                    fullFileName: 'folder',
                    name: 'default',
                },
            ];
        },
        async create(option) {
            (0, fs_extra_1.ensureDirSync)(option.target);
            return option.target;
        },
    },
    async validate(asset) {
        return asset.isDirectory();
    },
};
exports.default = DirectoryHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2RpcmVjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWIsOENBQWdFO0FBR2hFLHVDQUF5QztBQUV6QyxNQUFNLGtCQUFrQixHQUFHLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUU3RCxNQUFNLGdCQUFnQixHQUFpQjtJQUNuQyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLFdBQVc7SUFDakIsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxPQUFPO1FBQ2hCOzs7V0FHRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBMkI7WUFDcEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQWtDLENBQUM7WUFDMUQsTUFBTSxHQUFHLEdBQUcsSUFBQSxtQkFBUSxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLEdBQUcsS0FBSyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNsQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDekIsUUFBUSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQztnQkFDL0QsUUFBUSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUM7Z0JBQ2xDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7SUFFRCxVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSw4QkFBOEI7b0JBQ3JDLFlBQVksRUFBRSxRQUFRO29CQUN0QixJQUFJLEVBQUUsU0FBUztpQkFDbEI7YUFDSixDQUFDO1FBQ04sQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUNmLElBQUEsd0JBQWEsRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3pCLENBQUM7S0FDSjtJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBWTtRQUN2QixPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0NBQ0osQ0FBQztBQUNGLGtCQUFlLGdCQUFnQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldCwgcXVlcnlVcmwsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IERpcmVjdG9yeUFzc2V0VXNlckRhdGEgfSBmcm9tICcuLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcbmltcG9ydCB7IGVuc3VyZURpclN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5cbmNvbnN0IEludGVybmFsQnVuZGxlTmFtZSA9IFsnaW50ZXJuYWwnLCAncmVzb3VyY2VzJywgJ21haW4nXTtcblxuY29uc3QgRGlyZWN0b3J5SGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2RpcmVjdG9yeScsXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjIuMCcsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIERpcmVjdG9yeUFzc2V0VXNlckRhdGE7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBxdWVyeVVybChhc3NldC51dWlkKTtcbiAgICAgICAgICAgIGlmICh1cmwgPT09ICdkYjovL2Fzc2V0cy9yZXNvdXJjZXMnKSB7XG4gICAgICAgICAgICAgICAgdXNlckRhdGEuaXNCdW5kbGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHVzZXJEYXRhLmJ1bmRsZUNvbmZpZ0lEID0gdXNlckRhdGEuYnVuZGxlQ29uZmlnSUQgPz8gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgICAgIHVzZXJEYXRhLmJ1bmRsZU5hbWUgPSAncmVzb3VyY2VzJztcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5wcmlvcml0eSA9IDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld0ZvbGRlcicsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogJ2ZvbGRlcicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBjcmVhdGUob3B0aW9uKSB7XG4gICAgICAgICAgICBlbnN1cmVEaXJTeW5jKG9wdGlvbi50YXJnZXQpO1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbi50YXJnZXQ7XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGFzeW5jIHZhbGlkYXRlKGFzc2V0OiBBc3NldCkge1xuICAgICAgICByZXR1cm4gYXNzZXQuaXNEaXJlY3RvcnkoKTtcbiAgICB9LFxufTtcbmV4cG9ydCBkZWZhdWx0IERpcmVjdG9yeUhhbmRsZXI7XG4iXX0=