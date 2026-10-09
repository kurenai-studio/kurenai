'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = void 0;
exports.handle = handle;
const project_options_1 = require("./utils/project-options");
exports.title = 'i18n:builder.tasks.settings.options';
const layerMask = [];
for (let i = 0; i <= 19; i++) {
    layerMask[i] = 1 << i;
}
/**
 * 根据选项填充 settings
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    await (0, project_options_1.patchOptionsToSettings)(options, result.settings);
}
