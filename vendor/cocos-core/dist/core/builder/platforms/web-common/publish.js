"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = publish;
/**
 * Publish stage (placeholder implementation).
 *
 * Mirrors the structure of the upload stage, but the real publish/release API
 * call is not wired yet. It consumes the `packageId` produced by a prior
 * successful upload stage and writes the publish result back onto
 * `task.buildExitRes.custom.publish`.
 */
async function publish(task, platform, root, options) {
    const packageOptions = getPackageOptions(platform, options);
    const gameId = resolveGameId(packageOptions);
    const version = String(packageOptions.versionName || '').trim();
    const uploadResult = task.buildExitRes.custom.upload;
    const packageId = uploadResult?.packageId;
    if (!packageId) {
        throw new Error('Publish requires a successful upload (missing packageId)');
    }
    console.log(`[web-publish] Publish start: platform=${platform}, game_id=${gameId}, version=${version}, packageId=${packageId}`);
    task.buildExitRes.custom.publish = {
        pending: true,
        success: false,
        packageId,
    };
    try {
        // TODO: call the real publish/release API with packageId
        task.buildExitRes.custom.publish = {
            pending: false,
            success: true,
            packageId,
        };
        console.log(`[web-publish] Publish success: packageId=${packageId}`);
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        task.buildExitRes.custom.publish = {
            pending: false,
            success: false,
            reason,
            packageId,
        };
        console.error(`[web-publish] Publish failed: ${reason}`);
        throw error;
    }
}
function getPackageOptions(platform, options) {
    return (options.packages?.[platform] || {});
}
function resolveGameId(options) {
    return String(options.appid || options.app_id || '').trim();
}
