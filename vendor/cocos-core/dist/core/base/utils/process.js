"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickSpawn = quickSpawn;
const child_process_1 = require("child_process");
/**
* 快速开启子进程
* @param command
* @param cmdParams
* @param options
* @returns
*/
function quickSpawn(command, cmdParams, options = {
    downGradeLog: true,
    onlyPrintWhenError: true,
    prefix: '',
}) {
    return new Promise((resolve, reject) => {
        options.prefix = options.prefix || '';
        const child = (0, child_process_1.spawn)(command, cmdParams, {
            cwd: options?.cwd || undefined,
            env: options?.env,
            ...options,
        });
        let outputData = '';
        function output(type, data) {
            if (options.onlyPrintWhenError) {
                outputData += data;
                return;
            }
            if (type === 'log' && options.downGradeLog) {
                type = 'debug';
            }
            else if (type === 'warn' && options.downGradeWaring) {
                type = 'log';
            }
            else if (type === 'error' && options.downGradeError) {
                type = 'warn';
            }
            console[type](options.prefix + data.toString());
        }
        if (options.logLevel !== undefined && options.logLevel >= 0) {
            child.stdout.on('data', (data) => {
                output('log', data);
            });
        }
        if (options.logLevel !== undefined && options.logLevel >= 1) {
            child.stderr.on('data', (err) => {
                const error = err.toString();
                // 过滤掉空或只有换行的报错
                if (!error || error === '\n') {
                    return;
                }
                output('error', err);
            });
        }
        child.on('close', (code) => {
            if (code !== 0) {
                reject(options.prefix + `Child process exit width code ${code}: ${command} ${cmdParams.toString()}`);
            }
            else {
                resolve(true);
            }
        });
        child.on('error', (err) => {
            outputData && console.debug(options.prefix + 'child process output: ', { outputData });
            console.error(options.prefix + `child process error: ${command} ${cmdParams.toString()}`);
            reject(err);
        });
        child.on('exit', (code) => {
            !options.onlyPrintWhenError && console.debug(options.prefix + `Child process exit width code ${code}`);
        });
    });
}
