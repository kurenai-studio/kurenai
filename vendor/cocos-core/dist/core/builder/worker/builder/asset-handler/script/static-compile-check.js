"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStaticCompileCheck = runStaticCompileCheck;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 检测是否为 Windows 系统
 */
function isWindows() {
    return process.platform === 'win32';
}
/**
 * 获取平台特定的 shell
 */
function getShell() {
    if (isWindows()) {
        return 'cmd.exe';
    }
    // macOS/Linux 使用默认 shell
    return undefined;
}
/**
 * 过滤 TypeScript 错误输出，只保留包含 "assets" 的错误
 * 智能识别错误块，保留属于 assets 文件的完整错误信息
 */
function filterAssetsErrors(output) {
    if (!output) {
        return '';
    }
    // 统一换行符
    const lines = output.replace(/\r\n/g, '\n').split('\n');
    const filteredLines = [];
    let isAssetError = false; // 标记当前是否在处理一个 assets 相关的错误块
    // 正则匹配 TypeScript 错误行
    // 格式 1: filename(line,col): error TSxxxx: message
    // 格式 2: filename:line:col - error TSxxxx: message
    // 注意：文件名可能包含路径分隔符
    const errorStartRegex = /^(.+?)[(:]\d+[,:]\d+[):]?\s*(?:-\s*)?(?:error|warning)\s+TS\d+:/;
    for (const line of lines) {
        // 跳过空行，避免打断错误块
        if (!line.trim()) {
            continue;
        }
        const match = line.match(errorStartRegex);
        if (match) {
            // 这是一个新的错误行
            const filename = match[1].trim();
            // 检查文件名是否包含 assets
            // 使用宽松的匹配，只要路径中包含 assets 即可
            if (filename.toLowerCase().includes('assets')) {
                isAssetError = true;
                filteredLines.push(line);
            }
            else {
                isAssetError = false;
            }
        }
        else {
            // 不是新的错误行（可能是错误详情、代码上下文等）
            if (isAssetError) {
                // 如果当前处于 assets 错误块中，保留该行
                filteredLines.push(line);
            }
            else if (line.toLowerCase().includes('assets') && (line.includes('error TS') || line.includes('warning TS'))) {
                // 兜底：如果行本身包含 assets 且看起来像是一个错误，保留该行并开启错误块
                // 这可以处理正则未匹配到但确实是 assets 错误的情况
                isAssetError = true;
                filteredLines.push(line);
            }
        }
    }
    return filteredLines.join('\n').trim();
}
/**
 * 执行静态编译检查
 * @param projectPath 项目路径
 * @param showOutput 是否显示输出信息（默认 true）
 * @returns 返回对象，包含检查结果和错误信息。passed 为 true 表示检查通过（没有 assets 相关错误），false 表示有错误
 */
