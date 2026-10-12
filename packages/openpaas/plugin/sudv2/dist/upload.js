"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBeforeUpload = onBeforeUpload;
exports.runUpload = runUpload;
exports.onAfterUpload = onAfterUpload;
exports.run = run;
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_extra_1 = __importStar(require("fs-extra"));
const hooks_1 = require("./hooks");
class UploadHttpError extends Error {
    status;
    retryAfter;
    /**
     * Wraps upload HTTP failures with status and retry-after metadata for retry decisions.
     */
    constructor(message, status, retryAfter) {
        super(message);
        this.status = status;
        this.retryAfter = retryAfter;
    }
}
const UPLOAD_STAGE_PROGRESS_WEIGHT = 0.2;
const MAX_UPLOAD_RETRIES = 5;
/**
 * Validates upload prerequisites and resolves package files before the upload stage starts.
 */
async function onBeforeUpload(root, options) {
    const packagesOptions = options.packages.openpaas;
    if (!fs_extra_1.default.existsSync(root)) {
        throw new Error(`Upload root does not exist: ${root}`);
    }
    if (!resolveGameId(packagesOptions)) {
        throw new Error('Missing appid, cannot upload OpenPaaS package');
    }
    if (!packagesOptions.versionName) {
        throw new Error('Missing versionName, cannot upload OpenPaaS package');
    }
    if (!packagesOptions.encryptKey) {
        throw new Error('Missing encryptKey, cannot upload OpenPaaS package');
    }
    if (!resolvePackageCodeVersion(packagesOptions)) {
        throw new Error('Missing codeVersion, cannot upload OpenPaaS package. Refresh the package context first.');
    }
    resolveUploadPackages(root, options, this.buildExitRes.custom.packagesJson);
}
/**
 * Uploads the signed OpenPaaS packages via presigned URLs, then confirms each
 * package with the OpenPaaS service while updating task progress/state.
 */
async function runUpload(task, root, options) {
    const uploadContext = createUploadRuntimeContext(task, root, options);
    const restoreAbortBinding = bindUploadAbort(task, uploadContext.abortController);
    try {
        startUpload(task, uploadContext);
        // 1. Request presigned direct-upload URLs from OpenPaaS.
        const uploadUrls = await requestDirectUploadUrls(uploadContext.baseUrl, uploadContext.accessToken, {
            gameId: uploadContext.gameId,
            codeVersion: uploadContext.codeVersion,
            packagesInfo: uploadContext.packagesInfo,
            signal: uploadContext.abortController.signal,
        });
        console.log(`[openpaas-upload] Direct upload URLs acquired: ${JSON.stringify(uploadUrls)}`);
        uploadContext.completedWorkItems += 1;
        uploadContext.progress.report('[openpaas-upload] Upload URLs acquired', uploadContext.completedWorkItems);
        // 2. PUT packages to object storage in parallel.
        await uploadPackagesToObjectStorage(uploadUrls, uploadContext.packagesInfo, uploadContext.abortController.signal, (packageInfo, completed) => {
            uploadContext.completedWorkItems += completed;
            uploadContext.progress.report(`[openpaas-upload] Package uploaded: ${packageInfo.path}`, uploadContext.completedWorkItems);
        });
        // 3. Confirm the main package upload; the service returns the package id.
        const packageId = await confirmUploadedMainPackage(uploadContext.baseUrl, uploadContext.accessToken, {
            gameId: uploadContext.gameId,
            version: uploadContext.version,
            secret: uploadContext.secret,
            md5: uploadContext.packagesInfo.mainPackage.md5,
            codeVersion: uploadContext.codeVersion,
            subPackages: uploadContext.packagesInfo.subPackages,
            signal: uploadContext.abortController.signal,
        });
        uploadContext.uploadedPackageId = packageId;
        uploadContext.completedWorkItems += 1;
        setUploadState(task, uploadContext, {
            packageId,
            mainPackage: {
                ...uploadContext.packagesInfo.mainPackage,
                completed: true,
            },
        });
        uploadContext.progress.report(`[openpaas-upload] Main package confirmed: ${uploadContext.packagesInfo.mainPackage.path}`, uploadContext.completedWorkItems);
        // 4. Confirm sub-packages sequentially.
        const subPackageResults = await confirmSubPackages(task, uploadContext, packageId);
        setUploadState(task, uploadContext, {
            pending: false,
            success: true,
            packageId,
            mainPackage: uploadContext.packagesInfo.mainPackage,
            subPackages: subPackageResults,
        });
        uploadContext.progress.report(`[openpaas-upload] Upload completed: package_id=${packageId}`, uploadContext.totalWorkItems);
        console.log(`[openpaas-upload] Upload success: package_id=${packageId}, sub_packages=${subPackageResults.length}`);
    }
    catch (error) {
        failUpload(task, uploadContext, error);
    }
    finally {
        restoreAbortBinding();
    }
}
/**
 * Prints final upload state after the upload stage finishes.
 */
async function onAfterUpload() {
    const uploadResult = this.buildExitRes.custom.upload;
    if (uploadResult?.pending) {
        console.log(`[openpaas-upload] Upload task started: ${JSON.stringify(uploadResult)}`);
    }
    else if (uploadResult) {
        console.log(`[openpaas-upload] Upload completed: ${JSON.stringify(uploadResult)}`);
    }
}
/**
 * Collects package output information for the run stage without starting an upload.
 */
async function run(root, options) {
    const packagesInfo = resolveUploadPackages(root, options, this.buildExitRes.custom.packagesJson);
    this.buildExitRes.custom.run = {
        mainPackage: packagesInfo.mainPackage,
        subPackages: packagesInfo.subPackages,
    };
    console.log(`[openpaas-run] Package is ready: ${packagesInfo.mainPackage.path}`);
}
/**
 * Builds the shared runtime context used by the upload stage.
 */
function createUploadRuntimeContext(task, root, options) {
    const packageOptions = options.packages.openpaas;
    const packagesInfo = resolveUploadPackages(root, options, task.buildExitRes.custom.packagesJson);
    const accessToken = (0, hooks_1.resolveAccessToken)(packageOptions);
    if (!accessToken) {
        throw new Error('Missing OpenPaaS access token. Pass accessToken in upload options.');
    }
    const totalPackages = 1 + packagesInfo.subPackages.length;
    const totalWorkItems = 1 + totalPackages * 2;
    return {
        packagesInfo,
        gameId: resolveGameId(packageOptions),
        version: packageOptions.versionName,
        secret: packageOptions.encryptKey,
        codeVersion: resolvePackageCodeVersion(packageOptions),
        accessToken,
        baseUrl: (0, hooks_1.resolveUploadBaseUrl)(packageOptions),
        totalPackages,
        totalWorkItems,
        progress: createUploadProgressReporter(task, totalWorkItems),
        abortController: new AbortController(),
        subPackageStates: packagesInfo.subPackages.map((subPackage) => ({
            name: subPackage.name,
            pending: true,
            completed: false,
        })),
        completedWorkItems: 0,
    };
}
/**
 * Writes the current upload state into buildExitRes for UI and follow-up stages.
 */
function setUploadState(task, context, partial = {}) {
    task.buildExitRes.custom.upload = {
        pending: true,
        success: false,
        mainPackage: context.packagesInfo.mainPackage,
        subPackages: context.subPackageStates,
        version: context.version,
        codeVersion: context.codeVersion,
        ...partial,
    };
}
/**
 * Initializes upload progress and marks the upload stage as pending.
 */
function startUpload(task, context) {
    console.log(`[openpaas-upload] Upload start: game_id=${context.gameId}, version=${context.version}, code_version=${context.codeVersion || '(empty)'}`);
    context.progress.report(`[openpaas-upload] Preparing ${context.totalPackages} package(s)`, 0);
    setUploadState(task, context);
}
/**
 * Confirms uploaded sub-packages sequentially and refreshes the persisted upload state after each package.
 */
async function confirmSubPackages(task, context, packageId) {
    if (!context.packagesInfo.subPackages.length) {
        console.log('[openpaas-upload] No sub-package to confirm, main package upload completed');
        return [];
    }
    const results = [];
    for (let index = 0; index < context.packagesInfo.subPackages.length; index++) {
        const subPackage = context.packagesInfo.subPackages[index];
        context.progress.report(`[openpaas-upload] Confirming sub-package (${index + 2}/${context.totalPackages}): ${subPackage.name}`, context.completedWorkItems);
        console.log(`[openpaas-upload] Confirming sub-package (${index + 2}/${context.totalPackages}): ${subPackage.name}`);
        const result = await confirmUploadedSubPackage(context.baseUrl, context.accessToken, {
            packageId,
            gameId: context.gameId,
            name: subPackage.name,
            md5: subPackage.md5,
            signal: context.abortController.signal,
        });
        context.completedWorkItems += 1;
        const subPackageResult = {
            name: subPackage.name,
            completed: !!result.completed,
        };
        context.subPackageStates[index] = {
            ...subPackageResult,
            pending: false,
        };
        results.push(subPackageResult);
        setUploadState(task, context, {
            packageId,
            mainPackage: {
                ...context.packagesInfo.mainPackage,
                completed: true,
            },
        });
        context.progress.report(`[openpaas-upload] Sub-package confirmed: ${subPackage.name}`, context.completedWorkItems);
    }
    return results;
}
/**
 * Records upload failure details, reports progress, and rethrows the original error.
 */
function failUpload(task, context, error) {
    const reason = error instanceof Error ? error.message : String(error);
    setUploadState(task, context, {
        pending: false,
        success: false,
        reason,
        packageId: context.uploadedPackageId,
    });
    context.progress.report(`[openpaas-upload] Upload failed: ${reason}`, context.completedWorkItems);
    console.error(`[openpaas-upload] Upload failed: ${reason}`);
    throw error;
}
/**
 * Resolves the game id used by upload APIs.
 */
function resolveGameId(options) {
    return (0, hooks_1.resolveAppId)(options);
}
/**
 * Resolves the package code version from explicit options first, then from the
 * OpenPaaS package context's game_info. Returns undefined when neither is set.
 */
function resolvePackageCodeVersion(options) {
    return (0, hooks_1.normalizeCodeVersion)(options.codeVersion ??
        (0, hooks_1.getContextGameInfo)(options.context).code_version);
}
/**
 * Resolves signed package files for upload from make output first, then from the build dist directory.
 */
function resolveUploadPackages(root, options, packagesJson) {
    const makePackagesInfo = resolveUploadPackagesFromMakeResult(packagesJson);
    if (makePackagesInfo) {
        return makePackagesInfo;
    }
    const packagesOptions = options.packages.openpaas;
    const distPath = (0, path_1.join)(root, 'dist');
    const mainPackagePath = (0, path_1.join)(distPath, `${options.name}.sp`);
    if (!fs_extra_1.default.existsSync(mainPackagePath)) {
        throw new Error(`Main package does not exist: ${mainPackagePath}. Please run make before upload.`);
    }
    const subPackagesFromOptions = Array.isArray(packagesOptions.subpackages) ? packagesOptions.subpackages : [];
    let subPackages = subPackagesFromOptions.map((subpackage) => {
        const packagePath = (0, path_1.join)(distPath, `${subpackage.name}.sp`);
        if (!fs_extra_1.default.existsSync(packagePath)) {
            throw new Error(`Sub package does not exist: ${packagePath}. Please run make before upload.`);
        }
        return {
            name: subpackage.name,
            path: packagePath,
            md5: (0, hooks_1.computeFileMd5)(packagePath),
            size: fs_extra_1.default.statSync(packagePath).size,
        };
    });
    if (!subPackages.length && fs_extra_1.default.existsSync(distPath)) {
        subPackages = fs_extra_1.default.readdirSync(distPath)
            .filter((file) => file.endsWith('.sp'))
            .map((file) => (0, path_1.join)(distPath, file))
            .filter((filePath) => filePath !== mainPackagePath)
            .map((filePath) => ({
            name: (0, path_1.basename)(filePath, '.sp'),
            path: filePath,
            md5: (0, hooks_1.computeFileMd5)(filePath),
            size: fs_extra_1.default.statSync(filePath).size,
        }));
    }
    return {
        mainPackage: {
            name: 'main',
            path: mainPackagePath,
            md5: (0, hooks_1.computeFileMd5)(mainPackagePath),
            size: fs_extra_1.default.statSync(mainPackagePath).size,
        },
        subPackages,
    };
}
/**
 * Converts the make-stage packagesJson result into upload package metadata.
 */
