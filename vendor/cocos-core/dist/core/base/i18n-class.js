'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
/**
 * 通用 I18n 封装：接受一个 i18next 实例，提供翻译/资源管理 API。
 *
 * 主进程通过 base/i18n.ts 注入 fs-loaded 的全局 i18next 单例；
 * scene-process (WebView) 通过 createInstance() 构造本地实例，从 RPC 注入数据。
 *
 * 拆分理由：本文件不引用任何 fs/Node-only 模块，可被 WebView 端 bundle 复用。
 */
class I18n {
    _lang;
    _instance;
    constructor(instance) {
        this._instance = instance;
        this._lang = instance.language || 'en';
    }
    /** Underlying i18next instance (for advanced init/configuration). */
    get instance() {
        return this._instance;
    }
    /**
     * 设置当前语言。返回 Promise，调用方需要在切换完成后立即查询时应 await。
     */
    async setLanguage(language) {
        this._lang = language;
        await this._instance.changeLanguage(language);
    }
    /**
     * 翻译一个 key，允许传插值参数
     */
    t(key, obj) {
        return this._instance.t(key, obj);
    }
    /**
     * 翻译 name：未带 i18n: 前缀或查不到时原样返回
     */
    transI18nName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }
        const prefix = 'i18n:';
        if (!name.startsWith(prefix)) {
            return name;
        }
        const key = name.slice(prefix.length);
        if (!key) {
            return name;
        }
        if (!this._instance.exists(key)) {
            return name;
        }
        return this._instance.t(key) || name;
    }
    /**
     * 导出所有语言的原始翻译资源（i18next 内部 nested 结构），供远端进程重建本地实例。
     *
     * 返回 `{ lang: 当前语言, data: { en: <raw bundle>, zh: <raw bundle> } }`。
     * 接收方负责 flatten / 注入 i18next（见 scene-process/i18n.ts）。
     */
    getBundle() {
        const result = {};
        for (const lang of ['en', 'zh']) {
            result[lang] = (this._instance.getResourceBundle(lang, 'translation') ?? {});
        }
        return { lang: this._lang, data: result };
    }
    /**
     * 动态注册语言包补丁内容
     */
    registerLanguagePatch(language, patchPath, languageData) {
        if (!language || typeof language !== 'string') {
            console.warn('[i18n] registerLanguagePatch: invalid language', language);
            return;
        }
        if (typeof patchPath !== 'string') {
            console.warn('[i18n] registerLanguagePatch: invalid patch path', patchPath);
            return;
        }
        if (!languageData || typeof languageData !== 'object') {
            console.warn('[i18n] registerLanguagePatch: invalid language data', languageData);
            return;
        }
        const normalizedPrefix = patchPath.replace(/^\.+/, '').trim();
        const entries = {};
        function flatten(obj, prefix) {
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                const currentKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    flatten(value, currentKey);
                }
                else {
                    entries[currentKey] = value;
                }
            });
        }
        flatten(languageData, normalizedPrefix);
        if (Object.keys(entries).length === 0) {
            return;
        }
        this._instance.addResources(language, 'translation', entries);
    }
}
exports.I18n = I18n;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi1jbGFzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2Jhc2UvaTE4bi1jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUtiOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLElBQUk7SUFDYixLQUFLLENBQVM7SUFDTixTQUFTLENBQVU7SUFFM0IsWUFBWSxRQUFpQjtRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDO0lBQzNDLENBQUM7SUFFRCxxRUFBcUU7SUFDckUsSUFBSSxRQUFRO1FBQ1IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBZ0I7UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7UUFDdEIsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxDQUFDLENBQUMsR0FBYSxFQUFFLEdBQStCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7T0FFRztJQUNILGFBQWEsQ0FBQyxJQUFZO1FBQ3RCLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDcEMsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNQLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBUztRQUNMLE1BQU0sTUFBTSxHQUF3QyxFQUFFLENBQUM7UUFDdkQsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBd0IsQ0FBQztRQUN4RyxDQUFDO1FBQ0QsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUM5QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxxQkFBcUIsQ0FBQyxRQUFnQixFQUFFLFNBQWlCLEVBQUUsWUFBaUM7UUFDeEYsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxPQUFPLENBQUMsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLE9BQU87UUFDWCxDQUFDO1FBQ0QsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzVFLE9BQU87UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNwRCxPQUFPLENBQUMsSUFBSSxDQUFDLHFEQUFxRCxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xGLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5RCxNQUFNLE9BQU8sR0FBd0IsRUFBRSxDQUFDO1FBRXhDLFNBQVMsT0FBTyxDQUFDLEdBQXdCLEVBQUUsTUFBYztZQUNyRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUM3QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDckQsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUM5RCxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDaEMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELE9BQU8sQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUV4QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3BDLE9BQU87UUFDWCxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0o7QUF4R0Qsb0JBd0dDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgdHlwZSB7IGkxOG4gYXMgSTE4TmV4dCB9IGZyb20gJ2kxOG5leHQnO1xuaW1wb3J0IHR5cGUgeyBJMThuS2V5cyB9IGZyb20gJy4uLy4uL2kxOG4vdHlwZXMvZ2VuZXJhdGVkJztcblxuLyoqXG4gKiDpgJrnlKggSTE4biDlsIHoo4XvvJrmjqXlj5fkuIDkuKogaTE4bmV4dCDlrp7kvovvvIzmj5Dkvpvnv7vor5Ev6LWE5rqQ566h55CGIEFQSeOAglxuICpcbiAqIOS4u+i/m+eoi+mAmui/hyBiYXNlL2kxOG4udHMg5rOo5YWlIGZzLWxvYWRlZCDnmoTlhajlsYAgaTE4bmV4dCDljZXkvovvvJtcbiAqIHNjZW5lLXByb2Nlc3MgKFdlYlZpZXcpIOmAmui/hyBjcmVhdGVJbnN0YW5jZSgpIOaehOmAoOacrOWcsOWunuS+i++8jOS7jiBSUEMg5rOo5YWl5pWw5o2u44CCXG4gKlxuICog5ouG5YiG55CG55Sx77ya5pys5paH5Lu25LiN5byV55So5Lu75L2VIGZzL05vZGUtb25seSDmqKHlnZfvvIzlj6/ooqsgV2ViVmlldyDnq68gYnVuZGxlIOWkjeeUqOOAglxuICovXG5leHBvcnQgY2xhc3MgSTE4biB7XG4gICAgX2xhbmc6IHN0cmluZztcbiAgICBwcml2YXRlIF9pbnN0YW5jZTogSTE4TmV4dDtcblxuICAgIGNvbnN0cnVjdG9yKGluc3RhbmNlOiBJMThOZXh0KSB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgICAgIHRoaXMuX2xhbmcgPSBpbnN0YW5jZS5sYW5ndWFnZSB8fCAnZW4nO1xuICAgIH1cblxuICAgIC8qKiBVbmRlcmx5aW5nIGkxOG5leHQgaW5zdGFuY2UgKGZvciBhZHZhbmNlZCBpbml0L2NvbmZpZ3VyYXRpb24pLiAqL1xuICAgIGdldCBpbnN0YW5jZSgpOiBJMThOZXh0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruW9k+WJjeivreiogOOAgui/lOWbniBQcm9taXNl77yM6LCD55So5pa56ZyA6KaB5Zyo5YiH5o2i5a6M5oiQ5ZCO56uL5Y2z5p+l6K+i5pe25bqUIGF3YWl044CCXG4gICAgICovXG4gICAgYXN5bmMgc2V0TGFuZ3VhZ2UobGFuZ3VhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLl9sYW5nID0gbGFuZ3VhZ2U7XG4gICAgICAgIGF3YWl0IHRoaXMuX2luc3RhbmNlLmNoYW5nZUxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnv7vor5HkuIDkuKoga2V577yM5YWB6K645Lyg5o+S5YC85Y+C5pWwXG4gICAgICovXG4gICAgdChrZXk6IEkxOG5LZXlzLCBvYmo/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZS50KGtleSwgb2JqKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnv7vor5EgbmFtZe+8muacquW4piBpMThuOiDliY3nvIDmiJbmn6XkuI3liLDml7bljp/moLfov5Tlm55cbiAgICAgKi9cbiAgICB0cmFuc0kxOG5OYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmVmaXggPSAnaTE4bjonO1xuICAgICAgICBpZiAoIW5hbWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXkgPSBuYW1lLnNsaWNlKHByZWZpeC5sZW5ndGgpO1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbnN0YW5jZS5leGlzdHMoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlLnQoa2V5KSB8fCBuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWvvOWHuuaJgOacieivreiogOeahOWOn+Wni+e/u+ivkei1hOa6kO+8iGkxOG5leHQg5YaF6YOoIG5lc3RlZCDnu5PmnoTvvInvvIzkvpvov5znq6/ov5vnqIvph43lu7rmnKzlnLDlrp7kvovjgIJcbiAgICAgKlxuICAgICAqIOi/lOWbniBgeyBsYW5nOiDlvZPliY3or63oqIAsIGRhdGE6IHsgZW46IDxyYXcgYnVuZGxlPiwgemg6IDxyYXcgYnVuZGxlPiB9IH1g44CCXG4gICAgICog5o6l5pS25pa56LSf6LSjIGZsYXR0ZW4gLyDms6jlhaUgaTE4bmV4dO+8iOingSBzY2VuZS1wcm9jZXNzL2kxOG4udHPvvInjgIJcbiAgICAgKi9cbiAgICBnZXRCdW5kbGUoKTogeyBsYW5nOiBzdHJpbmc7IGRhdGE6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+IH0ge1xuICAgICAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgbGFuZyBvZiBbJ2VuJywgJ3poJ10pIHtcbiAgICAgICAgICAgIHJlc3VsdFtsYW5nXSA9ICh0aGlzLl9pbnN0YW5jZS5nZXRSZXNvdXJjZUJ1bmRsZShsYW5nLCAndHJhbnNsYXRpb24nKSA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBsYW5nOiB0aGlzLl9sYW5nLCBkYXRhOiByZXN1bHQgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliqjmgIHms6jlhozor63oqIDljIXooaXkuIHlhoXlrrlcbiAgICAgKi9cbiAgICByZWdpc3Rlckxhbmd1YWdlUGF0Y2gobGFuZ3VhZ2U6IHN0cmluZywgcGF0Y2hQYXRoOiBzdHJpbmcsIGxhbmd1YWdlRGF0YTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgICAgICBpZiAoIWxhbmd1YWdlIHx8IHR5cGVvZiBsYW5ndWFnZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2kxOG5dIHJlZ2lzdGVyTGFuZ3VhZ2VQYXRjaDogaW52YWxpZCBsYW5ndWFnZScsIGxhbmd1YWdlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHBhdGNoUGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2kxOG5dIHJlZ2lzdGVyTGFuZ3VhZ2VQYXRjaDogaW52YWxpZCBwYXRjaCBwYXRoJywgcGF0Y2hQYXRoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWxhbmd1YWdlRGF0YSB8fCB0eXBlb2YgbGFuZ3VhZ2VEYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaTE4bl0gcmVnaXN0ZXJMYW5ndWFnZVBhdGNoOiBpbnZhbGlkIGxhbmd1YWdlIGRhdGEnLCBsYW5ndWFnZURhdGEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFByZWZpeCA9IHBhdGNoUGF0aC5yZXBsYWNlKC9eXFwuKy8sICcnKS50cmltKCk7XG4gICAgICAgIGNvbnN0IGVudHJpZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcblxuICAgICAgICBmdW5jdGlvbiBmbGF0dGVuKG9iajogUmVjb3JkPHN0cmluZywgYW55PiwgcHJlZml4OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50S2V5ID0gcHJlZml4ID8gYCR7cHJlZml4fS4ke2tleX1gIDoga2V5O1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBmbGF0dGVuKHZhbHVlLCBjdXJyZW50S2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbnRyaWVzW2N1cnJlbnRLZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmbGF0dGVuKGxhbmd1YWdlRGF0YSwgbm9ybWFsaXplZFByZWZpeCk7XG5cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKGVudHJpZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5zdGFuY2UuYWRkUmVzb3VyY2VzKGxhbmd1YWdlLCAndHJhbnNsYXRpb24nLCBlbnRyaWVzKTtcbiAgICB9XG59XG4iXX0=