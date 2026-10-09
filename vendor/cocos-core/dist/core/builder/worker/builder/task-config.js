"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
class TaskManager {
    static tasks = {
        dataTasks: [
            'data-task/asset',
            'data-task/script',
        ],
        // 注意先后顺序，不可随意调整，具体参考XXX（TODO）
        buildTasks: [
            // 资源处理，先脚本，后资源，资源包含 Bundle
            'build-task/script',
            'build-task/asset',
        ],
        md5Tasks: [
            // 项目处理
            'postprocess-task/suffix', // TODO 需要允许用户在 md5 注入之前修改内容
        ],
        settingTasks: [
            'setting-task/asset',
            'setting-task/script',
            'setting-task/options',
        ],
        postprocessTasks: [
            'postprocess-task/template',
        ],
    };
    static pluginTasks = {
        onBeforeBuild: 'onBeforeBuild',
        onBeforeInit: 'onBeforeInit',
        onAfterInit: 'onAfterInit',
        onBeforeBuildAssets: 'onBeforeBuildAssets',
        onAfterBuildAssets: 'onAfterBuildAssets',
        onBeforeCompressSettings: 'onBeforeCompressSettings',
        onAfterCompressSettings: 'onAfterCompressSettings',
        onAfterBuild: 'onAfterBuild',
        onBeforeCopyBuildTemplate: 'onBeforeCopyBuildTemplate',
        onAfterCopyBuildTemplate: 'onAfterCopyBuildTemplate',
        onError: 'onError',
    };
    static buildTaskMap = {
        dataTasks: [],
        settingTasks: [],
        buildTasks: [],
        md5Tasks: [],
        postprocessTasks: [],
    };
    activeTasks = new Set();
    get taskWeight() {
        return 1 / this.activeTasks.size;
    }
    // 获取某一类资源任务
    static getBuildTask(type) {
        if (!this.buildTaskMap[type]) {
            return this.buildTaskMap[type];
        }
        return this.buildTaskMap[type] = TaskManager.tasks[type].map((name) => require(`./tasks/${name}`));
    }
    static getTaskHandleFromNames(taskNames) {
        return taskNames.map((name) => require(`./tasks/${name}`));
    }
    static getCustomTaskName(name) {
        return 'custom-task' + name;
    }
    activeTask(type) {
        this.activeTasks.add(type);
        return TaskManager.getBuildTask(type);
    }
    activeCustomTask(name, taskNames) {
        const type = TaskManager.getCustomTaskName(name);
        // 自定义任务如果不可以复用缓存
        delete TaskManager.tasks[type];
        this.activeTasks.add(type);
        return TaskManager.buildTaskMap[type] = TaskManager.getTaskHandleFromNames(taskNames);
    }
}
exports.TaskManager = TaskManager;