function resolveUploadPackagesFromMakeResult(packagesJson) {
    if (!packagesJson || typeof packagesJson !== 'object') {
        return undefined;
    }
    const makeResult = packagesJson;
    if (typeof makeResult.mainPackage !== 'string' || !makeResult.mainPackage) {
        return undefined;
    }
    if (!fs_extra_1.default.existsSync(makeResult.mainPackage)) {
        throw new Error(`Main package does not exist: ${makeResult.mainPackage}. Please run make before upload.`);
    }
    const subPackages = Array.isArray(makeResult.subPackages) ? makeResult.subPackages.map((subpackage) => {
        const item = subpackage;
        if (typeof item.name !== 'string' || typeof item.path !== 'string') {
            return undefined;
        }
        if (!fs_extra_1.default.existsSync(item.path)) {
            throw new Error(`Sub package does not exist: ${item.path}. Please run make before upload.`);
        }
        return {
            name: item.name,
            path: item.path,
            md5: typeof item.md5 === 'string' && item.md5 ? item.md5 : (0, hooks_1.computeFileMd5)(item.path),
            size: fs_extra_1.default.statSync(item.path).size,
        };
    }).filter((subpackage) => !!subpackage) : [];
    console.log(`[openpaas-upload] Use make packagesJson: main=${makeResult.mainPackage}, sub_packages=${subPackages.length}`);
    return {
        mainPackage: {
            name: 'main',
            path: makeResult.mainPackage,
            md5: typeof makeResult.md5 === 'string' && makeResult.md5 ? makeResult.md5 : (0, hooks_1.computeFileMd5)(makeResult.mainPackage),
            size: fs_extra_1.default.statSync(makeResult.mainPackage).size,
        },
        subPackages,
    };
}
/**
 * Requests presigned direct-upload URLs for the main and sub packages.
 */
async function requestDirectUploadUrls(baseUrl, accessToken, params) {
    return requestUploadWithRetry(() => postJson(baseUrl, accessToken, '/api/game/package/direct/upload-url', {
        game_id: params.gameId,
        code_version: params.codeVersion,
        md5: params.packagesInfo.mainPackage.md5,
        file_size: params.packagesInfo.mainPackage.size,
        sub_packages: params.packagesInfo.subPackages.map((subpackage) => ({
            sub_package_name: subpackage.name,
            md5: subpackage.md5,
            file_size: subpackage.size,
        })),
    }, params.signal), params.signal);
}
/**
 * Confirms the main package upload with the OpenPaaS service and returns the package id.
 */
async function confirmUploadedMainPackage(baseUrl, accessToken, params) {
    const fields = {
        game_id: params.gameId,
        version: params.version,
        secret: params.secret,
        md5: params.md5,
        code_version: params.codeVersion,
    };
    if (params.subPackages.length) {
        fields.sub_packages = JSON.stringify(params.subPackages.map((subpackage) => ({
            sub_package_name: subpackage.name,
            md5: subpackage.md5,
        })));
    }
    const response = await postFormWithRetry(baseUrl, accessToken, '/api/game/package/direct/upload', fields, params.signal);
    const packageId = response.package_id;
    if (!packageId) {
        throw new Error('Main package confirmation succeeded but no package_id returned');
    }
    return packageId;
}
/**
 * Confirms one uploaded sub-package under an existing package id.
 */
async function confirmUploadedSubPackage(baseUrl, accessToken, params) {
    return postFormWithRetry(baseUrl, accessToken, '/api/game/package/direct/sub/upload', {
        package_id: params.packageId,
        game_id: params.gameId,
        sub_package_name: params.name,
        md5: params.md5,
    }, params.signal);
}
/**
 * Validates a presigned direct-upload target returned by the service.
 */
function validateDirectUploadTarget(target, label) {
    if (!target?.upload_url) {
        throw new Error(`Invalid direct upload URL response: ${label} upload_url is missing`);
    }
    return target;
}
/**
 * PUTs the main and sub packages to their presigned object-storage URLs in parallel.
 * Each PUT must carry the package's Content-MD5 (base64) header.
 */
async function uploadPackagesToObjectStorage(uploadUrls, packagesInfo, signal, onUploaded) {
    const mainTarget = validateDirectUploadTarget(uploadUrls.main_package, 'main package');
    if (!Array.isArray(uploadUrls.sub_packages)) {
        throw new Error('Invalid direct upload URL response: sub_packages must be an array');
    }
    const targetsByName = new Map();
    for (const target of uploadUrls.sub_packages) {
        const name = String(target?.sub_package_name || '').trim();
        if (!name || targetsByName.has(name)) {
            throw new Error(`Invalid direct upload URL response: duplicate or missing sub-package name '${name}'`);
        }
        targetsByName.set(name, validateDirectUploadTarget(target, `sub-package '${name}'`));
    }
    if (targetsByName.size !== packagesInfo.subPackages.length) {
        throw new Error('Invalid direct upload URL response: sub-package count does not match local packages');
    }
    const uploads = [{
            packageInfo: packagesInfo.mainPackage,
            target: mainTarget,
        }];
    for (const subPackage of packagesInfo.subPackages) {
        const target = targetsByName.get(subPackage.name);
        if (!target) {
            throw new Error(`Invalid direct upload URL response: missing sub-package '${subPackage.name}'`);
        }
        uploads.push({ packageInfo: subPackage, target });
    }
    await Promise.all(uploads.map(async ({ packageInfo, target }) => {
        // Content-MD5 (base64-encoded MD5) is required on the presigned-URL PUT.
        console.log(`[openpaas-upload] PUT ${packageInfo.path} , url: ${target.upload_url}`);
        const fileMd5Base64 = await calculateFileMd5Base64(packageInfo.path);
        await putPackageWithRetry(target.upload_url, packageInfo.path, fileMd5Base64, signal);
        onUploaded(packageInfo, 1);
    }));
}
/**
 * Computes the Content-MD5 (base64-encoded MD5) for a package file, used as the
 * Content-MD5 request header on the presigned-URL PUT upload.
 */
async function calculateFileMd5Base64(filePath) {
    const buffer = (0, fs_extra_1.readFileSync)(filePath);
    return (0, crypto_1.createHash)('md5').update(buffer).digest('base64');
}
/**
 * Posts a form-encoded request to OpenPaaS with retry handling.
 */
async function postFormWithRetry(baseUrl, accessToken, apiPath, fields, signal) {
    return requestUploadWithRetry(() => {
        const form = new FormData();
        Object.entries(fields).forEach(([key, value]) => form.append(key, value));
        return requestOpenPaasApi(baseUrl, accessToken, apiPath, form, signal);
    }, signal);
}
/**
 * Posts a JSON request to OpenPaaS.
 */
async function postJson(baseUrl, accessToken, apiPath, body, signal) {
    return requestOpenPaasApi(baseUrl, accessToken, apiPath, JSON.stringify(body), signal, {
        'Content-Type': 'application/json',
    });
}
/**
 * PUTs a package file to a presigned object-storage URL with Content-MD5 and retry handling.
 */
async function putPackageWithRetry(uploadUrl, packagePath, contentMd5, signal) {
    return requestUploadWithRetry(async () => {
        throwIfUploadAborted(signal);
        const buffer = (0, fs_extra_1.readFileSync)(packagePath);
        const unitArray = new Uint8Array(buffer);
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-MD5': contentMd5,
            },
            body: unitArray,
            signal,
        });
        if (!response.ok) {
            throw new UploadHttpError(`Direct package upload failed: HTTP ${response.status}`, response.status, response.headers.get('retry-after'));
        }
    }, signal);
}
/**
 * Runs an upload request with retry handling for transient network and server failures.
 */
async function requestUploadWithRetry(request, signal) {
    for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
        try {
            throwIfUploadAborted(signal);
            return await request();
        }
        catch (error) {
            if (signal?.aborted || !shouldRetryUpload(error) || attempt === MAX_UPLOAD_RETRIES) {
                throw error;
            }
            const delay = getRetryDelay(error, attempt);
            console.warn(`[openpaas-upload] Retry ${attempt + 1}/${MAX_UPLOAD_RETRIES} after ${delay}ms: ${error instanceof Error ? error.message : String(error)}`);
            await waitForUploadRetry(delay, signal);
        }
    }
    throw new Error('Upload retry loop exited unexpectedly');
}
/**
 * Sends one OpenPaaS API POST request, unwraps the OpenPaasResponse envelope and returns the data payload.
 */
async function requestOpenPaasApi(baseUrl, accessToken, apiPath, body, signal, headers = {}) {
    console.log(`[openpaas-upload] POST ${apiPath}`);
    const response = await fetch(`${baseUrl}${apiPath}`, {
        method: 'POST',
        headers: {
            'x-sud-at': accessToken,
            'x-sud-encrypt-request': 'true',
            ...headers,
        },
        body,
        signal,
    });
    if (!response.ok) {
        console.log('upload response fail', response.status, response.statusText, response.headers.get('retry-after'));
        throw new UploadHttpError(`Upload request failed: HTTP ${response.status}`, response.status, response.headers.get('retry-after'));
    }
    const result = await response.json();
    if (result.ret_code !== 0) {
        throw new Error(`Upload API error: ${result.ret_code} ${result.ret_msg}`);
    }
    return result.data;
}
/**
 * Creates a progress reporter that maps package completion to the upload stage progress weight.
 */
function createUploadProgressReporter(task, totalPackages) {
    const taskWithProgress = task;
    let reportedProgress = 0;
    return {
        report(message, completedPackages) {
            const nextProgress = Math.max(0, Math.min(UPLOAD_STAGE_PROGRESS_WEIGHT, (completedPackages / totalPackages) * UPLOAD_STAGE_PROGRESS_WEIGHT));
            const increment = Math.max(0, nextProgress - reportedProgress);
            reportedProgress = nextProgress;
            if (typeof taskWithProgress.updateProcess === 'function') {
                taskWithProgress.updateProcess(message, increment);
            }
            else {
                console.log(message);
            }
        },
    };
}
/**
 * Hooks task break handling into AbortController and returns a function that restores the original handler.
 */
function bindUploadAbort(task, controller) {
    const taskWithProgress = task;
    if (typeof taskWithProgress.break !== 'function') {
        return () => { };
    }
    const originalBreak = taskWithProgress.break;
    taskWithProgress.break = function (reason) {
        controller.abort(new Error(reason));
        return originalBreak.call(this, reason);
    };
    return () => {
        taskWithProgress.break = originalBreak;
    };
}
/**
 * Throws the abort reason when the upload operation has been cancelled.
 */
function throwIfUploadAborted(signal) {
    if (signal?.aborted) {
        throw signal.reason instanceof Error ? signal.reason : new Error('Upload aborted');
    }
}
/**
 * Waits before a retry and rejects early if the upload is aborted.
 */
function waitForUploadRetry(delay, signal) {
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal.reason instanceof Error ? signal.reason : new Error('Upload aborted'));
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, delay);
        if (signal) {
            if (signal.aborted) {
                clearTimeout(timer);
                reject(signal.reason instanceof Error ? signal.reason : new Error('Upload aborted'));
                return;
            }
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
}
/**
 * Decides whether an upload error is retryable.
 */
function shouldRetryUpload(error) {
    if (error instanceof UploadHttpError) {
        if (error.status === 413) {
            return false;
        }
        return error.status === 429 || !error.status || error.status >= 500;
    }
    return error instanceof TypeError;
}
/**
 * Calculates retry delay from Retry-After or exponential backoff.
 */
