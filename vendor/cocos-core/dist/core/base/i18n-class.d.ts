import type { i18n as I18Next } from 'i18next';
import type { I18nKeys } from '../../i18n/types/generated';
/**
 * 通用 I18n 封装：接受一个 i18next 实例，提供翻译/资源管理 API。
 *
 * 主进程通过 base/i18n.ts 注入 fs-loaded 的全局 i18next 单例；
 * scene-process (WebView) 通过 createInstance() 构造本地实例，从 RPC 注入数据。
 *
 * 拆分理由：本文件不引用任何 fs/Node-only 模块，可被 WebView 端 bundle 复用。
 */
export declare class I18n {
    _lang: string;
    private _instance;
    constructor(instance: I18Next);
    /** Underlying i18next instance (for advanced init/configuration). */
    get instance(): I18Next;
    /**
     * 设置当前语言。返回 Promise，调用方需要在切换完成后立即查询时应 await。
     */
    setLanguage(language: string): Promise<void>;
    /**
     * 翻译一个 key，允许传插值参数
     */
    t(key: I18nKeys, obj?: {
        [key: string]: string;
    }): string;
    /**
     * 翻译 name：未带 i18n: 前缀或查不到时原样返回
     */
    transI18nName(name: string): string;
    /**
     * 导出所有语言的原始翻译资源（i18next 内部 nested 结构），供远端进程重建本地实例。
     *
     * 返回 `{ lang: 当前语言, data: { en: <raw bundle>, zh: <raw bundle> } }`。
     * 接收方负责 flatten / 注入 i18next（见 scene-process/i18n.ts）。
     */
    getBundle(): {
        lang: string;
        data: Record<string, Record<string, any>>;
    };
    /**
     * 动态注册语言包补丁内容
     */
    registerLanguagePatch(language: string, patchPath: string, languageData: Record<string, any>): void;
}
