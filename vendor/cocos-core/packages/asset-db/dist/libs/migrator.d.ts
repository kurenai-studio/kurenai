export type MigrateStage = 'migrate' | 'preMigrate' | 'postMigrate';
/**
 * 迁移队列
 */
export interface Migrate<T> {
    version: string;
    migrate: (data: T, ...args: any[]) => Promise<T>;
}
/**
 * 钩子函数
 */
export interface MigrateHook<T> {
    pre?: (data: T, ...args: any[]) => Promise<T>;
    post?: (data: T, ...args: any[]) => Promise<T>;
    onError?: (error: Error, stage: MigrateStage, data: T, ...args: any[]) => void;
}
export declare class Migrator<T> {
    private migrations;
    private hook?;
    private lastedVersion;
    constructor(migrations: Migrate<T>[], lastedVersion: string, hook?: MigrateHook<T>);
    run(data: T, startVersion: string, extArgs?: any[]): Promise<T>;
    private onError;
}