function getRetryDelay(error, attempt) {
    if (error instanceof UploadHttpError && error.status === 429 && error.retryAfter) {
        const retryAfterSeconds = Number.parseInt(error.retryAfter, 10);
        if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds >= 0) {
            return retryAfterSeconds * 1000;
        }
        return 5000;
    }
    return Math.pow(2, attempt) * 1000;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3VwbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZFQSx3Q0FrQkM7QUFNRCw4QkE0REM7QUFLRCxzQ0FPQztBQUtELGtCQU9DO0FBekxELCtCQUFzQztBQUN0QyxtQ0FBb0M7QUFDcEMscURBQTZDO0FBYzdDLG1DQU9pQjtBQWtDakIsTUFBTSxlQUFnQixTQUFRLEtBQUs7SUFDL0IsTUFBTSxDQUFVO0lBQ2hCLFVBQVUsQ0FBaUI7SUFFM0I7O09BRUc7SUFDSCxZQUFZLE9BQWUsRUFBRSxNQUFlLEVBQUUsVUFBMEI7UUFDcEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDakMsQ0FBQztDQUNKO0FBRUQsTUFBTSw0QkFBNEIsR0FBRyxHQUFHLENBQUM7QUFDekMsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFFN0I7O0dBRUc7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUF3QixJQUFZLEVBQUUsT0FBb0I7SUFDMUYsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFDbEQsSUFBSSxDQUFDLGtCQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMvQixN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Q0FBQyxFQUFFLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IF9GUywgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5cbmltcG9ydCB0eXBlIHsgSUJ1aWxkU3RhZ2VUYXNrIH0gZnJvbSAnQGNvY29zL2NvY29zLWNsaS10eXBlcy9idWlsZGVyJztcbmltcG9ydCB7XG4gICAgSVRhc2tPcHRpb24sXG4gICAgSU9wdGlvbnMsXG4gICAgVXBsb2FkUGFja2FnZUluZm8sXG4gICAgVXBsb2FkUGFja2FnZXNJbmZvLFxuICAgIERpcmVjdFVwbG9hZFRhcmdldCxcbiAgICBEaXJlY3RVcGxvYWRVcmxSZXNwb25zZSxcbiAgICBVcGxvYWRNYWluUGFja2FnZVJlc3BvbnNlLFxuICAgIFVwbG9hZFN1YlBhY2thZ2VSZXNwb25zZSxcbiAgICBPcGVuUGFhc1Jlc3BvbnNlLFxufSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHtcbiAgICByZXNvbHZlQXBwSWQsXG4gICAgcmVzb2x2ZUFjY2Vzc1Rva2VuLFxuICAgIHJlc29sdmVVcGxvYWRCYXNlVXJsLFxuICAgIG5vcm1hbGl6ZUNvZGVWZXJzaW9uLFxuICAgIGdldENvbnRleHRHYW1lSW5mbyxcbiAgICBjb21wdXRlRmlsZU1kNSxcbn0gZnJvbSAnLi9ob29rcyc7XG5cbnR5cGUgQnVpbGRTdGFnZVRhc2tXaXRoUHJvZ3Jlc3MgPSBJQnVpbGRTdGFnZVRhc2sgJiB7XG4gICAgdXBkYXRlUHJvY2Vzcz86IChtZXNzYWdlOiBzdHJpbmcsIGluY3JlbWVudD86IG51bWJlcikgPT4gdm9pZDtcbiAgICBicmVhaz86IChyZWFzb246IHN0cmluZykgPT4gdm9pZDtcbn07XG5cbmludGVyZmFjZSBVcGxvYWRQcm9ncmVzc1JlcG9ydGVyIHtcbiAgICByZXBvcnQobWVzc2FnZTogc3RyaW5nLCBjb21wbGV0ZWRQYWNrYWdlczogbnVtYmVyKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIFVwbG9hZFN1YlBhY2thZ2VTdGF0ZSB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHBlbmRpbmc6IGJvb2xlYW47XG4gICAgY29tcGxldGVkOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgVXBsb2FkUnVudGltZUNvbnRleHQge1xuICAgIHBhY2thZ2VzSW5mbzogVXBsb2FkUGFja2FnZXNJbmZvO1xuICAgIGdhbWVJZDogc3RyaW5nO1xuICAgIHZlcnNpb246IHN0cmluZztcbiAgICBzZWNyZXQ6IHN0cmluZztcbiAgICBjb2RlVmVyc2lvbj86IHN0cmluZztcbiAgICBhY2Nlc3NUb2tlbjogc3RyaW5nO1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICB0b3RhbFBhY2thZ2VzOiBudW1iZXI7XG4gICAgdG90YWxXb3JrSXRlbXM6IG51bWJlcjtcbiAgICBwcm9ncmVzczogVXBsb2FkUHJvZ3Jlc3NSZXBvcnRlcjtcbiAgICBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlcjtcbiAgICBzdWJQYWNrYWdlU3RhdGVzOiBVcGxvYWRTdWJQYWNrYWdlU3RhdGVbXTtcbiAgICBjb21wbGV0ZWRXb3JrSXRlbXM6IG51bWJlcjtcbiAgICB1cGxvYWRlZFBhY2thZ2VJZD86IHN0cmluZztcbn1cblxuY2xhc3MgVXBsb2FkSHR0cEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIHN0YXR1cz86IG51bWJlcjtcbiAgICByZXRyeUFmdGVyPzogc3RyaW5nIHwgbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFdyYXBzIHVwbG9hZCBIVFRQIGZhaWx1cmVzIHdpdGggc3RhdHVzIGFuZCByZXRyeS1hZnRlciBtZXRhZGF0YSBmb3IgcmV0cnkgZGVjaXNpb25zLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgc3RhdHVzPzogbnVtYmVyLCByZXRyeUFmdGVyPzogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgIHRoaXMucmV0cnlBZnRlciA9IHJldHJ5QWZ0ZXI7XG4gICAgfVxufVxuXG5jb25zdCBVUExPQURfU1RBR0VfUFJPR1JFU1NfV0VJR0hUID0gMC4yO1xuY29uc3QgTUFYX1VQTE9BRF9SRVRSSUVTID0gNTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdXBsb2FkIHByZXJlcXVpc2l0ZXMgYW5kIHJlc29sdmVzIHBhY2thZ2UgZmlsZXMgYmVmb3JlIHRoZSB1cGxvYWQgc3RhZ2Ugc3RhcnRzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25CZWZvcmVVcGxvYWQodGhpczogSUJ1aWxkU3RhZ2VUYXNrLCByb290OiBzdHJpbmcsIG9wdGlvbnM6IElUYXNrT3B0aW9uKSB7XG4gICAgY29uc3QgcGFja2FnZXNPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlcy5vcGVucGFhcztcbiAgICBpZiAoIV9GUy5leGlzdHNTeW5jKHJvb3QpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVXBsb2FkIHJvb3QgZG9lcyBub3QgZXhpc3Q6ICR7cm9vdH1gKTtcbiAgICB9XG4gICAgaWYgKCFyZXNvbHZlR2FtZUlkKHBhY2thZ2VzT3B0aW9ucykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGFwcGlkLCBjYW5ub3QgdXBsb2FkIE9wZW5QYWFTIHBhY2thZ2UnKTtcbiAgICB9XG4gICAgaWYgKCFwYWNrYWdlc09wdGlvbnMudmVyc2lvbk5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHZlcnNpb25OYW1lLCBjYW5ub3QgdXBsb2FkIE9wZW5QYWFTIHBhY2thZ2UnKTtcbiAgICB9XG4gICAgaWYgKCFwYWNrYWdlc09wdGlvbnMuZW5jcnlwdEtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgZW5jcnlwdEtleSwgY2Fubm90IHVwbG9hZCBPcGVuUGFhUyBwYWNrYWdlJyk7XG4gICAgfVxuICAgIGlmICghcmVzb2x2ZVBhY2thZ2VDb2RlVmVyc2lvbihwYWNrYWdlc09wdGlvbnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBjb2RlVmVyc2lvbiwgY2Fubm90IHVwbG9hZCBPcGVuUGFhUyBwYWNrYWdlLiBSZWZyZXNoIHRoZSBwYWNrYWdlIGNvbnRleHQgZmlyc3QuJyk7XG4gICAgfVxuICAgIHJlc29sdmVVcGxvYWRQYWNrYWdlcyhyb290LCBvcHRpb25zLCB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20ucGFja2FnZXNKc29uKTtcbn1cblxuLyoqXG4gKiBVcGxvYWRzIHRoZSBzaWduZWQgT3BlblBhYVMgcGFja2FnZXMgdmlhIHByZXNpZ25lZCBVUkxzLCB0aGVuIGNvbmZpcm1zIGVhY2hcbiAqIHBhY2thZ2Ugd2l0aCB0aGUgT3BlblBhYVMgc2VydmljZSB3aGlsZSB1cGRhdGluZyB0YXNrIHByb2dyZXNzL3N0YXRlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuVXBsb2FkKHRhc2s6IElCdWlsZFN0YWdlVGFzaywgcm9vdDogc3RyaW5nLCBvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHVwbG9hZENvbnRleHQgPSBjcmVhdGVVcGxvYWRSdW50aW1lQ29udGV4dCh0YXNrLCByb290LCBvcHRpb25zKTtcbiAgICBjb25zdCByZXN0b3JlQWJvcnRCaW5kaW5nID0gYmluZFVwbG9hZEFib3J0KHRhc2ssIHVwbG9hZENvbnRleHQuYWJvcnRDb250cm9sbGVyKTtcbiAgICB0cnkge1xuICAgICAgICBzdGFydFVwbG9hZCh0YXNrLCB1cGxvYWRDb250ZXh0KTtcblxuICAgICAgICAvLyAxLiBSZXF1ZXN0IHByZXNpZ25lZCBkaXJlY3QtdXBsb2FkIFVSTHMgZnJvbSBPcGVuUGFhUy5cbiAgICAgICAgY29uc3QgdXBsb2FkVXJscyA9IGF3YWl0IHJlcXVlc3REaXJlY3RVcGxvYWRVcmxzKHVwbG9hZENvbnRleHQuYmFzZVVybCwgdXBsb2FkQ29udGV4dC5hY2Nlc3NUb2tlbiwge1xuICAgICAgICAgICAgZ2FtZUlkOiB1cGxvYWRDb250ZXh0LmdhbWVJZCxcbiAgICAgICAgICAgIGNvZGVWZXJzaW9uOiB1cGxvYWRDb250ZXh0LmNvZGVWZXJzaW9uISxcbiAgICAgICAgICAgIHBhY2thZ2VzSW5mbzogdXBsb2FkQ29udGV4dC5wYWNrYWdlc0luZm8sXG4gICAgICAgICAgICBzaWduYWw6IHVwbG9hZENvbnRleHQuYWJvcnRDb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtdXBsb2FkXSBEaXJlY3QgdXBsb2FkIFVSTHMgYWNxdWlyZWQ6ICR7SlNPTi5zdHJpbmdpZnkodXBsb2FkVXJscyl9YCk7XG4gICAgICAgIHVwbG9hZENvbnRleHQuY29tcGxldGVkV29ya0l0ZW1zICs9IDE7XG4gICAgICAgIHVwbG9hZENvbnRleHQucHJvZ3Jlc3MucmVwb3J0KCdbb3BlbnBhYXMtdXBsb2FkXSBVcGxvYWQgVVJMcyBhY3F1aXJlZCcsIHVwbG9hZENvbnRleHQuY29tcGxldGVkV29ya0l0ZW1zKTtcblxuICAgICAgICAvLyAyLiBQVVQgcGFja2FnZXMgdG8gb2JqZWN0IHN0b3JhZ2UgaW4gcGFyYWxsZWwuXG4gICAgICAgIGF3YWl0IHVwbG9hZFBhY2thZ2VzVG9PYmplY3RTdG9yYWdlKHVwbG9hZFVybHMsIHVwbG9hZENvbnRleHQucGFja2FnZXNJbmZvLCB1cGxvYWRDb250ZXh0LmFib3J0Q29udHJvbGxlci5zaWduYWwsIChwYWNrYWdlSW5mbywgY29tcGxldGVkKSA9PiB7XG4gICAgICAgICAgICB1cGxvYWRDb250ZXh0LmNvbXBsZXRlZFdvcmtJdGVtcyArPSBjb21wbGV0ZWQ7XG4gICAgICAgICAgICB1cGxvYWRDb250ZXh0LnByb2dyZXNzLnJlcG9ydChgW29wZW5wYWFzLXVwbG9hZF0gUGFja2FnZSB1cGxvYWRlZDogJHtwYWNrYWdlSW5mby5wYXRofWAsIHVwbG9hZENvbnRleHQuY29tcGxldGVkV29ya0l0ZW1zKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gMy4gQ29uZmlybSB0aGUgbWFpbiBwYWNrYWdlIHVwbG9hZDsgdGhlIHNlcnZpY2UgcmV0dXJucyB0aGUgcGFja2FnZSBpZC5cbiAgICAgICAgY29uc3QgcGFja2FnZUlkID0gYXdhaXQgY29uZmlybVVwbG9hZGVkTWFpblBhY2thZ2UodXBsb2FkQ29udGV4dC5iYXNlVXJsLCB1cGxvYWRDb250ZXh0LmFjY2Vzc1Rva2VuLCB7XG4gICAgICAgICAgICBnYW1lSWQ6IHVwbG9hZENvbnRleHQuZ2FtZUlkLFxuICAgICAgICAgICAgdmVyc2lvbjogdXBsb2FkQ29udGV4dC52ZXJzaW9uLFxuICAgICAgICAgICAgc2VjcmV0OiB1cGxvYWRDb250ZXh0LnNlY3JldCxcbiAgICAgICAgICAgIG1kNTogdXBsb2FkQ29udGV4dC5wYWNrYWdlc0luZm8ubWFpblBhY2thZ2UubWQ1LFxuICAgICAgICAgICAgY29kZVZlcnNpb246IHVwbG9hZENvbnRleHQuY29kZVZlcnNpb24hLFxuICAgICAgICAgICAgc3ViUGFja2FnZXM6IHVwbG9hZENvbnRleHQucGFja2FnZXNJbmZvLnN1YlBhY2thZ2VzLFxuICAgICAgICAgICAgc2lnbmFsOiB1cGxvYWRDb250ZXh0LmFib3J0Q29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIH0pO1xuICAgICAgICB1cGxvYWRDb250ZXh0LnVwbG9hZGVkUGFja2FnZUlkID0gcGFja2FnZUlkO1xuICAgICAgICB1cGxvYWRDb250ZXh0LmNvbXBsZXRlZFdvcmtJdGVtcyArPSAxO1xuICAgICAgICBzZXRVcGxvYWRTdGF0ZSh0YXNrLCB1cGxvYWRDb250ZXh0LCB7XG4gICAgICAgICAgICBwYWNrYWdlSWQsXG4gICAgICAgICAgICBtYWluUGFja2FnZToge1xuICAgICAgICAgICAgICAgIC4uLnVwbG9hZENvbnRleHQucGFja2FnZXNJbmZvLm1haW5QYWNrYWdlLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB1cGxvYWRDb250ZXh0LnByb2dyZXNzLnJlcG9ydChgW29wZW5wYWFzLXVwbG9hZF0gTWFpbiBwYWNrYWdlIGNvbmZpcm1lZDogJHt1cGxvYWRDb250ZXh0LnBhY2thZ2VzSW5mby5tYWluUGFja2FnZS5wYXRofWAsIHVwbG9hZENvbnRleHQuY29tcGxldGVkV29ya0l0ZW1zKTtcblxuICAgICAgICAvLyA0LiBDb25maXJtIHN1Yi1wYWNrYWdlcyBzZXF1ZW50aWFsbHkuXG4gICAgICAgIGNvbnN0IHN1YlBhY2thZ2VSZXN1bHRzID0gYXdhaXQgY29uZmlybVN1YlBhY2thZ2VzKHRhc2ssIHVwbG9hZENvbnRleHQsIHBhY2thZ2VJZCk7XG4gICAgICAgIHNldFVwbG9hZFN0YXRlKHRhc2ssIHVwbG9hZENvbnRleHQsIHtcbiAgICAgICAgICAgIHBlbmRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHBhY2thZ2VJZCxcbiAgICAgICAgICAgIG1haW5QYWNrYWdlOiB1cGxvYWRDb250ZXh0LnBhY2thZ2VzSW5mby5tYWluUGFja2FnZSxcbiAgICAgICAgICAgIHN1YlBhY2thZ2VzOiBzdWJQYWNrYWdlUmVzdWx0cyxcbiAgICAgICAgfSk7XG4gICAgICAgIHVwbG9hZENvbnRleHQucHJvZ3Jlc3MucmVwb3J0KGBbb3BlbnBhYXMtdXBsb2FkXSBVcGxvYWQgY29tcGxldGVkOiBwYWNrYWdlX2lkPSR7cGFja2FnZUlkfWAsIHVwbG9hZENvbnRleHQudG90YWxXb3JrSXRlbXMpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLXVwbG9hZF0gVXBsb2FkIHN1Y2Nlc3M6IHBhY2thZ2VfaWQ9JHtwYWNrYWdlSWR9LCBzdWJfcGFja2FnZXM9JHtzdWJQYWNrYWdlUmVzdWx0cy5sZW5ndGh9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZmFpbFVwbG9hZCh0YXNrLCB1cGxvYWRDb250ZXh0LCBlcnJvcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVzdG9yZUFib3J0QmluZGluZygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQcmludHMgZmluYWwgdXBsb2FkIHN0YXRlIGFmdGVyIHRoZSB1cGxvYWQgc3RhZ2UgZmluaXNoZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFmdGVyVXBsb2FkKHRoaXM6IElCdWlsZFN0YWdlVGFzaykge1xuICAgIGNvbnN0IHVwbG9hZFJlc3VsdCA9IHRoaXMuYnVpbGRFeGl0UmVzLmN1c3RvbS51cGxvYWQ7XG4gICAgaWYgKHVwbG9hZFJlc3VsdD8ucGVuZGluZykge1xuICAgICAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLXVwbG9hZF0gVXBsb2FkIHRhc2sgc3RhcnRlZDogJHtKU09OLnN0cmluZ2lmeSh1cGxvYWRSZXN1bHQpfWApO1xuICAgIH0gZWxzZSBpZiAodXBsb2FkUmVzdWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtdXBsb2FkXSBVcGxvYWQgY29tcGxldGVkOiAke0pTT04uc3RyaW5naWZ5KHVwbG9hZFJlc3VsdCl9YCk7XG4gICAgfVxufVxuXG4vKipcbiAqIENvbGxlY3RzIHBhY2thZ2Ugb3V0cHV0IGluZm9ybWF0aW9uIGZvciB0aGUgcnVuIHN0YWdlIHdpdGhvdXQgc3RhcnRpbmcgYW4gdXBsb2FkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKHRoaXM6IElCdWlsZFN0YWdlVGFzaywgcm9vdDogc3RyaW5nLCBvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHBhY2thZ2VzSW5mbyA9IHJlc29sdmVVcGxvYWRQYWNrYWdlcyhyb290LCBvcHRpb25zLCB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20ucGFja2FnZXNKc29uKTtcbiAgICB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20ucnVuID0ge1xuICAgICAgICBtYWluUGFja2FnZTogcGFja2FnZXNJbmZvLm1haW5QYWNrYWdlLFxuICAgICAgICBzdWJQYWNrYWdlczogcGFja2FnZXNJbmZvLnN1YlBhY2thZ2VzLFxuICAgIH07XG4gICAgY29uc29sZS5sb2coYFtvcGVucGFhcy1ydW5dIFBhY2thZ2UgaXMgcmVhZHk6ICR7cGFja2FnZXNJbmZvLm1haW5QYWNrYWdlLnBhdGh9YCk7XG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBzaGFyZWQgcnVudGltZSBjb250ZXh0IHVzZWQgYnkgdGhlIHVwbG9hZCBzdGFnZS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVXBsb2FkUnVudGltZUNvbnRleHQodGFzazogSUJ1aWxkU3RhZ2VUYXNrLCByb290OiBzdHJpbmcsIG9wdGlvbnM6IElUYXNrT3B0aW9uKTogVXBsb2FkUnVudGltZUNvbnRleHQge1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlcy5vcGVucGFhcztcbiAgICBjb25zdCBwYWNrYWdlc0luZm8gPSByZXNvbHZlVXBsb2FkUGFja2FnZXMocm9vdCwgb3B0aW9ucywgdGFzay5idWlsZEV4aXRSZXMuY3VzdG9tLnBhY2thZ2VzSnNvbik7XG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSByZXNvbHZlQWNjZXNzVG9rZW4ocGFja2FnZU9wdGlvbnMpO1xuICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIE9wZW5QYWFTIGFjY2VzcyB0b2tlbi4gUGFzcyBhY2Nlc3NUb2tlbiBpbiB1cGxvYWQgb3B0aW9ucy4nKTtcbiAgICB9XG4gICAgY29uc3QgdG90YWxQYWNrYWdlcyA9IDEgKyBwYWNrYWdlc0luZm8uc3ViUGFja2FnZXMubGVuZ3RoO1xuICAgIGNvbnN0IHRvdGFsV29ya0l0ZW1zID0gMSArIHRvdGFsUGFja2FnZXMgKiAyO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhY2thZ2VzSW5mbyxcbiAgICAgICAgZ2FtZUlkOiByZXNvbHZlR2FtZUlkKHBhY2thZ2VPcHRpb25zKSxcbiAgICAgICAgdmVyc2lvbjogcGFja2FnZU9wdGlvbnMudmVyc2lvbk5hbWUsXG4gICAgICAgIHNlY3JldDogcGFja2FnZU9wdGlvbnMuZW5jcnlwdEtleSxcbiAgICAgICAgY29kZVZlcnNpb246IHJlc29sdmVQYWNrYWdlQ29kZVZlcnNpb24ocGFja2FnZU9wdGlvbnMpLFxuICAgICAgICBhY2Nlc3NUb2tlbixcbiAgICAgICAgYmFzZVVybDogcmVzb2x2ZVVwbG9hZEJhc2VVcmwocGFja2FnZU9wdGlvbnMpLFxuICAgICAgICB0b3RhbFBhY2thZ2VzLFxuICAgICAgICB0b3RhbFdvcmtJdGVtcyxcbiAgICAgICAgcHJvZ3Jlc3M6IGNyZWF0ZVVwbG9hZFByb2dyZXNzUmVwb3J0ZXIodGFzaywgdG90YWxXb3JrSXRlbXMpLFxuICAgICAgICBhYm9ydENvbnRyb2xsZXI6IG5ldyBBYm9ydENvbnRyb2xsZXIoKSxcbiAgICAgICAgc3ViUGFja2FnZVN0YXRlczogcGFja2FnZXNJbmZvLnN1YlBhY2thZ2VzLm1hcCgoc3ViUGFja2FnZSkgPT4gKHtcbiAgICAgICAgICAgIG5hbWU6IHN1YlBhY2thZ2UubmFtZSxcbiAgICAgICAgICAgIHBlbmRpbmc6IHRydWUsXG4gICAgICAgICAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgICAgICB9KSksXG4gICAgICAgIGNvbXBsZXRlZFdvcmtJdGVtczogMCxcbiAgICB9O1xufVxuXG4vKipcbiAqIFdyaXRlcyB0aGUgY3VycmVudCB1cGxvYWQgc3RhdGUgaW50byBidWlsZEV4aXRSZXMgZm9yIFVJIGFuZCBmb2xsb3ctdXAgc3RhZ2VzLlxuICovXG5mdW5jdGlvbiBzZXRVcGxvYWRTdGF0ZSh0YXNrOiBJQnVpbGRTdGFnZVRhc2ssIGNvbnRleHQ6IFVwbG9hZFJ1bnRpbWVDb250ZXh0LCBwYXJ0aWFsOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9KSB7XG4gICAgdGFzay5idWlsZEV4aXRSZXMuY3VzdG9tLnVwbG9hZCA9IHtcbiAgICAgICAgcGVuZGluZzogdHJ1ZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1haW5QYWNrYWdlOiBjb250ZXh0LnBhY2thZ2VzSW5mby5tYWluUGFja2FnZSxcbiAgICAgICAgc3ViUGFja2FnZXM6IGNvbnRleHQuc3ViUGFja2FnZVN0YXRlcyxcbiAgICAgICAgdmVyc2lvbjogY29udGV4dC52ZXJzaW9uLFxuICAgICAgICBjb2RlVmVyc2lvbjogY29udGV4dC5jb2RlVmVyc2lvbixcbiAgICAgICAgLi4ucGFydGlhbCxcbiAgICB9O1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIHVwbG9hZCBwcm9ncmVzcyBhbmQgbWFya3MgdGhlIHVwbG9hZCBzdGFnZSBhcyBwZW5kaW5nLlxuICovXG5mdW5jdGlvbiBzdGFydFVwbG9hZCh0YXNrOiBJQnVpbGRTdGFnZVRhc2ssIGNvbnRleHQ6IFVwbG9hZFJ1bnRpbWVDb250ZXh0KSB7XG4gICAgY29uc29sZS5sb2coYFtvcGVucGFhcy11cGxvYWRdIFVwbG9hZCBzdGFydDogZ2FtZV9pZD0ke2NvbnRleHQuZ2FtZUlkfSwgdmVyc2lvbj0ke2NvbnRleHQudmVyc2lvbn0sIGNvZGVfdmVyc2lvbj0ke2NvbnRleHQuY29kZVZlcnNpb24gfHwgJyhlbXB0eSknfWApO1xuICAgIGNvbnRleHQucHJvZ3Jlc3MucmVwb3J0KGBbb3BlbnBhYXMtdXBsb2FkXSBQcmVwYXJpbmcgJHtjb250ZXh0LnRvdGFsUGFja2FnZXN9IHBhY2thZ2UocylgLCAwKTtcbiAgICBzZXRVcGxvYWRTdGF0ZSh0YXNrLCBjb250ZXh0KTtcbn1cblxuLyoqXG4gKiBDb25maXJtcyB1cGxvYWRlZCBzdWItcGFja2FnZXMgc2VxdWVudGlhbGx5IGFuZCByZWZyZXNoZXMgdGhlIHBlcnNpc3RlZCB1cGxvYWQgc3RhdGUgYWZ0ZXIgZWFjaCBwYWNrYWdlLlxuICovXG5hc3luYyBmdW5jdGlvbiBjb25maXJtU3ViUGFja2FnZXModGFzazogSUJ1aWxkU3RhZ2VUYXNrLCBjb250ZXh0OiBVcGxvYWRSdW50aW1lQ29udGV4dCwgcGFja2FnZUlkOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PHsgbmFtZTogc3RyaW5nOyBjb21wbGV0ZWQ6IGJvb2xlYW4gfT4+IHtcbiAgICBpZiAoIWNvbnRleHQucGFja2FnZXNJbmZvLnN1YlBhY2thZ2VzLmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLmxvZygnW29wZW5wYWFzLXVwbG9hZF0gTm8gc3ViLXBhY2thZ2UgdG8gY29uZmlybSwgbWFpbiBwYWNrYWdlIHVwbG9hZCBjb21wbGV0ZWQnKTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PHsgbmFtZTogc3RyaW5nOyBjb21wbGV0ZWQ6IGJvb2xlYW4gfT4gPSBbXTtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29udGV4dC5wYWNrYWdlc0luZm8uc3ViUGFja2FnZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHN1YlBhY2thZ2UgPSBjb250ZXh0LnBhY2thZ2VzSW5mby5zdWJQYWNrYWdlc1tpbmRleF07XG4gICAgICAgIGNvbnRleHQucHJvZ3Jlc3MucmVwb3J0KGBbb3BlbnBhYXMtdXBsb2FkXSBDb25maXJtaW5nIHN1Yi1wYWNrYWdlICgke2luZGV4ICsgMn0vJHtjb250ZXh0LnRvdGFsUGFja2FnZXN9KTogJHtzdWJQYWNrYWdlLm5hbWV9YCwgY29udGV4dC5jb21wbGV0ZWRXb3JrSXRlbXMpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLXVwbG9hZF0gQ29uZmlybWluZyBzdWItcGFja2FnZSAoJHtpbmRleCArIDJ9LyR7Y29udGV4dC50b3RhbFBhY2thZ2VzfSk6ICR7c3ViUGFja2FnZS5uYW1lfWApO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb25maXJtVXBsb2FkZWRTdWJQYWNrYWdlKGNvbnRleHQuYmFzZVVybCwgY29udGV4dC5hY2Nlc3NUb2tlbiwge1xuICAgICAgICAgICAgcGFja2FnZUlkLFxuICAgICAgICAgICAgZ2FtZUlkOiBjb250ZXh0LmdhbWVJZCxcbiAgICAgICAgICAgIG5hbWU6IHN1YlBhY2thZ2UubmFtZSxcbiAgICAgICAgICAgIG1kNTogc3ViUGFja2FnZS5tZDUsXG4gICAgICAgICAgICBzaWduYWw6IGNvbnRleHQuYWJvcnRDb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnRleHQuY29tcGxldGVkV29ya0l0ZW1zICs9IDE7XG4gICAgICAgIGNvbnN0IHN1YlBhY2thZ2VSZXN1bHQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzdWJQYWNrYWdlLm5hbWUsXG4gICAgICAgICAgICBjb21wbGV0ZWQ6ICEhcmVzdWx0LmNvbXBsZXRlZCxcbiAgICAgICAgfTtcbiAgICAgICAgY29udGV4dC5zdWJQYWNrYWdlU3RhdGVzW2luZGV4XSA9IHtcbiAgICAgICAgICAgIC4uLnN1YlBhY2thZ2VSZXN1bHQsXG4gICAgICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YlBhY2thZ2VSZXN1bHQpO1xuICAgICAgICBzZXRVcGxvYWRTdGF0ZSh0YXNrLCBjb250ZXh0LCB7XG4gICAgICAgICAgICBwYWNrYWdlSWQsXG4gICAgICAgICAgICBtYWluUGFja2FnZToge1xuICAgICAgICAgICAgICAgIC4uLmNvbnRleHQucGFja2FnZXNJbmZvLm1haW5QYWNrYWdlLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBjb250ZXh0LnByb2dyZXNzLnJlcG9ydChgW29wZW5wYWFzLXVwbG9hZF0gU3ViLXBhY2thZ2UgY29uZmlybWVkOiAke3N1YlBhY2thZ2UubmFtZX1gLCBjb250ZXh0LmNvbXBsZXRlZFdvcmtJdGVtcyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFJlY29yZHMgdXBsb2FkIGZhaWx1cmUgZGV0YWlscywgcmVwb3J0cyBwcm9ncmVzcywgYW5kIHJldGhyb3dzIHRoZSBvcmlnaW5hbCBlcnJvci5cbiAqL1xuZnVuY3Rpb24gZmFpbFVwbG9hZCh0YXNrOiBJQnVpbGRTdGFnZVRhc2ssIGNvbnRleHQ6IFVwbG9hZFJ1bnRpbWVDb250ZXh0LCBlcnJvcjogdW5rbm93bik6IG5ldmVyIHtcbiAgICBjb25zdCByZWFzb24gPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgc2V0VXBsb2FkU3RhdGUodGFzaywgY29udGV4dCwge1xuICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbixcbiAgICAgICAgcGFja2FnZUlkOiBjb250ZXh0LnVwbG9hZGVkUGFja2FnZUlkLFxuICAgIH0pO1xuICAgIGNvbnRleHQucHJvZ3Jlc3MucmVwb3J0KGBbb3BlbnBhYXMtdXBsb2FkXSBVcGxvYWQgZmFpbGVkOiAke3JlYXNvbn1gLCBjb250ZXh0LmNvbXBsZXRlZFdvcmtJdGVtcyk7XG4gICAgY29uc29sZS5lcnJvcihgW29wZW5wYWFzLXVwbG9hZF0gVXBsb2FkIGZhaWxlZDogJHtyZWFzb259YCk7XG4gICAgdGhyb3cgZXJyb3I7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdhbWUgaWQgdXNlZCBieSB1cGxvYWQgQVBJcy5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUdhbWVJZChvcHRpb25zOiBJT3B0aW9ucyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJlc29sdmVBcHBJZChvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgcGFja2FnZSBjb2RlIHZlcnNpb24gZnJvbSBleHBsaWNpdCBvcHRpb25zIGZpcnN0LCB0aGVuIGZyb20gdGhlXG4gKiBPcGVuUGFhUyBwYWNrYWdlIGNvbnRleHQncyBnYW1lX2luZm8uIFJldHVybnMgdW5kZWZpbmVkIHdoZW4gbmVpdGhlciBpcyBzZXQuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQYWNrYWdlQ29kZVZlcnNpb24ob3B0aW9uczogSU9wdGlvbnMpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBub3JtYWxpemVDb2RlVmVyc2lvbihcbiAgICAgICAgb3B0aW9ucy5jb2RlVmVyc2lvbiA/P1xuICAgICAgICBnZXRDb250ZXh0R2FtZUluZm8ob3B0aW9ucy5jb250ZXh0KS5jb2RlX3ZlcnNpb24sXG4gICAgKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBzaWduZWQgcGFja2FnZSBmaWxlcyBmb3IgdXBsb2FkIGZyb20gbWFrZSBvdXRwdXQgZmlyc3QsIHRoZW4gZnJvbSB0aGUgYnVpbGQgZGlzdCBkaXJlY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVVcGxvYWRQYWNrYWdlcyhyb290OiBzdHJpbmcsIG9wdGlvbnM6IElUYXNrT3B0aW9uLCBwYWNrYWdlc0pzb24/OiB1bmtub3duKTogVXBsb2FkUGFja2FnZXNJbmZvIHtcbiAgICBjb25zdCBtYWtlUGFja2FnZXNJbmZvID0gcmVzb2x2ZVVwbG9hZFBhY2thZ2VzRnJvbU1ha2VSZXN1bHQocGFja2FnZXNKc29uKTtcbiAgICBpZiAobWFrZVBhY2thZ2VzSW5mbykge1xuICAgICAgICByZXR1cm4gbWFrZVBhY2thZ2VzSW5mbztcbiAgICB9XG5cbiAgICBjb25zdCBwYWNrYWdlc09wdGlvbnMgPSBvcHRpb25zLnBhY2thZ2VzLm9wZW5wYWFzO1xuICAgIGNvbnN0IGRpc3RQYXRoID0gam9pbihyb290LCAnZGlzdCcpO1xuICAgIGNvbnN0IG1haW5QYWNrYWdlUGF0aCA9IGpvaW4oZGlzdFBhdGgsIGAke29wdGlvbnMubmFtZX0uc3BgKTtcbiAgICBpZiAoIV9GUy5leGlzdHNTeW5jKG1haW5QYWNrYWdlUGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYWluIHBhY2thZ2UgZG9lcyBub3QgZXhpc3Q6ICR7bWFpblBhY2thZ2VQYXRofS4gUGxlYXNlIHJ1biBtYWtlIGJlZm9yZSB1cGxvYWQuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3ViUGFja2FnZXNGcm9tT3B0aW9ucyA9IEFycmF5LmlzQXJyYXkocGFja2FnZXNPcHRpb25zLnN1YnBhY2thZ2VzKSA/IHBhY2thZ2VzT3B0aW9ucy5zdWJwYWNrYWdlcyA6IFtdO1xuICAgIGxldCBzdWJQYWNrYWdlcyA9IHN1YlBhY2thZ2VzRnJvbU9wdGlvbnMubWFwKChzdWJwYWNrYWdlKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VQYXRoID0gam9pbihkaXN0UGF0aCwgYCR7c3VicGFja2FnZS5uYW1lfS5zcGApO1xuICAgICAgICBpZiAoIV9GUy5leGlzdHNTeW5jKHBhY2thZ2VQYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdWIgcGFja2FnZSBkb2VzIG5vdCBleGlzdDogJHtwYWNrYWdlUGF0aH0uIFBsZWFzZSBydW4gbWFrZSBiZWZvcmUgdXBsb2FkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBzdWJwYWNrYWdlLm5hbWUsXG4gICAgICAgICAgICBwYXRoOiBwYWNrYWdlUGF0aCxcbiAgICAgICAgICAgIG1kNTogY29tcHV0ZUZpbGVNZDUocGFja2FnZVBhdGgpLFxuICAgICAgICAgICAgc2l6ZTogX0ZTLnN0YXRTeW5jKHBhY2thZ2VQYXRoKS5zaXplLFxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgaWYgKCFzdWJQYWNrYWdlcy5sZW5ndGggJiYgX0ZTLmV4aXN0c1N5bmMoZGlzdFBhdGgpKSB7XG4gICAgICAgIHN1YlBhY2thZ2VzID0gX0ZTLnJlYWRkaXJTeW5jKGRpc3RQYXRoKVxuICAgICAgICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5lbmRzV2l0aCgnLnNwJykpXG4gICAgICAgICAgICAubWFwKChmaWxlKSA9PiBqb2luKGRpc3RQYXRoLCBmaWxlKSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGZpbGVQYXRoKSA9PiBmaWxlUGF0aCAhPT0gbWFpblBhY2thZ2VQYXRoKVxuICAgICAgICAgICAgLm1hcCgoZmlsZVBhdGgpID0+ICh7XG4gICAgICAgICAgICAgICAgbmFtZTogYmFzZW5hbWUoZmlsZVBhdGgsICcuc3AnKSxcbiAgICAgICAgICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgICAgICAgICBtZDU6IGNvbXB1dGVGaWxlTWQ1KGZpbGVQYXRoKSxcbiAgICAgICAgICAgICAgICBzaXplOiBfRlMuc3RhdFN5bmMoZmlsZVBhdGgpLnNpemUsXG4gICAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWFpblBhY2thZ2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdtYWluJyxcbiAgICAgICAgICAgIHBhdGg6IG1haW5QYWNrYWdlUGF0aCxcbiAgICAgICAgICAgIG1kNTogY29tcHV0ZUZpbGVNZDUobWFpblBhY2thZ2VQYXRoKSxcbiAgICAgICAgICAgIHNpemU6IF9GUy5zdGF0U3luYyhtYWluUGFja2FnZVBhdGgpLnNpemUsXG4gICAgICAgIH0sXG4gICAgICAgIHN1YlBhY2thZ2VzLFxuICAgIH07XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIG1ha2Utc3RhZ2UgcGFja2FnZXNKc29uIHJlc3VsdCBpbnRvIHVwbG9hZCBwYWNrYWdlIG1ldGFkYXRhLlxuICovXG5mdW5jdGlvbiByZXNvbHZlVXBsb2FkUGFja2FnZXNGcm9tTWFrZVJlc3VsdChwYWNrYWdlc0pzb246IHVua25vd24pOiBVcGxvYWRQYWNrYWdlc0luZm8gfCB1bmRlZmluZWQge1xuICAgIGlmICghcGFja2FnZXNKc29uIHx8IHR5cGVvZiBwYWNrYWdlc0pzb24gIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IG1ha2VSZXN1bHQgPSBwYWNrYWdlc0pzb24gYXMge1xuICAgICAgICBtYWluUGFja2FnZT86IHVua25vd247XG4gICAgICAgIG1kNT86IHVua25vd247XG4gICAgICAgIHN1YlBhY2thZ2VzPzogdW5rbm93bjtcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgbWFrZVJlc3VsdC5tYWluUGFja2FnZSAhPT0gJ3N0cmluZycgfHwgIW1ha2VSZXN1bHQubWFpblBhY2thZ2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCFfRlMuZXhpc3RzU3luYyhtYWtlUmVzdWx0Lm1haW5QYWNrYWdlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1haW4gcGFja2FnZSBkb2VzIG5vdCBleGlzdDogJHttYWtlUmVzdWx0Lm1haW5QYWNrYWdlfS4gUGxlYXNlIHJ1biBtYWtlIGJlZm9yZSB1cGxvYWQuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3ViUGFja2FnZXMgPSBBcnJheS5pc0FycmF5KG1ha2VSZXN1bHQuc3ViUGFja2FnZXMpID8gbWFrZVJlc3VsdC5zdWJQYWNrYWdlcy5tYXAoKHN1YnBhY2thZ2UpID0+IHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHN1YnBhY2thZ2UgYXMgeyBuYW1lPzogdW5rbm93bjsgcGF0aD86IHVua25vd247IG1kNT86IHVua25vd24gfTtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtLm5hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBpdGVtLnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghX0ZTLmV4aXN0c1N5bmMoaXRlbS5wYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdWIgcGFja2FnZSBkb2VzIG5vdCBleGlzdDogJHtpdGVtLnBhdGh9LiBQbGVhc2UgcnVuIG1ha2UgYmVmb3JlIHVwbG9hZC5gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgcGF0aDogaXRlbS5wYXRoLFxuICAgICAgICAgICAgbWQ1OiB0eXBlb2YgaXRlbS5tZDUgPT09ICdzdHJpbmcnICYmIGl0ZW0ubWQ1ID8gaXRlbS5tZDUgOiBjb21wdXRlRmlsZU1kNShpdGVtLnBhdGgpLFxuICAgICAgICAgICAgc2l6ZTogX0ZTLnN0YXRTeW5jKGl0ZW0ucGF0aCkuc2l6ZSxcbiAgICAgICAgfTtcbiAgICB9KS5maWx0ZXIoKHN1YnBhY2thZ2UpOiBzdWJwYWNrYWdlIGlzIFVwbG9hZFBhY2thZ2VJbmZvID0+ICEhc3VicGFja2FnZSkgOiBbXTtcblxuICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtdXBsb2FkXSBVc2UgbWFrZSBwYWNrYWdlc0pzb246IG1haW49JHttYWtlUmVzdWx0Lm1haW5QYWNrYWdlfSwgc3ViX3BhY2thZ2VzPSR7c3ViUGFja2FnZXMubGVuZ3RofWApO1xuICAgIHJldHVybiB7XG4gICAgICAgIG1haW5QYWNrYWdlOiB7XG4gICAgICAgICAgICBuYW1lOiAnbWFpbicsXG4gICAgICAgICAgICBwYXRoOiBtYWtlUmVzdWx0Lm1haW5QYWNrYWdlLFxuICAgICAgICAgICAgbWQ1OiB0eXBlb2YgbWFrZVJlc3VsdC5tZDUgPT09ICdzdHJpbmcnICYmIG1ha2VSZXN1bHQubWQ1ID8gbWFrZVJlc3VsdC5tZDUgOiBjb21wdXRlRmlsZU1kNShtYWtlUmVzdWx0Lm1haW5QYWNrYWdlKSxcbiAgICAgICAgICAgIHNpemU6IF9GUy5zdGF0U3luYyhtYWtlUmVzdWx0Lm1haW5QYWNrYWdlKS5zaXplLFxuICAgICAgICB9LFxuICAgICAgICBzdWJQYWNrYWdlcyxcbiAgICB9O1xufVxuXG4vKipcbiAqIFJlcXVlc3RzIHByZXNpZ25lZCBkaXJlY3QtdXBsb2FkIFVSTHMgZm9yIHRoZSBtYWluIGFuZCBzdWIgcGFja2FnZXMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REaXJlY3RVcGxvYWRVcmxzKGJhc2VVcmw6IHN0cmluZywgYWNjZXNzVG9rZW46IHN0cmluZywgcGFyYW1zOiB7XG4gICAgZ2FtZUlkOiBzdHJpbmc7XG4gICAgY29kZVZlcnNpb246IHN0cmluZztcbiAgICBwYWNrYWdlc0luZm86IFVwbG9hZFBhY2thZ2VzSW5mbztcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPERpcmVjdFVwbG9hZFVybFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHJlcXVlc3RVcGxvYWRXaXRoUmV0cnkoKCkgPT4gcG9zdEpzb248RGlyZWN0VXBsb2FkVXJsUmVzcG9uc2U+KGJhc2VVcmwsIGFjY2Vzc1Rva2VuLCAnL2FwaS9nYW1lL3BhY2thZ2UvZGlyZWN0L3VwbG9hZC11cmwnLCB7XG4gICAgICAgIGdhbWVfaWQ6IHBhcmFtcy5nYW1lSWQsXG4gICAgICAgIGNvZGVfdmVyc2lvbjogcGFyYW1zLmNvZGVWZXJzaW9uLFxuICAgICAgICBtZDU6IHBhcmFtcy5wYWNrYWdlc0luZm8ubWFpblBhY2thZ2UubWQ1LFxuICAgICAgICBmaWxlX3NpemU6IHBhcmFtcy5wYWNrYWdlc0luZm8ubWFpblBhY2thZ2Uuc2l6ZSxcbiAgICAgICAgc3ViX3BhY2thZ2VzOiBwYXJhbXMucGFja2FnZXNJbmZvLnN1YlBhY2thZ2VzLm1hcCgoc3VicGFja2FnZSkgPT4gKHtcbiAgICAgICAgICAgIHN1Yl9wYWNrYWdlX25hbWU6IHN1YnBhY2thZ2UubmFtZSxcbiAgICAgICAgICAgIG1kNTogc3VicGFja2FnZS5tZDUsXG4gICAgICAgICAgICBmaWxlX3NpemU6IHN1YnBhY2thZ2Uuc2l6ZSxcbiAgICAgICAgfSkpLFxuICAgIH0sIHBhcmFtcy5zaWduYWwpLCBwYXJhbXMuc2lnbmFsKTtcbn1cblxuLyoqXG4gKiBDb25maXJtcyB0aGUgbWFpbiBwYWNrYWdlIHVwbG9hZCB3aXRoIHRoZSBPcGVuUGFhUyBzZXJ2aWNlIGFuZCByZXR1cm5zIHRoZSBwYWNrYWdlIGlkLlxuICovXG5hc3luYyBmdW5jdGlvbiBjb25maXJtVXBsb2FkZWRNYWluUGFja2FnZShiYXNlVXJsOiBzdHJpbmcsIGFjY2Vzc1Rva2VuOiBzdHJpbmcsIHBhcmFtczoge1xuICAgIGdhbWVJZDogc3RyaW5nO1xuICAgIHZlcnNpb246IHN0cmluZztcbiAgICBzZWNyZXQ6IHN0cmluZztcbiAgICBtZDU6IHN0cmluZztcbiAgICBjb2RlVmVyc2lvbjogc3RyaW5nO1xuICAgIHN1YlBhY2thZ2VzOiBVcGxvYWRQYWNrYWdlSW5mb1tdO1xuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICBnYW1lX2lkOiBwYXJhbXMuZ2FtZUlkLFxuICAgICAgICB2ZXJzaW9uOiBwYXJhbXMudmVyc2lvbixcbiAgICAgICAgc2VjcmV0OiBwYXJhbXMuc2VjcmV0LFxuICAgICAgICBtZDU6IHBhcmFtcy5tZDUsXG4gICAgICAgIGNvZGVfdmVyc2lvbjogcGFyYW1zLmNvZGVWZXJzaW9uLFxuICAgIH07XG4gICAgaWYgKHBhcmFtcy5zdWJQYWNrYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgZmllbGRzLnN1Yl9wYWNrYWdlcyA9IEpTT04uc3RyaW5naWZ5KHBhcmFtcy5zdWJQYWNrYWdlcy5tYXAoKHN1YnBhY2thZ2UpID0+ICh7XG4gICAgICAgICAgICBzdWJfcGFja2FnZV9uYW1lOiBzdWJwYWNrYWdlLm5hbWUsXG4gICAgICAgICAgICBtZDU6IHN1YnBhY2thZ2UubWQ1LFxuICAgICAgICB9KSkpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcG9zdEZvcm1XaXRoUmV0cnk8VXBsb2FkTWFpblBhY2thZ2VSZXNwb25zZT4oYmFzZVVybCwgYWNjZXNzVG9rZW4sICcvYXBpL2dhbWUvcGFja2FnZS9kaXJlY3QvdXBsb2FkJywgZmllbGRzLCBwYXJhbXMuc2lnbmFsKTtcbiAgICBjb25zdCBwYWNrYWdlSWQgPSByZXNwb25zZS5wYWNrYWdlX2lkO1xuICAgIGlmICghcGFja2FnZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWFpbiBwYWNrYWdlIGNvbmZpcm1hdGlvbiBzdWNjZWVkZWQgYnV0IG5vIHBhY2thZ2VfaWQgcmV0dXJuZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhY2thZ2VJZDtcbn1cblxuLyoqXG4gKiBDb25maXJtcyBvbmUgdXBsb2FkZWQgc3ViLXBhY2thZ2UgdW5kZXIgYW4gZXhpc3RpbmcgcGFja2FnZSBpZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY29uZmlybVVwbG9hZGVkU3ViUGFja2FnZShiYXNlVXJsOiBzdHJpbmcsIGFjY2Vzc1Rva2VuOiBzdHJpbmcsIHBhcmFtczoge1xuICAgIHBhY2thZ2VJZDogc3RyaW5nO1xuICAgIGdhbWVJZDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBtZDU6IHN0cmluZztcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPFVwbG9hZFN1YlBhY2thZ2VSZXNwb25zZT4ge1xuICAgIHJldHVybiBwb3N0Rm9ybVdpdGhSZXRyeTxVcGxvYWRTdWJQYWNrYWdlUmVzcG9uc2U+KGJhc2VVcmwsIGFjY2Vzc1Rva2VuLCAnL2FwaS9nYW1lL3BhY2thZ2UvZGlyZWN0L3N1Yi91cGxvYWQnLCB7XG4gICAgICAgIHBhY2thZ2VfaWQ6IHBhcmFtcy5wYWNrYWdlSWQsXG4gICAgICAgIGdhbWVfaWQ6IHBhcmFtcy5nYW1lSWQsXG4gICAgICAgIHN1Yl9wYWNrYWdlX25hbWU6IHBhcmFtcy5uYW1lLFxuICAgICAgICBtZDU6IHBhcmFtcy5tZDUsXG4gICAgfSwgcGFyYW1zLnNpZ25hbCk7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGEgcHJlc2lnbmVkIGRpcmVjdC11cGxvYWQgdGFyZ2V0IHJldHVybmVkIGJ5IHRoZSBzZXJ2aWNlLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZURpcmVjdFVwbG9hZFRhcmdldCh0YXJnZXQ6IERpcmVjdFVwbG9hZFRhcmdldCB8IHVuZGVmaW5lZCwgbGFiZWw6IHN0cmluZyk6IERpcmVjdFVwbG9hZFRhcmdldCB7XG4gICAgaWYgKCF0YXJnZXQ/LnVwbG9hZF91cmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRpcmVjdCB1cGxvYWQgVVJMIHJlc3BvbnNlOiAke2xhYmVsfSB1cGxvYWRfdXJsIGlzIG1pc3NpbmdgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBQVVRzIHRoZSBtYWluIGFuZCBzdWIgcGFja2FnZXMgdG8gdGhlaXIgcHJlc2lnbmVkIG9iamVjdC1zdG9yYWdlIFVSTHMgaW4gcGFyYWxsZWwuXG4gKiBFYWNoIFBVVCBtdXN0IGNhcnJ5IHRoZSBwYWNrYWdlJ3MgQ29udGVudC1NRDUgKGJhc2U2NCkgaGVhZGVyLlxuICovXG5hc3luYyBmdW5jdGlvbiB1cGxvYWRQYWNrYWdlc1RvT2JqZWN0U3RvcmFnZShcbiAgICB1cGxvYWRVcmxzOiBEaXJlY3RVcGxvYWRVcmxSZXNwb25zZSxcbiAgICBwYWNrYWdlc0luZm86IFVwbG9hZFBhY2thZ2VzSW5mbyxcbiAgICBzaWduYWw6IEFib3J0U2lnbmFsLFxuICAgIG9uVXBsb2FkZWQ6IChwYWNrYWdlSW5mbzogVXBsb2FkUGFja2FnZUluZm8sIGNvbXBsZXRlZDogbnVtYmVyKSA9PiB2b2lkLFxuKSB7XG4gICAgY29uc3QgbWFpblRhcmdldCA9IHZhbGlkYXRlRGlyZWN0VXBsb2FkVGFyZ2V0KHVwbG9hZFVybHMubWFpbl9wYWNrYWdlLCAnbWFpbiBwYWNrYWdlJyk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHVwbG9hZFVybHMuc3ViX3BhY2thZ2VzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlyZWN0IHVwbG9hZCBVUkwgcmVzcG9uc2U6IHN1Yl9wYWNrYWdlcyBtdXN0IGJlIGFuIGFycmF5Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0c0J5TmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBEaXJlY3RVcGxvYWRUYXJnZXQ+KCk7XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgdXBsb2FkVXJscy5zdWJfcGFja2FnZXMpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IFN0cmluZyh0YXJnZXQ/LnN1Yl9wYWNrYWdlX25hbWUgfHwgJycpLnRyaW0oKTtcbiAgICAgICAgaWYgKCFuYW1lIHx8IHRhcmdldHNCeU5hbWUuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGlyZWN0IHVwbG9hZCBVUkwgcmVzcG9uc2U6IGR1cGxpY2F0ZSBvciBtaXNzaW5nIHN1Yi1wYWNrYWdlIG5hbWUgJyR7bmFtZX0nYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0c0J5TmFtZS5zZXQobmFtZSwgdmFsaWRhdGVEaXJlY3RVcGxvYWRUYXJnZXQodGFyZ2V0LCBgc3ViLXBhY2thZ2UgJyR7bmFtZX0nYCkpO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0c0J5TmFtZS5zaXplICE9PSBwYWNrYWdlc0luZm8uc3ViUGFja2FnZXMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkaXJlY3QgdXBsb2FkIFVSTCByZXNwb25zZTogc3ViLXBhY2thZ2UgY291bnQgZG9lcyBub3QgbWF0Y2ggbG9jYWwgcGFja2FnZXMnKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGxvYWRzOiBBcnJheTx7IHBhY2thZ2VJbmZvOiBVcGxvYWRQYWNrYWdlSW5mbzsgdGFyZ2V0OiBEaXJlY3RVcGxvYWRUYXJnZXQgfT4gPSBbe1xuICAgICAgICBwYWNrYWdlSW5mbzogcGFja2FnZXNJbmZvLm1haW5QYWNrYWdlLFxuICAgICAgICB0YXJnZXQ6IG1haW5UYXJnZXQsXG4gICAgfV07XG4gICAgZm9yIChjb25zdCBzdWJQYWNrYWdlIG9mIHBhY2thZ2VzSW5mby5zdWJQYWNrYWdlcykge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRzQnlOYW1lLmdldChzdWJQYWNrYWdlLm5hbWUpO1xuICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRpcmVjdCB1cGxvYWQgVVJMIHJlc3BvbnNlOiBtaXNzaW5nIHN1Yi1wYWNrYWdlICcke3N1YlBhY2thZ2UubmFtZX0nYCk7XG4gICAgICAgIH1cbiAgICAgICAgdXBsb2Fkcy5wdXNoKHsgcGFja2FnZUluZm86IHN1YlBhY2thZ2UsIHRhcmdldCB9KTtcbiAgICB9XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbCh1cGxvYWRzLm1hcChhc3luYyAoeyBwYWNrYWdlSW5mbywgdGFyZ2V0IH0pID0+IHtcbiAgICAgICAgLy8gQ29udGVudC1NRDUgKGJhc2U2NC1lbmNvZGVkIE1ENSkgaXMgcmVxdWlyZWQgb24gdGhlIHByZXNpZ25lZC1VUkwgUFVULlxuICAgICAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLXVwbG9hZF0gUFVUICR7cGFja2FnZUluZm8ucGF0aH0gLCB1cmw6ICR7dGFyZ2V0LnVwbG9hZF91cmx9YCk7XG4gICAgICAgIGNvbnN0IGZpbGVNZDVCYXNlNjQgPSBhd2FpdCBjYWxjdWxhdGVGaWxlTWQ1QmFzZTY0KHBhY2thZ2VJbmZvLnBhdGgpO1xuICAgICAgICBhd2FpdCBwdXRQYWNrYWdlV2l0aFJldHJ5KHRhcmdldC51cGxvYWRfdXJsLCBwYWNrYWdlSW5mby5wYXRoLCBmaWxlTWQ1QmFzZTY0LCBzaWduYWwpO1xuICAgICAgICBvblVwbG9hZGVkKHBhY2thZ2VJbmZvLCAxKTtcbiAgICB9KSk7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIENvbnRlbnQtTUQ1IChiYXNlNjQtZW5jb2RlZCBNRDUpIGZvciBhIHBhY2thZ2UgZmlsZSwgdXNlZCBhcyB0aGVcbiAqIENvbnRlbnQtTUQ1IHJlcXVlc3QgaGVhZGVyIG9uIHRoZSBwcmVzaWduZWQtVVJMIFBVVCB1cGxvYWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGVNZDVCYXNlNjQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgYnVmZmVyID0gcmVhZEZpbGVTeW5jKGZpbGVQYXRoKTtcbiAgICByZXR1cm4gY3JlYXRlSGFzaCgnbWQ1JykudXBkYXRlKGJ1ZmZlciBhcyB1bmtub3duIGFzIFVpbnQ4QXJyYXkpLmRpZ2VzdCgnYmFzZTY0Jyk7XG59XG5cbi8qKlxuICogUG9zdHMgYSBmb3JtLWVuY29kZWQgcmVxdWVzdCB0byBPcGVuUGFhUyB3aXRoIHJldHJ5IGhhbmRsaW5nLlxuICovXG5hc3luYyBmdW5jdGlvbiBwb3N0Rm9ybVdpdGhSZXRyeTxUPihiYXNlVXJsOiBzdHJpbmcsIGFjY2Vzc1Rva2VuOiBzdHJpbmcsIGFwaVBhdGg6IHN0cmluZywgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LCBzaWduYWw/OiBBYm9ydFNpZ25hbCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiByZXF1ZXN0VXBsb2FkV2l0aFJldHJ5KCgpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBPYmplY3QuZW50cmllcyhmaWVsZHMpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4gZm9ybS5hcHBlbmQoa2V5LCB2YWx1ZSkpO1xuICAgICAgICByZXR1cm4gcmVxdWVzdE9wZW5QYWFzQXBpPFQ+KGJhc2VVcmwsIGFjY2Vzc1Rva2VuLCBhcGlQYXRoLCBmb3JtLCBzaWduYWwpO1xuICAgIH0sIHNpZ25hbCk7XG59XG5cbi8qKlxuICogUG9zdHMgYSBKU09OIHJlcXVlc3QgdG8gT3BlblBhYVMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHBvc3RKc29uPFQ+KGJhc2VVcmw6IHN0cmluZywgYWNjZXNzVG9rZW46IHN0cmluZywgYXBpUGF0aDogc3RyaW5nLCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gcmVxdWVzdE9wZW5QYWFzQXBpPFQ+KGJhc2VVcmwsIGFjY2Vzc1Rva2VuLCBhcGlQYXRoLCBKU09OLnN0cmluZ2lmeShib2R5KSwgc2lnbmFsLCB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSk7XG59XG5cbi8qKlxuICogUFVUcyBhIHBhY2thZ2UgZmlsZSB0byBhIHByZXNpZ25lZCBvYmplY3Qtc3RvcmFnZSBVUkwgd2l0aCBDb250ZW50LU1ENSBhbmQgcmV0cnkgaGFuZGxpbmcuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHB1dFBhY2thZ2VXaXRoUmV0cnkodXBsb2FkVXJsOiBzdHJpbmcsIHBhY2thZ2VQYXRoOiBzdHJpbmcsIGNvbnRlbnRNZDU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gcmVxdWVzdFVwbG9hZFdpdGhSZXRyeShhc3luYyAoKSA9PiB7XG4gICAgICAgIHRocm93SWZVcGxvYWRBYm9ydGVkKHNpZ25hbCk7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHJlYWRGaWxlU3luYyhwYWNrYWdlUGF0aCk7XG4gICAgICAgIGNvbnN0IHVuaXRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXBsb2FkVXJsLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LU1ENSc6IGNvbnRlbnRNZDUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogdW5pdEFycmF5LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFVwbG9hZEh0dHBFcnJvcihgRGlyZWN0IHBhY2thZ2UgdXBsb2FkIGZhaWxlZDogSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gLCByZXNwb25zZS5zdGF0dXMsIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdyZXRyeS1hZnRlcicpKTtcbiAgICAgICAgfVxuICAgIH0sIHNpZ25hbCk7XG59XG5cbi8qKlxuICogUnVucyBhbiB1cGxvYWQgcmVxdWVzdCB3aXRoIHJldHJ5IGhhbmRsaW5nIGZvciB0cmFuc2llbnQgbmV0d29yayBhbmQgc2VydmVyIGZhaWx1cmVzLlxuICovXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0VXBsb2FkV2l0aFJldHJ5PFQ+KHJlcXVlc3Q6ICgpID0+IFByb21pc2U8VD4sIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTxUPiB7XG4gICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPD0gTUFYX1VQTE9BRF9SRVRSSUVTOyBhdHRlbXB0KyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93SWZVcGxvYWRBYm9ydGVkKHNpZ25hbCk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcmVxdWVzdCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCB8fCAhc2hvdWxkUmV0cnlVcGxvYWQoZXJyb3IpIHx8IGF0dGVtcHQgPT09IE1BWF9VUExPQURfUkVUUklFUykge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVsYXkgPSBnZXRSZXRyeURlbGF5KGVycm9yLCBhdHRlbXB0KTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW29wZW5wYWFzLXVwbG9hZF0gUmV0cnkgJHthdHRlbXB0ICsgMX0vJHtNQVhfVVBMT0FEX1JFVFJJRVN9IGFmdGVyICR7ZGVsYXl9bXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgICAgICAgYXdhaXQgd2FpdEZvclVwbG9hZFJldHJ5KGRlbGF5LCBzaWduYWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignVXBsb2FkIHJldHJ5IGxvb3AgZXhpdGVkIHVuZXhwZWN0ZWRseScpO1xufVxuXG4vKipcbiAqIFNlbmRzIG9uZSBPcGVuUGFhUyBBUEkgUE9TVCByZXF1ZXN0LCB1bndyYXBzIHRoZSBPcGVuUGFhc1Jlc3BvbnNlIGVudmVsb3BlIGFuZCByZXR1cm5zIHRoZSBkYXRhIHBheWxvYWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RPcGVuUGFhc0FwaTxUPihiYXNlVXJsOiBzdHJpbmcsIGFjY2Vzc1Rva2VuOiBzdHJpbmcsIGFwaVBhdGg6IHN0cmluZywgYm9keTogQm9keUluaXQsIHNpZ25hbD86IEFib3J0U2lnbmFsLCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge30pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLXVwbG9hZF0gUE9TVCAke2FwaVBhdGh9YCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsfSR7YXBpUGF0aH1gLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAneC1zdWQtYXQnOiBhY2Nlc3NUb2tlbixcbiAgICAgICAgICAgICd4LXN1ZC1lbmNyeXB0LXJlcXVlc3QnOiAndHJ1ZScsXG4gICAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICB9LFxuICAgICAgICBib2R5LFxuICAgICAgICBzaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1cGxvYWQgcmVzcG9uc2UgZmFpbCcsIHJlc3BvbnNlLnN0YXR1cywgcmVzcG9uc2Uuc3RhdHVzVGV4dCwgcmVzcG9uc2UuaGVhZGVycy5nZXQoJ3JldHJ5LWFmdGVyJykpO1xuICAgICAgICB0aHJvdyBuZXcgVXBsb2FkSHR0cEVycm9yKGBVcGxvYWQgcmVxdWVzdCBmYWlsZWQ6IEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCwgcmVzcG9uc2Uuc3RhdHVzLCByZXNwb25zZS5oZWFkZXJzLmdldCgncmV0cnktYWZ0ZXInKSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIE9wZW5QYWFzUmVzcG9uc2U8VD47XG4gICAgaWYgKHJlc3VsdC5yZXRfY29kZSAhPT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVwbG9hZCBBUEkgZXJyb3I6ICR7cmVzdWx0LnJldF9jb2RlfSAke3Jlc3VsdC5yZXRfbXNnfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LmRhdGE7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHByb2dyZXNzIHJlcG9ydGVyIHRoYXQgbWFwcyBwYWNrYWdlIGNvbXBsZXRpb24gdG8gdGhlIHVwbG9hZCBzdGFnZSBwcm9ncmVzcyB3ZWlnaHQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVVwbG9hZFByb2dyZXNzUmVwb3J0ZXIodGFzazogSUJ1aWxkU3RhZ2VUYXNrLCB0b3RhbFBhY2thZ2VzOiBudW1iZXIpOiBVcGxvYWRQcm9ncmVzc1JlcG9ydGVyIHtcbiAgICBjb25zdCB0YXNrV2l0aFByb2dyZXNzID0gdGFzayBhcyBCdWlsZFN0YWdlVGFza1dpdGhQcm9ncmVzcztcbiAgICBsZXQgcmVwb3J0ZWRQcm9ncmVzcyA9IDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVwb3J0KG1lc3NhZ2U6IHN0cmluZywgY29tcGxldGVkUGFja2FnZXM6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgbmV4dFByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oVVBMT0FEX1NUQUdFX1BST0dSRVNTX1dFSUdIVCwgKGNvbXBsZXRlZFBhY2thZ2VzIC8gdG90YWxQYWNrYWdlcykgKiBVUExPQURfU1RBR0VfUFJPR1JFU1NfV0VJR0hUKSk7XG4gICAgICAgICAgICBjb25zdCBpbmNyZW1lbnQgPSBNYXRoLm1heCgwLCBuZXh0UHJvZ3Jlc3MgLSByZXBvcnRlZFByb2dyZXNzKTtcbiAgICAgICAgICAgIHJlcG9ydGVkUHJvZ3Jlc3MgPSBuZXh0UHJvZ3Jlc3M7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhc2tXaXRoUHJvZ3Jlc3MudXBkYXRlUHJvY2VzcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRhc2tXaXRoUHJvZ3Jlc3MudXBkYXRlUHJvY2VzcyhtZXNzYWdlLCBpbmNyZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG4vKipcbiAqIEhvb2tzIHRhc2sgYnJlYWsgaGFuZGxpbmcgaW50byBBYm9ydENvbnRyb2xsZXIgYW5kIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHJlc3RvcmVzIHRoZSBvcmlnaW5hbCBoYW5kbGVyLlxuICovXG5mdW5jdGlvbiBiaW5kVXBsb2FkQWJvcnQodGFzazogSUJ1aWxkU3RhZ2VUYXNrLCBjb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIpOiAoKSA9PiB2b2lkIHtcbiAgICBjb25zdCB0YXNrV2l0aFByb2dyZXNzID0gdGFzayBhcyBCdWlsZFN0YWdlVGFza1dpdGhQcm9ncmVzcztcbiAgICBpZiAodHlwZW9mIHRhc2tXaXRoUHJvZ3Jlc3MuYnJlYWsgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHt9O1xuICAgIH1cbiAgICBjb25zdCBvcmlnaW5hbEJyZWFrID0gdGFza1dpdGhQcm9ncmVzcy5icmVhaztcbiAgICB0YXNrV2l0aFByb2dyZXNzLmJyZWFrID0gZnVuY3Rpb24ocmVhc29uOiBzdHJpbmcpIHtcbiAgICAgICAgY29udHJvbGxlci5hYm9ydChuZXcgRXJyb3IocmVhc29uKSk7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbEJyZWFrLmNhbGwodGhpcywgcmVhc29uKTtcbiAgICB9O1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHRhc2tXaXRoUHJvZ3Jlc3MuYnJlYWsgPSBvcmlnaW5hbEJyZWFrO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhyb3dzIHRoZSBhYm9ydCByZWFzb24gd2hlbiB0aGUgdXBsb2FkIG9wZXJhdGlvbiBoYXMgYmVlbiBjYW5jZWxsZWQuXG4gKi9cbmZ1bmN0aW9uIHRocm93SWZVcGxvYWRBYm9ydGVkKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICB0aHJvdyBzaWduYWwucmVhc29uIGluc3RhbmNlb2YgRXJyb3IgPyBzaWduYWwucmVhc29uIDogbmV3IEVycm9yKCdVcGxvYWQgYWJvcnRlZCcpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBXYWl0cyBiZWZvcmUgYSByZXRyeSBhbmQgcmVqZWN0cyBlYXJseSBpZiB0aGUgdXBsb2FkIGlzIGFib3J0ZWQuXG4gKi9cbmZ1bmN0aW9uIHdhaXRGb3JVcGxvYWRSZXRyeShkZWxheTogbnVtYmVyLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG9uQWJvcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgcmVqZWN0KHNpZ25hbCEucmVhc29uIGluc3RhbmNlb2YgRXJyb3IgPyBzaWduYWwhLnJlYXNvbiA6IG5ldyBFcnJvcignVXBsb2FkIGFib3J0ZWQnKSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgaWYgKHNpZ25hbCkge1xuICAgICAgICAgICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZWplY3Qoc2lnbmFsLnJlYXNvbiBpbnN0YW5jZW9mIEVycm9yID8gc2lnbmFsLnJlYXNvbiA6IG5ldyBFcnJvcignVXBsb2FkIGFib3J0ZWQnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogRGVjaWRlcyB3aGV0aGVyIGFuIHVwbG9hZCBlcnJvciBpcyByZXRyeWFibGUuXG4gKi9cbmZ1bmN0aW9uIHNob3VsZFJldHJ5VXBsb2FkKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgVXBsb2FkSHR0cEVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQxMykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlcnJvci5zdGF0dXMgPT09IDQyOSB8fCAhZXJyb3Iuc3RhdHVzIHx8IGVycm9yLnN0YXR1cyA+PSA1MDA7XG4gICAgfVxuICAgIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHJldHJ5IGRlbGF5IGZyb20gUmV0cnktQWZ0ZXIgb3IgZXhwb25lbnRpYWwgYmFja29mZi5cbiAqL1xuZnVuY3Rpb24gZ2V0UmV0cnlEZWxheShlcnJvcjogdW5rbm93biwgYXR0ZW1wdDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBVcGxvYWRIdHRwRXJyb3IgJiYgZXJyb3Iuc3RhdHVzID09PSA0MjkgJiYgZXJyb3IucmV0cnlBZnRlcikge1xuICAgICAgICBjb25zdCByZXRyeUFmdGVyU2Vjb25kcyA9IE51bWJlci5wYXJzZUludChlcnJvci5yZXRyeUFmdGVyLCAxMCk7XG4gICAgICAgIGlmICghTnVtYmVyLmlzTmFOKHJldHJ5QWZ0ZXJTZWNvbmRzKSAmJiByZXRyeUFmdGVyU2Vjb25kcyA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcmV0cnlBZnRlclNlY29uZHMgKiAxMDAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA1MDAwO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5wb3coMiwgYXR0ZW1wdCkgKiAxMDAwO1xufVxuIl19