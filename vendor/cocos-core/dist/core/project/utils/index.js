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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9wcm9qZWN0L3V0aWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0JBLHdDQVFDO0FBMUJELHVDQUFvRDtBQUVwRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUFDLElBQVksRUFBRSxJQUFTLEVBQUUsVUFBd0IsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO0lBQy9GLElBQUksQ0FBQztRQUNELE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLElBQUksV0FBVyxJQUFJLGNBQWMsT0FBTyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEcsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXcml0ZU9wdGlvbnMsIG91dHB1dEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5cbi8qKlxuICogU2FmZWx5IHdyaXRlcyBkYXRhIHRvIGEgSlNPTiBmaWxlIHdpdGggY29tcHJlaGVuc2l2ZSBlcnJvciBoYW5kbGluZyBhbmQgbG9nZ2luZ1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIC0gVGhlIHRhcmdldCBmaWxlIHBhdGggZm9yIEpTT04gb3V0cHV0XG4gKiBAcGFyYW0ge2FueX0gZGF0YSAtIFRoZSBkYXRhIHRvIGJlIHNlcmlhbGl6ZWQgYXMgSlNPTlxuICogQHBhcmFtIHtXcml0ZU9wdGlvbnN9IFtvcHRpb25zPXsgc3BhY2VzOiA0IH1dIC0gRm9ybWF0dGluZyBvcHRpb25zIGZvciBKU09OIG91dHB1dFxuICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IC0gUmV0dXJucyB0cnVlIGlmIHdyaXRlIHN1Y2NlZWRlZCwgZmFsc2UgaWYgZmFpbGVkXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIEJhc2ljIHVzYWdlXG4gKiBjb25zdCBzdWNjZXNzID0gYXdhaXQgc2FmZU91dHB1dEpTT04oJ2NvbmZpZy5qc29uJywgeyB0aGVtZTogJ2RhcmsnIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBXaXRoIGN1c3RvbSBvcHRpb25zXG4gKiBhd2FpdCBzYWZlT3V0cHV0SlNPTignZGF0YS5qc29uJywgZGF0YXNldCwgeyBzcGFjZXM6IDIgfSk7XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYWZlT3V0cHV0SlNPTihmaWxlOiBzdHJpbmcsIGRhdGE6IGFueSwgb3B0aW9uczogV3JpdGVPcHRpb25zID0geyBzcGFjZXM6IDQgfSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IG91dHB1dEpTT04oZmlsZSwgZGF0YSwgeyBzcGFjZXM6IDQgfSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byB3cml0ZSBKU09OIGZpbGU6ICR7ZmlsZX0sIGRhdGE6ICR7ZGF0YX0sIG9wdGlvbnM6ICR7b3B0aW9uc30gYCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuIl19