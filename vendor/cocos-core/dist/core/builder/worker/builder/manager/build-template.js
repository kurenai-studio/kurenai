"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const i18n_1 = __importDefault(require("../../../../base/i18n"));
const utils_1 = __importDefault(require("../../../../base/utils"));
const builder_config_1 = __importDefault(require("../../../share/builder-config"));
class BuildTemplate {
    _buildTemplateDirs = [];
    map = {};
    _versionUser = '';
    config;
    get isEnable() {
        return !!this._buildTemplateDirs.length;
    }
    constructor(platform, taskName, config) {
        this.config = config;
        const buildTemplateDir = builder_config_1.default.buildTemplateDir;
        // 初始化不同层级的构建模板地址，按照使用优先级从大到小排布
        const commonDir = (0, path_1.join)(buildTemplateDir, 'common');
        const platformDir = (0, path_1.join)(buildTemplateDir, this.config?.dirname || platform);
        const taskDir = (0, path_1.join)(buildTemplateDir, taskName);
        if ((0, fs_extra_1.existsSync)(taskDir)) {
            this._buildTemplateDirs.push(taskDir);
        }
        if ((0, fs_extra_1.existsSync)(platformDir)) {
            this._buildTemplateDirs.push(platformDir);
        }
        if ((0, fs_extra_1.existsSync)(commonDir)) {
            this._buildTemplateDirs.push(commonDir);
        }
        const internalTemplate = {
            application: 'application.ejs',
        };
        Object.keys(internalTemplate).forEach((name) => {
            this.initUrl(internalTemplate[name], name);
        });
        // 初始化缓存版本号
        this._initVersion(platform);
    }
    query(name) {
        return this.map[name]?.path;
    }
    async _initVersion(platform) {
        if (!this.config) {
            return;
        }
        try {
            // 默认构建模板需要有版本号
            const templateVersionJson = (0, path_1.join)(builder_config_1.default.buildTemplateDir, 'templates-version.json');
            // 用户模板版本号
            if ((0, fs_extra_1.existsSync)(templateVersionJson)) {
                this._versionUser = (await (0, fs_extra_1.readJSON)(templateVersionJson))[platform];
            }
            this._versionUser = this._versionUser || '1.0.0';
            // 用户构建模板版本小于默认构建模板版本，警告建议更新
            if (utils_1.default.Parse.compareVersion(this.config.version, this._versionUser) > 0) {
                console.warn(i18n_1.default.t('builder.tips.template_version_warning', {
                    version: this._versionUser,
                    internalConfig: this.config.version,
                    platform,
                }));
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
    findFile(relativeUrl) {
        for (let i = 0; i < this._buildTemplateDirs.length; i++) {
            const dir = this._buildTemplateDirs[i];
            const path = (0, path_1.join)(dir, relativeUrl);
            if ((0, fs_extra_1.existsSync)(path)) {
                return path;
            }
        }
        return '';
    }
    initUrl(relativeUrl, name) {
        const path = this.findFile(relativeUrl);
        name = name || (0, path_1.basename)(relativeUrl);
        if (path) {
            this.map[name] = {
                path,
                url: relativeUrl,
            };
            return path;
        }
    }
    async copyTo(dest) {
        // 按照优先级拷贝构建模板
        for (let index = (this._buildTemplateDirs.length - 1); index >= 0; index--) {
            const dir = this._buildTemplateDirs[index];
            await (0, fs_extra_1.copy)(dir, dest);
        }
        // 移除已经被处理的一些特殊的文件夹
        await Promise.all(Object.values(this.map).map((info) => {
            return (0, fs_extra_1.remove)((0, path_1.join)(dest, info.url));
        }));
    }
}
exports.BuildTemplate = BuildTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtdGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL21hbmFnZXIvYnVpbGQtdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQThEO0FBQzlELCtCQUFzQztBQUN0QyxpRUFBeUM7QUFHekMsbUVBQTJDO0FBQzNDLG1GQUEwRDtBQUUxRCxNQUFhLGFBQWE7SUFDdEIsa0JBQWtCLEdBQWEsRUFBRSxDQUFDO0lBQ2xDLEdBQUcsR0FHRSxFQUFFLENBQUM7SUFDUixZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLE1BQU0sQ0FBdUI7SUFDN0IsSUFBSSxRQUFRO1FBQ1IsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztJQUM1QyxDQUFDO0lBRUQsWUFBWSxRQUEyQixFQUFFLFFBQWdCLEVBQUUsTUFBNEI7UUFDbkYsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsTUFBTSxnQkFBZ0IsR0FBSSx3QkFBYSxDQUFDLGdCQUFnQixDQUFDO1FBQ3pELCtCQUErQjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRCxNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sSUFBSSxRQUFRLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRCxJQUFJLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELElB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QUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksR0FBRyxJQUFJLElBQUksSUFBQSxlQUFRLEVBQUMsV0FBVyxDQUFDLENBQUM7UUFDckMsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNQLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUc7Z0JBQ2IsSUFBSTtnQkFDSixHQUFHLEVBQUUsV0FBVzthQUNuQixDQUFDO1lBQ0YsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVk7UUFDckIsY0FBYztRQUNkLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUN6RSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsTUFBTSxJQUFBLGVBQUksRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUNELG1CQUFtQjtRQUNuQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkQsT0FBTyxJQUFBLGlCQUFNLEVBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0NBQ0o7QUF0R0Qsc0NBc0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzU3luYywgY29weSwgcmVtb3ZlLCByZWFkSlNPTiB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgUGxhdGZvcm0gfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMnO1xuaW1wb3J0IHsgSUJ1aWxkVGVtcGxhdGUsIEJ1aWxkVGVtcGxhdGVDb25maWcgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCBidWlsZGVyQ29uZmlnIGZyb20gJy4uLy4uLy4uL3NoYXJlL2J1aWxkZXItY29uZmlnJztcblxuZXhwb3J0IGNsYXNzIEJ1aWxkVGVtcGxhdGUgaW1wbGVtZW50cyBJQnVpbGRUZW1wbGF0ZSB7XG4gICAgX2J1aWxkVGVtcGxhdGVEaXJzOiBzdHJpbmdbXSA9IFtdO1xuICAgIG1hcDogUmVjb3JkPHN0cmluZywge1xuICAgICAgICB1cmw6IHN0cmluZztcbiAgICAgICAgcGF0aDogc3RyaW5nO1xuICAgIH0+ID0ge307XG4gICAgX3ZlcnNpb25Vc2VyID0gJyc7XG4gICAgY29uZmlnPzogQnVpbGRUZW1wbGF0ZUNvbmZpZztcbiAgICBnZXQgaXNFbmFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihwbGF0Zm9ybTogUGxhdGZvcm0gfCBzdHJpbmcsIHRhc2tOYW1lOiBzdHJpbmcsIGNvbmZpZz86IEJ1aWxkVGVtcGxhdGVDb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGNvbnN0IGJ1aWxkVGVtcGxhdGVEaXIgID0gYnVpbGRlckNvbmZpZy5idWlsZFRlbXBsYXRlRGlyO1xuICAgICAgICAvLyDliJ3lp4vljJbkuI3lkIzlsYLnuqfnmoTmnoTlu7rmqKHmnb/lnLDlnYDvvIzmjInnhafkvb/nlKjkvJjlhYjnuqfku47lpKfliLDlsI/mjpLluINcbiAgICAgICAgY29uc3QgY29tbW9uRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCAnY29tbW9uJyk7XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCB0aGlzLmNvbmZpZz8uZGlybmFtZSB8fCBwbGF0Zm9ybSk7XG4gICAgICAgIGNvbnN0IHRhc2tEaXIgPSBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsIHRhc2tOYW1lKTtcbiAgICAgICAgaWYgKGV4aXN0c1N5bmModGFza0RpcikpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLnB1c2godGFza0Rpcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocGxhdGZvcm1EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKHBsYXRmb3JtRGlyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhjb21tb25EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKGNvbW1vbkRpcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW50ZXJuYWxUZW1wbGF0ZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgIGFwcGxpY2F0aW9uOiAnYXBwbGljYXRpb24uZWpzJyxcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmtleXMoaW50ZXJuYWxUZW1wbGF0ZSkuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbml0VXJsKGludGVybmFsVGVtcGxhdGVbbmFtZV0sIG5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDliJ3lp4vljJbnvJPlrZjniYjmnKzlj7dcbiAgICAgICAgdGhpcy5faW5pdFZlcnNpb24ocGxhdGZvcm0pO1xuICAgIH1cblxuICAgIHF1ZXJ5KG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXBbbmFtZV0/LnBhdGg7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfaW5pdFZlcnNpb24ocGxhdGZvcm06IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOm7mOiupOaehOW7uuaooeadv+mcgOimgeacieeJiOacrOWPt1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVWZXJzaW9uSnNvbiA9IGpvaW4oYnVpbGRlckNvbmZpZy5idWlsZFRlbXBsYXRlRGlyLCAndGVtcGxhdGVzLXZlcnNpb24uanNvbicpO1xuICAgICAgICAgICAgLy8g55So5oi35qih5p2/54mI5pys5Y+3XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyh0ZW1wbGF0ZVZlcnNpb25Kc29uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnNpb25Vc2VyID0gKGF3YWl0IHJlYWRKU09OKHRlbXBsYXRlVmVyc2lvbkpzb24pKVtwbGF0Zm9ybV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92ZXJzaW9uVXNlciA9IHRoaXMuX3ZlcnNpb25Vc2VyIHx8ICcxLjAuMCc7XG4gICAgICAgICAgICAvLyDnlKjmiLfmnoTlu7rmqKHmnb/niYjmnKzlsI/kuo7pu5jorqTmnoTlu7rmqKHmnb/niYjmnKzvvIzorablkYrlu7rorq7mm7TmlrBcbiAgICAgICAgICAgIGlmICh1dGlscy5QYXJzZS5jb21wYXJlVmVyc2lvbih0aGlzLmNvbmZpZy52ZXJzaW9uLCB0aGlzLl92ZXJzaW9uVXNlcikgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGkxOG4udCgnYnVpbGRlci50aXBzLnRlbXBsYXRlX3ZlcnNpb25fd2FybmluZycsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdGhpcy5fdmVyc2lvblVzZXIsXG4gICAgICAgICAgICAgICAgICAgIGludGVybmFsQ29uZmlnOiB0aGlzLmNvbmZpZy52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBwbGF0Zm9ybSxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbmRGaWxlKHJlbGF0aXZlVXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkaXIgPSB0aGlzLl9idWlsZFRlbXBsYXRlRGlyc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBqb2luKGRpciwgcmVsYXRpdmVVcmwpO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgaW5pdFVybChyZWxhdGl2ZVVybDogc3RyaW5nLCBuYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmZpbmRGaWxlKHJlbGF0aXZlVXJsKTtcbiAgICAgICAgbmFtZSA9IG5hbWUgfHwgYmFzZW5hbWUocmVsYXRpdmVVcmwpO1xuICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgdGhpcy5tYXBbbmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICB1cmw6IHJlbGF0aXZlVXJsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY29weVRvKGRlc3Q6IHN0cmluZykge1xuICAgICAgICAvLyDmjInnhafkvJjlhYjnuqfmi7fotJ3mnoTlu7rmqKHmnb9cbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAodGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMubGVuZ3RoIC0gMSk7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzW2luZGV4XTtcbiAgICAgICAgICAgIGF3YWl0IGNvcHkoZGlyLCBkZXN0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyDnp7vpmaTlt7Lnu4/ooqvlpITnkIbnmoTkuIDkupvnibnmrornmoTmlofku7blpLlcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LnZhbHVlcyh0aGlzLm1hcCkubWFwKChpbmZvKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlKGpvaW4oZGVzdCwgaW5mby51cmwpKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbiJdfQ==