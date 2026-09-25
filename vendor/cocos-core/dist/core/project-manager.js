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
exports.projectManager = void 0;
/**
 * 项目管理器，提供打开项目、创建项目的入口
 */
class ProjectManager {
    _currentLauncher = null;
    /**
     * 查询所有项目模板，用于创建的命令行选项显示
     * @returns
     */
    queryTemplates() {
        // TODO
    }
    /**
     * 创建一个项目
     * @param projectPath
     * @param type
     * @returns
     */
    async create(projectPath, type = '3d', template) {
        const { Project } = await Promise.resolve().then(() => __importStar(require('./project/script')));
        // TODO 支持模板后，Project 模块，无需支持空项目的创建了，都由管理器拷贝模板
        return await Project.create(projectPath, type);
    }
    /**
     * 打开某个项目
     * @param path
     */
    async open(path) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('./launcher')));
        const projectLauncher = new Launcher(path);
        await projectLauncher.startup();
        this._currentLauncher = projectLauncher;
    }
    async close() {
        if (!this._currentLauncher) {
            throw new Error('No project is open');
        }
        await this._currentLauncher.close();
        this._currentLauncher = null;
    }
}
exports.projectManager = new ProjectManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvcmUvcHJvamVjdC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBOztHQUVHO0FBQ0gsTUFBTSxjQUFjO0lBRVIsZ0JBQWdCLEdBQW9CLElBQUksQ0FBQztJQUVqRDs7O09BR0c7SUFDSCxjQUFjO1FBQ1YsT0FBTztJQUNYLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBbUIsRUFBRSxPQUFvQixJQUFJLEVBQUUsUUFBaUI7UUFDekUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7UUFDckQsOENBQThDO1FBQzlDLE9BQU8sTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFZO1FBQ25CLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsd0RBQWEsWUFBWSxHQUFDLENBQUM7UUFDekQsTUFBTSxlQUFlLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsTUFBTSxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztJQUM1QyxDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQUs7UUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0lBQ2pDLENBQUM7Q0FDSjtBQUVZLFFBQUEsY0FBYyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSBMYXVuY2hlciBmcm9tICcuL2xhdW5jaGVyJztcbmltcG9ydCB7IFByb2plY3RUeXBlIH0gZnJvbSAnLi9wcm9qZWN0L0B0eXBlcy9wdWJsaWMnO1xuXG4vKipcbiAqIOmhueebrueuoeeQhuWZqO+8jOaPkOS+m+aJk+W8gOmhueebruOAgeWIm+W7uumhueebrueahOWFpeWPo1xuICovXG5jbGFzcyBQcm9qZWN0TWFuYWdlciB7XG5cbiAgICBwcml2YXRlIF9jdXJyZW50TGF1bmNoZXI6IExhdW5jaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LmiYDmnInpobnnm67mqKHmnb/vvIznlKjkuo7liJvlu7rnmoTlkb3ku6TooYzpgInpobnmmL7npLpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBxdWVyeVRlbXBsYXRlcygpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuS4gOS4qumhueebrlxuICAgICAqIEBwYXJhbSBwcm9qZWN0UGF0aCBcbiAgICAgKiBAcGFyYW0gdHlwZSBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGUocHJvamVjdFBhdGg6IHN0cmluZywgdHlwZTogUHJvamVjdFR5cGUgPSAnM2QnLCB0ZW1wbGF0ZT86IHN0cmluZykge1xuICAgICAgICBjb25zdCB7IFByb2plY3QgfSA9IGF3YWl0IGltcG9ydCgnLi9wcm9qZWN0L3NjcmlwdCcpO1xuICAgICAgICAvLyBUT0RPIOaUr+aMgeaooeadv+WQju+8jFByb2plY3Qg5qih5Z2X77yM5peg6ZyA5pSv5oyB56m66aG555uu55qE5Yib5bu65LqG77yM6YO955Sx566h55CG5Zmo5ou36LSd5qih5p2/XG4gICAgICAgIHJldHVybiBhd2FpdCBQcm9qZWN0LmNyZWF0ZShwcm9qZWN0UGF0aCwgdHlwZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5omT5byA5p+Q5Liq6aG555uuXG4gICAgICogQHBhcmFtIHBhdGhcbiAgICAgKi9cbiAgICBhc3luYyBvcGVuKHBhdGg6IHN0cmluZykge1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IExhdW5jaGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4vbGF1bmNoZXInKTtcbiAgICAgICAgY29uc3QgcHJvamVjdExhdW5jaGVyID0gbmV3IExhdW5jaGVyKHBhdGgpO1xuICAgICAgICBhd2FpdCBwcm9qZWN0TGF1bmNoZXIuc3RhcnR1cCgpO1xuICAgICAgICB0aGlzLl9jdXJyZW50TGF1bmNoZXIgPSBwcm9qZWN0TGF1bmNoZXI7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICghdGhpcy5fY3VycmVudExhdW5jaGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHByb2plY3QgaXMgb3BlbicpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuX2N1cnJlbnRMYXVuY2hlci5jbG9zZSgpO1xuICAgICAgICB0aGlzLl9jdXJyZW50TGF1bmNoZXIgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHByb2plY3RNYW5hZ2VyID0gbmV3IFByb2plY3RNYW5hZ2VyKCk7XG4iXX0=