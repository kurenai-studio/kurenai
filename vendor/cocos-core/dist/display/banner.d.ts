/**
 * 创建现代风格的 banner（参考 Gemini CLI 设计）
 */
export declare function createBanner(): string;
/**
 * 创建简洁的 banner（类似 Gemini CLI 风格）
 */
export declare function createSimpleBanner(): string;
/**
 * 创建极简 banner（适合小屏幕）
 */
export declare function createMinimalBanner(): string;
/**
 * 创建欢迎消息
 */
export declare function createWelcomeMessage(): string;
/**
 * 创建启动消息（类似 Gemini CLI）
 */
export declare function createStartupMessage(): string;
/**
 * 创建状态栏（类似 Gemini CLI 底部状态栏）
 */
export declare function createStatusBar(projectPath?: string, mode?: string): string;
