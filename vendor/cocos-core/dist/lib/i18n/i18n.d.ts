/**
 * i18n lib 入口
 *
 * 供外部宿主 (如 PinK) 在启动时设置当前语言。
 * 设置后,所有走 i18n.transI18nName / i18n.t 的输出会以目标语言返回。
 * 语言码只支持 'zh' / 'en';宿主侧需自行把 zh-cn 等 BCP-47 变体归一化后传入。
 */
export declare function setLanguage(language: string): Promise<void>;
/** 获取当前语言,便于宿主诊断 */
export declare function getLanguage(): Promise<string>;
