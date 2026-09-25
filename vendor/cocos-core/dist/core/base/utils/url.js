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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYmFzZS91dGlscy91cmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSw4QkFLQztBQWRELE1BQU0sSUFBSSxHQUFHO0lBQ1QsTUFBTSxFQUFFLDJDQUEyQztJQUNuRCxHQUFHLEVBQUUsd0NBQXdDO0NBQ2hELENBQUM7QUFDRjs7OztHQUlHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLFdBQW1CLEVBQUUsT0FBeUIsUUFBUTtJQUM1RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDZixPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuY29uc3QgdXJscyA9IHtcbiAgICBtYW51YWw6ICdodHRwczovL2RvY3MuY29jb3MuY29tL2NyZWF0b3IvbWFudWFsL3poLycsXG4gICAgYXBpOiAnaHR0cHM6Ly9kb2NzLmNvY29zLmNvbS9jcmVhdG9yL2FwaS96aC8nXG59O1xuLyoqXG4gKiDlv6vmjbfojrflj5bmlofmoaPot6/lvoRcbiAqIEBwYXJhbSByZWxhdGl2ZVVybCBcbiAqIEBwYXJhbSB0eXBlIFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9jVXJsKHJlbGF0aXZlVXJsOiBzdHJpbmcsIHR5cGU6ICdtYW51YWwnIHwgJ2FwaScgPSAnbWFudWFsJyk6IHN0cmluZyB7XG4gICAgaWYgKCFyZWxhdGl2ZVVybCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVVJMKHJlbGF0aXZlVXJsLCB1cmxzW3R5cGVdKS5ocmVmO1xufVxuIl19