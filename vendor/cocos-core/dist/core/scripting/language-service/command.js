"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameCommand = exports.Command = exports.CommandType = void 0;
const path_1 = require("path");
const asserts_1 = require("../utils/asserts");
const path_2 = require("../utils/path");
const utils_1 = __importDefault(require("../../base/utils"));
var CommandType;
(function (CommandType) {
    CommandType[CommandType["rename"] = 0] = "rename";
})(CommandType || (exports.CommandType = CommandType = {}));
class Command {
}
exports.Command = Command;
class RenameCommand extends Command {
    oldFilePath;
    newFilePath;
    _newFileDBInfo;
    _oldFileDBInfo;
    /** 新的文件/文件夹在 db的 url */
    _newFileDBURL;
    /** 旧的文件/文件夹在 db的 url */
    _oldFileDBURL;
    /** 仅在移动的内容为文件的时候有效 */
    oldFilePathWithOutExt;
    /** 仅在移动的内容为文件的时候有效 */
    newFilePathWithOutExt;
    static _createDescription(oldFilePath, newFilePath) { return `Rename ${(0, path_2.resolveFileName)(oldFilePath)} to ${(0, path_2.resolveFileName)(newFilePath)}.`; }
    static _createID(oldFilePath, newFilePath) { return this._createDescription(oldFilePath, newFilePath); }
    _executed = false;
    id;
    description;
    commandType;
    static create(oldFilePath, newFilePath) {
        return new RenameCommand(oldFilePath, newFilePath);
    }
    constructor(oldFilePath, newFilePath) {
        super();
        this.oldFilePath = oldFilePath;
        this.newFilePath = newFilePath;
        this.oldFilePath = (0, path_2.resolveFileName)(oldFilePath);
        this.oldFilePathWithOutExt = (0, path_2.removeTSExt)(this.oldFilePath);
        this.newFilePath = (0, path_2.resolveFileName)(newFilePath);
        this.newFilePathWithOutExt = (0, path_2.removeTSExt)(this.newFilePath);
        this.id = RenameCommand._createID(oldFilePath, newFilePath);
        this.description = RenameCommand._createDescription(oldFilePath, newFilePath);
        this.commandType = CommandType.rename;
    }
    /**
      *
      * @param dbUrlInfos
      * @param filePath 修改文件后的资源的路径
      * @param text 修改文件的原始内容
      * @param changes 文件需要做得变动
      * @returns
      */
    applyImportChanges(dbUrlInfos, filePath, text, changes) {
        (0, asserts_1.asserts)(this._newFileDBInfo);
        (0, asserts_1.asserts)(this._newFileDBURL);
        (0, asserts_1.asserts)(this._oldFileDBInfo);
        (0, asserts_1.asserts)(this._newFileDBInfo);
        const filePathWithOutExt = (0, path_2.removeTSExt)(filePath);
        /** 当前修改的脚本是否为命令里的目标脚本 */
        const isTargetFile = filePath === this.newFilePath;
        /** 脚本的目标位置是否与目标目录 */
        const isFileSameDB = utils_1.default.Path.contains(this._newFileDBInfo.target, filePath);
        /** 是否需要额外地处理导入路径 */
        const needToUpdateImportPath = isTargetFile || !isFileSameDB;
        for (let i = changes.length - 1; i >= 0; i--) {
            const { span, newText } = changes[i];
            let _nextText = newText;
            // 原本写了 db://
            const newImportPath = (0, path_1.join)(filePath, '../', _nextText);
            if (needToUpdateImportPath) {
                if (text.substring(span.start, span.start + 5) === path_2.dbURLRoot && !isFileSameDB) {
                    if (!newText.startsWith(path_2.dbURLRoot)) {
                        if (dbUrlInfos) {
                            for (let index = 0; index < dbUrlInfos.length; index++) {
                                const info = dbUrlInfos[index];
                                if (utils_1.default.Path.contains(info.target, newImportPath)) {
                                    const relativePath = utils_1.default.Path.relative(info.target, newImportPath);
                                    _nextText = info.dbURL + (0, path_2.resolveFileName)(relativePath);
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    // 文件放别的 db 了，将引用脚本的 import 更新为 db 协议的写法
                    let oldFilePath;
                    if (filePath === this.newFilePath) {
                        oldFilePath = this.oldFilePathWithOutExt;
                    }
                    else {
                        oldFilePath = filePathWithOutExt;
                    }
                    const oldImportPath = (0, path_2.resolveFileName)((0, path_1.join)(oldFilePath, '../', text.substring(span.start, this.textSpanEnd(span))));
                    if (oldImportPath === this.oldFilePathWithOutExt) {
                        // 这个脚本引用了旧的文件
                        _nextText = this._newFileDBURL;
                    }
                    else if (utils_1.default.Path.contains(this.oldFilePath + '/', oldImportPath)) {
                        // 这个脚本引用了旧的目录里的文件
                        _nextText = oldImportPath.replace(this.oldFilePath, this._newFileDBURL);
                    }
                    else if (oldFilePath === this.oldFilePathWithOutExt) {
                        // 旧的脚本要更新引用路径了，这个时候所有相对路径全部要换成 db 协议
                        const relativePath = utils_1.default.Path.relative(this._oldFileDBInfo.target, oldImportPath);
                        _nextText = this._oldFileDBInfo.dbURL + (0, path_2.resolveFileName)(relativePath);
                    }
                }
            }
            text = `${text.substring(0, span.start)}${_nextText}${text.substring(this.textSpanEnd(span))}`;
        }
        return text;
    }
    textSpanEnd(span) {
        return span.start + span.length;
    }
    async execute(languageServiceAdapter) {
        for (let index = 0; index < languageServiceAdapter.dbURLInfos.length; index++) {
            const info = languageServiceAdapter.dbURLInfos[index];
            if (utils_1.default.Path.contains(info.target, this.newFilePath)) {
                this._newFileDBInfo = info;
                const relativePath = utils_1.default.Path.relative(info.target, this.newFilePath);
                this._newFileDBURL = info.dbURL + (0, path_2.removeTSExt)((0, path_2.resolveFileName)(relativePath));
            }
            if (utils_1.default.Path.contains(info.target, this.oldFilePath)) {
                this._oldFileDBInfo = info;
                const relativePath = utils_1.default.Path.relative(info.target, this.oldFilePath);
                this._oldFileDBURL = info.dbURL + (0, path_2.removeTSExt)((0, path_2.resolveFileName)(relativePath));
            }
        }
        const filePathSet = new Set();
        if (!this._executed) {
            const changes = languageServiceAdapter.languageService.getEditsForFileRename(this.oldFilePath, this.newFilePath, {}, undefined);
            for (let index = 0; index < changes.length; index++) {
                const change = changes[index];
                const content = languageServiceAdapter.host.readFile(change.fileName);
                if (!content) {
                    continue;
                }
                const newContent = this.applyImportChanges(languageServiceAdapter.dbURLInfos, change.fileName, content, change.textChanges);
                filePathSet.add(change.fileName);
                const info = languageServiceAdapter.host.readCache(change.fileName);
                (0, asserts_1.asserts)(info);
                languageServiceAdapter.host.writeCache({ uuid: info.uuid, filePath: change.fileName, content: newContent });
            }
            this._executed = true;
        }
        return filePathSet;
    }
}
exports.RenameCommand = RenameCommand;
