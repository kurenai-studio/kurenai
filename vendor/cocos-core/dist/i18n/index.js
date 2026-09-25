"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 加载指定语言下的所有 JSON 文件并合并为扁平结构
function loadLanguageResources(language) {
    const localesDir = path_1.default.join(__dirname, '../../static/i18n', language);
    const resources = {};
    try {
        if (fs_1.default.existsSync(localesDir)) {
            const files = fs_1.default.readdirSync(localesDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            for (const file of jsonFiles) {
                const filePath = path_1.default.join(localesDir, file);
                const data = fs_1.default.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                // 将文件名（去掉.json）作为前缀，合并到扁平结构中
                const namespace = file.replace('.json', '');
                // 递归合并对象，添加命名空间前缀
                function mergeWithPrefix(obj, prefix) {
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            const newKey = prefix ? `${prefix}.${key}` : key;
                            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                                mergeWithPrefix(obj[key], newKey);
                            }
                            else {
                                resources[newKey] = obj[key];
                            }
                        }
                    }
                }
                mergeWithPrefix(parsed, namespace);
            }
        }
    }
    catch (error) {
        console.error(`Load language resources failed (${language}):`, error);
    }
    return resources;
}
// 纯 Node.js 初始化
i18next_1.default.init({
    // 基础配置
    // 默认英文;目标语言由宿主 (如 PinK) 通过 lib/i18n 入口调用 setLanguage 驱动。
    lng: 'en',
    fallbackLng: 'en',
    // 资源数据 - 扁平结构，不使用命名空间
    resources: {
        en: {
            translation: loadLanguageResources('en')
        },
        zh: {
            translation: loadLanguageResources('zh')
        }
    },
    // 调试
    debug: process.env.NODE_ENV === 'development',
    // 插值配置 - 支持 {key} 格式（兼容旧版本）
    interpolation: {
        format: function (value, _format, _lng) {
            return value;
        },
        escapeValue: false, // React 已经做了转义
        formatSeparator: ',',
        unescapeSuffix: '',
        unescapePrefix: '',
        prefix: '{',
        suffix: '}'
    }
}, (err) => {
    if (err) {
        console.error('i18n 初始化失败:', err);
    }
});
exports.default = i18next_1.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaTE4bi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHNEQUEyQjtBQUMzQiw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLDZCQUE2QjtBQUM3QixTQUFTLHFCQUFxQixDQUFDLFFBQWdCO0lBQzNDLE1BQU0sVUFBVSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZFLE1BQU0sU0FBUyxHQUF3QixFQUFFLENBQUM7SUFFMUMsSUFBSSxDQUFDO1FBQ0QsSUFBSSxZQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDNUIsTUFBTSxLQUFLLEdBQUcsWUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN6QyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRS9ELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLElBQUksR0FBRyxZQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFaEMsNkJBQTZCO2dCQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFFNUMsa0JBQWtCO2dCQUNsQixTQUFTLGVBQWUsQ0FBQyxHQUFRLEVBQUUsTUFBYztvQkFDN0MsS0FBSyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDcEIsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ2pELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQzs0QkFDakQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQ0FDaEYsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDdEMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNKLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ2pDLENBQUM7d0JBQ0wsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7Z0JBRUQsZUFBZSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsUUFBUSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxnQkFBZ0I7QUFDaEIsaUJBQUksQ0FBQyxJQUFJLENBQUM7SUFDTixPQUFPO0lBQ1AseURBQXlEO0lBQ3pELEdBQUcsRUFBRSxJQUFJO0lBQ1QsV0FBVyxFQUFFLElBQUk7SUFFakIsc0JBQXNCO0lBQ3RCLFNBQVMsRUFBRTtRQUNQLEVBQUUsRUFBRTtZQUNBLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7U0FDM0M7UUFDRCxFQUFFLEVBQUU7WUFDQSxXQUFXLEVBQUUscUJBQXFCLENBQUMsSUFBSSxDQUFDO1NBQzNDO0tBQ0o7SUFFRCxLQUFLO0lBQ0wsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLGFBQWE7SUFFN0MsNEJBQTRCO0lBQzVCLGFBQWEsRUFBRTtRQUNYLE1BQU0sRUFBRSxVQUFVLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSTtZQUNsQyxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBQ0QsV0FBVyxFQUFFLEtBQUssRUFBRSxlQUFlO1FBQ25DLGVBQWUsRUFBRSxHQUFHO1FBQ3BCLGNBQWMsRUFBRSxFQUFFO1FBQ2xCLGNBQWMsRUFBRSxFQUFFO1FBQ2xCLE1BQU0sRUFBRSxHQUFHO1FBQ1gsTUFBTSxFQUFFLEdBQUc7S0FDZDtDQUVKLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNQLElBQUksR0FBRyxFQUFFLENBQUM7UUFDTixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxrQkFBZSxpQkFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGkxOG4gZnJvbSAnaTE4bmV4dCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIOWKoOi9veaMh+WumuivreiogOS4i+eahOaJgOaciSBKU09OIOaWh+S7tuW5tuWQiOW5tuS4uuaJgeW5s+e7k+aehFxuZnVuY3Rpb24gbG9hZExhbmd1YWdlUmVzb3VyY2VzKGxhbmd1YWdlOiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICBjb25zdCBsb2NhbGVzRGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9pMThuJywgbGFuZ3VhZ2UpO1xuICAgIGNvbnN0IHJlc291cmNlczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobG9jYWxlc0RpcikpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMobG9jYWxlc0Rpcik7XG4gICAgICAgICAgICBjb25zdCBqc29uRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKCcuanNvbicpKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGpzb25GaWxlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGxvY2FsZXNEaXIsIGZpbGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShkYXRhKTtcblxuICAgICAgICAgICAgICAgIC8vIOWwhuaWh+S7tuWQje+8iOWOu+aOiS5qc29u77yJ5L2c5Li65YmN57yA77yM5ZCI5bm25Yiw5omB5bmz57uT5p6E5LitXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gZmlsZS5yZXBsYWNlKCcuanNvbicsICcnKTtcblxuICAgICAgICAgICAgICAgIC8vIOmAkuW9kuWQiOW5tuWvueixoe+8jOa3u+WKoOWRveWQjeepuumXtOWJjee8gFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1lcmdlV2l0aFByZWZpeChvYmo6IGFueSwgcHJlZml4OiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0tleSA9IHByZWZpeCA/IGAke3ByZWZpeH0uJHtrZXl9YCA6IGtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9ialtrZXldID09PSAnb2JqZWN0JyAmJiBvYmpba2V5XSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheShvYmpba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VXaXRoUHJlZml4KG9ialtrZXldLCBuZXdLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlc1tuZXdLZXldID0gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWVyZ2VXaXRoUHJlZml4KHBhcnNlZCwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYExvYWQgbGFuZ3VhZ2UgcmVzb3VyY2VzIGZhaWxlZCAoJHtsYW5ndWFnZX0pOmAsIGVycm9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzb3VyY2VzO1xufVxuXG4vLyDnuq8gTm9kZS5qcyDliJ3lp4vljJZcbmkxOG4uaW5pdCh7XG4gICAgLy8g5Z+656GA6YWN572uXG4gICAgLy8g6buY6K6k6Iux5paHO+ebruagh+ivreiogOeUseWuv+S4uyAo5aaCIFBpbkspIOmAmui/hyBsaWIvaTE4biDlhaXlj6PosIPnlKggc2V0TGFuZ3VhZ2Ug6amx5Yqo44CCXG4gICAgbG5nOiAnZW4nLFxuICAgIGZhbGxiYWNrTG5nOiAnZW4nLFxuXG4gICAgLy8g6LWE5rqQ5pWw5o2uIC0g5omB5bmz57uT5p6E77yM5LiN5L2/55So5ZG95ZCN56m66Ze0XG4gICAgcmVzb3VyY2VzOiB7XG4gICAgICAgIGVuOiB7XG4gICAgICAgICAgICB0cmFuc2xhdGlvbjogbG9hZExhbmd1YWdlUmVzb3VyY2VzKCdlbicpXG4gICAgICAgIH0sXG4gICAgICAgIHpoOiB7XG4gICAgICAgICAgICB0cmFuc2xhdGlvbjogbG9hZExhbmd1YWdlUmVzb3VyY2VzKCd6aCcpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g6LCD6K+VXG4gICAgZGVidWc6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxuXG4gICAgLy8g5o+S5YC86YWN572uIC0g5pSv5oyBIHtrZXl9IOagvOW8j++8iOWFvOWuueaXp+eJiOacrO+8iVxuICAgIGludGVycG9sYXRpb246IHtcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAodmFsdWUsIF9mb3JtYXQsIF9sbmcpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZXNjYXBlVmFsdWU6IGZhbHNlLCAvLyBSZWFjdCDlt7Lnu4/lgZrkuobovazkuYlcbiAgICAgICAgZm9ybWF0U2VwYXJhdG9yOiAnLCcsXG4gICAgICAgIHVuZXNjYXBlU3VmZml4OiAnJyxcbiAgICAgICAgdW5lc2NhcGVQcmVmaXg6ICcnLFxuICAgICAgICBwcmVmaXg6ICd7JyxcbiAgICAgICAgc3VmZml4OiAnfSdcbiAgICB9XG5cbn0sIChlcnIpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2kxOG4g5Yid5aeL5YyW5aSx6LSlOicsIGVycik7XG4gICAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGkxOG47Il19