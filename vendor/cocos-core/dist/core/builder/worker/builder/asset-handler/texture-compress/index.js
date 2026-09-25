"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureCompress = void 0;
exports.previewCompressImage = previewCompressImage;
exports.queryCompressCache = queryCompressCache;
exports.queryAllCompressConfig = queryAllCompressConfig;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const minimaps_1 = require("./minimaps");
const compress_tool_1 = require("./compress-tool");
const cc_1 = require("cc");
const asset_library_1 = require("../../manager/asset-library");
const utils_1 = require("./utils");
const stream_1 = require("stream");
const os_1 = require("os");
const numCPUs = (0, os_1.cpus)().length;
const sharp_1 = __importDefault(require("sharp"));
const lodash_1 = __importDefault(require("lodash"));
const utils_2 = require("../../../../share/utils");
const console_1 = require("../../../../../base/console");
const plugin_1 = require("../../../../manager/plugin");
const texture_compress_1 = require("../../../../share/texture-compress");
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
class TextureCompress extends stream_1.EventEmitter {
    _taskMap = {};
    platform;
    static overwriteFormats = {};
    static _presetIdToCompressOption = {};
    static allTextureCompressConfig;
    static userCompressConfig;
    static compressCacheDir = (0, path_1.join)(builder_config_1.default.projectRoot, 'temp', 'builder', 'CompressTexture');
    static storedCompressInfo = {};
    static storedCompressInfoPath = (0, path_1.join)(TextureCompress.compressCacheDir, 'compress-info.json');
    static enableMipMaps = false;
    _waitingCompressQueue = new Set();
    _compressAssetLen = 0;
    _compressExecuteInfo = null;
    textureCompress;
    constructor(platform, textureCompress) {
        super();
        this.platform = platform;
        this.textureCompress = textureCompress ?? true;
    }
    static async initCommonOptions() {
        TextureCompress.allTextureCompressConfig = await queryAllCompressConfig();
        if ((0, fs_extra_1.existsSync)(TextureCompress.storedCompressInfoPath)) {
            TextureCompress.storedCompressInfo = (0, fs_extra_1.readJsonSync)(TextureCompress.storedCompressInfoPath);
        }
        else {
            TextureCompress.storedCompressInfo = {};
        }
        TextureCompress.enableMipMaps = !!(await builder_config_1.default.getProject('textureCompressConfig.genMipmaps'));
    }
    async init() {
        await this.updateUserConfig();
    }
    /**
     * 更新缓存的纹理压缩项目配置
     */
    async updateUserConfig() {
        await TextureCompress.initCommonOptions();
        // 查询纹理压缩配置等
        TextureCompress.userCompressConfig = await builder_config_1.default.getProject('textureCompressConfig');
        const { customConfigs } = TextureCompress.userCompressConfig;
        // 收集目前已有配置内会覆盖现有格式的配置集合
        const overwriteFormats = {};
        if (customConfigs && Object.values(customConfigs).length) {
            Object.values(customConfigs).forEach((formatConfig) => {
                if (formatConfig.overwrite) {
                    overwriteFormats[formatConfig.format] = formatConfig.id;
                    console.debug(`compress format (${formatConfig.format}) will be overwritten by custom compress ${formatConfig.id}(${formatConfig.name})`);
                }
            });
        }
        TextureCompress.overwriteFormats = overwriteFormats;
        TextureCompress._presetIdToCompressOption = {};
    }
    static queryTextureCompressCache(uuid) {
        return TextureCompress.storedCompressInfo[uuid];
    }
    /**
     * 根据资源信息返回资源的纹理压缩任务，无压缩任务的返回 null
     * @param assetInfo
     * @returns IImageTaskInfo | null
     */
    addTask(uuid, task) {
        if (this._taskMap[uuid]) {
            Object.assign(this._taskMap[uuid], task);
        }
        else {
            this._taskMap[uuid] = task;
        }
        return this._taskMap[uuid];
    }
    /**
     * 根据 Image 信息添加资源的压缩任务
     * @param assetInfo （不支持自动图集）
     * @returns
     */
    addTaskWithAssetInfo(assetInfo) {
        if (this._taskMap[assetInfo.uuid]) {
            return this._taskMap[assetInfo.uuid];
        }
        // 自动图集无法直接通过 assetInfo 获取到正确的压缩任务
        if (assetInfo.meta.importer === 'auto-atlas') {
            return;
        }
        const task = this.genTaskInfoFromAssetInfo(assetInfo);
        if (!task) {
            return;
        }
        this._taskMap[assetInfo.uuid] = task;
        return task;
    }
    /**
     * 根据图集或者 Image 资源信息返回资源的纹理压缩任务，无压缩任务的返回 null
     */
    genTaskInfoFromAssetInfo(assetInfo) {
        if (this._taskMap[assetInfo.uuid]) {
            return this._taskMap[assetInfo.uuid];
        }
        const compressSettings = assetInfo.meta.userData.compressSettings;
        if (!compressSettings || !compressSettings.useCompressTexture) {
            return null;
        }
        // 判断资源是否存在
        let extName = assetInfo.extname;
        if (!assetInfo.meta.files.includes(extName)) {
            // HACK 此处假定了每张图导入后如果改了后缀一定是转成 png / jpg 等，但目前没有好的方式得知这个信息
            extName = assetInfo.meta.files.find((fileExtName) => ['.png', '.jpg'].includes(fileExtName)) || '.png';
        }
        const src = assetInfo.library + extName;
        if (assetInfo.meta.importer !== 'auto-atlas' && !src) {
            console.warn(`genTaskInfoFromAssetInfo failed ! Image asset does not exist: ${assetInfo.source}`);
            return;
        }
        const compressOptions = this.getCompressOptions(compressSettings.presetId);
        if (!compressOptions) {
            return;
        }
        return {
            src,
            presetId: compressSettings.presetId,
            compressOptions,
            hasAlpha: assetInfo.meta.userData.hasAlpha,
            mtime: asset_library_1.buildAssetLibrary.getAssetProperty(assetInfo, 'mtime'),
            hasMipmaps: TextureCompress.enableMipMaps ? (0, minimaps_1.checkHasMipMaps)(assetInfo.meta) : false,
            dest: [],
            suffix: [],
        };
    }
    /**
     * 根据纹理压缩配置 id 获取对应的纹理压缩选项
     * @param presetId
     * @returns Record<string, number | string> | null
     */
    getCompressOptions(presetId) {
        if (TextureCompress._presetIdToCompressOption[presetId]) {
            return TextureCompress._presetIdToCompressOption[presetId];
        }
        const { userPreset, defaultConfig, customConfigs } = TextureCompress.userCompressConfig;
        const { platformConfig, customFormats } = TextureCompress.allTextureCompressConfig;
        if (!platformConfig[this.platform]) {
            return null;
        }
        const textureCompressConfig = platformConfig[this.platform].textureCompressConfig;
        if (!textureCompressConfig) {
            return null;
        }
        const platformType = textureCompressConfig.platformType;
        const config = userPreset[presetId] || defaultConfig[presetId] || defaultConfig.default;
        if (!config || (!config.options[platformType] && (!config.overwrite || !config.overwrite[this.platform]))) {
            console.debug(`Invalid compress task: ${JSON.stringify(config)}`);
            return null;
        }
        let compressOptions = {};
        if (config.overwrite && config.overwrite[this.platform]) {
            compressOptions = config.overwrite[this.platform];
        }
        else {
            const support = textureCompressConfig.support;
            // const suffixMap: Record<string, string> = {};
            Object.keys(config.options[platformType]).forEach((format) => {
                const formats = [...support.rgba, ...support.rgb];
                if (formats.includes(format) || Object.keys(customFormats).includes(format)) {
                    compressOptions[format] = JSON.parse(JSON.stringify(config.options[platformType][format]));
                    // suffixMap[format] = textureFormatConfigs[formatsInfo[format].formatType].suffix;
                }
            });
        }
        // 收集目前已有配置内会覆盖现有格式的配置集合
        const overwriteFormats = {};
        if (customConfigs && Object.values(customConfigs).length) {
            Object.values(customConfigs).forEach((formatConfig) => {
                if (formatConfig.overwrite) {
                    overwriteFormats[formatConfig.format] = formatConfig.id;
                    console.debug(`compress format (${formatConfig.format}) will be overwritten by custom compress ${formatConfig.id}(${formatConfig.name})`);
                }
            });
        }
        Object.keys(overwriteFormats).forEach((format) => {
            if (compressOptions[format]) {
                compressOptions[overwriteFormats[format]] = compressOptions[format];
                delete compressOptions[format];
            }
        });
        if (!Object.keys(compressOptions).length) {
            return null;
        }
        TextureCompress._presetIdToCompressOption[presetId] = compressOptions;
        return compressOptions;
    }
    /**
     * 查询某个指定 uuid 资源的纹理压缩任务
     * @param uuid
     * @returns
     */
    queryTask(uuid) {
        return this._taskMap[uuid];
    }
    removeTask(uuid) {
        delete this._taskMap[uuid];
    }
    /**
     * 执行所有纹理压缩任务，支持限定任务，否则将执行收集的所有纹理压缩任务
     */
    async run(taskMap = this._taskMap) {
        const { customConfigs } = TextureCompress.userCompressConfig;
        // 1. 整理纹理压缩任务
        const compressQueue = await this.sortImageTask(taskMap);
        console.debug(`Num of all image compress task ${Object.keys(taskMap).length}, really: ${this._compressAssetLen}, configTasks: ${compressQueue.length}`);
        if (!compressQueue.length) {
            console.debug('No image need to compress');
            return;
        }
        const compressQueueCopy = JSON.parse(JSON.stringify(compressQueue));
        // 2. 优先执行构建自定义纹理压缩钩子函数，此流程会修改 compressQueueCopy 内的任务数量，需要深拷贝
        const customHandlerInfos = plugin_1.pluginManager.getAssetHandlers('compressTextures');
        if (customHandlerInfos.pkgNameOrder.length) {
            this.emit('update-progress', 'start compress custom compress hooks...');
            console_1.newConsole.trackTimeStart('builder:custom-compress-texture');
            await this.customCompressImage(compressQueueCopy, customHandlerInfos);
            await console_1.newConsole.trackTimeEnd('builder:custom-compress-texture', { output: true });
            console.debug(`custom compress ${compressQueue.length - compressQueueCopy.length} / ${compressQueue.length}`);
        }
        if (compressQueueCopy.length) {
            this._waitingCompressQueue = new Set(compressQueueCopy);
            console_1.newConsole.trackTimeStart('builder:compress-texture');
            // 5. 处理实际需要压缩的纹理任务
            await this.executeCompressQueue();
            const time = await console_1.newConsole.trackTimeEnd('builder:compress-texture', { output: true });
            console.debug(`builder:compress-texture: ${(0, utils_2.formatMSTime)(time)}`);
        }
        // 6. 填充压缩后的路径到 info 内
        await Promise.all(compressQueue.map(async (config) => {
            if ((0, fs_extra_1.existsSync)(config.dest)) {
                taskMap[config.uuid].dest.push(config.dest);
                taskMap[config.uuid].suffix.push(config.suffix);
            }
            else {
                console.error(`texture compress task width asset ${config.uuid}, format: ${config.format} failed!`);
            }
        }));
        // 存储纹理压缩缓存信息
        await (0, fs_extra_1.outputJSON)(TextureCompress.storedCompressInfoPath, TextureCompress.storedCompressInfo);
        console.debug(`Num of sorted image asset: ${Object.keys(taskMap).length}`);
        return taskMap;
    }
    /**
     * 筛选整理压缩任务中缓存失效的实际需要压缩的任务队列
     * @param taskMap
     * @returns
     */
    async sortImageTask(taskMap) {
        const compressQueue = [];
        const { textureFormatConfigs, formatsInfo } = TextureCompress.allTextureCompressConfig;
        const { customConfigs } = TextureCompress.userCompressConfig;
        // 记录格式的压缩数量
        const collectFormatNum = {};
        for (const uuid of Object.keys(taskMap)) {
            const info = taskMap[uuid];
            const compressOptions = info.compressOptions;
            let mipmapFiles = [];
            if (info.hasMipmaps && TextureCompress.enableMipMaps) {
                try {
                    // TODO mipmap file 需要缓存机制管理
                    const files = await (0, minimaps_1.genMipmapFiles)(info.src, asset_library_1.buildAssetLibrary.getAssetTempDirByUuid(uuid));
                    if (!files.length) {
                        continue;
                    }
                    mipmapFiles = files;
                }
                catch (error) {
                    if (error instanceof Error) {
                        error.message = `{asset(${uuid})}` + error.message;
                    }
                    console.warn(error);
                    continue;
                }
            }
            const formats = Object.keys(compressOptions);
            const assetCustomConfigs = {};
            formats.forEach((format) => customConfigs[format] && (assetCustomConfigs[format] = customConfigs[format]));
            const newCompressInfo = { option: { mtime: info.mtime, src: info.src, compressOptions }, mipmapFiles, customConfigs: assetCustomConfigs };
            const dirty = !lodash_1.default.isEqual(TextureCompress.storedCompressInfo[uuid] && TextureCompress.storedCompressInfo[uuid].option, newCompressInfo.option);
            info.dest = [];
            info.dirty = dirty;
            info.suffix = [];
            let hasCompressConfig = false;
            Object.keys(compressOptions).forEach((format) => {
                let realFormat = format;
                if (TextureCompress.userCompressConfig.customConfigs[format]) {
                    realFormat = TextureCompress.userCompressConfig.customConfigs[format].format;
                }
                const formatType = formatsInfo[realFormat]?.formatType;
                if (!formatType) {
                    console.error(`Invalid format ${format}`);
                    return;
                }
                const cacheDest = (0, path_1.join)(TextureCompress.compressCacheDir, uuid.substr(0, 2), uuid + textureFormatConfigs[formatType].suffix);
                if (this.textureCompress && !dirty && (0, fs_extra_1.existsSync)(cacheDest)) {
                    info.dest.push(cacheDest);
                    info.suffix.push((0, utils_1.getSuffix)(formatsInfo[realFormat], textureFormatConfigs[formatType].suffix));
                    console.debug(`Use cache compress image of {Asset(${uuid})} ({link(${cacheDest})})`);
                    return;
                }
                info.dirty = true;
                if (TextureCompress.userCompressConfig.customConfigs[format]) {
                    // [自定义纹理压缩统计] 1.收集统计所需数据（自定义配置被使用次数）
                    increaseCustomCompressNum(TextureCompress.userCompressConfig.customConfigs[format]);
                }
                hasCompressConfig = true;
                compressQueue.push({
                    format,
                    src: info.src,
                    dest: cacheDest,
                    compressOptions: compressOptions[format],
                    customConfig: customConfigs[format],
                    uuid,
                    mipmapFiles,
                    suffix: (0, utils_1.getSuffix)(formatsInfo[realFormat], textureFormatConfigs[formatType].suffix),
                    formatType,
                });
                collectFormatNum[formatType] = (collectFormatNum[formatType] || 0) + 1;
            });
            if (hasCompressConfig) {
                this._compressAssetLen++;
            }
            newCompressInfo.dest = info.dest;
            TextureCompress.storedCompressInfo[uuid] = newCompressInfo;
        }
        console.debug(`sort compress task ${JSON.stringify(collectFormatNum)}`);
        return compressQueue;
    }
    executeCompressQueue() {
        if (!this._waitingCompressQueue.size) {
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                this._compressExecuteInfo = {
                    reject,
                    resolve,
                    state: 'progress',
                    busyFormatType: {},
                    busyAsset: new Set(),
                    complete: 0,
                    total: this._waitingCompressQueue.size,
                    childProcess: 0,
                };
                this.emit('update-progress', `start compress task 0 / ${this._waitingCompressQueue.size}`);
                // 由于资源文件并发会有权限问题，压缩任务至多并发数 <= 压缩任务里的总资源数量
                for (let i = 0; i < this._compressAssetLen; i++) {
                    const nextTask = this._getNextTask();
                    nextTask && (this._compressImage(nextTask).catch((error) => {
                        reject(error);
                    }));
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    _getNextTask() {
        for (const task of this._waitingCompressQueue.values()) {
            // TODO 小优化，其实加了核心数限制后，有可能遇到下一次获取任务时拿到了因为 busyAsset 导致延后的 sharp 任务，此时其实可以连续启动两个任务
            if (this._checkTaskCanExecute(task)) {
                return task;
            }
        }
        return null;
    }
    _checkTaskCanExecute(taskConfig) {
        const { busyAsset, busyFormatType } = this._compressExecuteInfo;
        if (busyAsset.has(taskConfig.uuid)) {
            return false;
        }
        if (busyFormatType[taskConfig.formatType] && !TextureCompress.allTextureCompressConfig.textureFormatConfigs[taskConfig.formatType].parallelism) {
            // 检查当前格式是否支持并行
            return false;
        }
        return true;
    }
    async _compressImage(config) {
        const { busyAsset, busyFormatType, total, childProcess } = this._compressExecuteInfo;
        const useChildProcess = TextureCompress.allTextureCompressConfig.textureFormatConfigs[config.formatType].childProcess;
        if (useChildProcess) {
            if (childProcess > numCPUs) {
                console.debug(`${config.formatType} wait for child process ${childProcess}`);
                // 超过最大进程数，需要等待
                return;
            }
            this._compressExecuteInfo.childProcess++;
        }
        let oldValue = busyFormatType[config.formatType];
        if (oldValue && oldValue > 0) {
            if (!TextureCompress.allTextureCompressConfig.textureFormatConfigs[config.formatType].parallelism) {
                return;
            }
            busyFormatType[config.formatType] = ++oldValue;
        }
        else {
            busyFormatType[config.formatType] = 1;
        }
        busyAsset.add(config.uuid);
        this.emit('update-progress', `execute compress task ${this._compressExecuteInfo.complete}/${total}, ${busyAsset.size} in progress`);
        this._waitingCompressQueue.delete(config);
        try {
            await this.compressImageByConfig(config);
        }
        catch (error) {
            console.error(error);
        }
        useChildProcess && (this._compressExecuteInfo.childProcess--);
        busyAsset.delete(config.uuid);
        busyFormatType[config.formatType] = --busyFormatType[config.formatType];
        this._compressExecuteInfo.complete++;
        await this._step();
    }
    /**
     * 检查压缩任务是否已经完成，如未完成，则继续执行剩下的任务
     * @returns
     */
    async _step() {
        if (this._waitingCompressQueue.size) {
            const nextTask = this._getNextTask();
            nextTask && this._compressImage(nextTask);
            return;
        }
        // 进入检查任务是否全部完成
        const { busyAsset, resolve } = this._compressExecuteInfo;
        if (!busyAsset.size) {
            return resolve();
        }
    }
    async customCompressImage(compressQueue, infos) {
        for (let i = 0; i < infos.pkgNameOrder.length; i++) {
            const pkgName = infos.pkgNameOrder[i];
            const handler = infos.handles[pkgName];
            if (!handler) {
                continue;
            }
            try {
                console.debug(`Start custom compress(${pkgName})`);
                // 实际需要压缩的纹理任务
                await handler(compressQueue);
            }
            catch (error) {
                console.error(error);
                console.error(`Custom Compress (${pkgName}) failed!`);
            }
        }
    }
    async compressImageByConfig(optionItem) {
        const { dest } = optionItem;
        let src = optionItem.src;
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(dest));
        try {
            if (optionItem.compressOptions.quality === 100 && (0, path_1.extname)(optionItem.src).endsWith(optionItem.format)) {
                console.log(`${optionItem.format} with quality is 100, will copy the image from ${optionItem.src} to ${optionItem.dest}`);
                await (0, fs_extra_1.copy)(optionItem.src, optionItem.dest, { overwrite: true });
                return;
            }
        }
        catch (error) {
            console.warn(error);
        }
        if ((0, path_1.extname)(src) === '.webp') {
            const image = (0, sharp_1.default)(src);
            src = src.replace('webp', 'png');
            await image.toFile(src);
        }
        let compressFunc;
        // 自定义压缩流程
        if (optionItem.customConfig) {
            try {
                console.debug(`start custom compress config ${optionItem.format}(${optionItem.customConfig.name})`);
                await (0, compress_tool_1.compressCustomFormat)({
                    ...optionItem,
                    src,
                });
                console.debug('Custom compress config', `${optionItem.format}(${optionItem.customConfig.name})`, 'sucess');
                return;
            }
            catch (error) {
                console.warn(`Compress {asset(${optionItem.uuid})} with custom config failed!`);
                console.warn(error);
                // 自定义纹理压缩失败后，回退成默认的压缩格式
                compressFunc = (0, compress_tool_1.getCompressFunc)(optionItem.customConfig.format);
                if (!compressFunc) {
                    console.warn(`Invalid format ${optionItem.customConfig.format}`);
                    return;
                }
            }
        }
        compressFunc = compressFunc || (0, compress_tool_1.getCompressFunc)(optionItem.format);
        if (!compressFunc) {
            console.warn(`Invalid format ${optionItem.format}`);
            return;
        }
        // 正常压缩流程
        await compressFunc({
            ...optionItem,
            src,
        });
        // 依赖第三方工具的纹理压缩格式才需要依赖构建生成
        if (TextureCompress.enableMipMaps) {
            try {
                const files = await (0, minimaps_1.compressMipmapFiles)({
                    ...optionItem,
                    src,
                }, compressFunc);
                if (files.length) {
                    files.splice(0, 0, (0, fs_extra_1.readFileSync)(optionItem.dest));
                    const data = cc_1.ImageAsset.mergeCompressedTextureMips(files);
                    await (0, fs_extra_1.outputFile)(optionItem.dest, data);
                }
            }
            catch (error) {
                console.error(error);
                await (0, fs_extra_1.remove)(optionItem.dest);
                console.error(`Generate {asset(${optionItem.uuid})} compress texture mipmap files failed!`);
            }
        }
        try {
            // 注意： 需要使用 optionItem.src 判断，src 变量可能被修改
            if ((0, path_1.extname)(optionItem.src).endsWith(optionItem.format)) {
                const srcState = await (0, fs_extra_1.stat)(optionItem.src);
                const destState = await (0, fs_extra_1.stat)(optionItem.dest);
                if (destState.size > srcState.size) {
                    console.log(`The compressed image(${optionItem.dest}) size(${destState.size}) is larger than the original image(${optionItem.src}) size(${srcState.size}), and the original image will be used. To ignore this protection mechanism, please configure it in Project Settings -> Texture Compression Configuration.`);
                    await (0, fs_extra_1.copy)(optionItem.src, optionItem.dest, { overwrite: true });
                }
            }
        }
        catch (error) {
            console.warn(error);
        }
    }
}
exports.TextureCompress = TextureCompress;
async function previewCompressImage(assetUuid, platform = 'web-mobile') {
    const defaultCompressManager = new TextureCompress(platform, true);
    await defaultCompressManager.init();
    const assetInfo = asset_library_1.buildAssetLibrary.getAsset(assetUuid);
    const task = defaultCompressManager.addTaskWithAssetInfo(assetInfo);
    if (!task) {
        return;
    }
    await defaultCompressManager.run();
    return task;
}
async function queryCompressCache(uuid) {
    await TextureCompress.initCommonOptions();
    return TextureCompress.queryTextureCompressCache(uuid);
}
function increaseCustomCompressNum(config) {
    if (!config) {
        return;
    }
    if (!config.num) {
        config.num = 0;
    }
    config.num++;
}
async function queryAllCompressConfig() {
    const customConfig = await builder_config_1.default.getProject('textureCompressConfig.customConfigs');
    const customFormats = {};
    if (customConfig && Object.keys(customConfig).length) {
        for (const config of Object.values(customConfig)) {
            customFormats[config.id] = {
                ...texture_compress_1.formatsInfo[config.format],
                displayName: config.name,
                value: config.id,
                custom: true,
            };
        }
    }
    return {
        defaultSupport: texture_compress_1.defaultSupport,
        configGroups: texture_compress_1.configGroups,
        textureFormatConfigs: texture_compress_1.textureFormatConfigs,
        formatsInfo: {
            ...texture_compress_1.formatsInfo,
            ...customFormats,
        },
        customFormats,
        platformConfig: plugin_1.pluginManager.getTexturePlatformConfigs(),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1jb21wcmVzcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFtbUJBLG9EQVVDO0FBRUQsZ0RBR0M7QUFhRCx3REF5QkM7QUF4cEJELHVDQUEwSztBQUMxSywrQkFBd0Q7QUFDeEQseUNBQWtGO0FBQ2xGLG1EQUF3RTtBQUN4RSwyQkFBZ0M7QUFDaEMsK0RBQWdFO0FBQ2hFLG1DQUF1RDtBQUN2RCxtQ0FBc0M7QUFHdEMsMkJBQTBCO0FBQzFCLE1BQU0sT0FBTyxHQUFHLElBQUEsU0FBSSxHQUFFLENBQUMsTUFBTSxDQUFDO0FBQzlCLGtEQUEwQjtBQUMxQixvREFBNEI7QUFDNUIsbURBQXVEO0FBQ3ZELHlEQUF5RDtBQUl6RCx1REFBMkQ7QUFDM0QseUVBQXFIO0FBQ3JILHNGQUE2RDtBQXlCN0QsTUFBYSxlQUFnQixTQUFRLHFCQUFZO0lBQzdDLFFBQVEsR0FBbUMsRUFBRSxDQUFDO0lBQzlDLFFBQVEsQ0FBUztJQUVqQixNQUFNLENBQUMsZ0JBQWdCLEdBQTJCLEVBQUUsQ0FBQztJQUNyRCxNQUFNLENBQUMseUJBQXlCLEdBQW9FLEVBQUUsQ0FBQztJQUN2RyxNQUFNLENBQUMsd0JBQXdCLENBQTJCO0lBQzFELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBcUI7SUFDOUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLElBQUEsV0FBSSxFQUFDLHdCQUFhLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUNoRyxNQUFNLENBQUMsa0JBQWtCLEdBQXNDLEVBQUUsQ0FBQztJQUNsRSxNQUFNLENBQUMsc0JBQXNCLEdBQUcsSUFBQSxXQUFJLEVBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixD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LENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHO2dCQUN2QixHQUFHLDhCQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDN0IsV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUN4QixLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2FBQ2YsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNILGNBQWMsRUFBZCxpQ0FBYztRQUNkLFlBQVksRUFBWiwrQkFBWTtRQUNaLG9CQUFvQixFQUFwQix1Q0FBb0I7UUFDcEIsV0FBVyxFQUFFO1lBQ1QsR0FBRyw4QkFBVztZQUNkLEdBQUcsYUFBYTtTQUNuQjtRQUNELGFBQWE7UUFDYixjQUFjLEVBQUUsc0JBQWEsQ0FBQyx5QkFBeUIsRUFBRTtLQUM1RCxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvcHlTeW5jLCBlbnN1cmVEaXJTeW5jLCBvdXRwdXRGaWxlLCByZWFkRmlsZVN5bmMsIHJlYWRKc29uU3luYywgcmVtb3ZlLCBzdGF0LCBleGlzdHNTeW5jLCBvdXRwdXRKU09OU3luYywgY29weSwgZW5zdXJlRGlyLCBleGlzdHMsIG91dHB1dEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZGlybmFtZSwgZXh0bmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY2hlY2tIYXNNaXBNYXBzLCBjb21wcmVzc01pcG1hcEZpbGVzLCBnZW5NaXBtYXBGaWxlcyB9IGZyb20gJy4vbWluaW1hcHMnO1xuaW1wb3J0IHsgY29tcHJlc3NDdXN0b21Gb3JtYXQsIGdldENvbXByZXNzRnVuYyB9IGZyb20gJy4vY29tcHJlc3MtdG9vbCc7XG5pbXBvcnQgeyBJbWFnZUFzc2V0IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgYnVpbGRBc3NldExpYnJhcnkgfSBmcm9tICcuLi8uLi9tYW5hZ2VyL2Fzc2V0LWxpYnJhcnknO1xuaW1wb3J0IHsgY2hhbmdlSW5mb1RvTGFiZWwsIGdldFN1ZmZpeCB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnc3RyZWFtJztcblxuaW1wb3J0IHsgQXNzZXQsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBjcHVzIH0gZnJvbSAnb3MnO1xuY29uc3QgbnVtQ1BVcyA9IGNwdXMoKS5sZW5ndGg7XG5pbXBvcnQgU2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0IExvZGFzaCBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgZm9ybWF0TVNUaW1lIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvdXRpbHMnO1xuaW1wb3J0IHsgbmV3Q29uc29sZSB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgeyBJQ3VzdG9tQ29uZmlnLCBJVGV4dHVyZUNvbXByZXNzRm9ybWF0VHlwZSwgQWxsVGV4dHVyZUNvbXByZXNzQ29uZmlnLCBVc2VyQ29tcHJlc3NDb25maWcsIElDb21wcmVzc0NvbmZpZyB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcyc7XG5pbXBvcnQgeyBJQnVpbGRBc3NldEhhbmRsZXJJbmZvIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgSUltYWdlVGFza0luZm8sIElUZXh0dXJlRm9ybWF0SW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcGx1Z2luTWFuYWdlciB9IGZyb20gJy4uLy4uLy4uLy4uL21hbmFnZXIvcGx1Z2luJztcbmltcG9ydCB7IGNvbmZpZ0dyb3VwcywgZGVmYXVsdFN1cHBvcnQsIGZvcm1hdHNJbmZvLCB0ZXh0dXJlRm9ybWF0Q29uZmlncyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlL3RleHR1cmUtY29tcHJlc3MnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvYnVpbGRlci1jb25maWcnO1xuaW50ZXJmYWNlIENvbXByZXNzQ2FjaGVJbmZvIHtcbiAgICBvcHRpb246IHtcbiAgICAgICAgbXRpbWU6IG51bWJlciB8IHN0cmluZztcbiAgICAgICAgc3JjOiBzdHJpbmc7XG4gICAgICAgIGNvbXByZXNzT3B0aW9uczogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPj47XG4gICAgfTtcbiAgICBtaXBtYXBGaWxlczogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gICAgY3VzdG9tQ29uZmlnczogUmVjb3JkPHN0cmluZywgSUN1c3RvbUNvbmZpZz47XG4gICAgZGVzdD86IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgQ29tcHJlc3NFeGVjdXRlSW5mbyB7XG4gICAgLy8g5a2Y5YKo5b2T5YmN5pyJ5Zyo5omn6KGM5Y6L57yp5Lu75Yqh5qC85byP55qE5YW35L2T5Lu75Yqh5pWw6YePIO+8jOaWueS+v+WKoOmUgVxuICAgIGJ1c3lGb3JtYXRUeXBlOiBQYXJ0aWFsPFJlY29yZDxJVGV4dHVyZUNvbXByZXNzRm9ybWF0VHlwZSB8IHN0cmluZywgbnVtYmVyPj47XG4gICAgLy8g5a2Y5YKo5b2T5YmN5pyJ5Zyo5omn6KGM5Y6L57yp5Lu75Yqh55qE6LWE5rqQIHV1aWQg77yM5pa55L6/5Yqg6ZSBXG4gICAgYnVzeUFzc2V0OiBTZXQ8c3RyaW5nPjtcbiAgICByZXNvbHZlOiBGdW5jdGlvbjtcbiAgICByZWplY3Q6IEZ1bmN0aW9uO1xuICAgIHN0YXRlOiAncHJvZ3Jlc3MnIHwgJ3N1Y2Nlc3MnIHwgJ2ZhaWxlZCc7XG4gICAgY29tcGxldGU6IG51bWJlcjtcbiAgICB0b3RhbDogbnVtYmVyO1xuICAgIGNoaWxkUHJvY2VzczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUNvbXByZXNzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBfdGFza01hcDogUmVjb3JkPHN0cmluZywgSUltYWdlVGFza0luZm8+ID0ge307XG4gICAgcGxhdGZvcm06IHN0cmluZztcblxuICAgIHN0YXRpYyBvdmVyd3JpdGVGb3JtYXRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgc3RhdGljIF9wcmVzZXRJZFRvQ29tcHJlc3NPcHRpb246IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHN0cmluZz4+PiA9IHt9O1xuICAgIHN0YXRpYyBhbGxUZXh0dXJlQ29tcHJlc3NDb25maWc6IEFsbFRleHR1cmVDb21wcmVzc0NvbmZpZztcbiAgICBzdGF0aWMgdXNlckNvbXByZXNzQ29uZmlnOiBVc2VyQ29tcHJlc3NDb25maWc7XG4gICAgc3RhdGljIGNvbXByZXNzQ2FjaGVEaXIgPSBqb2luKGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3QsICd0ZW1wJywgJ2J1aWxkZXInLCAnQ29tcHJlc3NUZXh0dXJlJyk7XG4gICAgc3RhdGljIHN0b3JlZENvbXByZXNzSW5mbzogUmVjb3JkPHN0cmluZywgQ29tcHJlc3NDYWNoZUluZm8+ID0ge307XG4gICAgc3RhdGljIHN0b3JlZENvbXByZXNzSW5mb1BhdGggPSBqb2luKFRleHR1cmVDb21wcmVzcy5jb21wcmVzc0NhY2hlRGlyLCAnY29tcHJlc3MtaW5mby5qc29uJyk7XG4gICAgc3RhdGljIGVuYWJsZU1pcE1hcHMgPSBmYWxzZTtcblxuICAgIF93YWl0aW5nQ29tcHJlc3NRdWV1ZTogU2V0PElDb21wcmVzc0NvbmZpZz4gPSBuZXcgU2V0KCk7XG4gICAgX2NvbXByZXNzQXNzZXRMZW4gPSAwO1xuICAgIF9jb21wcmVzc0V4ZWN1dGVJbmZvOiBDb21wcmVzc0V4ZWN1dGVJbmZvIHwgbnVsbCA9IG51bGw7XG4gICAgdGV4dHVyZUNvbXByZXNzOiBib29sZWFuO1xuXG4gICAgY29uc3RydWN0b3IocGxhdGZvcm06IHN0cmluZywgdGV4dHVyZUNvbXByZXNzPzogYm9vbGVhbikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnBsYXRmb3JtID0gcGxhdGZvcm07XG4gICAgICAgIHRoaXMudGV4dHVyZUNvbXByZXNzID0gdGV4dHVyZUNvbXByZXNzID8/IHRydWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGluaXRDb21tb25PcHRpb25zKCkge1xuICAgICAgICBUZXh0dXJlQ29tcHJlc3MuYWxsVGV4dHVyZUNvbXByZXNzQ29uZmlnID0gYXdhaXQgcXVlcnlBbGxDb21wcmVzc0NvbmZpZygpO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyhUZXh0dXJlQ29tcHJlc3Muc3RvcmVkQ29tcHJlc3NJbmZvUGF0aCkpIHtcbiAgICAgICAgICAgIFRleHR1cmVDb21wcmVzcy5zdG9yZWRDb21wcmVzc0luZm8gPSByZWFkSnNvblN5bmMoVGV4dHVyZUNvbXByZXNzLnN0b3JlZENvbXByZXNzSW5mb1BhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVGV4dHVyZUNvbXByZXNzLnN0b3JlZENvbXByZXNzSW5mbyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIFRleHR1cmVDb21wcmVzcy5lbmFibGVNaXBNYXBzID0gISEoYXdhaXQgYnVpbGRlckNvbmZpZy5nZXRQcm9qZWN0PGJvb2xlYW4+KCd0ZXh0dXJlQ29tcHJlc3NDb25maWcuZ2VuTWlwbWFwcycpKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZVVzZXJDb25maWcoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDnvJPlrZjnmoTnurnnkIbljovnvKnpobnnm67phY3nva5cbiAgICAgKi9cbiAgICBhc3luYyB1cGRhdGVVc2VyQ29uZmlnKCkge1xuICAgICAgICBhd2FpdCBUZXh0dXJlQ29tcHJlc3MuaW5pdENvbW1vbk9wdGlvbnMoKTtcbiAgICAgICAgLy8g5p+l6K+i57q555CG5Y6L57yp6YWN572u562JXG4gICAgICAgIFRleHR1cmVDb21wcmVzcy51c2VyQ29tcHJlc3NDb25maWcgPSBhd2FpdCBidWlsZGVyQ29uZmlnLmdldFByb2plY3Q8VXNlckNvbXByZXNzQ29uZmlnPigndGV4dHVyZUNvbXByZXNzQ29uZmlnJykgYXMgVXNlckNvbXByZXNzQ29uZmlnO1xuICAgICAgICBjb25zdCB7IGN1c3RvbUNvbmZpZ3MgfSA9IFRleHR1cmVDb21wcmVzcy51c2VyQ29tcHJlc3NDb25maWc7XG4gICAgICAgIC8vIOaUtumbhuebruWJjeW3suaciemFjee9ruWGheS8muimhueblueOsOacieagvOW8j+eahOmFjee9rumbhuWQiFxuICAgICAgICBjb25zdCBvdmVyd3JpdGVGb3JtYXRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgICAgIGlmIChjdXN0b21Db25maWdzICYmIE9iamVjdC52YWx1ZXMoY3VzdG9tQ29uZmlncykubGVuZ3RoKSB7XG4gICAgICAgICAgICBPYmplY3QudmFsdWVzKGN1c3RvbUNvbmZpZ3MgYXMgUmVjb3JkPHN0cmluZywgSUN1c3RvbUNvbmZpZz4pLmZvckVhY2goKGZvcm1hdENvbmZpZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmb3JtYXRDb25maWcub3ZlcndyaXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJ3cml0ZUZvcm1hdHNbZm9ybWF0Q29uZmlnLmZvcm1hdF0gPSBmb3JtYXRDb25maWcuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYGNvbXByZXNzIGZvcm1hdCAoJHtmb3JtYXRDb25maWcuZm9ybWF0fSkgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSBjdXN0b20gY29tcHJlc3MgJHtmb3JtYXRDb25maWcuaWR9KCR7Zm9ybWF0Q29uZmlnLm5hbWV9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFRleHR1cmVDb21wcmVzcy5vdmVyd3JpdGVGb3JtYXRzID0gb3ZlcndyaXRlRm9ybWF0cztcbiAgICAgICAgVGV4dHVyZUNvbXByZXNzLl9wcmVzZXRJZFRvQ29tcHJlc3NPcHRpb24gPSB7fTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcXVlcnlUZXh0dXJlQ29tcHJlc3NDYWNoZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIFRleHR1cmVDb21wcmVzcy5zdG9yZWRDb21wcmVzc0luZm9bdXVpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u6LWE5rqQ5L+h5oGv6L+U5Zue6LWE5rqQ55qE57q555CG5Y6L57yp5Lu75Yqh77yM5peg5Y6L57yp5Lu75Yqh55qE6L+U5ZueIG51bGxcbiAgICAgKiBAcGFyYW0gYXNzZXRJbmZvIFxuICAgICAqIEByZXR1cm5zIElJbWFnZVRhc2tJbmZvIHwgbnVsbFxuICAgICAqL1xuICAgIGFkZFRhc2sodXVpZDogc3RyaW5nLCB0YXNrOiBJSW1hZ2VUYXNrSW5mbykge1xuICAgICAgICBpZiAodGhpcy5fdGFza01hcFt1dWlkXSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLl90YXNrTWFwW3V1aWRdLCB0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Rhc2tNYXBbdXVpZF0gPSB0YXNrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl90YXNrTWFwW3V1aWRdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiDmoLnmja4gSW1hZ2Ug5L+h5oGv5re75Yqg6LWE5rqQ55qE5Y6L57yp5Lu75YqhXG4gICAgICogQHBhcmFtIGFzc2V0SW5mbyDvvIjkuI3mlK/mjIHoh6rliqjlm77pm4bvvIlcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhZGRUYXNrV2l0aEFzc2V0SW5mbyhhc3NldEluZm86IEFzc2V0IHwgVmlydHVhbEFzc2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl90YXNrTWFwW2Fzc2V0SW5mby51dWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Rhc2tNYXBbYXNzZXRJbmZvLnV1aWRdO1xuICAgICAgICB9XG4gICAgICAgIC8vIOiHquWKqOWbvumbhuaXoOazleebtOaOpemAmui/hyBhc3NldEluZm8g6I635Y+W5Yiw5q2j56Gu55qE5Y6L57yp5Lu75YqhXG4gICAgICAgIGlmIChhc3NldEluZm8ubWV0YS5pbXBvcnRlciA9PT0gJ2F1dG8tYXRsYXMnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFzayA9IHRoaXMuZ2VuVGFza0luZm9Gcm9tQXNzZXRJbmZvKGFzc2V0SW5mbyk7XG4gICAgICAgIGlmICghdGFzaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Rhc2tNYXBbYXNzZXRJbmZvLnV1aWRdID0gdGFzaztcbiAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u5Zu+6ZuG5oiW6ICFIEltYWdlIOi1hOa6kOS/oeaBr+i/lOWbnui1hOa6kOeahOe6ueeQhuWOi+e8qeS7u+WKoe+8jOaXoOWOi+e8qeS7u+WKoeeahOi/lOWbniBudWxsXG4gICAgICovXG4gICAgZ2VuVGFza0luZm9Gcm9tQXNzZXRJbmZvKGFzc2V0SW5mbzogQXNzZXQgfCBWaXJ0dWFsQXNzZXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Rhc2tNYXBbYXNzZXRJbmZvLnV1aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGFza01hcFthc3NldEluZm8udXVpZF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29tcHJlc3NTZXR0aW5ncyA9IGFzc2V0SW5mby5tZXRhLnVzZXJEYXRhLmNvbXByZXNzU2V0dGluZ3M7XG4gICAgICAgIGlmICghY29tcHJlc3NTZXR0aW5ncyB8fCAhY29tcHJlc3NTZXR0aW5ncy51c2VDb21wcmVzc1RleHR1cmUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yik5pat6LWE5rqQ5piv5ZCm5a2Y5ZyoXG4gICAgICAgIGxldCBleHROYW1lID0gKGFzc2V0SW5mbyBhcyBBc3NldCkuZXh0bmFtZTtcbiAgICAgICAgaWYgKCFhc3NldEluZm8ubWV0YS5maWxlcy5pbmNsdWRlcyhleHROYW1lKSkge1xuICAgICAgICAgICAgLy8gSEFDSyDmraTlpITlgYflrprkuobmr4/lvKDlm77lr7zlhaXlkI7lpoLmnpzmlLnkuoblkI7nvIDkuIDlrprmmK/ovazmiJAgcG5nIC8ganBnIOetie+8jOS9huebruWJjeayoeacieWlveeahOaWueW8j+W+l+efpei/meS4quS/oeaBr1xuICAgICAgICAgICAgZXh0TmFtZSA9IGFzc2V0SW5mby5tZXRhLmZpbGVzLmZpbmQoKGZpbGVFeHROYW1lKSA9PiBbJy5wbmcnLCAnLmpwZyddLmluY2x1ZGVzKGZpbGVFeHROYW1lKSkgfHwgJy5wbmcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNyYyA9IGFzc2V0SW5mby5saWJyYXJ5ICsgZXh0TmFtZTtcbiAgICAgICAgaWYgKGFzc2V0SW5mby5tZXRhLmltcG9ydGVyICE9PSAnYXV0by1hdGxhcycgJiYgIXNyYykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBnZW5UYXNrSW5mb0Zyb21Bc3NldEluZm8gZmFpbGVkICEgSW1hZ2UgYXNzZXQgZG9lcyBub3QgZXhpc3Q6ICR7YXNzZXRJbmZvLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXByZXNzT3B0aW9ucyA9IHRoaXMuZ2V0Q29tcHJlc3NPcHRpb25zKGNvbXByZXNzU2V0dGluZ3MucHJlc2V0SWQpO1xuICAgICAgICBpZiAoIWNvbXByZXNzT3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzcmMsXG4gICAgICAgICAgICBwcmVzZXRJZDogY29tcHJlc3NTZXR0aW5ncy5wcmVzZXRJZCxcbiAgICAgICAgICAgIGNvbXByZXNzT3B0aW9ucyxcbiAgICAgICAgICAgIGhhc0FscGhhOiBhc3NldEluZm8ubWV0YS51c2VyRGF0YS5oYXNBbHBoYSxcbiAgICAgICAgICAgIG10aW1lOiBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldFByb3BlcnR5KGFzc2V0SW5mbywgJ210aW1lJyksXG4gICAgICAgICAgICBoYXNNaXBtYXBzOiBUZXh0dXJlQ29tcHJlc3MuZW5hYmxlTWlwTWFwcyA/IGNoZWNrSGFzTWlwTWFwcyhhc3NldEluZm8ubWV0YSkgOiBmYWxzZSxcbiAgICAgICAgICAgIGRlc3Q6IFtdLFxuICAgICAgICAgICAgc3VmZml4OiBbXSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmoLnmja7nurnnkIbljovnvKnphY3nva4gaWQg6I635Y+W5a+55bqU55qE57q555CG5Y6L57yp6YCJ6aG5XG4gICAgICogQHBhcmFtIHByZXNldElkIFxuICAgICAqIEByZXR1cm5zIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHN0cmluZz4gfCBudWxsXG4gICAgICovXG4gICAgZ2V0Q29tcHJlc3NPcHRpb25zKHByZXNldElkOiBzdHJpbmcpOiAoUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgc3RyaW5nPj4pIHwgbnVsbCB7XG4gICAgICAgIGlmIChUZXh0dXJlQ29tcHJlc3MuX3ByZXNldElkVG9Db21wcmVzc09wdGlvbltwcmVzZXRJZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBUZXh0dXJlQ29tcHJlc3MuX3ByZXNldElkVG9Db21wcmVzc09wdGlvbltwcmVzZXRJZF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB1c2VyUHJlc2V0LCBkZWZhdWx0Q29uZmlnLCBjdXN0b21Db25maWdzIH0gPSBUZXh0dXJlQ29tcHJlc3MudXNlckNvbXByZXNzQ29uZmlnO1xuICAgICAgICBjb25zdCB7IHBsYXRmb3JtQ29uZmlnLCBjdXN0b21Gb3JtYXRzIH0gPSBUZXh0dXJlQ29tcHJlc3MuYWxsVGV4dHVyZUNvbXByZXNzQ29uZmlnO1xuXG4gICAgICAgIGlmICghcGxhdGZvcm1Db25maWdbdGhpcy5wbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHR1cmVDb21wcmVzc0NvbmZpZyA9IHBsYXRmb3JtQ29uZmlnW3RoaXMucGxhdGZvcm1dLnRleHR1cmVDb21wcmVzc0NvbmZpZztcbiAgICAgICAgaWYgKCF0ZXh0dXJlQ29tcHJlc3NDb25maWcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtVHlwZSA9IHRleHR1cmVDb21wcmVzc0NvbmZpZy5wbGF0Zm9ybVR5cGU7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHVzZXJQcmVzZXRbcHJlc2V0SWRdIHx8IGRlZmF1bHRDb25maWdbcHJlc2V0SWRdIHx8IGRlZmF1bHRDb25maWcuZGVmYXVsdDtcbiAgICAgICAgaWYgKCFjb25maWcgfHwgKCFjb25maWcub3B0aW9uc1twbGF0Zm9ybVR5cGVdICYmICghY29uZmlnLm92ZXJ3cml0ZSB8fCAhY29uZmlnLm92ZXJ3cml0ZVt0aGlzLnBsYXRmb3JtXSkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBJbnZhbGlkIGNvbXByZXNzIHRhc2s6ICR7SlNPTi5zdHJpbmdpZnkoY29uZmlnKX1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb21wcmVzc09wdGlvbnM6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHN0cmluZz4+ID0ge307XG4gICAgICAgIGlmIChjb25maWcub3ZlcndyaXRlICYmIGNvbmZpZy5vdmVyd3JpdGVbdGhpcy5wbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgIGNvbXByZXNzT3B0aW9ucyA9IGNvbmZpZy5vdmVyd3JpdGVbdGhpcy5wbGF0Zm9ybV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzdXBwb3J0ID0gdGV4dHVyZUNvbXByZXNzQ29uZmlnLnN1cHBvcnQ7XG4gICAgICAgICAgICAvLyBjb25zdCBzdWZmaXhNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbmZpZy5vcHRpb25zW3BsYXRmb3JtVHlwZV0pLmZvckVhY2goKGZvcm1hdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHM6IHN0cmluZ1tdID0gWy4uLnN1cHBvcnQucmdiYSwgLi4uc3VwcG9ydC5yZ2JdO1xuICAgICAgICAgICAgICAgIGlmIChmb3JtYXRzLmluY2x1ZGVzKGZvcm1hdCkgfHwgT2JqZWN0LmtleXMoY3VzdG9tRm9ybWF0cykuaW5jbHVkZXMoZm9ybWF0KSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wcmVzc09wdGlvbnNbZm9ybWF0XSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29uZmlnLm9wdGlvbnNbcGxhdGZvcm1UeXBlXVtmb3JtYXRdKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN1ZmZpeE1hcFtmb3JtYXRdID0gdGV4dHVyZUZvcm1hdENvbmZpZ3NbZm9ybWF0c0luZm9bZm9ybWF0XS5mb3JtYXRUeXBlXS5zdWZmaXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5pS26ZuG55uu5YmN5bey5pyJ6YWN572u5YaF5Lya6KaG55uW546w5pyJ5qC85byP55qE6YWN572u6ZuG5ZCIXG4gICAgICAgIGNvbnN0IG92ZXJ3cml0ZUZvcm1hdHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgaWYgKGN1c3RvbUNvbmZpZ3MgJiYgT2JqZWN0LnZhbHVlcyhjdXN0b21Db25maWdzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIE9iamVjdC52YWx1ZXMoY3VzdG9tQ29uZmlncyBhcyBSZWNvcmQ8c3RyaW5nLCBJQ3VzdG9tQ29uZmlnPikuZm9yRWFjaCgoZm9ybWF0Q29uZmlnKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdENvbmZpZy5vdmVyd3JpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcndyaXRlRm9ybWF0c1tmb3JtYXRDb25maWcuZm9ybWF0XSA9IGZvcm1hdENvbmZpZy5pZDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgY29tcHJlc3MgZm9ybWF0ICgke2Zvcm1hdENvbmZpZy5mb3JtYXR9KSB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IGN1c3RvbSBjb21wcmVzcyAke2Zvcm1hdENvbmZpZy5pZH0oJHtmb3JtYXRDb25maWcubmFtZX0pYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmtleXMob3ZlcndyaXRlRm9ybWF0cykuZm9yRWFjaCgoZm9ybWF0KSA9PiB7XG4gICAgICAgICAgICBpZiAoY29tcHJlc3NPcHRpb25zW2Zvcm1hdF0pIHtcbiAgICAgICAgICAgICAgICBjb21wcmVzc09wdGlvbnNbb3ZlcndyaXRlRm9ybWF0c1tmb3JtYXRdXSA9IGNvbXByZXNzT3B0aW9uc1tmb3JtYXRdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb21wcmVzc09wdGlvbnNbZm9ybWF0XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhjb21wcmVzc09wdGlvbnMpLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgVGV4dHVyZUNvbXByZXNzLl9wcmVzZXRJZFRvQ29tcHJlc3NPcHRpb25bcHJlc2V0SWRdID0gY29tcHJlc3NPcHRpb25zO1xuICAgICAgICByZXR1cm4gY29tcHJlc3NPcHRpb25zO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouafkOS4quaMh+WumiB1dWlkIOi1hOa6kOeahOe6ueeQhuWOi+e8qeS7u+WKoVxuICAgICAqIEBwYXJhbSB1dWlkIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHF1ZXJ5VGFzayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Rhc2tNYXBbdXVpZF07XG4gICAgfVxuXG4gICAgcmVtb3ZlVGFzayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Rhc2tNYXBbdXVpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5omn6KGM5omA5pyJ57q555CG5Y6L57yp5Lu75Yqh77yM5pSv5oyB6ZmQ5a6a5Lu75Yqh77yM5ZCm5YiZ5bCG5omn6KGM5pS26ZuG55qE5omA5pyJ57q555CG5Y6L57yp5Lu75YqhXG4gICAgICovXG4gICAgYXN5bmMgcnVuKHRhc2tNYXAgPSB0aGlzLl90YXNrTWFwKSB7XG5cbiAgICAgICAgY29uc3QgeyBjdXN0b21Db25maWdzIH0gPSBUZXh0dXJlQ29tcHJlc3MudXNlckNvbXByZXNzQ29uZmlnO1xuICAgICAgICAvLyAxLiDmlbTnkIbnurnnkIbljovnvKnku7vliqFcbiAgICAgICAgY29uc3QgY29tcHJlc3NRdWV1ZSA9IGF3YWl0IHRoaXMuc29ydEltYWdlVGFzayh0YXNrTWFwKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgTnVtIG9mIGFsbCBpbWFnZSBjb21wcmVzcyB0YXNrICR7T2JqZWN0LmtleXModGFza01hcCkubGVuZ3RofSwgcmVhbGx5OiAke3RoaXMuX2NvbXByZXNzQXNzZXRMZW59LCBjb25maWdUYXNrczogJHtjb21wcmVzc1F1ZXVlLmxlbmd0aH1gKTtcblxuICAgICAgICBpZiAoIWNvbXByZXNzUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdObyBpbWFnZSBuZWVkIHRvIGNvbXByZXNzJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29tcHJlc3NRdWV1ZUNvcHkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNvbXByZXNzUXVldWUpKTtcbiAgICAgICAgLy8gMi4g5LyY5YWI5omn6KGM5p6E5bu66Ieq5a6a5LmJ57q555CG5Y6L57yp6ZKp5a2Q5Ye95pWw77yM5q2k5rWB56iL5Lya5L+u5pS5IGNvbXByZXNzUXVldWVDb3B5IOWGheeahOS7u+WKoeaVsOmHj++8jOmcgOimgea3seaLt+i0nVxuICAgICAgICBjb25zdCBjdXN0b21IYW5kbGVySW5mb3M6IElCdWlsZEFzc2V0SGFuZGxlckluZm8gPSBwbHVnaW5NYW5hZ2VyLmdldEFzc2V0SGFuZGxlcnMoJ2NvbXByZXNzVGV4dHVyZXMnKTtcbiAgICAgICAgaWYgKGN1c3RvbUhhbmRsZXJJbmZvcy5wa2dOYW1lT3JkZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3VwZGF0ZS1wcm9ncmVzcycsICdzdGFydCBjb21wcmVzcyBjdXN0b20gY29tcHJlc3MgaG9va3MuLi4nKTtcbiAgICAgICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lU3RhcnQoJ2J1aWxkZXI6Y3VzdG9tLWNvbXByZXNzLXRleHR1cmUnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY3VzdG9tQ29tcHJlc3NJbWFnZShjb21wcmVzc1F1ZXVlQ29weSwgY3VzdG9tSGFuZGxlckluZm9zKTtcbiAgICAgICAgICAgIGF3YWl0IG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKCdidWlsZGVyOmN1c3RvbS1jb21wcmVzcy10ZXh0dXJlJywgeyBvdXRwdXQ6IHRydWUgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBjdXN0b20gY29tcHJlc3MgJHtjb21wcmVzc1F1ZXVlLmxlbmd0aCAtIGNvbXByZXNzUXVldWVDb3B5Lmxlbmd0aH0gLyAke2NvbXByZXNzUXVldWUubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXByZXNzUXVldWVDb3B5Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5fd2FpdGluZ0NvbXByZXNzUXVldWUgPSBuZXcgU2V0KGNvbXByZXNzUXVldWVDb3B5KTtcblxuICAgICAgICAgICAgbmV3Q29uc29sZS50cmFja1RpbWVTdGFydCgnYnVpbGRlcjpjb21wcmVzcy10ZXh0dXJlJyk7XG4gICAgICAgICAgICAvLyA1LiDlpITnkIblrp7pmYXpnIDopoHljovnvKnnmoTnurnnkIbku7vliqFcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNvbXByZXNzUXVldWUoKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSBhd2FpdCBuZXdDb25zb2xlLnRyYWNrVGltZUVuZCgnYnVpbGRlcjpjb21wcmVzcy10ZXh0dXJlJywgeyBvdXRwdXQ6IHRydWUgfSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYGJ1aWxkZXI6Y29tcHJlc3MtdGV4dHVyZTogJHtmb3JtYXRNU1RpbWUodGltZSl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA2LiDloavlhYXljovnvKnlkI7nmoTot6/lvoTliLAgaW5mbyDlhoVcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcHJlc3NRdWV1ZS5tYXAoYXN5bmMgKGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoY29uZmlnLmRlc3QpKSB7XG4gICAgICAgICAgICAgICAgdGFza01hcFtjb25maWcudXVpZF0uZGVzdC5wdXNoKGNvbmZpZy5kZXN0KTtcbiAgICAgICAgICAgICAgICB0YXNrTWFwW2NvbmZpZy51dWlkXS5zdWZmaXgucHVzaChjb25maWcuc3VmZml4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGV4dHVyZSBjb21wcmVzcyB0YXNrIHdpZHRoIGFzc2V0ICR7Y29uZmlnLnV1aWR9LCBmb3JtYXQ6ICR7Y29uZmlnLmZvcm1hdH0gZmFpbGVkIWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgLy8g5a2Y5YKo57q555CG5Y6L57yp57yT5a2Y5L+h5oGvXG4gICAgICAgIGF3YWl0IG91dHB1dEpTT04oVGV4dHVyZUNvbXByZXNzLnN0b3JlZENvbXByZXNzSW5mb1BhdGgsIFRleHR1cmVDb21wcmVzcy5zdG9yZWRDb21wcmVzc0luZm8pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBOdW0gb2Ygc29ydGVkIGltYWdlIGFzc2V0OiAke09iamVjdC5rZXlzKHRhc2tNYXApLmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIHRhc2tNYXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog562b6YCJ5pW055CG5Y6L57yp5Lu75Yqh5Lit57yT5a2Y5aSx5pWI55qE5a6e6ZmF6ZyA6KaB5Y6L57yp55qE5Lu75Yqh6Zif5YiXXG4gICAgICogQHBhcmFtIHRhc2tNYXAgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBzb3J0SW1hZ2VUYXNrKHRhc2tNYXA6IFJlY29yZDxzdHJpbmcsIElJbWFnZVRhc2tJbmZvPikge1xuICAgICAgICBjb25zdCBjb21wcmVzc1F1ZXVlOiBJQ29tcHJlc3NDb25maWdbXSA9IFtdO1xuICAgICAgICBjb25zdCB7IHRleHR1cmVGb3JtYXRDb25maWdzLCBmb3JtYXRzSW5mbyB9ID0gVGV4dHVyZUNvbXByZXNzLmFsbFRleHR1cmVDb21wcmVzc0NvbmZpZztcbiAgICAgICAgY29uc3QgeyBjdXN0b21Db25maWdzIH0gPSBUZXh0dXJlQ29tcHJlc3MudXNlckNvbXByZXNzQ29uZmlnO1xuICAgICAgICAvLyDorrDlvZXmoLzlvI/nmoTljovnvKnmlbDph49cbiAgICAgICAgY29uc3QgY29sbGVjdEZvcm1hdE51bTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBPYmplY3Qua2V5cyh0YXNrTWFwKSkge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IHRhc2tNYXBbdXVpZF07XG4gICAgICAgICAgICBjb25zdCBjb21wcmVzc09wdGlvbnMgPSBpbmZvLmNvbXByZXNzT3B0aW9ucztcbiAgICAgICAgICAgIGxldCBtaXBtYXBGaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGlmIChpbmZvLmhhc01pcG1hcHMgJiYgVGV4dHVyZUNvbXByZXNzLmVuYWJsZU1pcE1hcHMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIG1pcG1hcCBmaWxlIOmcgOimgee8k+WtmOacuuWItueuoeeQhlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGdlbk1pcG1hcEZpbGVzKGluZm8uc3JjLCBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldFRlbXBEaXJCeVV1aWQodXVpZCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbWlwbWFwRmlsZXMgPSBmaWxlcztcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IGB7YXNzZXQoJHt1dWlkfSl9YCArIGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm9ybWF0cyA9IE9iamVjdC5rZXlzKGNvbXByZXNzT3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBhc3NldEN1c3RvbUNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIElDdXN0b21Db25maWc+ID0ge307XG4gICAgICAgICAgICBmb3JtYXRzLmZvckVhY2goKGZvcm1hdCkgPT4gY3VzdG9tQ29uZmlnc1tmb3JtYXRdICYmIChhc3NldEN1c3RvbUNvbmZpZ3NbZm9ybWF0XSA9IGN1c3RvbUNvbmZpZ3NbZm9ybWF0XSkpO1xuICAgICAgICAgICAgY29uc3QgbmV3Q29tcHJlc3NJbmZvOiBDb21wcmVzc0NhY2hlSW5mbyA9IHsgb3B0aW9uOiB7IG10aW1lOiBpbmZvLm10aW1lLCBzcmM6IGluZm8uc3JjLCBjb21wcmVzc09wdGlvbnMgfSwgbWlwbWFwRmlsZXMsIGN1c3RvbUNvbmZpZ3M6IGFzc2V0Q3VzdG9tQ29uZmlncyB9O1xuICAgICAgICAgICAgY29uc3QgZGlydHkgPSAhTG9kYXNoLmlzRXF1YWwoVGV4dHVyZUNvbXByZXNzLnN0b3JlZENvbXByZXNzSW5mb1t1dWlkXSAmJiBUZXh0dXJlQ29tcHJlc3Muc3RvcmVkQ29tcHJlc3NJbmZvW3V1aWRdLm9wdGlvbiwgbmV3Q29tcHJlc3NJbmZvLm9wdGlvbik7XG4gICAgICAgICAgICBpbmZvLmRlc3QgPSBbXTtcbiAgICAgICAgICAgIGluZm8uZGlydHkgPSBkaXJ0eTtcbiAgICAgICAgICAgIGluZm8uc3VmZml4ID0gW107XG4gICAgICAgICAgICBsZXQgaGFzQ29tcHJlc3NDb25maWcgPSBmYWxzZTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXByZXNzT3B0aW9ucykuZm9yRWFjaCgoZm9ybWF0KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHJlYWxGb3JtYXQgPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgaWYgKFRleHR1cmVDb21wcmVzcy51c2VyQ29tcHJlc3NDb25maWcuY3VzdG9tQ29uZmlnc1tmb3JtYXRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxGb3JtYXQgPSBUZXh0dXJlQ29tcHJlc3MudXNlckNvbXByZXNzQ29uZmlnLmN1c3RvbUNvbmZpZ3NbZm9ybWF0XS5mb3JtYXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdFR5cGUgPSBmb3JtYXRzSW5mb1tyZWFsRm9ybWF0XT8uZm9ybWF0VHlwZSE7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtYXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEludmFsaWQgZm9ybWF0ICR7Zm9ybWF0fWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGNhY2hlRGVzdCA9IGpvaW4oVGV4dHVyZUNvbXByZXNzLmNvbXByZXNzQ2FjaGVEaXIsIHV1aWQuc3Vic3RyKDAsIDIpLCB1dWlkICsgdGV4dHVyZUZvcm1hdENvbmZpZ3NbZm9ybWF0VHlwZV0uc3VmZml4KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50ZXh0dXJlQ29tcHJlc3MgJiYgIWRpcnR5ICYmIGV4aXN0c1N5bmMoY2FjaGVEZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmRlc3QhLnB1c2goY2FjaGVEZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5zdWZmaXgucHVzaChnZXRTdWZmaXgoZm9ybWF0c0luZm9bcmVhbEZvcm1hdF0sIHRleHR1cmVGb3JtYXRDb25maWdzW2Zvcm1hdFR5cGVdLnN1ZmZpeCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBVc2UgY2FjaGUgY29tcHJlc3MgaW1hZ2Ugb2Yge0Fzc2V0KCR7dXVpZH0pfSAoe2xpbmsoJHtjYWNoZURlc3R9KX0pYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5mby5kaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKFRleHR1cmVDb21wcmVzcy51c2VyQ29tcHJlc3NDb25maWcuY3VzdG9tQ29uZmlnc1tmb3JtYXRdKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFvoh6rlrprkuYnnurnnkIbljovnvKnnu5/orqFdIDEu5pS26ZuG57uf6K6h5omA6ZyA5pWw5o2u77yI6Ieq5a6a5LmJ6YWN572u6KKr5L2/55So5qyh5pWw77yJXG4gICAgICAgICAgICAgICAgICAgIGluY3JlYXNlQ3VzdG9tQ29tcHJlc3NOdW0oVGV4dHVyZUNvbXByZXNzLnVzZXJDb21wcmVzc0NvbmZpZy5jdXN0b21Db25maWdzW2Zvcm1hdF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYXNDb21wcmVzc0NvbmZpZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29tcHJlc3NRdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICBzcmM6IGluZm8uc3JjLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiBjYWNoZURlc3QsXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzT3B0aW9uczogY29tcHJlc3NPcHRpb25zW2Zvcm1hdF0sXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUNvbmZpZzogY3VzdG9tQ29uZmlnc1tmb3JtYXRdLFxuICAgICAgICAgICAgICAgICAgICB1dWlkLFxuICAgICAgICAgICAgICAgICAgICBtaXBtYXBGaWxlcyxcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4OiBnZXRTdWZmaXgoZm9ybWF0c0luZm9bcmVhbEZvcm1hdF0sIHRleHR1cmVGb3JtYXRDb25maWdzW2Zvcm1hdFR5cGVdLnN1ZmZpeCksXG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdFR5cGUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29sbGVjdEZvcm1hdE51bVtmb3JtYXRUeXBlXSA9IChjb2xsZWN0Rm9ybWF0TnVtW2Zvcm1hdFR5cGVdIHx8IDApICsgMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGhhc0NvbXByZXNzQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcHJlc3NBc3NldExlbisrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3Q29tcHJlc3NJbmZvLmRlc3QgPSBpbmZvLmRlc3Q7XG4gICAgICAgICAgICBUZXh0dXJlQ29tcHJlc3Muc3RvcmVkQ29tcHJlc3NJbmZvW3V1aWRdID0gbmV3Q29tcHJlc3NJbmZvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYHNvcnQgY29tcHJlc3MgdGFzayAke0pTT04uc3RyaW5naWZ5KGNvbGxlY3RGb3JtYXROdW0pfWApO1xuICAgICAgICByZXR1cm4gY29tcHJlc3NRdWV1ZTtcbiAgICB9XG5cbiAgICBleGVjdXRlQ29tcHJlc3NRdWV1ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl93YWl0aW5nQ29tcHJlc3NRdWV1ZS5zaXplKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcHJlc3NFeGVjdXRlSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ3Byb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgYnVzeUZvcm1hdFR5cGU6IHt9LFxuICAgICAgICAgICAgICAgICAgICBidXN5QXNzZXQ6IG5ldyBTZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsOiB0aGlzLl93YWl0aW5nQ29tcHJlc3NRdWV1ZS5zaXplLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZFByb2Nlc3M6IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3VwZGF0ZS1wcm9ncmVzcycsIGBzdGFydCBjb21wcmVzcyB0YXNrIDAgLyAke3RoaXMuX3dhaXRpbmdDb21wcmVzc1F1ZXVlLnNpemV9YCk7XG4gICAgICAgICAgICAgICAgLy8g55Sx5LqO6LWE5rqQ5paH5Lu25bm25Y+R5Lya5pyJ5p2D6ZmQ6Zeu6aKY77yM5Y6L57yp5Lu75Yqh6Iez5aSa5bm25Y+R5pWwIDw9IOWOi+e8qeS7u+WKoemHjOeahOaAu+i1hOa6kOaVsOmHj1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fY29tcHJlc3NBc3NldExlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRUYXNrID0gdGhpcy5fZ2V0TmV4dFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFRhc2sgJiYgKHRoaXMuX2NvbXByZXNzSW1hZ2UobmV4dFRhc2spLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2dldE5leHRUYXNrKCkge1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGhpcy5fd2FpdGluZ0NvbXByZXNzUXVldWUudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIC8vIFRPRE8g5bCP5LyY5YyW77yM5YW25a6e5Yqg5LqG5qC45b+D5pWw6ZmQ5Yi25ZCO77yM5pyJ5Y+v6IO96YGH5Yiw5LiL5LiA5qyh6I635Y+W5Lu75Yqh5pe25ou/5Yiw5LqG5Zug5Li6IGJ1c3lBc3NldCDlr7zoh7Tlu7blkI7nmoQgc2hhcnAg5Lu75Yqh77yM5q2k5pe25YW25a6e5Y+v5Lul6L+e57ut5ZCv5Yqo5Lik5Liq5Lu75YqhXG4gICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tUYXNrQ2FuRXhlY3V0ZSh0YXNrKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIF9jaGVja1Rhc2tDYW5FeGVjdXRlKHRhc2tDb25maWc6IElDb21wcmVzc0NvbmZpZykge1xuICAgICAgICBjb25zdCB7IGJ1c3lBc3NldCwgYnVzeUZvcm1hdFR5cGUgfSA9IHRoaXMuX2NvbXByZXNzRXhlY3V0ZUluZm8hO1xuICAgICAgICBpZiAoYnVzeUFzc2V0Lmhhcyh0YXNrQ29uZmlnLnV1aWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJ1c3lGb3JtYXRUeXBlW3Rhc2tDb25maWcuZm9ybWF0VHlwZV0gJiYgIVRleHR1cmVDb21wcmVzcy5hbGxUZXh0dXJlQ29tcHJlc3NDb25maWcudGV4dHVyZUZvcm1hdENvbmZpZ3NbdGFza0NvbmZpZy5mb3JtYXRUeXBlXS5wYXJhbGxlbGlzbSkge1xuICAgICAgICAgICAgLy8g5qOA5p+l5b2T5YmN5qC85byP5piv5ZCm5pSv5oyB5bm26KGMXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgX2NvbXByZXNzSW1hZ2UoY29uZmlnOiBJQ29tcHJlc3NDb25maWcpIHtcbiAgICAgICAgY29uc3QgeyBidXN5QXNzZXQsIGJ1c3lGb3JtYXRUeXBlLCB0b3RhbCwgY2hpbGRQcm9jZXNzIH0gPSB0aGlzLl9jb21wcmVzc0V4ZWN1dGVJbmZvITtcbiAgICAgICAgY29uc3QgdXNlQ2hpbGRQcm9jZXNzID0gVGV4dHVyZUNvbXByZXNzLmFsbFRleHR1cmVDb21wcmVzc0NvbmZpZy50ZXh0dXJlRm9ybWF0Q29uZmlnc1tjb25maWcuZm9ybWF0VHlwZV0uY2hpbGRQcm9jZXNzO1xuICAgICAgICBpZiAodXNlQ2hpbGRQcm9jZXNzKSB7XG4gICAgICAgICAgICBpZiAoY2hpbGRQcm9jZXNzID4gbnVtQ1BVcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYCR7Y29uZmlnLmZvcm1hdFR5cGV9IHdhaXQgZm9yIGNoaWxkIHByb2Nlc3MgJHtjaGlsZFByb2Nlc3N9YCk7XG4gICAgICAgICAgICAgICAgLy8g6LaF6L+H5pyA5aSn6L+b56iL5pWw77yM6ZyA6KaB562J5b6FXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fY29tcHJlc3NFeGVjdXRlSW5mbyEuY2hpbGRQcm9jZXNzKys7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9sZFZhbHVlID0gYnVzeUZvcm1hdFR5cGVbY29uZmlnLmZvcm1hdFR5cGVdO1xuICAgICAgICBpZiAob2xkVmFsdWUgJiYgb2xkVmFsdWUgPiAwKSB7XG4gICAgICAgICAgICBpZiAoIVRleHR1cmVDb21wcmVzcy5hbGxUZXh0dXJlQ29tcHJlc3NDb25maWcudGV4dHVyZUZvcm1hdENvbmZpZ3NbY29uZmlnLmZvcm1hdFR5cGVdLnBhcmFsbGVsaXNtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVzeUZvcm1hdFR5cGVbY29uZmlnLmZvcm1hdFR5cGVdID0gKytvbGRWYWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1c3lGb3JtYXRUeXBlW2NvbmZpZy5mb3JtYXRUeXBlXSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgYnVzeUFzc2V0LmFkZChjb25maWcudXVpZCk7XG4gICAgICAgIHRoaXMuZW1pdCgndXBkYXRlLXByb2dyZXNzJywgYGV4ZWN1dGUgY29tcHJlc3MgdGFzayAke3RoaXMuX2NvbXByZXNzRXhlY3V0ZUluZm8hLmNvbXBsZXRlfS8ke3RvdGFsfSwgJHtidXN5QXNzZXQuc2l6ZX0gaW4gcHJvZ3Jlc3NgKTtcbiAgICAgICAgdGhpcy5fd2FpdGluZ0NvbXByZXNzUXVldWUuZGVsZXRlKGNvbmZpZyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXByZXNzSW1hZ2VCeUNvbmZpZyhjb25maWcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgdXNlQ2hpbGRQcm9jZXNzICYmICh0aGlzLl9jb21wcmVzc0V4ZWN1dGVJbmZvIS5jaGlsZFByb2Nlc3MtLSk7XG4gICAgICAgIGJ1c3lBc3NldC5kZWxldGUoY29uZmlnLnV1aWQpO1xuICAgICAgICBidXN5Rm9ybWF0VHlwZVtjb25maWcuZm9ybWF0VHlwZV0gPSAtLWJ1c3lGb3JtYXRUeXBlW2NvbmZpZy5mb3JtYXRUeXBlXSE7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzRXhlY3V0ZUluZm8hLmNvbXBsZXRlKys7XG4gICAgICAgIGF3YWl0IHRoaXMuX3N0ZXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XljovnvKnku7vliqHmmK/lkKblt7Lnu4/lrozmiJDvvIzlpoLmnKrlrozmiJDvvIzliJnnu6fnu63miafooYzliankuIvnmoTku7vliqFcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBfc3RlcCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3dhaXRpbmdDb21wcmVzc1F1ZXVlLnNpemUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRUYXNrID0gdGhpcy5fZ2V0TmV4dFRhc2soKTtcbiAgICAgICAgICAgIG5leHRUYXNrICYmIHRoaXMuX2NvbXByZXNzSW1hZ2UobmV4dFRhc2spO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+b5YWl5qOA5p+l5Lu75Yqh5piv5ZCm5YWo6YOo5a6M5oiQXG4gICAgICAgIGNvbnN0IHsgYnVzeUFzc2V0LCByZXNvbHZlIH0gPSB0aGlzLl9jb21wcmVzc0V4ZWN1dGVJbmZvITtcbiAgICAgICAgaWYgKCFidXN5QXNzZXQuc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3VzdG9tQ29tcHJlc3NJbWFnZShjb21wcmVzc1F1ZXVlOiBJQ29tcHJlc3NDb25maWdbXSwgaW5mb3M6IElCdWlsZEFzc2V0SGFuZGxlckluZm8pIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvcy5wa2dOYW1lT3JkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBrZ05hbWUgPSBpbmZvcy5wa2dOYW1lT3JkZXJbaV07XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gaW5mb3MuaGFuZGxlc1twa2dOYW1lXTtcbiAgICAgICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBTdGFydCBjdXN0b20gY29tcHJlc3MoJHtwa2dOYW1lfSlgKTtcbiAgICAgICAgICAgICAgICAvLyDlrp7pmYXpnIDopoHljovnvKnnmoTnurnnkIbku7vliqFcbiAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVyKGNvbXByZXNzUXVldWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDdXN0b20gQ29tcHJlc3MgKCR7cGtnTmFtZX0pIGZhaWxlZCFgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGNvbXByZXNzSW1hZ2VCeUNvbmZpZyhvcHRpb25JdGVtOiBJQ29tcHJlc3NDb25maWcpIHtcbiAgICAgICAgY29uc3QgeyBkZXN0IH0gPSBvcHRpb25JdGVtO1xuICAgICAgICBsZXQgc3JjID0gb3B0aW9uSXRlbS5zcmM7XG4gICAgICAgIGF3YWl0IGVuc3VyZURpcihkaXJuYW1lKGRlc3QpKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbkl0ZW0uY29tcHJlc3NPcHRpb25zLnF1YWxpdHkgPT09IDEwMCAmJiBleHRuYW1lKG9wdGlvbkl0ZW0uc3JjKS5lbmRzV2l0aChvcHRpb25JdGVtLmZvcm1hdCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtvcHRpb25JdGVtLmZvcm1hdH0gd2l0aCBxdWFsaXR5IGlzIDEwMCwgd2lsbCBjb3B5IHRoZSBpbWFnZSBmcm9tICR7b3B0aW9uSXRlbS5zcmN9IHRvICR7b3B0aW9uSXRlbS5kZXN0fWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvcHkob3B0aW9uSXRlbS5zcmMsIG9wdGlvbkl0ZW0uZGVzdCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0bmFtZShzcmMpID09PSAnLndlYnAnKSB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IFNoYXJwKHNyYyk7XG4gICAgICAgICAgICBzcmMgPSBzcmMucmVwbGFjZSgnd2VicCcsICdwbmcnKTtcbiAgICAgICAgICAgIGF3YWl0IGltYWdlLnRvRmlsZShzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb21wcmVzc0Z1bmM6ICgob3B0aW9uOiBJQ29tcHJlc3NDb25maWcpID0+IFByb21pc2U8dm9pZD4pIHwgdW5kZWZpbmVkO1xuICAgICAgICAvLyDoh6rlrprkuYnljovnvKnmtYHnqItcbiAgICAgICAgaWYgKG9wdGlvbkl0ZW0uY3VzdG9tQ29uZmlnKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYHN0YXJ0IGN1c3RvbSBjb21wcmVzcyBjb25maWcgJHtvcHRpb25JdGVtLmZvcm1hdH0oJHtvcHRpb25JdGVtLmN1c3RvbUNvbmZpZyEubmFtZX0pYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29tcHJlc3NDdXN0b21Gb3JtYXQoe1xuICAgICAgICAgICAgICAgICAgICAuLi5vcHRpb25JdGVtLFxuICAgICAgICAgICAgICAgICAgICBzcmMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQ3VzdG9tIGNvbXByZXNzIGNvbmZpZycsIGAke29wdGlvbkl0ZW0uZm9ybWF0fSgke29wdGlvbkl0ZW0uY3VzdG9tQ29uZmlnIS5uYW1lfSlgLCAnc3VjZXNzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXByZXNzIHthc3NldCgke29wdGlvbkl0ZW0udXVpZH0pfSB3aXRoIGN1c3RvbSBjb25maWcgZmFpbGVkIWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG4gICAgICAgICAgICAgICAgLy8g6Ieq5a6a5LmJ57q555CG5Y6L57yp5aSx6LSl5ZCO77yM5Zue6YCA5oiQ6buY6K6k55qE5Y6L57yp5qC85byPXG4gICAgICAgICAgICAgICAgY29tcHJlc3NGdW5jID0gZ2V0Q29tcHJlc3NGdW5jKG9wdGlvbkl0ZW0uY3VzdG9tQ29uZmlnIS5mb3JtYXQpO1xuICAgICAgICAgICAgICAgIGlmICghY29tcHJlc3NGdW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBmb3JtYXQgJHtvcHRpb25JdGVtLmN1c3RvbUNvbmZpZyEuZm9ybWF0fWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbXByZXNzRnVuYyA9IGNvbXByZXNzRnVuYyB8fCBnZXRDb21wcmVzc0Z1bmMob3B0aW9uSXRlbS5mb3JtYXQpO1xuICAgICAgICBpZiAoIWNvbXByZXNzRnVuYykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGZvcm1hdCAke29wdGlvbkl0ZW0uZm9ybWF0fWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOato+W4uOWOi+e8qea1geeoi1xuICAgICAgICBhd2FpdCBjb21wcmVzc0Z1bmMoe1xuICAgICAgICAgICAgLi4ub3B0aW9uSXRlbSxcbiAgICAgICAgICAgIHNyYyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5L6d6LWW56ys5LiJ5pa55bel5YW355qE57q555CG5Y6L57yp5qC85byP5omN6ZyA6KaB5L6d6LWW5p6E5bu655Sf5oiQXG4gICAgICAgIGlmIChUZXh0dXJlQ29tcHJlc3MuZW5hYmxlTWlwTWFwcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGNvbXByZXNzTWlwbWFwRmlsZXMoe1xuICAgICAgICAgICAgICAgICAgICAuLi5vcHRpb25JdGVtLFxuICAgICAgICAgICAgICAgICAgICBzcmMsXG4gICAgICAgICAgICAgICAgfSwgY29tcHJlc3NGdW5jKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnNwbGljZSgwLCAwLCByZWFkRmlsZVN5bmMob3B0aW9uSXRlbS5kZXN0KSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBJbWFnZUFzc2V0Lm1lcmdlQ29tcHJlc3NlZFRleHR1cmVNaXBzKGZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgb3V0cHV0RmlsZShvcHRpb25JdGVtLmRlc3QsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUob3B0aW9uSXRlbS5kZXN0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBHZW5lcmF0ZSB7YXNzZXQoJHtvcHRpb25JdGVtLnV1aWR9KX0gY29tcHJlc3MgdGV4dHVyZSBtaXBtYXAgZmlsZXMgZmFpbGVkIWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOazqOaEj++8miDpnIDopoHkvb/nlKggb3B0aW9uSXRlbS5zcmMg5Yik5pat77yMc3JjIOWPmOmHj+WPr+iDveiiq+S/ruaUuVxuICAgICAgICAgICAgaWYgKGV4dG5hbWUob3B0aW9uSXRlbS5zcmMpLmVuZHNXaXRoKG9wdGlvbkl0ZW0uZm9ybWF0KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNyY1N0YXRlID0gYXdhaXQgc3RhdChvcHRpb25JdGVtLnNyYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVzdFN0YXRlID0gYXdhaXQgc3RhdChvcHRpb25JdGVtLmRlc3QpO1xuICAgICAgICAgICAgICAgIGlmIChkZXN0U3RhdGUuc2l6ZSA+IHNyY1N0YXRlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFRoZSBjb21wcmVzc2VkIGltYWdlKCR7b3B0aW9uSXRlbS5kZXN0fSkgc2l6ZSgke2Rlc3RTdGF0ZS5zaXplfSkgaXMgbGFyZ2VyIHRoYW4gdGhlIG9yaWdpbmFsIGltYWdlKCR7b3B0aW9uSXRlbS5zcmN9KSBzaXplKCR7c3JjU3RhdGUuc2l6ZX0pLCBhbmQgdGhlIG9yaWdpbmFsIGltYWdlIHdpbGwgYmUgdXNlZC4gVG8gaWdub3JlIHRoaXMgcHJvdGVjdGlvbiBtZWNoYW5pc20sIHBsZWFzZSBjb25maWd1cmUgaXQgaW4gUHJvamVjdCBTZXR0aW5ncyAtPiBUZXh0dXJlIENvbXByZXNzaW9uIENvbmZpZ3VyYXRpb24uYCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvcHkob3B0aW9uSXRlbS5zcmMsIG9wdGlvbkl0ZW0uZGVzdCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJldmlld0NvbXByZXNzSW1hZ2UoYXNzZXRVdWlkOiBzdHJpbmcsIHBsYXRmb3JtID0gJ3dlYi1tb2JpbGUnKSB7XG4gICAgY29uc3QgZGVmYXVsdENvbXByZXNzTWFuYWdlciA9IG5ldyBUZXh0dXJlQ29tcHJlc3MocGxhdGZvcm0sIHRydWUpO1xuICAgIGF3YWl0IGRlZmF1bHRDb21wcmVzc01hbmFnZXIuaW5pdCgpO1xuICAgIGNvbnN0IGFzc2V0SW5mbyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KGFzc2V0VXVpZCk7XG4gICAgY29uc3QgdGFzayA9IGRlZmF1bHRDb21wcmVzc01hbmFnZXIuYWRkVGFza1dpdGhBc3NldEluZm8oYXNzZXRJbmZvKTtcbiAgICBpZiAoIXRhc2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBkZWZhdWx0Q29tcHJlc3NNYW5hZ2VyLnJ1bigpO1xuICAgIHJldHVybiB0YXNrO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlDb21wcmVzc0NhY2hlKHV1aWQ6IHN0cmluZykge1xuICAgIGF3YWl0IFRleHR1cmVDb21wcmVzcy5pbml0Q29tbW9uT3B0aW9ucygpO1xuICAgIHJldHVybiBUZXh0dXJlQ29tcHJlc3MucXVlcnlUZXh0dXJlQ29tcHJlc3NDYWNoZSh1dWlkKTtcbn1cblxuZnVuY3Rpb24gaW5jcmVhc2VDdXN0b21Db21wcmVzc051bShjb25maWc6IElDdXN0b21Db25maWcpIHtcbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghY29uZmlnLm51bSkge1xuICAgICAgICBjb25maWcubnVtID0gMDtcbiAgICB9XG4gICAgY29uZmlnLm51bSsrO1xufVxuXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFsbENvbXByZXNzQ29uZmlnKCk6IFByb21pc2U8QWxsVGV4dHVyZUNvbXByZXNzQ29uZmlnPiB7XG4gICAgY29uc3QgY3VzdG9tQ29uZmlnOiBSZWNvcmQ8c3RyaW5nLCBJQ3VzdG9tQ29uZmlnPiA9IGF3YWl0IGJ1aWxkZXJDb25maWcuZ2V0UHJvamVjdCgndGV4dHVyZUNvbXByZXNzQ29uZmlnLmN1c3RvbUNvbmZpZ3MnKTtcbiAgICBjb25zdCBjdXN0b21Gb3JtYXRzOiBSZWNvcmQ8c3RyaW5nLCBJVGV4dHVyZUZvcm1hdEluZm8+ID0ge307XG4gICAgaWYgKGN1c3RvbUNvbmZpZyAmJiBPYmplY3Qua2V5cyhjdXN0b21Db25maWcpLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGNvbnN0IGNvbmZpZyBvZiBPYmplY3QudmFsdWVzKGN1c3RvbUNvbmZpZykpIHtcbiAgICAgICAgICAgIGN1c3RvbUZvcm1hdHNbY29uZmlnLmlkXSA9IHtcbiAgICAgICAgICAgICAgICAuLi5mb3JtYXRzSW5mb1tjb25maWcuZm9ybWF0XSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNvbmZpZy5pZCxcbiAgICAgICAgICAgICAgICBjdXN0b206IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVmYXVsdFN1cHBvcnQsXG4gICAgICAgIGNvbmZpZ0dyb3VwcyxcbiAgICAgICAgdGV4dHVyZUZvcm1hdENvbmZpZ3MsXG4gICAgICAgIGZvcm1hdHNJbmZvOiB7XG4gICAgICAgICAgICAuLi5mb3JtYXRzSW5mbyxcbiAgICAgICAgICAgIC4uLmN1c3RvbUZvcm1hdHMsXG4gICAgICAgIH0sXG4gICAgICAgIGN1c3RvbUZvcm1hdHMsXG4gICAgICAgIHBsYXRmb3JtQ29uZmlnOiBwbHVnaW5NYW5hZ2VyLmdldFRleHR1cmVQbGF0Zm9ybUNvbmZpZ3MoKSxcbiAgICB9O1xufSJdfQ==