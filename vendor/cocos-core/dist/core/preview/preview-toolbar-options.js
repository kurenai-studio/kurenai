"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewToolbarOptions = getPreviewToolbarOptions;
exports.setPreviewToolbarOption = setPreviewToolbarOption;
exports.resetPreviewToolbarOptions = resetPreviewToolbarOptions;
const defaultOptions = {
    device: 'design',
    rotate: false,
    debugMode: 'WARN',
    showFps: true,
};
const deviceIds = new Set([
    'design',
    'webpage-fullscreen',
    'iphone-14-pro',
    'iphone-14-plus',
    'iphone-14',
    'iphone-x',
    'iphone-xr',
    'ipad-10-2',
    'ipad-air',
    'ipad-pro',
    'oppo-reno-2',
    'huawei-nova-5',
    'honor-x8',
    'huawei-nova-8i',
    'huawei-mate-40-pro',
    'huawei-mate-30-pro',
    'xiaomi-redmi-8',
    'sony-xperia-5',
    'oppo-a77',
    'nokia-c2',
    'asus-rog-phone-6',
    'lenovo-legion-2-pro',
]);
const debugModes = new Set([
    'NONE',
    'VERBOSE',
    'INFO',
    'WARN',
    'ERROR',
    'INFO_FOR_WEB_PAGE',
    'WARN_FOR_WEB_PAGE',
    'ERROR_FOR_WEB_PAGE',
]);
let options = { ...defaultOptions };
function getPreviewToolbarOptions() {
    return { ...options };
}
function setPreviewToolbarOption(name, value) {
    switch (name) {
        case 'device':
            if (typeof value === 'string' && deviceIds.has(value)) {
                options.device = value;
                return true;
            }
            return false;
        case 'rotate':
            if (typeof value === 'boolean') {
                options.rotate = value;
                return true;
            }
            return false;
        case 'debugMode':
            if (typeof value === 'string' && debugModes.has(value)) {
                options.debugMode = value;
                return true;
            }
            return false;
        case 'showFps':
            if (typeof value === 'boolean') {
                options.showFps = value;
                return true;
            }
            return false;
        default:
            return false;
    }
}
/** @internal Test-only reset for this process-scoped preview session state. */
function resetPreviewToolbarOptions() {
    options = { ...defaultOptions };
}
