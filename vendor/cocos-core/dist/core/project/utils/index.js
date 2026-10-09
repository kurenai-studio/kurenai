"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeOutputJSON = safeOutputJSON;
const fs_extra_1 = require("fs-extra");
/**
 * Safely writes data to a JSON file with comprehensive error handling and logging
 *
 * @param {string} file - The target file path for JSON output
 * @param {any} data - The data to be serialized as JSON
 * @param {WriteOptions} [options={ spaces: 4 }] - Formatting options for JSON output
 * @returns {Promise<boolean>} - Returns true if write succeeded, false if failed
 *
 * @example
 * // Basic usage
 * const success = await safeOutputJSON('config.json', { theme: 'dark' });
 *
 * @example
 * // With custom options
 * await safeOutputJSON('data.json', dataset, { spaces: 2 });
 */
async function safeOutputJSON(file, data, options = { spaces: 4 }) {
    try {
        await (0, fs_extra_1.outputJSON)(file, data, { spaces: 4 });
        return true;
    }
    catch (error) {
        console.error(`Failed to write JSON file: ${file}, data: ${data}, options: ${options} `, error);
        return false;
    }
}
