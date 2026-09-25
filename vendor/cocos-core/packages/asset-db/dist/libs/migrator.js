"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrator = void 0;
const utils_1 = require("./utils");
class Migrator {
    constructor(migrations, lastedVersion, hook) {
        this.migrations = migrations;
        this.lastedVersion = lastedVersion;
        this.hook = hook;
        if (hook === null || hook === void 0 ? void 0 : hook.onError) {
            this.onError = hook.onError;
        }
    }
    async run(data, startVersion, extArgs) {
        if (startVersion === this.lastedVersion) {
            return data;
        }
        if (this.hook && this.hook.pre) {
            try {
                await this.hook.pre(data);
            }
            catch (error) {
                this.onError(error, 'preMigrate', data, ...(extArgs || []));
            }
        }
        let res = data;
        for (const task of this.migrations) {
            const index = (0, utils_1.compareVersion)(startVersion, task.version);
            if (index > 0) {
                continue;
            }
            // 迁移流程
            try {
                console.debug(`Migration: -> ${task.version}`);
                res = await task.migrate(res, ...(extArgs || []));
            }
            catch (error) {
                this.onError(error, 'migrate', res, ...(extArgs || []));
            }
        }
        if (this.hook && this.hook.post) {
            try {
                await this.hook.post(data);
            }
            catch (error) {
                this.onError(error, 'postMigrate', data, ...(extArgs || []));
            }
        }
        return res;
    }
    onError(error, stage, data, ...args) {
        console.error(`Migrate error in ${stage}`);
        console.error(error);
    }
}
exports.Migrator = Migrator;
