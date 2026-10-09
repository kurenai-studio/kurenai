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
