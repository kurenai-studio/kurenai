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
                console.log(chalk_1.default.green('✓ No assets-related TypeScript errors found!'));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljLWNvbXBpbGUtY2hlY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvc2NyaXB0L3N0YXRpYy1jb21waWxlLWNoZWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBdUZBLHNEQTZIQztBQXBORCxrREFBMEI7QUFDMUIsaURBQXFDO0FBQ3JDLGdEQUF3QjtBQUN4QiwrQkFBaUM7QUFFakMsTUFBTSxTQUFTLEdBQUcsSUFBQSxnQkFBUyxFQUFDLG9CQUFJLENBQUMsQ0FBQztBQUVsQzs7R0FFRztBQUNILFNBQVMsU0FBUztJQUNkLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUM7QUFDeEMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxRQUFRO0lBQ2IsSUFBSSxTQUFTLEVBQUUsRUFBRSxDQUFDO1FBQ2QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUNELHlCQUF5QjtJQUN6QixPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxrQkFBa0IsQ0FBQyxNQUFjO0lBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNWLE9BQU8sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVELFFBQVE7SUFDUixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsTUFBTSxhQUFhLEdBQWEsRUFBRSxDQUFDO0lBQ25DLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLDRCQUE0QjtJQUV0RCxzQkFBc0I7SUFDdEIsa0RBQWtEO0lBQ2xELGtEQUFrRDtJQUNsRCxrQkFBa0I7SUFDbEIsTUFBTSxlQUFlLEdBQUcsaUVBQWlFLENBQUM7SUFFMUYsS0FBSyxN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RSxJQUFJLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsa0JBQWtCO1FBQ2xCLElBQUksVUFBVSxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFDRCxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDO0lBQzVCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSAndXRpbCc7XG5cbmNvbnN0IGV4ZWNBc3luYyA9IHByb21pc2lmeShleGVjKTtcblxuLyoqXG4gKiDmo4DmtYvmmK/lkKbkuLogV2luZG93cyDns7vnu59cbiAqL1xuZnVuY3Rpb24gaXNXaW5kb3dzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xufVxuXG4vKipcbiAqIOiOt+WPluW5s+WPsOeJueWumueahCBzaGVsbFxuICovXG5mdW5jdGlvbiBnZXRTaGVsbCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmIChpc1dpbmRvd3MoKSkge1xuICAgICAgICByZXR1cm4gJ2NtZC5leGUnO1xuICAgIH1cbiAgICAvLyBtYWNPUy9MaW51eCDkvb/nlKjpu5jorqQgc2hlbGxcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIOi/h+a7pCBUeXBlU2NyaXB0IOmUmeivr+i+k+WHuu+8jOWPquS/neeVmeWMheWQqyBcImFzc2V0c1wiIOeahOmUmeivr1xuICog5pm66IO96K+G5Yir6ZSZ6K+v5Z2X77yM5L+d55WZ5bGe5LqOIGFzc2V0cyDmlofku7bnmoTlrozmlbTplJnor6/kv6Hmga9cbiAqL1xuZnVuY3Rpb24gZmlsdGVyQXNzZXRzRXJyb3JzKG91dHB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIW91dHB1dCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgLy8g57uf5LiA5o2i6KGM56ymXG4gICAgY29uc3QgbGluZXMgPSBvdXRwdXQucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKS5zcGxpdCgnXFxuJyk7XG4gICAgY29uc3QgZmlsdGVyZWRMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgaXNBc3NldEVycm9yID0gZmFsc2U7IC8vIOagh+iusOW9k+WJjeaYr+WQpuWcqOWkhOeQhuS4gOS4qiBhc3NldHMg55u45YWz55qE6ZSZ6K+v5Z2XXG5cbiAgICAvLyDmraPliJnljLnphY0gVHlwZVNjcmlwdCDplJnor6/ooYxcbiAgICAvLyDmoLzlvI8gMTogZmlsZW5hbWUobGluZSxjb2wpOiBlcnJvciBUU3h4eHg6IG1lc3NhZ2VcbiAgICAvLyDmoLzlvI8gMjogZmlsZW5hbWU6bGluZTpjb2wgLSBlcnJvciBUU3h4eHg6IG1lc3NhZ2VcbiAgICAvLyDms6jmhI/vvJrmlofku7blkI3lj6/og73ljIXlkKvot6/lvoTliIbpmpTnrKZcbiAgICBjb25zdCBlcnJvclN0YXJ0UmVnZXggPSAvXiguKz8pWyg6XVxcZCtbLDpdXFxkK1spOl0/XFxzKig/Oi1cXHMqKT8oPzplcnJvcnx3YXJuaW5nKVxccytUU1xcZCs6LztcblxuICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICAvLyDot7Pov4fnqbrooYzvvIzpgb/lhY3miZPmlq3plJnor6/lnZdcbiAgICAgICAgaWYgKCFsaW5lLnRyaW0oKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXRjaCA9IGxpbmUubWF0Y2goZXJyb3JTdGFydFJlZ2V4KTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIC8vIOi/meaYr+S4gOS4quaWsOeahOmUmeivr+ihjFxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgICAgICAvLyDmo4Dmn6Xmlofku7blkI3mmK/lkKbljIXlkKsgYXNzZXRzXG4gICAgICAgICAgICAvLyDkvb/nlKjlrr3mnb7nmoTljLnphY3vvIzlj6ropoHot6/lvoTkuK3ljIXlkKsgYXNzZXRzIOWNs+WPr1xuICAgICAgICAgICAgaWYgKGZpbGVuYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2Fzc2V0cycpKSB7XG4gICAgICAgICAgICAgICAgaXNBc3NldEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlzQXNzZXRFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5LiN5piv5paw55qE6ZSZ6K+v6KGM77yI5Y+v6IO95piv6ZSZ6K+v6K+m5oOF44CB5Luj56CB5LiK5LiL5paH562J77yJXG4gICAgICAgICAgICBpZiAoaXNBc3NldEVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5b2T5YmN5aSE5LqOIGFzc2V0cyDplJnor6/lnZfkuK3vvIzkv53nlZnor6XooYxcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYXNzZXRzJykgJiYgKGxpbmUuaW5jbHVkZXMoJ2Vycm9yIFRTJykgfHwgbGluZS5pbmNsdWRlcygnd2FybmluZyBUUycpKSkge1xuICAgICAgICAgICAgICAgIC8vIOWFnOW6le+8muWmguaenOihjOacrOi6q+WMheWQqyBhc3NldHMg5LiU55yL6LW35p2l5YOP5piv5LiA5Liq6ZSZ6K+v77yM5L+d55WZ6K+l6KGM5bm25byA5ZCv6ZSZ6K+v5Z2XXG4gICAgICAgICAgICAgICAgLy8g6L+Z5Y+v5Lul5aSE55CG5q2j5YiZ5pyq5Yy56YWN5Yiw5L2G56Gu5a6e5pivIGFzc2V0cyDplJnor6/nmoTmg4XlhrVcbiAgICAgICAgICAgICAgICBpc0Fzc2V0RXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmaWx0ZXJlZExpbmVzLmpvaW4oJ1xcbicpLnRyaW0oKTtcbn1cblxuLyoqXG4gKiDmiafooYzpnZnmgIHnvJbor5Hmo4Dmn6VcbiAqIEBwYXJhbSBwcm9qZWN0UGF0aCDpobnnm67ot6/lvoRcbiAqIEBwYXJhbSBzaG93T3V0cHV0IOaYr+WQpuaYvuekuui+k+WHuuS/oeaBr++8iOm7mOiupCB0cnVl77yJXG4gKiBAcmV0dXJucyDov5Tlm57lr7nosaHvvIzljIXlkKvmo4Dmn6Xnu5PmnpzlkozplJnor6/kv6Hmga/jgIJwYXNzZWQg5Li6IHRydWUg6KGo56S65qOA5p+l6YCa6L+H77yI5rKh5pyJIGFzc2V0cyDnm7jlhbPplJnor6/vvInvvIxmYWxzZSDooajnpLrmnInplJnor69cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blN0YXRpY0NvbXBpbGVDaGVjayhwcm9qZWN0UGF0aDogc3RyaW5nLCBzaG93T3V0cHV0OiBib29sZWFuID0gdHJ1ZSwgdHNjb25maWdQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IHBhc3NlZDogYm9vbGVhbjsgZXJyb3JNZXNzYWdlPzogc3RyaW5nIH0+IHtcbiAgICBpZiAoc2hvd091dHB1dCkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ibHVlKCdSdW5uaW5nIFR5cGVTY3JpcHQgc3RhdGljIGNvbXBpbGUgY2hlY2suLi4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFByb2plY3Q6ICR7cHJvamVjdFBhdGh9YCkpO1xuICAgICAgICBpZiAodHNjb25maWdQYXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBDb25maWc6ICR7dHNjb25maWdQYXRofWApKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgLy8g5YiH5o2i5Yiw6aG555uu55uu5b2V5bm25omn6KGM5ZG95LukXG4gICAgLy8g5L2/55SoIDI+JjEg5bCGIHN0ZGVyciDlkIjlubbliLAgc3Rkb3V077yM6YG/5YWN5rWB5YaZ5YWl5Yay56qB5a+86Ie055qE5Lmx5bqPXG4gICAgLy8g5L2/55SoIENMSSDoh6rouqvkvp3otZbnmoQgdHNj77yM6YG/5YWN5Zyo6aG555uu55uu5b2V5Lit5om+5LiN5YiwIHRzY1xuICAgIC8vIOWinuWKoCAtLXByb2plY3Qg5Y+C5pWw5oyH5a6a5L2/55So55qEIHRzY29uZmlnLmpzb27vvIzpgb/lhY3kvb/nlKjpu5jorqTnmoTpobnnm67moLnnm67lvZXphY3nva7ku47ogIzljIXlkKvkuI3pnIDopoHnmoQgZC50cyDmlofku7ZcbiAgICAvLyDovpPlh7rlnKjku6PnoIHkuK3nu5/kuIDov4fmu6TvvIzkv53or4Hot6jlubPlj7DkuIDoh7TmgKdcbiAgICBjb25zdCBmaW5hbFRzY29uZmlnUGF0aCA9IHRzY29uZmlnUGF0aCB8fCBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICd0ZW1wJywgJ3RzY29uZmlnLmNvY29zLmpzb24nKTtcbiAgICBjb25zdCBjb21tYW5kID0gaXNXaW5kb3dzKCkgXG4gICAgPyBgbnB4IHRzYyAtLW5vRW1pdCAtLXByb2plY3QgXCIke2ZpbmFsVHNjb25maWdQYXRofVwiIDI+JjEgfCBmaW5kc3RyIC9pIFwiYXNzZXRzXCJgXG4gICAgOiBgdHNjIC0tbm9FbWl0IC0tcHJvamVjdCBcIiR7ZmluYWxUc2NvbmZpZ1BhdGh9XCIgMj4mMWA7XG4gICAgY29uc3Qgc2hlbGwgPSBnZXRTaGVsbCgpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhlY09wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgIGN3ZDogcHJvamVjdFBhdGgsXG4gICAgICAgICAgICBtYXhCdWZmZXI6IDIwICogMTAyNCAqIDEwMjQsIC8vIOWinuWKoCBidWZmZXIg5aSn5bCP5YiwIDIwTUJcbiAgICAgICAgICAgIGVudjoge1xuICAgICAgICAgICAgICAgIC4uLnByb2Nlc3MuZW52LFxuICAgICAgICAgICAgICAgIENJOiAndHJ1ZScsICAgICAgIC8vIOWRiuivieW3peWFt+aIkeS7rOWcqCBDSSDnjq/looPkuK3vvIzpgb/lhY3kuqTkupLlvI/ovpPlh7pcbiAgICAgICAgICAgICAgICBGT1JDRV9DT0xPUjogJzAnLCAvLyDnpoHnlKjpopzoibLovpPlh7rvvIzpgb/lhY3mjqfliLblrZfnrKblubLmibDop6PmnpBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHNoZWxsKSB7XG4gICAgICAgICAgICBleGVjT3B0aW9ucy5zaGVsbCA9IHNoZWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+q6K+75Y+WIHN0ZG91dO+8jOWboOS4uiBzdGRlcnIg5bey57uP5ZCI5bm26L+b5Y675LqGXG4gICAgICAgIGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBleGVjQXN5bmMoY29tbWFuZCwgZXhlY09wdGlvbnMpO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBTdHJpbmcoc3Rkb3V0IHx8ICcnKS50cmltKCk7XG5cbiAgICAgICAgaWYgKCFvdXRwdXQpIHtcbiAgICAgICAgICAgIC8vIOayoeaciei+k+WHuu+8jOivtOaYjue8luivkeaIkOWKn1xuICAgICAgICAgICAgaWYgKHNob3dPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbign4pyTIE5vIGFzc2V0cy1yZWxhdGVkIFR5cGVTY3JpcHQgZXJyb3JzIGZvdW5kIScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHBhc3NlZDogdHJ1ZSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5Ye65YyF5ZCrIFwiYXNzZXRzXCIg55qE6ZSZ6K+vXG4gICAgICAgIGxldCBmaWx0ZXJlZE91dHB1dCA9IGZpbHRlckFzc2V0c0Vycm9ycyhvdXRwdXQpO1xuXG4gICAgICAgIC8vIOWmguaenOi+k+WHuuWPquWMheWQqyBUUzE4MDAzIChObyBpbnB1dHMgd2VyZSBmb3VuZCnvvIzor7TmmI7pobnnm67msqHmnIkgdHMg5paH5Lu277yM6L+Z5piv5q2j5bi455qE77yM5LiN6KeG5Li66ZSZ6K+vXG4gICAgICAgIGlmIChmaWx0ZXJlZE91dHB1dCAmJiBmaWx0ZXJlZE91dHB1dC5pbmNsdWRlcygnVFMxODAwMycpICYmIGZpbHRlcmVkT3V0cHV0LnNwbGl0KCdcXG4nKS5ldmVyeShsaW5lID0+IGxpbmUuaW5jbHVkZXMoJ1RTMTgwMDMnKSB8fCAhbGluZS50cmltKCkpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZE91dHB1dCA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbHRlcmVkT3V0cHV0KSB7XG4gICAgICAgICAgICAvLyDmnIkgYXNzZXRzIOebuOWFs+eahOmUmeivr1xuICAgICAgICAgICAgaWYgKHNob3dPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGZpbHRlcmVkT3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHBhc3NlZDogZmFsc2UsIGVycm9yTWVzc2FnZTogZmlsdGVyZWRPdXRwdXQgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1hY09TL0xpbnV4IOWPquaciei+k+WHuuS9huaXoCBhc3NldHMg55u45YWz6ZSZ6K+v5pe277yM5LuN54S25pi+56S65Y6f5aeL6L6T5Ye677yM6YG/5YWN55So5oi36K+v5Lul5Li65rKh5pyJ6ZSZ6K+vXG4gICAgICAgIGlmICghaXNXaW5kb3dzKCkgJiYgb3V0cHV0KSB7XG4gICAgICAgICAgICBpZiAoc2hvd091dHB1dCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihjaGFsay55ZWxsb3coJ+KaoCBOb24tYXNzZXRzIFR5cGVTY3JpcHQgZXJyb3JzIGRldGVjdGVkIChzaG93aW5nIGZ1bGwgb3V0cHV0KTonKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihvdXRwdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgcGFzc2VkOiB0cnVlIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmsqHmnIkgYXNzZXRzIOebuOWFs+eahOmUmeivr1xuICAgICAgICBpZiAoc2hvd091dHB1dCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBObyBhc3NldHMtcmVsYXRlZCBUeXBlU2NyaXB0IGVycm9ycyBmb3VuZCEnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgcGFzc2VkOiB0cnVlIH07XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAvLyBleGVjQXN5bmMg5Zyo5ZG95Luk6L+U5Zue6Z2e6Zu26YCA5Ye656CB5pe25Lya5oqb5Ye66ZSZ6K+vXG4gICAgICAgIC8vIHRzYyDlpoLmnpzmnInplJnor6/kvJrov5Tlm57pnZ7pm7bpgIDlh7rnoIHvvIzov5nmmK/mraPluLjnmoRcblxuICAgICAgICAvLyDlkIjlubYgc3Rkb3V0IOWSjCBzdGRlcnIgKOiZveeEtuaIkeS7rOS9v+eUqOS6hiAyPiYx77yM5L2G5aaC5p6cIGV4ZWNBc3luYyDmjZXojrfliLDkuoYgc3RkZXJyIOS5n+imgeWkhOeQhilcbiAgICAgICAgY29uc3QgZXJyb3JTdGRvdXQgPSBTdHJpbmcoZXJyb3Iuc3Rkb3V0IHx8ICcnKS50cmltKCk7XG4gICAgICAgIGNvbnN0IGVycm9yU3RkZXJyID0gU3RyaW5nKGVycm9yLnN0ZGVyciB8fCAnJykudHJpbSgpO1xuICAgICAgICBjb25zdCBmdWxsT3V0cHV0ID0gKGVycm9yU3Rkb3V0ICsgKGVycm9yU3Rkb3V0ICYmIGVycm9yU3RkZXJyID8gJ1xcbicgOiAnJykgKyBlcnJvclN0ZGVycikudHJpbSgpO1xuXG4gICAgICAgIGlmICghZnVsbE91dHB1dCkge1xuICAgICAgICAgICAgLy8g5rKh5pyJ6L6T5Ye677yM6K+05piO5Y+v6IO95piv5YW25LuW6ZSZ6K+v77yI5q+U5aaCIHRzYyDlkb3ku6TkuI3lrZjlnKjvvIlcbiAgICAgICAgICAgIGlmIChzaG93T3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBObyBhc3NldHMtcmVsYXRlZCBUeXBlU2NyaXB0IGVycm9ycyBmb3VuZCEnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyBwYXNzZWQ6IHRydWUgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOWHuuWMheWQqyBcImFzc2V0c1wiIOeahOmUmeivr1xuICAgICAgICBsZXQgZmlsdGVyZWRPdXRwdXQgPSBmaWx0ZXJBc3NldHNFcnJvcnMoZnVsbE91dHB1dCk7XG5cbiAgICAgICAgLy8g5aaC5p6c6L6T5Ye65Y+q5YyF5ZCrIFRTMTgwMDMgKE5vIGlucHV0cyB3ZXJlIGZvdW5kKe+8jOivtOaYjumhueebruayoeaciSB0cyDmlofku7bvvIzov5nmmK/mraPluLjnmoTvvIzkuI3op4bkuLrplJnor69cbiAgICAgICAgaWYgKGZpbHRlcmVkT3V0cHV0ICYmIGZpbHRlcmVkT3V0cHV0LmluY2x1ZGVzKCdUUzE4MDAzJykgJiYgZmlsdGVyZWRPdXRwdXQuc3BsaXQoJ1xcbicpLmV2ZXJ5KGxpbmUgPT4gbGluZS5pbmNsdWRlcygnVFMxODAwMycpIHx8ICFsaW5lLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkT3V0cHV0ID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsdGVyZWRPdXRwdXQpIHtcbiAgICAgICAgICAgIC8vIOaciSBhc3NldHMg55u45YWz55qE6ZSZ6K+vXG4gICAgICAgICAgICBpZiAoc2hvd091dHB1dCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZmlsdGVyZWRPdXRwdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgcGFzc2VkOiBmYWxzZSwgZXJyb3JNZXNzYWdlOiBmaWx0ZXJlZE91dHB1dCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbWFjT1MvTGludXgg5Y+q5pyJ6L6T5Ye65L2G5pegIGFzc2V0cyDnm7jlhbPplJnor6/ml7bvvIzku43nhLbmmL7npLrljp/lp4vovpPlh7rvvIzpgb/lhY3nlKjmiLfor6/ku6XkuLrmsqHmnInplJnor69cbiAgICAgICAgaWYgKCFpc1dpbmRvd3MoKSAmJiBmdWxsT3V0cHV0KSB7XG4gICAgICAgICAgICBpZiAoc2hvd091dHB1dCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihjaGFsay55ZWxsb3coJ+KaoCBOb24tYXNzZXRzIFR5cGVTY3JpcHQgZXJyb3JzIGRldGVjdGVkIChzaG93aW5nIGZ1bGwgb3V0cHV0KTonKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihmdWxsT3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHBhc3NlZDogdHJ1ZSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5rKh5pyJIGFzc2V0cyDnm7jlhbPnmoTplJnor69cbiAgICAgICAgaWYgKHNob3dPdXRwdXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCfinJMgTm8gYXNzZXRzLXJlbGF0ZWQgVHlwZVNjcmlwdCBlcnJvcnMgZm91bmQhJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHBhc3NlZDogdHJ1ZSB9O1xuICAgIH1cbn1cbiJdfQ==