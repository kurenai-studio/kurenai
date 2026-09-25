"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfSkeletonHandler = void 0;
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const gltf_1 = __importDefault(require("../gltf"));
const fbx_1 = __importDefault(require("../fbx"));
exports.GltfSkeletonHandler = {
    name: 'gltf-skeleton',
    // 引擎内对应的类型
    assetType: 'cc.Skeleton',
    /**
     * 允许这种类型的资源进行实例化
     */
    instantiation: '.skeleton',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const skeleton = gltfConverter.createSkeleton(asset.userData.gltfIndex);
            asset.userData.jointsLength = skeleton.joints.length;
            const serializeJSON = EditorExtends.serialize(skeleton);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.GltfSkeletonHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tlbGV0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZ2x0Zi9za2VsZXRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxxREFBcUQ7QUFFckQsdUNBQWdEO0FBRWhELG1EQUFrQztBQUNsQyxpREFBZ0M7QUFFbkIsUUFBQSxtQkFBbUIsR0FBaUI7SUFDN0MsSUFBSSxFQUFFLGVBQWU7SUFFckIsV0FBVztJQUNYLFNBQVMsRUFBRSxhQUFhO0lBRXhCOztPQUVHO0lBQ0gsYUFBYSxFQUFFLFdBQVc7SUFFMUIsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxPQUFPO1FBQ2hCOzs7Ozs7O1dBT0c7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQW1CO1lBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxjQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxHQUFHLGFBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQzFDLENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRyxNQUFNLGtDQUFpQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTFGLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFtQixDQUFDLENBQUM7WUFFbEYsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFFckQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLDJCQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBnbFRmUmVhZGVyTWFuYWdlciB9IGZyb20gJy4vcmVhZGVyLW1hbmFnZXInO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IEdsdGZIYW5kbGVyIGZyb20gJy4uL2dsdGYnO1xuaW1wb3J0IEZieEhhbmRsZXIgZnJvbSAnLi4vZmJ4JztcblxuZXhwb3J0IGNvbnN0IEdsdGZTa2VsZXRvbkhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICBuYW1lOiAnZ2x0Zi1za2VsZXRvbicsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5Ta2VsZXRvbicsXG5cbiAgICAvKipcbiAgICAgKiDlhYHorrjov5nnp43nsbvlnovnmoTotYTmupDov5vooYzlrp7kvovljJZcbiAgICAgKi9cbiAgICBpbnN0YW50aWF0aW9uOiAnLnNrZWxldG9uJyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjEnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoQgYm9vbGVhblxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJnkuIvmrKHlkK/liqjov5jkvJrph43mlrDlr7zlhaVcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgaWYgKCFhc3NldC5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdmVyc2lvbiA9IEdsdGZIYW5kbGVyLmltcG9ydGVyLnZlcnNpb247XG4gICAgICAgICAgICBpZiAoYXNzZXQucGFyZW50Lm1ldGEuaW1wb3J0ZXIgPT09ICdmYngnKSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IEZieEhhbmRsZXIuaW1wb3J0ZXIudmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGdsdGZDb252ZXJ0ZXIgPSBhd2FpdCBnbFRmUmVhZGVyTWFuYWdlci5nZXRPckNyZWF0ZShhc3NldC5wYXJlbnQgYXMgQXNzZXQsIHZlcnNpb24pO1xuXG4gICAgICAgICAgICBjb25zdCBza2VsZXRvbiA9IGdsdGZDb252ZXJ0ZXIuY3JlYXRlU2tlbGV0b24oYXNzZXQudXNlckRhdGEuZ2x0ZkluZGV4IGFzIG51bWJlcik7XG5cbiAgICAgICAgICAgIGFzc2V0LnVzZXJEYXRhLmpvaW50c0xlbmd0aCA9IHNrZWxldG9uLmpvaW50cy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShza2VsZXRvbik7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBHbHRmU2tlbGV0b25IYW5kbGVyO1xuIl19