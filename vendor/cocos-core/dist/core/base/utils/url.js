"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocUrl = getDocUrl;
const urls = {
    manual: 'https://docs.cocos.com/creator/manual/zh/',
    api: 'https://docs.cocos.com/creator/api/zh/'
};
/**
 * 快捷获取文档路径
 * @param relativeUrl
 * @param type
 */
function getDocUrl(relativeUrl, type = 'manual') {
    if (!relativeUrl) {
        return '';
    }
    return new URL(relativeUrl, urls[type]).href;
}
