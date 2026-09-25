"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressDirs = compressDirs;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const jszip_1 = __importDefault(require("jszip"));
const global_1 = require("../../../share/global");
async function compressDirs(dirnames, basepath, outputPath) {
    await new Promise(resolve => {
        const jsZip = new jszip_1.default();
        const filesToCompress = [];
        const dir = (0, path_1.parse)(global_1.BuildGlobalInfo.BUNDLE_ZIP_NAME).name;
        dirnames.forEach(dirname => {
            getFilesInDirectory(filesToCompress, dirname);
        });
        // https://stackoverflow.com/questions/57175871/how-to-make-jszip-generate-same-buffer/57177371#57177371?newreg=b690df5d033d4576bb3be28f6bb010ab
        // https://adoyle.me/blog/why-zip-file-checksum-changed.html
        const options = {
            date: new Date('2021.06.21 06:00:00Z'),
            createFolders: false,
        };
        filesToCompress.forEach(filepath => {
            const relativePath = (0, path_1.relative)(basepath, filepath);
            let targetPath = (0, path_1.join)(dir, relativePath);
            targetPath = targetPath.replace(/\\/g, '/');
            jsZip.file(targetPath, (0, fs_extra_1.readFileSync)(filepath), options);
        });
        jsZip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9,
            },
        }).then((content) => {
            (0, fs_extra_1.writeFileSync)(outputPath, content);
            dirnames.forEach((dirname) => {
                (0, fs_extra_1.removeSync)(dirname);
            });
            resolve();
        });
    });
}
function getFilesInDirectory(output, dirname) {
    const dirlist = (0, fs_extra_1.readdirSync)(dirname);
    dirlist.forEach(item => {
        const absolutePath = (0, path_1.join)(dirname, item);
        const statInfo = (0, fs_extra_1.statSync)(absolutePath);
        if (statInfo.isDirectory()) {
            getFilesInDirectory(output, absolutePath);
        }
        else {
            output.push(absolutePath);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci91dGlscy96aXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFJQSxvQ0FrQ0M7QUF0Q0QsdUNBQTBGO0FBQzFGLCtCQUE2QztBQUM3QyxrREFBMEI7QUFDMUIsa0RBQXdEO0FBQ2pELEtBQUssVUFBVSxZQUFZLENBQUMsUUFBa0IsRUFBRSxRQUFnQixFQUFFLFVBQWtCO0lBQ3ZGLE1BQU0sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUU7UUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFLLEVBQUUsQ0FBQztRQUMxQixNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7UUFDckMsTUFBTSxHQUFHLEdBQUcsSUFBQSxZQUFLLEVBQUMsd0JBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDeEQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN2QixtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFDSCxnSkFBZ0o7UUFDaEosNERBQTREO1FBQzVELE1BQU0sT0FBTyxHQUFHO1lBQ1osSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDO1lBQ3RDLGFBQWEsRUFBRSxLQUFLO1NBQ3ZCLENBQUM7UUFDRixlQUFlLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sWUFBWSxHQUFHLElBQUEsZUFBUSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDekMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUEsdUJBQVksRUFBQyxRQUFRLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDaEIsSUFBSSxFQUFFLFlBQVk7WUFDbEIsV0FBVyxFQUFFLFNBQVM7WUFDdEIsa0JBQWtCLEVBQUU7Z0JBQ2hCLEtBQUssRUFBRSxDQUFDO2FBQ1g7U0FDSixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUU7WUFDckIsSUFBQSx3QkFBYSxFQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3pCLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLE1BQWdCLEVBQUUsT0FBZTtJQUMxRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHNCQUFXLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDckMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQixNQUFNLFlBQVksR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsTUFBTSxRQUFRLEdBQUcsSUFBQSxtQkFBUSxFQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hDLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFDekIsbUJBQW1CLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzlDLENBQUM7YUFDSSxDQUFDO1lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM5QixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCByZW1vdmVTeW5jLCByZWFkZGlyU3luYywgc3RhdFN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyByZWxhdGl2ZSwgam9pbiwgcGFyc2UgfSBmcm9tICdwYXRoJztcbmltcG9ydCBKc1ppcCBmcm9tICdqc3ppcCc7XG5pbXBvcnQgeyBCdWlsZEdsb2JhbEluZm8gfSBmcm9tICcuLi8uLi8uLi9zaGFyZS9nbG9iYWwnO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzRGlycyhkaXJuYW1lczogc3RyaW5nW10sIGJhc2VwYXRoOiBzdHJpbmcsIG91dHB1dFBhdGg6IHN0cmluZykge1xuICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBqc1ppcCA9IG5ldyBKc1ppcCgpO1xuICAgICAgICBjb25zdCBmaWxlc1RvQ29tcHJlc3M6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGRpciA9IHBhcnNlKEJ1aWxkR2xvYmFsSW5mby5CVU5ETEVfWklQX05BTUUpLm5hbWU7XG4gICAgICAgIGRpcm5hbWVzLmZvckVhY2goZGlybmFtZSA9PiB7XG4gICAgICAgICAgICBnZXRGaWxlc0luRGlyZWN0b3J5KGZpbGVzVG9Db21wcmVzcywgZGlybmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NzE3NTg3MS9ob3ctdG8tbWFrZS1qc3ppcC1nZW5lcmF0ZS1zYW1lLWJ1ZmZlci81NzE3NzM3MSM1NzE3NzM3MT9uZXdyZWc9YjY5MGRmNWQwMzNkNDU3NmJiM2JlMjhmNmJiMDEwYWJcbiAgICAgICAgLy8gaHR0cHM6Ly9hZG95bGUubWUvYmxvZy93aHktemlwLWZpbGUtY2hlY2tzdW0tY2hhbmdlZC5odG1sXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyMS4wNi4yMSAwNjowMDowMFonKSxcbiAgICAgICAgICAgIGNyZWF0ZUZvbGRlcnM6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgICBmaWxlc1RvQ29tcHJlc3MuZm9yRWFjaChmaWxlcGF0aCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlcGF0aCwgZmlsZXBhdGgpO1xuICAgICAgICAgICAgbGV0IHRhcmdldFBhdGggPSBqb2luKGRpciwgcmVsYXRpdmVQYXRoKTtcbiAgICAgICAgICAgIHRhcmdldFBhdGggPSB0YXJnZXRQYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgICAgIGpzWmlwLmZpbGUodGFyZ2V0UGF0aCwgcmVhZEZpbGVTeW5jKGZpbGVwYXRoKSwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgICAgICBqc1ppcC5nZW5lcmF0ZUFzeW5jKHtcbiAgICAgICAgICAgIHR5cGU6ICdub2RlYnVmZmVyJyxcbiAgICAgICAgICAgIGNvbXByZXNzaW9uOiAnREVGTEFURScsXG4gICAgICAgICAgICBjb21wcmVzc2lvbk9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBsZXZlbDogOSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLnRoZW4oKGNvbnRlbnQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgd3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50KTtcbiAgICAgICAgICAgIGRpcm5hbWVzLmZvckVhY2goKGRpcm5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICByZW1vdmVTeW5jKGRpcm5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlc0luRGlyZWN0b3J5KG91dHB1dDogc3RyaW5nW10sIGRpcm5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGRpcmxpc3QgPSByZWFkZGlyU3luYyhkaXJuYW1lKTtcbiAgICBkaXJsaXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IGpvaW4oZGlybmFtZSwgaXRlbSk7XG4gICAgICAgIGNvbnN0IHN0YXRJbmZvID0gc3RhdFN5bmMoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgaWYgKHN0YXRJbmZvLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgIGdldEZpbGVzSW5EaXJlY3Rvcnkob3V0cHV0LCBhYnNvbHV0ZVBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSJdfQ==