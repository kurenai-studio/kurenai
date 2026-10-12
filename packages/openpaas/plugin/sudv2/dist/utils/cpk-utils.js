"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsZip = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
exports.JsZip = require('jszip');
/**
 * 把文件夹添加到压缩包
 * @param srcPath 文件夹路径
 * @param dirName 文件夹名称
 */
exports.JsZip.prototype.directory = function (srcPath, dirName) {
    let stat = (0, fs_extra_1.statSync)(srcPath);
    if (!stat.isDirectory()) {
        console.error(`{link(${srcPath})} is not a folder!`);
        return;
    }
    let list = (0, fs_extra_1.readdirSync)(srcPath);
    list.forEach(function (name) {
        // @ts-ignore
        let zip = this.zip;
        // @ts-ignore
        let filePath = (0, path_1.join)(this.srcPath, name);
        let stat = (0, fs_extra_1.statSync)(filePath);
        if (stat.isDirectory()) {
            zip.directory(filePath, name);
        }
        else if (stat.isFile()) {
            zip.file(name, (0, fs_extra_1.readFileSync)(filePath));
        }
        else {
            console.error(`{link(${filePath})} was not added to zip!`);
        }
    }.bind({
        srcPath: srcPath,
        zip: this.folder(dirName),
    }));
};
/**
 *  把文件添加到压缩包
 * @param srcPath       文件路径
 * @param relativePath 压缩包中的相对路径
 */
exports.JsZip.prototype.append = function (srcPath, relativePath) {
    let stat = (0, fs_extra_1.statSync)(srcPath);
    if (!stat.isFile()) {
        console.error(srcPath + " is not a file!");
        return;
    }
    this.file(relativePath, (0, fs_extra_1.readFileSync)(srcPath));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3BrLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2Nway11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBNEI7QUFDNUIsdUNBQStEO0FBR2xELFFBQUEsS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUV0Qzs7OztHQUlHO0FBQ0gsYUFBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxPQUFlLEVBQUUsT0FBZTtJQUNsRSxJQUFJLElBQUksR0FBRyxJQUFBLG1CQUFRLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxPQUFPLHFCQUFxQixDQUFDLENBQUM7UUFDckQsT0FBTztJQUNYLENBQUM7SUFFRCxJQUFJLElBQUksR0FBRyxJQUFBLHNCQUFXLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQVk7UUFDL0IsYUFBYTtRQUNiLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsYUFBYTtRQUNiLElBQUksUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEMsSUFBSSxJQUFJLEdBQUcsSUFBQSxtQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFDckIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFDdkIsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBQSx1QkFBWSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsUUFBUSwwQkFBMEIsQ0FBQyxDQUFDO1FBQy9ELENBQUM7SUFDTCxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ0gsT0FBTyxFQUFFLE9BQU87UUFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO0tBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDO0FBRUY7Ozs7R0FJRztBQUNILGFBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsT0FBZSxFQUFFLFlBQW9CO0lBQ3BFLElBQUksSUFBSSxHQUFHLElBQUEsbUJBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFDakIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztRQUMzQyxPQUFPO0lBQ1gsQ0FBQztJQUNELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUEsdUJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgc3RhdFN5bmMsIHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tIFwiZnMtZXh0cmFcIjtcblxuXG5leHBvcnQgY29uc3QgSnNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xuXG4vKipcbiAqIOaKiuaWh+S7tuWkuea3u+WKoOWIsOWOi+e8qeWMhVxuICogQHBhcmFtIHNyY1BhdGgg5paH5Lu25aS56Lev5b6EXG4gKiBAcGFyYW0gZGlyTmFtZSDmlofku7blpLnlkI3np7BcbiAqL1xuSnNaaXAucHJvdG90eXBlLmRpcmVjdG9yeSA9IGZ1bmN0aW9uIChzcmNQYXRoOiBzdHJpbmcsIGRpck5hbWU6IHN0cmluZykge1xuICAgIGxldCBzdGF0ID0gc3RhdFN5bmMoc3JjUGF0aCk7XG4gICAgaWYgKCFzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihge2xpbmsoJHtzcmNQYXRofSl9IGlzIG5vdCBhIGZvbGRlciFgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBsaXN0ID0gcmVhZGRpclN5bmMoc3JjUGF0aCk7XG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBsZXQgemlwID0gdGhpcy56aXA7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgbGV0IGZpbGVQYXRoID0gam9pbih0aGlzLnNyY1BhdGgsIG5hbWUpO1xuICAgICAgICBsZXQgc3RhdCA9IHN0YXRTeW5jKGZpbGVQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICB6aXAuZGlyZWN0b3J5KGZpbGVQYXRoLCBuYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0LmlzRmlsZSgpKSB7XG4gICAgICAgICAgICB6aXAuZmlsZShuYW1lLCByZWFkRmlsZVN5bmMoZmlsZVBhdGgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHtsaW5rKCR7ZmlsZVBhdGh9KX0gd2FzIG5vdCBhZGRlZCB0byB6aXAhYCk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQoe1xuICAgICAgICBzcmNQYXRoOiBzcmNQYXRoLFxuICAgICAgICB6aXA6IHRoaXMuZm9sZGVyKGRpck5hbWUpLFxuICAgIH0pKTtcbn07XG5cbi8qKlxuICogIOaKiuaWh+S7tua3u+WKoOWIsOWOi+e8qeWMhVxuICogQHBhcmFtIHNyY1BhdGggICAgICAg5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gcmVsYXRpdmVQYXRoIOWOi+e8qeWMheS4reeahOebuOWvuei3r+W+hFxuICovXG5Kc1ppcC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gKHNyY1BhdGg6IHN0cmluZywgcmVsYXRpdmVQYXRoOiBzdHJpbmcpIHtcbiAgICBsZXQgc3RhdCA9IHN0YXRTeW5jKHNyY1BhdGgpO1xuICAgIGlmICghc3RhdC5pc0ZpbGUoKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKHNyY1BhdGggKyBcIiBpcyBub3QgYSBmaWxlIVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmZpbGUocmVsYXRpdmVQYXRoLCByZWFkRmlsZVN5bmMoc3JjUGF0aCkpO1xufTtcbiJdfQ==