"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCCEnvConstants = getCCEnvConstants;
const ccbuild_1 = require("@cocos/ccbuild");
async function getCCEnvConstants(options, engineRoot) {
    const statsQuery = await ccbuild_1.StatsQuery.create(engineRoot);
    return statsQuery.constantManager.genCCEnvConstants({
        mode: 'BUILD',
        platform: options.platform,
        flags: options.flags ?? {},
    });
}
