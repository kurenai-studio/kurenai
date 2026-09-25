'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToDbUrlIfAssetDBPath = pathToDbUrlIfAssetDBPath;
const path_1 = require("path");
const PathUtils = __importStar(require("../base/utils/path"));
function isAbsolutePath(value) {
    return (0, path_1.isAbsolute)(value) || path_1.win32.isAbsolute(value) || path_1.posix.isAbsolute(value);
}
function normalizeForUrl(value) {
    return PathUtils.normalize(value).replace(/\\/g, '/').replace(/\/+$/, '');
}
function normalizeForCompare(value) {
    const normalized = normalizeForUrl(value);
    return process.platform === 'win32' || /^[a-zA-Z]:\//.test(normalized)
        ? normalized.toLowerCase()
        : normalized;
}
function containsPath(root, candidate) {
    const normalizedRoot = normalizeForCompare(root);
    const normalizedCandidate = normalizeForCompare(candidate);
    return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}
function relativeInsideRoot(root, candidate) {
    const normalizedRoot = normalizeForUrl(root);
    const normalizedCandidate = normalizeForUrl(candidate);
    return normalizedCandidate === normalizedRoot ? '' : normalizedCandidate.slice(normalizedRoot.length + 1);
}
function pathToDbUrlIfAssetDBPath(pathOrUrlOrUUID, assetDBInfo) {
    if (!pathOrUrlOrUUID || pathOrUrlOrUUID.startsWith('db://')) {
        return pathOrUrlOrUUID;
    }
    if (!isAbsolutePath(pathOrUrlOrUUID)) {
        const normalizedRelativePath = pathOrUrlOrUUID
            .replace(/\\/g, '/')
            .replace(/^\.\/+/, '')
            .replace(/\/+$/, '');
        const [dbName, ...relativeParts] = normalizedRelativePath.split('/').filter(Boolean);
        const dbInfo = dbName && (assetDBInfo[dbName] ?? Object.values(assetDBInfo).find((info) => info.name === dbName));
        if (dbInfo) {
            return relativeParts.length ? `db://${dbInfo.name}/${relativeParts.join('/')}` : `db://${dbInfo.name}`;
        }
        return pathOrUrlOrUUID;
    }
    const matchedDBInfo = Object.values(assetDBInfo)
        .filter((info) => info?.target && containsPath(info.target, pathOrUrlOrUUID))
        .sort((a, b) => normalizeForCompare(b.target).length - normalizeForCompare(a.target).length)[0];
    if (!matchedDBInfo) {
        return pathOrUrlOrUUID;
    }
    const relativePath = relativeInsideRoot(matchedDBInfo.target, pathOrUrlOrUUID);
    return relativePath ? `db://${matchedDBInfo.name}/${relativePath}` : `db://${matchedDBInfo.name}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtZGItdXJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWRiLXVybC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUNiLDREQStCQztBQXBFRCwrQkFBZ0Q7QUFDaEQsOERBQWdEO0FBT2hELFNBQVMsY0FBYyxDQUFDLEtBQWE7SUFDakMsT0FBTyxJQUFBLGlCQUFVLEVBQUMsS0FBSyxDQUFDLElBQUksWUFBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxZQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFhO0lBQ2xDLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDOUUsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsS0FBYTtJQUN0QyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNsRSxDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRTtRQUMxQixDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ3JCLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFZLEVBQUUsU0FBaUI7SUFDakQsTUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakQsTUFBTSxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUzRCxPQUFPLG1CQUFtQixLQUFLLGNBQWMsSUFBSSxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQzFHLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLElBQVksRUFBRSxTQUFpQjtJQUN2RCxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0MsTUFBTSxtQkFBbUIsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFdkQsT0FBTyxtQkFBbUIsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUcsQ0FBQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLGVBQXVCLEVBQUUsV0FBNEM7SUFDMUcsSUFBSSxDQUFDLGVBQWUsSUFBSSxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDMUQsT0FBTyxlQUFlLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztRQUNuQyxNQUFNLHNCQUFzQixHQUFHLGVBQWU7YUFDekMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7YUFDbkIsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7YUFDckIsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QixNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsYUFBYSxDQUFDLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQztRQUVsSCxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1QsT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLE1BQU0sQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzRyxDQUFDO1FBRUQsT0FBTyxlQUFlLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1NBQzNDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztTQUM1RSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDakIsT0FBTyxlQUFlLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFL0UsT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsYUFBYSxDQUFDLElBQUksSUFBSSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgaXNBYnNvbHV0ZSwgcG9zaXgsIHdpbjMyIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBQYXRoVXRpbHMgZnJvbSAnLi4vYmFzZS91dGlscy9wYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBBc3NldERCUGF0aEluZm8ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB0YXJnZXQ6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gaXNBYnNvbHV0ZVBhdGgodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0Fic29sdXRlKHZhbHVlKSB8fCB3aW4zMi5pc0Fic29sdXRlKHZhbHVlKSB8fCBwb3NpeC5pc0Fic29sdXRlKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRm9yVXJsKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBQYXRoVXRpbHMubm9ybWFsaXplKHZhbHVlKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZvckNvbXBhcmUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUZvclVybCh2YWx1ZSk7XG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgfHwgL15bYS16QS1aXTpcXC8vLnRlc3Qobm9ybWFsaXplZClcbiAgICAgICAgPyBub3JtYWxpemVkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgOiBub3JtYWxpemVkO1xufVxuXG5mdW5jdGlvbiBjb250YWluc1BhdGgocm9vdDogc3RyaW5nLCBjYW5kaWRhdGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRSb290ID0gbm9ybWFsaXplRm9yQ29tcGFyZShyb290KTtcbiAgICBjb25zdCBub3JtYWxpemVkQ2FuZGlkYXRlID0gbm9ybWFsaXplRm9yQ29tcGFyZShjYW5kaWRhdGUpO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRDYW5kaWRhdGUgPT09IG5vcm1hbGl6ZWRSb290IHx8IG5vcm1hbGl6ZWRDYW5kaWRhdGUuc3RhcnRzV2l0aChgJHtub3JtYWxpemVkUm9vdH0vYCk7XG59XG5cbmZ1bmN0aW9uIHJlbGF0aXZlSW5zaWRlUm9vdChyb290OiBzdHJpbmcsIGNhbmRpZGF0ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3JtYWxpemVkUm9vdCA9IG5vcm1hbGl6ZUZvclVybChyb290KTtcbiAgICBjb25zdCBub3JtYWxpemVkQ2FuZGlkYXRlID0gbm9ybWFsaXplRm9yVXJsKGNhbmRpZGF0ZSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZENhbmRpZGF0ZSA9PT0gbm9ybWFsaXplZFJvb3QgPyAnJyA6IG5vcm1hbGl6ZWRDYW5kaWRhdGUuc2xpY2Uobm9ybWFsaXplZFJvb3QubGVuZ3RoICsgMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoVG9EYlVybElmQXNzZXREQlBhdGgocGF0aE9yVXJsT3JVVUlEOiBzdHJpbmcsIGFzc2V0REJJbmZvOiBSZWNvcmQ8c3RyaW5nLCBBc3NldERCUGF0aEluZm8+KSB7XG4gICAgaWYgKCFwYXRoT3JVcmxPclVVSUQgfHwgcGF0aE9yVXJsT3JVVUlELnN0YXJ0c1dpdGgoJ2RiOi8vJykpIHtcbiAgICAgICAgcmV0dXJuIHBhdGhPclVybE9yVVVJRDtcbiAgICB9XG5cbiAgICBpZiAoIWlzQWJzb2x1dGVQYXRoKHBhdGhPclVybE9yVVVJRCkpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJlbGF0aXZlUGF0aCA9IHBhdGhPclVybE9yVVVJRFxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFwvZywgJy8nKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15cXC5cXC8rLywgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG4gICAgICAgIGNvbnN0IFtkYk5hbWUsIC4uLnJlbGF0aXZlUGFydHNdID0gbm9ybWFsaXplZFJlbGF0aXZlUGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgY29uc3QgZGJJbmZvID0gZGJOYW1lICYmIChhc3NldERCSW5mb1tkYk5hbWVdID8/IE9iamVjdC52YWx1ZXMoYXNzZXREQkluZm8pLmZpbmQoKGluZm8pID0+IGluZm8ubmFtZSA9PT0gZGJOYW1lKSk7XG5cbiAgICAgICAgaWYgKGRiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIHJlbGF0aXZlUGFydHMubGVuZ3RoID8gYGRiOi8vJHtkYkluZm8ubmFtZX0vJHtyZWxhdGl2ZVBhcnRzLmpvaW4oJy8nKX1gIDogYGRiOi8vJHtkYkluZm8ubmFtZX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhdGhPclVybE9yVVVJRDtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVkREJJbmZvID0gT2JqZWN0LnZhbHVlcyhhc3NldERCSW5mbylcbiAgICAgICAgLmZpbHRlcigoaW5mbykgPT4gaW5mbz8udGFyZ2V0ICYmIGNvbnRhaW5zUGF0aChpbmZvLnRhcmdldCwgcGF0aE9yVXJsT3JVVUlEKSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IG5vcm1hbGl6ZUZvckNvbXBhcmUoYi50YXJnZXQpLmxlbmd0aCAtIG5vcm1hbGl6ZUZvckNvbXBhcmUoYS50YXJnZXQpLmxlbmd0aClbMF07XG5cbiAgICBpZiAoIW1hdGNoZWREQkluZm8pIHtcbiAgICAgICAgcmV0dXJuIHBhdGhPclVybE9yVVVJRDtcbiAgICB9XG5cbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZUluc2lkZVJvb3QobWF0Y2hlZERCSW5mby50YXJnZXQsIHBhdGhPclVybE9yVVVJRCk7XG5cbiAgICByZXR1cm4gcmVsYXRpdmVQYXRoID8gYGRiOi8vJHttYXRjaGVkREJJbmZvLm5hbWV9LyR7cmVsYXRpdmVQYXRofWAgOiBgZGI6Ly8ke21hdGNoZWREQkluZm8ubmFtZX1gO1xufVxuIl19