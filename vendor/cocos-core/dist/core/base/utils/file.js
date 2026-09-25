'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFileNameConflict = void 0;
exports.getName = getName;
exports.trashItem = trashItem;
exports.requireFile = requireFile;
exports.removeCache = removeCache;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
/**
 * 检查文件在指定文件夹中是否存在，如果存在则通过追加数字后缀的方式生成一个唯一的文件名。
 * @param targetFolder 目标文件夹的路径。
 * @param fileName 需要检查存在的文件名。
 * @param isOccupied 返回路径是否已被文件系统或调用方占用。
 * @returns 返回一个唯一的文件名字符串。
 */
const resolveFileNameConflict = (targetFolder, fileName, isOccupied = fs_1.existsSync) => {
    // 如果fileName为空，抛出错误
    if (!fileName)
        throw new Error(`fileName is empty`);
    // 获取文件扩展名
    const fileExt = (0, path_1.extname)(fileName);
    // 获取文件的基础名（不包括扩展名）
    let fileBase = (0, path_1.basename)(fileName, fileExt);
    // 循环检查直到找到一个不存在的文件名
    while (isOccupied((0, path_1.join)(targetFolder, `${fileBase}${fileExt}`))) {
        if ((/(\d+)$/.test(fileBase))) {
            fileBase = fileBase.replace(/^(.+?)(\d+)?$/, ($, $1, $2) => {
                let num;
                if (!$2) {
                    // 如果是纯数字的话 $2 是为 undefined，$1 自增就行
                    let num = parseInt($1, 10);
                    num += 1;
                    return num.toString();
                }
                num = parseInt($2, 10);
                num += 1;
                // 返回更新后的文件名
                return `${$1}${num.toString().padStart($2.length, '0')}`;
            });
        }
        else {
            // 如果原文件名不包含数字后缀，则添加-001作为后缀
            fileBase = `${fileBase}-001`;
        }
    }
    // 返回最终生成的唯一文件名
    return `${fileBase}${fileExt}`;
};
exports.resolveFileNameConflict = resolveFileNameConflict;
/**
 * 初始化一个可用的文件名
 * Initializes a available filename
 * 返回可用名称的文件路径
 * Returns the file path with the available name
 *
 * @param file 初始文件路径 Initial file path
 * @param isOccupied 返回路径是否已被文件系统或调用方占用。
 */