async function runStaticCompileCheck(projectPath, showOutput = true, tsconfigPath) {
    if (showOutput) {
        console.log(chalk_1.default.blue('Running TypeScript static compile check...'));
        console.log(chalk_1.default.gray(`Project: ${projectPath}`));
        if (tsconfigPath) {
            console.log(chalk_1.default.gray(`Config: ${tsconfigPath}`));
        }
        console.log('');
    }
    // 切换到项目目录并执行命令
    // 使用 2>&1 将 stderr 合并到 stdout，避免流写入冲突导致的乱序
    // 使用 CLI 自身依赖的 tsc，避免在项目目录中找不到 tsc
    // 增加 --project 参数指定使用的 tsconfig.json，避免使用默认的项目根目录配置从而包含不需要的 d.ts 文件
    // 输出在代码中统一过滤，保证跨平台一致性
    const finalTsconfigPath = tsconfigPath || path_1.default.join(projectPath, 'temp', 'tsconfig.cocos.json');
    const command = isWindows()
        ? `npx tsc --noEmit --project "${finalTsconfigPath}" 2>&1 | findstr /i "assets"`
        : `tsc --noEmit --project "${finalTsconfigPath}" 2>&1`;
    const shell = getShell();
    try {
        const execOptions = {
            cwd: projectPath,
            maxBuffer: 20 * 1024 * 1024, // 增加 buffer 大小到 20MB
            env: {
                ...process.env,
                CI: 'true', // 告诉工具我们在 CI 环境中，避免交互式输出
                FORCE_COLOR: '0', // 禁用颜色输出，避免控制字符干扰解析
            }
        };
        if (shell) {
            execOptions.shell = shell;
        }
        // 只读取 stdout，因为 stderr 已经合并进去了
        const { stdout } = await execAsync(command, execOptions);
        const output = String(stdout || '').trim();
        if (!output) {
            // 没有输出，说明编译成功
            if (showOutput) {
                console.log(chalk_1.default.green('✓ No assets-related TypeScript errors found!'));
            }
            return { passed: true };
        }
        // 过滤出包含 "assets" 的错误
        let filteredOutput = filterAssetsErrors(output);
        // 如果输出只包含 TS18003 (No inputs were found)，说明项目没有 ts 文件，这是正常的，不视为错误
        if (filteredOutput && filteredOutput.includes('TS18003') && filteredOutput.split('\n').every(line => line.includes('TS18003') || !line.trim())) {
            filteredOutput = '';
        }
        if (filteredOutput) {
            // 有 assets 相关的错误
            if (showOutput) {
                console.error(filteredOutput);
            }
            return { passed: false, errorMessage: filteredOutput };
        }
        // macOS/Linux 只有输出但无 assets 相关错误时，仍然显示原始输出，避免用户误以为没有错误
        if (!isWindows() && output) {
            if (showOutput) {
                console.warn(chalk_1.default.yellow('⚠ Non-assets TypeScript errors detected (showing full output):'));
                console.error(output);
            }
            return { passed: true };
        }
        // 没有 assets 相关的错误
        if (showOutput) {
            console.log(chalk_1.default.green('✓ No assets-related TypeScript errors found!'));
        }
        return { passed: true };
    }
    catch (error) {
        // execAsync 在命令返回非零退出码时会抛出错误
        // tsc 如果有错误会返回非零退出码，这是正常的
        // 合并 stdout 和 stderr (虽然我们使用了 2>&1，但如果 execAsync 捕获到了 stderr 也要处理)
        const errorStdout = String(error.stdout || '').trim();
        const errorStderr = String(error.stderr || '').trim();
        const fullOutput = (errorStdout + (errorStdout && errorStderr ? '\n' : '') + errorStderr).trim();
        if (!fullOutput) {
            // 没有输出，说明可能是其他错误（比如 tsc 命令不存在）
            if (showOutput) {
                console.warn(chalk_1.default.yellow('⚠ Optional TypeScript check skipped (tsc not available). Publish can continue.'));
            }
            return { passed: true };
        }
        if (/command not found|not recognized as an internal or external command|ENOENT/i.test(fullOutput)) {
            if (showOutput) {
                console.warn(chalk_1.default.yellow('⚠ Optional TypeScript check skipped (tsc not on PATH). Publish can continue.'));
                console.warn(chalk_1.default.gray(fullOutput.split('\n').slice(0, 3).join('\n')));
            }
            return { passed: true };
        }
        // 过滤出包含 "assets" 的错误
        let filteredOutput = filterAssetsErrors(fullOutput);
        // 如果输出只包含 TS18003 (No inputs were found)，说明项目没有 ts 文件，这是正常的，不视为错误
        if (filteredOutput && filteredOutput.includes('TS18003') && filteredOutput.split('\n').every(line => line.includes('TS18003') || !line.trim())) {
            filteredOutput = '';
        }
        if (filteredOutput) {
            // 有 assets 相关的错误
            if (showOutput) {
                console.error(filteredOutput);
            }
            return { passed: false, errorMessage: filteredOutput };
        }
        // macOS/Linux 只有输出但无 assets 相关错误时，仍然显示原始输出，避免用户误以为没有错误
        if (!isWindows() && fullOutput) {
            if (showOutput) {
                console.warn(chalk_1.default.yellow('⚠ Non-assets TypeScript errors detected (showing full output):'));
                console.error(fullOutput);
            }
            return { passed: true };
        }
        // 没有 assets 相关的错误
        if (showOutput) {
            console.log(chalk_1.default.green('✓ No assets-related TypeScript errors found!'));
        }
        return { passed: true };
    }
}
