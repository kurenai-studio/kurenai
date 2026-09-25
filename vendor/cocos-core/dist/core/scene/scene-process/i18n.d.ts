import { I18n } from '../../base/i18n-class';
declare const i18n: I18n;
export declare function initLocalI18n(): Promise<void>;
/**
 * Reload the local bundle from main process. Callers must invoke this after
 * main-process i18n state changes (setLanguage, dynamic patch registration).
 *
 * NOTE: main process cannot push invalidation in web mode (notify() requires
 * IPC), so reload must be triggered from the scene side after a known mutation.
 */
export declare function reloadLocalI18n(): Promise<void>;
export default i18n;