function getName(file, isOccupied = fs_1.existsSync) {
    if (!isOccupied(file)) {
        return file;
    }
    const dir = (0, path_1.dirname)(file);
    const fileName = (0, path_1.basename)(file);
    const newFileName = (0, exports.resolveFileNameConflict)(dir, fileName, isOccupied);
    return (0, path_1.join)(dir, newFileName);
}
async function trashItem(file) {
    // TODO
    // const trash = await import('sudo-trash');
    // return await trash.trash(file);
    await (0, fs_extra_1.remove)(file);
}
function requireFile(file, _options) {
    // TODO
    return require(file);
}
function removeCache(file) {
    delete require.cache[file];
    // TODD
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2Jhc2UvdXRpbHMvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQTBEYiwwQkFVQztBQUVELDhCQUtDO0FBRUQsa0NBR0M7QUFFRCxrQ0FHQztBQW5GRCwyQkFBZ0M7QUFDaEMsdUNBQWtDO0FBQ2xDLCtCQUF3RDtBQUl4RDs7Ozs7O0dBTUc7QUFDSSxNQUFNLHVCQUF1QixHQUFHLENBQUMsWUFBb0IsRUFBRSxRQUFnQixFQUFFLGFBQWlDLGVBQVUsRUFBVSxFQUFFO0lBQ25JLG9CQUFvQjtJQUNwQixJQUFJLENBQUMsUUFBUTtRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUNwRCxVQUFVO0lBQ1YsTUFBTSxPQUFPLEdBQUcsSUFBQSxjQUFPLEVBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEMsbUJBQW1CO0lBQ25CLElBQUksUUFBUSxHQUFHLElBQUEsZUFBUSxFQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUUzQyxvQkFBb0I7SUFDcEIsT0FBTyxVQUFVLENBQUMsSUFBQSxXQUFJLEVBQUMsWUFBWSxFQUFFLEdBQUcsUUFBUSxHQUFHLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzdELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUM1QixRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFTLEVBQUUsRUFBVSxFQUFFLEVBQXNCLEVBQUUsRUFBRTtnQkFDM0YsSUFBSSxHQUFHLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNOLG1DQUFtQztvQkFDbkMsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDM0IsR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDVCxPQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFDRCxHQUFHLEdBQUcsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdkIsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDVCxZQUFZO2dCQUNaLE9BQU8sR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO2FBQU0sQ0FBQztZQUNKLDRCQUE0QjtZQUM1QixRQUFRLEdBQUcsR0FBRyxRQUFRLE1BQU0sQ0FBQztRQUNqQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGVBQWU7SUFDZixPQUFPLEdBQUcsUUFBUSxHQUFHLE9BQU8sRUFBRSxDQUFDO0FBQ25DLENBQUMsQ0FBQztBQWhDVyxRQUFBLHVCQUF1QiwyQkFnQ2xDO0FBRUY7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFnQixPQUFPLENBQUMsSUFBWSxFQUFFLGFBQWlDLGVBQVU7SUFDN0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtCQUF1QixFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdkUsT0FBTyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUVNLEtBQUssVUFBVSxTQUFTLENBQUMsSUFBWTtJQUN4QyxPQUFPO0lBQ1AsNENBQTRDO0lBQzVDLGtDQUFrQztJQUNsQyxNQUFNLElBQUEsaUJBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLElBQVksRUFBRSxRQUEyQjtJQUNqRSxPQUFPO0lBQ1AsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxJQUFZO0lBQ3BDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixPQUFPO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IHJlbW92ZSB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBleHRuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCB0eXBlIEZpbGVPY2N1cGFuY3lDaGVjayA9IChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW47XG5cbi8qKlxuICog5qOA5p+l5paH5Lu25Zyo5oyH5a6a5paH5Lu25aS55Lit5piv5ZCm5a2Y5Zyo77yM5aaC5p6c5a2Y5Zyo5YiZ6YCa6L+H6L+95Yqg5pWw5a2X5ZCO57yA55qE5pa55byP55Sf5oiQ5LiA5Liq5ZSv5LiA55qE5paH5Lu25ZCN44CCXG4gKiBAcGFyYW0gdGFyZ2V0Rm9sZGVyIOebruagh+aWh+S7tuWkueeahOi3r+W+hOOAglxuICogQHBhcmFtIGZpbGVOYW1lIOmcgOimgeajgOafpeWtmOWcqOeahOaWh+S7tuWQjeOAglxuICogQHBhcmFtIGlzT2NjdXBpZWQg6L+U5Zue6Lev5b6E5piv5ZCm5bey6KKr5paH5Lu257O757uf5oiW6LCD55So5pa55Y2g55So44CCXG4gKiBAcmV0dXJucyDov5Tlm57kuIDkuKrllK/kuIDnmoTmlofku7blkI3lrZfnrKbkuLLjgIJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlc29sdmVGaWxlTmFtZUNvbmZsaWN0ID0gKHRhcmdldEZvbGRlcjogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nLCBpc09jY3VwaWVkOiBGaWxlT2NjdXBhbmN5Q2hlY2sgPSBleGlzdHNTeW5jKTogc3RyaW5nID0+IHtcbiAgICAvLyDlpoLmnpxmaWxlTmFtZeS4uuepuu+8jOaKm+WHuumUmeivr1xuICAgIGlmICghZmlsZU5hbWUpIHRocm93IG5ldyBFcnJvcihgZmlsZU5hbWUgaXMgZW1wdHlgKTtcbiAgICAvLyDojrflj5bmlofku7bmianlsZXlkI1cbiAgICBjb25zdCBmaWxlRXh0ID0gZXh0bmFtZShmaWxlTmFtZSk7XG4gICAgLy8g6I635Y+W5paH5Lu255qE5Z+656GA5ZCN77yI5LiN5YyF5ous5omp5bGV5ZCN77yJXG4gICAgbGV0IGZpbGVCYXNlID0gYmFzZW5hbWUoZmlsZU5hbWUsIGZpbGVFeHQpO1xuXG4gICAgLy8g5b6q546v5qOA5p+l55u05Yiw5om+5Yiw5LiA5Liq5LiN5a2Y5Zyo55qE5paH5Lu25ZCNXG4gICAgd2hpbGUgKGlzT2NjdXBpZWQoam9pbih0YXJnZXRGb2xkZXIsIGAke2ZpbGVCYXNlfSR7ZmlsZUV4dH1gKSkpIHtcbiAgICAgICAgaWYgKCgvKFxcZCspJC8udGVzdChmaWxlQmFzZSkpKSB7XG4gICAgICAgICAgICBmaWxlQmFzZSA9IGZpbGVCYXNlLnJlcGxhY2UoL14oLis/KShcXGQrKT8kLywgKCQ6IHN0cmluZywgJDE6IHN0cmluZywgJDI6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBudW07XG4gICAgICAgICAgICAgICAgaWYgKCEkMikge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/nuq/mlbDlrZfnmoTor50gJDIg5piv5Li6IHVuZGVmaW5lZO+8jCQxIOiHquWinuWwseihjFxuICAgICAgICAgICAgICAgICAgICBsZXQgbnVtID0gcGFyc2VJbnQoJDEsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgbnVtICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudW0udG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbnVtID0gcGFyc2VJbnQoJDIsIDEwKTtcbiAgICAgICAgICAgICAgICBudW0gKz0gMTtcbiAgICAgICAgICAgICAgICAvLyDov5Tlm57mm7TmlrDlkI7nmoTmlofku7blkI1cbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7JDF9JHtudW0udG9TdHJpbmcoKS5wYWRTdGFydCgkMi5sZW5ndGgsICcwJyl9YDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5aaC5p6c5Y6f5paH5Lu25ZCN5LiN5YyF5ZCr5pWw5a2X5ZCO57yA77yM5YiZ5re75YqgLTAwMeS9nOS4uuWQjue8gFxuICAgICAgICAgICAgZmlsZUJhc2UgPSBgJHtmaWxlQmFzZX0tMDAxYDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOi/lOWbnuacgOe7iOeUn+aIkOeahOWUr+S4gOaWh+S7tuWQjVxuICAgIHJldHVybiBgJHtmaWxlQmFzZX0ke2ZpbGVFeHR9YDtcbn07XG5cbi8qKlxuICog5Yid5aeL5YyW5LiA5Liq5Y+v55So55qE5paH5Lu25ZCNXG4gKiBJbml0aWFsaXplcyBhIGF2YWlsYWJsZSBmaWxlbmFtZVxuICog6L+U5Zue5Y+v55So5ZCN56ew55qE5paH5Lu26Lev5b6EXG4gKiBSZXR1cm5zIHRoZSBmaWxlIHBhdGggd2l0aCB0aGUgYXZhaWxhYmxlIG5hbWVcbiAqIFxuICogQHBhcmFtIGZpbGUg5Yid5aeL5paH5Lu26Lev5b6EIEluaXRpYWwgZmlsZSBwYXRoXG4gKiBAcGFyYW0gaXNPY2N1cGllZCDov5Tlm57ot6/lvoTmmK/lkKblt7Looqvmlofku7bns7vnu5/miJbosIPnlKjmlrnljaDnlKjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWUoZmlsZTogc3RyaW5nLCBpc09jY3VwaWVkOiBGaWxlT2NjdXBhbmN5Q2hlY2sgPSBleGlzdHNTeW5jKTogc3RyaW5nIHtcbiAgICBpZiAoIWlzT2NjdXBpZWQoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyID0gZGlybmFtZShmaWxlKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGJhc2VuYW1lKGZpbGUpO1xuICAgIGNvbnN0IG5ld0ZpbGVOYW1lID0gcmVzb2x2ZUZpbGVOYW1lQ29uZmxpY3QoZGlyLCBmaWxlTmFtZSwgaXNPY2N1cGllZCk7XG5cbiAgICByZXR1cm4gam9pbihkaXIsIG5ld0ZpbGVOYW1lKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyYXNoSXRlbShmaWxlOiBzdHJpbmcpIHtcbiAgICAvLyBUT0RPXG4gICAgLy8gY29uc3QgdHJhc2ggPSBhd2FpdCBpbXBvcnQoJ3N1ZG8tdHJhc2gnKTtcbiAgICAvLyByZXR1cm4gYXdhaXQgdHJhc2gudHJhc2goZmlsZSk7XG4gICAgYXdhaXQgcmVtb3ZlKGZpbGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZUZpbGUoZmlsZTogc3RyaW5nLCBfb3B0aW9ucz86IHsgcm9vdDogc3RyaW5nIH0pIHtcbiAgICAvLyBUT0RPXG4gICAgcmV0dXJuIHJlcXVpcmUoZmlsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDYWNoZShmaWxlOiBzdHJpbmcpIHtcbiAgICBkZWxldGUgcmVxdWlyZS5jYWNoZVtmaWxlXTtcbiAgICAvLyBUT0REXG59XG4iXX0=