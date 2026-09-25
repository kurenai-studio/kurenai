/**
 * 交互式 CLI 界面
 */
export declare class InteractiveCLI {
    private spinner;
    private progressBar;
    /**
     * 显示欢迎界面
     */
    showWelcome(): void;
    /**
     * 显示启动消息（类似 Gemini CLI）
     */
    showStartupMessage(): void;
    /**
     * 显示加载动画
     */
    startSpinner(message: string): void;
    /**
     * 更新加载动画消息
     */
    updateSpinner(message: string): void;
    /**
     * 停止加载动画
     */
    stopSpinner(success?: boolean, message?: string): void;
    /**
     * 显示进度条
     */
    startProgress(total: number, message?: string): void;
    /**
     * 更新进度条
     */
    updateProgress(value: number): void;
    /**
     * 停止进度条
     */
    stopProgress(): void;
    /**
     * 显示确认对话框
     */
    confirm(message: string, defaultValue?: boolean): Promise<boolean>;
    /**
     * 显示选择列表
     */
    select<T = string>(message: string, choices: Array<{
        name: string;
        value: T;
        disabled?: boolean;
    }>): Promise<T>;
    /**
     * 显示输入框
     */
    input(message: string, defaultValue?: string): Promise<string>;
    /**
     * 显示多选列表
     */
    checkbox<T = string>(message: string, choices: Array<{
        name: string;
        value: T;
        checked?: boolean;
    }>): Promise<T[]>;
    /**
     * 显示密码输入框
     */
    password(message: string): Promise<string>;
    /**
     * 显示成功消息
     */
    success(message: string): void;
    /**
     * 显示错误消息
     */
    error(message: string): void;
    /**
     * 显示警告消息
     */
    warning(message: string): void;
    /**
     * 显示信息消息
     */
    info(message: string): void;
    /**
     * 显示分隔线
     */
    separator(char?: string, length?: number): void;
    /**
     * 显示表格
     */
    table(headers: string[], rows: string[][]): void;
}
export declare const interactive: InteractiveCLI;
